"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useTranslations } from "next-intl";
import { FileUp, QrCode, ScanLine, X } from "lucide-react";
import { encodeBeam, BeamCollector, type BeamMeta } from "@/lib/qrbeam/codec";

// QR throughput is tiny (~1 KB/frame) — QR Beam is for text, keys, and small
// docs, not media. Above this we refuse.
const MAX_BEAM_BYTES = 100 * 1024;
const WARN_BEAM_BYTES = 30 * 1024;

type Mode = "menu" | "send" | "receive";

// BarcodeDetector isn't in TS's DOM lib — declare the minimal shape we use.
type DetectedBarcode = { rawValue: string };
interface BarcodeDetectorInstance {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}
interface BarcodeDetectorCtor {
  new (options?: { formats?: string[] }): BarcodeDetectorInstance;
}
function getBarcodeDetector(): BarcodeDetectorCtor | null {
  if (typeof window === "undefined") return null;
  const c = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
  return typeof c === "function" ? c : null;
}

/**
 * QR Beam — offline file transfer over an animated stream of QR codes (screen →
 * camera, no network). Self-contained: "Show" turns a small file into a looping
 * QR stream; "Scan" reads another device's stream and reassembles the file. The
 * frame format (lib/qrbeam/codec) is identical to the Flutter app, so web ↔
 * mobile beaming interoperates. Flag-gated by the parent widget.
 */
export function QrBeamPanel() {
  const t = useTranslations("beam");
  const [mode, setMode] = useState<Mode>("menu");

  if (mode === "send") return <BeamSend t={t} onBack={() => setMode("menu")} />;
  if (mode === "receive") return <BeamReceive t={t} onBack={() => setMode("menu")} />;

  return (
    <div className="py-2">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-foreground">
          <QrCode className="h-5 w-5" />
        </div>
        <p className="font-medium">{t("title")}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <div className="mt-5 space-y-2.5">
        <button
          onClick={() => setMode("send")}
          className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-colors hover:border-border-strong hover:bg-secondary/40"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue/[0.1] text-accent-blue">
            <QrCode className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">{t("sendTitle")}</span>
            <span className="block text-xs text-muted-foreground">{t("sendDesc")}</span>
          </span>
        </button>
        <button
          onClick={() => setMode("receive")}
          className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-colors hover:border-border-strong hover:bg-secondary/40"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue/[0.1] text-accent-blue">
            <ScanLine className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">{t("receiveTitle")}</span>
            <span className="block text-xs text-muted-foreground">{t("receiveDesc")}</span>
          </span>
        </button>
      </div>
      <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">{t("hint")}</p>
    </div>
  );
}

type T = ReturnType<typeof useTranslations>;

