// QR Beam — offline file transfer over an animated stream of QR codes.
//
// When there's no Wi-Fi, hotspot, or Bluetooth, the sender's screen displays a
// looping sequence of QR frames and the receiver's camera scans them until it
// has every chunk, then reassembles the file. It's purely optical (screen →
// camera), so it works with no radios at all. Throughput is small, so this is
// for small payloads (text, keys, small docs), not media.
//
// ── Wire format v1 (must stay byte-identical across web + Flutter so any device
//    can beam to any other) ──────────────────────────────────────────────────
// Every frame is an ASCII string (QR byte-mode is decoded as text by scanners,
// so we keep frames text-safe by base64url-encoding all binary).
//
//   Header frame:  "BB1H" + base64url(JSON({ v:1, id, n:name, m:mime, s:size,
//                                             t:total, c:chunkSize }))
//   Data frame:    "BB1D" + <id:6 hex> + <index:6 hex> + base64url(chunkBytes)
//
// `id` is a 6-hex-char transfer id (3 random bytes) shared by all frames of one
// file. `index` is the 0-based chunk number (6 hex → up to 16M chunks). The
// sender loops [header, data0, data1, …] forever; the receiver collects unique
// indices until it has `total` of them, then concatenates in index order.

export const MAGIC = "BB1";
export const DEFAULT_CHUNK_BYTES = 600; // raw bytes/chunk (~800 b64 chars → scannable QR)

export interface BeamMeta {
  id: string;
  name: string;
  mime: string;
  size: number;
  total: number;
  chunkSize: number;
}

// ── base64url (no padding) ──────────────────────────────────────────────────
function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function hex(n: number, width: number): string {
  return n.toString(16).padStart(width, "0");
}

// ── Encode (sender) ─────────────────────────────────────────────────────────

/** Build the full frame list for a payload. frames[0] is the header; the rest
 *  are data frames in index order. The sender loops this list on screen. */
export function encodeBeam(
  bytes: Uint8Array,
  opts: { name: string; mime: string; id?: string; chunkSize?: number },
): { frames: string[]; meta: BeamMeta } {
  const chunkSize = opts.chunkSize ?? DEFAULT_CHUNK_BYTES;
  const total = Math.max(1, Math.ceil(bytes.length / chunkSize));
  const id = opts.id ?? randomId();
  const meta: BeamMeta = {
    id,
    name: opts.name,
    mime: opts.mime || "application/octet-stream",
    size: bytes.length,
    total,
    chunkSize,
  };

  const header =
    MAGIC + "H" + b64urlEncode(new TextEncoder().encode(JSON.stringify({
      v: 1, id, n: meta.name, m: meta.mime, s: meta.size, t: total, c: chunkSize,
    })));

  const frames: string[] = [header];
  for (let i = 0; i < total; i++) {
    const chunk = bytes.subarray(i * chunkSize, Math.min((i + 1) * chunkSize, bytes.length));
    // "BB1D" + id(6 hex) + index(6 hex) + base64url(chunk)
    frames.push(MAGIC + "D" + id + hex(i, 6) + b64urlEncode(chunk));
  }
  return { frames, meta };
}

function randomId(): string {
  const b = new Uint8Array(3);
  crypto.getRandomValues(b);
  return hex((b[0]! << 16) | (b[1]! << 8) | b[2]!, 6);
}

// ── Decode (receiver) ───────────────────────────────────────────────────────

export class BeamCollector {
  meta: BeamMeta | null = null;
  private chunks = new Map<number, Uint8Array>();

  /** True once the header and every data chunk have been captured. */
  get complete(): boolean {
    return this.meta !== null && this.chunks.size >= this.meta.total;
  }

  /** Fraction 0..1 of chunks captured (0 until the header arrives). */
  get progress(): number {
    if (!this.meta) return 0;
    return Math.min(1, this.chunks.size / this.meta.total);
  }

  get received(): number {
    return this.chunks.size;
  }

  /** Feed a scanned frame string. Returns true if it was a valid, new frame. */
  add(frame: string): boolean {
    if (!frame.startsWith(MAGIC)) return false;
    const type = frame[MAGIC.length];
    const body = frame.slice(MAGIC.length + 1);
    try {
      if (type === "H") {
        if (this.meta) return false; // already have it
        const json = JSON.parse(new TextDecoder().decode(b64urlDecode(body))) as Record<string, unknown>;
        this.meta = {
          id: String(json.id),
          name: String(json.n ?? "file"),
          mime: String(json.m ?? "application/octet-stream"),
          size: Number(json.s ?? 0),
          total: Number(json.t ?? 0),
          chunkSize: Number(json.c ?? DEFAULT_CHUNK_BYTES),
        };
        return this.meta.total > 0;
      }
      if (type === "D") {
        const id = body.slice(0, 6);
        const index = parseInt(body.slice(6, 12), 16);
        if (this.meta && id !== this.meta.id) return false; // different transfer
        if (Number.isNaN(index) || this.chunks.has(index)) return false;
        this.chunks.set(index, b64urlDecode(body.slice(12)));
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  /** Reassemble the file once complete(); throws otherwise. */
  assemble(): { bytes: Uint8Array; meta: BeamMeta } {
    if (!this.meta || !this.complete) throw new Error("beam not complete");
    const out = new Uint8Array(this.meta.size);
    let offset = 0;
    for (let i = 0; i < this.meta.total; i++) {
      const c = this.chunks.get(i);
      if (!c) throw new Error(`missing chunk ${i}`);
      out.set(c, offset);
      offset += c.length;
    }
    return { bytes: out, meta: this.meta };
  }
}
