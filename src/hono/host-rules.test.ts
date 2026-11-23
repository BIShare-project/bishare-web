import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { middleware } from "@/middleware";
import { hostRule, slashRedirect } from "./host-rules";

const HOSTS = ["bishare.app", "www.bishare.app", "dl.bishareusercontent.com", "get.bishare.app", "drive.bishare.app", "localhost:3000", "x.workers.dev", "bishare.app.evil.example"];
const ID22 = "AAAAAAAAAAAAAAAAAAAAAA";
const PATHS = ["/", "/features", "/id/features?x=1&y=%20", "/transfer", "/transfer/ABC123", "/id/transfer/ABC123?k=1", "/zh-Hant/transfer/ABC123", "/ID/transfer/ABC123", "/transfer/a/b", `/d/${ID22}`, `/ja/d/${ID22}`, "/d/short", "/drive", "/drive/files?a=1", "/id/drive", "/id/drive/files", "/drivex", "/robots.txt", "/rooms", "/save-page", "/Transfer/ABC"];

/** The site's middleware is the reference: what it answers by itself (a redirect to another host, a robots.txt). */
async function reference(host: string, path: string) {
  const res = middleware(new NextRequest(`https://${host}${path}`, { headers: { host, "accept-language": "en", cookie: "NEXT_LOCALE=en" } }));
  const location = res.headers.get("location");
  const otherHost = location !== null && new URL(location).host !== host;
  const inline = res.status === 200 && res.headers.get("content-type") === "text/plain";
  if (otherHost) return { status: res.status, location, body: null };
  if (inline) return { status: 200, location: null, body: await res.text() };
  return null;
}

describe("hostRule", () => {
  it.each(HOSTS)("answers on %s exactly as the middleware does", async (host) => {
    for (const path of PATHS) {
      const res = hostRule(new Request(`https://${host}${path}`));
      const got = res && { status: res.status, location: res.headers.get("location"), body: res.status === 200 ? await res.text() : null };
      expect(got, host + path).toEqual(await reference(host, path));
    }
  });

  it("keeps marketing pages off every other host", () => {
    for (const host of ["www.bishare.app", "dl.bishareusercontent.com", "get.bishare.app"]) expect(hostRule(new Request(`https://${host}/airdrop-for-windows`))?.status).toBeGreaterThanOrEqual(301);
  });
});

describe("slashRedirect", () => {
  // Read from production on 2026-11-23.
  it.each([
    ["//features?x=1", "/features?x=1"],
    ["/features/?x=1", "/features?x=1"],
    ["///", "/"],
    ["/id//features", "/id/features"],
    ["//evil.com", "/evil.com"],
    ["//evil.com/", "/evil.com/"],
    ["/en//evil.com", "/en/evil.com"],
    ["/a/b/", "/a/b"],
    ["/features//", "/features/"],
  ])("sends %s to %s", (from, to) => {
    const res = slashRedirect(new URL(`https://bishare.app${from}`));
    expect(res?.status).toBe(308);
    expect(res?.headers.get("location")).toBe(to);
  });
  it.each(["/", "/?x=1", "/features", "/features?next=/a/", "/features%2F"])("leaves %s alone", (p) => {
    expect(slashRedirect(new URL(`https://bishare.app${p}`))).toBeNull();
  });
});
