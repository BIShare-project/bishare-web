import { routing } from "@/i18n/routing";
import { APEX_HOST } from "@/lib/hosts";

export type RouteKey = `page:${string}`;

export interface Match {
  key: RouteKey;
  /** The path without its locale prefix. */
  path: string;
  locale: (typeof routing.locales)[number];
  prefixed: boolean;
}

/**
 * The Hono page a path names. Only the canonical spelling of a page counts: every other spelling is a redirect or a 404,
 * and those are not for a page to answer.
 */
export function matchPath(pathname: string, pages: ReadonlySet<string>): Match | null {
  const first = pathname.split("/", 2)[1] ?? "";
  const locale = routing.locales.find((l) => l === first);
  if (locale === routing.defaultLocale) return null; // "/en" redirects
  const path = locale ? pathname.slice(first.length + 1) || "/" : pathname;
  if (locale && pathname.endsWith("/")) return null; // "/id/" redirects to "/id"
  if (!pages.has(path)) return null;
  return { key: `page:${path}`, path, locale: locale ?? routing.defaultLocale, prefixed: locale !== undefined };
}

/** Local builds and *.workers.dev previews: one host for everything. */
const isPreview = (host: string) => /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) || host.endsWith(".workers.dev");

/** The Hono page a request opens: GET or HEAD, on the marketing host only (see src/middleware.ts for why). */
export function matchRequest(req: Request, pages: ReadonlySet<string>): Match | null {
  if (req.method !== "GET" && req.method !== "HEAD") return null;
  const url = new URL(req.url);
  if (url.host !== APEX_HOST && !isPreview(url.host)) return null;
  return matchPath(url.pathname, pages);
}
