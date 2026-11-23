import { getTranslations } from "@/i18n/translate";
import { type Article, articleMetadata, faqPageLd, webPageLd, methodsLd, ArticlePage, ArticleHead, HeroButtons, Art, Section, ProseList, QuickAnswer, Methods, TruthTable, Faq, Cta, strong, highlight } from "@/ui/article";
import { pageUrl } from "@/lib/og";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";
import { guideLinks } from "@/ui/guide-links";

/**
 * "Nearby Share alternative" — the SERP is AlternativeTo, Softonic, a 2020
 * NerdsChalk list written before Nearby Share shipped, and Wondershare/MobiKin
 * "Quick Share vs Nearby Share" explainers. None says where Quick Share still
 * stops in 2026 (Mac, Linux, phones without Google services, far away) or covers
 * the unofficial clients (NearDrop, RQuickShare, Packet).
 *
 * This page dates the rename, untangles the three features called Nearby Share,
 * maps Quick Share's reach from Google's help pages, ranks seven alternatives
 * and explains how the unofficial clients connect.
 *
 * Content lives in the "nearbyShareAlt" namespace, 13 locales. Bump
 * LAST_UPDATED when Quick Share's platforms or requirements change.
 */

const SLUG = "/nearby-share-alternative";
const NS = "nearbyShareAlt";
const LAST_UPDATED = "2026-11-12";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const WHAT_ITEMS = ["0", "1", "2", "3", "4"] as const;
const NAMES_ITEMS = ["0", "1", "2"] as const;
const REACH_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5", "6"] as const;
const UNOFFICIAL_ITEMS = ["0", "1", "2", "3"] as const;
const CHOOSE_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const FIXES_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "10", "4", "5", "6", "7", "8", "9"] as const;

/* Comparison truth table. Columns: Quick Share, BIShare, LocalSend, KDE Connect,
   PairDrop, NearDrop, RQuickShare.
   Conditions behind each cell are in table.note. */
const APPS = ["quickshare", "bishare", "localsend", "kdeconnect", "pairdrop", "neardrop", "rquickshare"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // Android · iPhone · Windows · Mac · Linux · nothing on the phone · far away · open source
  { id: "r0", v: [true, true, true, true, true, true, true] },
  { id: "r1", v: [true, true, true, true, true, false, false] },
  { id: "r2", v: [true, true, true, true, true, false, false] },
  { id: "r3", v: [false, true, true, true, true, true, true] },
  { id: "r4", v: [false, true, true, true, true, false, true] },
  { id: "r5", v: [true, false, false, false, true, true, true] },
  { id: "r6", v: [false, true, false, false, true, false, false] },
  { id: "r7", v: [false, true, true, true, true, true, true] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function NearbyShareAltPage({
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

  const listLd = methodsLd(a, ALT_ITEMS);

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (<ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "Nearby Share alternative")]}>
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
            <Section a={a} id="what" lead><Art a={a} name="timeline" height={600} />
<ProseList a={a} name="what" items={WHAT_ITEMS} />
            </Section>

            {/* Same name, three features */}
            <Section a={a} id="names" lead><ProseList a={a} name="names" items={NAMES_ITEMS} />
            </Section>

            {/* Where Quick Share reaches */}
            <Section a={a} id="reach" lead><Art a={a} name="reach" height={600} />
<ProseList a={a} name="reach" items={REACH_ITEMS} />
            </Section>

            {/* The alternatives */}
            <Section a={a} id="methods" lead><Methods a={a} items={ALT_ITEMS} />
            </Section>

            {/* Comparison table */}
            <Section a={a} id="glance" name="table"><TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[760px]" />
            </Section>

            {/* Unofficial Quick Share clients */}
            <Section a={a} id="unofficial" lead><Art a={a} name="bridge" height={600} />
<ProseList a={a} name="unofficial" items={UNOFFICIAL_ITEMS} />
            </Section>

            {/* Pick by gap */}
            <Section a={a} id="choose" lead><ProseList a={a} name="choose" items={CHOOSE_ITEMS} />
            </Section>

            {/* Fix Quick Share first */}
            <Section a={a} id="fixes" lead><ProseList a={a} name="fixes" items={FIXES_ITEMS} />
            </Section>

            {/* Security */}
            <Section a={a} id="security" lead><ProseList a={a} name="security" items={SECURITY_ITEMS} />
            </Section>

            {/* FAQ */}
            <Section a={a} id="faq"><Faq a={a} items={FAQ_ITEMS} />
            </Section>

            {/* CTA */}<Cta a={a} /></ArticlePage>);
}
