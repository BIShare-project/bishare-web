import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { type AppEnv, handle, HTML_FILES, type Pages } from "./app";

const P = "/_p";
const FILES: Record<string, string> = {
  [`${P}/en.html`]: "home",
  [`${P}/ar.html`]: "home ar",
  [`${P}/en/features.html`]: "features",
  [`${P}/id/features.html`]: "fitur",
  [`${P}/en/404.html`]: "not here",
  [`${P}/id/404.html`]: "tidak ada",
  [`${P}/robots.txt`]: "User-Agent: *",
  [`${P}/sitemap.xml`]: "<urlset/>",
  [`${P}/feed.xml`]: "<rss/>",
  "/save-bridge.html": "bridge",
};
const env = {
  ASSETS: { fetch: async (r: Request) => { const p = new URL(r.url).pathname; return p in FILES ? new Response(FILES[p]) : new Response("", { status: 404 }); } },
  STATS_LIVE_DO: { idFromName: () => "id", get: () => ({ fetch: async () => new Response("live") }) },
} as unknown as AppEnv;
const ctx = { waitUntil: () => {} };
const rendered: string[] = [];
const pages: Pages = {
  renderDynamic: async (path, locale) => { rendered.push(`${locale} ${path}`); return /^\/(stats$|transfer\/|d\/)/.test(path) ? `dynamic ${locale} ${path}` : null; },
  api: (req) => (new URL(req.url).pathname === "/api/loop-done" ? new Response(null, { status: 204 }) : null),
};
const go = (url: string, headers: Record<string, string> = {}, init: RequestInit = {}) =>
  handle(new Request(url.startsWith("/") ? `https://bishare.app${url}` : url, { headers: { cookie: "NEXT_LOCALE=en", ...headers }, ...init }), env, ctx, async () => pages, async () => new Response("drive"));

