// "react" at build time: hono/jsx, with React's attribute meanings (server-props.ts) for libraries that call createElement.
import { createElement as honoCreateElement } from "hono/jsx";
import { serverProps } from "./server-props";

export * from "hono/jsx";
export { default } from "hono/jsx";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- React's own signature
export const createElement = (tag: any, props: any, ...children: any[]) => honoCreateElement(tag, props ? serverProps(tag, props) : props, ...children);
