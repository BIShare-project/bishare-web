// The web Drive's calls to the API (VAULT-SPEC "Signed requests"). Every
// call but opening a pairing slot is signed with this browser's device key.
import { authorization, pairAuthorization } from "./crypto";
import type { DriveSession } from "./session";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.bishare.app";

const enc = new TextEncoder();

export class DriveApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}

async function send<T>(
  method: string,
  path: string,
  json: unknown,
  auth: ((body: Uint8Array) => Promise<string>) | null,
  raw?: Uint8Array
): Promise<T> {
  const body = raw ?? (json === undefined ? new Uint8Array(0) : enc.encode(JSON.stringify(json)));
  const headers: Record<string, string> = {};
  if (raw) headers["Content-Type"] = "application/octet-stream";
  else if (json !== undefined) headers["Content-Type"] = "application/json";
  if (auth) headers.Authorization = await auth(body);
  let res: Response;
  try {
    res = await fetch(API_BASE + path, { method, headers, body: body.length ? (body as Uint8Array<ArrayBuffer>) : undefined, cache: "no-store" });
  } catch {
    throw new DriveApiError(0, "NETWORK", "The network went away");
  }
  const data = (await res.json().catch(() => null)) as { success?: boolean; data?: T; error?: { code?: string; message?: string } } | null;
  if (!res.ok || !data || data.success === false) {
    throw new DriveApiError(res.status, data?.error?.code ?? (res.status >= 500 ? "NETWORK" : "UNKNOWN"), data?.error?.message ?? res.statusText);
  }
  return data.data as T;
}

const now = () => Math.floor(Date.now() / 1000);

export interface ObjectRow {
  id: string;
  encMeta: string | null;
  blobId: string | null;
  size: number | null;
  hasThumb: boolean;
  seq: number;
  createdAt: number;
  trashedAt: number | null;
  deleted: boolean;
}

export interface DeviceRow {
  id: string;
  publicKey: string;
  status: "active" | "pending" | "revoked";
  kind: "app" | "web";
  idleLimitMs: number | null;
  encName: string | null;
  addedBy: string;
  addedAt: number;
  revokedAt: number | null;
  lastSeenAt: number | null;
  seq: number;
}

export interface VaultInfo {
  vaultId: string;
  region: string;
  plan: string;
  state: string;
  quotaBytes: number;
  usedBytes: number;
  reservedBytes: number;
  seq: number;
  keyCheck: string | null;
  expiresAt: number | null;
  device: DeviceRow;
  devices: DeviceRow[];
  identities: { provider: string; linkedAt: number }[];
}

export interface DownloadUrl {
  objectId: string;
  url?: string;
  size?: number;
  thumbUrl?: string;
  retryAfterMs?: number;
  missing?: boolean;
}

/** A reservation for one sealed file (VAULT-SPEC "Uploads"), or the blob the vault already has. */
export type Reservation =
  | { existing: { blobId: string; size: number } }
  | {
      uploadId: string;
      blobId: string;
      size: number;
      multipart: boolean;
      parts: number;
      partSize: number;
      expiresAt: number;
      url?: string;
      partUrls?: { partNumber: number; url: string }[];
    };

export type Op =
  | { opId: string; type: "mkdir"; objectId: string; encMeta: string }
  | { opId: string; type: "link"; objectId: string; encMeta: string; blobId: string }
  | { opId: string; type: "meta"; objectId: string; encMeta: string }
  | { opId: string; type: "trash" | "restore" | "delete"; objectId: string };

export interface OpResult {
  ok: boolean;
  seq?: number;
  code?: string;
  message?: string;
}

export interface Changes {
  seq: number;
  resync: boolean;
  more: boolean;
  objects: ObjectRow[];
  devices: DeviceRow[];
}

/** A signed client for one browser session. */
export class DriveClient {
  constructor(readonly session: Pick<DriveSession, "vaultId" | "seed">) {}

  call<T>(method: string, path: string, json?: unknown): Promise<T> {
    const { seed, vaultId } = this.session;
    return send<T>(method, path, json, (body) => authorization(seed, vaultId, method, path, now(), body));
  }

  info(): Promise<VaultInfo> {
    return this.call("GET", `/api/v1/vault/${this.session.vaultId}`);
  }

