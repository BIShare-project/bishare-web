import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { routing } from "@/i18n/routing";

// The site's language routing (next-intl, localePrefix "as-needed", with detection), without Next. locale.test.ts runs
// next-intl itself beside this for every header it can meet; keep the two identical.

const COOKIE = "NEXT_LOCALE";
const { locales, defaultLocale } = routing;
type Locale = (typeof locales)[number];

// Longest first: next-intl's workaround for https://github.com/formatjs/formatjs/issues/4469.
const BY_LENGTH = [...locales].sort((a, b) => b.length - a.length);

export interface SitePath {
  locale: Locale;
  /** The path without its locale prefix. */
  path: string;
  /** Link (hreflang) and, when the cookie must change, Set-Cookie. */
  headers: Headers;
}

function fromAcceptLanguage(req: Request): Locale | undefined {
  const languages = new Negotiator({ headers: { "accept-language": req.headers.get("accept-language") || undefined } }).languages();
  try {
    const best = match(languages, BY_LENGTH, defaultLocale);
    return locales.find((l) => l.toLowerCase() === best.toLowerCase());
  } catch {
    return undefined; // not a language tag
  }
}

/** The locale cookie as Next reads it: undefined when absent, the last one wins, an undecodable one is skipped. */
function cookieValue(req: Request): string | undefined {
  let value: string | undefined;
  for (const pair of (req.headers.get("cookie") ?? "").split(/; */)) {
    const at = pair.indexOf("=");
    if (at === -1) {
      if (pair === COOKIE) value = "true";
    } else if (pair.slice(0, at) === COOKIE) {
      try {
        value = decodeURIComponent(pair.slice(at + 1));
      } catch {
        // skipped
      }
    }
  }
  return value;
}

/** The locale prefix a path starts with, in any case; `exact` when its case is right. */
function prefixOf(path: string): { locale: Locale; exact: boolean } | null {
  for (const locale of BY_LENGTH) {
    const prefix = `/${locale}`;
    if (path === prefix || path.startsWith(`${prefix}/`)) return { locale, exact: true };
    const lower = path.toLowerCase();
    if (lower === prefix.toLowerCase() || lower.startsWith(`${prefix.toLowerCase()}/`)) return { locale, exact: false };
  }
  return null;
}

/** Characters that would turn a decoded path into another host in a redirect. */
const sanitize = (path: string) => path.replace(/\\/g, "%5C").replace(/[\t\n\r]/g, "").replace(/\/+/g, "/");

function alternates(origin: string, path: string): string {
  const entry = (p: string, lang: string) => `<${new URL(p, origin)}>; rel="alternate"; hreflang="${lang}"`;
  const links = locales.map((l) => entry(l === defaultLocale ? path : `/${l}${path === "/" ? "" : path}`, l));
  return [...links, entry(path, "x-default")].join(", ");
}

/** The page a request asks for, or the redirect to its canonical URL. Null when the path cannot be decoded. */
export function siteLocale(req: Request): SitePath | Response | null {
  const url = new URL(req.url);
  let external: string;
  try {
    external = sanitize(decodeURI(url.pathname));
  } catch {
    return null;
  }

  const prefix = prefixOf(external);
  const cookie = cookieValue(req);
  const accepted = fromAcceptLanguage(req);
  const remembered = locales.find((l) => l === cookie);
  const locale = prefix?.locale ?? remembered ?? accepted ?? defaultLocale;
  const path = prefix ? external.slice(prefix.locale.length + 1) || "/" : external;

  const headers = new Headers();
  // Only a page the person opens says which language they read; background requests leave the cookie alone.
  const dest = req.headers.get("sec-fetch-dest");
  if ((dest === null || dest === "document") && (cookie !== undefined ? cookie !== locale : accepted !== locale)) {
    headers.set("set-cookie", `${COOKIE}=${locale}; Path=/; SameSite=lax`);
  }

  const canonical = locale === defaultLocale ? path : `/${locale}${path === "/" ? "" : path}`;
  const wrongPrefix = prefix && (!prefix.exact || locale === defaultLocale);
  if (wrongPrefix || (!prefix && locale !== defaultLocale)) {
    // A prefix in the wrong case goes to the right case first, "/en" too.
    const to = prefix && !prefix.exact ? `/${locale}${path === "/" ? "" : path}` : canonical;
    const target = new URL(to + url.search, url.origin);
    headers.set("location", target.pathname + target.search);
    return new Response(null, { status: 307, headers });
  }

  headers.set("link", alternates(url.origin, siteLocalePath(url.pathname)));
  return { locale, path, headers };
}

/** The raw (still encoded) path without a locale prefix, as next-intl puts it in the Link header. */
function siteLocalePath(pathname: string): string {
  const prefix = prefixOf(pathname);
  return prefix ? pathname.slice(prefix.locale.length + 1) || "/" : pathname;
}
