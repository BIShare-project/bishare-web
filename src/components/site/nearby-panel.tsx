"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Copy, Loader2, RadioTower, Send, Upload, WifiOff, X, Download } from "lucide-react";
import { NearbySignaling, type NearbyPeer } from "@/lib/nearby/signaling";
import { getNearbySelf } from "@/lib/nearby/identity";
import { NearbyRTC, type IncomingFile } from "@/lib/nearby/webrtc";
import { formatFileSize } from "@/lib/format";

// Code alphabet omits ambiguous chars (0/O, 1/I) so shared codes are easy to read.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LEN = 6;
// Browsers without the File System Access API buffer the whole file in memory;
// warn the receiver before they accept something too big to hold.
const MEMORY_WARN_BYTES = 512 * 1024 * 1024;

type Mode = "local" | "code";
type Conn = "idle" | "connecting" | "online" | "offline";

interface Incoming {
  from: string;
  name: string;
  size: number;
  received: number;
  status: "prompt" | "receiving" | "done" | "canceled";
  handle: IncomingFile;
}

/** WebRTC is required for browser-to-browser transfer. */
function nearbySupported(): boolean {
  return typeof window !== "undefined" && "RTCPeerConnection" in window;
}

/** File System Access API — lets the receiver stream straight to disk. */
function canStreamToDisk(): boolean {
  return typeof window !== "undefined" && "showSaveFilePicker" in window;
}

function randomCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LEN; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

function normalizeCode(raw: string): string {
  return raw
    .toUpperCase()
    .split("")
    .filter((ch) => CODE_ALPHABET.includes(ch))
    .join("")
    .slice(0, CODE_LEN);
}

/**
 * Production Nearby panel — browser-to-browser file transfer over WebRTC.
 *
 * Two modes:
 *  - "local": peers keyed by public IP (same NAT / Wi-Fi) discover each other
 *    automatically (Snapdrop-style).
 *  - "code": both devices enter a shared 6-char code and join a private room,
 *    so pairing works across networks (guest Wi-Fi, VPN, office subnets).
 *
 * Signaling (presence + SDP/ICE) is relayed through NearbyDO; file bytes go
 * straight peer-to-peer over a DTLS DataChannel and never touch our servers.
 * Flag-gated (web_nearby_enabled) by the parent widget.
 */
