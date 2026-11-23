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
 * "Share files between Mac and Windows" — a how-to query, not a product
 * comparison, so the page is built around the methods rather than around
 * us. The SERP (AppleInsider, AirDroid, AnyViewer, NordVPN, Beebom) is mostly
 * SMB walkthroughs written for older macOS and Windows 10 menu names, and
 * none of them explains why a USB stick works on one machine and not the
 * other.
 *
 * So: all seven methods ranked with their catches, the built-in SMB route
 * written out for macOS Tahoe and Windows 11 against Apple's and Microsoft's
 * own support pages (including Apple's password warning), a plain table of
 * USB formats, speed per method, and the fixes for the usual "can't see the
 * other machine" failures.
 *
 * Content lives in the "macToWindows" namespace, 13 locales. Bump
 * LAST_UPDATED when the menu paths are re-checked.
 */

const SLUG = "/share-files-mac-to-windows";
const NS = "macToWindows";
const LAST_UPDATED = "2026-09-13";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const ALT_ITEMS = ["0", "1", "2", "3", "4", "5", "6"] as const;
const SMB_STEPS = ["0", "1", "2", "3"] as const;
const USB_ITEMS = ["0", "1", "2", "3"] as const;
const FIX_ITEMS = ["0", "1", "2", "3", "4"] as const;
const STEP_ITEMS = ["0", "1", "2"] as const;
const SPEED_ITEMS = ["0", "1", "2"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/* Comparison truth table. Columns: BIShare · SMB sharing · LocalSend ·
   cloud drive · USB drive (exFAT) · link service. Conditions behind each
   cell are spelled out in table.note. */
const APPS = ["bishare", "smb", "localsend", "cloud", "usb", "link"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // nothing to install · no settings · both directions · other network
  // · no internet · no account · no size ceiling · end-to-end encrypted
  { id: "r0", v: [true, true, false, true, true, true] },
  { id: "r1", v: [true, false, true, true, false, true] },
  { id: "r2", v: [true, true, true, true, true, true] },
  { id: "r3", v: [true, false, false, true, false, true] },
  { id: "r4", v: [true, true, true, false, true, false] },
  { id: "r5", v: [true, false, true, false, true, true] },
  { id: "r6", v: [true, true, true, false, true, false] },
  { id: "r7", v: [true, false, true, false, false, false] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function MacToWindowsPage({ locale }: { locale: string }) {
  const a = await article(NS, SLUG, locale);
  const { t } = a;

  const listLd = methodsLd(a, ALT_ITEMS);

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  return (
    <ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "Share files between Mac and Windows")]}>
      {/* Hero */}
      <ArticleHead a={a} updated={LAST_UPDATED} />
      <Lead a={a} />
      <Disclosure a={a} />

      {/* Quick answer */}
      <QuickAnswer a={a} items={QUICK_ITEMS} />
      <HeroButtons a={a} />
      <Art a={a} name="hero" height={630} className="mt-8" />
      {/* The alternatives */}
      <Section a={a} id="methods">
        <Art a={a} name="flow" height={740} />
        <Methods a={a} items={ALT_ITEMS} />
      </Section>

      {/* Comparison table */}
      <Section a={a} id="glance" name="table">
        <TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[640px]" />
      </Section>

      {/* Built-in SMB, step by step */}
      <Section a={a} id="smb" lead>
        {(["mac", "win"] as const).map((side) => (
          <div key={side} className="mt-8">
            <h3 className="text-lg font-semibold">{t(`smb.${side}Title`)}</h3>
            <ol className="mt-4 space-y-5">
              {SMB_STEPS.map((i, n) => (
                <li key={i} className="flex gap-4">
                  <span className="mt-0.5 font-mono text-sm font-semibold text-accent-blue">{n + 1}</span>
                  <div className="min-w-0">
                    <p className="font-medium">{t(`smb.${side}.${i}.h`)}</p>
                    <p className="mt-1 text-[15.5px] leading-relaxed text-muted-foreground">{t(`smb.${side}.${i}.b`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))}
        <p className="mt-8 border-l-2 border-amber-500/60 pl-4 text-[15px] leading-relaxed text-muted-foreground">{t("smb.warning")}</p>
      </Section>

      {/* USB formats */}
      <Section a={a} id="usb" lead art={["usb", 600]} items={USB_ITEMS} />

      {/* Step by step */}
      <Section a={a} id="steps" items={STEP_ITEMS} />

      {/* Speed */}
      <Section a={a} id="speed" lead art={["speed", 560]} items={SPEED_ITEMS} />

      {/* Troubleshooting */}
      <Section a={a} id="fixes" items={FIX_ITEMS} />

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
