import { getTranslations } from "@/i18n/translate";
import { type Article, articleMetadata, faqPageLd, webPageLd, methodsLd, ArticlePage, ArticleHead, HeroButtons, Art, Section, ProseList, QuickAnswer, Methods, TruthTable, Faq, Cta, strong, highlight } from "@/ui/article";
import { pageUrl } from "@/lib/og";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";
import { guideLinks } from "@/ui/guide-links";

/**
 * "Android File Transfer for Mac" — moving files between an Android phone and
 * a Mac now that Google's own app is gone.
 *
 * Semrush (2026-10-14, semrush/2026-10-14/android_mac_research.md): the query
 * is the English app name in every market — "android file transfer mac" is
 * 3,600 a month in the US, 1,600 in Germany and France, 1,000 in Japan (KD 29)
 * and 880 in Indonesia — and local phrasings are 0 to 110. Around it sit
 * questions at KD 13 to 36 ("how to transfer photos from android to mac",
 * "connect android phone to mac") whose page one is forum threads, a vendor
 * page with one referring domain and mirrors of the retired app. Search
 * Console showed no impressions for the cluster.
 *
 * The page starts with what happened to Google's app and why a mirror copy is
 * a poor answer, ranks eight routes with limits from their own sites, gives
 * the cable route and the wireless route step by step, the way back from Mac
 * to Android, photos without quality loss, speed and fixes.
 *
 * Content lives in the "androidMac" namespace, 13 locales. Bump LAST_UPDATED
 * when OpenMTP, MacDroid, NearDrop or Quick Share change.
 */

const SLUG = "/android-file-transfer-mac";
const NS = "androidMac";
const LAST_UPDATED = "2026-11-12";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const STATUS_ITEMS = ["0", "1", "2"] as const;
const METHOD_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7"] as const;
const CHOOSE_ITEMS = ["0", "1", "2", "3"] as const;
const CABLE_ITEMS = ["0", "1", "2", "3", "4"] as const;
const STEP_ITEMS = ["0", "1", "2"] as const;
const REVERSE_ITEMS = ["0", "1", "2", "3"] as const;
const PHOTO_ITEMS = ["0", "1", "2"] as const;
const SPEED_ITEMS = ["0", "1", "2"] as const;
const FIX_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "12", "13", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"] as const;

/* Comparison truth table. Columns: BIShare · Quick Share to AirDrop · OpenMTP ·
   MacDroid · NearDrop · Google Drive. Conditions behind each cell are in
   table.note. */
const APPS = ["bishare", "quickshare", "openmtp", "macdroid", "neardrop", "drive"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // no cable · Mac to Android as well · any Android phone · no internet · free both ways · open source
  { id: "r0", v: [true, true, false, true, true, true] },
  { id: "r1", v: [true, false, true, true, true, true] },
  { id: "r2", v: [true, false, true, true, true, true] },
  { id: "r3", v: [true, true, true, true, true, false] },
  { id: "r4", v: [true, true, true, false, true, true] },
  { id: "r5", v: [true, false, true, false, true, false] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function AndroidMacPage({
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

  return (<ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "Android File Transfer for Mac")]}>
            {/* Hero */}<ArticleHead a={a} updated={LAST_UPDATED} />
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {t.rich("hero.body", tags)}
            </p>
            <p className="mt-4 rounded-xl border border-border bg-background-raised/60 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {t("disclosure")}
            </p>

            {/* Quick answer */}<QuickAnswer a={a} items={QUICK_ITEMS} /><HeroButtons a={a} />
            <Art a={a} name="hero" height={630} className="mt-8" />
{/* What happened to Google's app */}
            <Section a={a} id="status" lead><Art a={a} name="status" height={600} />
<ProseList a={a} name="status" items={STATUS_ITEMS} />
            </Section>

            {/* The eight routes */}
            <Section a={a} id="methods"><Methods a={a} items={METHOD_ITEMS} />
            </Section>

            {/* Comparison table */}
            <Section a={a} id="glance" name="table"><TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[680px]" />
            </Section>

            {/* Pick a route */}
            <Section a={a} id="choose" lead><Art a={a} name="routes" height={640} />
<ProseList a={a} name="choose" items={CHOOSE_ITEMS} />
            </Section>

            {/* With a USB cable */}
            <Section a={a} id="cable" lead><ProseList a={a} name="cable" items={CABLE_ITEMS} />
            </Section>

            {/* Without a cable, step by step */}
            <Section a={a} id="steps" lead><ProseList a={a} name="steps" items={STEP_ITEMS} />
            </Section>

            {/* Mac to Android */}
            <Section a={a} id="reverse" lead><ProseList a={a} name="reverse" items={REVERSE_ITEMS} />
            </Section>

            {/* Photos and videos */}
            <Section a={a} id="photos" lead><ProseList a={a} name="photos" items={PHOTO_ITEMS} />
            </Section>

            {/* Speed */}
            <Section a={a} id="speed" lead><ProseList a={a} name="speed" items={SPEED_ITEMS} />
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
