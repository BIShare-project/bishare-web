// Uploads from the browser into the Drive (drive-plan.md task 6.5), the
// app's VaultUploader steps in a tab: hash the file, link to content the
// vault already holds, else seal it (BSE2 with a new file key), reserve,
// send the sealed bytes straight to storage (one PUT, or parts), commit the
// sealed metadata, then the thumbnail. Nothing is compressed here (`z` is
// absent), which every device reads.
import { sha256 } from "@noble/hashes/sha2.js";
import { ciphertextSize, EncryptedSource, importKey } from "@/lib/e2e/crypto";
import { DriveApiError, type DriveClient } from "./client";
import { b64u, dedupeKey, dedupeTag, generateFileKey, generateObjectId, sealThumbnail, type ObjectMeta } from "./crypto";
import { metaOf, validName, type DriveOps } from "./ops";
import type { DriveIndex, DriveObject } from "./store";
import { makeThumbnail, wantsThumbnail } from "./thumbnail";

export type UploadState = "queued" | "preparing" | "sending" | "finishing" | "done" | "failed" | "canceled";

export interface UploadItem {
  id: string;
  name: string;
  size: number;
  parent: string | null;
  state: UploadState;
  /** Bytes hashed while preparing, sealed bytes sent while sending. */
  done: number;
  total: number;
  error?: string;
  /** Stored once already: linked, nothing sent. */
  linked?: boolean;
  objectId?: string;
}

interface Job {
  item: UploadItem;
  file: File;
  aborts: Set<() => void>;
  uploadId?: string;
}

const FILES_AT_ONCE = 2;
const PARTS_AT_ONCE = 3;
const HASH_CHUNK = 8 * 1024 * 1024;
const MAX_PART_URLS = 100;

const MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp", heic: "image/heic",
  heif: "image/heif", avif: "image/avif", bmp: "image/bmp", svg: "image/svg+xml", tif: "image/tiff", tiff: "image/tiff",
  mp4: "video/mp4", mov: "video/quicktime", m4v: "video/x-m4v", webm: "video/webm", mkv: "video/x-matroska", avi: "video/x-msvideo",
  mp3: "audio/mpeg", m4a: "audio/mp4", aac: "audio/aac", wav: "audio/wav", flac: "audio/flac", ogg: "audio/ogg", opus: "audio/opus",
  pdf: "application/pdf", txt: "text/plain", md: "text/markdown", csv: "text/csv", json: "application/json", xml: "application/xml",
  html: "text/html", htm: "text/html", rtf: "application/rtf", epub: "application/epub+zip",
  doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  odt: "application/vnd.oasis.opendocument.text", ods: "application/vnd.oasis.opendocument.spreadsheet",
  odp: "application/vnd.oasis.opendocument.presentation", zip: "application/zip", rar: "application/vnd.rar",
  "7z": "application/x-7z-compressed", gz: "application/gzip", tar: "application/x-tar", apk: "application/vnd.android.package-archive",
};

export function mimeOf(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "";
  return MIME[ext] ?? "application/octet-stream";
}

class Stop extends Error {}

/** A part link is asked for again when older than this; they live an hour. */
const PART_URL_FRESH_MS = 50 * 60_000;

/** PUT with progress; resolves to the ETag (parts) or "". */
function put(url: string, body: Uint8Array<ArrayBuffer>, onProgress: (n: number) => void, aborts: Set<() => void>): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    aborts.add(abort);
    xhr.open("PUT", url);
    xhr.upload.onprogress = (e) => onProgress(e.loaded);
    xhr.onload = () => {
      aborts.delete(abort);
      if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.getResponseHeader("ETag") ?? "");
      else reject(new DriveApiError(xhr.status, "VAULT_PUT_FAILED", `Storage answered ${xhr.status}`));
    };
    xhr.onerror = () => {
      aborts.delete(abort);
      reject(new DriveApiError(0, "NETWORK", "The network went away"));
    };
    xhr.onabort = () => {
      aborts.delete(abort);
      reject(new Stop("canceled"));
    };
    xhr.send(body);
  });
}

