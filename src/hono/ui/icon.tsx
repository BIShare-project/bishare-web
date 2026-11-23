/** @jsxImportSource hono/jsx */
import { raw } from "hono/html";
import { ICONS } from "./icons.gen";

export type IconName = keyof typeof ICONS;

/** A lucide icon. Its drawing style and 24 px default size come from the `i` class (src/hono/styles.css). */
export function Icon({ name, class: extra, size, strokeWidth, label }: { name: IconName; class?: string; size?: number; strokeWidth?: number; label?: string }) {
  const style = [size && `width:${size}px;height:${size}px`, strokeWidth && `stroke-width:${strokeWidth}`].filter(Boolean).join(";");
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": "true" };
  return (
    <svg class={extra ? `i ${extra}` : "i"} viewBox="0 0 24 24" {...(style ? { style } : {})} {...a11y}>
      {raw(ICONS[name])}
    </svg>
  );
}
