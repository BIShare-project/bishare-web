/** @jsxImportSource hono/jsx */
import type { JSX } from "hono/jsx/jsx-runtime";
import { createElement, Fragment } from "hono/jsx";

// framer-motion's names without motion: the plain elements, at rest. Goes when the last component stops importing it.

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- stands in for a library's wide prop types
type Any = any;

const ANIMATION = new Set(["initial", "animate", "exit", "transition", "variants", "viewport", "layout", "layoutId", "whileInView", "whileHover", "whileTap", "whileFocus", "whileDrag", "drag", "dragConstraints", "custom", "onAnimationComplete", "onViewportEnter", "onViewportLeave", "reducedMotion"]);

const plain = (props: Any) => Object.fromEntries(Object.entries(props).filter(([k]) => !ANIMATION.has(k)));
const wrap = (tag: Any) => ({ children, ...props }: Any) => createElement(tag, plain(props) as Any, ...[children].flat());

const cache = new Map<string, Any>();
export const motion: Any = new Proxy({ create: wrap } as Any, {
  get(target, tag: string) {
    if (tag === "create") return target.create;
    if (!cache.has(tag)) cache.set(tag, wrap(tag));
    return cache.get(tag);
  },
});
export const m = motion;
export const AnimatePresence = ({ children }: { children?: Any }): JSX.Element => createElement(Fragment, {} as Any, ...[children].flat()) as Any;
export const MotionConfig = AnimatePresence;
export const LazyMotion = AnimatePresence;
export const useReducedMotion = () => true;
export const useInView = () => true;
const still = (v: Any) => ({ get: () => v, set() {}, on: () => () => {} });
export const useMotionValue = still;
export const useSpring = (v: Any) => v;
export const useScroll = () => ({ scrollY: still(0), scrollYProgress: still(0) });
export const useTransform = () => still(0);
