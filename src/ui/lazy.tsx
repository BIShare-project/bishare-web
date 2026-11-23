import type { FC } from "@/jsx";

/** A part only the browser loads (lazy.browser.tsx): the page holds its loading view. */
export default function lazy<P>(_load: () => Promise<FC<P>>, opts: { ssr?: false; loading?: () => unknown } = {}): FC<P> {
  return () => opts.loading?.() ?? null;
}
