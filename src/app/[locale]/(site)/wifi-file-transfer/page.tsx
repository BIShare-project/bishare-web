import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/i18n/metadata";
import { sharedOpenGraph, pageUrl } from "@/lib/og";
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
import { NearbyEmbed } from "@/components/site/nearby-embed";
import { ArrowRight, Check, X } from "lucide-react";
import { guideLinks } from "@/components/site/guide-links";

/**
 * "Share by wifi" / "wifi file transfer" — about 4,000 US searches a month
 * across its spellings (Semrush, October 2026: share by wifi 1,600, share
 * with wifi 1,000, wifi file transfer 170, and a dozen at 90–140), keyword
 * difficulty 30–60. The first page is tools (ShareDrop, shareviawifi.com,
 * Send Anywhere, two Play Store apps) plus one 2024 Filemail article that
 * still calls Phone Link "Your Phone" and never mentions Quick Share, guest
 * networks or speed.
 *
 * So, like /airdrop-online, this page carries the tool itself (NearbyEmbed,
 * started on a click) and then answers what the tool pages do not: what
 * "over Wi-Fi" actually covers, how fast it is, why Windows Nearby sharing
 * so often lands on Bluetooth, and why two devices on one Wi-Fi cannot see
 * each other.
 *
 * Neighbours: /send-files-without-internet owns "no internet" and
 * /airdrop-online owns "in a browser"; this one owns "over Wi-Fi" and links
 * to both.
 *
 * Content lives in the "wifiTransfer" namespace, 13 locales. Speeds are our
 * own measurements (same table as /airdrop-for-windows). Bump LAST_UPDATED
 * when the Microsoft, Google and Apple pages are re-read.
 */

const SLUG = "/wifi-file-transfer";
const NS = "wifiTransfer";
const LAST_UPDATED = "2026-10-03";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const MEANING_ITEMS = ["0", "1", "2"] as const;
const SPEED_ROWS = ["r0", "r1", "r2", "r3", "r4"] as const;
const SPEED_ITEMS = ["0", "1", "2"] as const;
const TOOL_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const STEP_ITEMS = ["0", "1", "2", "3"] as const;
const HIDDEN_ITEMS = ["0", "1", "2", "3"] as const;
const SITUATION_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Comparison truth table. Columns: BIShare · LocalSend · PairDrop · AirDrop
   · Quick Share · Nearby sharing, as of 3 October 2026; table.note carries
   the conditions behind the ticks and crosses. */
