/** Only the Worker has bindings. */
export function requestContext(): never {
  throw new Error("no bindings in the browser");
}

export const requestFetch: typeof fetch = (...a) => fetch(...a);
