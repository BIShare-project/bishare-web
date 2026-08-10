"use client";

import { useEffect } from "react";

/**
 * Registers the marketing PWA service worker (public/sw.js). Rendered only in
 * the (site) layout, so it never runs on the admin or (dormant) Web Drive
 * surfaces. Registration is best-effort — a failure (unsupported browser,
 * blocked SW) is silent and the site works exactly as before.
 */
export function PWARegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const register = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    // Register after load so it never competes with first paint.
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
