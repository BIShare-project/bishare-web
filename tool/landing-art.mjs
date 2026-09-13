/**
 * Renders the custom art for SEO landing pages, one set per locale.
 *
 * Each page has a definition in tool/art/<slug>.mjs exporting `ns` (its
 * message namespace) and `images`: { name: { w, h, mirror?, draw(labels,
 * locale) } }. `mirror: true` flips tables, flows and charts for Arabic.
 * Labels come from src/messages/<locale>/<ns>.json under "art", the same file
 * the page reads its alt text and captions from, so image text, alt and page
 * copy are translated together and cannot drift apart.
 *
 * Output: public/img/<slug>/<name>.<locale>.webp for every image, plus
 * hero.<locale>.jpg (og:image and social previews need a raster, and not all
 * scrapers take webp).
 *
 * Run:   node tool/landing-art.mjs <slug> [locale ...]
 * Needs: cwebp on PATH (brew install webp) and Playwright's chromium.
 */
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { FIT_SCRIPT, MIRROR_SCRIPT } from "./art/kit.mjs";

const LOCALES = ["en", "ar", "de", "es", "fr", "hi", "id", "ja", "ko", "pt-BR", "ru", "zh-Hans", "zh-Hant"];
const [slug, ...only] = process.argv.slice(2);
if (!slug) { console.error("usage: node tool/landing-art.mjs <slug> [locale ...]"); process.exit(1); }
const def = await import(`./art/${slug}.mjs`);
const locales = only.length ? only : LOCALES;

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
const outDir = path.join("public/img", slug);
fs.mkdirSync(outDir, { recursive: true });

for (const locale of locales) {
  const msgs = JSON.parse(fs.readFileSync(`src/messages/${locale}/${def.ns}.json`, "utf8"));
  if (!msgs.art) throw new Error(`${locale}/${def.ns}.json has no "art" block`);
  for (const [name, img] of Object.entries(def.images)) {
    const labels = msgs.art[name];
    if (!labels) throw new Error(`${locale}: art.${name} missing`);
    await page.setViewportSize({ width: img.w, height: img.h });
    const dir = locale === "ar" ? "rtl" : "ltr";
    await page.setContent(
      `<!doctype html><html lang="${locale}" dir="${dir}"><head><meta charset="utf-8"><style>html,body{margin:0;background:#070d1d}svg{display:block}</style></head><body>${img.draw(labels, locale)}</body></html>`
    );
    await page.evaluate(() => document.fonts.ready);
    await page.addScriptTag({ content: FIT_SCRIPT });
    if (dir === "rtl" && img.mirror) await page.addScriptTag({ content: MIRROR_SCRIPT });
    await page.waitForTimeout(60);
    const base = path.join(outDir, `${name}.${locale}`);
    await page.screenshot({ path: `${base}.png` });
    execFileSync("cwebp", ["-quiet", "-q", "80", `${base}.png`, "-o", `${base}.webp`]);
    if (name === "hero") await page.screenshot({ path: `${base}.jpg`, type: "jpeg", quality: 84 });
    fs.unlinkSync(`${base}.png`);
    const kb = Math.round(fs.statSync(`${base}.webp`).size / 1024);
    console.log(`${slug} ${name}.${locale}: ${kb}KB`);
  }
}
await browser.close();
