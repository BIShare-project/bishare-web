import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { VButton } from "@/components/site/vbutton";
import { HeroCta } from "@/components/site/hero-cta";
import { StoreButtons } from "@/components/site/store-buttons";
import { RelatedLinks } from "@/components/site/related-links";
import { ArticleToc } from "@/components/site/article-toc";
import { ArrowRight, Check, X } from "lucide-react";

/**
 * Shared article layout for every SEO landing except the three long guides
 * (/airdrop-for-windows, /send-large-files, /best-file-sharing-app), which
 * carry page-specific sections and render their own markup.
 *
 * Same shell as the blog: wide grid with a sticky table of contents on the
 * right, H2 ids with scroll-mt, prose instead of card grids, and a dated
 * "updated" line (chrome.updated) above the intro so freshness is visible to
 * readers and to WebPage/dateModified.
 *
 * Content comes from one message namespace — shape meta/hero/why/how/
 * comparison/faq/cta/a11y (see en/wetransferAlt.json). `cols` names the three
 * comparison columns inside that namespace; `rows` is the truth table, the
 * last column always being BIShare.
 */

const HOW_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4"] as const;

function Cell({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return ok ? (
    <Check className="mx-auto h-4 w-4 text-success" aria-label={yes} />
  ) : (
    <X className="mx-auto h-4 w-4 text-muted-foreground/50" aria-label={no} />
  );
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="scroll-mt-28 text-2xl font-semibold tracking-[-0.02em]"
    >
      {children}
    </h2>
  );
}

/** Route figure — one per landing, drawn by tool/landing-figures.mjs. */
function RouteFigure({ slug, caption }: { slug: string; caption: string }) {
  const src = `/img${slug}/route`;
  return (
    <figure className="mt-10 overflow-hidden rounded-xl border border-border bg-card">
      <picture>
        <source srcSet={`${src}.webp`} type="image/webp" />
        <Image
          src={`${src}.jpg`}
          alt={caption}
          width={1400}
          height={700}
          className="h-auto w-full"
        />
      </picture>
      <figcaption className="border-t border-border px-4 py-3 text-[13px] leading-relaxed text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}

const strong = (chunks: React.ReactNode) => (
  <strong className="text-foreground">{chunks}</strong>
);
const highlight = (chunks: React.ReactNode) => (
  <span className="text-foreground">{chunks}</span>
);

export async function ArticleLanding({
  namespace,
  slug,
  rows,
  cols = ["airdrop", "quick", "bishare"],
  lastUpdated = "2026-09-13",
  leadSections = [],
}: {
  namespace: string;
  slug: string;
  /** Comparison truth table; pass an empty array to drop the table. */
  rows: Array<{ id: string; c1: boolean; c2: boolean; c3: boolean }>;
  /** Extra prose list sections rendered between the hero and "why". */
  leadSections?: Array<{ id: string; key: string; count: number }>;
  /** Keys of comparison.cols for the two competitor columns and BIShare. */
  cols?: [string, string, string] | string[];
  /** ISO date behind the visible "updated" line and WebPage.dateModified. */
  lastUpdated?: string;
}) {
  const t = await getTranslations(namespace);
  const chrome = await getTranslations("chrome");
  const yes = t("a11y.yes");
  const no = t("a11y.no");

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((i) => ({
      "@type": "Question",
      name: t(`faq.items.${i}.q`),
      acceptedAnswer: { "@type": "Answer", text: t(`faq.items.${i}.a`) },
    })),
  };

  const pageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("meta.title"),
    description: t("meta.description"),
    url: `https://bishare.app${slug}`,
    dateModified: lastUpdated,
    isPartOf: { "@type": "WebSite", name: "BIShare", url: "https://bishare.app" },
  };

  return (
    <div className="min-h-screen bg-background">
      {[faqLd, pageLd].map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(ld).replace(/</g, "\\u003c"),
          }}
        />
      ))}
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-24">
        <div className="mx-auto max-w-3xl lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-[minmax(0,1fr)_230px] lg:gap-12">
          <article className="min-w-0 lg:max-w-3xl">
            {/* Hero */}
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {t("hero.eyebrow")}
            </p>
            <h1 className="mt-4 text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-balance">
              {t("hero.title")}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              <time dateTime={lastUpdated}>{chrome("updated")}</time>
            </p>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {t.rich("hero.body", { strong, highlight })}
            </p>
            <div className="mt-8">
              <HeroCta downloadLabel={t("hero.ctaPrimary")} />
            </div>
            <div className="mt-6">
              <StoreButtons />
            </div>

            <RouteFigure slug={slug} caption={chrome("figureCaption")} />

            {/* Page-specific prose sections (e.g. the seven fixes) */}
            {leadSections.map((sec) => (
              <section key={sec.id} className="mt-14">
                <H2 id={sec.id}>{t(`${sec.key}.title`)}</H2>
                <div className="mt-6 space-y-7">
                  {Array.from({ length: sec.count }, (_, n) => String(n)).map(
                    (i) => (
                      <div key={i}>
                        <h3 className="font-semibold">
                          {t(`${sec.key}.items.${i}.h`)}
                        </h3>
                        <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">
                          {t(`${sec.key}.items.${i}.b`)}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </section>
            ))}

            {/* Why */}
            <section className="mt-14">
              <H2 id="why">{t("why.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t.rich("why.body", { strong })}
              </p>
            </section>

            {/* How — prose, one paragraph per step */}
            <section className="mt-14">
              <H2 id="how">{t("how.title")}</H2>
              <div className="mt-6 space-y-7">
                {HOW_ITEMS.map((i) => (
                  <div key={i}>
                    <h3 className="font-semibold">{t(`how.items.${i}.h`)}</h3>
                    <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">
                      {t(`how.items.${i}.b`)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Comparison */}
            {rows.length > 0 && (
            <section className="mt-14">
              <H2 id="comparison">{t("comparison.title")}</H2>
              <div className="mt-5 overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background-raised text-muted-foreground">
                      <th className="px-4 py-3 text-left font-medium"> </th>
                      <th className="px-4 py-3 font-medium">
                        {t(`comparison.cols.${cols[0]}`)}
                      </th>
                      <th className="px-4 py-3 font-medium">
                        {t(`comparison.cols.${cols[1]}`)}
                      </th>
                      <th className="px-4 py-3 font-semibold text-foreground">
                        {t(`comparison.cols.${cols[2]}`)}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-3 text-foreground">
                          {t(`comparison.rows.${r.id}`)}
                        </td>
                        <td className="px-4 py-3">
                          <Cell ok={r.c1} yes={yes} no={no} />
                        </td>
                        <td className="px-4 py-3">
                          <Cell ok={r.c2} yes={yes} no={no} />
                        </td>
                        <td className="px-4 py-3">
                          <Cell ok={r.c3} yes={yes} no={no} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            )}

            {/* FAQ */}
            <section className="mt-14">
              <H2 id="faq">{t("faq.title")}</H2>
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

            {/* CTA — h2 without an id so it stays out of the contents list */}
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

            <RelatedLinks current={slug} />
          </article>

          {/* Sticky table of contents — desktop only; lists the H2 ids above. */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <ArticleToc
                selector="main article h2[id]"
                label={chrome("toc.onThisPage")}
              />
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
