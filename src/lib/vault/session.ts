// The web Drive's keys in this browser (drive-plan.md task 6.4).
//
// A browser opened by a device's approval holds two secrets: its device seed
// (it signs every request) and the vault key VK. Both are kept in IndexedDB,
// sealed with an AES-GCM key that is itself a non-extractable CryptoKey in
// the same database: what lands on disk is never the raw keys, and no script
// can export the wrapping key. Without "Stay on this browser" the record is
// tied to the tab's session: a flag in sessionStorage marks it, and a load
// that finds the record without the flag (the tab was closed) wipes it.

export interface DriveSession {
  vaultId: string;
  deviceId: string;
  /** Ed25519 seed of this browser's device key. */
  seed: Uint8Array;
  vaultKey: Uint8Array;
  /** "Stay on this browser" was ticked at sign-in. */
  stay: boolean;
  /** How this browser named itself ("Chrome on macOS"). */
  name: string;
  openedAt: number;
}

interface StoredSession {
  vaultId: string;
  deviceId: string;
  stay: boolean;
  name: string;
  openedAt: number;
  iv: Uint8Array<ArrayBuffer>;
  sealed: ArrayBuffer;
  wrapKey: CryptoKey;
}

const DB = "bishare-drive";
const STORE = "session";
const KEY = "current";
const OPEN_FLAG = "bishare-drive-open";

function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = run(d.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    d.close();
  }
}

function sessionFlag(set?: boolean): boolean {
  try {
    if (set === true) sessionStorage.setItem(OPEN_FLAG, "1");
    if (set === false) sessionStorage.removeItem(OPEN_FLAG);
    return sessionStorage.getItem(OPEN_FLAG) === "1";
  } catch {
    return false;
  }
}

export async function saveSession(s: DriveSession): Promise<void> {
  const wrapKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const secrets = new Uint8Array(64);
  secrets.set(s.seed, 0);
  secrets.set(s.vaultKey, 32);
  const sealed = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, wrapKey, secrets);
  secrets.fill(0);
  const record: StoredSession = {
    vaultId: s.vaultId,
    deviceId: s.deviceId,
    stay: s.stay,
    name: s.name,
    openedAt: s.openedAt,
    iv,
    sealed,
    wrapKey,
  };
  await tx("readwrite", (st) => st.put(record, KEY));
  sessionFlag(true);
}

/** This browser's session, or null (never opened, locked, or the tab of a session without "Stay" was closed). */
export async function loadSession(): Promise<DriveSession | null> {
  let rec: StoredSession | undefined;
  try {
    rec = await tx<StoredSession | undefined>("readonly", (st) => st.get(KEY) as IDBRequest<StoredSession | undefined>);
  } catch {
    return null;
  }
  if (!rec) return null;
  if (!rec.stay && !sessionFlag()) {
    await clearSession();
    return null;
  }
  try {
    const plain = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: rec.iv }, rec.wrapKey, rec.sealed));
    sessionFlag(true);
    return {
      vaultId: rec.vaultId,
      deviceId: rec.deviceId,
      seed: plain.slice(0, 32),
      vaultKey: plain.slice(32, 64),
      stay: rec.stay,
      name: rec.name,
      openedAt: rec.openedAt,
    };
  } catch {
    await clearSession();
    return null;
  }
}

/** Lock: the keys are gone from this browser. */
export async function clearSession(): Promise<void> {
  sessionFlag(false);
  try {
    await tx("readwrite", (st) => st.delete(KEY));
  } catch {
    // Nothing stored.
  }
}

/** "Chrome on macOS", for the approving device and the device list. */
export function browserName(): string {
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Browser";
  const system = /Windows/.test(ua)
    ? "Windows"
    : /Android/.test(ua)
      ? "Android"
      : /iPhone|iPad|iPod/.test(ua)
        ? "iOS"
        : /Mac OS X|Macintosh/.test(ua)
          ? "macOS"
          : /Linux|X11/.test(ua)
            ? "Linux"
            : "";
  return system ? `${browser} on ${system}` : browser;
}
