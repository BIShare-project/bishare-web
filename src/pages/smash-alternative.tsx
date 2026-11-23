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
 * "Smash alternative" — the SERP is Transfer.zip's five-item listicle, fast.io,
 * FileFlap, storage.to, EveryTransfer and AlternativeTo. All of them name
 * replacements; none explains the thing people are actually escaping, which is
 * not a size cap but a queue.
 *
 * The angle, verified this month: fromsmash.com's home page promises transfers
 * "without any size limits" with no footnote, while its pricing page puts free
 * transfers over 2 GB in a queue behind Pro. Both are true at once. So the page
 * is built around certainty rather than gigabytes, and it says plainly where
 * staying on Smash is the better call.
 *
 * Content lives in the "smashAlt" namespace, 13 locales. Bump LAST_UPDATED
 * when Smash or a listed service changes a free-tier limit.
 */

const SLUG = "/smash-alternative";
const NS = "smashAlt";
const LAST_UPDATED = "2026-09-16";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const QUEUE_ITEMS = ["0", "1", "2", "3"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7"] as const;
const PREDICT_ITEMS = ["0", "1", "2"] as const;
const STEP_ITEMS = ["0", "1", "2", "3"] as const;
const CHOOSE_ITEMS = ["0", "1", "2", "3", "4"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Truth table. Columns: BIShare · Smash · SwissTransfer · Wormhole · Filemail ·
   WeTransfer, all on their FREE tier. Conditions are spelled out in table.note. */
const APPS = ["bishare", "smash", "swiss", "wormhole", "filemail", "wetransfer"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // open source
  { id: "r0", v: [true, false, false, false, false, false] },
  // delivery never queued — the whole point of the page
  { id: "r1", v: [true, false, true, true, true, true] },
  // more than 10 GB in one transfer (Smash has no stated ceiling)
  { id: "r2", v: [true, true, true, false, false, false] },
  // password, or a link that dies on first download
  { id: "r3", v: [true, true, true, false, false, false] },
  // encrypted in the browser, before anything is uploaded
  { id: "r4", v: [true, false, false, true, false, false] },
  // kept longer than 24 hours
  { id: "r5", v: [false, true, true, false, true, true] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function SmashAltPage({ locale }: { locale: string }) {
  const a = await article(NS, SLUG, locale);
  const { t } = a;

  const listLd = methodsLd(a, ALT_ITEMS);

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (
    <ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "Smash alternative")]}>
      {/* Hero */}
      <ArticleHead a={a} updated={LAST_UPDATED} />
      <Lead a={a} />
      <Disclosure a={a} />

      {/* Quick answer */}
      <QuickAnswer a={a} items={QUICK_ITEMS} />
      <HeroButtons a={a} />
      <Art a={a} name="hero" height={630} className="mt-8" />
      {/* What the queue is */}
      <Section a={a} id="queue" lead art={["queue", 600]} items={QUEUE_ITEMS} />

      {/* The eight alternatives */}
      <Section a={a} id="methods">
        <Methods a={a} items={ALT_ITEMS} />
      </Section>

      {/* Comparison table */}
      <Section a={a} id="glance" name="table">
        <Art a={a} name="limits" height={660} />
        <TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[640px]" />
      </Section>

      {/* What sets delivery time */}
      <Section a={a} id="predict" lead items={PREDICT_ITEMS} />

      {/* Switching */}
      <Section a={a} id="steps" items={STEP_ITEMS} />

      {/* Pick by job */}
      <Section a={a} id="choose" lead art={["choose", 620]} items={CHOOSE_ITEMS} />

      {/* Who can read what */}
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
