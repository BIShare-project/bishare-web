// Builds the static files of the Hono pages into public/_h: one stylesheet, the fonts, and one ES module per file in
// src/hono/client. Every name carries a content hash; src/hono/assets.gen.ts lists them for the pages.
// Run from the repo root: node scripts/build-hono-assets.mjs. The outputs are git-ignored.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { bundleBrowser, bundlePages, bundleWorker } from "./hono-bundle.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const HONO = join(ROOT, "src/hono");
const OUT = join(ROOT, "public/_h");
const hash8 = (buf) => createHash("sha256").update(buf).digest("hex").slice(0, 8);

// A build for production starts clean; while developing, pages built a moment ago still point at the old names.
if (process.argv.includes("--clean")) rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "fonts"), { recursive: true });

// Fonts. next/font preloads the latin subset of IBM Plex Sans only: the Sans faces whose range starts with U+??.
const fontDir = join(HONO, "fonts");
for (const f of readdirSync(fontDir)) if (f.endsWith(".woff2")) copyFileSync(join(fontDir, f), join(OUT, "fonts", f));
const faces = readFileSync(join(fontDir, "fonts.css"), "utf8").match(/@font-face\{[^}]*\}/g) ?? [];
const fonts = [
  ...new Set(
    faces
      .filter((f) => f.includes("font-family:IBM Plex Sans;") && f.includes("unicode-range:U+??,"))
      .map((f) => /url\(([^)]+)\)/.exec(f)[1]),
  ),
];

// Stylesheet.
const tmp = join(OUT, "site.tmp.css");
execFileSync(join(ROOT, "node_modules/.bin/tailwindcss"), ["-i", join(HONO, "styles.css"), "-o", tmp, "--minify"], {
  cwd: ROOT,
  stdio: ["ignore", "ignore", "inherit"],
});
const css = readFileSync(tmp);
rmSync(tmp);
const cssName = `site-${hash8(css)}.css`;
writeFileSync(join(OUT, cssName), css);

// Browser modules: the shared ones of src/hono/client, and one per island the pages use.
const clientDir = join(HONO, "client");
const entries = ["site.ts"].map((f) => join(clientDir, f));
const look = { outfile: join(ROOT, "node_modules/.cache/hono-islands.mjs"), write: false };
const islandFiles = [...new Set([...(await bundlePages(look)), ...(await bundleWorker(look))])].sort();
const { scripts, islands } = await bundleBrowser({ entries, islands: islandFiles, outdir: OUT });

const assets = { css: `/_h/${cssName}`, fonts, scripts, islands };
writeFileSync(
  join(HONO, "assets.gen.ts"),
  `// Written by scripts/build-hono-assets.mjs; do not edit.\nexport const ASSETS: { css: string; fonts: string[]; scripts: Record<string, string>; islands: Record<string, string> } = ${JSON.stringify(assets, null, 2)};\n`,
);
console.log(`hono assets: ${cssName} ${css.length} B, ${fonts.length} preloaded fonts, ${Object.keys(scripts).length} shared modules, ${Object.keys(islands).length} islands`);
