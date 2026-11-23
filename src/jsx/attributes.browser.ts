// What attributes mean in components, where hono/jsx/dom passes them on as they are: aria and data booleans are written
// out, onChange fires on every input, a field with a value keeps it, and autoFocus focuses.

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- any element's props
type Props = Record<string, any>;

/** Inputs whose "change" event is the one wanted. For every other, onChange means each "input". */
const CHANGE_INPUTS = new Set(["checkbox", "radio", "file"]);

/** The value a controlled field was last rendered with. */
const RENDERED = Symbol("rendered value");
type Controlled = { [RENDERED]?: unknown };

/** Elements focused already: autoFocus is for when the element appears, not for later renders. */
const focused = new WeakSet<object>();

export function attributes(type: unknown, props: Props): Props {
  if (typeof type !== "string") return props;
  let out: Props | null = null;
  const edit = () => (out ??= { ...props });

  for (const key in props) {
    const value = props[key];
    // aria-pressed={false} is "false"; hono/jsx/dom would remove the attribute.
    if (typeof value === "boolean" && (key.startsWith("aria-") || key.startsWith("data-"))) edit()[key] = String(value);
  }
  const textField = type === "textarea" || (type === "input" && !CHANGE_INPUTS.has(props.type));
  if (props.onChange && textField) {
    const o = edit();
    o.onInput = props.onChange;
    delete o.onChange;
  }
  // A controlled field: put the field back to its value after every change the component did not take (a
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
          // Its ref is called before it is put into the page.
          queueMicrotask(() => el.focus());
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
