import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import { siteLocale } from "./locale";

const nextIntl = createMiddleware(routing);
const ORIGIN = "https://bishare.app";

interface Answer { status: number; location: string | null; cookie: string | null; link: string | null }

function ours(path: string, headers: Record<string, string>): Answer {
  const request = new Request(ORIGIN + path, { headers });
  const a = siteLocale(request);
  if (!a) return { status: 200, location: null, cookie: null, link: null };
  if (a instanceof Response) return { status: a.status, location: a.headers.get("location"), cookie: a.headers.get("set-cookie"), link: a.headers.get("link") };
  return { status: 200, location: null, cookie: a.headers.get("set-cookie"), link: a.headers.get("link") };
}

function theirs(path: string, headers: Record<string, string>): Answer {
  const res = nextIntl(new NextRequest(ORIGIN + path, { headers }));
  return { status: res.status, location: res.headers.get("location")?.replace(ORIGIN, "") ?? null, cookie: res.headers.get("set-cookie"), link: res.headers.get("link") };
}

const LANGS = [null, "", "*", "en", "en-US,en;q=0.9", "id", "id-ID,id;q=0.9,en;q=0.8", "pt", "pt-PT", "pt-BR,pt", "zh", "zh-CN", "zh-TW,zh;q=0.9", "zh-HK", "zh-Hant-TW", "xx", "xx,fr;q=0.5", "ar-EG", "ms", "nb-NO", "de-CH;q=0", "en;q=0.1,ja;q=0.9", "garbage;;q=", "ja,ko,*;q=0.1"];
const COOKIES = [null, "NEXT_LOCALE=en", "NEXT_LOCALE=id", "NEXT_LOCALE=zh-Hant", "NEXT_LOCALE=xx", "NEXT_LOCALE=", "NEXT_LOCALE", "a=b; NEXT_LOCALE=de", "NEXT_LOCALE=%E0%A4%A", "NEXT_LOCALE=pt%2DBR", "NEXT_LOCALE=fr; NEXT_LOCALE=ja"];
const DESTS = [null, "document", "empty"];
const PATHS = ["/", "/airdrop-for-windows", "/airdrop-for-windows?a=1&b=%20x", "/id", "/id/airdrop-for-windows", "/zh-Hant/airdrop-for-windows?x=1", "/pt-BR", "/en", "/en/features?x=1", "/EN/features", "/ID/features", "/Id", "/pt-br/features", "/zh-hans", "/zh-Hans-x", "/idx/features", "/does-not-exist", "/id/does-not-exist", "/%5Cevil.com", "/en/%5Cevil.com", "/en/%09/evil.com", "/%69d/features", "/id%2Ffeatures", "/%E0%A4%A", "/features%2F", "/a%20b", "/ja/%E7%B4%84", "/constructor"];

describe("siteLocale", () => {
  // next-intl is the engine production runs, so it is the reference for every combination.
  it.each(PATHS)("answers %s exactly as next-intl does", (path) => {
    let n = 0;
    for (const lang of LANGS) for (const cookie of COOKIES) for (const dest of DESTS) {
      const headers: Record<string, string> = { host: "bishare.app" };
      if (lang !== null) headers["accept-language"] = lang;
      if (cookie !== null) headers.cookie = cookie;
      if (dest !== null) headers["sec-fetch-dest"] = dest;
      expect(ours(path, headers), `${path} ${JSON.stringify(headers)}`).toEqual(theirs(path, headers));
      n++;
    }
    expect(n).toBe(LANGS.length * COOKIES.length * DESTS.length);
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
