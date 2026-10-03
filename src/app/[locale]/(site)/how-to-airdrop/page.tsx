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
 * "How to AirDrop" — the largest question cluster around AirDrop that we had
 * no page for. Semrush (US, October 2026): "how to airdrop" 9,900 a month at
 * keyword difficulty 27, "how to turn on airdrop" 8,100, "how to airdrop
 * photos" 2,400, Mac to iPhone 1,900, "where do airdrop photos go" 1,600,
 * "how to change airdrop name" about 5,000 across its spellings. The first
 * page is Apple Support twice, then ordinary how-to articles of 800 to 1,800
 * words (Asurion, Virgin Media, CNET, Verizon), none of which mention AirDrop
 * codes (iOS 26.2), the Android bridge or where received files are saved.
 *
 * The reader owns Apple devices, so the page teaches AirDrop properly and
 * only brings in BIShare where AirDrop stops: Windows, Linux, most Android
 * phones, someone far away. Fixes belong to /airdrop-not-working; this page
 * points there instead of repeating them.
 *
 * Content lives in the "howToAirdrop" namespace, 13 locales. Every step is
 * taken from Apple's iPhone and Mac User Guides, Apple Support article 119857
 * and Apple's platform security guide. Bump LAST_UPDATED when they are
 * re-read.
 */

