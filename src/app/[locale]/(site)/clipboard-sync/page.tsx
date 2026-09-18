import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/i18n/metadata";
import { sharedOpenGraph } from "@/lib/og";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";
import { LandingArt } from "@/components/site/landing-art";
import { ImageLightbox } from "@/components/site/image-lightbox";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { ArticleToc } from "@/components/site/article-toc";
import { RelatedLinks } from "@/components/site/related-links";
import { VButton } from "@/components/site/vbutton";
import { HeroCta } from "@/components/site/hero-cta";
import { StoreButtons } from "@/components/site/store-buttons";
import { Link } from "@/i18n/navigation";

const SLUG = "/clipboard-sync";
import { ArrowRight } from "lucide-react";
import { guideLinks } from "@/components/site/guide-links";

/**
 * "Clipboard sync" / "copy and paste between phone and PC", in all 13 locales
 * via the `clipboardSync` namespace.
 *
 * The competing results are how-to posts for one platform pair. The angle here
 * is the thing they share and none of them names: every built-in clipboard
 * sync is a feature of an account system, not of your network — Apple wants
 * one Apple Account, Windows a Microsoft account with the history in its
 * cloud, the keyboard options a Google sign-in, Pushbullet a subscription.
 * Every requirement in the copy is dated; bump `LAST_UPDATED` when they are
 * re-read.
 */

const LAST_UPDATED = "2026-09-18";
const FIRST_PUBLISHED = "2026-09-18";
const SITE = "https://bishare.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "clipboardSync" });
  const title = t("meta.title");
  const description = t("meta.description");
  return {
    title: { absolute: title },
    description,
    alternates: buildAlternates(locale, "/clipboard-sync"),
    ...sharedOpenGraph(title, description, SLUG, locale),
  };
}


