import { raw } from "hono/html";
import type { Metadata } from "@/site/metadata";
import { dirForLocale } from "@/i18n/routing";
import { SITE_JSON_LD, THEME_SCRIPT } from "@/lib/site-shell";
import { APP_BAR_SCRIPT } from "@/ui/app-bar-script";
import { WebAnalytics } from "@/ui/web-analytics";
import { ASSETS } from "../assets.gen";
import { AppBar } from "@/ui/app-bar";
import { CookieNotice } from "@/ui/cookie-notice";
import { renderHead } from "./head";

/** A whole page of the site around `body`. */
export async function renderDocument({ locale, metadata, body }: { locale: string; metadata: Metadata; body: unknown }): Promise<string> {
  const html = (
    <html lang={locale} dir={dirForLocale(locale)} class="dark">
      <head>{raw(renderHead(metadata, locale))}</head>
      <body>
        <div class="font-sans antialiased min-h-screen bg-background text-foreground">
          <script type="application/ld+json">{raw(JSON.stringify(SITE_JSON_LD))}</script>
          <script>{raw(THEME_SCRIPT)}</script>
          <script>{raw(APP_BAR_SCRIPT)}</script>
          <AppBar />
          {WebAnalytics() as unknown as string}
          {body as string}
          <CookieNotice />
          <div class="noise" aria-hidden="true" />
        </div>
        <script type="module" src={ASSETS.scripts.site} />
      </body>
    </html>
  );
  return `<!DOCTYPE html>${await html.toString()}`;
}
