import { getTranslations } from "@/i18n/translate";
import { type Article, articleMetadata, faqPageLd, webPageLd, methodsLd, ArticlePage, ArticleHead, HeroButtons, Art, Section, ProseList, QuickAnswer, Methods, TruthTable, Faq, Cta, strong, highlight } from "@/ui/article";
import { pageUrl } from "@/lib/og";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";
import { guideLinks } from "@/ui/guide-links";

/**
 * "SHAREit alternative" — the SERP is AlternativeTo and 2021-era listicles
 * (Beebom, MobiKin, Coolmuster) that name Xender and Snapdrop without saying
 * what changed: ads and extras, the 2021 Trend Micro findings, the India block,
 * and Google Play labels that declare unencrypted transfers.
 *
 * This page explains why people leave, what SHAREit got right, quotes each
 * alternative's Play labels, ranks seven options and covers sending installed
 * apps now that the Play Store's Share apps button is gone.
 *
 * Content lives in the "shareitAlt" namespace, 13 locales. Bump LAST_UPDATED
 * when a listed app's Play labels or availability change.
 */

const SLUG = "/shareit-alternative";
const NS = "shareitAlt";
const LAST_UPDATED = "2026-09-14";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const WHY_ITEMS = ["0", "1", "2", "3", "4"] as const;
const KEEP_ITEMS = ["0", "1", "2", "3"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5", "6"] as const;
const APP_ITEMS = ["0", "1", "2"] as const;
const CHOOSE_ITEMS = ["0", "1", "2", "3", "4"] as const;
const STEP_ITEMS = ["0", "1", "2"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Comparison truth table. Columns: BIShare, Quick Share, LocalSend, PairDrop,
   Xender, Send Anywhere. Conditions behind each cell are in table.note. */
const APPS = ["bishare", "quickshare", "localsend", "pairdrop", "xender", "sendanywhere"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // no ads · offline · Windows PC · iPhone · sends installed apps · open source
  { id: "r0", v: [true, true, true, true, false, false] },
  { id: "r1", v: [true, true, true, false, true, false] },
  { id: "r2", v: [true, true, true, true, true, true] },
  { id: "r3", v: [true, true, true, true, true, true] },
  { id: "r4", v: [true, false, true, false, true, true] },
  { id: "r5", v: [true, false, true, true, false, false] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function ShareitAltPage({
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

  return (<ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "SHAREit alternative")]}>
            {/* Hero */}<ArticleHead a={a} updated={LAST_UPDATED} />
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {t.rich("hero.body", { strong, highlight, ...links })}
            </p>
            <p className="mt-4 rounded-xl border border-border bg-background-raised/60 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {t("disclosure")}
            </p>

            {/* Quick answer */}<QuickAnswer a={a} items={QUICK_ITEMS} /><HeroButtons a={a} />
            <Art a={a} name="hero" height={630} className="mt-8" />
{/* Why people leave */}
            <Section a={a} id="why" lead><Art a={a} name="labels" height={600} />
<ProseList a={a} name="why" items={WHY_ITEMS} />
            </Section>

            {/* What to keep */}
            <Section a={a} id="keep" lead><ProseList a={a} name="keep" items={KEEP_ITEMS} />
            </Section>

            {/* The alternatives */}
            <Section a={a} id="methods" lead><Methods a={a} items={ALT_ITEMS} />
            </Section>

            {/* Comparison table */}
            <Section a={a} id="glance" name="table"><TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[640px]" />
            </Section>

            {/* Sending installed apps */}
            <Section a={a} id="apps" lead><Art a={a} name="apk" height={600} />
<ProseList a={a} name="apps" items={APP_ITEMS} />
            </Section>

            {/* Pick by destination */}
            <Section a={a} id="choose" lead><Art a={a} name="hub" height={600} />
<ProseList a={a} name="choose" items={CHOOSE_ITEMS} />
            </Section>

            {/* Step by step */}
            <Section a={a} id="steps"><ProseList a={a} name="steps" items={STEP_ITEMS} />
            </Section>

            {/* Security */}
            <Section a={a} id="security" lead><ProseList a={a} name="security" items={SECURITY_ITEMS} />
            </Section>

            {/* FAQ */}
            <Section a={a} id="faq"><Faq a={a} items={FAQ_ITEMS} />
            </Section>

            {/* CTA */}<Cta a={a} /></ArticlePage>);
}
