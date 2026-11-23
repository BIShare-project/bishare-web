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
 * "ShareDrop alternative" — the SERP is AlternativeTo, Semrush competitor
 * pages, storage.to and a generic 1,800-word Textunnel list that names no
 * products. None says what sharedrop.io does after the February 2025 LimeWire
 * takeover (ad slots, an upload box that stores files with LimeWire) or that
 * ShareDrop groups devices by public IP address.
 *
 * This page dates the change, explains discovery and rooms, ranks seven
 * alternatives including self-hosted ShareDrop Classic, and compares live
 * rooms, live links and stored links.
 *
 * Content lives in the "sharedropAlt" namespace, 13 locales. Bump
 * LAST_UPDATED after re-checking sharedrop.io and the listed projects.
 */

const SLUG = "/sharedrop-alternative";
const NS = "sharedropAlt";
const LAST_UPDATED = "2026-09-19";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const WHAT_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const HOW_ITEMS = ["0", "1", "2", "3"] as const;
const LIMITS_ITEMS = ["0", "1", "2", "3", "4"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5", "6"] as const;
const ROOMS_ITEMS = ["0", "1", "2", "3"] as const;
const SELFHOST_ITEMS = ["0", "1", "2", "3"] as const;
const CHOOSE_ITEMS = ["0", "1", "2", "3", "4"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Comparison truth table. Columns: BIShare, PairDrop, FilePizza, ToffeeShare, LocalSend,
   Taildrop.
   Conditions behind each cell are in table.note. */
const APPS = ["bishare", "pairdrop", "filepizza", "toffeeshare", "localsend", "taildrop"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // browser both ends · finds nearby · other network · download after sender offline · to other people · no account
  { id: "r0", v: [true, true, true, true, false, false] },
  { id: "r1", v: [true, true, false, false, true, false] },
  { id: "r2", v: [true, true, true, true, false, true] },
  { id: "r3", v: [true, false, false, false, false, false] },
  { id: "r4", v: [true, true, true, true, true, false] },
  { id: "r5", v: [true, true, true, true, true, false] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function SharedropAltPage({ locale }: { locale: string }) {
  const a = await article(NS, SLUG, locale);
  const { t } = a;

  const listLd = methodsLd(a, ALT_ITEMS);

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (
    <ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "ShareDrop alternative")]}>
      {/* Hero */}
      <ArticleHead a={a} updated={LAST_UPDATED} />
      <Lead a={a} />
      <Disclosure a={a} />

      {/* Quick answer */}
      <QuickAnswer a={a} items={QUICK_ITEMS} />
      <HeroButtons a={a} />
      <Art a={a} name="hero" height={630} className="mt-8" />
      {/* What happened */}
      <Section a={a} id="what" lead items={WHAT_ITEMS} />

      {/* How discovery worked */}
      <Section a={a} id="how" lead art={["grouping", 600]} items={HOW_ITEMS} />

      {/* Where it falls short */}
      <Section a={a} id="limits" lead items={LIMITS_ITEMS} />

      {/* The alternatives */}
      <Section a={a} id="methods" lead>
        <Methods a={a} items={ALT_ITEMS} />
      </Section>

      {/* Comparison table */}
      <Section a={a} id="glance" name="table">
        <TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[700px]" />
      </Section>

      {/* Other networks */}
      <Section a={a} id="rooms" lead art={["online", 600]} items={ROOMS_ITEMS} />

      {/* Self-hosting */}
      <Section a={a} id="selfhost" lead art={["hosting", 600]} items={SELFHOST_ITEMS} />

      {/* Pick by moment */}
      <Section a={a} id="choose" lead items={CHOOSE_ITEMS} />

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
