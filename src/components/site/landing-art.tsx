/**
 * A figure drawn for one landing page by tool/landing-art.mjs.
 *
 * The art is rendered once per locale (text inside the image is translated),
 * so the file name carries the locale: /img/<slug>/<name>.<locale>.webp. The
 * alt text doubles as the visible caption and comes from the page's own
 * namespace ("art.<name>.alt"), the same strings the generator drew from.
 *
 * Tapping opens it full-screen through <ImageLightbox> (figure[data-zoom]),
 * because a 1200 px diagram is hard to read in a phone-width column.
 */
export function LandingArt({
  slug,
  name,
  locale,
  alt,
  width,
  height,
  zoomHint,
  eager = false,
  className = "",
}: {
  /** Page path, e.g. "/share-files-mac-to-windows". */
  slug: string;
  name: string;
  locale: string;
  alt: string;
  width: number;
  height: number;
  /** Short localized "tap to enlarge" shown after the caption on phones. */
  zoomHint?: string;
  eager?: boolean;
  className?: string;
}) {
  return (
    <figure
      data-zoom
      className={`overflow-hidden rounded-xl border border-border bg-[#070d1d] ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/img${slug}/${name}.${locale}.webp`}
        alt={alt}
        width={width}
        height={height}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className="h-auto w-full cursor-zoom-in"
      />
      <figcaption className="border-t border-border bg-card px-4 py-3 text-[13px] leading-relaxed text-muted-foreground">
        {alt}
        {zoomHint ? (
          <span className="mt-1 block text-xs text-muted-foreground/80 sm:hidden">{zoomHint}</span>
        ) : null}
      </figcaption>
    </figure>
  );
}
