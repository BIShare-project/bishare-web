// Realtime push for the public /stats page. A SINGLE global instance polls a
// fingerprint of the mutable stats state every POLL_MS while any client is
// connected, and pushes a "changed" ping over WebSocket when it moves. Clients
// then re-fetch the (force-dynamic) page. ONE DO for all viewers (not per-tab
// polling), and the loop stops the moment the last viewer disconnects.
//
// POLL_MS is paired with the page's shared cache (publicReportBundle, 10 s) and
// the client's refresh delay (just past that cache), so a change shows up within
// ~30 s while each tick's scan of the transfers and rooms tables stays rare.
// Viewers are hibernatable sockets, so between ticks the object sleeps instead
// of being billed for every second a stats tab stays open.
import type { Env } from "../types";

const POLL_MS = 15_000;

export class StatsLiveDO {
  constructor(
    private ctx: DurableObjectState,
    private env: Env
  ) {}

  async fetch(req: Request): Promise<Response> {
    if (req.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("expected websocket", { status: 426 });
    }
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    this.ctx.acceptWebSocket(server);

    // The first viewer seeds the baseline so the first tick doesn't ping
    // spuriously; later viewers join the running loop without another scan.
    // (An alarm long overdue is left over from before a restart and won't drive
    // the loop — start it again.)
    const at = await this.ctx.storage.getAlarm();
    if (at === null || at < Date.now() - POLL_MS) {
      await this.ctx.storage.put("fingerprint", await this.fingerprint(""));
      await this.ctx.storage.setAlarm(Date.now() + POLL_MS);
    }
    // Greet the client (which already has fresh server-rendered data, so it
    // need not act).
    try {
      server.send("hello");
    } catch {
      /* dropped */
    }
    return new Response(null, { status: 101, webSocket: client });
  }

  async alarm(): Promise<void> {
    const clients = this.ctx.getWebSockets();
    if (clients.length === 0) return; // no viewers → let the loop die
    const last = (await this.ctx.storage.get<string>("fingerprint")) ?? "";
    const fp = await this.fingerprint(last);
    if (fp !== last && fp !== "") {
      await this.ctx.storage.put("fingerprint", fp);
      for (const ws of clients) {
        try {
          ws.send("changed");
        } catch {
          /* gone */
        }
      }
    }
    await this.ctx.storage.setAlarm(Date.now() + POLL_MS);
  }

  // Nothing to do per message or close: the socket list is the viewer list.
  async webSocketMessage(): Promise<void> {}
  async webSocketClose(): Promise<void> {}
  async webSocketError(): Promise<void> {}

  // A digest of everything /stats shows; when it moves, we ping. One row,
  // aggregate-only — no per-metric round trips.
  private async fingerprint(previous: string): Promise<string> {
    try {
      const row = await this.env.DB.prepare(
        `SELECT
             (SELECT COUNT(*) FROM transfers
                WHERE expires_at > strftime('%Y-%m-%dT%H:%M:%fZ','now')
                  AND NOT (one_time = 1 AND is_downloaded = 1))
             || '-' || (SELECT COALESCE(SUM(download_count), 0) FROM transfers)
             || '-' || (SELECT COUNT(DISTINCT sender_ip) FROM transfers WHERE sender_ip IS NOT NULL)
             || '-' || (SELECT COUNT(*) FROM rooms_registry)
             || '-' || (SELECT COALESCE(SUM(file_count), 0) FROM rooms_registry)
             || '-' || (SELECT COALESCE(SUM(value), 0) FROM stats_daily
                          WHERE metric IN ('files_uploaded','transfers_created',
                                           'transfer_downloads','share_downloads','download_bytes',
                                           'nearby_transfers','nearby_bytes',
                                           'nearby_downloads','nearby_download_bytes','nearby_rooms'))
           AS fp`
      ).first<{ fp: string }>();
      return row?.fp ?? "";
    } catch {
      return previous; // transient error — don't spuriously ping
    }
  }
}
