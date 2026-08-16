// End-to-end encryption for web cloud transfers (Firefox-Send-style).
//
// The sender generates a random AES-256-GCM key in the browser, encrypts the
// file, and uploads only ciphertext. The key rides in the share link's URL
// fragment (#k=…) — fragments are never sent to the server, so we store opaque
// bytes and never hold the key. The recipient reads the key from the fragment,
// streams the ciphertext back, and decrypts locally. The server is oblivious:
// no API change, ciphertext is just bytes in R2.
//
// Container format ("BSE2" v1):
//   header (24 bytes):
//     [0..4)  magic  = "BSE2"
//     [4]     version = 1
//     [5..8)  reserved (0)
//     [8..12) salt (4 random bytes, per file — folded into every nonce)
//     [12..16) recordSize (uint32 BE, plaintext bytes per record)
//     [16..24) plaintextSize (uint64 BE — lets the reader derive record count
//              and the last record's length, and detect truncation)
//   then back-to-back records, record i:
//     ciphertext = AES-GCM(plaintext[i*RS … ], iv = salt ‖ u64(i), aad = u32(i))
//     (each record's ciphertext is its plaintext length + 16-byte tag)
//
// The record index in BOTH the nonce and the AAD makes every record's nonce
// unique and pins its position, so a reordered/removed/duplicated record fails
// authentication. plaintextSize in the header pins the total, so a truncated
// tail is detected before the reader claims success.

export const MAGIC = new Uint8Array([0x42, 0x53, 0x45, 0x32]); // "BSE2"
export const VERSION = 1;
export const HEADER_SIZE = 24;
export const TAG_SIZE = 16;
export const RECORD_SIZE = 1024 * 1024; // 1 MiB plaintext per record
const KEY_BYTES = 32; // AES-256

// ── Key helpers ──────────────────────────────────────────────────────────

export interface GeneratedKey {
  key: CryptoKey;
  raw: Uint8Array; // 32 raw bytes — encode into the link fragment
}

export async function generateKey(): Promise<GeneratedKey> {
  const raw = new Uint8Array(KEY_BYTES);
  crypto.getRandomValues(raw);
  const key = await importKey(raw);
  return { key, raw };
}

