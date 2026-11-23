/** @jsxImportSource hono/jsx */
import type { PropsWithChildren } from "hono/jsx";
import { siteHref } from "./link";

type Variant = "primary" | "secondary";
type Size = "sm" | "md" | "lg";

/** The button's classes (src/hono/styles.css), for an element Button cannot render itself. */
export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string): string {
  return `btn btn-${variant} btn-${size}${extra ? ` ${extra}` : ""}`;
}

type Props = PropsWithChildren<{ href?: string; variant?: Variant; size?: Size; type?: "button" | "submit"; class?: string; "aria-label"?: string }>;

/** The site's button: a link when it goes somewhere, in a new tab when that is another site. */
export function Button({ href, variant, size, type = "button", class: extra, children, ...rest }: Props) {
  const cls = buttonClass(variant, size, extra);
  if (!href) {
    return (
      <button type={type} class={cls} {...rest}>
        {children}
      </button>
    );
  }
  const external = /^https?:\/\//.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <a href={siteHref(href)} class={cls} {...external} {...rest}>
      {children}
    </a>
  );
}
