// The browser's JSX runtime: hono/jsx/dom's, with React's prop meanings (react-props.ts) on every element.
import { Fragment, jsx as honoJsx } from "hono/jsx/dom/jsx-runtime";
import { reactProps } from "./react-props";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the runtime's own signature
type Any = any;

export const jsx = (tag: Any, props: Any, key?: Any) => honoJsx(tag, reactProps(tag, props), key);
export { jsx as jsxs, jsx as jsxDEV, Fragment };
