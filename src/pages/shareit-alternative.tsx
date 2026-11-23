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
 * "SHAREit alternative" — the SERP is AlternativeTo and 2021-era listicles
 * (Beebom, MobiKin, Coolmuster) that name Xender and Snapdrop without saying
 * what changed: ads and extras, the 2021 Trend Micro findings, the India block,
 * and Google Play labels that declare unencrypted transfers.
 *
 * This page explains why people leave, what SHAREit got right, quotes each
 * alternative's Play labels, ranks seven options and covers sending installed
 * apps now that the Play Store's Share apps button is gone.
 *
 * Content lives in the "shareitAlt" namespace, 13 locales. Bump LAST_UPDATED
 * when a listed app's Play labels or availability change.
 */

const SLUG = "/shareit-alternative";
const NS = "shareitAlt";
const LAST_UPDATED = "2026-09-14";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const WHY_ITEMS = ["0", "1", "2", "3", "4"] as const;
const KEEP_ITEMS = ["0", "1", "2", "3"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5", "6"] as const;
const APP_ITEMS = ["0", "1", "2"] as const;
const CHOOSE_ITEMS = ["0", "1", "2", "3", "4"] as const;
const STEP_ITEMS = ["0", "1", "2"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Comparison truth table. Columns: BIShare, Quick Share, LocalSend, PairDrop,
   Xender, Send Anywhere. Conditions behind each cell are in table.note. */
const APPS = ["bishare", "quickshare", "localsend", "pairdrop", "xender", "sendanywhere"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // no ads · offline · Windows PC · iPhone · sends installed apps · open source
  { id: "r0", v: [true, true, true, true, false, false] },
  { id: "r1", v: [true, true, true, false, true, false] },
  { id: "r2", v: [true, true, true, true, true, true] },
  { id: "r3", v: [true, true, true, true, true, true] },
  { id: "r4", v: [true, false, true, false, true, true] },
  { id: "r5", v: [true, false, true, true, false, false] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function ShareitAltPage({ locale }: { locale: string }) {
  const a = await article(NS, SLUG, locale);
  const { t } = a;

  const listLd = methodsLd(a, ALT_ITEMS);

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (
    <ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "SHAREit alternative")]}>
      {/* Hero */}
      <ArticleHead a={a} updated={LAST_UPDATED} />
      <Lead a={a} />
      <Disclosure a={a} />

      {/* Quick answer */}
      <QuickAnswer a={a} items={QUICK_ITEMS} />
      <HeroButtons a={a} />
      <Art a={a} name="hero" height={630} className="mt-8" />
      {/* Why people leave */}
      <Section a={a} id="why" lead art={["labels", 600]} items={WHY_ITEMS} />

      {/* What to keep */}
      <Section a={a} id="keep" lead items={KEEP_ITEMS} />

      {/* The alternatives */}
      <Section a={a} id="methods" lead>
        <Methods a={a} items={ALT_ITEMS} />
      </Section>

      {/* Comparison table */}
      <Section a={a} id="glance" name="table">
        <TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[640px]" />
      </Section>

      {/* Sending installed apps */}
      <Section a={a} id="apps" lead art={["apk", 600]} items={APP_ITEMS} />

      {/* Pick by destination */}
      <Section a={a} id="choose" lead art={["hub", 600]} items={CHOOSE_ITEMS} />

      {/* Step by step */}
      <Section a={a} id="steps" items={STEP_ITEMS} />

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
