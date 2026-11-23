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
 * "Transfer files to iPad" — Semrush (2026-10-04): "how to transfer files to
 * ipad" 2,400 a month in the US at KD 42, plus "pc to ipad" 210, "computer to
 * ipad" 170, "usb drive on ipad" 390 and the reverse "ipad to pc/computer"
 * about 500. Page one: an Apple Community thread, Reddit, two Apple guides,
 * wikiHow, Readdle, Syncios and two Facebook group posts. None of them starts
 * from where the file has to end up on the iPad, which is what decides the
 * route, and none gives the USB-C speed of each model.
 *
 * Content lives in the "toIpad" namespace, 13 locales. Bump LAST_UPDATED when
 * Apple's iPad guide, Apple Devices or the iPad lineup change.
 */

const SLUG = "/transfer-files-to-ipad";
const NS = "toIpad";
const LAST_UPDATED = "2026-10-04";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const WHERE_ITEMS = ["0", "1", "2"] as const;
const METHOD_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7"] as const;
const CHOOSE_ITEMS = ["0", "1", "2", "3"] as const;
const DRIVE_ITEMS = ["0", "1", "2", "3"] as const;
const REVERSE_ITEMS = ["0", "1", "2", "3"] as const;
const STEP_ITEMS = ["0", "1", "2"] as const;
const SPEED_ITEMS = ["0", "1", "2"] as const;
const FIX_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] as const;

/* Comparison truth table. Columns: BIShare · AirDrop · Finder or Apple
   Devices with a cable · iCloud Drive · shared folder from the Files app ·
   USB drive. Conditions behind each cell are in table.note. */
const APPS = ["bishare", "airdrop", "cable", "icloud", "server", "drive"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // from a Windows PC · from an Android phone · any file type · no internet · no account
  { id: "r0", v: [true, false, true, true, true, true] },
  { id: "r1", v: [true, false, false, true, false, true] },
  { id: "r2", v: [true, true, false, true, true, true] },
  { id: "r3", v: [true, true, true, false, true, true] },
  { id: "r4", v: [true, true, true, false, false, true] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function ToIpadPage({ locale }: { locale: string }) {
  const a = await article(NS, SLUG, locale);
  const { t } = a;

  const listLd = methodsLd(a, METHOD_ITEMS);

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (
    <ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "Files to iPad")]}>
      {/* Hero */}
      <ArticleHead a={a} updated={LAST_UPDATED} />
      <Lead a={a} />
      <Disclosure a={a} />

      {/* Quick answer */}
      <QuickAnswer a={a} items={QUICK_ITEMS} />
      <HeroButtons a={a} />
      <Art a={a} name="hero" height={630} className="mt-8" />
      {/* Where the file has to end up */}
      <Section a={a} id="where" lead art={["where", 620]} items={WHERE_ITEMS} />

      {/* The eight routes */}
      <Section a={a} id="methods">
        <Methods a={a} items={METHOD_ITEMS} />
      </Section>

      {/* Comparison table */}
      <Section a={a} id="glance" name="table">
        <TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[640px]" />
      </Section>

      {/* Pick a route */}
      <Section a={a} id="choose" lead art={["routes", 640]} items={CHOOSE_ITEMS} />

      {/* A USB drive or SD card on the iPad */}
      <Section a={a} id="drive" lead art={["ports", 600]} items={DRIVE_ITEMS} />

      {/* The other direction: iPad to computer */}
      <Section a={a} id="reverse" lead items={REVERSE_ITEMS} />

      {/* Step by step */}
      <Section a={a} id="steps" items={STEP_ITEMS} />

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
