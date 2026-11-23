/** The site header is in the page's HTML; a module that also exports a whole page shell imports it, never in the browser. */
export function SiteHeader(): never {
  throw new Error("SiteHeader in the browser");
}
