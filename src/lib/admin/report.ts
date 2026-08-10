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
  totalDownloads: number; // all-time, from durable daily counters (newly instrumented)
  downloadBytes: number; // all-time bytes served to downloaders
  liveTransfers: number;
  liveStorageBytes: number;
  totalRooms: number;
  receiveViews: number; // recipients who opened a transfer link (loop impressions)
  loopSends: number; // recipients who then clicked "Send a file" (loop conversion)
  nearbyTransfers: number; // LAN/nearby transfers (anonymous telemetry — serverless)
  nearbyBytes: number; // bytes moved over LAN/nearby (anonymous telemetry)
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

  const [
    uniqueUsers,
    liveTransfers,
    liveStorageBytes,
    upFiles,
    upTransfers,
    dlTransfer,
    dlShare,
    downloadBytes,
    totalRooms,
    roomFiles,
    receiveViews,
    loopSends,
    nearbyTransfers,
    nearbyBytes,
  ] = await Promise.all([
    scalar("SELECT COUNT(DISTINCT sender_ip) AS n FROM transfers WHERE sender_ip IS NOT NULL"),
    scalar("SELECT COUNT(*) AS n FROM transfers"),
    scalar("SELECT COALESCE(SUM(size), 0) AS n FROM files WHERE is_deleted = 0"),
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
    // LAN/nearby transfers (anonymous telemetry — never touch the relay).
    counterTotal("nearby_transfers"),
    counterTotal("nearby_bytes"),
  ]);

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
    totalDownloads: dlTransfer + dlShare,
    downloadBytes,
    liveTransfers,
    liveStorageBytes,
    totalRooms,
    receiveViews,
    loopSends,
    nearbyTransfers,
    nearbyBytes,
    dailyUploads: (daily.results ?? []).map((r) => ({ date: r.date, value: Number(r.v) })),
  };
}