const QUICK_ITEMS = ["0", "1", "2", "3"] as const;
const LOYALTY_ITEMS = ["0", "1", "2", "3", "4"] as const;
const TABLE_ROWS = ["0", "1", "2", "3", "4", "5"] as const;
const SETUP_ITEMS = ["0", "1", "2", "3"] as const;
const WHAT_ITEMS = ["0", "1", "2", "3"] as const;
const PAIR_ITEMS = ["0", "1", "2", "3", "4"] as const;
const PRIVACY_ITEMS = ["0", "1", "2", "3"] as const;
const FIX_ITEMS = ["0", "1", "2", "3", "4"] as const;
const DAILY_ITEMS = ["0", "1", "2", "3", "4"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

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
            <tr key={i} className={"border-b border-border last:border-0" + (r[0] === "BIShare" ? " bg-primary/[0.04]" : "")}>
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

/** A numbered or headed list of {h, b} entries — used by four sections. */
function HeadedList({
  items,
  read,
  numbered = false,
}: {
  items: readonly string[];
  read: (i: string, k: "h" | "b") => React.ReactNode;
  numbered?: boolean;
}) {
  return (
    <ol className={numbered ? "mt-6 space-y-7" : "mt-6 space-y-7 list-none"}>
      {items.map((i, n) => (
        <li key={i} className={numbered ? "flex gap-4" : undefined}>
          {numbered && (
            <span className="font-mono text-sm font-semibold text-accent-blue">
              {String(n + 1).padStart(2, "0")}
            </span>
          )}
          <span>
            <h3 className="font-semibold">{read(i, "h")}</h3>
            <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">{read(i, "b")}</p>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Bulleted prose items, the shape most sections on this page use. */
function Bullets({ items, read }: { items: readonly string[]; read: (i: string) => React.ReactNode }) {
  return (
    <ul className="mt-6 space-y-4">
      {items.map((i) => (
        <li key={i} className="flex items-start gap-3 text-[15.5px] leading-relaxed text-muted-foreground">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-blue" aria-hidden />
          <span>{read(i)}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function ClipboardSyncPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("clipboardSync");
  const links = guideLinks();
  const chrome = await getTranslations("chrome");
  const tocLabel = chrome("toc.onThisPage");
  const rich = (key: string) => t.rich(key, { strong, ...links });
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
    name: t("setup.title"),
    step: SETUP_ITEMS.map((i, n) => ({
      "@type": "HowToStep",
      position: n + 1,
      name: t(`setup.items.${i}.h`),
      text: t(`setup.items.${i}.b`),
    })),
  };
  const pageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE}/clipboard-sync`,
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
      url: `${SITE}/download`,
    },
  };

  return (
    <div className="min-h-screen bg-background">
      {[faqLd, howToLd, pageLd, breadcrumbLd("/clipboard-sync", "Clipboard Sync")].map((ld, i) => (
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
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {t("hero.eyebrow")}
        </p>
        <h1 className="mt-4 text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-balance">
          {t("hero.title")}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          <time dateTime={LAST_UPDATED}>{t("updated")}</time>
        </p>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{rich("hero.body")}</p>

        <section className="mt-8 rounded-xl border border-border bg-card p-5 sm:p-6" aria-labelledby="quick-answer">
          <h2 id="quick-answer" className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {t("quick.title")}
          </h2>
          <ul className="mt-3 space-y-2.5">
            {QUICK_ITEMS.map((i) => (
              <li key={i} className="flex items-start gap-3 text-[15px] leading-relaxed text-muted-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-blue" aria-hidden />
                <span>{rich(`quick.items.${i}`)}</span>
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

        <LandingArt slug={SLUG} name="hero" locale={locale} alt={t("art.hero.alt")} width={1200} height={630} zoomHint={chrome("imageZoom")} className="mt-10" />

        {/* The angle: every built-in sync is gated on an account */}
        <section className="mt-14">
          <H2 id="loyalty">{t("loyalty.title")}</H2>
          <p className="mt-4 leading-relaxed text-muted-foreground">{rich("loyalty.intro")}</p>
          <Bullets items={LOYALTY_ITEMS} read={(i) => rich(`loyalty.items.${i}`)} />
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">{t("loyalty.note")}</p>
          <LandingArt slug={SLUG} name="gates" locale={locale} alt={t("art.gates.alt")} width={1200} height={640} zoomHint={chrome("imageZoom")} className="mt-8" />
        </section>

        <section className="mt-14">
          <H2 id="table">{t("table.title")}</H2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("table.intro")}</p>
          <DataTable cols={cols("table", 5)} rows={table("table", TABLE_ROWS, 5)} minWidth={760} />
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t("table.note")}</p>
          <LandingArt slug={SLUG} name="reach" locale={locale} alt={t("art.reach.alt")} width={1200} height={560} zoomHint={chrome("imageZoom")} className="mt-8" />
        </section>

        <section className="mt-14">
          <H2 id="setup">{t("setup.title")}</H2>
          <p className="mt-3 leading-relaxed text-muted-foreground">{t("setup.intro")}</p>
          <HeadedList items={SETUP_ITEMS} numbered read={(i, k) => t(`setup.items.${i}.${k}`)} />
        </section>

        <section className="mt-14">
          <H2 id="what">{t("what.title")}</H2>
          <Bullets items={WHAT_ITEMS} read={(i) => rich(`what.items.${i}`)} />
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">{rich("what.note")}</p>
        </section>

        <section className="mt-14">
          <H2 id="pairs">{t("pairs.title")}</H2>
          <p className="mt-3 leading-relaxed text-muted-foreground">{t("pairs.intro")}</p>
          <ul className="mt-6 space-y-7">
            {PAIR_ITEMS.map((i) => (
              <li key={i}>
                <h3 className="font-semibold">{t(`pairs.items.${i}.h`)}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">{rich(`pairs.items.${i}.b`)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14">
          <H2 id="privacy">{t("privacy.title")}</H2>
          <p className="mt-4 leading-relaxed text-muted-foreground">{t("privacy.body")}</p>
          <Bullets items={PRIVACY_ITEMS} read={(i) => rich(`privacy.items.${i}`)} />
          {/* Said in its own box, not buried in a bullet: the traffic on the
              network is not encrypted yet, and a reader would otherwise take
              "nothing is uploaded" to mean more than it does. */}
          <p className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-5 text-[15px] leading-relaxed text-amber-700 dark:text-amber-300">
            {rich("privacy.warning")}
          </p>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">{rich("privacy.note")}</p>
        </section>

        <section className="mt-14">
          <H2 id="fixes">{t("fixes.title")}</H2>
          <p className="mt-3 leading-relaxed text-muted-foreground">{t("fixes.intro")}</p>
          <Bullets items={FIX_ITEMS} read={(i) => rich(`fixes.items.${i}`)} />
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">{rich("fixes.note")}</p>
        </section>

        <section className="mt-14">
          <H2 id="daily">{t("daily.title")}</H2>
          <p className="mt-3 leading-relaxed text-muted-foreground">{t("daily.intro")}</p>
          <HeadedList items={DAILY_ITEMS} read={(i, k) => t(`daily.items.${i}.${k}`)} />
        </section>

        <section className="mt-14">
          <H2 id="alternatives">{t("alternatives.title")}</H2>
          <ul className="mt-6 space-y-7">
            {ALT_ITEMS.map((i) => (
              <li key={i}>
                <h3 className="font-semibold">{t(`alternatives.items.${i}.h`)}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">{rich(`alternatives.items.${i}.b`)}</p>
              </li>
            ))}
          </ul>
        </section>

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

        <section className="mt-16 rounded-xl border border-border bg-card p-8 text-center">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">{t("cta.title")}</h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">{t("cta.body")}</p>
          <div className="mt-6 flex justify-center">
            <VButton href="/download" size="lg">
              {t("hero.ctaPrimary")}
              <ArrowRight className="h-4 w-4" />
            </VButton>
          </div>
          <div className="mt-5 flex justify-center">
            <StoreButtons />
          </div>
        </section>

        <RelatedLinks current="/clipboard-sync" />
        </article>
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <ArticleToc selector="main article h2[id]" label={tocLabel} />
          </div>
        </aside>
        </div>
      </main>
      <SiteFooter />
      <ImageLightbox closeLabel={chrome("imageClose")} />
    </div>
  );
}
