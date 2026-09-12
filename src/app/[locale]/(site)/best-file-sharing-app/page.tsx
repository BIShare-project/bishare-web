import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/i18n/metadata";
import { sharedOpenGraph } from "@/lib/og";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { ArticleToc } from "@/components/site/article-toc";
import { RelatedLinks } from "@/components/site/related-links";
import { VButton } from "@/components/site/vbutton";
import { HeroCta } from "@/components/site/hero-cta";
import { StoreButtons } from "@/components/site/store-buttons";
import { ArrowRight, Check, X } from "lucide-react";

/**
 * "Best file sharing apps" buyer's guide — the page AI answers cite most and
 * the one that must earn its ranking honestly. Ten apps, each with its
 * platforms, free limit, encryption and account requirement as published in
 * September 2026, a criteria section, a situation-by-situation pick, and a
 * disclosure that we make BIShare. Fully localized via "bestApps"; carries
 * ItemList + FAQPage + WebPage (dateModified) structured data. Bump
 * `LAST_UPDATED` whenever the facts about other apps are re-checked.
 */

const LAST_UPDATED = "2026-09-12";
const FIRST_PUBLISHED = "2026-08-10";
const SITE = "https://bishare.app";

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

type App = "bishare" | "localsend" | "airdrop" | "pairdrop" | "quickshare" | "wetransfer" | "wormhole";
const APPS: App[] = ["bishare", "localsend", "airdrop", "pairdrop", "quickshare", "wetransfer", "wormhole"];

/* Truth table, checked September 2026 (see table.note in the namespace). */
const ROWS: Array<{ id: string; v: Record<App, boolean> }> = [
  { id: "r0", v: { bishare: true, localsend: true, airdrop: false, pairdrop: true, quickshare: false, wetransfer: true, wormhole: true } },
  { id: "r1", v: { bishare: true, localsend: true, airdrop: true, pairdrop: true, quickshare: true, wetransfer: false, wormhole: false } },
  { id: "r2", v: { bishare: true, localsend: false, airdrop: false, pairdrop: true, quickshare: false, wetransfer: true, wormhole: true } },
  { id: "r3", v: { bishare: true, localsend: true, airdrop: true, pairdrop: true, quickshare: false, wetransfer: false, wormhole: true } },
  { id: "r4", v: { bishare: true, localsend: false, airdrop: true, pairdrop: true, quickshare: false, wetransfer: true, wormhole: true } },
  { id: "r5", v: { bishare: true, localsend: true, airdrop: true, pairdrop: true, quickshare: false, wetransfer: true, wormhole: true } },
  { id: "r6", v: { bishare: true, localsend: true, airdrop: true, pairdrop: true, quickshare: true, wetransfer: false, wormhole: false } },
  { id: "r7", v: { bishare: true, localsend: true, airdrop: false, pairdrop: false, quickshare: false, wetransfer: false, wormhole: false } },
  { id: "r8", v: { bishare: true, localsend: true, airdrop: false, pairdrop: true, quickshare: false, wetransfer: false, wormhole: false } },
];

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5", "6"] as const;
const CRITERIA_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const LIST_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
const USE_CASE_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

const APP_URLS: Record<string, string> = {
  "0": `${SITE}`,
  "1": "https://localsend.org",
  "2": "https://support.apple.com/en-us/119857",
  "3": "https://pairdrop.net",
  "4": "https://www.android.com/better-together/quick-share-app/",
  "5": "https://wormhole.app",
  "6": "https://wetransfer.com",
  "7": "https://send-anywhere.com",
  "8": "https://drive.google.com",
  "9": "https://www.ushareit.com",
};

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

