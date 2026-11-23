import type { Metadata } from "@/site/metadata";
import { getTranslations } from "@/i18n/translate";
import { type Article, faqPageLd, ArticleHead, HeroButtons, Art, H2, Section, Cell, Cta, strong, highlight } from "@/ui/article";
import { Button } from "@/ui/button";
import { buildAlternates } from "@/i18n/metadata";
import { sharedOpenGraph } from "@/lib/og";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";
import { ImageLightbox } from "@/ui/image-lightbox";
import { SiteHeader } from "@/ui/header";
import { SiteFooter } from "@/ui/footer";
import { ArticleToc } from "@/ui/article-toc";
import { RelatedLinks } from "@/ui/related-links";
import { MicrosoftGlyph, MICROSOFT_STORE_URL } from "@/ui/store-buttons";
import { RELEASES_URL } from "@/pages/download/availability";
import { ArrowRight, Check, Download } from "@/ui/icons";
import { Link } from "@/ui/link";
import { publishedSlugs } from "@/content/blog/registry";
import { guideLinks } from "@/ui/guide-links";
import { APP_ID } from "@/lib/app-ld";

const SPEED_POST = "airdrop-for-windows-speeds";

/**
 * High-intent SEO landing targeting "AirDrop for Windows" / "AirDrop for PC" and
 * the cluster of iPhone/Mac ↔ Windows transfer queries. Fully localized across
 * all 13 locales via the "airdropWindows" namespace.
 *
 * Built to be the most complete and the most current page on the query: a
 * quick answer up top, an honest account of Microsoft's Phone Link (the thing
 * the news results are about), the real download (Microsoft Store), real
 * screenshots, a five-way comparison, the walkthrough, and a FAQ shaped by
 * what people ask. Every claim about a competitor is dated in the copy —
 * update `LAST_UPDATED` whenever those facts are re-checked.
 */

const LAST_UPDATED = "2026-10-29";
const FIRST_PUBLISHED = "2026-08-10";
const SITE = "https://bishare.app";

const SLUG = "/airdrop-for-windows";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "airdropWindows" });
  const title = t("meta.title");
  const description = t("meta.description");
  return {
    title: { absolute: title },
    description,
    alternates: buildAlternates(locale, "/airdrop-for-windows"),
    ...sharedOpenGraph(title, description, SLUG, locale),
  };
}

/* Row ids carry the truth table; labels come from the namespace.
   Phone Link marks reflect Windows Insider builds (see comparison.footnote). */
type Col = "airdrop" | "phoneLink" | "nearby" | "localsend" | "bishare";
const COLS: Col[] = ["airdrop", "phoneLink", "nearby", "localsend", "bishare"];
const COMPARISON: Array<{ id: string } & Record<Col, boolean>> = [
  { id: "iphoneWindows", airdrop: false, phoneLink: true, nearby: false, localsend: true, bishare: true },
  { id: "macWindows", airdrop: false, phoneLink: false, nearby: false, localsend: true, bishare: true },
  { id: "windowsIphone", airdrop: false, phoneLink: true, nearby: false, localsend: true, bishare: true },
  { id: "android", airdrop: false, phoneLink: true, nearby: false, localsend: true, bishare: true },
  { id: "noApp", airdrop: true, phoneLink: false, nearby: false, localsend: false, bishare: true },
  { id: "noAccount", airdrop: true, phoneLink: false, nearby: true, localsend: true, bishare: true },
  { id: "stable", airdrop: true, phoneLink: false, nearby: true, localsend: true, bishare: true },
  { id: "offline", airdrop: true, phoneLink: false, nearby: true, localsend: true, bishare: true },
  { id: "e2e", airdrop: true, phoneLink: false, nearby: false, localsend: true, bishare: true },
];

