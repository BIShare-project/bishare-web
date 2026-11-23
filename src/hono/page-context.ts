import { AsyncLocalStorage } from "node:async_hooks";
import { routing } from "@/i18n/routing";

// Pages are rendered at build time, many at once; each keeps its own language.

export type Messages = Record<string, unknown>;
interface PageContext {
  locale: string;
  /** The page's path without its locale prefix. */
  path?: string;
  /** Inside an island: components with behaviour render plainly. */
  inIsland?: boolean;
  /** Collects the namespaces read, for an island's messages. */
  namespaces?: Set<string>;
  /** Messages per locale instead of src/messages, for tests. */
  messages?: () => Record<string, Messages>;
}

const store = new AsyncLocalStorage<PageContext>();

/** Renders an island, collecting the message namespaces it reads. */
export function withNamespaces<T>(namespaces: Set<string>, fn: () => T): T {
  return store.run({ ...pageContext(), namespaces, inIsland: true }, fn);
}

/** Renders with `locale` as the page's language. */
/** Renders the page at `path` in `locale`. */
export function withPage<T>(locale: string, path: string, fn: () => T): T {
  return store.run({ locale, path }, fn);
}

export function withLocale<T>(locale: string, fn: () => T, messages?: PageContext["messages"]): T {
  return store.run({ locale, messages }, fn);
}

export function pageContext(): PageContext {
  return store.getStore() ?? { locale: routing.defaultLocale };
}
