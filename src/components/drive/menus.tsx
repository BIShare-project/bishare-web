"use client";

import { Fragment, type ReactNode } from "react";
import type { ActionItem } from "./actions";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuShortcut, ContextMenuTrigger } from "./ui/context-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from "./ui/dropdown-menu";

/** The "⋯" menu of a row or a tile. */
export function ActionDropdown({ items, children, align = "end" }: { items: ActionItem[]; children: ReactNode; align?: "start" | "end" }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-52">
        {items.map((it, i) => (
          <Fragment key={it.key}>
            {it.separatorBefore && i > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem variant={it.danger ? "destructive" : "default"} onSelect={it.run}>
              <it.icon />
              {it.label}
              {it.shortcut ? <DropdownMenuShortcut>{it.shortcut}</DropdownMenuShortcut> : null}
            </DropdownMenuItem>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The same actions on a right click. */
export function ActionContextMenu({ items, children, onOpen }: { items: ActionItem[]; children: ReactNode; onOpen?: () => void }) {
  return (
    <ContextMenu onOpenChange={(o) => o && onOpen?.()}>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        {items.map((it, i) => (
          <Fragment key={it.key}>
            {it.separatorBefore && i > 0 ? <ContextMenuSeparator /> : null}
            <ContextMenuItem variant={it.danger ? "destructive" : "default"} onSelect={it.run}>
              <it.icon />
              {it.label}
              {it.shortcut ? <ContextMenuShortcut>{it.shortcut}</ContextMenuShortcut> : null}
            </ContextMenuItem>
          </Fragment>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}
