// Renders the pages built ahead of time into dist/assets/_p, next to the files of public/, and compiles the ones the
// Worker renders itself into dist/pages.mjs. Run build-assets.mjs first.
import { spawnSync } from "node:child_process";
import { cpSync, rmSync } from "node:fs";
import { join } from "node:path";
import { bundlePages, bundleWorker, ROOT } from "./bundle.mjs";

const DIST = join(ROOT, "dist");
const ASSETS = join(DIST, "assets");
const program = join(ROOT, "node_modules/.cache/site-pages.mjs");
await Promise.all([bundlePages({ outfile: program }), bundleWorker({ outfile: join(DIST, "pages.mjs") })]);

rmSync(ASSETS, { recursive: true, force: true });
cpSync(join(ROOT, "public"), ASSETS, { recursive: true });
const run = spawnSync(process.execPath, [program, join(ASSETS, "_p")], { cwd: ROOT, stdio: "inherit" });
process.exit(run.status ?? 1);
