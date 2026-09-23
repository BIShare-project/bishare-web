// Live product report (admin, read-only). Real production numbers for the
// no-account transfer product — uploads/downloads/unique users since launch,
// all derived live from D1. "Unique users" = distinct transfer senders, since
// the core product needs no account (there is no "active user" to count).
import { adminBindings } from "./cf";

export type ReportBundle = {
  launchDate: string | null;
  daysLive: number;
  uniqueUsers: number; // distinct sender_ip across live transfers (no-account)
  totalUploads: number; // all-time, from durable daily counters
  uploadsTransfers: number; // no-account transfers created (all-time)
  uploadsRoomFiles: number; // files dropped into rooms (rooms_registry.file_count)
  totalDownloads: number; // cloud transfer/share downloads + LAN receives (telemetry)
  downloadBytes: number; // all-time bytes served to downloaders (cloud + LAN)
  liveTransfers: number;
  storedBytes: number; // bytes held in R2 for transfers that are still live
  totalRooms: number; // cloud rooms (rooms_registry) + local/LAN rooms (telemetry)
  receiveViews: number; // recipients who opened a transfer link (loop impressions)
  loopSends: number; // recipients who then clicked "Send a file" (loop conversion)
  nearbyTransfers: number; // LAN/nearby transfers (anonymous telemetry — serverless)
  nearbyBytes: number; // bytes moved over LAN/nearby (anonymous telemetry)
  nearbyDownloads: number; // LAN files received (anonymous telemetry — serverless)
  nearbyRooms: number; // local/LAN rooms hosted (anonymous telemetry — serverless)
  appDownloads: number; // App Store + Google Play first-time installs, all time
  appDownloadsIos: number; // …of which App Store (posted daily by the app repo's job)
  appDownloadsAndroid: number; // …of which Google Play
  appActive30d: number; // installs opened in the last 30 days (anonymous pings)
  dailyUploads: { date: string; value: number }[];
};

/** Set when a query in the current bundle failed and read as 0. */
let lastBundleFailed = false;

async function scalar(sql: string, ...binds: unknown[]): Promise<number> {
  try {
    const row = await adminBindings()
      .DB.prepare(sql)
      .bind(...binds)
      .first<{ n: number }>();
    return Number(row?.n ?? 0);
  } catch {
    lastBundleFailed = true;
    return 0;
  }
}

/** Sum of a durable daily counter across all recorded days. */
const counterTotal = (metric: string) =>
  scalar("SELECT COALESCE(SUM(value), 0) AS n FROM stats_daily WHERE metric = ?", metric);

/** How long the public /stats numbers are shared between viewers. Kept short:
 *  the live socket polls every 15 s and viewers refresh just after this expires,
 *  so a change reaches the page within ~30 s. */
export const REPORT_CACHE_SECONDS = 10;
const REPORT_CACHE_KEY = "https://report-cache.internal/stats/v1";

/**
 * reportBundle() for the public /stats page, shared by every viewer in a data
 * center for REPORT_CACHE_SECONDS. The bundle runs ~15 queries, several of them
 * full scans, and the page re-renders for every open tab each time the live
 * socket says the numbers moved — uncached, a few hundred viewers would queue
 * behind each other on D1 and slow uploads down with them. Without the Cache
 * API (next dev on Node) it simply reads D1 every time.
 */
export async function publicReportBundle(): Promise<ReportBundle> {
  const cache = (globalThis as { caches?: { default?: Cache } }).caches?.default;
  if (cache) {
    try {
      const hit = await cache.match(REPORT_CACHE_KEY);
      if (hit) return (await hit.json()) as ReportBundle;
    } catch {
      // fall through to a live read
    }
  }
  lastBundleFailed = false;
  const bundle = await reportBundle();
  // A failed query reads as 0; never share a bundle built from one.
  if (cache && !lastBundleFailed) {
    try {
      await cache.put(
        REPORT_CACHE_KEY,
        new Response(JSON.stringify(bundle), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": `public, max-age=${REPORT_CACHE_SECONDS}`,
          },
        })
      );
    } catch {
      // serving the live read is enough
    }
  }
  return bundle;
}

