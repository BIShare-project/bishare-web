// The site's message format: {values}, {n, number}, {n, plural, …}, {x, select, …} and <tags>, read from the messages of
// src/messages. One formatter for the pages and for the islands.

/* eslint-disable @typescript-eslint/no-explicit-any -- message trees and JSX children */
type Any = any;

/** The index of the brace that closes the one at `from`. */
function closing(s: string, from: number): number {
  for (let i = from, depth = 0; i < s.length; i++) {
    if (s[i] === "{") depth++;
    else if (s[i] === "}" && --depth === 0) return i;
  }
  throw new Error(`Unclosed { in "${s}"`);
}

export function format(locale: string, message: string, values: Record<string, Any> = {}, hash?: string): Any[] {
  const out: Any[] = [];
  const push = (v: Any) => {
    if (typeof v !== "object" && typeof v !== "function" && typeof out[out.length - 1] === "string") out[out.length - 1] += String(v);
    else out.push(typeof v === "number" ? String(v) : v);
  };
  for (let i = 0; i < message.length; ) {
    const c = message[i]!;
    if (c === "'" && message[i + 1] === "'") {
      push("'");
      i += 2;
    } else if (c === "'" && /[{}<]/.test(message[i + 1] ?? "")) {
      const end = message.indexOf("'", i + 1);
      push(message.slice(i + 1, end === -1 ? undefined : end));
      i = end === -1 ? message.length : end + 1;
    } else if (c === "#" && hash !== undefined) {
      push(hash);
      i++;
    } else if (c === "{") {
      const end = closing(message, i);
      const [, name, kind, rest] = /^\s*(\w+)\s*(?:,\s*(\w+)\s*(?:,\s*([\s\S]*))?)?$/.exec(message.slice(i + 1, end))!;
      const value = values[name!];
      if (!kind) push(value ?? "");
      else if (kind === "number") push(new Intl.NumberFormat(locale).format(value));
      else if (kind === "plural" || kind === "select") {
        const options: Record<string, string> = {};
        for (let j = 0; j < rest!.length; ) {
          const open = rest!.indexOf("{", j);
          if (open === -1) break;
          const close = closing(rest!, open);
          options[rest!.slice(j, open).trim()] = rest!.slice(open + 1, close);
          j = close + 1;
        }
        const pick = kind === "select" ? String(value) : (`=${value}` in options ? `=${value}` : new Intl.PluralRules(locale).select(value));
        format(locale, options[pick] ?? options.other!, values, kind === "plural" ? new Intl.NumberFormat(locale).format(value) : hash).forEach(push);
      } else throw new Error(`Message format "${kind}" is not supported`);
      i = end + 1;
    } else if (c === "<" && /^<\w+>/.test(message.slice(i))) {
      const tag = /^<(\w+)>/.exec(message.slice(i))![1]!;
      const end = message.indexOf(`</${tag}>`, i);
      const inner = format(locale, message.slice(i + tag.length + 2, end), values, hash);
      push(values[tag] ? values[tag](inner) : inner);
      i = end + tag.length + 3;
    } else {
      let j = i + 1;
      while (j < message.length && !"{<'#".includes(message[j]!)) j++;
      push(message.slice(i, j));
      i = j;
    }
  }
  return out;
}

export interface Translator {
  (key: string, values?: Record<string, Any>): string;
  /** With <tags> given as functions: the pieces, in order. */
  rich(key: string, values?: Record<string, string | number | Date | null | undefined | ((chunks: Any) => Any)>): Any;
  raw(key: string): Any;
  has(key: string): boolean;
}

/** A translator over `at`, which looks a key up. `missing` answers for a key that has no text. */
export function makeTranslator(locale: () => string, at: (key: string) => Any, missing: (key: string) => string): Translator {
  const text = (key: string): string => {
    const v = at(key);
    return typeof v === "string" ? v : missing(key);
  };
  return Object.assign((key: string, values?: Record<string, Any>) => format(locale(), text(key), values).join(""), {
    rich: (key: string, values?: Record<string, Any>) => format(locale(), text(key), values),
    raw: at,
    has: (key: string) => at(key) !== undefined,
  });
}

export const lookup = (tree: Any, path: string): Any => path.split(".").reduce<Any>((m, k) => m?.[k], tree);
