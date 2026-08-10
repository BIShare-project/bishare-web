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
  uploadsFiles: number; // drive-file uploads (all-time)
  uploadsTransfers: number; // no-account transfers created (all-time)
  totalDownloads: number; // cloud transfer/share downloads + LAN receives (telemetry)
  downloadBytes: number; // all-time bytes served to downloaders (cloud + LAN)
  liveTransfers: number;
  liveStorageBytes: number;
  totalRooms: number; // cloud rooms (rooms_registry) + local/LAN rooms (telemetry)
  receiveViews: number; // recipients who opened a transfer link (loop impressions)
  loopSends: number; // recipients who then clicked "Send a file" (loop conversion)
  nearbyTransfers: number; // LAN/nearby transfers (anonymous telemetry — serverless)
  nearbyBytes: number; // bytes moved over LAN/nearby (anonymous telemetry)
  nearbyDownloads: number; // LAN files received (anonymous telemetry — serverless)
  nearbyRooms: number; // local/LAN rooms hosted (anonymous telemetry — serverless)
  dailyUploads: { date: string; value: number }[];
};

async function scalar(sql: string, ...binds: unknown[]): Promise<number> {
  try {
    const row = await adminBindings()
      .DB.prepare(sql)
      .bind(...binds)
      .first<{ n: number }>();
    return Number(row?.n ?? 0);
  } catch {
    return 0;
  }
}

/** Sum of a durable daily counter across all recorded days. */
const counterTotal = (metric: string) =>
  scalar("SELECT COALESCE(SUM(value), 0) AS n FROM stats_daily WHERE metric = ?", metric);

export async function reportBundle(): Promise<ReportBundle> {
  const db = adminBindings().DB;

  const launch = await db
    .prepare("SELECT MIN(date) AS d FROM stats_daily")
    .first<{ d: string | null }>();
  const launchDate = launch?.d ?? null;
  const daysLive = launchDate
    ? Math.max(1, Math.floor((Date.now() - Date.parse(launchDate)) / 86_400_000) + 1)
    : 0;

  const nowIso = new Date().toISOString();
  const [
    uniqueUsers,
    liveTransfers,
    upFiles,
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
    counterTotal("files_uploaded"),
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
  ]);

  // The accounts/drive teardown dropped the `files` table; server-side stored
  // files no longer exist, so live storage is always 0.
  const liveStorageBytes = 0;
  // Downloads = cloud transfer/share downloads + LAN receives (telemetry).
  const totalDownloads = dlTransfer + dlShare + nearbyDownloads;
  const downloadBytes = downloadBytesCloud + nearbyDownloadBytes;
  // Rooms = cloud rooms (rooms_registry) + local/LAN rooms (telemetry).
  const totalRooms = totalRoomsCloud + nearbyRooms;

  const daily = await db
    .prepare(
      `SELECT date, SUM(value) AS v
         FROM stats_daily
        WHERE metric IN ('files_uploaded', 'transfers_created')
        GROUP BY date ORDER BY date`
    )
    .all<{ date: string; v: number }>();

  return {
    launchDate,
    daysLive,
    uniqueUsers,
    // Cloud-touching shares (files + transfer links + room files). LAN/nearby
    // transfers are shown separately (nearbyTransfers) — they never hit a server.
    totalUploads: upFiles + upTransfers + roomFiles,
    uploadsFiles: upFiles,
    uploadsTransfers: upTransfers,
    totalDownloads,
    downloadBytes,
    liveTransfers,
    liveStorageBytes,
    totalRooms,
    receiveViews,
    loopSends,
    nearbyTransfers,
    nearbyBytes,
    nearbyDownloads,
    nearbyRooms,
    dailyUploads: (daily.results ?? []).map((r) => ({ date: r.date, value: Number(r.v) })),
  };
}
