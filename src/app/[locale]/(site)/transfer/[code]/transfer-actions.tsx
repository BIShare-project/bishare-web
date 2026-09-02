"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getTransferStatus, getTransferDownloadURL } from "@/lib/api";
import { triggerBrowserDownload } from "@/components/download-button";
import { decryptStream, DecryptError, keyFromHash, maxPlaintextFor } from "@/lib/e2e/crypto";
import { CheckCircle2, Clock, Download, Loader2, Lock } from "lucide-react";

type Translate = ReturnType<typeof useTranslations>;

// Minimal File System Access API shape — lets us stream the decrypted plaintext
// straight to disk so multi-GB E2E downloads never sit in memory.
interface FsWritable {
  write: (data: BufferSource) => Promise<void>;
  close: () => Promise<void>;
  abort?: () => Promise<void>;
}
interface FsFileHandle {
  createWritable: () => Promise<FsWritable>;
}
type ShowSaveFilePicker = (opts?: { suggestedName?: string }) => Promise<FsFileHandle>;

function saveToDiskSupported(): boolean {
  return typeof window !== "undefined" && "showSaveFilePicker" in window;
}

/**
 * Second-best after the save picker: hand the decryption to the site's
 * service worker and let the browser's own downloader stream the plaintext to
 * disk. This is what keeps Firefox, Safari and every mobile browser from
 * having to hold the whole file in memory. Returns null when the worker is
 * not in control of this page (first visit before activation, private mode),
 * in which case the caller falls back to the in-memory path.
 */
async function openStreamedDownload(input: {
  code: string;
  key: Uint8Array;
  name: string;
  size: number;
  onProgress: (bytes: number) => void;
  onDone: () => void;
  onError: () => void;
}): Promise<string | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      // Freshly activated on a first visit: give clients.claim a moment.
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 2000);
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => {
            clearTimeout(timer);
            resolve();
          },
          { once: true },
        );
      });
    }
    const worker = navigator.serviceWorker.controller ?? reg.active;
    if (!worker || !navigator.serviceWorker.controller) return null;

    const id = crypto.randomUUID();
    const ch = new MessageChannel();
    const ready = new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => resolve(false), 10000);
      ch.port1.onmessage = (e: MessageEvent) => {
        const d = e.data as { type?: string; bytes?: number };
        if (d?.type === "ready") {
          clearTimeout(timer);
          resolve(true);
        } else if (d?.type === "progress" && typeof d.bytes === "number") input.onProgress(d.bytes);
        else if (d?.type === "done") input.onDone();
        else if (d?.type === "error") input.onError();
      };
    });
    worker.postMessage(
      { type: "download", id, url: getTransferDownloadURL(input.code), key: Array.from(input.key), name: input.name, size: input.size },
      [ch.port2],
    );
    if (!(await ready)) return null;

    // Prove the worker actually intercepts the URL before committing to it —
    // a HEAD costs nothing and a miss would otherwise navigate to a 404.
    const probe = await fetch(`/stream/${id}?download=1`, { method: "HEAD" }).catch(() => null);
    if (!probe || !probe.ok || probe.headers.get("Content-Disposition")?.startsWith("attachment") !== true) {
      worker.postMessage({ type: "end", id });
      return null;
    }
    return `/stream/${id}?download=1`;
  } catch {
    return null;
  }
}

/** Live "Expires in …" pill, refreshed every 30 seconds. */
export function ExpiryCountdown({ expiresAt }: { expiresAt: string }) {
  const t = useTranslations("flows");
  const [label, setLabel] = useState(() => remainingLabel(expiresAt, t));

  useEffect(() => {
    const update = () => setLabel(remainingLabel(expiresAt, t));
    update();
    const timer = setInterval(update, 30_000);
    return () => clearInterval(timer);
  }, [expiresAt, t]);

  return (
    <span
      suppressHydrationWarning
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background-raised px-3 py-[5px] text-xs text-muted-foreground"
    >
      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
      {label}
    </span>
  );
}

function remainingLabel(expiresAt: string, t: Translate): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (Number.isNaN(diff)) return t("download.expiryUnknown");
  if (diff <= 0) return t("download.expired");
  const totalMinutes = Math.floor(diff / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours >= 48)
    return t("download.expiresInDays", { days: Math.floor(hours / 24) });
  if (hours >= 1) return t("download.expiresInHm", { hours, minutes });
  if (minutes >= 1) return t("download.expiresInMinutes", { minutes });
  return t("download.expiresSoon");
}

const DOWNLOAD_ERROR_KEYS: Record<string, string> = {
  TRANSFER_NOT_FOUND: "download.errors.notFound",
  TRANSFER_EXPIRED: "download.errors.expired",
  TRANSFER_ALREADY_DOWNLOADED: "download.errors.alreadyDownloaded",
  RATE_LIMITED: "download.errors.rateLimited",
  NETWORK_ERROR: "download.errors.network",
  SERVER_ERROR: "download.errors.server",
};

type ButtonState = "idle" | "checking" | "decrypting" | "started" | "gone";

/**
 * Download button that re-checks the transfer status right before
 * navigating to the byte stream, so a consumed one-time transfer or an
 * expiry race shows a human message instead of raw API JSON.
 *
 * When the link carries an E2E key in its fragment (#k=…), the bytes on the
 * server are ciphertext: instead of a plain anchor navigation, we stream the
 * ciphertext back, decrypt it in the browser (chunked AES-GCM, streamed to disk
 * via the File System Access API when available), and save the plaintext. The
 * key is read from the fragment and never leaves the browser.
 */
