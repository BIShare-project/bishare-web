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

  return (
    <div className="flex gap-2" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
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
          aria-label={`Code character ${i + 1}`}
          className="h-12 w-full min-w-0 rounded-xl border border-border bg-background text-center font-mono text-lg font-semibold uppercase caret-primary outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      ))}
    </div>
  );
}
