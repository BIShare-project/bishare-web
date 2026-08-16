"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { formatFileSize, formatExpiry } from "@/lib/format";
import {
  deleteTransfer,
  getTransferUploadURL,
  getTransferUploadUrlEndpoint,
  getTransferMaxFileSizeFree,
  isBlockedFileType,
  initTransferMultipart,
  refreshTransferPartUrls,
  completeTransferMultipart,
  TRANSFER_MAX_FILE_SIZE_FREE_FALLBACK,
} from "@/lib/api";
import {
  forgetTransfer,
  rememberTransfer,
} from "@/app/[locale]/(site)/transfer/recent-transfers";
import { EncryptedSource, generateKey, encodeKey, maxPlaintextFor } from "@/lib/e2e/crypto";
import { FilePreviewDialog } from "@/components/file-preview-dialog";
import { buildStoreZip } from "@/lib/zip";
import type { TransferUploadResponse } from "@/lib/types";
import { Button } from "@/components/site/ui/button";
import { GlowProgress, SuccessCheck } from "@/components/flow-shell";
import { QRDisplay } from "@/components/site/qr-display";
import { TagBadge } from "@/components/site/status-pill";
import { TransferEmailForm } from "@/components/transfer-email-form";
import {
  CheckCircle2,
  Clock,
  Copy,
  FileUp,
  Flame,
  Loader2,
  Lock,
  QrCode,
  Share2,
  Package,
  Trash2,
  Upload,
  X,
} from "lucide-react";

/** next-intl translator for the "tool" namespace, threaded into the pure
 *  upload helpers so their error strings stay localized. */
type Translator = ReturnType<typeof useTranslations>;

type EntryStatus = "blocked" | "pending" | "uploading" | "done" | "error" | "deleted";

interface UploadEntry {
  id: string;
  file: File;
  progress: number;
  status: EntryStatus;
  errorMsg?: string;
  /** Display code (ABC-DEF). */
  code?: string;
  /** Raw 6-char code used in URLs and the delete endpoint. */
  rawCode?: string;
  webURL?: string;
  expiresAt?: string;
  deleteToken?: string;
  oneTime?: boolean;
  /** End-to-end encrypted: key lives in the link fragment (#k=…), so the file
   *  is shareable by link/QR only — the 6-char code + email can't carry it. */
  encrypted?: boolean;
  copied?: "link" | "code" | null;
  deleting?: boolean;
  confirmDelete?: boolean;
  deleteError?: string;
}

let entryCounter = 0;

/**
 * Stall watchdog window (review #14/#24): the old fixed 10-minute
 * `xhr.timeout` killed slow-but-alive uploads of large files. Instead we
 * abort only when NO bytes move (and no response state changes) for this
 * long.
 */
const UPLOAD_STALL_TIMEOUT_MS = 60_000;

/**
 * Files above this go DIRECT to R2 via a presigned PUT (POST /transfer/upload-url
 * → uploadUrl), bypassing the ~100 MB Cloudflare Worker request-body limit that
 * makes larger single-POST uploads fail with a bare "Network error". Smaller
 * files keep streaming through the Worker (same-origin, no R2 CORS needed).
 */
const PRESIGN_THRESHOLD = 90 * 1024 * 1024; // 90 MiB

/**
 * Files above this use the RESUMABLE multipart path (POST /transfer/multipart/*)
 * instead of a single presigned PUT: the file is uploaded in 50 MiB parts, each
 * retried independently, and progress survives a dropped connection or even a
 * page reload (state is fingerprinted in localStorage). Below it, a single PUT
 * is simpler and fast enough. Keep at/above the server's part size.
 */
const MULTIPART_THRESHOLD = 100 * 1024 * 1024; // 100 MiB
const MULTIPART_PART_RETRIES = 4;
const MP_RESUME_PREFIX = "bishare-mp:";
const MP_RESUME_TTL_MS = 24 * 60 * 60 * 1000; // matches the server's 24 h GC

interface MpState {
  uploadId: string;
  storageKey: string;
  partSize: number;
  totalParts: number;
  completed: number[]; // part numbers already uploaded
  size: number;
  createdAt: number;
}

/** Per-file fingerprint so a re-selected same file resumes its upload. */
function mpKey(file: File): string {
  return `${MP_RESUME_PREFIX}${file.name}:${file.size}:${file.lastModified}`;
}

