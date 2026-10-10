"use client";

import { useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Check, MonitorDown } from "lucide-react";
import { Button, buttonVariants } from "@/components/site/ui/button";
import { AppleGlyph, APP_STORE_URL, PlayGlyph, PLAY_STORE_URL } from "@/components/site/store-buttons";
import {
  detectMobileOS,
  getInstallState,
  getServerInstallState,
  promptInstall,
  subscribeInstall,
} from "@/lib/pwa-install";
import { cn } from "@/lib/utils";

const noopSubscribe = () => () => {};

/**
 * "Install BIShare as an app" — rendered only when the browser has said the
 * site is installable, so on Safari/Firefox (or once installed) it takes no
 * space at all. `card` is the /download block; `inline` is the one-line nudge
 * under the transfer studio.
 *
 * Phones get the store app here instead, not the web app (see
 * lib/pwa-install.ts, which also catches the browser's install event on every
 * page). iOS gets the App Store link, and Safari shows the Smart App Banner
 * from the `apple-itunes-app` meta tag as well. Desktop keeps the web-app
 * offer.
 */
export function InstallApp({
  variant = "inline",
  className,
}: {
  variant?: "card" | "inline";
  className?: string;
}) {
  const t = useTranslations("chrome");
  const s = useSyncExternalStore(subscribeInstall, getInstallState, getServerInstallState);
  // null on the server and on desktop; the platform never changes mid-visit.
  const mobile = useSyncExternalStore(noopSubscribe, detectMobileOS, () => null);
  const [busy, setBusy] = useState(false);
  // Keep the block on screen after a successful install from THIS page, so the
  // click gets an answer instead of the button silently vanishing.
  const [justInstalled, setJustInstalled] = useState(false);

  if (mobile) {
    // /download already leads with the store badges; a second card there
    // would only repeat them.
    if (variant === "card") return null;
    const android = mobile === "android";
    const store = android ? "Google Play" : "App Store";
    const Glyph = android ? PlayGlyph : AppleGlyph;
    return (
      <div
        className={cn(
          "flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted-foreground",
          className
        )}
      >
        <span>{t("nativeApp.inline")}</span>
        <a
          href={android ? PLAY_STORE_URL : APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Glyph />
          {t("nativeApp.button", { store })}
        </a>
      </div>
    );
  }

  if (s === "installed" && !justInstalled) return null;
  if (s === "unavailable" && !justInstalled) return null;

  async function install() {
    setBusy(true);
    const outcome = await promptInstall();
    if (outcome === "accepted") setJustInstalled(true);
    setBusy(false);
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
