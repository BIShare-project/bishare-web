// Saving a received file from dl.bishareusercontent.com instead of the page it
// arrived on (safe-browsing-audit-2026-10-24.md).
//
// Safe Browsing marks the host that downloads come from. Files people share
// are new every time and end-to-end encrypted, so they always look
// "uncommon", and Google flagged bishare.app for it on 2026-10-23. Received
// shared links already save from dl.bishareusercontent.com (middleware.ts); Nearby,
// QR Beam and Rooms receive into the marketing pages themselves, so their
// last step, the save, goes through a hidden frame on that host
// (public/save-bridge.html). Nothing on the page changes.
//
// The frame is made on the first save, never on page load. Anywhere else
// (localhost, previews) and whenever the frame does not answer, the file is
// saved right here as before: a save never fails because of the bridge.

// public/save-bridge.html: static HTML answers at its path without ".html".
const BRIDGE_URL = "https://dl.bishareusercontent.com/save-bridge";
const MAIN_HOSTS = new Set(["bishare.app", "www.bishare.app"]);
const READY_MS = 4000;

let bridge: Promise<Window | null> | null = null;

/** Where the bridge lives, or null where files save on the page itself. */
function bridgeUrl(): string | null {
  if (typeof window === "undefined") return null;
  // Local tests point it at another origin of the dev server
  // (http://127.0.0.1:<port>/save-bridge.html for a page on localhost), where
  // the bridge accepts local parents.
  const local = process.env.NEXT_PUBLIC_SAVE_BRIDGE_URL;
  if (local) return local;
  return MAIN_HOSTS.has(location.hostname) ? BRIDGE_URL : null;
}

/** Whether saves go through the bridge here (no save dialog in a frame). */
export function savesThroughBridge(): boolean {
  return bridgeUrl() !== null;
}

function openBridge(url: string): Promise<Window | null> {
  const origin = new URL(url).origin;
  return new Promise((resolve) => {
    const frame = document.createElement("iframe");
    frame.src = url;
    frame.hidden = true;
    frame.tabIndex = -1;
    frame.setAttribute("aria-hidden", "true");
    const done = (win: Window | null) => {
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      if (!win) frame.remove();
      resolve(win);
    };
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== origin || e.source !== frame.contentWindow) return;
      if ((e.data as { type?: string } | null)?.type === "bishare-save-ready") done(frame.contentWindow);
    };
    const timer = window.setTimeout(() => done(null), READY_MS);
    window.addEventListener("message", onMessage);
    document.body.appendChild(frame);
  });
}

/** Hand a file to the browser's download flow on this page. */
export function downloadHere(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Not at once: the download starts asynchronously (slowly, where the browser
  // first asks the user where to save) and a revoked URL fails it.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Save a received file, through the bridge where there is one. */
export async function saveFile(blob: Blob, name: string): Promise<void> {
  const url = bridgeUrl();
  if (url) {
    bridge ??= openBridge(url);
    const win = await bridge;
    if (win) {
      win.postMessage({ type: "bishare-save", blob, name }, new URL(url).origin);
      return;
    }
    bridge = null; // no answer: try again on the next save
  }
  downloadHere(blob, name);
}
