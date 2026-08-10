"use client";

import { useState } from "react";
import { verifySharePassword } from "@/lib/api";
import { triggerBrowserDownload } from "@/components/download-button";
import { Button } from "@/components/site/ui/button";
import { Input } from "@/components/site/ui/input";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";

const VERIFY_ERRORS: Record<string, string> = {
  SHARE_PASSWORD_WRONG: "Incorrect password — try again.",
  SHARE_EXPIRED: "This share link has expired.",
  SHARE_DOWNLOAD_LIMIT: "This link has reached its download limit.",
  NOT_FOUND: "This share link no longer exists.",
  RATE_LIMITED: "Too many attempts — wait a moment and try again.",
  NETWORK_ERROR: "Connection problem — check your network and try again.",
  SERVER_ERROR: "Something went wrong on our side — please try again shortly.",
};

export function PasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setState("loading");

    try {
      const res = await verifySharePassword(token, password);
      if (res.success && res.data?.download_url) {
        triggerBrowserDownload(res.data.download_url);
        // Mirror DownloadButton (review #6): show a "done" state instead of
        // silently re-arming — every extra submit burns download_count on
        // limited shares, so the user must know the download already started.
        setState("done");
      } else {
        setErrorMsg(
          VERIFY_ERRORS[res.error?.code ?? ""] ?? res.error?.message ?? "Verification failed — please try again."
        );
        setState("error");
      }
    } catch {
      setErrorMsg(VERIFY_ERRORS.NETWORK_ERROR);
      setState("error");
    }
  }

  return (
    <form onSubmit={handleVerify} className="space-y-3">
      <div className="relative">
        <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setState("idle");
          }}
          placeholder="Enter password"
          aria-label="Share link password"
          className="h-12 rounded-[14px] border-[var(--border-strong)] bg-card/60 pl-10 backdrop-blur focus-visible:shadow-[var(--glow-card)]"
          autoFocus
        />
      </div>
      <Button type="submit" disabled={!password || state === "loading"} size="lg" className="w-full">
        {state === "loading" && <Loader2 className="animate-spin" />}
        {state === "done" && <CheckCircle2 />}
        {state === "loading"
          ? "Verifying…"
          : state === "done"
            ? "Download started"
            : "Unlock & download"}
      </Button>
      {state === "done" && (
        <p className="text-center text-xs text-muted-foreground">
          Didn&apos;t start? Tap again.
        </p>
      )}
      {state === "error" && <p className="text-center text-sm text-destructive">{errorMsg}</p>}
    </form>
  );
}
