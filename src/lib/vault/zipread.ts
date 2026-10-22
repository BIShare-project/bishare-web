// Reading a zip in the browser for previews: the list of what is inside an
// archive, and single entries out of Office files (pptx, odp). The central
// directory only, stored and deflated entries, the browser's own inflate.

export interface ZipEntry {
  name: string;
  size: number;
  compressedSize: number;
  method: number;
  offset: number;
  dir: boolean;
  mtimeMs: number;
}

const u16 = (b: Uint8Array, i: number) => b[i]! | (b[i + 1]! << 8);
const u32 = (b: Uint8Array, i: number) => (b[i]! | (b[i + 1]! << 8) | (b[i + 2]! << 16) | (b[i + 3]! << 24)) >>> 0;

function dosTime(date: number, time: number): number {
  const y = ((date >> 9) & 0x7f) + 1980;
  const mo = ((date >> 5) & 0x0f) - 1;
  const d = date & 0x1f;
  return new Date(y, mo, d, (time >> 11) & 0x1f, (time >> 5) & 0x3f, (time & 0x1f) * 2).getTime();
}

/** The entries of the zip in [bytes], or null when it is not one this reader understands. */
export function zipEntries(bytes: Uint8Array): ZipEntry[] | null {
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65_557); i--) {
    if (u32(bytes, i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return null;
  const count = u16(bytes, eocd + 10);
  let at = u32(bytes, eocd + 16);
  const names = new TextDecoder();
  const out: ZipEntry[] = [];
  for (let n = 0; n < count && at + 46 <= bytes.length; n++) {
    if (u32(bytes, at) !== 0x02014b50) return out.length ? out : null;
    const method = u16(bytes, at + 10);
    const time = u16(bytes, at + 12);
    const date = u16(bytes, at + 14);
    const compressedSize = u32(bytes, at + 20);
    const size = u32(bytes, at + 24);
    const nameLen = u16(bytes, at + 28);
    const extraLen = u16(bytes, at + 30);
    const commentLen = u16(bytes, at + 32);
    const offset = u32(bytes, at + 42);
    const name = names.decode(bytes.subarray(at + 46, at + 46 + nameLen));
    out.push({ name, size, compressedSize, method, offset, dir: name.endsWith("/"), mtimeMs: dosTime(date, time) });
    at += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

/** The bytes of one entry (stored or deflated). */
export async function zipRead(bytes: Uint8Array, e: ZipEntry): Promise<Uint8Array> {
  if (u32(bytes, e.offset) !== 0x04034b50) throw new Error("bad local header");
  const start = e.offset + 30 + u16(bytes, e.offset + 26) + u16(bytes, e.offset + 28);
  const raw = bytes.subarray(start, start + e.compressedSize);
  if (e.method === 0) return raw;
  if (e.method !== 8) throw new Error(`zip method ${e.method}`);
  const stream = new Blob([raw as Uint8Array<ArrayBuffer>]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
