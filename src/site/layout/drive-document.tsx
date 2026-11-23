import { DriveSite } from "@/components/drive/drive-site";
import { dirForLocale } from "@/i18n/routing";
import { ASSETS } from "../assets.gen";

/** Written into the file; the Worker puts the request's own in their place (drive-host.ts). */
export const NONCE = "__NONCE__";
export const BASE = "__BASE__";

/** The web Drive's document: one for every page of it, because the pages change without leaving the document. */
export async function renderDrive(locale: string, title: string, path: string): Promise<string> {
  const Site = DriveSite as unknown as (p: { base: string; path: string }) => never;
  const html = (
    <html lang={locale} dir={dirForLocale(locale)}>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href={ASSETS.driveCss} />
        <link rel="preconnect" href="https://api.bishare.app" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0b0b0b" />
        <title>{title}</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>
        <Site base={BASE} path={path} />
        <script type="module" nonce={NONCE} src={ASSETS.scripts.drive} />
      </body>
    </html>
  );
  return `<!DOCTYPE html>${await html.toString()}`;
}
