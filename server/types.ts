/// <reference types="@cloudflare/workers-types" />

/** What the Worker is given (wrangler.jsonc). */
export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  STATS_LIVE_DO: DurableObjectNamespace;
  /** Another API than https://api.bishare.app, for local tests. */
  API_URL?: string;
}
