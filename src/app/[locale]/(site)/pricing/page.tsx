// /pricing — the answer is "nothing", and that is worth a page of its own.
//
// "<product> pricing" is one of the highest-intent queries there is: the person
// is comparing costs right now. Every competitor answers it with a table of
// tiers. Answering it with $0, the reason it can be $0, and what the paid
// alternatives charge is the strongest thing this site can say — so this page
// is indexed, unlike the old dark-launched version that carried a robots block
// while paid tiers were still hypothetical. There are none, and none planned.
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/i18n/metadata";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Section } from "@/components/site/section";
import { FadeUp } from "@/components/site/motion";
import { VButton } from "@/components/site/vbutton";
import { WebQuickCta } from "@/components/site/web-quick-cta";
import { RelatedLinks } from "@/components/site/related-links";
import { sharedOpenGraph } from "@/lib/og";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";
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
    ...sharedOpenGraph(t("meta.ogTitle"), description, "/pricing"),
  };
}

const INCLUDED_KEYS = [
  "network",
  "e2e",
  "links",
  "expire",
  "rooms",
  "platforms",
  "source",
] as const;

/** What the alternatives charge, so the $0 has something to sit next to. */
const COMPARE_KEYS = ["wetransfer", "smash", "dropbox", "bishare"] as const;

const FAQ_KEYS = ["why", "catch", "limits", "later"] as const;

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pricing");

  // Both blocks are the page's own claims, marked up so they can be quoted
  // directly in results.
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbLd("/pricing", t("meta.title")),
      {
        "@type": "FAQPage",
        mainEntity: FAQ_KEYS.map((k) => ({
          "@type": "Question",
          name: t(`faq.${k}.q`),
          acceptedAnswer: { "@type": "Answer", text: t(`faq.${k}.a`) },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(ld).replace(/</g, "\\u003c"),
        }}
      />
      <SiteHeader />
      <main>
        <Section className="border-b border-border pt-24 pb-16 text-center">
          <FadeUp>
            <p className="mb-5 inline-flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-[2px] bg-accent-blue" aria-hidden />
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

        <Section className="pb-14">
          <FadeUp className="mx-auto max-w-xl">
            <div className="rounded-xl border border-border bg-card p-8">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-semibold tracking-[-0.03em]">$0</span>
                <span className="text-sm text-muted-foreground">{t("priceNote")}</span>
              </div>
              <ul className="mt-7 space-y-3">
                {INCLUDED_KEYS.map((key) => (
                  <li key={key} className="flex items-start gap-3 text-[15px] leading-relaxed">
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

        {/* The number means little alone; next to what the alternatives ask for
            it becomes the argument. */}
        <Section className="border-t border-border py-14">
          <FadeUp>
            <h2 className="text-center text-2xl font-semibold tracking-[-0.02em]">
              {t("compare.title")}
            </h2>
            <div className="mx-auto mt-7 max-w-2xl overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2.5 pr-4 font-medium">{t("compare.colService")}</th>
                    <th className="py-2.5 pr-4 font-medium">{t("compare.colFree")}</th>
                    <th className="py-2.5 font-medium">{t("compare.colPaid")}</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_KEYS.map((k) => (
                    <tr
                      key={k}
                      className={`border-b border-border/60 ${
                        k === "bishare" ? "font-semibold text-foreground" : ""
                      }`}
                    >
                      <td className="py-3 pr-4">{t(`compare.rows.${k}.name`)}</td>
                      <td className="py-3 pr-4">{t(`compare.rows.${k}.free`)}</td>
                      <td className="py-3">{t(`compare.rows.${k}.paid`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-muted-foreground">{t("compare.note")}</p>
            </div>
          </FadeUp>
        </Section>

        <Section className="border-t border-border py-14">
          <FadeUp>
            <h2 className="text-center text-2xl font-semibold tracking-[-0.02em]">
              {t("faq.title")}
            </h2>
            <dl className="mx-auto mt-8 max-w-2xl space-y-6">
              {FAQ_KEYS.map((k) => (
                <div key={k}>
                  <dt className="font-medium">{t(`faq.${k}.q`)}</dt>
                  <dd className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
                    {t(`faq.${k}.a`)}
                  </dd>
                </div>
              ))}
            </dl>
          </FadeUp>
          <div className="mx-auto max-w-2xl">
            <RelatedLinks current="pricing" />
          </div>
        </Section>
      </main>
      <WebQuickCta />
      <SiteFooter />
    </>
  );
}
