"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { NearbySignaling, type NearbyPeer } from "@/lib/nearby/signaling";
import { RoomRTC, type ReceivedRoomFile } from "@/lib/rooms/local/room-rtc";
import { RoomLayout } from "./room-layout";

const EMOJIS = ["🦊", "🐼", "🐧", "🦉", "🐙", "🦜", "🐳", "🦄", "🐝", "🦩"];

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
  // "<alias> · <name>" per incoming transfer, like the Cloud room's upload_start
  const [incoming, setIncoming] = useState<Map<string, { from: string; label: string }>>(new Map());
  // One blob: URL per image file for its preview, revoked when the room closes.
  const thumbs = useRef(new Map<string, string>());

  const sigRef = useRef<NearbySignaling | null>(null);
  const rtcRef = useRef<RoomRTC | null>(null);
  const peersRef = useRef<NearbyPeer[]>([]);
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
      .on("peerLeft", (id) => {
        setPeers((cur) => cur.filter((p) => p.peerId !== id));
        setIncoming((cur) => new Map([...cur].filter(([, v]) => v.from !== id)));
      });

    const finishOne = () => {
      const tr = sendTracker.current;
      if (!tr) return;
      tr.done += 1;
      if (tr.done >= tr.total) {
        sendTracker.current = null;
        setSending(null);
      }
    };

    const rtc = new RoomRTC(
      sig,
      {
        onReceiveStart: (sid, from, meta) =>
          setIncoming((cur) => new Map(cur).set(sid, { from, label: `${aliasOf(from)} · ${meta.name}` })),
        onReceived: (f) => {
          setReceived((cur) => [f, ...cur]);
          setIncoming((cur) => {
            const next = new Map(cur);
            next.delete(f.id);
            return next;
          });
        },
        onSendProgress: (sid, _peer, sent, total) => {
          const tr = sendTracker.current;
          if (!tr || total === 0) return;
          tr.frac.set(sid, sent / total);
          const avg = [...tr.frac.values()].reduce((a, b) => a + b, 0) / tr.total;
          setSending({ name: tr.name, pct: Math.min(100, Math.round(avg * 100)) });
        },
        onSendDone: () => finishOne(),
        // A peer that never got the file still counts as finished, or the
        // share button would stay stuck at its last percentage.
        onSendFailed: () => finishOne(),
        onError: (_peer, err) => {
          setError(err);
          setIncoming(new Map()); // a receive that died has no callback of its own
        },
      },
      aliasOf,
    );

    sigRef.current = sig;
    rtcRef.current = rtc;
    sig.connect();

    const previews = thumbs.current;
    return () => {
      for (const url of previews.values()) URL.revokeObjectURL(url);
      previews.clear();
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


  const handleFiles = async (files: File[]) => {
    setError(null);
    const targets = peersRef.current.map((p) => p.peerId);
    if (targets.length === 0) {
      setError(t("local.nobody"));
      return;
    }
    for (const file of files) {
      // Show my own shared file in the list right away — the sharer should see
      // what they shared (a File is a Blob, so it downloads back the original).
      const ownId = `own-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setReceived((cur) => [
        {
          id: ownId,
          name: file.name,
          size: file.size,
          mime: file.type || "application/octet-stream",
          from: "me",
          fromAlias: t("room.you"),
          blob: file,
        },
        ...cur,
      ]);
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
  };

  const previewOf = (f: ReceivedRoomFile): string | undefined => {
    if (!f.mime.startsWith("image/")) return undefined;
    let url = thumbs.current.get(f.id);
    if (!url) {
      url = URL.createObjectURL(f.blob);
      thumbs.current.set(f.id, url);
    }
    return url;
  };

  const incomingLabel = [...incoming.values()].at(-1)?.label ?? null;

  return (
    <RoomLayout
      mode="local"
      code={code}
      members={[
        { id: "me", alias, icon: <span aria-hidden>{selfRef.current?.emoji}</span>, badge: "you" as const },
        ...peers.map((p) => ({
          id: p.peerId,
          alias: p.alias || t("landing.anon"),
          icon: <span aria-hidden>{p.emoji}</span>,
        })),
      ]}
      membersPlaceholder={
        peers.length === 0 ? (status === "open" ? t("local.waiting") : t("room.connecting")) : undefined
      }
      files={received.map((f) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        byAlias: f.fromAlias,
        thumbnailSrc: previewOf(f),
        onDownload: () => saveBlob(f.blob, f.name),
      }))}
      filesPlaceholder={t("local.noFiles")}
      note={t("local.p2pNote")}
      uploadPct={sending ? sending.pct : null}
      uploadingBy={incomingLabel}
      uploadLabel={t("local.share")}
      uploadDisabled={peers.length === 0}
      onFiles={(files) => void handleFiles(files)}
      leave={{ label: t("room.leave"), icon: <LogOut className="mr-1.5 h-4 w-4" />, onClick: onLeave }}
      error={error}
    />
  );
}
