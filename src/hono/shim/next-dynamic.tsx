/** @jsxImportSource hono/jsx */
import type { FC } from "hono/jsx";

/** next/dynamic with ssr: false, at build time: the page holds the loading view until the browser loads the part. */
export default function dynamic<P>(_load: () => Promise<FC<P>>, opts: { loading?: () => unknown } = {}): FC<P> {
  return () => (opts.loading?.() ?? null) as ReturnType<FC>;
}
