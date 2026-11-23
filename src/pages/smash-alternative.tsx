import { getTranslations } from "@/i18n/translate";
import { type Article, articleMetadata, faqPageLd, webPageLd, methodsLd, ArticlePage, ArticleHead, HeroButtons, Art, Section, ProseList, QuickAnswer, Methods, TruthTable, Faq, Cta, strong, highlight } from "@/ui/article";
import { pageUrl } from "@/lib/og";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";
import { guideLinks } from "@/ui/guide-links";

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

export default async function SmashAltPage({
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

  return (<ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "Smash alternative")]}>
            {/* Hero */}<ArticleHead a={a} updated={LAST_UPDATED} />
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {t.rich("hero.body", { strong, highlight, ...links })}
            </p>
            <p className="mt-4 rounded-xl border border-border bg-background-raised/60 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {t("disclosure")}
            </p>

            {/* Quick answer */}<QuickAnswer a={a} items={QUICK_ITEMS} /><HeroButtons a={a} />
            <Art a={a} name="hero" height={630} className="mt-8" />
{/* What the queue is */}
            <Section a={a} id="queue" lead><Art a={a} name="queue" height={600} />
<ProseList a={a} name="queue" items={QUEUE_ITEMS} />
            </Section>

            {/* The eight alternatives */}
            <Section a={a} id="methods"><Methods a={a} items={ALT_ITEMS} />
            </Section>

            {/* Comparison table */}
            <Section a={a} id="glance" name="table"><Art a={a} name="limits" height={660} /><TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[640px]" />
            </Section>

            {/* What sets delivery time */}
            <Section a={a} id="predict" lead><ProseList a={a} name="predict" items={PREDICT_ITEMS} />
            </Section>

            {/* Switching */}
            <Section a={a} id="steps"><ProseList a={a} name="steps" items={STEP_ITEMS} />
            </Section>

            {/* Pick by job */}
            <Section a={a} id="choose" lead><Art a={a} name="choose" height={620} />
<ProseList a={a} name="choose" items={CHOOSE_ITEMS} />
            </Section>

            {/* Who can read what */}
            <Section a={a} id="security" lead><ProseList a={a} name="security" items={SECURITY_ITEMS} />
            </Section>

            {/* FAQ */}
            <Section a={a} id="faq"><Faq a={a} items={FAQ_ITEMS} />
            </Section>

            {/* CTA */}<Cta a={a} /></ArticlePage>);
}
