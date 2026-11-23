import type { Metadata, Viewport } from "next";
import { MotionProvider } from "@/components/site/motion";
import { PWARegister } from "@/components/site/pwa-register";
import { WebAnalytics } from "@/components/site/web-analytics";
import { CookieNotice } from "@/components/site/cookie-notice";
import { AppBar } from "@/components/site/app-bar";
import { APP_BAR_SCRIPT } from "@/components/site/app-bar-script";
import { SITE_JSON_LD, siteMetadata, THEME_COLORS, THEME_SCRIPT } from "@/lib/site-shell";
import { plexSans, plexMono } from "../fonts";
import "./site.css";

// Nightglass marketing shell. The IBM Plex fonts are declared once in
// ../fonts.ts and applied to <body> by the [locale] layout (so next/font can
// preload them into <head>); the SAME instances are reused here on the wrapper.
// site.css is imported here and nowhere else, so it never reaches admin routes.

// generateMetadata (not a static export) so the default alternates can be
// SELF-canonical per locale — every sub-page still overrides with its own
// buildAlternates(locale, "/<path>").
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return siteMetadata(locale);
}

export const viewport: Viewport = {
  themeColor: THEME_COLORS,
};

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${plexSans.variable} ${plexMono.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_JSON_LD) }}
      />
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      <script dangerouslySetInnerHTML={{ __html: APP_BAR_SCRIPT }} />
      <AppBar />
      <PWARegister />
      <WebAnalytics />
      <MotionProvider>{children}</MotionProvider>
      <CookieNotice />
      <div className="noise" aria-hidden />
    </div>
  );
}
