"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { getDriveInterestEnabled, reportInterest, type InterestEvent } from "@/lib/api";
import { Button } from "@/components/site/ui/button";

/** What this browser answered ("yes_paid", "yes_free", "no" or "dismiss"). */
const ANSWER_KEY = "bishare.interest.drive";
/** Set once the question has been counted as shown in this browser. */
const SEEN_KEY = "bishare.interest.drive.seen";

/**
 * One question, asked once per browser under a finished upload: would this
 * person use encrypted storage at a stated price, only if it were free, or not
 * at all?
 *
 * It is a question, not an offer. Nothing is sold here, the three answers have
 * the same weight, and the card says that sending stays free. Each answer adds
 * one to an anonymous tally (lib/api.ts reportInterest); the answer itself
 * stays in this browser so the question is never asked twice.
 *
 * Hidden unless the remote flag `drive_interest_enabled` is on, and hidden when
 * localStorage is unavailable, because "ask once" could not be kept.
 */
export function DriveInterest() {
  const t = useTranslations("tool.driveInterest");
  const [state, setState] = useState<"hidden" | "ask" | "thanks">("hidden");

  useEffect(() => {
    let alive = true;
    try {
      if (localStorage.getItem(ANSWER_KEY)) return;
    } catch {
      return;
    }
    void getDriveInterestEnabled().then((on) => {
      if (!alive || !on) return;
      setState("ask");
      try {
        if (!localStorage.getItem(SEEN_KEY)) {
          localStorage.setItem(SEEN_KEY, "1");
          reportInterest("view");
        }
      } catch {
        /* shown but not counted: storage went away between the two reads */
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  function answer(event: Exclude<InterestEvent, "view">) {
    try {
      localStorage.setItem(ANSWER_KEY, event);
    } catch {
      /* the answer is still counted; the question may come back once */
    }
    reportInterest(event);
    setState(event === "dismiss" ? "hidden" : "thanks");
  }

  if (state === "hidden") return null;

  if (state === "thanks") {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-center" role="status">
        <p className="text-sm text-muted-foreground">{t("thanks")}</p>
      </div>
    );
  }

  return (
    <section className="relative rounded-xl border border-border bg-card p-5 text-left">
      <button
        type="button"
        onClick={() => answer("dismiss")}
        aria-label={t("close")}
        className="absolute end-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="pe-10 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {t("eyebrow")}
      </p>
      <h4 className="mt-2 text-base font-semibold tracking-[-0.01em]">{t("title")}</h4>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t("body")}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button onClick={() => answer("yes_paid")} variant="outline" size="sm" className="sm:flex-1">
          {t("yesPaid")}
        </Button>
        <Button onClick={() => answer("yes_free")} variant="outline" size="sm" className="sm:flex-1">
          {t("yesFree")}
        </Button>
        <Button onClick={() => answer("no")} variant="outline" size="sm" className="sm:flex-1">
          {t("no")}
        </Button>
      </div>
    </section>
  );
}
