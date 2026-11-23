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
 * "Firefox Send alternative" — the SERP is directories (SourceForge, Slashdot,
 * AlternativeTo, Product Hunt), content farms, and news pieces from 2020. Only
 * Mozilla's own support page and Wikipedia give the sequence, and no ranking
 * page explains the actual cause.
 *
 * The angle: Send was not killed by encryption, it was killed by a missing
 * report button. No sign-in and no abuse mechanism meant a malware complaint
 * had nothing to act on, and a zero-knowledge server cannot police itself.
 * Mozilla nearly shipped the fix (file reporting + accounts, in the open on the
 * repo through July 2020), then retired the service on 17 September 2020, and
 * in May 2021 stripped its trademarks so forks would be legal.
 *
 * Second thing nobody does: separate real browser-side encryption from the
 * marketing word. SwissTransfer and Filemail encrypt server-side; listing them
 * as Send replacements is the SERP's biggest factual hole.
 *
 * Instance figures are read from each server's live config, not from the
 * published table, which has drifted (two listed hosts no longer resolve).
 *
 * Content lives in the "firefoxSendAlt" namespace, 13 locales. Bump
 * LAST_UPDATED when a listed service or instance changes a limit.
 */

const SLUG = "/firefox-send-alternative";
const NS = "firefoxSendAlt";
const LAST_UPDATED = "2026-09-16";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const WHY_ITEMS = ["0", "1", "2", "3"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7"] as const;
const INSTANCE_ITEMS = ["0", "1", "2"] as const;
const STEP_ITEMS = ["0", "1", "2", "3"] as const;
const CHOOSE_ITEMS = ["0", "1", "2", "3", "4"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Truth table. Columns: BIShare · a public Send instance · Wormhole · Tresorit
   Send · Bitwarden Send · SwissTransfer, all on their free tiers. Conditions
   are spelled out in table.note. */
const APPS = ["bishare", "send", "wormhole", "tresorit", "bitwarden", "swiss"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // sealed in the browser, key never sent — Firefox Send's defining property
  { id: "r0", v: [true, true, true, true, true, false] },
  // free for files, not only text (Bitwarden's free Sends are text)
  { id: "r1", v: [true, true, true, true, false, true] },
  // more than 5 GB in one transfer
  { id: "r2", v: [true, false, true, false, false, true] },
  // no account for the sender
  { id: "r3", v: [true, true, true, true, false, false] },
  // you can host it yourself
  { id: "r4", v: [true, true, false, false, true, false] },
  // available longer than 24 hours
  { id: "r5", v: [false, true, false, true, true, true] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function FirefoxSendAltPage({ locale }: { locale: string }) {
  const a = await article(NS, SLUG, locale);
  const { t } = a;

  const listLd = methodsLd(a, ALT_ITEMS);

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (
    <ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "Firefox Send alternative")]}>
      {/* Hero */}
      <ArticleHead a={a} updated={LAST_UPDATED} />
      <Lead a={a} />
      <Disclosure a={a} />

      {/* Quick answer */}
      <QuickAnswer a={a} items={QUICK_ITEMS} />
      <HeroButtons a={a} />
      <Art a={a} name="hero" height={630} className="mt-8" />
      {/* Why Send was switched off */}
      <Section a={a} id="why" lead art={["why", 600]} items={WHY_ITEMS} />

      {/* The eight alternatives */}
      <Section a={a} id="methods">
        <Methods a={a} items={ALT_ITEMS} />
      </Section>

      {/* Comparison table */}
      <Section a={a} id="glance" name="table">
        <Art a={a} name="limits" height={660} />
        <TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[640px]" />
      </Section>

      {/* The fork today, and which instances are up */}
      <Section a={a} id="instances" lead items={INSTANCE_ITEMS} />

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
