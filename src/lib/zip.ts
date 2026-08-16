/**
 * A store-only (uncompressed) ZIP builder that never holds the archive in
 * memory.
 *
 * Two decisions carry this file:
 *
 * **No compression.** What people actually send in bulk — photos, video, audio,
 * already-compressed documents — gains a percent or two from DEFLATE while
 * costing a full pass of CPU over every byte. Storing verbatim is the honest
 * trade for a transfer tool.
 *
 * **That is also what makes it scale.** Because the file bytes appear in the
 * archive unchanged, the result can be assembled as a `Blob` whose parts are the
 * small headers plus the ORIGINAL `File` objects. The browser keeps file-backed
 * parts as references to disk, so a 10 GB archive costs kilobytes of memory, and
 * the uploader's `slice()` reads through to disk lazily.
 *
 * The one unavoidable cost is CRC-32: the format demands it up front, so every
 * file is read once (in chunks, never held whole) before the archive exists.
 *
 * ZIP64 is emitted whenever a file, the archive, or the entry count outgrows the
 * classic 32-bit fields — not optional here, since a single transfer may reach
 * 10 GB.
 */

const U32_MAX = 0xffffffff;
const U16_MAX = 0xffff;
const CRC_CHUNK = 4 * 1024 * 1024;

// ── CRC-32 ────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32Update(crc: number, bytes: Uint8Array): number {
  let c = crc ^ 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]!) & 0xff]! ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/** CRC-32 of a blob, read in chunks so nothing large is ever resident. */
async function crc32OfBlob(blob: Blob, onChunk?: (n: number) => void): Promise<number> {
  let crc = 0;
  for (let off = 0; off < blob.size; off += CRC_CHUNK) {
    const slice = blob.slice(off, Math.min(off + CRC_CHUNK, blob.size));
    crc = crc32Update(crc, new Uint8Array(await slice.arrayBuffer()));
    onChunk?.(slice.size);
  }
  return crc;
}

// ── little-endian writer ──────────────────────────────────────────────────
class Writer {
  private readonly parts: number[] = [];
  u16(v: number) {
    this.parts.push(v & 0xff, (v >>> 8) & 0xff);
    return this;
  }
  u32(v: number) {
    this.parts.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff);
    return this;
  }
  /** 64-bit little-endian. Split into two 32-bit halves rather than using
   *  BigInt literals, which the app's compile target doesn't allow. */
  u64(v: number) {
    const lo = v >>> 0;
    const hi = Math.floor(v / 0x100000000) >>> 0;
    this.u32(lo);
    this.u32(hi);
    return this;
  }
  bytes(b: Uint8Array) {
    for (const x of b) this.parts.push(x);
    return this;
  }
  done(): Uint8Array<ArrayBuffer> {
    return Uint8Array.from(this.parts);
  }
}

