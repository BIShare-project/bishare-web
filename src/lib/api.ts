import type {
  APIResponse,
  FlatResponse,
  PublicShareInfo,
  DownloadURLResponse,
  TransferStatus,
  FileRequestInfo,
} from "./types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.bishare.app";

/** Mirror of the backend transfer limits (do not raise without a server change). */
export const TRANSFER_MAX_FILE_SIZE = 2_147_483_648; // 2 GB (legacy — see getTransferMaxFileSizeFree)
export const TRANSFER_EXPIRY_HOURS = 24;

/**
 * Anonymous/free transfer size ceiling used when GET /api/v1/config is
 * unreachable or malformed. The server now rejects >1 GiB for anonymous
 * uploads (tier work), so the web — an anonymous client — mirrors 1 GiB.
 */
export const TRANSFER_MAX_FILE_SIZE_FREE_FALLBACK = 10_737_418_240; // 10 GiB (mirrors the transfer_max_file_size_free flag)

/** File extensions the backend refuses on upload. */
export const BLOCKED_EXTENSIONS = [
  ".exe",
  ".bat",
  ".cmd",
  ".sh",
  ".msi",
  ".scr",
  ".pif",
  ".com",
];

export function isBlockedFileType(name: string): boolean {
  const lower = name.toLowerCase();
  return BLOCKED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Fetch the frozen API. On the SERVER (worker, e.g. SSR of the share/transfer/
 * request pages) a plain fetch to api.bishare.app is a worker→self subrequest —
 * the same worker serves that host — which trips Cloudflare's loop guard and
 * returns 522. The SELF service binding dispatches in-process (no loop). In the
 * BROWSER (interactive verify/download/status) a plain fetch is correct, and the
 * getCloudflareContext import is only loaded server-side (typeof window guard),
 * keeping the client bundle clean.
 */
async function doFetch(url: string, init?: RequestInit): Promise<Response> {
  if (typeof window === "undefined") {
    try {
      const { getCloudflareContext } = await import("@opennextjs/cloudflare");
      const self = (getCloudflareContext().env as Record<string, unknown>)?.SELF as
        | { fetch: (req: Request) => Promise<Response> }
        | undefined;
      if (self && typeof self.fetch === "function") return self.fetch(new Request(url, init));
    } catch {
      // getCloudflareContext unavailable — fall through to global fetch.
    }
  }
  return fetch(url, init);
}

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<APIResponse<T>> {
  try {
    const res = await doFetch(url, init);
    if (!res.ok && res.status >= 500) {
      return {
        success: false,
        error: { code: "SERVER_ERROR", message: "Server error — please try again later" },
      };
    }
    return (await res.json()) as APIResponse<T>;
  } catch {
    return {
      success: false,
      error: { code: "NETWORK_ERROR", message: "Connection problem — please try again" },
    };
  }
}

// ── Cloud config (tier limits) ──

let cloudConfigLimitPromise: Promise<number> | null = null;

/**
 * Free-tier transfer size limit from GET /api/v1/config
 * (`data.limits.transfer_max_file_size_free`). The web is an anonymous client,
 * so the free limit is its effective ceiling. Cached module-level (one fetch
 * per page load); falls back to 1 GiB when the endpoint is unreachable or the
 * shape is unexpected. Mirrors Flutter's CloudConfigService.
 */
export async function getTransferMaxFileSizeFree(): Promise<number> {
  if (!cloudConfigLimitPromise) {
    cloudConfigLimitPromise = (async () => {
      try {
        const res = await doFetch(`${API_URL}/api/v1/config`, { cache: "no-store" });
        if (!res.ok) return TRANSFER_MAX_FILE_SIZE_FREE_FALLBACK;
        const body = (await res.json()) as {
          data?: { limits?: { transfer_max_file_size_free?: number } };
        };
        const limit = body?.data?.limits?.transfer_max_file_size_free;
        return typeof limit === "number" && limit > 0
          ? limit
          : TRANSFER_MAX_FILE_SIZE_FREE_FALLBACK;
      } catch {
        return TRANSFER_MAX_FILE_SIZE_FREE_FALLBACK;
      }
    })();
  }
  return cloudConfigLimitPromise;
}

/**
 * Feature flag `web_nearby_enabled` from GET /api/v1/config (`data.flags`).
 * Gates the Nearby tab on the web transfer tool. Cached module-level (one fetch
 * per page load); defaults to false when the endpoint is unreachable or the flag
 * is unset, so nearby stays hidden until an admin flips it on.
 */
let webNearbyFlagPromise: Promise<boolean> | null = null;

export async function getWebNearbyEnabled(): Promise<boolean> {
  if (!webNearbyFlagPromise) {
    webNearbyFlagPromise = (async () => {
      try {
        const res = await doFetch(`${API_URL}/api/v1/config`, { cache: "no-store" });
        if (!res.ok) return false;
        const body = (await res.json()) as {
          data?: { flags?: { web_nearby_enabled?: unknown } };
        };
        return body?.data?.flags?.web_nearby_enabled === true;
      } catch {
        return false;
      }
    })();
  }
  return webNearbyFlagPromise;
}

/**
 * Feature flag `web_qr_beam_enabled` from GET /api/v1/config — gates the QR Beam
 * tab (offline QR-stream transfer) on the web transfer tool. Cached module-level;
 * defaults false when unreachable/unset so it stays hidden until an admin flips it.
 */
let webQrBeamFlagPromise: Promise<boolean> | null = null;

export async function getWebQrBeamEnabled(): Promise<boolean> {
  if (!webQrBeamFlagPromise) {
    webQrBeamFlagPromise = (async () => {
      try {
        const res = await doFetch(`${API_URL}/api/v1/config`, { cache: "no-store" });
        if (!res.ok) return false;
        const body = (await res.json()) as {
          data?: { flags?: { web_qr_beam_enabled?: unknown } };
        };
        return body?.data?.flags?.web_qr_beam_enabled === true;
      } catch {
        return false;
      }
    })();
  }
  return webQrBeamFlagPromise;
}

// ── Shares (public /s API) ──

export async function getShareInfo(token: string): Promise<APIResponse<PublicShareInfo>> {
  return fetchJSON(`${API_URL}/s/${token}`, { cache: "no-store" });
}

export async function getShareDownloadURL(token: string): Promise<APIResponse<DownloadURLResponse>> {
  return fetchJSON(`${API_URL}/s/${token}/download`);
}

export async function verifySharePassword(token: string, password: string): Promise<APIResponse<DownloadURLResponse>> {
  return fetchJSON(`${API_URL}/s/${token}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
}

// ── Transfers ──

export async function getTransferStatus(code: string): Promise<APIResponse<TransferStatus>> {
  return fetchJSON(`${API_URL}/api/v1/transfer/status/${code}`, { cache: "no-store" });
}

export function getTransferDownloadURL(code: string): string {
  return `${API_URL}/api/v1/transfer/download/${code}`;
}

export function getTransferUploadURL(): string {
  return `${API_URL}/api/v1/transfer/upload`;
}

/**
 * Presigned-PUT variant: reserves the transfer and returns an `uploadUrl` the
 * browser PUTs the file straight to (R2), bypassing the ~100 MB Cloudflare
 * Worker request-body limit. Used for large files (see file-upload.tsx).
 */
export function getTransferUploadUrlEndpoint(): string {
  return `${API_URL}/api/v1/transfer/upload-url`;
}

/** Email a live transfer's download link to a recipient (v3 additive endpoint). */
export async function sendTransferEmail(input: {
  code: string;
  email: string;
  name?: string;
  message?: string;
}): Promise<FlatResponse> {
  try {
    const res = await fetch(`${API_URL}/api/v1/transfer/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return (await res.json()) as FlatResponse;
  } catch {
    return {
      success: false,
      error: { code: "NETWORK_ERROR", message: "Network error — check your connection" },
    };
  }
}

// ── Resumable multipart transfer (large files) ──

interface TransferPart {
  part_number: number;
  upload_url: string;
}

export interface TransferMultipartInit {
  success: boolean;
  uploadId?: string;
  storageKey?: string;
  partSize?: number;
  totalParts?: number;
  parts?: TransferPart[];
  uploadExpiresIn?: number;
  error?: { code: string; message: string };
}

export interface TransferPartUrls {
  success: boolean;
  parts?: TransferPart[];
  uploadExpiresIn?: number;
  error?: { code: string; message: string };
}

/** Response of /multipart/complete — same FLAT shape as /upload-url. */
export interface TransferMultipartComplete {
  success: boolean;
  code?: string;
  rawCode?: string;
  expiresAt?: string;
  deleteToken?: string;
  error?: { code: string; message: string };
}

const NETWORK_ERR = {
  success: false as const,
  error: { code: "NETWORK_ERROR", message: "Network error — check your connection" },
};

/** Start a resumable multipart upload — reserves an R2 multipart + part URLs. */
export async function initTransferMultipart(input: {
  name: string;
  size: number;
  mime_type: string;
}): Promise<TransferMultipartInit> {
  try {
    const res = await fetch(`${API_URL}/api/v1/transfer/multipart/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return (await res.json()) as TransferMultipartInit;
  } catch {
    return NETWORK_ERR;
  }
}

/** Re-presign part URLs (resume after the originals expire). */
export async function refreshTransferPartUrls(input: {
  uploadId: string;
  storageKey: string;
  partNumbers: number[];
}): Promise<TransferPartUrls> {
  try {
    const res = await fetch(`${API_URL}/api/v1/transfer/multipart/part-urls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return (await res.json()) as TransferPartUrls;
  } catch {
    return NETWORK_ERR;
  }
}

/** Finalize the multipart upload — assembles the object and mints the code. */
export async function completeTransferMultipart(input: {
  uploadId: string;
  storageKey: string;
  name: string;
  size: number;
  mime_type: string;
  sender_alias?: string;
  one_time?: boolean;
}): Promise<TransferMultipartComplete> {
  try {
    const res = await fetch(`${API_URL}/api/v1/transfer/multipart/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return (await res.json()) as TransferMultipartComplete;
  } catch {
    return NETWORK_ERR;
  }
}

/**
 * Sender-side delete: DELETE /api/v1/transfer/delete/:code with the
 * X-Delete-Token returned by the upload. Flat `{success,message}` response.
 */
export async function deleteTransfer(code: string, deleteToken: string): Promise<FlatResponse> {
  try {
    const res = await fetch(`${API_URL}/api/v1/transfer/delete/${code}`, {
      method: "DELETE",
      headers: { "X-Delete-Token": deleteToken },
    });
    return (await res.json()) as FlatResponse;
  } catch {
    return {
      success: false,
      error: { code: "NETWORK_ERROR", message: "Connection problem — please try again" },
    };
  }
}

// ── File requests ──

export async function getRequestInfo(code: string): Promise<APIResponse<FileRequestInfo>> {
  return fetchJSON(`${API_URL}/api/v1/requests/${code}`, { cache: "no-store" });
}

export function getRequestUploadURL(code: string): string {
  return `${API_URL}/api/v1/requests/${code}/upload`;
}
