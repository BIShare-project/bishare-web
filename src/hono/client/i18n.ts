// next-intl's names in the browser, for islands: the messages the page carries, with {values}, plurals and <tags>.

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- message trees and JSX children
type Any = any;

const state = ((globalThis as Any).__bishareI18n ??= { locale: "en", messages: {} }) as { locale: string; messages: Record<string, Any> };

export function setMessages(locale: string, messages: Record<string, Any>) {
  state.locale = locale;
  Object.assign(state.messages, messages);
}
export const useLocale = () => state.locale;

/** The index of the brace that closes the one at `from`. */
function closing(s: string, from: number): number {
  for (let i = from, depth = 0; i < s.length; i++) {
    if (s[i] === "{") depth++;
    else if (s[i] === "}" && --depth === 0) return i;
  }
  throw new Error(`Unclosed { in "${s}"`);
}

export function format(message: string, values: Record<string, Any> = {}, hash?: string): Any[] {
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
      else if (kind === "number") push(new Intl.NumberFormat(state.locale).format(value));
      else if (kind === "plural" || kind === "select") {
        const options: Record<string, string> = {};
        for (let j = 0; j < rest!.length; ) {
          const open = rest!.indexOf("{", j);
          if (open === -1) break;
          const close = closing(rest!, open);
          options[rest!.slice(j, open).trim()] = rest!.slice(open + 1, close);
          j = close + 1;
        }
        const pick = kind === "select" ? String(value) : (`=${value}` in options ? `=${value}` : new Intl.PluralRules(state.locale).select(value));
        format(options[pick] ?? options.other!, values, kind === "plural" ? new Intl.NumberFormat(state.locale).format(value) : hash).forEach(push);
      } else throw new Error(`Message format "${kind}" is not supported in an island`);
      i = end + 1;
    } else if (c === "<" && /^<\w+>/.test(message.slice(i))) {
      const tag = /^<(\w+)>/.exec(message.slice(i))![1]!;
      const end = message.indexOf(`</${tag}>`, i);
      const inner = format(message.slice(i + tag.length + 2, end), values, hash);
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

type Translate = ((key: string, values?: Record<string, Any>) => string) & { rich: (key: string, values?: Record<string, Any>) => Any[]; raw: (key: string) => Any; has: (key: string) => boolean };
/** One translator per namespace: components compare it to decide whether to run an effect again. */
const translators = new Map<string, Translate>();

export function useTranslations(namespace: string): Translate {
  const made = translators.get(namespace);
  if (made) return made;
  const at = (key: string) => [...namespace.split("."), ...key.split(".")].reduce<Any>((m, k) => m?.[k], state.messages);
  const text = (key: string): string => {
    const v = at(key);
    if (typeof v !== "string") {
      console.error(`Missing message ${namespace}.${key}`);
      return `${namespace}.${key}`;
    }
    return v;
  };
  const t = ((key, values) => format(text(key), values).join("")) as Translate;
  t.rich = (key: string, values?: Record<string, Any>) => format(text(key), values);
  t.raw = at;
  t.has = (key: string) => at(key) !== undefined;
  translators.set(namespace, t);
  return t;
}
