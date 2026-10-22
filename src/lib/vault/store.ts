// The web Drive's index (drive-plan.md task 6.2): every object of the vault
// with its metadata opened in this browser, pulled from the server's change
// feed the way the app's VaultSync does. Names never leave the browser
// unsealed; search runs here.
import { DriveApiError, type DeviceRow, type DriveClient, type ObjectRow, type VaultInfo } from "./client";
import { metaKey, openDeviceName, openMeta, type ObjectMeta } from "./crypto";

export interface DriveObject extends ObjectMeta {
  id: string;
  /** Stored bytes on the server (the sealed blob), when the object has one. */
  blobSize: number | null;
  hasThumb: boolean;
  seq: number;
  createdAt: number;
  trashedAt: number | null;
}

export interface DriveDevice extends DeviceRow {
  /** The name opened with K_meta, or null. */
  name: string | null;
}

type Listener = () => void;

export class DriveIndex {
  private objects = new Map<string, DriveObject>();
  private kMeta: Uint8Array | null = null;
  private listeners = new Set<Listener>();
  private pulling: Promise<void> | null = null;
  private version = 0;
  seq = 0;
  info: VaultInfo | null = null;
  devices: DriveDevice[] = [];
  /** Objects whose metadata did not open (a damaged or foreign row). */
  unreadable = 0;
  lastPulledAt: number | null = null;

  constructor(
    private client: DriveClient,
    private vaultId: string,
    private vaultKey: Uint8Array
  ) {}

  subscribe = (l: Listener): (() => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };

  /** Changes every time the index does (for useSyncExternalStore). */
  snapshot = (): number => this.version;

  private emit(): void {
    this.version++;
    for (const l of this.listeners) l();
  }

  private async key(): Promise<Uint8Array> {
    return (this.kMeta ??= await metaKey(this.vaultKey));
  }

  /** Bring the index up to the server; calls made meanwhile join it. */
  pull(): Promise<void> {
    return (this.pulling ??= this.pullOnce().finally(() => {
      this.pulling = null;
    }));
  }

  private async pullOnce(): Promise<void> {
    const k = await this.key();
    this.info = await this.client.info();
    let full = this.seq === 0;
    for (;;) {
      const page = await this.client.changes(this.seq, full);
      if (page.resync) {
        this.objects.clear();
        this.seq = 0;
        full = true;
        continue;
      }
      for (const row of page.objects) await this.apply(k, row);
      this.seq = page.seq;
      if (!page.more) break;
    }
    this.devices = await Promise.all(
      this.info.devices
        .filter((d) => d.status !== "revoked")
        .map(async (d) => ({ ...d, name: d.encName ? await openDeviceName(k, this.vaultId, d.id, d.encName).catch(() => null) : null }))
    );
    this.lastPulledAt = Date.now();
    this.emit();
  }

  private async apply(k: Uint8Array, row: ObjectRow): Promise<void> {
    if (row.deleted || !row.encMeta) {
      this.objects.delete(row.id);
      return;
    }
    try {
      const meta = await openMeta(k, this.vaultId, row.id, row.encMeta);
      this.objects.set(row.id, {
        ...meta,
        id: row.id,
        blobSize: row.size,
        hasThumb: row.hasThumb,
        seq: row.seq,
        createdAt: row.createdAt,
        trashedAt: row.trashedAt,
      });
    } catch {
      this.unreadable++;
    }
  }

  // ---- reading ------------------------------------------------------------------------------

  get(id: string): DriveObject | undefined {
    return this.objects.get(id);
  }

  all(): DriveObject[] {
    return [...this.objects.values()];
  }

  /** Live objects (not in the trash, nor under a trashed folder). */
  live(): DriveObject[] {
    return this.all().filter((o) => !this.inTrash(o));
  }

  inTrash(o: DriveObject): boolean {
    for (let cur: DriveObject | undefined = o, guard = 0; cur && guard < 64; guard++) {
      if (cur.trashedAt !== null) return true;
      cur = cur.parent ? this.objects.get(cur.parent) : undefined;
    }
    return false;
  }

  children(parent: string | null): DriveObject[] {
    return this.live().filter((o) => o.parent === parent);
  }

  /** The top of each trashed tree: a trashed folder shows once. */
  trash(): DriveObject[] {
    return this.all().filter((o) => o.trashedAt !== null && !(o.parent && this.objects.get(o.parent)?.trashedAt != null));
  }

  /** The folders from the top down to [id] (not included). */
  pathTo(id: string | null): DriveObject[] {
    const out: DriveObject[] = [];
    let cur = id ? this.objects.get(id) : undefined;
    for (let guard = 0; cur && guard < 64; guard++) {
      out.unshift(cur);
      cur = cur.parent ? this.objects.get(cur.parent) : undefined;
    }
    return out;
  }

  /** Files and folders under [id] at any depth (live ones). */
  countUnder(id: string): number {
    return this.live().filter((o) => o.parent === id).length;
  }

  /** Bytes of a file, or of every file under a folder at any depth (trashed ones too). */
  treeSize(id: string): number {
    const o = this.objects.get(id);
    if (!o) return 0;
    if (o.kind === "file") return o.size ?? 0;
    let total = 0;
    for (const c of this.objects.values()) if (c.parent === id) total += this.treeSize(c.id);
    return total;
  }

  search(query: string, limit = 50): DriveObject[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return this.live()
      .filter((o) => o.name.toLowerCase().includes(q))
      .sort((a, b) => b.mtimeMs - a.mtimeMs)
      .slice(0, limit);
  }

  stats() {
    const live = this.live();
    const files = live.filter((o) => o.kind === "file");
    const bytes = (pred: (o: DriveObject) => boolean) => files.filter(pred).reduce((a, o) => a + (o.size ?? 0), 0);
    const isMedia = (o: DriveObject) => !!o.mime && (o.mime.startsWith("image/") || o.mime.startsWith("video/"));
    const isDoc = (o: DriveObject) => !!o.mime && (o.mime.startsWith("text/") || DOC_TYPES.includes(o.mime));
    const isAudio = (o: DriveObject) => !!o.mime && o.mime.startsWith("audio/");
    const trashed = this.all().filter((o) => o.kind === "file" && this.inTrash(o));
    return {
      files: files.length,
      folders: live.length - files.length,
      media: files.filter(isMedia).length,
      byKind: {
        media: bytes(isMedia),
        documents: bytes(isDoc),
        audio: bytes(isAudio),
        other: bytes((o) => !isMedia(o) && !isDoc(o) && !isAudio(o)),
        trash: trashed.reduce((a, o) => a + (o.size ?? 0), 0),
      },
      trashItems: this.trash().length,
    };
  }
}

export const DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",
  "application/rtf",
  "application/epub+zip",
  "application/json",
  "application/xml",
];

/** Removed or expired on the server: the browser must sign in again. */
export function isLockedOut(e: unknown): boolean {
  return e instanceof DriveApiError && (e.status === 401 || e.code === "VAULT_NOT_FOUND");
}
