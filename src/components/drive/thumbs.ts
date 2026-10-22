"use client";

import { useEffect, useState } from "react";
import { openThumbnail } from "@/lib/vault/crypto";
import type { DriveClient } from "@/lib/vault/client";
import type { DriveObject } from "@/lib/vault/store";

// Thumbnails come sealed with each file's own key (VAULT-SPEC "Thumbnails"):
// asked for in batches, opened here, kept as object URLs for the session.
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
  try {
    const res = await ctx.client.downloads(
      batch.map((b) => b.o.id),
      { thumbs: true, blobs: false }
    );
    urls = new Map(res.items.filter((i) => i.thumbUrl).map((i) => [i.objectId, i.thumbUrl!]));
  } catch {
    // Each tile shows its icon instead.
  }
  await Promise.all(
    batch.map(async ({ o, resolve }) => {
      const url = urls.get(o.id);
      if (!url || !o.fileKey) return resolve(null);
      try {
        const sealed = new Uint8Array(await (await fetch(url)).arrayBuffer());
        const jpeg = await openThumbnail(o.fileKey, ctx.vaultId, o.id, sealed);
        resolve(URL.createObjectURL(new Blob([jpeg as Uint8Array<ArrayBuffer>], { type: "image/jpeg" })));
      } catch {
        resolve(null);
      }
    })
  );
}

function thumbFor(client: DriveClient, vaultId: string, o: DriveObject): Promise<string | null> {
  const key = `${o.id}:${o.seq}`;
  let p = cache.get(key);
  if (!p) {
    current = { client, vaultId };
    p = new Promise<string | null>((resolve) => {
      queue.push({ o, resolve });
      timer ??= setTimeout(() => void flush(), 30);
    });
    cache.set(key, p);
  }
  return p;
}

/** The opened thumbnail of [o] as an object URL, or null (none, or not yet). */
export function useThumb(client: DriveClient, vaultId: string, o: DriveObject | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!o || !o.hasThumb || o.kind !== "file") {
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
  }, [client, vaultId, o]);
  return url;
}
