// What the compiler turns <elements> into, while pages are rendered.
import { Fragment, jsx as honoJsx } from "hono/jsx/jsx-runtime";
import { attributes } from "./attributes";

/* eslint-disable @typescript-eslint/no-explicit-any -- any element, any props */
export const jsx = (tag: any, props: any, key?: any): any => honoJsx(tag, attributes(tag, props), key);
export { jsx as jsxDEV, jsx as jsxs, Fragment };
export type { JSX } from "./types";
