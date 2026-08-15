"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Tap-to-zoom for article images. Blog diagrams are authored at 1200 px wide
 * with ~14 px labels, which is unreadable once the column shrinks to a phone —
 * so every image in `.blog-prose` opens full-screen on click, where it can be
 * pinch-zoomed and panned.
 *
 * Delegation rather than per-image wrappers: the images come from MDX, so
 * there is no component to wrap. One listener on the document handles them all
 * and keeps the article markup plain.
 */
export function ImageLightbox() {
  const [src, setSrc] = useState<string | null>(null);
  const [alt, setAlt] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef<Element | null>(null);

  const close = useCallback(() => setSrc(null), []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const img = (e.target as Element | null)?.closest?.(
        ".blog-prose img"
      ) as HTMLImageElement | null;
      if (!img) return;
      // Don't hijack an image that is itself a link.
      if (img.closest("a")) return;
      restoreFocus.current = document.activeElement;
      setSrc(img.currentSrc || img.src);
      setAlt(img.alt || "");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!src) {
      (restoreFocus.current as HTMLElement | null)?.focus?.();
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    // Lock the page behind the overlay so scrolling zooms the image, not the article.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [src, close]);

  if (!src) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt || "Expanded image"}
      onClick={close}
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-auto bg-background/95 p-4 backdrop-blur-sm sm:p-8"
    >
      <button
        ref={closeRef}
        type="button"
        onClick={close}
        aria-label="Close image"
        className="fixed right-4 top-4 z-10 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-lg transition-colors hover:bg-secondary"
      >
        Close
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="h-auto w-full max-w-[1200px] rounded-lg border border-border"
      />
    </div>
  );
}
