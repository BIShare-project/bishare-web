import { getTranslations } from "@/i18n/translate";
import { type Article, articleMetadata, faqPageLd, webPageLd, methodsLd, ArticlePage, ArticleHead, HeroButtons, Art, Section, ProseList, QuickAnswer, Methods, TruthTable, Faq, Cta, strong, highlight } from "@/ui/article";
import { pageUrl } from "@/lib/og";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";
import { guideLinks } from "@/ui/guide-links";

/**
 * "Send files from Android to iPhone" — the SERP (Dr.Fone, MobileTrans,
 * AirDroid, TechPP, MobileOS) mixes one-off sharing with full migration and
 * mostly predates the three 2026 shortcuts: Quick Share to AirDrop on a
 * named list of phones, the Quick Share QR code for any iPhone (Google's
 * limits: 10 GB per 24 hours, 24-hour links), and Android 17 migrating to a
 * new iPhone without Move to iOS.
 *
 * The page ranks eight routes, separates switching from sending, and adds
 * what competitors skip: where the files land on the iPhone (Photos vs
 * Safari's iCloud Drive downloads vs an app inbox) and why motion photos
 * arrive still.
 *
 * Content lives in the "androidToIphone" namespace, 13 locales. Bump
 * LAST_UPDATED when Google's Quick Share help page or Apple's migration
 * article change.
 */

const SLUG = "/send-files-android-to-iphone";
const NS = "androidToIphone";
const LAST_UPDATED = "2026-09-13";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const NEWS_ITEMS = ["0", "1", "2"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7"] as const;
const SWITCH_ITEMS = ["0", "1", "2"] as const;
const LANDING_ITEMS = ["0", "1", "2"] as const;
const STEP_ITEMS = ["0", "1", "2"] as const;
const MOTION_ITEMS = ["0", "1", "2"] as const;
const SPEED_ITEMS = ["0", "1", "2"] as const;
const FIX_ITEMS = ["0", "1", "2", "3", "4"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Comparison truth table. Columns: BIShare · Quick Share to AirDrop ·
   Quick Share QR code · Google Photos / Drive · WhatsApp file · USB-C drive.
   Conditions behind each cell are spelled out in table.note. */
const APPS = ["bishare", "airdrop", "qr", "photos", "whatsapp", "usb"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // any Android · any iPhone · nothing on iPhone · not nearby · original
  // quality · works offline · more than 10 GB at once · end-to-end encrypted
  { id: "r0", v: [true, false, false, true, true, true] },
  { id: "r1", v: [true, true, true, true, true, false] },
  { id: "r2", v: [true, true, true, true, false, true] },
  { id: "r3", v: [true, false, true, true, true, false] },
  { id: "r4", v: [true, true, true, true, true, true] },
  { id: "r5", v: [true, true, false, false, false, true] },
  { id: "r6", v: [true, true, false, true, false, true] },
  { id: "r7", v: [true, true, true, false, true, false] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function AndroidToIphonePage({
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

  const listLd = methodsLd(a, ALT_ITEMS);

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (<ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "Send files from Android to iPhone")]}>
            {/* Hero */}<ArticleHead a={a} updated={LAST_UPDATED} />
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {t.rich("hero.body", { strong, highlight, ...links })}
            </p>
            <p className="mt-4 rounded-xl border border-border bg-background-raised/60 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {t("disclosure")}
            </p>

            {/* Quick answer */}<QuickAnswer a={a} items={QUICK_ITEMS} /><HeroButtons a={a} />
            <Art a={a} name="hero" height={630} className="mt-8" />
{/* Three 2026 shortcuts */}
            <Section a={a} id="news" lead><Art a={a} name="qr" height={600} />
<ProseList a={a} name="news" items={NEWS_ITEMS} />
            </Section>

            {/* The alternatives */}
            <Section a={a} id="methods"><Methods a={a} items={ALT_ITEMS} />
            </Section>

            {/* Comparison table */}
            <Section a={a} id="glance" name="table"><TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[640px]" />
            </Section>

            {/* Switching phones for good */}
            <Section a={a} id="switching" lead><Art a={a} name="migrate" height={600} />
<ProseList a={a} name="switching" items={SWITCH_ITEMS} />
            </Section>

            {/* Where files land on the iPhone */}
            <Section a={a} id="landing" lead><Art a={a} name="landing" height={620} />
<ProseList a={a} name="landing" items={LANDING_ITEMS} />
            </Section>

            {/* Step by step */}
            <Section a={a} id="steps"><ProseList a={a} name="steps" items={STEP_ITEMS} />
            </Section>

            {/* Motion photos and other quirks */}
            <Section a={a} id="motion"><ProseList a={a} name="motion" items={MOTION_ITEMS} />
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
