import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { engineFor, honoPage, HTML_FILES, htmlFile, PAGE_DIR, routeSwitch, type ServeEnv } from "./serve";

const ORIGIN = "https://bishare.app";
const FILES: Record<string, string> = {
  [`${PAGE_DIR}/en/airdrop-for-windows.html`]: "<html lang=en>windows</html>",
  [`${PAGE_DIR}/id/airdrop-for-windows.html`]: "<html lang=id>windows</html>",
  "/save-bridge.html": "bridge",
  [`${PAGE_DIR}/ar.html`]: "<html lang=ar>home</html>",
  [`${PAGE_DIR}/en/blog/what-is-quic-protocol.html`]: "<html lang=en>quic</html>",
};

/** ASSETS as the Worker sees it: the built files, by path. */
function env(extra: Partial<ServeEnv> = {}): ServeEnv & { asked: string[] } {
  const asked: string[] = [];
  const ASSETS = {
    fetch: async (input: Request | string) => {
      const path = new URL(typeof input === "string" ? input : input.url).pathname;
      asked.push(path);
      return path in FILES ? new Response(FILES[path], { headers: { "content-type": "text/html" } }) : new Response("nope", { status: 404 });
    },
  };
  return { ASSETS, asked, ...extra };
}

const on = (...paths: string[]) => (key: string) => paths.some((p) => key === `page:${p}`);
const get = (path: string, headers: Record<string, string> = {}, init: RequestInit = {}) => new Request(ORIGIN + path, { headers, ...init });

