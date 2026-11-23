import { getTranslations } from "@/i18n/translate";
import { type Article, articleMetadata, faqPageLd, webPageLd, methodsLd, ArticlePage, ArticleHead, HeroButtons, Art, Section, ProseList, QuickAnswer, Methods, TruthTable, Faq, Cta, strong, highlight } from "@/ui/article";
import { pageUrl } from "@/lib/og";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";
import { guideLinks } from "@/ui/guide-links";

/**
 * "WeTransfer alternative" — the SERP is dominated by competitors' own
 * listicles (Smash, Hypeshare, EveryTransfer, Brault) and Guru99-style lists
 * that quote WeTransfer's free plan loosely. Few explain how the 2026 free
 * plan actually counts (10 transfers or 3 GB in total per rolling 30 days,
 * 3-day links), or separate client delivery from private documents.
 *
 * This page leads with the quota, the reasons users started switching
 * (Bending Spoons acquisition, the July 2025 terms clause, ads), ranks eight
 * alternatives with limits from each service's own pages, maps size against
 * storage time, and picks by job.
 *
 * Content lives in the "wetransferAlt" namespace, 13 locales. Bump
 * LAST_UPDATED when WeTransfer or a listed service changes its free plan.
 */

const SLUG = "/wetransfer-alternative";
const NS = "wetransferAlt";
const LAST_UPDATED = "2026-10-17";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const QUOTA_ITEMS = ["0", "1", "2"] as const;
const LEAVING_ITEMS = ["0", "1", "2"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7"] as const;
const CHOOSE_ITEMS = ["0", "1", "2", "3"] as const;
const STEP_ITEMS = ["0", "1", "2"] as const;
const SPEED_ITEMS = ["0", "1", "2"] as const;
const FIX_ITEMS = ["0", "1", "2", "3", "4"] as const;
const SECURITY_ITEMS = ["0", "1", "2", "3"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "10", "5", "6", "7", "8", "9"] as const;

/* Comparison truth table. Columns: BIShare · WeTransfer free · SwissTransfer ·
   Smash · Wormhole · Filemail. Conditions behind each cell are in table.note. */
const APPS = ["bishare", "wetransfer", "swiss", "smash", "wormhole", "filemail"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // 50 GB+ free · kept a week+ · browser encryption · direct option · open source
  { id: "r0", v: [true, false, true, true, false, false] },
  { id: "r1", v: [false, false, true, true, false, true] },
  { id: "r2", v: [true, false, false, false, true, false] },
  { id: "r3", v: [true, false, false, false, true, false] },
  { id: "r4", v: [true, false, false, false, false, false] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function WetransferAltPage({
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

  return (<ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "WeTransfer alternative")]}>
            {/* Hero */}<ArticleHead a={a} updated={LAST_UPDATED} />
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {t.rich("hero.body", { strong, highlight, ...links })}
            </p>
            <p className="mt-4 rounded-xl border border-border bg-background-raised/60 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {t("disclosure")}
            </p>

            {/* Quick answer */}<QuickAnswer a={a} items={QUICK_ITEMS} /><HeroButtons a={a} />
            <Art a={a} name="hero" height={630} className="mt-8" />
{/* The free quota */}
            <Section a={a} id="free-plan" name="quota" lead><Art a={a} name="quota" height={600} />
<ProseList a={a} name="quota" items={QUOTA_ITEMS} />
            </Section>

            {/* Why people switch */}
            <Section a={a} id="why-switch" name="leaving" lead><ProseList a={a} name="leaving" items={LEAVING_ITEMS} />
            </Section>

            {/* The alternatives */}
            <Section a={a} id="methods"><Methods a={a} items={ALT_ITEMS} />
            </Section>

            {/* Comparison table */}
            <Section a={a} id="glance" name="table"><TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[640px]" />
<Art a={a} name="map" height={640} />
            </Section>

            {/* Pick by job */}
            <Section a={a} id="choose" lead><Art a={a} name="choose" height={600} />
<ProseList a={a} name="choose" items={CHOOSE_ITEMS} />
            </Section>

            {/* Step by step */}
            <Section a={a} id="steps"><ProseList a={a} name="steps" items={STEP_ITEMS} />
            </Section>

            {/* Speed */}
            <Section a={a} id="speed" lead><ProseList a={a} name="speed" items={SPEED_ITEMS} />
            </Section>

            {/* Troubleshooting */}
            <Section a={a} id="fixes"><ProseList a={a} name="fixes" items={FIX_ITEMS} />
            </Section>

            {/* Security */}
            <Section a={a} id="security" lead><ProseList a={a} name="security" items={SECURITY_ITEMS} />
            </Section>

            {/* FAQ */}
            <Section a={a} id="faq"><Faq a={a} items={FAQ_ITEMS} />
            </Section>

            {/* CTA */}<Cta a={a} /></ArticlePage>);
}
