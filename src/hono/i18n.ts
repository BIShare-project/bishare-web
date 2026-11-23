import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createTranslator } from "use-intl/core";
import { routing } from "@/i18n/routing";
import { type Messages, pageContext } from "./page-context";

// Translations at build time: the files of src/messages, with the rules of src/i18n/request.ts and the engine next-intl
// uses. Nothing here reaches the Worker.

const DIR = join(process.cwd(), "src/messages");
const cache = new Map<string, Messages>();

function file(locale: string, ns: string): Messages {
  const key = `${locale}/${ns}`;
  let m = cache.get(key);
  if (!m) {
    const path = join(DIR, locale, `${ns}.json`);
    m = existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as Messages) : {};
    cache.set(key, m);
  }
  return m;
}

const isObject = (v: unknown): v is Messages => typeof v === "object" && v !== null && !Array.isArray(v);

/** English underneath, the locale's own strings on top. */
function merge(base: Messages, over: Messages): Messages {
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) out[k] = isObject(v) && isObject(out[k]) ? merge(out[k], v) : v;
  return out;
}

// Typed loosely on purpose: message keys are checked when the pages are built, by rendering every one of them.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Translator = any;

/** A translator for a namespace ("chrome", "home.hero") in the page's language, or in `locale`. */
export function translator(arg: string | { locale?: string; namespace: string }): Translator {
  const ctx = pageContext();
  const { locale = ctx.locale, namespace } = typeof arg === "string" ? { namespace: arg } : arg;
  const [ns, ...rest] = namespace.split(".");
  const given = ctx.messages?.();
  const of = (l: string) => (given ? ((given[l]?.[ns!] ?? {}) as Messages) : file(l, ns!));
  const messages = locale === routing.defaultLocale ? of(locale) : merge(of(routing.defaultLocale), of(locale));
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
