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
 * "Nearby Share alternative" — the SERP is AlternativeTo, Softonic, a 2020
 * NerdsChalk list written before Nearby Share shipped, and Wondershare/MobiKin
 * "Quick Share vs Nearby Share" explainers. None says where Quick Share still
 * stops in 2026 (Mac, Linux, phones without Google services, far away) or covers
 * the unofficial clients (NearDrop, RQuickShare, Packet).
 *
 * This page dates the rename, untangles the three features called Nearby Share,
 * maps Quick Share's reach from Google's help pages, ranks seven alternatives
 * and explains how the unofficial clients connect.
 *
 * Content lives in the "nearbyShareAlt" namespace, 13 locales. Bump
 * LAST_UPDATED when Quick Share's platforms or requirements change.
 */

const SLUG = "/nearby-share-alternative";
const NS = "nearbyShareAlt";
const LAST_UPDATED = "2026-11-12";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const WHAT_ITEMS = ["0", "1", "2", "3", "4"] as const;
const NAMES_ITEMS = ["0", "1", "2"] as const;
const REACH_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5", "6"] as const;
const UNOFFICIAL_ITEMS = ["0", "1", "2", "3"] as const;
const CHOOSE_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const FIXES_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "10", "4", "5", "6", "7", "8", "9"] as const;

/* Comparison truth table. Columns: Quick Share, BIShare, LocalSend, KDE Connect,
   PairDrop, NearDrop, RQuickShare.
   Conditions behind each cell are in table.note. */
const APPS = ["quickshare", "bishare", "localsend", "kdeconnect", "pairdrop", "neardrop", "rquickshare"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // Android · iPhone · Windows · Mac · Linux · nothing on the phone · far away · open source
  { id: "r0", v: [true, true, true, true, true, true, true] },
  { id: "r1", v: [true, true, true, true, true, false, false] },
  { id: "r2", v: [true, true, true, true, true, false, false] },
  { id: "r3", v: [false, true, true, true, true, true, true] },
  { id: "r4", v: [false, true, true, true, true, false, true] },
  { id: "r5", v: [true, false, false, false, true, true, true] },
  { id: "r6", v: [false, true, false, false, true, false, false] },
  { id: "r7", v: [false, true, true, true, true, true, true] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function NearbyShareAltPage({ locale }: { locale: string }) {
  const a = await article(NS, SLUG, locale);
  const { t } = a;

  const listLd = methodsLd(a, ALT_ITEMS);

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (
    <ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "Nearby Share alternative")]}>
      {/* Hero */}
      <ArticleHead a={a} updated={LAST_UPDATED} />
      <Lead a={a} />
      <Disclosure a={a} />

      {/* Quick answer */}
      <QuickAnswer a={a} items={QUICK_ITEMS} />
      <HeroButtons a={a} />
      <Art a={a} name="hero" height={630} className="mt-8" />
      {/* What happened */}
      <Section a={a} id="what" lead art={["timeline", 600]} items={WHAT_ITEMS} />

      {/* Same name, three features */}
      <Section a={a} id="names" lead items={NAMES_ITEMS} />

      {/* Where Quick Share reaches */}
      <Section a={a} id="reach" lead art={["reach", 600]} items={REACH_ITEMS} />

      {/* The alternatives */}
      <Section a={a} id="methods" lead>
        <Methods a={a} items={ALT_ITEMS} />
      </Section>

      {/* Comparison table */}
      <Section a={a} id="glance" name="table">
        <TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[760px]" />
      </Section>

      {/* Unofficial Quick Share clients */}
      <Section a={a} id="unofficial" lead art={["bridge", 600]} items={UNOFFICIAL_ITEMS} />

      {/* Pick by gap */}
      <Section a={a} id="choose" lead items={CHOOSE_ITEMS} />

      {/* Fix Quick Share first */}
      <Section a={a} id="fixes" lead items={FIXES_ITEMS} />

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
