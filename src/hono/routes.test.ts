import { describe, expect, it } from "vitest";
import { matchPath, matchRequest } from "./routes";

const PAGES = new Set(["/", "/airdrop-for-windows"]);
const req = (url: string, init?: RequestInit) => new Request(url, init);

describe("matchPath", () => {
  it("matches a page without a prefix as English", () => {
    expect(matchPath("/airdrop-for-windows", PAGES)).toEqual({ key: "page:/airdrop-for-windows", path: "/airdrop-for-windows", locale: "en", prefixed: false });
  });
  it("matches a page under a locale prefix", () => {
    expect(matchPath("/zh-Hant/airdrop-for-windows", PAGES)).toEqual({ key: "page:/airdrop-for-windows", path: "/airdrop-for-windows", locale: "zh-Hant", prefixed: true });
    expect(matchPath("/id", PAGES)).toEqual({ key: "page:/", path: "/", locale: "id", prefixed: true });
  });
  // Every one of these is a redirect, a 404 or another engine's page today: the router must leave it alone.
  it.each(["/en", "/en/airdrop-for-windows", "/ID/airdrop-for-windows", "/pt-br/airdrop-for-windows", "/airdrop-for-windows/", "/id/", "//airdrop-for-windows", "/airdrop-for-windows//", "/airdrop%2Dfor-windows", "/transfer", "/transfer/ABC123", "/d/AAAAAAAAAAAAAAAAAAAAAA", "/drive", "/id/drive/files", "/rooms", "/stats", "/.env", "/does-not-exist", "/airdrop-for-windows/x", "/constructor"])("leaves %s to Next", (p) => {
    expect(matchPath(p, PAGES)).toBeNull();
  });
});

describe("matchRequest", () => {
  it("answers GET and HEAD on the marketing host", () => {
    for (const method of ["GET", "HEAD"]) expect(matchRequest(req("https://bishare.app/airdrop-for-windows", { method }), PAGES)?.locale).toBe("en");
  });
  it("leaves other methods to Next", () => {
    expect(matchRequest(req("https://bishare.app/airdrop-for-windows", { method: "POST" }), PAGES)).toBeNull();
  });
  // The host split protects bishare.app from Safe Browsing: marketing pages must not appear on these hosts.
  it.each(["www.bishare.app", "dl.bishareusercontent.com", "get.bishare.app", "drive.bishare.app", "evil.example", "bishare.app.evil.example", "bishare.app:8443"])("never answers on %s", (host) => {
    expect(matchRequest(req(`https://${host}/airdrop-for-windows`), PAGES)).toBeNull();
  });
  it("answers on local and preview hosts", () => {
    for (const host of ["localhost:8788", "127.0.0.1:8788", "bishare-web.example.workers.dev"]) expect(matchRequest(req(`http://${host}/airdrop-for-windows`), PAGES)).not.toBeNull();
  });
});
