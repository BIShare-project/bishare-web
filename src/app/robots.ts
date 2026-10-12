import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/og";
import { routing } from "@/i18n/routing";
import { LINK_PREVIEW_BOTS } from "@/lib/preview-bots";

// Ephemeral flow links must never be indexed — in the default-locale (unprefixed)
// form AND in every localized ("/<locale>/…") form.
const EPHEMERAL = ["/share/", "/transfer/", "/request/", "/s/"];

export default function robots(): MetadataRoute.Robots {
  const disallow = EPHEMERAL.flatMap((p) => [
    p,
    ...routing.locales
      .filter((l) => l !== routing.defaultLocale)
      .map((l) => `/${l}${p}`),
  ]);

  // "?ref=" marks a link followed from inside the product (a transfer page's
  // "Send a file" leads to /transfer?ref=recv). The page is the same as without
  // it, in every locale, so crawling it is thirteen fetches of a duplicate.
  disallow.push("/*?ref=");

  return {
    rules: [
      // Link-preview fetchers may read receive pages so a shared link shows
      // its preview card; they index nothing (see lib/preview-bots).
      { userAgent: LINK_PREVIEW_BOTS, allow: "/" },
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
