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
 * "Wormhole alternative" — the SERP is nothing but software directories
 * (SourceForge, Slashdot, AlternativeTo, appvizer, Product Hunt). No editorial,
 * no forum, nothing dated this month, and one page-one result is the blockchain
 * bridge of the same name.
 *
 * Two things none of them say, both verified on wormhole.app this month:
 *   - the service stores files only up to 5 GB; above that the transfer runs
 *     browser to browser and the SENDER'S TAB has to stay open. That is the
 *     failure people actually hit, and it is the page's angle.
 *   - a link also dies after a sender-chosen download count, as low as one.
 * Its 10 GB cap appears on the home page and is absent from the FAQ entry that
 * asks about maximum size.
 *
 * Content lives in the "wormholeAlt" namespace, 13 locales. Bump LAST_UPDATED
 * when Wormhole or a listed service changes a free-tier limit.
 */

const SLUG = "/wormhole-alternative";
const NS = "wormholeAlt";
const LAST_UPDATED = "2026-11-12";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const SPLIT_ITEMS = ["0", "1", "2", "3"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7"] as const;
const WHICH_ITEMS = ["0", "1", "2"] as const;
const STEP_ITEMS = ["0", "1", "2", "3"] as const;
const CHOOSE_ITEMS = ["0", "1", "2", "3", "4"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "10", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Truth table. Columns: BIShare · Wormhole · transfer.zip (free Quick Transfer)
   · SwissTransfer · a public Send instance · Proton Drive, all free tiers.
   Conditions are spelled out in table.note. */
const APPS = ["bishare", "wormhole", "transferzip", "swiss", "send", "proton"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // sealed in the browser, before upload — Wormhole's own standard
  { id: "r0", v: [true, true, true, false, true, true] },
  // sender can close the tab at ANY size: the whole point of the page
  { id: "r1", v: [true, false, false, true, true, true] },
  // more than 10 GB in one go
  { id: "r2", v: [true, false, true, true, false, false] },
  // sender needs no account (SwissTransfer now emails a verification code)
  { id: "r3", v: [true, true, true, false, true, false] },
  // available for longer than three days
  { id: "r4", v: [false, false, false, true, false, true] },
  // open source (Wormhole publishes its crypto library, not the service)
  { id: "r5", v: [true, false, true, false, true, true] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function WormholeAltPage({ locale }: { locale: string }) {
  const a = await article(NS, SLUG, locale);
  const { t } = a;

  const listLd = methodsLd(a, ALT_ITEMS);

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (
    <ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "Wormhole alternative")]}>
      {/* Hero */}
      <ArticleHead a={a} updated={LAST_UPDATED} />
      <Lead a={a} />
      <Disclosure a={a} />

      {/* Quick answer */}
      <QuickAnswer a={a} items={QUICK_ITEMS} />
      <HeroButtons a={a} />
      <Art a={a} name="hero" height={630} className="mt-8" />
      {/* The 5 GB line */}
      <Section a={a} id="split" lead art={["split", 600]} items={SPLIT_ITEMS} />

      {/* The eight alternatives */}
      <Section a={a} id="methods">
        <Methods a={a} items={ALT_ITEMS} />
      </Section>

      {/* Comparison table */}
      <Section a={a} id="glance" name="table">
        <Art a={a} name="limits" height={660} />
        <TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[640px]" />
      </Section>

      {/* Which Wormhole */}
      <Section a={a} id="whichone" lead items={WHICH_ITEMS} />

      {/* Switching */}
      <Section a={a} id="steps" items={STEP_ITEMS} />

      {/* Pick by job */}
      <Section a={a} id="choose" lead art={["choose", 620]} items={CHOOSE_ITEMS} />

      {/* Who can read what */}
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
