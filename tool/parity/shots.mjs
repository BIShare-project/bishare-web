// Pixel comparison of two running builds: node tool/parity/shots.mjs <url a> <url b> <out folder> <path> [path…]
// With --states (or --states=menu,zoom) the same actions (menus, zoom, theme…) are done on both first, and the visible part is compared.
// Both are drawn without motion, with every image loaded; the report says how many pixels differ, the folder has the pictures.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { chromium } from "@playwright/test";

const flag = process.argv.find((x) => x.startsWith("--states"));
const [a, b, out, ...paths] = process.argv.slice(2).filter((x) => x !== flag && x !== "--join-text");
const joinText = process.argv.includes("--join-text");

const header = (p) => p.locator("header").first();
const STATES = {
  scrolled: async (p) => { await p.evaluate(() => scrollTo(0, 1500)); },
  middle: async (p) => { await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight / 2)); },
  language: async (p, size) => { if (size !== "desktop") return false; await header(p).locator("button[aria-haspopup=listbox]:visible").click(); },
  menu: async (p, size) => { if (size === "desktop") return false; await header(p).locator("button[aria-expanded]:not([aria-haspopup]):visible").click(); },
  "menu-language": async (p, size) => { if (size === "desktop") return false; await header(p).locator("button[aria-expanded]:not([aria-haspopup]):visible").click(); await header(p).locator("button[aria-haspopup=listbox]:visible").click(); },
  "menu-scrolled": async (p, size) => { if (size === "desktop") return false; await p.evaluate(() => scrollTo(0, 900)); await p.waitForTimeout(250); await header(p).locator("button[aria-expanded]:not([aria-haspopup]):visible").click(); },
  theme: async (p, size) => { if (size !== "desktop") return false; await header(p).locator(".theme-toggle:visible").click(); },
  zoom: async (p) => { const i = p.locator("figure[data-zoom] img").first(); if (!(await i.count())) return false; await i.scrollIntoViewIfNeeded(); await i.click(); await p.locator("[role=dialog] img").evaluate((e) => e.decode()); },
  hover: async (p, size) => { if (size !== "desktop") return false; await header(p).locator("nav a").nth(3).hover(); },
  focus: async (p) => { for (let k = 0; k < 4; k++) await p.keyboard.press("Tab"); },
  faq: async (p) => { const d = p.locator("main details:not([open]) summary").first(); if (!(await d.count())) return false; await d.click(); },
  cookie: async (p) => { await p.evaluate(() => localStorage.removeItem("bishare-cookie-notice")); await p.addInitScript(() => localStorage.removeItem("bishare-cookie-notice")); await p.reload({ waitUntil: "load" }); await p.locator('[aria-label="Cookie notice"]').waitFor(); },
};
mkdirSync(out, { recursive: true });
const SIZES = { desktop: { width: 1280, height: 900 }, tablet: { width: 820, height: 1100 }, phone: { width: 390, height: 844 } };
const browser = await chromium.launch();

async function shoot(base, path, size, theme, state) {
  const ctx = await browser.newContext({ viewport: SIZES[size], colorScheme: theme, reducedMotion: "reduce", deviceScaleFactor: 1, serviceWorkers: "block", });
  await ctx.addInitScript((t) => { localStorage.setItem("bishare-theme", t); localStorage.setItem("bishare-cookie-notice", "1"); }, theme);
  const locale = /^\/([a-z]{2}(?:-[A-Za-z]+)?)(?:\/|$)/.exec(path)?.[1] ?? "en";
  await ctx.addCookies([{ name: "NEXT_LOCALE", value: locale, url: base }]);
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && !/cloudflareinsights|ERR_|Failed to load resource/.test(m.text()) && errors.push(m.text().slice(0, 160)));
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
  await page.route(/cloudflareinsights|api\.bishare\.app/, (r) => r.abort());
  // Files of public/ come straight from disk: in production the assets binding answers them before the Worker, while
  // `next start` sends them through the middleware and answers 404.
  await page.route((u) => u.origin === base && extname(u.pathname) !== "", (r) => {
    const f = join("public", decodeURIComponent(new URL(r.request().url()).pathname));
    const type = { ".svg": "image/svg+xml", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".webmanifest": "application/manifest+json", ".ico": "image/x-icon" }[extname(f)];
    return type && existsSync(f) && statSync(f).isFile() ? r.fulfill({ body: readFileSync(f), contentType: type }) : r.fallback();
  });
  await page.goto(base + path, { waitUntil: "load" });
  await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}" });
  await page.evaluate(async () => {
    for (const i of document.images) i.loading = "eager";
    await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
    await document.fonts.ready;
  });
  // React splits a sentence into several text nodes with comments between; joined, the font spaces the letters as it
  // does in one node. --join-text tells that (invisible) effect from a real difference.
  if (joinText) await page.evaluate(() => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_COMMENT), c = []; while (w.nextNode()) c.push(w.currentNode); c.forEach((n) => n.remove()); document.body.normalize(); });
  await page.waitForTimeout(400);
  if (state) {
    if ((await STATES[state](page, size)) === false) { await ctx.close(); return null; }
    await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}" });
    await page.evaluate(async () => { for (const i of document.images) i.loading = "eager"; await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); await document.fonts.ready; });
    await page.waitForTimeout(700);
  }
  const box = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, over: document.documentElement.scrollWidth > innerWidth, broken: [...document.images].filter((i) => i.currentSrc && !i.naturalWidth).map((i) => i.src) }));
  const png = await page.screenshot({ fullPage: !state });
  await ctx.close();
  return { png, errors, ...box };
}

