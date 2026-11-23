import { AsyncLocalStorage } from "node:async_hooks";

// What code below a request may need: the Worker's bindings and waitUntil. Stands in for OpenNext's
// getCloudflareContext (scripts/hono-bundle.mjs).

export interface RequestContext {
  env: Record<string, unknown>;
  ctx: { waitUntil(p: Promise<unknown>): void };
}

const store = new AsyncLocalStorage<RequestContext>();

/** Runs `fn` for one request. The same GET inside it is made once: a page and its metadata read the same data. */
export function withRequest<T>(env: object, ctx: RequestContext["ctx"], fn: () => T): T {
  const made = new Map<string, Promise<Response>>();
  const SELF = {
    fetch: async (req: Request) => {
      if (req.method !== "GET") return fetch(req);
      let res = made.get(req.url);
      if (!res) made.set(req.url, (res = fetch(req)));
      return (await res).clone();
    },
  };
  return store.run({ env: { ...env, SELF }, ctx }, fn);
}

export function getCloudflareContext(): RequestContext {
  const c = store.getStore();
  if (!c) throw new Error("no request");
  return c;
}
