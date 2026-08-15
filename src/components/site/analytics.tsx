import Script from "next/script";
import { CONSENT_KEY } from "@/lib/consent";

/**
 * Google Analytics 4 for the marketing surface only (bishare.app). The admin
 * and Web Drive surfaces own their own layouts and are deliberately left
 * untracked — they carry user file names and account state in the UI.
 *
 * Consent Mode v2: the bootstrap below is a plain inline script so it executes
 * during HTML parse — always before the `async` gtag.js finishes loading and
 * drains the dataLayer queue. It denies analytics storage by default (no `_ga`
 * cookie until the visitor accepts) and restores a previously stored choice so
 * returning visitors aren't asked twice. `wait_for_update` gives the banner a
 * moment to grant consent before the first hit is finalised.
 *
 * The measurement ID is public by design (it ships in the HTML of every page),
 * so it lives in code rather than a secret.
 */
export const GA_MEASUREMENT_ID = "G-NW9JX7BM87";

const CONSENT_BOOTSTRAP = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
var c = null;
try { c = localStorage.getItem('${CONSENT_KEY}'); } catch (e) {}
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: c === 'granted' ? 'granted' : 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted',
  wait_for_update: 500
});
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');
`;

export function Analytics() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: CONSENT_BOOTSTRAP }} />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
    </>
  );
}
