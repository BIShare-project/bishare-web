// The site on your machine, with the Hono pages: npm run dev:hono, then http://localhost:3400
//   /…                 a Hono page when there is one, anything else from the Next build on :3311
//   /__compare?/path   the Hono page beside today's site
// Saving a file under src/ or messages rebuilds the Hono pages. Needs one `npm run build` for the Next side.
import { spawn, spawnSync } from "node:child_process";
import { createReadStream, existsSync, readFileSync, statSync, watch } from "node:fs";
import { createServer, request } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const PORT = Number(process.env.PORT ?? 3400);
const NEXT = 3311;
const PAGES = join(ROOT, ".hono/dev");
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".woff2": "font/woff2", ".json": "application/json", ".webmanifest": "application/manifest+json", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".mp4": "video/mp4" };
const LOCALES = [...readFileSync(join(ROOT, "src/i18n/routing.ts"), "utf8").matchAll(/^    "([a-zA-Z-]+)"/gm)].map((m) => m[1]).filter((l) => l !== "en");

function buildPages(assets) {
  const steps = [...(assets ? ["scripts/build-hono-assets.mjs"] : []), "scripts/build-hono-pages.mjs"];
  for (const s of steps) {
    const r = spawnSync(process.execPath, [join(ROOT, s), ...(s.includes("pages") ? [PAGES] : [])], { cwd: ROOT, stdio: ["ignore", "inherit", "inherit"] });
    if (r.status) return console.error(`✗ ${s} failed; the last good pages stay`);
  }
  console.log("✓ Hono pages built");
}
buildPages(!process.argv.includes("--keep-assets"));

const isFile = (f) => existsSync(f) && statSync(f).isFile();
function honoFile(path) {
  const first = path.split("/")[1];
  const f = join(PAGES, LOCALES.includes(first) ? `${path}.html` : path === "/" ? "/en.html" : `/en${path}.html`);
  return isFile(f) ? f : null;
}

createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/__compare") {
    const path = url.search.slice(1) || "/airdrop-for-windows";
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    return res.end(`<!doctype html><meta charset="utf-8"><title>Compare ${path.replace(/[<&]/g, "")}</title><style>*{box-sizing:border-box}body{margin:0;display:grid;grid-template:32px 1fr/1fr 1fr;height:100vh;font:13px system-ui;background:#222;color:#fff}b{padding:8px 12px}iframe{width:100%;height:100%;border:0;border-right:2px solid #f0f}</style><b>Next (sekarang)</b><b>Hono (baru)</b><iframe src="/__next${path.replace(/"/g, "")}"></iframe><iframe src="${path.replace(/"/g, "")}"></iframe>`);
  }
  let path;
  try {
    path = normalize(decodeURIComponent(url.pathname));
  } catch {
    return res.writeHead(400).end();
  }
  const forced = path.startsWith("/__next/");
  if (forced) req.url = req.url.replace("/__next", "");
  const pub = join(ROOT, "public", path);
  const file = !forced && (extname(path) && isFile(pub) ? pub : req.method === "GET" && !req.headers.rsc ? honoFile(path) : null);
  if (file) {
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "cache-control": "no-store", "x-engine": file.startsWith(PAGES) ? "hono" : "file" });
    return createReadStream(file).pipe(res);
  }
  // The compare view shows the language in the address, whatever the browser prefers.
  const first = path.split("/")[2];
  const headers = forced ? { ...req.headers, cookie: `NEXT_LOCALE=${LOCALES.includes(first) ? first : "en"}` } : req.headers;
  const up = request({ host: "127.0.0.1", port: NEXT, path: req.url, method: req.method, headers }, (r) => {
    res.writeHead(r.statusCode, { ...r.headers, "x-engine": "next" });
    r.pipe(res);
  });
  up.on("error", () => res.writeHead(502, { "content-type": "text/plain" }).end("The Next side is not running (npm run build, then npm run dev:hono)"));
  req.pipe(up);
}).listen(PORT, () => console.log(`http://localhost:${PORT}   compare: http://localhost:${PORT}/__compare?/airdrop-for-windows`));

// The Next side, unless one already runs.
request({ host: "127.0.0.1", port: NEXT, path: "/faq" }, (r) => r.resume())
  .on("error", () => {
    const next = spawn("npx", ["next", "start", "-p", String(NEXT)], { cwd: ROOT, stdio: "ignore" });
    process.on("exit", () => next.kill());
  })
  .end();

let timer;
watch(join(ROOT, "src"), { recursive: true }, (_, f) => {
  if (!f || f.endsWith(".gen.ts") || f.includes(".test.")) return;
  clearTimeout(timer);
  timer = setTimeout(() => buildPages(/\.css$|hono\/client|\.tsx$/.test(f)), 300);
});
