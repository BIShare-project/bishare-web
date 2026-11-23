"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";

// The keyboard list under the palette: typing stays in the field, the arrows move through the items below it.

/* eslint-disable @typescript-eslint/no-explicit-any -- these parts take any element's props */
type Any = any;
const Ctx = createContext<Any>(null);

function CommandRoot({ children, shouldFilter: _f, ...props }: Any) {
  const box = useRef<HTMLDivElement | null>(null);
  const [at, setAt] = useState<string | null>(null);
  const all = () => [...(box.current?.querySelectorAll<HTMLElement>("[cmdk-item]") ?? [])];
  const ids = () => all().map((x) => x.dataset.value!);
  // The first item is chosen, and again when the chosen one is gone from the list.
  useLayoutEffect(() => {
    const now = ids();
    if (now.length && (at === null || !now.includes(at))) setAt(now[0]!);
  });
  const go = (i: number) => {
    const list = all();
    const to = list[Math.max(0, Math.min(i, list.length - 1))];
    if (!to) return;
    setAt(to.dataset.value!);
    to.scrollIntoView({ block: "nearest" });
  };
  const key = (e: KeyboardEvent) => {
    const i = at === null ? -1 : ids().indexOf(at);
    const ctrl = e.ctrlKey;
    if (e.key === "ArrowDown" || (ctrl && (e.key === "n" || e.key === "j"))) go(e.metaKey ? Infinity : i + 1);
    else if (e.key === "ArrowUp" || (ctrl && (e.key === "p" || e.key === "k"))) go(e.metaKey ? 0 : i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(Infinity);
    else if (e.key === "Enter" && !e.isComposing) all()[i]?.click();
    else return;
    e.preventDefault();
  };
  return (
    <Ctx.Provider value={{ at, setAt, box }}>
      <div ref={box} cmdk-root="" tabIndex={-1} {...props} onKeyDown={key}>
        {children}
      </div>
    </Ctx.Provider>
  );
}

function Input({ value, onValueChange, ...props }: Any) {
  return (
    <input cmdk-input="" type="text" role="combobox" autoComplete="off" autoCorrect="off" spellCheck={false} aria-autocomplete="list" aria-expanded={true} {...props} value={value} onChange={(e: Any) => onValueChange(e.target.value)} />
  );
}
const List = (props: Any) => <div cmdk-list="" role="listbox" {...props} />;

/** Shown only when the list is empty. */
function Empty(props: Any) {
  const { box } = useContext(Ctx);
  const [none, setNone] = useState(false);
  useEffect(() => {
    const now = !box.current?.querySelector("[cmdk-item]");
    if (now !== none) setNone(now);
  });
  return none ? <div cmdk-empty="" role="presentation" {...props} /> : null;
}
const Group = ({ heading, children, ...props }: Any) => (
  <div cmdk-group="" role="presentation" {...props}>
    {heading ? (
      <div cmdk-group-heading="" aria-hidden>
        {heading}
      </div>
    ) : null}
    <div cmdk-group-items="" role="group">
      {children}
    </div>
  </div>
);
function Item({ value, onSelect, ...props }: Any) {
  const { at, setAt } = useContext(Ctx);
  const on = at === value;
  return <div cmdk-item="" role="option" data-value={value} data-selected={on} aria-selected={on} {...props} onClick={() => onSelect?.(value)} onPointerMove={() => setAt(value)} />;
}

export const Command = Object.assign(CommandRoot, { Input, List, Empty, Group, Item });
