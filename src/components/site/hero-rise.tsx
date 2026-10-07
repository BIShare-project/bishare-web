import type { CSSProperties, ReactNode } from "react";

/**
 * Above-the-fold entrance for the block that holds a page's <h1>. CSS only
 * (`.hero-rise` in site.css: movement, no opacity), so it renders visible on
 * the server and the heading is a Largest Contentful Paint candidate from the
 * first paint. FadeUp / RevealBlur start at opacity 0 and wait for hydration,
 * which pushed LCP back by the time the JavaScript took to arrive; keep those
 * for content further down the page.
 */
export function HeroRise({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  /** Seconds, for staggering a second block under the first. */
  delay?: number;
}) {
  return (
    <div
      className={className ? `hero-rise ${className}` : "hero-rise"}
      style={{ "--rise-delay": `${delay}s` } as CSSProperties}
    >
      {children}
    </div>
  );
}
