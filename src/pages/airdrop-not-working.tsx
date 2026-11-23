import { getTranslations } from "@/i18n/translate";
import { type Article, articleMetadata, faqPageLd, webPageLd, methodsLd, ArticlePage, ArticleHead, HeroButtons, Art, Section, ProseList, QuickAnswer, Methods, TruthTable, Faq, Cta, strong, highlight } from "@/ui/article";
import { pageUrl } from "@/lib/og";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";
import { guideLinks } from "@/ui/guide-links";

/**
 * "AirDrop not working" — the SERP is Apple's short checklist, Apple Community
 * threads and 2024 fix lists (XDA, Tom's Guide) that predate iOS 26.2 AirDrop
 * codes and Android phones joining AirDrop through Quick Share.
 *
 * This page starts from the symptom, lists Apple's own requirements, gives
 * iPhone/iPad and Mac fixes, explains the deliberate changes that look like
 * bugs (iOS 16.2, 17, 17.1, 26.2) and covers non-Apple recipients.
 *
 * Content lives in the "airdropFix" namespace, 13 locales. Bump LAST_UPDATED
 * when Apple changes AirDrop receiving rules or Google's Quick Share list.
 */

const SLUG = "/airdrop-not-working";
const NS = "airdropFix";
const LAST_UPDATED = "2026-11-12";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const DIAGNOSE_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const NEED_ITEMS = ["0", "1", "2", "3", "4"] as const;
const IPHONE_ITEMS = ["0", "1", "2", "3", "4", "5", "6"] as const;
const MAC_ITEMS = ["0", "1", "2", "3", "4"] as const;
const CHANGE_ITEMS = ["0", "1", "2", "3", "4"] as const;
const OTHER_ITEMS = ["0", "1", "2"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["10", "11", "12", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Comparison truth table. Columns: BIShare, Quick Share with AirDrop, iCloud
   link, the open-source local app, USB cable. Conditions behind each cell are
   in table.note. */
const APPS = ["bishare", "quickshare", "icloud", "localsend", "cable"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // Android · Windows · far away · offline · nearby off servers · no extra app on iPhone
  { id: "r0", v: [true, true, true, true, false] },
  { id: "r1", v: [true, false, true, true, true] },
  { id: "r2", v: [true, false, true, false, false] },
  { id: "r3", v: [true, true, false, true, true] },
  { id: "r4", v: [true, true, false, true, true] },
  { id: "r5", v: [false, true, true, false, true] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function AirdropNotWorkingPage({
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

  return (<ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "AirDrop not working")]}>
            {/* Hero */}<ArticleHead a={a} updated={LAST_UPDATED} />
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {t.rich("hero.body", { strong, highlight, ...links })}
            </p>
            <p className="mt-4 rounded-xl border border-border bg-background-raised/60 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {t("disclosure")}
            </p>

            {/* Quick answer */}<QuickAnswer a={a} items={QUICK_ITEMS} /><HeroButtons a={a} />
            <Art a={a} name="hero" height={630} className="mt-8" />
{/* Symptom first */}
            <Section a={a} id="diagnose" lead><Art a={a} name="symptoms" height={600} />
<ProseList a={a} name="diagnose" items={DIAGNOSE_ITEMS} />
            </Section>

            {/* Apple's requirements */}
            <Section a={a} id="needs" lead><Art a={a} name="needs" height={600} />
<ProseList a={a} name="needs" items={NEED_ITEMS} />
            </Section>

            {/* iPhone and iPad fixes */}
            <Section a={a} id="iphone" lead><ProseList a={a} name="iphone" items={IPHONE_ITEMS} />
            </Section>

            {/* Mac fixes */}
            <Section a={a} id="mac" lead><ProseList a={a} name="mac" items={MAC_ITEMS} />
            </Section>

            {/* Deliberate changes */}
            <Section a={a} id="changes" lead><Art a={a} name="timeline" height={600} />
<ProseList a={a} name="changes" items={CHANGE_ITEMS} />
            </Section>

            {/* Non-Apple recipients */}
            <Section a={a} id="other" lead><ProseList a={a} name="other" items={OTHER_ITEMS} />
            </Section>

            {/* The alternatives */}
            <Section a={a} id="methods" lead><Methods a={a} items={ALT_ITEMS} />
            </Section>

            {/* Comparison table */}
            <Section a={a} id="glance" name="table"><TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[640px]" />
            </Section>

            {/* Security */}
            <Section a={a} id="security" lead><ProseList a={a} name="security" items={SECURITY_ITEMS} />
            </Section>

            {/* FAQ */}
            <Section a={a} id="faq"><Faq a={a} items={FAQ_ITEMS} />
            </Section>

            {/* CTA */}<Cta a={a} /></ArticlePage>);
}
