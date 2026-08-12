import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/og";
import { routing } from "@/i18n/routing";
import { localizedPath } from "@/i18n/metadata";
import { publishedPosts } from "@/content/blog/registry";

const ROUTES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/download", priority: 0.9, changeFrequency: "weekly" },
  { path: "/best-file-sharing-app", priority: 0.95, changeFrequency: "weekly" },
  { path: "/features", priority: 0.9, changeFrequency: "monthly" },
  { path: "/localsend-alternative", priority: 0.9, changeFrequency: "monthly" },
  { path: "/airdrop-for-android", priority: 0.9, changeFrequency: "monthly" },
  { path: "/airdrop-for-windows", priority: 0.9, changeFrequency: "monthly" },
  { path: "/airdrop-alternative", priority: 0.9, changeFrequency: "monthly" },
  { path: "/send-files-iphone-to-android", priority: 0.9, changeFrequency: "monthly" },
  { path: "/send-files-android-to-iphone", priority: 0.9, changeFrequency: "monthly" },
  { path: "/transfer-files-pc-to-phone", priority: 0.9, changeFrequency: "monthly" },
  { path: "/transfer-files-phone-to-pc", priority: 0.9, changeFrequency: "monthly" },
  { path: "/share-files-mac-to-windows", priority: 0.9, changeFrequency: "monthly" },
  { path: "/send-large-files", priority: 0.9, changeFrequency: "monthly" },
  { path: "/wetransfer-alternative", priority: 0.9, changeFrequency: "monthly" },
  { path: "/snapdrop-alternative", priority: 0.9, changeFrequency: "monthly" },
  { path: "/sharedrop-alternative", priority: 0.9, changeFrequency: "monthly" },
  { path: "/nearby-share-alternative", priority: 0.9, changeFrequency: "monthly" },
  { path: "/shareit-alternative", priority: 0.9, changeFrequency: "monthly" },
  { path: "/firefox-send-alternative", priority: 0.9, changeFrequency: "monthly" },
  { path: "/encrypted-file-transfer", priority: 0.9, changeFrequency: "monthly" },
  { path: "/send-anywhere-alternative", priority: 0.9, changeFrequency: "monthly" },
  { path: "/share-files-without-account", priority: 0.9, changeFrequency: "monthly" },
  { path: "/smash-alternative", priority: 0.9, changeFrequency: "monthly" },
  { path: "/wormhole-alternative", priority: 0.9, changeFrequency: "monthly" },
  { path: "/send-files-without-internet", priority: 0.9, changeFrequency: "monthly" },
  { path: "/how-it-works", priority: 0.9, changeFrequency: "monthly" },
  { path: "/security", priority: 0.8, changeFrequency: "monthly" },
  { path: "/transfer", priority: 0.8, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/philosophy", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.4, changeFrequency: "yearly" },
];

function absolute(locale: string, path: string): string {
  const p = localizedPath(locale, path);
  return `${SITE_URL}${p === "/" ? "" : p}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  // Blog: English-only editorial content — one URL per entry, no locale
  // alternates (every locale URL canonicalizes to the unprefixed path).
  const blogEntries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/blog`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...publishedPosts().map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: new Date(p.dateModified),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  return blogEntries.concat(ROUTES.flatMap(({ path, priority, changeFrequency }) => {
    // hreflang alternates: every locale variant of this route.
    const languages: Record<string, string> = {};
    for (const locale of routing.locales) {
      languages[locale] = absolute(locale, path);
    }
    // Match the <head> hreflang set — x-default → the unprefixed default locale.
    languages["x-default"] = absolute(routing.defaultLocale, path);

    // One <url> per locale, each carrying the full language alternate map.
    return routing.locales.map((locale) => ({
      url: absolute(locale, path),
      lastModified,
      changeFrequency,
      priority,
      alternates: { languages },
    }));
  }));
}
