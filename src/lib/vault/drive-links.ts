// Links from Drive, on the owner's side in the browser (drive-plan.md 6B.3;
// VAULT-SPEC "Links from Drive"): what the app's VaultLinks does. A link to a
// file, or to a folder with the files under it, sealed with a fresh link key
// that travels only after `#`; the key is also kept sealed with K_meta so any
// device of the Drive can show the link again. A folder link lists the folder
// as it was when it was last sent: this browser sends it again after a sync
// when the folder changed (refreshFolderLinks).
import type { DriveClient, LinkInfo } from "./client";
import { b64u, generateLinkKey, generateObjectId, metaKey, openLinkKey, sealLink, sealLinkKey, type LinkFile } from "./crypto";
import type { DriveIndex, DriveObject } from "./store";

export const LINK_PAGE = "https://dl.bishareusercontent.com/d/";
/** Files one link may list (the server takes the folder and 1999 files). */
export const LINK_MAX_FILES = 1999;

export class LinkTooManyFiles extends Error {}

/** A link from Drive as this browser shows it. */
export interface DriveLink {
  id: string;
  /** The whole link, key included; null when its key cannot be opened here. */
  url: string | null;
  folder: boolean;
  root: string;
  /** The shared item's name in the index, or null when the index no longer has it. */
  name: string | null;
  files: number;
  createdAt: number;
  expiresAt: number | null;
  opens: number;
}

export function linkUrl(id: string, key: Uint8Array): string {
  return `${LINK_PAGE}${id}#${b64u(key)}`;
}

/** The files a link over [root] lists, with their paths under it. */
function filesOf(index: DriveIndex, root: DriveObject): LinkFile[] {
  const one = (o: DriveObject, path: string): LinkFile => ({
    objectId: o.id,
    path,
    size: o.size ?? 0,
    mime: o.mime || "application/octet-stream",
    mtimeMs: o.mtimeMs,
    fileKey: o.fileKey!,
    hasThumb: o.hasThumb,
    ...(o.compression ? { compression: o.compression } : {}),
  });
  if (root.kind === "file") return [one(root, root.name)];
  const out: LinkFile[] = [];
  const walk = (parent: string, prefix: string) => {
    for (const c of index.children(parent)) {
      if (c.kind === "dir") walk(c.id, `${prefix}${c.name}/`);
      else if (c.fileKey) {
        out.push(one(c, `${prefix}${c.name}`));
        if (out.length > LINK_MAX_FILES) throw new LinkTooManyFiles();
      }
    }
  };
  walk(root.id, "");
  return out;
}

async function fingerprint(root: DriveObject, files: LinkFile[]): Promise<string> {
  const lines = [root.name, ...files.map((f) => `${f.objectId}|${f.path}|${f.size}|${f.mtimeMs}`)].sort();
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(lines.join("\n")));
  return b64u(new Uint8Array(digest));
}

async function sealed(vaultId: string, linkId: string, key: Uint8Array, root: DriveObject, files: LinkFile[]) {
  const folder = root.kind === "dir";
  return {
    manifest: await sealLink(key, linkId, { kind: folder ? "dir" : "file", name: root.name, vaultId, files }),
    objectIds: [root.id, ...(folder ? files.map((f) => f.objectId) : [])],
  };
}

// ---- the folder links this browser keeps up to date -----------------------------------------

const storeKey = (vaultId: string) => `bishare-drive-folder-links:${vaultId}`;

function folders(vaultId: string): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(storeKey(vaultId)) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function remember(vaultId: string, id: string, print: string | null): void {
  const m = folders(vaultId);
  if (print === null) delete m[id];
  else m[id] = print;
  try {
    localStorage.setItem(storeKey(vaultId), JSON.stringify(m));
  } catch {
    // Kept for this page only.
  }
}

// ---- the calls --------------------------------------------------------------------------------

