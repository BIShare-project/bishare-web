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
 * Landing pages with a route figure (drawn by tool/landing-figures.mjs). For
 * these, the page's own figure is the share image, so a link to
 * /transfer-photos-from-iphone-to-pc previews its own route figure instead of the
 * generic brand card. Keep in sync with FIGURES in that script.
 */
const ROUTE_FIGURES = new Set([
  "/airdrop-for-android", "/airdrop-not-working", "/encrypted-file-transfer",
  "/firefox-send-alternative", "/localsend-alternative", "/nearby-share-alternative",
  "/send-anywhere-alternative",
  "/send-files-without-internet",
  "/share-files-without-account", "/sharedrop-alternative", "/shareit-alternative",
  "/smash-alternative", "/transfer-files-between-computers",
  "/transfer-photos-from-iphone-to-pc",
  "/wormhole-alternative",
]);

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
    : ROUTE_FIGURES.has(path)
      ? { url: `/img${path}/route.jpg`, width: 1400, height: 700, alt: title }
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
