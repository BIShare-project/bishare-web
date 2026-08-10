"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, BellRing, HardDriveDownload } from "lucide-react";
import { cn } from "@/lib/utils";
import { VButton } from "@/components/site/vbutton";
import {
  APP_STORE_URL,
  PLAY_STORE_URL,
  AppleGlyph,
  PlayGlyph,
} from "@/components/site/store-buttons";
import { ComingSoonPill, notifyHref } from "./availability";

/** Secondary VButton classes for plain anchors (mailto/hash) VButton can't route. */
const SECONDARY_ANCHOR =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border-strong bg-transparent px-5 text-[15px] font-medium tracking-[-0.01em] text-foreground outline-none transition-colors hover:border-foreground/25 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** Current app version, surfaced in the CTA captions. */
const VERSION = "v2.4.0";

type DetectedOS = "android" | "ios" | "macos" | "windows" | "linux" | "unknown";

function detectOS(): DetectedOS {
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return "android";
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/macintosh|mac os x/.test(ua)) {
    // iPadOS 13+ masquerades as a Mac; multi-touch gives it away.
    return navigator.maxTouchPoints > 1 ? "ios" : "macos";
  }
  if (/windows/.test(ua)) return "windows";
  // ChromeOS ("CrOS", also reports X11) runs the Play Store build.
  if (/cros/.test(ua)) return "android";
  if (/linux|x11/.test(ua)) return "linux";
  return "unknown";
}

/**
 * OS-aware hero CTA. SSR renders the neutral state; detection only upgrades
 * after mount, so the first client render always matches the server and
 * hydration stays clean. Live today: Android (Google Play), iOS & macOS
 * (App Store, id6760924092). Windows/Linux direct downloads are still baking.
 */
export function DownloadHero({ className }: { className?: string }) {
  const t = useTranslations("download");
  const [os, setOs] = useState<DetectedOS>("unknown");

  useEffect(() => {
    setOs(detectOS());
  }, []);

  const osLabel = t(`detected.os.${os}`);
  const desktop = os === "macos" || os === "windows" || os === "linux";

  const notify = (
    <a
      href={notifyHref(t("notify.emailSubject", { platform: osLabel }))}
      className={SECONDARY_ANCHOR}
    >
      <BellRing className="h-4 w-4" />
      {t("detected.getNotified")}
    </a>
  );

  let ctas: ReactNode;
  let caption: string;

  if (os === "ios" || os === "macos") {
    ctas = (
      <>
        <VButton href={APP_STORE_URL} variant="primary" size="lg">
          <AppleGlyph />
          {t("detected.appStoreCta")}
        </VButton>
        <a href="#platforms" className={SECONDARY_ANCHOR}>
          {t("detected.allPlatforms")}
          <ArrowDown className="h-4 w-4" />
        </a>
      </>
    );
    caption = t("detected.caption", { version: VERSION });
  } else if (desktop) {
    ctas = (
      <>
        <ComingSoonPill className="h-[52px] px-7 text-[15px]">
          <HardDriveDownload className="h-4 w-4" />
          {t("detected.comingSoon")}
        </ComingSoonPill>
        {notify}
      </>
    );
    caption = t("detected.desktopCaption", { os: osLabel });
  } else {
    ctas = (
      <>
        <VButton href={PLAY_STORE_URL} variant="primary" size="lg">
          <PlayGlyph />
          {t("detected.playCta")}
        </VButton>
        <a href="#platforms" className={SECONDARY_ANCHOR}>
          {t("detected.allPlatforms")}
          <ArrowDown className="h-4 w-4" />
        </a>
      </>
    );
    caption = t("detected.caption", { version: VERSION });
  }

  return (
    <div className={cn("flex flex-col gap-5", className)} aria-live="polite">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {os === "unknown"
          ? t("detected.oneApp")
          : t("detected.label", { os: osLabel })}
      </p>
      <div className="flex flex-wrap items-center gap-4">{ctas}</div>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        {caption}
      </p>
    </div>
  );
}
