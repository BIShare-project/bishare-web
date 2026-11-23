import { getTranslations } from "@/i18n/translate";
import { type Article, articleMetadata, faqPageLd, webPageLd, methodsLd, ArticlePage, ArticleHead, HeroButtons, Art, Section, ProseList, QuickAnswer, Methods, TruthTable, Faq, Cta, strong, highlight } from "@/ui/article";
import { pageUrl } from "@/lib/og";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";
import { guideLinks } from "@/ui/guide-links";

/**
 * "Encrypted file transfer" — the SERP is patent PDFs, vendor pages
 * (Dropbox, SendSafely, Filemail, Filot, DivShare) and a TechRadar roundup that
 * use "encrypted" for TLS, at-rest and end-to-end alike. None gives a reader a
 * way to tell them apart or says what end-to-end still leaves visible.
 *
 * This page separates the three kinds, gives a one-minute test, ranks seven
 * end-to-end methods, lists what encryption does not hide (BIShare's own link
 * metadata included) and documents BIShare's scheme from its public code.
 *
 * Content lives in the "encryptedTransfer" namespace, 13 locales. Bump
 * LAST_UPDATED when a listed service changes its encryption design.
 */

const SLUG = "/encrypted-file-transfer";
const NS = "encryptedTransfer";
const LAST_UPDATED = "2026-11-12";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const LEVELS_ITEMS = ["0", "1", "2", "3"] as const;
const TEST_ITEMS = ["0", "1", "2", "3", "4"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5", "6"] as const;
const METADATA_ITEMS = ["0", "1", "2", "3"] as const;
const BISHARE_ITEMS = ["0", "1", "2", "3"] as const;
const PASSWORD_ITEMS = ["0", "1", "2", "3"] as const;
// Sharing with a group or for weeks: added 2026-11-12 for "end to end encrypted
// file sharing", which Search Console shows at position 11 to 12.
const SHARING_ITEMS = ["0", "1", "2", "3"] as const;
const CHOOSE_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const MISTAKES_ITEMS = ["0", "1", "2", "3"] as const;
const FAQ_ITEMS = ["0", "10", "11", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Comparison truth table. Columns: BIShare, Wormhole, Proton Drive, OnionShare,
   magic-wormhole, 7-Zip archive.
   Conditions behind each cell are in table.note. */
const APPS = ["bishare", "wormhole", "protondrive", "onionshare", "magicwormhole", "sevenzip"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // service cannot read · recipient installs nothing · sender can go offline · over 10 GB · hides sender · open-source client
  { id: "r0", v: [true, true, true, true, true, true] },
  { id: "r1", v: [true, true, true, false, false, false] },
  { id: "r2", v: [true, true, true, false, false, true] },
  { id: "r3", v: [true, false, false, true, true, true] },
  { id: "r4", v: [false, false, false, true, false, false] },
  { id: "r5", v: [true, false, true, true, true, true] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function EncryptedTransferPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations(NS);
  const links = guideLinks();
  const chrome = await getTranslations("chrome");

  const tags = { strong, highlight, ...links };
  const a: Article = { t, chrome, tags, locale, slug: SLUG };

  const listLd = methodsLd(a, ALT_ITEMS);

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (<ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "Encrypted file transfer")]}>
            {/* Hero */}<ArticleHead a={a} updated={LAST_UPDATED} />
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {t.rich("hero.body", { strong, highlight, ...links })}
            </p>
            <p className="mt-4 rounded-xl border border-border bg-background-raised/60 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {t("disclosure")}
            </p>

            {/* Quick answer */}<QuickAnswer a={a} items={QUICK_ITEMS} /><HeroButtons a={a} />
            <Art a={a} name="hero" height={630} className="mt-8" />
{/* Three kinds of encryption */}
            <Section a={a} id="levels" lead><Art a={a} name="levels" height={600} />
<ProseList a={a} name="levels" items={LEVELS_ITEMS} />
            </Section>

            {/* How to tell */}
            <Section a={a} id="test" lead><Art a={a} name="fragment" height={600} />
<ProseList a={a} name="test" items={TEST_ITEMS} />
            </Section>

            {/* The methods */}
            <Section a={a} id="methods" lead><Methods a={a} items={ALT_ITEMS} />
            </Section>

            {/* Comparison table */}
            <Section a={a} id="glance" name="table"><TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[720px]" />
            </Section>

            {/* What stays visible */}
            <Section a={a} id="metadata" lead><Art a={a} name="visible" height={600} />
<ProseList a={a} name="metadata" items={METADATA_ITEMS} />
            </Section>

            {/* BIShare in detail */}
            <Section a={a} id="bishare" lead><ProseList a={a} name="bishare" items={BISHARE_ITEMS} />
            </Section>

            {/* Sharing the secret */}
            <Section a={a} id="password" lead><ProseList a={a} name="password" items={PASSWORD_ITEMS} />
            </Section>

            {/* Sharing with a group, or for weeks */}
            <Section a={a} id="sharing" lead><ProseList a={a} name="sharing" items={SHARING_ITEMS} />
            </Section>

            {/* Pick by situation */}
            <Section a={a} id="choose" lead><ProseList a={a} name="choose" items={CHOOSE_ITEMS} />
            </Section>

            {/* Mistakes */}
            <Section a={a} id="mistakes" lead><ProseList a={a} name="mistakes" items={MISTAKES_ITEMS} />
            </Section>

            {/* FAQ */}
            <Section a={a} id="faq"><Faq a={a} items={FAQ_ITEMS} />
            </Section>

            {/* CTA */}<Cta a={a} /></ArticlePage>);
}
