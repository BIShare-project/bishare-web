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
  {
    slug: "share-files-between-ios-and-android",
    title: "How to Share Files Between iOS and Android Instantly",
    metaTitle: "Share Files Between iPhone and Android Instantly (2026)",
    description:
      "AirDrop can't reach Android and Quick Share can't reach iPhone. Four real situations, solved: same room, no installs, far apart, and no internet at all.",
    category: "transfer",
    tags: ["iPhone", "Android", "AirDrop", "Quick Share"],
    keywords: [
      "share files between iphone and android",
      "airdrop from iphone to android",
      "does quick share work on iphone",
      "send photos from iphone to android without losing quality",
      "transfer files ios to android without internet",
      "iphone android file sharing app",
    ],
    datePublished: "2026-08-18",
    dateModified: "2026-08-18",
    readMinutes: 13,
    hero: {
      src: "/blog/hero-ios-android.svg",
      alt: "An iPhone and an Android phone sharing files directly in both directions",
    },
    related: [
      "transfer-files-from-iphone-to-windows-without-cable",
      "send-large-videos-from-android-to-mac",
      "wireless-file-transfer-pc-mobile-guide",
    ],
    faq: [
      {
        q: "Can an iPhone AirDrop to an Android phone?",
        a: "No. AirDrop only works between Apple devices — it runs on Apple's private AWDL protocol, which Android cannot join. To send between an iPhone and an Android phone you need a cross-platform path: a transfer app installed on both, or a link/QR the other phone opens in its browser.",
      },
      {
        q: "Does Quick Share work on iPhone?",
        a: "No. Google's Quick Share connects Android phones, Chromebooks, and Windows PCs; there is no Quick Share app for iOS. The practical bridge between the two phone worlds is a third-party cross-platform app or a browser-based transfer link.",
      },
      {
        q: "How do I send photos from iPhone to Android without losing quality?",
        a: "Avoid messaging apps — WhatsApp and friends recompress images hard. Use a direct transfer app (originals arrive bit-for-bit, HEIC included) or a transfer link, and on arrival check the file size roughly matches the original. Note that Apple's own iCloud Shared Albums also downscale photos, so they aren't a full-quality path either.",
      },
      {
        q: "Can I share files between iPhone and Android with no internet?",
        a: "Yes, two ways. Turn one phone into a hotspot, join the other to it, and run a local transfer app over that private link — no data plan needed, full speed. For small files there's also screen-to-camera transfer (BIShare's QR Beam): the sender's screen plays animated QR codes and the receiver scans them, with no network of any kind.",
      },
      {
        q: "What's the best app to transfer files between iPhone and Android?",
        a: "Any app that runs natively on both platforms and sends device-to-device will beat cloud round-trips. BIShare is free with no account and covers the same-room case (direct Wi-Fi), the far-apart case (encrypted links), and the no-network case (hotspot + QR Beam); LocalSend is a good open-source pick for the same-network case only.",
      },
    ],
  },
  {
    slug: "wireless-file-transfer-pc-mobile-guide",
    title: "The Ultimate Guide to Wireless File Transfer Between PC and Mobile",
    metaTitle: "Wireless File Transfer Between PC and Mobile: Full Guide",
    description:
      "One playbook for every pairing — iPhone or Android to Windows, Mac, or Linux: how wireless transfer really works, which tool wins per pair, speed, and security.",
    category: "transfer",
    tags: ["Wireless transfer", "PC to mobile", "Guide", "Wi-Fi"],
    keywords: [
      "wireless file transfer between pc and mobile",
      "transfer files from phone to computer wirelessly",
      "pc to mobile file transfer without usb",
      "fastest way to transfer files from phone to pc",
      "transfer files over wifi",
      "phone to laptop file sharing",
    ],
    datePublished: "2026-08-21",
    dateModified: "2026-08-21",
    readMinutes: 15,
    hero: {
      src: "/blog/hero-wireless-guide.svg",
      alt: "A phone, laptop, desktop PC, and tablet linked wirelessly through one hub",
    },
    related: [
      "transfer-files-from-iphone-to-windows-without-cable",
      "send-large-videos-from-android-to-mac",
      "share-files-between-ios-and-android",
    ],
    faq: [
      {
        q: "What is the fastest way to transfer files between a phone and a PC wirelessly?",
        a: "A direct local transfer over your own Wi-Fi — the file makes one hop through the router instead of a round-trip through the internet. With a cross-platform app on both devices, real-world speeds run tens of megabytes per second on ordinary hardware, so multi-gigabyte transfers finish in minutes.",
      },
      {
        q: "Is wireless file transfer slower than USB?",
        a: "Not meaningfully, for most modern setups. USB 3 wins on paper, but real wired copies are often bottlenecked by phone storage and protocol overhead (MTP), while a direct Wi-Fi transfer on a decent 5 GHz network runs in the same tens-of-MB/s range — without hunting for a data-rated cable.",
      },
      {
        q: "Can I transfer files from phone to PC without the internet?",
        a: "Yes. A local Wi-Fi transfer needs a shared network, not an internet connection — your router can be offline. With no router at all, turn the phone into a hotspot, join the PC to it, and transfer over that private link.",
      },
      {
        q: "Do I need the cloud to move files between my phone and computer?",
        a: "No. Cloud drives are one option, but direct device-to-device transfer skips the upload entirely — faster, no storage quota, and private material never sits on a server. Cloud still makes sense for continuous sync across many devices.",
      },
      {
        q: "Is there one app that covers iPhone, Android, Windows, Mac, and Linux?",
        a: "Yes — that's exactly the gap cross-platform transfer apps fill. BIShare ships native apps for all five platforms plus a browser fallback, so one setup covers every pairing; the open-source LocalSend covers the same-network case across platforms too.",
      },
    ],
  },
  {
    slug: "webdav-server-android-mac",
    title: "How to Set Up a WebDAV Server to Connect Android with Mac",
    metaTitle: "Set Up a WebDAV Server: Connect Android to Mac (2026)",
    description:
      "A hands-on lab: serve a Mac folder over WebDAV in one command, mount it from Android, secure it properly — and an honest take on when WebDAV is overkill.",
    category: "transfer",
    tags: ["WebDAV", "Android", "Mac", "Self-hosted"],
    keywords: [
      "webdav server mac",
      "connect android to mac wirelessly",
      "android webdav client",
      "access mac files from android",
      "webdav vs smb",
      "rclone serve webdav",
    ],
    datePublished: "2026-08-24",
    dateModified: "2026-08-24",
    readMinutes: 14,
    hero: {
      src: "/blog/hero-webdav.svg",
      alt: "A Mac terminal serving a folder over WebDAV, mounted on an Android phone",
    },
    related: [
      "send-large-videos-from-android-to-mac",
      "wireless-file-transfer-pc-mobile-guide",
      "transfer-files-from-iphone-to-windows-without-cable",
    ],
    faq: [
      {
        q: "What is WebDAV, in plain terms?",
        a: "An extension of ordinary HTTP that adds folder semantics — list, upload, rename, delete — so a remote directory behaves like a mounted drive. Your Android file manager or Mac Finder connects to a WebDAV URL and browses it like a local folder.",
      },
      {
        q: "Does Android support WebDAV out of the box?",
        a: "Not in the stock Files app. You mount WebDAV through a third-party file manager — Solid Explorer, X-plore, and FolderSync are well-known clients — by adding a network location with the server's URL, username, and password.",
      },
      {
        q: "WebDAV vs SMB for Android to Mac — which is better?",
        a: "SMB is the Mac's native sharing protocol (System Settings → General → Sharing) and is usually faster on a LAN; WebDAV is plain HTTP, which makes it friendlier across networks, proxies, and the internet. On a home network, try SMB first; choose WebDAV when HTTP's reach matters.",
      },
      {
        q: "Is a WebDAV server safe to expose to the internet?",
        a: "Not as plain HTTP with Basic auth — credentials and files travel readable. If you need remote access, put it behind HTTPS, or better, reach it over a private overlay like Tailscale so the server never faces the open internet at all.",
      },
      {
        q: "Do I need all this just to move files between Android and a Mac?",
        a: "No — and that's the honest heart of it. WebDAV shines when you want a persistent mounted folder. If the goal is simply sending files back and forth, a direct transfer app connects the two devices in about two minutes with zero server administration.",
      },
    ],
  },
  {
    slug: "send-10gb-files-online-free",
    title: "How to Send 10GB Files Online for Free Without Compression",
    metaTitle: "Send 10GB Files Online Free — No Compression (2026)",
    description:
      "We ran one 10 GB file through email, chat apps, cloud drives, and transfer sites. Most walls it hit, the paths that survived, and the free way that keeps full quality.",
    category: "large-files",
    tags: ["Large files", "10GB", "No compression", "Free transfer"],
    keywords: [
      "send 10gb files online free",
      "send large files without compression",
      "how to send 10gb video",
      "file size limit email",
      "wetransfer alternative 10gb free",
      "send large files free no account",
    ],
    datePublished: "2026-08-27",
    dateModified: "2026-08-27",
    readMinutes: 13,
    hero: {
      src: "/blog/hero-10gb.svg",
      alt: "A 10 GB file passing intact through the size limits of email, chat, and free transfer tiers",
    },
    related: [
      "send-large-videos-from-android-to-mac",
      "wireless-file-transfer-pc-mobile-guide",
      "wetransfer-alternatives-large-folders",
    ],
    faq: [
      {
        q: "What is the largest file I can send online for free?",
        a: "It varies wildly by service: email stops around 25 MB, chat apps at 2 GB or so, and most transfer sites gate a couple of gigabytes behind their free tier. BIShare's free tier carries 10 GB per file with end-to-end encryption and resumable uploads; a few services go higher on size but without the encryption or resume.",
      },
      {
        q: "Does zipping a large video make it smaller?",
        a: "Barely. Video, photos, and music are already compressed formats, so a ZIP typically shaves only a percent or two off — while adding an extra unpacking step for the recipient. Zipping earns its keep for bundling many files into one, not for shrinking media.",
      },
      {
        q: "Why do transfer sites limit file sizes on free plans?",
        a: "Pricing, not physics. Storing and serving big files costs the provider bandwidth and disk, so the size cap is where they place the paywall. Architectures that stream uploads straight to storage keep those costs small — which is how a 10 GB free tier can exist at all.",
      },
      {
        q: "What is the fastest way to send a 10 GB file to someone?",
        a: "If you're on the same network, skip the internet entirely: a direct device-to-device transfer moves 10 GB in a few minutes at router speed. Across the internet, upload time is set by your uplink — roughly 70 minutes at 20 Mbit/s, 14 minutes at 100 Mbit/s — so plug into Ethernet or sit near the router before you start.",
      },
      {
        q: "Is it safe to send big files through a transfer site?",
        a: "Depends on the site's encryption model. With end-to-end encryption the relay only ever stores ciphertext it cannot read — BIShare encrypts in your browser and the key never reaches the server. With plain TLS-only services, the operator can technically access your file, so match the tool to the file's sensitivity.",
      },
    ],
  },
  {
    slug: "wetransfer-alternatives-large-folders",
    title: "Fast Alternatives to WeTransfer for Sending Large Folders",
    metaTitle: "WeTransfer Alternatives for Large Folders: Judged (2026)",
    description:
      "Folders break transfer tools differently than files do. Five judging criteria — folder fidelity, ceilings, speed, privacy, receiver experience — applied to every real alternative.",
    category: "large-files",
    tags: ["WeTransfer alternative", "Folders", "Large files", "Comparison"],
    keywords: [
      "wetransfer alternatives",
      "send large folders online",
      "transfer folder online free",
      "send folder without zipping",
      "wetransfer free limit",
      "share project folder with client",
    ],
    datePublished: "2026-08-30",
    dateModified: "2026-08-30",
    readMinutes: 13,
    hero: {
      src: "/blog/hero-folders.svg",
      alt: "A project folder tree of 495 files arriving intact as 18.6 GB on the other side",
    },
    related: [
      "send-10gb-files-online-free",
      "wireless-file-transfer-pc-mobile-guide",
      "share-high-res-photos-without-losing-quality",
    ],
    faq: [
      {
        q: "Can I send a folder online without zipping it myself?",
        a: "Mostly yes — good transfer tools accept a folder and bundle it for you (usually into a zip the recipient unpacks), and cloud drives share folders natively with the structure browsable. What varies is whether subfolder structure survives and whether the recipient gets one clean download or hundreds of separate ones.",
      },
      {
        q: "What is WeTransfer's free limit?",
        a: "The free tier caps total transfer size at a couple of gigabytes — enough for documents and a short video, far short of a real project folder. Larger sends are the paid tier's pitch, which is exactly why the alternatives in this guide exist.",
      },
      {
        q: "What's the best free way to send a 20 GB folder?",
        a: "Split it into logical batches under your tool's per-transfer ceiling and send each as one bundle — with BIShare that's 10 GB per transfer, free, encrypted, and resumable. If both machines share a network, skip the internet entirely: a direct local transfer moves 20 GB in minutes at router speed.",
      },
      {
        q: "How do I keep the folder structure when sending?",
        a: "Send the folder as one archive (the tool's automatic zip or your own) so subfolders unpack exactly as organized, or use a cloud drive's folder share where the tree stays browsable. Sending files loose flattens the structure — fine for five photos, chaos for a project.",
      },
      {
        q: "What's the fastest way to send a project folder to a client?",
        a: "Across the internet: bundle the folder, use a resumable encrypted transfer link, and send the link with a one-line manifest (file count, total size, expiry). Same office or network: a direct device-to-device transfer beats any upload — the folder lands before the email explaining it would have.",
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
  "share-files-between-ios-and-android": () =>
    import("./share-files-between-ios-and-android.mdx"),
  "wireless-file-transfer-pc-mobile-guide": () =>
    import("./wireless-file-transfer-pc-mobile-guide.mdx"),
  "webdav-server-android-mac": () =>
    import("./webdav-server-android-mac.mdx"),
  "send-10gb-files-online-free": () =>
    import("./send-10gb-files-online-free.mdx"),
  "wetransfer-alternatives-large-folders": () =>
    import("./wetransfer-alternatives-large-folders.mdx"),
};
