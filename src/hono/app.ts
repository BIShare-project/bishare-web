import { APEX_HOST, DRIVE_HOST, DRIVE_PATH, RECEIVE_HOST } from "@/lib/hosts";
import { serveDrive } from "./drive-host";
import { hostRule, slashRedirect } from "./host-rules";
import { siteLocale } from "./locale";

// The whole site, request by request. Most pages are HTML files built ahead of time (build.tsx), published with the
// other static files under PAGE_DIR, a path no one can open (wrangler run_worker_first), so a page has one address.

export const PAGE_DIR = "/_p";

/** The parts of the Worker's bindings used here. */
export interface AppEnv {
  API_URL?: string;
  ASSETS: { fetch(req: Request): Promise<Response> };
  STATS_LIVE_DO: { idFromName(name: string): unknown; get(id: unknown): { fetch(req: Request): Promise<Response> } };
}
export interface Ctx {
  waitUntil(p: Promise<unknown>): void;
}
/** dynamic.tsx, loaded only when a request needs it. */
export interface Pages {
  renderDynamic(path: string, locale: string, env: object, ctx: Ctx): Promise<string | null>;
  api(req: Request, env: object, ctx: Ctx): Response | null;
}

const HTML = "text/html; charset=utf-8";
const STATIC_CACHE = "s-maxage=31536000, stale-while-revalidate=2592000";
const NO_CACHE = "private, no-cache, no-store, max-age=0, must-revalidate";

/**
 * Vulnerability scanners ask every site for its secrets (/.env, /.git/config, /wp-login.php…, about 1,800 a day in
 * November 2026). None of these can be a page of this site, so they get a plain 404; real typos get the 404 page.
 */
const PROBE =
  /(^|\/)\.(?!well-known(\/|$))|\.(php\d?|aspx?|jsp|cgi|env|bak|old|orig|save|swp|sql|ini|ya?ml|log|cfg|conf)(\/|$)|(^|\/)(wp-admin|wp-login|wp-content|wp-includes|xmlrpc|cgi-bin|phpmyadmin)(\/|\.|$)|\.\.|proc\/self/i;

/** Never a page: the built files themselves, and what a page of the old Next site left open in a tab still asks for. */
const HIDDEN = /^\/(_p|_next)(\/|$)/;

/**
 * The .html files of public/, which the site serves without their extension: the save frame, and the service worker's
 * offline page. Their .html spelling redirects there (wrangler's run_worker_first lists it).
 */
export const HTML_FILES = ["/offline", "/save-bridge"];

/** Files for crawlers, the same on every host that does not have its own. */
const TEXT_FILES: Record<string, { type: string; cache: string }> = {
  "/sitemap.xml": { type: "application/xml", cache: "public, max-age=0, must-revalidate" },
  "/feed.xml": { type: "application/rss+xml; charset=utf-8", cache: "public, max-age=3600" },
  "/robots.txt": { type: "text/plain", cache: "public, max-age=0, must-revalidate" },
};

/** Local builds and *.workers.dev previews: one host for everything. */
const isPreview = (host: string) => /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) || host.endsWith(".workers.dev");

const plain404 = () =>
  new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600", "x-robots-tag": "noindex" } });

async function file(req: Request, env: AppEnv, path: string): Promise<Response | null> {
  const res = await env.ASSETS.fetch(new Request(new URL(path, req.url)));
  return res.status === 200 ? res : null;
}

export async function handle(req: Request, env: AppEnv, ctx: Ctx, load: () => Promise<Pages>): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path === "/stats-live") return env.STATS_LIVE_DO.get(env.STATS_LIVE_DO.idFromName("global")).fetch(req);
  if (PROBE.test(path) || HIDDEN.test(path)) return plain404();
  if (path.startsWith("/api/")) return (await load()).api(req, env, ctx) ?? plain404();

  if (path.endsWith(".html") && HTML_FILES.includes(path.slice(0, -5))) return new Response(null, { status: 307, headers: { location: path.slice(0, -5) + url.search } });
  if (HTML_FILES.includes(path)) return env.ASSETS.fetch(new Request(new URL(`${path}.html`, url), { method: req.method, headers: req.headers }));

  const text = TEXT_FILES[path];
  const moved = slashRedirect(url) ?? (text && path !== "/robots.txt" ? null : hostRule(req));
  if (moved) return moved;
  if (text) {
    const res = await file(req, env, PAGE_DIR + path);
    if (res) return new Response(req.method === "HEAD" ? null : res.body, { headers: { "content-type": text.type, "cache-control": text.cache } });
  }

  const preview = isPreview(url.host);
  if (url.host === DRIVE_HOST || (preview && DRIVE_PATH.test(path))) {
    const answer = await serveDrive(req, env);
    if (answer) return answer;
  }
  if (req.method !== "GET" && req.method !== "HEAD") return new Response(null, { status: 405, headers: { allow: "GET, HEAD" } });

  const site = siteLocale(req);
  if (site instanceof Response) return site;
  const headers = new Headers(site?.headers);
  headers.set("content-type", HTML);
  const answer = (body: BodyInit | null, status: number, cache: string) => {
    headers.set("cache-control", cache);
    return new Response(req.method === "HEAD" ? null : body, { status, headers });
  };

  if (site) {
    const page = site.path;
    if (page !== "/404" && (url.host === APEX_HOST || preview)) {
      const built = await file(req, env, `${PAGE_DIR}/${site.locale}${page === "/" ? "" : encodeURI(page)}.html`);
      // Next's router, in a tab opened before the move, asks for its own format; the HTML makes it load the page in full.
      if (built) return answer(built.body, 200, req.headers.get("rsc") === "1" || url.searchParams.has("_rsc") ? "private, no-store" : STATIC_CACHE);
    }
    const html = await (await load()).renderDynamic(page, site.locale, env, ctx);
    if (html !== null) {
      if (url.host === RECEIVE_HOST) headers.set("x-robots-tag", "noindex");
      return answer(html, 200, NO_CACHE);
    }
  }
  const missing = await file(req, env, `${PAGE_DIR}/${site?.locale ?? "en"}/404.html`);
  return answer(missing?.body ?? "Not found", 404, NO_CACHE);
}
