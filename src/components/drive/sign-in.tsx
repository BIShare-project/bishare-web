"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { Lock, Moon, RotateCw, ScanLine, ShieldCheck, Smartphone, Sun } from "lucide-react";
import { DriveApiError } from "@/lib/vault/client";
import { cancelPairing, checkPairing, showCode, startPairing, type Pairing } from "@/lib/vault/pair";
import { browserName, type DriveSession } from "@/lib/vault/session";
import { BrandMark } from "./shell";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Skeleton } from "./ui/skeleton";
import { Switch } from "./ui/switch";

const POLL_MS = 2000;
const CODE_LIFE_S = 300;
/**
 * New codes made by themselves before the page waits for a tap (audit W8: the
 * API makes 30 codes an hour per network, and a forgotten tab used them all).
 */
const AUTO_RENEWALS = 3;

/**
 * Opening the Drive in this browser (drive-plan.md task 6.3): no password
 * and no sign-in; a device that has the key scans this QR code, or a
 * computer types the code under it, and approves.
 */
export function SignIn({
  onApproved,
  theme,
  setTheme,
}: {
  onApproved: (s: DriveSession) => Promise<void>;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
}) {
  const t = useTranslations("drive");
  const [stay, setStay] = useState(false);
  const [pairing, setPairing] = useState<Pairing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [left, setLeft] = useState(CODE_LIFE_S);
  const stayRef = useRef(stay);
  const current = useRef<Pairing | null>(null);
  const renewals = useRef(0);

  // The words for what went wrong, never the server's English.
  const say = useCallback(
    (e: unknown) => {
      const code = e instanceof DriveApiError ? (e.code === "TRANSFER_RATE_LIMITED" ? "RATE_LIMITED" : e.code) : "UNKNOWN";
      return t.has(`errors.${code}`) ? t(`errors.${code}`) : t("errors.UNKNOWN");
    },
    [t]
  );

  const open = useCallback(async () => {
    setError(null);
    setExpired(false);
    // The code on screen until now can no longer be approved (drive-plan 6.12).
    if (current.current) void cancelPairing(current.current).catch(() => undefined);
    try {
      const p = await startPairing(browserName(), stayRef.current);
      current.current = p;
      setPairing(p);
    } catch (e) {
      current.current = null;
      setPairing(null);
      setError(say(e));
    }
  }, [say]);

  useEffect(() => {
    void open();
  }, [open]);

  // "Stay" travels in the slot: a change makes a new code.
  const toggleStay = (v: boolean) => {
    setStay(v);
    stayRef.current = v;
    void open();
  };

  // Wait for the approval; a new code when this one runs out.
  useEffect(() => {
    if (!pairing) return;
    let stopped = false;
    const tick = async () => {
      if (stopped) return;
      const remaining = pairing.expiresAt - Date.now();
      setLeft(Math.max(0, Math.round(remaining / 1000)));
      // An approval already taken is finished from here, whatever the clock.
      if (remaining <= 0 && !pairing.taken) {
        if (document.visibilityState !== "visible" || renewals.current >= AUTO_RENEWALS) {
          stopped = true;
          current.current = null;
          setPairing(null);
          setExpired(true);
          return;
        }
        renewals.current++;
        return void open();
      }
      try {
        const s = await checkPairing(pairing);
        if (s && !stopped) {
          stopped = true;
          current.current = null;
          await onApproved(s);
        }
      } catch (e) {
        if (!stopped) setError(say(e));
      }
    };
    const timer = setInterval(() => void tick(), POLL_MS);
    void tick();
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [pairing, onApproved, open, say]);

  const mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  const steps = [
    { icon: Smartphone, title: t("signin.step1"), body: t("signin.step1Body") },
    { icon: ScanLine, title: t("signin.step2"), body: t("signin.step2Body") },
    { icon: ShieldCheck, title: t("signin.step3"), body: t("signin.step3Body") },
  ];

  return (
    <div className="flex min-h-svh flex-col bg-sidebar">
      <header className="flex h-14 items-center gap-2.5 border-b bg-background px-4 sm:px-6">
        <BrandMark />
        <span className="text-xs font-semibold tracking-tight">BIShare Drive</span>
        <Button variant="ghost" size="icon" className="ms-auto" aria-label={t("theme")} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun /> : <Moon />}
        </Button>
      </header>
      <main className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <div className="grid w-full max-w-5xl overflow-hidden border bg-background shadow-[0_1px_0_0_var(--border),0_24px_48px_-24px_rgb(0_0_0/0.18)] md:grid-cols-[minmax(0,1fr)_380px]">
          <section className="flex flex-col gap-6 p-6 sm:p-10">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{t("signin.title")}</h1>
              <p className="mt-2 max-w-lg text-xs leading-relaxed text-muted-foreground">{t("signin.lead")}</p>
            </div>
            <ol className="flex flex-col border">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-3 border-b px-4 py-3.5 last:border-b-0">
                  <span className="grid size-7 shrink-0 place-items-center border text-2xs font-semibold tabular-nums">{i + 1}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <s.icon className="size-3.5 text-blau" />
                      {s.title}
                    </div>
                    <p className="mt-0.5 text-2xs text-muted-foreground">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <label className="flex cursor-pointer items-start gap-3 border bg-sidebar px-4 py-3.5">
              <Switch checked={stay} onCheckedChange={toggleStay} className="mt-0.5" />
              <span>
                <span className="block text-xs font-medium">{t("signin.stay")}</span>
                <span className="mt-0.5 block text-2xs text-muted-foreground">{t("signin.stayBody")}</span>
              </span>
            </label>
          </section>
          <section className="flex flex-col items-center justify-center gap-4 border-t bg-sidebar/60 p-6 sm:p-10 md:border-t-0 md:border-s">
            {pairing ? (
              <>
                <div className="relative bg-white p-3.5 shadow-sm ring-1 ring-black/5" aria-label={t("signin.qrLabel")}>
                  <QRCodeSVG value={pairing.qr} size={232} level="M" />
                  <span className="pointer-events-none absolute inset-0 animate-pulse ring-2 ring-blau/0" />
                </div>
                <div className="text-center text-2xs text-muted-foreground">{t("signin.typeInstead")}</div>
                <div className="border bg-background px-4 py-2 font-mono text-2xl font-semibold tracking-[0.18em] tabular-nums">{showCode(pairing.code)}</div>
                <div className="flex w-full max-w-60 flex-col gap-2">
                  <Progress value={(left / CODE_LIFE_S) * 100} />
                  <div className="flex items-center justify-center gap-2 text-3xs text-muted-foreground">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping bg-blau opacity-60" />
                      <span className="relative inline-flex size-2 bg-blau" />
                    </span>
                    {t("signin.waiting", { left: mm })}
                  </div>
                </div>
                {error ? <p className="max-w-60 text-center text-3xs text-destructive">{error}</p> : null}
              </>
            ) : expired ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-xs font-medium">{t("signin.expired")}</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    renewals.current = 0;
                    void open();
                  }}
                >
                  <RotateCw /> {t("signin.newCode")}
                </Button>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-xs font-medium">{t("error.title")}</p>
                <p className="max-w-64 text-2xs text-muted-foreground">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    renewals.current = 0;
                    void open();
                  }}
                >
                  <RotateCw /> {t("error.retry")}
                </Button>
              </div>
            ) : (
              <>
                <Skeleton className="size-[260px]" />
                <Skeleton className="h-10 w-48" />
              </>
            )}
          </section>
        </div>
      </main>
      <footer className="flex items-center justify-center gap-1.5 px-4 pb-6 text-center text-3xs text-muted-foreground">
        <Lock className="size-3" />
        {t("signin.footer")}
      </footer>
    </div>
  );
}
