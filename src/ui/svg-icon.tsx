import { Shapes } from "./svg-shapes";

export interface IconProps {
  class?: string;
  className?: string;
  size?: number;
  strokeWidth?: number;
  label?: string;
  "aria-label"?: string;
  "aria-hidden"?: boolean | "true";
  fill?: string;
  id?: string;
  style?: Record<string, string | number>;
}

const px = (v: string | number) => (typeof v === "number" ? `${v}px` : v);

/** A 24-unit line icon from its shapes. Its drawing style and default size come from the `i` class (styles.css). */
export function SvgIcon({ shapes, class: cls, className, size, strokeWidth, label, "aria-label": ariaLabel, style }: IconProps & { shapes: string }) {
  const name = label ?? ariaLabel;
  const css = [
    size && `width:${size}px;height:${size}px`,
    strokeWidth && `stroke-width:${strokeWidth}`,
    ...Object.entries(style ?? {}).map(([k, v]) => `${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${px(v)}`),
  ].filter(Boolean).join(";");
  const extra = cls ?? className;
  const a11y = name ? { role: "img", "aria-label": name } : { "aria-hidden": "true" as const };
  return (
    <svg class={extra ? `i ${extra}` : "i"} viewBox="0 0 24 24" {...(css ? { style: css } : {})} {...a11y}>
      <Shapes html={shapes} />
    </svg>
  );
}

/** A component drawing one icon, for the code that imports icons by name. */
export const svgIcon = (shapes: string) => (props: IconProps) => <SvgIcon shapes={shapes} {...props} />;
