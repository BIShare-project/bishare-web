"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { AppleGlyph, APP_STORE_URL, PlayGlyph, playStoreUrl } from "@/components/site/store-buttons";
import { buttonVariants } from "@/components/site/ui/button";
import { detectMobileOS } from "@/lib/pwa-install";

const noopSubscribe = () => () => {};

/**
 * Under a finished upload, on a phone: the moment someone has just waited for
 * an upload is the moment the app's pitch is true for them. Next time the file
 * can go straight to a nearby device with no upload at all. Desktop renders
 * nothing here; it keeps the web-app offer under the studio.
 */
export function AppAfterUpload() {
  const t = useTranslations("chrome");
  // null on the server and on desktop; the platform never changes mid-visit.
  const mobile = useSyncExternalStore(noopSubscribe, detectMobileOS, () => null);
  if (!mobile) return null;
  const android = mobile === "android";
  const Glyph = android ? PlayGlyph : AppleGlyph;
  return (
    <section className="rounded-xl border border-border bg-card p-5 text-left">
      <h4 className="text-base font-semibold tracking-[-0.01em]">{t("nativeApp.afterUploadTitle")}</h4>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t("nativeApp.afterUploadBody")}</p>
      <a
        href={android ? playStoreUrl("after_upload") : APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants({ variant: "default", size: "default", className: "mt-4 w-full" })}
      >
        <Glyph />
        {t("nativeApp.button", { store: android ? "Google Play" : "App Store" })}
      </a>
    </section>
  );
}