const QUICK_ITEMS = ["0", "1", "2", "3"] as const;
const SCENARIO_ITEMS = ["0", "1", "2", "3", "4"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7"] as const;
const SPEED_ROWS = ["0", "1", "2", "3", "4"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const PHONE_LINK_ITEMS = ["0", "1", "2", "3"] as const;
const HOW_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"] as const;
const STEP_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const FIX_ITEMS = ["0", "1", "2"] as const;

export default async function AirdropForWindowsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("airdropWindows");
  const links = guideLinks();
  const tags = { strong, highlight, ...links };
  const chrome = await getTranslations("chrome");
  const a: Article = { t, chrome, tags, locale, slug: SLUG };
  const tocLabel = chrome("toc.onThisPage");
  const yes = t("a11y.yes");
  const no = t("a11y.no");

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  // The page itself, with the dates Google reads for freshness, and the app it
  // is about — the Windows build is what this query is looking for.
  const pageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE}/airdrop-for-windows`,
    name: t("meta.title"),
    description: t("meta.description"),
    inLanguage: locale,
    datePublished: FIRST_PUBLISHED,
    dateModified: LAST_UPDATED,
    about: { "@id": APP_ID },
  };

  return (
    <div className="min-h-screen bg-background">
      {[faqLd, pageLd, breadcrumbLd("/airdrop-for-windows", "AirDrop for Windows")].map((ld, i) => (
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
        {/* Hero */}<ArticleHead a={a} updated={LAST_UPDATED} />
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          {t.rich("hero.body", {
            strong,
            highlight: (chunks) => <span className="text-foreground">{chunks}</span>,
            ...links,
          })}
        </p>

        {/* Quick answer — the four sentences a reader (or a search engine
            assembling a summary) needs before anything else. */}
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
{/* Why AirDrop can't reach Windows */}
        <Section a={a} id="why" lead />

        {/* Phone Link — what the news results are about, stated plainly */}
        <Section a={a} id="phone-link" name="phoneLink" lead>
          <ul className="mt-6 space-y-6">
            {PHONE_LINK_ITEMS.map((i) => (
              <li key={i} className="flex items-start gap-3 text-[15px] leading-relaxed text-muted-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" aria-hidden />
                <span>{t(`phoneLink.items.${i}`)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 leading-relaxed text-foreground">{t("phoneLink.verdict")}</p><Art a={a} name="compare" height={720} />
            </Section>

        {/* The download — the intent behind most of these searches */}
        <Section a={a} id="download" lead>
          <div className="mt-6 rounded-xl border border-border bg-card p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-4">
              <Button href={MICROSOFT_STORE_URL} size="lg">
                <MicrosoftGlyph className="h-[18px] w-[18px]" />
                {t("download.store")}
              </Button>
              <Button href={RELEASES_URL} size="lg" variant="secondary">
                <Download className="h-4 w-4" />
                {t("download.zip")}
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{t("download.storeNote")}</p>
            <p className="mt-5 text-sm text-muted-foreground">{t("download.winget")}</p>
            <pre className="mt-2 overflow-x-auto rounded-lg border border-border bg-background-raised px-4 py-3 font-mono text-[13px] text-foreground">
              <code>winget install BIShareProject.BIShare</code>
            </pre>
            <p className="mt-2 text-sm text-muted-foreground">{t("download.wingetNote")}</p>
          </div>
          <p className="mt-5 leading-relaxed text-muted-foreground">{t("download.phone")}</p>
            </Section>

        {/* Screenshots — the app on a desktop, not a mock-up */}
        <section className="mt-14 grid gap-4 sm:grid-cols-2">
          {(["devices", "send"] as const).map((shot) => (
            <figure key={shot} className="overflow-hidden rounded-xl border border-border bg-card">
              <picture>
                <source srcSet={`/img/airdrop-windows/${shot}.webp`} type="image/webp" />
                <img
                  src={`/img/airdrop-windows/${shot}.jpg`}
                  alt={t(`shots.${shot}`)}
                  width={1400}
                  height={787}
                  loading="lazy"
                  decoding="async"
                  className="h-auto w-full"
                />
              </picture>
              <figcaption className="px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                {t(`shots.${shot}`)}
              </figcaption>
            </figure>
          ))}
        </section>

        {/* How BIShare bridges it */}
        <Section a={a} id="how">
          <ul className="mt-6 space-y-7">
            {HOW_ITEMS.map((i) => (
              <li key={i} >
                <h3 className="font-semibold">{t(`how.items.${i}.h`)}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">
                  {t.rich(`how.items.${i}.b`, links)}
                </p>
              </li>
            ))}
          </ul>
            </Section>

        {/* Which route for which job */}
        <Section a={a} id="scenarios">
          <div className="mt-6 space-y-7">
            {SCENARIO_ITEMS.map((i) => (
              <div key={i} >
                <h3 className="font-semibold">{t(`scenarios.items.${i}.h`)}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">
                  {t(`scenarios.items.${i}.b`)}
                </p>
              </div>
            ))}
          </div>
            </Section>

        {/* Walkthrough — the searcher wants to DO it, so the steps live here. */}
        <Section a={a} id="steps">
          <p className="mt-3 leading-relaxed text-muted-foreground">{t("steps.intro")}</p>
          <ol className="mt-6 space-y-7">
            {STEP_ITEMS.map((i, n) => (
              <li key={i} className="flex gap-4">
                <span className="font-mono text-sm font-semibold text-accent-blue">
                  {String(n + 1).padStart(2, "0")}
                </span>
                <span>
                  <h3 className="font-semibold">{t(`steps.items.${i}.h`)}</h3>
                  <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">
                    {t(`steps.items.${i}.b`)}
                  </p>
                </span>
              </li>
            ))}
          </ol>
            </Section>

        <Section a={a} id="directions">
          <div className="mt-6 space-y-7">
            {(["toPc", "toPhone"] as const).map((d) => (
              <div key={d} >
                <h3 className="font-semibold">{t(`directions.${d}.h`)}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">
                  {t.rich(`directions.${d}.b`, links)}
                </p>
              </div>
            ))}
          </div>
            </Section>

        <Section a={a} id="fixes">
          <ul className="mt-6 space-y-6">
            {FIX_ITEMS.map((i) => (
              <li key={i} >
                <h3 className="font-semibold">{t(`fixes.items.${i}.h`)}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">
                  {t(`fixes.items.${i}.b`)}
                </p>
              </li>
            ))}
          </ul>
            </Section>

        {/* The other ways people try — each one named, each one's limit stated */}
        <Section a={a} id="alternatives">
          <ul className="mt-6 space-y-7">
            {ALT_ITEMS.map((i) => (
              <li key={i} >
                <h3 className="font-semibold">{t(`alternatives.items.${i}.h`)}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">
                  {t.rich(`alternatives.items.${i}.b`, links)}
                </p>
              </li>
            ))}
          </ul>
            </Section>

        {/* Speed — measured, with the caveats */}
        <Section a={a} id="speed" lead><Art a={a} name="speed" height={640} />
<div className="mt-5 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border bg-background-raised text-muted-foreground">
                  {(["0", "1", "2"] as const).map((c) => (
                    <th key={c} className="px-4 py-3 text-left font-medium">
                      {t(`speed.cols.${c}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SPEED_ROWS.map((r) => (
                  <tr key={r} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-foreground">{t(`speed.rows.${r}.0`)}</td>
                    <td className="px-4 py-3 font-mono text-[13px]">{t(`speed.rows.${r}.1`)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t(`speed.rows.${r}.2`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{t("speed.note")}</p>
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

        {/* Security — what leaves the device */}
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
          </ul>
            </Section>

        {/* Comparison — five ways people actually try, checked and dated */}
        <Section a={a} id="comparison">
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("comparison.intro")}</p>
          <div className="mt-5 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border bg-background-raised text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium"> </th>
                  {COLS.map((c) => (
                    <th
                      key={c}
                      className={
                        c === "bishare"
                          ? "px-3 py-3 font-semibold text-foreground"
                          : "px-3 py-3 font-medium"
                      }
                    >
                      {t(`comparison.cols.${c}`)}
                      {c === "phoneLink" ? "*" : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-foreground">{t(`comparison.rows.${r.id}`)}</td>
                    {COLS.map((c) => (
                      <td key={c} className="px-3 py-3">
                        <Cell ok={r[c]} yes={yes} no={no} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t("comparison.footnote")}</p>
            </Section>

        {/* FAQ */}
        <Section a={a} id="faq">
          <div className="mt-6 space-y-6">
            {FAQ_ITEMS.map((i) => (
              <details key={i} className="group rounded-xl border border-border bg-card p-5">
                <summary className="cursor-pointer list-none font-medium marker:content-['']">
                  {t(`faq.items.${i}.q`)}
                </summary>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                  {t(`faq.items.${i}.a`)}
                </p>
              </details>
            ))}
          </div>
            </Section>

        {/* CTA */}<Cta a={a} />

            <RelatedLinks current="/airdrop-for-windows" />
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
