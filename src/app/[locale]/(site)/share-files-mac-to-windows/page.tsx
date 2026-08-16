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
import { ArrowRight, Check, X } from "lucide-react";

/**
 * High-intent SEO landing targeting "AirDrop for Windows" / "AirDrop for PC" and
 * the cluster of iPhone/Mac ↔ Windows transfer queries. Fully localized across
 * all 13 locales via the "macToWindows" namespace, with FAQPage structured
 * data for long-tail snippets. Sibling of /airdrop-for-android (same template).
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "macToWindows" });
  const title = t("meta.title");
  const description = t("meta.description");
  return {
    title: { absolute: title },
    description,
    alternates: buildAlternates(locale, "/share-files-mac-to-windows"),
    ...sharedOpenGraph(title, description, "/share-files-mac-to-windows"),
  };
}

/* Row ids carry the Check/X truth table; labels come from the namespace.
   Middle column = Nearby Share (Windows) — labelled via comparison.cols.quick. */
const COMPARISON: Array<{
  id: string;
  airdrop: boolean;
  quick: boolean;
  bishare: boolean;
}> = [
  { id: "r0", airdrop: false, quick: false, bishare: true },
  { id: "r1", airdrop: false, quick: false, bishare: true },
  { id: "r2", airdrop: false, quick: false, bishare: true },
  { id: "r3", airdrop: true, quick: false, bishare: true },
  { id: "r4", airdrop: true, quick: true, bishare: true },
];

const HOW_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4"] as const;

function Cell({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return ok ? (
    <Check className="mx-auto h-4 w-4 text-success" aria-label={yes} />
  ) : (
    <X className="mx-auto h-4 w-4 text-muted-foreground/50" aria-label={no} />
  );
}

export default async function ShareFilesMacToWindowsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("macToWindows");

  const yes = t("a11y.yes");
  const no = t("a11y.no");

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
        <div className="mt-6">
          <StoreButtons />
        </div>

        {/* Why AirDrop can't reach Windows */}
        <section className="mt-16">
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

        {/* How BIShare bridges it */}
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
        </section>

        {/* Comparison */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">
            {t("comparison.title")}
          </h2>
          <div className="mt-5 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background-raised text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium"> </th>
                  <th className="px-4 py-3 font-medium">
                    {t("comparison.cols.airdrop")}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {t("comparison.cols.quick")}
                  </th>
                  <th className="px-4 py-3 font-semibold text-foreground">
                    {t("comparison.cols.bishare")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 text-foreground">
                      {t(`comparison.rows.${r.id}`)}
                    </td>
                    <td className="px-4 py-3">
                      <Cell ok={r.airdrop} yes={yes} no={no} />
                    </td>
                    <td className="px-4 py-3">
                      <Cell ok={r.quick} yes={yes} no={no} />
                    </td>
                    <td className="px-4 py-3">
                      <Cell ok={r.bishare} yes={yes} no={no} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        <RelatedLinks current="/share-files-mac-to-windows" />
      </main>

      <SiteFooter />
    </div>
  );
}
