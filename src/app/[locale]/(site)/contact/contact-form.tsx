"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Bug,
  CheckCircle2,
  Handshake,
  HelpCircle,
  Lightbulb,
  Loader2,
  Send,
} from "lucide-react";
import { GlowButton } from "@/components/site/glow-button";
import { VButton } from "@/components/site/vbutton";
import { Input } from "@/components/site/ui/input";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.bishare.app";
const SUPPORT_EMAIL = "support@billiongroup.net";

/* Backend limits (POST /api/v1/contact): name/email <= 200, message <= 5000. */
const NAME_MAX = 200;
const EMAIL_MAX = 200;
const MESSAGE_MAX = 5000;

type CategoryKey =
  | "generalSupport"
  | "bugReport"
  | "featureRequest"
  | "partnership";

/*
 * Stable, canonical (English) values sent to the frozen API — the support
 * inbox categorizes on these, so they must NOT be localized. The visible
 * label + placeholder are localized separately from the "contact" namespace.
 */
const CATEGORY_META: {
  key: CategoryKey;
  icon: LucideIcon;
  value: string;
}[] = [
  { key: "generalSupport", icon: HelpCircle, value: "General Support" },
  { key: "bugReport", icon: Bug, value: "Bug Report" },
  { key: "featureRequest", icon: Lightbulb, value: "Feature Request" },
  { key: "partnership", icon: Handshake, value: "Partnership" },
];

type Status = "idle" | "sending" | "success" | "error";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Clean bordered focus treatment shared by the text fields. */
const FIELD_FOCUS =
  "rounded-lg bg-background transition-colors duration-200 hover:border-border-strong focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block font-mono text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase"
    >
      {children}
    </label>
  );
}

export function ContactForm() {
  const t = useTranslations("contact");
  const [categoryKey, setCategoryKey] = useState<CategoryKey>("generalSupport");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const selectedMeta =
    CATEGORY_META.find((c) => c.key === categoryKey) ?? CATEGORY_META[0];

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();
    if (!trimmedName || !trimmedEmail || !trimmedMessage) return;

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setErrorMsg(t("form.errorInvalidEmail"));
      setStatus("error");
      return;
    }
    if (
      trimmedName.length > NAME_MAX ||
      trimmedEmail.length > EMAIL_MAX ||
      trimmedMessage.length > MESSAGE_MAX
    ) {
      setErrorMsg(t("form.errorTooLong", { max: MESSAGE_MAX }));
      setStatus("error");
      return;
    }

    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch(`${API_URL}/api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          category: selectedMeta.value,
          message: trimmedMessage,
        }),
      });

      type ContactResponse = { success?: boolean; error?: { message?: string } };
      let data: ContactResponse | null = null;
      try {
        data = (await res.json()) as ContactResponse;
      } catch {
        data = null;
      }

      if (res.ok && data?.success) {
        setStatus("success");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setErrorMsg(data?.error?.message || t("form.errorGeneric"));
        setStatus("error");
      }
    } catch {
      setErrorMsg(t("form.errorNetwork"));
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center md:p-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-background">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h2 className="mb-2 text-2xl font-semibold tracking-[-0.02em] md:text-[1.75rem]">
          {t("form.successTitle")}
        </h2>
        <p className="mx-auto mb-8 max-w-sm leading-relaxed text-muted-foreground">
          {t("form.successBody")}
        </p>
        <VButton variant="secondary" onClick={() => setStatus("idle")}>
          {t("form.successAnother")}
        </VButton>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-card p-6 md:p-8"
    >
      <div className="space-y-7">
        {/* Subject */}
        <fieldset>
          <legend className="mb-3 block font-mono text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            {t("form.subjectLegend")}
          </legend>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {CATEGORY_META.map((cat) => {
              const selected = cat.key === categoryKey;
              const label = t(`form.categories.${cat.key}.label`);
              return (
                <button
                  key={cat.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setCategoryKey(cat.key)}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg border p-3.5 text-left transition-colors duration-200 outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
                    selected
                      ? "border-foreground/25 bg-secondary"
                      : "border-border hover:border-border-strong hover:bg-background-raised"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition-colors duration-200",
                      selected
                        ? "border-border bg-background text-foreground"
                        : "border-border bg-background text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    <cat.icon className="h-[18px] w-[18px]" />
                  </span>
                  <span
                    className={cn(
                      "text-[13px] font-semibold tracking-[-0.01em] transition-colors duration-200",
                      selected
                        ? "text-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Name + Email */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="contact-name">{t("form.nameLabel")}</FieldLabel>
            <Input
              id="contact-name"
              type="text"
              autoComplete="name"
              placeholder={t("form.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={NAME_MAX}
              required
              className={cn("h-12 px-4 text-[15px]", FIELD_FOCUS)}
            />
          </div>
          <div>
            <FieldLabel htmlFor="contact-email">
              {t("form.emailLabel")}
            </FieldLabel>
            <Input
              id="contact-email"
              type="email"
              autoComplete="email"
              placeholder={t("form.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={EMAIL_MAX}
              required
              className={cn("h-12 px-4 text-[15px]", FIELD_FOCUS)}
            />
          </div>
        </div>

        {/* Message */}
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <label
              htmlFor="contact-message"
              className="block font-mono text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase"
            >
              {t("form.messageLabel")}
            </label>
            {message.length > MESSAGE_MAX - 1000 && (
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                {message.length.toLocaleString()} / {MESSAGE_MAX.toLocaleString()}
              </span>
            )}
          </div>
          <textarea
            id="contact-message"
            rows={6}
            placeholder={t(`form.categories.${categoryKey}.placeholder`)}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={MESSAGE_MAX}
            required
            className={cn(
              "w-full resize-none border border-input px-4 py-3.5 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground dark:bg-input/30",
              FIELD_FOCUS
            )}
          />
        </div>

        {/* Error */}
        {status === "error" && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/[0.06] p-4 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {errorMsg}{" "}
              <span className="text-destructive/80">
                {t.rich("form.errorEmailFallback", {
                  email: SUPPORT_EMAIL,
                  link: (chunks) => (
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="font-medium underline underline-offset-2"
                    >
                      {chunks}
                    </a>
                  ),
                })}
              </span>
            </p>
          </div>
        )}

        {/* Submit */}
        <GlowButton
          type="submit"
          size="lg"
          magnetic={false}
          className="w-full"
          disabled={
            !name.trim() || !email.trim() || !message.trim() || status === "sending"
          }
        >
          {status === "sending" ? (
            <Loader2 className="h-[18px] w-[18px] animate-spin" />
          ) : (
            <Send className="h-[18px] w-[18px]" />
          )}
          {status === "sending" ? t("form.sending") : t("form.submit")}
        </GlowButton>

        <p className="text-center text-xs text-muted-foreground">
          {t.rich("form.footerNote", {
            email: SUPPORT_EMAIL,
            link: (chunks) => (
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-accent-blue hover:underline underline-offset-2"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </div>
    </form>
  );
}
