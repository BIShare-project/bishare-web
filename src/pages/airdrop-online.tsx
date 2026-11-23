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
  H2,
  Section,
  QuickAnswer,
  TruthTable,
  Faq,
} from "@/ui/article";
import { Button } from "@/ui/button";
import { pageUrl } from "@/lib/og";
import { StoreButtons } from "@/ui/store-buttons";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";
import { NearbyEmbed } from "@/ui/nearby-embed";
import { ArrowRight } from "@/ui/icons";

/**
 * "AirDrop online" — the query people type when they want AirDrop's gesture
 * between devices Apple does not cover. In October 2026 the first four
 * results in the United States were working tools (PairDrop, Snapdrop,
 * ShareDrop, AirDrop Web), not articles, and we were nowhere: Semrush put the
 * cluster at about 1,600 searches a month with keyword difficulty 21–45.
 *
 * So the page is a tool first and a guide second. The Nearby panel is
 * embedded right under the quick answer (started on a click, see
 * NearbyEmbed), and the rest answers what a tool page never does: that there
 * is no official web AirDrop, how the browser version works, where each of
 * the five tools stops, and why two devices so often fail to see each other.
 *
 * It must not compete with /airdrop-alternative (apps that replace AirDrop)
 * or /airdrop-for-windows (AirDrop to a PC); this one is "in a browser, now"
 * and links to both.
 *
 * Content lives in the "airdropOnline" namespace, 13 locales. Bump
 * LAST_UPDATED whenever the facts are re-checked.
 */

const SLUG = "/airdrop-online";
const NS = "airdropOnline";
const LAST_UPDATED = "2026-10-03";

const QUICK_ITEMS = ["0", "1", "2", "3", "4"] as const;
const REALITY_ITEMS = ["0", "1", "2"] as const;
const HOW_ITEMS = ["0", "1", "2"] as const;
const TOOL_ITEMS = ["0", "1", "2", "3", "4"] as const;
const STEP_ITEMS = ["0", "1", "2", "3"] as const;
const TROUBLE_ITEMS = ["0", "1", "2", "3"] as const;
const SITUATION_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const LIMIT_ITEMS = ["0", "1", "2"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Comparison truth table. Columns: BIShare · PairDrop · Snapdrop · ShareDrop
   · AirDrop Web, checked on 3 October 2026 by opening each site;
   table.note carries the conditions behind the ticks and crosses. */
const APPS = ["bishare", "pairdrop", "snapdrop", "sharedrop", "airdropweb"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // nothing installed · finds same-network devices · crosses networks
  // · collect later · running code published · native apps too
  { id: "r0", v: [true, true, true, true, true] },
  { id: "r1", v: [true, true, true, true, true] },
  { id: "r2", v: [true, true, false, true, false] },
  { id: "r3", v: [true, false, false, false, false] },
  { id: "r4", v: [true, true, false, false, false] },
  { id: "r5", v: [true, false, false, false, false] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function AirdropOnlinePage({ locale }: { locale: string }) {
  const a = await article(NS, SLUG, locale);
  const { t, tags } = a;

  const selfUrl = pageUrl(SLUG, locale);

  const listLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("tools.title"),
    itemListElement: TOOL_ITEMS.map((i, n) => ({
      "@type": "ListItem",
      position: n + 1,
      name: t(`tools.items.${i}.name`),
      description: t(`tools.items.${i}.tag`),
      // Each entry needs an address of its own: the anchor on its card below.
      url: `${selfUrl}#item-${n + 1}`,
    })),
  };

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (
    <ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "AirDrop online")]}>
      {/* Hero */}
      <ArticleHead a={a} updated={LAST_UPDATED} />
      <Lead a={a} />
      <Disclosure a={a} />

      {/* Quick answer */}
      <QuickAnswer a={a} items={QUICK_ITEMS} />

      {/* The tool itself — started on a click, see NearbyEmbed. */}
      <section className="mt-8 rounded-xl border border-accent-blue/40 bg-card p-5 sm:p-6" aria-labelledby="try">
        <H2 id="try">{t("try.title")}</H2>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{t("try.body")}</p>
        <NearbyEmbed
          labels={{
            start: t("try.start"),
            note: t("try.note"),
            full: t("try.full"),
            off: t("try.off"),
          }}
        />
      </section>
      <HeroButtons a={a} />
      <Art a={a} name="hero" height={630} className="mt-8" />
      {/* Is there a real AirDrop online? */}
      <Section a={a} id="official" name="reality" lead items={REALITY_ITEMS} />

      {/* How it works */}
      <Section a={a} id="how" lead art={["flow", 620]} items={HOW_ITEMS} />

      {/* The five tools */}
      <Section a={a} id="tools">
        <div className="mt-6 space-y-8">
          {TOOL_ITEMS.map((i, n) => (
            <div key={i} id={`item-${n + 1}`} className="scroll-mt-28 border-b border-border pb-8 last:border-0 last:pb-0">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-sm font-semibold text-accent-blue">{String(n + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold">{t(`tools.items.${i}.name`)}</h3>
                  <p className="mt-0.5 text-sm font-medium text-accent-blue">{t(`tools.items.${i}.tag`)}</p>
                  <p className="mt-3 font-mono text-[12px] leading-relaxed text-muted-foreground">{t(`tools.items.${i}.facts`)}</p>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{t.rich(`tools.items.${i}.body`, tags)}</p>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground">{t("tools.consLabel")}</span> {t(`tools.items.${i}.cons`)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Comparison table */}
      <Section a={a} id="compare" name="table">
        <TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[620px]" />
      </Section>

      {/* Step by step */}
      <Section a={a} id="steps" items={STEP_ITEMS} />

      {/* Devices cannot see each other */}
      <Section a={a} id="not-found" name="trouble" lead items={TROUBLE_ITEMS} />

      {/* Situations */}
      <Section a={a} id="situations" art={["choose", 860]} items={SITUATION_ITEMS} />

      {/* Where the real thing is better */}
      <Section a={a} id="limits" lead items={LIMIT_ITEMS} />

      {/* Security */}
      <Section a={a} id="security" lead items={SECURITY_ITEMS} />

      {/* FAQ */}
      <Section a={a} id="faq">
        <Faq a={a} items={FAQ_ITEMS} />
      </Section>

      {/* CTA */}
      <section className="mt-16 rounded-xl border border-border bg-card p-8 text-center">
        <h2 className="text-2xl font-semibold tracking-[-0.02em]">{t("cta.title")}</h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">{t("cta.body")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button href="/transfer" size="lg">
            {t("try.full")}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button href="/download" size="lg" variant="secondary">
            {t("cta.download")}
          </Button>
        </div>
        <div className="mt-5 flex justify-center">
          <StoreButtons />
        </div>
      </section>
    </ArticlePage>
  );
}