export async function reportBundle(): Promise<ReportBundle> {
  const db = adminBindings().DB;

  const launch = await db
    // Store rows are dated by when the download happened, which reaches back to
    // the first App Store release — long before this service started counting
    // anything. Leaving them in moved "days live" from 67 to 183 the day the
    // first backfill ran.
    .prepare("SELECT MIN(date) AS d FROM stats_daily WHERE metric NOT LIKE 'store_%'")
    .first<{ d: string | null }>();
  const launchDate = launch?.d ?? null;
  const daysLive = launchDate
    ? Math.max(1, Math.floor((Date.now() - Date.parse(launchDate)) / 86_400_000) + 1)
    : 0;

  const nowIso = new Date().toISOString();
  const [
    uniqueUsers,
    liveTransfers,
    upTransfers,
    dlTransfer,
    dlShare,
    downloadBytesCloud,
    totalRoomsCloud,
    roomFiles,
    receiveViews,
    loopSends,
    nearbyTransfers,
    nearbyBytes,
    nearbyDownloads,
    nearbyDownloadBytes,
    nearbyRooms,
    appDownloadsIos,
    appDownloadsAndroid,
    appActive30d,
    storedBytes,
  ] = await Promise.all([
    scalar("SELECT COUNT(DISTINCT sender_ip) AS n FROM transfers WHERE sender_ip IS NOT NULL"),
    // "Live transfers" = cloud transfers ACTUALLY still available (not expired,
    // not a consumed one-time). Counting raw rows would keep dead transfers in
    // the number for up to an hour (until the purge cron), so filter here — the
    // count then drops as soon as a transfer expires, matching the fingerprint.
    scalar(
      "SELECT COUNT(*) AS n FROM transfers WHERE expires_at > ? AND NOT (one_time = 1 AND is_downloaded = 1)",
      nowIso
    ),
    counterTotal("transfers_created"),
    counterTotal("transfer_downloads"),
    counterTotal("share_downloads"),
    counterTotal("download_bytes"),
    // Rooms persist in rooms_registry (never purged), so count the table LIVE —
    // the hourly stats_daily counter both lags and undercounts pre-tracking rooms.
    scalar("SELECT COUNT(*) AS n FROM rooms_registry"),
    // Files shared inside rooms — rooms_registry.file_count survives room close.
    scalar("SELECT COALESCE(SUM(file_count), 0) AS n FROM rooms_registry"),
    // Receive-loop: link opens (impressions) → "Send a file" clicks (conversion).
    counterTotal("receive_views"),
    counterTotal("loop_sends"),
    // LAN/nearby activity (anonymous telemetry — never touches the relay):
    // sends, bytes, receives (downloads), receive-bytes, and local (LAN) rooms.
    counterTotal("nearby_transfers"),
    counterTotal("nearby_bytes"),
    counterTotal("nearby_downloads"),
    counterTotal("nearby_download_bytes"),
    counterTotal("nearby_rooms"),
    // Store downloads arrive one row per day (API /stats/ingest); the total is
    // their sum, which keeps growing after the stores drop their old reports.
    counterTotal("store_units_ios"),
    counterTotal("store_units_android"),
    // An install sends the `month` flag at most once per thirty days, so the
    // sum over the last thirty dates counts each active install exactly once.
    scalar(
      "SELECT COALESCE(SUM(value), 0) AS n FROM stats_daily WHERE metric = 'app_active_monthly' AND date > date('now', '-30 days')"
    ),
    // Bytes we are actually holding right now — the same live filter as
    // liveTransfers, so the two numbers always describe the same set of files.
    // This replaces a Drive-era `liveStorageBytes` that was hardcoded to 0 from
    // the day the repo was created; the `files` table it referred to is gone,
    // but transfers carry their own size.
    scalar(
      "SELECT COALESCE(SUM(file_size), 0) AS n FROM transfers WHERE expires_at > ? AND NOT (one_time = 1 AND is_downloaded = 1)",
      nowIso
    ),
  ]);

  // Downloads = cloud transfer/share downloads + LAN receives (telemetry).
  const totalDownloads = dlTransfer + dlShare + nearbyDownloads;
  const downloadBytes = downloadBytesCloud + nearbyDownloadBytes;
  // Rooms = cloud rooms (rooms_registry) + local/LAN rooms (telemetry).
  const totalRooms = totalRoomsCloud + nearbyRooms;

  const daily = await db
    .prepare(
      `SELECT date, SUM(value) AS v
         FROM stats_daily
        WHERE metric IN ('transfers_created', 'nearby_transfers')
        GROUP BY date ORDER BY date`
    )
    .all<{ date: string; v: number }>();

  return {
    launchDate,
    daysLive,
    uniqueUsers,
    // Everything shared, by any route. Nearby used to be excluded here on the
    // grounds that it "never hits a server" — but that rule was only applied to
    // uploads, never to downloads, so one WebRTC transfer moved Downloads and
    // left Files shared untouched. Worse, leaving it out understates the very
    // thing that makes the product worth using. The breakdown below splits it
    // back out, and now the segments actually sum to this number.
    totalUploads: upTransfers + roomFiles + nearbyTransfers,
    uploadsTransfers: upTransfers,
    uploadsRoomFiles: roomFiles,
    totalDownloads,
    downloadBytes,
    liveTransfers,
    storedBytes,
    totalRooms,
    receiveViews,
    loopSends,
    nearbyTransfers,
    nearbyBytes,
    nearbyDownloads,
    nearbyRooms,
    appDownloads: appDownloadsIos + appDownloadsAndroid,
    appDownloadsIos,
    appDownloadsAndroid,
    appActive30d,
    dailyUploads: (daily.results ?? []).map((r) => ({ date: r.date, value: Number(r.v) })),
  };
}
