// Renders the Hono pages to HTML: node scripts/build-hono-pages.mjs [out folder]. Run build-hono-assets.mjs first.
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { bundlePages, ROOT } from "./hono-bundle.mjs";

const out = resolve(process.argv[2] ?? join(ROOT, ".hono/pages"));
const outfile = join(ROOT, "node_modules/.cache/hono-pages.mjs");
await bundlePages({ outfile });
const run = spawnSync(process.execPath, [outfile, out], { cwd: ROOT, stdio: "inherit" });
process.exit(run.status ?? 1);
