"use client";

import { useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Check, MonitorDown } from "lucide-react";
import { Button } from "@/components/site/ui/button";
import { cn } from "@/lib/utils";

/** Chromium's non-standard install event — not in lib.dom. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallState = "unavailable" | "installable" | "installed";

// Chromium fires `beforeinstallprompt` exactly once, as soon as it judges the
// site installable — often before React has hydrated. Capturing it at module
// load (this chunk ships with every page that renders the button) means no
// component has to be mounted in time to catch it. preventDefault() also
// silences Chrome's own mini-infobar on Android, so the page's button is the
// one install affordance people see. Browsers without the event (Safari,
// Firefox) simply never show the button; their users have the store links.
let deferred: BeforeInstallPromptEvent | null = null;
let state: InstallState = "unavailable";
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  if (window.matchMedia("(display-mode: standalone)").matches) state = "installed";
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    if (state !== "installed") {
      state = "installable";
      emit();
    }
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    state = "installed";
    emit();
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const getSnapshot = () => state;
const getServerSnapshot = (): InstallState => "unavailable";

/**
 * "Install BIShare as an app" — rendered only when the browser has said the
 * site is installable, so on Safari/Firefox (or once installed) it takes no
 * space at all. `card` is the /download block; `inline` is the one-line nudge
 * under the transfer studio.
 */
export function InstallApp({
  variant = "inline",
  className,
}: {
  variant?: "card" | "inline";
  className?: string;
}) {
  const t = useTranslations("chrome");
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [busy, setBusy] = useState(false);
  // Keep the block on screen after a successful install from THIS page, so the
  // click gets an answer instead of the button silently vanishing.
  const [justInstalled, setJustInstalled] = useState(false);

  if (s === "installed" && !justInstalled) return null;
  if (s === "unavailable" && !justInstalled) return null;

  async function install() {
    const ev = deferred;
    if (!ev) return;
    setBusy(true);
    try {
      await ev.prompt();
      const { outcome } = await ev.userChoice;
      if (outcome === "accepted") setJustInstalled(true);
    } catch {
      // The prompt can only be shown once per event; nothing to retry here.
    } finally {
      deferred = null;
      if (state === "installable") {
        state = "unavailable"; // a dismissed prompt comes back on the next load
        emit();
      }
      setBusy(false);
    }
  }

  if (justInstalled) {
    return (
      <p
        role="status"
        className={cn(
          "flex items-center justify-center gap-2 text-sm text-muted-foreground",
          variant === "card" && "rounded-xl border border-border bg-card p-6",
          className
        )}
      >
        <Check className="h-4 w-4 text-accent-blue" aria-hidden />
        {t("installApp.installed")}
      </p>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={cn(
          "flex flex-col items-start gap-5 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between",
          className
        )}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground">
            <MonitorDown className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h3 className="font-semibold">{t("installApp.title")}</h3>
            <p className="mt-1 max-w-lg text-sm leading-relaxed text-muted-foreground">
              {t("installApp.body")}
            </p>
          </div>
        </div>
        <Button onClick={install} disabled={busy} size="lg" className="shrink-0">
          <MonitorDown />
          {busy ? t("installApp.installing") : t("installApp.button")}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted-foreground",
        className
      )}
    >
      <span>{t("installApp.inline")}</span>
      <Button onClick={install} disabled={busy} variant="outline" size="sm">
        <MonitorDown />
        {busy ? t("installApp.installing") : t("installApp.button")}
      </Button>
    </div>
  );
}
