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
 * "Share files without an account" — the SERP is vendor pages (fast.io,
 * storage.to, EasySend, GetShared), Microsoft's Office link help and a
 * Dropbox KB. None separates "the sender needs no account" from "the recipient
 * needs no account", and most quote stale free limits.
 *
 * This page splits the question into its three groups, ranks eight routes
 * with limits read from each service's own pages, explains what an account
 * would have given you (revoke, extend, receipts, password) and what still
 * identifies you without one.
 *
 * Content lives in the "noAccountShare" namespace, 13 locales. Bump
 * LAST_UPDATED when a listed service changes a free-tier limit.
 */

const SLUG = "/share-files-without-account";
const NS = "noAccountShare";
const LAST_UPDATED = "2026-09-16";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const SIDE_ITEMS = ["0", "1", "2"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7"] as const;
const CONTROL_ITEMS = ["0", "1", "2", "3"] as const;
const IDENTITY_ITEMS = ["0", "1", "2"] as const;
const STEP_ITEMS = ["0", "1", "2", "3"] as const;
const CHOOSE_ITEMS = ["0", "1", "2", "3", "4"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Truth table. Columns: BIShare · SwissTransfer · Wormhole · Smash ·
   Google Drive link · Dropbox Transfer. Conditions are in table.note. */
const APPS = ["bishare", "swiss", "wormhole", "smash", "drive", "dropbox"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // sender needs no account
  { id: "r0", v: [true, true, true, true, false, false] },
  // recipient needs no account
  { id: "r1", v: [true, true, true, true, true, true] },
  // encrypted before upload
  { id: "r2", v: [true, false, true, false, false, false] },
  // more than 10 GB per transfer, free
  { id: "r3", v: [true, true, false, true, true, false] },
  // link expires by itself
  { id: "r4", v: [true, true, true, true, false, true] },
  // open source
  { id: "r5", v: [true, false, false, false, false, false] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function NoAccountSharePage({ locale }: { locale: string }) {
  const a = await article(NS, SLUG, locale);
  const { t } = a;

  const listLd = methodsLd(a, ALT_ITEMS);

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (
    <ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "Share files without an account")]}>
      {/* Hero */}
      <ArticleHead a={a} updated={LAST_UPDATED} />
      <Lead a={a} />
      <Disclosure a={a} />

      {/* Quick answer */}
      <QuickAnswer a={a} items={QUICK_ITEMS} />
      <HeroButtons a={a} />
      <Art a={a} name="hero" height={630} className="mt-8" />
      {/* Two sides of the question */}
      <Section a={a} id="sides" lead art={["sides", 600]} items={SIDE_ITEMS} />

      {/* The eight routes */}
      <Section a={a} id="methods">
        <Methods a={a} items={ALT_ITEMS} />
      </Section>

      {/* Comparison table */}
      <Section a={a} id="glance" name="table">
        <Art a={a} name="limits" height={660} />
        <TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[640px]" />
      </Section>

      {/* What an account would have given you */}
      <Section a={a} id="controls" lead art={["controls", 600]} items={CONTROL_ITEMS} />

      {/* What still identifies you */}
      <Section a={a} id="identity" lead items={IDENTITY_ITEMS} />

      {/* Step by step */}
      <Section a={a} id="steps" items={STEP_ITEMS} />

      {/* Pick by job */}
      <Section a={a} id="choose" lead items={CHOOSE_ITEMS} />

      {/* Safety */}
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
