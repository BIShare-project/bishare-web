/**
 * Analytics consent (Google Consent Mode v2).
 *
 * Storage-based analytics is DENIED until the visitor accepts: the bootstrap
 * script in `components/site/analytics.tsx` pushes `consent: default` with
 * `analytics_storage: 'denied'` before gtag.js loads, so no `_ga` cookie is
 * written on a first visit. Accepting flips it to `granted` for this page and
 * every future one; declining keeps it denied forever (both remembered here).
 *
 * The key is versioned and deliberately NOT the old `bishare-cookie-notice`
 * dismissal flag: that flag recorded "saw a notice about cookieless
 * analytics", which is not consent to analytics cookies. Those visitors see
 * the new choice.
 */
export const CONSENT_KEY = "bishare-consent-v1";

export type ConsentChoice = "granted" | "denied";

type ConsentWindow = Window & {
  gtag?: (...args: unknown[]) => void;
};

export function readConsent(): ConsentChoice | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    // Private mode / storage blocked: treat as "no choice recorded". Consent
    // Mode's default (denied) stays in force, which is the safe direction.
    return null;
  }
}

/** Records the choice and tells gtag about it immediately. */
export function setConsent(choice: ConsentChoice) {
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    /* choice still applies to this page session via the gtag update below */
  }
  (window as ConsentWindow).gtag?.("consent", "update", {
    analytics_storage: choice,
  });
}
