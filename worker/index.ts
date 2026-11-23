// BIShare web Worker entry. The site is src/hono/app.ts: pages built ahead of time, and the few rendered on request.
// The file-transfer API is a separate service reached over HTTPS (see NEXT_PUBLIC_API_URL).
import type { Env } from "../server/types";
import { handle } from "../src/hono/app";

export { StatsLiveDO } from "../server/do/stats-live";

export default {
  fetch(req, env, ctx) {
    return handle(
      req,
      env,
      ctx,
      () => import("../.hono/worker.mjs"),
      // Drive is still Next's.
      async (r) => (await import("../.open-next/worker.js")).default.fetch(r, env, ctx),
    );
  },
} satisfies ExportedHandler<Env>;
