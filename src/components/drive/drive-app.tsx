"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { toast as sonner } from "sonner";
import { DriveClient } from "@/lib/vault/client";
import { DriveOps } from "@/lib/vault/ops";
import { clearSession, loadSession, saveSession, type DriveSession } from "@/lib/vault/session";
import { DriveIndex, isLockedOut } from "@/lib/vault/store";
import { Uploader } from "@/lib/vault/upload";
import { Palette } from "./palette";
import { DriveShell } from "./shell";
import { SignIn } from "./sign-in";
import { ConfirmDialog, FolderPicker, PromptDialog } from "./ui";
import { Toaster } from "./ui/sonner";
import { TooltipProvider } from "./ui/tooltip";
import { Viewer } from "./viewer";

type Theme = "light" | "dark";

interface DriveContext {
  /** "" on drive.bishare.app, "/drive" where the Drive shares a host (localhost). */
  base: string;
  session: DriveSession;
  client: DriveClient;
  index: DriveIndex;
  ops: DriveOps;
  uploader: Uploader;
  theme: Theme;
  setTheme: (t: Theme) => void;
  /** Forget the keys on this browser and leave the Drive's device list. */
  lock: () => Promise<void>;
  /** Pull now (after an action, or the Retry of an error). */
  refresh: () => Promise<void>;
  syncError: string | null;
  toast: (text: string, opts?: { tone?: "ok" | "error"; action?: { label: string; run: () => void }; description?: string }) => void;
  prompt: (p: { title: string; label: string; initial?: string; confirm: string }) => Promise<string | null>;
  confirm: (p: { title: string; body: string; confirm: string; danger?: boolean }) => Promise<boolean>;
  pickFolder: (p: { title: string; confirm: string; exclude?: Set<string> }) => Promise<string | null | undefined>;
  /** Open [ids] in the viewer, at [at]. */
  view: (ids: string[], at: number) => void;
  palette: () => void;
  /** The streaming worker's scope for these pages. */
  scope: string;
}

const Ctx = createContext<DriveContext | null>(null);

export function useDrive(): DriveContext {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDrive outside the Drive");
  return c;
}

/** Re-renders the caller whenever the index changes. */
export function useIndex(): DriveIndex {
  const { index } = useDrive();
  useSyncExternalStore(index.subscribe, index.snapshot, () => 0);
  return index;
}

/** Re-renders the caller whenever an upload moves. */
export function useUploads(): Uploader {
  const { uploader } = useDrive();
  useSyncExternalStore(uploader.subscribe, uploader.snapshot, () => 0);
  return uploader;
}

const THEME_KEY = "bishare-drive-theme";
const PULL_EVERY_MS = 30_000;
const PULL_WITH_SOCKET_MS = 120_000;
/** A browser that does not stay signed in locks after this long without use. */
const IDLE_LOCK_MS = 15 * 60_000;

