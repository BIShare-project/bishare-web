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
 * "Encrypted file transfer" — the SERP is patent PDFs, vendor pages
 * (Dropbox, SendSafely, Filemail, Filot, DivShare) and a TechRadar roundup that
 * use "encrypted" for TLS, at-rest and end-to-end alike. None gives a reader a
 * way to tell them apart or says what end-to-end still leaves visible.
 *
 * This page separates the three kinds, gives a one-minute test, ranks seven
 * end-to-end methods, lists what encryption does not hide (BIShare's own link
 * metadata included) and documents BIShare's scheme from its public code.
 *
 * Content lives in the "encryptedTransfer" namespace, 13 locales. Bump
 * LAST_UPDATED when a listed service changes its encryption design.
 */

const SLUG = "/encrypted-file-transfer";
const NS = "encryptedTransfer";
const LAST_UPDATED = "2026-11-12";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const LEVELS_ITEMS = ["0", "1", "2", "3"] as const;
const TEST_ITEMS = ["0", "1", "2", "3", "4"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5", "6"] as const;
const METADATA_ITEMS = ["0", "1", "2", "3"] as const;
const BISHARE_ITEMS = ["0", "1", "2", "3"] as const;
const PASSWORD_ITEMS = ["0", "1", "2", "3"] as const;
// Sharing with a group or for weeks: added 2026-11-12 for "end to end encrypted
// file sharing", which Search Console shows at position 11 to 12.
const SHARING_ITEMS = ["0", "1", "2", "3"] as const;
const CHOOSE_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const MISTAKES_ITEMS = ["0", "1", "2", "3"] as const;
const FAQ_ITEMS = ["0", "10", "11", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Comparison truth table. Columns: BIShare, Wormhole, Proton Drive, OnionShare,
   magic-wormhole, 7-Zip archive.
   Conditions behind each cell are in table.note. */
const APPS = ["bishare", "wormhole", "protondrive", "onionshare", "magicwormhole", "sevenzip"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // service cannot read · recipient installs nothing · sender can go offline · over 10 GB · hides sender · open-source client
  { id: "r0", v: [true, true, true, true, true, true] },
  { id: "r1", v: [true, true, true, false, false, false] },
  { id: "r2", v: [true, true, true, false, false, true] },
  { id: "r3", v: [true, false, false, true, true, true] },
  { id: "r4", v: [false, false, false, true, false, false] },
  { id: "r5", v: [true, false, true, true, true, true] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function EncryptedTransferPage({ locale }: { locale: string }) {
  const a = await article(NS, SLUG, locale);
  const { t } = a;

  const listLd = methodsLd(a, ALT_ITEMS);

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (
    <ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "Encrypted file transfer")]}>
      {/* Hero */}
      <ArticleHead a={a} updated={LAST_UPDATED} />
      <Lead a={a} />
      <Disclosure a={a} />

      {/* Quick answer */}
      <QuickAnswer a={a} items={QUICK_ITEMS} />
      <HeroButtons a={a} />
      <Art a={a} name="hero" height={630} className="mt-8" />
      {/* Three kinds of encryption */}
      <Section a={a} id="levels" lead art={["levels", 600]} items={LEVELS_ITEMS} />

      {/* How to tell */}
      <Section a={a} id="test" lead art={["fragment", 600]} items={TEST_ITEMS} />

      {/* The methods */}
      <Section a={a} id="methods" lead>
        <Methods a={a} items={ALT_ITEMS} />
      </Section>

      {/* Comparison table */}
      <Section a={a} id="glance" name="table">
        <TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[720px]" />
      </Section>

      {/* What stays visible */}
      <Section a={a} id="metadata" lead art={["visible", 600]} items={METADATA_ITEMS} />

      {/* BIShare in detail */}
      <Section a={a} id="bishare" lead items={BISHARE_ITEMS} />

      {/* Sharing the secret */}
      <Section a={a} id="password" lead items={PASSWORD_ITEMS} />

      {/* Sharing with a group, or for weeks */}
      <Section a={a} id="sharing" lead items={SHARING_ITEMS} />

      {/* Pick by situation */}
      <Section a={a} id="choose" lead items={CHOOSE_ITEMS} />

      {/* Mistakes */}
      <Section a={a} id="mistakes" lead items={MISTAKES_ITEMS} />

      {/* FAQ */}
      <Section a={a} id="faq">
        <Faq a={a} items={FAQ_ITEMS} />
      </Section>

      {/* CTA */}
      <Cta a={a} />
    </ArticlePage>
  );
}
