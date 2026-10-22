"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight, Folder, FolderPlus, HardDrive } from "lucide-react";
import type { DriveIndex } from "@/lib/vault/store";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function PromptDialog({
  title,
  label,
  initial,
  confirm,
  onDone,
}: {
  title: string;
  label: string;
  initial: string;
  confirm: string;
  onDone: (value: string | null) => void;
}) {
  const t = useTranslations("drive");
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // The name without its extension selected, the way file managers do.
    const timer = setTimeout(() => {
      el.focus();
      const dot = initial.lastIndexOf(".");
      el.setSelectionRange(0, dot > 0 ? dot : initial.length);
    }, 30);
    return () => clearTimeout(timer);
  }, [initial]);
  const slash = value.includes("/");
  const bad = !value.trim() || slash;
  return (
    <Dialog open onOpenChange={(o) => !o && onDone(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!bad) onDone(value.trim());
          }}
        >
          <Label htmlFor="drive-name">{label}</Label>
          <Input id="drive-name" ref={ref} value={value} onChange={(e) => setValue(e.target.value)} maxLength={255} spellCheck={false} aria-invalid={slash} />
          {slash ? <p className="text-2xs text-destructive">{t("dialog.badName")}</p> : null}
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onDone(null)}>
              {t("act.cancel")}
            </Button>
            <Button type="submit" disabled={bad}>
              {confirm}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmDialog({
  title,
  body,
  confirm,
  danger,
  onDone,
}: {
  title: string;
  body: string;
  confirm: string;
  danger?: boolean;
  onDone: (ok: boolean) => void;
}) {
  const t = useTranslations("drive");
  return (
    <Dialog open onOpenChange={(o) => !o && onDone(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{body}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onDone(false)}>
            {t("act.cancel")}
          </Button>
          <Button autoFocus variant={danger ? "destructive" : "default"} onClick={() => onDone(true)}>
            {confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Pick a folder of the Drive: null is the top, undefined is Cancel. */
export function FolderPicker({
  index,
  title,
  confirm,
  exclude,
  onNewFolder,
  onDone,
}: {
  index: DriveIndex;
  title: string;
  confirm: string;
  exclude: Set<string>;
  onNewFolder: (parent: string | null, name: string) => Promise<string | null>;
  onDone: (folder: string | null | undefined) => void;
}) {
  const t = useTranslations("drive");
  const [at, setAt] = useState<string | null>(null);
  const [naming, setNaming] = useState<string | null>(null);
  const path = index.pathTo(at);
  const folders = index
    .children(at)
    .filter((o) => o.kind === "dir")
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
  const here = at === null ? null : index.get(at);
  return (
    <Dialog open onOpenChange={(o) => !o && onDone(undefined)}>
      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-1">
            <button type="button" className="hover:text-foreground" onClick={() => setAt(null)}>
              Drive
            </button>
            {path.map((p) => (
              <span key={p.id} className="flex items-center gap-1">
                <ChevronRight className="flip-rtl size-3" />
                <button type="button" className="hover:text-foreground" onClick={() => setAt(p.id)}>
                  {p.name}
                </button>
              </span>
            ))}
          </DialogDescription>
        </DialogHeader>
        <div className="h-72 overflow-y-auto">
          {naming !== null ? (
            <form
              className="flex items-center gap-2 border-b px-4 py-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!naming.trim() || naming.includes("/")) return;
                const id = await onNewFolder(at, naming.trim());
                setNaming(null);
                if (id) setAt(id);
              }}
            >
              <FolderPlus className="size-4 text-muted-foreground" />
              <Input autoFocus value={naming} onChange={(e) => setNaming(e.target.value)} placeholder={t("dialog.folderName")} className="h-7" />
              <Button type="submit" size="sm" disabled={!naming.trim() || naming.includes("/")}>
                {t("act.create")}
              </Button>
            </form>
          ) : null}
          {folders.length === 0 && naming === null ? (
            <div className="flex h-full flex-col items-center justify-center gap-1 text-2xs text-muted-foreground">
              <HardDrive className="size-5" />
              {t("dialog.noFolders")}
            </div>
          ) : null}
          {folders.map((f) => {
            const off = exclude.has(f.id);
            return (
              <button
                key={f.id}
                type="button"
                disabled={off}
                onClick={() => setAt(f.id)}
                className={cn("flex h-10 w-full items-center gap-2.5 border-b px-4 text-start text-xs hover:bg-muted disabled:pointer-events-none disabled:opacity-40")}
              >
                <Folder className="size-4 text-blau" />
                <span className="flex-1 truncate">{f.name}</span>
                <ChevronRight className="flip-rtl size-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>
        <DialogFooter className="border-t px-4 py-3 sm:justify-between">
          <Button variant="ghost" onClick={() => setNaming("")} disabled={naming !== null}>
            <FolderPlus /> {t("act.newFolder")}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onDone(undefined)}>
              {t("act.cancel")}
            </Button>
            <Button disabled={at !== null && exclude.has(at)} onClick={() => onDone(at)}>
              {confirm}
              {here ? <span className="max-w-32 truncate opacity-70">· {here.name}</span> : null}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
