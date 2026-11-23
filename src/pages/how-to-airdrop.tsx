import { getTranslations } from "@/i18n/translate";
import { type Article, articleMetadata, faqPageLd, webPageLd, ArticlePage, ArticleHead, HeroButtons, Art, Section, ProseList, QuickAnswer, TruthTable, Faq, strong, highlight } from "@/ui/article";
import { Button } from "@/ui/button";
import { StoreButtons } from "@/ui/store-buttons";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";
import { ArrowRight } from "@/ui/icons";
import { guideLinks } from "@/ui/guide-links";

/**
 * "How to AirDrop" — the largest question cluster around AirDrop that we had
 * no page for. Semrush (US, October 2026): "how to airdrop" 9,900 a month at
 * keyword difficulty 27, "how to turn on airdrop" 8,100, "how to airdrop
 * photos" 2,400, Mac to iPhone 1,900, "where do airdrop photos go" 1,600,
 * "how to change airdrop name" about 5,000 across its spellings. The first
 * page is Apple Support twice, then ordinary how-to articles of 800 to 1,800
 * words (Asurion, Virgin Media, CNET, Verizon), none of which mention AirDrop
 * codes (iOS 26.2), the Android bridge or where received files are saved.
 *
 * The reader owns Apple devices, so the page teaches AirDrop properly and
 * only brings in BIShare where AirDrop stops: Windows, Linux, most Android
 * phones, someone far away. Fixes belong to /airdrop-not-working; this page
 * points there instead of repeating them.
 *
 * Content lives in the "howToAirdrop" namespace, 13 locales. Every step is
 * taken from Apple's iPhone and Mac User Guides, Apple Support article 119857
 * and Apple's platform security guide. Bump LAST_UPDATED when they are
 * re-read.
 */

const SLUG = "/how-to-airdrop";
const NS = "howToAirdrop";
const LAST_UPDATED = "2026-10-03";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const BASICS_ITEMS = ["0", "1", "2", "3"] as const;
const TURNON_ITEMS = ["0", "1", "2", "3"] as const;
const SEND_ITEMS = ["0", "1", "2", "3", "4"] as const;
const MAC_ITEMS = ["0", "1", "2", "3"] as const;
const RECEIVE_ITEMS = ["0", "1", "2", "3"] as const;
const STRANGER_ITEMS = ["0", "1", "2"] as const;
const SETTING_ITEMS = ["0", "1", "2", "3"] as const;
const REACH_ITEMS = ["0", "1", "2", "3"] as const;
const STEP_ITEMS = ["0", "1", "2"] as const;
const TROUBLE_ITEMS = ["0", "1", "2"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"] as const;

/* Reach table. Columns: AirDrop · BIShare, as of 3 October 2026;
   table.note carries the conditions behind the ticks and crosses. */
const APPS = ["airdrop", "bishare"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // built in · Apple to Apple · listed Android · other Android · Windows
  // · Linux · no internet · another city
  { id: "r0", v: [true, false] },
  { id: "r1", v: [true, true] },
  { id: "r2", v: [true, true] },
  { id: "r3", v: [false, true] },
  { id: "r4", v: [false, true] },
  { id: "r5", v: [false, true] },
  { id: "r6", v: [true, true] },
  { id: "r7", v: [false, true] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function HowToAirdropPage({
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

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (<ArticlePage a={a} ld={[faqLd, pageLd, breadcrumbLd(SLUG, "How to AirDrop")]}>
            {/* Hero */}<ArticleHead a={a} updated={LAST_UPDATED} />
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {t.rich("hero.body", { strong, highlight, ...links })}
            </p>
            <p className="mt-4 rounded-xl border border-border bg-background-raised/60 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {t("disclosure")}
            </p>

            {/* Quick answer */}<QuickAnswer a={a} items={QUICK_ITEMS} /><HeroButtons a={a} />
            <Art a={a} name="hero" height={630} className="mt-8" />
{/* What it is and what it needs */}
            <Section a={a} id="basics" lead><ProseList a={a} name="basics" items={BASICS_ITEMS} />
            </Section>

            {/* Turn it on */}
            <Section a={a} id="turn-on" name="turnon" lead><Art a={a} name="options" height={600} />
<ProseList a={a} name="turnon" items={TURNON_ITEMS} />
            </Section>

            {/* Send from iPhone or iPad */}
            <Section a={a} id="send" lead><ProseList a={a} name="send" items={SEND_ITEMS} />
            </Section>

            {/* Mac */}
            <Section a={a} id="mac" lead><ProseList a={a} name="mac" items={MAC_ITEMS} />
            </Section>

            {/* Receive, and where files go */}
            <Section a={a} id="receive" lead><Art a={a} name="landing" height={640} />
<ProseList a={a} name="receive" items={RECEIVE_ITEMS} />
            </Section>

            {/* Not in your contacts */}
            <Section a={a} id="not-in-contacts" name="strangers" lead><ProseList a={a} name="strangers" items={STRANGER_ITEMS} />
            </Section>

            {/* Name, off switch and other settings */}
            <Section a={a} id="settings" lead><ProseList a={a} name="settings" items={SETTING_ITEMS} />
            </Section>

            {/* What it reaches */}
            <Section a={a} id="reach" lead><Art a={a} name="reach" height={620} />
<ProseList a={a} name="reach" items={REACH_ITEMS} />
            </Section>

            {/* Reach table */}
            <Section a={a} id="compare" name="table"><TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[460px]" />
            </Section>

            {/* Sending to a device AirDrop cannot reach */}
            <Section a={a} id="steps"><ProseList a={a} name="steps" items={STEP_ITEMS} />
            </Section>

            {/* When it does not work */}
            <Section a={a} id="not-working" name="trouble" lead><ProseList a={a} name="trouble" items={TROUBLE_ITEMS} />
            </Section>

            {/* Safety */}
            <Section a={a} id="security" lead><ProseList a={a} name="security" items={SECURITY_ITEMS} />
            </Section>

            {/* FAQ */}
            <Section a={a} id="faq"><Faq a={a} items={FAQ_ITEMS} />
            </Section>

            {/* CTA */}
            <section className="mt-16 rounded-xl border border-border bg-card p-8 text-center">
              <h2 className="text-2xl font-semibold tracking-[-0.02em]">
                {t("cta.title")}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                {t("cta.body")}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button href="/download" size="lg">
                  {t("cta.download")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button href="/transfer" size="lg" variant="secondary">
                  {t("cta.transfer")}
                </Button>
              </div>
              <div className="mt-5 flex justify-center">
                <StoreButtons />
              </div>
            </section></ArticlePage>);
}
