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
 * "Transfer photos from iPhone to PC" — the largest query family in the
 * niche. The SERP is Apple and Microsoft support pages plus 2,000-word
 * roundups (iPhone Photography School, PetaPixel, iPhone Tonic) that list
 * cable, iCloud and Google Photos but rarely explain why an import comes up
 * empty (Optimize iPhone Storage), what Automatic versus Keep Originals does,
 * or how to move a 30,000-photo library safely.
 *
 * This page leads with where the originals live, ranks eight routes with
 * limits from Apple, Microsoft, Google and OneDrive help pages, then covers
 * formats, big libraries, speed by iPhone model and import errors.
 *
 * Content lives in the "photosIphonePc" namespace, 13 locales. Bump
 * LAST_UPDATED when Apple Devices, iCloud for Windows or Phone Link change.
 */

const SLUG = "/transfer-photos-from-iphone-to-pc";
const NS = "photosIphonePc";
const LAST_UPDATED = "2026-09-13";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const ORIGINAL_ITEMS = ["0", "1", "2"] as const;
const METHOD_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7"] as const;
const CHOOSE_ITEMS = ["0", "1", "2", "3"] as const;
const FORMAT_ITEMS = ["0", "1", "2", "3", "4"] as const;
const LIBRARY_ITEMS = ["0", "1", "2", "3"] as const;
const STEP_ITEMS = ["0", "1", "2"] as const;
const SPEED_ITEMS = ["0", "1", "2"] as const;
const FIX_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Comparison truth table. Columns: BIShare · Photos app + cable · File
   Explorer · iCloud for Windows · iCloud.com · Google Photos. Conditions
   behind each cell are in table.note. */
const APPS = ["bishare", "photos", "explorer", "icloud", "web", "google"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // no cable · iCloud-only originals · no account · 10k library · no cloud upload
  { id: "r0", v: [true, false, false, true, true, true] },
  { id: "r1", v: [false, false, false, true, true, false] },
  { id: "r2", v: [true, true, true, false, false, false] },
  { id: "r3", v: [false, true, false, true, false, false] },
  { id: "r4", v: [true, true, true, false, false, false] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function PhotosIphonePcPage({ locale }: { locale: string }) {
  const a = await article(NS, SLUG, locale);
  const { t } = a;

  const listLd = methodsLd(a, METHOD_ITEMS);

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (
    <ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "iPhone photos to PC")]}>
      {/* Hero */}
      <ArticleHead a={a} updated={LAST_UPDATED} />
      <Lead a={a} />
      <Disclosure a={a} />

      {/* Quick answer */}
      <QuickAnswer a={a} items={QUICK_ITEMS} />
      <HeroButtons a={a} />
      <Art a={a} name="hero" height={630} className="mt-8" />
      {/* Where the originals live */}
      <Section a={a} id="originals" lead art={["originals", 620]} items={ORIGINAL_ITEMS} />

      {/* The alternatives */}
      <Section a={a} id="methods">
        <Methods a={a} items={METHOD_ITEMS} />
      </Section>

      {/* Comparison table */}
      <Section a={a} id="glance" name="table">
        <TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[640px]" />
      </Section>

      {/* Pick a route */}
      <Section a={a} id="choose" lead art={["routes", 640]} items={CHOOSE_ITEMS} />

      {/* Formats */}
      <Section a={a} id="formats" lead art={["formats", 600]} items={FORMAT_ITEMS} />

      {/* Big libraries */}
      <Section a={a} id="library" lead items={LIBRARY_ITEMS} />

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
