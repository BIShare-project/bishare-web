"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Play, Loader2 } from "lucide-react";
import { getTransferDownloadURL, getWebStreamEnabled } from "@/lib/api";
import { keyFromHash } from "@/lib/e2e/crypto";

/**
 * Play an end-to-end encrypted transfer without downloading it first.
 *
 * The heavy lifting is in the streaming worker (src/sw/stream-sw.ts): this
 * component only hands it the key out of band and points a media element at the
 * virtual URL the worker serves. The key comes from the link fragment and never
 * leaves the browser — not to our relay, not into the URL the worker sees.
 *
 * Deliberately additive: if anything here is unavailable (no service worker,
 * an unplayable type, a one-time link, a failed handshake) the component simply
 * renders nothing and the existing Download button remains the whole story.
 */

/**
 * What the browser can open directly from decrypted bytes.
 *
 * Images and PDFs matter more than the headline video case: they need
 * decryption but no Range machinery at all (the worker answers an un-ranged
 * request with the whole plaintext), and far more real transfers are a photo
 * or a document than a web-playable video container.
 */
type Kind = "video" | "audio" | "image" | "pdf";

function previewKind(mime: string): Kind | null {
  const m = mime.toLowerCase();
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  // HEIC/HEIF are common straight off an iPhone and are NOT decodable by most
  // browsers — offering a preview that renders broken is worse than none.
  if (m.startsWith("image/") && !/hei[cf]/.test(m)) return "image";
  if (m === "application/pdf") return "pdf";
  return null;
}

type Phase = "idle" | "starting" | "playing" | "unsupported" | "gone";

export function StreamPlayer({
  code,
  mimeType,
  oneTime,
}: {
  code: string;
  mimeType: string;
  oneTime: boolean;
}) {
  const t = useTranslations("flows");
  const [phase, setPhase] = useState<Phase>("idle");
  const [src, setSrc] = useState<string | null>(null);
  const [encKey, setEncKey] = useState<Uint8Array | null>(null);
  const sessionId = useRef<string>("");
  const recovering = useRef(false);
  const [flagOn, setFlagOn] = useState(false);
  const kind = previewKind(mimeType);

  useEffect(() => {
    setEncKey(keyFromHash(window.location.hash));
  }, []);

  // Admin-controlled kill switch, same pattern as the Nearby/QR Beam tabs.
  // Defaults off, so an unreachable config leaves the plain download alone.
  useEffect(() => {
    let alive = true;
    getWebStreamEnabled().then((on) => {
      if (alive) setFlagOn(on);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Tell the worker to forget the key when this page goes away.
  useEffect(() => {
    return () => {
      const id = sessionId.current;
      if (!id) return;
      navigator.serviceWorker?.controller?.postMessage({ type: "end", id });
    };
  }, []);

  const start = useCallback(async (silent = false) => {
    if (!encKey) return;
    if (!silent) setPhase("starting");
    try {
      if (!("serviceWorker" in navigator)) throw new Error("no service worker");

      // Use the PAGE'S OWN worker — the site's PWA worker, which importScripts
      // the streaming handler. Interception follows whichever worker controls
      // this client, so registering a second one (any scope) would simply never
      // see the media requests.
      const reg = await navigator.serviceWorker.ready;
      const worker = navigator.serviceWorker.controller ?? reg.active;
      if (!worker) throw new Error("no controlling worker");

      const id = crypto.randomUUID();
      sessionId.current = id;

      // A MessagePort, not the global message event: this worker does not
      // control the page, so replies must come back over a channel we own.
      await new Promise<void>((resolve, reject) => {
        const ch = new MessageChannel();
        const timer = setTimeout(() => reject(new Error("handshake timeout")), 15000);
        ch.port1.onmessage = (e: MessageEvent) => {
          const d = e.data as { type?: string; error?: string };
          clearTimeout(timer);
          ch.port1.close();
          if (d?.type === "ready") resolve();
          else reject(new Error(d?.error || "worker refused the file"));
        };
        worker.postMessage(
          {
            type: "session",
            id,
            url: getTransferDownloadURL(code),
            key: Array.from(encKey),
            mime: mimeType,
          },
          [ch.port2],
        );
      });

      // The query string is cosmetic but load-bearing: a recovery re-handshake
      // mints a NEW session id, and changing the URL is what makes the media
      // element drop its dead connection and refetch.
      setSrc(`/stream/${id}`);
      setPhase("playing");
      return true;
    } catch {
      // Never strand the user: the download button already on the page stays.
      if (!silent) setPhase("unsupported");
      return false;
    }
  }, [code, encKey, mimeType]);

  /**
   * A service worker can be evicted at any moment, taking the in-memory key
   * with it — the next range then 503s and playback dies for no reason the
   * viewer can understand. Re-handshake once, silently, and let the element
   * retry; only a second failure is treated as real.
   */
  const onMediaError = useCallback(async () => {
    if (recovering.current) {
      setPhase("unsupported");
      return;
    }
    recovering.current = true;
    // Distinguish "worker forgot us" from "the link is simply gone" — an
    // expired or consumed transfer must say so instead of silently vanishing.
    try {
      const probe = await fetch(getTransferDownloadURL(code), {
        method: "HEAD",
        cache: "no-store",
      });
      if (probe.status === 404 || probe.status === 410 || probe.status === 403) {
        setPhase("gone");
        return;
      }
    } catch {
      /* network hiccup — fall through to the re-handshake attempt */
    }
    const ok = await start(true);
    if (!ok) setPhase("unsupported");
  }, [code, start]);

  // Encrypted links only (the key is what makes this worth doing), never
  // one-time links (a stream makes many requests; the relay burns those on the
  // first one), and only for types a media element can handle.
  if (!kind || !encKey || oneTime || !flagOn || phase === "unsupported") return null;

  // The link died while it was open — say so rather than disappear.
  if (phase === "gone") {
    return (
      <p className="mt-3 text-center text-sm text-muted-foreground">
        {t("download.errors.expired")}
      </p>
    );
  }

  if (phase === "playing" && src) {
    return (
      <div className="mt-4">
        {kind === "video" && (
          <video
            src={src}
            controls
            autoPlay
            playsInline
            className="w-full rounded-xl border border-border bg-black"
            onError={onMediaError}
          />
        )}
        {kind === "audio" && (
          <audio
            src={src}
            controls
            autoPlay
            className="w-full"
            onError={onMediaError}
          />
        )}
        {kind === "image" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={t("transfer.previewAlt")}
            className="mx-auto max-h-[70vh] w-auto rounded-xl border border-border"
            onError={onMediaError}
          />
        )}
        {kind === "pdf" && (
          <object
            data={src}
            type="application/pdf"
            className="h-[70vh] w-full rounded-xl border border-border"
          >
            <p className="p-4 text-sm text-muted-foreground">{t("transfer.streamNote")}</p>
          </object>
        )}
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {t("transfer.streamNote")}
        </p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void start()}
      disabled={phase === "starting"}
      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary disabled:opacity-60"
    >
      {phase === "starting" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Play className="h-4 w-4" />
      )}
      {kind === "video" || kind === "audio"
        ? t("transfer.playNow")
        : t("transfer.previewNow")}
    </button>
  );
}
