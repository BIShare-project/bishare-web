"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

const KEY = "bishare-cookie-notice";

/**
 * Cookie NOTICE (not a consent gate): a functional language cookie plus
 * Google Analytics cookies, disclosed and dismissible. Dismissal is remembered
 * in localStorage; it renders only after mount so SSR/markup stays stable.
 *
 * NOTE: since GA4 arrived this is a disclosure, not consent. EU/UK ePrivacy
 * expects prior opt-in for analytics cookies — turning this into a real gate
 * means Google Consent Mode v2 (analytics_storage denied by default, granted
 * on Accept) plus a Reject button here.
 */
export function CookieNoticeClient({
  body,
  accept,
  learnMore,
}: {
  body: string;
  accept: string;
  learnMore: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const reveal = () => {
      if (cancelled) return;
      try {
        if (!localStorage.getItem(KEY)) setShow(true);
      } catch {
        /* private mode / storage blocked — just don't show */
      }
    };
    // Reveal only once the browser is idle, i.e. AFTER the main content has
    // painted — otherwise this prominent bottom banner renders at hydration and
    // gets counted as the page's Largest Contentful Paint (hurting LCP).
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

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
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
        <Link href="/privacy" className="font-medium text-foreground underline underline-offset-2">
          {learnMore}
        </Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 rounded-full bg-foreground px-4 py-2 text-[13px] font-semibold text-background transition-opacity hover:opacity-90"
      >
        {accept}
      </button>
    </div>
  );
}
