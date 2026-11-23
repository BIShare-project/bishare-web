import { JsonLd } from "@/ui/article";
import type { Child } from "@/jsx";
import type { Metadata } from "@/site/metadata";
import { getTranslations } from "@/i18n/translate";
import { type Article, faqPageLd, ArticleHead, HeroButtons, Art, Section, strong, highlight } from "@/ui/article";
import { Button } from "@/ui/button";
import { buildAlternates } from "@/i18n/metadata";
import { sharedOpenGraph } from "@/lib/og";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";
import { ImageLightbox } from "@/ui/image-lightbox";
import { SiteHeader } from "@/ui/header";
import { SiteFooter } from "@/ui/footer";
import { ArticleToc } from "@/ui/article-toc";
import { RelatedLinks } from "@/ui/related-links";
import { StoreButtons } from "@/ui/store-buttons";

const SLUG = "/clipboard-sync";
import { ArrowRight } from "@/ui/icons";
import { guideLinks } from "@/ui/guide-links";
import { APP_ID } from "@/lib/app-ld";

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

export async function generateMetadata({ locale }: { locale: string }): Promise<Metadata> {
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
  read: (i: string, k: "h" | "b") => Child;
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
function Bullets({ items, read }: { items: readonly string[]; read: (i: string) => Child }) {
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

export default async function ClipboardSyncPage({ locale }: { locale: string }) {
  const t = await getTranslations("clipboardSync");
  const links = guideLinks();
  const tags = { strong, highlight, ...links };
  const chrome = await getTranslations("chrome");
  const a: Article = { t, chrome, tags, locale, slug: SLUG };
  const tocLabel = chrome("toc.onThisPage");
  const rich = (key: string) => t.rich(key, { strong, ...links });
  const table = (ns: string, rows: readonly string[], n: number) =>
    rows.map((r) => Array.from({ length: n }, (_, j) => t(`${ns}.rows.${r}.${j}`)));
  const cols = (ns: string, n: number) => Array.from({ length: n }, (_, j) => t(`${ns}.cols.${j}`));

  const faqLd = faqPageLd(t, FAQ_ITEMS);

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
    about: { "@id": APP_ID },
  };

  return (
    <div className="min-h-screen bg-background">
      <JsonLd items={[faqLd, howToLd, pageLd, breadcrumbLd("/clipboard-sync", "Clipboard Sync")]} />
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-24">
        <div className="mx-auto max-w-3xl lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-[minmax(0,1fr)_230px] lg:gap-12">
        <article className="min-w-0 lg:max-w-3xl"><ArticleHead a={a} updated={LAST_UPDATED} />
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
        </section><HeroButtons a={a} />
            <Art a={a} name="hero" height={630} className="mt-10" />
{/* The angle: every built-in sync is gated on an account */}
        <Section a={a} id="loyalty">
          <p className="mt-4 leading-relaxed text-muted-foreground">{rich("loyalty.intro")}</p>
          <Bullets items={LOYALTY_ITEMS} read={(i) => rich(`loyalty.items.${i}`)} />
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">{t("loyalty.note")}</p><Art a={a} name="gates" height={640} className="mt-8" />
            </Section>

        <Section a={a} id="table">
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("table.intro")}</p>
          <DataTable cols={cols("table", 5)} rows={table("table", TABLE_ROWS, 5)} minWidth={760} />
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t("table.note")}</p><Art a={a} name="reach" height={560} className="mt-8" />
            </Section>

        <Section a={a} id="setup">
          <p className="mt-3 leading-relaxed text-muted-foreground">{t("setup.intro")}</p>
          <HeadedList items={SETUP_ITEMS} numbered read={(i, k) => t(`setup.items.${i}.${k}`)} />
            </Section>

        <Section a={a} id="what">
          <Bullets items={WHAT_ITEMS} read={(i) => rich(`what.items.${i}`)} />
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">{rich("what.note")}</p>
            </Section>

        <Section a={a} id="pairs">
          <p className="mt-3 leading-relaxed text-muted-foreground">{t("pairs.intro")}</p>
          <ul className="mt-6 space-y-7">
            {PAIR_ITEMS.map((i) => (
              <li key={i}>
                <h3 className="font-semibold">{t(`pairs.items.${i}.h`)}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">{rich(`pairs.items.${i}.b`)}</p>
              </li>
            ))}
          </ul>
            </Section>

        <Section a={a} id="privacy" lead>
          <Bullets items={PRIVACY_ITEMS} read={(i) => rich(`privacy.items.${i}`)} />
          {/* Said in its own box, not buried in a bullet: the traffic on the
              network is not encrypted yet, and a reader would otherwise take
              "nothing is uploaded" to mean more than it does. */}
          <p className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-5 text-[15px] leading-relaxed text-amber-700 dark:text-amber-300">
            {rich("privacy.warning")}
          </p>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">{rich("privacy.note")}</p>
            </Section>

        <Section a={a} id="fixes">
          <p className="mt-3 leading-relaxed text-muted-foreground">{t("fixes.intro")}</p>
          <Bullets items={FIX_ITEMS} read={(i) => rich(`fixes.items.${i}`)} />
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">{rich("fixes.note")}</p>
            </Section>

        <Section a={a} id="daily">
          <p className="mt-3 leading-relaxed text-muted-foreground">{t("daily.intro")}</p>
          <HeadedList items={DAILY_ITEMS} read={(i, k) => t(`daily.items.${i}.${k}`)} />
            </Section>

        <Section a={a} id="alternatives">
          <ul className="mt-6 space-y-7">
            {ALT_ITEMS.map((i) => (
              <li key={i}>
                <h3 className="font-semibold">{t(`alternatives.items.${i}.h`)}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">{rich(`alternatives.items.${i}.b`)}</p>
              </li>
            ))}
          </ul>
            </Section>

        <Section a={a} id="faq">
          <div className="mt-6 space-y-6">
            {FAQ_ITEMS.map((i) => (
              <details key={i} className="group rounded-xl border border-border bg-card p-5">
                <summary className="cursor-pointer list-none font-medium marker:content-['']">{t(`faq.items.${i}.q`)}</summary>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{t(`faq.items.${i}.a`)}</p>
              </details>
            ))}
          </div>
            </Section>

        <section className="mt-16 rounded-xl border border-border bg-card p-8 text-center">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">{t("cta.title")}</h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">{t("cta.body")}</p>
          <div className="mt-6 flex justify-center">
            <Button href="/download" size="lg">
              {t("hero.ctaPrimary")}
              <ArrowRight className="h-4 w-4" />
            </Button>
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
