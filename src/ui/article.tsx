import type { Child } from "@/jsx";
import type { Metadata } from "@/site/metadata";
import { buildAlternates } from "@/i18n/metadata";
import { getTranslations, type Translator } from "@/i18n/translate";
import { pageUrl, sharedOpenGraph } from "@/lib/og";
import { ArticleToc } from "./article-toc";
import { Button } from "./button";
import { SiteFooter } from "./footer";
import { SiteHeader } from "./header";
import { HeroCta } from "./hero-cta";
import { ArrowRight, Check, X } from "./icons";
import { ImageLightbox } from "./image-lightbox";
import { LandingArt } from "./landing-art";
import { RelatedLinks } from "./related-links";
import { StoreButtons } from "./store-buttons";

// The parts every guide is made of. A guide's words are one namespace of messages; `a` is what its parts share.

export interface Article {
  t: Translator;
  /** The namespace "chrome". */
  chrome: Translator;
  /** What the <tags> in its messages become: bold, highlight and the links to other guides. */
  tags: Record<string, (chunks: Child) => Child>;
  locale: string;
  /** Its path, "/airdrop-alternative". */
  slug: string;
}
type Items = readonly string[];
type PageParams = { params: Promise<{ locale: string }> };

export const strong = (chunks: Child) => <strong className="text-foreground">{chunks}</strong>;
export const highlight = (chunks: Child) => <span className="text-foreground">{chunks}</span>;

/** generateMetadata of a guide: its meta.title and meta.description. */
export const articleMetadata = (namespace: string, slug: string) =>
  async function generateMetadata({ params }: PageParams): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace });
    const title = t("meta.title");
    const description = t("meta.description");
    return { title: { absolute: title }, description, alternates: buildAlternates(locale, slug), ...sharedOpenGraph(title, description, slug, locale) };
  };

/** Data for search engines, one <script> each. */
export const JsonLd = ({ items }: { items: object[] }) => (
  <>
    {items.map((ld) => (
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
    ))}
  </>
);

export const faqPageLd = (t: Translator, items: Items) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((i) => ({ "@type": "Question", name: t(`faq.items.${i}.q`), acceptedAnswer: { "@type": "Answer", text: t(`faq.items.${i}.a`) } })),
});

export const webPageLd = ({ t, slug, locale }: Pick<Article, "t" | "slug" | "locale">, dateModified: string) => ({
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: t("meta.title"),
  description: t("meta.description"),
  url: pageUrl(slug, locale),
  dateModified,
  isPartOf: { "@type": "WebSite", name: "BIShare", url: "https://bishare.app" },
});

/** The numbered list of <Methods>, each entry with the address of its card. */
export const methodsLd = ({ t, slug, locale }: Pick<Article, "t" | "slug" | "locale">, items: Items, name = "methods") => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: t(`${name}.title`),
  itemListElement: items.map((i, n) => ({
    "@type": "ListItem",
    position: n + 1,
    name: t(`${name}.items.${i}.name`),
    description: t(`${name}.items.${i}.tag`),
    url: `${pageUrl(slug, locale)}#item-${n + 1}`,
  })),
});

/** The page around a guide: header, the text with its table of contents, footer. */
export function ArticlePage({ a, ld, children }: { a: Article; ld: object[]; children: Child }) {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd items={ld} />
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-24">
        <div className="mx-auto max-w-3xl lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-[minmax(0,1fr)_230px] lg:gap-12">
          <article className="min-w-0 lg:max-w-3xl">
            {children}
            <RelatedLinks current={a.slug} />
          </article>
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <ArticleToc selector="main article h2[id]" label={a.chrome("toc.onThisPage")} />
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
      <ImageLightbox closeLabel={a.chrome("imageClose")} />
    </div>
  );
}

/** Eyebrow, title, date. */
export const ArticleHead = ({ a, updated }: { a: Article; updated: string }) => (
  <>
    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{a.t("hero.eyebrow")}</p>
    <h1 className="mt-4 text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-balance">{a.t("hero.title")}</h1>
    <p className="mt-3 text-sm text-muted-foreground">
      <time dateTime={updated}>{a.t("updated")}</time>
    </p>
  </>
);

export const HeroButtons = ({ a }: { a: Article }) => (
  <>
    <div className="mt-8">
      <HeroCta downloadLabel={a.t("hero.ctaPrimary")} />
    </div>
    <div className="mt-6">
      <StoreButtons />
    </div>
  </>
);

/** A figure drawn for the guide (tool/landing-art.mjs), in the page's language. */
export const Art = ({ a, name, height, width = 1200, className = "mt-6", eager }: { a: Article; name: string; height: number; width?: number; className?: string; eager?: boolean }) => (
  <LandingArt slug={a.slug} name={name} locale={a.locale} alt={a.t(`art.${name}.alt`)} width={width} height={height} zoomHint={a.chrome("imageZoom")} className={className} eager={eager} />
);

export const H2 = ({ id, children }: { id: string; children: Child }) => (
  <h2 id={id} className="scroll-mt-28 text-2xl font-semibold tracking-[-0.02em]">
    {children}
  </h2>
);

