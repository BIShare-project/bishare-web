import { NextResponse } from "next/server";
import { bumpStat } from "@/lib/stats-bump";

/**
 * Receive-loop conversion, first half: a recipient arrived at the send tool
 * from a transfer page. The page calls this once per session, from script, and
 * only for a visit that came from a transfer page (see lib/loop.ts) — so a
 * crawler following the link is not counted, as it was while this was counted
 * on every server render. Only the count is recorded.
 *
 * Lives under /api so the locale middleware leaves it alone.
 */
export async function POST() {
  bumpStat("loop_sends");
  // 204: the caller is a beacon, there is nothing to read back.
  return new NextResponse(null, { status: 204 });
}
