import { describe, expect, it } from "vitest";
import { hostRule, slashRedirect } from "./host-rules";

const HOSTS = ["bishare.app", "www.bishare.app", "dl.bishareusercontent.com", "get.bishare.app", "drive.bishare.app", "localhost:3000", "x.workers.dev", "bishare.app.evil.example"];
const ID22 = "AAAAAAAAAAAAAAAAAAAAAA";
const PATHS = ["/", "/features", "/id/features?x=1&y=%20", "/transfer", "/transfer/ABC123", "/id/transfer/ABC123?k=1", "/zh-Hant/transfer/ABC123", "/ID/transfer/ABC123", "/transfer/a/b", `/d/${ID22}`, `/ja/d/${ID22}`, "/d/short", "/drive", "/drive/files?a=1", "/id/drive", "/id/drive/files", "/drivex", "/robots.txt", "/rooms", "/save-page", "/Transfer/ABC"];

// What each host answered by itself before the site was written in Hono (recorded 2026-11-23): a redirect, or the text
// of its robots.txt. Everything else goes on to the pages.
const RECORDED: Record<string, [number, string]> = {
  "bishare.app/transfer/ABC123": [302, "https://dl.bishareusercontent.com/transfer/ABC123"],
  "bishare.app/id/transfer/ABC123?k=1": [302, "https://dl.bishareusercontent.com/id/transfer/ABC123?k=1"],
  "bishare.app/zh-Hant/transfer/ABC123": [302, "https://dl.bishareusercontent.com/zh-Hant/transfer/ABC123"],
  "bishare.app/d/AAAAAAAAAAAAAAAAAAAAAA": [302, "https://dl.bishareusercontent.com/d/AAAAAAAAAAAAAAAAAAAAAA"],
  "bishare.app/ja/d/AAAAAAAAAAAAAAAAAAAAAA": [302, "https://dl.bishareusercontent.com/ja/d/AAAAAAAAAAAAAAAAAAAAAA"],
  "bishare.app/drive": [302, "https://drive.bishare.app/"],
  "bishare.app/drive/files?a=1": [302, "https://drive.bishare.app/files?a=1"],
  "bishare.app/id/drive": [302, "https://drive.bishare.app/"],
  "bishare.app/id/drive/files": [302, "https://drive.bishare.app/files"],
  "www.bishare.app/": [301, "https://bishare.app/"],
  "www.bishare.app/features": [301, "https://bishare.app/features"],
  "www.bishare.app/id/features?x=1&y=%20": [301, "https://bishare.app/id/features?x=1&y=%20"],
  "www.bishare.app/transfer": [301, "https://bishare.app/transfer"],
  "www.bishare.app/transfer/ABC123": [302, "https://dl.bishareusercontent.com/transfer/ABC123"],
  "www.bishare.app/id/transfer/ABC123?k=1": [302, "https://dl.bishareusercontent.com/id/transfer/ABC123?k=1"],
  "www.bishare.app/zh-Hant/transfer/ABC123": [302, "https://dl.bishareusercontent.com/zh-Hant/transfer/ABC123"],
  "www.bishare.app/ID/transfer/ABC123": [301, "https://bishare.app/ID/transfer/ABC123"],
  "www.bishare.app/transfer/a/b": [301, "https://bishare.app/transfer/a/b"],
  "www.bishare.app/d/AAAAAAAAAAAAAAAAAAAAAA": [302, "https://dl.bishareusercontent.com/d/AAAAAAAAAAAAAAAAAAAAAA"],
  "www.bishare.app/ja/d/AAAAAAAAAAAAAAAAAAAAAA": [302, "https://dl.bishareusercontent.com/ja/d/AAAAAAAAAAAAAAAAAAAAAA"],
  "www.bishare.app/d/short": [301, "https://bishare.app/d/short"],
  "www.bishare.app/drive": [302, "https://drive.bishare.app/"],
  "www.bishare.app/drive/files?a=1": [302, "https://drive.bishare.app/files?a=1"],
  "www.bishare.app/id/drive": [302, "https://drive.bishare.app/"],
  "www.bishare.app/id/drive/files": [302, "https://drive.bishare.app/files"],
  "www.bishare.app/drivex": [301, "https://bishare.app/drivex"],
  "www.bishare.app/robots.txt": [301, "https://bishare.app/robots.txt"],
  "www.bishare.app/rooms": [301, "https://bishare.app/rooms"],
  "www.bishare.app/save-page": [301, "https://bishare.app/save-page"],
  "www.bishare.app/Transfer/ABC": [301, "https://bishare.app/Transfer/ABC"],
  "dl.bishareusercontent.com/": [302, "https://bishare.app/"],
  "dl.bishareusercontent.com/features": [302, "https://bishare.app/features"],
  "dl.bishareusercontent.com/id/features?x=1&y=%20": [302, "https://bishare.app/id/features?x=1&y=%20"],
  "dl.bishareusercontent.com/transfer": [302, "https://bishare.app/transfer"],
  "dl.bishareusercontent.com/ID/transfer/ABC123": [302, "https://bishare.app/ID/transfer/ABC123"],
  "dl.bishareusercontent.com/transfer/a/b": [302, "https://bishare.app/transfer/a/b"],
  "dl.bishareusercontent.com/d/short": [302, "https://bishare.app/d/short"],
  "dl.bishareusercontent.com/drive": [302, "https://bishare.app/drive"],
  "dl.bishareusercontent.com/drive/files?a=1": [302, "https://bishare.app/drive/files?a=1"],
  "dl.bishareusercontent.com/id/drive": [302, "https://bishare.app/id/drive"],
  "dl.bishareusercontent.com/id/drive/files": [302, "https://bishare.app/id/drive/files"],
  "dl.bishareusercontent.com/drivex": [302, "https://bishare.app/drivex"],
  "dl.bishareusercontent.com/robots.txt": [200, "User-Agent: Twitterbot\nUser-Agent: facebookexternalhit\nUser-Agent: LinkedInBot\nUser-Agent: Slackbot-LinkExpanding\nUser-Agent: Discordbot\nUser-Agent: TelegramBot\nUser-Agent: WhatsApp\nUser-Agent: SkypeUriPreview\nUser-Agent: redditbot\nUser-Agent: Embedly\nAllow: /\n\nUser-Agent: *\nDisallow: /\n"],
  "dl.bishareusercontent.com/rooms": [302, "https://bishare.app/rooms"],
  "dl.bishareusercontent.com/save-page": [302, "https://bishare.app/save-page"],
  "dl.bishareusercontent.com/Transfer/ABC": [302, "https://bishare.app/Transfer/ABC"],
  "get.bishare.app/": [302, "https://dl.bishareusercontent.com/"],
  "get.bishare.app/features": [302, "https://dl.bishareusercontent.com/features"],
  "get.bishare.app/id/features?x=1&y=%20": [302, "https://dl.bishareusercontent.com/id/features?x=1&y=%20"],
  "get.bishare.app/transfer": [302, "https://dl.bishareusercontent.com/transfer"],
  "get.bishare.app/transfer/ABC123": [302, "https://dl.bishareusercontent.com/transfer/ABC123"],
  "get.bishare.app/id/transfer/ABC123?k=1": [302, "https://dl.bishareusercontent.com/id/transfer/ABC123?k=1"],
  "get.bishare.app/zh-Hant/transfer/ABC123": [302, "https://dl.bishareusercontent.com/zh-Hant/transfer/ABC123"],
  "get.bishare.app/ID/transfer/ABC123": [302, "https://dl.bishareusercontent.com/ID/transfer/ABC123"],
  "get.bishare.app/transfer/a/b": [302, "https://dl.bishareusercontent.com/transfer/a/b"],
  "get.bishare.app/d/AAAAAAAAAAAAAAAAAAAAAA": [302, "https://dl.bishareusercontent.com/d/AAAAAAAAAAAAAAAAAAAAAA"],
  "get.bishare.app/ja/d/AAAAAAAAAAAAAAAAAAAAAA": [302, "https://dl.bishareusercontent.com/ja/d/AAAAAAAAAAAAAAAAAAAAAA"],
  "get.bishare.app/d/short": [302, "https://dl.bishareusercontent.com/d/short"],
  "get.bishare.app/drive": [302, "https://dl.bishareusercontent.com/drive"],
  "get.bishare.app/drive/files?a=1": [302, "https://dl.bishareusercontent.com/drive/files?a=1"],
  "get.bishare.app/id/drive": [302, "https://dl.bishareusercontent.com/id/drive"],
  "get.bishare.app/id/drive/files": [302, "https://dl.bishareusercontent.com/id/drive/files"],
  "get.bishare.app/drivex": [302, "https://dl.bishareusercontent.com/drivex"],
  "get.bishare.app/robots.txt": [200, "User-Agent: Twitterbot\nUser-Agent: facebookexternalhit\nUser-Agent: LinkedInBot\nUser-Agent: Slackbot-LinkExpanding\nUser-Agent: Discordbot\nUser-Agent: TelegramBot\nUser-Agent: WhatsApp\nUser-Agent: SkypeUriPreview\nUser-Agent: redditbot\nUser-Agent: Embedly\nAllow: /\n\nUser-Agent: *\nDisallow: /\n"],
  "get.bishare.app/rooms": [302, "https://dl.bishareusercontent.com/rooms"],
  "get.bishare.app/save-page": [302, "https://dl.bishareusercontent.com/save-page"],
  "get.bishare.app/Transfer/ABC": [302, "https://dl.bishareusercontent.com/Transfer/ABC"],
  "drive.bishare.app/robots.txt": [200, "User-Agent: *\nDisallow: /\n"],
};

describe("hostRule", () => {
  it.each(HOSTS)("answers on %s as it always has", async (host) => {
    for (const path of PATHS) {
      const res = hostRule(new Request(`https://${host}${path}`));
      const got = res && [res.status, res.status === 200 ? await res.text() : res.headers.get("location")];
      expect(got ?? undefined, host + path).toEqual(RECORDED[host + path]);
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
