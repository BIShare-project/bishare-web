import { SITE_URL } from "@/lib/og";

/**
 * BreadcrumbList JSON-LD for a landing page.
 *
 * The blog template has emitted this for a while; the landing pages — which are
 * the ones actually earning impressions — never did. It doesn't move ranking on
 * its own, but Google replaces the bare URL in the result with a breadcrumb
 * trail, and on a page whose snippet already converts at 80% CTR, anything that
 * makes the result look less like a stray URL is worth the twenty lines.
 *
 * English labels on purpose: the trail describes the site's structure, and the
 * canonical for every locale of a landing page is its own localized URL, so the
 * position/URL pair is what matters here rather than the wording.
 */
export function breadcrumbLd(path: string, name: string) {
  const url = `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "BIShare", item: SITE_URL },
      { "@type": "ListItem", position: 2, name, item: url },
    ],
  };
}
