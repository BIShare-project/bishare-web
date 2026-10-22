// Opening and saving Drive files in the browser (drive-plan.md task 6.5).
// Small files and compressed ones are fetched, opened and inflated in the
// page. Large ones go through the streaming worker (src/sw/stream-sw.ts):
// it decrypts record by record while the browser writes to disk, or answers
// a video's range requests, so memory stays flat. The file key reaches the
// worker by postMessage only.
import { decryptStream } from "@/lib/e2e/crypto";
import type { DriveClient } from "./client";
import { inflateRaw } from "./crypto";
import type { DriveObject } from "./store";

/** Above this, a file without compression is streamed rather than held in memory. */
export const IN_PAGE_MAX = 192 * 1024 * 1024;

export async function blobUrlOf(client: DriveClient, o: DriveObject): Promise<string> {
  const res = await client.downloads([o.id], { thumbs: false, blobs: true });
  const item = res.items[0];
  if (!item?.url) throw new Error(item?.missing ? "missing" : "unavailable");
  return item.url;
}

let opening = 0;

/** Files being opened in the page right now (a zip of many takes a while); the idle lock waits for them. */
export function downloadsBusy(): boolean {
  return opening > 0;
}

/** The whole file, opened (and inflated) in the page. */
export async function fetchPlain(client: DriveClient, o: DriveObject, onProgress?: (done: number, total: number) => void, signal?: AbortSignal): Promise<Blob> {
  opening++;
  try {
    return await openPlain(client, o, onProgress, signal);
  } finally {
    opening--;
  }
}

async function openPlain(client: DriveClient, o: DriveObject, onProgress?: (done: number, total: number) => void, signal?: AbortSignal): Promise<Blob> {
  if (!o.fileKey) throw new Error("no key");
  const url = await blobUrlOf(client, o);
  const res = await fetch(url, { signal });
  if (!res.ok || !res.body) throw new Error(`storage ${res.status}`);
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  const total = o.compression ? (o.blobSize ?? 0) : (o.size ?? 0);
  await decryptStream(
    res.body,
    o.fileKey,
    (c) => {
      chunks.push(c as Uint8Array<ArrayBuffer>);
    },
    (n) => onProgress?.(n, total)
  );
  let parts: BlobPart[] = chunks;
  if (o.compression === "deflate") {
    const joined = new Uint8Array(chunks.reduce((a, c) => a + c.length, 0));
    let at = 0;
    for (const c of chunks) {
      joined.set(c, at);
      at += c.length;
    }
    parts = [(await inflateRaw(joined, o.size ?? 0)) as Uint8Array<ArrayBuffer>];
  }
  return new Blob(parts, { type: inertType(o.mime) });
}

/**
 * The type a decrypted blob may carry. A blob: URL has the Drive's origin, so a
 * type a browser would run (HTML, SVG, XML, script) is never given to one;
 * images, sound, video, PDF and plain text keep theirs.
 */
export function inertType(mime: string | null | undefined): string {
  const m = (mime ?? "").toLowerCase().split(";")[0]!.trim();
  if (/^image\/(png|jpeg|gif|webp|avif|bmp|heic|heif|tiff|x-icon|vnd\.microsoft\.icon)$/.test(m)) return m;
  if (/^(video|audio)\/[\w.+-]+$/.test(m) || m === "application/pdf" || m === "text/plain") return m;
  return "application/octet-stream";
}

export function saveBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// ---- the streaming worker -------------------------------------------------------------------

let registration: Promise<ServiceWorker | null> | null = null;

/** The streaming worker for this Drive's pages ([scope] is "/" on drive.bishare.app, "/drive/" on a shared host). */
export function streamWorker(scope: string): Promise<ServiceWorker | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return Promise.resolve(null);
  return (registration ??= (async () => {
    try {
      const reg = await navigator.serviceWorker.register("/stream-sw.js", { scope });
      if (!navigator.serviceWorker.controller) {
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, 3000);
          navigator.serviceWorker.addEventListener(
            "controllerchange",
            () => {
              clearTimeout(timer);
              resolve();
            },
            { once: true }
          );
        });
      }
      return navigator.serviceWorker.controller ?? reg.active ?? null;
    } catch {
      return null;
    }
  })());
}

function handshake(worker: ServiceWorker, message: Record<string, unknown>, onMessage?: (d: { type?: string; bytes?: number }) => void): Promise<boolean> {
  const ch = new MessageChannel();
  return new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => resolve(false), 10_000);
    ch.port1.onmessage = (e: MessageEvent) => {
      const d = e.data as { type?: string; bytes?: number };
      if (d?.type === "ready") {
        clearTimeout(timer);
        resolve(true);
      } else if (d?.type === "failed") {
        clearTimeout(timer);
        resolve(false);
      }
      onMessage?.(d);
    };
    worker.postMessage(message, [ch.port2]);
  });
}

/** Save a large file through the worker; false when this browser cannot (the caller falls back). */
export async function streamSave(
  client: DriveClient,
  o: DriveObject,
  scope: string,
  hooks: { onProgress?: (bytes: number) => void; onDone?: () => void; onError?: () => void } = {}
): Promise<boolean> {
  if (!o.fileKey || o.compression) return false;
  const worker = await streamWorker(scope);
  if (!worker || !navigator.serviceWorker.controller) return false;
  const id = crypto.randomUUID();
  const ok = await handshake(
    worker,
    { type: "download", id, url: await blobUrlOf(client, o), key: Array.from(o.fileKey), name: o.name, size: o.size ?? 0 },
    (d) => {
      if (d.type === "progress" && typeof d.bytes === "number") hooks.onProgress?.(d.bytes);
      else if (d.type === "done") hooks.onDone?.();
      else if (d.type === "error") hooks.onError?.();
    }
  );
  if (!ok) return false;
  const probe = await fetch(`/stream/${id}?download=1`, { method: "HEAD" }).catch(() => null);
  if (!probe?.ok) {
    worker.postMessage({ type: "end", id });
    return false;
  }
  const a = document.createElement("a");
  a.href = `/stream/${id}?download=1`;
  a.download = o.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  return true;
}

/** A seekable URL for a large video or song, decrypted as it plays; null when this browser cannot. */
export async function streamMedia(client: DriveClient, o: DriveObject, scope: string): Promise<{ src: string; end: () => void } | null> {
  if (!o.fileKey || o.compression) return null;
  const worker = await streamWorker(scope);
  if (!worker || !navigator.serviceWorker.controller) return null;
  const id = crypto.randomUUID();
  const ok = await handshake(worker, { type: "session", id, url: await blobUrlOf(client, o), key: Array.from(o.fileKey), mime: inertType(o.mime) });
  if (!ok) return null;
  return { src: `/stream/${id}`, end: () => worker.postMessage({ type: "end", id }) };
}