export function NearbyPanel({
  onPeerCount,
}: {
  /** Roster size, reported up so the studio can open on this tab when
   *  someone is actually there to receive. */
  onPeerCount?: (n: number) => void;
} = {}) {
  const t = useTranslations("nearby");
  const locale = useLocale();
  const [mode, setMode] = useState<Mode>("local");
  const [code, setCode] = useState(""); // active room code ("" = not joined)
  const [codeDraft, setCodeDraft] = useState("");
  const [conn, setConn] = useState<Conn>("connecting");
  const [peers, setPeers] = useState<NearbyPeer[]>([]);
  const [sending, setSending] = useState<Record<string, number>>({}); // peerId → pct
  const [incoming, setIncoming] = useState<Incoming | null>(null);
  // Per-peer send queue. The transport allows ONE transfer per peer pair at a
  // time (starting a second tears the first down), so a multi-file pick has to
  // be drained one at a time rather than fired in parallel.
  const queues = useRef<Map<string, File[]>>(new Map());
  const [queued, setQueued] = useState<Record<string, { done: number; total: number }>>({});
  const [copied, setCopied] = useState(false);
  const [dropPeer, setDropPeer] = useState<string | null>(null);
  // Files chosen BEFORE a recipient. The cloud tab has always worked this way
  // — drop, then decide — while Nearby forced you to pick a device first,
  // which is backwards from how people think about sending.
  const [staged, setStaged] = useState<File[]>([]);
  const [zoneActive, setZoneActive] = useState(false);
  const stageInput = useRef<HTMLInputElement>(null);
  const rtcRef = useRef<NearbyRTC | null>(null);
  const selfRef = useRef<NearbyPeer | null>(null);
  const targetPeer = useRef<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const supported = nearbySupported();

  // Persisted identity (lib/nearby/identity): alias+emoji stick to this
  // browser across visits, peerId sticks to this tab — so collapsing/expanding
  // Nearby no longer reappears as a brand-new device on everyone else.
  if (!selfRef.current && supported) {
    selfRef.current = getNearbySelf();
  }
  const self = selfRef.current;
  const selfName = self ? `${self.emoji} ${self.alias}` : "";

  useEffect(() => {
    onPeerCount?.(peers.length);
  }, [peers.length, onPeerCount]);

  useEffect(() => {
    if (!supported || !self) return;
    // Code mode with no code yet → show the join form, don't connect.
    if (mode === "code" && !code) {
      setConn("idle");
      setPeers([]);
      return;
    }
    setConn("connecting");
    setPeers([]);

    const sig = new NearbySignaling(self, mode === "code" ? code : undefined)
      .on("open", () => setConn("online"))
      .on("close", () => setConn((c) => (c === "connecting" ? "offline" : c)))
      .on("peers", (p) => setPeers(p))
      .on("peerJoined", (p) =>
        setPeers((cur) => [...cur.filter((x) => x.peerId !== p.peerId), p]),
      )
      .on("peerLeft", (id) => setPeers((cur) => cur.filter((x) => x.peerId !== id)));

    rtcRef.current = new NearbyRTC(sig, {
      onIncoming: (f) =>
        setIncoming({
          from: f.from,
          name: f.name,
          size: f.size,
          received: 0,
          status: "prompt",
          handle: f,
        }),
      onSendProgress: (peerId, sent, total) =>
        // Cap at 99% while sending — 100% ("Sent ✓") is reserved for onSendDone,
        // which fires only once the receiver acks that the file is saved.
        setSending((s) => ({ ...s, [peerId]: Math.min(99, Math.round((sent / total) * 100)) })),
      onSendDone: (peerId) => {
        setSending((s) => ({ ...s, [peerId]: 100 }));
        // Next file for this peer, if the pick had more than one.
        if (pumpRef.current(peerId)) return;
        window.setTimeout(
          () =>
            setSending((s) => {
              const next = { ...s };
              delete next[peerId];
              return next;
            }),
          2500,
        );
      },
      onError: (peerId) => {
        // A failure drops the REST of that peer's queue: silently carrying on
        // would leave the sender thinking everything arrived.
        queues.current.delete(peerId);
        setQueued((q) => {
          const next = { ...q };
          delete next[peerId];
          return next;
        });
        setSending((s) => {
          const next = { ...s };
          delete next[peerId];
          return next;
        });
        setIncoming((cur) =>
          cur && cur.from === peerId ? { ...cur, status: "canceled" } : cur,
        );
      },
    });

    const failTimer = window.setTimeout(
      () => setConn((c) => (c === "connecting" ? "offline" : c)),
      8000,
    );
    sig.connect();

    return () => {
      window.clearTimeout(failTimer);
      rtcRef.current?.closeAll();
      rtcRef.current = null;
      sig.close();
    };
  }, [supported, self, mode, code]);

  // A finished receive is terminal: without this the "Saved ✓" modal has no
  // exit at all (the backdrop deliberately doesn't dismiss, so it trapped the
  // page). Auto-clear shortly after saving — matching the sender's own
  // "Sent ✓" fade — and only if this exact transfer is still on screen, so a
  // new offer arriving meanwhile is never dismissed out from under the user.
  useEffect(() => {
    if (incoming?.status !== "done") return;
    const { from } = incoming;
    const timer = window.setTimeout(
      () =>
        setIncoming((cur) =>
          cur && cur.from === from && cur.status === "done" ? null : cur,
        ),
      2500,
    );
    return () => window.clearTimeout(timer);
  }, [incoming?.status, incoming?.from]);

  const pickFileFor = useCallback((peerId: string) => {
    targetPeer.current = peerId;
    fileInput.current?.click();
  }, []);

  function stageFiles(list: FileList | File[]) {
    const files = Array.from(list);
    if (files.length) setStaged((cur) => [...cur, ...files]);
  }

  /** Send the next queued file for a peer. Returns false when the queue is dry. */
  const pump = useCallback((peerId: string): boolean => {
    const q = queues.current.get(peerId);
    const file = q?.shift();
    if (!file) {
      queues.current.delete(peerId);
      setQueued((cur) => {
        const next = { ...cur };
        delete next[peerId];
        return next;
      });
      return false;
    }
    setQueued((cur) => {
      const prev = cur[peerId];
      return prev ? { ...cur, [peerId]: { ...prev, done: prev.done + 1 } } : cur;
    });
    void rtcRef.current?.sendFile(peerId, file);
    return true;
  }, []);

  // The transport callbacks are created once, before `pump` exists — go through
  // a ref so they always reach the current one.
  const pumpRef = useRef(pump);
  useEffect(() => {
    pumpRef.current = pump;
  }, [pump]);

  const enqueue = useCallback(
    (peerId: string, list: FileList | File[]) => {
      const files = Array.from(list);
      if (!files.length) return;
      const q = queues.current.get(peerId) ?? [];
      const busy = q.length > 0 || sending[peerId] !== undefined;
      q.push(...files);
      queues.current.set(peerId, q);
      setQueued((cur) => {
        const prev = cur[peerId];
        return {
          ...cur,
          [peerId]: prev
            ? { ...prev, total: prev.total + files.length }
            : { done: 0, total: files.length },
        };
      });
      // Only kick the pump when nothing is in flight; otherwise onSendDone does.
      if (!busy) pump(peerId);
    },
    [pump, sending],
  );

  function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const peerId = targetPeer.current;
    const list = e.target.files;
    if (peerId && list) enqueue(peerId, list);
    e.target.value = "";
  }

  function acceptIncoming() {
    if (!incoming) return;
    const inc = incoming;
    inc.handle.onProgress((r) =>
      setIncoming((cur) =>
        cur && cur.from === inc.from ? { ...cur, received: r, status: "receiving" } : cur,
      ),
    );
    inc.handle.onDone((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = inc.name;
        a.click();
        URL.revokeObjectURL(url);
      }
      setIncoming((cur) => (cur && cur.from === inc.from ? { ...cur, status: "done" } : cur));
    });
    inc.handle.accept();
    setIncoming({ ...inc, status: "receiving" });
  }

  function declineIncoming() {
    incoming?.handle.decline();
    setIncoming(null);
  }

  function cancelReceiving() {
    incoming?.handle.cancel();
    setIncoming(null);
  }

  function joinCode() {
    const c = normalizeCode(codeDraft);
    if (c.length === CODE_LEN) setCode(c);
  }

  function createCode() {
    const c = randomCode();
    setCodeDraft(c);
    setCode(c);
  }

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setCode("");
    setCodeDraft("");
    setPeers([]);
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the code is visible on screen anyway */
    }
  }

  if (!supported) {
    return (
      <div className="py-10 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground">
          <WifiOff className="h-5 w-5" />
        </div>
        <p className="text-sm text-muted-foreground">{t("unsupported")}</p>
      </div>
    );
  }

  const showMemoryWarn =
    incoming?.status === "prompt" && !canStreamToDisk() && incoming.size > MEMORY_WARN_BYTES;

  return (
    <div className="py-2">
      <input ref={fileInput} type="file" multiple hidden onChange={onFileChosen} />

      {/* Mode switch: same-network auto vs private shared code */}
      <div className="mx-auto mb-5 flex max-w-xs gap-1 rounded-lg border border-border bg-secondary p-1 text-sm">
        {(["local", "code"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => switchMode(m)}
            className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
              mode === m
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground/70"
            }`}
          >
            {m === "local" ? t("modeLocal") : t("modeCode")}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-foreground">
          <RadioTower className="h-5 w-5" />
        </div>
        <p className="font-medium">{t("title")}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          {mode === "code" ? t("codeIntro") : t("subtitle")}
        </p>
        {conn === "online" && selfName && (
          <p className="mt-2 text-xs text-muted-foreground">{t("youAre", { name: selfName })}</p>
        )}
      </div>

      {/* Code entry (code mode, not yet joined) */}
      {mode === "code" && !code && (
        <div className="mx-auto mt-5 max-w-xs space-y-3">
          <input
            value={codeDraft}
            onChange={(e) => setCodeDraft(normalizeCode(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && joinCode()}
            placeholder={t("codePlaceholder")}
            inputMode="text"
            autoCapitalize="characters"
            maxLength={CODE_LEN}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-center font-mono text-lg tracking-[0.35em] uppercase outline-none focus:border-accent-blue"
          />
          <button
            onClick={joinCode}
            disabled={normalizeCode(codeDraft).length !== CODE_LEN}
            className="w-full rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {t("codeJoin")}
          </button>
          <button
            onClick={createCode}
            className="w-full text-center text-sm text-accent-blue transition-opacity hover:opacity-80"
          >
            {t("codeCreate")}
          </button>
        </div>
      )}

      {/* Active room code banner (code mode, joined) */}
      {mode === "code" && code && (
        <div className="mx-auto mt-5 flex max-w-xs items-center justify-between gap-3 rounded-xl border border-accent-blue/40 bg-accent-blue/[0.06] px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{t("codeRoom")}</p>
            <p className="font-mono text-lg font-semibold tracking-[0.3em]">{code}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={copyCode}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-secondary"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? t("codeCopied") : t("codeCopy")}
            </button>
            <button
              onClick={() => switchMode("local")}
              aria-label={t("codeLeave")}
              className="rounded-lg border border-border bg-background p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Incoming file prompt */}
      {/* Incoming transfer dialog — a real modal so an offer (from another
          browser OR a phone via the app bridge) can't be missed inside a
          scrolled panel. Explicit buttons only: the backdrop deliberately
          doesn't dismiss, since a stray tap would decline someone's send. */}
      {incoming && incoming.status !== "canceled" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("incoming", { name: incoming.name })}
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
        >
        <div className="w-full max-w-sm rounded-2xl border border-accent-blue/40 bg-card p-5 shadow-xl">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue">
              <Download className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {t("incoming", { name: incoming.name })}
              </p>
              <p className="text-xs text-muted-foreground">
                {(() => {
                  const peer = peers.find((pp) => pp.peerId === incoming.from);
                  const from = peer ? `${peer.emoji} ${peer.alias} · ` : "";
                  return `${from}${formatFileSize(incoming.size, locale)}`;
                })()}
              </p>
            </div>
          </div>
          {showMemoryWarn && (
            <p className="mt-2 text-xs text-amber-500 dark:text-amber-400">{t("memoryWarn")}</p>
          )}
          {incoming.status === "prompt" && (
            <div className="mt-4 flex gap-2.5">
              <button
                onClick={declineIncoming}
                className="flex-1 rounded-lg border border-border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
              >
                {t("decline")}
              </button>
              <button
                onClick={acceptIncoming}
                autoFocus
                className="flex-1 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                {t("accept")}
              </button>
            </div>
          )}
          {incoming.status === "receiving" && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {t("receiving")} {Math.round((incoming.received / incoming.size) * 100)}%
                </span>
                <button
                  onClick={cancelReceiving}
                  className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" /> {t("cancel")}
                </button>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-accent-blue transition-[width] duration-200"
                  style={{ width: `${Math.round((incoming.received / incoming.size) * 100)}%` }}
                />
              </div>
            </div>
          )}
          {incoming.status === "done" && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-success">{t("saved")}</p>
              <button
                onClick={() => setIncoming(null)}
                autoFocus
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-secondary"
              >
                {t("close")}
              </button>
            </div>
          )}
        </div>
        </div>
      )}

      {incoming?.status === "canceled" && (
        <div className="mt-5 rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
          {t("canceledByPeer")}
        </div>
      )}

      {/* Connection state / peer roster (hidden while entering a code) */}
      {!(mode === "code" && !code) && (
        <div className="mt-6">
          {conn === "connecting" && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("connecting")}
            </div>
          )}
          {conn === "offline" && (
            <div className="py-8 text-center text-sm text-muted-foreground">{t("offline")}</div>
          )}
          {conn === "online" && peers.length === 0 && (
            <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
              {mode === "code" ? t("codeWaiting") : t("empty")}
            </div>
          )}
          {conn === "online" && peers.length > 0 && (
            <>
              <input
                ref={stageInput}
                type="file"
                multiple
                hidden
                onChange={(e) => {
                  if (e.target.files) stageFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              {/* Drop first, choose the device after — the cloud tab's gesture,
                  brought to Nearby. Dropping straight onto a device still works
                  below, for anyone who already knows where it's going. */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setZoneActive(true);
                }}
                onDragLeave={() => setZoneActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setZoneActive(false);
                  if (e.dataTransfer.files.length) stageFiles(e.dataTransfer.files);
                }}
                onClick={() => stageInput.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") stageInput.current?.click();
                }}
                className={`mb-3 cursor-pointer rounded-xl border border-dashed px-4 py-5 text-center transition-colors ${
                  zoneActive
                    ? "border-accent-blue bg-accent-blue/[0.06]"
                    : "border-border hover:border-border-strong hover:bg-background-raised/60"
                }`}
              >
                <Upload
                  className={`mx-auto h-5 w-5 transition-colors ${
                    zoneActive ? "text-accent-blue" : "text-muted-foreground"
                  }`}
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  {zoneActive ? t("dropActive") : t("dropIdle")}
                </p>
              </div>

              {staged.length > 0 && (
                <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-accent-blue/40 bg-accent-blue/[0.06] px-4 py-2.5">
                  <p className="min-w-0 truncate text-sm font-semibold">
                    {t("staged", { count: staged.length })}
                  </p>
                  <button
                    onClick={() => setStaged([])}
                    className="shrink-0 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-secondary"
                  >
                    {t("clearStaged")}
                  </button>
                </div>
              )}

              <ul className="space-y-2">
              {peers.map((p) => {
                const pct = sending[p.peerId];
                const busy = pct !== undefined;
                const q = queued[p.peerId];
                const isDropTarget = dropPeer === p.peerId;
                return (
                  <li
                    key={p.peerId}
                    // Drop straight onto a device — the same gesture the cloud
                    // side has had all along, aimed at a specific recipient.
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDropPeer(p.peerId);
                    }}
                    onDragLeave={() => setDropPeer((cur) => (cur === p.peerId ? null : cur))}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDropPeer(null);
                      if (e.dataTransfer.files.length) enqueue(p.peerId, e.dataTransfer.files);
                    }}
                    className={`flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 transition-colors ${
                      isDropTarget
                        ? "border-accent-blue bg-accent-blue/5"
                        : "border-border"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="text-lg leading-none">{p.emoji}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{p.alias}</span>
                        {busy && (
                          <span className="block text-xs text-accent-blue">
                            {pct >= 100 ? t("sent") : `${t("sending")} ${pct}%`}
                            {q && q.total > 1 && ` · ${t("queue", { done: q.done, total: q.total })}`}
                          </span>
                        )}
                      </span>
                    </span>
                    <button
                      onClick={() => {
                        if (staged.length) {
                          enqueue(p.peerId, staged);
                          setStaged([]);
                        } else {
                          pickFileFor(p.peerId);
                        }
                      }}
                      disabled={busy && pct < 100}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {staged.length ? t("sendCount", { count: staged.length }) : t("send")}
                    </button>
                  </li>
                );
              })}
              </ul>
            </>
          )}
        </div>
      )}

      <p className="mt-5 text-center text-xs text-muted-foreground">{t("privacyNote")}</p>
    </div>
  );
}
