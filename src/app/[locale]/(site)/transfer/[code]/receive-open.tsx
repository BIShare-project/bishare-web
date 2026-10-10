"use client";

import { useEffect } from "react";
import { reportReceiveOpen } from "@/lib/loop";

/** Renders nothing. Counts this transfer page as opened by a browser. */
export function ReceiveOpen({ code }: { code: string }) {
  useEffect(() => {
    reportReceiveOpen(code);
  }, [code]);
  return null;
}
