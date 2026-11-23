/** @jsxImportSource hono/jsx */
import type { PropsWithChildren } from "hono/jsx";
import { Button, buttonClass } from "./button";

// The names the pages import until they import Button themselves.
export { buttonClass as vbuttonClass };

type Props = PropsWithChildren<{ href?: string; variant?: "primary" | "secondary"; size?: "sm" | "md" | "lg"; type?: "button" | "submit"; className?: string; "aria-label"?: string }>;

export function VButton({ className, ...props }: Props) {
  return <Button {...props} class={className} />;
}
