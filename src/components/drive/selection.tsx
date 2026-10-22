"use client";

// Selecting in every list of the Drive the way Google Drive does it: a click
// picks one, Cmd/Ctrl adds or removes, Shift takes the range, the box in the
// header takes all; with something picked, a bar of actions stays on top.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";

export function useSelection<T extends { id: string }>(rows: T[]) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const anchor = useRef<string | null>(null);
  const ids = rows.map((r) => r.id).join(",");
  // Forget what is no longer listed.
  useEffect(() => {
    setSel((s) => {
      const listed = new Set(ids.split(","));
      const keep = new Set([...s].filter((id) => listed.has(id)));
      return keep.size === s.size ? s : keep;
    });
  }, [ids]);
  const toggleId = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  /** A click on a row: [toggle] (the box, or a list already in selection mode) adds or removes instead of replacing. */
  const click = (o: T, e: { metaKey?: boolean; ctrlKey?: boolean; shiftKey?: boolean }, toggle = false) => {
    if (e.shiftKey && anchor.current) {
      const a = rows.findIndex((r) => r.id === anchor.current);
      const b = rows.findIndex((r) => r.id === o.id);
      if (a >= 0 && b >= 0) {
        const [lo, hi] = a < b ? [a, b] : [b, a];
        setSel((s) => new Set([...s, ...rows.slice(lo, hi + 1).map((r) => r.id)]));
        return;
      }
    }
    anchor.current = o.id;
    if (toggle || e.metaKey || e.ctrlKey) toggleId(o.id);
    else setSel(new Set([o.id]));
  };
  const selected = rows.filter((r) => sel.has(r.id));
  return {
    sel,
    setSel,
    selected,
    click,
    has: (id: string) => sel.has(id),
    clear: () => {
      anchor.current = null;
      setSel(new Set());
    },
    all: () => setSel(new Set(rows.map((r) => r.id))),
    /** The header box: none, some (indeterminate) or all. */
    headState: (sel.size === 0 ? false : selected.length === rows.length ? true : "indeterminate") as boolean | "indeterminate",
  };
}

/** The box of one row; Shift on it takes the range. */
export function RowCheck({ checked, label, onToggle }: { checked: boolean; label: string; onToggle: (e: { shiftKey: boolean }) => void }) {
  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        onToggle({ shiftKey: e.shiftKey });
      }}
      className="inline-flex"
    >
      <Checkbox checked={checked} aria-label={label} tabIndex={0} className="pointer-events-none" />
    </span>
  );
}

/** What can be done with the picked items; stays on top while the list scrolls. */
export function SelectionBar({ count, onClear, children }: { count: number; onClear: () => void; children: ReactNode }) {
  const t = useTranslations("drive");
  return (
    <div className="sticky top-14 z-20 flex min-h-12 flex-wrap items-center gap-2 border border-blau/30 bg-blau-soft px-2 py-1.5 shadow-sm animate-in fade-in-0 slide-in-from-top-1">
      <Button variant="ghost" size="icon-sm" aria-label={t("act.clearSelection")} onClick={onClear}>
        <X />
      </Button>
      <span className="text-xs font-medium tabular-nums">{t("files.selected", { n: count })}</span>
      <div className="ms-auto flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}
