"use client";

import "./drive.css";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { DriveClient } from "@/lib/vault/client";
import { clearSession, loadSession, saveSession, type DriveSession } from "@/lib/vault/session";
import { DriveIndex, isLockedOut } from "@/lib/vault/store";
import { DriveShell } from "./shell";
import { SignIn } from "./sign-in";

type Theme = "light" | "dark";

interface DriveContext {
  /** "" on drive.bishare.app, "/drive" where the Drive shares a host (localhost). */
  base: string;
  session: DriveSession;
  client: DriveClient;
  index: DriveIndex;
  theme: Theme;
  setTheme: (t: Theme) => void;
  /** Forget the keys on this browser and leave the Drive's device list. */
  lock: () => Promise<void>;
  /** Pull now (after an action, or the Retry of an error). */
  refresh: () => Promise<void>;
  syncError: string | null;
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

const THEME_KEY = "bishare-drive-theme";
const PULL_EVERY_MS = 30_000;

export function DriveApp({ base, className, children }: { base: string; className?: string; children: ReactNode }) {
  const [session, setSession] = useState<DriveSession | null | undefined>(undefined);
  const [theme, setThemeState] = useState<Theme>("light");
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const t = localStorage.getItem(THEME_KEY);
      if (t === "dark" || t === "light") setThemeState(t);
    } catch {
      // Light, then.
    }
    void loadSession().then((s) => setSession(s));
  }, []);

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
    return { client, index: new DriveIndex(client, session.vaultId, session.vaultKey) };
  }, [session]);

  const signOutHere = useCallback(async () => {
    await clearSession();
    setSession(null);
  }, []);

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

  // The index follows the server: now, on a timer, and when the tab comes back.
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  useEffect(() => {
    if (!live) return;
    void refreshRef.current();
    const timer = setInterval(() => void refreshRef.current(), PULL_EVERY_MS);
    const onFocus = () => void refreshRef.current();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [live]);

  const approved = useCallback(async (s: DriveSession) => {
    await saveSession(s);
    setSession(s);
  }, []);

  return (
    <div className={`dv ${className ?? ""}`} data-theme={theme}>
      {session === undefined ? null : !session || !live ? (
        <SignIn onApproved={approved} theme={theme} setTheme={setTheme} />
      ) : (
        <Ctx.Provider value={{ base, session, client: live.client, index: live.index, theme, setTheme, lock, refresh, syncError }}>
          <DriveShell>{children}</DriveShell>
        </Ctx.Provider>
      )}
    </div>
  );
}
