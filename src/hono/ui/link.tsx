/** @jsxImportSource hono/jsx */
import type { PropsWithChildren } from "hono/jsx";
import { localizedPath } from "@/i18n/metadata";
import { pageContext } from "../page-context";

/** A path of the site in the page's language; anything else (other sites, #anchors, mailto:) unchanged. */
export function siteHref(href: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const [, path, rest] = /^([^?#]*)(.*)$/.exec(href)!;
  return localizedPath(pageContext().locale, path!) + rest;
}

type Props = PropsWithChildren<{ href: string; class?: string; "aria-label"?: string; id?: string; title?: string }>;

export function Link({ href, children, ...rest }: Props) {
  return (
    <a href={siteHref(href)} {...rest}>
      {children}
    </a>
  );
}
