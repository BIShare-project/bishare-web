import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/i18n/metadata";
import { sharedOpenGraph, SITE_URL } from "@/lib/og";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { RelatedLinks } from "@/components/site/related-links";
import { VButton } from "@/components/site/vbutton";
import { StoreButtons } from "@/components/site/store-buttons";
import { ArrowRight, Check, Minus, X } from "lucide-react";

/**
 * Flagship "best file sharing app" buyer's guide — the listicle + comparison
 * format that generative engines (ChatGPT, Perplexity, Gemini) and Google love
 * to cite for high-intent "best X" queries. Ranks the six tools people actually
 * search for, honestly, with BIShare on top for the both-jobs-in-one reason.
 * Fully localized via "bestApps"; carries ItemList + FAQPage structured data.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "bestApps" });
  const title = t("meta.title");
  const description = t("meta.description");
  return {
    title: { absolute: title },
    description,
    alternates: buildAlternates(locale, "/best-file-sharing-app"),
    ...sharedOpenGraph(title, description, "/best-file-sharing-app"),
  };
}

/* Columns, left→right. BIShare first so it anchors the eye; the truth table
   below is keyed by these ids. Values are deliberately honest — every rival
   gets the checks it genuinely earns. */
const APPS = ["bishare", "airdrop", "localsend", "snapdrop", "wetransfer", "shareit"] as const;
type App = (typeof APPS)[number];

const ROWS: Array<{ id: string; v: Record<App, boolean> }> = [
  { id: "r0", v: { bishare: true, airdrop: false, localsend: true, snapdrop: true, wetransfer: true, shareit: true } },
  { id: "r1", v: { bishare: true, airdrop: true, localsend: true, snapdrop: true, wetransfer: false, shareit: true } },
  { id: "r2", v: { bishare: true, airdrop: false, localsend: false, snapdrop: false, wetransfer: true, shareit: false } },
  { id: "r3", v: { bishare: true, airdrop: true, localsend: true, snapdrop: true, wetransfer: false, shareit: false } },
  { id: "r4", v: { bishare: true, airdrop: true, localsend: true, snapdrop: true, wetransfer: true, shareit: false } },
  { id: "r5", v: { bishare: true, airdrop: false, localsend: true, snapdrop: false, wetransfer: false, shareit: true } },
  { id: "r6", v: { bishare: true, airdrop: false, localsend: false, snapdrop: false, wetransfer: true, shareit: false } },
  { id: "r7", v: { bishare: true, airdrop: true, localsend: true, snapdrop: true, wetransfer: false, shareit: false } },
];

const LIST_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4"] as const;

function Cell({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return ok ? (
    <Check className="mx-auto h-4 w-4 text-success" aria-label={yes} />
  ) : (
    <X className="mx-auto h-4 w-4 text-muted-foreground/40" aria-label={no} />
  );
}

export default async function BestFileSharingAppPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("bestApps");

  const yes = t("a11y.yes");
  const no = t("a11y.no");

  // ItemList → tells engines this page is a ranked list of named products.
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("meta.title"),
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    url: `${SITE_URL}/best-file-sharing-app`,
    itemListElement: LIST_ITEMS.map((i) => ({
      "@type": "ListItem",
      position: Number(i) + 1,
      name: t(`list.items.${i}.name`),
      description: t(`list.items.${i}.tag`),
    })),
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((i) => ({
      "@type": "Question",
      name: t(`faq.items.${i}.q`),
      acceptedAnswer: { "@type": "Answer", text: t(`faq.items.${i}.a`) },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListLd).replace(/</g, "\\u003c"),
        }}
      />
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
          })}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <VButton href="/download" size="lg">
            {t("hero.ctaPrimary")}
            <ArrowRight className="h-4 w-4" />
          </VButton>
          <VButton href="/how-it-works" size="lg" variant="secondary">
            {t("hero.ctaSecondary")}
          </VButton>
        </div>
        <div className="mt-6">
          <StoreButtons />
        </div>

        {/* Lead */}
        <p className="mt-14 text-[15px] leading-relaxed text-muted-foreground">
          {t("lead")}
        </p>

        {/* Comparison table */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">
            {t("table.title")}
          </h2>
          <div className="mt-5 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border bg-background-raised text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">
                    {t("table.cols.feature")}
                  </th>
                  {APPS.map((app) => (
                    <th
                      key={app}
                      className={
                        app === "bishare"
                          ? "whitespace-nowrap px-4 py-3 font-semibold text-foreground"
                          : "whitespace-nowrap px-4 py-3 font-medium"
                      }
                    >
                      {t(`table.cols.${app}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 text-foreground">
                      {t(`table.rows.${r.id}`)}
                    </td>
                    {APPS.map((app) => (
                      <td
                        key={app}
                        className={
                          app === "bishare"
                            ? "bg-accent-blue/[0.06] px-4 py-3"
                            : "px-4 py-3"
                        }
                      >
                        <Cell ok={r.v[app]} yes={yes} no={no} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Ranked list */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">
            {t("list.title")}
          </h2>
          <ol className="mt-6 space-y-5">
            {LIST_ITEMS.map((i) => (
              <li
                key={i}
                className={
                  i === "0"
                    ? "rounded-2xl border border-accent-blue/40 bg-accent-blue/[0.05] p-6"
                    : "rounded-2xl border border-border bg-card p-6"
                }
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-sm text-muted-foreground">
                    {Number(i) + 1}
                  </span>
                  <h3 className="text-lg font-semibold tracking-[-0.01em]">
                    {t(`list.items.${i}.name`)}
                  </h3>
                </div>
                <p className="mt-1 text-sm font-medium text-accent-blue">
                  {t(`list.items.${i}.tag`)}
                </p>
                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                  {t(`list.items.${i}.body`)}
                </p>
                <p className="mt-3 flex items-start gap-2 text-[13px] text-muted-foreground/90">
                  <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0 -rotate-45" aria-hidden />
                  <span className="italic">{t(`list.items.${i}.best`)}</span>
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Why BIShare */}
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
        <RelatedLinks current="/best-file-sharing-app" />
      </main>

      <SiteFooter />
    </div>
  );
}
