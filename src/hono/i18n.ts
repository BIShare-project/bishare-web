import { createTranslator } from "use-intl/core";
import { routing } from "@/i18n/routing";
import { messageFile } from "./messages";
import { type Messages, pageContext } from "./page-context";

// Translations: the files of src/messages (messages.ts), with the rules of src/i18n/request.ts and the engine next-intl
// uses.

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

// Typed loosely on purpose: message keys are checked when the pages are built, by rendering every one of them.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Translator = any;

/** A translator for a namespace ("chrome", "home.hero") in the page's language, or in `locale`. */
export function translator(arg: string | { locale?: string; namespace: string }): Translator {
  const ctx = pageContext();
  const { locale = ctx.locale, namespace } = typeof arg === "string" ? { namespace: arg } : arg;
  const [ns, ...rest] = namespace.split(".");
  ctx.namespaces?.add(ns!);
  const messages = namespaceMessages(locale, ns!);
  return createTranslator({
    locale,
    messages: { [ns!]: messages } as never,
    namespace: [ns, ...rest].join(".") as never,
    timeZone: "UTC",
    onError(error) {
      throw new Error(`${locale}: ${error.message}`);
    },
  });
}

// next-intl's names for the pages that still import them.
export async function getTranslations(arg: string | { locale?: string; namespace: string }): Promise<Translator> {
  return translator(arg);
}
export const useTranslations = translator;
export const useLocale = () => pageContext().locale;
export const getLocale = async () => pageContext().locale;
/** The language comes from the page being rendered; there is nothing to set. */
export function setRequestLocale(_locale: string): void {}
