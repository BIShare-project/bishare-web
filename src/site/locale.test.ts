import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { siteLocale } from "./locale";

const ORIGIN = "https://bishare.app";

interface Answer { status: number; location: string | null; cookie: string | null; link: string | null }

function ours(path: string, headers: Record<string, string>): Answer {
  const request = new Request(ORIGIN + path, { headers });
  const a = siteLocale(request);
  if (!a) return { status: 200, location: null, cookie: null, link: null };
  if (a instanceof Response) return { status: a.status, location: a.headers.get("location"), cookie: a.headers.get("set-cookie"), link: a.headers.get("link") };
  return { status: 200, location: null, cookie: a.headers.get("set-cookie"), link: a.headers.get("link") };
}

// What the site answered before it was written in Hono, for every combination below (recorded 2026-11-23): a digest of
// the answers per path.
const RECORDED: Record<string, string> = {
  "/": "d4edcee2e283f7b2",
  "/airdrop-for-windows": "528d76615f28dc4e",
  "/airdrop-for-windows?a=1&b=%20x": "734803d705cc58d2",
  "/id": "bb0eb290bbc5c6a0",
  "/id/airdrop-for-windows": "e594f65a77af87ba",
  "/zh-Hant/airdrop-for-windows?x=1": "de27c36fe409f090",
  "/pt-BR": "9645bbd5ce7fee11",
  "/en": "29021a2f916e49be",
  "/en/features?x=1": "9a25da8c6f1eb496",
  "/EN/features": "a6ce829d4a375a87",
  "/ID/features": "78cfc79ae369032f",
  "/Id": "fd3aa3c3d6e77faf",
  "/pt-br/features": "494fc78f7d7f9bc9",
  "/zh-hans": "5892a0f7d45095e9",
  "/zh-Hans-x": "a0f7991dc1c25bc0",
  "/idx/features": "4151d44196688acc",
  "/does-not-exist": "756b889910b676a7",
  "/id/does-not-exist": "36f3f90794d878d3",
  "/%5Cevil.com": "ce5a25eb59f708e9",
  "/en/%5Cevil.com": "2853115cae412ce3",
  "/en/%09/evil.com": "22a174871bee08fb",
  "/%69d/features": "71dcbd4eb75d6142",
  "/id%2Ffeatures": "5d0d07bf218cab6c",
  "/%E0%A4%A": "e24bc33ab3f85158",
  "/features%2F": "325ae04e394ae43b",
  "/a%20b": "5a5a96e94a0ddd55",
  "/ja/%E7%B4%84": "9b874e2a8a5f03ac",
  "/constructor": "b3cce3e63f762a2c"
};

const LANGS = [null, "", "*", "en", "en-US,en;q=0.9", "id", "id-ID,id;q=0.9,en;q=0.8", "pt", "pt-PT", "pt-BR,pt", "zh", "zh-CN", "zh-TW,zh;q=0.9", "zh-HK", "zh-Hant-TW", "xx", "xx,fr;q=0.5", "ar-EG", "ms", "nb-NO", "de-CH;q=0", "en;q=0.1,ja;q=0.9", "garbage;;q=", "ja,ko,*;q=0.1"];
const COOKIES = [null, "NEXT_LOCALE=en", "NEXT_LOCALE=id", "NEXT_LOCALE=zh-Hant", "NEXT_LOCALE=xx", "NEXT_LOCALE=", "NEXT_LOCALE", "a=b; NEXT_LOCALE=de", "NEXT_LOCALE=%E0%A4%A", "NEXT_LOCALE=pt%2DBR", "NEXT_LOCALE=fr; NEXT_LOCALE=ja"];
const DESTS = [null, "document", "empty"];
const PATHS = ["/", "/airdrop-for-windows", "/airdrop-for-windows?a=1&b=%20x", "/id", "/id/airdrop-for-windows", "/zh-Hant/airdrop-for-windows?x=1", "/pt-BR", "/en", "/en/features?x=1", "/EN/features", "/ID/features", "/Id", "/pt-br/features", "/zh-hans", "/zh-Hans-x", "/idx/features", "/does-not-exist", "/id/does-not-exist", "/%5Cevil.com", "/en/%5Cevil.com", "/en/%09/evil.com", "/%69d/features", "/id%2Ffeatures", "/%E0%A4%A", "/features%2F", "/a%20b", "/ja/%E7%B4%84", "/constructor"];

describe("siteLocale", () => {
  it.each(PATHS)("answers %s as it always has, whatever the languages, cookie and kind of request", (path) => {
    const digest = createHash("sha256");
    for (const lang of LANGS) for (const cookie of COOKIES) for (const dest of DESTS) {
      const headers: Record<string, string> = { host: "bishare.app" };
      if (lang !== null) headers["accept-language"] = lang;
      if (cookie !== null) headers.cookie = cookie;
      if (dest !== null) headers["sec-fetch-dest"] = dest;
      digest.update(JSON.stringify(ours(path, headers)));
    }
    expect(digest.digest("hex").slice(0, 16)).toBe(RECORDED[path]);
  });

  // Read from bishare.app on 2026-11-23.
  it.each([
    ["/", { "accept-language": "id" }, 307, "/id", null],
    ["/", { "accept-language": "id", cookie: "NEXT_LOCALE=en" }, 200, null, null],
    ["/", { cookie: "NEXT_LOCALE=id" }, 307, "/id", null],
    ["/", { "accept-language": "zh-TW,zh;q=0.9" }, 307, "/zh-Hant", null],
    ["/", {}, 200, null, "NEXT_LOCALE=en; Path=/; SameSite=lax"],
    ["/airdrop-for-windows?a=1&b=2", { "accept-language": "de" }, 307, "/de/airdrop-for-windows?a=1&b=2", null],
    ["/id/airdrop-for-windows", { cookie: "NEXT_LOCALE=de" }, 200, null, "NEXT_LOCALE=id; Path=/; SameSite=lax"],
  ] as const)("answers %s with %j as production does", (path, headers, status, location, cookie) => {
    expect(ours(path, { ...headers } as Record<string, string>)).toMatchObject({ status, location, cookie });
  });
});
