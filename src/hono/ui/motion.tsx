/** @jsxImportSource hono/jsx */
import type { PropsWithChildren } from "hono/jsx";

// The site's reveal wrappers, without the reveal.
type Props = PropsWithChildren<{ className?: string; class?: string; delay?: number; y?: number; duration?: number; range?: number }>;
const Plain = ({ className, class: cls, children }: Props) => <div class={className ?? cls}>{children}</div>;

export const MotionProvider = ({ children }: PropsWithChildren) => <>{children}</>;
export const FadeUp = Plain;
export const RevealBlur = Plain;
export const RevealClip = Plain;
export const RevealScale = Plain;
export const ParallaxLayer = Plain;
