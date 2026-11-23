import { JsonLd, type Article, faqPageLd, ArticleHead, HeroButtons, Art, Section, QuickAnswer, Cell, Cta, strong, highlight } from "@/ui/article";
import type { Metadata } from "@/site/metadata";
import { getTranslations } from "@/i18n/translate";
import { buildAlternates } from "@/i18n/metadata";
import { sharedOpenGraph } from "@/lib/og";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";
import { ImageLightbox } from "@/ui/image-lightbox";
import { SiteHeader } from "@/ui/header";
import { SiteFooter } from "@/ui/footer";
import { ArticleToc } from "@/ui/article-toc";
import { RelatedLinks } from "@/ui/related-links";
import { guideLinks } from "@/ui/guide-links";
import { YouTubeFacade } from "@/ui/youtube-facade";

/**
 * "Best file sharing apps" buyer's guide — the page AI answers cite most and
 * the one that must earn its ranking honestly. Ten apps, each with its
 * platforms, free limit, encryption and account requirement as published in
 * September 2026, a criteria section, a situation-by-situation pick, and a
 * disclosure that we make BIShare. Fully localized via "bestApps"; carries
 * ItemList + FAQPage + WebPage (dateModified) structured data. Bump
 * `LAST_UPDATED` whenever the facts about other apps are re-checked.
 */

const LAST_UPDATED = "2026-10-17";
const FIRST_PUBLISHED = "2026-08-10";
const SITE = "https://bishare.app";

const SLUG = "/best-file-sharing-app";

/* "How to send files between any phone and computer" (YouTube, English,
   published 2026-11-02; Remotion source in bishare-project/video/share-any-device).
   Shown on the English page only, behind a click-to-load facade. */
const VIDEO = {
  id: "Rsx7yzl0okY",
  name: "How to Send Files Between Any Phone and Computer (Free, No Cable)",
  description:
    "Three ways to move photos, videos and files between iPhone, Android, Windows, Mac and Linux with BIShare: over the same Wi-Fi, with a link anyone can open, or in the browser.",
  uploadDate: "2026-11-02T20:59:44-08:00",
  duration: "PT43S",
  thumbnail: "/img/video/share-any-device.jpg",
};

