/** @jsxImportSource hono/jsx */
import { Icon } from "./icon";

/**
 * A YouTube video that costs nothing until it is wanted: our own picture, and no request to Google before the click
 * (client/site.ts then puts the youtube-nocookie.com player in its place).
 */
export function YouTubeFacade({ id, title, playLabel, thumbnail, className = "" }: { id: string; title: string; playLabel: string; thumbnail: string; className?: string }) {
  return (
    <div class={`relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-card ${className}`.trim()}>
      <button type="button" data-video={id} data-title={title} aria-label={playLabel} class="group absolute inset-0 h-full w-full cursor-pointer">
        <img src={thumbnail} alt={title} width={1280} height={720} loading="lazy" decoding="async" class="absolute inset-0 h-full w-full object-cover" />
        <span class="absolute inset-0 bg-black/10 group-hover:bg-black/0" aria-hidden="true" />
        <span class="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent-blue text-white shadow-lg group-hover:scale-105 sm:h-20 sm:w-20" aria-hidden="true">
          <Icon name="Play" class="ml-1 h-7 w-7 fill-current sm:h-8 sm:w-8" />
        </span>
      </button>
    </div>
  );
}
