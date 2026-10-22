"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { ArrowRight, Lock, Moon, Sun } from "lucide-react";
import { checkPairing, showCode, startPairing, type Pairing } from "@/lib/vault/pair";
import { browserName, type DriveSession } from "@/lib/vault/session";

const POLL_MS = 2000;

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
  const [left, setLeft] = useState(0);
  const stayRef = useRef(stay);
  stayRef.current = stay;

  const open = useCallback(async () => {
    setError(null);
    try {
      setPairing(await startPairing(browserName(), stayRef.current));
    } catch (e) {
      setPairing(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

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
      if (remaining <= 0) return void open();
      try {
        const s = await checkPairing(pairing);
        if (s && !stopped) {
          stopped = true;
          await onApproved(s);
        }
      } catch (e) {
        if (!stopped) setError(e instanceof Error ? e.message : String(e));
      }
    };
    const timer = setInterval(() => void tick(), POLL_MS);
    void tick();
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [pairing, onApproved, open]);

  const mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;

  return (
    <div className="signin">
      <div className="top2">
        <span className="mark">
          <ArrowRight className="ic" strokeWidth={2.4} />
        </span>
        <b>BIShare Drive</b>
        <span className="grow" />
        <button type="button" className="btn sq" aria-label={t("theme")} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="ic" /> : <Moon className="ic" />}
        </button>
      </div>
      <div className="pair">
        <div className="l">
          <h1>{t("signin.title")}</h1>
          <div className="mute">{t("signin.lead")}</div>
          <ol className="steps">
            <li>
              <span className="n">1</span>
              <div>
                <b>{t("signin.step1")}</b>
                <div className="mute">{t("signin.step1Body")}</div>
              </div>
            </li>
            <li>
              <span className="n">2</span>
              <div>
                <b>{t("signin.step2")}</b>
                <div className="mute">{t("signin.step2Body")}</div>
              </div>
            </li>
            <li>
              <span className="n">3</span>
              <div>
                <b>{t("signin.step3")}</b>
                <div className="mute">{t("signin.step3Body")}</div>
              </div>
            </li>
          </ol>
          <label className="stay">
            <input className="cb" type="checkbox" checked={stay} onChange={(e) => toggleStay(e.target.checked)} style={{ marginTop: 2 }} />
            <span>
              <b>{t("signin.stay")}</b>
              <br />
              <span className="mute">{t("signin.stayBody")}</span>
            </span>
          </label>
        </div>
        <div className="r">
          {pairing ? (
            <>
              <div className="qr" aria-label={t("signin.qrLabel")}>
                <QRCodeSVG value={pairing.qr} size={236} level="M" />
              </div>
              <div className="mute" style={{ fontSize: 12.5, textAlign: "center" }}>
                {t("signin.typeInstead")}
              </div>
              <div className="code">{showCode(pairing.code)}</div>
              <div className="row mute" style={{ fontSize: 12 }}>
                <span className="dot" style={{ background: "var(--blue)" }} />
                {t("signin.waiting", { left: mm })}
              </div>
            </>
          ) : error ? (
            <div className="empty">
              <b>{t("error.title")}</b>
              <div style={{ marginBottom: 12 }}>{error}</div>
              <button type="button" className="btn" onClick={() => void open()}>
                {t("error.retry")}
              </button>
            </div>
          ) : (
            <div className="mute">{t("loading")}</div>
          )}
          {pairing && error ? <div className="mute" style={{ fontSize: 12, color: "var(--red)" }}>{error}</div> : null}
        </div>
      </div>
      <div className="ft">
        <Lock className="ic" style={{ width: 13, height: 13 }} />
        {t("signin.footer")}
      </div>
    </div>
  );
}
