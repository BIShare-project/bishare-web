// The pages were written for React, which leaves an attribute out when its value is false (autoFocus={false}).
// hono/jsx writes it as "false"; this gives the props React's meaning before rendering (see jsx-runtime.ts).

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- any element's props
type Props = Record<string, any>;

/** Attributes React writes as "true"/"false" instead of leaving them out. */
const BOOLEANISH = new Set(["draggable", "spellCheck", "contentEditable", "value"]);

export function serverProps(type: unknown, props: Props): Props {
  if (typeof type !== "string" || !props) return props;
  let out: Props | null = null;
  for (const key in props) {
    if (props[key] === true && (key.startsWith("aria-") || key.startsWith("data-"))) {
      out ??= { ...props };
      out[key] = "true";
    }
    if (props[key] === false && !key.startsWith("aria-") && !key.startsWith("data-") && !BOOLEANISH.has(key)) {
      out ??= { ...props };
      delete out[key];
    }
  }
  return out ?? props;
}
