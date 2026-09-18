"use client";

import { useEffect } from "react";
import { markLoopVisit } from "@/lib/loop";

/**
 * Renders nothing. The server counts `loop_sends` when this page is opened
 * from a transfer's "Send a file" button; this remembers that for the rest of
 * the session so the upload that follows can be counted too.
 */
export function LoopMarker() {
  useEffect(() => {
    markLoopVisit();
  }, []);
  return null;
}
