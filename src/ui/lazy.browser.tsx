import { type FC, useEffect, useState } from "@/jsx";

/** The loading view, then the part once its module has arrived. */
export default function lazy<P>(load: () => Promise<FC<P>>, opts: { ssr?: false; loading?: () => unknown } = {}): FC<P> {
  let ready: FC<P> | null = null;
  return (props: P) => {
    const [part, setPart] = useState<FC<P> | null>(ready);
    useEffect(() => {
      if (!part) void load().then((c) => setPart(() => (ready = c)));
    }, []);
    return (part ? part(props as P & { children?: never }) : (opts.loading?.() ?? null)) as ReturnType<FC>;
  };
}
