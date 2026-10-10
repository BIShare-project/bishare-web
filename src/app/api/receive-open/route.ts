import { NextResponse } from "next/server";
import { bumpStat } from "@/lib/stats-bump";

/**
 * A transfer page was opened in a browser. Counted from script, once per
 * transfer per session, which leaves out the link-preview fetches of chat apps
 * and other clients that never run the page. `receive_views`, counted on the
 * server for every render, stays as it was for continuity; this is the number
 * to divide by. Only the count is recorded.
 *
 * Served on the receive host too: /api is outside the middleware's matcher.
 */
export async function POST() {
  bumpStat("receive_opens");
  return new NextResponse(null, { status: 204 });
}
