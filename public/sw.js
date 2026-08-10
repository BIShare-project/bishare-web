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

const VERSION = "v1";
const CACHE = `bishare-static-${VERSION}`;
// Canonical clean URL — OpenNext serves public/offline.html at /offline (200)
// and 307-redirects /offline.html to it, which cache.addAll can't precache.
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // leave API + fonts alone

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
            .catch(() => hit)
      )
    );
  }
  // Everything else falls through to the default network handling.
});
