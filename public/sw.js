// BIShare marketing PWA service worker.
//
// Deliberately conservative to avoid the classic PWA failure mode — a stale
// service worker serving old HTML after a deploy:
//   • HTML/navigations  → network-first; the network response is NEVER cached,
//     so a fresh deploy is always served. Only on a network failure do we fall
//     back to the precached offline page.
//   • Build assets       → cache-first, but only content-hashed files
//     (/_next/static/*, images, fonts) whose URL changes on every rebuild, so
//     cached copies can never go stale.
//   • Cross-origin (the api.bishare.app API, Google Fonts) and non-GET requests
//     are never intercepted.
// skipWaiting + clients.claim take control immediately; safe here because no
// HTML is cached. Bump VERSION to drop old asset caches.

const VERSION = "v3";

// Encrypted-media streaming lives in a generated script (built from
// src/sw/stream-sw.ts, so the record format has one definition). It is pulled
// INTO this worker rather than registered separately, because interception is
// decided by which worker controls the PAGE — a second registration under a
// narrower scope would never see the media requests at all, and a second one
// at "/" would evict this worker and the offline page with it.
try {
  importScripts("/stream-sw.js");
} catch (e) {
  // Streaming is strictly additive; a missing/broken script must never take
  // the PWA worker down with it.
}
const CACHE = `bishare-static-${VERSION}`;
// Files handed over by the OS share sheet, waiting for the transfer page to
// collect them. Kept OUT of the versioned static cache (and out of the sweep
// in `activate`) so a deploy landing between the share and the pickup can't
// throw the user's file away.
const SHARE_CACHE = "bishare-share-inbox";
const SHARE_ACTION = "/api/share-target";
const SHARE_INDEX = "/__shared/index";
// Canonical clean URL — OpenNext serves public/offline.html at /offline (200)
// and 307-redirects /offline.html to it, which cache.addAll can't precache.
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE && k !== SHARE_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/**
 * Web Share Target. Android and ChromeOS POST the shared files straight at us,
 * as a navigation — so answering with the transfer page directly would leave
 * the user on a page that cannot be reloaded or bookmarked. Instead the files
 * are parked in a cache and the browser is sent to an ordinary GET, where the
 * page collects them.
 *
 * Every failure still redirects: landing on the transfer studio with nothing
 * selected is a small annoyance, an error page is a broken feature. The
 * fallback route at the same path does the same thing for the rare share that
 * arrives before this worker is in control.
 */
async function receiveShare(request) {
  let target = "/transfer";
  try {
    const form = await request.formData();
    const files = form
      .getAll("files")
      .filter((f) => f && typeof f === "object" && "size" in f);
    if (files.length > 0) {
      const cache = await caches.open(SHARE_CACHE);
      // Anything left from an earlier share was never collected; it must not
      // resurface behind the files being shared now.
      for (const key of await cache.keys()) await cache.delete(key);
      const meta = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const url = `/__shared/${i}`;
        const type = f.type || "application/octet-stream";
        await cache.put(
          url,
          new Response(f, { headers: { "Content-Type": type } }),
        );
        meta.push({
          url,
          name: f.name || `shared-${i + 1}`,
          type,
          size: f.size,
          lastModified: f.lastModified || Date.now(),
        });
      }
      await cache.put(
        SHARE_INDEX,
        new Response(JSON.stringify({ ts: Date.now(), files: meta }), {
          headers: { "Content-Type": "application/json" },
        }),
      );
      target = "/transfer?shared=1";
    }
  } catch (e) {
    // Out of quota, an unreadable file, a terminated worker: the page still
    // opens and the user can pick the file the ordinary way.
  }
  return Response.redirect(target, 303);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const shareUrl = new URL(req.url);
  if (
    req.method === "POST" &&
    shareUrl.origin === self.location.origin &&
    shareUrl.pathname === SHARE_ACTION
  ) {
    event.respondWith(receiveShare(req));
    return;
  }

  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // leave API + fonts alone
  // Virtual decrypted-media URLs belong to the streaming handler above.
  if (url.pathname.startsWith("/stream/")) return;

  // Navigations: always try the network so deploys are picked up; offline page
  // is the only fallback. HTML is never written to the cache.
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Content-hashed static assets: cache-first (the hash guarantees freshness).
  const isHashedAsset =
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:png|svg|ico|webp|jpg|jpeg|woff2?)$/.test(url.pathname);
  if (isHashedAsset) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req)
            .then((res) => {
              if (res.ok) {
                const copy = res.clone();
                caches.open(CACHE).then((c) => c.put(req, copy));
              }
              return res;
            })
            .catch(() => hit),
      ),
    );
  }
  // Everything else falls through to the default network handling.
});
