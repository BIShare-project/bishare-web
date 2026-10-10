"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AppleGlyph,
  APP_STORE_URL,
  PlayGlyph,
  playStoreUrl,
  StoreButtons,
} from "@/components/site/store-buttons";
import { VButton, vbuttonClass } from "@/components/site/vbutton";
import { getPathname } from "@/i18n/navigation";
import { sendBackHref } from "@/lib/loop";
import { detectMobileOS } from "@/lib/pwa-install";

const noopSubscribe = () => () => {};

/**
 * "Send a file", from a transfer page to the send tool. A plain anchor, not a
 * router link: on the receive host the target is another host, where an in-app
 * navigation fails before it falls back to a full one. The href in the HTML is
 * the bare link; the click swaps in one that goes straight to the main site
 * and carries the time of the click, which is how the send tool tells a person
 * who pressed this from a crawler that followed it (lib/loop.ts).
 */
function SendBack({
  variant,
  size,
  children,
}: {
  variant: "primary" | "secondary";
  size: "md" | "lg";
  children: ReactNode;
}) {
  const path = getPathname({ href: "/transfer", locale: useLocale() });
  return (
    <a
      href={`${path}?ref=recv`}
      onClick={(e) => {
        e.currentTarget.href = sendBackHref(path);
      }}
      className={vbuttonClass(variant, size)}
    >
      {children}
    </a>
  );
}

/**
 * Recipient acquisition card, shown under every functional flow (the receive
 * page is the highest-intent surface — someone just got a file cross-platform
 * with no app). Turns that moment into an install: the wedge copy + store
 * buttons. Localized via the `flows.appPromo` namespace.
 */
export function AppPromo({ sendCta = true }: { sendCta?: boolean }) {
  const t = useTranslations("flows.appPromo");
  const tc = useTranslations("chrome");
  // null on the server and on desktop; the platform never changes mid-visit.
  const mobile = useSyncExternalStore(noopSubscribe, detectMobileOS, () => null);
  const android = mobile === "android";
  const Glyph = android ? PlayGlyph : AppleGlyph;
  return (
    <section className="mt-12">
      <div className="mb-8 h-px bg-border" aria-hidden />
      <div className="rounded-xl border border-border bg-card p-6 text-center md:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {t("eyebrow")}
        </p>
        <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em] md:text-2xl">
          {t("title")}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {t("body")}
        </p>
        {mobile ? (
          /* On a phone the store app comes first: it sends over Wi-Fi with no
             upload, which the browser cannot do. Sending from the browser
             stays one tap below. */
          <div className="mt-6 flex flex-col items-center gap-3">
            <VButton
              href={android ? playStoreUrl(sendCta ? "receive" : "transfer_promo") : APP_STORE_URL}
              size="lg"
            >
              <Glyph />
              {tc("nativeApp.button", { store: android ? "Google Play" : "App Store" })}
            </VButton>
            {sendCta && (
              <SendBack variant="secondary" size="md">
                {t("sendCta")}
              </SendBack>
            )}
          </div>
        ) : sendCta ? (
          /* Desktop: reciprocate right here, in the browser, no install — the
             zero-friction loop that grows a share tool (Snapdrop/ShareDrop). */
          <div className="mt-6 flex flex-col items-center gap-5">
            <SendBack variant="primary" size="lg">
              {t("sendCta")}
            </SendBack>
            <div className="flex flex-col items-center gap-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {t("orGetApp")}
              </p>
              <StoreButtons className="justify-center" />
            </div>
          </div>
        ) : (
          /* On the send tool itself there is nothing to send back to. */
          <div className="mt-6 flex flex-col items-center">
            <StoreButtons className="justify-center" />
          </div>
        )}
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {t("free")}
        </p>
      </div>
    </section>
  );
}
