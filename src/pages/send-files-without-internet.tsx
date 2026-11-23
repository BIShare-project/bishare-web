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
 * "Send files without internet" — the SERP is vendor pages (PlainApp,
 * OfflineSharing), PC-to-PC migration guides (EaseUS, uBackup) and a Quora
 * thread; none separates "a network with no internet" from "no network at
 * all", and none states what AirDrop, Quick Share and Windows Nearby sharing
 * actually require (their support pages do).
 *
 * This page sorts the offline situations, ranks seven routes with the
 * requirements from Apple, Google and Microsoft, explains hotspots and routers
 * without a WAN, gives measured speeds, and fixes discovery failures.
 *
 * Content lives in the "offlineTransfer" namespace, 13 locales. Bump
 * LAST_UPDATED when a vendor changes an offline requirement.
 */

const SLUG = "/send-files-without-internet";
const NS = "offlineTransfer";
const LAST_UPDATED = "2026-09-16";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const MODE_ITEMS = ["0", "1", "2"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5", "6"] as const;
const HOTSPOT_ITEMS = ["0", "1", "2", "3"] as const;
const SPEED_ITEMS = ["0", "1", "2"] as const;
const STEP_ITEMS = ["0", "1", "2", "3"] as const;
const FIX_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] as const;

/* Truth table. Columns: BIShare · AirDrop · Quick Share · LocalSend ·
   Bluetooth · USB. Conditions behind each cell are in table.note. */
const APPS = ["bishare", "airdrop", "quick", "localsend", "bluetooth", "usb"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // works with no internet
  { id: "r0", v: [true, true, true, true, true, true] },
  // phone to a Windows PC
  { id: "r1", v: [true, false, true, true, true, true] },
  // iPhone to Android (Quick Share's QR route needs internet)
  { id: "r2", v: [true, true, false, true, false, false] },
  // no size limit
  { id: "r3", v: [true, true, true, true, false, true] },
  // needs no router or hotspot
  { id: "r4", v: [false, true, true, false, true, true] },
  // encrypted on the way
  { id: "r5", v: [true, true, true, true, true, false] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function OfflineTransferPage({ locale }: { locale: string }) {
  const a = await article(NS, SLUG, locale);
  const { t } = a;

  const listLd = methodsLd(a, ALT_ITEMS);

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (
    <ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "Send files without internet")]}>
      {/* Hero */}
      <ArticleHead a={a} updated={LAST_UPDATED} />
      <Lead a={a} />
      <Disclosure a={a} />

      {/* Quick answer */}
      <QuickAnswer a={a} items={QUICK_ITEMS} />
      <HeroButtons a={a} />
      <Art a={a} name="hero" height={630} className="mt-8" />
      {/* Three offline situations */}
      <Section a={a} id="modes" lead art={["modes", 600]} items={MODE_ITEMS} />

      {/* The seven routes */}
      <Section a={a} id="methods">
        <Methods a={a} items={ALT_ITEMS} />
      </Section>

      {/* QR Beam */}
      <Section a={a} id="beam" lead />

      {/* Comparison table */}
      <Section a={a} id="glance" name="table">
        <Art a={a} name="pairs" height={640} />
        <TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[640px]" />
      </Section>

      {/* Hotspot or router */}
      <Section a={a} id="hotspot" lead items={HOTSPOT_ITEMS} />

      {/* Speed */}
      <Section a={a} id="speed" lead art={["speed", 620]} items={SPEED_ITEMS} />

      {/* Step by step */}
      <Section a={a} id="steps" items={STEP_ITEMS} />

      {/* Discovery fixes */}
      <Section a={a} id="fixes" lead items={FIX_ITEMS} />

      {/* Privacy */}
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