export async function importKey(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", toArrayBuffer(raw), { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/** URL-safe base64 (no padding) — goes in the link fragment after `#k=`. */
export function encodeKey(raw: Uint8Array): string {
  let bin = "";
  for (const b of raw) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeKey(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Read the transfer key from a location hash like `#k=<base64url>`. */
export function keyFromHash(hash: string): Uint8Array | null {
  const m = /[#&]k=([A-Za-z0-9\-_]+)/.exec(hash);
  if (!m) return null;
  try {
    const raw = decodeKey(m[1]!);
    return raw.length === KEY_BYTES ? raw : null;
  } catch {
    return null;
  }
}

// ── Size math (deterministic — lets us reserve the multipart upload) ─────────

export function recordCount(plaintextSize: number): number {
  return Math.max(1, Math.ceil(plaintextSize / RECORD_SIZE));
}

/** Exact ciphertext length for a plaintext of `plaintextSize` bytes. */
export function ciphertextSize(plaintextSize: number): number {
  return HEADER_SIZE + plaintextSize + recordCount(plaintextSize) * TAG_SIZE;
}

/**
 * Inverse of [ciphertextSize]: the largest plaintext whose ciphertext still
 * fits in `maxCiphertext`. The uploader reserves the transfer by CIPHERTEXT
 * size, so validating a picked file against the raw plan limit lets a file
 * within one header+tags of the ceiling through, only to be rejected mid-flight
 * with a bare 413. Estimate, then walk down the boundary — record count is a
 * step function, so a closed form can overshoot by one record's tag.
 */
export function maxPlaintextFor(maxCiphertext: number): number {
  let p = Math.floor(((maxCiphertext - HEADER_SIZE) * RECORD_SIZE) / (RECORD_SIZE + TAG_SIZE));
  if (p <= 0) return 0;
  while (p > 0 && ciphertextSize(p) > maxCiphertext) p--;
  return p;
}

// ── Encrypt (sender) ─────────────────────────────────────────────────────

function buildHeader(salt: Uint8Array, plaintextSize: number): Uint8Array {
  const h = new Uint8Array(HEADER_SIZE);
  h.set(MAGIC, 0);
  h[4] = VERSION;
  h.set(salt, 8);
  const dv = new DataView(h.buffer);
  dv.setUint32(12, RECORD_SIZE, false);
  dv.setBigUint64(16, BigInt(plaintextSize), false);
  return h;
}

function nonceFor(salt: Uint8Array, index: number): Uint8Array {
  const iv = new Uint8Array(12);
  iv.set(salt, 0);
  new DataView(iv.buffer).setBigUint64(4, BigInt(index), false);
  return iv;
}

function aadFor(index: number): Uint8Array {
  const aad = new Uint8Array(4);
  new DataView(aad.buffer).setUint32(0, index, false);
  return aad;
}

/**
 * On-demand ciphertext for a plaintext File. `slice(start, end)` returns exactly
 * the ciphertext bytes in that half-open range — so the multipart uploader can
 * PUT fixed-size parts without ever holding the whole ciphertext in memory, and
 * a failed part just re-slices (encryption is deterministic for a given key).
 */
export class EncryptedSource {
  readonly size: number;
  private readonly header: Uint8Array;
  private readonly records: number;
  // Tiny 1-record cache: a record straddling a part boundary is requested by two
  // consecutive parts; caching the last one avoids re-encrypting it.
  private cacheIndex = -1;
  private cacheCt: Uint8Array | null = null;

  constructor(
    private readonly file: File,
    private readonly key: CryptoKey,
    private readonly salt: Uint8Array,
  ) {
    this.size = ciphertextSize(file.size);
    this.header = buildHeader(salt, file.size);
    this.records = recordCount(file.size);
  }

  /** Ciphertext offset where record `i` begins (records are all RS+TAG except
   *  possibly the last, but every record before it is exactly RS+TAG so the
   *  start offset formula is uniform). */
  private recordOffset(i: number): number {
    return HEADER_SIZE + i * (RECORD_SIZE + TAG_SIZE);
  }

  private async record(i: number): Promise<Uint8Array> {
    if (i === this.cacheIndex && this.cacheCt) return this.cacheCt;
    const start = i * RECORD_SIZE;
    const end = Math.min(start + RECORD_SIZE, this.file.size);
    const plain = new Uint8Array(await this.file.slice(start, end).arrayBuffer());
    const ct = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: toArrayBuffer(nonceFor(this.salt, i)), additionalData: toArrayBuffer(aadFor(i)) },
        this.key,
        toArrayBuffer(plain),
      ),
    );
    this.cacheIndex = i;
    this.cacheCt = ct;
    return ct;
  }

  // Returns a view over its own ArrayBuffer (not SharedArrayBuffer), so the
  // uploader can hand it straight to XHR without wrapping it in a Blob.
  async slice(start: number, end: number): Promise<Uint8Array<ArrayBuffer>> {
    const out = new Uint8Array(end - start);
    let cursor = start;

    // Header portion.
    if (cursor < HEADER_SIZE) {
      const hEnd = Math.min(end, HEADER_SIZE);
      out.set(this.header.subarray(cursor, hEnd), cursor - start);
      cursor = hEnd;
    }

    // Record portions.
    while (cursor < end) {
      const i = Math.floor((cursor - HEADER_SIZE) / (RECORD_SIZE + TAG_SIZE));
      if (i >= this.records) break;
      const recStart = this.recordOffset(i);
      const ct = await this.record(i);
      const within = cursor - recStart; // offset into this record's ciphertext
      const take = Math.min(ct.length - within, end - cursor);
      out.set(ct.subarray(within, within + take), cursor - start);
      cursor += take;
    }

    return out;
  }
}

// ── Decrypt (recipient) ──────────────────────────────────────────────────

/** Pulls exact byte counts out of a ReadableStream, buffering across reads. */
class ByteStreamReader {
  private reader: ReadableStreamDefaultReader<Uint8Array>;
  private buf: Uint8Array[] = [];
  private buffered = 0;
  private done = false;

  constructor(stream: ReadableStream<Uint8Array>) {
    this.reader = stream.getReader();
  }

  private async fill(): Promise<void> {
    while (!this.done && this.buffered < 1) {
      const { value, done } = await this.reader.read();
      if (done) {
        this.done = true;
        break;
      }
      if (value && value.length) {
        this.buf.push(value);
        this.buffered += value.length;
      }
    }
  }

  /** Read up to `n` bytes; returns fewer only at end of stream. */
  async read(n: number): Promise<Uint8Array> {
    while (this.buffered < n && !this.done) {
      const { value, done } = await this.reader.read();
      if (done) {
        this.done = true;
        break;
      }
      if (value && value.length) {
        this.buf.push(value);
        this.buffered += value.length;
      }
    }
    const want = Math.min(n, this.buffered);
    const out = new Uint8Array(want);
    let filled = 0;
    while (filled < want) {
      const head = this.buf[0]!;
      const take = Math.min(head.length, want - filled);
      out.set(head.subarray(0, take), filled);
      filled += take;
      if (take === head.length) this.buf.shift();
      else this.buf[0] = head.subarray(take);
      this.buffered -= take;
    }
    return out;
  }

  /** True once the stream is drained and buffers are empty. */
  async atEnd(): Promise<boolean> {
    await this.fill();
    return this.buffered === 0 && this.done;
  }

  cancel(): void {
    this.reader.cancel().catch(() => {});
  }
}

export class DecryptError extends Error {}

/**
 * Stream-decrypt ciphertext from `stream`, calling `onPlain` with each decrypted
 * record's bytes in order (write them to disk or collect them). `onProgress`
 * reports plaintext bytes produced so far. Throws DecryptError on a bad
 * key/format/tamper (GCM auth failure) or a truncated stream.
 */
export async function decryptStream(
  stream: ReadableStream<Uint8Array>,
  rawKey: Uint8Array,
  onPlain: (chunk: Uint8Array) => Promise<void> | void,
  onProgress?: (plainBytes: number) => void,
): Promise<void> {
  const key = await importKey(rawKey);
  const r = new ByteStreamReader(stream);
  try {
    const header = await r.read(HEADER_SIZE);
    if (header.length !== HEADER_SIZE) throw new DecryptError("truncated header");
    for (let i = 0; i < MAGIC.length; i++) {
      if (header[i] !== MAGIC[i]) throw new DecryptError("not an encrypted file");
    }
    if (header[4] !== VERSION) throw new DecryptError("unsupported version");
    const salt = header.subarray(8, 12);
    const dv = new DataView(header.buffer, header.byteOffset, header.byteLength);
    const recordSize = dv.getUint32(12, false);
    const plaintextSize = Number(dv.getBigUint64(16, false));
    const total = Math.max(1, Math.ceil(plaintextSize / recordSize));

    let produced = 0;
    for (let i = 0; i < total; i++) {
      const plainLen = Math.min(recordSize, plaintextSize - i * recordSize);
      const ct = await r.read(plainLen + TAG_SIZE);
      if (ct.length !== plainLen + TAG_SIZE) throw new DecryptError("truncated stream");
      let plain: ArrayBuffer;
      try {
        plain = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv: toArrayBuffer(nonceFor(salt, i)), additionalData: toArrayBuffer(aadFor(i)) },
          key,
          toArrayBuffer(ct),
        );
      } catch {
        throw new DecryptError("decryption failed — wrong key or corrupted file");
      }
      await onPlain(new Uint8Array(plain));
      produced += plain.byteLength;
      onProgress?.(produced);
    }
    if (!(await r.atEnd())) throw new DecryptError("unexpected trailing data");
  } finally {
    r.cancel();
  }
}

