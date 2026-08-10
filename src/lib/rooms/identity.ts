// A stable, anonymous browser identity for Rooms: a random fingerprint (kept in
// localStorage so a reconnect/refresh keeps the same seat) plus a display alias
// the user can change. No account, no PII — just a per-browser handle.

const FP_KEY = "bishare.room.fingerprint";
const ALIAS_KEY = "bishare.room.alias";

/** 32-hex-char random id (crypto). Stable per browser once generated. */
export function getFingerprint(): string {
  if (typeof window === "undefined") return "";
  let fp = localStorage.getItem(FP_KEY);
  if (!fp) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    fp = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    localStorage.setItem(FP_KEY, fp);
  }
  return fp;
}

export function getAlias(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(ALIAS_KEY) ?? "";
}

export function setAlias(alias: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ALIAS_KEY, alias.trim().slice(0, 40));
}

export const DEVICE_TYPE = "web" as const;
