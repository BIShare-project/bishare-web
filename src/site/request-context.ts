import { AsyncLocalStorage } from "node:async_hooks";

// What code below a request may need: the Worker's bindings, waitUntil, and the answers it already asked for.

interface RequestContext {
  env: { DB?: unknown };
  ctx: { waitUntil(p: Promise<unknown>): void };
  made: Map<string, Promise<Response>>;
}

const store = new AsyncLocalStorage<RequestContext>();

/** Runs `fn` for one request. */
export const withRequest = <T>(env: object, ctx: RequestContext["ctx"], fn: () => T): T => store.run({ env, ctx, made: new Map() }, fn);

export function requestContext(): RequestContext {
  const c = store.getStore();
  if (!c) throw new Error("no request");
  return c;
}

/** fetch, where the same GET inside one request is made once: a page and its metadata read the same data. */
export async function requestFetch(url: string, init?: RequestInit): Promise<Response> {
  const made = store.getStore()?.made;
  if (!made || (init?.method ?? "GET") !== "GET") return fetch(url, init);
  let res = made.get(url);
  if (!res) made.set(url, (res = fetch(url, init)));
  return (await res).clone();
}
