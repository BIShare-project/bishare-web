import { getTranslations } from "@/i18n/translate";
import { type Article, articleMetadata, faqPageLd, webPageLd, methodsLd, ArticlePage, ArticleHead, HeroButtons, Art, Section, ProseList, QuickAnswer, Methods, TruthTable, Faq, Cta, strong, highlight } from "@/ui/article";
import { pageUrl } from "@/lib/og";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";
import { guideLinks } from "@/ui/guide-links";

/**
 * "Transfer files from PC to phone" — the SERP (Laptop Mag, How-To Geek,
 * Computerworld, AirDroid, Wondershare, FoneTool) splits into Windows-to-
 * Android and PC-to-iPhone articles, most of them vendor pages. Several
 * claim File Explorer can copy files onto an iPhone; it cannot.
 *
 * This page starts from the six computer/phone pairings, ranks eight
 * routes, and spells out what competitors blur: Phone Link's 512 MB drag-
 * and-drop cap, Quick Share for Windows requirements, what Apple Devices
 * does with a cable, AirDrop from a Mac to supported Android phones, where
 * files land on each phone, and per-file size limits.
 *
 * Content lives in the "pcToPhone" namespace, 13 locales. Bump LAST_UPDATED
 * when Microsoft's Phone Link or Google's Quick Share help pages change.
 */

const SLUG = "/transfer-files-pc-to-phone";
const NS = "pcToPhone";
const LAST_UPDATED = "2026-09-13";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const MATRIX_ITEMS = ["0", "1", "2"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7"] as const;
const WINDOWS_ITEMS = ["0", "1", "2"] as const;
const IPHONE_ITEMS = ["0", "1", "2"] as const;
const MACLINUX_ITEMS = ["0", "1", "2"] as const;
const LANDING_ITEMS = ["0", "1", "2"] as const;
const LIMIT_ITEMS = ["0", "1", "2"] as const;
const STEP_ITEMS = ["0", "1", "2"] as const;
const SPEED_ITEMS = ["0", "1", "2"] as const;
const FIX_ITEMS = ["0", "1", "2", "3", "4"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Comparison truth table. Columns: BIShare · Quick Share for Windows ·
   Phone Link · AirDrop · USB cable · cloud drive. Conditions behind each
   cell are spelled out in table.note. */
const APPS = ["bishare", "quickshare", "phonelink", "airdrop", "usb", "cloud"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // Windows + Mac + Linux · iPhone + Android · no cable · phone elsewhere ·
  // no per-file cap · no storage quota
  { id: "r0", v: [true, false, false, false, false, true] },
  { id: "r1", v: [true, false, false, false, true, true] },
  { id: "r2", v: [true, true, true, true, false, true] },
  { id: "r3", v: [true, false, false, false, false, true] },
  { id: "r4", v: [true, true, false, true, true, false] },
  { id: "r5", v: [true, true, true, true, true, false] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function PcToPhonePage({
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
  const no = t("a11y.no");

  const listLd = methodsLd(a, ALT_ITEMS);

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (<ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "Transfer files from PC to phone")]}>
            {/* Hero */}<ArticleHead a={a} updated={LAST_UPDATED} />
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {t.rich("hero.body", { strong, highlight, ...links })}
            </p>
            <p className="mt-4 rounded-xl border border-border bg-background-raised/60 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {t("disclosure")}
            </p>

            {/* Quick answer */}<QuickAnswer a={a} items={QUICK_ITEMS} /><HeroButtons a={a} />
            <Art a={a} name="hero" height={630} className="mt-8" />
{/* Six pairings */}
            <Section a={a} id="matrix" lead><Art a={a} name="matrix" height={660} />
<ProseList a={a} name="matrix" items={MATRIX_ITEMS} />
            </Section>

            {/* The alternatives */}
            <Section a={a} id="methods"><Methods a={a} items={ALT_ITEMS} />
            </Section>

            {/* Comparison table */}
            <Section a={a} id="glance" name="table"><TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[640px]" />
            </Section>

            {/* Windows to Android */}
            <Section a={a} id="windows" lead><ProseList a={a} name="windows" items={WINDOWS_ITEMS} />
            </Section>

            {/* Windows to iPhone */}
            <Section a={a} id="iphone" lead><ProseList a={a} name="iphone" items={IPHONE_ITEMS} />
            </Section>

            {/* Mac and Linux */}
            <Section a={a} id="mac-linux" name="maclinux" lead><ProseList a={a} name="maclinux" items={MACLINUX_ITEMS} />
            </Section>

            {/* Where files land on the phone */}
            <Section a={a} id="landing" lead><Art a={a} name="landing" height={620} />
<ProseList a={a} name="landing" items={LANDING_ITEMS} />
            </Section>

            {/* Size limits */}
            <Section a={a} id="limits" lead><Art a={a} name="caps" height={660} />
<ProseList a={a} name="limits" items={LIMIT_ITEMS} />
            </Section>

            {/* Step by step */}
            <Section a={a} id="steps"><ProseList a={a} name="steps" items={STEP_ITEMS} />
            </Section>

            {/* Speed */}
            <Section a={a} id="speed" lead><ProseList a={a} name="speed" items={SPEED_ITEMS} />
            </Section>

            {/* Troubleshooting */}
            <Section a={a} id="fixes"><ProseList a={a} name="fixes" items={FIX_ITEMS} />
            </Section>

            {/* Security */}
            <Section a={a} id="security" lead><ProseList a={a} name="security" items={SECURITY_ITEMS} />
            </Section>

            {/* FAQ */}
            <Section a={a} id="faq"><Faq a={a} items={FAQ_ITEMS} />
            </Section>

            {/* CTA */}<Cta a={a} /></ArticlePage>);
}
