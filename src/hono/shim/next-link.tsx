/** @jsxImportSource hono/jsx */
import type { PropsWithChildren } from "hono/jsx";

/** next/link: the address as it is, without the page's language (the blog is English only). */
export default function Link({ href, className, children }: PropsWithChildren<{ href: string; className?: string }>) {
  return (
    <a href={href} class={className}>
      {children}
    </a>
  );
}