/** MS-DOS time/date, which is what the format still speaks. */
function dosDateTime(ms: number): { time: number; date: number } {
  const d = new Date(ms);
  const year = Math.max(1980, d.getFullYear());
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

/**
 * Names inside the archive must be unique and must not carry a path that could
 * escape the extraction directory — a picked file's name is user data.
 */
function safeNames(files: File[]): string[] {
  const used = new Set<string>();
  return files.map((f) => {
    const base =
      (f.name || "file").split(/[\\/]/).pop()?.replace(/^\.+/, "") || "file";
    let name = base;
    let n = 1;
    while (used.has(name.toLowerCase())) {
      const dot = base.lastIndexOf(".");
      name =
        dot > 0 ? `${base.slice(0, dot)} (${n})${base.slice(dot)}` : `${base} (${n})`;
      n++;
    }
    used.add(name.toLowerCase());
    return name;
  });
}

export interface ZipProgress {
  /** Bytes hashed so far (the CRC pass), against the total to hash. */
  hashed: number;
  total: number;
}

/**
 * Build a store-only ZIP of `files`. The returned Blob references the original
 * files rather than copying them, so this stays cheap regardless of size.
 */
export async function buildStoreZip(
  files: File[],
  onProgress?: (p: ZipProgress) => void,
  /**
   * Testing seam. U32_MAX/U16_MAX are the format's SENTINELS as well as its
   * thresholds, so they can't be lowered to exercise ZIP64 — doing that
   * corrupts the very markers a reader looks for. This forces the branch
   * instead, which is the only way to test it without a 4 GB fixture.
   */
  forceZip64 = false,
): Promise<Blob> {
  const names = safeNames(files);
  const encoder = new TextEncoder();
  const total = files.reduce((s, f) => s + f.size, 0);
  let hashed = 0;

  const parts: BlobPart[] = [];
  const central: Uint8Array<ArrayBuffer>[] = [];
  let offset = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    const nameBytes = encoder.encode(names[i]!);
    const crc = await crc32OfBlob(file, (n) => {
      hashed += n;
      onProgress?.({ hashed, total });
    });
    const { time, date } = dosDateTime(file.lastModified || Date.now());
    // Per-entry ZIP64 whenever the size or this entry's offset overflows 32 bits.
    const needs64 = forceZip64 || file.size > U32_MAX || offset > U32_MAX;

    const extra = needs64
      ? new Writer()
          .u16(0x0001)
          .u16(16)
          .u64(file.size)
          .u64(file.size)
          .done()
      : new Uint8Array(0);

    const local = new Writer()
      .u32(0x04034b50)
      .u16(needs64 ? 45 : 20) // version needed
      .u16(0x0800) // UTF-8 names
      .u16(0) // method: store
      .u16(time)
      .u16(date)
      .u32(crc)
      .u32(needs64 ? U32_MAX : file.size) // compressed
      .u32(needs64 ? U32_MAX : file.size) // uncompressed
      .u16(nameBytes.length)
      .u16(extra.length)
      .bytes(nameBytes)
      .bytes(extra)
      .done();

    parts.push(local, file);

    const centralExtra = needs64
      ? new Writer()
          .u16(0x0001)
          .u16(24)
          .u64(file.size)
          .u64(file.size)
          .u64(offset)
          .done()
      : new Uint8Array(0);

    central.push(
      new Writer()
        .u32(0x02014b50)
        .u16(45) // version made by
        .u16(needs64 ? 45 : 20)
        .u16(0x0800)
        .u16(0)
        .u16(time)
        .u16(date)
        .u32(crc)
        .u32(needs64 ? U32_MAX : file.size)
        .u32(needs64 ? U32_MAX : file.size)
        .u16(nameBytes.length)
        .u16(centralExtra.length)
        .u16(0) // comment
        .u16(0) // disk
        .u16(0) // internal attrs
        .u32(0) // external attrs
        .u32(needs64 ? U32_MAX : offset)
        .bytes(nameBytes)
        .bytes(centralExtra)
        .done(),
    );

    offset += local.length + file.size;
  }

  const centralOffset = offset;
  const centralSize = central.reduce((s, c) => s + c.length, 0);
  for (const c of central) parts.push(c);

  // The archive itself needs ZIP64 once the directory sits past 4 GiB, is
  // bigger than 4 GiB, or holds more entries than a 16-bit count can express.
  const archive64 =
    forceZip64 ||
    centralOffset > U32_MAX ||
    centralSize > U32_MAX ||
    files.length > U16_MAX;

  if (archive64) {
    parts.push(
      new Writer()
        .u32(0x06064b50) // EOCD64
        .u64(44) // size of remaining record
        .u16(45)
        .u16(45)
        .u32(0)
        .u32(0)
        .u64(files.length)
        .u64(files.length)
        .u64(centralSize)
        .u64(centralOffset)
        .done(),
      new Writer()
        .u32(0x07064b50) // EOCD64 locator
        .u32(0)
        .u64(centralOffset + centralSize)
        .u32(1)
        .done(),
    );
  }

  parts.push(
    new Writer()
      .u32(0x06054b50) // EOCD
      .u16(0)
      .u16(0)
      .u16(archive64 ? U16_MAX : files.length)
      .u16(archive64 ? U16_MAX : files.length)
      .u32(archive64 ? U32_MAX : centralSize)
      .u32(archive64 ? U32_MAX : centralOffset)
      .u16(0)
      .done(),
  );

  return new Blob(parts, { type: "application/zip" });
}

/** A sensible archive name for a batch the user never named. */
export function zipNameFor(files: File[], fallback: string): string {
  if (files.length === 1) return `${files[0]!.name}.zip`;
  return fallback;
}