/** A section: its title, its first paragraph (`lead`: <name>.body), then what it holds. */
export const Section = ({ a, id, name = id, lead, children }: { a: Article; id: string; name?: string; lead?: boolean; children?: Child }) => (
  <section className="mt-14">
    <H2 id={id}>{a.t(`${name}.title`)}</H2>
    {lead ? <p className="mt-4 leading-relaxed text-muted-foreground">{a.t.rich(`${name}.body`, a.tags)}</p> : null}
    {children}
  </section>
);

/** A heading and a paragraph per item. */
export const ProseList = ({ a, name, items }: { a: Article; name: string; items: Items }) => (
  <div className="mt-6 space-y-7">
    {items.map((i) => (
      <div>
        <h3 className="font-semibold">{a.t(`${name}.items.${i}.h`)}</h3>
        <p className="mt-2 text-[15.5px] leading-relaxed text-muted-foreground">{a.t.rich(`${name}.items.${i}.b`, a.tags)}</p>
      </div>
    ))}
  </div>
);

export const QuickAnswer = ({ a, items }: { a: Article; items: Items }) => (
  <section className="mt-8 rounded-xl border border-border bg-card p-5 sm:p-6" aria-labelledby="quick-answer">
    <h2 id="quick-answer" className="scroll-mt-28 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
      {a.t("quick.title")}
    </h2>
    <ul className="mt-3 space-y-2.5">
      {items.map((i) => (
        <li className="flex items-start gap-3 text-[15px] leading-relaxed text-muted-foreground">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-blue" aria-hidden />
          <span>{a.t.rich(`quick.items.${i}`, a.tags)}</span>
        </li>
      ))}
    </ul>
  </section>
);

/** The numbered ways of the guide, each with its facts and its price. */
export const Methods = ({ a, items, name = "methods" }: { a: Article; items: Items; name?: string }) => (
  <div className="mt-6 space-y-8">
    {items.map((i, n) => (
      <div id={`item-${n + 1}`} className="scroll-mt-28 border-b border-border pb-8 last:border-0 last:pb-0">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-sm font-semibold text-accent-blue">{String(n + 1).padStart(2, "0")}</span>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold">{a.t(`${name}.items.${i}.name`)}</h3>
            <p className="mt-0.5 text-sm font-medium text-accent-blue">{a.t(`${name}.items.${i}.tag`)}</p>
            <p className="mt-3 font-mono text-[12px] leading-relaxed text-muted-foreground">{a.t(`${name}.items.${i}.facts`)}</p>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{a.t.rich(`${name}.items.${i}.body`, a.tags)}</p>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">{a.t(`${name}.consLabel`)}</span> {a.t(`${name}.items.${i}.cons`)}
            </p>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export function Cell({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return ok ? <Check className="mx-auto h-4 w-4 text-success" aria-label={yes} /> : <X className="mx-auto h-4 w-4 text-muted-foreground/50" aria-label={no} />;
}

/** The comparison: one column per app, a check or a cross in every row. `min`: the class of its least width. */
export function TruthTable({ a, apps, rows, min, name = "table" }: { a: Article; apps: Items; rows: readonly { id: string; v: readonly boolean[] }[]; min: string; name?: string }) {
  const { t } = a;
  return (
    <>
      <div className="mt-5 overflow-x-auto rounded-xl border border-border">
        <table className={`w-full ${min} text-sm`}>
          <thead>
            <tr className="border-b border-border bg-background-raised text-muted-foreground">
              <th className="px-4 py-3 text-left font-medium">{t(`${name}.cols.feature`)}</th>
              {apps.map((app) => (
                <th className={`px-4 py-3 font-medium ${app === "bishare" ? "font-semibold text-foreground" : ""}`}>{t(`${name}.cols.${app}`)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-foreground">{t(`${name}.rows.${r.id}`)}</td>
                {r.v.map((ok) => (
                  <td className="px-4 py-3">
                    <Cell ok={ok} yes={t("a11y.yes")} no={t("a11y.no")} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t(`${name}.note`)}</p>
    </>
  );
}

export const Faq = ({ a, items }: { a: Article; items: Items }) => (
  <div className="mt-5 space-y-3">
    {items.map((i) => (
      <details className="group rounded-xl border border-border bg-card p-5">
        <summary className="cursor-pointer list-none font-medium marker:content-['']">{a.t(`faq.items.${i}.q`)}</summary>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{a.t(`faq.items.${i}.a`)}</p>
      </details>
    ))}
  </div>
);

/** The end of a guide: get the app. */
export const Cta = ({ a }: { a: Article }) => (
  <section className="mt-16 rounded-xl border border-border bg-card p-8 text-center">
    <h2 className="text-2xl font-semibold tracking-[-0.02em]">{a.t("cta.title")}</h2>
    <p className="mx-auto mt-2 max-w-md text-muted-foreground">{a.t("cta.body")}</p>
    <div className="mt-6 flex justify-center">
      <Button href="/download" size="lg">
        {a.t("cta.download")}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
    <div className="mt-5 flex justify-center">
      <StoreButtons />
    </div>
  </section>
);
