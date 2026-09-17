// Receive staging for Nearby — incoming bytes land in the browser's private
// file system (OPFS) while the transfer runs, and are saved to a place the
// user picks only AFTER it finished.
//
// The order matters. Asking where to save first looks tidy, but on a phone
// the save dialog is the system file manager: the page goes hidden, the
// signaling socket is dropped within seconds, and the WebRTC answer that was
// waiting on the dialog never leaves. Staging keeps the page in front for the
// whole transfer and still never holds a multi-GB file in memory.

const DIR = "nearby-recv";
// A staged file nobody saved or discarded (tab closed, crash) is swept on a
// later visit. A day, because another open tab may still be holding one.
const STALE_MS = 24 * 60 * 60 * 1000;

// Minimal File System shapes (the save picker and OPFS async iteration are not
// in every TS lib target).
interface FsWritable {
  write: (data: BufferSource | Blob) => Promise<void>;
  close: () => Promise<void>;
  abort?: () => Promise<void>;
}
interface FsFileHandle {
  createWritable: () => Promise<FsWritable>;
  getFile: () => Promise<File>;
}
interface FsDirHandle {
  getDirectoryHandle: (name: string, opts?: { create?: boolean }) => Promise<FsDirHandle>;
  getFileHandle: (name: string, opts?: { create?: boolean }) => Promise<FsFileHandle>;
  removeEntry: (name: string) => Promise<void>;
  entries: () => AsyncIterable<[string, FsFileHandle]>;
}
type ShowSaveFilePicker = (opts?: { suggestedName?: string }) => Promise<FsFileHandle>;

export interface Stage {
  write: (buf: ArrayBuffer) => Promise<void>;
  /** Flush, and hand back the disk-backed file. */
  finish: () => Promise<File>;
  /** Delete the staged bytes — after a save, a discard, a cancel or a failure. */
  discard: () => Promise<void>;
}

function savePicker(): ShowSaveFilePicker | undefined {
  return (globalThis as unknown as { showSaveFilePicker?: ShowSaveFilePicker }).showSaveFilePicker;
}

/**
 * Staging is used only where the file can later be written to a picked
 * location. A browser whose one way to save is a blob download gives no signal
 * for when that download has finished reading, so the staged copy could never
 * be deleted safely — those keep the in-memory path.
 */
export function canStageToDisk(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.storage?.getDirectory === "function" &&
    !!savePicker()
  );
}

async function stagingDir(): Promise<FsDirHandle> {
  const root = (await navigator.storage.getDirectory()) as unknown as FsDirHandle;
  return root.getDirectoryHandle(DIR, { create: true });
}

let swept = false;
async function sweepStale(dir: FsDirHandle): Promise<void> {
  if (swept) return;
  swept = true;
  const cutoff = Date.now() - STALE_MS;
  try {
    for await (const [name, handle] of dir.entries()) {
      const file = await handle.getFile().catch(() => null);
      if (file && file.lastModified < cutoff) await dir.removeEntry(name).catch(() => {});
    }
  } catch {
    /* best-effort */
  }
}

/** Open a staging file; null when this browser can't (caller falls back to memory). */
export async function openStage(): Promise<Stage | null> {
  if (!canStageToDisk()) return null;
  try {
    const dir = await stagingDir();
    void sweepStale(dir);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.part`;
    const handle = await dir.getFileHandle(name, { create: true });
    let writable: FsWritable | null = await handle.createWritable();
    let gone = false;
    return {
      write: (buf) => {
        if (!writable) return Promise.reject(new Error("stage closed"));
        return writable.write(buf);
      },
      finish: async () => {
        const w = writable;
        writable = null;
        await w?.close();
        return handle.getFile();
      },
      discard: async () => {
        if (gone) return;
        gone = true;
        const w = writable;
        writable = null;
        await w?.abort?.().catch(() => {});
        await dir.removeEntry(name).catch(() => {});
      },
    };
  } catch {
    return null; // private mode, no quota, storage blocked
  }
}

/**
 * Copy a received file to a location the user picks. MUST be called straight
 * from a click: the picker needs the tap's user activation, so it runs before
 * the first await. Resolves false when the user dismissed the dialog.
 */
export async function saveToPickedLocation(
  file: Blob,
  suggestedName: string,
  onProgress?: (written: number) => void,
): Promise<boolean> {
  const picker = savePicker();
  if (!picker) throw new Error("no save picker");
  let handle: FsFileHandle;
  try {
    handle = await picker({ suggestedName });
  } catch {
    return false;
  }
  const writable = await handle.createWritable();
  try {
    let written = 0;
    const reader = file.stream().getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      await writable.write(value);
      written += value.byteLength;
      onProgress?.(written);
    }
    await writable.close();
    return true;
  } catch (e) {
    await writable.abort?.().catch(() => {});
    throw e;
  }
}
