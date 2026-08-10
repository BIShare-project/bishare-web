"use client";

import { useState } from "react";
import { getShareDownloadURL } from "@/lib/api";
import { Button } from "@/components/site/ui/button";
import { Download, Loader2, CheckCircle2 } from "lucide-react";

/**
 * Start a browser download through a hidden anchor instead of navigating
 * `window.location` at the file URL (review #16): the page — and any
 * one-time/expiry state it is showing — stays alive if the server answers
 * with an error, and in-flight React state is never torn down mid-download.
 */
export function triggerBrowserDownload(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => a.remove(), 1000);
}

const SHARE_ERRORS: Record<string, string> = {
  SHARE_EXPIRED: "This share link has expired.",
  SHARE_DOWNLOAD_LIMIT: "This link has reached its download limit.",
  SHARE_PASSWORD_REQUIRED: "This link requires a password — reload the page to enter it.",
  NOT_FOUND: "This share link no longer exists.",
  RATE_LIMITED: "Too many requests — wait a moment and try again.",
  NETWORK_ERROR: "Connection problem — check your network and try again.",
  SERVER_ERROR: "Something went wrong on our side — please try again shortly.",
};

export function DownloadButton({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleDownload() {
    setState("loading");
    setErrorMsg("");
    try {
      const res = await getShareDownloadURL(token);
      if (res.success && res.data?.download_url) {
        triggerBrowserDownload(res.data.download_url);
        setState("done");
      } else {
        setErrorMsg(
          SHARE_ERRORS[res.error?.code ?? ""] ?? res.error?.message ?? "Download failed — please try again."
        );
        setState("error");
      }
    } catch {
      setErrorMsg(SHARE_ERRORS.NETWORK_ERROR);
      setState("error");
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleDownload} disabled={state === "loading"} size="lg" className="w-full">
        {state === "loading" && <Loader2 className="animate-spin" />}
        {state === "done" && <CheckCircle2 />}
        {state === "idle" && <Download />}
        {state === "loading"
          ? "Preparing…"
          : state === "done"
            ? "Download started"
            : state === "error"
              ? "Try again"
              : "Download file"}
      </Button>
      {state === "done" && (
        <p className="text-center text-xs text-muted-foreground">
          Didn&apos;t start? Tap the button again.
        </p>
      )}
      {state === "error" && <p className="text-center text-sm text-destructive">{errorMsg}</p>}
    </div>
  );
}
