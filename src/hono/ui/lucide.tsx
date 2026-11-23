/** @jsxImportSource hono/jsx */
import { Icon, type IconName } from "./icon";

// lucide-react's component names for the pages that still import them; scripts/build-hono-pages.mjs points them here.
type Props = { className?: string; size?: number; strokeWidth?: number; "aria-hidden"?: boolean | "true"; "aria-label"?: string };

export function lucideIcon(name: IconName) {
  return ({ className, size, strokeWidth, "aria-label": label }: Props) => (
    <Icon name={name} class={className} size={size} strokeWidth={strokeWidth} label={label} />
  );
}
