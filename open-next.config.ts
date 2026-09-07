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
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
