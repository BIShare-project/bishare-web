"use client";

import { useEffect, useState } from "react";
import { openThumbnail } from "@/lib/vault/crypto";
import type { DriveClient } from "@/lib/vault/client";
import type { DriveObject } from "@/lib/vault/store";

// Thumbnails come sealed with each file's own key (VAULT-SPEC "Thumbnails"):
// asked for in batches when a tile comes near the screen, opened here, kept as
// object URLs. The most recently used MAX_KEPT stay; older ones are freed, and
// one that failed to load is asked for again next time (audit W7).
const MAX_KEPT = 1500;
const cache = new Map<string, Promise<string | null>>();
let queue: { o: DriveObject; resolve: (u: string | null) => void }[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let current: { client: DriveClient; vaultId: string } | null = null;

async function flush(): Promise<void> {
  timer = null;
  const batch = queue.splice(0, 100);
  if (queue.length) timer = setTimeout(() => void flush(), 0);
  const ctx = current;
  if (!ctx || batch.length === 0) {
    for (const b of batch) b.resolve(null);
    return;
  }
  let urls = new Map<string, string>();
  let failed = false;
  try {
    const res = await ctx.client.downloads(
      batch.map((b) => b.o.id),
      { thumbs: true, blobs: false }
    );
    urls = new Map(res.items.filter((i) => i.thumbUrl).map((i) => [i.objectId, i.thumbUrl!]));
  } catch {
    // Each tile shows its icon instead, and asks again when it is drawn next.
    failed = true;
  }
  await Promise.all(
    batch.map(async ({ o, resolve }) => {
      const url = urls.get(o.id);
      if (!url || !o.fileKey) {
        if (failed) cache.delete(keyOf(o));
        return resolve(null);
      }
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`thumb ${res.status}`);
        const jpeg = await openThumbnail(o.fileKey, ctx.vaultId, o.id, new Uint8Array(await res.arrayBuffer()));
        resolve(URL.createObjectURL(new Blob([jpeg as Uint8Array<ArrayBuffer>], { type: "image/jpeg" })));
      } catch {
        cache.delete(keyOf(o));
        resolve(null);
      }
    })
  );
}

const keyOf = (o: DriveObject) => `${o.id}:${o.seq}`;

/** Frees the oldest thumbnails past MAX_KEPT. */
function trim(): void {
  for (const [key, p] of cache) {
    if (cache.size <= MAX_KEPT) break;
    cache.delete(key);
    void p.then((u) => u && URL.revokeObjectURL(u));
  }
}

/** Every thumbnail goes, with the client it was asked with (on lock and sign-out). */
export function forgetThumbs(): void {
  for (const p of cache.values()) void p.then((u) => u && URL.revokeObjectURL(u));
  cache.clear();
  for (const b of queue) b.resolve(null);
  queue = [];
  current = null;
}

function thumbFor(client: DriveClient, vaultId: string, o: DriveObject): Promise<string | null> {
  const key = keyOf(o);
  let p = cache.get(key);
  if (p) {
    // Used again: it moves to the young end.
    cache.delete(key);
    cache.set(key, p);
    return p;
  }
  current = { client, vaultId };
  p = new Promise<string | null>((resolve) => {
    queue.push({ o, resolve });
    timer ??= setTimeout(() => void flush(), 30);
  });
  cache.set(key, p);
  trim();
  return p;
}

/** True once [el] comes within a screen or so of the viewport; it stays true. */
export function useNear(el: Element | null): boolean {
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (!el || near) return;
    if (typeof IntersectionObserver === "undefined") return setNear(true);
    const seen = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setNear(true), { rootMargin: "800px 0px" });
    seen.observe(el);
    return () => seen.disconnect();
  }, [el, near]);
  return near;
}

/**
 * The opened thumbnail of [o] as an object URL, or null (none, or not yet).
 * Nothing is asked for while [wanted] is false; a new [attempt] asks again
 * (an image whose URL was freed while it was off screen).
 */
export function useThumb(client: DriveClient, vaultId: string, o: DriveObject | undefined, wanted = true, attempt = 0): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!o || !o.hasThumb || o.kind !== "file" || !wanted) {
      setUrl(null);
      return;
    }
    let live = true;
    void thumbFor(client, vaultId, o).then((u) => {
      if (live) setUrl(u);
    });
    return () => {
      live = false;
    };
  }, [client, vaultId, o, wanted, attempt]);
  return url;
}
