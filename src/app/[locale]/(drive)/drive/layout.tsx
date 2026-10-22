import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { setRequestLocale } from "next-intl/server";
import { IntlScope } from "@/components/intl-scope";
import { DriveApp } from "@/components/drive/drive-app";
import { routing } from "@/i18n/routing";
import { geist } from "./fonts";
import "@/components/drive/drive.css";

// The web Drive (drive-plan.md phase 6). Served at the root of
// drive.bishare.app (the middleware rewrites the host onto /[locale]/drive and
// says so in x-drive-base), and at /drive on localhost and previews. None of
// it is for search engines: the pages are a signed-in app.
export const metadata: Metadata = {
  title: { default: "BIShare Drive", template: "%s — BIShare Drive" },
  robots: { index: false, follow: false },
  icons: { icon: [{ url: "/favicon.ico", sizes: "48x48" }], apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0b" },
  ],
};

export default async function DriveLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const root = (await headers()).get("x-drive-base") === "root";
  const base = root ? "" : `${locale === routing.defaultLocale ? "" : `/${locale}`}/drive`;
  return (
    <IntlScope namespaces={["drive"]}>
      <DriveApp base={base} className={geist.variable}>
        {children}
      </DriveApp>
    </IntlScope>
  );
}
