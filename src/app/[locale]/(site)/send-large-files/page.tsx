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
import { Link } from "@/i18n/navigation";
import { ArrowRight, Check, X } from "lucide-react";

/**
 * High-intent SEO landing for "send large files (free)" and its size
 * long-tails (10 GB, 20 GB, over 25 MB by email), in all 13 locales via the
 * "largeFiles" namespace.
 *
 * The competing results are transfer services with a size cap in their title,
 * so this page leads with the number that beats them (100 GB, no account), a
 * dated table of every service's free limit, the file-size and upload-speed
 * arithmetic people are really asking about, and the walkthrough. Every
 * competitor figure is dated in the copy — bump `LAST_UPDATED` when they are
 * re-checked.
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
  const t = await getTranslations({ locale, namespace: "largeFiles" });
  const title = t("meta.title");
  const description = t("meta.description");
  return {
    title: { absolute: title },
    description,
    alternates: buildAlternates(locale, "/send-large-files"),
    ...sharedOpenGraph(title, description, "/send-large-files"),
  };
}

/* Row ids carry the Check/X truth table; labels come from the namespace. */
const COMPARISON: Array<{ id: string; airdrop: boolean; quick: boolean; bishare: boolean }> = [
  { id: "r0", airdrop: false, quick: false, bishare: true },
  { id: "r1", airdrop: false, quick: false, bishare: true },
  { id: "r2", airdrop: false, quick: false, bishare: true },
  { id: "r3", airdrop: true, quick: false, bishare: true },
  { id: "r4", airdrop: true, quick: true, bishare: true },
  { id: "r5", airdrop: false, quick: false, bishare: true },
  { id: "r6", airdrop: false, quick: true, bishare: true },
];

const QUICK_ITEMS = ["0", "1", "2", "3"] as const;
const STEP_ITEMS = ["0", "1", "2", "3"] as const;
const SIZE_ROWS = ["0", "1", "2", "3", "4", "5"] as const;
const LIMIT_ROWS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
const SPEED_ROWS = ["0", "1", "2", "3"] as const;
const WAY_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const SECURITY_ITEMS = ["0", "1", "2", "3"] as const;
const TIP_ITEMS = ["0", "1", "2", "3", "4"] as const;
const DEVICE_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"] as const;

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

