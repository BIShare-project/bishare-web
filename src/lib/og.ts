import type { Metadata } from "next";

export const SITE_URL = "https://bishare.app";
export const SITE_NAME = "BIShare";

const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "BIShare — send any file to any device, instantly and end-to-end encrypted",
};

/**
 * A page's own absolute URL: the English page has no prefix, every other
 * locale carries one. Structured data uses it so a translated page names
 * itself rather than its English sibling.
 */
export function pageUrl(path: string, locale?: string): string {
  const prefix = locale && locale !== "en" ? `/${locale}` : "";
  return `${SITE_URL}${prefix}${prefix && path === "/" ? "" : path}`;
}

/**
 * Shared OpenGraph builder so every page inherits the brand og-image and
 * site name without re-declaring them (review fix #19). Spread the result
 * into a page's `metadata`:
 *
 * ```ts
 * export const metadata: Metadata = {
 *   title: "Features",
 *   description: "...",
 *   ...sharedOpenGraph("Features — BIShare", "...", "/features"),
 * };
 * ```
 */
export function sharedOpenGraph(
  title: string,
  description: string,
  path = "/",
  /**
   * Pages with their own art (tool/landing-art.mjs) pass the locale, and the
   * share image becomes that locale's hero: /img<path>/hero.<locale>.jpg.
   */
  heroLocale?: string,
  /**
   * Locale of the page, for pages without their own art. og:url then names
   * the localized URL, the same one the canonical link does, instead of
   * sending every language's share to the English page.
   */
  locale?: string
): Pick<Metadata, "openGraph" | "twitter"> {
  const image = heroLocale
    ? { url: `/img${path}/hero.${heroLocale}.jpg`, width: 1200, height: 630, alt: title }
    : OG_IMAGE;
  const urlLocale = locale ?? heroLocale;
  const prefix = urlLocale && urlLocale !== "en" ? `/${urlLocale}` : "";
  const url = `${SITE_URL}${prefix}${prefix && path === "/" ? "" : path}`;
  return {
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: SITE_NAME,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: image.url, alt: image.alt }],
    },
  };
}
