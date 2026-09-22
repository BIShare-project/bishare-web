import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

/**
 * Every page view was re-rendering on the Worker. The pages are prerendered at
 * build time — 551 of them — and the responses even ask to be cached
 * (`s-maxage=31536000`), but with no incremental cache configured OpenNext had
 * nowhere to read them from: `x-nextjs-cache: MISS`, every request, measured
 * TTFB 0.5–1.5s.
 *
 * The static-assets cache serves those prerendered payloads straight from the
 * deployed Workers assets. It is read-only and cannot revalidate — which is
 * exactly right here: nothing in this app uses ISR (no `revalidate`, no
 * `revalidatePath`/`revalidateTag`), and the one genuinely live page, /stats,
 * is `export const dynamic` so it never touches this path. No KV namespace, no
 * R2 bucket, no new binding, nothing to pay for: the assets are already
 * deployed alongside the worker.
 */
/**
 * Cache interception: serve a prerendered page from the routing layer, before
 * the Next server is ever loaded.
 *
 * Measured on production 2026-09-22: TTFB was 114ms on a warm isolate and
 * 1.0-2.0s on a cold one, with `x-nextjs-cache: HIT` in both cases — so the
 * cost was not the cache, it was booting the isolate. The worker entry imports
 * the routing layer statically (749 KB) but `server-functions/default/handler.mjs`
 * — 27.6 MB of Next server — through a dynamic `import()` that only runs when
 * routing has not already produced a Response. Cache interception produces that
 * Response, so the 27.6 MB import never happens for a prerendered page.
 *
 * It runs AFTER next-intl's middleware and after every rewrite, so locale
 * detection, redirects and 404 handling are untouched. It keys off the
 * prerender manifest, so the pages that must stay live — /stats (`dynamic`)
 * and /transfer/[code] — fall through to the server as before. It answers an
 * `RSC: 1` request with `text/x-component` and everything else with
 * `text/html`, and it carries the cached status code and headers through.
 *
 * PPR is not enabled here, which is the one configuration the flag is
 * documented as incompatible with.
 */
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
