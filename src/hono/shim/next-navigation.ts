/** A page being built is never missing: a call here is a mistake in the list of pages. */
export function notFound(): never {
  throw new Error("notFound() while building a page");
}

/** At build time nothing navigates; a call during render only needs the object. */
export function useRouter() {
  const never = () => {
    throw new Error("router used while building a page");
  };
  return { push: never, replace: never, back: never, refresh: never, prefetch: () => {} };
}
