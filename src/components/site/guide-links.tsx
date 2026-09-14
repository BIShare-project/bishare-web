import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { getPost } from "@/content/blog/registry";

/**
 * In-copy links between the SEO guides. Each target is a rich-text tag, so a
 * translation wraps its own anchor words: `<goLargeFiles>big files</goLargeFiles>`.
 * Pages spread `guideLinks()` into the tag object they pass to `t.rich`.
 *
 * Blog articles are English-only and ship on a schedule: a tag pointing at an
 * article that is not published yet renders its words as plain text, so no
 * guide ever links to a 404.
 */

const GUIDES = {
  goAirdropWindows: "/airdrop-for-windows",
  goLargeFiles: "/send-large-files",
  goBestApps: "/best-file-sharing-app",
  goAirdropAlt: "/airdrop-alternative",
  goSnapdrop: "/snapdrop-alternative",
  goMacWindows: "/share-files-mac-to-windows",
  goIphoneAndroid: "/send-files-iphone-to-android",
  goAndroidIphone: "/send-files-android-to-iphone",
  goPcPhone: "/transfer-files-pc-to-phone",
  goPhonePc: "/transfer-files-phone-to-pc",
  goWetransfer: "/wetransfer-alternative",
  goIphonePhotos: "/transfer-photos-from-iphone-to-pc",
  goPcPc: "/transfer-files-between-computers",
  goLocalsend: "/localsend-alternative",
  goAirdropAndroid: "/airdrop-for-android",
  goAirdropFix: "/airdrop-not-working",
  goShareit: "/shareit-alternative",
  goNearby: "/nearby-share-alternative",
  goSharedrop: "/sharedrop-alternative",
  goSendAnywhere: "/send-anywhere-alternative",
  goEncrypted: "/encrypted-file-transfer",
  goOffline: "/send-files-without-internet",
  goNoAccount: "/share-files-without-account",
  goSmash: "/smash-alternative",
  goWormhole: "/wormhole-alternative",
  goFirefoxSend: "/firefox-send-alternative",
  goTransfer: "/transfer",
  goRooms: "/rooms",
  goSecurity: "/security",
} as const;

const ARTICLES = {
  blogE2e: "what-is-end-to-end-encrypted-file-sharing",
  blogConfidential: "securely-send-confidential-documents",
  blog10gb: "send-10gb-files-online-free",
  blogLargeFolders: "wetransfer-alternatives-large-folders",
  blogIphoneWindows: "transfer-files-from-iphone-to-windows-without-cable",
  blogIosAndroid: "share-files-between-ios-and-android",
  blogWireless: "wireless-file-transfer-pc-mobile-guide",
  blogWebdav: "webdav-server-android-mac",
  blogPhotos: "share-high-res-photos-without-losing-quality",
  blogClientVideo: "send-massive-video-files-to-clients",
  blogCloudLimits: "transfer-large-files-without-cloud-limits",
  blogAndroidMac: "send-large-videos-from-android-to-mac",
  blogLocal: "transfer-files-locally-without-internet",
  blogShareit: "best-shareit-alternatives",
  blogLeaks: "prevent-data-leaks-file-sharing",
  blogNoData: "local-sharing-without-cellular-data",
  blogAdFree: "ad-free-file-transfer-apps",
  blogQuic: "what-is-quic-protocol",
  blogSpeeds: "airdrop-for-windows-speeds",
} as const;

export type GuideLinkTag = keyof typeof GUIDES | keyof typeof ARTICLES;

const CLASS =
  "text-foreground underline decoration-foreground/35 underline-offset-[3px] transition-colors hover:decoration-foreground";

type Renderer = (chunks: ReactNode) => ReactNode;

export function guideLinks(): Record<GuideLinkTag, Renderer> {
  const out = {} as Record<GuideLinkTag, Renderer>;
  for (const [tag, href] of Object.entries(GUIDES)) {
    out[tag as GuideLinkTag] = (chunks) => (
      <Link href={href} className={CLASS}>
        {chunks}
      </Link>
    );
  }
  for (const [tag, slug] of Object.entries(ARTICLES)) {
    out[tag as GuideLinkTag] = getPost(slug)
      ? (chunks) => (
          <Link href={`/blog/${slug}`} className={CLASS}>
            {chunks}
          </Link>
        )
      : (chunks) => <>{chunks}</>;
  }
  return out;
}

/** Every tag name, for the copy checker. */
export const GUIDE_LINK_ROUTES: Record<GuideLinkTag, string> = {
  ...GUIDES,
  ...Object.fromEntries(
    Object.entries(ARTICLES).map(([tag, slug]) => [tag, `/blog/${slug}`])
  ),
} as Record<GuideLinkTag, string>;
