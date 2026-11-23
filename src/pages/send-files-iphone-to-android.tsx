import { getTranslations } from "@/i18n/translate";
import { type Article, articleMetadata, faqPageLd, webPageLd, methodsLd, ArticlePage, ArticleHead, HeroButtons, Art, Section, ProseList, QuickAnswer, Methods, TruthTable, Faq, Cta, strong, highlight } from "@/ui/article";
import { pageUrl } from "@/lib/og";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";
import { guideLinks } from "@/ui/guide-links";

/**
 * "Send files from iPhone to Android" — a how-to query whose SERP (EaseUS,
 * Wondershare, AirDroid, Carlcare, MakeUseOf) still opens with "AirDrop does
 * not work with Android" and pushes SHAREit or a paid desktop tool. Two 2026
 * changes are missing from all of them: Quick Share's AirDrop compatibility on
 * a named list of Android phones, and Transfer to Android in iOS 26.3 for
 * people leaving the iPhone.
 *
 * So the page separates "send a file" from "switch phones", ranks eight real
 * routes with their catches, covers the photo-format traps (HEIC, Live
 * Photos, chat compression) and the usual discovery failures.
 *
 * Content lives in the "iphoneToAndroid" namespace, 13 locales. Bump
 * LAST_UPDATED when the supported-phone list or Apple's migration steps are
 * re-checked.
 */

const SLUG = "/send-files-iphone-to-android";
const NS = "iphoneToAndroid";
const LAST_UPDATED = "2026-11-12";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5", "6"] as const;
const CHANGED_ITEMS = ["0", "1", "2"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7"] as const;
const SWITCH_ITEMS = ["0", "1", "2"] as const;
const STEP_ITEMS = ["0", "1", "2"] as const;
const PHOTO_ITEMS = ["0", "1", "2", "3"] as const;
// Long videos: added 2026-10-14 for the video queries Search Console shows at
// positions 10 to 21 ("how to send long videos from iphone to android").
const VIDEO_ITEMS = ["0", "1", "2", "3"] as const;
// Sending a video at all: added 2026-11-12 for the 60+ video queries Search
// Console shows at positions 6 to 9 ("how to send video from iphone to android").
const SEND_VIDEO_ITEMS = ["0", "1", "2", "3"] as const;
const SPEED_ITEMS = ["0", "1", "2"] as const;
const FIX_ITEMS = ["0", "1", "2", "3", "4"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "11", "12", "2", "13", "3", "4", "10", "5", "6", "7", "8", "9"] as const;

/* Comparison truth table. Columns: BIShare · AirDrop to Quick Share ·
   iCloud link / Mail Drop · Google Drive · WhatsApp document · USB-C drive.
   Conditions behind each cell are spelled out in table.note. */
const APPS = ["bishare", "quickshare", "icloud", "drive", "whatsapp", "usb"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // any Android · any iPhone · nothing on Android · not nearby · original
  // quality · no cloud/chat account · files over 5 GB · end-to-end encrypted
  { id: "r0", v: [true, false, true, true, true, true] },
  { id: "r1", v: [true, true, true, true, true, false] },
  { id: "r2", v: [true, true, true, true, false, true] },
  { id: "r3", v: [true, false, true, true, true, false] },
  { id: "r4", v: [true, true, true, true, true, true] },
  { id: "r5", v: [true, true, false, false, false, true] },
  { id: "r6", v: [true, true, false, true, false, true] },
  { id: "r7", v: [true, true, false, false, true, false] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function IphoneToAndroidPage({
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

  const listLd = methodsLd(a, ALT_ITEMS);

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (<ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "Send files from iPhone to Android")]}>
            {/* Hero */}<ArticleHead a={a} updated={LAST_UPDATED} />
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {t.rich("hero.body", { strong, highlight, ...links })}
            </p>
            <p className="mt-4 rounded-xl border border-border bg-background-raised/60 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {t("disclosure")}
            </p>

            {/* Quick answer */}<QuickAnswer a={a} items={QUICK_ITEMS} /><HeroButtons a={a} />
            <Art a={a} name="hero" height={630} className="mt-8" />
{/* What changed in 2026 */}
            <Section a={a} id="changed" lead><ProseList a={a} name="changed" items={CHANGED_ITEMS} />
            </Section>

            {/* The alternatives */}
            <Section a={a} id="methods"><Art a={a} name="decide" height={800} /><Methods a={a} items={ALT_ITEMS} />
            </Section>

            {/* Comparison table */}
            <Section a={a} id="glance" name="table"><TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[640px]" />
            </Section>

            {/* Switching phones for good */}
            <Section a={a} id="switching" lead><Art a={a} name="switchTo" height={640} />
<ProseList a={a} name="switching" items={SWITCH_ITEMS} />
            </Section>

            {/* Step by step */}
            <Section a={a} id="steps"><ProseList a={a} name="steps" items={STEP_ITEMS} />
            </Section>

            {/* Photo formats */}
            <Section a={a} id="photos" lead><Art a={a} name="photos" height={640} />
<ProseList a={a} name="photos" items={PHOTO_ITEMS} />
            </Section>

            {/* Sending a video */}
            <Section a={a} id="send-video" name="video" lead><ProseList a={a} name="video" items={SEND_VIDEO_ITEMS} />
            </Section>

            {/* Long videos */}
            <Section a={a} id="long-video" name="longVideo" lead><ProseList a={a} name="longVideo" items={VIDEO_ITEMS} />
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
