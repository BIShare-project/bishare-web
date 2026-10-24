// Host routing. next-intl rewrites unprefixed default-locale paths
// ("/features" → internal "/en/features"), keeps other locales prefixed, and
// redirects a redundant default prefix ("/en/features" → "/features"). The web
// Drive has its own host and a strict policy (drivePolicy below).
//
// Since 2026-09-26 this file also splits the site across two hosts. Safe
// Browsing flagged bishare.app for "harmful downloads" after a user shared
// malware: recipient downloads are attributed to the host that serves them,
// and we cannot scan end-to-end encrypted files, so the only controllable
// variable is which host takes the blame. The receive page (/transfer/<code>)
// therefore lives on get.bishare.app — the next bad file flags that host, not
// the marketing site. Same pattern as googleusercontent.com /
// githubusercontent.com. Links keep working: bishare.app/transfer/<code>
// redirects across, and the #k= fragment survives redirects in every browser
// because fragments never leave the client.
import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { LINK_PREVIEW_GROUP } from "@/lib/preview-bots";

const intlMiddleware = createIntlMiddleware(routing);

const APEX_HOST = "bishare.app";
const WWW_HOST = "www.bishare.app";
const MAIN_HOSTS = new Set([APEX_HOST, WWW_HOST]);
const RECEIVE_HOST = "get.bishare.app";
// The web Drive (drive-plan.md phase 6) lives on its own host for the same
// reason as the receive pages: user files are never served from the marketing
// site. Its pages are /[locale]/drive/... inside; the host shows them at its
// root (drive.bishare.app/files) and picks the language from the cookie or
// the browser, not from the URL.
const DRIVE_HOST = "drive.bishare.app";
const DRIVE_PATH = new RegExp(`^/(?:(?:${routing.locales.join("|")})/)?drive(?=/|$)`);
const LOCALE_COOKIE = "NEXT_LOCALE";

/** The site language that best fits the cookie, then the browser's list. */
function driveLocale(request: NextRequest): string {
  const locales = routing.locales as readonly string[];
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookie && locales.includes(cookie)) return cookie;
  for (const part of (request.headers.get("accept-language") ?? "").split(",")) {
    const tag = part.split(";")[0]!.trim();
    if (!tag) continue;
    if (locales.includes(tag)) return tag;
    const lower = tag.toLowerCase();
    if (lower.startsWith("pt")) return "pt-BR";
    if (lower === "zh-tw" || lower === "zh-hk" || lower.startsWith("zh-hant")) return "zh-Hant";
    if (lower.startsWith("zh")) return "zh-Hans";
    const base = lower.split("-")[0]!;
    const hit = locales.find((l) => l.toLowerCase() === base);
    if (hit) return hit;
  }
  return routing.defaultLocale;
}

// /transfer/<code>, with or without a locale prefix. `/transfer` itself (the
// send tool) stays on the marketing host.
const RECEIVE_PATH = new RegExp(`^/(?:(?:${routing.locales.join("|")})/)?transfer/[^/]+$`);
// /d/<id>: a link from someone's Drive (drive-plan.md 6B.3), on the receive
// host for the same reason as a transfer.
const LINK_PATH = new RegExp(`^/(?:(?:${routing.locales.join("|")})/)?d/[A-Za-z0-9_-]{22}$`);

/**
 * The Drive's pages hold a vault key in memory, so they run nothing but
 * Next's own scripts (a nonce per request, 'strict-dynamic' for the chunks
 * they load) and talk to nothing but this host, the API and R2. 'unsafe-eval'
 * is for heic2any (Emscripten builds functions with new Function), never for
 * a script someone else wrote: injected markup still cannot run. Styles may
 * be inline: React style props, and docx-preview writes <style> into the
 * sandboxed frame, which inherits this policy.
 */
function drivePolicy(): { nonce: string; csp: string } {
  const nonce = btoa(crypto.randomUUID());
  const api = process.env.NEXT_PUBLIC_API_URL || "https://api.bishare.app";
  const apiOrigin = /^https?:\/\//.test(api) ? new URL(api).origin : "";
  const dev = process.env.NODE_ENV === "development";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self' data: blob:",
    "media-src 'self' blob:",
    `connect-src 'self' ${apiOrigin} ${apiOrigin.replace(/^http/, "ws")} https://*.r2.cloudflarestorage.com${dev ? " ws:" : ""}`,
    "frame-src 'self' blob:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join("; ");
  return { nonce, csp };
}

