import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/og";
import { routing } from "@/i18n/routing";

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

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