const judge = await (await browser.newContext()).newPage();
async function compare(x, y) {
  return judge.evaluate(async ([p, q]) => {
    const img = async (s) => { const i = new Image(); i.src = `data:image/png;base64,${s}`; await i.decode(); return i; };
    const [i, j] = [await img(p), await img(q)];
    const w = Math.max(i.width, j.width), h = Math.max(i.height, j.height);
    const px = (im) => { const c = new OffscreenCanvas(w, h).getContext("2d"); c.drawImage(im, 0, 0); return c.getImageData(0, 0, w, h).data; };
    const [d, e] = [px(i), px(j)];
    let n = 0, top = -1, bottom = -1;
    const c = new OffscreenCanvas(w, h), g = c.getContext("2d"), o = g.createImageData(w, h);
    for (let k = 0; k < d.length; k += 4) {
      const off = Math.max(Math.abs(d[k] - e[k]), Math.abs(d[k + 1] - e[k + 1]), Math.abs(d[k + 2] - e[k + 2]), Math.abs(d[k + 3] - e[k + 3])) > 12;
      if (off) { n++; const y = Math.floor(k / 4 / w); if (top < 0) top = y; bottom = y; }
      o.data.set(off ? [255, 0, 80, 255] : [d[k] * 0.25 + 190, d[k + 1] * 0.25 + 190, d[k + 2] * 0.25 + 190, 255], k);
    }
    g.putImageData(o, 0, 0);
    const bytes = new Uint8Array(await (await c.convertToBlob()).arrayBuffer());
    let s = ""; for (let k = 0; k < bytes.length; k += 32768) s += String.fromCharCode(...bytes.subarray(k, k + 32768));
    return { n, total: w * h, top, bottom, diff: btoa(s), sizes: [`${i.width}x${i.height}`, `${j.width}x${j.height}`] };
  }, [x.toString("base64"), y.toString("base64")]);
}

let bad = 0;
for (const path of paths) for (const size of Object.keys(SIZES)) for (const theme of ["dark", "light"]) for (const state of flag ? (flag.split("=")[1]?.split(",") ?? Object.keys(STATES)) : [undefined]) {
  const [x, y] = [await shoot(a, path, size, theme, state), await shoot(b, path, size, theme, state)];
  if (!x && !y) continue;
  const r = await compare(x.png, y.png);
  const name = `${path.replace(/\W+/g, "_")}-${size}-${theme}${state ? `-${state}` : ""}`;
  writeFileSync(join(out, `${name}-a.png`), x.png);
  writeFileSync(join(out, `${name}-b.png`), y.png);
  if (r.n) writeFileSync(join(out, `${name}-diff.png`), Buffer.from(r.diff, "base64"));
  const notes = [r.sizes[0] !== r.sizes[1] && `SIZE ${r.sizes.join(" vs ")}`, y.errors.length && `ERRORS ${y.errors.join("; ")}`, y.over && "OVERFLOW", y.broken.length && `BROKEN ${y.broken}`].filter(Boolean).join(" ");
  if (r.n || notes) bad++;
  console.log(`${r.n || notes ? "≠" : "="} ${path} ${size} ${theme} ${state ?? "page"}: ${r.n} of ${r.total} px differ (${((r.n / r.total) * 100).toFixed(4)}%)${r.n ? ` rows ${r.top}–${r.bottom}` : ""} ${notes}`);
}
await browser.close();
process.exit(bad ? 1 : 0);
