// BIShare web Worker entry. The site is src/site/app.ts: pages built ahead of time, and the few rendered on request.
// The file-transfer API is a separate service reached over HTTPS (src/lib/api-url.ts).
import type { Env } from "../server/types";
import { handle } from "../src/site/app";

export { StatsLiveDO } from "../server/do/stats-live";

export default {
  fetch: (req, env, ctx) => handle(req, env, ctx, () => import("../dist/pages.mjs")),
} satisfies ExportedHandler<Env>;
