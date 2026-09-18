import { NextResponse } from "next/server";
import { bumpStat } from "@/lib/stats-bump";

/**
 * Receive-loop conversion, second half. `loop_sends` counts the recipients who
 * pressed "Send a file" on a transfer page; this counts the ones who went on
 * to finish an upload. Without it the funnel stops at the click and we cannot
 * tell a working loop from a send page nobody completes.
 *
 * The page calls it once per session, after its first successful upload. Only
 * the count is recorded — no code, no file, nothing about the transfer — and
 * the write is best-effort, exactly like the other two.
 *
 * Lives under /api so the locale middleware leaves it alone (see the matcher
 * in src/middleware.ts).
 */
export async function POST() {
  bumpStat("loop_completed");
  // 204: the caller is a beacon, there is nothing to read back.
  return new NextResponse(null, { status: 204 });
}
