import {
  article,
  Lead,
  Disclosure,
  articleMetadata,
  faqPageLd,
  webPageLd,
  ArticlePage,
  ArticleHead,
  HeroButtons,
  Art,
  Section,
  QuickAnswer,
  TruthTable,
  Faq,
  Cta,
} from "@/ui/article";
import { pageUrl } from "@/lib/og";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";

/**
 * "Snapdrop alternative" — the query spiked after LimeWire acquired Snapdrop,
 * and the pages ranking for it are either stale listicles of Android-only
 * apps or obituaries claiming the site is gone. Both are wrong in ways a
 * reader can check in ten seconds, so this page leads with what we actually
 * verified by opening snapdrop.net, sharedrop.io and the repositories in
 * September 2026: the sites still work, the acquisition is announced in
 * Snapdrop's own README, and the real loss is that the running site's source
 * is no longer published.
 *
 * `status` carries that, `keep` states what a replacement has to preserve,
 * and the ranking covers browser tools, installed apps and self-hosting
 * rather than pretending one shape fits everyone.
 *
 * Content lives in the "snapdropAlt" namespace, 13 locales. Bump
 * LAST_UPDATED whenever these facts are re-checked.
 */

const SLUG = "/snapdrop-alternative";
const NS = "snapdropAlt";
const LAST_UPDATED = "2026-09-19";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const STATUS_ITEMS = ["0", "1", "2", "3", "4"] as const;
const KEEP_ITEMS = ["0", "1", "2", "3"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5", "6"] as const;
const SITUATION_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const STEP_ITEMS = ["0", "1", "2"] as const;
const SPEED_ITEMS = ["0", "1", "2"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Comparison truth table. Columns: Snapdrop · BIShare · PairDrop ·
   LocalSend · Transfer.zip · Wormhole, checked in September 2026 by opening
   each service; table.note carries the conditions behind the crosses. */
const APPS = ["snapdrop", "bishare", "pairdrop", "localsend", "transferzip", "wormhole"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // nothing installed · same network · across networks · native apps
  // · collect later · end-to-end encrypted · running source published
  // · free with no paid tier
  { id: "r0", v: [true, true, true, false, true, true] },
  { id: "r1", v: [true, true, true, true, false, false] },
  { id: "r2", v: [false, true, true, false, true, true] },
  { id: "r3", v: [false, true, false, true, false, false] },
  { id: "r4", v: [false, true, false, false, false, true] },
  { id: "r5", v: [true, true, true, true, true, true] },
  { id: "r6", v: [false, true, true, true, true, false] },
  { id: "r7", v: [true, true, true, true, false, true] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function SnapdropAlternativePage({ locale }: { locale: string }) {
  const a = await article(NS, SLUG, locale);
  const { t, tags } = a;

  const selfUrl = pageUrl(SLUG, locale);

  const listLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("alts.title"),
    itemListElement: ALT_ITEMS.map((i, n) => ({
      "@type": "ListItem",
      position: n + 1,
      name: t(`alts.items.${i}.name`),
      description: t(`alts.items.${i}.tag`),
      // Each entry needs an address of its own: the anchor on its card below.
      url: `${selfUrl}#item-${n + 1}`,
    })),
  };

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (
    <ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "Snapdrop alternative")]}>
      {/* Hero */}
      <ArticleHead a={a} updated={LAST_UPDATED} />
      <Lead a={a} />
      <Disclosure a={a} />

      {/* Quick answer */}
      <QuickAnswer a={a} items={QUICK_ITEMS} />
      <HeroButtons a={a} />
      <Art a={a} name="hero" height={630} className="mt-8" />
      {/* What happened to Snapdrop */}
      <Section a={a} id="status" lead art={["status", 620]} items={STATUS_ITEMS} />

      {/* What a replacement has to keep */}
      <Section a={a} id="keep" lead items={KEEP_ITEMS} />

      {/* The alternatives */}
      <Section a={a} id="alternatives" name="alts">
        <div className="mt-6 space-y-8">
          {ALT_ITEMS.map((i, n) => (
            <div key={i} id={`item-${n + 1}`} className="scroll-mt-28 border-b border-border pb-8 last:border-0 last:pb-0">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-sm font-semibold text-accent-blue">{String(n + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold">{t(`alts.items.${i}.name`)}</h3>
                  <p className="mt-0.5 text-sm font-medium text-accent-blue">{t(`alts.items.${i}.tag`)}</p>
                  <p className="mt-3 font-mono text-[12px] leading-relaxed text-muted-foreground">{t(`alts.items.${i}.facts`)}</p>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{t.rich(`alts.items.${i}.body`, tags)}</p>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground">{t("alts.consLabel")}</span> {t(`alts.items.${i}.cons`)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Comparison table */}
      <Section a={a} id="glance" name="table">
        <TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[640px]" />
      </Section>

      {/* Situations */}
      <Section a={a} id="situations" art={["choose", 860]} items={SITUATION_ITEMS} />

      {/* Step by step */}
      <Section a={a} id="steps" items={STEP_ITEMS} />

      {/* Speed */}
      <Section a={a} id="speed" lead art={["lanes", 600]} items={SPEED_ITEMS} />

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
