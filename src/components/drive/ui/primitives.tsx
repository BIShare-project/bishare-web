import { cloneElement, createContext, isValidElement, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState, createPortal } from "@/jsx";
import { cn } from "@/lib/utils";

// The behaviour under the Drive's controls: dialogs, menus, a select, tooltips, switches. Looks come from the files
// beside this one, which put their classes on these parts.

/* eslint-disable @typescript-eslint/no-explicit-any -- these parts take any element's props */
type Any = any;
type Fn = (...a: Any[]) => void;

/** What a part takes: its own callbacks, and any attribute of its element. */
export interface Parts {
  onOpenChange?: (open: boolean) => void;
  onValueChange?: (value: string) => void;
  onCheckedChange?: (checked: Any) => void;
  onOpenAutoFocus?: (e: Event) => void;
  onSelect?: () => void;
  onClick?: (e: Any) => void;
  onChange?: (e: Any) => void;
  onKeyDown?: (e: Any) => void;
  onSubmit?: (e: Any) => void;
  [attribute: string]: Any;
}

// ---- small helpers ----------------------------------------------------------------------------

/** Both refs get the element. */
function setRef(ref: Any, el: unknown) {
  if (typeof ref === "function") ref(el);
  else if (ref) ref.current = el;
}

/** The first handler, then the second unless the first prevented it. */
const chain = (a?: Fn, b?: Fn) => (e: Event) => {
  a?.(e);
  if (!e?.defaultPrevented) b?.(e);
};

/** Puts its props on the one element inside it, instead of adding one. */
export function Slot({ children, ...props }: Any) {
  const child = Array.isArray(children) ? children.find((c: unknown) => isValidElement(c)) : children;
  if (!isValidElement(child)) return null;
  const own = (child as Any).props;
  const merged: Any = { ...props, ...own };
  for (const k of Object.keys(props)) {
    if (/^on[A-Z]/.test(k) && typeof own[k] === "function") merged[k] = chain(own[k], props[k]);
  }
  if (props.className || own.className) merged.className = cn(props.className, own.className);
  if (props.style && own.style) merged.style = { ...props.style, ...own.style };
  if (props.ref && own.ref) {
    merged.ref = (el: unknown) => {
      setRef(props.ref, el);
      setRef(own.ref, el);
    };
  }
  return cloneElement(child as Any, merged);
}

/** A value the caller may hold, or not. */
function useControlled<T>(value: T | undefined, initial: T, onChange?: (v: T) => void): [T, (v: T) => void] {
  const [inner, setInner] = useState<T>(initial);
  const change = useRef(onChange);
  change.current = onChange;
  const held = value !== undefined;
  return [
    held ? value : inner,
    useCallback(
      (v: T) => {
        if (!held) setInner(v);
        change.current?.(v);
      },
      [held],
    ),
  ];
}

const state = (open: boolean) => (open ? "open" : "closed");

// ---- layers -----------------------------------------------------------------------------------

interface Layer {
  /** The press it was opened by, if any. */
  openedBy: Press | null;
  inside: (n: Node) => boolean;
  close: (how: "escape" | "outside") => void;
}

interface Press {
  x: number;
  y: number;
  at: number;
}
/** The last press on the page. */
let lastPress: Press | null = null;
/** The second press of a double-click: the same spot, moments after the press that opened the layer. */
const repeats = (p: PointerEvent, first: Press | null) => !!first && p.timeStamp - first.at < 500 && Math.abs(p.clientX - first.x) < 6 && Math.abs(p.clientY - first.y) < 6;

/** What is open, the top one last: only that one hears Escape and a press outside it. */
const layers: Layer[] = [];
let listening = false;

function listen() {
  if (listening) return;
  listening = true;
  document.addEventListener(
    "keydown",
    (e) => {
      const top = layers.at(-1);
      if (e.key !== "Escape" || !top) return;
      e.preventDefault();
      e.stopPropagation();
      top.close("escape");
    },
    true,
  );
  document.addEventListener(
    "pointerdown",
    (e) => {
      const top = layers.at(-1);
      // The second press of the double-click that opened it is not a press outside it.
      if (top && e.target instanceof Node && !top.inside(e.target) && !repeats(e, top.openedBy)) top.close("outside");
      lastPress = { x: e.clientX, y: e.clientY, at: e.timeStamp };
    },
    true,
  );
}

