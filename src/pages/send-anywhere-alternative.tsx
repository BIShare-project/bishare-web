import { getTranslations } from "@/i18n/translate";
import { type Article, articleMetadata, faqPageLd, webPageLd, methodsLd, ArticlePage, ArticleHead, HeroButtons, Art, Section, ProseList, QuickAnswer, Methods, TruthTable, Faq, Cta, strong, highlight } from "@/ui/article";
import { pageUrl } from "@/lib/og";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";
import { guideLinks } from "@/ui/guide-links";

/**
 * "Send Anywhere alternative" — the SERP is Capterra, vendor pages
 * (Transfer.zip, storage.to, SwiftSend, TransferRocket), Softonic and
 * AlternativeTo. None explains Send Anywhere's three modes, the March 2023
 * 10 GB monthly download pool on the sender's account, or the dated notices.
 *
 * This page dates the changes from Send Anywhere's own Help Center, compares
 * key, link and Directly To Device limits, ranks seven alternatives and maps
 * each Send Anywhere habit to a replacement.
 *
 * Content lives in the "sendAnywhereAlt" namespace, 13 locales. Bump
 * LAST_UPDATED after re-checking send-anywhere.com/pricing and the Help Center.
 */

const SLUG = "/send-anywhere-alternative";
const NS = "sendAnywhereAlt";
const LAST_UPDATED = "2026-09-14";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const CHANGES_ITEMS = ["0", "1", "2", "3", "4"] as const;
const MODES_ITEMS = ["0", "1", "2"] as const;
const LIMITS_ITEMS = ["0", "1", "2", "3", "4"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5", "6"] as const;
const CHOOSE_ITEMS = ["0", "1", "2", "3", "4"] as const;
const STEPS_ITEMS = ["0", "1", "2"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Comparison truth table. Columns: BIShare, PairDrop, Wormhole, Transfer.zip, LocalSend,
   Smash.
   Conditions behind each cell are in table.note. */
const APPS = ["bishare", "pairdrop", "wormhole", "transferzip", "localsend", "smash"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // free stored link · free links over 10 GB · direct transfer · no internet · recipient needs no app · open source
  { id: "r0", v: [true, false, true, false, false, true] },
  { id: "r1", v: [true, false, false, false, false, true] },
  { id: "r2", v: [true, true, true, true, true, false] },
  { id: "r3", v: [true, false, false, false, true, false] },
  { id: "r4", v: [true, true, true, true, false, true] },
  { id: "r5", v: [true, true, false, true, true, false] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function SendAnywhereAltPage({
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

  return (<ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "Send Anywhere alternative")]}>
            {/* Hero */}<ArticleHead a={a} updated={LAST_UPDATED} />
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {t.rich("hero.body", { strong, highlight, ...links })}
            </p>
            <p className="mt-4 rounded-xl border border-border bg-background-raised/60 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {t("disclosure")}
            </p>

            {/* Quick answer */}<QuickAnswer a={a} items={QUICK_ITEMS} /><HeroButtons a={a} />
            <Art a={a} name="hero" height={630} className="mt-8" />
{/* What changed */}
            <Section a={a} id="changes" lead><Art a={a} name="timeline" height={600} />
<ProseList a={a} name="changes" items={CHANGES_ITEMS} />
            </Section>

            {/* Three modes */}
            <Section a={a} id="modes" lead><Art a={a} name="modes" height={600} />
<ProseList a={a} name="modes" items={MODES_ITEMS} />
            </Section>

            {/* Limits */}
            <Section a={a} id="limits" lead><Art a={a} name="pool" height={600} />
<ProseList a={a} name="limits" items={LIMITS_ITEMS} />
            </Section>

            {/* The alternatives */}
            <Section a={a} id="methods" lead><Methods a={a} items={ALT_ITEMS} />
            </Section>

            {/* Comparison table */}
            <Section a={a} id="glance" name="table"><TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[700px]" />
            </Section>

            {/* Replace each habit */}
            <Section a={a} id="choose" lead><ProseList a={a} name="choose" items={CHOOSE_ITEMS} />
            </Section>

            {/* Step by step */}
            <Section a={a} id="steps"><ProseList a={a} name="steps" items={STEPS_ITEMS} />
            </Section>

            {/* Security */}
            <Section a={a} id="security" lead><ProseList a={a} name="security" items={SECURITY_ITEMS} />
            </Section>

            {/* FAQ */}
            <Section a={a} id="faq"><Faq a={a} items={FAQ_ITEMS} />
            </Section>

            {/* CTA */}<Cta a={a} /></ArticlePage>);
}
