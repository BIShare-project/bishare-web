// Translations in the browser, for islands: the messages the page carries.
import { lookup, makeTranslator, type Translator } from "./format";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- message trees
type Any = any;

const state = ((globalThis as Any).__bishareI18n ??= { locale: "en", messages: {} }) as { locale: string; messages: Record<string, Any> };

export function setMessages(locale: string, messages: Record<string, Any>) {
  state.locale = locale;
  Object.assign(state.messages, messages);
}
export const useLocale = () => state.locale;

/** One translator per namespace: components compare it to decide whether to run an effect again. */
const translators = new Map<string, Translator>();

export function useTranslations(namespace: string): Translator {
  let t = translators.get(namespace);
  if (!t) {
    t = makeTranslator(useLocale, (key) => lookup(state.messages, `${namespace}.${key}`), (key) => {
      console.error(`Missing message ${namespace}.${key}`);
      return `${namespace}.${key}`;
    });
    translators.set(namespace, t);
  }
  return t;
}
