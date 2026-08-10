// BIShare web Worker entry (OpenNext). Serves the Next.js handler plus the
// realtime-stats WebSocket: /stats-live is forwarded to a single global
// Durable Object (StatsLiveDO) that watches the public stats and pushes a
// "changed" ping to connected clients. The file-transfer API is a separate
// service reached over HTTPS (see NEXT_PUBLIC_API_URL).
import nextHandler from "../.open-next/worker.js";
import type { Env } from "../server/types";

export { StatsLiveDO } from "../server/do/stats-live";

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    // Realtime stats push — dedicated path forwarded to the single global
    // StatsLiveDO for the WebSocket upgrade (see /stats page socket client).
    if (url.pathname === "/stats-live") {
      const id = env.STATS_LIVE_DO.idFromName("global");
      return env.STATS_LIVE_DO.get(id).fetch(req);
    }
    return nextHandler.fetch(req, env, ctx);
  },
} satisfies ExportedHandler<Env>;
