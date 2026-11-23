/** A page being built is never missing: a call here is a mistake in the list of pages. */
export function notFound(): never {
  throw new Error("notFound() while building a page");
}
