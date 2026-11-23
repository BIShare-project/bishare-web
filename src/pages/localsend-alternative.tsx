import { getTranslations } from "@/i18n/translate";
import { type Article, articleMetadata, faqPageLd, webPageLd, methodsLd, ArticlePage, ArticleHead, HeroButtons, Art, Section, ProseList, QuickAnswer, Methods, TruthTable, Faq, Cta, strong, highlight } from "@/ui/article";
import { pageUrl } from "@/lib/og";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";
import { guideLinks } from "@/ui/guide-links";

/**
 * "LocalSend alternative" — the SERP is AlternativeTo lists, a Hacker News
 * thread and vendor pages (PlainApp, MacDroid) that name tools without
 * saying why people leave LocalSend: it only works on one local network, and
 * discovery breaks on isolated or Public networks.
 *
 * This page explains what LocalSend does and where it stops, compares it with
 * BIShare side by side, ranks seven alternatives with details from their own
 * repositories and sites, and fixes the discovery problems.
 *
 * Content lives in the "localsendAlt" namespace, 13 locales. Bump
 * LAST_UPDATED when LocalSend or a listed tool changes how it reaches devices.
 */

const SLUG = "/localsend-alternative";
const NS = "localsendAlt";
const LAST_UPDATED = "2026-11-12";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const LIMIT_ITEMS = ["0", "1", "2"] as const;
const VERSUS_ITEMS = ["0", "1", "2", "3"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5", "6"] as const;
const CHOOSE_ITEMS = ["0", "1", "2", "3"] as const;
const STEP_ITEMS = ["0", "1", "2"] as const;
const FIX_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "10", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Comparison truth table. Columns: BIShare · LocalSend · PairDrop ·
   KDE Connect · Blip · Warpinator. Conditions behind each cell are in
   table.note. */
const APPS = ["bishare", "localsend", "pairdrop", "kde", "blip", "warpinator"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // open source · other network · browser recipient · offline · iPhone app · no account
  { id: "r0", v: [true, true, true, true, false, true] },
  { id: "r1", v: [true, false, true, false, true, false] },
  { id: "r2", v: [true, true, true, false, false, false] },
  { id: "r3", v: [true, true, false, true, false, true] },
  { id: "r4", v: [true, true, false, true, true, false] },
  { id: "r5", v: [true, true, true, true, false, true] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function LocalsendAltPage({
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

  return (<ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "LocalSend alternative")]}>
            {/* Hero */}<ArticleHead a={a} updated={LAST_UPDATED} />
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {t.rich("hero.body", { strong, highlight, ...links })}
            </p>
            <p className="mt-4 rounded-xl border border-border bg-background-raised/60 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {t("disclosure")}
            </p>

            {/* Quick answer */}<QuickAnswer a={a} items={QUICK_ITEMS} /><HeroButtons a={a} />
            <Art a={a} name="hero" height={630} className="mt-8" />
{/* What LocalSend does and where it stops */}
            <Section a={a} id="limits" lead><Art a={a} name="reach" height={600} />
<ProseList a={a} name="limits" items={LIMIT_ITEMS} />
            </Section>

            {/* Side by side */}
            <Section a={a} id="versus" lead><Art a={a} name="versus" height={600} />
<ProseList a={a} name="versus" items={VERSUS_ITEMS} />
            </Section>

            {/* The alternatives */}
            <Section a={a} id="methods"><Methods a={a} items={ALT_ITEMS} />
            </Section>

            {/* Comparison table */}
            <Section a={a} id="glance" name="table"><TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[640px]" />
            </Section>

            {/* Pick by situation */}
            <Section a={a} id="choose" lead><Art a={a} name="choose" height={600} />
<ProseList a={a} name="choose" items={CHOOSE_ITEMS} />
            </Section>

            {/* Step by step */}
            <Section a={a} id="steps"><ProseList a={a} name="steps" items={STEP_ITEMS} />
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
