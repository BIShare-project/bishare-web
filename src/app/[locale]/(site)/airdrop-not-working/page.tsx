import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/i18n/metadata";
import { sharedOpenGraph } from "@/lib/og";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { RelatedLinks } from "@/components/site/related-links";
import { VButton } from "@/components/site/vbutton";
import { HeroCta } from "@/components/site/hero-cta";
import { StoreButtons } from "@/components/site/store-buttons";
import { ArrowRight } from "lucide-react";

/**
 * Troubleshooting intercept for the huge evergreen "airdrop not working"
 * query family. Structure differs from the pair/alternative templates on
 * purpose: a genuinely useful ordered fix list first (that's what the
 * searcher came for), then the honest "when it's not you" pivot for the
 * Android/Windows case. Localized ×13 via "airdropFix"; FAQPage JSON-LD.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "airdropFix" });
  const title = t("meta.title");
  const description = t("meta.description");
  return {
    title: { absolute: title },
    description,
    alternates: buildAlternates(locale, "/airdrop-not-working"),
    ...sharedOpenGraph(title, description, "/airdrop-not-working"),
  };
}

const FIX_ITEMS = ["0", "1", "2", "3", "4", "5", "6"] as const;
const HOW_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4"] as const;

export default async function AirdropNotWorkingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("airdropFix");

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((i) => ({
      "@type": "Question",
      name: t(`faq.items.${i}.q`),
      acceptedAnswer: {
        "@type": "Answer",
        text: t(`faq.items.${i}.a`),
      },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqLd).replace(/</g, "\\u003c"),
        }}
      />
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-24">
        {/* Hero */}
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {t("hero.eyebrow")}
        </p>
        <h1 className="mt-4 text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-balance">
          {t("hero.title")}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          {t.rich("hero.body", {
            strong: (chunks) => (
              <strong className="text-foreground">{chunks}</strong>
            ),
            highlight: (chunks) => (
              <span className="text-foreground">{chunks}</span>
            ),
          })}
        </p>
        <div className="mt-8">
          <HeroCta downloadLabel={t("hero.ctaPrimary")} />
        </div>

        {/* The 7 fixes — the content the searcher actually came for */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">
            {t("fixes.title")}
          </h2>
          <ol className="mt-5 space-y-4">
            {FIX_ITEMS.map((i) => (
              <li
                key={i}
                className="rounded-xl border border-border bg-card p-5"
              >
                <h3 className="font-semibold">{t(`fixes.items.${i}.h`)}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
                  {t(`fixes.items.${i}.b`)}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* When it's not you */}
        <section className="mt-14 rounded-xl border border-border bg-background-raised p-6">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">
            {t("why.title")}
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {t.rich("why.body", {
              strong: (chunks) => (
                <strong className="text-foreground">{chunks}</strong>
              ),
            })}
          </p>
        </section>

        {/* Plan B */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">
            {t("how.title")}
          </h2>
          <ul className="mt-5 space-y-4">
            {HOW_ITEMS.map((i) => (
              <li
                key={i}
                className="rounded-xl border border-border bg-card p-5"
              >
                <h3 className="font-semibold">{t(`how.items.${i}.h`)}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
                  {t(`how.items.${i}.b`)}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <StoreButtons />
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">
            {t("faq.title")}
          </h2>
          <div className="mt-5 space-y-3">
            {FAQ_ITEMS.map((i) => (
              <details
                key={i}
                className="group rounded-xl border border-border bg-card p-5"
              >
                <summary className="cursor-pointer list-none font-medium marker:content-['']">
                  {t(`faq.items.${i}.q`)}
                </summary>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                  {t(`faq.items.${i}.a`)}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 rounded-xl border border-border bg-card p-8 text-center">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">
            {t("cta.title")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            {t("cta.body")}
          </p>
          <div className="mt-6 flex justify-center">
            <VButton href="/download" size="lg">
              {t("cta.download")}
              <ArrowRight className="h-4 w-4" />
            </VButton>
          </div>
          <div className="mt-5 flex justify-center">
            <StoreButtons />
          </div>
        </section>
        <RelatedLinks current="/airdrop-not-working" />
      </main>

      <SiteFooter />
    </div>
  );
}
