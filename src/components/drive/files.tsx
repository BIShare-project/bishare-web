"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent, type MouseEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, ChevronRight, Copy, Download, FolderInput, FolderPlus, FolderUp, LayoutGrid, List, MoreHorizontal, PanelRight, Search, Trash2, Upload, X } from "lucide-react";
import type { DriveObject } from "@/lib/vault/store";
import { cn } from "@/lib/utils";
import { useActions } from "./actions";
import { EmptyState, ObjectThumb, PageHead, Panel, useStepped } from "./bits";
import { useDrive, useIndex } from "./drive-app";
import { bytes, isMedia, kindOf, when } from "./format";
import { ActionContextMenu, ActionDropdown } from "./menus";
import { RowCheck, SelectionBar, useSelection } from "./selection";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type KindFilter = "all" | "dir" | "media" | "documents" | "audio" | "other";
type SortKey = "name" | "modified" | "size";
const DRAG_TYPE = "application/x-bishare-objects";
const VIEW_KEY = "bishare-drive-view";

export function matchesKind(o: DriveObject, k: KindFilter): boolean {
  if (k === "all") return true;
  if (k === "dir") return o.kind === "dir";
  if (o.kind === "dir") return false;
  const kind = kindOf(o.mime);
  if (k === "media") return isMedia(o.mime);
  if (k === "audio") return kind === "audio";
  if (k === "documents") return ["pdf", "doc", "sheet", "slides", "text"].includes(kind);
  return !isMedia(o.mime) && !["pdf", "doc", "sheet", "slides", "text", "audio"].includes(kind);
}

function SortHead({ label, k, sort, dir, onSort, className }: { label: string; k: SortKey; sort: SortKey; dir: 1 | -1; onSort: (k: SortKey) => void; className?: string }) {
  const on = sort === k;
  return (
    <TableHead className={className}>
      <button type="button" onClick={() => onSort(k)} className={cn("inline-flex items-center gap-1 hover:text-foreground", on && "text-foreground")}>
        {label}
        {on ? dir === 1 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : null}
      </button>
    </TableHead>
  );
}

