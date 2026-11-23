import { APEX_HOST, DRIVE_HOST, DRIVE_PATH, LEGACY_RECEIVE_HOST, LINK_PATH, MAIN_HOSTS, RECEIVE_HOST, RECEIVE_PATH, WWW_HOST } from "@/lib/hosts";
import { LINK_PREVIEW_GROUP } from "@/lib/preview-bots";

function redirect(status: 301 | 302 | 308, location: string): Response {
  return new Response(null, { status, headers: { location } });
}

function robots(body: string): Response {
  return new Response(body, { headers: { "content-type": "text/plain" } });
}

/** One slash between segments and none at the end: 308 to the path without them, one step at a time like Next. */
export function slashRedirect(url: URL): Response | null {
  const single = url.pathname.replace(/\/{2,}/g, "/");
  if (single !== url.pathname) return redirect(308, single + url.search);
  if (url.pathname !== "/" && url.pathname.endsWith("/")) return redirect(308, url.pathname.slice(0, -1) + url.search);
  return null;
}

/**
 * What a host answers without rendering a page: a redirect to the host a path belongs to, or a robots.txt of its own.
 * Null when the request goes on to the pages. The reasons for the split are in src/middleware.ts.
 */
export function hostRule(req: Request): Response | null {
  const url = new URL(req.url);
  const { host, pathname: path } = url;
  const moveTo = (to: string, status: 301 | 302 = 302) => redirect(status, `https://${to}${path}${url.search}`);

  if (MAIN_HOSTS.has(host)) {
    if (RECEIVE_PATH.test(path) || LINK_PATH.test(path)) return moveTo(RECEIVE_HOST);
    if (DRIVE_PATH.test(path)) return redirect(302, `https://${DRIVE_HOST}${path.replace(DRIVE_PATH, "") || "/"}${url.search}`);
    return host === WWW_HOST ? moveTo(APEX_HOST, 301) : null;
  }
  if (host === LEGACY_RECEIVE_HOST || host === RECEIVE_HOST) {
    if (path === "/robots.txt") return robots(`${LINK_PREVIEW_GROUP}\nUser-Agent: *\nDisallow: /\n`);
    if (host === LEGACY_RECEIVE_HOST) return moveTo(RECEIVE_HOST);
    return RECEIVE_PATH.test(path) || LINK_PATH.test(path) ? null : moveTo(APEX_HOST);
  }
  if (host === DRIVE_HOST && path === "/robots.txt") return robots("User-Agent: *\nDisallow: /\n");
  return null;
}
