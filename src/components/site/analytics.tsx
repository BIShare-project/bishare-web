import Script from "next/script";

/**
 * Google Analytics 4 for the marketing surface only (bishare.app). The admin
 * and Web Drive surfaces own their own layouts and are deliberately left
 * untracked — they carry user file names and account state in the UI.
 *
 * `afterInteractive` keeps the tag off the critical path, so it never delays
 * first paint. The measurement ID is public by design (it ships in the HTML of
 * every page), so it lives in code rather than a secret.
 */
export const GA_MEASUREMENT_ID = "G-NW9JX7BM87";

export function Analytics() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
