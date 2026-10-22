// What the web Drive changes in the vault (drive-plan.md task 6.5): new
// folders, names, places, the trash. The same rules as the app's VaultFiles
// (bishare-flutter lib/features/vault/data/vault_files.dart), so a change
// made here reads the same on every device.
import { DriveApiError, type DriveClient, type Op } from "./client";
import { generateObjectId, metaKey, sealMeta, type ObjectMeta } from "./crypto";
import type { DriveIndex, DriveObject } from "./store";

/** The server takes at most this many ops per call. */
const BATCH = 500;
/** Trashed together: within this long of the folder itself. */
const SAME_TRASH_MS = 5000;

const opId = () => generateObjectId();

/** A name the spec accepts: not empty, no "/", no U+0000. */
export function validName(name: string): boolean {
  return name.trim().length > 0 && !name.includes("/") && !name.includes("\0");
}

/** The metadata of [o] alone (what is sealed), with changes. */
export function metaOf(o: DriveObject, change: Partial<ObjectMeta> = {}): ObjectMeta {
  const m: ObjectMeta = { kind: o.kind, name: o.name, parent: o.parent, mtimeMs: o.mtimeMs };
  if (o.kind === "file") {
    m.size = o.size;
    m.mime = o.mime;
    m.fileKey = o.fileKey;
    m.hash = o.hash;
    if (o.compression) m.compression = o.compression;
  }
  return { ...m, ...change };
}

export class DriveOps {
  private kMeta: Promise<Uint8Array>;

  constructor(
    private client: DriveClient,
    private index: DriveIndex,
    private vaultId: string,
    vaultKey: Uint8Array
  ) {
    this.kMeta = metaKey(vaultKey);
  }

  async seal(objectId: string, meta: ObjectMeta): Promise<string> {
    return sealMeta(await this.kMeta, this.vaultId, objectId, meta);
  }

  /** Send [ops] in batches; the first refusal stops and is thrown. The index follows either way. */
  async send(ops: Op[]): Promise<void> {
    try {
      for (let i = 0; i < ops.length; i += BATCH) {
        const r = await this.client.ops(ops.slice(i, i + BATCH));
        const bad = r.results.find((x) => !x.ok);
        if (bad) throw new DriveApiError(409, bad.code ?? "UNKNOWN", bad.message ?? "");
      }
    } finally {
      await this.index.pull().catch(() => undefined);
    }
  }

  private object(id: string): DriveObject {
    const o = this.index.get(id);
    if (!o) throw new DriveApiError(404, "VAULT_OBJECT_NOT_FOUND", "Not in the index");
    return o;
  }

  async mkdir(name: string, parent: string | null): Promise<string> {
    if (!validName(name)) throw new DriveApiError(422, "VAULT_BAD_NAME", "Not a valid name");
    const id = generateObjectId();
    const meta: ObjectMeta = { kind: "dir", name: this.index.freeName(parent, name.trim()), parent, mtimeMs: Date.now() };
    await this.send([{ opId: opId(), type: "mkdir", objectId: id, encMeta: await this.seal(id, meta) }]);
    return id;
  }

  async rename(id: string, name: string): Promise<void> {
    name = name.trim();
    if (!validName(name)) throw new DriveApiError(422, "VAULT_BAD_NAME", "Not a valid name");
    const o = this.object(id);
    if (name === o.name) return;
    if (name.toLowerCase() !== o.name.toLowerCase()) name = this.index.freeName(o.parent, name);
    await this.send([{ opId: opId(), type: "meta", objectId: id, encMeta: await this.seal(id, metaOf(o, { name })) }]);
  }

  /** Move [ids] into [parent] (null: the top of the Drive). A folder cannot go into itself. */
  async move(ids: string[], parent: string | null): Promise<void> {
    if (parent !== null) {
      const above = this.index.ancestors(parent);
      if (ids.some((id) => above.has(id))) throw new DriveApiError(409, "VAULT_MOVE_INTO_ITSELF", "A folder cannot go into itself");
    }
    const ops: Op[] = [];
    const taken = new Set<string>();
    for (const id of ids) {
      const o = this.object(id);
      if (o.parent === parent) continue;
      const name = this.index.freeName(parent, o.name, taken);
      taken.add(name.toLowerCase());
      ops.push({ opId: opId(), type: "meta", objectId: id, encMeta: await this.seal(id, metaOf(o, { name, parent })) });
    }
    if (ops.length) await this.send(ops);
  }

  /** Copies point at the same stored bytes; a folder is copied with everything live in it. */
  async copy(ids: string[], parent: string | null): Promise<void> {
    if (parent !== null) {
      const above = this.index.ancestors(parent);
      if (ids.some((id) => above.has(id))) throw new DriveApiError(409, "VAULT_MOVE_INTO_ITSELF", "A folder cannot go into itself");
    }
    const ops: Op[] = [];
    const taken = new Set<string>();
    const copyOne = async (o: DriveObject, into: string | null, top: boolean) => {
      const name = top ? this.index.freeName(into, o.name, taken) : o.name;
      if (top) taken.add(name.toLowerCase());
      const id = generateObjectId();
      const meta = metaOf(o, { name, parent: into });
      if (o.kind === "dir") {
        ops.push({ opId: opId(), type: "mkdir", objectId: id, encMeta: await this.seal(id, meta) });
        for (const child of this.index.children(o.id)) await copyOne(child, id, false);
      } else if (o.blobId) {
        ops.push({ opId: opId(), type: "link", objectId: id, encMeta: await this.seal(id, meta), blobId: o.blobId });
      }
    };
    for (const id of ids) await copyOne(this.object(id), parent, true);
    if (ops.length) await this.send(ops);
  }

  async trash(ids: string[]): Promise<void> {
    const all = new Set<string>();
    for (const id of ids) {
      all.add(id);
      for (const d of this.index.descendants(id)) if (d.trashedAt === null) all.add(d.id);
    }
    await this.send([...all].map((id) => ({ opId: opId(), type: "trash" as const, objectId: id })));
  }

  /** Back with what was trashed with them (at the same time or after), not what was trashed on its own before. */
  async restore(ids: string[]): Promise<void> {
    const all = new Set<string>();
    for (const id of ids) {
      const o = this.object(id);
      all.add(id);
      if (o.trashedAt === null) continue;
      for (const d of this.index.trashedBelow(id)) if ((d.trashedAt ?? 0) >= o.trashedAt - SAME_TRASH_MS) all.add(d.id);
    }
    await this.send([...all].map((id) => ({ opId: opId(), type: "restore" as const, objectId: id })));
  }

  /** Gone for good, with what is in the trash inside them. Something live inside is kept at the top of the Drive. */
  async deleteForGood(ids: string[]): Promise<void> {
    const gone: string[] = [];
    const keep: string[] = [];
    for (const id of ids) {
      const o = this.index.get(id);
      if (!o || o.trashedAt === null) continue;
      const below = this.index.trashedBelow(id, keep);
      gone.push(...below.map((d) => d.id).reverse(), id);
    }
    if (keep.length) await this.move(keep, null);
    if (gone.length) await this.send([...new Set(gone)].map((id) => ({ opId: opId(), type: "delete" as const, objectId: id })));
  }

  emptyTrash(): Promise<void> {
    return this.deleteForGood(this.index.trash().map((o) => o.id));
  }
}
