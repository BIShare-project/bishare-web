import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Messages } from "./page-context";

// The translations of a namespace, read from src/messages while building. The Worker's build replaces this module with
// the few namespaces its pages need (scripts/bundle.mjs).

const DIR = join(process.cwd(), "src/messages");
const cache = new Map<string, Messages>();

export function messageFile(locale: string, ns: string): Messages {
  const key = `${locale}/${ns}`;
  let m = cache.get(key);
  if (!m) {
    const path = join(DIR, locale, `${ns}.json`);
    m = existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as Messages) : {};
    cache.set(key, m);
  }
  return m;
}
