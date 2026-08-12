import type { ComponentType } from "react";

/**
 * The blog's single source of truth. Every published article registers its
 * metadata here — the index page, article page, JSON-LD, RSS feed, and
 * sitemap all read THIS, so nothing drifts. Articles are .mdx files in this
 * folder, imported as components via the map at the bottom.
 *
 * Editorial process (owner's call): articles ship ONE AT A TIME, each with
 * full SEO attention — never bulk-generated. The planned queue lives in
 * BACKLOG.md.
 */

export type BlogCategory = "transfer" | "large-files" | "security" | "apps";

export const CATEGORY_LABEL: Record<BlogCategory, string> = {
  transfer: "Cross-Platform Transfer",
  "large-files": "Large Files & Productivity",
  security: "Security & Privacy",
  apps: "Apps & Technology",
};

export interface BlogFaq {
  q: string;
  a: string;
}

export interface BlogPost {
  slug: string;
  /** On-page H1. */
  title: string;
  /** <title> — keyword-front, ≤60 chars. */
  metaTitle: string;
  /** Meta description, ~150–160 chars. */
  description: string;
  category: BlogCategory;
  tags: string[];
  /** Primary + derived keywords this article targets (used in copy, not meta). */
  keywords: string[];
  datePublished: string; // ISO date
  dateModified: string; // ISO date
  readMinutes: number;
  hero: { src: string; alt: string };
  /** Related article slugs — filtered to published at render time. */
  related: string[];
  /** On-page FAQ — rendered under the article AND emitted as FAQPage JSON-LD. */
  faq: BlogFaq[];
}

export const POSTS: BlogPost[] = [
  {
    slug: "transfer-files-from-iphone-to-windows-without-cable",
    title: "How to Transfer Files from iPhone to Windows PC Without Cable",
    metaTitle: "Transfer Files from iPhone to Windows Without Cable (2026)",
    description:
      "Six wireless ways to move photos, videos, and documents from an iPhone to a Windows PC — no cable, no iTunes: local Wi-Fi transfer, links, cloud, and more.",
    category: "transfer",
    tags: ["iPhone", "Windows", "Wireless transfer", "No iTunes"],
    keywords: [
      "transfer files from iphone to windows",
      "iphone to windows file transfer without itunes",
      "send files from iphone to pc wirelessly",
      "airdrop to windows",
      "move photos from iphone to windows 11",
      "iphone to pc without cable",
    ],
    datePublished: "2026-08-12",
    dateModified: "2026-08-12",
    readMinutes: 14,
    hero: {
      src: "/blog/hero-iphone-windows.svg",
      alt: "Wireless file transfer from an iPhone to a Windows PC — no cable",
    },
    related: [
      "send-large-videos-from-android-to-mac",
      "share-files-between-ios-and-android",
      "wireless-file-transfer-pc-mobile-guide",
    ],
    faq: [
      {
        q: "Can I transfer files from iPhone to Windows without iTunes?",
        a: "Yes. iTunes is only needed for cable sync. Wireless options — a local Wi-Fi transfer app like BIShare, iCloud for Windows, Microsoft's Phone Link, cloud drives, or a browser share link — all move files without iTunes ever being installed.",
      },
      {
        q: "What is the fastest way to send files from iPhone to PC wirelessly?",
        a: "A direct local Wi-Fi transfer is fastest, because the file moves straight from the phone to the PC over your router at local network speed instead of uploading to a server first. With BIShare, a multi-gigabyte video typically arrives in a couple of minutes on ordinary Wi-Fi.",
      },
      {
        q: "Does AirDrop work on Windows?",
        a: "No — AirDrop only works between Apple devices. To get an AirDrop-like experience on a Windows PC you need a cross-platform app; BIShare discovers your PC on the same Wi-Fi and sends device-to-device, end-to-end encrypted, which is the same idea AirDrop uses.",
      },
      {
        q: "How do I move large videos from iPhone to PC without losing quality?",
        a: "Avoid channels that recompress media — messaging apps and email shrink videos. A direct transfer (local Wi-Fi app or cable) or a cloud drive set to original quality preserves the exact file. BIShare always sends the original bytes, so a 4K video arrives bit-for-bit identical.",
      },
      {
        q: "Why doesn't my PC see my iPhone on the same Wi-Fi?",
        a: "Usually one of three things: the devices are on different bands or networks (guest vs main), the router has AP/client isolation enabled (common on public Wi-Fi), or the Windows firewall is blocking discovery. Put both on the same network, or fall back to a link transfer, which works on any network.",
      },
    ],
  },
];

/**
 * Scheduling: articles carry a future `datePublished` and every surface
 * (index, article page, RSS, sitemap) filters through these helpers — pages
 * are SSR'd on Workers, so a post appears BY ITSELF the day its date arrives,
 * no redeploy needed. Cadence per owner: one new article every 3 days.
 */
const todayUtc = () => new Date().toISOString().slice(0, 10);

export function publishedPosts(): BlogPost[] {
  const now = todayUtc();
  return POSTS.filter((p) => p.datePublished <= now);
}

export const publishedSlugs = (): Set<string> =>
  new Set(publishedPosts().map((p) => p.slug));

/** Only returns a post whose publish date has arrived. */
export function getPost(slug: string): BlogPost | undefined {
  const now = todayUtc();
  return POSTS.find((p) => p.slug === slug && p.datePublished <= now);
}

/** slug → lazy MDX component. Every entry in POSTS must have one. */
export const ARTICLE_COMPONENTS: Record<
  string,
  () => Promise<{ default: ComponentType }>
> = {
  "transfer-files-from-iphone-to-windows-without-cable": () =>
    import("./transfer-files-from-iphone-to-windows-without-cable.mdx"),
};