function Shot({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-border bg-card">
      <picture>
        <source srcSet={`${src}.webp`} type="image/webp" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${src}.jpg`} alt={alt} width={1400} height={800} loading="lazy" decoding="async" className="h-auto w-full" />
      </picture>
      <figcaption className="px-4 py-3 text-xs leading-relaxed text-muted-foreground">{alt}</figcaption>
    </figure>
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
  const chrome = await getTranslations("chrome");
  const tocLabel = chrome("toc.onThisPage");
  const yes = t("a11y.yes");
  const no = t("a11y.no");

  // ItemList → tells engines this page is a ranked list of named products.
  const listLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("hero.title"),
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: LIST_ITEMS.length,
    itemListElement: LIST_ITEMS.map((i, n) => ({
      "@type": "ListItem",
      position: n + 1,
      name: t(`list.items.${i}.name`),
      description: t(`list.items.${i}.tag`),
      url: APP_URLS[i],
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
    "@id": `${SITE}/best-file-sharing-app`,
    name: t("meta.title"),
    description: t("meta.description"),
    inLanguage: locale,
    datePublished: FIRST_PUBLISHED,
    dateModified: LAST_UPDATED,
  };

  return (
    <div className="min-h-screen bg-background">
      {[listLd, faqLd, pageLd, breadcrumbLd("/best-file-sharing-app", "Best file sharing apps")].map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }}
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
          {t.rich("hero.body", { strong })}
        </p>
        <p className="mt-4 rounded-xl border border-border bg-background-raised/60 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          {t("disclosure")}
        </p>

        {/* Quick answer */}
        <section className="mt-8 rounded-xl border border-border bg-card p-5 sm:p-6" aria-labelledby="quick-answer">
          <h2 id="quick-answer" className="scroll-mt-28 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {t("quick.title")}
          </h2>
          <ul className="mt-3 space-y-2.5">
            {QUICK_ITEMS.map((i) => (
              <li key={i} className="flex items-start gap-3 text-[15px] leading-relaxed text-muted-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-blue" aria-hidden />
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

        {/* How we judged */}
        <section className="mt-14">
          <H2 id="criteria">{t("criteria.title")}</H2>
          <div className="mt-6 space-y-7">
            {CRITERIA_ITEMS.map((i) => (
              <div key={i} >
                <h3 className="font-semibold">{t(`criteria.items.${i}.h`)}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">{t(`criteria.items.${i}.b`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* At a glance */}
        <section className="mt-14">
          <H2 id="glance">{t("table.title")}</H2>
          <div className="mt-5 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border bg-background-raised text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">{t("table.cols.feature")}</th>
                  {APPS.map((a) => (
                    <th key={a} className={a === "bishare" ? "px-3 py-3 font-semibold text-foreground" : "px-3 py-3 font-medium"}>
                      {t(`table.cols.${a}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-foreground">{t(`table.rows.${r.id}`)}</td>
                    {APPS.map((a) => (
                      <td key={a} className="px-3 py-3">
                        <Cell ok={r.v[a]} yes={yes} no={no} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t("table.note")}</p>
        </section>

        {/* The ten, ranked */}
        <section className="mt-14">
          <H2 id="ranking">{t("list.title")}</H2>
          <ol className="mt-6 space-y-7">
            {LIST_ITEMS.map((i, n) => (
              <li key={i} className="border-b border-border pb-8 last:border-0 last:pb-0">
                <div className="flex items-start gap-4">
                  <span className="font-mono text-sm font-semibold text-accent-blue">{String(n + 1).padStart(2, "0")}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold">{t(`list.items.${i}.name`)}</h3>
                    <p className="mt-0.5 text-sm font-medium text-accent-blue">{t(`list.items.${i}.tag`)}</p>
                    <p className="mt-3 font-mono text-[12px] leading-relaxed text-muted-foreground">{t(`list.items.${i}.facts`)}</p>
                    <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{t(`list.items.${i}.body`)}</p>
                    <p className="mt-3 text-[15px] leading-relaxed text-foreground">{t(`list.items.${i}.best`)}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      <span className="font-medium text-foreground">{t("list.consLabel")}</span> {t(`list.items.${i}.cons`)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Which app for which situation */}
        <section className="mt-14">
          <H2 id="situations">{t("useCases.title")}</H2>
          <div className="mt-6 space-y-7">
            {USE_CASE_ITEMS.map((i) => (
              <div key={i} >
                <h3 className="font-semibold">{t(`useCases.items.${i}.h`)}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">{t(`useCases.items.${i}.b`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why BIShare */}
        <section className="mt-14">
          <H2 id="why">{t("why.title")}</H2>
          <p className="mt-4 leading-relaxed text-muted-foreground">{t.rich("why.body", { strong })}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Shot src="/img/airdrop-windows/devices" alt={t("shots.devices")} />
            <Shot src="/img/send-large-files/transfer" alt={t("shots.transfer")} />
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-14">
          <H2 id="faq">{t("faq.title")}</H2>
          <div className="mt-6 space-y-6">
            {FAQ_ITEMS.map((i) => (
              <details key={i} className="group rounded-xl border border-border bg-card p-5">
                <summary className="cursor-pointer list-none font-medium marker:content-['']">{t(`faq.items.${i}.q`)}</summary>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{t(`faq.items.${i}.a`)}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 rounded-xl border border-border bg-card p-8 text-center">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">{t("cta.title")}</h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">{t("cta.body")}</p>
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
        </article>
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <ArticleToc selector="main article h2[id]" label={tocLabel} />
          </div>
        </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
