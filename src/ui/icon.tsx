import * as icons from "./icons";

export type IconName = keyof typeof icons;

/** An icon by name, for the parts every page has. Components import theirs from ./icons. */
export function Icon({ name, ...props }: { name: IconName; class?: string; size?: number; strokeWidth?: number; label?: string }) {
  const Shape = icons[name];
  return <Shape {...props} />;
}
