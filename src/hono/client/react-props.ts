// The components were written for React, whose DOM props differ from the browser's in a few places. hono/jsx/dom passes
// props through as the browser has them; this gives them React's meaning first (see client/jsx-runtime.ts).

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- any element's props
type Props = Record<string, any>;

/** Inputs whose browser "change" event is React's onChange. Every other input fires React's onChange on each "input". */
const CHANGE_INPUTS = new Set(["checkbox", "radio", "file"]);

/** The value a controlled field was last rendered with. */
const RENDERED = Symbol("rendered value");
type Controlled = { [RENDERED]?: unknown };

/** Elements focused already: React focuses an autoFocus element when it mounts, not again on later renders. */
const focused = new WeakSet<object>();

export function reactProps(type: unknown, props: Props): Props {
  if (typeof type !== "string") return props;
  let out: Props | null = null;
  const edit = () => (out ??= { ...props });

  for (const key in props) {
    const value = props[key];
    // React writes aria-pressed={false} as "false"; hono/jsx/dom would remove the attribute.
    if (key.startsWith("aria-") && typeof value === "boolean") edit()[key] = String(value);
  }
  const textField = type === "textarea" || (type === "input" && !CHANGE_INPUTS.has(props.type));
  if (props.onChange && textField) {
    const o = edit();
    o.onInput = props.onChange;
    delete o.onChange;
  }
  // A controlled field: React puts the field back to its value after every change the component did not take (a
  // character a code box refuses, say). hono/jsx/dom writes the value only when it changes, so check once the
  // re-render has happened.
  const refs: ((el: HTMLElement) => void)[] = [];
  if (textField && "value" in props && (out ?? props).onInput) {
    const o = edit();
    const handler = o.onInput;
    refs.push((el) => ((el as unknown as Controlled)[RENDERED] = props.value));
    o.onInput = (e: { currentTarget: unknown }) => {
      const el = e.currentTarget as Controlled & { value: string };
      handler(e);
      const restore = () => {
        const value = el[RENDERED];
        if (value !== undefined && value !== null && el.value !== String(value)) el.value = String(value);
      };
      // The re-render is a microtask queued by the handler's state update, so it has run by the time this one does;
      // the timeout covers an update hono defers.
      queueMicrotask(restore);
      setTimeout(restore);
    };
  }
  if ("autoFocus" in props) {
    const o = edit();
    delete o.autoFocus;
    if (props.autoFocus) {
      refs.push((el) => {
        if (!focused.has(el)) {
          focused.add(el);
          el.focus();
        }
      });
    }
  }
  if (refs.length) {
    const own = props.ref;
    edit().ref = (el: HTMLElement | null) => {
      if (typeof own === "function") own(el);
      else if (own && "current" in own) own.current = el;
      if (el) for (const r of refs) r(el);
    };
  }
  return out ?? props;
}
