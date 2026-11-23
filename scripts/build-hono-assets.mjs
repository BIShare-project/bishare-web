// Builds the static files of the Hono pages into public/_h: one stylesheet, the fonts, and one ES module per file in
// src/hono/client. Every name carries a content hash; src/hono/assets.gen.ts lists them for the pages.
// Run from the repo root: node scripts/build-hono-assets.mjs. The outputs are git-ignored.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { build } from "esbuild";

const ROOT = resolve(import.meta.dirname, "..");
const HONO = join(ROOT, "src/hono");
const OUT = join(ROOT, "public/_h");
const hash8 = (buf) => createHash("sha256").update(buf).digest("hex").slice(0, 8);

rmSync(OUT, { recursive: true, force: true });
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

// Client modules.
const clientDir = join(HONO, "client");
const entries = existsSync(clientDir)
  ? readdirSync(clientDir).filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f)).map((f) => join(clientDir, f))
  : [];
const scripts = {};
if (entries.length) {
  const { metafile } = await build({
    absWorkingDir: ROOT,
    entryPoints: entries,
    outdir: OUT,
    entryNames: "[name]-[hash]",
    chunkNames: "chunk-[hash]",
    bundle: true,
    splitting: true,
    format: "esm",
    minify: true,
    target: "es2022",
    alias: { "@": join(ROOT, "src") },
    metafile: true,
    logLevel: "warning",
  });
  for (const [file, meta] of Object.entries(metafile.outputs)) {
    if (!meta.entryPoint || !entries.includes(join(ROOT, meta.entryPoint))) continue;
    scripts[basename(meta.entryPoint).replace(/\.tsx?$/, "")] = `/_h/${basename(file)}`;
  }
}

const assets = { css: `/_h/${cssName}`, fonts, scripts };
writeFileSync(
  join(HONO, "assets.gen.ts"),
  `// Written by scripts/build-hono-assets.mjs; do not edit.\nexport const ASSETS: { css: string; fonts: string[]; scripts: Record<string, string> } = ${JSON.stringify(assets, null, 2)};\n`,
);
console.log(`hono assets: ${cssName} ${css.length} B, ${fonts.length} preloaded fonts, ${Object.keys(scripts).length} client modules`);
