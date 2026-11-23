import { getTranslations } from "@/i18n/translate";
import { type Article, articleMetadata, faqPageLd, webPageLd, methodsLd, ArticlePage, ArticleHead, HeroButtons, Art, Section, ProseList, QuickAnswer, Methods, TruthTable, Faq, Cta, strong, highlight } from "@/ui/article";
import { pageUrl } from "@/lib/og";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";
import { guideLinks } from "@/ui/guide-links";

/**
 * "Share files without an account" — the SERP is vendor pages (fast.io,
 * storage.to, EasySend, GetShared), Microsoft's Office link help and a
 * Dropbox KB. None separates "the sender needs no account" from "the recipient
 * needs no account", and most quote stale free limits.
 *
 * This page splits the question into its three groups, ranks eight routes
 * with limits read from each service's own pages, explains what an account
 * would have given you (revoke, extend, receipts, password) and what still
 * identifies you without one.
 *
 * Content lives in the "noAccountShare" namespace, 13 locales. Bump
 * LAST_UPDATED when a listed service changes a free-tier limit.
 */

const SLUG = "/share-files-without-account";
const NS = "noAccountShare";
const LAST_UPDATED = "2026-09-16";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const SIDE_ITEMS = ["0", "1", "2"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7"] as const;
const CONTROL_ITEMS = ["0", "1", "2", "3"] as const;
const IDENTITY_ITEMS = ["0", "1", "2"] as const;
const STEP_ITEMS = ["0", "1", "2", "3"] as const;
const CHOOSE_ITEMS = ["0", "1", "2", "3", "4"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Truth table. Columns: BIShare · SwissTransfer · Wormhole · Smash ·
   Google Drive link · Dropbox Transfer. Conditions are in table.note. */
const APPS = ["bishare", "swiss", "wormhole", "smash", "drive", "dropbox"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // sender needs no account
  { id: "r0", v: [true, true, true, true, false, false] },
  // recipient needs no account
  { id: "r1", v: [true, true, true, true, true, true] },
  // encrypted before upload
  { id: "r2", v: [true, false, true, false, false, false] },
  // more than 10 GB per transfer, free
  { id: "r3", v: [true, true, false, true, true, false] },
  // link expires by itself
  { id: "r4", v: [true, true, true, true, false, true] },
  // open source
  { id: "r5", v: [true, false, false, false, false, false] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function NoAccountSharePage({
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

  return (<ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "Share files without an account")]}>
            {/* Hero */}<ArticleHead a={a} updated={LAST_UPDATED} />
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {t.rich("hero.body", { strong, highlight, ...links })}
            </p>
            <p className="mt-4 rounded-xl border border-border bg-background-raised/60 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {t("disclosure")}
            </p>

            {/* Quick answer */}<QuickAnswer a={a} items={QUICK_ITEMS} /><HeroButtons a={a} />
            <Art a={a} name="hero" height={630} className="mt-8" />
{/* Two sides of the question */}
            <Section a={a} id="sides" lead><Art a={a} name="sides" height={600} />
<ProseList a={a} name="sides" items={SIDE_ITEMS} />
            </Section>

            {/* The eight routes */}
            <Section a={a} id="methods"><Methods a={a} items={ALT_ITEMS} />
            </Section>

            {/* Comparison table */}
            <Section a={a} id="glance" name="table"><Art a={a} name="limits" height={660} /><TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[640px]" />
            </Section>

            {/* What an account would have given you */}
            <Section a={a} id="controls" lead><Art a={a} name="controls" height={600} />
<ProseList a={a} name="controls" items={CONTROL_ITEMS} />
            </Section>

            {/* What still identifies you */}
            <Section a={a} id="identity" lead><ProseList a={a} name="identity" items={IDENTITY_ITEMS} />
            </Section>

            {/* Step by step */}
            <Section a={a} id="steps"><ProseList a={a} name="steps" items={STEP_ITEMS} />
            </Section>

            {/* Pick by job */}
            <Section a={a} id="choose" lead><ProseList a={a} name="choose" items={CHOOSE_ITEMS} />
            </Section>

            {/* Safety */}
            <Section a={a} id="security" lead><ProseList a={a} name="security" items={SECURITY_ITEMS} />
            </Section>

            {/* FAQ */}
            <Section a={a} id="faq"><Faq a={a} items={FAQ_ITEMS} />
            </Section>

            {/* CTA */}<Cta a={a} /></ArticlePage>);
}
