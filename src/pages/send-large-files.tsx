import { JsonLd, type Article, faqPageLd, ArticleHead, HeroButtons, Art, Section, Cell, strong, highlight } from "@/ui/article";
import type { Metadata } from "@/site/metadata";
import { getTranslations } from "@/i18n/translate";
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
import { Link } from "@/ui/link";
import { publishedSlugs } from "@/content/blog/registry";

const SPEED_POST = "airdrop-for-windows-speeds";
const SLUG = "/send-large-files";
import { ArrowRight, Check } from "@/ui/icons";
import { guideLinks } from "@/ui/guide-links";
import { APP_ID } from "@/lib/app-ld";

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

const LAST_UPDATED = "2026-10-17";
const FIRST_PUBLISHED = "2026-08-10";
const SITE = "https://bishare.app";

export async function generateMetadata({ locale }: { locale: string }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "largeFiles" });
  const title = t("meta.title");
  const description = t("meta.description");
  return {
    title: { absolute: title },
    description,
    alternates: buildAlternates(locale, "/send-large-files"),
    ...sharedOpenGraph(title, description, SLUG, locale),
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
const LIMIT_ROWS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] as const;
/* Privacy comparison (vendor pages read 2026-10-17, see privacy.note). */
const PRIVACY_ROWS = ["0", "1", "2", "3", "4", "5", "6"] as const;
const PRIVACY_ITEMS = ["0", "1", "2"] as const;
const HEADLINE_ITEMS = ["0", "1", "2", "3", "4"] as const;
const BYSIZE_ROWS = ["0", "1", "2", "3", "4", "5"] as const;
const EMAIL_ITEMS = ["0", "1", "2"] as const;
const PHONE_ITEMS = ["0", "1"] as const;
const FAILED_ITEMS = ["0", "1", "2", "3", "4"] as const;
const SPEED_ROWS = ["0", "1", "2", "3"] as const;
const WAY_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const SECURITY_ITEMS = ["0", "1", "2", "3"] as const;
const TIP_ITEMS = ["0", "1", "2", "3", "4"] as const;
const DEVICE_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const FAQ_ITEMS = ["0", "16", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "17"] as const;

