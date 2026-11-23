import { getTranslations } from "@/i18n/translate";
import { type Article, articleMetadata, faqPageLd, webPageLd, methodsLd, ArticlePage, ArticleHead, HeroButtons, Art, Section, ProseList, QuickAnswer, Methods, TruthTable, Faq, Cta, strong, highlight } from "@/ui/article";
import { pageUrl } from "@/lib/og";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";
import { guideLinks } from "@/ui/guide-links";

/**
 * "Transfer files between two computers" — the SERP is vendor explainers
 * (Lenovo, HP, Dropbox, EaseUS) and How-To Geek style lists of drives,
 * shares and cloud folders. Few start from the pair of operating systems,
 * separate a new-computer migration from everyday transfers, or cover the
 * Windows 11 PC-to-PC transfer in Windows Backup.
 *
 * This page picks a method by pair (Windows, Mac, Linux), ranks eight
 * methods with requirements from Microsoft, Apple and Intel support pages,
 * then covers migration, drive formats, link speeds and common failures.
 *
 * Content lives in the "pcToPc" namespace, 13 locales. Bump LAST_UPDATED
 * when Windows Backup, Nearby sharing or Migration Assistant change.
 */

const SLUG = "/transfer-files-between-computers";
const NS = "pcToPc";
const LAST_UPDATED = "2026-11-12";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const PAIR_ITEMS = ["0", "1", "2", "3"] as const;
const METHOD_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7"] as const;
const MIGRATE_ITEMS = ["0", "1", "2", "3"] as const;
const FORMAT_ITEMS = ["0", "1", "2", "3"] as const;
const STEP_ITEMS = ["0", "1", "2"] as const;
const SPEED_ITEMS = ["0", "1", "2"] as const;
const FIX_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "11", "1", "10", "12", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Comparison truth table. Columns: BIShare · Windows Backup transfer ·
   Nearby sharing · network sharing · external drive · cloud folder.
   Conditions behind each cell are in table.note. */
const APPS = ["bishare", "backup", "nearby", "smb", "drive", "cloud"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // Windows↔Mac · settings too · no internet upload · any time · no hardware/plan
  { id: "r0", v: [true, false, false, true, true, true] },
  { id: "r1", v: [false, true, false, false, false, false] },
  { id: "r2", v: [true, true, true, true, true, false] },
  { id: "r3", v: [true, false, true, true, true, true] },
  { id: "r4", v: [true, true, true, true, false, false] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function PcToPcPage({
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

  const listLd = methodsLd(a, METHOD_ITEMS);

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (<ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "Transfer files between computers")]}>
            {/* Hero */}<ArticleHead a={a} updated={LAST_UPDATED} />
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {t.rich("hero.body", { strong, highlight, ...links })}
            </p>
            <p className="mt-4 rounded-xl border border-border bg-background-raised/60 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {t("disclosure")}
            </p>

            {/* Quick answer */}<QuickAnswer a={a} items={QUICK_ITEMS} /><HeroButtons a={a} />
            <Art a={a} name="hero" height={630} className="mt-8" />
{/* Start from the pair */}
            <Section a={a} id="pairs" lead><Art a={a} name="pairs" height={620} />
<ProseList a={a} name="pairs" items={PAIR_ITEMS} />
            </Section>

            {/* The alternatives */}
            <Section a={a} id="methods"><Methods a={a} items={METHOD_ITEMS} />
            </Section>

            {/* Comparison table */}
            <Section a={a} id="glance" name="table"><TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[640px]" />
            </Section>

            {/* Migration to a new computer */}
            <Section a={a} id="migrate" lead><Art a={a} name="moves" height={560} />
<ProseList a={a} name="migrate" items={MIGRATE_ITEMS} />
            </Section>

            {/* Formats */}
            <Section a={a} id="formats" lead><ProseList a={a} name="formats" items={FORMAT_ITEMS} />
            </Section>

            {/* Step by step */}
            <Section a={a} id="steps"><ProseList a={a} name="steps" items={STEP_ITEMS} />
            </Section>

            {/* Speed */}
            <Section a={a} id="speed" lead><Art a={a} name="speed" height={600} />
<ProseList a={a} name="speed" items={SPEED_ITEMS} />
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