describe("honoPage", () => {
  it("leaves a page that is switched off to Next", async () => {
    expect(await honoPage(get("/airdrop-for-windows"), env(), on())).toBeNull();
  });

  it("answers a page that is switched on with its built HTML and Next's headers", async () => {
    const res = (await honoPage(get("/id/airdrop-for-windows", { "sec-fetch-dest": "document" }), env(), on("/airdrop-for-windows")))!;
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(res.headers.get("cache-control")).toBe("s-maxage=31536000, stale-while-revalidate=2592000");
    expect(res.headers.get("link")).toContain('<https://bishare.app/id/airdrop-for-windows>; rel="alternate"; hreflang="id"');
    expect(res.headers.get("set-cookie")).toBe("NEXT_LOCALE=id; Path=/; SameSite=lax");
    expect(await res.text()).toBe("<html lang=id>windows</html>");
  });

  it("gives the language redirect of a page that is switched on, as next-intl does", async () => {
    const res = (await honoPage(get("/airdrop-for-windows", { cookie: "NEXT_LOCALE=id" }), env(), on("/airdrop-for-windows")))!;
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("/id/airdrop-for-windows");
  });

  it("leaves the language redirect of a page that is switched off to Next", async () => {
    expect(await honoPage(get("/airdrop-for-windows", { cookie: "NEXT_LOCALE=id" }), env(), on())).toBeNull();
  });

  it("answers a Next router request (RSC) with plain HTML, never cacheable as the page", async () => {
    const res = (await honoPage(get("/airdrop-for-windows?_rsc=1x2", { rsc: "1" }), env(), on("/airdrop-for-windows")))!;
    expect(res.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(await res.text()).toBe("<html lang=en>windows</html>");
  });

  it("answers HEAD without a body", async () => {
    const res = (await honoPage(get("/airdrop-for-windows", {}, { method: "HEAD" }), env(), on("/airdrop-for-windows")))!;
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("");
  });

  it("leaves POST, other hosts and other spellings to Next", async () => {
    const all = on("/airdrop-for-windows");
    expect(await honoPage(get("/airdrop-for-windows", {}, { method: "POST" }), env(), all)).toBeNull();
    expect(await honoPage(new Request("https://drive.bishare.app/airdrop-for-windows"), env(), all)).toBeNull();
    expect(await honoPage(get("/airdrop-for-windows/"), env(), all)).toBeNull();
  });

  it("never redirects a path a host rule moves elsewhere (receive links, Drive), whatever is switched on", async () => {
    const all = () => true;
    for (const path of ["/transfer/ABC123", "/d/AAAAAAAAAAAAAAAAAAAAAA", "/drive"]) {
      expect(await honoPage(get(path, { cookie: "NEXT_LOCALE=id" }), env(), all)).toBeNull();
    }
  });

  it("sends /en/<page> to /<page>, as next-intl does", async () => {
    const res = (await honoPage(get("/en/airdrop-for-windows"), env(), on("/airdrop-for-windows")))!;
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("/airdrop-for-windows");
  });

  it("falls back to Next when the file was not built", async () => {
    expect(await honoPage(get("/ja/airdrop-for-windows"), env(), on("/airdrop-for-windows"))).toBeNull();
  });

  it("serves blog articles, keyed by their path", async () => {
    const res = (await honoPage(get("/blog/what-is-quic-protocol"), env(), on("/blog/what-is-quic-protocol")))!;
    expect(await res.text()).toBe("<html lang=en>quic</html>");
  });
});

describe("honoPage, home", () => {
  it("reads the home page of a language from <locale>.html", async () => {
    const res = (await honoPage(get("/ar"), env(), on("/")))!;
    expect(await res.text()).toBe("<html lang=ar>home</html>");
  });
});

describe("routeSwitch", () => {
  const kv = (value: string | null, reads: { n: number }) => ({ get: async () => (reads.n++, value) });

  it("is off for everything without the KV binding", async () => {
    expect((await routeSwitch(env(), 0))("page:/airdrop-for-windows")).toBe(false);
  });

  it("is on for the keys listed in cfg:web.hono, read once a minute", async () => {
    const reads = { n: 0 };
    const e = env({ BISHARE_WEB_CFG: kv('["page:/airdrop-for-windows"]', reads) });
    expect((await routeSwitch(e, 1_000_000))("page:/airdrop-for-windows")).toBe(true);
    expect((await routeSwitch(e, 1_030_000))("page:/features")).toBe(false);
    expect(reads.n).toBe(1);
    await routeSwitch(e, 1_070_001);
    expect(reads.n).toBe(2);
  });

  it("treats a broken value as everything off", async () => {
    const e = env({ BISHARE_WEB_CFG: kv("not json", { n: 0 }) });
    expect((await routeSwitch(e, 5_000_000))("page:/airdrop-for-windows")).toBe(false);
  });
});

describe("engineFor", () => {
  it("ignores the engine header in production without the token", () => {
    expect(engineFor(get("/x", { "x-bs-engine": "hono" }), env({ PARITY_TOKEN: "s3cret" }))).toBeNull();
    expect(engineFor(get("/x", { "x-bs-engine": "hono", "x-bs-token": "wrong" }), env({ PARITY_TOKEN: "s3cret" }))).toBeNull();
    expect(engineFor(get("/x", { "x-bs-engine": "hono" }), env())).toBeNull();
  });

  it("follows it with the token, or on a local or preview host", () => {
    expect(engineFor(get("/x", { "x-bs-engine": "hono", "x-bs-token": "s3cret" }), env({ PARITY_TOKEN: "s3cret" }))).toBe("hono");
    expect(engineFor(new Request("http://localhost:8788/x", { headers: { "x-bs-engine": "next" } }), env())).toBe("next");
    expect(engineFor(new Request("http://localhost:8788/x", { headers: { "x-bs-engine": "other" } }), env())).toBeNull();
  });
});

describe("htmlFile", () => {
  it("serves a public .html file at its path without the extension, on any host", async () => {
    const res = (await htmlFile(new Request("https://get.bishare.app/save-bridge"), env()))!;
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("bridge");
  });

  it("sends the .html spelling to the path without it, query kept", async () => {
    const res = (await htmlFile(get("/save-bridge.html?a=1"), env()))!;
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("/save-bridge?a=1");
  });

  it("leaves other paths, and the built pages, alone", async () => {
    expect(await htmlFile(get("/airdrop-for-windows"), env())).toBeNull();
    expect(await htmlFile(get(`${PAGE_DIR}/en/airdrop-for-windows`), env())).toBeNull();
    expect(await htmlFile(get("/save-bridge", {}, { method: "POST" }), env())).toBeNull();
  });
});

describe("HTML_FILES", () => {
  it("lists every .html file in public/", () => {
    const files = readdirSync("public", { recursive: true, encoding: "utf8" }).filter((f) => f.endsWith(".html") && !f.startsWith("_"));
    expect(files.map((f) => `/${f.slice(0, -5)}`).sort()).toEqual([...HTML_FILES].sort());
  });
});
