import type { Metadata } from "@/site/metadata";

/** A page of the site: what it shows, and what it says about itself. */
export interface PageModule {
  default: (props: PageProps) => unknown;
  generateMetadata: (props: PageProps) => Promise<Metadata>;
}

export interface PageProps {
  locale: string;
  slug: string;
}

/** Every page built ahead of time, by its path without a locale prefix. Each is built in every language. */
export const PAGES: Record<string, () => Promise<unknown>> = {
  "/airdrop-alternative": () => import("./airdrop-alternative"),
  "/airdrop-for-android": () => import("./airdrop-for-android"),
  "/airdrop-for-windows": () => import("./airdrop-for-windows"),
  "/airdrop-not-working": () => import("./airdrop-not-working"),
  "/android-file-transfer-mac": () => import("./android-file-transfer-mac"),
  "/best-file-sharing-app": () => import("./best-file-sharing-app"),
  "/clipboard-sync": () => import("./clipboard-sync"),
  "/encrypted-file-transfer": () => import("./encrypted-file-transfer"),
  "/firefox-send-alternative": () => import("./firefox-send-alternative"),
  "/how-to-airdrop": () => import("./how-to-airdrop"),
  "/localsend-alternative": () => import("./localsend-alternative"),
  "/nearby-share-alternative": () => import("./nearby-share-alternative"),
  "/send-anywhere-alternative": () => import("./send-anywhere-alternative"),
  "/send-files-android-to-iphone": () => import("./send-files-android-to-iphone"),
  "/send-files-iphone-to-android": () => import("./send-files-iphone-to-android"),
  "/send-files-without-internet": () => import("./send-files-without-internet"),
  "/send-large-files": () => import("./send-large-files"),
  "/share-files-mac-to-windows": () => import("./share-files-mac-to-windows"),
  "/share-files-without-account": () => import("./share-files-without-account"),
  "/sharedrop-alternative": () => import("./sharedrop-alternative"),
  "/shareit-alternative": () => import("./shareit-alternative"),
  "/smash-alternative": () => import("./smash-alternative"),
  "/snapdrop-alternative": () => import("./snapdrop-alternative"),
  "/transfer-files-between-computers": () => import("./transfer-files-between-computers"),
  "/transfer-files-iphone-to-pc": () => import("./transfer-files-iphone-to-pc"),
  "/transfer-files-pc-to-phone": () => import("./transfer-files-pc-to-phone"),
  "/transfer-files-phone-to-pc": () => import("./transfer-files-phone-to-pc"),
  "/transfer-files-to-ipad": () => import("./transfer-files-to-ipad"),
  "/transfer-photos-from-iphone-to-pc": () => import("./transfer-photos-from-iphone-to-pc"),
  "/wetransfer-alternative": () => import("./wetransfer-alternative"),
  "/wormhole-alternative": () => import("./wormhole-alternative"),
  "/features": () => import("./features/page"),
  "/how-it-works": () => import("./how-it-works"),
  "/about": () => import("./about"),
  "/philosophy": () => import("./philosophy"),
  "/contact": () => import("./contact/page"),
  "/faq": () => import("./faq/page"),
  "/pricing": () => import("./pricing"),
  "/download": () => import("./download/page"),
  "/security": () => import("./security/page"),
  "/privacy": () => import("./privacy/page"),
  "/terms": () => import("./terms"),
  "/": () => import("./home"),
  "/transfer": () => import("./transfer/page"),
  "/airdrop-online": () => import("./airdrop-online"),
  "/wifi-file-transfer": () => import("./wifi-file-transfer"),
  "/rooms": () => import("./rooms"),
  "/blog": () => import("./blog/page"),
};

/** The articles, in every language too: the page around the English text. */
export const BLOG_POST = () => import("./blog/post");
