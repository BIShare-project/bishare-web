import { NextResponse } from "next/server";

/**
 * Fallback for the Web Share Target. Normally the service worker answers this
 * POST itself (see public/sw.js) and never lets it reach the network — that is
 * the only way to get at the shared files, since a server on Cloudflare can't
 * hand a File back to the page.
 *
 * The request only arrives here when no worker is in control yet: the moments
 * right after install, or after a browser has evicted the registration. Send
 * the user to the transfer page rather than showing them a 404 for a share
 * they just made; the file is lost either way, but the app opens.
 *
 * Lives under /api so the locale middleware leaves it alone (see the matcher
 * in src/middleware.ts) — a locale redirect would bounce the POST to a path
 * that doesn't exist.
 */
export async function POST(request: Request) {
  return NextResponse.redirect(new URL("/transfer", request.url), 303);
}

export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/transfer", request.url), 307);
}
