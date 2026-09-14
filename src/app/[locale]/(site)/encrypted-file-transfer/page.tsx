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
import { ArticleToc } from "@/components/site/article-toc";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";
import { LandingArt } from "@/components/site/landing-art";
import { ImageLightbox } from "@/components/site/image-lightbox";
import { ArrowRight, Check, X } from "lucide-react";
import { guideLinks } from "@/components/site/guide-links";

/**
 * "Encrypted file transfer" — the SERP is patent PDFs, vendor pages
 * (Dropbox, SendSafely, Filemail, Filot, DivShare) and a TechRadar roundup that
 * use "encrypted" for TLS, at-rest and end-to-end alike. None gives a reader a
 * way to tell them apart or says what end-to-end still leaves visible.
 *
 * This page separates the three kinds, gives a one-minute test, ranks seven
 * end-to-end methods, lists what encryption does not hide (BIShare's own link
 * metadata included) and documents BIShare's scheme from its public code.
 *
 * Content lives in the "encryptedTransfer" namespace, 13 locales. Bump
 * LAST_UPDATED when a listed service changes its encryption design.
 */

const SLUG = "/encrypted-file-transfer";
const NS = "encryptedTransfer";
const LAST_UPDATED = "2026-09-14";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const LEVELS_ITEMS = ["0", "1", "2", "3"] as const;
const TEST_ITEMS = ["0", "1", "2", "3", "4"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5", "6"] as const;
const METADATA_ITEMS = ["0", "1", "2", "3"] as const;
const BISHARE_ITEMS = ["0", "1", "2", "3"] as const;
const PASSWORD_ITEMS = ["0", "1", "2", "3"] as const;
const CHOOSE_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const MISTAKES_ITEMS = ["0", "1", "2", "3"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Comparison truth table. Columns: BIShare, Wormhole, Proton Drive, OnionShare,
   magic-wormhole, 7-Zip archive.
   Conditions behind each cell are in table.note. */
const APPS = ["bishare", "wormhole", "protondrive", "onionshare", "magicwormhole", "sevenzip"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // service cannot read · recipient installs nothing · sender can go offline · over 10 GB · hides sender · open-source client
  { id: "r0", v: [true, true, true, true, true, true] },
  { id: "r1", v: [true, true, true, false, false, false] },
  { id: "r2", v: [true, true, true, false, false, true] },
  { id: "r3", v: [true, false, false, true, true, true] },
  { id: "r4", v: [false, false, false, true, false, false] },
  { id: "r5", v: [true, false, true, true, true, true] },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: NS });
  const title = t("meta.title");
  const description = t("meta.description");
  return {
    title: { absolute: title },
    description,
    alternates: buildAlternates(locale, SLUG),
    ...sharedOpenGraph(title, description, SLUG, locale),
  };
}

function Cell({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return ok ? (
    <Check className="mx-auto h-4 w-4 text-success" aria-label={yes} />
  ) : (
    <X className="mx-auto h-4 w-4 text-muted-foreground/50" aria-label={no} />
  );
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-28 text-2xl font-semibold tracking-[-0.02em]">
      {children}
    </h2>
  );
}

const strong = (chunks: React.ReactNode) => (
  <strong className="text-foreground">{chunks}</strong>
);
const highlight = (chunks: React.ReactNode) => (
  <span className="text-foreground">{chunks}</span>
);

/** Prose list section — a heading and a paragraph per item. */
function ProseList({
  items,
  head,
  body,
}: {
  items: readonly string[];
  head: (i: string) => string;
  body: (i: string) => React.ReactNode;
}) {
  return (
    <div className="mt-6 space-y-7">
      {items.map((i) => (
        <div key={i}>
          <h3 className="font-semibold">{head(i)}</h3>
          <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">
            {body(i)}
          </p>
        </div>
      ))}
    </div>
  );
}

