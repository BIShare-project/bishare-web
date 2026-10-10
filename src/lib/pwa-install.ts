/**
 * The web-app install offer, in one place.
 *
 * Chromium fires `beforeinstallprompt` exactly once, as soon as it judges the
 * site installable, often before React has hydrated. The listener is attached
 * when this module loads, and the module is imported by the service-worker
 * registration in the (site) layout, so it is there on every page. It used to
 * live in the install button's own chunk, which only /transfer and /download
 * load: on every other page nothing called preventDefault(), and Chrome on
 * Android showed its own "Install app" bar for the web app.
 *
 * Phones get the store app, not the web app: it has LAN transfers, background
 * sends and a share-sheet target the web app cannot have. So on a phone the
 * event is cancelled and dropped. On a desktop it is cancelled and kept, and
 * the install button offers it.
 *
 * What this cannot reach: the "Install app" or "Add to Home screen" entry in a
 * browser's own menu, and the address-bar icon some Android browsers draw
 * without firing the event.
 */

/** Chromium's non-standard install event — not in lib.dom. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallState = "unavailable" | "installable" | "installed";
export type MobileOS = "android" | "ios" | null;

export function detectMobileOS(): MobileOS {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "android";
  // iPadOS reports a Mac user agent; a touch-capable "Mac" is an iPad.
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  return null;
}

let deferred: BeforeInstallPromptEvent | null = null;
let state: InstallState = "unavailable";
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  if (window.matchMedia("(display-mode: standalone)").matches) state = "installed";
  window.addEventListener("beforeinstallprompt", (e) => {
    // Always: this is what keeps the browser's own install bar away.
    e.preventDefault();
    if (detectMobileOS()) return;
    deferred = e as BeforeInstallPromptEvent;
    if (state !== "installed") {
      state = "installable";
      emit();
    }
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    state = "installed";
    emit();
  });
}

export const subscribeInstall = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export const getInstallState = () => state;
export const getServerInstallState = (): InstallState => "unavailable";

/**
 * Shows the browser's install dialog. The event can be used once, so whatever
 * the answer, the offer is gone until the next page load.
 */
export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  const ev = deferred;
  if (!ev) return "unavailable";
  try {
    await ev.prompt();
    return (await ev.userChoice).outcome;
  } catch {
    return "dismissed";
  } finally {
    deferred = null;
    if (state === "installable") {
      state = "unavailable"; // a dismissed prompt comes back on the next load
      emit();
    }
  }
}
