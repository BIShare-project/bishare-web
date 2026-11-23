import { getTranslations } from "@/i18n/translate";
import { type Article, articleMetadata, faqPageLd, webPageLd, methodsLd, ArticlePage, ArticleHead, HeroButtons, Art, Section, ProseList, QuickAnswer, Methods, TruthTable, Faq, Cta, strong, highlight } from "@/ui/article";
import { pageUrl } from "@/lib/og";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";
import { guideLinks } from "@/ui/guide-links";

/**
 * "Transfer files from phone to PC" — the SERP (Wondershare, AirDroid, Wide
 * Angle, AnExplorer, Microsoft Tech Community threads) is Android-to-Windows
 * listicles pushing desktop suites, with iPhone owners left to separate
 * articles. None separates the job by what is being moved.
 *
 * This page sorts the job by content (a few photos, a camera roll, one long
 * video, documents), ranks eight routes, and adds the details people search
 * for afterwards: where Quick Share and Phone Link save on Windows, Phone
 * Link's 2,000-photo gallery, Apple's iCloud Photos caveat for cable imports,
 * AirDrop from Android to a Mac, and the HEIC / Live Photo surprises.
 *
 * Content lives in the "phoneToPc" namespace, 13 locales. Bump LAST_UPDATED
 * when Microsoft's Phone Link or Google's Quick Share help pages change.
 */

const SLUG = "/transfer-files-phone-to-pc";
const NS = "phoneToPc";
const LAST_UPDATED = "2026-09-13";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const TYPE_ITEMS = ["0", "1", "2", "3"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7"] as const;
const WINDOWS_ITEMS = ["0", "1", "2"] as const;
const IPHONE_ITEMS = ["0", "1", "2"] as const;
const MACLINUX_ITEMS = ["0", "1", "2"] as const;
const LANDING_ITEMS = ["0", "1", "2"] as const;
const FORMAT_ITEMS = ["0", "1", "2"] as const;
const STEP_ITEMS = ["0", "1", "2"] as const;
const SPEED_ITEMS = ["0", "1", "2"] as const;
const FIX_ITEMS = ["0", "1", "2", "3", "4"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["10", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Comparison truth table. Columns: BIShare · Quick Share for Windows ·
   Phone Link · AirDrop · USB cable · iCloud / Google Photos. Conditions
   behind each cell are spelled out in table.note. */
const APPS = ["bishare", "quickshare", "phonelink", "airdrop", "usb", "cloud"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // iPhone + Android · Windows + Mac + Linux · no cable · any file type ·
  // no per-file cap · no cloud allowance
  { id: "r0", v: [true, false, false, false, true, true] },
  { id: "r1", v: [true, false, false, false, true, true] },
  { id: "r2", v: [true, true, true, true, false, true] },
  { id: "r3", v: [true, true, true, true, false, false] },
  { id: "r4", v: [true, true, false, true, true, false] },
  { id: "r5", v: [true, true, true, true, true, false] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function PhoneToPcPage({
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

  return (<ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "Transfer files from phone to PC")]}>
            {/* Hero */}<ArticleHead a={a} updated={LAST_UPDATED} />
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {t.rich("hero.body", { strong, highlight, ...links })}
            </p>
            <p className="mt-4 rounded-xl border border-border bg-background-raised/60 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {t("disclosure")}
            </p>

            {/* Quick answer */}<QuickAnswer a={a} items={QUICK_ITEMS} /><HeroButtons a={a} />
            <Art a={a} name="hero" height={630} className="mt-8" />
{/* By content type */}
            <Section a={a} id="by-type" name="types" lead><Art a={a} name="types" height={600} />
<ProseList a={a} name="types" items={TYPE_ITEMS} />
            </Section>

            {/* The alternatives */}
            <Section a={a} id="methods"><Methods a={a} items={ALT_ITEMS} />
            </Section>

            {/* Comparison table */}
            <Section a={a} id="glance" name="table"><TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[640px]" />
            </Section>

            {/* Android to Windows */}
            <Section a={a} id="android-windows" name="windows" lead><ProseList a={a} name="windows" items={WINDOWS_ITEMS} />
            </Section>

            {/* iPhone to Windows */}
            <Section a={a} id="iphone-windows" name="iphone" lead><ProseList a={a} name="iphone" items={IPHONE_ITEMS} />
            </Section>

            {/* Mac and Linux */}
            <Section a={a} id="mac-linux" name="maclinux" lead><ProseList a={a} name="maclinux" items={MACLINUX_ITEMS} />
            </Section>

            {/* Where files land on the computer */}
            <Section a={a} id="landing" lead><Art a={a} name="landing" height={560} />
<ProseList a={a} name="landing" items={LANDING_ITEMS} />
            </Section>

            {/* Formats */}
            <Section a={a} id="formats" lead><Art a={a} name="formats" height={600} />
<ProseList a={a} name="formats" items={FORMAT_ITEMS} />
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
