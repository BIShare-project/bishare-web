// BIShare web Worker entry (OpenNext). Serves the Next.js handler plus the
// realtime-stats WebSocket: /stats-live is forwarded to a single global
// Durable Object (StatsLiveDO) that watches the public stats and pushes a
// "changed" ping to connected clients. The file-transfer API is a separate
// service reached over HTTPS (see NEXT_PUBLIC_API_URL).
import nextHandler from "../.open-next/worker.js";
import type { Env } from "../server/types";

export { StatsLiveDO } from "../server/do/stats-live";

/**
 * Vulnerability scanners ask every site for its secrets: /.env, /.git/config,
 * /api/.env, /wp-login.php, /.aws/config… (±1,800 such 404s a day, Nov 2026).
 * Each one used to reach Next and render the not-found page, loading the full
 * server bundle: up to 1.7 s of CPU for a 404. None of these can ever be a page
 * of this site, so they get a plain 404 here, before Next is touched. Real
 * typos still get the normal not-found page.
 */
const PROBE =
  /(^|\/)\.(?!well-known(\/|$))|\.(php\d?|aspx?|jsp|cgi|env|bak|old|orig|save|swp|sql|ini|ya?ml|log|cfg|conf)(\/|$)|(^|\/)(wp-admin|wp-login|wp-content|wp-includes|xmlrpc|cgi-bin|phpmyadmin)(\/|\.|$)|\.\.|proc\/self/i;

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    // Realtime stats push — dedicated path forwarded to the single global
    // StatsLiveDO for the WebSocket upgrade (see /stats page socket client).
    if (url.pathname === "/stats-live") {
      const id = env.STATS_LIVE_DO.idFromName("global");
      return env.STATS_LIVE_DO.get(id).fetch(req);
    }
    if (PROBE.test(url.pathname)) {
      return new Response("Not found", {
        status: 404,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
          "X-Robots-Tag": "noindex",
        },
      });
    }
    return nextHandler.fetch(req, env, ctx);
  },
} satisfies ExportedHandler<Env>;
