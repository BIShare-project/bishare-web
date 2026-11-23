import { getTranslations } from "@/i18n/translate";
import { type Article, articleMetadata, faqPageLd, webPageLd, methodsLd, ArticlePage, ArticleHead, HeroButtons, Art, Section, ProseList, QuickAnswer, Methods, TruthTable, Faq, Cta, strong, highlight } from "@/ui/article";
import { pageUrl } from "@/lib/og";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";
import { guideLinks } from "@/ui/guide-links";

/**
 * "AirDrop for Android" — the SERP mixes 2024 listicles that still say Android
 * cannot AirDrop (AirDroid, Wondershare), rollout news (9to5Google, MacRumors,
 * TechRadar) and Play Store apps borrowing the AirDrop name.
 *
 * Since November 2025 Quick Share speaks AirDrop on a growing list of phones,
 * so this page checks the list, sets up both devices, states what the bridge
 * still misses (Everyone for 10 Minutes only, nearby only, listed phones) and
 * ranks six routes for every other Android phone.
 *
 * Content lives in the "airdrop" namespace, 13 locales. Bump LAST_UPDATED
 * when Google's Quick Share with iPhone list or the visibility modes change.
 */

const SLUG = "/airdrop-for-android";
const NS = "airdrop";
const LAST_UPDATED = "2026-10-17";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const MEANING_ITEMS = ["0", "1", "2"] as const;
const PHONE_ITEMS = ["0", "1", "2", "3"] as const;
/* phoneTable rows follow Google's Quick Share with iPhone page: brand, works now, listed as coming soon. */
const PHONE_TABLE_ROWS = ["0", "1", "2", "3", "4", "5", "6", "7"] as const;
const PHONE_TABLE_COLS = ["0", "1", "2"] as const;
const SETUP_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const ANDROID_ITEMS = ["0", "1", "2"] as const;
const LIMIT_ITEMS = ["0", "1", "2", "3"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const FIX_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["10", "11", "0", "12", "13", "1", "2", "3", "14", "4", "5", "6", "7", "8", "9", "15"] as const;

/* Comparison truth table. Columns: Quick Share with AirDrop, Quick Share QR
   code, BIShare, the open-source local app, PairDrop, Send Anywhere.
   Conditions behind each cell are in table.note. */
const APPS = ["qsad", "qsqr", "bishare", "localsend", "pairdrop", "sendanywhere"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // any Android · nothing on iPhone · Windows/Linux · offline · iPhone to Android · built in
  { id: "r0", v: [false, true, true, true, true, true] },
  { id: "r1", v: [true, true, true, false, true, true] },
  { id: "r2", v: [false, false, true, true, true, true] },
  { id: "r3", v: [true, false, true, true, false, false] },
  { id: "r4", v: [true, false, true, true, true, true] },
  { id: "r5", v: [true, true, false, false, false, false] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function AirdropForAndroidPage({
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

  const listLd = methodsLd(a, ALT_ITEMS);

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (<ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "AirDrop for Android")]}>
            {/* Hero */}<ArticleHead a={a} updated={LAST_UPDATED} />
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {t.rich("hero.body", { strong, highlight, ...links })}
            </p>
            <p className="mt-4 rounded-xl border border-border bg-background-raised/60 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {t("disclosure")}
            </p>

            {/* Quick answer */}<QuickAnswer a={a} items={QUICK_ITEMS} /><HeroButtons a={a} />
            <Art a={a} name="hero" height={630} className="mt-8" />
{/* Three meanings */}
            <Section a={a} id="meaning" lead><ProseList a={a} name="meaning" items={MEANING_ITEMS} />
            </Section>

            {/* Which phones are listed */}
            <Section a={a} id="phones" lead><Art a={a} name="phones" height={600} />
<ProseList a={a} name="phones" items={PHONE_ITEMS} />
<h3 className="mt-8 font-semibold">{t("phoneTable.title")}</h3>
              <div className="mt-3 overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background-raised text-muted-foreground">
                      {PHONE_TABLE_COLS.map((c) => (
                        <th key={c} className="px-4 py-3 text-left font-medium">
                          {t(`phoneTable.cols.${c}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PHONE_TABLE_ROWS.map((r) => (
                      <tr key={r} className="border-b border-border last:border-0">
                        {PHONE_TABLE_COLS.map((c) => (
                          <td
                            key={c}
                            className={`px-4 py-3 align-top ${
                              c === "0" ? "font-medium text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {t(`phoneTable.rows.${r}.${c}`)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {t("phoneTable.note")}
              </p>
            </Section>

            {/* Setup on both devices */}
            <Section a={a} id="setup" lead><Art a={a} name="modes" height={600} />
<ProseList a={a} name="setup" items={SETUP_ITEMS} />
            </Section>

            {/* Quick Share without Apple devices */}
            <Section a={a} id="android" lead><ProseList a={a} name="android" items={ANDROID_ITEMS} />
            </Section>

            {/* Limits of the bridge */}
            <Section a={a} id="limits" lead><ProseList a={a} name="limits" items={LIMIT_ITEMS} />
            </Section>

            {/* The alternatives */}
            <Section a={a} id="methods" lead><Art a={a} name="fallback" height={600} /><Methods a={a} items={ALT_ITEMS} />
            </Section>

            {/* Comparison table */}
            <Section a={a} id="glance" name="table"><TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[640px]" />
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
