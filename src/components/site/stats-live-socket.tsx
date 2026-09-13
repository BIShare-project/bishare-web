"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Real-time updates for the /stats page over WebSocket. A single global
 * Durable Object (StatsLiveDO) watches the stats state and pushes a "changed"
 * ping when it moves; we then `router.refresh()` (re-reads D1, patches the DOM).
 * One server-side watcher for all viewers — far cheaper than per-tab polling,
 * and it only refreshes when something actually changed.
 *
 * A slow interval is kept as a fallback for environments where the WS is blocked
 * (corporate proxies, etc.), and the socket auto-reconnects on drop.
 *
 * On "changed" each tab waits until the server's shared stats cache (10 s) has
 * expired — refreshing sooner would redraw the numbers from before the change —
 * plus a random moment, so every open tab doesn't re-render at the same instant.
 */
const REFRESH_MIN_DELAY_MS = 11_000;
const REFRESH_JITTER_MS = 5000;

export function StatsLiveSocket({ fallbackMs = 60000 }: { fallbackMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    let stopped = false;
    let ws: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let pending: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      if (stopped) return;
      try {
        const proto = location.protocol === "https:" ? "wss" : "ws";
        ws = new WebSocket(`${proto}://${location.host}/stats-live`);
        ws.onmessage = (e) => {
          if (e.data === "changed" && pending === undefined) {
            pending = setTimeout(() => {
              pending = undefined;
              router.refresh();
            }, REFRESH_MIN_DELAY_MS + Math.random() * REFRESH_JITTER_MS);
          }
        };
        ws.onclose = () => {
          ws = null;
          if (!stopped) retry = setTimeout(connect, 3000);
        };
        ws.onerror = () => {
          try {
            ws?.close();
          } catch {
            /* noop */
          }
        };
      } catch {
        retry = setTimeout(connect, 3000);
      }
    };
    connect();

    const fb = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, fallbackMs);

    return () => {
      stopped = true;
      clearTimeout(retry);
      clearTimeout(pending);
      clearInterval(fb);
      try {
        ws?.close();
      } catch {
        /* noop */
      }
    };
  }, [router, fallbackMs]);

  return null;
}
