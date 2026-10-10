/**
 * The receive loop, client side: a recipient opens a transfer, presses "Send a
 * file", and uploads something of their own. Three counts, all made here in
 * the browser:
 *
 *   receive_opens   a transfer page was opened        (reportReceiveOpen)
 *   loop_sends      a recipient arrived at the send tool from one (markLoopVisit)
 *   loop_completed  that visit finished an upload     (reportLoopCompleted)
 *
 * They used to be counted on the server whenever /transfer?ref=recv or a
 * transfer page was rendered. That link is in the HTML of pages crawlers read,
 * so every crawler that followed it counted as a recipient pressing the
 * button: on some days "clicks" equalled transfer pages opened. A count made
 * by script, once per session, and only for a visit that really came from a
 * transfer page, is one a person had to cause.
 *
 * sessionStorage, not a cookie: nothing here should ride along with every
 * request, and a metric does not justify one.
 */
const VISIT_KEY = "bishare.loopVisit";
const COUNTED_KEY = "bishare.loopCounted";
const OPEN_KEY = "bishare.receiveOpen.";
const RECEIVE_HOST = "get.bishare.app";
const MAIN_ORIGIN = "https://bishare.app";
/** /transfer/<code>, with or without a locale prefix. */
const RECEIVE_PATH = /^\/(?:[A-Za-z]{2}(?:-[A-Za-z]{2,4})?\/)?transfer\/[^/]+$/;
/** How long a click's time stamp is believed. Both ends read the same clock. */
const FRESH_MS = 5 * 60 * 1000;

function beacon(url: string): void {
  try {
    // A beacon survives the tab being closed right after.
    if (navigator.sendBeacon?.(url, new Blob([], { type: "text/plain" }))) return;
    void fetch(url, { method: "POST", keepalive: true }).catch(() => {});
  } catch {
    /* best-effort */
  }
}

/**
 * Where "Send a file" on a transfer page leads, built at the moment of the
 * click. `path` is the send tool's path for the current locale. On the receive
 * host the link goes straight to the main site: a relative link would first be
 * tried as an in-app navigation, fail on the host change, and only then follow
 * the redirect. The time stamp is what tells the send page a person just
 * pressed the button; the link in the HTML carries none.
 */
export function sendBackHref(path: string): string {
  const origin = location.hostname === RECEIVE_HOST ? MAIN_ORIGIN : "";
  return `${origin}${path}?ref=recv&t=${Date.now()}`;
}

function cameFromTransferPage(): boolean {
  const query = new URLSearchParams(location.search);
  if (query.get("ref") !== "recv") return false;
  const stamp = Number(query.get("t"));
  if (Number.isFinite(stamp) && Math.abs(Date.now() - stamp) < FRESH_MS) return true;
  // No fresh stamp (the link was opened in a new tab, say): the referrer still
  // names the page it came from.
  try {
    const from = new URL(document.referrer);
    return from.hostname === RECEIVE_HOST || RECEIVE_PATH.test(from.pathname);
  } catch {
    return false;
  }
}

/** Called on the send tool. Counts a recipient's arrival once per session. */
export function markLoopVisit(): void {
  try {
    if (!cameFromTransferPage()) return;
    if (sessionStorage.getItem(COUNTED_KEY) === "1") return;
    sessionStorage.setItem(COUNTED_KEY, "1");
    sessionStorage.setItem(VISIT_KEY, "1");
  } catch {
    return; // storage blocked: "once" could not be kept, so nothing is counted
  }
  beacon("/api/loop-visit");
}

/** Report the first upload of a loop visit, then forget it. */
export function reportLoopCompleted(): void {
  try {
    if (sessionStorage.getItem(VISIT_KEY) !== "1") return;
    sessionStorage.removeItem(VISIT_KEY);
  } catch {
    return;
  }
  beacon("/api/loop-done");
}

/** Called on a transfer page. Counts each transfer once per session. */
export function reportReceiveOpen(code: string): void {
  try {
    const key = OPEN_KEY + code;
    if (sessionStorage.getItem(key) === "1") return;
    sessionStorage.setItem(key, "1");
  } catch {
    return;
  }
  beacon("/api/receive-open");
}
