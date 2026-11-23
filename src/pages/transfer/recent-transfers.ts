/**
 * Sender-side memory of browser uploads (localStorage). Written by
 * `FileUpload` right after a successful upload and read by the
 * "Your uploads" list on /transfer — review fix #17 turned the previously
 * write-only store into a real feature instead of deleting it.
 *
 * Client-only: every function touches `localStorage` and must be called
 * from effects/handlers, never during server render.
 */

export interface RememberedTransfer {
  /** Raw 6-char code used in URLs and the delete endpoint. */
  rawCode: string;
  /** Sender-side delete credential returned by the upload. */
  deleteToken?: string;
  fileName: string;
  expiresAt?: string;
  oneTime: boolean;
}

export const TRANSFER_STORAGE_KEY = "bishare.web-transfers";

/** "ABCDEF" → "ABC-DEF" (how the apps display transfer codes). */
export function formatDisplayCode(rawCode: string): string {
  return rawCode.length === 6
    ? `${rawCode.slice(0, 3)}-${rawCode.slice(3)}`
    : rawCode;
}

function readList(): unknown[] {
  const parsed = JSON.parse(
    localStorage.getItem(TRANSFER_STORAGE_KEY) ?? "[]"
  ) as unknown;
  return Array.isArray(parsed) ? parsed : [];
}

/**
 * Valid, unexpired remembered uploads, newest first. Expired or malformed
 * entries are pruned from storage as a side effect.
 */
export function listRememberedTransfers(): RememberedTransfer[] {
  try {
    const raw = readList();
    const now = Date.now();
    const list = raw.filter((item): item is RememberedTransfer => {
      if (typeof item !== "object" || item === null) return false;
      const t = item as Partial<RememberedTransfer>;
      if (typeof t.rawCode !== "string" || t.rawCode.length === 0) return false;
      if (typeof t.fileName !== "string" || t.fileName.length === 0) return false;
      if (t.expiresAt && new Date(t.expiresAt).getTime() <= now) return false;
      return true;
    });
    if (list.length !== raw.length) {
      localStorage.setItem(TRANSFER_STORAGE_KEY, JSON.stringify(list));
    }
    return list;
  } catch {
    return [];
  }
}

export function rememberTransfer(entry: RememberedTransfer): void {
  try {
    const list = readList();
    list.unshift(entry);
    localStorage.setItem(
      TRANSFER_STORAGE_KEY,
      JSON.stringify(list.slice(0, 20))
    );
  } catch {
    // localStorage unavailable — sender-side delete still works in-session.
  }
}

export function forgetTransfer(rawCode: string): void {
  try {
    const list = readList() as { rawCode?: string }[];
    localStorage.setItem(
      TRANSFER_STORAGE_KEY,
      JSON.stringify(list.filter((item) => item.rawCode !== rawCode))
    );
  } catch {
    // ignore
  }
}
