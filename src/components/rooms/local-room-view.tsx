"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, Download, FileIcon, LogOut, Radio, Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NearbySignaling, type NearbyPeer } from "@/lib/nearby/signaling";
import { RoomRTC, type ReceivedRoomFile } from "@/lib/rooms/local/room-rtc";

const EMOJIS = ["🦊", "🐼", "🐧", "🦉", "🐙", "🦜", "🐳", "🦄", "🐝", "🦩"];

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const u = ["KB", "MB", "GB", "TB"];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${u[i]}`;
}

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Local (WebRTC) room: file bytes go straight peer-to-peer, never via a server. */
export function LocalRoomView({
  code,
  alias,
  onLeave,
}: {
  code: string;
  alias: string;
  onLeave: () => void;
}) {
  const t = useTranslations("rooms");
  const [status, setStatus] = useState<"connecting" | "open">("connecting");
  const [peers, setPeers] = useState<NearbyPeer[]>([]);
  const [received, setReceived] = useState<ReceivedRoomFile[]>([]);
  const [sending, setSending] = useState<{ name: string; pct: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sigRef = useRef<NearbySignaling | null>(null);
  const rtcRef = useRef<RoomRTC | null>(null);
  const peersRef = useRef<NearbyPeer[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const selfRef = useRef<NearbyPeer | null>(null);
  const sendTracker = useRef<{ name: string; total: number; frac: Map<string, number>; done: number } | null>(null);

  peersRef.current = peers;

  if (!selfRef.current) {
    const rand = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    selfRef.current = {
      peerId: rand,
      alias,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)] ?? "🦊",
    };
  }

  const aliasOf = useCallback(
    (peerId: string) =>
      peersRef.current.find((p) => p.peerId === peerId)?.alias || t("landing.anon"),
    [t],
  );

  useEffect(() => {
    const self = selfRef.current;
    if (!self) return;
    if (typeof window !== "undefined" && !("RTCPeerConnection" in window)) {
      setError(t("local.unsupported"));
      return;
    }

    let stopped = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    const sig = new NearbySignaling(self, code)
      .on("open", () => setStatus("open"))
      .on("close", () => {
        // Mobile networks drop WebSockets often; don't strand the room — flip to
        // "connecting" and reconnect (same signaling instance, handlers intact)
        // unless we're intentionally leaving.
        setStatus("connecting");
        if (!stopped) reconnectTimer = setTimeout(() => sig.connect(), 2000);
      })
      .on("peers", (list) => setPeers(list.filter((p) => p.peerId !== self.peerId)))
      .on("peerJoined", (p) =>
        setPeers((cur) => (p.peerId === self.peerId ? cur : [...cur.filter((x) => x.peerId !== p.peerId), p])),
      )
      .on("peerLeft", (id) => setPeers((cur) => cur.filter((p) => p.peerId !== id)));

    const rtc = new RoomRTC(
      sig,
      {
        onReceived: (f) => setReceived((cur) => [f, ...cur]),
        onSendProgress: (sid, _peer, sent, total) => {
          const tr = sendTracker.current;
          if (!tr || total === 0) return;
          tr.frac.set(sid, sent / total);
          const avg = [...tr.frac.values()].reduce((a, b) => a + b, 0) / tr.total;
          setSending({ name: tr.name, pct: Math.min(100, Math.round(avg * 100)) });
        },
        onSendDone: (_sid) => {
          const tr = sendTracker.current;
          if (!tr) return;
          tr.done += 1;
          if (tr.done >= tr.total) {
            sendTracker.current = null;
            setSending(null);
          }
        },
        onError: (_peer, err) => setError(err),
      },
      aliasOf,
    );

    sigRef.current = sig;
    rtcRef.current = rtc;
    sig.connect();

    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      rtc.closeAll();
      sig.close();
      sigRef.current = null;
      rtcRef.current = null;
    };
    // Run once per code — alias/t/callbacks are captured intentionally (aliasOf
    // reads the live peers ref), so re-subscribing on every render is avoided.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const targets = peersRef.current.map((p) => p.peerId);
    if (targets.length === 0) {
      setError(t("local.nobody"));
      return;
    }
    for (const file of Array.from(files)) {
      sendTracker.current = { name: file.name, total: targets.length, frac: new Map(), done: 0 };
      setSending({ name: file.name, pct: 0 });
      try {
        await rtcRef.current?.broadcast(file, targets);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("errors.upload"));
      }
      // broadcast() resolves when all pumps finish handing bytes to the channel;
      // onSendDone clears `sending` once every peer's stream completes.
    }
    if (fileInput.current) fileInput.current.value = "";
  };

  return (
    <div className="divide-y divide-border">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
            <Radio className="h-3 w-3" /> {t("local.tag")}
          </p>
          <button
            onClick={copyCode}
            className="mt-1 flex items-center gap-2 font-mono text-2xl font-semibold tracking-[0.2em] hover:text-primary"
            title={t("room.copy")}
          >
            {code}
            {copied ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
        <Button onClick={onLeave} variant="ghost" size="sm" className="text-destructive">
          <LogOut className="mr-1.5 h-4 w-4" />
          {t("room.leave")}
        </Button>
      </div>

      {/* peers */}
      <div className="p-5">
        <p className="mb-3 flex items-center gap-2 text-sm font-medium">
          <Users className="h-4 w-4" /> {t("room.members")} · {peers.length + 1}
        </p>
        <ul className="flex flex-wrap gap-2">
          <li className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm">
            <span>{selfRef.current?.emoji}</span>
            <span className="max-w-[10rem] truncate">{alias}</span>
            <span className="rounded bg-foreground/10 px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
              {t("room.you")}
            </span>
          </li>
          {peers.map((p) => (
            <li
              key={p.peerId}
              className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm"
            >
              <span>{p.emoji}</span>
              <span className="max-w-[10rem] truncate">{p.alias || t("landing.anon")}</span>
            </li>
          ))}
        </ul>
        {peers.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            {status === "open" ? t("local.waiting") : t("room.connecting")}
          </p>
        )}
      </div>

      {/* share + received */}
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-medium">
            <FileIcon className="h-4 w-4" /> {t("local.received")} · {received.length}
          </p>
          <input
            ref={fileInput}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button
            onClick={() => fileInput.current?.click()}
            size="sm"
            disabled={sending !== null || peers.length === 0}
          >
            <Upload className="mr-1.5 h-4 w-4" />
            {sending ? `${t("room.uploading")} ${sending.pct}%` : t("local.share")}
          </Button>
        </div>

        <p className="mb-3 text-xs text-muted-foreground">{t("local.p2pNote")}</p>

        {received.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            {t("local.noFiles")}
          </p>
        ) : (
          <ul className="space-y-2">
            {received.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                  <FileIcon className="h-5 w-5 text-muted-foreground" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(f.size)} · {t("room.by", { who: f.fromAlias })}
                  </p>
                </div>
                <Button
                  onClick={() => saveBlob(f.blob, f.name)}
                  size="icon"
                  variant="ghost"
                  aria-label={t("room.download")}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p className="bg-destructive/10 px-5 py-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