// ── Sender: animated QR stream ──────────────────────────────────────────────
function BeamSend({ t, onBack }: { t: T; onBack: () => void }) {
  const [frames, setFrames] = useState<string[] | null>(null);
  const [meta, setMeta] = useState<BeamMeta | null>(null);
  const [idx, setIdx] = useState(0);
  const [fps, setFps] = useState(6);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    if (file.size > MAX_BEAM_BYTES) {
      setError(t("errTooLarge", { max: `${Math.round(MAX_BEAM_BYTES / 1024)} KB` }));
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const ext = file.name.includes(".") ? file.name.split(".").pop()! : "";
    const { frames: f, meta: m } = encodeBeam(bytes, { name: file.name, mime: file.type || ext });
    setFrames(f);
    setMeta(m);
    setIdx(0);
  }

  // Cycle frames at the chosen fps.
  useEffect(() => {
    if (!frames || frames.length <= 1) return;
    const id = window.setInterval(() => setIdx((i) => (i + 1) % frames.length), Math.round(1000 / fps));
    return () => window.clearInterval(id);
  }, [frames, fps]);

  return (
    <div className="py-2">
      <BeamHeader title={t("sendTitle")} onBack={onBack} />
      <input ref={fileRef} type="file" hidden onChange={onFile} />
      {!frames || !meta ? (
        <div className="py-8 text-center">
          <p className="mx-auto max-w-xs text-sm text-muted-foreground">{t("sendEmpty")}</p>
          <button
            onClick={() => fileRef.current?.click()}
            className="mx-auto mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <FileUp className="h-4 w-4" /> {t("pickFile")}
          </button>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>
      ) : (
        <div className="mt-2">
          {/* Branded gradient frame → white panel (mirrors QRDisplay / mobile _BeamQr). */}
          <div
            className="mx-auto w-fit rounded-[28px] p-[3px] shadow-[0_14px_34px_-10px_var(--primary)]"
            style={{
              background:
                "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 30%, transparent))",
            }}
          >
            <div className="rounded-[25px] bg-white p-4">
              <QRCodeCanvas value={frames[idx]!} size={240} level="M" marginSize={1} fgColor="#0a0a0a" />
            </div>
          </div>
          <div className="mx-auto mt-4 max-w-xs">
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-accent-blue transition-[width] duration-100"
                style={{ width: `${Math.round(((idx + 1) / frames.length) * 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-center text-xs text-muted-foreground">
              {t("frameOf", { i: idx + 1, n: frames.length })}
            </p>
          </div>
          <div className="mx-auto mt-4 max-w-xs rounded-xl border border-border bg-card px-4 py-3">
            <p className="truncate text-sm font-medium">{meta.name}</p>
            <p className="text-xs text-muted-foreground">
              {(meta.size / 1024).toFixed(1)} KB · {t("chunks", { n: meta.total })}
            </p>
          </div>
          <p className="mx-auto mt-3 max-w-xs text-center text-xs leading-relaxed text-muted-foreground">
            {t("keepSteady")}
          </p>
          {meta.size > WARN_BEAM_BYTES && (
            <p className="mx-auto mt-2 max-w-xs text-center text-xs text-amber-500 dark:text-amber-400">
              {t("largeWarn")}
            </p>
          )}
          <div className="mx-auto mt-4 flex max-w-xs items-center gap-3">
            <span className="text-xs text-muted-foreground">{t("speed")}</span>
            <input
              type="range"
              min={3}
              max={12}
              value={fps}
              onChange={(e) => setFps(Number(e.target.value))}
              className="flex-1 accent-accent-blue"
            />
            <span className="w-12 text-right text-xs text-muted-foreground">{fps} fps</span>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="mx-auto mt-4 flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <FileUp className="h-4 w-4" /> {t("pickAnother")}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Receiver: camera scan → reassemble ──────────────────────────────────────
function BeamReceive({ t, onBack }: { t: T; onBack: () => void }) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [received, setReceived] = useState(0);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const collectorRef = useRef(new BeamCollector());
  const finishedRef = useRef(false);

  useEffect(() => {
    setSupported(
      getBarcodeDetector() !== null &&
        typeof navigator !== "undefined" &&
        typeof navigator.mediaDevices?.getUserMedia === "function",
    );
  }, []);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const { bytes, meta } = collectorRef.current.assemble();
    const blob = new Blob([bytes.buffer as ArrayBuffer], {
      type: meta.mime.includes("/") ? meta.mime : "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = meta.name;
    a.click();
    URL.revokeObjectURL(url);
    setDone(meta.name);
  }, []);

  useEffect(() => {
    if (supported !== true) return;
    const Ctor = getBarcodeDetector();
    if (!Ctor) return;
    let cancelled = false;
    const detector = new Ctor({ formats: ["qr_code"] });

    const tick = async () => {
      const video = videoRef.current;
      if (cancelled || finishedRef.current || !video) return;
      if (video.readyState >= 2 && video.videoWidth > 0) {
        try {
          const codes = await detector.detect(video);
          let changed = false;
          for (const c of codes) if (c.rawValue && collectorRef.current.add(c.rawValue)) changed = true;
          if (changed) {
            setReceived(collectorRef.current.received);
            setTotal(collectorRef.current.meta?.total ?? 0);
            if (collectorRef.current.complete) {
              finish();
              return;
            }
          }
        } catch {
          /* transient decode error */
        }
      }
      rafRef.current = requestAnimationFrame(() => void tick());
    };

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          for (const tr of stream.getTracks()) tr.stop();
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play().catch(() => {});
        void tick();
      } catch {
        if (!cancelled) setError(t("cameraError"));
      }
    };

    void start();
    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      const s = streamRef.current;
      if (s) for (const tr of s.getTracks()) tr.stop();
      streamRef.current = null;
    };
  }, [supported, finish, t]);

  if (supported === false) {
    return (
      <div className="py-2">
        <BeamHeader title={t("receiveTitle")} onBack={onBack} />
        <p className="py-10 text-center text-sm text-muted-foreground">{t("unsupported")}</p>
      </div>
    );
  }

  const pct = total > 0 ? Math.round((received / total) * 100) : 0;

  return (
    <div className="py-2">
      <BeamHeader title={t("receiveTitle")} onBack={onBack} />
      {done ? (
        <div className="py-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
            <ScanLine className="h-6 w-6" />
          </div>
          <p className="font-medium text-success">{t("receivedTitle")}</p>
          <p className="mt-1 truncate px-6 text-sm text-muted-foreground">{done}</p>
          <button
            onClick={onBack}
            className="mx-auto mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            {t("doneBtn")}
          </button>
        </div>
      ) : (
        <div className="mt-2">
          <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-2xl border border-border bg-black">
            <video ref={videoRef} className="size-full object-cover" autoPlay muted playsInline />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="size-44 rounded-lg border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>
          </div>
          <div className="mx-auto mt-4 max-w-xs">
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-accent-blue transition-[width] duration-200"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1.5 text-center text-xs text-muted-foreground">
              {total === 0
                ? t("aimHint")
                : `${t("receiving")} · ${t("chunksOf", { i: received, n: total })} (${pct}%)`}
            </p>
          </div>
          {error && <p className="mt-3 text-center text-sm text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}

function BeamHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <button
        onClick={onBack}
        aria-label="Back"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="text-sm font-semibold">{title}</p>
    </div>
  );
}
