/**
 * Link-preview fetchers that read robots.txt before they draw a preview.
 *
 * The receive page (/transfer/<code>) is disallowed for every crawler: on
 * bishare.app by app/robots.ts, and the whole dl.bishareusercontent.com host by the
 * middleware. That kept X, Slack, LinkedIn, Discord, Teams and Reddit from
 * previewing a BIShare link at all, so the preview card the page carries
 * (og:image, twitter:*) only showed in apps that fetch without asking, such
 * as WhatsApp, Telegram and iMessage. These agents get their own group that
 * allows everything.
 *
 * None of them is a search engine, so nothing here changes what Google or
 * Bing may crawl, and receive pages stay noindex (meta robots and the
 * X-Robots-Tag header) for anyone who reads them.
 */
export const LINK_PREVIEW_BOTS = [
  "Twitterbot",
  "facebookexternalhit",
  "LinkedInBot",
  "Slackbot-LinkExpanding",
  "Discordbot",
  "TelegramBot",
  "WhatsApp",
  "SkypeUriPreview",
  "redditbot",
  "Embedly",
];

/** The robots.txt group for those agents, as text, for hosts answered inline. */
export const LINK_PREVIEW_GROUP =
  LINK_PREVIEW_BOTS.map((ua) => `User-Agent: ${ua}`).join("\n") + "\nAllow: /\n";
