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
  {
    slug: "share-high-res-photos-without-losing-quality",
    title: "How to Share High-Res Photos Locally Without Losing Quality",
    metaTitle: "Share High-Res Photos Without Losing Quality (2026)",
    description:
      "Chat apps shrink your 48 MP photos to mush. A forensic look at where quality dies — plus a 60-second audit and the local-first workflow that keeps every pixel.",
    category: "large-files",
    tags: ["Photos", "Full quality", "HEIC", "No compression"],
    keywords: [
      "share high res photos without losing quality",
      "send photos without compression",
      "does whatsapp compress photos",
      "share photos full quality",
      "send raw photos to client",
      "heic vs jpeg quality",
    ],
    datePublished: "2026-09-02",
    dateModified: "2026-09-02",
    readMinutes: 13,
    hero: {
      src: "/blog/hero-photos.svg",
      alt: "The same 48 MP photo taking two journeys — mangled by a chat app, delivered bit-for-bit by local transfer",
    },
    related: [
      "wetransfer-alternatives-large-folders",
      "share-files-between-ios-and-android",
      "send-large-videos-from-android-to-mac",
    ],
    faq: [
      {
        q: "Does WhatsApp reduce photo quality?",
        a: "Yes — anything sent through the photo lane is downscaled to roughly two thousand pixels on the long edge, re-encoded as a heavier-compressed JPEG, and stripped of metadata; the HD option raises the resolution but still re-encodes. The escape hatch is sending the photo as a document (attach → Document), which delivers the original file untouched.",
      },
      {
        q: "How do I send photos in full quality without an app compressing them?",
        a: "Use a channel that moves photos as files rather than as pictures: a direct local Wi-Fi transfer between the two devices, a cloud drive (not a photo service on a saver setting), an email attachment at Actual Size, or an encrypted transfer link. A quick self-test tells you if a channel qualifies — send a photo to yourself and compare pixel dimensions and file size against the original.",
      },
      {
        q: "Do iCloud Shared Albums keep full resolution?",
        a: "No. Apple documents that Shared Album photos are reduced to at most 2048 pixels on the long edge — fine for browsing on a phone, far below what printing or cropping needs. Treat shared albums as a viewing window and keep the full-resolution originals delivered through a file-faithful channel.",
      },
      {
        q: "What is the best way to share RAW photos with a client?",
        a: "RAW files only survive file-faithful channels: a direct local transfer if you share a network, otherwise a cloud drive folder or an encrypted transfer link. Never a chat app's photo lane, which flattens RAW to a JPEG preview. If your edits live in sidecar files, send the whole folder so every RAW travels with its .xmp.",
      },
      {
        q: "How can I tell if a photo lost quality when it was sent?",
        a: "Compare three numbers between the original and the received copy: pixel dimensions (a drop means downscaling), file size (an order-of-magnitude drop at the same dimensions means re-encoding), and the capture date in the photo's info panel (missing means metadata was stripped). For certainty, matching SHA-256 checksums prove the copies are bit-for-bit identical.",
      },
    ],
  },
  {
    slug: "send-massive-video-files-to-clients",
    title: "The Best Ways to Send Massive Video Files to Your Clients",
    metaTitle: "Send Massive Video Files to Clients: The Playbook (2026)",
    description:
      "A delivery lifecycle for working editors and filmmakers: agree the pipeline early, export day, the handoff, the revision loop, and the final archive — massive files, zero drama.",
    category: "large-files",
    tags: ["Video delivery", "Clients", "Freelancers", "Large files"],
    keywords: [
      "send large video files to clients",
      "how to send video files to clients",
      "deliver video to client online",
      "best way to send 50gb video",
      "send raw footage to editor",
      "video delivery workflow freelance",
    ],
    datePublished: "2026-09-05",
    dateModified: "2026-09-05",
    readMinutes: 14,
    hero: {
      src: "/blog/hero-client-video.svg",
      alt: "A 48 GB 4K master file traveling from an editor to a client's approval screen",
    },
    related: [
      "send-10gb-files-online-free",
      "wetransfer-alternatives-large-folders",
      "share-high-res-photos-without-losing-quality",
    ],
    faq: [
      {
        q: "What is the best way to send a large video file to a client?",
        a: "An encrypted, resumable transfer link with a short manifest message: file name, exact size, expiry date, and one line on what to do. The client clicks, downloads in the browser with no account, and confirms the byte count matches. For anything under 10 GB, BIShare does this free; bigger masters split by reel or deliverable.",
      },
      {
        q: "How do professionals deliver video to clients?",
        a: "With a pipeline agreed before export day: a delivery channel the client has already used once, review happening on a review platform (or a low-res preview), and the full-quality master traveling exactly once — as a verified, expiring link or a same-network direct transfer, not as a chat attachment.",
      },
      {
        q: "How do I send 100 GB of raw footage?",
        a: "Split by the project's natural seams — camera, day, or reel — into batches your tool handles comfortably, upload on a wired connection, and verify each batch's size on arrival. If the recipient is in the same building, skip the internet: a direct local transfer moves 100 GB over a router in well under an hour.",
      },
      {
        q: "What if the client can't download the file?",
        a: "Nine times out of ten it's disk space, an expired link, or a corporate network blocking downloads. Ask for the exact error, check the link hasn't expired, confirm they have free space beyond the file's size, and re-issue a fresh link if needed — which is painless when links are free and take seconds to mint.",
      },
      {
        q: "How long should a client download link stay live?",
        a: "Long enough to be humane, short enough not to become a standing exposure — 24 hours to a few days suits most deliveries, with an explicit expiry stated in the handoff message. For sensitive material, use a one-time download so the file disappears behind the first fetch, and re-send if a second copy is ever needed.",
      },
    ],
  },
  {
    slug: "transfer-large-files-without-cloud-limits",
    title: "How to Transfer Large Files Instantly Without Cloud Storage Limits",
    metaTitle: "Transfer Large Files Instantly — No Cloud Limits (2026)",
    description:
      "Why your file crosses a continent to cross a room — and how direct device-to-device transfer removes quotas, queues, and custody from large file sharing.",
    category: "large-files",
    tags: ["No cloud", "Direct transfer", "Large files", "Peer-to-peer"],
    keywords: [
      "transfer large files without cloud",
      "send large files no storage limit",
      "transfer files directly between devices",
      "no size limit file transfer",
      "peer to peer file transfer",
      "transfer files without uploading",
    ],
    datePublished: "2026-09-08",
    dateModified: "2026-09-08",
    readMinutes: 13,
    hero: {
      src: "/blog/hero-no-cloud.svg",
      alt: "An 86 GB file crossing nine meters directly between a laptop and a phone while the cloud detour hangs unused overhead",
    },
    related: [
      "send-10gb-files-online-free",
      "wireless-file-transfer-pc-mobile-guide",
      "send-massive-video-files-to-clients",
    ],
    faq: [
      {
        q: "Can I transfer large files without uploading them to the cloud?",
        a: "Yes — when both devices share a network (your Wi-Fi, an office LAN, or one phone's hotspot), a direct transfer app moves the file device-to-device through the router. Nothing is uploaded anywhere, there is no storage quota, and the speed is your Wi-Fi's, not your broadband's.",
      },
      {
        q: "Is there a file transfer method with truly no size limit?",
        a: "Direct device-to-device transfer is bounded only by the receiver's disk space — 50 GB or 500 GB makes no difference to the method. Internet transfer links carry per-transfer ceilings (10 GB free on BIShare), so at archive scale the local route or a physical drive takes over.",
      },
      {
        q: "Is peer-to-peer file transfer safe?",
        a: "A well-built one is among the safest options available: with end-to-end encryption the file is readable only by the two devices, and on the local route it never leaves your own network at all — there is no server to breach, no copy left behind, and no account to compromise.",
      },
      {
        q: "Do both devices need the app for direct transfer?",
        a: "For the fastest device-to-device path, yes — the app is what lets the devices find each other and encrypt end-to-end. When one side can't install anything, the halfway option is a browser: BIShare's web tool can send and receive against the app on the same network.",
      },
      {
        q: "Why is direct transfer faster than the cloud?",
        a: "Distance and doubling. A cloud transfer travels to a data center and back — two journeys, each capped by broadband, plus any free-tier queueing. A direct transfer makes one short hop through your router at local network speed, which is typically many times faster than a home connection's upload.",
      },
    ],
  },
  {
    slug: "securely-send-confidential-documents",
    title: "How to Securely Send Confidential Business Documents Wirelessly",
    metaTitle: "Securely Send Confidential Business Documents Wirelessly",
    description:
      "Six adversaries can read a document you send — network, server, link, lost device, wrong recipient, habit. A threat-model guide to secure wireless transfer.",
    category: "security",
    tags: ["Encryption", "Business documents", "End-to-end", "Threat model"],
    keywords: [
      "securely send confidential documents",
      "send confidential documents wirelessly",
      "secure business file transfer",
      "end-to-end encrypted document sharing",
      "send sensitive documents securely",
      "confidential file sharing for business",
    ],
    datePublished: "2026-09-11",
    dateModified: "2026-09-11",
    readMinutes: 14,
    hero: {
      src: "/blog/hero-confidential.svg",
      alt: "A sealed business document crossing wirelessly between a laptop and a phone while three outside observers see only ciphertext",
    },
    related: [
      "transfer-large-files-without-cloud-limits",
      "send-massive-video-files-to-clients",
      "send-10gb-files-online-free",
    ],
    faq: [
      {
        q: "Is it safe to send confidential documents over Wi-Fi?",
        a: "Yes — provided the encryption travels with the file rather than being borrowed from the network. With end-to-end encryption the document is sealed on the sending device and opened only on the receiving one, so even a hostile hotspot carries nothing but ciphertext. Treat every network as untrusted and it stops mattering which one you're on.",
      },
      {
        q: "Isn't the HTTPS padlock enough protection for business files?",
        a: "TLS protects each hop, but it terminates at every server in the path — your provider holds a readable copy, and so does the recipient's. For confidential material you want end-to-end encryption (no server can read the file) or a direct device-to-device transfer (no server exists at all).",
      },
      {
        q: "How do I send a confidential document to someone who can't install anything?",
        a: "Use a browser handoff. BIShare's web tool exchanges files with the app using the same sealed-container encryption, and the decryption key travels in the link's #fragment — a part of the URL that browsers never transmit to servers, so the key stays out of server logs entirely.",
      },
      {
        q: "Does direct transfer help with GDPR or client-confidentiality duties?",
        a: "It shrinks the surface. Every server that can read a document is a processor to assess, contract with, and disclose. A device-to-device transfer leaves no third party in custody, and an end-to-end encrypted relay holds only ciphertext it cannot open. Fewer readable copies means less to audit — the final compliance call stays with your counsel.",
      },
      {
        q: "What should I do if I sent a confidential file to the wrong person?",
        a: "Move fast: revoke or expire the transfer link if your tool allows it, and confirm deletion with the unintended recipient. Then fix the pattern — same-room sends with a visible accept prompt, short-lived transfer rooms instead of durable threads, and a deliberate reread of the recipient line before anything sensitive leaves.",
      },
    ],
  },
  {
    slug: "what-is-end-to-end-encrypted-file-sharing",
    title: "What is End-to-End Encrypted File Sharing and Why Do You Need It?",
    metaTitle: "What Is End-to-End Encrypted File Sharing? (2026 Guide)",
    description:
      "Follow the key, not the file: how E2E encryption is born, agreed, put to work, verified, and destroyed — plus six questions that expose fake E2E claims.",
    category: "security",
    tags: ["Encryption", "E2EE", "Privacy", "Explained"],
    keywords: [
      "end-to-end encrypted file sharing",
      "what is end-to-end encryption",
      "e2ee file transfer",
      "encrypted file sharing explained",
      "zero knowledge file sharing",
      "end-to-end encryption vs tls",
    ],
    datePublished: "2026-09-14",
    dateModified: "2026-09-14",
    readMinutes: 14,
    hero: {
      src: "/blog/hero-e2e-key.svg",
      alt: "The five-stage life of an encryption key — born, agreed, at work, proven, gone — drawn as a timeline between two devices",
    },
    related: [
      "securely-send-confidential-documents",
      "transfer-large-files-without-cloud-limits",
      "send-10gb-files-online-free",
    ],
    faq: [
      {
        q: "What does end-to-end encrypted file sharing mean?",
        a: "It means the file is encrypted on the sender's device and can only be decrypted on the recipient's device. The keys exist solely at those two endpoints, so no server, service, or network in between can read the file — even if it stores or relays the data.",
      },
      {
        q: "Is end-to-end encryption the same as the HTTPS padlock?",
        a: "No. The padlock (TLS) encrypts each hop of a journey but terminates at every server along the way, leaving readable copies with each provider. End-to-end encryption keeps decryption ability at the two endpoints only — intermediaries carry ciphertext they cannot open.",
      },
      {
        q: "Does end-to-end encryption slow down file transfers?",
        a: "Not when it's built properly. Modern phones and laptops have hardware AES instructions that encrypt faster than Wi-Fi can move the bytes, so the cipher is almost never the bottleneck. In our own pipeline, removing a redundant extra checksum actually sped transfers up — the authenticated encryption was already doing that job.",
      },
      {
        q: "Can end-to-end encrypted files be recovered if I lose the key?",
        a: "No — and that's the point. A provider that can restore your data after you lose everything necessarily holds key material of its own, which means it isn't truly end-to-end. Genuine E2E systems put backup responsibility on you: keep the original files, and treat key custody seriously.",
      },
      {
        q: "How do I know an app really uses end-to-end encryption?",
        a: "Apply four tests: keys must be generated on your devices (never server-side); a password reset must not magically preserve access to old encrypted data; the design should be documented or audited rather than 'proprietary'; and a wrong or missing key must produce a loud failure, never a fake success.",
      },
    ],
  },
  {
    slug: "airdrop-for-windows-speeds",
    title: "AirDrop for Windows: How to Get AirDrop-Like Speeds on Any PC",
    metaTitle: "AirDrop-Like Speeds on Windows: Fix a Slow Transfer",
    description:
      "A healthy phone-to-PC transfer moves 1 GB in about 25 seconds. Five causes of slow transfers, ordered by how often each is the real one — with the fix for each.",
    category: "apps",
    tags: ["Windows", "Transfer speed", "Wi-Fi", "Troubleshooting"],
    keywords: [
      "airdrop for windows speed",
      "slow file transfer windows",
      "wifi transfer speed phone to pc",
      "why is my file transfer so slow",
      "fastest way to transfer files to pc",
      "airdrop alternative speed",
    ],
    datePublished: "2026-10-08",
    dateModified: "2026-10-08",
    readMinutes: 14,
    hero: {
      src: "/blog/hero-speeds.svg",
      alt: "A diagnostic for slow phone-to-PC transfers: five causes ordered by how often each turns out to be the real one",
    },
    related: [
      "transfer-files-from-iphone-to-windows-without-cable",
      "what-is-quic-protocol",
      "local-sharing-without-cellular-data",
    ],
    faq: [
      {
        q: "How fast should a phone-to-PC transfer be?",
        a: "On ordinary Wi-Fi 5 hardware, about 40–50 MB/s — a gigabyte in roughly 20 to 30 seconds. On Wi-Fi 6 at close range it can reach 70–110 MB/s. If you are getting minutes rather than seconds, the most likely cause is that one device is on the 2.4 GHz band.",
      },
      {
        q: "Why is my file transfer so slow over Wi-Fi?",
        a: "In order of likelihood: one device is on 2.4 GHz instead of 5 GHz; distance or walls are degrading the signal; the receiving PC's disk or antivirus scanner is the bottleneck; or the transfer is not local at all and has fallen back to an internet relay, which runs at your upload speed instead of your Wi-Fi speed.",
      },
      {
        q: "Does antivirus slow down file transfers on Windows?",
        a: "Yes, sometimes dramatically. Real-time scanning inspects each file as it is written, and the cost is per file — so a batch of thousands of small photos suffers far more than one large video. Excluding a single download folder from Defender helps; excluding a whole drive is not a reasonable trade.",
      },
      {
        q: "Why are thousands of small files slower than one big file?",
        a: "Every file carries fixed costs — a metadata exchange, a file handle, a directory entry, an antivirus check — measured in milliseconds. That is nothing for a 2 GB video and everything for a 400 KB photo. Zipping a large batch first pays those costs once instead of thousands of times.",
      },
      {
        q: "Does turning off encryption make transfers faster?",
        a: "No. Modern processors have dedicated AES instructions, so encryption runs far faster than any Wi-Fi link can supply data — it spends most of its time waiting. The only case where the cipher becomes the bottleneck is an app built without those instructions enabled, which is a bug to fix rather than a feature to disable.",
      },
    ],
  },
  {
    slug: "ad-free-file-transfer-apps",
    title: "Top 5 Ad-Free File Transfer Apps for Android and iOS",
    metaTitle: "5 Ad-Free File Transfer Apps for Android & iOS (2026)",
    description:
      "Ad-free is a claim about today. Five checks that predict which free transfer apps stay clean — money, permissions, trackers, owner — plus five apps scored.",
    category: "apps",
    tags: ["Ad-free", "Android", "iOS", "App comparison"],
    keywords: [
      "ad free file transfer apps",
      "file sharing app without ads",
      "best ad free file transfer android",
      "no ads file sharing app ios",
      "shareit without ads alternative",
      "privacy friendly file transfer app",
    ],
    datePublished: "2026-10-05",
    dateModified: "2026-10-05",
    readMinutes: 14,
    hero: {
      src: "/blog/hero-ad-free.svg",
      alt: "Five checks that predict whether a free file transfer app will still be ad-free in two years",
    },
    related: [
      "best-shareit-alternatives",
      "bishare-review",
      "transfer-files-locally-without-internet",
    ],
    faq: [
      {
        q: "Which file transfer apps have no ads?",
        a: "Your platform's built-in tools (AirDrop on Apple devices, Quick Share on Android and Windows) carry no ads because they exist to make the platform sticky. Among cross-platform apps, LocalSend, PairDrop and BIShare are ad-free and open source — the difference between them is scope rather than cleanliness.",
      },
      {
        q: "How can I tell if a free app will add ads later?",
        a: "Find out how it makes money. An app with a paid tier for something genuinely costly, or funded by donations with no commercial layer, has a resolved business model. An app with millions of users, real infrastructure and no visible revenue has an unresolved tension — and those resolve eventually, usually toward advertising.",
      },
      {
        q: "Does a large app download mean it is full of ads?",
        a: "No — size is a poor signal. Our own universal Android APK is 128 MB, and 122 MB of that is native code compiled for three processor architectures at once; a phone installing from the store receives roughly a third. Ask what is inside rather than how large it is.",
      },
      {
        q: "How do I check what trackers an Android app contains?",
        a: "Look it up on Exodus Privacy, which decompiles Android apps and lists the advertising and analytics libraries it finds. An app that already ships those SDKs has done the hard part of monetizing attention — switching them on later is a product decision, not an engineering one.",
      },
      {
        q: "Are ad-free transfer apps different on iOS and Android?",
        a: "Yes. iOS has fewer candidates but cleaner ones on average, because AirDrop ships on every device and Apple's tracking prompt weakened the ad-funded business case. Android has far more choice and a much wider gap between the best and worst results in the same search.",
      },
    ],
  },
  {
    slug: "local-sharing-without-cellular-data",
    title: "How to Use Local Sharing to Transfer Files Without Using Cellular Data",
    metaTitle: "Transfer Files Without Using Mobile Data (2026 Guide)",
    description:
      "An itemized bill of where mobile data really goes when you share files — the double charge, silent backups, tethering, roaming — and the route that costs zero.",
    category: "apps",
    tags: ["Mobile data", "Data saving", "Local network", "Roaming"],
    keywords: [
      "transfer files without using data",
      "share files without mobile data",
      "save mobile data file sharing",
      "send files without internet data",
      "avoid data charges sharing photos",
      "transfer files wifi direct no data",
    ],
    datePublished: "2026-10-02",
    dateModified: "2026-10-02",
    readMinutes: 14,
    hero: {
      src: "/blog/hero-cellular-data.svg",
      alt: "An itemized mobile data bill for file sharing, with every line reduced to zero by transferring locally",
    },
    related: [
      "transfer-files-locally-without-internet",
      "transfer-large-files-without-cloud-limits",
      "share-high-res-photos-without-losing-quality",
    ],
    faq: [
      {
        q: "Does sharing files over Wi-Fi use mobile data?",
        a: "No, provided both devices are on the same network. The file goes to your router and back down to the other device without crossing the boundary between your network and the internet — and the meter exists only at that boundary. Your plan never sees it.",
      },
      {
        q: "How much data does sending a 2 GB video actually cost?",
        a: "Through a cloud service, up to 4 GB of combined allowance: 2 GB of your upload plus 2 GB of the recipient's download. Most people only ever see their own half, which is why the true cost of cloud sharing is routinely underestimated.",
      },
      {
        q: "Can I transfer files using a hotspot without spending data?",
        a: "Yes. A phone hotspot is a functioning network even with no internet — you can be in airplane mode with Wi-Fi on, or have no SIM at all. Local transfers need no DNS, clock sync or server handshake, so the two devices simply talk to each other and nothing is billed.",
      },
      {
        q: "Why did my data disappear while tethering a laptop?",
        a: "Because the laptop doesn't know the connection is metered, so it resumes cloud sync, system updates and backups. Mark the network as metered (Windows: Wi-Fi settings → Metered connection; macOS: low data mode) and those background tasks wait for real Wi-Fi.",
      },
      {
        q: "How do I check which apps are using my mobile data?",
        a: "On iPhone: Settings → Mobile Data, then scroll for a per-app breakdown — and reset the counter on your billing date so the numbers mean something. On Android: Settings → Network & internet → Mobile network → App data usage, which lets you match the date range to your billing cycle.",
      },
    ],
  },
  {
    slug: "what-is-quic-protocol",
    title: "What is QUIC Protocol? The Technology Behind Ultra-Fast File Transfer",
    metaTitle: "What Is QUIC Protocol? Explained by an Implementer (2026)",
    description:
      "We built a QUIC engine and measured it at 129 MB/s against TCP's 200. What the protocol really buys you, what it costs, and when it beats TCP for file transfer.",
    category: "apps",
    tags: ["QUIC", "Protocols", "Performance", "Networking"],
    keywords: [
      "what is quic protocol",
      "quic vs tcp",
      "quic file transfer",
      "http/3 quic explained",
      "is quic faster than tcp",
      "quic head of line blocking",
    ],
    datePublished: "2026-09-29",
    dateModified: "2026-09-29",
    readMinutes: 15,
    hero: {
      src: "/blog/hero-quic.svg",
      alt: "A measured comparison of QUIC at 129 MB/s against TCP at about 200 MB/s on the same machine",
    },
    related: [
      "transfer-files-locally-without-internet",
      "send-massive-video-files-to-clients",
      "bishare-review",
    ],
    faq: [
      {
        q: "What is the QUIC protocol in simple terms?",
        a: "QUIC is a transport protocol that does TCP's job but runs on UDP with encryption built in rather than layered on top. Standardized as RFC 9000 in 2021, it establishes connections in one round trip, carries many independent streams that don't block each other, and survives a device changing networks. It is the foundation of HTTP/3.",
      },
      {
        q: "Is QUIC actually faster than TCP?",
        a: "It depends entirely on the network. On lossy, high-latency links QUIC wins clearly. On a clean local link it can be slower: we measured our own QUIC path at 129 MB/s against roughly 200 MB/s for TCP on the same machine, because TCP benefits from kernel segmentation offload that userspace UDP does not get on every platform.",
      },
      {
        q: "What is head-of-line blocking, and how does QUIC fix it?",
        a: "In TCP, one lost packet stalls every byte queued behind it, even data belonging to unrelated requests. QUIC carries independent streams within one connection, so loss on one stream leaves the others flowing — which matters most when you are sending many files at once rather than one large one.",
      },
      {
        q: "Does QUIC keep working when I switch from Wi-Fi to mobile data?",
        a: "Yes. TCP identifies a connection by IP addresses and ports, so changing network kills it. QUIC uses a connection ID carried inside the encrypted packet, so the connection survives the address change. It does not survive the app being killed — that needs a separate resume mechanism.",
      },
      {
        q: "Should I choose a file transfer app because it uses QUIC?",
        a: "Not on its own. QUIC's advantages appear over cellular, on lossy links, and when many files move at once. On a home Wi-Fi network a well-built TCP transfer is often faster. Treat any throughput claim without a stated network, operating system and loss rate as marketing.",
      },
    ],
  },
  {
    slug: "bishare-review",
    title: "BIShare Review: An Honest Tour From the Team That Built It",
    metaTitle: "BIShare Review (2026) — An Honest Tour by Its Makers",
    description:
      "A vendor self-review that opens with five reasons not to use it — unsigned Windows builds, no Mac DMG, no audit — plus claims you can falsify in ten minutes.",
    category: "apps",
    tags: ["BIShare", "Review", "Transparency", "Hands-on"],
    keywords: [
      "bishare review",
      "is bishare safe",
      "bishare vs localsend",
      "bishare file transfer app",
      "cross-platform file sharing app review",
      "bishare app features",
    ],
    datePublished: "2026-09-26",
    dateModified: "2026-09-26",
    readMinutes: 14,
    hero: {
      src: "/blog/hero-bishare-review.svg",
      alt: "A self-review that opens with its own weaknesses, listing reasons not to use the app beside the claims a reader can verify",
    },
    related: [
      "best-shareit-alternatives",
      "transfer-files-locally-without-internet",
      "what-is-end-to-end-encrypted-file-sharing",
    ],
    faq: [
      {
        q: "Is this an independent review of BIShare?",
        a: "No — it is written by the people who build BIShare, published on their own blog. It is structured to be checkable rather than objective: it opens with reasons not to use the app, and every capability claim is one you can verify on your own hardware in minutes.",
      },
      {
        q: "Is BIShare safe to use?",
        a: "Transfers are end-to-end encrypted with X25519 and AES-256-GCM, implemented once in a public Rust crate shared by every platform, and local transfers never touch a server. The honest caveat: there has been no formal third-party security audit, so 'auditable' is the accurate word rather than 'audited'.",
      },
      {
        q: "Is BIShare really free, and how does it make money?",
        a: "Transfers are free with no ads and no account. Local transfers cost nothing to operate because nothing touches the company's servers. The paid direction is optional cloud storage and relay capacity for people who want files to persist rather than expire — not advertising.",
      },
      {
        q: "What are BIShare's biggest weaknesses?",
        a: "The Windows build is an unsigned ZIP, so SmartScreen warns and locked-down organizations will block it; there is no notarized Mac app outside the App Store; it transfers files rather than continuously syncing folders; and the installed base is small compared with SHAREit or LocalSend.",
      },
      {
        q: "How does BIShare compare to LocalSend?",
        a: "LocalSend is an excellent open-source choice if your needs are cross-platform transfer and nothing more. BIShare adds a browser path so the other person needs no install, transfer rooms for groups, scoped app sharing on Android, and an inbox with history — at the cost of being newer and less widely installed.",
      },
    ],
  },
  {
    slug: "best-shareit-alternatives",
    title: "Best SHAREit Alternatives in 2026: Fast, Lightweight, and Ad-Free",
    metaTitle: "Best SHAREit Alternatives in 2026 — Ad-Free & Fast",
    description:
      "SHAREit does seven jobs, not one. An inventory of what you're really replacing, four alternatives judged against it, and how to migrate without losing files.",
    category: "apps",
    tags: ["SHAREit", "Alternatives", "Android", "Ad-free"],
    keywords: [
      "shareit alternatives",
      "best shareit alternative 2026",
      "ad free file transfer app",
      "shareit replacement android",
      "lightweight file sharing app",
      "apps like shareit without ads",
    ],
    datePublished: "2026-09-23",
    dateModified: "2026-09-23",
    readMinutes: 14,
    hero: {
      src: "/blog/hero-shareit-alts.svg",
      alt: "A checklist of the seven jobs a SHAREit replacement must cover, set against the ad-laden media portal the original app became",
    },
    related: [
      "transfer-files-locally-without-internet",
      "share-files-between-ios-and-android",
      "send-10gb-files-online-free",
    ],
    faq: [
      {
        q: "What is the best ad-free alternative to SHAREit?",
        a: "It depends which of SHAREit's jobs you use. For plain cross-platform transfer, LocalSend is an excellent open-source choice. For the full set — offline transfer, Android to iPhone, app sharing, group sends, and a browser path for people without the app — BIShare covers all of them free and without ads.",
      },
      {
        q: "Why do people want to replace SHAREit?",
        a: "Mostly because the transfer tool grew into a media portal: a content feed, a games section, ads, and a download measured in hundreds of megabytes for a job that needs a fraction of it. Several governments, India included, also banned it in 2020, which pushed many users to look elsewhere.",
      },
      {
        q: "Can any SHAREit alternative send installed apps?",
        a: "Yes, but with a caveat worth understanding. Listing every installed app requires Android's restricted QUERY_ALL_PACKAGES permission, which Google Play does not grant to file-transfer apps. Well-behaved apps use scoped package visibility instead — they see apps with a launcher icon, and hand APK installation off to the system installer.",
      },
      {
        q: "Which alternative works between Android and iPhone?",
        a: "LocalSend, PairDrop, and BIShare all cross that line. Quick Share does not and never will — it covers Android and Windows only. If Android-to-iPhone is the reason you're switching, rule Quick Share out immediately.",
      },
      {
        q: "Are these alternatives actually faster than SHAREit?",
        a: "On the same Wi-Fi network they are all within noise of each other, because the bottleneck is the radio, not the app — roughly 40–50 MB/s on ordinary Wi-Fi 5 hardware. Choose on features and trust rather than benchmarks; a dramatic speed difference usually means one app silently took a slower path.",
      },
    ],
  },
  {
    slug: "prevent-data-leaks-file-sharing",
    title: "Safe File Sharing: How to Prevent Data Leaks During Transfer",
    metaTitle: "Prevent Data Leaks During File Transfer — 6 Real Causes",
    description:
      "Six reconstructions of how files really leak — wrong recipient, eternal links, Exif, tracked changes, lock-screen previews, sync copies — and the fix for each.",
    category: "security",
    tags: ["Data leaks", "Metadata", "Operational security", "Incidents"],
    keywords: [
      "prevent data leaks file sharing",
      "safe file sharing practices",
      "how do data leaks happen",
      "remove metadata before sharing",
      "accidental data disclosure",
      "secure file transfer checklist",
    ],
    datePublished: "2026-09-20",
    dateModified: "2026-09-20",
    readMinutes: 14,
    hero: {
      src: "/blog/hero-data-leaks.svg",
      alt: "An intact encrypted transfer pipe with six small leaks escaping around it, labelled by cause",
    },
    related: [
      "securely-send-confidential-documents",
      "transfer-files-locally-without-internet",
      "what-is-end-to-end-encrypted-file-sharing",
    ],
    faq: [
      {
        q: "What causes most data leaks during file sharing?",
        a: "Misdelivery — sending to the wrong person, usually via autocomplete — is consistently among the top causes in breach reporting, well ahead of interception. Encryption cannot help, because the file is encrypted correctly to the wrong recipient.",
      },
      {
        q: "Does encryption stop data leaks?",
        a: "It stops interception and tampering, which is a real and important category. It does nothing about the wrong recipient, metadata hidden inside the file, filenames shown in notifications, or copies that keep replicating after arrival — all of which are disclosures that occur with the encryption working perfectly.",
      },
      {
        q: "How do I remove hidden data from a document before sending?",
        a: "Use the format's own inspector: Word, Excel, and PowerPoint include a Document Inspector that strips comments, tracked changes, author properties, and hidden rows in one pass. For PDFs, verify redaction by trying to select the text underneath — if it highlights, it was covered, not removed.",
      },
      {
        q: "Do photos reveal my location when I share them?",
        a: "They can. Cameras write Exif metadata including GPS coordinates and timestamps into image files, and any tool that sends originals faithfully sends that metadata too. Turn off location in the iPhone share sheet's Options, or use Android's remove-location toggle, before sharing anything public.",
      },
      {
        q: "What should I do immediately after sending a file to the wrong person?",
        a: "Cut access first: revoke or expire the link before drafting any explanation, and request deletion in writing the same day. Then confirm exactly what went out by opening the sent file itself, and write down the timeline while it is fresh — memory degrades within hours.",
      },
    ],
  },
  {
    slug: "transfer-files-locally-without-internet",
    title: "How to Transfer Private Data Locally Without Using the Internet",
    metaTitle: "Transfer Private Data Locally — No Internet Needed (2026)",
    description:
      "Five rungs of disconnection, from ordinary Wi-Fi down to a screen-to-camera air gap — what still works at each, and what you actually stop leaking.",
    category: "security",
    tags: ["Offline", "Local network", "Privacy", "Air gap"],
    keywords: [
      "transfer files locally without internet",
      "share files offline",
      "send private data without internet",
      "local network file transfer",
      "air gapped file transfer",
      "transfer files without wifi",
    ],
    datePublished: "2026-09-17",
    dateModified: "2026-09-17",
    readMinutes: 14,
    hero: {
      src: "/blog/hero-local-offline.svg",
      alt: "A ladder of disconnection with five rungs, from ordinary Wi-Fi down to a fully air-gapped screen-to-camera transfer",
    },
    related: [
      "securely-send-confidential-documents",
      "what-is-end-to-end-encrypted-file-sharing",
      "transfer-large-files-without-cloud-limits",
    ],
    faq: [
      {
        q: "Can I transfer files between devices with no internet at all?",
        a: "Yes. Any shared Wi-Fi works without an internet connection, and if there is no network at all you can turn on a phone's hotspot and join the other device to it — that is a complete private network of two. Nothing in a local transfer needs DNS, clock sync, or a server handshake.",
      },
      {
        q: "Why can't my devices see each other on café or hotel Wi-Fi?",
        a: "Most public networks enable client isolation, which blocks devices on the same access point from addressing each other. Nothing is broken and no setting on your side fixes it — switch to a phone hotspot instead, which puts both devices on a network you control.",
      },
      {
        q: "Is offline transfer actually more private than cloud sharing?",
        a: "Structurally, yes. A local transfer leaves no copy with any third party, so there is nothing to breach, subpoena, scan, or retain. Cloud sharing always leaves at least one readable or stored copy plus a metadata trail of who sent what to whom and when.",
      },
      {
        q: "How do I send a file with no Wi-Fi, hotspot, or Bluetooth?",
        a: "Use an animated QR stream: the sending screen loops QR codes and the receiving camera reads them, so the only thing crossing the gap is light. It is a true air gap, but bandwidth is tiny — it suits keys, passwords, text, and small documents rather than photos or video.",
      },
      {
        q: "Does the recipient need the same app installed?",
        a: "For the fastest device-to-device path, yes. When they can't install anything, a browser on the same network can send and receive instead — useful on locked-down work laptops or a machine you don't own.",
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

/** In `next dev`, scheduled articles are always visible for editing/preview. */
const DEV = process.env.NODE_ENV === "development";

/**
 * Production preview: /blog/<slug>?preview=KEY renders a scheduled article
 * early (with a banner + noindex). The key lives in this public repo, so it
 * gates *accidental* discovery and search indexing — not secrecy; scheduled
 * posts are cadence, not confidences.
 */
export const PREVIEW_KEY = "editorial";

export function isScheduled(post: BlogPost): boolean {
  return post.datePublished > todayUtc();
}

export function publishedPosts(): BlogPost[] {
  if (DEV) return [...POSTS];
  const now = todayUtc();
  return POSTS.filter((p) => p.datePublished <= now);
}

export const publishedSlugs = (): Set<string> =>
  new Set(publishedPosts().map((p) => p.slug));

/** Returns the post when its date has arrived — or regardless of date in dev
 *  / when the caller holds the preview key. */
export function getPost(
  slug: string,
  opts?: { allowScheduled?: boolean }
): BlogPost | undefined {
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) return undefined;
  if (DEV || opts?.allowScheduled) return post;
  return post.datePublished <= todayUtc() ? post : undefined;
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
  "share-high-res-photos-without-losing-quality": () =>
    import("./share-high-res-photos-without-losing-quality.mdx"),
  "send-massive-video-files-to-clients": () =>
    import("./send-massive-video-files-to-clients.mdx"),
  "transfer-large-files-without-cloud-limits": () =>
    import("./transfer-large-files-without-cloud-limits.mdx"),
  "securely-send-confidential-documents": () =>
    import("./securely-send-confidential-documents.mdx"),
  "what-is-end-to-end-encrypted-file-sharing": () =>
    import("./what-is-end-to-end-encrypted-file-sharing.mdx"),
  "transfer-files-locally-without-internet": () =>
    import("./transfer-files-locally-without-internet.mdx"),
  "prevent-data-leaks-file-sharing": () =>
    import("./prevent-data-leaks-file-sharing.mdx"),
  "best-shareit-alternatives": () =>
    import("./best-shareit-alternatives.mdx"),
  "bishare-review": () => import("./bishare-review.mdx"),
  "what-is-quic-protocol": () => import("./what-is-quic-protocol.mdx"),
  "local-sharing-without-cellular-data": () =>
    import("./local-sharing-without-cellular-data.mdx"),
  "ad-free-file-transfer-apps": () =>
    import("./ad-free-file-transfer-apps.mdx"),
  "airdrop-for-windows-speeds": () =>
    import("./airdrop-for-windows-speeds.mdx"),
};
