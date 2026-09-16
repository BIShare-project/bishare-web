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
  heroLocale?: string
): Pick<Metadata, "openGraph" | "twitter"> {
  const image = heroLocale
    ? { url: `/img${path}/hero.${heroLocale}.jpg`, width: 1200, height: 630, alt: title }
    : OG_IMAGE;
  return {
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${path}`,
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