export async function createLink(
  client: DriveClient,
  index: DriveIndex,
  vaultKey: Uint8Array,
  root: DriveObject,
  days: number
): Promise<DriveLink> {
  const vaultId = client.session.vaultId;
  const files = filesOf(index, root);
  const linkId = generateObjectId();
  const key = generateLinkKey();
  const s = await sealed(vaultId, linkId, key, root, files);
  const info = await client.createLink({
    linkId,
    kind: root.kind === "dir" ? "folder" : "file",
    objectIds: s.objectIds,
    manifest: s.manifest,
    encKey: await sealLinkKey(await metaKey(vaultKey), vaultId, linkId, key),
    days,
  });
  if (root.kind === "dir") remember(vaultId, linkId, await fingerprint(root, files));
  return {
    id: linkId,
    url: linkUrl(linkId, key),
    folder: root.kind === "dir",
    root: root.id,
    name: root.name,
    files: files.length,
    createdAt: info.createdAt,
    expiresAt: info.expiresAt,
    opens: 0,
  };
}

/** The Drive's links that still open; only those over [root] when given. */
export async function listLinks(client: DriveClient, index: DriveIndex, vaultKey: Uint8Array, root?: string): Promise<DriveLink[]> {
  const vaultId = client.session.vaultId;
  const kMeta = await metaKey(vaultKey);
  const { links } = await client.links();
  const out: DriveLink[] = [];
  for (const l of links) {
    if (root && l.root !== root) continue;
    let url: string | null = null;
    if (l.encKey) {
      try {
        url = linkUrl(l.id, await openLinkKey(kMeta, vaultId, l.id, l.encKey));
      } catch {
        // Shown without its address; it can still be turned off.
      }
    }
    out.push({
      id: l.id,
      url,
      folder: l.kind === "folder",
      root: l.root,
      name: index.get(l.root)?.name ?? null,
      files: l.kind === "folder" ? l.objects - 1 : 1,
      createdAt: l.createdAt,
      expiresAt: l.expiresAt,
      opens: l.opens,
    });
  }
  return out;
}

export async function revokeLink(client: DriveClient, id: string): Promise<void> {
  await client.revokeLink(id);
  remember(client.session.vaultId, id, null);
}

let discovered = false;

/**
 * Sends again every folder link whose folder changed since it was last sent:
 * the ones this browser keeps, plus, once a page load, the ones the server
 * lists that were made elsewhere (sent again once). Returns how many went.
 */
export async function refreshFolderLinks(client: DriveClient, index: DriveIndex, vaultKey: Uint8Array): Promise<number> {
  const vaultId = client.session.vaultId;
  const known = folders(vaultId);
  if (!Object.keys(known).length && discovered) return 0;
  discovered = true;
  const byId = new Map<string, LinkInfo>((await client.links()).links.map((l) => [l.id, l]));
  const todo: Record<string, string> = { ...known };
  for (const l of byId.values()) if (l.kind === "folder" && l.encKey && !(l.id in todo)) todo[l.id] = "";
  const kMeta = await metaKey(vaultKey);
  let sent = 0;
  for (const [id, print] of Object.entries(todo)) {
    const l = byId.get(id);
    if (!l || l.kind !== "folder" || !l.encKey) {
      remember(vaultId, id, null);
      continue;
    }
    const root = index.get(l.root);
    // In the trash or gone: the link has stopped opening by itself.
    if (!root || index.inTrash(root)) continue;
    try {
      const files = filesOf(index, root);
      const now = await fingerprint(root, files);
      if (now === print) continue;
      const key = await openLinkKey(kMeta, vaultId, id, l.encKey);
      const s = await sealed(vaultId, id, key, root, files);
      await client.updateLink(id, { kind: "folder", objectIds: s.objectIds, manifest: s.manifest });
      remember(vaultId, id, now);
      sent++;
    } catch (e) {
      console.warn("[drive] folder link", id, e);
    }
  }
  return sent;
}