async function retry<T>(run: () => Promise<T>, tries = 4): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await run();
    } catch (e) {
      if (e instanceof Stop || i + 1 >= tries || (e instanceof DriveApiError && e.status >= 400 && e.status < 500 && e.status !== 408 && e.status !== 429)) throw e;
      await new Promise((r) => setTimeout(r, 800 * 2 ** i));
    }
  }
}

export class Uploader {
  items: UploadItem[] = [];
  private jobs = new Map<string, Job>();
  private running = 0;
  private listeners = new Set<() => void>();
  private version = 0;
  private kDedupe: Promise<Uint8Array>;
  private pullTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private client: DriveClient,
    private index: DriveIndex,
    private ops: DriveOps,
    private vaultId: string,
    vaultKey: Uint8Array
  ) {
    this.kDedupe = dedupeKey(vaultKey);
  }

  subscribe = (l: () => void): (() => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };

  snapshot = (): number => this.version;

  private emit(): void {
    this.items = [...this.items];
    this.version++;
    for (const l of this.listeners) l();
  }

  private set(id: string, change: Partial<UploadItem>): void {
    const i = this.items.findIndex((x) => x.id === id);
    if (i < 0) return;
    this.items[i] = { ...this.items[i]!, ...change };
    this.emit();
  }

  get busy(): boolean {
    return this.items.some((i) => i.state === "queued" || i.state === "preparing" || i.state === "sending" || i.state === "finishing");
  }

  /** Files into [parent]; names that are taken get " (1)" when they are committed. */
  add(files: File[], parent: string | null): void {
    for (const file of files) {
      const id = generateObjectId();
      const item: UploadItem = { id, name: file.name, size: file.size, parent, state: "queued", done: 0, total: file.size };
      this.items.push(item);
      this.jobs.set(id, { item, file, aborts: new Set() });
    }
    this.emit();
    this.pump();
  }

  /** A dropped or picked folder: its folders are made first, then its files go into them. */
  async addTree(entries: { file: File; path: string[] }[], parent: string | null): Promise<void> {
    const made = new Map<string, string>();
    const folderFor = async (path: string[]): Promise<string | null> => {
      let at = parent;
      for (let i = 0; i < path.length; i++) {
        const key = path.slice(0, i + 1).join("/");
        let id = made.get(key);
        if (!id) {
          const existing = this.index.children(at).find((o) => o.kind === "dir" && o.name === path[i]);
          id = existing && i > 0 ? existing.id : await this.ops.mkdir(path[i]!, at);
          made.set(key, id);
        }
        at = id;
      }
      return at;
    };
    const byFolder = new Map<string | null, File[]>();
    for (const e of entries) {
      const into = await folderFor(e.path);
      byFolder.set(into, [...(byFolder.get(into) ?? []), e.file]);
    }
    for (const [into, files] of byFolder) this.add(files, into);
  }

  cancel(id: string): void {
    const job = this.jobs.get(id);
    if (!job || job.item.state === "done") return;
    for (const a of job.aborts) a();
    if (job.uploadId) void this.client.abortUpload(job.uploadId).catch(() => undefined);
    this.set(id, { state: "canceled" });
    this.jobs.delete(id);
  }

  cancelAll(): void {
    for (const i of this.items) if (i.state !== "done" && i.state !== "failed" && i.state !== "canceled") this.cancel(i.id);
  }

  retry(id: string): void {
    const item = this.items.find((x) => x.id === id);
    const job = this.jobs.get(id);
    if (!item || !job || item.state !== "failed") return;
    this.set(id, { state: "queued", done: 0, total: item.size, error: undefined });
    job.item = this.items.find((x) => x.id === id)!;
    this.pump();
  }

  clearFinished(): void {
    this.items = this.items.filter((i) => i.state !== "done" && i.state !== "canceled" && i.state !== "failed");
    for (const id of [...this.jobs.keys()]) if (!this.items.some((i) => i.id === id)) this.jobs.delete(id);
    this.emit();
  }

  private pump(): void {
    while (this.running < FILES_AT_ONCE) {
      const next = this.items.find((i) => i.state === "queued" && this.jobs.has(i.id));
      if (!next) return;
      this.running++;
      this.set(next.id, { state: "preparing" });
      void this.run(this.jobs.get(next.id)!).finally(() => {
        this.running--;
        this.pump();
      });
    }
  }

  private schedulePull(): void {
    if (this.pullTimer) return;
    this.pullTimer = setTimeout(() => {
      this.pullTimer = null;
      void this.index.pull().catch(() => undefined);
    }, 400);
  }

  private alive(job: Job): void {
    if (!this.jobs.has(job.item.id)) throw new Stop("canceled");
  }

  private async run(job: Job): Promise<void> {
    const { item, file } = job;
    try {
      if (!validName(file.name)) throw new DriveApiError(422, "VAULT_BAD_NAME", "Not a valid name");
      // 1. One read of the file: its hash.
      const h = sha256.create();
      for (let at = 0; at < file.size; at += HASH_CHUNK) {
        this.alive(job);
        h.update(new Uint8Array(await file.slice(at, at + HASH_CHUNK).arrayBuffer()));
        this.set(item.id, { done: Math.min(file.size, at + HASH_CHUNK) });
      }
      const hash = h.digest();
      const mime = mimeOf(file);
      const mtimeMs = Math.round(file.lastModified || Date.now());

      // 2. Content the vault already holds: a new object pointing at it.
      const same = this.index.fileWithHash(hash, file.size);
      if (same && (await this.link(job, same, mime, mtimeMs))) return;

      // 3. Reserve (or learn the server holds the same content).
      const sealedSize = ciphertextSize(file.size);
      const tag = await dedupeTag(await this.kDedupe, hash);
      let r = await this.client.reserve(sealedSize, tag);
      if ("existing" in r) {
        let holder = this.index.fileWithBlob(r.existing.blobId);
        if (!holder) {
          await this.index.pull().catch(() => undefined);
          holder = this.index.fileWithBlob(r.existing.blobId);
        }
        if (holder && holder.size === file.size && holder.hash && b64u(holder.hash) === b64u(hash) && (await this.link(job, holder, mime, mtimeMs))) return;
        r = await this.client.reserve(sealedSize, null);
        if ("existing" in r) throw new DriveApiError(409, "VAULT_UPLOAD_REFUSED", "The server would not take the file");
      }
      job.uploadId = r.uploadId;
      this.alive(job);

      // 4. The sealed bytes, made on the fly per part.
      const fileKey = generateFileKey();
      const src = new EncryptedSource(file, await importKey(fileKey), crypto.getRandomValues(new Uint8Array(4)));
      this.set(item.id, { state: "sending", done: 0, total: src.size });
      let parts: { partNumber: number; etag: string }[] | undefined;
      if (!r.multipart) {
        const body = await src.slice(0, src.size);
        await retry(() => put(r.url!, body, (n) => this.set(item.id, { done: n }), job.aborts));
      } else {
        parts = await this.sendParts(job, r.uploadId, r.parts, r.partSize, src, r.partUrls ?? []);
      }
      this.alive(job);

      // 5. Commit with the sealed metadata, then the thumbnail.
      this.set(item.id, { state: "finishing" });
      const objectId = generateObjectId();
      const name = this.index.freeName(item.parent, file.name);
      const meta: ObjectMeta = { kind: "file", name, parent: item.parent, mtimeMs, size: file.size, mime, fileKey, hash };
      await retry(async () => this.client.complete(r.uploadId, { objectId, encMeta: await this.ops.seal(objectId, meta), ...(parts ? { parts } : {}) }));
      job.uploadId = undefined;
      this.set(item.id, { state: "done", done: src.size, objectId });
      this.schedulePull();
      await this.thumb(file, mime, fileKey, objectId);
    } catch (e) {
      if (e instanceof Stop) return;
      this.set(item.id, { state: "failed", error: e instanceof DriveApiError ? e.code : String(e) });
    }
  }

  private async sendParts(
    job: Job,
    uploadId: string,
    count: number,
    partSize: number,
    src: EncryptedSource,
    first: { partNumber: number; url: string }[]
  ): Promise<{ partNumber: number; etag: string }[]> {
    // Part links live an hour (the API's URL_TTL_S); a long upload asks for
    // fresh ones before they lapse, and again if storage refuses one anyway.
    const now = Date.now();
    const urls = new Map(first.map((p) => [p.partNumber, { url: p.url, at: now }]));
    const sentBy = new Map<number, number>();
    const etags: string[] = new Array(count);
    let next = 1;
    const urlFor = async (n: number): Promise<string> => {
      const have = urls.get(n);
      if (!have || Date.now() - have.at > PART_URL_FRESH_MS) {
        const want = Array.from({ length: Math.min(MAX_PART_URLS, count - n + 1) }, (_, i) => n + i);
        const more = await this.client.partUrls(uploadId, want);
        const at = Date.now();
        for (const p of more.partUrls) urls.set(p.partNumber, { url: p.url, at });
      }
      return urls.get(n)!.url;
    };
    const progress = () => {
      let total = 0;
      for (const v of sentBy.values()) total += v;
      this.set(job.item.id, { done: total });
    };
    const worker = async () => {
      while (next <= count) {
        const n = next++;
        this.alive(job);
        const start = (n - 1) * partSize;
        const end = Math.min(src.size, start + partSize);
        const body = await src.slice(start, end);
        etags[n - 1] = await retry(async () => {
          let etag: string;
          try {
            etag = await put(await urlFor(n), body, (b) => {
              sentBy.set(n, b);
              progress();
            }, job.aborts);
          } catch (e) {
            if (!(e instanceof DriveApiError) || e.status !== 403) throw e;
            urls.delete(n);
            throw new DriveApiError(0, "VAULT_URL_EXPIRED", "The part's link had expired");
          }
          if (!etag) throw new DriveApiError(0, "VAULT_NO_ETAG", "Storage did not return the part's ETag");
          return etag;
        });
        sentBy.set(n, end - start);
        progress();
      }
    };
    await Promise.all(Array.from({ length: Math.min(PARTS_AT_ONCE, count) }, worker));
    return etags.map((etag, i) => ({ partNumber: i + 1, etag }));
  }

  /** Point a new object at stored content whose hash and size match this file (the server's word alone is never enough). */
  private async link(job: Job, holder: DriveObject, mime: string, mtimeMs: number): Promise<boolean> {
    if (!holder.blobId || !holder.fileKey) return false;
    const objectId = generateObjectId();
    const name = this.index.freeName(job.item.parent, job.file.name);
    const meta = metaOf(holder, { name, parent: job.item.parent, mtimeMs, mime });
    const r = await this.client.ops([{ opId: `link-${objectId}`, type: "link", objectId, encMeta: await this.ops.seal(objectId, meta), blobId: holder.blobId }]);
    const res = r.results[0];
    if (!res?.ok && res?.code === "VAULT_BLOB_NOT_FOUND") return false;
    if (!res?.ok) throw new DriveApiError(409, res?.code ?? "UNKNOWN", res?.message ?? "");
    this.set(job.item.id, { state: "done", done: job.item.total, linked: true, objectId });
    this.schedulePull();
    await this.thumb(job.file, mime, holder.fileKey, objectId);
    return true;
  }

  private async thumb(file: File, mime: string, fileKey: Uint8Array, objectId: string): Promise<void> {
    if (!wantsThumbnail(mime)) return;
    try {
      const jpeg = await makeThumbnail(file, mime);
      if (!jpeg) return;
      await this.client.putThumb(objectId, await sealThumbnail(fileKey, this.vaultId, objectId, jpeg));
      this.schedulePull();
    } catch {
      // The file is in; a tile shows its icon instead.
    }
  }
}
