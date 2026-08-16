/**
 * Streaming worker — serves an end-to-end encrypted transfer as a seekable
 * media source, without the relay ever seeing plaintext and without the
 * recipient downloading the whole file first.
 *
 * It answers Range requests for a virtual same-origin URL by translating the
 * requested PLAINTEXT span into the encrypted records that cover it, fetching
 * only those bytes from the relay, decrypting them, and replying 206. All the
 * format knowledge is imported from lib/e2e/crypto — this file is deliberately
 * thin so the record layout can never drift between sender and receiver.
 *
 * Built to public/stream-sw.js by `npm run build:sw` (esbuild). It is a
 * SEPARATE worker from the marketing sw.js on purpose: different scope, no
 * caching, and nothing here should ever be entangled with PWA asset caching.
 *
 * The decryption key arrives by postMessage and lives only in this worker's
 * memory — never in a URL, never in a cache, never on the wire.
 */
import {
  ciphertextRangeFor,
  decryptRange,
  parseEncHeader,
  HEADER_SIZE,
  type EncHeader,
} from "@/lib/e2e/crypto";

export {}; // module scope

declare const self: ServiceWorkerGlobalScope;

interface Session {
  url: string; // relay ciphertext URL
  key: Uint8Array;
  hdr: EncHeader;
  mime: string;
}

const sessions = new Map<string, Session>();
const PREFIX = "/stream/";

self.addEventListener("install", () => void self.skipWaiting());
self.addEventListener("activate", (e: ExtendableEvent) => e.waitUntil(self.clients.claim()));

// Replies go back over the MessagePort the page supplies, not via
// event.source: this worker owns the narrow /stream/ scope, so it does NOT
// control the page (the marketing worker does) and cannot rely on being the
// page's `controller`.
self.addEventListener("message", (event: ExtendableMessageEvent) => {
  const data = event.data as
    | { type: "session"; id: string; url: string; key: number[]; mime: string }
    | { type: "end"; id: string }
    | undefined;
  if (!data) return;
  const port = event.ports?.[0];

  if (data.type === "end") {
    sessions.delete(data.id);
    return;
  }
  if (data.type !== "session") return;

  event.waitUntil(
    (async () => {
      try {
        // The salt and plaintext size live in the file's own header — fetch
        // just those 24 bytes rather than trusting anything from the page.
        const res = await fetch(data.url, {
          headers: { Range: `bytes=0-${HEADER_SIZE - 1}` },
        });
        if (!res.ok) throw new Error(`header fetch ${res.status}`);
        const hdr = parseEncHeader(new Uint8Array(await res.arrayBuffer()));
        sessions.set(data.id, {
          url: data.url,
          key: Uint8Array.from(data.key),
          hdr,
          mime: data.mime,
        });
        port?.postMessage({ type: "ready", id: data.id, size: hdr.plaintextSize });
      } catch (err) {
        port?.postMessage({ type: "failed", id: data.id, error: String(err) });
      }
    })(),
  );
});

function parseRange(header: string | null, size: number): { a: number; b: number } | null | "bad" {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m) return "bad";
  const [, rawStart, rawEnd] = m;
  if (rawStart === "" && rawEnd === "") return "bad";
  let a: number;
  let b: number;
  if (rawStart === "") {
    const n = Number(rawEnd);
    if (!(n > 0)) return "bad";
    a = Math.max(0, size - n);
    b = size - 1;
  } else {
    a = Number(rawStart);
    b = rawEnd === "" ? size - 1 : Math.min(Number(rawEnd), size - 1);
  }
  if (!(a >= 0 && a <= b && b < size)) return "bad";
  return { a, b };
}

async function serve(session: Session, req: Request): Promise<Response> {
  const size = session.hdr.plaintextSize;
  const parsed = parseRange(req.headers.get("range"), size);
  if (parsed === "bad") {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${size}`, "Accept-Ranges": "bytes" },
    });
  }

  const a = parsed ? parsed.a : 0;
  const b = parsed ? parsed.b : size - 1;
  const span = ciphertextRangeFor(a, b + 1, session.hdr);

  const ctRes = await fetch(session.url, {
    headers: { Range: `bytes=${span.ctStart}-${span.ctEnd - 1}` },
  });
  // 206 is expected; a 200 means the relay ignored Range and sent everything,
  // in which case the slice we need still starts at ctStart.
  if (!ctRes.ok) return new Response(null, { status: 502 });
  let ct = new Uint8Array(await ctRes.arrayBuffer());
  if (ctRes.status === 200) ct = ct.subarray(span.ctStart, span.ctEnd);

  const plain = await decryptRange(
    ct,
    session.key,
    session.hdr,
    a,
    b + 1,
    span.firstRecord,
    span.ctStart,
  );

  const headers: Record<string, string> = {
    "Content-Type": session.mime,
    "Content-Length": String(plain.length),
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-store",
  };
  if (parsed) headers["Content-Range"] = `bytes ${a}-${b}/${size}`;
  return new Response(plain as unknown as BodyInit, {
    status: parsed ? 206 : 200,
    headers,
  });
}

self.addEventListener("fetch", (event: FetchEvent) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(PREFIX)) return;
  const id = url.pathname.slice(PREFIX.length);
  const session = sessions.get(id);
  // An unknown id means the worker was restarted and lost its keys; the page
  // re-handshakes on controllerchange, so a plain 503 is the right signal.
  if (!session) {
    event.respondWith(new Response("no session", { status: 503 }));
    return;
  }
  event.respondWith(
    serve(session, event.request).catch(
      () => new Response("decrypt failed", { status: 500 }),
    ),
  );
});
