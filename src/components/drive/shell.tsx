"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, Clock, Database, Folder, Image as ImageIcon, LayoutGrid, Lock, Monitor, Moon, Search, ShieldCheck, Sun, Trash2 } from "lucide-react";
import { useDrive, useIndex } from "./drive-app";
import { bytes, percent } from "./format";

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

/** The Drive's frame: the sidebar, the top bar and the page. */
export function DriveShell({ children }: { children: ReactNode }) {
  const t = useTranslations("drive");
  const { base, session, theme, setTheme, lock, syncError } = useDrive();
  const index = useIndex();
  const path = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");

  // The page's own path without the /drive prefix or a locale in front.
  const here = path.replace(/^\/[A-Za-z-]+(?=\/drive)/, "").replace(/^\/drive/, "") || "";
  const on = (href: string) => (href === "" ? here === "" || here === "/" : here.startsWith(href));
  const stats = index.stats();
  const info = index.info;
  const used = info?.usedBytes ?? 0;
  const quota = info?.quotaBytes ?? 0;
  const counts: Record<string, number | undefined> = {
    files: stats.files,
    photos: stats.media,
    devices: index.devices.length || undefined,
    trash: stats.trashItems || undefined,
  };
  const title = [...NAV, ...MANAGE].find((n) => on(n.href))?.key ?? "home";
  const total = Object.values(stats.byKind).reduce((a, b) => a + b, 0) || 1;
  const scale = used > 0 ? used / total : 1;

  const item = (n: (typeof NAV)[number] | (typeof MANAGE)[number]) => {
    const Icon = n.icon;
    return (
      <Link key={n.key} href={`${base}${n.href}` || "/"} className={on(n.href) ? "on" : ""}>
        <Icon className="ic" />
        {t(`nav.${n.key}`)}
        {counts[n.key] !== undefined ? <span className="n num">{counts[n.key]!.toLocaleString()}</span> : null}
      </Link>
    );
  };

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <span className="mark">
            <ArrowRight className="ic" strokeWidth={2.4} />
          </span>
          <div>
            <b>BIShare Drive</b>
            <span>{t("e2e")}</span>
          </div>
        </div>
        <nav className="nav" aria-label="Drive">
          {NAV.map(item)}
          <div className="grp">{t("nav.manage")}</div>
          {MANAGE.map(item)}
        </nav>
        <div className="foot">
          <div className="row">
            <b style={{ color: "var(--fg)" }}>{bytes(used)}</b> {t("of", { total: bytes(quota) })}
            <span className="grow" />
            {percent(used, quota)}
          </div>
          <div className="bar">
            {(["media", "documents", "audio", "other", "trash"] as const).map((k) => (
              <span key={k} style={{ width: `${quota > 0 ? Math.min(100, (stats.byKind[k] * scale * 100) / quota) : 0}%`, background: `var(--${k === "documents" ? "docs" : k})` }} />
            ))}
          </div>
          {t("footNote")}
        </div>
      </aside>
      <div className="main">
        <header className="top">
          <h2>{t(`nav.${title}`)}</h2>
          <form
            className="search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`${base}/files?q=${encodeURIComponent(q)}`);
            }}
          >
            <Search className="ic" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} />
          </form>
          <span className="grow" />
          {syncError ? (
            <span className="badge red" title={syncError}>
              {t("syncFailed")}
            </span>
          ) : index.lastPulledAt ? (
            <span className="badge green">
              <span className="dot" />
              {t("synced")}
            </span>
          ) : null}
          <button type="button" className="btn sq" aria-label={t("theme")} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun className="ic" /> : <Moon className="ic" />}
          </button>
          <div className="who">
            <span className="av">
              <Monitor className="ic" />
            </span>
            <div>
              <b>{session.name}</b>
              <span>{session.stay ? t("staysSignedIn") : t("locksWhenClosed")}</span>
            </div>
          </div>
          <button type="button" className="btn sq" aria-label={t("lock")} title={t("lock")} onClick={() => void lock()}>
            <Lock className="ic" />
          </button>
        </header>
        {/* Until the first pull, every number would read 0. */}
        {index.lastPulledAt || syncError ? (
          children
        ) : (
          <section className="content">
            <div className="mute">{t("loading")}</div>
          </section>
        )}
      </div>
    </div>
  );
}