// ── Random access (receiver) ──────────────────────────────────────────────
//
// Because a record's nonce and AAD come from its INDEX rather than from a
// running stream state, any record decrypts on its own. That is what lets the
// streaming worker answer a Range request by touching only the records that
// actually cover it, instead of decrypting from byte zero every time.

/** The header fields random access needs. */
export interface EncHeader {
  salt: Uint8Array;
  recordSize: number;
  plaintextSize: number;
}

/** Parse (and validate) the 24-byte header. Throws DecryptError if it isn't ours. */
export function parseEncHeader(h: Uint8Array): EncHeader {
  if (h.length < HEADER_SIZE) throw new DecryptError("truncated header");
  for (let i = 0; i < MAGIC.length; i++) {
    if (h[i] !== MAGIC[i]) throw new DecryptError("not an encrypted file");
  }
  if (h[4] !== VERSION) throw new DecryptError(`unsupported version ${h[4]}`);
  const dv = new DataView(h.buffer, h.byteOffset, HEADER_SIZE);
  const recordSize = dv.getUint32(12, false);
  if (recordSize <= 0) throw new DecryptError("bad record size");
  return {
    salt: h.subarray(8, 12),
    recordSize,
    plaintextSize: Number(dv.getBigUint64(16, false)),
  };
}

