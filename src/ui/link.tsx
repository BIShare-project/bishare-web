import type { PropsWithChildren } from "@/jsx";
import { localizedPath } from "@/i18n/metadata";
import { pageLocale, pagePath } from "@/i18n/page-locale";

/** A path of the site in the page's language; anything else (other sites, #anchors, mailto:) unchanged. */
export function siteHref(href: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const [, path, rest] = /^([^?#]*)(.*)$/.exec(href)!;
  return localizedPath(pageLocale(), path!) + rest;
}

type Props = PropsWithChildren<{ href: string; class?: string; className?: string; prefetch?: boolean; onClick?: (e: Event) => void; "aria-label"?: string; id?: string; title?: string }>;

export function Link({ href, children, prefetch: _prefetch, ...rest }: Props) {
  return (
    <a href={siteHref(href)} {...rest}>
      {children}
    </a>
  );
}

export const getPathname = ({ href, locale }: { href: string; locale: string }) => localizedPath(locale, href);
export const usePathname = pagePath;