export async function generateMetadata({ locale }: { locale: string }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "bestApps" });
  const title = t("meta.title");
  const description = t("meta.description");
  return {
    title: { absolute: title },
    description,
    alternates: buildAlternates(locale, "/best-file-sharing-app"),
    ...sharedOpenGraph(title, description, SLUG, locale),
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
const SPEED_ITEMS = ["0", "1", "2"] as const;
const P2P_ITEMS = ["0", "1", "2", "3"] as const;
const TEAM_ITEMS = ["0", "1", "2", "3"] as const;
const SAFETY_ITEMS = ["0", "1", "2", "3"] as const;
/* Collaboration apps compared (facts re-checked on each vendor's own pages, see collab.note). */
const COLLAB_APPS = ["gdrive", "dropbox", "onedrive", "box", "proton"] as const;
const COLLAB_COLS = ["free", "price", "e2e", "versions"] as const;
const COLLAB_PICKS = ["security", "price", "reliability"] as const;
const FAQ_ITEMS = ["0", "12", "1", "2", "15", "10", "13", "3", "4", "5", "6", "7", "8", "9", "14", "17", "18", "19", "16", "11"] as const;

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

export default async function BestFileSharingAppPage({ locale }: { locale: string }) {
  const t = await getTranslations("bestApps");
  const links = guideLinks();
  const tags = { strong, highlight, ...links };
  const chrome = await getTranslations("chrome");
  const a: Article = { t, chrome, tags, locale, slug: SLUG };
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
  const faqLd = faqPageLd(t, FAQ_ITEMS);

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
  const videoLd =
    locale === "en"
      ? {
          "@context": "https://schema.org",
          "@type": "VideoObject",
          name: VIDEO.name,
          description: VIDEO.description,
          thumbnailUrl: [`${SITE}${VIDEO.thumbnail}`],
          uploadDate: VIDEO.uploadDate,
          duration: VIDEO.duration,
          embedUrl: `https://www.youtube.com/embed/${VIDEO.id}`,
        }
      : null;

  return (
    <div className="min-h-screen bg-background">
      <JsonLd items={[listLd, faqLd, pageLd, breadcrumbLd("/best-file-sharing-app", "Best file sharing apps"), ...(videoLd ? [videoLd] : [])]} />
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-24">
        <div className="mx-auto max-w-3xl lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-[minmax(0,1fr)_230px] lg:gap-12">
        <article className="min-w-0 lg:max-w-3xl">
        {/* Hero */}<ArticleHead a={a} updated={LAST_UPDATED} />
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          {t.rich("hero.body", { strong, ...links })}
        </p>
        <p className="mt-4 rounded-xl border border-border bg-background-raised/60 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          {t("disclosure")}
        </p>

        {/* Quick answer */}<QuickAnswer a={a} items={QUICK_ITEMS} /><HeroButtons a={a} />
            <Art a={a} name="hero" height={630} className="mt-8" />
{locale === "en" && (
          <Section a={a} id="video">
            <YouTubeFacade
              id={VIDEO.id}
              title={VIDEO.name}
              playLabel={t("video.play")}
              thumbnail={VIDEO.thumbnail}
              className="mt-5"
            />
            <p className="mt-3 text-sm text-muted-foreground">{t("video.note")}</p>
            </Section>
        )}

        {/* How we judged */}
        <Section a={a} id="criteria"><Art a={a} name="criteria" height={640} />
<div className="mt-6 space-y-7">
            {CRITERIA_ITEMS.map((i) => (
              <div key={i} >
                <h3 className="font-semibold">{t(`criteria.items.${i}.h`)}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">{t.rich(`criteria.items.${i}.b`, links)}</p>
              </div>
            ))}
          </div>
            </Section>

        {/* At a glance */}
        <Section a={a} id="glance" name="table"><Art a={a} name="quadrant" height={760} />
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
            </Section>

        {/* The ten, ranked */}
        <Section a={a} id="ranking" name="list">
          <ol className="mt-6 space-y-7">
            {LIST_ITEMS.map((i, n) => (
              <li key={i} className="border-b border-border pb-8 last:border-0 last:pb-0">
                <div className="flex items-start gap-4">
                  <span className="font-mono text-sm font-semibold text-accent-blue">{String(n + 1).padStart(2, "0")}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold">{t(`list.items.${i}.name`)}</h3>
                    <p className="mt-0.5 text-sm font-medium text-accent-blue">{t(`list.items.${i}.tag`)}</p>
                    <p className="mt-3 font-mono text-[12px] leading-relaxed text-muted-foreground">{t(`list.items.${i}.facts`)}</p>
                    <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{t.rich(`list.items.${i}.body`, links)}</p>
                    <p className="mt-3 text-[15px] leading-relaxed text-foreground">{t(`list.items.${i}.best`)}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      <span className="font-medium text-foreground">{t("list.consLabel")}</span> {t(`list.items.${i}.cons`)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
            </Section>

        {/* speed */}
        <Section a={a} id="speed" lead>
          <div className="mt-6 space-y-7">
            {SPEED_ITEMS.map((i) => (
              <div key={i}>
                <h3 className="font-semibold">{t(`speed.items.${i}.h`)}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">{t.rich(`speed.items.${i}.b`, links)}</p>
              </div>
            ))}
          </div>
            </Section>

        {/* p2p */}
        <Section a={a} id="p2p" lead>
          <div className="mt-6 space-y-7">
            {P2P_ITEMS.map((i) => (
              <div key={i}>
                <h3 className="font-semibold">{t(`p2p.items.${i}.h`)}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">{t.rich(`p2p.items.${i}.b`, links)}</p>
              </div>
            ))}
          </div>
            </Section>

        {/* Which app for which situation */}
        <Section a={a} id="situations" name="useCases"><Art a={a} name="choose" height={860} />
<div className="mt-6 space-y-7">
            {USE_CASE_ITEMS.map((i) => (
              <div key={i} >
                <h3 className="font-semibold">{t(`useCases.items.${i}.h`)}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">{t.rich(`useCases.items.${i}.b`, links)}</p>
              </div>
            ))}
          </div>
            </Section>

        {/* teams */}
        <Section a={a} id="teams" lead>
          <div className="mt-6 space-y-7">
            {TEAM_ITEMS.map((i) => (
              <div key={i}>
                <h3 className="font-semibold">{t(`teams.items.${i}.h`)}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">{t.rich(`teams.items.${i}.b`, links)}</p>
              </div>
            ))}
          </div>
            </Section>

        {/* File-sharing collaboration apps: security, price, reliability */}
        <Section a={a} id="collaboration" name="collab" lead>
          <div className="mt-5 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border bg-background-raised text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">{t("collab.cols.app")}</th>
                  {COLLAB_COLS.map((c) => (
                    <th key={c} className="px-3 py-3 text-left font-medium">{t(`collab.cols.${c}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COLLAB_APPS.map((a) => (
                  <tr key={a} className="border-b border-border align-top last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{t(`collab.rows.${a}.name`)}</td>
                    {COLLAB_COLS.map((c) => (
                      <td key={c} className="px-3 py-3 text-muted-foreground">{t(`collab.rows.${a}.${c}`)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t("collab.note")}</p>
          <div className="mt-6 space-y-7">
            {COLLAB_PICKS.map((k) => (
              <div key={k}>
                <h3 className="font-semibold">{t(`collab.picks.${k}.h`)}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">{t.rich(`collab.picks.${k}.b`, links)}</p>
              </div>
            ))}
          </div>
            </Section>

        {/* safety */}
        <Section a={a} id="safety" lead>
          <div className="mt-6 space-y-7">
            {SAFETY_ITEMS.map((i) => (
              <div key={i}>
                <h3 className="font-semibold">{t(`safety.items.${i}.h`)}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">{t.rich(`safety.items.${i}.b`, links)}</p>
              </div>
            ))}
          </div>
            </Section>

        {/* Why BIShare */}
        <Section a={a} id="why" lead />

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

        {/* CTA */}<Cta a={a} />

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
      <ImageLightbox closeLabel={chrome("imageClose")} />
    </div>
  );
}
