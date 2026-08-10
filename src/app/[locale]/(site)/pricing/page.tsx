// /pricing — informational plan page. BIShare is free, transfer-only today:
// local (LAN, E2E), remote share links (24h, expiring), and rooms — no account,
// no subscriptions. Kept reachable by URL only (noindex) while paid cloud tiers
// remain future work; flip the robots block off once there's something to sell.
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/i18n/metadata";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Section } from "@/components/site/section";
import { FadeUp } from "@/components/site/motion";
import { VButton } from "@/components/site/vbutton";
import { sharedOpenGraph } from "@/lib/og";
import { Check } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricing" });
  const description = t("description");
  return {
    title: t("meta.title"),
    description,
    alternates: buildAlternates(locale, "/pricing"),
    // Dark-launch: lift this block when paid tiers actually ship.
    robots: { index: false, follow: false },
    ...sharedOpenGraph(t("meta.ogTitle"), description, "/pricing"),
  };
}

// Ordered list of included-feature keys (strings live in the "pricing" namespace).
const INCLUDED_KEYS = [
  "network",
  "e2e",
  "links",
  "expire",
  "rooms",
  "platforms",
] as const;

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pricing");

  return (
    <>
      <SiteHeader />
      <main>
        <Section className="border-b border-border pt-24 pb-16 text-center">
          <FadeUp>
            <p className="mb-5 inline-flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              <span
                className="h-1.5 w-1.5 rounded-[2px] bg-accent-blue"
                aria-hidden
              />
              {t("eyebrow")}
            </p>
            <h1 className="mx-auto max-w-2xl text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
              {t("heading")}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {t("description")}
            </p>
          </FadeUp>
        </Section>

        <Section className="pb-16">
          <FadeUp className="mx-auto max-w-xl">
            <div className="rounded-xl border border-border bg-card p-8">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-semibold tracking-[-0.03em]">
                  $0
                </span>
                <span className="text-sm text-muted-foreground">
                  {t("priceNote")}
                </span>
              </div>
              <ul className="mt-7 space-y-3">
                {INCLUDED_KEYS.map((key) => (
                  <li
                    key={key}
                    className="flex items-start gap-3 text-[15px] leading-relaxed"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-background-raised text-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                    <span>{t(`included.${key}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeUp>

          <div className="mt-10 flex flex-col items-center gap-3">
            <VButton href="/download" size="lg">
              {t("cta")}
            </VButton>
            <p className="max-w-md text-center text-xs text-muted-foreground">
              {t("ctaNote")}
            </p>
          </div>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
