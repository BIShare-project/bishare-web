import { getCloudflareContext } from "@opennextjs/cloudflare";

interface D1Lite {
  prepare(q: string): {
    bind(...v: unknown[]): { run(): Promise<unknown> };
  };
}

/**
 * Best-effort additive stats_daily counter, fired from marketing server
 * components for growth observability (receive-loop metrics). Never throws and
 * never blocks the render — the write runs via ctx.waitUntil. Read back from the
 * admin report; the cron leaves these metrics alone (additive event counters).
 */
export function bumpStat(metric: string, by = 1): void {
  try {
    const { env, ctx } = getCloudflareContext();
    const db = (env as unknown as { DB: D1Lite }).DB;
    const p = db
      .prepare(
        `INSERT INTO stats_daily (date, metric, value)
           VALUES (strftime('%Y-%m-%d', 'now'), ?, ?)
         ON CONFLICT(date, metric) DO UPDATE SET value = value + ?`
      )
      .bind(metric, by, by)
      .run()
      .catch(() => {});
    ctx?.waitUntil?.(p as Promise<unknown>);
  } catch {
    /* no Cloudflare context (e.g. at build time) — skip */
  }
}