/** Files: a folder of the Drive (?f=), or search results (?q=). */
export function FilesPage() {
  const t = useTranslations("drive");
  const locale = useLocale();
  const { base } = useDrive();
  const index = useIndex();
  const actions = useActions();
  const params = useSearchParams();
  const folder = params.get("f") || null;
  const q = params.get("q") ?? "";
  const [kind, setKind] = useState<KindFilter>("all");
  const [sort, setSort] = useState<SortKey>("name");
  const [dir, setDir] = useState<1 | -1>(1);
  const [view, setView] = useState<"list" | "grid">("list");
  const [details, setDetails] = useState(true);
  const [dropOn, setDropOn] = useState<string | null>(null);
  const words = { today: t("today"), yesterday: t("yesterday") };

  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      if (v === "grid" || v === "list") setView(v);
    } catch {
      // List, then.
    }
  }, []);
  const changeView = (v: "list" | "grid") => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      // Not remembered.
    }
  };

  const here = folder ? index.get(folder) : undefined;
  const path = index.pathTo(folder);
  const rows = (q ? index.search(q, 500) : index.children(folder))
    .filter((o) => matchesKind(o, kind))
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "dir" ? -1 : 1;
      if (sort === "modified") return (a.mtimeMs - b.mtimeMs) * dir;
      if (sort === "size") return ((a.size ?? 0) - (b.size ?? 0)) * dir;
      return a.name.localeCompare(b.name, locale, { numeric: true, sensitivity: "base" }) * dir;
    });
  const { sel, click, clear, all, setSel, selected, headState } = useSelection(rows);
  // A folder of thousands (a phone's photo backup) is drawn in steps.
  const { limit, mark } = useStepped(rows.length);
  const focus = selected.length === 1 ? selected[0]! : null;
  const total = rows.reduce((a, o) => a + (o.size ?? 0), 0);
  const quick = folder || q ? [] : index.children(null).filter((o) => o.kind === "dir").sort((a, b) => index.countUnder(b.id) - index.countUnder(a.id)).slice(0, 4);
  const onSort = (k: SortKey) => {
    if (k === sort) setDir((d) => (d === 1 ? -1 : 1));
    else {
      setSort(k);
      setDir(k === "name" ? 1 : -1);
    }
  };

  // Keyboard: Delete trashes, F2 renames, Enter opens, ⌘A selects all, Esc clears.
  const keys = useRef({ selected, rows, actions, all, clear });
  useEffect(() => {
    keys.current = { selected, rows, actions, all, clear };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      // Keys belong to whatever has focus (a button, a link, a list), and to an
      // open sheet or dialog even when focus stayed behind it.
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el?.isContentEditable) return;
      if (el?.closest("[role=dialog],[role=menu],[role=listbox],[role=combobox],a[href]")) return;
      if (el?.closest("button") && !el.closest("[data-slot=checkbox]")) return;
      if (document.querySelector("[role=dialog][data-state=open],[role=alertdialog][data-state=open]")) return;
      const k = keys.current;
      const s = k.selected;
      if ((e.key === "Delete" || e.key === "Backspace") && s.length) {
        e.preventDefault();
        void k.actions.trash(s.map((o) => o.id));
      } else if (e.key === "F2" && s.length === 1) {
        e.preventDefault();
        void k.actions.rename(s[0]!);
      } else if (e.key === "Enter" && s.length === 1) {
        e.preventDefault();
        k.actions.open(s[0]!, k.rows);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        k.all();
      } else if (e.key === "Escape") k.clear();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Drag rows onto a folder (a row, a quick-access tile or the path) to move them.
  const dragStart = (o: DriveObject, e: DragEvent) => {
    const ids = sel.has(o.id) ? [...sel] : [o.id];
    if (!sel.has(o.id)) setSel(new Set([o.id]));
    e.dataTransfer.setData(DRAG_TYPE, JSON.stringify(ids));
    e.dataTransfer.effectAllowed = "move";
  };
  const dropProps = (target: string | null, key: string) => ({
    onDragOver: (e: DragEvent) => {
      if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
      e.preventDefault();
      e.stopPropagation();
      setDropOn(key);
    },
    onDragLeave: () => setDropOn((d) => (d === key ? null : d)),
    onDrop: (e: DragEvent) => {
      const raw = e.dataTransfer.getData(DRAG_TYPE);
      setDropOn(null);
      if (!raw) return;
      e.preventDefault();
      e.stopPropagation();
      const ids = (JSON.parse(raw) as string[]).filter((id) => id !== target);
      if (ids.length) void actions.moveTo(ids, target);
    },
  });

  const rowClick = (o: DriveObject, e: MouseEvent) => click(o, e);
  const menuFor = (o: DriveObject) => actions.itemsFor(sel.has(o.id) ? selected : [o], rows);

  return (
    <div className="flex flex-col gap-4">
      <PageHead
        crumbs={
          <nav className="mb-1 flex flex-wrap items-center gap-1 text-2xs text-muted-foreground" aria-label="Drive">
            <Link href={`${base}/files`} className={cn("px-1 hover:text-foreground", dropOn === "crumb-root" && "drop-target")} {...dropProps(null, "crumb-root")}>
              Drive
            </Link>
            {path.map((p) => (
              <span key={p.id} className="flex items-center gap-1">
                <ChevronRight className="flip-rtl size-3" />
                <Link href={`${base}/files?f=${p.id}`} className={cn("px-1 hover:text-foreground", dropOn === `crumb-${p.id}` && "drop-target")} {...dropProps(p.id, `crumb-${p.id}`)}>
                  {p.name}
                </Link>
              </span>
            ))}
          </nav>
        }
        title={q ? t("files.results", { q }) : (here?.name ?? t("files.title"))}
        sub={t("files.summary", { n: rows.length, size: bytes(total) })}
        actions={
          q ? null : (
            <>
              <Button variant="outline" onClick={() => void actions.newFolder(folder)}>
                <FolderPlus /> {t("act.newFolder")}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <Upload /> {t("act.upload")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onSelect={() => actions.upload(folder)}>
                    <Upload /> {t("act.uploadFiles")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => actions.uploadFolder(folder)}>
                    <FolderUp /> {t("act.uploadFolder")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )
        }
      />

      {quick.length ? (
        <div className="grid grid-cols-2 gap-px border bg-border md:grid-cols-4">
          {quick.map((d) => (
            <Link
              key={d.id}
              href={`${base}/files?f=${d.id}`}
              className={cn("flex min-w-0 items-center gap-3 bg-card px-4 py-3 transition-colors hover:bg-muted/60", dropOn === `qa-${d.id}` && "drop-target")}
              {...dropProps(d.id, `qa-${d.id}`)}
            >
              <ObjectThumb o={d} />
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium">{d.name}</span>
                <span className="block text-3xs text-muted-foreground">{t("items", { n: index.countUnder(d.id) })}</span>
              </span>
            </Link>
          ))}
          {Array.from({ length: (4 - (quick.length % 4)) % 4 }, (_, i) => (
            <span key={`pad-${i}`} className="hidden bg-card md:block" />
          ))}
        </div>
      ) : null}

      {selected.length ? (
        <SelectionBar count={selected.length} onClear={clear}>
          <Button variant="outline" size="sm" className="bg-background" onClick={() => void actions.download(selected)}>
            <Download /> <span className="hidden sm:inline">{selected.length > 1 || focus?.kind === "dir" ? t("act.downloadZip") : t("act.download")}</span>
          </Button>
          <Button variant="outline" size="sm" className="bg-background" onClick={() => void actions.move(selected.map((o) => o.id))}>
            <FolderInput /> <span className="hidden sm:inline">{t("act.move")}</span>
          </Button>
          <Button variant="outline" size="sm" className="bg-background" onClick={() => void actions.copy(selected.map((o) => o.id))}>
            <Copy /> <span className="hidden md:inline">{t("act.copy")}</span>
          </Button>
          <Button variant="destructive" size="sm" onClick={() => void actions.trash(selected.map((o) => o.id))}>
            <Trash2 /> <span className="hidden sm:inline">{t("act.trash")}</span>
          </Button>
          <ActionDropdown items={actions.itemsFor(selected, rows)}>
            <Button variant="ghost" size="icon-sm" aria-label={t("act.more")}>
              <MoreHorizontal />
            </Button>
          </ActionDropdown>
        </SelectionBar>
      ) : null}

      <div className={cn("grid items-start gap-4", details && focus && "xl:grid-cols-[minmax(0,1fr)_320px]")}>
        <Panel
          title={t("files.summary", { n: rows.length, size: bytes(total) })}
          help={t("files.selectHelp")}
          actions={
            <div className="flex flex-wrap items-center gap-1.5">
                  <Select value={kind} onValueChange={(v) => setKind(v as KindFilter)}>
                    <SelectTrigger size="sm" className="w-36" aria-label={t("files.kind")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["all", "dir", "media", "documents", "audio", "other"] as const).map((k) => (
                        <SelectItem key={k} value={k}>
                          {t(`files.kinds.${k}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex border">
                    {(
                      [
                        ["list", List, t("files.viewList")],
                        ["grid", LayoutGrid, t("files.viewGrid")],
                      ] as const
                    ).map(([v, Icon, label]) => (
                      <Tooltip key={v}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label={label}
                            aria-pressed={view === v}
                            onClick={() => changeView(v)}
                            className={cn("grid size-7 place-items-center text-muted-foreground transition-colors hover:text-foreground", view === v && "bg-muted text-foreground")}
                          >
                            <Icon className="size-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>{label}</TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-pressed={details} aria-label={t("files.details")} className={cn("hidden xl:inline-flex", details && "bg-muted")} onClick={() => setDetails((v) => !v)}>
                        <PanelRight />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("files.details")}</TooltipContent>
                  </Tooltip>
            </div>
          }
        >
          {rows.length === 0 ? (
            q ? (
              <EmptyState icon={Search} title={t("empty.search")} description={t("empty.searchBody")} />
            ) : (
              <EmptyState
                icon={Upload}
                title={t("empty.folder")}
                description={t("empty.folderBodyWeb")}
                action={
                  <Button className="mt-2" onClick={() => actions.upload(folder)}>
                    <Upload /> {t("act.upload")}
                  </Button>
                }
              />
            )
          ) : view === "list" ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-9 pe-0">
                    <Checkbox aria-label={t("act.selectAll")} checked={headState} onCheckedChange={(c) => (c ? all() : clear())} />
                  </TableHead>
                  <SortHead label={t("col.name")} k="name" sort={sort} dir={dir} onSort={onSort} />
                  <SortHead label={t("col.size")} k="size" sort={sort} dir={dir} onSort={onSort} className="text-end" />
                  <SortHead label={t("col.modified")} k="modified" sort={sort} dir={dir} onSort={onSort} className="hidden sm:table-cell" />
                  <TableHead className="hidden lg:table-cell">{q ? t("col.where") : t("col.kind")}</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, limit).map((o) => {
                  const on = sel.has(o.id);
                  return (
                    <ActionContextMenu key={o.id} items={menuFor(o)} onOpen={() => !on && setSel(new Set([o.id]))}>
                      <TableRow
                        data-state={on ? "selected" : undefined}
                        draggable
                        onDragStart={(e) => dragStart(o, e)}
                        onClick={(e) => rowClick(o, e)}
                        onDoubleClick={() => actions.open(o, rows)}
                        className={cn("group cursor-default select-none data-[state=selected]:bg-blau-soft", o.kind === "dir" && dropOn === o.id && "drop-target")}
                        {...(o.kind === "dir" ? dropProps(o.id, o.id) : {})}
                      >
                        <TableCell className="pe-0" onClick={(e) => e.stopPropagation()}>
                          <RowCheck checked={on} label={o.name} onToggle={(e) => click(o, e, true)} />
                        </TableCell>
                        <TableCell>
                          <div className="flex min-w-0 items-center gap-2.5">
                            <ObjectThumb o={o} />
                            <button
                              type="button"
                              className="max-w-[440px] truncate text-start font-medium hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                actions.open(o, rows);
                              }}
                            >
                              {o.name}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="text-end text-muted-foreground tabular-nums">{o.kind === "dir" ? t("items", { n: index.countUnder(o.id) }) : bytes(o.size)}</TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">{when(o.mtimeMs, locale, words)}</TableCell>
                        <TableCell className="hidden max-w-[220px] truncate text-muted-foreground lg:table-cell">
                          {q ? ["Drive", ...index.pathTo(o.parent).map((p) => p.name)].join(" / ") : o.kind === "dir" ? t("kinds.dir") : t(`kinds.${kindOf(o.mime)}`)}
                        </TableCell>
                        <TableCell className="p-1" onClick={(e) => e.stopPropagation()}>
                          <ActionDropdown items={menuFor(o)}>
                            <Button variant="ghost" size="icon-sm" aria-label={t("act.more")} className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100">
                              <MoreHorizontal />
                            </Button>
                          </ActionDropdown>
                        </TableCell>
                      </TableRow>
                    </ActionContextMenu>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-6">
              {rows.slice(0, limit).map((o) => {
                const on = sel.has(o.id);
                return (
                  <ActionContextMenu key={o.id} items={menuFor(o)} onOpen={() => !on && setSel(new Set([o.id]))}>
                    <div
                      draggable
                      onDragStart={(e) => dragStart(o, e)}
                      onClick={(e) => rowClick(o, e)}
                      onDoubleClick={() => actions.open(o, rows)}
                      className={cn(
                        "group relative flex cursor-default flex-col border bg-card transition-colors select-none hover:border-foreground/30",
                        on && "border-blau ring-1 ring-blau",
                        o.kind === "dir" && dropOn === o.id && "drop-target"
                      )}
                      {...(o.kind === "dir" ? dropProps(o.id, o.id) : {})}
                    >
                      <div className="aspect-[4/3] overflow-hidden border-b bg-muted/40">
                        <ObjectThumb o={o} large />
                      </div>
                      <div className="flex min-w-0 items-center gap-1 px-2.5 py-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-2xs font-medium">{o.name}</div>
                          <div className="truncate text-3xs text-muted-foreground">
                            {o.kind === "dir" ? t("items", { n: index.countUnder(o.id) }) : `${bytes(o.size)} · ${when(o.mtimeMs, locale, words)}`}
                          </div>
                        </div>
                        <span onClick={(e) => e.stopPropagation()}>
                          <ActionDropdown items={menuFor(o)}>
                            <Button variant="ghost" size="icon-xs" aria-label={t("act.more")}>
                              <MoreHorizontal />
                            </Button>
                          </ActionDropdown>
                        </span>
                      </div>
                      <span className={cn("absolute start-2 top-2 bg-background shadow-sm transition-opacity", on || sel.size ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                        <RowCheck checked={on} label={o.name} onToggle={(e) => click(o, e, true)} />
                      </span>
                    </div>
                  </ActionContextMenu>
                );
              })}
            </div>
          )}
          {mark}
        </Panel>
        {details && focus ? <Details o={focus} onClose={() => setDetails(false)} /> : null}
      </div>
      <p className="text-3xs text-muted-foreground">{t("files.privacy")}</p>
    </div>
  );
}

function Details({ o, onClose }: { o: DriveObject; onClose: () => void }) {
  const t = useTranslations("drive");
  const locale = useLocale();
  const index = useIndex();
  const actions = useActions();
  const full = (ms: number) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(ms));
  const rows: [string, string][] = [
    [t("col.where"), ["Drive", ...index.pathTo(o.parent).map((p) => p.name)].join(" / ")],
    [t("col.modified"), full(o.mtimeMs)],
    [t("files.added"), full(o.createdAt)],
  ];
  if (o.kind === "file") {
    rows.push([t("col.kind"), `${t(`kinds.${kindOf(o.mime)}`)} · ${o.mime}`], [t("files.encryption"), t("files.encryptionValue")], [t("files.integrity"), t("files.integrityValue")]);
    if (o.compression) rows.push([t("files.stored"), t("files.compressed", { size: bytes(o.blobSize) })]);
  } else rows.push([t("files.contains"), t("items", { n: index.countUnder(o.id) })]);
  return (
    <aside className="hidden flex-col border bg-card xl:flex" aria-label={t("files.details")}>
      <div className="relative aspect-[4/3] border-b bg-muted/40">
        <ObjectThumb o={o} large />
        <Button variant="secondary" size="icon-xs" className="absolute end-2 top-2" aria-label={t("act.close")} onClick={onClose}>
          <X />
        </Button>
      </div>
      <div className="border-b px-4 py-3">
        <div className="text-xs font-semibold break-words">{o.name}</div>
        <div className="text-3xs text-muted-foreground">{o.kind === "dir" ? t("kinds.dir") : bytes(o.size)}</div>
        <div className="mt-3 flex gap-1.5">
          <Button size="sm" className="flex-1" onClick={() => actions.open(o)}>
            {o.kind === "dir" ? t("act.openFolder") : t("act.preview")}
          </Button>
          <Button size="icon-sm" variant="outline" aria-label={t("act.download")} onClick={() => void actions.download([o])}>
            <Download />
          </Button>
          <ActionDropdown items={actions.itemsFor([o])}>
            <Button size="icon-sm" variant="outline" aria-label={t("act.more")}>
              <MoreHorizontal />
            </Button>
          </ActionDropdown>
        </div>
      </div>
      <dl className="m-0 grid grid-cols-[100px_1fr] text-2xs">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="border-b px-4 py-2 text-muted-foreground">{k}</dt>
            <dd className="m-0 truncate border-b py-2 pe-4" title={v}>
              {v}
            </dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

/** Recent: files added or changed anywhere, newest first. */
export function RecentPage() {
  const t = useTranslations("drive");
  const locale = useLocale();
  const index = useIndex();
  const actions = useActions();
  const [filter, setFilter] = useState<KindFilter>("all");
  const words = { today: t("today"), yesterday: t("yesterday") };
  const version = index.snapshot();
  const rows = useMemo(
    () =>
      index
        .live()
        .filter((o) => o.kind === "file" && matchesKind(o, filter))
        .sort((a, b) => b.mtimeMs - a.mtimeMs)
        .slice(0, 200),
    // The index object stays the same while its contents change; its snapshot is its version.
    [index, version, filter]
  );
  const { click, clear, all, setSel, selected, headState, has } = useSelection(rows);
  const menuFor = (o: DriveObject) => actions.itemsFor(has(o.id) ? selected : [o], rows);
  return (
    <div className="flex flex-col gap-4">
      <PageHead
        title={t("nav.recent")}
        sub={t("recent.sub")}
        actions={
          <div className="flex border">
            {(["all", "documents", "media", "audio"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setFilter(k)}
                className={cn("h-8 border-e px-3 text-2xs text-muted-foreground transition-colors last:border-e-0 hover:text-foreground", filter === k && "bg-foreground text-background hover:text-background")}
              >
                {t(`files.kinds.${k}`)}
              </button>
            ))}
          </div>
        }
      />
      {selected.length ? (
        <SelectionBar count={selected.length} onClear={clear}>
          <Button variant="outline" size="sm" className="bg-background" onClick={() => void actions.download(selected)}>
            <Download /> <span className="hidden sm:inline">{selected.length > 1 ? t("act.downloadZip") : t("act.download")}</span>
          </Button>
          <Button variant="outline" size="sm" className="bg-background" onClick={() => void actions.move(selected.map((o) => o.id))}>
            <FolderInput /> <span className="hidden sm:inline">{t("act.move")}</span>
          </Button>
          <Button variant="destructive" size="sm" onClick={() => void actions.trash(selected.map((o) => o.id))}>
            <Trash2 /> <span className="hidden sm:inline">{t("act.trash")}</span>
          </Button>
          <ActionDropdown items={actions.itemsFor(selected, rows)}>
            <Button variant="ghost" size="icon-sm" aria-label={t("act.more")}>
              <MoreHorizontal />
            </Button>
          </ActionDropdown>
        </SelectionBar>
      ) : null}
      <Panel>
        {rows.length === 0 ? (
          <EmptyState icon={Upload} title={t("empty.files")} description={t("empty.filesBodyWeb")} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-9 pe-0">
                  <Checkbox aria-label={t("act.selectAll")} checked={headState} onCheckedChange={(c) => (c ? all() : clear())} />
                </TableHead>
                <TableHead>{t("col.name")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("col.where")}</TableHead>
                <TableHead className="text-end">{t("col.size")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("col.modified")}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((o) => {
                const on = has(o.id);
                return (
                  <ActionContextMenu key={o.id} items={menuFor(o)} onOpen={() => !on && setSel(new Set([o.id]))}>
                    <TableRow
                      data-state={on ? "selected" : undefined}
                      className="group cursor-default select-none data-[state=selected]:bg-blau-soft"
                      onClick={(e) => click(o, e)}
                      onDoubleClick={() => actions.open(o, rows)}
                    >
                      <TableCell className="pe-0" onClick={(e) => e.stopPropagation()}>
                        <RowCheck checked={on} label={o.name} onToggle={(e) => click(o, e, true)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-0 items-center gap-2.5">
                          <ObjectThumb o={o} />
                          <button
                            type="button"
                            className="max-w-[380px] truncate text-start font-medium hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              actions.open(o, rows);
                            }}
                          >
                            {o.name}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="hidden max-w-[240px] truncate text-muted-foreground md:table-cell">{["Drive", ...index.pathTo(o.parent).map((p) => p.name)].join(" / ")}</TableCell>
                      <TableCell className="text-end text-muted-foreground tabular-nums">{bytes(o.size)}</TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">{when(o.mtimeMs, locale, words)}</TableCell>
                      <TableCell className="p-1" onClick={(e) => e.stopPropagation()}>
                        <ActionDropdown items={menuFor(o)}>
                          <Button variant="ghost" size="icon-sm" aria-label={t("act.more")} className="opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100">
                            <MoreHorizontal />
                          </Button>
                        </ActionDropdown>
                      </TableCell>
                    </TableRow>
                  </ActionContextMenu>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Panel>
    </div>
  );
}
