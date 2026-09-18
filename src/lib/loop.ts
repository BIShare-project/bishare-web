/**
 * The receive loop, client side. A recipient who presses "Send a file" lands on
 * /transfer?ref=recv, which counts `loop_sends` on the server. The flag set
 * here survives until that visit uploads something, so the completion can be
 * counted against the same session — one per session, however many files go.
 *
 * sessionStorage, not a cookie: nothing here should ride along with every
 * request, and a metric does not justify one.
 */
const KEY = "bishare.loopVisit";

/** Called on /transfer when the URL carries the receive-loop marker. */
export function markLoopVisit(): void {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    /* storage blocked — the visit simply goes uncounted */
  }
}

/** Report the first upload of a loop visit, then forget it. */
export function reportLoopCompleted(): void {
  try {
    if (sessionStorage.getItem(KEY) !== "1") return;
    sessionStorage.removeItem(KEY);
  } catch {
    return;
  }
  try {
    const url = "/api/loop-done";
    // A beacon survives the tab being closed on the success screen.
    if (navigator.sendBeacon?.(url, new Blob([], { type: "text/plain" }))) return;
    void fetch(url, { method: "POST", keepalive: true }).catch(() => {});
  } catch {
    /* best-effort */
  }
}