function Shot({
  src,
  alt,
  width = 1400,
  height = 787,
}: {
  src: string;
  alt: string;
  /** Intrinsic size, so the browser reserves the right box before load. */
  width?: number;
  height?: number;
}) {
  return (
    <figure className="overflow-hidden rounded-xl border border-border bg-card">
      <picture>
        <source srcSet={`${src}.webp`} type="image/webp" />
        <img src={`${src}.jpg`} alt={alt} width={width} height={height} loading="lazy" decoding="async" className="h-auto w-full" />
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

export default async function SendLargeFilesPage({ locale }: { locale: string }) {
  const t = await getTranslations("largeFiles");
  const links = guideLinks();
  const tags = { strong, highlight, ...links };
  const chrome = await getTranslations("chrome");
  const a: Article = { t, chrome, tags, locale, slug: SLUG };
  const tocLabel = chrome("toc.onThisPage");
  const yes = t("a11y.yes");
  const no = t("a11y.no");
  const table = (ns: string, rows: readonly string[], n: number) =>
    rows.map((r) => Array.from({ length: n }, (_, j) => t.raw(`${ns}.rows.${r}.${j}`) as string));
  const cols = (ns: string, n: number) => Array.from({ length: n }, (_, j) => t(`${ns}.cols.${j}`));

  const faqLd = faqPageLd(t, FAQ_ITEMS);

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
    about: { "@id": APP_ID },
  };

  return (
    <div className="min-h-screen bg-background">
      <JsonLd items={[faqLd, howToLd, pageLd, breadcrumbLd("/send-large-files", "Send Large Files")]} />
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-24">
        <div className="mx-auto max-w-3xl lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-[minmax(0,1fr)_230px] lg:gap-12">
        <article className="min-w-0 lg:max-w-3xl">
        {/* Hero */}<ArticleHead a={a} updated={LAST_UPDATED} />
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          {t.rich("hero.body", {
            strong,
            highlight: (chunks) => <span className="text-foreground">{chunks}</span>,
            ...links,
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
                <span>{t.rich(`quick.items.${i}`, { strong, ...links })}</span>
              </li>
            ))}
          </ul>
        </section><HeroButtons a={a} />
            <Art a={a} name="hero" height={630} className="mt-10" />
{/* Why it is still a pain */}
        <Section a={a} id="why" lead />

        {/* The angle: what each headline number actually measures */}
        <Section a={a} id="headline">
          <p className="mt-4 leading-relaxed text-muted-foreground">{t.rich("headline.intro", { strong, ...links })}</p>
          <ul className="mt-6 space-y-4">
            {HEADLINE_ITEMS.map((i) => (
              <li key={i} className="flex items-start gap-3 text-[15.5px] leading-relaxed text-muted-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-blue" aria-hidden />
                <span>{t.rich(`headline.items.${i}`, { strong, ...links })}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">{t("headline.note")}</p>
            </Section>

        {/* Pick the route from the file size — the long-tail people search with */}
        <Section a={a} id="bysize">
          <p className="mt-3 leading-relaxed text-muted-foreground">{t("bysize.intro")}</p>
          <DataTable cols={cols("bysize", 3)} rows={table("bysize", BYSIZE_ROWS, 3)} minWidth={640} />
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("bysize.note")}</p>
            </Section>

        {/* Steps — the how-to, with the real screen */}
        <Section a={a} id="steps">
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
            <Shot src="/img/send-large-files/transfer" alt={t("shots.transfer")} width={1280} height={800} />
          </div>
            </Section>

        {/* How big is big */}
        <Section a={a} id="sizes">
          <p className="mt-3 leading-relaxed text-muted-foreground">{t("sizes.intro")}</p>
          <DataTable cols={cols("sizes", 4)} rows={table("sizes", SIZE_ROWS, 4)} />
            </Section>

        {/* By email, the route most people try first */}
        <Section a={a} id="email" lead>
          <ul className="mt-6 space-y-4">
            {EMAIL_ITEMS.map((i) => (
              <li key={i} className="flex items-start gap-3 text-[15.5px] leading-relaxed text-muted-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-blue" aria-hidden />
                <span>{t.rich(`email.items.${i}`, { strong, ...links })}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">{t("email.note")}</p>
            </Section>

        {/* From a phone */}
        <Section a={a} id="phone" lead>
          <ul className="mt-6 space-y-4">
            {PHONE_ITEMS.map((i) => (
              <li key={i} className="flex items-start gap-3 text-[15.5px] leading-relaxed text-muted-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-blue" aria-hidden />
                <span>{t.rich(`phone.items.${i}`, { strong, ...links })}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">{t.rich("phone.note", { strong, ...links })}</p>
            </Section>

        {/* Free limits compared */}
        <Section a={a} id="limits">
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("limits.intro")}</p><Art a={a} name="limits" height={720} />
<DataTable cols={cols("limits", 5)} rows={table("limits", LIMIT_ROWS, 5)} minWidth={720} />
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t("limits.note")}</p>
            </Section>

        {/* Privacy: where the file is stored and who can read it */}
        <Section a={a} id="privacy">
          <p className="mt-3 leading-relaxed text-muted-foreground">{t("privacy.intro")}</p>
          <DataTable cols={cols("privacy", 5)} rows={table("privacy", PRIVACY_ROWS, 5)} minWidth={760} />
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t("privacy.note")}</p>
          <div className="mt-6 space-y-5">
            {PRIVACY_ITEMS.map((i) => (
              <div key={i}>
                <h3 className="font-semibold">{t(`privacy.items.${i}.h`)}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">{t.rich(`privacy.items.${i}.b`, links)}</p>
              </div>
            ))}
          </div>
            </Section>

        {/* Speed */}
        <Section a={a} id="speed" lead><Art a={a} name="time" height={620} />
<DataTable cols={cols("speed", 3)} rows={table("speed", SPEED_ROWS, 3)} />
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{t("speed.local")}</p>
          {/* The speed article is scheduled; link it only once it is live so
              the page never points at a 404 while it waits. */}
          {publishedSlugs().has(SPEED_POST) && (
            <p className="mt-3">
              <Link href={`/blog/${SPEED_POST}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-blue hover:underline">
                {t("speed.link")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </p>
          )}
            </Section>

        {/* Every way, and when each fits */}
        <Section a={a} id="ways">
          <ul className="mt-6 space-y-7">
            {WAY_ITEMS.map((i) => (
              <li key={i} >
                <h3 className="font-semibold">{t(`ways.items.${i}.h`)}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">{t.rich(`ways.items.${i}.b`, links)}</p>
              </li>
            ))}
          </ul>
            </Section>

        {/* Device-pair guides — the sibling landings, linked with their own anchor text */}
        <Section a={a} id="devices">
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {DEVICE_ITEMS.map((i) => (
              <li key={i}>
                <Link
                  href={t(`devices.items.${i}.href`)}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-[15px] font-medium hover:border-foreground/25 hover:bg-muted/40"
                >
                  {t(`devices.items.${i}.h`)}
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("devices.note")}</p>
            </Section>

        {/* When it breaks halfway */}
        <Section a={a} id="failed">
          <p className="mt-3 leading-relaxed text-muted-foreground">{t("failed.intro")}</p>
          <ul className="mt-6 space-y-4">
            {FAILED_ITEMS.map((i) => (
              <li key={i} className="flex items-start gap-3 text-[15.5px] leading-relaxed text-muted-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-blue" aria-hidden />
                <span>{t.rich(`failed.items.${i}`, { strong, ...links })}</span>
              </li>
            ))}
          </ul>
            </Section>

        {/* Security */}
        <Section a={a} id="security">
          <ul className="mt-6 space-y-6">
            {SECURITY_ITEMS.map((i) => (
              <li key={i} className="flex items-start gap-3 text-[15px] leading-relaxed text-muted-foreground">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-background-raised text-foreground">
                  <Check className="h-3 w-3" />
                </span>
                <span>{t.rich(`security.items.${i}`, links)}</span>
              </li>
            ))}
          </ul><Art a={a} name="link" height={560} className="mt-8" />
            </Section>

        {/* Tips */}
        <Section a={a} id="tips">
          <ul className="mt-6 space-y-6">
            {TIP_ITEMS.map((i) => (
              <li key={i} >
                <h3 className="font-semibold">{t(`tips.items.${i}.h`)}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">{t(`tips.items.${i}.b`)}</p>
              </li>
            ))}
          </ul>
            </Section>

        {/* Comparison */}
        <Section a={a} id="comparison">
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
            </Section>

        {/* FAQ */}
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

        {/* CTA */}
        <section className="mt-16 rounded-xl border border-border bg-card p-8 text-center">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">{t("cta.title")}</h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">{t("cta.body")}</p>
          <div className="mt-6 flex justify-center">
            <Button href="/transfer" size="lg">
              {t("hero.ctaSecondaryTransfer")}
              <ArrowRight className="h-4 w-4" />
            </Button>
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
      <ImageLightbox closeLabel={chrome("imageClose")} />
    </div>
  );
}