function loadMpState(file: File): MpState | null {
  try {
    const raw = localStorage.getItem(mpKey(file));
    if (!raw) return null;
    const s = JSON.parse(raw) as MpState;
    if (!s || s.size !== file.size || Date.now() - s.createdAt > MP_RESUME_TTL_MS) {
      localStorage.removeItem(mpKey(file));
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

function saveMpState(file: File, s: MpState): void {
  try {
    localStorage.setItem(mpKey(file), JSON.stringify(s));
  } catch {
    // storage full / disabled — resume-across-reload is best-effort only.
  }
}

function clearMpState(file: File): void {
  try {
    localStorage.removeItem(mpKey(file));
  } catch {
    // ignore
  }
}

type UploadResult = Pick<
  TransferUploadResponse,
  "code" | "rawCode" | "expiresAt" | "deleteToken"
>;

/** XHR upload with progress + stall watchdog. Resolves the xhr on 2xx. */
function sendXhr(opts: {
  method: string;
  url: string;
  headers: Record<string, string>;
  // File-backed Blobs stay on disk; synthesized ciphertext is passed as a raw
  // view instead, which the GC reclaims per part (see uploadEncrypted).
  body: Blob | ArrayBufferView<ArrayBuffer>;
  onProgress: (pct: number) => void;
  t: Translator;
  signal?: AbortSignal;
}): Promise<XMLHttpRequest> {
  const { t, signal } = opts;
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error(t("upload.errors.canceled")));
      return;
    }
    const xhr = new XMLHttpRequest();
    let stalled = false;
    let stallTimer: ReturnType<typeof setTimeout> | undefined;
    const arm = () => {
      clearTimeout(stallTimer);
      stallTimer = setTimeout(() => {
        stalled = true;
        xhr.abort();
      }, UPLOAD_STALL_TIMEOUT_MS);
    };
    // User-initiated cancel: abort the request; onabort rejects with "canceled".
    const onAbort = () => xhr.abort();
    signal?.addEventListener("abort", onAbort);
    const cleanup = () => {
      clearTimeout(stallTimer);
      signal?.removeEventListener("abort", onAbort);
    };
    xhr.open(opts.method, opts.url);
    for (const [k, v] of Object.entries(opts.headers)) {
      xhr.setRequestHeader(k, v);
    }
    xhr.upload.onprogress = (e) => {
      arm();
      if (e.lengthComputable) opts.onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onreadystatechange = () => arm();
    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr);
        return;
      }
      let msg = t("upload.errors.uploadFailedStatus", { status: xhr.status });
      try {
        const b = JSON.parse(xhr.responseText);
        if (b?.error?.message) msg = b.error.message;
      } catch {
        /* R2 returns XML on error — keep the generic message */
      }
      reject(new Error(msg));
    };
    xhr.onerror = () => {
      cleanup();
      reject(new Error(t("upload.errors.networkError")));
    };
    xhr.onabort = () => {
      cleanup();
      reject(
        new Error(
          stalled
            ? t("upload.errors.stalled")
            : t("upload.errors.canceled")
        )
      );
    };
    arm();
    xhr.send(opts.body);
  });
}

/**
 * Resumable upload for large files: init (or resume from localStorage) → PUT
 * each 50 MiB part straight to R2, retrying and re-presigning per part → complete
 * (the server reads the part list/ETags itself). A dropped connection retries the
 * current part; a page reload resumes from the last saved part when the same file
 * is re-selected. ETags are never read client-side, so no extra R2 CORS is needed.
 */
async function uploadMultipart(
  file: File,
  oneTime: boolean,
  onProgress: (pct: number) => void,
  t: Translator,
  signal?: AbortSignal
): Promise<UploadResult> {
  const mimeType = file.type || "application/octet-stream";
  let state = loadMpState(file);
  const partUrls = new Map<number, string>();

  if (!state) {
    const init = await initTransferMultipart({ name: file.name, size: file.size, mime_type: mimeType });
    if (!init.success || !init.uploadId || !init.storageKey || !init.partSize || !init.totalParts) {
      throw new Error(init.error?.message || t("upload.errors.couldNotStart", { status: 0 }));
    }
    state = {
      uploadId: init.uploadId,
      storageKey: init.storageKey,
      partSize: init.partSize,
      totalParts: init.totalParts,
      completed: [],
      size: file.size,
      createdAt: Date.now(),
    };
    for (const p of init.parts ?? []) partUrls.set(p.part_number, p.upload_url);
    saveMpState(file, state);
  }

  const { partSize, totalParts, uploadId, storageKey } = state;
  const completed = new Set(state.completed);
  const doneBytes = () =>
    [...completed].reduce((sum, pn) => sum + Math.min(partSize, file.size - (pn - 1) * partSize), 0);
  const report = (currentLoaded: number) =>
    onProgress(Math.min(100, Math.round(((doneBytes() + currentLoaded) / file.size) * 100)));
  report(0);

  async function partUrl(p: number): Promise<string> {
    const cached = partUrls.get(p);
    if (cached) return cached;
    const r = await refreshTransferPartUrls({ uploadId, storageKey, partNumbers: [p] });
    const url = r.success ? r.parts?.[0]?.upload_url : undefined;
    if (!url) throw new Error(r.error?.message || t("upload.errors.uploadFailed"));
    partUrls.set(p, url);
    return url;
  }

  for (let p = 1; p <= totalParts; p++) {
    if (completed.has(p)) continue;
    const start = (p - 1) * partSize;
    const blob = file.slice(start, Math.min(start + partSize, file.size));

    for (let attempt = 0; ; attempt++) {
      if (signal?.aborted) throw new Error(t("upload.errors.canceled"));
      try {
        const url = await partUrl(p);
        // No Content-Type: the UploadPart URL isn't signed for one (blob type is
        // empty), so the browser sends none and the signature still matches.
        await sendXhr({
          method: "PUT",
          url,
          headers: {},
          body: blob,
          onProgress: (pct) => report((pct / 100) * blob.size),
          t,
          signal,
        });
        break;
      } catch (e) {
        // A user cancel must not be retried — surface it immediately.
        if (signal?.aborted) throw e;
        if (attempt >= MULTIPART_PART_RETRIES) throw e;
        partUrls.delete(p); // force a fresh presign in case the URL expired
      }
    }

    completed.add(p);
    state.completed = [...completed];
    saveMpState(file, state);
    report(0);
  }

  const done = await completeTransferMultipart({
    uploadId,
    storageKey,
    name: file.name,
    size: file.size,
    mime_type: mimeType,
    sender_alias: "Web Upload",
    one_time: oneTime,
  });
  if (!done.success || !done.rawCode || !done.code || !done.expiresAt || !done.deleteToken) {
    throw new Error(done.error?.message || t("upload.errors.uploadFailed"));
  }
  clearMpState(file);
  return {
    code: done.code,
    rawCode: done.rawCode,
    expiresAt: done.expiresAt,
    deleteToken: done.deleteToken,
  };
}

