/** @jsxImportSource hono/jsx/dom */
import { type FC, useEffect, useState } from "hono/jsx/dom";

/** next/dynamic with ssr: false, in the browser: the loading view, then the part once its module has arrived. */
export default function dynamic<P>(load: () => Promise<FC<P>>, opts: { loading?: () => unknown } = {}): FC<P> {
  let ready: FC<P> | null = null;
  return (props: P) => {
    const [part, setPart] = useState<FC<P> | null>(ready);
    useEffect(() => {
      if (!part) void load().then((c) => setPart(() => (ready = c)));
    }, []);
    return (part ? part(props as P & { children?: never }) : (opts.loading?.() ?? null)) as ReturnType<FC>;
  };
}
