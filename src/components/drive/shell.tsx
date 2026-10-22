"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  CircleAlert,
  Clock,
  Database,
  Folder,
  FolderPlus,
  FolderUp,
  Image as ImageIcon,
  LayoutGrid,
  Lock,
  Menu as MenuIcon,
  Monitor,
  Moon,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useActions } from "./actions";
import { useDrive, useIndex } from "./drive-app";
import { bytes, percent } from "./format";
import { DropZone, UploadTray } from "./uploads";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "./ui/sheet";
import { Skeleton } from "./ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const NAV = [
  { href: "", key: "home", icon: LayoutGrid },
  { href: "/files", key: "files", icon: Folder },
  { href: "/recent", key: "recent", icon: Clock },
  { href: "/photos", key: "photos", icon: ImageIcon },
] as const;
const MANAGE = [
  { href: "/devices", key: "devices", icon: Monitor },
  { href: "/trash", key: "trash", icon: Trash2 },
  { href: "/storage", key: "storage", icon: Database },
  { href: "/security", key: "security", icon: ShieldCheck },
] as const;

/** The page's own path, without a locale and /drive in front. */
export function useHere(): string {
  const path = usePathname() ?? "";
  return path.replace(/^\/[A-Za-z-]+(?=\/drive)/, "").replace(/^\/drive/, "") || "";
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid size-8 shrink-0 place-items-center bg-blau text-white", className)}>
      <ArrowRight className="size-4" strokeWidth={2.4} />
    </span>
  );
}

