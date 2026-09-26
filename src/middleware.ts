// Marketing-only routing. next-intl rewrites unprefixed default-locale paths
// ("/features" → internal "/en/features"), keeps other locales prefixed, and
// redirects a redundant default prefix ("/en/features" → "/features"). The admin
// panel and Web Drive were removed — BIShare is a free, no-account transfer tool.
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
import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const MAIN_HOSTS = new Set(["bishare.app", "www.bishare.app"]);
const RECEIVE_HOST = "get.bishare.app";

// /transfer/<code>, with or without a locale prefix. `/transfer` itself (the
// send tool) stays on the marketing host. /s/<token> is not a receive surface:
// it only forwards to the retired Drive share page, so it stays put.
const RECEIVE_PATH = new RegExp(`^/(?:(?:${routing.locales.join("|")})/)?transfer/[^/]+$`);

/** 302, not 308: cheap to roll back, and easy to upgrade once this has soaked. */
function moveTo(host: string, request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.host = host;
  url.port = "";
  return NextResponse.redirect(url, 302);
}

export function middleware(request: NextRequest): NextResponse {
  const host = (request.headers.get("host") ?? "").toLowerCase();
  const path = request.nextUrl.pathname;

  if (MAIN_HOSTS.has(host)) {
    if (path === "/robots.txt") return NextResponse.next(); // app/robots.ts as before
    if (RECEIVE_PATH.test(path)) return moveTo(RECEIVE_HOST, request);
    return intlMiddleware(request);
  }

  if (host === RECEIVE_HOST) {
    // The receive host carries no indexable content at all — receive pages are
    // already noindex and expire within a day. Disallowing everything also
    // keeps the marketing pages from being crawled twice under two hosts.
    if (path === "/robots.txt") {
      return new NextResponse("User-Agent: *\nDisallow: /\n", {
        headers: { "Content-Type": "text/plain" },
      });
    }
    if (RECEIVE_PATH.test(path)) {
      const res = intlMiddleware(request);
      res.headers.set("X-Robots-Tag", "noindex");
      return res;
    }
    // Anything else (home, guides, the send tool) belongs to the marketing
    // host — bounce back rather than serving the whole site twice.
    return moveTo("bishare.app", request);
  }

  // localhost, *.workers.dev previews: single-host behaviour, unchanged.
  return intlMiddleware(request);
}

export const config = {
  // Everything except API routes, Next internals, and the worker-served metadata
  // routes runs through next-intl. robots.txt DOES run through here since the
  // host split: the receive host answers it inline, the marketing host passes
  // it straight to app/robots.ts. Real static assets are served by the ASSETS
  // binding before the worker, so they never reach here; unknown dotted paths
  // still rewrite into [locale] → [...rest] → a clean 404.
  matcher: ["/", "/((?!api|_next|sitemap\\.xml|feed\\.xml).*)"],
};