/** Ciphertext offset where record `i` starts. */
export function recordOffsetOf(i: number, recordSize: number): number {
  return HEADER_SIZE + i * (recordSize + TAG_SIZE);
}

/**
 * The ciphertext span that must be fetched to serve plaintext `[a, b)`, plus
 * the index of the first record in it. Over-reads by at most one record at each
 * edge, which is nothing next to a media seek.
 */
export function ciphertextRangeFor(
  a: number,
  b: number,
  hdr: EncHeader,
): { ctStart: number; ctEnd: number; firstRecord: number } {
  const { recordSize, plaintextSize } = hdr;
  const firstRecord = Math.floor(a / recordSize);
  const lastRecord = Math.floor((b - 1) / recordSize);
  const plainLenOfLast = Math.min(recordSize, plaintextSize - lastRecord * recordSize);
  return {
    firstRecord,
    ctStart: recordOffsetOf(firstRecord, recordSize),
    ctEnd: recordOffsetOf(lastRecord, recordSize) + plainLenOfLast + TAG_SIZE, // exclusive
  };
}

/**
 * Decrypt the records inside `ct` (which begins at ciphertext offset `ctStart`,
 * holding records from `firstRecord` onward) and return exactly plaintext
 * `[a, b)`. Every record is still checked against its own GCM tag, so tampering
 * fails here exactly as it does in the sequential path.
 */
export async function decryptRange(
  ct: Uint8Array,
  rawKey: Uint8Array,
  hdr: EncHeader,
  a: number,
  b: number,
  firstRecord: number,
  ctStart: number,
): Promise<Uint8Array> {
  const key = await importKey(rawKey);
  const { salt, recordSize, plaintextSize } = hdr;
  const out = new Uint8Array(b - a);
  let written = 0;
  const lastRecord = Math.floor((b - 1) / recordSize);

  for (let i = firstRecord; i <= lastRecord; i++) {
    const plainLen = Math.min(recordSize, plaintextSize - i * recordSize);
    const off = recordOffsetOf(i, recordSize) - ctStart;
    const rec = ct.subarray(off, off + plainLen + TAG_SIZE);
    if (rec.length !== plainLen + TAG_SIZE) throw new DecryptError("short ciphertext range");
    let dec: Uint8Array;
    try {
      dec = new Uint8Array(
        await crypto.subtle.decrypt(
          {
            name: "AES-GCM",
            iv: toArrayBuffer(nonceFor(salt, i)),
            additionalData: toArrayBuffer(aadFor(i)),
          },
          key,
          toArrayBuffer(rec),
        ),
      );
    } catch {
      throw new DecryptError("wrong key or corrupted data");
    }
    // Trim the edge records down to the requested span.
    const recStart = i * recordSize;
    const from = Math.max(0, a - recStart);
    const to = Math.min(dec.length, b - recStart);
    out.set(dec.subarray(from, to), written);
    written += to - from;
  }
  if (written !== out.length) throw new DecryptError("range assembly mismatch");
  return out;
}

// ── util ──────────────────────────────────────────────────────────────────

/** WebCrypto wants an ArrayBuffer, not a Uint8Array view over a larger buffer. */
function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  return u8.byteOffset === 0 && u8.byteLength === u8.buffer.byteLength
    ? (u8.buffer as ArrayBuffer)
    : (u8.slice().buffer as ArrayBuffer);
}
