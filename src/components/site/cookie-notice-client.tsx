"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { readConsent, setConsent } from "@/lib/consent";

/**
 * Analytics consent gate. Google Consent Mode v2 starts with
 * `analytics_storage: 'denied'` (see components/site/analytics.tsx), so no
 * analytics cookie exists until someone accepts here — which is what EU/UK
 * ePrivacy expects. Declining is a real, remembered choice, not a dismissal.
 *
 * Renders only after mount so SSR/markup stays stable, and only once the
 * browser is idle so this bottom banner is never the page's Largest
 * Contentful Paint.
 */
export function CookieNoticeClient({
  body,
  accept,
  decline,
  learnMore,
}: {
  body: string;
  accept: string;
  decline: string;
  learnMore: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const reveal = () => {
      if (cancelled) return;
      if (readConsent() === null) setShow(true);
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(reveal, { timeout: 2500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback?.(id);
      };
    }
    const id = window.setTimeout(reveal, 1800);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, []);

  if (!show) return null;

  const choose = (choice: "granted" | "denied") => {
    setConsent(choice);
    setShow(false);
  };

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-2xl flex-col gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:gap-4 sm:pl-5"
    >
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        {body}{" "}
        <Link
          href="/privacy"
          className="font-medium text-foreground underline underline-offset-2"
        >
          {learnMore}
        </Link>
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => choose("denied")}
          className="rounded-full border border-border px-4 py-2 text-[13px] font-semibold text-foreground transition-colors hover:bg-secondary"
        >
          {decline}
        </button>
        <button
          type="button"
          onClick={() => choose("granted")}
          className="rounded-full bg-foreground px-4 py-2 text-[13px] font-semibold text-background transition-opacity hover:opacity-90"
        >
          {accept}
        </button>
      </div>
    </div>
  );
}