export function DriveApp({ base, className, children }: { base: string; className?: string; children: ReactNode }) {
  const [session, setSession] = useState<DriveSession | null | undefined>(undefined);
  const [theme, setThemeState] = useState<Theme>("light");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<ReactNode>(null);
  const [viewer, setViewer] = useState<{ ids: string[]; at: number } | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [socketUp, setSocketUp] = useState(false);
  const path = usePathname();
  const publicPage = /\/delete-account\/?$/.test(path ?? "");
  const scope = `${base}/`;

  useEffect(() => {
    try {
      const t = localStorage.getItem(THEME_KEY);
      if (t === "dark" || t === "light") setThemeState(t);
      else if (matchMedia("(prefers-color-scheme: dark)").matches) setThemeState("dark");
    } catch {
      // Light, then.
    }
    void loadSession().then((s) => setSession(s));
  }, []);

  // The Drive's tokens follow <html data-drive-theme> (drive.css), so menus and
  // dialogs portalled to <body> take the theme too.
  useEffect(() => {
    document.documentElement.dataset.driveTheme = theme;
    return () => {
      delete document.documentElement.dataset.driveTheme;
    };
  }, [theme]);
  // The fonts' CSS variables on <html> too: --font-sans is resolved there
  // (drive.css), and menus, sheets and toasts portal outside this tree.
  useEffect(() => {
    const names = (className ?? "").split(/\s+/).filter(Boolean);
    document.documentElement.classList.add(...names);
    return () => document.documentElement.classList.remove(...names);
  }, [className]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {
      // Not remembered.
    }
  }, []);

  const live = useMemo(() => {
    if (!session) return null;
    const client = new DriveClient(session);
    const index = new DriveIndex(client, session.vaultId, session.vaultKey);
    const ops = new DriveOps(client, index, session.vaultId, session.vaultKey);
    return { client, index, ops, uploader: new Uploader(client, index, ops, session.vaultId, session.vaultKey) };
  }, [session]);

  const signOutHere = useCallback(async () => {
    live?.uploader.cancelAll();
    await clearSession();
    setViewer(null);
    setSession(null);
  }, [live]);

  const refresh = useCallback(async () => {
    if (!live) return;
    try {
      await live.index.pull();
      setSyncError(null);
    } catch (e) {
      if (isLockedOut(e)) return signOutHere();
      setSyncError(e instanceof Error ? e.message : String(e));
    }
  }, [live, signOutHere]);

  const lock = useCallback(async () => {
    if (live && session) await live.client.removeSelf(session.deviceId).catch(() => undefined);
    await signOutHere();
  }, [live, session, signOutHere]);

  // The index follows the server: now, on a timer, when the tab comes back,
  // and at once when the live-updates socket says something changed.
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);
  useEffect(() => {
    if (!live) return;
    void refreshRef.current();
    const timer = setInterval(() => void refreshRef.current(), socketUp ? PULL_WITH_SOCKET_MS : PULL_EVERY_MS);
    const onFocus = () => void refreshRef.current();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [live, socketUp]);

  useEffect(() => {
    if (!live) return;
    let ws: WebSocket | null = null;
    let stopped = false;
    let tries = 0;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let ping: ReturnType<typeof setInterval> | null = null;
    const open = async () => {
      if (stopped) return;
      try {
        ws = new WebSocket(await live.client.socketUrl());
      } catch {
        return later();
      }
      ws.onopen = () => {
        tries = 0;
        setSocketUp(true);
        ping = setInterval(() => ws?.readyState === WebSocket.OPEN && ws.send("ping"), 50_000);
      };
      ws.onmessage = (e) => {
        try {
          const m = JSON.parse(String(e.data)) as { type?: string; seq?: number };
          if (m.type === "vault" || (m.type === "seq" && (m.seq ?? 0) > live.index.seq)) void refreshRef.current();
        } catch {
          // Not ours.
        }
      };
      ws.onclose = () => {
        setSocketUp(false);
        if (ping) clearInterval(ping);
        later();
      };
    };
    const later = () => {
      if (stopped) return;
      retry = setTimeout(() => void open(), Math.min(60_000, 2000 * 2 ** tries++));
    };
    void open();
    return () => {
      stopped = true;
      if (retry) clearTimeout(retry);
      if (ping) clearInterval(ping);
      ws?.close();
      setSocketUp(false);
    };
  }, [live]);

  // Without "Stay", a browser left alone locks itself (never mid-upload).
  useEffect(() => {
    if (!live || !session || session.stay) return;
    let last = Date.now();
    const seen = () => {
      last = Date.now();
    };
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    for (const e of events) window.addEventListener(e, seen, { passive: true });
    const timer = setInterval(() => {
      if (Date.now() - last > IDLE_LOCK_MS && !live.uploader.busy) void lock();
    }, 30_000);
    return () => {
      for (const e of events) window.removeEventListener(e, seen);
      clearInterval(timer);
    };
  }, [live, session, lock]);

  // Closing the tab mid-upload asks first.
  useEffect(() => {
    if (!live) return;
    const onLeave = (e: BeforeUnloadEvent) => {
      if (live.uploader.busy) e.preventDefault();
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [live]);

  const approved = useCallback(async (s: DriveSession) => {
    await saveSession(s);
    setSession(s);
  }, []);

  const toast = useCallback((text: string, opts: { tone?: "ok" | "error"; action?: { label: string; run: () => void }; description?: string } = {}) => {
    const o = {
      description: opts.description,
      action: opts.action ? { label: opts.action.label, onClick: opts.action.run } : undefined,
      duration: opts.action ? 8000 : opts.tone === "error" ? 7000 : 4000,
    };
    if (opts.tone === "error") sonner.error(text, o);
    else if (opts.tone === "ok") sonner.success(text, o);
    else sonner(text, o);
  }, []);

  const prompt = useCallback(
    (p: { title: string; label: string; initial?: string; confirm: string }) =>
      new Promise<string | null>((resolve) =>
        setDialog(
          <PromptDialog
            title={p.title}
            label={p.label}
            initial={p.initial ?? ""}
            confirm={p.confirm}
            onDone={(v) => {
              setDialog(null);
              resolve(v);
            }}
          />
        )
      ),
    []
  );

  const confirm = useCallback(
    (p: { title: string; body: string; confirm: string; danger?: boolean }) =>
      new Promise<boolean>((resolve) =>
        setDialog(
          <ConfirmDialog
            {...p}
            onDone={(ok) => {
              setDialog(null);
              resolve(ok);
            }}
          />
        )
      ),
    []
  );

  const value = useMemo<DriveContext | null>(() => {
    if (!session || !live) return null;
    const ctx: DriveContext = {
      base,
      session,
      ...live,
      theme,
      setTheme,
      lock,
      refresh,
      syncError,
      toast,
      prompt,
      confirm,
      pickFolder: (p) =>
        new Promise((resolve) =>
          setDialog(
            <Ctx.Provider value={ctx}>
              <FolderPicker
                index={live.index}
                title={p.title}
                confirm={p.confirm}
                exclude={p.exclude ?? new Set()}
                onNewFolder={(parent, name) => live.ops.mkdir(name, parent).catch(() => null)}
                onDone={(f) => {
                  setDialog(null);
                  resolve(f);
                }}
              />
            </Ctx.Provider>
          )
        ),
      view: (ids, at) => setViewer({ ids, at }),
      palette: () => setPaletteOpen(true),
      scope,
    };
    return ctx;
  }, [base, session, live, theme, setTheme, lock, refresh, syncError, toast, prompt, confirm, scope]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className={`min-h-svh bg-background font-sans text-xs text-foreground ${className ?? ""}`}>
        {publicPage ? (
          children
        ) : session === undefined ? null : !value ? (
          <SignIn onApproved={approved} theme={theme} setTheme={setTheme} />
        ) : (
          <Ctx.Provider value={value}>
            <DriveShell>{children}</DriveShell>
            {viewer ? <Viewer ids={viewer.ids} at={viewer.at} onClose={() => setViewer(null)} /> : null}
            <Palette open={paletteOpen} onOpenChange={setPaletteOpen} />
            {dialog}
          </Ctx.Provider>
        )}
        <Toaster theme={theme} position="bottom-center" />
      </div>
    </TooltipProvider>
  );
}
