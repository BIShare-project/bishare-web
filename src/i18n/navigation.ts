import { createElement, type ComponentProps } from "react";
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware navigation helpers. Prefer these over next/link + next/navigation
 * inside the MARKETING ((site)) subtree so internal links carry the active
 * locale automatically under the "as-needed" prefix scheme (en stays
 * unprefixed, other locales gain their "/<locale>" prefix).
 *
 *   import { Link, redirect, usePathname, getPathname } from "@/i18n/navigation";
 */
const nav = createNavigation(routing);

export const { redirect, usePathname, useRouter, getPathname } = nav;

export type LinkProps = ComponentProps<typeof nav.Link>;

/**
 * `prefetch` defaults to false. In the App Router that means no prefetch at
 * all (not even on hover; see next/dist/client/app-dir/link.js): the RSC tree
 * is fetched on click. The marketing surface is 546 static pages whose
 * footer, related-guides block and in-copy links (70–80 internal links per
 * guide) would otherwise each fetch a full RSC tree as they scroll into
 * view; on a guide page that started with the 182 KB home tree from the
 * header logo. Pass `prefetch` explicitly on a link to opt back in.
 */
export function Link(props: LinkProps) {
  return createElement(nav.Link, { prefetch: false, ...props });
}
