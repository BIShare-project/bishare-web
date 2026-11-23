// Serves built Hono pages and public/ for local looks: node tool/parity/serve.mjs <port> [pages folder]
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const [port = "3312", pages = "dist/assets/_p"] = process.argv.slice(2);
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".woff2": "font/woff2", ".json": "application/json", ".webmanifest": "application/manifest+json", ".ico": "image/x-icon", ".txt": "text/plain" };
const LOCALES = ["id", "es", "fr", "de", "pt-BR", "ru", "ar", "hi", "ja", "ko", "zh-Hans", "zh-Hant"];
createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
  const first = path.split("/")[1];
  const page = LOCALES.includes(first) ? `${path}.html` : path === "/" ? "/en.html" : `/en${path}.html`;
  const file = [join(resolve("public"), path), join(resolve(pages), page)].find((f) => existsSync(f) && statSync(f).isFile());
  if (!file) {
    // A page that does not exist: the 404 page of its language, as the Worker answers.
    const missing = join(resolve(pages), LOCALES.includes(first) ? first : "en", "404.html");
    if (!existsSync(missing)) return res.writeHead(404).end("not found");
    res.writeHead(404, { "content-type": TYPES[".html"] });
    return createReadStream(missing).pipe(res);
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
}).listen(Number(port), "127.0.0.1", () => console.log(`http://127.0.0.1:${port}`));
