// Elements and hooks in the browser: hono/jsx/dom, with one difference. There, an effect that was still waiting runs even
// when its component is gone, and a state change puts the component back on the page; here nothing happens.
import {
  createElement as honoCreateElement,
  useCallback,
  useEffect as honoUseEffect,
  useLayoutEffect,
  useReducer as honoUseReducer,
  useRef,
  useState as honoUseState,
} from "hono/jsx/dom";
import { attributes } from "./attributes";

export { cloneElement, createContext, createPortal, Fragment, isValidElement, memo, render, useCallback, useContext, useId, useLayoutEffect, useMemo, useRef } from "hono/jsx/dom";

/* eslint-disable @typescript-eslint/no-explicit-any -- any element, any props */
type Any = any;

export const createElement = (tag: Any, props: Any, ...children: Any[]) => honoCreateElement(tag, props ? attributes(tag, props) : props, ...children);

/** Whether the component is (still) on the page. */
function useAlive() {
  const alive = useRef<boolean>(true);
  useLayoutEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  return alive as { current: boolean };
}

export function useState(initial?: Any): [Any, (v: Any) => void] {
  const alive = useAlive();
  const [value, set] = honoUseState(initial);
  const setAlive = useCallback((v: Any) => {
    if (alive.current) set(v);
  }, []);
  return [value, setAlive];
}

export function useReducer(reducer: Any, arg?: Any, init?: Any): [Any, (a: Any) => void] {
  const alive = useAlive();
  const [value, dispatch] = honoUseReducer(reducer, arg, init);
  const latest = useRef<Any>(dispatch);
  latest.current = dispatch;
  const dispatchAlive = useCallback((a: Any) => {
    if (alive.current) latest.current(a);
  }, []);
  return [value, dispatchAlive];
}

export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]) {
  const alive = useAlive();
  honoUseEffect(() => (alive.current ? effect() : undefined), deps as Any);
}

export function useSyncExternalStore<T>(subscribe: (l: () => void) => () => void, snapshot: () => T): T {
  const [, again] = useReducer((n: number) => n + 1, 0);
  const value = snapshot();
  const last = useRef<Any>(value);
  last.current = value;
  const read = useRef<Any>(snapshot);
  read.current = snapshot;
  useEffect(() => {
    const check = () => {
      if (!Object.is(last.current, read.current())) again(undefined);
    };
    check();
    return subscribe(check);
  }, [subscribe]);
  return value;
}