export default async function EncryptedTransferPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations(NS);
  const links = guideLinks();
  const chrome = await getTranslations("chrome");

  const tags = { strong, highlight, ...links };
  const yes = t("a11y.yes");
  const no = t("a11y.no");

  const listLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("methods.title"),
    itemListElement: ALT_ITEMS.map((i, n) => ({
      "@type": "ListItem",
      position: n + 1,
      name: t(`methods.items.${i}.name`),
      description: t(`methods.items.${i}.tag`),
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

  const pageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("meta.title"),
    description: t("meta.description"),
    url: `https://bishare.app${SLUG}`,
    dateModified: LAST_UPDATED,
    isPartOf: { "@type": "WebSite", name: "BIShare", url: "https://bishare.app" },
  };

  return (
    <div className="min-h-screen bg-background">
      {[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "Encrypted file transfer")].map(
        (ld, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(ld).replace(/</g, "\\u003c"),
            }}
          />
        )
      )}
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
              <time dateTime={LAST_UPDATED}>{t("updated")}</time>
            </p>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {t.rich("hero.body", { strong, highlight, ...links })}
            </p>
            <p className="mt-4 rounded-xl border border-border bg-background-raised/60 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {t("disclosure")}
            </p>

            {/* Quick answer */}
            <section
              className="mt-8 rounded-xl border border-border bg-card p-5 sm:p-6"
              aria-labelledby="quick-answer"
            >
              <h2
                id="quick-answer"
                className="scroll-mt-28 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
              >
                {t("quick.title")}
              </h2>
              <ul className="mt-3 space-y-2.5">
                {QUICK_ITEMS.map((i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-[15px] leading-relaxed text-muted-foreground"
                  >
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-blue"
                      aria-hidden
                    />
                    <span>{t.rich(`quick.items.${i}`, { strong, ...links })}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="mt-8">
              <HeroCta downloadLabel={t("hero.ctaPrimary")} />
            </div>
            <div className="mt-6">
              <StoreButtons />
            </div>

            <LandingArt
              slug={SLUG}
              name="hero"
              locale={locale}
              alt={t("art.hero.alt")}
              width={1200}
              height={630}
              zoomHint={chrome("imageZoom")}
              className="mt-8"
            />

            {/* Three kinds of encryption */}
            <section className="mt-14">
              <H2 id="levels">{t("levels.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t.rich("levels.body", tags)}
              </p>
              <LandingArt
                slug={SLUG}
                name="levels"
                locale={locale}
                alt={t("art.levels.alt")}
                width={1200}
                height={600}
                zoomHint={chrome("imageZoom")}
                className="mt-6"
              />
              <ProseList
                items={LEVELS_ITEMS}
                head={(i) => t(`levels.items.${i}.h`)}
                body={(i) => t.rich(`levels.items.${i}.b`, tags)}
              />
            </section>

            {/* How to tell */}
            <section className="mt-14">
              <H2 id="test">{t("test.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t.rich("test.body", tags)}
              </p>
              <LandingArt
                slug={SLUG}
                name="fragment"
                locale={locale}
                alt={t("art.fragment.alt")}
                width={1200}
                height={600}
                zoomHint={chrome("imageZoom")}
                className="mt-6"
              />
              <ProseList
                items={TEST_ITEMS}
                head={(i) => t(`test.items.${i}.h`)}
                body={(i) => t.rich(`test.items.${i}.b`, tags)}
              />
            </section>

            {/* The methods */}
            <section className="mt-14">
              <H2 id="methods">{t("methods.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t.rich("methods.body", tags)}
              </p>
              <div className="mt-6 space-y-8">
                {ALT_ITEMS.map((i, n) => (
                  <div
                    key={i}
                    className="border-b border-border pb-8 last:border-0 last:pb-0"
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-sm font-semibold text-accent-blue">
                        {String(n + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold">
                          {t(`methods.items.${i}.name`)}
                        </h3>
                        <p className="mt-0.5 text-sm font-medium text-accent-blue">
                          {t(`methods.items.${i}.tag`)}
                        </p>
                        <p className="mt-3 font-mono text-[12px] leading-relaxed text-muted-foreground">
                          {t(`methods.items.${i}.facts`)}
                        </p>
                        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                          {t.rich(`methods.items.${i}.body`, tags)}
                        </p>
                        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {t("methods.consLabel")}
                          </span>{" "}
                          {t(`methods.items.${i}.cons`)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Comparison table */}
            <section className="mt-14">
              <H2 id="glance">{t("table.title")}</H2>
              <div className="mt-5 overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background-raised text-muted-foreground">
                      <th className="px-4 py-3 text-left font-medium">
                        {t("table.cols.feature")}
                      </th>
                      {APPS.map((a) => (
                        <th
                          key={a}
                          className={`px-4 py-3 font-medium ${
                            a === "bishare" ? "font-semibold text-foreground" : ""
                          }`}
                        >
                          {t(`table.cols.${a}`)}
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
                        {r.v.map((ok, n) => (
                          <td key={n} className="px-4 py-3">
                            <Cell ok={ok} yes={yes} no={no} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {t("table.note")}
              </p>
            </section>

            {/* What stays visible */}
            <section className="mt-14">
              <H2 id="metadata">{t("metadata.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t.rich("metadata.body", tags)}
              </p>
              <LandingArt
                slug={SLUG}
                name="visible"
                locale={locale}
                alt={t("art.visible.alt")}
                width={1200}
                height={600}
                zoomHint={chrome("imageZoom")}
                className="mt-6"
              />
              <ProseList
                items={METADATA_ITEMS}
                head={(i) => t(`metadata.items.${i}.h`)}
                body={(i) => t.rich(`metadata.items.${i}.b`, tags)}
              />
            </section>

            {/* BIShare in detail */}
            <section className="mt-14">
              <H2 id="bishare">{t("bishare.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t.rich("bishare.body", tags)}
              </p>
              <ProseList
                items={BISHARE_ITEMS}
                head={(i) => t(`bishare.items.${i}.h`)}
                body={(i) => t.rich(`bishare.items.${i}.b`, tags)}
              />
            </section>

            {/* Sharing the secret */}
            <section className="mt-14">
              <H2 id="password">{t("password.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t.rich("password.body", tags)}
              </p>
              <ProseList
                items={PASSWORD_ITEMS}
                head={(i) => t(`password.items.${i}.h`)}
                body={(i) => t.rich(`password.items.${i}.b`, tags)}
              />
            </section>

            {/* Pick by situation */}
            <section className="mt-14">
              <H2 id="choose">{t("choose.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t.rich("choose.body", tags)}
              </p>
              <ProseList
                items={CHOOSE_ITEMS}
                head={(i) => t(`choose.items.${i}.h`)}
                body={(i) => t.rich(`choose.items.${i}.b`, tags)}
              />
            </section>

            {/* Mistakes */}
            <section className="mt-14">
              <H2 id="mistakes">{t("mistakes.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t.rich("mistakes.body", tags)}
              </p>
              <ProseList
                items={MISTAKES_ITEMS}
                head={(i) => t(`mistakes.items.${i}.h`)}
                body={(i) => t.rich(`mistakes.items.${i}.b`, tags)}
              />
            </section>

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

            <RelatedLinks current={SLUG} />
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
      <ImageLightbox closeLabel={chrome("imageClose")} />
    </div>
  );
}
