import { routing } from "@/i18n/routing";
import { DRIVE_HOST } from "@/lib/hosts";

// The web Drive's host. User files are never served from the marketing site, so the Drive lives on its own: at the root
// of drive.bishare.app, where the language comes from the cookie or the browser and not from the address; and under
// /drive on localhost and previews, which have one host for everything.

interface Env {
  ASSETS: { fetch(req: Request): Promise<Response> };
  /** Another API than the real one, for local tests. */
  API_URL?: string;
}

/** The Drive's addresses. Anything else goes to its overview. */
const PAGES = new Set(["", "/files", "/recent", "/photos", "/links", "/devices", "/trash", "/storage", "/security", "/delete-account"]);

/** The site language that best fits the cookie, then the browser's list. */
export function driveLocale(req: Request): string {
  const locales = routing.locales as readonly string[];
  const cookie = /(?:^|;\s*)NEXT_LOCALE=([^;]*)/.exec(req.headers.get("cookie") ?? "")?.[1];
  if (cookie && locales.includes(cookie)) return cookie;
  for (const part of (req.headers.get("accept-language") ?? "").split(",")) {
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

/**
 * The Drive's pages hold a vault key in memory, so they run nothing but the Drive's own scripts (a nonce per request,
 * 'strict-dynamic' for the modules they load) and talk to nothing but this host, the API and R2. 'unsafe-eval' is for
 * heic2any (Emscripten builds functions with new Function), never for a script someone else wrote: injected markup
 * still cannot run. Styles may be inline: style attributes, and docx-preview writes <style> into the sandboxed frame,
 * which inherits this policy.
 */
function policy(nonce: string, api = "https://api.bishare.app"): string {
  const origin = new URL(api).origin;
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self' data: blob:",
    "media-src 'self' blob:",
    `connect-src 'self' ${origin} ${origin.replace(/^http/, "ws")} https://*.r2.cloudflarestorage.com`,
    "frame-src 'self' blob:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join("; ");
}

/** The answer for a Drive address; null when its document was not built. */
export async function serveDrive(req: Request, env: Env): Promise<Response | null> {
  if (req.method !== "GET" && req.method !== "HEAD") return new Response(null, { status: 405, headers: { allow: "GET, HEAD" } });
  const url = new URL(req.url);
  const shared = url.host !== DRIVE_HOST;
  const at = shared ? /^(?:\/([A-Za-z-]+))?\/drive(?=\/|$)/.exec(url.pathname) : null;
  const locale = shared ? (at?.[1] ?? routing.defaultLocale) : driveLocale(req);
  const base = at?.[0] ?? "";
  const page = url.pathname.slice(base.length).replace(/\/$/, "");
  if (!PAGES.has(page)) return new Response(null, { status: 307, headers: { location: base || "/" } });

  const file = `/_p/drive/${locale}${page === "/delete-account" ? "/delete-account" : ""}.html`;
  const built = await env.ASSETS.fetch(new Request(new URL(file, url)));
  if (built.status !== 200) return null;
  const nonce = btoa(crypto.randomUUID());
  const html = (await built.text()).replaceAll("__NONCE__", nonce).replaceAll("__BASE__", base);
  return new Response(req.method === "HEAD" ? null : html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-cache, no-store, max-age=0, must-revalidate",
      "content-security-policy": policy(nonce, env.API_URL),
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
