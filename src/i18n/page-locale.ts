import { pageContext } from "./page-context";

/** The language of the page being rendered. In the browser, page-locale.browser.ts takes this module's place. */
export const pageLocale = () => pageContext().locale;
/** Its path without the language. */
export const pagePath = () => pageContext().path ?? "/";
