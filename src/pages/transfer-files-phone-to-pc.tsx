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
 * "Transfer files from phone to PC" — the SERP (Wondershare, AirDroid, Wide
 * Angle, AnExplorer, Microsoft Tech Community threads) is Android-to-Windows
 * listicles pushing desktop suites, with iPhone owners left to separate
 * articles. None separates the job by what is being moved.
 *
 * This page sorts the job by content (a few photos, a camera roll, one long
 * video, documents), ranks eight routes, and adds the details people search
 * for afterwards: where Quick Share and Phone Link save on Windows, Phone
 * Link's 2,000-photo gallery, Apple's iCloud Photos caveat for cable imports,
 * AirDrop from Android to a Mac, and the HEIC / Live Photo surprises.
 *
 * Content lives in the "phoneToPc" namespace, 13 locales. Bump LAST_UPDATED
 * when Microsoft's Phone Link or Google's Quick Share help pages change.
 */

const SLUG = "/transfer-files-phone-to-pc";
const NS = "phoneToPc";
const LAST_UPDATED = "2026-09-13";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const TYPE_ITEMS = ["0", "1", "2", "3"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7"] as const;
const WINDOWS_ITEMS = ["0", "1", "2"] as const;
const IPHONE_ITEMS = ["0", "1", "2"] as const;
const MACLINUX_ITEMS = ["0", "1", "2"] as const;
const LANDING_ITEMS = ["0", "1", "2"] as const;
const FORMAT_ITEMS = ["0", "1", "2"] as const;
const STEP_ITEMS = ["0", "1", "2"] as const;
const SPEED_ITEMS = ["0", "1", "2"] as const;
const FIX_ITEMS = ["0", "1", "2", "3", "4"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["10", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Comparison truth table. Columns: BIShare · Quick Share for Windows ·
   Phone Link · AirDrop · USB cable · iCloud / Google Photos. Conditions
   behind each cell are spelled out in table.note. */
const APPS = ["bishare", "quickshare", "phonelink", "airdrop", "usb", "cloud"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // iPhone + Android · Windows + Mac + Linux · no cable · any file type ·
  // no per-file cap · no cloud allowance
  { id: "r0", v: [true, false, false, false, true, true] },
  { id: "r1", v: [true, false, false, false, true, true] },
  { id: "r2", v: [true, true, true, true, false, true] },
  { id: "r3", v: [true, true, true, true, false, false] },
  { id: "r4", v: [true, true, false, true, true, false] },
  { id: "r5", v: [true, true, true, true, true, false] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function PhoneToPcPage({ locale }: { locale: string }) {
  const a = await article(NS, SLUG, locale);
  const { t } = a;

  const listLd = methodsLd(a, ALT_ITEMS);

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (
    <ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "Transfer files from phone to PC")]}>
      {/* Hero */}
      <ArticleHead a={a} updated={LAST_UPDATED} />
      <Lead a={a} />
      <Disclosure a={a} />

      {/* Quick answer */}
      <QuickAnswer a={a} items={QUICK_ITEMS} />
      <HeroButtons a={a} />
      <Art a={a} name="hero" height={630} className="mt-8" />
      {/* By content type */}
      <Section a={a} id="by-type" name="types" lead art={["types", 600]} items={TYPE_ITEMS} />

      {/* The alternatives */}
      <Section a={a} id="methods">
        <Methods a={a} items={ALT_ITEMS} />
      </Section>

      {/* Comparison table */}
      <Section a={a} id="glance" name="table">
        <TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[640px]" />
      </Section>

      {/* Android to Windows */}
      <Section a={a} id="android-windows" name="windows" lead items={WINDOWS_ITEMS} />

      {/* iPhone to Windows */}
      <Section a={a} id="iphone-windows" name="iphone" lead items={IPHONE_ITEMS} />

      {/* Mac and Linux */}
      <Section a={a} id="mac-linux" name="maclinux" lead items={MACLINUX_ITEMS} />

      {/* Where files land on the computer */}
      <Section a={a} id="landing" lead art={["landing", 560]} items={LANDING_ITEMS} />

      {/* Formats */}
      <Section a={a} id="formats" lead art={["formats", 600]} items={FORMAT_ITEMS} />

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
