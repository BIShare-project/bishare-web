"use client";

import { useTranslations } from "next-intl";
import { StoreButtons } from "@/components/site/store-buttons";
import { VButton } from "@/components/site/vbutton";

/**
 * Recipient acquisition card, shown under every functional flow (the receive
 * page is the highest-intent surface — someone just got a file cross-platform
 * with no app). Turns that moment into an install: the wedge copy + store
 * buttons. Localized via the `flows.appPromo` namespace.
 */
export function AppPromo() {
  const t = useTranslations("flows.appPromo");
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
        {/* Primary: reciprocate right here, in the browser, no install — the
            zero-friction loop that grows a share tool (Snapdrop/ShareDrop). */}
        <div className="mt-6 flex flex-col items-center gap-5">
          <VButton href="/transfer?ref=recv" size="lg">
            {t("sendCta")}
          </VButton>
          <div className="flex flex-col items-center gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {t("orGetApp")}
            </p>
            <StoreButtons className="justify-center" />
          </div>
        </div>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {t("free")}
        </p>
      </div>
    </section>
  );
}
