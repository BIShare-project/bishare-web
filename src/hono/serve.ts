import { routing } from "@/i18n/routing";
import { APEX_HOST } from "@/lib/hosts";
import { hostRule } from "./host-rules";
import { siteLocale } from "./locale";

// The Worker's side of the Hono pages. They are built to HTML files (src/hono/build.tsx) and published with the other
// static files under PAGE_DIR, a path the Worker never lets through (wrangler run_worker_first), so a page has one URL.
// A page is answered here only when its route is switched on; everything else goes to Next as before.

export const PAGE_DIR = "/_p";

/** The parts of the Worker bindings used here (ASSETS, a KV namespace). */
interface Files {
  fetch(req: Request): Promise<Response>;
}
interface Store {
  get(key: string): Promise<string | null>;
}

export interface ServeEnv {
  ASSETS: Files;
  /** Holds cfg:web.hono, the routes switched on. Without it every route stays on Next. */
  BISHARE_WEB_CFG?: Store;
  /** With it, x-bs-engine can force an engine in production (parity checks). */
  PARITY_TOKEN?: string;
}

export type Engine = "next" | "hono";
export type Switch = (key: string) => boolean;

/** The cache header Next sends for these pages (prerendered, revalidated at deploy). */
const CACHE = "s-maxage=31536000, stale-while-revalidate=2592000";

/** Local builds and *.workers.dev previews: one host for everything. */
const isPreview = (host: string) => /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) || host.endsWith(".workers.dev");

/**
 * The .html files in public/, which the site has always served without their extension (assets html_handling
 * "auto-trailing-slash", now "none"): /save-bridge on get.bishare.app, /offline for the service worker. Their .html
 * spelling redirects there; wrangler's run_worker_first lists them so that redirect reaches this code.
 */
export const HTML_FILES = ["/offline", "/save-bridge"];

export async function htmlFile(req: Request, env: ServeEnv): Promise<Response | null> {
  if (req.method !== "GET" && req.method !== "HEAD") return null;
  const url = new URL(req.url);
  if (url.pathname.endsWith(".html") && HTML_FILES.includes(url.pathname.slice(0, -5))) {
    return new Response(null, { status: 307, headers: { location: url.pathname.slice(0, -5) + url.search } });
  }
  if (!HTML_FILES.includes(url.pathname)) return null;
  const file = await env.ASSETS.fetch(new Request(new URL(`${url.pathname}.html`, url.origin), { method: req.method, headers: req.headers }));
  return file.status === 404 ? null : file;
}

/** The engine a request asks for with x-bs-engine: honoured with the parity token, or on a local or preview host. */
export function engineFor(req: Request, env: ServeEnv): Engine | null {
  const asked = req.headers.get("x-bs-engine");
  if (asked !== "next" && asked !== "hono") return null;
  const token = req.headers.get("x-bs-token");
  const trusted = isPreview(new URL(req.url).host) || (!!env.PARITY_TOKEN && token === env.PARITY_TOKEN);
  return trusted ? asked : null;
}

let cached: { at: number; keys: Set<string> } | null = null;

/** The routes switched on in KV (key cfg:web.hono, a JSON array of route keys), read at most once a minute. */
export async function routeSwitch(env: ServeEnv, now = Date.now()): Promise<Switch> {
  const kv = env.BISHARE_WEB_CFG;
  if (!kv) return () => false;
  if (!cached || now - cached.at > 60_000) {
    let keys = new Set<string>();
    try {
      const value = JSON.parse((await kv.get("cfg:web.hono")) ?? "[]");
      if (Array.isArray(value)) keys = new Set(value.filter((k): k is string => typeof k === "string"));
    } catch {
      // A broken value switches nothing on.
    }
    cached = { at: now, keys };
  }
  const keys = cached.keys;
  return (key) => keys.has(key);
}

/** The page a path names, without its language prefix, when the path is spelled as the page's own URL. */
function pagePath(pathname: string): { locale: string; path: string } | null {
  const first = pathname.split("/", 2)[1] ?? "";
  const locale = routing.locales.find((l) => l === first);
  if (locale === routing.defaultLocale || pathname.endsWith("/") && pathname !== "/") return null;
  return { locale: locale ?? routing.defaultLocale, path: locale ? pathname.slice(first.length + 1) || "/" : pathname };
}

/** The answer to a request for a Hono page that is switched on, or null for Next. */
export async function honoPage(req: Request, env: ServeEnv, on: Switch): Promise<Response | null> {
  if (req.method !== "GET" && req.method !== "HEAD") return null;
  const url = new URL(req.url);
  if (url.host !== APEX_HOST && !isPreview(url.host)) return null;
  // Host rules come first, as in src/middleware.ts; Next still gives those answers.
  if (hostRule(req)) return null;

  const site = siteLocale(req);
  if (!site) return null;
  if (site instanceof Response) {
    // A language redirect: answered here only when it leads to a page that is switched on.
    const to = pagePath(new URL(site.headers.get("location")!, url.origin).pathname);
    return to && on(`page:${to.path}`) ? site : null;
  }

  const page = pagePath(url.pathname);
  if (!page || !on(`page:${page.path}`)) return null;
  // The exact file: ASSETS runs with html_handling "none" (OpenNext requires it with run_worker_first).
  const file = `${PAGE_DIR}/${page.locale}${page.path === "/" ? "" : page.path}.html`;
  const built = await env.ASSETS.fetch(new Request(new URL(file, url.origin)));
  if (built.status !== 200) return null;

  const headers = new Headers(site.headers);
  headers.set("content-type", "text/html; charset=utf-8");
  // Next's router asks for its own format (RSC); the HTML it gets makes it load the page in full. Not for any cache.
  const router = req.headers.get("rsc") === "1" || url.searchParams.has("_rsc");
  headers.set("cache-control", router ? "private, no-store" : CACHE);
  return new Response(req.method === "HEAD" ? null : built.body, { status: 200, headers });
}