/**
 * End-to-end encrypted upload. The file is encrypted in the browser (chunked
 * AES-256-GCM, see lib/e2e/crypto) and only ciphertext is uploaded — via the
 * same multipart machinery, since the ciphertext is just opaque bytes to the
 * server. The key never leaves the browser; the caller puts it in the link
 * fragment. Ciphertext size is deterministic, so we can reserve the multipart
 * upload up front; a failed part re-PUTs the same deterministic bytes. There is
 * no cross-reload resume here (the key isn't persisted — that's the point).
 */
async function uploadEncrypted(
  file: File,
  oneTime: boolean,
  onProgress: (pct: number) => void,
  t: Translator,
  signal?: AbortSignal
): Promise<UploadResult & { keyEnc: string }> {
  const mimeType = file.type || "application/octet-stream";
  const { key, raw } = await generateKey();
  const salt = new Uint8Array(4);
  crypto.getRandomValues(salt);
  const source = new EncryptedSource(file, key, salt);
  const ctSize = source.size;

  const init = await initTransferMultipart({ name: file.name, size: ctSize, mime_type: mimeType });
  if (!init.success || !init.uploadId || !init.storageKey || !init.partSize || !init.totalParts) {
    throw new Error(init.error?.message || t("upload.errors.couldNotStart", { status: 0 }));
  }
  const { uploadId, storageKey, partSize, totalParts } = init;
  const partUrls = new Map<number, string>();
  for (const p of init.parts ?? []) partUrls.set(p.part_number, p.upload_url);

  async function partUrl(p: number): Promise<string> {
    const cached = partUrls.get(p);
    if (cached) return cached;
    const r = await refreshTransferPartUrls({ uploadId, storageKey, partNumbers: [p] });
    const url = r.success ? r.parts?.[0]?.upload_url : undefined;
    if (!url) throw new Error(r.error?.message || t("upload.errors.uploadFailed"));
    partUrls.set(p, url);
    return url;
  }

  let doneBytes = 0;
  const report = (loaded: number) =>
    onProgress(Math.min(100, Math.round(((doneBytes + loaded) / ctSize) * 100)));
  report(0);

  for (let p = 1; p <= totalParts; p++) {
    const start = (p - 1) * partSize;
    const end = Math.min(start + partSize, ctSize);
    const bytes = await source.slice(start, end); // deterministic → safe to retry
    // Send the view itself — never `new Blob([bytes])`. Every synthesized Blob
    // is registered in Chromium's blob store and only released on GC, so a
    // 205-part loop piled up faster than it could collect and died with
    // ERR_BLOB_OUT_OF_MEMORY around 2 GiB. A plain view is ordinary heap the
    // collector reclaims between parts. (The unencrypted path slices the File,
    // which stays disk-backed, so it was never affected.)
    const partBytes = bytes.byteLength;
    for (let attempt = 0; ; attempt++) {
      if (signal?.aborted) throw new Error(t("upload.errors.canceled"));
      try {
        const url = await partUrl(p);
        await sendXhr({
          method: "PUT",
          url,
          headers: {},
          body: bytes,
          onProgress: (pct) => report((pct / 100) * partBytes),
          t,
          signal,
        });
        break;
      } catch (e) {
        if (signal?.aborted) throw e;
        if (attempt >= MULTIPART_PART_RETRIES) throw e;
        partUrls.delete(p); // force a fresh presign in case the URL expired
      }
    }
    doneBytes += partBytes;
    report(0);
  }

  const done = await completeTransferMultipart({
    uploadId,
    storageKey,
    name: file.name,
    size: ctSize,
    mime_type: mimeType,
    sender_alias: "Web Upload",
    one_time: oneTime,
  });
  if (!done.success || !done.rawCode || !done.code || !done.expiresAt || !done.deleteToken) {
    throw new Error(done.error?.message || t("upload.errors.uploadFailed"));
  }
  return {
    code: done.code,
    rawCode: done.rawCode,
    expiresAt: done.expiresAt,
    deleteToken: done.deleteToken,
    keyEnc: encodeKey(raw),
  };
}

