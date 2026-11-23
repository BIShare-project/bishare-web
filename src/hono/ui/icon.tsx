/** @jsxImportSource hono/jsx */
import { ICONS } from "./icons.gen";
import { SvgIcon } from "./svg-icon";

export type IconName = keyof typeof ICONS;

/** A lucide icon by name. */
export function Icon({ name, ...props }: { name: IconName; class?: string; size?: number; strokeWidth?: number; label?: string }) {
  return <SvgIcon shapes={ICONS[name]} {...props} />;
}
