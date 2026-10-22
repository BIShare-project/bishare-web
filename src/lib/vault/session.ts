// The web Drive's keys in this browser (drive-plan.md task 6.4).
//
// A browser opened by a device's approval holds two secrets: its device seed
// (it signs every request) and the vault key VK. They are sealed with an
// AES-GCM key that is a non-extractable CryptoKey kept in IndexedDB: no
// script can export the wrapping key, and the raw keys are never stored.
// With "Stay on this browser" the sealed secrets sit next to that key in
// IndexedDB. Without it they live in the tab's sessionStorage only, so
// closing the tab forgets them: what is left on disk is a key that opens
// nothing. Such tabs each have their own record, so signing in in one tab
// never signs another out.

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
  /** The sealed secrets, for a browser that stays; else in sessionStorage. */
  iv?: Uint8Array<ArrayBuffer>;
  sealed?: ArrayBuffer;
  wrapKey: CryptoKey;
}

const DB = "bishare-drive";
const STORE = "session";
const KEY = "current";
const SEALED = "bishare-drive-sealed";

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

/** A tab's own session: the IndexedDB key of its wrapping key, and the sealed secrets (iv then ciphertext). */
interface TabSession {
  key: string;
  sealed: Uint8Array;
}

function tabSession(set?: TabSession | null): TabSession | null {
  try {
    if (set === null) sessionStorage.removeItem(SEALED);
    else if (set) sessionStorage.setItem(SEALED, JSON.stringify({ k: set.key, s: b64(set.sealed) }));
    const v = sessionStorage.getItem(SEALED);
    if (!v) return null;
    const j = JSON.parse(v) as { k?: unknown; s?: unknown };
    return typeof j.k === "string" && typeof j.s === "string" ? { key: j.k, sealed: unb64(j.s) } : null;
  } catch {
    return null;
  }
}

function b64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function unb64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Browsers bring sessionStorage back with a closed tab (Reopen closed tab,
// session restore), so "closing the tab forgets them" needs help: leaving the
// page leaves a mark, and only a reload may open the session past it. Coming
// back any other way (a reopened tab, typing the address again) asks for the
// code again. A page kept whole in the back-forward cache clears the mark.
const LEFT = "bishare-drive-left";
let watching = false;

function watchTab(): void {
  if (watching || typeof window === "undefined") return;
  watching = true;
  addEventListener("pagehide", () => {
    try {
      sessionStorage.setItem(LEFT, String(Date.now()));
    } catch {
      // No storage, no session to protect.
    }
  });
  addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    try {
      sessionStorage.removeItem(LEFT);
    } catch {
      // As above.
    }
  });
}

/** The tab was left and this load is not a reload of it. */
function tabWasLeft(): boolean {
  try {
    const left = sessionStorage.getItem(LEFT);
    sessionStorage.removeItem(LEFT);
    if (!left) return false;
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    return nav?.type !== "reload";
  } catch {
    return false;
  }
}

// A tab's wrapping key outlives the tab (sessionStorage goes, IndexedDB
// stays) but opens nothing without it; old ones are swept at the next save.
const TAB_PREFIX = "tab:";
const TAB_KEEP_MS = 7 * 86_400_000;

async function sweepTabs(): Promise<void> {
  const keys = await tx<IDBValidKey[]>("readonly", (st) => st.getAllKeys());
  for (const k of keys) {
    if (typeof k !== "string" || !k.startsWith(TAB_PREFIX)) continue;
    const rec = await tx<StoredSession | undefined>("readonly", (st) => st.get(k) as IDBRequest<StoredSession | undefined>);
    if (!rec || Date.now() - rec.openedAt > TAB_KEEP_MS) await tx("readwrite", (st) => st.delete(k));
  }
}

export async function saveSession(s: DriveSession): Promise<void> {
  watchTab();
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
    wrapKey,
    ...(s.stay ? { iv, sealed } : {}),
  };
  await sweepTabs().catch(() => undefined);
  if (s.stay) {
    await tx("readwrite", (st) => st.put(record, KEY));
    tabSession(null);
    return;
  }
  // Each tab its own record, so one tab's sign-in never replaces another's.
  const key = TAB_PREFIX + b64(crypto.getRandomValues(new Uint8Array(9)));
  await tx("readwrite", (st) => st.put(record, key));
  const both = new Uint8Array(12 + sealed.byteLength);
  both.set(iv, 0);
  both.set(new Uint8Array(sealed), 12);
  tabSession({ key, sealed: both });
}

/** This tab's session, else the browser's "Stay" session, else null (never opened, locked, or the tab was closed). */
export async function loadSession(): Promise<DriveSession | null> {
  watchTab();
  let tab = tabSession();
  if (tab && tabWasLeft()) {
    await forget(tab.key);
    tab = null;
  }
  let key = KEY;
  let rec: StoredSession | undefined;
  try {
    if (tab) {
      rec = await tx<StoredSession | undefined>("readonly", (st) => st.get(tab.key) as IDBRequest<StoredSession | undefined>);
      if (rec) key = tab.key;
      else tabSession(null);
    }
    rec ??= await tx<StoredSession | undefined>("readonly", (st) => st.get(KEY) as IDBRequest<StoredSession | undefined>);
  } catch {
    return null;
  }
  if (!rec) return null;
  const iv = key === KEY ? rec.iv : tab!.sealed.slice(0, 12);
  const sealed = key === KEY ? rec.sealed : tab!.sealed.slice(12).buffer;
  if (!iv || !sealed) {
    // A record from before the secrets moved to the tab: nothing to open.
    await forget(key);
    return null;
  }
  try {
    const plain = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, rec.wrapKey, sealed));
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
    await forget(key);
    return null;
  }
}

async function forget(key: string): Promise<void> {
  if (key !== KEY) tabSession(null);
  try {
    await tx("readwrite", (st) => st.delete(key));
  } catch {
    // Nothing stored.
  }
}

/** Lock: this session's keys are gone from this browser. */
export async function clearSession(): Promise<void> {
  const tab = tabSession();
  await forget(tab ? tab.key : KEY);
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