/** Upload one file, picking the presigned-R2 path for large files. */
async function uploadEntry(
  file: File,
  oneTime: boolean,
  onProgress: (pct: number) => void,
  t: Translator,
  signal?: AbortSignal,
  encrypt = false
): Promise<UploadResult & { keyEnc?: string }> {
  // End-to-end encrypted: encrypt in-browser, upload ciphertext (any size).
  if (encrypt) {
    return uploadEncrypted(file, oneTime, onProgress, t, signal);
  }
  // Largest files: resumable multipart (survives drops + reloads).
  if (file.size > MULTIPART_THRESHOLD) {
    return uploadMultipart(file, oneTime, onProgress, t, signal);
  }
  if (file.size > PRESIGN_THRESHOLD) {
    // 1) reserve the transfer + get a presigned R2 PUT URL
    const res = await fetch(getTransferUploadUrlEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: file.name,
        size: file.size,
        mime_type: file.type || "application/octet-stream",
        sender_alias: "Web Upload",
        one_time: oneTime,
      }),
    });
    const meta = (await res.json().catch(() => ({}))) as TransferUploadResponse & {
      uploadUrl?: string;
      uploadHeaders?: Record<string, string>;
    };
    if (!res.ok || !meta.success || !meta.uploadUrl) {
      throw new Error(
        meta.error?.message ||
          t("upload.errors.couldNotStart", { status: res.status })
      );
    }
    // 2) PUT the bytes straight to R2 — must echo the signed Content-Type
    await sendXhr({
      method: "PUT",
      url: meta.uploadUrl,
      headers: {
        "Content-Type":
          meta.uploadHeaders?.["Content-Type"] || file.type || "application/octet-stream",
      },
      body: file,
      onProgress,
      t,
      signal,
    });
    return {
      code: meta.code,
      rawCode: meta.rawCode,
      expiresAt: meta.expiresAt,
      deleteToken: meta.deleteToken,
    };
  }

  // Small file: stream through the Worker (same-origin, no CORS dependency).
  const xhr = await sendXhr({
    method: "POST",
    url: getTransferUploadURL(),
    headers: {
      "X-File-Name": encodeURIComponent(file.name),
      "X-File-Type": file.type || "application/octet-stream",
      "X-Sender-Alias": "Web Upload",
      ...(oneTime ? { "X-One-Time": "true" } : {}),
    },
    body: file,
    onProgress,
    t,
    signal,
  });
  const res = JSON.parse(xhr.responseText) as TransferUploadResponse;
  if (!res.success)
    throw new Error(res.error?.message || t("upload.errors.uploadFailed"));
  return {
    code: res.code,
    rawCode: res.rawCode,
    expiresAt: res.expiresAt,
    deleteToken: res.deleteToken,
  };
}

/** Client-side mirror of the backend upload rules — avoids opaque 500s. */
function validateFile(
  file: File,
  maxFileSize: number,
  t: Translator,
  encrypted = false
): string | null {
  if (isBlockedFileType(file.name)) {
    const dot = file.name.lastIndexOf(".");
    const ext = dot >= 0 ? file.name.slice(dot) : "";
    return t("upload.errors.blockedType", { ext });
  }
  // Encrypted uploads reserve the transfer by CIPHERTEXT size (header + a tag
  // per record), so the real plaintext ceiling sits just under the plan limit.
  // Checking the raw size here let a file within ~160 KiB of 10 GiB start and
  // then die on a bare 413 from the relay.
  const effectiveMax = encrypted ? maxPlaintextFor(maxFileSize) : maxFileSize;
  if (file.size > effectiveMax) {
    return t("upload.errors.tooLarge", { size: formatFileSize(effectiveMax) });
  }
  if (file.size <= 0) {
    return t("upload.errors.empty");
  }
  return null;
}

