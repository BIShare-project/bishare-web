// Links from Drive, for the person who got one (drive-plan.md 6B.3; VAULT-SPEC
// "Links from Drive"). https://dl.bishareusercontent.com/d/<id>#<key>: the key after `#`
// never leaves the browser. It opens the sealed manifest (names, sizes, file
// keys); the files come straight from the vault bucket through short signed
// URLs and are decrypted here, as the Drive's own pages do.
import { decryptStream } from "@/lib/e2e/crypto";
import { fromB64u, inflateRaw, openLink, openThumbnail, type LinkFile, type LinkManifest } from "./crypto";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.bishare.app";

export class LinkError extends Error {
  constructor(
    readonly code: "NO_KEY" | "NOT_FOUND" | "EXPIRED" | "BAD_KEY" | "RATE_LIMITED" | "NETWORK" | "SERVER",
    message?: string
  ) {
    super(message ?? code);
  }
}

export interface OpenedLink {
  id: string;
  key: Uint8Array;
  manifest: LinkManifest;
  /** Unix ms, or null: until the owner turns it off. */
  expiresAt: number | null;
}

/** The link key from the page's fragment (`#<43 characters>`), or null. */
export function keyFromFragment(hash: string): Uint8Array | null {
  const raw = hash.replace(/^#/, "");
  if (!/^[A-Za-z0-9_-]{43}$/.test(raw)) return null;
  try {
    const key = fromB64u(raw);
    return key.length === 32 ? key : null;
  } catch {
    return null;
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API + path, { ...init, cache: "no-store" });
  } catch {
    throw new LinkError("NETWORK");
  }
  const data = (await res.json().catch(() => null)) as { success?: boolean; data?: T; error?: { code?: string } } | null;
  if (res.ok && data?.success) return data.data as T;
  const code = data?.error?.code;
  if (res.status === 410 || code === "VAULT_LINK_EXPIRED") throw new LinkError("EXPIRED");
  if (res.status === 404) throw new LinkError("NOT_FOUND");
  if (res.status === 429) throw new LinkError("RATE_LIMITED");
  throw new LinkError(res.status >= 500 ? "SERVER" : "NOT_FOUND");
}

/** Fetch and open a link; a key that does not open it is BAD_KEY. */
export async function openDriveLink(id: string, key: Uint8Array): Promise<OpenedLink> {
  const got = await api<{ kind: string; manifest: string; expiresAt: number | null }>(`/api/v1/vault/links/${encodeURIComponent(id)}`);
  let manifest: LinkManifest;
  try {
    manifest = await openLink(key, id, got.manifest);
  } catch {
    throw new LinkError("BAD_KEY");
  }
  return { id, key, manifest, expiresAt: got.expiresAt };
}

interface LinkItem {
  objectId: string;
  url?: string;
  size?: number;
  thumbUrl?: string;
  missing?: boolean;
  retryAfterMs?: number;
}

/** Signed URLs for files of the link (200 at most per call). */
export async function linkUrls(id: string, objectIds: string[], opts: { thumbs?: boolean; blobs?: boolean } = {}): Promise<LinkItem[]> {
  const got = await api<{ items: LinkItem[] }>(`/api/v1/vault/links/${encodeURIComponent(id)}/downloads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ objectIds, thumbs: opts.thumbs === true, blobs: opts.blobs !== false }),
  });
  return got.items;
}

/** The signed URL of one file, waiting out the read-back pause of an old one. */
export async function fileUrl(id: string, f: LinkFile): Promise<string> {
  for (let tries = 0; tries < 5; tries++) {
    const [item] = await linkUrls(id, [f.objectId]);
    if (item?.url) return item.url;
    if (!item?.retryAfterMs) throw new LinkError("NOT_FOUND");
    await new Promise((r) => setTimeout(r, item.retryAfterMs));
  }
  throw new LinkError("RATE_LIMITED");
}

/** Bytes of the file, decrypted (and inflated) in the page; [writer] takes them as they come instead. */
export async function fetchFile(
  url: string,
  f: LinkFile,
  onProgress?: (done: number) => void,
  writer?: (chunk: Uint8Array) => Promise<void>
): Promise<Uint8Array[] | null> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new LinkError("NETWORK");
  }
  if (!res.ok || !res.body) throw new LinkError(res.status === 403 ? "EXPIRED" : "NETWORK");
  const chunks: Uint8Array[] = [];
  // A compressed file is inflated whole, so it never goes to a writer.
  const direct = writer && !f.compression;
  let chain = Promise.resolve();
  await decryptStream(
    res.body,
    f.fileKey,
    (c) => {
      if (direct) chain = chain.then(() => writer!(c));
      else chunks.push(c);
    },
    onProgress
  );
  await chain;
  if (direct) return null;
  if (!f.compression) return chunks;
  const joined = new Uint8Array(chunks.reduce((a, c) => a + c.length, 0));
  let at = 0;
  for (const c of chunks) {
    joined.set(c, at);
    at += c.length;
  }
  const plain = await inflateRaw(joined, f.size);
  if (writer) {
    await writer(plain);
    return null;
  }
  return [plain];
}

/** Opened thumbnails as object URLs, for the files that have one. */
export async function linkThumbs(link: OpenedLink, files: LinkFile[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const want = files.filter((f) => f.hasThumb).slice(0, 200);
  if (!want.length) return out;
  const items = await linkUrls(link.id, want.map((f) => f.objectId), { thumbs: true, blobs: false });
  const byId = new Map(want.map((f) => [f.objectId, f]));
  await Promise.all(
    items.map(async (it) => {
      const f = byId.get(it.objectId);
      if (!f || !it.thumbUrl) return;
      try {
        const res = await fetch(it.thumbUrl);
        if (!res.ok) return;
        const jpeg = await openThumbnail(f.fileKey, link.manifest.vaultId, f.objectId, new Uint8Array(await res.arrayBuffer()));
        out.set(f.objectId, URL.createObjectURL(new Blob([jpeg as Uint8Array<ArrayBuffer>], { type: "image/jpeg" })));
      } catch {
        // The file's icon shows instead.
      }
    })
  );
  return out;
}
