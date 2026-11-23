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
 * "Send Anywhere alternative" — the SERP is Capterra, vendor pages
 * (Transfer.zip, storage.to, SwiftSend, TransferRocket), Softonic and
 * AlternativeTo. None explains Send Anywhere's three modes, the March 2023
 * 10 GB monthly download pool on the sender's account, or the dated notices.
 *
 * This page dates the changes from Send Anywhere's own Help Center, compares
 * key, link and Directly To Device limits, ranks seven alternatives and maps
 * each Send Anywhere habit to a replacement.
 *
 * Content lives in the "sendAnywhereAlt" namespace, 13 locales. Bump
 * LAST_UPDATED after re-checking send-anywhere.com/pricing and the Help Center.
 */

const SLUG = "/send-anywhere-alternative";
const NS = "sendAnywhereAlt";
const LAST_UPDATED = "2026-09-14";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const CHANGES_ITEMS = ["0", "1", "2", "3", "4"] as const;
const MODES_ITEMS = ["0", "1", "2"] as const;
const LIMITS_ITEMS = ["0", "1", "2", "3", "4"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5", "6"] as const;
const CHOOSE_ITEMS = ["0", "1", "2", "3", "4"] as const;
const STEPS_ITEMS = ["0", "1", "2"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Comparison truth table. Columns: BIShare, PairDrop, Wormhole, Transfer.zip, LocalSend,
   Smash.
   Conditions behind each cell are in table.note. */
const APPS = ["bishare", "pairdrop", "wormhole", "transferzip", "localsend", "smash"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // free stored link · free links over 10 GB · direct transfer · no internet · recipient needs no app · open source
  { id: "r0", v: [true, false, true, false, false, true] },
  { id: "r1", v: [true, false, false, false, false, true] },
  { id: "r2", v: [true, true, true, true, true, false] },
  { id: "r3", v: [true, false, false, false, true, false] },
  { id: "r4", v: [true, true, true, true, false, true] },
  { id: "r5", v: [true, true, false, true, true, false] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function SendAnywhereAltPage({ locale }: { locale: string }) {
  const a = await article(NS, SLUG, locale);
  const { t } = a;

  const listLd = methodsLd(a, ALT_ITEMS);

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (
    <ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "Send Anywhere alternative")]}>
      {/* Hero */}
      <ArticleHead a={a} updated={LAST_UPDATED} />
      <Lead a={a} />
      <Disclosure a={a} />

      {/* Quick answer */}
      <QuickAnswer a={a} items={QUICK_ITEMS} />
      <HeroButtons a={a} />
      <Art a={a} name="hero" height={630} className="mt-8" />
      {/* What changed */}
      <Section a={a} id="changes" lead art={["timeline", 600]} items={CHANGES_ITEMS} />

      {/* Three modes */}
      <Section a={a} id="modes" lead art={["modes", 600]} items={MODES_ITEMS} />

      {/* Limits */}
      <Section a={a} id="limits" lead art={["pool", 600]} items={LIMITS_ITEMS} />

      {/* The alternatives */}
      <Section a={a} id="methods" lead>
        <Methods a={a} items={ALT_ITEMS} />
      </Section>

      {/* Comparison table */}
      <Section a={a} id="glance" name="table">
        <TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[700px]" />
      </Section>

      {/* Replace each habit */}
      <Section a={a} id="choose" lead items={CHOOSE_ITEMS} />

      {/* Step by step */}
      <Section a={a} id="steps" items={STEPS_ITEMS} />

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
