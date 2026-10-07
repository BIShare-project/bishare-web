/**
 * The app itself as schema.org data, and the id every other page uses to
 * point at it.
 *
 * Google asks for SoftwareApplication markup on the page about the app, and
 * treats it as a rich result that needs aggregateRating or review. We publish
 * no rating we cannot back (the App Store shows one), and Google does not let
 * a site mark up ratings collected elsewhere. Emitted on all 604 pages, the
 * node was 97 of the 97 errors in a Semrush site audit on 2026-10-03. It now
 * lives on the home page and /download only; everywhere else a page refers to
 * it by `APP_ID`, which validators accept without asking for a rating.
 */
export const APP_ID = "https://bishare.app/#app";

export const APP_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": APP_ID,
  name: "BIShare",
  operatingSystem: "iOS, Android, macOS, Windows, Linux",
  applicationCategory: "UtilitiesApplication",
  description:
    "BIShare sends files across any device — iPhone, Android, Windows, Mac, Linux. Like AirDrop, but cross-platform: instant over your local Wi-Fi, or a link the recipient opens in any browser with no app needed on their end. Free, no account.",
  url: "https://bishare.app",
  downloadUrl: "https://bishare.app/download",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  publisher: { "@id": "https://bishare.app/#org" },
  // The prose says "open source" a dozen times and links the repos, but a
  // machine reading the page had nothing structured to go on — and search
  // summaries were concluding the opposite. These properties answer it
  // without inference; the SoftwareSourceCode node in the site layout says
  // the same on every page.
  license: "https://www.apache.org/licenses/LICENSE-2.0",
  isAccessibleForFree: true,
  applicationSuite: "BIShare",
};

/** Ready to drop into a page. */
export function AppJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(APP_LD) }}
    />
  );
}
