# BIShare Web

The marketing site, browser file-transfer UI (`/transfer`), and public stats
page (`/stats`) for [BIShare](https://bishare.app) — a fast, no-account file
sharing tool. Built with **Next.js** and deployed to **Cloudflare Workers** via
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare).

This repository is the **public web client only**. The API (file transfer,
rooms, presigned R2 storage, telemetry) is a separate service; the site talks
to it over HTTPS at `NEXT_PUBLIC_API_URL` (default `https://api.bishare.app`).

## What's here

- **Marketing pages** — localized (13 languages via `next-intl`), dark-first design.
- **`/transfer`** — end-to-end-encrypted browser transfers (WebCrypto AES-256-GCM;
  the key never leaves the URL fragment, so the relay is zero-knowledge).
- **`/stats`** — live public counters, server-rendered from a read-only D1
  aggregate, with a realtime WebSocket (`/stats-live`) backed by a Durable Object
  (`StatsLiveDO`) that pushes a "changed" ping when the numbers move.

## Stack

- Next.js (App Router) · React · Tailwind
- Cloudflare Workers · D1 (read-only stats) · Durable Objects (`StatsLiveDO`)
- `@opennextjs/cloudflare` for the Worker build

## Develop

```bash
npm install
cp .env.example .env.local     # set NEXT_PUBLIC_API_URL
npm run dev                     # next dev
```

## Deploy (Cloudflare)

1. Create a D1 database and paste its id into `wrangler.jsonc`:
   ```bash
   npx wrangler d1 create bishare-web
   ```
2. Set your domain (optional) under `routes` in `wrangler.jsonc`.
3. Build + deploy:
   ```bash
   npm run deploy        # opennextjs build + wrangler deploy
   ```

The web Worker needs **no secrets** — it only reads D1 and serves pages.

## Encryption

Browser transfers are encrypted client-side with **AES-256-GCM** (WebCrypto).
The symmetric key is generated in the browser and carried in the URL fragment
(`#k=…`), which is never sent to the server — the relay only ever sees
ciphertext. LAN transfers in the native apps use the BIShare Rust protocol
(X25519 + AES-256-GCM).

## License

MIT
