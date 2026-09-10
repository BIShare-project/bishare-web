/**
 * The page half of the Web Share Target. The service worker parks files the
 * OS shared with us in a cache (public/sw.js) and redirects here with
 * `?shared=1`; this reads them back as real File objects and empties the
 * cache, so the same share can never be imported twice.
 */
const SHARE_CACHE = "bishare-share-inbox";
const SHARE_INDEX = "/__shared/index";

/** Query flag the worker adds so the page knows to look. */
export const SHARED_PARAM = "shared";

interface SharedMeta {
  url: string;
  name: string;
  type: string;
  size: number;
  lastModified: number;
}

/**
 * Collects the shared files, then clears them. Returns an empty array when
 * there is nothing waiting, when the browser has no Cache API, or on any
 * failure — a share that cannot be read must never break the page it lands on.
 */
export async function takeSharedFiles(): Promise<File[]> {
  if (typeof caches === "undefined") return [];
  try {
    const cache = await caches.open(SHARE_CACHE);
    const indexRes = await cache.match(SHARE_INDEX);
    if (!indexRes) return [];
    const index = (await indexRes.json()) as { files?: SharedMeta[] };
    const out: File[] = [];
    for (const meta of index.files ?? []) {
      const res = await cache.match(meta.url);
      if (!res) continue;
      const blob = await res.blob();
      out.push(
        new File([blob], meta.name, {
          type: meta.type,
          lastModified: meta.lastModified,
        }),
      );
    }
    for (const key of await cache.keys()) await cache.delete(key);
    return out;
  } catch {
    return [];
  }
}
