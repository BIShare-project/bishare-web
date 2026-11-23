import { describe, expect, it } from "vitest";
import { driveLocale, serveDrive } from "./drive-host";

const FILE = '<script type="module" nonce="__NONCE__" src="/_h/drive.js"></script><script type="application/json">{"base":"__BASE__"}</script>';
const asked: string[] = [];
const env = { ASSETS: { fetch: async (r: Request) => { const p = new URL(r.url).pathname; asked.push(p); return p.startsWith("/_p/drive/") ? new Response(FILE) : new Response("", { status: 404 }); } } };
const go = (url: string, headers: Record<string, string> = {}, init: RequestInit = {}) => serveDrive(new Request(url, { headers, ...init }), env as never);

describe("the web Drive", () => {
  it("is one document for every page, with a policy that runs only its own scripts", async () => {
    const res = (await go("https://drive.bishare.app/files?f=1"))!;
    const body = await res.text();
    const csp = res.headers.get("content-security-policy")!;
    const nonce = /nonce="([^"]+)"/.exec(body)![1]!;
    expect(nonce.length).toBeGreaterThan(20);
    expect(csp).toContain(`script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`);
    for (const rule of ["default-src 'self'", "frame-ancestors 'none'", "object-src 'none'", "base-uri 'none'", "form-action 'none'", "connect-src 'self' https://api.bishare.app wss://api.bishare.app https://*.r2.cloudflarestorage.com"]) expect(csp).toContain(rule);
    expect(body).toContain('"base":""');
    expect([res.headers.get("x-content-type-options"), res.headers.get("referrer-policy"), res.headers.get("x-robots-tag"), res.headers.get("cache-control")]).toEqual(["nosniff", "no-referrer", "noindex, nofollow", "private, no-cache, no-store, max-age=0, must-revalidate"]);
  });

  it("has a new nonce every time", async () => {
    const n = async () => (await (await go("https://drive.bishare.app/"))!.text()).match(/nonce="([^"]+)"/)![1];
    expect(await n()).not.toBe(await n());
  });

  it("has its own document for the page about deleting an account", async () => {
    asked.length = 0;
    await go("https://drive.bishare.app/delete-account", { cookie: "NEXT_LOCALE=id" });
    expect(asked).toEqual(["/_p/drive/id/delete-account.html"]);
  });

  it("sends an address it does not have to its overview", async () => {
    const res = (await go("https://drive.bishare.app/nothing/here"))!;
    expect([res.status, res.headers.get("location")]).toEqual([307, "/"]);
    const local = (await go("http://localhost:8788/id/drive/nothing"))!;
    expect([local.status, local.headers.get("location")]).toEqual([307, "/id/drive"]);
  });

  it("lives under /drive where hosts are shared", async () => {
    expect(await (await go("http://localhost:8788/drive/files"))!.text()).toContain('"base":"/drive"');
    expect(await (await go("http://localhost:8788/id/drive"))!.text()).toContain('"base":"/id/drive"');
  });

  it("refuses anything but reading", async () => {
    expect((await go("https://drive.bishare.app/", {}, { method: "POST" }))!.status).toBe(405);
  });
});

describe("driveLocale", () => {
  it.each([
    [{ cookie: "NEXT_LOCALE=ja" }, "ja"],
    [{ cookie: "NEXT_LOCALE=xx", "accept-language": "de-CH,fr;q=0.5" }, "de"],
    [{ "accept-language": "pt-PT" }, "pt-BR"],
    [{ "accept-language": "zh-TW" }, "zh-Hant"],
    [{ "accept-language": "zh-CN" }, "zh-Hans"],
    [{ "accept-language": "nb,ms" }, "en"],
    [{}, "en"],
  ])("%j → %s", (headers, locale) => {
    expect(driveLocale(new Request("https://drive.bishare.app/", { headers: headers as Record<string, string> }))).toBe(locale);
  });
});
