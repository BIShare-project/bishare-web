// Renders the pages built ahead of time to HTML, and compiles the ones the Worker renders itself (.hono/worker.mjs):
// node scripts/build-hono-pages.mjs [out folder]. Run build-hono-assets.mjs first.
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { bundlePages, bundleWorker, ROOT } from "./hono-bundle.mjs";

const out = resolve(process.argv[2] ?? join(ROOT, ".hono/pages"));
const outfile = join(ROOT, "node_modules/.cache/hono-pages.mjs");
await bundlePages({ outfile });
await bundleWorker({ outfile: join(ROOT, ".hono/worker.mjs") });
const run = spawnSync(process.execPath, [outfile, out], { cwd: ROOT, stdio: "inherit" });
process.exit(run.status ?? 1);
