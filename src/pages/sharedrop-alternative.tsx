import { getTranslations } from "@/i18n/translate";
import { type Article, articleMetadata, faqPageLd, webPageLd, methodsLd, ArticlePage, ArticleHead, HeroButtons, Art, Section, ProseList, QuickAnswer, Methods, TruthTable, Faq, Cta, strong, highlight } from "@/ui/article";
import { pageUrl } from "@/lib/og";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";
import { guideLinks } from "@/ui/guide-links";

/**
 * "ShareDrop alternative" — the SERP is AlternativeTo, Semrush competitor
 * pages, storage.to and a generic 1,800-word Textunnel list that names no
 * products. None says what sharedrop.io does after the February 2025 LimeWire
 * takeover (ad slots, an upload box that stores files with LimeWire) or that
 * ShareDrop groups devices by public IP address.
 *
 * This page dates the change, explains discovery and rooms, ranks seven
 * alternatives including self-hosted ShareDrop Classic, and compares live
 * rooms, live links and stored links.
 *
 * Content lives in the "sharedropAlt" namespace, 13 locales. Bump
 * LAST_UPDATED after re-checking sharedrop.io and the listed projects.
 */

const SLUG = "/sharedrop-alternative";
const NS = "sharedropAlt";
const LAST_UPDATED = "2026-09-19";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const WHAT_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const HOW_ITEMS = ["0", "1", "2", "3"] as const;
const LIMITS_ITEMS = ["0", "1", "2", "3", "4"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5", "6"] as const;
const ROOMS_ITEMS = ["0", "1", "2", "3"] as const;
const SELFHOST_ITEMS = ["0", "1", "2", "3"] as const;
const CHOOSE_ITEMS = ["0", "1", "2", "3", "4"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Comparison truth table. Columns: BIShare, PairDrop, FilePizza, ToffeeShare, LocalSend,
   Taildrop.
   Conditions behind each cell are in table.note. */
const APPS = ["bishare", "pairdrop", "filepizza", "toffeeshare", "localsend", "taildrop"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // browser both ends · finds nearby · other network · download after sender offline · to other people · no account
  { id: "r0", v: [true, true, true, true, false, false] },
  { id: "r1", v: [true, true, false, false, true, false] },
  { id: "r2", v: [true, true, true, true, false, true] },
  { id: "r3", v: [true, false, false, false, false, false] },
  { id: "r4", v: [true, true, true, true, true, false] },
  { id: "r5", v: [true, true, true, true, true, false] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function SharedropAltPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations(NS);
  const links = guideLinks();
  const chrome = await getTranslations("chrome");

  const tags = { strong, highlight, ...links };
  const a: Article = { t, chrome, tags, locale, slug: SLUG };
  const no = t("a11y.no");

  const listLd = methodsLd(a, ALT_ITEMS);

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (<ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "ShareDrop alternative")]}>
            {/* Hero */}<ArticleHead a={a} updated={LAST_UPDATED} />
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {t.rich("hero.body", { strong, highlight, ...links })}
            </p>
            <p className="mt-4 rounded-xl border border-border bg-background-raised/60 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {t("disclosure")}
            </p>

            {/* Quick answer */}<QuickAnswer a={a} items={QUICK_ITEMS} /><HeroButtons a={a} />
            <Art a={a} name="hero" height={630} className="mt-8" />
{/* What happened */}
            <Section a={a} id="what" lead><ProseList a={a} name="what" items={WHAT_ITEMS} />
            </Section>

            {/* How discovery worked */}
            <Section a={a} id="how" lead><Art a={a} name="grouping" height={600} />
<ProseList a={a} name="how" items={HOW_ITEMS} />
            </Section>

            {/* Where it falls short */}
            <Section a={a} id="limits" lead><ProseList a={a} name="limits" items={LIMITS_ITEMS} />
            </Section>

            {/* The alternatives */}
            <Section a={a} id="methods" lead><Methods a={a} items={ALT_ITEMS} />
            </Section>

            {/* Comparison table */}
            <Section a={a} id="glance" name="table"><TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[700px]" />
            </Section>

            {/* Other networks */}
            <Section a={a} id="rooms" lead><Art a={a} name="online" height={600} />
<ProseList a={a} name="rooms" items={ROOMS_ITEMS} />
            </Section>

            {/* Self-hosting */}
            <Section a={a} id="selfhost" lead><Art a={a} name="hosting" height={600} />
<ProseList a={a} name="selfhost" items={SELFHOST_ITEMS} />
            </Section>

            {/* Pick by moment */}
            <Section a={a} id="choose" lead><ProseList a={a} name="choose" items={CHOOSE_ITEMS} />
            </Section>

            {/* Security */}
            <Section a={a} id="security" lead><ProseList a={a} name="security" items={SECURITY_ITEMS} />
            </Section>

            {/* FAQ */}
            <Section a={a} id="faq"><Faq a={a} items={FAQ_ITEMS} />
            </Section>

            {/* CTA */}<Cta a={a} /></ArticlePage>);
}
