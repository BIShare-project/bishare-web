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
  ProseList,
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
 * "Share by wifi" / "wifi file transfer" — about 4,000 US searches a month
 * across its spellings (Semrush, October 2026: share by wifi 1,600, share
 * with wifi 1,000, wifi file transfer 170, and a dozen at 90–140), keyword
 * difficulty 30–60. The first page is tools (ShareDrop, shareviawifi.com,
 * Send Anywhere, two Play Store apps) plus one 2024 Filemail article that
 * still calls Phone Link "Your Phone" and never mentions Quick Share, guest
 * networks or speed.
 *
 * So, like /airdrop-online, this page carries the tool itself (NearbyEmbed,
 * started on a click) and then answers what the tool pages do not: what
 * "over Wi-Fi" actually covers, how fast it is, why Windows Nearby sharing
 * so often lands on Bluetooth, and why two devices on one Wi-Fi cannot see
 * each other.
 *
 * Neighbours: /send-files-without-internet owns "no internet" and
 * /airdrop-online owns "in a browser"; this one owns "over Wi-Fi" and links
 * to both.
 *
 * Content lives in the "wifiTransfer" namespace, 13 locales. Speeds are our
 * own measurements (same table as /airdrop-for-windows). Bump LAST_UPDATED
 * when the Microsoft, Google and Apple pages are re-read.
 */

const SLUG = "/wifi-file-transfer";
const NS = "wifiTransfer";
const LAST_UPDATED = "2026-11-12";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const MEANING_ITEMS = ["0", "1", "2"] as const;
const SPEED_ROWS = ["r0", "r1", "r2", "r3", "r4"] as const;
const SPEED_ITEMS = ["0", "1", "2"] as const;
const TOOL_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const STEP_ITEMS = ["0", "1", "2", "3"] as const;
const HIDDEN_ITEMS = ["0", "1", "2", "3"] as const;
const SITUATION_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "11", "10", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Comparison truth table. Columns: BIShare · LocalSend · PairDrop · AirDrop
   · Quick Share · Nearby sharing, as of 3 October 2026; table.note carries
   the conditions behind the ticks and crosses. */
const APPS = ["bishare", "localsend", "pairdrop", "airdrop", "quickshare", "nearby"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // any mix of platforms · no internet · no router or hotspot
  // · nothing to install · reaches another network
  { id: "r0", v: [true, true, true, false, false, false] },
  { id: "r1", v: [true, true, false, true, true, true] },
  { id: "r2", v: [false, false, false, true, true, true] },
  { id: "r3", v: [true, false, true, true, true, true] },
  { id: "r4", v: [true, false, true, false, false, false] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function WifiFileTransferPage({ locale }: { locale: string }) {
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
    <ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "WiFi file transfer")]}>
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
      {/* What "over Wi-Fi" means */}
      <Section a={a} id="meaning" lead art={["paths", 600]} items={MEANING_ITEMS} />

      {/* Speed */}
      <Section a={a} id="speed" lead>
        <div className="mt-5 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border bg-background-raised text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">{t("speed.cols.link")}</th>
                <th className="px-4 py-3 font-medium">{t("speed.cols.rate")}</th>
                <th className="px-4 py-3 font-medium">{t("speed.cols.time")}</th>
              </tr>
            </thead>
            <tbody>
              {SPEED_ROWS.map((r) => (
                <tr key={r} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground">{t(`speed.rows.${r}.link`)}</td>
                  <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{t(`speed.rows.${r}.rate`)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t(`speed.rows.${r}.time`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t("speed.note")}</p>
        <Art a={a} name="speed" height={600} />
        <ProseList a={a} name="speed" items={SPEED_ITEMS} />
      </Section>

      {/* The six tools */}
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
                    <span className="font-medium text-foreground">{t("tools.consLabel")}</span> {t.rich(`tools.items.${i}.cons`, tags)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Comparison table */}
      <Section a={a} id="compare" name="table">
        <TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[720px]" />
      </Section>

      {/* Step by step */}
      <Section a={a} id="steps" items={STEP_ITEMS} />

      {/* Devices cannot see each other */}
      <Section a={a} id="not-found" name="hidden" lead items={HIDDEN_ITEMS} />

      {/* Situations */}
      <Section a={a} id="situations" art={["choose", 860]} items={SITUATION_ITEMS} />

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
