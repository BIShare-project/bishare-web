"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";

/**
 * OTP-style room code input: one box per character, auto-advancing, with
 * backspace, arrow-key, and paste handling. Uppercases and strips anything that
 * isn't A–Z/0–9. The whole code is a single controlled string (`value`).
 */
export function CodeInput({
  value,
  onChange,
  onEnter,
  length = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  length?: number;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const focus = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  const set = (chars: string[]) => onChange(chars.join("").replace(/ +$/, ""));

  const handleChange = (i: number, raw: string) => {
    const ch = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-1);
    const arr = value.padEnd(length, " ").slice(0, length).split("");
    arr[i] = ch || " ";
    set(arr);
    if (ch && i < length - 1) focus(i + 1);
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onEnter?.();
      return;
    }
    if (e.key === "Backspace") {
      const arr = value.padEnd(length, " ").slice(0, length).split("");
      if ((arr[i] ?? " ") === " " && i > 0) {
        e.preventDefault();
        arr[i - 1] = " ";
        set(arr);
        focus(i - 1);
      } else {
        arr[i] = " ";
        set(arr);
      }
    } else if (e.key === "ArrowLeft") {
      focus(i - 1);
    } else if (e.key === "ArrowRight") {
      focus(i + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData
      .getData("text")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, length);
    onChange(text);
    focus(Math.min(text.length, length - 1));
  };

  // Fixed square boxes rather than boxes stretched to the row: a code is a few
  // characters, and the button beside it takes the rest of the line. Always
  // left to right: a Latin code read in an Arabic page must not come out
  // reversed.
  return (
    <div dir="ltr" className="flex shrink-0 gap-2" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => {
        const filled = (value[i] ?? " ") !== " ";
        return (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={value[i] ?? ""}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={(e) => e.currentTarget.select()}
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            maxLength={1}
            placeholder="•"
            aria-label={`Code character ${i + 1}`}
            className={
              "h-12 w-11 rounded-xl border text-center font-mono text-xl font-semibold uppercase caret-accent-blue outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-accent-blue focus:bg-card focus:ring-2 focus:ring-accent-blue/25 sm:h-14 sm:w-12 " +
              (filled ? "border-foreground/25 bg-card" : "border-border bg-secondary/40")
            }
          />
        );
      })}
    </div>
  );
}
