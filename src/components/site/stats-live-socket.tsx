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
 */
export function StatsLiveSocket({ fallbackMs = 20000 }: { fallbackMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    let stopped = false;
    let ws: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      if (stopped) return;
      try {
        const proto = location.protocol === "https:" ? "wss" : "ws";
        ws = new WebSocket(`${proto}://${location.host}/stats-live`);
        ws.onmessage = (e) => {
          if (e.data === "changed") router.refresh();
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