/** Name for a bundle the user never named — dated so two sends don't collide. */
function zipArchiveName(files: File[]): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate(),
  ).padStart(2, "0")}`;
  return `bishare-${files.length}-files-${stamp}.zip`;
}

/** Big segmented code display (ABC-DEF) for the success view. */
function CodeBoxes({ code }: { code: string }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      {code.split("").map((char, i) => (
        <span
          key={i}
          className={cn(
            "inline-flex h-13 w-10 items-center justify-center rounded-[14px] border border-primary/25 bg-primary/[0.07] font-mono text-xl font-bold text-foreground shadow-[0_0_18px_-8px_rgba(59,130,246,0.5)] sm:h-14 sm:w-11",
            char === "-" &&
              "w-4 border-0 bg-transparent text-muted-foreground shadow-none sm:w-4"
          )}
        >
          {char}
        </span>
      ))}
    </div>
  );
}

export function FileUpload() {
  const t = useTranslations("tool");
  const locale = useLocale();
  const expiryLabels = { expired: t("expired"), lessThanHour: t("lessThanHour") };
  const [files, setFiles] = useState<UploadEntry[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [oneTime, setOneTime] = useState(false);
  // End-to-end encryption ON by default (privacy-first): the file is encrypted
  // in-browser and only ciphertext is uploaded; the key lives in the link
  // fragment (#k=), so the relay is zero-knowledge. Users can still toggle off.
  const [encrypt, setEncrypt] = useState(true);
  const [expandedQR, setExpandedQR] = useState<string | null>(null);
  // The file whose preview dialog is open — tapping a card inside the drop box.
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  // Several files, one link. On by default because the alternative — handing
  // someone five links for one send — is the thing people complain about.
  const [combine, setCombine] = useState(true);
  const [zipping, setZipping] = useState(0); // 0–100 while hashing for the archive
  const fileInputRef = useRef<HTMLInputElement>(null);
  const copyTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  /** Aborts the in-flight upload batch (Cancel button + page-leave guard). */
  const abortRef = useRef<AbortController | null>(null);

  // Warn before a refresh/navigation drops an in-progress upload (browsers show
  // a generic "leave site?" prompt when beforeunload is cancelled).
  useEffect(() => {
    if (!isUploading) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isUploading]);

  // Anonymous/free size ceiling from GET /api/v1/config (1 GiB fallback until
  // it resolves).
  const [maxFileSize, setMaxFileSize] = useState(TRANSFER_MAX_FILE_SIZE_FREE_FALLBACK);
  useEffect(() => {
    let alive = true;
    getTransferMaxFileSizeFree().then((limit) => {
      if (alive) setMaxFileSize(limit);
    });
    return () => {
      alive = false;
    };
  }, []);

  const updateEntry = useCallback((id: string, updates: Partial<UploadEntry>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles: UploadEntry[] = acceptedFiles.map((file) => {
        const error = validateFile(file, maxFileSize, t, encrypt);
        return {
          id: `upload-${++entryCounter}`,
          file,
          progress: 0,
          status: error ? ("blocked" as const) : ("pending" as const),
          errorMsg: error ?? undefined,
        };
      });
      setFiles((prev) => [...prev, ...newFiles]);
    },
    [maxFileSize, t, encrypt]
  );

  const { getRootProps, isDragActive } = useDropzone({
    multiple: true,
    noClick: true,
    noKeyboard: true, // we run our own keyboard affordance on the visible zone
    onDrop,
  });

  function openPicker() {
    if (!isUploading) fileInputRef.current?.click();
  }

  function removeFile(id: string) {
    if (isUploading) return;
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function uploadAll() {
    if (isUploading) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setIsUploading(true);
    const sendOneTime = oneTime;
    const sendEncrypt = encrypt;
    let snapshot = [...files];

    // Bundle first, so what follows is an ordinary single-file upload. The
    // archive stores (never deflates), so it references the picked files
    // instead of copying them — the CRC pass is the only time the bytes are
    // read, and even that is chunked.
    const toBundle = snapshot.filter((f) => f.status === "pending");
    if (combine && toBundle.length > 1) {
      try {
        setZipping(1);
        const blob = await buildStoreZip(
          toBundle.map((f) => f.file),
          ({ hashed, total }) =>
            setZipping(total ? Math.max(1, Math.round((hashed / total) * 100)) : 100),
        );
        const zipFile = new File([blob], zipArchiveName(toBundle.map((f) => f.file)), {
          type: "application/zip",
          lastModified: Date.now(),
        });
        const error = validateFile(zipFile, maxFileSize, t, encrypt);
        if (error) {
          setZipping(0);
          setIsUploading(false);
          updateEntry(toBundle[0]!.id, { status: "error", errorMsg: error });
          return;
        }
        const zipEntry: UploadEntry = {
          id: `upload-${++entryCounter}`,
          file: zipFile,
          progress: 0,
          status: "pending",
        };
        // The picked files collapse into the one thing actually being sent.
        snapshot = [zipEntry];
        setFiles([zipEntry]);
      } catch {
        setZipping(0);
        setIsUploading(false);
        updateEntry(toBundle[0]!.id, {
          status: "error",
          errorMsg: t("upload.errors.zipFailed"),
        });
        return;
      } finally {
        setZipping(0);
      }
    }

    try {
    for (const entry of snapshot) {
      if (entry.status !== "pending") continue;
      // User cancelled between files — mark the rest and stop.
      if (controller.signal.aborted) {
        updateEntry(entry.id, {
          status: "error",
          errorMsg: t("upload.errors.canceled"),
        });
        continue;
      }
      updateEntry(entry.id, { status: "uploading" });

      try {
        const result = await uploadEntry(
          entry.file,
          sendOneTime,
          (p) => updateEntry(entry.id, { progress: p }),
          t,
          controller.signal,
          sendEncrypt
        );

        const origin =
          typeof window !== "undefined" ? window.location.origin : "https://bishare.app";
        // The decryption key rides in the link fragment (#k=…) — never sent to
        // the server, so it must travel in the shareable URL / QR.
        const fragment = result.keyEnc ? `#k=${result.keyEnc}` : "";
        const done: Partial<UploadEntry> = {
          status: "done",
          progress: 100,
          code: result.code,
          rawCode: result.rawCode,
          webURL: `${origin}/transfer/${result.rawCode}${fragment}`,
          expiresAt: result.expiresAt,
          deleteToken: result.deleteToken,
          oneTime: sendOneTime,
          encrypted: !!result.keyEnc,
        };
        updateEntry(entry.id, done);
        if (result.rawCode) {
          rememberTransfer({
            rawCode: result.rawCode,
            deleteToken: result.deleteToken,
            fileName: entry.file.name,
            expiresAt: result.expiresAt,
            oneTime: sendOneTime,
          });
        }
      } catch (err) {
        updateEntry(entry.id, {
          status: "error",
          errorMsg:
            err instanceof Error ? err.message : t("upload.errors.uploadFailed"),
        });
      }
    }
    } finally {
      abortRef.current = null;
      setIsUploading(false);
    }
  }

  /** Abort every in-flight upload in the current batch. */
  function cancelAll() {
    abortRef.current?.abort();
  }

  function copyText(id: string, field: "link" | "code", text: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
    updateEntry(id, { copied: field });
    clearTimeout(copyTimers.current[id]);
    copyTimers.current[id] = setTimeout(() => updateEntry(id, { copied: null }), 2000);
  }

  async function handleDelete(entry: UploadEntry) {
    if (!entry.rawCode || !entry.deleteToken) return;
    if (!entry.confirmDelete) {
      updateEntry(entry.id, { confirmDelete: true, deleteError: undefined });
      return;
    }
    updateEntry(entry.id, { deleting: true });
    const res = await deleteTransfer(entry.rawCode, entry.deleteToken);
    if (res.success) {
      forgetTransfer(entry.rawCode);
      updateEntry(entry.id, { status: "deleted", deleting: false, confirmDelete: false });
    } else {
      updateEntry(entry.id, {
        deleting: false,
        confirmDelete: false,
        deleteError: res.error?.message || t("upload.errors.deleteFailed"),
      });
    }
  }

  function resetAll() {
    setFiles([]);
    setExpandedQR(null);
    setOneTime(false);
    setEncrypt(false);
  }

  const completedFiles = files.filter((f) => f.status === "done" || f.status === "deleted");
  const pendingFiles = files.filter((f) => f.status === "pending");
  const allSettled =
    files.length > 0 &&
    !isUploading &&
    files.every((f) => f.status !== "pending" && f.status !== "uploading");

  // ── Result view ──
  if (allSettled && completedFiles.length > 0) {
    const failed = files.filter((f) => f.status === "error" || f.status === "blocked");
    const single = completedFiles.length === 1 && failed.length === 0 ? completedFiles[0] : null;

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
            <SuccessCheck size={76} />
          </div>
          <h3 className="text-2xl font-semibold tracking-tight">{t("upload.readyTitle")}</h3>
          <p className="text-sm text-muted-foreground">
            {completedFiles.length === 1
              ? t("upload.readySingle")
              : t("upload.readyMulti", { count: completedFiles.length })}
          </p>
        </div>

        {/* Single-file: hero QR + code */}
        {single && single.status === "done" && single.webURL && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col items-center gap-5"
          >
            <QRDisplay value={single.webURL} size={168} />
            {single.encrypted ? (
              <div className="flex flex-col items-center gap-1.5 text-center">
                <TagBadge>
                  <Lock className="h-3 w-3" />
                  {t("upload.encryptedBadge")}
                </TagBadge>
                <p className="max-w-xs text-xs text-muted-foreground">
                  {t("upload.encryptedShareNote")}
                </p>
              </div>
            ) : (
              single.code && (
                <div className="text-center">
                  <p className="mb-2.5 text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
                    {t("upload.orEnterCode")}
                  </p>
                  <CodeBoxes code={single.code} />
                </div>
              )
            )}
          </motion.div>
        )}

        {/* Single-file: email the link straight to a recipient (not for E2E —
            the server-composed email can't carry the fragment key). */}
        {single && single.status === "done" && single.rawCode && !single.encrypted && (
          <TransferEmailForm code={single.rawCode} />
        )}

        {/* Per-file result cards */}
        <div className="space-y-3">
          {completedFiles.map((f) => (
            <div
              key={f.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              {f.status === "deleted" ? (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Trash2 className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{f.file.name}</span>
                  <span className="shrink-0 text-xs font-medium">{t("upload.deletedLabel")}</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{f.file.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatFileSize(f.file.size, locale)}
                    </span>
                    {f.oneTime && <TagBadge>{t("upload.oneTimeBadge")}</TagBadge>}
                  </div>


                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={f.webURL || ""}
                      aria-label={t("upload.shareLinkAria", { name: f.file.name })}
                      className="h-9 min-w-0 flex-1 select-all rounded-[10px] border border-input bg-muted/40 px-3 font-mono text-xs text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <Button
                      onClick={() => copyText(f.id, "link", f.webURL || "")}
                      variant="outline"
                      size="icon-sm"
                      aria-label={t("upload.copyLinkAria")}
                    >
                      {f.copied === "link" ? <CheckCircle2 className="text-success" /> : <Copy />}
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
                    {f.encrypted ? (
                      <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-accent-blue/[0.08] px-2 py-1 font-medium text-accent-blue">
                        <Lock className="h-3 w-3" />
                        {t("upload.encryptedBadge")}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => copyText(f.id, "code", f.code || "")}
                        className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary/[0.08] px-2 py-1 font-mono text-xs font-bold text-primary transition-colors hover:bg-primary/[0.14]"
                      >
                        {f.code}
                        {f.copied === "code" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    )}
                    {f.expiresAt && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {t("upload.expiresIn", { time: formatExpiry(f.expiresAt, locale, expiryLabels) })}
                      </span>
                    )}
                    {!single && (
                      <button
                        type="button"
                        onClick={() => setExpandedQR(expandedQR === f.id ? null : f.id)}
                        className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                      >
                        <QrCode className="h-3 w-3" />
                        {expandedQR === f.id ? t("upload.hideQr") : t("upload.qrCode")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(f)}
                      disabled={f.deleting}
                      className="ml-auto inline-flex items-center gap-1 text-destructive/80 transition-colors hover:text-destructive disabled:opacity-60"
                    >
                      {f.deleting ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                      {f.confirmDelete
                        ? t("upload.confirmDelete")
                        : f.deleting
                          ? t("upload.deleting")
                          : t("upload.delete")}
                    </button>
                  </div>

                  {f.deleteError && <p className="text-xs text-destructive">{f.deleteError}</p>}

                  <AnimatePresence>
                    {expandedQR === f.id && f.webURL && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex justify-center overflow-hidden pt-1"
                      >
                        <QRDisplay value={f.webURL} size={144} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          ))}

          {failed.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/[0.04] p-4 text-sm"
            >
              <X className="h-4 w-4 shrink-0 text-destructive" />
              <span className="min-w-0 flex-1 truncate">{f.file.name}</span>
              <span className="shrink-0 text-xs text-destructive">{f.errorMsg}</span>
            </div>
          ))}
        </div>

        {/* Primary actions (single-file convenience) */}
        {single && single.status === "done" && single.webURL && (
          <div className="flex gap-3">
            <Button
              onClick={() => {
                if (navigator.share && single.webURL) {
                  navigator
                    .share({
                      title: single.file.name,
                      text: t("upload.shareText", { name: single.file.name }),
                      url: single.webURL,
                    })
                    .catch(() => {});
                } else if (single.webURL) {
                  copyText(single.id, "link", single.webURL);
                }
              }}
              className="flex-1"
              size="lg"
            >
              <Share2 />
              {t("upload.share")}
            </Button>
            <Button
              onClick={() => copyText(single.id, "link", single.webURL || "")}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <Copy />
              {single.copied === "link" ? t("upload.copied") : t("upload.copyLink")}
            </Button>
          </div>
        )}

        <Button onClick={resetAll} variant="ghost" className="w-full">
          <Upload />
          {t("upload.uploadMore")}
        </Button>
      </motion.div>
    );
  }

  // ── Upload view ──
  return (
    <div className="w-full space-y-4" {...getRootProps()}>
      {previewFile && (
        <FilePreviewDialog file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => {
          if (e.target.files) onDrop(Array.from(e.target.files));
          e.target.value = "";
        }}
        className="hidden"
        tabIndex={-1}
        aria-hidden
      />

      {/* Dropzone — Nightglass glass panel with dot grid, keyboard accessible */}
      <div
        role="button"
        tabIndex={0}
        aria-label={t("upload.dropzoneAria")}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        className={cn(
          "group/zone relative block w-full cursor-pointer overflow-hidden rounded-2xl border border-dashed p-5 sm:p-9 text-center outline-none",
          "transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring/40",
          isDragActive
            ? "border-foreground/40 bg-secondary"
            : "border-border bg-card hover:border-foreground/25 hover:bg-secondary/50",
          isUploading && "pointer-events-none opacity-80"
        )}
      >
        <div className="relative flex flex-col items-center">
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-blue/10 text-accent-blue transition-transform duration-200",
              isDragActive ? "scale-105" : "group-hover/zone:scale-105"
            )}
          >
            <FileUp className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <p className="mt-4 font-semibold text-foreground">
            {isDragActive ? t("upload.dropActive") : t("upload.dropIdle")}
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t.rich("upload.browse", {
              b: (chunks) => (
                <span className="font-semibold text-primary">{chunks}</span>
              ),
            })}
          </p>
          <p className="mt-3 font-mono text-[11px] tracking-[0.08em] text-muted-foreground/80 uppercase">
            {t("upload.limits", { size: formatFileSize(maxFileSize, locale) })}
          </p>
          {/* Picked files live INSIDE the box — the drop target and its
              contents are one object, and each card opens a preview on tap
              instead of trailing off as a separate list below. */}
          {files.length > 0 && (
            <div className="mt-5 w-full space-y-2 text-left">
              <AnimatePresence>
                {files.map((f) => (
                  <motion.div
                    key={f.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    role="button"
                    tabIndex={0}
                    aria-label={t("upload.previewAlt", { name: f.file.name })}
                    // The box behind these cards opens the file picker, so a tap
                    // meant for a preview must never reach it.
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewFile(f.file);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        setPreviewFile(f.file);
                      }
                    }}
                    className={cn(
                      "relative cursor-pointer rounded-xl border bg-background/60 p-3 text-left transition-colors hover:bg-secondary/70",
                      f.status === "uploading" ? "border-accent-blue/40" : "border-border",
                      f.status === "blocked" && "border-destructive/40"
                    )}
                  >
                    <div className="flex w-full items-center justify-between gap-3">
                      <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                        {f.file.name}
                      </p>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded-lg bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                          {formatFileSize(f.file.size, locale)}
                        </span>
                        {f.status === "done" && <CheckCircle2 className="h-4 w-4 text-success" />}
                        {f.status === "uploading" && (
                          <span className="font-mono text-xs font-semibold text-primary tabular-nums">
                            {f.progress}%
                          </span>
                        )}
                        {(f.status === "pending" || f.status === "error" || f.status === "blocked") &&
                          !isUploading && (
                            <button
                              type="button"
                              aria-label={t("upload.removeAria", { name: f.file.name })}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(f.id);
                              }}
                            >
                              <X className="h-4 w-4 text-muted-foreground transition-colors hover:text-destructive" />
                            </button>
                          )}
                      </div>
                    </div>
                    {f.status === "uploading" && <GlowProgress value={f.progress} className="mt-2.5" />}
                    {(f.status === "error" || f.status === "blocked") && (
                      <p className="mt-1.5 text-xs text-destructive">{f.errorMsg}</p>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {zipping > 0 && (
        <div className="rounded-2xl border border-border bg-card px-4 py-3">
          <p className="text-sm font-medium">{t("upload.zipping")}</p>
          <GlowProgress value={zipping} className="mt-2" />
        </div>
      )}

      {/* Bundle + one-time toggles + upload button */}
      {pendingFiles.length > 0 && !isUploading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {pendingFiles.length > 1 && (
            <button
              type="button"
              role="switch"
              aria-checked={combine}
              onClick={() => setCombine((v) => !v)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors duration-200",
                combine
                  ? "border-accent-blue/40 bg-accent-blue/[0.06]"
                  : "border-border bg-card hover:bg-secondary/50"
              )}
            >
              <Package
                className={cn("h-4 w-4 shrink-0", combine ? "text-accent-blue" : "text-muted-foreground")}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">
                  {t("upload.combineTitle", { count: pendingFiles.length })}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {combine ? t("upload.combineOn") : t("upload.combineOff", { count: pendingFiles.length })}
                </span>
              </span>
              <span
                className={cn(
                  "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                  combine ? "bg-accent-blue" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                    combine ? "translate-x-[1.15rem]" : "translate-x-0.5"
                  )}
                />
              </span>
            </button>
          )}
          <button
            type="button"
            role="switch"
            aria-checked={oneTime}
            onClick={() => setOneTime((v) => !v)}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors duration-200",
              oneTime
                ? "border-accent-blue/40 bg-accent-blue/[0.06]"
                : "border-border bg-card hover:bg-secondary/50"
            )}
          >
            <Flame className={cn("h-4 w-4 shrink-0", oneTime ? "text-accent-blue" : "text-muted-foreground")} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{t("upload.oneTimeTitle")}</span>
              <span className="block text-xs text-muted-foreground">
                {t("upload.oneTimeDesc")}
              </span>
            </span>
            <span
              aria-hidden
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-[180ms]",
                oneTime ? "bg-accent-blue" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-[180ms]",
                  oneTime && "translate-x-4"
                )}
              />
            </span>
          </button>

          <button
            type="button"
            role="switch"
            aria-checked={encrypt}
            onClick={() => setEncrypt((v) => !v)}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors duration-200",
              encrypt
                ? "border-accent-blue/40 bg-accent-blue/[0.06]"
                : "border-border bg-card hover:bg-secondary/50"
            )}
          >
            <Lock className={cn("h-4 w-4 shrink-0", encrypt ? "text-accent-blue" : "text-muted-foreground")} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{t("upload.encryptTitle")}</span>
              <span className="block text-xs text-muted-foreground">
                {encrypt ? t("upload.encryptDescOn") : t("upload.encryptDesc")}
              </span>
            </span>
            <span
              aria-hidden
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-[180ms]",
                encrypt ? "bg-accent-blue" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-[180ms]",
                  encrypt && "translate-x-4"
                )}
              />
            </span>
          </button>

          <Button onClick={uploadAll} className="w-full" size="lg">
            <Upload />
            {t("upload.uploadButton", { count: pendingFiles.length })}
          </Button>
        </motion.div>
      )}

      {isUploading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Button
            onClick={cancelAll}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <X className="h-4 w-4" />
            {t("upload.cancel")}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
