"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/site/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";

const CODE_ALPHABET_RE = /[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g;

interface CodeInputProps {
  /** Focus the first box on mount (use on the dedicated /transfer page only). */
  autoFocus?: boolean;
}

/** 6-character transfer code entry, grouped ABC-DEF like the app displays it. */
export function CodeInput({ autoFocus = false }: CodeInputProps) {
  const [values, setValues] = useState<string[]>(Array(6).fill(""));
  const [navigating, setNavigating] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const t = useTranslations("tool");

  function go(code: string) {
    setNavigating(true);
    router.push(`/transfer/${code}`);
  }

  function handleChange(index: number, value: string) {
    const char = value.toUpperCase().replace(CODE_ALPHABET_RE, "").slice(-1);
    const newValues = [...values];
    newValues[index] = char;
    setValues(newValues);

    if (char && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    const code = newValues.join("");
    if (code.length === 6 && newValues.every((v) => v)) {
      go(code);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData
      .getData("text")
      .toUpperCase()
      .replace(CODE_ALPHABET_RE, "")
      .slice(0, 6);
    const newValues = Array(6).fill("");
    for (let i = 0; i < text.length; i++) {
      newValues[i] = text[i];
    }
    setValues(newValues);
    if (text.length === 6) {
      go(text);
    } else {
      inputsRef.current[text.length]?.focus();
    }
  }

  function handleSubmit() {
    const code = values.join("");
    if (code.length === 6) {
      go(code);
    }
  }

  function renderBox(i: number) {
    return (
      <input
        key={i}
        ref={(el) => {
          inputsRef.current[i] = el;
        }}
        type="text"
        inputMode="text"
        autoComplete="off"
        aria-label={t("code.charAria", { n: i + 1 })}
        maxLength={1}
        value={values[i]}
        autoFocus={autoFocus && i === 0}
        disabled={navigating}
        onChange={(e) => handleChange(i, e.target.value)}
        onKeyDown={(e) => handleKeyDown(i, e)}
        onPaste={handlePaste}
        className={cn(
          "h-14 w-11 rounded-[14px] border bg-card text-center font-mono text-2xl font-bold uppercase",
          "caret-accent-blue outline-none transition-all duration-[180ms] ease-out",
          "focus:border-foreground/40 focus:ring-2 focus:ring-ring/40",
          "disabled:opacity-60 sm:h-16 sm:w-12",
          values[i] ? "border-accent-blue/50" : "border-[var(--border-strong)]"
        )}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        {[0, 1, 2].map(renderBox)}
        <span aria-hidden className="w-3 text-center text-lg font-bold text-muted-foreground/50">
          –
        </span>
        {[3, 4, 5].map(renderBox)}
      </div>
      <Button
        onClick={handleSubmit}
        disabled={values.join("").length < 6 || navigating}
        className="w-full"
        size="lg"
      >
        {navigating ? (
          <>
            <Loader2 className="animate-spin" />
            {t("code.lookingUp")}
          </>
        ) : (
          <>
            {t("code.download")}
            <ArrowRight />
          </>
        )}
      </Button>
    </div>
  );
}
