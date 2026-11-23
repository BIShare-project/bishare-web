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
 * "AirDrop not working" — the SERP is Apple's short checklist, Apple Community
 * threads and 2024 fix lists (XDA, Tom's Guide) that predate iOS 26.2 AirDrop
 * codes and Android phones joining AirDrop through Quick Share.
 *
 * This page starts from the symptom, lists Apple's own requirements, gives
 * iPhone/iPad and Mac fixes, explains the deliberate changes that look like
 * bugs (iOS 16.2, 17, 17.1, 26.2) and covers non-Apple recipients.
 *
 * Content lives in the "airdropFix" namespace, 13 locales. Bump LAST_UPDATED
 * when Apple changes AirDrop receiving rules or Google's Quick Share list.
 */

const SLUG = "/airdrop-not-working";
const NS = "airdropFix";
const LAST_UPDATED = "2026-11-12";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const DIAGNOSE_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const NEED_ITEMS = ["0", "1", "2", "3", "4"] as const;
const IPHONE_ITEMS = ["0", "1", "2", "3", "4", "5", "6"] as const;
const MAC_ITEMS = ["0", "1", "2", "3", "4"] as const;
const CHANGE_ITEMS = ["0", "1", "2", "3", "4"] as const;
const OTHER_ITEMS = ["0", "1", "2"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["10", "11", "12", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Comparison truth table. Columns: BIShare, Quick Share with AirDrop, iCloud
   link, the open-source local app, USB cable. Conditions behind each cell are
   in table.note. */
const APPS = ["bishare", "quickshare", "icloud", "localsend", "cable"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // Android · Windows · far away · offline · nearby off servers · no extra app on iPhone
  { id: "r0", v: [true, true, true, true, false] },
  { id: "r1", v: [true, false, true, true, true] },
  { id: "r2", v: [true, false, true, false, false] },
  { id: "r3", v: [true, true, false, true, true] },
  { id: "r4", v: [true, true, false, true, true] },
  { id: "r5", v: [false, true, true, false, true] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function AirdropNotWorkingPage({ locale }: { locale: string }) {
  const a = await article(NS, SLUG, locale);
  const { t } = a;

  const listLd = methodsLd(a, ALT_ITEMS);

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (
    <ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "AirDrop not working")]}>
      {/* Hero */}
      <ArticleHead a={a} updated={LAST_UPDATED} />
      <Lead a={a} />
      <Disclosure a={a} />

      {/* Quick answer */}
      <QuickAnswer a={a} items={QUICK_ITEMS} />
      <HeroButtons a={a} />
      <Art a={a} name="hero" height={630} className="mt-8" />
      {/* Symptom first */}
      <Section a={a} id="diagnose" lead art={["symptoms", 600]} items={DIAGNOSE_ITEMS} />

      {/* Apple's requirements */}
      <Section a={a} id="needs" lead art={["needs", 600]} items={NEED_ITEMS} />

      {/* iPhone and iPad fixes */}
      <Section a={a} id="iphone" lead items={IPHONE_ITEMS} />

      {/* Mac fixes */}
      <Section a={a} id="mac" lead items={MAC_ITEMS} />

      {/* Deliberate changes */}
      <Section a={a} id="changes" lead art={["timeline", 600]} items={CHANGE_ITEMS} />

      {/* Non-Apple recipients */}
      <Section a={a} id="other" lead items={OTHER_ITEMS} />

      {/* The alternatives */}
      <Section a={a} id="methods" lead>
        <Methods a={a} items={ALT_ITEMS} />
      </Section>

      {/* Comparison table */}
      <Section a={a} id="glance" name="table">
        <TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[640px]" />
      </Section>

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
