// The build's JSX runtime: hono/jsx's, with React's attribute meanings (server-props.ts) on every element.
import { Fragment, jsx as honoJsx } from "hono/jsx/jsx-runtime";
import { serverProps } from "./server-props";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the runtime's own signature
type Any = any;

export const jsx = (tag: Any, props: Any, key?: Any) => honoJsx(tag, serverProps(tag, props), key);
export { jsx as jsxs, jsx as jsxDEV, Fragment };
