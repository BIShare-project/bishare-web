import {
  article,
  Lead,
  Disclosure,
  articleMetadata,
  faqPageLd,
  webPageLd,
  methodsLd,
  ArticlePage,
  ArticleHead,
  HeroButtons,
  Art,
  Section,
  QuickAnswer,
  Methods,
  TruthTable,
  Faq,
  Cta,
} from "@/ui/article";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";

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

export default async function IphoneToAndroidPage({ locale }: { locale: string }) {
  const a = await article(NS, SLUG, locale);
  const { t } = a;

  const listLd = methodsLd(a, ALT_ITEMS);

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (
    <ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "Send files from iPhone to Android")]}>
      {/* Hero */}
      <ArticleHead a={a} updated={LAST_UPDATED} />
      <Lead a={a} />
      <Disclosure a={a} />

      {/* Quick answer */}
      <QuickAnswer a={a} items={QUICK_ITEMS} />
      <HeroButtons a={a} />
      <Art a={a} name="hero" height={630} className="mt-8" />
      {/* What changed in 2026 */}
      <Section a={a} id="changed" lead items={CHANGED_ITEMS} />

      {/* The alternatives */}
      <Section a={a} id="methods">
        <Art a={a} name="decide" height={800} />
        <Methods a={a} items={ALT_ITEMS} />
      </Section>

      {/* Comparison table */}
      <Section a={a} id="glance" name="table">
        <TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[640px]" />
      </Section>

      {/* Switching phones for good */}
      <Section a={a} id="switching" lead art={["switchTo", 640]} items={SWITCH_ITEMS} />

      {/* Step by step */}
      <Section a={a} id="steps" items={STEP_ITEMS} />

      {/* Photo formats */}
      <Section a={a} id="photos" lead art={["photos", 640]} items={PHOTO_ITEMS} />

      {/* Sending a video */}
      <Section a={a} id="send-video" name="video" lead items={SEND_VIDEO_ITEMS} />

      {/* Long videos */}
      <Section a={a} id="long-video" name="longVideo" lead items={VIDEO_ITEMS} />

      {/* Speed */}
      <Section a={a} id="speed" lead items={SPEED_ITEMS} />

      {/* Troubleshooting */}
      <Section a={a} id="fixes" items={FIX_ITEMS} />

      {/* Security */}
      <Section a={a} id="security" lead items={SECURITY_ITEMS} />

      {/* FAQ */}
      <Section a={a} id="faq">
        <Faq a={a} items={FAQ_ITEMS} />
      </Section>

      {/* CTA */}
      <Cta a={a} />
    </ArticlePage>
  );
}
