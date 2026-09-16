/**
 * Draws the route figure that sits on every SEO landing page.
 *
 * Each landing answers one question — "how do I get a file from X to Y?" — so
 * the figure shows exactly that pair and the two routes BIShare offers between
 * them: straight across a shared Wi-Fi, or a browser link when the other side
 * is somewhere else. The numbers on it (40–110 MB/s, 100 GB, 24 hours) are the
 * same ones the copy uses, so the picture never drifts from the text.
 *
 * Labels stay in English on purpose: they are product and platform names plus
 * units, and rendering 13 locale variants of 26 figures would cost 338 files
 * for very little. The localized part is the caption, which lives in
 * `chrome.figureCaption` and is read by the page, not baked into the image.
 *
 * Output: public/img/<slug>/route.jpg and .webp at 1400×787 (16:9), the same
 * dimensions as the product screenshots already on the two long guides.
 *
 * Run: node tool/landing-figures.mjs [slug ...]    (no args = every figure)
 * Needs: cwebp on PATH (brew install webp) and Playwright's chromium.
 */
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/** left/right: device labels. link: what the off-network route carries. */
const FIGURES = {
  "firefox-send-alternative": { left: "Browser", right: "Anyone, any browser", title: "The Firefox Send idea, still running" },
  "send-files-without-internet": { left: "Phone hotspot", right: "Laptop", title: "No router, no internet, still a network" },
  "share-files-without-account": { left: "Any device", right: "Anyone, any browser", title: "Nobody signs in, on either side" },
};

const W = 1400;
const H = 700;

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function svg({ left, right, title }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">
  <defs>
    <linearGradient id="local" gradientUnits="userSpaceOnUse" x1="410" y1="0" x2="990" y2="0">
      <stop offset="0" stop-color="#22c55e" stop-opacity="0.25"/>
      <stop offset="0.5" stop-color="#22c55e"/>
      <stop offset="1" stop-color="#22c55e" stop-opacity="0.25"/>
    </linearGradient>
    <linearGradient id="remote" gradientUnits="userSpaceOnUse" x1="410" y1="0" x2="990" y2="0">
      <stop offset="0" stop-color="#60a5fa" stop-opacity="0.25"/>
      <stop offset="0.5" stop-color="#60a5fa"/>
      <stop offset="1" stop-color="#60a5fa" stop-opacity="0.25"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#0a1020"/>
  <g font-family="Segoe UI, -apple-system, system-ui, sans-serif">
    <text x="80" y="92" fill="#e8eefc" font-size="38" font-weight="650">${esc(title)}</text>
    <text x="80" y="132" fill="#93a4c8" font-size="20">Two routes, one app · free, open source, no account</text>

    <!-- device cards -->
    <g>
      <rect x="80" y="228" width="330" height="248" rx="18" fill="#0e1a2e" stroke="#1e2c48" stroke-width="2"/>
      <text x="245" y="298" fill="#7fd6a0" font-size="15" font-weight="600" text-anchor="middle" letter-spacing="1.4">SENDING</text>
      <text x="245" y="360" fill="#e8eefc" font-size="26" font-weight="620" text-anchor="middle">${esc(left)}</text>
      <text x="245" y="404" fill="#64748b" font-size="16" text-anchor="middle">picks the file</text>
    </g>
    <g>
      <rect x="990" y="228" width="330" height="248" rx="18" fill="#0e1a2e" stroke="#1e2c48" stroke-width="2"/>
      <text x="1155" y="298" fill="#93c5fd" font-size="15" font-weight="600" text-anchor="middle" letter-spacing="1.4">RECEIVING</text>
      <text x="1155" y="360" fill="#e8eefc" font-size="26" font-weight="620" text-anchor="middle">${esc(right)}</text>
      <text x="1155" y="404" fill="#64748b" font-size="16" text-anchor="middle">nothing to install</text>
    </g>

    <!-- route 1: same network -->
    <path d="M410 300 H990" stroke="url(#local)" stroke-width="3"/>
    <circle cx="700" cy="300" r="7" fill="#22c55e"/>
    <text x="700" y="266" fill="#7fd6a0" font-size="21" font-weight="620" text-anchor="middle">Same Wi-Fi · device to device</text>
    <text x="700" y="336" fill="#93a4c8" font-size="17" text-anchor="middle">end-to-end encrypted · 40–110 MB/s · no size limit · nothing uploaded</text>

    <!-- route 2: link -->
    <path d="M410 434 H990" stroke="url(#remote)" stroke-width="3" stroke-dasharray="10 9"/>
    <circle cx="700" cy="434" r="7" fill="#60a5fa"/>
    <text x="700" y="400" fill="#93c5fd" font-size="21" font-weight="620" text-anchor="middle">Anywhere else · link, QR or 6-character code</text>
    <text x="700" y="470" fill="#93a4c8" font-size="17" text-anchor="middle">sealed in your browser · up to 100 GB · expires in 24 hours</text>

    <!-- footer -->
    <path d="M80 570 H1320" stroke="#1e2c48"/>
    <text x="80" y="624" fill="#e8eefc" font-size="21" font-weight="620">BIShare</text>
    <text x="80" y="660" fill="#64748b" font-size="17">iPhone · Android · Windows · Mac · Linux · any browser</text>
    <text x="1320" y="624" fill="#93a4c8" font-size="18" text-anchor="end">bishare.app</text>
    <text x="1320" y="660" fill="#64748b" font-size="16" text-anchor="end">MIT licensed · no ads · no tracking</text>
  </g>
</svg>`;
}

const wanted = process.argv.slice(2);
const slugs = wanted.length ? wanted : Object.keys(FIGURES);
const missing = slugs.filter((s) => !FIGURES[s]);
if (missing.length) {
  console.error("unknown slug(s):", missing.join(", "));
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
});

for (const slug of slugs) {
  const dir = path.join("public/img", slug);
  fs.mkdirSync(dir, { recursive: true });
  await page.setContent(
    `<style>html,body{margin:0;padding:0;background:#0a1020}svg{display:block}</style>${svg(FIGURES[slug])}`
  );
  await page.waitForTimeout(80);

  const png = path.join(dir, "route.png");
  const jpg = path.join(dir, "route.jpg");
  const webp = path.join(dir, "route.webp");
  await page.screenshot({ path: png });
  await page.screenshot({ path: jpg, type: "jpeg", quality: 86 });
  execFileSync("cwebp", ["-quiet", "-q", "82", png, "-o", webp]);
  fs.unlinkSync(png);

  const kb = (f) => Math.round(fs.statSync(f).size / 1024);
  console.log(`route ${slug}: ${kb(webp)}KB webp, ${kb(jpg)}KB jpg`);
}

await browser.close();