const SLUG = "/how-to-airdrop";
const NS = "howToAirdrop";
const LAST_UPDATED = "2026-10-03";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const BASICS_ITEMS = ["0", "1", "2", "3"] as const;
const TURNON_ITEMS = ["0", "1", "2", "3"] as const;
const SEND_ITEMS = ["0", "1", "2", "3", "4"] as const;
const MAC_ITEMS = ["0", "1", "2", "3"] as const;
const RECEIVE_ITEMS = ["0", "1", "2", "3"] as const;
const STRANGER_ITEMS = ["0", "1", "2"] as const;
const SETTING_ITEMS = ["0", "1", "2", "3"] as const;
const REACH_ITEMS = ["0", "1", "2", "3"] as const;
const STEP_ITEMS = ["0", "1", "2"] as const;
const TROUBLE_ITEMS = ["0", "1", "2"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"] as const;

/* Reach table. Columns: AirDrop · BIShare, as of 3 October 2026;
   table.note carries the conditions behind the ticks and crosses. */
const APPS = ["airdrop", "bishare"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // built in · Apple to Apple · listed Android · other Android · Windows
  // · Linux · no internet · another city
  { id: "r0", v: [true, false] },
  { id: "r1", v: [true, true] },
  { id: "r2", v: [true, true] },
  { id: "r3", v: [false, true] },
  { id: "r4", v: [false, true] },
  { id: "r5", v: [false, true] },
  { id: "r6", v: [true, true] },
  { id: "r7", v: [false, true] },
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

export default async function HowToAirdropPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations(NS);
  const links = guideLinks();
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
    url: `https://bishare.app${SLUG}`,
    dateModified: LAST_UPDATED,
    isPartOf: { "@type": "WebSite", name: "BIShare", url: "https://bishare.app" },
  };

  return (
    <div className="min-h-screen bg-background">
      {[faqLd, pageLd, breadcrumbLd(SLUG, "How to AirDrop")].map((ld, i) => (
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

            {/* What it is and what it needs */}
            <section className="mt-14">
              <H2 id="basics">{t("basics.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t("basics.body")}
              </p>
              <ProseList
                items={BASICS_ITEMS}
                head={(i) => t(`basics.items.${i}.h`)}
                body={(i) => t(`basics.items.${i}.b`)}
              />
            </section>

            {/* Turn it on */}
            <section className="mt-14">
              <H2 id="turn-on">{t("turnon.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t("turnon.body")}
              </p>
              <LandingArt
                slug={SLUG}
                name="options"
                locale={locale}
                alt={t("art.options.alt")}
                width={1200}
                height={600}
                zoomHint={chrome("imageZoom")}
                className="mt-6"
              />
              <ProseList
                items={TURNON_ITEMS}
                head={(i) => t(`turnon.items.${i}.h`)}
                body={(i) => t(`turnon.items.${i}.b`)}
              />
            </section>

            {/* Send from iPhone or iPad */}
            <section className="mt-14">
              <H2 id="send">{t("send.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t("send.body")}
              </p>
              <ProseList
                items={SEND_ITEMS}
                head={(i) => t(`send.items.${i}.h`)}
                body={(i) => t(`send.items.${i}.b`)}
              />
            </section>

            {/* Mac */}
            <section className="mt-14">
              <H2 id="mac">{t("mac.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t("mac.body")}
              </p>
              <ProseList
                items={MAC_ITEMS}
                head={(i) => t(`mac.items.${i}.h`)}
                body={(i) => t(`mac.items.${i}.b`)}
              />
            </section>

            {/* Receive, and where files go */}
            <section className="mt-14">
              <H2 id="receive">{t("receive.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t("receive.body")}
              </p>
              <LandingArt
                slug={SLUG}
                name="landing"
                locale={locale}
                alt={t("art.landing.alt")}
                width={1200}
                height={640}
                zoomHint={chrome("imageZoom")}
                className="mt-6"
              />
              <ProseList
                items={RECEIVE_ITEMS}
                head={(i) => t(`receive.items.${i}.h`)}
                body={(i) => t(`receive.items.${i}.b`)}
              />
            </section>

            {/* Not in your contacts */}
            <section className="mt-14">
              <H2 id="not-in-contacts">{t("strangers.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t("strangers.body")}
              </p>
              <ProseList
                items={STRANGER_ITEMS}
                head={(i) => t(`strangers.items.${i}.h`)}
                body={(i) => t(`strangers.items.${i}.b`)}
              />
            </section>

            {/* Name, off switch and other settings */}
            <section className="mt-14">
              <H2 id="settings">{t("settings.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t("settings.body")}
              </p>
              <ProseList
                items={SETTING_ITEMS}
                head={(i) => t(`settings.items.${i}.h`)}
                body={(i) => t(`settings.items.${i}.b`)}
              />
            </section>

            {/* What it reaches */}
            <section className="mt-14">
              <H2 id="reach">{t("reach.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t("reach.body")}
              </p>
              <LandingArt
                slug={SLUG}
                name="reach"
                locale={locale}
                alt={t("art.reach.alt")}
                width={1200}
                height={620}
                zoomHint={chrome("imageZoom")}
                className="mt-6"
              />
              <ProseList
                items={REACH_ITEMS}
                head={(i) => t(`reach.items.${i}.h`)}
                body={(i) => t.rich(`reach.items.${i}.b`, links)}
              />
            </section>

            {/* Reach table */}
            <section className="mt-14">
              <H2 id="compare">{t("table.title")}</H2>
              <div className="mt-5 overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[460px] text-sm">
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
                      <tr key={r.id} className="border-b border-border last:border-0">
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

            {/* Sending to a device AirDrop cannot reach */}
            <section className="mt-14">
              <H2 id="steps">{t("steps.title")}</H2>
              <ProseList
                items={STEP_ITEMS}
                head={(i) => t(`steps.items.${i}.h`)}
                body={(i) => t.rich(`steps.items.${i}.b`, links)}
              />
            </section>

            {/* When it does not work */}
            <section className="mt-14">
              <H2 id="not-working">{t("trouble.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t.rich("trouble.body", links)}
              </p>
              <ProseList
                items={TROUBLE_ITEMS}
                head={(i) => t(`trouble.items.${i}.h`)}
                body={(i) => t(`trouble.items.${i}.b`)}
              />
            </section>

            {/* Safety */}
            <section className="mt-14">
              <H2 id="security">{t("security.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t("security.body")}
              </p>
              <ProseList
                items={SECURITY_ITEMS}
                head={(i) => t(`security.items.${i}.h`)}
                body={(i) => t(`security.items.${i}.b`)}
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
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <VButton href="/download" size="lg">
                  {t("cta.download")}
                  <ArrowRight className="h-4 w-4" />
                </VButton>
                <VButton href="/transfer" size="lg" variant="secondary">
                  {t("cta.transfer")}
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