/** A plain data table; the first column is the row label. */
function DataTable({ cols, rows, minWidth = 560 }: { cols: string[]; rows: string[][]; minWidth?: number }) {
  return (
    <div className="mt-5 overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-border bg-background-raised text-muted-foreground">
            {cols.map((c, i) => (
              <th key={i} className="px-4 py-3 text-left font-medium">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={"border-b border-border last:border-0" + (i === rows.length - 1 && r[0] === "BIShare" ? " bg-primary/[0.04]" : "")}>
              {r.map((cell, j) => (
                <td key={j} className={j === 0 ? "px-4 py-3 font-medium text-foreground" : "px-4 py-3 text-muted-foreground"}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function SendLargeFilesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("largeFiles");
  const chrome = await getTranslations("chrome");
  const tocLabel = chrome("toc.onThisPage");
  const yes = t("a11y.yes");
  const no = t("a11y.no");
  const table = (ns: string, rows: readonly string[], n: number) =>
    rows.map((r) => Array.from({ length: n }, (_, j) => t(`${ns}.rows.${r}.${j}`)));
  const cols = (ns: string, n: number) => Array.from({ length: n }, (_, j) => t(`${ns}.cols.${j}`));

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((i) => ({
      "@type": "Question",
      name: t(`faq.items.${i}.q`),
      acceptedAnswer: { "@type": "Answer", text: t(`faq.items.${i}.a`) },
    })),
  };
  const howToLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: t("steps.title"),
    step: STEP_ITEMS.map((i, n) => ({
      "@type": "HowToStep",
      position: n + 1,
      name: t(`steps.items.${i}.h`),
      text: t(`steps.items.${i}.b`),
    })),
  };
  const pageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE}/send-large-files`,
    name: t("meta.title"),
    description: t("meta.description"),
    inLanguage: locale,
    datePublished: FIRST_PUBLISHED,
    dateModified: LAST_UPDATED,
    about: {
      "@type": "SoftwareApplication",
      name: "BIShare",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web, Windows, macOS, Linux, iOS, Android",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      license: "https://opensource.org/licenses/MIT",
      url: `${SITE}/transfer`,
    },
  };

  return (
    <div className="min-h-screen bg-background">
      {[faqLd, howToLd, pageLd, breadcrumbLd("/send-large-files", "Send Large Files")].map((ld, i) => (
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
          {t.rich("hero.body", {
            strong,
            highlight: (chunks) => <span className="text-foreground">{chunks}</span>,
          })}
        </p>

        {/* Quick answer */}
        <section className="mt-8 rounded-xl border border-border bg-card p-5 sm:p-6" aria-labelledby="quick-answer">
          <h2 id="quick-answer" className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
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

        {/* Why it is still a pain */}
        <section className="mt-14">
          <H2 id="why">{t("why.title")}</H2>
          <p className="mt-4 leading-relaxed text-muted-foreground">{t.rich("why.body", { strong })}</p>
        </section>

        {/* Steps — the how-to, with the real screen */}
        <section className="mt-14">
          <H2 id="steps">{t("steps.title")}</H2>
          <p className="mt-3 leading-relaxed text-muted-foreground">{t("steps.intro")}</p>
          <ol className="mt-6 space-y-7">
            {STEP_ITEMS.map((i, n) => (
              <li key={i} className="flex gap-4">
                <span className="font-mono text-sm font-semibold text-accent-blue">{String(n + 1).padStart(2, "0")}</span>
                <span>
                  <h3 className="font-semibold">{t(`steps.items.${i}.h`)}</h3>
                  <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">{t(`steps.items.${i}.b`)}</p>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-6">
            <Shot src="/img/send-large-files/transfer" alt={t("shots.transfer")} />
          </div>
        </section>

        {/* How big is big */}
        <section className="mt-14">
          <H2 id="sizes">{t("sizes.title")}</H2>
          <p className="mt-3 leading-relaxed text-muted-foreground">{t("sizes.intro")}</p>
          <DataTable cols={cols("sizes", 4)} rows={table("sizes", SIZE_ROWS, 4)} />
        </section>

        {/* Free limits compared */}
        <section className="mt-14">
          <H2 id="limits">{t("limits.title")}</H2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("limits.intro")}</p>
          <DataTable cols={cols("limits", 5)} rows={table("limits", LIMIT_ROWS, 5)} minWidth={720} />
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t("limits.note")}</p>
        </section>

        {/* Speed */}
        <section className="mt-14">
          <H2 id="speed">{t("speed.title")}</H2>
          <p className="mt-4 leading-relaxed text-muted-foreground">{t("speed.body")}</p>
          <DataTable cols={cols("speed", 3)} rows={table("speed", SPEED_ROWS, 3)} />
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{t("speed.local")}</p>
          <p className="mt-3">
            <Link href="/blog/airdrop-for-windows-speeds" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-blue hover:underline">
              {t("speed.link")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </p>
        </section>

        {/* Every way, and when each fits */}
        <section className="mt-14">
          <H2 id="ways">{t("ways.title")}</H2>
          <ul className="mt-6 space-y-7">
            {WAY_ITEMS.map((i) => (
              <li key={i} >
                <h3 className="font-semibold">{t(`ways.items.${i}.h`)}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">{t(`ways.items.${i}.b`)}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Device-pair guides — the sibling landings, linked with their own anchor text */}
        <section className="mt-14">
          <H2 id="devices">{t("devices.title")}</H2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {DEVICE_ITEMS.map((i) => (
              <li key={i}>
                <Link
                  href={t(`devices.items.${i}.href`)}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-[15px] font-medium transition hover:border-foreground/25 hover:bg-muted/40"
                >
                  {t(`devices.items.${i}.h`)}
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("devices.note")}</p>
        </section>

        {/* Desktop shot — the nearby route */}
        <section className="mt-14">
          <Shot src="/img/airdrop-windows/send" alt={t("shots.send")} />
        </section>

        {/* Security */}
        <section className="mt-14">
          <H2 id="security">{t("security.title")}</H2>
          <ul className="mt-6 space-y-6">
            {SECURITY_ITEMS.map((i) => (
              <li key={i} className="flex items-start gap-3 text-[15px] leading-relaxed text-muted-foreground">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-background-raised text-foreground">
                  <Check className="h-3 w-3" />
                </span>
                <span>{t(`security.items.${i}`)}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Tips */}
        <section className="mt-14">
          <H2 id="tips">{t("tips.title")}</H2>
          <ul className="mt-6 space-y-6">
            {TIP_ITEMS.map((i) => (
              <li key={i} >
                <h3 className="font-semibold">{t(`tips.items.${i}.h`)}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">{t(`tips.items.${i}.b`)}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Comparison */}
        <section className="mt-14">
          <H2 id="comparison">{t("comparison.title")}</H2>
          <div className="mt-5 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border bg-background-raised text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium"> </th>
                  <th className="px-4 py-3 font-medium">{t("comparison.cols.airdrop")}</th>
                  <th className="px-4 py-3 font-medium">{t("comparison.cols.quick")}</th>
                  <th className="px-4 py-3 font-semibold text-foreground">{t("comparison.cols.bishare")}</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-foreground">{t(`comparison.rows.${r.id}`)}</td>
                    <td className="px-4 py-3"><Cell ok={r.airdrop} yes={yes} no={no} /></td>
                    <td className="px-4 py-3"><Cell ok={r.quick} yes={yes} no={no} /></td>
                    <td className="px-4 py-3"><Cell ok={r.bishare} yes={yes} no={no} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <VButton href="/transfer" size="lg">
              {t("hero.ctaSecondaryTransfer")}
              <ArrowRight className="h-4 w-4" />
            </VButton>
          </div>
          <div className="mt-5 flex justify-center">
            <StoreButtons />
          </div>
        </section>

        <RelatedLinks current="/send-large-files" />
        </article>
        {/* Sticky table of contents — desktop only; lists the H2 ids above. */}
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