describe("static pages", () => {
  it.each([["/", "home"], ["/ar", "home ar"], ["/features", "features"], ["/id/features", "fitur"]])("%s", async (url, body) => {
    const res = await go(url);
    expect([res.status, await res.text()]).toEqual([200, body]);
    expect(res.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(res.headers.get("cache-control")).toBe("s-maxage=31536000, stale-while-revalidate=2592000");
    expect(res.headers.get("link")).toContain('hreflang="x-default"');
  });

  it("are not kept by any cache when Next's old router asks", async () => {
    for (const r of [await go("/features?_rsc=1"), await go("/features", { rsc: "1" })]) expect(r.headers.get("cache-control")).toBe("private, no-store");
  });

  it("answer HEAD without a body and refuse other methods", async () => {
    const head = await go("/features", {}, { method: "HEAD" });
    expect([head.status, await head.text()]).toEqual([200, ""]);
    expect((await go("/features", {}, { method: "POST" })).status).toBe(405);
  });

  it("remember the language a person opens", async () => {
    expect((await go("/id/features", { "sec-fetch-dest": "document" })).headers.get("set-cookie")).toBe("NEXT_LOCALE=id; Path=/; SameSite=lax");
  });
});

describe("redirects", () => {
  it.each([
    ["/features/", 308, "/features"],
    ["/en/features", 307, "/features"],
    ["/ID/features", 307, "/id/features"],
    ["https://www.bishare.app/x?a=1", 301, "https://bishare.app/x?a=1"],
    ["/transfer/ABC123?x=1", 302, "https://dl.bishareusercontent.com/transfer/ABC123?x=1"],
    ["/d/AAAAAAAAAAAAAAAAAAAAAA", 302, "https://dl.bishareusercontent.com/d/AAAAAAAAAAAAAAAAAAAAAA"],
    ["/drive/files", 302, "https://drive.bishare.app/files"],
    ["https://get.bishare.app/transfer/ABC", 302, "https://dl.bishareusercontent.com/transfer/ABC"],
    ["https://dl.bishareusercontent.com/features", 302, "https://bishare.app/features"],
    ["/save-bridge.html?a=1", 307, "/save-bridge?a=1"],
  ])("%s → %i %s", async (url, status, location) => {
    const res = await go(url);
    expect([res.status, res.headers.get("location")]).toEqual([status, location]);
  });

  it("by language only for a person without a choice", async () => {
    const res = await go("/features", { cookie: "", "accept-language": "id" });
    expect([res.status, res.headers.get("location")]).toEqual([307, "/id/features"]);
  });
});

describe("pages rendered on request", () => {
  it("are never cached", async () => {
    const res = await go("/id/stats");
    expect([res.status, await res.text()]).toEqual([200, "dynamic id /stats"]);
    expect(res.headers.get("cache-control")).toBe("private, no-cache, no-store, max-age=0, must-revalidate");
  });

  it("on the receive host are kept from search engines", async () => {
    const res = await go("https://dl.bishareusercontent.com/transfer/ABC123");
    expect(await res.text()).toBe("dynamic en /transfer/ABC123");
    expect(res.headers.get("x-robots-tag")).toBe("noindex");
  });
});

describe("missing pages", () => {
  it.each([["/nope", "not here"], ["/id/nope", "tidak ada"], ["/404", "not here"], ["/%E0%A4%A", "not here"]])("%s", async (url, body) => {
    const res = await go(url);
    expect([res.status, await res.text()]).toEqual([404, body]);
    expect(res.headers.get("cache-control")).toBe("private, no-cache, no-store, max-age=0, must-revalidate");
  });

  it("do not cost a page when they cannot be one", async () => {
    rendered.length = 0;
    for (const p of ["/.env", "/wp-login.php", "/a/../b.php", "/_p/en/features.html", "/_p", "/_next/static/chunks/x.js"]) {
      const res = await go(p);
      expect([p, res.status, res.headers.get("content-type")]).toEqual([p, 404, "text/plain; charset=utf-8"]);
    }
    expect(rendered).toEqual([]);
  });
});

describe("files and endpoints", () => {
  it("robots.txt, sitemap.xml and feed.xml keep their types", async () => {
    const t = async (u: string) => { const r = await go(u); return [r.status, r.headers.get("content-type"), r.headers.get("cache-control")]; };
    expect(await t("/robots.txt")).toEqual([200, "text/plain", "public, max-age=0, must-revalidate"]);
    expect(await t("/sitemap.xml")).toEqual([200, "application/xml", "public, max-age=0, must-revalidate"]);
    expect(await t("/feed.xml")).toEqual([200, "application/rss+xml; charset=utf-8", "public, max-age=3600"]);
  });

  it("the other hosts have their own robots.txt", async () => {
    for (const h of ["dl.bishareusercontent.com", "get.bishare.app", "drive.bishare.app"]) expect(await (await go(`https://${h}/robots.txt`)).text()).toContain("Disallow: /");
  });

  it("serves the save frame on any host", async () => {
    for (const h of ["bishare.app", "get.bishare.app", "dl.bishareusercontent.com"]) expect(await (await go(`https://${h}/save-bridge`)).text()).toBe("bridge");
  });

  it("answers the endpoints on any host, before any redirect", async () => {
    for (const h of ["bishare.app", "dl.bishareusercontent.com"]) expect((await go(`https://${h}/api/loop-done`, {}, { method: "POST" })).status).toBe(204);
    expect((await go("/api/nothing")).status).toBe(404);
  });

  it("hands the stats socket to its object, and Drive's host to Drive", async () => {
    expect(await (await go("/stats-live")).text()).toBe("live");
    expect(await (await go("https://drive.bishare.app/files")).text()).toBe("drive");
    expect(await (await go("http://localhost:8788/drive/files")).text()).toBe("drive");
    expect(await (await go("http://localhost:8788/id/drive")).text()).toBe("drive");
  });
});

describe("public/", () => {
  it("has no .html file the Worker does not serve", () => {
    const files = readdirSync("public", { recursive: true, encoding: "utf8" }).filter((f) => f.endsWith(".html"));
    expect(files.map((f) => `/${f.slice(0, -5)}`).sort()).toEqual([...HTML_FILES].sort());
  });

  const rules = new Map<string, string[]>();
  let current: string[] | null = null;
  for (const line of readFileSync("public/_headers", "utf8").split("\n")) {
    if (line.startsWith("/")) rules.set(line.trim(), (current = []));
    else if (/^\s+\S/.test(line) && current) current.push(line.trim());
    else current = null;
  }
  it.each(HTML_FILES)("_headers gives the file of %s every header of its path", (path) => {
    for (const header of rules.get(path) ?? []) expect(rules.get(`${path}.html`) ?? []).toContain(header);
  });
});
