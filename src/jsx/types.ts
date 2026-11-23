/* eslint-disable @typescript-eslint/no-explicit-any -- any element, any props */

// The types components are written with. Elements take any attribute: hono checks nothing at run time either, and the
// events are the browser's own.

export type Child = any;
export type CSSProperties = Record<string, string | number | undefined>;
export type FC<P = any> = (props: P) => any;
export type ComponentType<P = any> = FC<P>;
export type ComponentProps<_T> = Attributes;
export type HTMLAttributes<_T> = Attributes;
export type PropsWithChildren<P = unknown> = P & { children?: Child };
export type Ref<T> = { current: T | null } | ((el: T | null) => void) | null;
export type RefObject<T> = { current: T | null };

type On<E, T> = Omit<E, "target" | "currentTarget"> & { target: any; currentTarget: T };
export type ChangeEvent<T = HTMLInputElement> = On<Event, T>;
export type FormEvent<T = HTMLFormElement> = On<SubmitEvent, T>;
export type KeyboardEvent<T = HTMLElement> = On<globalThis.KeyboardEvent, T>;
export type MouseEvent<T = HTMLElement> = On<globalThis.MouseEvent, T>;
export type PointerEvent<T = HTMLElement> = On<globalThis.PointerEvent, T>;
export type DragEvent<T = HTMLElement> = Omit<On<globalThis.DragEvent, T>, "dataTransfer"> & { dataTransfer: DataTransfer };
export type ClipboardEvent<T = HTMLElement> = Omit<On<globalThis.ClipboardEvent, T>, "clipboardData"> & { clipboardData: DataTransfer };
export type TouchEvent<T = HTMLElement> = On<globalThis.TouchEvent, T>;

/** An element's attributes: any, with the types of the common handlers. */
export interface Attributes {
  [name: string]: any;
  onClick?: (e: MouseEvent<any>) => void;
  onDoubleClick?: (e: MouseEvent<any>) => void;
  onContextMenu?: (e: MouseEvent<any>) => void;
  onMouseMove?: (e: MouseEvent<any>) => void;
  onMouseEnter?: (e: MouseEvent<any>) => void;
  onTouchStart?: (e: TouchEvent<any>) => void;
  onTouchMove?: (e: TouchEvent<any>) => void;
  onKeyDown?: (e: KeyboardEvent<any>) => void;
  onChange?: (e: ChangeEvent<any>) => void;
  onInput?: (e: ChangeEvent<any>) => void;
  onSubmit?: (e: FormEvent<any>) => void;
  onPaste?: (e: ClipboardEvent<any>) => void;
  onDragEnter?: (e: DragEvent<any>) => void;
  onDragOver?: (e: DragEvent<any>) => void;
  onDragLeave?: (e: DragEvent<any>) => void;
  onDragStart?: (e: DragEvent<any>) => void;
  onDrop?: (e: DragEvent<any>) => void;
  ref?: { current: any } | ((el: any) => void) | null;
}

export namespace JSX {
  export type Element = any;
  export type ElementType = any;
  export interface IntrinsicElements {
    [tag: string]: Attributes;
  }
  export interface ElementChildrenAttribute {
    children: unknown;
  }
  export interface IntrinsicAttributes {
    key?: string | number | null;
  }
}
