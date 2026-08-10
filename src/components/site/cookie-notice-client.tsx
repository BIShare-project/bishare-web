"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

const KEY = "bishare-cookie-notice";

/**
 * Lightweight cookie NOTICE (not a consent gate): BIShare sets only a functional
 * language cookie and uses cookieless analytics, so there is nothing to gate —
 * an honest, dismissible notice is the right pattern. Dismissal is remembered in
 * localStorage; it renders only after mount so SSR/markup stays stable.
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
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* private mode / storage blocked — just don't show */
    }
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