// From the start: the press that opens the first layer must be known too.
if (typeof document !== "undefined") listen();

/** Holds the page still (no scrolling, no clicks) under what is open. */
let held = 0;
function holdPage(): () => void {
  const { body, documentElement: html } = document;
  if (held++ === 0) {
    const gap = window.innerWidth - html.clientWidth;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    body.style.pointerEvents = "none";
  }
  return () => {
    if (--held === 0) for (const p of ["overflow", "padding-right", "pointer-events"]) body.style.removeProperty(p);
  };
}

/** Makes `ref` a layer while it is on screen; gives the focus back when it goes. */
function useLayer(ref: { current: HTMLElement | null }, close: (how: "escape" | "outside") => void, also?: () => HTMLElement | null) {
  const latest = useRef(close);
  latest.current = close;
  useLayoutEffect(() => {
    listen();
    const layer: Layer = { openedBy: lastPress, inside: (n) => !!ref.current?.contains(n) || !!also?.()?.contains(n), close: (how) => latest.current(how) };
    layers.push(layer);
    const free = holdPage();
    return () => {
      layers.splice(layers.indexOf(layer), 1);
      free();
    };
  }, []);
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
const focusables = (el: HTMLElement) => [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((x) => x.getClientRects().length > 0);

// ---- plain controls ---------------------------------------------------------------------------

const LabelRoot = (props: Any) => <label {...props} />;
export const Label = { Root: LabelRoot };

const ProgressRoot = ({ value, max = 100, children, ...props }: Any) => (
  <div role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} data-state={value >= max ? "complete" : "loading"} data-value={value} data-max={max} {...props}>
    {children}
  </div>
);
const ProgressIndicator = (props: Any) => <div {...props} />;
export const Progress = { Root: ProgressRoot, Indicator: ProgressIndicator };

const Checked = createContext<Any>(false);
const checkedState = (c: Any) => (c === "indeterminate" ? "indeterminate" : c ? "checked" : "unchecked");

function CheckboxRoot({ checked, defaultChecked, onCheckedChange, disabled, children, onClick, ...props }: Any) {
  const [on, setOn] = useControlled<Any>(checked, defaultChecked ?? false, onCheckedChange);
  return (
    <Checked.Provider value={on}>
      <button
        type="button"
        role="checkbox"
        aria-checked={on === "indeterminate" ? "mixed" : on}
        data-state={checkedState(on)}
        data-disabled={disabled ? "" : undefined}
        disabled={disabled}
        value="on"
        onClick={chain(onClick, () => setOn(on === "indeterminate" ? true : !on))}
        onKeyDown={(e: KeyboardEvent) => e.key === "Enter" && e.preventDefault()}
        {...props}
      >
        {children}
      </button>
    </Checked.Provider>
  );
}
function CheckboxIndicator(props: Any) {
  const on = useContext(Checked);
  return on ? <span data-state={checkedState(on)} style={{ pointerEvents: "none" }} {...props} /> : null;
}
export const Checkbox = { Root: CheckboxRoot, Indicator: CheckboxIndicator };

function SwitchRoot({ checked, defaultChecked, onCheckedChange, disabled, children, onClick, ...props }: Any) {
  const [on, setOn] = useControlled<boolean>(checked, defaultChecked ?? false, onCheckedChange);
  return (
    <Checked.Provider value={on}>
      <button type="button" role="switch" aria-checked={on} data-state={checkedState(on)} data-disabled={disabled ? "" : undefined} disabled={disabled} value="on" onClick={chain(onClick, () => setOn(!on))} {...props}>
        {children}
      </button>
    </Checked.Provider>
  );
}
function SwitchThumb(props: Any) {
  return <span data-state={checkedState(useContext(Checked))} {...props} />;
}
export const Switch = { Root: SwitchRoot, Thumb: SwitchThumb };

// ---- tabs -------------------------------------------------------------------------------------

const TabsCtx = createContext<Any>(null);
function TabsRoot({ value, defaultValue, onValueChange, children, ...props }: Any) {
  const [v, set] = useControlled<string>(value, defaultValue ?? "", onValueChange);
  return (
    <TabsCtx.Provider value={{ v, set }}>
      <div dir="ltr" {...props}>
        {children}
      </div>
    </TabsCtx.Provider>
  );
}
function TabsList({ onKeyDown, ...props }: Any) {
  const move = (e: KeyboardEvent) => {
    const tabs = [...(e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="tab"]:not([disabled])')];
    const at = tabs.indexOf(document.activeElement as HTMLElement);
    const to = { ArrowRight: at + 1, ArrowLeft: at - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (to === undefined || at < 0) return;
    e.preventDefault();
    const tab = tabs[(to + tabs.length) % tabs.length]!;
    tab.focus();
    tab.click();
  };
  return <div role="tablist" aria-orientation="horizontal" onKeyDown={chain(onKeyDown, move as Fn)} {...props} />;
}
function TabsTrigger({ value, onClick, ...props }: Any) {
  const { v, set } = useContext(TabsCtx);
  const on = v === value;
  return <button type="button" role="tab" aria-selected={on} data-state={on ? "active" : "inactive"} data-orientation="horizontal" tabIndex={on ? 0 : -1} onClick={chain(onClick, () => set(value))} {...props} />;
}
export const Tabs = { Root: TabsRoot, List: TabsList, Trigger: TabsTrigger };

// ---- dialog -----------------------------------------------------------------------------------

const DialogCtx = createContext<Any>(null);
function DialogRoot({ open, defaultOpen, onOpenChange, children }: Any) {
  const [on, set] = useControlled<boolean>(open, defaultOpen ?? false, onOpenChange);
  const id = useId();
  return <DialogCtx.Provider value={{ open: on, set, id }}>{children}</DialogCtx.Provider>;
}
function DialogPortal({ children }: Any) {
  const { open } = useContext(DialogCtx);
  return open ? createPortal(children, document.body) : null;
}
function DialogOverlay(props: Any) {
  return <div data-state="open" aria-hidden="true" style={{ pointerEvents: "auto" }} {...props} />;
}
function DialogContent({ onOpenAutoFocus, children, ref, ...props }: Any) {
  const { set, id } = useContext(DialogCtx);
  const el = useRef<HTMLElement | null>(null);
  useLayer(el, () => set(false));
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const box = el.current!;
    if (!box.contains(document.activeElement)) {
      const ask = new Event("focus", { cancelable: true });
      onOpenAutoFocus?.(ask);
      (ask.defaultPrevented ? box : (focusables(box)[0] ?? box)).focus();
    }
    const top = () => layers.at(-1)?.inside(box);
    const keep = (e: FocusEvent) => {
      if (top() && e.target instanceof Node && !box.contains(e.target)) (focusables(box)[0] ?? box).focus();
    };
    document.addEventListener("focusin", keep);
    return () => {
      document.removeEventListener("focusin", keep);
      if (before?.isConnected) before.focus();
    };
  }, []);
  const tab = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const all = focusables(el.current!);
    const [first, last] = [all[0], all.at(-1)];
    if (!first) return e.preventDefault();
    if (e.shiftKey ? document.activeElement === first || document.activeElement === el.current : document.activeElement === last) {
      e.preventDefault();
      (e.shiftKey ? last : first)!.focus();
    }
  };
  return (
    <div
      ref={(n: HTMLElement | null) => {
        el.current = n;
        setRef(ref, n);
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}t`}
      aria-describedby={`${id}d`}
      data-state="open"
      tabIndex={-1}
      {...props}
      style={{ pointerEvents: "auto", ...props.style }}
      onKeyDown={chain(props.onKeyDown, tab as Fn)}
    >
      {children}
    </div>
  );
}
function DialogTitle(props: Any) {
  return <h2 id={`${useContext(DialogCtx).id}t`} {...props} />;
}
function DialogDescription(props: Any) {
  return <p id={`${useContext(DialogCtx).id}d`} {...props} />;
}
function DialogClose({ asChild, onClick, ...props }: Any) {
  const { set } = useContext(DialogCtx);
  const Comp: Any = asChild ? Slot : "button";
  return <Comp type="button" {...props} onClick={chain(onClick, () => set(false))} />;
}
export const Dialog = { Root: DialogRoot, Portal: DialogPortal, Overlay: DialogOverlay, Content: DialogContent, Title: DialogTitle, Description: DialogDescription, Close: DialogClose };

// ---- placing things beside what opened them ---------------------------------------------------

interface Place {
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  margin?: number;
}

/** Puts `box` (fixed) beside `at`, on the other side when there is no room, inside the window in any case. */
function place(box: HTMLElement, at: DOMRect, { side = "bottom", align = "center", sideOffset = 0, margin = 0 }: Place): { side: string } {
  const { innerWidth: W, innerHeight: H } = window;
  const w = box.offsetWidth;
  const h = box.offsetHeight;
  const room = { top: at.top - sideOffset - margin, bottom: H - at.bottom - sideOffset - margin, left: at.left - sideOffset - margin, right: W - at.right - sideOffset - margin };
  const other = { top: "bottom", bottom: "top", left: "right", right: "left" } as const;
  const tall = side === "top" || side === "bottom";
  if (room[side] < (tall ? h : w) && room[other[side]] > room[side]) side = other[side];
  const span = tall ? [at.left, at.width, w, W] : [at.top, at.height, h, H];
  let cross = align === "start" ? span[0]! : align === "end" ? span[0]! + span[1]! - span[2]! : span[0]! + (span[1]! - span[2]!) / 2;
  cross = Math.max(margin, Math.min(cross, span[3]! - span[2]! - margin));
  const main = { top: at.top - h - sideOffset, bottom: at.bottom + sideOffset, left: at.left - w - sideOffset, right: at.right + sideOffset }[side];
  box.style.left = `${Math.round(tall ? cross : main)}px`;
  box.style.top = `${Math.round(tall ? main : cross)}px`;
  box.style.setProperty("--available-height", `${Math.max(0, room[side])}px`);
  return { side };
}

const FIXED = { position: "fixed", left: "0", top: "0", minWidth: "max-content", zIndex: "50" } as const;

// ---- menus ------------------------------------------------------------------------------------

const MenuCtx = createContext<Any>(null);
const RadioCtx = createContext<Any>(null);
const ItemCtx = createContext<boolean>(false);

function MenuRoot({ open, defaultOpen, onOpenChange, children }: Any) {
  const [on, set] = useControlled<boolean>(open, defaultOpen ?? false, onOpenChange);
  const trigger = useRef<HTMLElement | null>(null);
  const point = useRef<DOMRect | null>(null);
  const byKey = useRef(false);
  const id = useId();
  return <MenuCtx.Provider value={{ open: on, set, trigger, point, byKey, id }}>{children}</MenuCtx.Provider>;
}

function DropdownTrigger({ asChild, disabled, ...props }: Any) {
  const m = useContext(MenuCtx);
  const Comp: Any = asChild ? Slot : "button";
  return (
    <Comp
      type="button"
      {...props}
      ref={(el: HTMLElement | null) => {
        m.trigger.current = el;
        setRef(props.ref, el);
      }}
      id={`${m.id}b`}
      aria-haspopup="menu"
      aria-expanded={m.open}
      data-state={state(m.open)}
      disabled={disabled}
      onPointerDown={chain(props.onPointerDown, (e: PointerEvent) => {
        if (e.button !== 0 || e.ctrlKey) return;
        m.byKey.current = false;
        if (!m.open) e.preventDefault();
        m.set(!m.open);
      })}
      onKeyDown={chain(props.onKeyDown, (e: KeyboardEvent) => {
        if (!["Enter", " ", "ArrowDown"].includes(e.key)) return;
        e.preventDefault();
        m.byKey.current = true;
        m.set(true);
      })}
    />
  );
}

function ContextTrigger({ asChild, ...props }: Any) {
  const m = useContext(MenuCtx);
  const Comp: Any = asChild ? Slot : "span";
  const press = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openAt = (x: number, y: number) => {
    m.point.current = new DOMRect(x, y, 0, 0);
    m.byKey.current = false;
    m.set(true);
  };
  const stop = () => {
    if (press.current) clearTimeout(press.current);
    press.current = null;
  };
  // A long press opens it on touch screens.
  return (
    <Comp
      {...props}
      data-state={state(m.open)}
      style={{ WebkitTouchCallout: "none", ...props.style }}
      onContextMenu={chain(props.onContextMenu, (e: MouseEvent) => {
        stop();
        e.preventDefault();
        openAt(e.clientX, e.clientY);
      })}
      onPointerDown={chain(props.onPointerDown, (e: PointerEvent) => {
        if (e.pointerType === "mouse") return;
        stop();
        press.current = setTimeout(() => openAt(e.clientX, e.clientY), 700);
      })}
      onPointerMove={chain(props.onPointerMove, (e: PointerEvent) => e.pointerType !== "mouse" && stop())}
      onPointerUp={chain(props.onPointerUp, stop)}
      onPointerCancel={chain(props.onPointerCancel, stop)}
    />
  );
}

function MenuPortal({ children }: Any) {
  const { open } = useContext(MenuCtx);
  return open ? createPortal(children, document.body) : null;
}

const items = (el: HTMLElement) => [...el.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([data-disabled]),[role="option"]:not([data-disabled])')];

/** Arrows, Home, End and typing move through the items; Tab does nothing, as in a system menu. */
function moveInList(e: KeyboardEvent, box: HTMLElement, typed: { current: string; at: number }) {
  const all = items(box);
  const at = all.indexOf(document.activeElement as HTMLElement);
  const go = (i: number) => {
    e.preventDefault();
    all[Math.max(0, Math.min(i, all.length - 1))]?.focus();
  };
  if (e.key === "ArrowDown") go(at + 1);
  else if (e.key === "ArrowUp") go(at < 0 ? all.length - 1 : at - 1);
  else if (e.key === "Home" || e.key === "PageUp") go(0);
  else if (e.key === "End" || e.key === "PageDown") go(all.length - 1);
  else if (e.key === "Tab") e.preventDefault();
  else if (e.key.length === 1 && e.key !== " " && !e.ctrlKey && !e.metaKey && !e.altKey) {
    typed.current = Date.now() - typed.at > 1000 ? e.key : typed.current + e.key;
    typed.at = Date.now();
    const q = [...typed.current].every((c) => c === typed.current[0]) ? typed.current[0]! : typed.current;
    const from = q.length === 1 ? at + 1 : Math.max(at, 0);
    const next = [...all.slice(from), ...all.slice(0, from)].find((x) => x.textContent!.trim().toLowerCase().startsWith(q.toLowerCase()));
    if (next) next.focus();
  }
}

function MenuContent({ side = "bottom", align = "start", sideOffset = 0, children, className, context = false, ...props }: Any) {
  const m = useContext(MenuCtx);
  const wrap = useRef<HTMLDivElement | null>(null);
  const box = useRef<HTMLDivElement | null>(null);
  const typed = useRef({ current: "", at: 0 });
  const [at, setAt] = useState(side);
  useLayer(box, () => m.set(false));
  useLayoutEffect(() => {
    const w = wrap.current!;
    const put = () => {
      const anchor: DOMRect = context ? m.point.current : m.trigger.current!.getBoundingClientRect();
      w.style.setProperty("--trigger-width", `${anchor.width}px`);
      setAt(place(w, anchor, context ? { side: "right", align: "start", sideOffset: 2 } : { side, align, sideOffset }).side);
    };
    put();
    const before = document.activeElement as HTMLElement | null;
    (m.byKey.current ? (items(box.current!)[0] ?? box.current!) : box.current!).focus({ preventScroll: true });
    window.addEventListener("resize", put);
    return () => {
      window.removeEventListener("resize", put);
      const back = context ? before : m.trigger.current;
      // Not when choosing an item moved the focus already (into a dialog).
      if (back?.isConnected && (!document.activeElement || document.activeElement === document.body || box.current?.contains(document.activeElement))) back.focus({ preventScroll: true });
    };
  }, []);
  return (
    <div ref={wrap} style={FIXED}>
      <div
        ref={box}
        role="menu"
        dir="ltr"
        aria-orientation="vertical"
        aria-labelledby={context ? undefined : `${m.id}b`}
        data-state="open"
        data-side={at}
        data-align={align}
        tabIndex={-1}
        className={className}
        {...props}
        style={{ pointerEvents: "auto", outline: "none", ...props.style }}
        onKeyDown={(e: KeyboardEvent) => moveInList(e, box.current!, typed.current)}
        onContextMenu={(e: Event) => e.preventDefault()}
      >
        {children}
      </div>
    </div>
  );
}
const ContextContent = (props: Any) => <MenuContent {...props} context />;

function MenuItem({ onSelect, disabled, role = "menuitem", children, ...props }: Any) {
  const m = useContext(MenuCtx);
  const choose = (e: Event) => {
    if (disabled) return;
    // The menu goes first, so what the choice opens keeps the focus it takes.
    m.set(false);
    onSelect?.(e);
  };
  return (
    <div
      role={role}
      tabIndex={-1}
      data-disabled={disabled ? "" : undefined}
      aria-disabled={disabled ? true : undefined}
      {...props}
      onClick={chain(props.onClick, choose)}
      onPointerMove={chain(props.onPointerMove, (e: PointerEvent) => {
        if (e.pointerType === "mouse" && !disabled) (e.currentTarget as HTMLElement).focus({ preventScroll: true });
      })}
      onPointerLeave={chain(props.onPointerLeave, (e: PointerEvent) => {
        if (e.pointerType === "mouse") (e.currentTarget as HTMLElement).closest<HTMLElement>('[role="menu"]')?.focus({ preventScroll: true });
      })}
      onKeyDown={chain(props.onKeyDown, (e: KeyboardEvent) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        (e.currentTarget as HTMLElement).click();
      })}
    >
      {children}
    </div>
  );
}
function RadioGroup({ value, onValueChange, ...props }: Any) {
  return (
    <RadioCtx.Provider value={{ value, set: onValueChange }}>
      <div role="group" {...props} />
    </RadioCtx.Provider>
  );
}
function RadioItem({ value, onSelect, children, ...props }: Any) {
  const r = useContext(RadioCtx);
  const on = r.value === value;
  return (
    <ItemCtx.Provider value={on}>
      <MenuItem
        role="menuitemradio"
        aria-checked={on}
        data-state={checkedState(on)}
        {...props}
        onSelect={() => {
          r.set?.(value);
          onSelect?.();
        }}
      >
        {children}
      </MenuItem>
    </ItemCtx.Provider>
  );
}
const ItemIndicator = (props: Any) => (useContext(ItemCtx) ? <span {...props} /> : null);
const MenuLabel = (props: Any) => <div {...props} />;
const MenuSeparator = (props: Any) => <div role="separator" aria-orientation="horizontal" {...props} />;

export const DropdownMenu = { Root: MenuRoot, Trigger: DropdownTrigger, Portal: MenuPortal, Content: MenuContent, Item: MenuItem, RadioGroup, RadioItem, ItemIndicator, Label: MenuLabel, Separator: MenuSeparator };
export const ContextMenu = { Root: MenuRoot, Trigger: ContextTrigger, Portal: MenuPortal, Content: ContextContent, Item: MenuItem, Separator: MenuSeparator };

// ---- select -----------------------------------------------------------------------------------

const SelectCtx = createContext<Any>(null);
function SelectRoot({ value, defaultValue, onValueChange, children }: Any) {
  const [v, set] = useControlled<string>(value, defaultValue ?? "", onValueChange);
  const [open, setOpen] = useState(false);
  const [names, setNames] = useState<Record<string, Any>>({});
  const trigger = useRef<HTMLElement | null>(null);
  const shown = useRef<HTMLElement | null>(null);
  const id = useId();
  const name = useCallback((k: string, label: Any) => setNames((n) => (n[k] === label ? n : { ...n, [k]: label })), []);
  return <SelectCtx.Provider value={{ v, set, open, setOpen, names, name, trigger, shown, id }}>{children}</SelectCtx.Provider>;
}
function SelectTrigger({ children, ...props }: Any) {
  const s = useContext(SelectCtx);
  return (
    <button
      type="button"
      role="combobox"
      dir="ltr"
      {...props}
      ref={s.trigger}
      aria-expanded={s.open}
      aria-controls={`${s.id}l`}
      aria-autocomplete="none"
      data-state={state(s.open)}
      data-placeholder={s.v ? undefined : ""}
      onPointerDown={(e: PointerEvent) => {
        if (e.button !== 0 || e.ctrlKey) return;
        e.preventDefault();
        s.setOpen(true);
      }}
      onKeyDown={(e: KeyboardEvent) => {
        if (!["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) return;
        e.preventDefault();
        s.setOpen(true);
      }}
    >
      {children}
    </button>
  );
}
function SelectValue({ placeholder, ...props }: Any) {
  const s = useContext(SelectCtx);
  return (
    <span ref={s.shown} style={{ pointerEvents: "none" }} {...props}>
      {s.names[s.v] ?? placeholder}
    </span>
  );
}
function SelectIcon({ children }: Any) {
  return <Slot aria-hidden="true">{children}</Slot>;
}
/** While it is closed its items are still there, out of sight, so the button knows the name of the chosen one. */
function SelectPortal({ children }: Any) {
  const { open } = useContext(SelectCtx);
  return open ? createPortal(children, document.body) : <span hidden>{children}</span>;
}
function SelectContent({ children, position: _p, align: _a, ...props }: Any) {
  const { open } = useContext(SelectCtx);
  return open ? <SelectList {...props}>{children}</SelectList> : <>{children}</>;
}
function SelectList({ children, ...props }: Any) {
  const s = useContext(SelectCtx);
  const wrap = useRef<HTMLDivElement | null>(null);
  const box = useRef<HTMLDivElement | null>(null);
  const typed = useRef({ current: "", at: 0 });
  useLayer(box, () => s.setOpen(false));
  useLayoutEffect(() => {
    const w = wrap.current!;
    const b = s.trigger.current!.getBoundingClientRect();
    box.current!.style.minWidth = `${b.width}px`;
    const chosen = box.current!.querySelector<HTMLElement>('[aria-selected="true"]') ?? items(box.current!)[0];
    chosen?.focus({ preventScroll: true });
    // The chosen item lies over the button, its text over the button's text.
    const text = chosen?.querySelector("[data-select-text]")?.getBoundingClientRect();
    const mine = s.shown.current?.getBoundingClientRect();
    const me = w.getBoundingClientRect();
    const c = chosen?.getBoundingClientRect();
    const left = text && mine ? mine.left - (text.left - me.left) : b.left;
    const top = c ? b.top + b.height / 2 - (c.top - me.top + c.height / 2) : b.bottom;
    w.style.left = `${Math.max(10, Math.min(left, window.innerWidth - me.width - 10))}px`;
    w.style.top = `${Math.max(10, Math.min(top, window.innerHeight - me.height - 10))}px`;
    return () => s.trigger.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div ref={wrap} style={FIXED}>
      <div ref={box} id={`${s.id}l`} role="listbox" dir="ltr" data-state="open" tabIndex={-1} {...props} style={{ pointerEvents: "auto", outline: "none", maxHeight: "calc(100vh - 20px)", overflow: "auto" }} onKeyDown={(e: KeyboardEvent) => moveInList(e, box.current!, typed.current)}>
        {children}
      </div>
    </div>
  );
}
const SelectViewport = ({ children, ...props }: Any) => (useContext(SelectCtx).open ? <div role="presentation" {...props}>{children}</div> : <>{children}</>);
function SelectItem({ value, children, disabled, ...props }: Any) {
  const s = useContext(SelectCtx);
  const on = s.v === value;
  const choose = () => {
    s.set(value);
    s.setOpen(false);
  };
  return (
    <ItemCtx.Provider value={on}>
      <ItemValue.Provider value={value}>
        {s.open ? (
          <div
            role="option"
            aria-selected={on}
            data-state={checkedState(on)}
            data-disabled={disabled ? "" : undefined}
            tabIndex={-1}
            {...props}
            onClick={() => !disabled && choose()}
            onPointerMove={(e: PointerEvent) => !disabled && (e.currentTarget as HTMLElement).focus({ preventScroll: true })}
            onPointerLeave={(e: PointerEvent) => (e.currentTarget as HTMLElement).closest<HTMLElement>('[role="listbox"]')?.focus({ preventScroll: true })}
            onKeyDown={(e: KeyboardEvent) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              choose();
            }}
          >
            {children}
          </div>
        ) : (
          <>{children}</>
        )}
      </ItemValue.Provider>
    </ItemCtx.Provider>
  );
}
const ItemValue = createContext<string>("");
function SelectItemText({ children }: Any) {
  const s = useContext(SelectCtx);
  const value = useContext(ItemValue);
  const label = Array.isArray(children) ? children.join("") : children;
  useLayoutEffect(() => s.name(value, label), [value, label]);
  return <span data-select-text="">{children}</span>;
}
export const Select = { Root: SelectRoot, Trigger: SelectTrigger, Value: SelectValue, Icon: SelectIcon, Portal: SelectPortal, Content: SelectContent, Viewport: SelectViewport, Item: SelectItem, ItemText: SelectItemText, ItemIndicator };

// ---- tooltip ----------------------------------------------------------------------------------

const Delay = createContext<number>(0);
const TipCtx = createContext<Any>(null);
const TooltipProvider = ({ delayDuration = 700, children }: Any) => <Delay.Provider value={delayDuration}>{children}</Delay.Provider>;
/** One tooltip just closed: the next one opens at once. */
let lastTip = 0;
function TooltipRoot({ children }: Any) {
  const [open, setOpen] = useState(false);
  const delay = useContext(Delay);
  const trigger = useRef<HTMLElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();
  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const show = (now: boolean) => {
    clear();
    if (now || Date.now() - lastTip < 300) setOpen(true);
    else timer.current = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    clear();
    setOpen((o) => {
      if (o) lastTip = Date.now();
      return false;
    });
  };
  useEffect(() => clear, []);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && hide();
    document.addEventListener("keydown", key);
    window.addEventListener("scroll", hide, true);
    return () => {
      document.removeEventListener("keydown", key);
      window.removeEventListener("scroll", hide, true);
    };
  }, [open]);
  return <TipCtx.Provider value={{ open, show, hide, trigger, id }}>{children}</TipCtx.Provider>;
}
function TooltipTrigger({ asChild, ...props }: Any) {
  const t = useContext(TipCtx);
  const pressed = useRef(false);
  const Comp: Any = asChild ? Slot : "button";
  return (
    <Comp
      {...props}
      ref={(el: HTMLElement | null) => {
        t.trigger.current = el;
        setRef(props.ref, el);
      }}
      data-state={t.open ? "delayed-open" : "closed"}
      aria-describedby={t.open ? t.id : undefined}
      onPointerEnter={chain(props.onPointerEnter, (e: PointerEvent) => e.pointerType !== "touch" && t.show(false))}
      onPointerLeave={chain(props.onPointerLeave, t.hide)}
      onPointerDown={chain(props.onPointerDown, () => {
        pressed.current = true;
        setTimeout(() => (pressed.current = false), 300);
        t.hide();
      })}
      onFocus={chain(props.onFocus, () => !pressed.current && t.show(true))}
      onBlur={chain(props.onBlur, t.hide)}
    />
  );
}
function TooltipPortal({ children }: Any) {
  const { open } = useContext(TipCtx);
  return open ? createPortal(children, document.body) : null;
}
function TooltipContent({ side = "top", align = "center", sideOffset = 0, children, className, ...props }: Any) {
  const t = useContext(TipCtx);
  const wrap = useRef<HTMLDivElement | null>(null);
  const [at, setAt] = useState(side);
  useLayoutEffect(() => {
    const w = wrap.current!;
    const b = t.trigger.current!.getBoundingClientRect();
    // Ten more for the arrow.
    setAt(place(w, b, { side, align, sideOffset: sideOffset + 10 }).side);
    const arrow = w.querySelector<HTMLElement>("[data-arrow]");
    if (arrow) arrow.style.left = `${b.left + b.width / 2 - w.getBoundingClientRect().left - 5}px`;
  }, []);
  return (
    <div ref={wrap} style={{ ...FIXED, pointerEvents: "none" }}>
      <div id={t.id} role="tooltip" data-state="delayed-open" data-side={at} data-align={align} className={className} {...props}>
        {children}
      </div>
    </div>
  );
}
function TooltipArrow({ className, ...props }: Any) {
  return (
    <span data-arrow="" style={{ position: "absolute", bottom: "0", transform: "translateY(100%)", width: "10px", height: "10px" }}>
      <svg className={className} width="10" height="10" viewBox="0 0 30 10" preserveAspectRatio="none" style={{ display: "block" }} {...props}>
        <polygon points="0,0 30,0 15,10" />
      </svg>
    </span>
  );
}
export const Tooltip = { Provider: TooltipProvider, Root: TooltipRoot, Trigger: TooltipTrigger, Portal: TooltipPortal, Content: TooltipContent, Arrow: TooltipArrow };
