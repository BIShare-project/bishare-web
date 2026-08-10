// Marketing-only routing. next-intl rewrites unprefixed default-locale paths
// ("/features" → internal "/en/features"), keeps other locales prefixed, and
// redirects a redundant default prefix ("/en/features" → "/features"). The admin
// panel and Web Drive were removed — BIShare is a free, no-account transfer tool.
import type { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export function middleware(request: NextRequest): NextResponse {
  return intlMiddleware(request);
}

export const config = {
  // Everything except API routes, Next internals, and the worker-served metadata
  // routes runs through next-intl. Real static assets are served by the ASSETS
  // binding before the worker, so they never reach here; unknown dotted paths
  // still rewrite into [locale] → [...rest] → a clean 404.
  matcher: ["/", "/((?!api|_next|sitemap\\.xml|robots\\.txt).*)"],
};
