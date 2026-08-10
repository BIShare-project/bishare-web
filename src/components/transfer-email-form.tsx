"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { sendTransferEmail } from "@/lib/api";
import { Mail, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * "Send via email" — emails the transfer's download link straight to a
 * recipient (branded, server-side via POST /api/v1/transfer/email). Shown in
 * the upload success view. `code` is the raw 6-char transfer code.
 */
export function TransferEmailForm({ code }: { code: string }) {
  const t = useTranslations("tool.email");
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || state === "sending") return;
    setState("sending");
    setErr("");
    const res = await sendTransferEmail({
      code,
      email: email.trim(),
      name: name.trim() || undefined,
      message: message.trim() || undefined,
    });
    if (res.success) {
      setState("sent");
    } else {
      setState("error");
      setErr(res.error?.message || t("failed"));
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
      >
        <Mail className="h-4 w-4" />
        {t("cta")}
      </button>
    );
  }

  if (state === "sent") {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-success">
        <Check className="h-4 w-4" />
        {t("sent")}
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-xl border border-border bg-card p-4 text-left"
    >
      <div>
        <p className="text-sm font-semibold">{t("title")}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{t("sub")}</p>
      </div>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("emailPh")}
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/40"
      />
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("namePh")}
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/40"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t("messagePh")}
        rows={2}
        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring/40"
      />
      {state === "error" && (
        <p className="text-xs text-destructive">{err}</p>
      )}
      <button
        type="submit"
        disabled={state === "sending" || !email.trim()}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        )}
      >
        {state === "sending" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("sending")}
          </>
        ) : (
          <>
            <Mail className="h-4 w-4" />
            {t("send")}
          </>
        )}
      </button>
    </form>
  );
}
