/**
 * Renders a .jpg twin for every blog hero SVG that lacks one.
 *
 * Why: the on-page hero stays SVG (4 KB, sharp at any zoom), but Google's
 * Article structured data and every social preview scraper require a raster
 * format — so `blog/[slug]/page.tsx` points og:image and BlogPosting.image at
 * `<hero>.jpg`. Run this after adding an article:  node tool/hero-raster.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const DIR = "public/blog";
const pending = fs
  .readdirSync(DIR)
  .filter((f) => f.startsWith("hero-") && f.endsWith(".svg"))
  .filter((f) => !fs.existsSync(path.join(DIR, f.replace(/\.svg$/, ".jpg"))));

if (pending.length === 0) {
  console.log("hero-raster: all heroes already have a .jpg twin");
  process.exit(0);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const f of pending) {
  const svg = fs.readFileSync(path.join(DIR, f), "utf8");
  await page.setContent(
    `<style>html,body{margin:0;padding:0;background:#0a1020}svg{display:block;width:1200px;height:630px}</style>${svg}`
  );
  await page.waitForTimeout(120);
  const out = path.join(DIR, f.replace(/\.svg$/, ".jpg"));
  await page.screenshot({ path: out, type: "jpeg", quality: 86 });
  console.log("hero-raster:", out, `${Math.round(fs.statSync(out).size / 1024)}KB`);
}
await browser.close();
