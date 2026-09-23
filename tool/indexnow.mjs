#!/usr/bin/env node
/**
 * Tell IndexNow which pages changed, so Bing (and Yandex, Seznam, Naver) see an
 * edit in hours instead of waiting for a crawl.
 *
 * Why this exists: on 2026-09-23 Bing Webmaster Tools showed it had crawled 28
 * of our 561 sitemap URLs and none of the 504 locale pages. Bing's own numbers
 * had gone from 56 impressions a day to zero on 14 September. Crawling was
 * healthy — every URL returned 200 — so the gap is discovery, not access, and
 * IndexNow is the fix Bing itself asks for.
 *
 * Usage:
 *   node tool/indexnow.mjs                 # every URL in the live sitemap
 *   node tool/indexnow.mjs <url> [url...]  # only these
 *   node tool/indexnow.mjs --dry-run       # print what would be sent
 *
 * The protocol says to submit when content is added, updated or deleted, and
 * warns that submitting too often looks like spam (429). Do not put this on a
 * timer: run it after a deploy that actually changed pages.
 */
const HOST = "bishare.app";
const KEY = "69b9e7c50bac135743e5dbea1646ff1d";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/IndexNow";
const MAX_PER_POST = 10000; // protocol limit

const CODES = {
  200: "URL submitted successfully",
  202: "accepted — key validation pending",
  400: "invalid format",
  403: "key not valid (file missing, or key not inside the file)",
  422: "URLs do not belong to the host, or the key does not match the schema",
  429: "too many requests — treated as spam",
};

async function sitemapUrls() {
  const res = await fetch(`https://${HOST}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap.xml returned ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
}

/** The key file has to be live and hold exactly the key, or every POST is 403. */
async function assertKeyIsLive() {
  const res = await fetch(KEY_LOCATION);
  if (!res.ok) throw new Error(`${KEY_LOCATION} returned ${res.status} — deploy the key file first`);
  const body = (await res.text()).trim();
  if (body !== KEY) throw new Error(`${KEY_LOCATION} holds ${JSON.stringify(body.slice(0, 40))}, not the key`);
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const explicit = args.filter((a) => a.startsWith("http"));

const urls = explicit.length ? explicit : await sitemapUrls();
const foreign = urls.filter((u) => new URL(u).host !== HOST);
if (foreign.length) throw new Error(`not on ${HOST}: ${foreign.slice(0, 3).join(", ")}`);

console.log(`${urls.length} URL${urls.length === 1 ? "" : "s"} for ${HOST}`);
if (dryRun) {
  console.log(urls.slice(0, 10).join("\n") + (urls.length > 10 ? `\n… and ${urls.length - 10} more` : ""));
  process.exit(0);
}

await assertKeyIsLive();
console.log(`key file verified at ${KEY_LOCATION}`);

for (let i = 0; i < urls.length; i += MAX_PER_POST) {
  const batch = urls.slice(i, i + MAX_PER_POST);
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: batch }),
  });
  const note = CODES[res.status] ?? "unexpected status";
  console.log(`batch ${i / MAX_PER_POST + 1}: ${batch.length} URLs → HTTP ${res.status} (${note})`);
  if (!res.ok) {
    console.error(await res.text());
    process.exit(1);
  }
}
