// Cloudflare Web Analytics.
//
// Why this and not Google Analytics: the cookie notice promises "a single
// cookie to remember your language. No ads, no tracking cookies" in all 13
// locales, and five more pages promise "no tracking". This beacon sets no
// cookie, reads no storage and does not fingerprint, so those sentences stay
// true and no consent gate is needed.
//
// Why a beacon at all, when Cloudflare already counts requests at the edge:
// edge analytics cannot tell a person from a scanner — `/wp-admin/install.php`
// and `/settings.py` sit in our own top-20 paths — and the Free plan exposes
// no referer dimension. A scanner does not run JavaScript, so this counts
// people and tells us where they came from.
//
// The token is not a secret: it ships in the HTML of every page by design.
const TOKEN = "274cf5a9affd42679174c54d844a8266";

export function WebAnalytics() {
  return (
    <script
      type="module"
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token: TOKEN })}
    />
  );
}
