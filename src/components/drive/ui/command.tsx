import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ComponentProps } from "@/jsx";
import { Search } from "@/ui/icons"
import { cn } from "@/lib/utils"
import type { Parts } from "./primitives"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/drive/ui/overlays"

// The keyboard list under the palette: typing stays in the field, the arrows move through the items below it.

/* eslint-disable @typescript-eslint/no-explicit-any -- these parts take any element's props */
type Any = any;
const Ctx = createContext<Any>(null);

function CommandRoot({ children, shouldFilter: _f, ...props }: Any) {
  const box = useRef<HTMLDivElement | null>(null);
  const [at, setAt] = useState<string | null>(null);
  const all = () => [...(box.current?.querySelectorAll<HTMLElement>("[data-command-item]") ?? [])];
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
      <div ref={box} data-command-root="" tabIndex={-1} {...props} onKeyDown={key}>
        {children}
      </div>
    </Ctx.Provider>
  );
}

function Input({ value, onValueChange, ...props }: Any) {
  return (
    <input data-command-input="" type="text" role="combobox" autoComplete="off" autoCorrect="off" spellCheck={false} aria-autocomplete="list" aria-expanded={true} {...props} value={value} onChange={(e: Any) => onValueChange(e.target.value)} />
  );
}
const List = (props: Any) => <div data-command-list="" role="listbox" {...props} />;

/** Shown only when the list is empty. */
function Empty(props: Any) {
  const { box } = useContext(Ctx);
  const [none, setNone] = useState(false);
  useEffect(() => {
    const now = !box.current?.querySelector("[data-command-item]");
    if (now !== none) setNone(now);
  });
  return none ? <div data-command-empty="" role="presentation" {...props} /> : null;
}
const Group = ({ heading, children, ...props }: Any) => (
  <div data-command-group="" role="presentation" {...props}>
    {heading ? (
      <div data-command-group-heading="" aria-hidden>
        {heading}
      </div>
    ) : null}
    <div data-command-group-items="" role="group">
      {children}
    </div>
  </div>
);
function Item({ value, onSelect, ...props }: Any) {
  const { at, setAt } = useContext(Ctx);
  const on = at === value;
  return <div data-command-item="" role="option" data-value={value} data-selected={on} aria-selected={on} {...props} onClick={() => onSelect?.(value)} onPointerMove={() => setAt(value)} />;
}

const CommandPrimitive = /* @__PURE__ */ Object.assign(CommandRoot, { Input, List, Empty, Group, Item });

function Command({ className, ...props }: Parts) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn("flex h-full w-full flex-col overflow-hidden bg-popover text-popover-foreground", className)}
      {...props}
    />
  )
}

function CommandDialog({
  title = "Command palette",
  description = "Search",
  shouldFilter,
  children,
  ...props
}: ComponentProps<typeof Dialog> & { title?: string; description?: string; shouldFilter?: boolean }) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent className="overflow-hidden p-0 sm:max-w-xl" showCloseButton={false}>
        <Command shouldFilter={shouldFilter} className="[&_[data-command-group-heading]]:px-3 [&_[data-command-group-heading]]:py-1.5 [&_[data-command-group-heading]]:text-2xs [&_[data-command-group-heading]]:font-medium [&_[data-command-group-heading]]:text-muted-foreground">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({ className, ...props }: Parts) {
  return (
    <div data-slot="command-input-wrapper" className="flex h-11 items-center gap-2 border-b px-3">
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn("flex h-10 w-full bg-transparent py-3 text-xs outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50", className)}
        {...props}
      />
    </div>
  )
}

function CommandList({ className, ...props }: Parts) {
  return <CommandPrimitive.List data-slot="command-list" className={cn("max-h-[360px] scroll-py-1 overflow-x-hidden overflow-y-auto py-1", className)} {...props} />
}

function CommandEmpty(props: Parts) {
  return <CommandPrimitive.Empty data-slot="command-empty" className="py-6 text-center text-xs text-muted-foreground" {...props} />
}

function CommandGroup({ className, ...props }: Parts) {
  return <CommandPrimitive.Group data-slot="command-group" className={cn("overflow-hidden text-foreground", className)} {...props} />
}

function CommandItem({ className, ...props }: Parts) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "relative flex cursor-default items-center gap-2 px-3 py-2 text-xs outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-muted data-[selected=true]:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function CommandShortcut({ className, ...props }: ComponentProps<"span">) {
  return <span data-slot="command-shortcut" className={cn("ml-auto text-2xs tracking-wide text-muted-foreground", className)} {...props} />
}

export { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut }
