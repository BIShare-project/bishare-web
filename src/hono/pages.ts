import type { Metadata } from "next";

/** A page of the site: the component and metadata Next renders too, until Next goes. */
export interface PageModule {
  default: (props: { params: Promise<{ locale: string }> }) => unknown;
  generateMetadata: (props: { params: Promise<{ locale: string }> }) => Promise<Metadata>;
}

/** Every page Hono builds, by its path without a locale prefix. Each is built in every language. */
export const PAGES: Record<string, () => Promise<unknown>> = {
  "/airdrop-alternative": () => import("../app/[locale]/(site)/airdrop-alternative/page"),
  "/airdrop-for-android": () => import("../app/[locale]/(site)/airdrop-for-android/page"),
  "/airdrop-for-windows": () => import("../app/[locale]/(site)/airdrop-for-windows/page"),
  "/airdrop-not-working": () => import("../app/[locale]/(site)/airdrop-not-working/page"),
  "/android-file-transfer-mac": () => import("../app/[locale]/(site)/android-file-transfer-mac/page"),
  "/best-file-sharing-app": () => import("../app/[locale]/(site)/best-file-sharing-app/page"),
  "/clipboard-sync": () => import("../app/[locale]/(site)/clipboard-sync/page"),
  "/encrypted-file-transfer": () => import("../app/[locale]/(site)/encrypted-file-transfer/page"),
  "/firefox-send-alternative": () => import("../app/[locale]/(site)/firefox-send-alternative/page"),
  "/how-to-airdrop": () => import("../app/[locale]/(site)/how-to-airdrop/page"),
  "/localsend-alternative": () => import("../app/[locale]/(site)/localsend-alternative/page"),
  "/nearby-share-alternative": () => import("../app/[locale]/(site)/nearby-share-alternative/page"),
  "/send-anywhere-alternative": () => import("../app/[locale]/(site)/send-anywhere-alternative/page"),
  "/send-files-android-to-iphone": () => import("../app/[locale]/(site)/send-files-android-to-iphone/page"),
  "/send-files-iphone-to-android": () => import("../app/[locale]/(site)/send-files-iphone-to-android/page"),
  "/send-files-without-internet": () => import("../app/[locale]/(site)/send-files-without-internet/page"),
  "/send-large-files": () => import("../app/[locale]/(site)/send-large-files/page"),
  "/share-files-mac-to-windows": () => import("../app/[locale]/(site)/share-files-mac-to-windows/page"),
  "/share-files-without-account": () => import("../app/[locale]/(site)/share-files-without-account/page"),
  "/sharedrop-alternative": () => import("../app/[locale]/(site)/sharedrop-alternative/page"),
  "/shareit-alternative": () => import("../app/[locale]/(site)/shareit-alternative/page"),
  "/smash-alternative": () => import("../app/[locale]/(site)/smash-alternative/page"),
  "/snapdrop-alternative": () => import("../app/[locale]/(site)/snapdrop-alternative/page"),
  "/transfer-files-between-computers": () => import("../app/[locale]/(site)/transfer-files-between-computers/page"),
  "/transfer-files-iphone-to-pc": () => import("../app/[locale]/(site)/transfer-files-iphone-to-pc/page"),
  "/transfer-files-pc-to-phone": () => import("../app/[locale]/(site)/transfer-files-pc-to-phone/page"),
  "/transfer-files-phone-to-pc": () => import("../app/[locale]/(site)/transfer-files-phone-to-pc/page"),
  "/transfer-files-to-ipad": () => import("../app/[locale]/(site)/transfer-files-to-ipad/page"),
  "/transfer-photos-from-iphone-to-pc": () => import("../app/[locale]/(site)/transfer-photos-from-iphone-to-pc/page"),
  "/wetransfer-alternative": () => import("../app/[locale]/(site)/wetransfer-alternative/page"),
  "/wormhole-alternative": () => import("../app/[locale]/(site)/wormhole-alternative/page"),
};
