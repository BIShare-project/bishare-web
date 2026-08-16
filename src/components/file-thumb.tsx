"use client";

import { useEffect, useState } from "react";
import { FileText, Film, Music, File as FileIcon, Image as ImageIcon } from "lucide-react";
import { previewKind } from "@/lib/preview-kind";

/**
 * The picture on a picked file's card.
 *
 * Images render themselves. Video gets a real frame pulled off the file — a
 * generic film icon tells you nothing about *which* clip you grabbed, which is
 * the whole question a thumbnail exists to answer. Everything else falls back to
 * a type glyph, which is the honest answer when there's nothing to show.
 *
 * All of it comes from the local File through an object URL: nothing is
 * uploaded or fetched to draw a thumbnail, and the URL is revoked on unmount.
 */

const ICONS = {
  video: Film,
  audio: Music,
  image: ImageIcon,
  pdf: FileText,
  other: FileIcon,
} as const;

/** Grab a frame a little way in — frame zero of a video is very often black. */
async function videoFrame(file: File): Promise<string | null> {
  const url = URL.createObjectURL(file);
  try {
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "metadata";
    v.src = url;
    await new Promise<void>((resolve, reject) => {
      const fail = () => reject(new Error("metadata"));
      v.addEventListener("loadeddata", () => resolve(), { once: true });
      v.addEventListener("error", fail, { once: true });
      setTimeout(fail, 8000);
    });
    v.currentTime = Math.min(1, (v.duration || 2) / 2);
    await new Promise<void>((resolve, reject) => {
      v.addEventListener("seeked", () => resolve(), { once: true });
      v.addEventListener("error", () => reject(new Error("seek")), { once: true });
      setTimeout(() => reject(new Error("seek timeout")), 8000);
    });
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 320 / Math.max(1, v.videoWidth));
    canvas.width = Math.max(1, Math.round(v.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(v.videoHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.7);
  } catch {
    return null; // codec the browser can't decode — the icon says enough
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function FileThumb({ file }: { file: File }) {
  const kind = previewKind(file.type || "");
  const [src, setSrc] = useState<string | null>(null);
  const Icon = ICONS[kind ?? "other"];

  useEffect(() => {
    let alive = true;
    let objectUrl: string | null = null;

    if (kind === "image") {
      objectUrl = URL.createObjectURL(file);
      setSrc(objectUrl);
    } else if (kind === "video") {
      void videoFrame(file).then((data) => {
        if (alive) setSrc(data);
      });
    }

    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file, kind]);

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" aria-hidden className="h-full w-full object-cover" />
    );
  }

  return (
    <span className="flex h-full w-full items-center justify-center text-muted-foreground">
      <Icon className="h-7 w-7" strokeWidth={1.6} />
    </span>
  );
}
