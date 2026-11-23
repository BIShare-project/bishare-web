import { getTranslations } from "@/i18n/translate";
import { type Article, articleMetadata, faqPageLd, webPageLd, ArticlePage, ArticleHead, HeroButtons, Art, Section, ProseList, QuickAnswer, TruthTable, Faq, Cta, strong, highlight } from "@/ui/article";
import { pageUrl } from "@/lib/og";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";
import { guideLinks } from "@/ui/guide-links";

/**
 * "AirDrop alternative" — the whole cross-platform cluster lands here. The
 * page has to answer three different searchers at once: someone whose group
 * is half Android, someone on Windows or Linux, and someone whose AirDrop
 * simply stopped working between two Apple devices.
 *
 * The 2026 angle the competing listicles all miss: Quick Share now speaks
 * AirDrop's protocol on a specific list of Android handsets (Pixel 10 from
 * November 2025, Pixel 9 from February 2026, Samsung across March–April
 * 2026, then others), which changes the honest answer for iPhone ↔ Android
 * and narrows where a third-party tool is still needed. `interop` says so
 * plainly rather than pretending the gap is untouched.
 *
 * Content lives in the "airdropAlt" namespace, 13 locales. Bump LAST_UPDATED
 * whenever the facts here are re-checked — it drives the visible dated line
 * and WebPage.dateModified.
 */

const SLUG = "/airdrop-alternative";
const NS = "airdropAlt";
const LAST_UPDATED = "2026-09-13";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5", "6"] as const;
const WHY_ITEMS = ["0", "1", "2", "3"] as const;
const INTEROP_ITEMS = ["0", "1", "2"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7"] as const;
const PAIR_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const STEP_ITEMS = ["0", "1", "2"] as const;
const SPEED_ITEMS = ["0", "1", "2"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] as const;

/* Comparison truth table. Columns: AirDrop · BIShare · LocalSend ·
   Quick Share · PairDrop · Wormhole. Checked September 2026 against each
   tool's own documentation — see table.note for the conditions. */
const APPS = [
  "airdrop",
  "bishare",
  "localsend",
  "quickshare",
  "pairdrop",
  "wormhole",
] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // cross-platform · nearby instant · other network · E2E · nothing to install
  // · no account · works offline · free, no ads, open source
  { id: "r0", v: [false, true, true, false, true, true] },
  { id: "r1", v: [true, true, true, true, true, false] },
  { id: "r2", v: [false, true, false, false, true, true] },
  { id: "r3", v: [true, true, true, true, true, true] },
  { id: "r4", v: [false, true, false, false, true, true] },
  { id: "r5", v: [true, true, true, false, true, true] },
  { id: "r6", v: [true, true, true, true, false, false] },
  { id: "r7", v: [false, true, true, false, true, false] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function AirdropAlternativePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations(NS);
  const links = guideLinks();
  const tags = { strong, highlight, ...links };
  const chrome = await getTranslations("chrome");
  const a: Article = { t, chrome, tags, locale, slug: SLUG };

  const no = t("a11y.no");

  const selfUrl = pageUrl(SLUG, locale);

  const listLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("alts.title"),
    itemListElement: ALT_ITEMS.map((i, n) => ({
      "@type": "ListItem",
      position: n + 1,
      name: t(`alts.items.${i}.name`),
      description: t(`alts.items.${i}.tag`),
      // Each entry needs an address of its own: the anchor on its card below.
      url: `${selfUrl}#item-${n + 1}`,
    })),
  };

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (<ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "AirDrop alternative")]}>
            {/* Hero */}<ArticleHead a={a} updated={LAST_UPDATED} />
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {t.rich("hero.body", { strong, highlight, ...links })}
            </p>
            <p className="mt-4 rounded-xl border border-border bg-background-raised/60 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {t("disclosure")}
            </p>

            {/* Quick answer */}<QuickAnswer a={a} items={QUICK_ITEMS} /><HeroButtons a={a} />
            <Art a={a} name="hero" height={630} className="mt-8" />
{/* Why AirDrop stops */}
            <Section a={a} id="why" lead><ProseList a={a} name="why" items={WHY_ITEMS} />
            </Section>

            {/* 2026: Quick Share ↔ AirDrop */}
            <Section a={a} id="interop" lead><Art a={a} name="reach" height={700} />
<ProseList a={a} name="interop" items={INTEROP_ITEMS} />
            </Section>

            {/* The alternatives */}
            <Section a={a} id="alternatives" name="alts">
              <div className="mt-6 space-y-8">
                {ALT_ITEMS.map((i, n) => (
                  <div
                    key={i}
                    id={`item-${n + 1}`}
                    className="scroll-mt-28 border-b border-border pb-8 last:border-0 last:pb-0"
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-sm font-semibold text-accent-blue">
                        {String(n + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold">
                          {t(`alts.items.${i}.name`)}
                        </h3>
                        <p className="mt-0.5 text-sm font-medium text-accent-blue">
                          {t(`alts.items.${i}.tag`)}
                        </p>
                        <p className="mt-3 font-mono text-[12px] leading-relaxed text-muted-foreground">
                          {t(`alts.items.${i}.facts`)}
                        </p>
                        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                          {t.rich(`alts.items.${i}.body`, links)}
                        </p>
                        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {t("alts.consLabel")}
                          </span>{" "}
                          {t(`alts.items.${i}.cons`)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Comparison table */}
            <Section a={a} id="glance" name="table"><TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[640px]" />
            </Section>

            {/* Device pairs */}
            <Section a={a} id="pairs"><Art a={a} name="pairs" height={720} />
<ProseList a={a} name="pairs" items={PAIR_ITEMS} />
            </Section>

            {/* Step by step */}
            <Section a={a} id="steps"><ProseList a={a} name="steps" items={STEP_ITEMS} />
            </Section>

            {/* Speed */}
            <Section a={a} id="speed" lead><Art a={a} name="time" height={520} />
<ProseList a={a} name="speed" items={SPEED_ITEMS} />
            </Section>

            {/* Security */}
            <Section a={a} id="security" lead><ProseList a={a} name="security" items={SECURITY_ITEMS} />
            </Section>

            {/* FAQ */}
            <Section a={a} id="faq"><Faq a={a} items={FAQ_ITEMS} />
            </Section>

            {/* CTA */}<Cta a={a} /></ArticlePage>);
}
