// "react" in the browser: hono/jsx/dom, with React's prop meanings (react-props.ts) for libraries that call createElement.
import { createElement as honoCreateElement } from "hono/jsx/dom";
import { reactProps } from "./react-props";

export * from "hono/jsx/dom";
export { default } from "hono/jsx/dom";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- React's own signature
export const createElement = (tag: any, props: any, ...children: any[]) => honoCreateElement(tag, props ? reactProps(tag, props) : props, ...children);