export function DownloadTransferButton({
  code,
  oneTime,
  fileName,
  fileSize,
}: {
  code: string;
  oneTime: boolean;
  fileName: string;
  fileSize: number;
}) {
  const t = useTranslations("flows");
  const [state, setState] = useState<ButtonState>("idle");
  const [error, setError] = useState("");
  const [pct, setPct] = useState(0);
  const [encKey, setEncKey] = useState<Uint8Array | null>(null);

  // The key lives in the URL fragment — only readable client-side.
  useEffect(() => {
    setEncKey(keyFromHash(window.location.hash));
  }, []);

  async function recheckStatus(): Promise<boolean> {
    const res = await getTransferStatus(code);
    if (!res.success || !res.data) {
      const codeKey = res.error?.code ?? "";
      const errorKey = DOWNLOAD_ERROR_KEYS[codeKey];
      setError(errorKey ? t(errorKey) : res.error?.message ?? t("download.errors.generic"));
      setState(codeKey === "TRANSFER_NOT_FOUND" ? "gone" : "idle");
      return false;
    }
    if (res.data.oneTime && res.data.isDownloaded) {
      setError(t("download.errors.alreadyDownloaded"));
      setState("gone");
      return false;
    }
    return true;
  }

  async function handlePlainDownload() {
    setError("");
    setState("checking");
    try {
      if (!(await recheckStatus())) return;
      // Hidden anchor (review #16) — keeps this page and its one-time state
      // alive instead of navigating the tab at the byte stream.
      triggerBrowserDownload(getTransferDownloadURL(code));
      setState("started");
    } catch {
      setError(t("download.errors.network"));
      setState("idle");
    }
  }

  async function handleEncryptedDownload(key: Uint8Array) {
    setError("");
    // No save picker (Firefox, Safari, every mobile browser): stream through
    // the service worker so the browser writes to disk as bytes arrive. Only
    // if that is unavailable do we fall back to decrypting in memory.
    if (!saveToDiskSupported()) {
      setState("checking");
      setPct(0);
      if (!(await recheckStatus())) return;
      const plainSize = maxPlaintextFor(fileSize);
      const url = await openStreamedDownload({
        code,
        key,
        name: fileName,
        size: plainSize,
        onProgress: (bytes) => {
          setState("decrypting");
          setPct(Math.min(100, Math.round((bytes / Math.max(1, plainSize)) * 100)));
        },
        onDone: () => {
          setPct(100);
          setState("started");
        },
        onError: () => {
          setError(t("download.errors.network"));
          setState("idle");
        },
      });
      if (url) {
        setState("decrypting");
        triggerBrowserDownload(url);
        return;
      }
      setState("idle");
    }

    // Open the save dialog FIRST, inside the click's user gesture (a later
    // await would drop the transient activation showSaveFilePicker needs).
    let writable: FsWritable | undefined;
    if (saveToDiskSupported()) {
      const picker = (globalThis as unknown as { showSaveFilePicker?: ShowSaveFilePicker })
        .showSaveFilePicker;
      try {
        const handle = await picker!({ suggestedName: fileName });
        writable = await handle.createWritable();
      } catch {
        return; // user dismissed the dialog — do nothing
      }
    }

    setState("checking");
    setPct(0);
    try {
      if (!(await recheckStatus())) {
        await writable?.abort?.().catch(() => {});
        return;
      }
      const res = await fetch(getTransferDownloadURL(code));
      if (!res.ok || !res.body) {
        await writable?.abort?.().catch(() => {});
        setError(t("download.errors.generic"));
        setState("idle");
        return;
      }

      setState("decrypting");
      const chunks: Uint8Array[] = [];
      let writeChain: Promise<void> = Promise.resolve();
      await decryptStream(
        res.body,
        key,
        (chunk) => {
          if (writable) writeChain = writeChain.then(() => writable!.write(chunk as unknown as BufferSource));
          else chunks.push(chunk);
        },
        (plainBytes) => setPct(Math.min(100, Math.round((plainBytes / Math.max(1, fileSize)) * 100))),
      );

      if (writable) {
        await writeChain;
        await writable.close();
      } else {
        // Fallback (Safari/Firefox): assemble a Blob and download it.
        const blob = new Blob(
          chunks.map((c) => c.buffer as ArrayBuffer),
          { type: "application/octet-stream" },
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
      setPct(100);
      setState("started");
    } catch (e) {
      await writable?.abort?.().catch(() => {});
      setError(e instanceof DecryptError ? t("download.errors.decryptFailed") : t("download.errors.network"));
      setState("idle");
    }
  }

  const handleDownload = () => (encKey ? handleEncryptedDownload(encKey) : handlePlainDownload());
  const busy = state === "checking" || state === "decrypting";
  const locked = state === "gone" || (state === "started" && oneTime);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleDownload}
        disabled={busy || locked}
        className="inline-flex h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-primary bg-primary px-5 text-[15px] font-medium tracking-[-0.01em] text-primary-foreground outline-none transition-[opacity,transform] duration-200 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0"
      >
        {busy && <Loader2 className="animate-spin" />}
        {state === "started" && <CheckCircle2 />}
        {(state === "idle" || state === "gone") && (encKey ? <Lock /> : <Download />)}
        {state === "checking"
          ? t("download.preparing")
          : state === "decrypting"
            ? t("download.decrypting", { pct })
            : state === "started"
              ? t("download.started")
              : state === "gone"
                ? t("download.gone")
                : encKey
                  ? t("download.downloadEncrypted")
                  : t("download.download")}
      </button>
      {encKey && (state === "idle" || state === "gone") && (
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          {t("download.encryptedNote")}
        </p>
      )}
      {state === "started" && !oneTime && !encKey && (
        <p className="text-center text-xs text-muted-foreground">{t("download.retryHint")}</p>
      )}
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
    </div>
  );
}
