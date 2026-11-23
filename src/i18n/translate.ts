import { routing } from "@/i18n/routing";
import { lookup, makeTranslator, type Translator } from "./format";
import { messageFile } from "./message-files";
import { type Messages, pageContext } from "./page-context";

// Translations of a page: the files of src/messages (message-files.ts), the locale's own over English.

const isObject = (v: unknown): v is Messages => typeof v === "object" && v !== null && !Array.isArray(v);

/** English underneath, the locale's own strings on top. */
function merge(base: Messages, over: Messages): Messages {
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) out[k] = isObject(v) && isObject(out[k]) ? merge(out[k], v) : v;
  return out;
}

function namespaceMessages(locale: string, ns: string): Messages {
  const given = pageContext().messages?.();
  const of = (l: string) => (given ? ((given[l]?.[ns] ?? {}) as Messages) : messageFile(l, ns));
  return locale === routing.defaultLocale ? of(locale) : merge(of(routing.defaultLocale), of(locale));
}

/** The messages of some namespaces in the page's language, for an island. */
export const messagesOf = (namespaces: string[]) => Object.fromEntries(namespaces.map((ns) => [ns, namespaceMessages(pageContext().locale, ns)]));

export type { Translator };

/** A translator for a namespace ("chrome", "home.hero") in the page's language, or in `locale`. */
export function translator(arg: string | { locale?: string; namespace: string }): Translator {
  const ctx = pageContext();
  const { locale = ctx.locale, namespace } = typeof arg === "string" ? { namespace: arg } : arg;
  const ns = namespace.split(".")[0]!;
  ctx.namespaces?.add(ns);
  const messages = { [ns]: namespaceMessages(locale, ns) };
  return makeTranslator(() => locale, (key) => lookup(messages, `${namespace}.${key}`), (key) => {
    throw new Error(`${locale}: missing message ${namespace}.${key}`);
  });
}

export async function getTranslations(arg: string | { locale?: string; namespace: string }): Promise<Translator> {
  return translator(arg);
}
export const useTranslations = translator;
export const useLocale = () => pageContext().locale;
export const getLocale = async () => pageContext().locale;