  changes(since: number, full: boolean): Promise<Changes> {
    return this.call("GET", `/api/v1/vault/${this.session.vaultId}/changes?since=${since}${full ? "&full=1" : ""}`);
  }

  /** Short-lived URLs for the sealed bytes and thumbnails of up to 200 objects. */
  downloads(objectIds: string[], opts: { thumbs: boolean; blobs: boolean }): Promise<{ items: DownloadUrl[]; expiresIn: number }> {
    return this.call("POST", `/api/v1/vault/${this.session.vaultId}/downloads`, { objectIds, thumbs: opts.thumbs, blobs: opts.blobs });
  }

  reserve(size: number, tag: string | null): Promise<Reservation> {
    return this.call("POST", `/api/v1/vault/${this.session.vaultId}/uploads`, { size, ...(tag ? { tag } : {}) });
  }

  /** More part URLs of a multipart upload (at most 100 at a time). */
  partUrls(uploadId: string, partNumbers: number[]): Promise<{ partUrls: { partNumber: number; url: string }[] }> {
    return this.call("POST", `/api/v1/vault/${this.session.vaultId}/uploads/${uploadId}/parts`, { partNumbers });
  }

  complete(uploadId: string, p: { objectId: string; encMeta: string; parts?: { partNumber: number; etag: string }[] }): Promise<unknown> {
    return this.call("POST", `/api/v1/vault/${this.session.vaultId}/uploads/${uploadId}/complete`, p);
  }

  abortUpload(uploadId: string): Promise<unknown> {
    return this.call("DELETE", `/api/v1/vault/${this.session.vaultId}/uploads/${uploadId}`);
  }

  /** The sealed thumbnail of a file (at most 32 KB of JPEG before sealing). */
  putThumb(objectId: string, sealed: Uint8Array): Promise<unknown> {
    const { seed, vaultId } = this.session;
    const path = `/api/v1/vault/${vaultId}/objects/${objectId}/thumb`;
    return send("PUT", path, undefined, (body) => authorization(seed, vaultId, "PUT", path, now(), body), sealed);
  }

  /** Metadata operations, at most 500 a call; each has its own result. */
  ops(ops: Op[]): Promise<{ seq: number; results: OpResult[] }> {
    return this.call("POST", `/api/v1/vault/${this.session.vaultId}/ops`, { ops });
  }

  /** The live-updates socket: a browser cannot sign a WebSocket's headers, so the signature goes in ?auth=. */
  async socketUrl(): Promise<string> {
    const { seed, vaultId } = this.session;
    const path = `/api/v1/vault/${vaultId}/ws`;
    const auth = await authorization(seed, vaultId, "GET", path, now(), new Uint8Array(0));
    const base = API_BASE.startsWith("http") ? API_BASE : location.origin + API_BASE;
    return `${base.replace(/^http/, "ws")}${path}?auth=${encodeURIComponent(auth)}`;
  }

  /** This browser leaves the Drive (Lock): no sign-in needed for one's own device. */
  removeSelf(deviceId: string): Promise<DeviceRow> {
    return this.call("DELETE", `/api/v1/vault/${this.session.vaultId}/devices/${deviceId}`, {});
  }
}

// ---- pairing, before this browser belongs to a vault ----------------------------------------

export interface WebSlot {
  slot: string;
  code: string;
  expiresAt: number;
}

export function openWebSlot(p: { devicePub: string; boxPub: string; name: string; stay: boolean }): Promise<WebSlot> {
  return send<WebSlot>("POST", "/api/v1/vault/web-pair", p, null);
}

export type WebBox = { ready: false } | { ready: true; vaultId: string; deviceId: string; box: string; granterPub: string };

export function takeWebBox(seed: Uint8Array, slot: string): Promise<WebBox> {
  const path = `/api/v1/vault/web-pair/slots/${slot}/box`;
  return send<WebBox>("GET", path, undefined, (body) => pairAuthorization(seed, slot, "GET", path, now(), body));
}

/** The browser moved on to a new code: the old slot can no longer be approved. */
export function cancelWebSlot(seed: Uint8Array, slot: string): Promise<unknown> {
  const path = `/api/v1/vault/web-pair/slots/${slot}`;
  return send("DELETE", path, undefined, (body) => pairAuthorization(seed, slot, "DELETE", path, now(), body));
}
