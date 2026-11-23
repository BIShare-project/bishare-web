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

export default async function AndroidMacPage({ locale }: { locale: string }) {
  const a = await article(NS, SLUG, locale);
  const { t } = a;

  const listLd = methodsLd(a, METHOD_ITEMS);

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (
    <ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "Android File Transfer for Mac")]}>
      {/* Hero */}
      <ArticleHead a={a} updated={LAST_UPDATED} />
      <Lead a={a} />
      <Disclosure a={a} />

      {/* Quick answer */}
      <QuickAnswer a={a} items={QUICK_ITEMS} />
      <HeroButtons a={a} />
      <Art a={a} name="hero" height={630} className="mt-8" />
      {/* What happened to Google's app */}
      <Section a={a} id="status" lead art={["status", 600]} items={STATUS_ITEMS} />

      {/* The eight routes */}
      <Section a={a} id="methods">
        <Methods a={a} items={METHOD_ITEMS} />
      </Section>

      {/* Comparison table */}
      <Section a={a} id="glance" name="table">
        <TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[680px]" />
      </Section>

      {/* Pick a route */}
      <Section a={a} id="choose" lead art={["routes", 640]} items={CHOOSE_ITEMS} />

      {/* With a USB cable */}
      <Section a={a} id="cable" lead items={CABLE_ITEMS} />

      {/* Without a cable, step by step */}
      <Section a={a} id="steps" lead items={STEP_ITEMS} />

      {/* Mac to Android */}
      <Section a={a} id="reverse" lead items={REVERSE_ITEMS} />

      {/* Photos and videos */}
      <Section a={a} id="photos" lead items={PHOTO_ITEMS} />

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