/** The request headers Next reads the nonce from, and the same policy on the answer. */
function withDrivePolicy(request: NextRequest): { headers: Headers; secure: (res: NextResponse) => NextResponse } {
  const { nonce, csp } = drivePolicy();
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  return {
    headers,
    secure: (res) => {
      res.headers.set("Content-Security-Policy", csp);
      res.headers.set("X-Content-Type-Options", "nosniff");
      res.headers.set("Referrer-Policy", "no-referrer");
      res.headers.set("X-Robots-Tag", "noindex, nofollow");
      return res;
    },
  };
}

/**
 * 302 by default, not 308: cheap to roll back, and easy to upgrade once this
 * has soaked. The www → apex move passes 301 because that one is permanent.
 */
function moveTo(host: string, request: NextRequest, status: 301 | 302 = 302): NextResponse {
  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.host = host;
  url.port = "";
  return NextResponse.redirect(url, status);
}

export function middleware(request: NextRequest): NextResponse {
  const host = (request.headers.get("host") ?? "").toLowerCase();
  const path = request.nextUrl.pathname;

  if (MAIN_HOSTS.has(host)) {
    if (RECEIVE_PATH.test(path) || LINK_PATH.test(path)) return moveTo(RECEIVE_HOST, request);
    if (DRIVE_PATH.test(path)) {
      const url = request.nextUrl.clone();
      url.protocol = "https:";
      url.host = DRIVE_HOST;
      url.port = "";
      url.pathname = path.replace(DRIVE_PATH, "") || "/";
      return NextResponse.redirect(url, 302);
    }
    // www answered 200 with a canonical pointing at the apex. Crawlers still
    // counted every page twice, and the hreflang set on the www copy named
    // apex URLs only, which a site audit on 2026-10-03 reported as 33 hreflang
    // conflicts. One host, one copy.
    if (host === WWW_HOST) return moveTo(APEX_HOST, request, 301);
    if (path === "/robots.txt") return NextResponse.next(); // app/robots.ts as before
    return intlMiddleware(request);
  }

  if (host === RECEIVE_HOST) {
    // The receive host carries no indexable content at all — receive pages are
    // already noindex and expire within a day. Disallowing everything also
    // keeps the marketing pages from being crawled twice under two hosts.
    // Link-preview fetchers are the exception, so a link pasted into X,
    // Slack or LinkedIn shows its preview card (lib/preview-bots).
    if (path === "/robots.txt") {
      return new NextResponse(`${LINK_PREVIEW_GROUP}\nUser-Agent: *\nDisallow: /\n`, {
        headers: { "Content-Type": "text/plain" },
      });
    }
    if (RECEIVE_PATH.test(path) || LINK_PATH.test(path)) {
      const res = intlMiddleware(request);
      res.headers.set("X-Robots-Tag", "noindex");
      return res;
    }
    // Anything else (home, guides, the send tool) belongs to the marketing
    // host — bounce back rather than serving the whole site twice.
    return moveTo("bishare.app", request);
  }

  if (host === DRIVE_HOST) {
    if (path === "/robots.txt") {
      return new NextResponse("User-Agent: *\nDisallow: /\n", { headers: { "Content-Type": "text/plain" } });
    }
    const url = request.nextUrl.clone();
    url.pathname = `/${driveLocale(request)}/drive${path === "/" ? "" : path}`;
    // The pages link to the host's own paths (no /drive in front).
    const { headers, secure } = withDrivePolicy(request);
    headers.set("x-drive-base", "root");
    return secure(NextResponse.rewrite(url, { request: { headers } }));
  }

  // localhost, *.workers.dev previews: single-host behaviour, unchanged.
  // The web Drive is at /drive there, under the same policy as on its host.
  if (DRIVE_PATH.test(path)) {
    const { headers, secure } = withDrivePolicy(request);
    return secure(intlMiddleware(new NextRequest(request, { headers })));
  }
  return intlMiddleware(request);
}

export const config = {
  // Everything except API routes, Next internals, and the worker-served metadata
  // routes runs through next-intl. robots.txt DOES run through here since the
  // host split: the receive host answers it inline, the marketing host passes
  // it straight to app/robots.ts. Real static assets are served by the ASSETS
  // binding before the worker, so they never reach here; unknown dotted paths
  // still rewrite into [locale] → [...rest] → a clean 404. The save bridge
  // (public/save-bridge.html) is skipped too, so `next dev` serves it as the
  // assets binding does.
  matcher: ["/", "/((?!api|_next|sitemap\\.xml|feed\\.xml|save-bridge).*)"],
};
