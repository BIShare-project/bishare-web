// Elements and hooks while pages are rendered: hono/jsx. In the browser index.browser.ts takes this module's place.
import { createElement as honoCreateElement } from "hono/jsx";
import { attributes } from "./attributes";

export { cloneElement, createContext, Fragment, isValidElement, memo, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "hono/jsx";
export type * from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any -- any element, any props */
export const createElement = (tag: any, props: any, ...children: any[]): any => honoCreateElement(tag, props ? attributes(tag, props) : props, ...children);

/** Nothing is open while a page is rendered, so there is nothing to put elsewhere. */
export const createPortal = (_children: any, _container: any): any => null;
export const render = (_node: any, _into: any): void => {
  throw new Error("render() outside the browser");
};
