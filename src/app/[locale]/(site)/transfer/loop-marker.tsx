"use client";

import { useEffect } from "react";
import { markLoopVisit } from "@/lib/loop";

/**
 * Renders nothing. On the send tool it checks whether this visit came from a
 * transfer page's "Send a file" button and, if so, counts it once and
 * remembers it for the session so the upload that follows can be counted too.
 */
export function LoopMarker() {
  useEffect(() => {
    markLoopVisit();
  }, []);
  return null;
}
