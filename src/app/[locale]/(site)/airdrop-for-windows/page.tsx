import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/i18n/metadata";
import { sharedOpenGraph } from "@/lib/og";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { RelatedLinks } from "@/components/site/related-links";
import { VButton } from "@/components/site/vbutton";
import { HeroCta } from "@/components/site/hero-cta";
import {
  StoreButtons,
  MicrosoftGlyph,
  MICROSOFT_STORE_URL,
} from "@/components/site/store-buttons";
import { RELEASES_URL } from "../download/availability";
import { ArrowRight, Check, Download, X } from "lucide-react";
import { Link } from "@/i18n/navigation";

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

const LAST_UPDATED = "2026-09-12";
const FIRST_PUBLISHED = "2026-08-10";
const SITE = "https://bishare.app";

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
    ...sharedOpenGraph(title, description, "/airdrop-for-windows"),
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
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"] as const;
const STEP_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const FIX_ITEMS = ["0", "1", "2"] as const;

function Cell({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return ok ? (
    <Check className="mx-auto h-4 w-4 text-success" aria-label={yes} />
  ) : (
    <X className="mx-auto h-4 w-4 text-muted-foreground/50" aria-label={no} />
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-semibold tracking-[-0.02em]">{children}</h2>;
}

const strong = (chunks: React.ReactNode) => (
  <strong className="text-foreground">{chunks}</strong>
);

export default async function AirdropForWindowsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("airdropWindows");
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
    about: {
      "@type": "SoftwareApplication",
      name: "BIShare",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Windows 10, Windows 11, iOS, Android, macOS, Linux",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      license: "https://opensource.org/licenses/MIT",
      downloadUrl: MICROSOFT_STORE_URL,
      installUrl: MICROSOFT_STORE_URL,
      url: SITE,
    },
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
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-24">
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

        {/* Why AirDrop can't reach Windows */}
        <section className="mt-14">
          <H2>{t("why.title")}</H2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            {t.rich("why.body", { strong })}
          </p>
        </section>

        {/* Phone Link — what the news results are about, stated plainly */}
        <section className="mt-14">
          <H2>{t("phoneLink.title")}</H2>
          <p className="mt-4 leading-relaxed text-muted-foreground">{t("phoneLink.body")}</p>
          <ul className="mt-5 space-y-3">
            {PHONE_LINK_ITEMS.map((i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-[15px] leading-relaxed text-muted-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" aria-hidden />
                <span>{t(`phoneLink.items.${i}`)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 leading-relaxed text-foreground">{t("phoneLink.verdict")}</p>
        </section>

        {/* The download — the intent behind most of these searches */}
        <section className="mt-14">
          <H2>{t("download.title")}</H2>
          <p className="mt-4 leading-relaxed text-muted-foreground">{t("download.body")}</p>
          <div className="mt-6 rounded-xl border border-border bg-card p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-4">
              <VButton href={MICROSOFT_STORE_URL} size="lg">
                <MicrosoftGlyph className="h-[18px] w-[18px]" />
                {t("download.store")}
              </VButton>
              <VButton href={RELEASES_URL} size="lg" variant="secondary">
                <Download className="h-4 w-4" />
                {t("download.zip")}
              </VButton>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{t("download.storeNote")}</p>
            <p className="mt-5 text-sm text-muted-foreground">{t("download.winget")}</p>
            <pre className="mt-2 overflow-x-auto rounded-lg border border-border bg-background-raised px-4 py-3 font-mono text-[13px] text-foreground">
              <code>winget install BIShareProject.BIShare</code>
            </pre>
            <p className="mt-2 text-sm text-muted-foreground">{t("download.wingetNote")}</p>
          </div>
          <p className="mt-5 leading-relaxed text-muted-foreground">{t("download.phone")}</p>
        </section>

        {/* Screenshots — the app on a desktop, not a mock-up */}
        <section className="mt-14 grid gap-4 sm:grid-cols-2">
          {(["devices", "send"] as const).map((shot) => (
            <figure key={shot} className="overflow-hidden rounded-xl border border-border bg-card">
              <picture>
                <source srcSet={`/img/airdrop-windows/${shot}.webp`} type="image/webp" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
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
        <section className="mt-14">
          <H2>{t("how.title")}</H2>
          <ul className="mt-5 space-y-4">
            {HOW_ITEMS.map((i) => (
              <li key={i} className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold">{t(`how.items.${i}.h`)}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
                  {t(`how.items.${i}.b`)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Which route for which job */}
        <section className="mt-14">
          <H2>{t("scenarios.title")}</H2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {SCENARIO_ITEMS.map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold">{t(`scenarios.items.${i}.h`)}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
                  {t(`scenarios.items.${i}.b`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Walkthrough — the searcher wants to DO it, so the steps live here. */}
        <section className="mt-14">
          <H2>{t("steps.title")}</H2>
          <p className="mt-3 leading-relaxed text-muted-foreground">{t("steps.intro")}</p>
          <ol className="mt-5 space-y-4">
            {STEP_ITEMS.map((i, n) => (
              <li key={i} className="flex gap-4 rounded-xl border border-border bg-card p-5">
                <span className="font-mono text-sm font-semibold text-accent-blue">
                  {String(n + 1).padStart(2, "0")}
                </span>
                <span>
                  <h3 className="font-semibold">{t(`steps.items.${i}.h`)}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
                    {t(`steps.items.${i}.b`)}
                  </p>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14">
          <H2>{t("directions.title")}</H2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {(["toPc", "toPhone"] as const).map((d) => (
              <div key={d} className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold">{t(`directions.${d}.h`)}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
                  {t(`directions.${d}.b`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <H2>{t("fixes.title")}</H2>
          <ul className="mt-5 space-y-3">
            {FIX_ITEMS.map((i) => (
              <li key={i} className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold">{t(`fixes.items.${i}.h`)}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
                  {t(`fixes.items.${i}.b`)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* The other ways people try — each one named, each one's limit stated */}
        <section className="mt-14">
          <H2>{t("alternatives.title")}</H2>
          <ul className="mt-5 divide-y divide-border rounded-xl border border-border bg-card">
            {ALT_ITEMS.map((i) => (
              <li key={i} className="p-5">
                <h3 className="font-semibold">{t(`alternatives.items.${i}.h`)}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
                  {t(`alternatives.items.${i}.b`)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Speed — measured, with the caveats */}
        <section className="mt-14">
          <H2>{t("speed.title")}</H2>
          <p className="mt-4 leading-relaxed text-muted-foreground">{t("speed.body")}</p>
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
          <p className="mt-3">
            <Link href="/blog/airdrop-for-windows-speeds" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-blue hover:underline">
              {t("speed.link")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </p>
        </section>

        {/* Security — what leaves the device */}
        <section className="mt-14">
          <H2>{t("security.title")}</H2>
          <ul className="mt-5 space-y-3">
            {SECURITY_ITEMS.map((i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card p-5 text-[15px] leading-relaxed text-muted-foreground">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-background-raised text-foreground">
                  <Check className="h-3 w-3" />
                </span>
                <span>{t(`security.items.${i}`)}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Comparison — five ways people actually try, checked and dated */}
        <section className="mt-14">
          <H2>{t("comparison.title")}</H2>
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
        </section>

        {/* FAQ */}
        <section className="mt-14">
          <H2>{t("faq.title")}</H2>
          <div className="mt-5 space-y-3">
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
        </section>

        {/* CTA */}
        <section className="mt-16 rounded-xl border border-border bg-card p-8 text-center">
          <H2>{t("cta.title")}</H2>
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

        <RelatedLinks current="/airdrop-for-windows" />
      </main>
      <SiteFooter />
    </div>
  );
}