const APPS = ["bishare", "localsend", "pairdrop", "airdrop", "quickshare", "nearby"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // any mix of platforms · no internet · no router or hotspot
  // · nothing to install · reaches another network
  { id: "r0", v: [true, true, true, false, false, false] },
  { id: "r1", v: [true, true, false, true, true, true] },
  { id: "r2", v: [false, false, false, true, true, true] },
  { id: "r3", v: [true, false, true, true, true, true] },
  { id: "r4", v: [true, false, true, false, false, false] },
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

export default async function WifiFileTransferPage({
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

  const selfUrl = pageUrl(SLUG, locale);

  const listLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("tools.title"),
    itemListElement: TOOL_ITEMS.map((i, n) => ({
      "@type": "ListItem",
      position: n + 1,
      name: t(`tools.items.${i}.name`),
      description: t(`tools.items.${i}.tag`),
      // Each entry needs an address of its own: the anchor on its card below.
      url: `${selfUrl}#item-${n + 1}`,
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
    url: selfUrl,
    dateModified: LAST_UPDATED,
    isPartOf: { "@type": "WebSite", name: "BIShare", url: "https://bishare.app" },
  };

  return (
    <div className="min-h-screen bg-background">
      {[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "WiFi file transfer")].map((ld, i) => (
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

            {/* The tool itself — started on a click, see NearbyEmbed. */}
            <section
              className="mt-8 rounded-xl border border-accent-blue/40 bg-card p-5 sm:p-6"
              aria-labelledby="try"
            >
              <H2 id="try">{t("try.title")}</H2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                {t("try.body")}
              </p>
              <NearbyEmbed
                labels={{
                  start: t("try.start"),
                  note: t("try.note"),
                  full: t("try.full"),
                  off: t("try.off"),
                }}
              />
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

            {/* What "over Wi-Fi" means */}
            <section className="mt-14">
              <H2 id="meaning">{t("meaning.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t("meaning.body")}
              </p>
              <LandingArt
                slug={SLUG}
                name="paths"
                locale={locale}
                alt={t("art.paths.alt")}
                width={1200}
                height={600}
                zoomHint={chrome("imageZoom")}
                className="mt-6"
              />
              <ProseList
                items={MEANING_ITEMS}
                head={(i) => t(`meaning.items.${i}.h`)}
                body={(i) => t(`meaning.items.${i}.b`)}
              />
            </section>

            {/* Speed */}
            <section className="mt-14">
              <H2 id="speed">{t("speed.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t("speed.body")}
              </p>
              <div className="mt-5 overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background-raised text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">{t("speed.cols.link")}</th>
                      <th className="px-4 py-3 font-medium">{t("speed.cols.rate")}</th>
                      <th className="px-4 py-3 font-medium">{t("speed.cols.time")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SPEED_ROWS.map((r) => (
                      <tr key={r} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 text-foreground">
                          {t(`speed.rows.${r}.link`)}
                        </td>
                        <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                          {t(`speed.rows.${r}.rate`)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {t(`speed.rows.${r}.time`)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {t("speed.note")}
              </p>
              <LandingArt
                slug={SLUG}
                name="speed"
                locale={locale}
                alt={t("art.speed.alt")}
                width={1200}
                height={600}
                zoomHint={chrome("imageZoom")}
                className="mt-6"
              />
              <ProseList
                items={SPEED_ITEMS}
                head={(i) => t(`speed.items.${i}.h`)}
                body={(i) => t(`speed.items.${i}.b`)}
              />
            </section>

            {/* The six tools */}
            <section className="mt-14">
              <H2 id="tools">{t("tools.title")}</H2>
              <div className="mt-6 space-y-8">
                {TOOL_ITEMS.map((i, n) => (
                  <div
                    key={i}
                    id={`item-${n + 1}`}
                    className="scroll-mt-28 border-b border-border pb-8 last:border-0 last:pb-0"
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-sm font-semibold text-accent-blue">
                        {String(n + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold">
                          {t(`tools.items.${i}.name`)}
                        </h3>
                        <p className="mt-0.5 text-sm font-medium text-accent-blue">
                          {t(`tools.items.${i}.tag`)}
                        </p>
                        <p className="mt-3 font-mono text-[12px] leading-relaxed text-muted-foreground">
                          {t(`tools.items.${i}.facts`)}
                        </p>
                        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                          {t.rich(`tools.items.${i}.body`, links)}
                        </p>
                        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {t("tools.consLabel")}
                          </span>{" "}
                          {t.rich(`tools.items.${i}.cons`, links)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Comparison table */}
            <section className="mt-14">
              <H2 id="compare">{t("table.title")}</H2>
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

            {/* Step by step */}
            <section className="mt-14">
              <H2 id="steps">{t("steps.title")}</H2>
              <ProseList
                items={STEP_ITEMS}
                head={(i) => t(`steps.items.${i}.h`)}
                body={(i) => t.rich(`steps.items.${i}.b`, links)}
              />
            </section>

            {/* Devices cannot see each other */}
            <section className="mt-14">
              <H2 id="not-found">{t("hidden.title")}</H2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t("hidden.body")}
              </p>
              <ProseList
                items={HIDDEN_ITEMS}
                head={(i) => t(`hidden.items.${i}.h`)}
                body={(i) => t(`hidden.items.${i}.b`)}
              />
            </section>

            {/* Situations */}
            <section className="mt-14">
              <H2 id="situations">{t("situations.title")}</H2>
              <LandingArt
                slug={SLUG}
                name="choose"
                locale={locale}
                alt={t("art.choose.alt")}
                width={1200}
                height={860}
                zoomHint={chrome("imageZoom")}
                className="mt-6"
              />
              <ProseList
                items={SITUATION_ITEMS}
                head={(i) => t(`situations.items.${i}.h`)}
                body={(i) => t.rich(`situations.items.${i}.b`, links)}
              />
            </section>

            {/* Security */}
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
                <VButton href="/transfer" size="lg">
                  {t("try.full")}
                  <ArrowRight className="h-4 w-4" />
                </VButton>
                <VButton href="/download" size="lg" variant="secondary">
                  {t("cta.download")}
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
