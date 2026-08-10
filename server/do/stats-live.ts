// Realtime push for the public /stats page. A SINGLE global instance polls a
// cheap fingerprint of the mutable stats state every POLL_MS while any client is
// connected, and pushes a "changed" ping over WebSocket when it moves. Clients
// then re-fetch the (force-dynamic) page. Cheap by design: one aggregate query
// per tick, ONE DO for all viewers (not per-tab polling), and the loop stops the
// moment the last viewer disconnects.
import type { Env } from "../types";

const POLL_MS = 3000;

export class StatsLiveDO {
  private clients = new Set<WebSocket>();
  private lastFingerprint = "";

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
    server.accept();
    this.clients.add(server);

    // Seed the baseline so the first tick doesn't ping spuriously, and greet the
    // client (which already has fresh server-rendered data, so it need not act).
    this.lastFingerprint = await this.fingerprint();
    try {
      server.send("hello");
    } catch {
      /* dropped */
    }

    if (this.clients.size === 1) {
      await this.ctx.storage.setAlarm(Date.now() + POLL_MS);
    }

    const gone = () => this.clients.delete(server);
    server.addEventListener("close", gone);
    server.addEventListener("error", gone);
    return new Response(null, { status: 101, webSocket: client });
  }

  async alarm(): Promise<void> {
    if (this.clients.size === 0) return; // no viewers → let the loop die
    const fp = await this.fingerprint();
    if (fp !== this.lastFingerprint && fp !== "") {
      this.lastFingerprint = fp;
      for (const ws of this.clients) {
        try {
          ws.send("changed");
        } catch {
          this.clients.delete(ws);
        }
      }
    }
    await this.ctx.storage.setAlarm(Date.now() + POLL_MS);
  }

  // A cheap digest of everything /stats shows; when it moves, we ping. One row,
  // aggregate-only — no per-metric round trips.
  private async fingerprint(): Promise<string> {
    try {
      const row = await this.env.DB.prepare(
        `SELECT
             (SELECT COUNT(*) FROM transfers)
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
      return this.lastFingerprint; // transient error — don't spuriously ping
    }
  }
}
