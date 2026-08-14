"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Thin top progress bar for client navigations. App Router gives no feedback
 * between "link clicked" and "new tree rendered" — on a slow link the page
 * just sits there.
 *
 * Start signals: same-origin anchor clicks to a different path, back/forward
 * (popstate), and history.pushState (router.push — the App Router pushes the
 * URL optimistically at navigation start).
 *
 * Finish signal: the `bishare:navigated` event from (site)/template.tsx,
 * whose remount-effect runs when the new page tree is actually committed.
 * usePathname is deliberately NOT used — it updates optimistically at
 * navigation START, which would finish the bar the moment it starts.
 *
 * Anti-flash: the bar only becomes visible if the navigation is still pending
 * after 120 ms, so prefetched static hops never flicker.
 */
export function NavigationProgress() {
  const [progress, setProgress] = useState(0);
  const [shown, setShown] = useState(false);

  const active = useRef(false);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failsafe = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (showTimer.current) clearTimeout(showTimer.current);
    if (failsafe.current) clearTimeout(failsafe.current);
    if (trickle.current) clearInterval(trickle.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    showTimer.current = failsafe.current = hideTimer.current = null;
    trickle.current = null;
  };

  const finish = useCallback(() => {
    if (!active.current) return;
    active.current = false;
    clearTimers();
    setProgress(100);
    hideTimer.current = setTimeout(() => {
      setShown(false);
      setProgress(0);
    }, 260);
  }, []);

  const start = useCallback(() => {
    if (active.current) return;
    active.current = true;
    clearTimers();
    setProgress(12);
    showTimer.current = setTimeout(() => setShown(true), 120);
    trickle.current = setInterval(() => {
      setProgress((p) => (p < 90 ? p + (90 - p) * 0.12 : p));
    }, 220);
    failsafe.current = setTimeout(finish, 15000);
  }, [finish]);

  useEffect(() => {
    // Path-only comparison: search-param tweaks and hash jumps re-render in
    // place and never remount the template, so they must not start the bar.
    const samePath = (href: string) => {
      try {
        return (
          new URL(href, window.location.href).pathname ===
          window.location.pathname
        );
      } catch {
        return true;
      }
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || anchor.target === "_blank" || anchor.hasAttribute("download"))
        return;
      if (new URL(href, window.location.href).origin !== window.location.origin)
        return;
      if (samePath(href)) return;
      start();
    };

    const onPop = () => start();
    const onDone = () => finish();

    const original = history.pushState.bind(history);
    history.pushState = (...args) => {
      const url = args[2];
      if (url != null && !samePath(String(url))) start();
      return original(...args);
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    window.addEventListener("bishare:navigated", onDone);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("bishare:navigated", onDone);
      history.pushState = original;
      clearTimers();
    };
  }, [start, finish]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 120,
        pointerEvents: "none",
        opacity: shown ? 1 : 0,
        transition: "opacity 180ms ease",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background:
            "linear-gradient(90deg, var(--brand-from), var(--brand-mid), var(--brand-to))",
          boxShadow: shown ? "0 0 10px rgba(56, 189, 248, 0.55)" : "none",
          transition: "width 200ms ease",
        }}
      />
    </div>
  );
}
