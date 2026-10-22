"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Clock, Database, Folder, FolderPlus, FolderUp, Image as ImageIcon, LayoutGrid, Lock, Monitor, Moon, ShieldCheck, Sun, Trash2, Upload } from "lucide-react";
import { useActions } from "./actions";
import { ObjectThumb } from "./bits";
import { useDrive, useIndex } from "./drive-app";
import { bytes } from "./format";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "./ui/command";

/** ⌘K: every name in the Drive (opened here, searched here) and every page and action. */
export function Palette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useTranslations("drive");
  const router = useRouter();
  const { base, theme, setTheme, lock } = useDrive();
  const index = useIndex();
  const actions = useActions();
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const found = query ? index.search(query, 40) : index.live().filter((o) => o.kind === "file").sort((a, b) => b.mtimeMs - a.mtimeMs).slice(0, 6);
  const match = (s: string) => !query || s.toLowerCase().includes(query);
  const run = (f: () => void) => {
    onOpenChange(false);
    setQ("");
    f();
  };
  const pages = [
    { href: "", label: t("nav.home"), icon: LayoutGrid },
    { href: "/files", label: t("nav.files"), icon: Folder },
    { href: "/recent", label: t("nav.recent"), icon: Clock },
    { href: "/photos", label: t("nav.photos"), icon: ImageIcon },
    { href: "/devices", label: t("nav.devices"), icon: Monitor },
    { href: "/trash", label: t("nav.trash"), icon: Trash2 },
    { href: "/storage", label: t("nav.storage"), icon: Database },
    { href: "/security", label: t("nav.security"), icon: ShieldCheck },
  ].filter((p) => match(p.label));
  const commands = [
    { key: "upload", label: t("act.upload"), icon: Upload, run: () => actions.upload(null) },
    { key: "uploadFolder", label: t("act.uploadFolder"), icon: FolderUp, run: () => actions.uploadFolder(null) },
    { key: "newFolder", label: t("act.newFolder"), icon: FolderPlus, run: () => void actions.newFolder(null) },
    { key: "theme", label: theme === "dark" ? t("palette.light") : t("palette.dark"), icon: theme === "dark" ? Sun : Moon, run: () => setTheme(theme === "dark" ? "light" : "dark") },
    { key: "lock", label: t("lock"), icon: Lock, run: () => void lock() },
  ].filter((c) => match(c.label));

  return (
    <CommandDialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setQ("");
      }}
      title={t("palette.title")}
      description={t("palette.placeholder")}
      shouldFilter={false}
    >
      <CommandInput placeholder={t("palette.placeholder")} value={q} onValueChange={setQ} />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>{t("palette.noResults")}</CommandEmpty>
        {found.length ? (
          <CommandGroup heading={query ? t("palette.files") : t("palette.recent")}>
            {found.map((o) => (
              <CommandItem key={o.id} value={`file-${o.id}`} onSelect={() => run(() => actions.open(o, found))}>
                <ObjectThumb o={o} />
                <span className="min-w-0 flex-1 truncate">{o.name}</span>
                <span className="truncate text-3xs text-muted-foreground">
                  {["Drive", ...index.pathTo(o.parent).map((p) => p.name)].join(" / ")}
                  {o.kind === "file" ? ` · ${bytes(o.size)}` : ""}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
        {commands.length ? (
          <CommandGroup heading={t("palette.actions")}>
            {commands.map((c) => (
              <CommandItem key={c.key} value={`cmd-${c.key}`} onSelect={() => run(c.run)}>
                <c.icon />
                {c.label}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
        {pages.length ? (
          <CommandGroup heading={t("palette.pages")}>
            {pages.map((p) => (
              <CommandItem key={p.href} value={`page-${p.href}`} onSelect={() => run(() => router.push(`${base}${p.href}` || "/"))}>
                <p.icon />
                {p.label}
                <CommandShortcut>↵</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
