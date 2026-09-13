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

/**
 * "AirDrop for Android" — the SERP mixes 2024 listicles that still say Android
 * cannot AirDrop (AirDroid, Wondershare), rollout news (9to5Google, MacRumors,
 * TechRadar) and Play Store apps borrowing the AirDrop name.
 *
 * Since November 2025 Quick Share speaks AirDrop on a growing list of phones,
 * so this page checks the list, sets up both devices, states what the bridge
 * still misses (Everyone for 10 Minutes only, nearby only, listed phones) and
 * ranks six routes for every other Android phone.
 *
 * Content lives in the "airdrop" namespace, 13 locales. Bump LAST_UPDATED
 * when Google's Quick Share with iPhone list or the visibility modes change.
 */

const SLUG = "/airdrop-for-android";
const NS = "airdrop";
const LAST_UPDATED = "2026-09-13";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const MEANING_ITEMS = ["0", "1", "2"] as const;
const PHONE_ITEMS = ["0", "1", "2", "3"] as const;
const SETUP_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const ANDROID_ITEMS = ["0", "1", "2"] as const;
const LIMIT_ITEMS = ["0", "1", "2", "3"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const FIX_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Comparison truth table. Columns: Quick Share with AirDrop, Quick Share QR
   code, BIShare, the open-source local app, PairDrop, Send Anywhere.
   Conditions behind each cell are in table.note. */
const APPS = ["qsad", "qsqr", "bishare", "localsend", "pairdrop", "sendanywhere"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // any Android · nothing on iPhone · Windows/Linux · offline · iPhone to Android · built in
  { id: "r0", v: [false, true, true, true, true, true] },
  { id: "r1", v: [true, true, true, false, true, true] },
  { id: "r2", v: [false, false, true, true, true, true] },
  { id: "r3", v: [true, false, true, true, false, false] },
  { id: "r4", v: [true, false, true, true, true, true] },
  { id: "r5", v: [true, true, false, false, false, false] },
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

export default async function AirdropForAndroidPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations(NS);
  const chrome = await getTranslations("chrome");

  const tags = { strong, highlight };
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
      {[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "AirDrop for Android")].map(
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
              {t.rich("hero.body", { strong, highlight })}
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
                    <span>{t.rich(`quick.items.${i}`, { strong })}</span>
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

            {/* Three meanings */}
            <section className="mt-14">
              <H2 id="meaning">{t("meaning.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t.rich("meaning.body", tags)}
              </p>
              <ProseList
                items={MEANING_ITEMS}
                head={(i) => t(`meaning.items.${i}.h`)}
                body={(i) => t.rich(`meaning.items.${i}.b`, tags)}
              />
            </section>

            {/* Which phones are listed */}
            <section className="mt-14">
              <H2 id="phones">{t("phones.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t.rich("phones.body", tags)}
              </p>
              <LandingArt
                slug={SLUG}
                name="phones"
                locale={locale}
                alt={t("art.phones.alt")}
                width={1200}
                height={600}
                zoomHint={chrome("imageZoom")}
                className="mt-6"
              />
              <ProseList
                items={PHONE_ITEMS}
                head={(i) => t(`phones.items.${i}.h`)}
                body={(i) => t.rich(`phones.items.${i}.b`, tags)}
              />
            </section>

            {/* Setup on both devices */}
            <section className="mt-14">
              <H2 id="setup">{t("setup.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t.rich("setup.body", tags)}
              </p>
              <LandingArt
                slug={SLUG}
                name="modes"
                locale={locale}
                alt={t("art.modes.alt")}
                width={1200}
                height={600}
                zoomHint={chrome("imageZoom")}
                className="mt-6"
              />
              <ProseList
                items={SETUP_ITEMS}
                head={(i) => t(`setup.items.${i}.h`)}
                body={(i) => t.rich(`setup.items.${i}.b`, tags)}
              />
            </section>

            {/* Quick Share without Apple devices */}
            <section className="mt-14">
              <H2 id="android">{t("android.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t.rich("android.body", tags)}
              </p>
              <ProseList
                items={ANDROID_ITEMS}
                head={(i) => t(`android.items.${i}.h`)}
                body={(i) => t.rich(`android.items.${i}.b`, tags)}
              />
            </section>

            {/* Limits of the bridge */}
            <section className="mt-14">
              <H2 id="limits">{t("limits.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t.rich("limits.body", tags)}
              </p>
              <ProseList
                items={LIMIT_ITEMS}
                head={(i) => t(`limits.items.${i}.h`)}
                body={(i) => t.rich(`limits.items.${i}.b`, tags)}
              />
            </section>

            {/* The alternatives */}
            <section className="mt-14">
              <H2 id="methods">{t("methods.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t.rich("methods.body", tags)}
              </p>
              <LandingArt
                slug={SLUG}
                name="fallback"
                locale={locale}
                alt={t("art.fallback.alt")}
                width={1200}
                height={600}
                zoomHint={chrome("imageZoom")}
                className="mt-6"
              />
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
                <table className="w-full min-w-[640px] text-sm">
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

            {/* Troubleshooting */}
            <section className="mt-14">
              <H2 id="fixes">{t("fixes.title")}</H2>
              <ProseList
                items={FIX_ITEMS}
                head={(i) => t(`fixes.items.${i}.h`)}
                body={(i) => t.rich(`fixes.items.${i}.b`, tags)}
              />
            </section>

            {/* Security */}
            <section className="mt-14">
              <H2 id="security">{t("security.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t.rich("security.body", tags)}
              </p>
              <ProseList
                items={SECURITY_ITEMS}
                head={(i) => t(`security.items.${i}.h`)}
                body={(i) => t.rich(`security.items.${i}.b`, tags)}
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
