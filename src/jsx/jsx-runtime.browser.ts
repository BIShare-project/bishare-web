// What the compiler turns <elements> into, in the browser.
import { Fragment, jsx as honoJsx } from "hono/jsx/dom/jsx-runtime";
import { attributes } from "./attributes";

/* eslint-disable @typescript-eslint/no-explicit-any -- any element, any props */
export const jsx = (tag: any, props: any, key?: any): any => honoJsx(tag, attributes(tag, props), key);
export { jsx as jsxDEV, jsx as jsxs, Fragment };
