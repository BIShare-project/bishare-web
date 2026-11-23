import { raw } from "hono/html";

/** The shapes inside an icon, as HTML. In the browser, svg-shapes.browser.tsx takes this module's place. */
export const Shapes = ({ html }: { html: string }) => <>{raw(html)}</>;
