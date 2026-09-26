"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Flag, Loader2 } from "lucide-react";

/* Same backend as the contact page (POST /api/v1/contact): name/email <= 200,
   message <= 5000. The report rides the existing mail path — no new endpoint,
   no schema change to a wire-frozen contract. */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.bishare.app";

/**
 * "Report this file", under the download card. The Terms have always promised
 * removal of malware and illegal content, but the receive page had no way to
 * ask for it — and after Safe Browsing flagged the site for a user-shared
 * file, a visible, working report path is part of what a review looks for.
 * Quiet on purpose: one muted line, expands inline, never in the way of the
 * download it sits beneath.
 */
export function ReportAbuse({ code, fileName }: { code: string; fileName: string }) {
  const t = useTranslations("flows");
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    try {
      const res = await fetch(`${API_URL}/api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Abuse report (web)",
          email: email.trim(),
          category: "abuse",
          message:
            `Transfer: ${code}\nFile: ${fileName}\nPage: ${window.location.origin}${window.location.pathname}\n\n` +
            reason.trim(),
        }),
      });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <p role="status" className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Check className="h-3.5 w-3.5 text-accent-blue" aria-hidden />
        {t("transfer.report.sent")}
      </p>
    );
  }

  return (
    <div className="mt-5 text-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
      >
        <Flag className="h-3 w-3" aria-hidden />
        {t("transfer.report.trigger")}
      </button>
      {open && (
        <form onSubmit={submit} className="mx-auto mt-3 max-w-sm space-y-2 text-left">
          <input
            type="email"
            required
            maxLength={200}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("transfer.report.emailPlaceholder")}
            className="w-full rounded-lg border border-border-strong bg-secondary/40 px-3 py-2 text-sm outline-none transition-colors focus:border-accent-blue"
          />
          <textarea
            required
            minLength={10}
            maxLength={2000}
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("transfer.report.reasonPlaceholder")}
            className="w-full resize-y rounded-lg border border-border-strong bg-secondary/40 px-3 py-2 text-sm outline-none transition-colors focus:border-accent-blue"
          />
          <button
            type="submit"
            disabled={state === "sending"}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border-strong px-3 py-2 text-sm font-medium transition-colors hover:border-accent-blue disabled:opacity-60"
          >
            {state === "sending" && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
            {t("transfer.report.submit")}
          </button>
          {state === "error" && (
            <p role="alert" className="text-xs text-destructive">
              {t("transfer.report.error")}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
