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
import { YouTubeFacade } from "@/ui/youtube-facade";
import { breadcrumbLd } from "@/lib/breadcrumb-ld";

/**
 * "Transfer files from iPhone to PC" — the files twin of the photos page.
 * Semrush (2026-10-04): "how to transfer files from iphone to pc" 1,600 and
 * "transfer files from iphone to pc" 1,000 in the US at KD 31 to 44, and
 * Search Console showed zero impressions for the cluster. Page one holds
 * vendor blogs (Filemail, Softorino, iMazing, AirMore) beside Reddit and
 * Apple. None of them explains why File Explorer shows photos and nothing
 * else, and none covers the Files app's Connect to Server, or says that
 * Phone Link file sharing for iPhone is still an Insider rollout.
 *
 * This page leads with what a cable can and cannot see, ranks eight routes
 * with limits from Apple and Microsoft help pages, then gives the shared
 * folder route step by step, the way back from PC to iPhone, speed by iPhone
 * model and a fix for each common failure.
 *
 * Content lives in the "iphoneToPc" namespace, 13 locales. Bump LAST_UPDATED
 * when Apple Devices, iCloud for Windows or Phone Link change.
 */

const SLUG = "/transfer-files-iphone-to-pc";
const NS = "iphoneToPc";
const LAST_UPDATED = "2026-10-04";

const QUICK_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const KIND_ITEMS = ["0", "1", "2"] as const;
const METHOD_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7"] as const;
const CHOOSE_ITEMS = ["0", "1", "2", "3"] as const;
const SERVER_ITEMS = ["0", "1", "2", "3", "4"] as const;
const REVERSE_ITEMS = ["0", "1", "2", "3"] as const;
const STEP_ITEMS = ["0", "1", "2"] as const;
const SPEED_ITEMS = ["0", "1", "2"] as const;
const FIX_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;
const SECURITY_ITEMS = ["0", "1", "2"] as const;

/* The one-minute "AirDrop to PC" video (YouTube, English, re-published
   2026-10-31 after the first upload, tb4ycLQdJv0, went away; source and render
   scripts in bishare-project/video/airdrop-to-pc). Shown on the English page
   only, behind a click-to-load facade. */
const VIDEO = {
  id: "4FgXK0x3rdU",
  name: "AirDrop to PC: Send iPhone Videos to Windows over Wi-Fi (Free, No Cable)",
  description: "How to send videos and any file from an iPhone to a Windows PC over your own Wi-Fi, free and without a cable, with BIShare.",
  uploadDate: "2026-10-31T20:38:29-07:00",
  duration: "PT1M1S",
  thumbnail: "/img/video/airdrop-to-pc.jpg",
};
const FAQ_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] as const;

/* Comparison truth table. Columns: BIShare · Apple Devices · File Explorer
   with a cable · iCloud Drive · shared folder from the Files app · USB drive.
   Conditions behind each cell are in table.note. */
const APPS = ["bishare", "devices", "explorer", "icloud", "server", "drive"] as const;

const ROWS: Array<{ id: string; v: boolean[] }> = [
  // nothing to plug in · any file type · no internet · no account · nothing to install on the PC
  { id: "r0", v: [true, false, false, true, true, false] },
  { id: "r1", v: [true, false, false, true, true, true] },
  { id: "r2", v: [true, true, true, false, true, true] },
  { id: "r3", v: [true, true, true, false, false, true] },
  { id: "r4", v: [true, false, false, true, true, true] },
];

export const generateMetadata = articleMetadata(NS, SLUG);

export default async function IphoneToPcPage({ locale }: { locale: string }) {
  const a = await article(NS, SLUG, locale);
  const { t } = a;

  const listLd = methodsLd(a, METHOD_ITEMS);

  const faqLd = faqPageLd(t, FAQ_ITEMS);

  const pageLd = webPageLd(a, LAST_UPDATED);

  const videoLd =
    locale === "en"
      ? {
          "@context": "https://schema.org",
          "@type": "VideoObject",
          name: VIDEO.name,
          description: VIDEO.description,
          thumbnailUrl: [`https://bishare.app${VIDEO.thumbnail}`],
          uploadDate: VIDEO.uploadDate,
          duration: VIDEO.duration,
          embedUrl: `https://www.youtube.com/embed/${VIDEO.id}`,
        }
      : null;

  return (
    <ArticlePage a={a} ld={[listLd, faqLd, pageLd, breadcrumbLd(SLUG, "iPhone files to PC"), ...(videoLd ? [videoLd] : [])]}>
      {/* Hero */}
      <ArticleHead a={a} updated={LAST_UPDATED} />
      <Lead a={a} />
      <Disclosure a={a} />

      {/* Quick answer */}
      <QuickAnswer a={a} items={QUICK_ITEMS} />
      <HeroButtons a={a} />
      <Art a={a} name="hero" height={630} className="mt-8" />
      {locale === "en" && (
        <Section a={a} id="video">
          <YouTubeFacade id={VIDEO.id} title={VIDEO.name} playLabel={t("video.play")} thumbnail={VIDEO.thumbnail} className="mt-5" />
          <p className="mt-3 text-sm text-muted-foreground">{t("video.note")}</p>
        </Section>
      )}

      {/* What a cable can and cannot see */}
      <Section a={a} id="kinds" lead art={["kinds", 620]} items={KIND_ITEMS} />

      {/* The eight routes */}
      <Section a={a} id="methods">
        <Methods a={a} items={METHOD_ITEMS} />
      </Section>

      {/* Comparison table */}
      <Section a={a} id="glance" name="table">
        <TruthTable a={a} apps={APPS} rows={ROWS} min="min-w-[640px]" />
      </Section>

      {/* Pick a route */}
      <Section a={a} id="choose" lead art={["routes", 640]} items={CHOOSE_ITEMS} />

      {/* The shared folder route, step by step */}
      <Section a={a} id="server" lead items={SERVER_ITEMS} />

      {/* The way back: PC to iPhone */}
      <Section a={a} id="reverse" lead items={REVERSE_ITEMS} />

      {/* Step by step */}
      <Section a={a} id="steps" items={STEP_ITEMS} />

      {/* Speed */}
      <Section a={a} id="speed" lead items={SPEED_ITEMS} />

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
