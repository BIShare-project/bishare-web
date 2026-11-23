import {
  article,
  Lead,
  Disclosure,
  articleMetadata,
  faqPageLd,
  webPageLd,
  methodsLd,
  ArticlePage,
  ArticleHead,
  HeroButtons,
  Art,
  Section,
  QuickAnswer,
  Methods,
  TruthTable,
  Faq,
  Cta,
} from "@/ui/article";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";

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

export default async function WetransferAltPage({ locale }: { locale: string }) {
  const a = await article(NS, SLUG, locale);
  const { t } = a;

  const listLd = methodsLd(a, ALT_ITEMS);

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (
    <ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "WeTransfer alternative")]}>
      {/* Hero */}
      <ArticleHead a={a} updated={LAST_UPDATED} />
      <Lead a={a} />
      <Disclosure a={a} />

      {/* Quick answer */}
      <QuickAnswer a={a} items={QUICK_ITEMS} />
      <HeroButtons a={a} />
      <Art a={a} name="hero" height={630} className="mt-8" />
      {/* The free quota */}
      <Section a={a} id="free-plan" name="quota" lead art={["quota", 600]} items={QUOTA_ITEMS} />

      {/* Why people switch */}
      <Section a={a} id="why-switch" name="leaving" lead items={LEAVING_ITEMS} />

      {/* The alternatives */}
      <Section a={a} id="methods">
        <Methods a={a} items={ALT_ITEMS} />
      </Section>

      {/* Comparison table */}
      <Section a={a} id="glance" name="table">
        <TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[640px]" />
        <Art a={a} name="map" height={640} />
      </Section>

      {/* Pick by job */}
      <Section a={a} id="choose" lead art={["choose", 600]} items={CHOOSE_ITEMS} />

      {/* Step by step */}
      <Section a={a} id="steps" items={STEP_ITEMS} />

      {/* Speed */}
      <Section a={a} id="speed" lead items={SPEED_ITEMS} />

      {/* Troubleshooting */}
      <Section a={a} id="fixes" items={FIX_ITEMS} />

      {/* Security */}
      <Section a={a} id="security" lead items={SECURITY_ITEMS} />

      {/* FAQ */}
      <Section a={a} id="faq">
        <Faq a={a} items={FAQ_ITEMS} />
      </Section>

      {/* CTA */}
      <Cta a={a} />
    </ArticlePage>
  );
}
