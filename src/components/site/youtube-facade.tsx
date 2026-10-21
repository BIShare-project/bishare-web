"use client";

import { useState } from "react";
import { Play } from "lucide-react";

/**
 * A YouTube video that costs nothing until it is wanted. Before the click the
 * page shows our own thumbnail (served from bishare.app): no request to Google,
 * no cookie, no third-party script, and nothing that competes with the page's
 * LCP. The click swaps in the youtube-nocookie.com player with autoplay, so the
 * person's own action is what loads YouTube. This keeps the site's promise of no
 * tracking cookies for everyone who doesn't press play.
 */
export function YouTubeFacade({
  id,
  title,
  playLabel,
  thumbnail,
  className,
}: {
  id: string;
  title: string;
  playLabel: string;
  thumbnail: string;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-card ${className ?? ""}`}
    >
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={playLabel}
          className="group absolute inset-0 h-full w-full cursor-pointer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnail}
            alt={title}
            width={1280}
            height={720}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <span className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/0" aria-hidden />
          <span
            className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent-blue text-white shadow-lg transition-transform group-hover:scale-105 sm:h-20 sm:w-20"
            aria-hidden
          >
            <Play className="ml-1 h-7 w-7 fill-current sm:h-8 sm:w-8" />
          </span>
        </button>
      )}
    </div>
  );
}