function NewButton({ parent }: { parent: string | null }) {
  const t = useTranslations("drive");
  const actions = useActions();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-9 w-full justify-start gap-2 px-3">
          <Plus /> {t("act.new")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onSelect={() => actions.upload(parent)}>
          <Upload /> {t("act.upload")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => actions.uploadFolder(parent)}>
          <FolderUp /> {t("act.uploadFolder")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void actions.newFolder(parent)}>
          <FolderPlus /> {t("act.newFolder")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("drive");
  const { base } = useDrive();
  const index = useIndex();
  const here = useHere();
  const stats = index.stats();
  const info = index.info;
  const used = info?.usedBytes ?? 0;
  const quota = info?.quotaBytes ?? 0;
  const total = Object.values(stats.byKind).reduce((a, b) => a + b, 0) || 1;
  const scale = used > 0 ? used / total : 1;
  const counts: Record<string, number | undefined> = {
    files: stats.files || undefined,
    photos: stats.media || undefined,
    devices: index.devices.length || undefined,
    trash: stats.trashItems || undefined,
  };
  const on = (href: string) => (href === "" ? here === "" || here === "/" : here.startsWith(href));
  const folder = here.startsWith("/files") && typeof location !== "undefined" ? new URLSearchParams(location.search).get("f") : null;
  const item = (n: (typeof NAV)[number] | (typeof MANAGE)[number]) => {
    const Icon = n.icon;
    const active = on(n.href);
    return (
      <li key={n.key}>
        <Link
          href={`${base}${n.href}` || "/"}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          className={cn(
            "group relative flex h-8 items-center gap-2.5 px-2.5 text-xs transition-colors",
            active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
          )}
        >
          {active && <span className="absolute inset-y-1 start-0 w-0.5 bg-blau" aria-hidden />}
          <Icon className={cn("size-4", active ? "text-blau" : "text-muted-foreground group-hover:text-foreground")} />
          <span className="flex-1 truncate">{t(`nav.${n.key}`)}</span>
          {counts[n.key] !== undefined ? <span className="text-3xs text-muted-foreground tabular-nums">{counts[n.key]!.toLocaleString()}</span> : null}
        </Link>
      </li>
    );
  };
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b px-4">
        <BrandMark />
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="text-xs font-semibold tracking-tight">BIShare Drive</span>
          <span className="text-3xs text-muted-foreground">{t("e2e")}</span>
        </div>
      </div>
      <div className="px-3 pt-3">
        <NewButton parent={folder && index.get(folder) ? folder : null} />
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Drive">
        <ul className="flex flex-col gap-px">{NAV.map(item)}</ul>
        <div className="px-2.5 pt-5 pb-1.5 text-3xs font-medium tracking-wide text-muted-foreground uppercase">{t("nav.manage")}</div>
        <ul className="flex flex-col gap-px">{MANAGE.map(item)}</ul>
      </nav>
      <Link href={`${base}/storage`} onClick={onNavigate} className="block border-t px-4 py-3 text-3xs text-muted-foreground transition-colors hover:bg-sidebar-accent/60">
        <div className="flex items-baseline gap-1">
          <b className="text-2xs font-semibold text-foreground tabular-nums">{bytes(used)}</b>
          <span>{t("of", { total: bytes(quota) })}</span>
          <span className="ms-auto tabular-nums">{percent(used, quota)}</span>
        </div>
        <div className="my-2 flex h-1.5 overflow-hidden bg-muted">
          {(["media", "documents", "audio", "other", "trash"] as const).map((k) => (
            <span
              key={k}
              className="h-full"
              style={{ width: `${quota > 0 ? Math.min(100, (stats.byKind[k] * scale * 100) / quota) : 0}%`, background: `var(--${k === "documents" ? "docs" : k})` }}
            />
          ))}
        </div>
        {t("footNote")}
      </Link>
    </div>
  );
}

/** The Drive's frame: the sidebar, the top bar and the page (the LaundryAman admin's shell). */
export function DriveShell({ children }: { children: ReactNode }) {
  const t = useTranslations("drive");
  const { session, theme, setTheme, lock, syncError, refresh, palette, base } = useDrive();
  const index = useIndex();
  const here = useHere();
  const [navOpen, setNavOpen] = useState(false);
  const title = [...NAV, ...MANAGE].find((n) => (n.href === "" ? here === "" || here === "/" : here.startsWith(n.href)))?.key ?? "home";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || !!el?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        palette();
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        palette();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [palette]);

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 border-e bg-sidebar text-sidebar-foreground lg:block">
        <SideNav />
      </aside>
      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" className="w-64 gap-0 bg-sidebar p-0">
          <SheetTitle className="sr-only">BIShare Drive</SheetTitle>
          <SideNav onNavigate={() => setNavOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <Button variant="ghost" size="icon" className="-ms-1.5 lg:hidden" aria-label={t("nav.menu")} onClick={() => setNavOpen(true)}>
            <MenuIcon />
          </Button>
          <h1 className="hidden min-w-0 truncate text-sm font-semibold tracking-tight md:block">{t(`nav.${title}`)}</h1>
          <button
            type="button"
            onClick={palette}
            className="flex h-8 w-full max-w-md min-w-0 items-center gap-2 border bg-muted/40 px-2.5 text-start text-xs text-muted-foreground transition-colors hover:bg-muted md:ms-6"
          >
            <Search className="size-4" />
            <span className="flex-1 truncate">{t("searchPlaceholder")}</span>
            <kbd className="hidden border bg-background px-1.5 font-mono text-3xs sm:inline">⌘K</kbd>
          </button>
          <div className="ms-auto flex shrink-0 items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className={cn("hidden gap-1.5 md:inline-flex", syncError ? "text-destructive" : "text-muted-foreground")} onClick={() => void refresh()}>
                  {syncError ? <CircleAlert /> : <RefreshCw />}
                  {syncError ? t("syncFailed") : t("synced")}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {syncError ?? (index.lastPulledAt ? t("syncedAt", { time: new Date(index.lastPulledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }) : t("loading"))}
              </TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 gap-2 px-1.5" aria-label={session.name}>
                  <span className="grid size-7 place-items-center bg-foreground text-background">
                    <Monitor className="size-3.5" />
                  </span>
                  <span className="hidden flex-col items-start leading-tight xl:flex">
                    <span className="text-2xs font-medium">{session.name}</span>
                    <span className="text-3xs text-muted-foreground">{session.stay ? t("staysSignedIn") : t("locksWhenClosed")}</span>
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium">{session.name}</span>
                  <span className="text-2xs font-normal text-muted-foreground">{session.stay ? t("security.stayOn") : t("security.stayOff")}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-3xs font-normal text-muted-foreground">{t("theme")}</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as "light" | "dark")}>
                  <DropdownMenuRadioItem value="light">
                    <Sun /> {t("themeLight")}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">
                    <Moon /> {t("themeDark")}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`${base}/security`}>
                    <ShieldCheck /> {t("nav.security")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`${base}/devices`}>
                    <Monitor /> {t("nav.devices")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void lock()}>
                  <Lock /> {t("lock")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 lg:p-5">
          {/* Until the first pull, every number would read 0. */}
          {index.lastPulledAt || syncError ? (
            children
          ) : (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-6 w-48" />
              <div className="grid grid-cols-2 gap-px border bg-border lg:grid-cols-5">
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className="bg-card p-4">
                    <Skeleton className="mb-2 h-3 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
          )}
        </main>
      </div>
      <DropZone />
      <UploadTray />
    </div>
  );
}
