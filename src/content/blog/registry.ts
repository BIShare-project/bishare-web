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
  {
    slug: "send-large-videos-from-android-to-mac",
    title: "5 Easy Ways to Send Large Videos from Android to Mac",
    metaTitle: "Send Large Videos from Android to Mac: 5 Easy Ways (2026)",
    description:
      "Android File Transfer is gone — here are 5 ways that actually move big videos from Android to a Mac in 2026: direct Wi-Fi, links, cloud, and more, full quality.",
    category: "transfer",
    tags: ["Android", "Mac", "Video transfer", "Android File Transfer"],
    keywords: [
      "send large videos from android to mac",
      "android file transfer mac not working",
      "transfer video from android to macbook",
      "android to mac wireless transfer",
      "does quick share work on mac",
      "google photos video compression",
    ],
    datePublished: "2026-08-15",
    dateModified: "2026-08-15",
    readMinutes: 13,
    hero: {
      src: "/blog/hero-android-mac.svg",
      alt: "Sending a large 4K video from an Android phone to a MacBook over Wi-Fi",
    },
    related: [
      "transfer-files-from-iphone-to-windows-without-cable",
      "share-files-between-ios-and-android",
      "send-10gb-files-online-free",
    ],
    faq: [
      {
        q: "Why did Android File Transfer stop working on my Mac?",
        a: "Google discontinued the official Android File Transfer app for macOS, and modern versions of macOS broke what remained. It relied on the old MTP protocol, which was always fragile with large files. In 2026 the reliable replacements are wireless transfer apps, browser links, or third-party MTP clients like OpenMTP.",
      },
      {
        q: "Does Quick Share work on a Mac?",
        a: "No. Google ships Quick Share for Windows, but there is no official Quick Share client for macOS. To move files from Android to a Mac you need a cross-platform tool — BIShare and LocalSend both discover a Mac on the same Wi-Fi and send directly.",
      },
      {
        q: "How do I transfer a video from Android to Mac without USB?",
        a: "Install a local Wi-Fi transfer app on both devices (BIShare is free, with native Android and macOS apps), put them on the same network, and send — the video streams phone-to-Mac at router speed. For a one-off with nothing installed, upload to a transfer link in the browser and open it on the Mac.",
      },
      {
        q: "Does Google Photos compress my videos?",
        a: "On the Storage saver setting, yes — videos are recompressed down to at most 1080p, and the original bitrate is gone for good. Choose Original quality (which spends your storage allowance) or use a direct transfer if you need the exact file, for example for editing.",
      },
      {
        q: "What's the fastest way to move a really big video file?",
        a: "Direct Wi-Fi transfer on the same network — the file makes one hop through your router instead of going up to a server and back down. On our test hardware that sustains roughly 40–50 MB/s, so even a 10 GB project file lands in a few minutes.",
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
  "send-large-videos-from-android-to-mac": () =>
    import("./send-large-videos-from-android-to-mac.mdx"),
};
