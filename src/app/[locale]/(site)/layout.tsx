import type { Metadata, Viewport } from "next";
import { MotionProvider } from "@/components/site/motion";
import { PWARegister } from "@/components/site/pwa-register";
import { CookieNotice } from "@/components/site/cookie-notice";
import { sharedOpenGraph } from "@/lib/og";
import { buildAlternates } from "@/i18n/metadata";
import { plexSans, plexMono } from "../fonts";
import "./site.css";

// Nightglass marketing shell. The IBM Plex fonts are declared once in
// ../fonts.ts and applied to <body> by the [locale] layout (so next/font can
// preload them into <head>); the SAME instances are reused here on the wrapper.
// site.css is imported here and nowhere else, so it never reaches admin routes.

const DESCRIPTION =
  "Send any file to any device — iPhone, Android, Windows, Mac, Linux. Nearby it’s instant and end-to-end encrypted, device to device. Far away, send a link they open in any browser — no app needed on their end. No sign-up; links auto-expire.";

// generateMetadata (not a static export) so the default alternates can be
// SELF-canonical per locale — every sub-page still overrides with its own
// buildAlternates(locale, "/<path>").
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    metadataBase: new URL("https://bishare.app"),
    title: {
      default: "BIShare — Send Files to Any Device, Instantly",
      template: "%s — BIShare",
    },
    description: DESCRIPTION,
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      title: "BIShare",
      statusBarStyle: "black-translucent",
    },
    alternates: buildAlternates(locale, "/"),
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "48x48" },
        { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    },
    ...sharedOpenGraph("BIShare — Send Files to Any Device, Instantly", DESCRIPTION, "/"),
    other: {
      "apple-itunes-app": "app-id=6760924092",
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f9fd" },
    { media: "(prefers-color-scheme: dark)", color: "#030711" },
  ],
};

/**
 * Theme boot (Nightglass §1.9): a stored `bishare-theme` choice wins; with
 * no stored choice the OS preference applies, and the media-query listener
 * stays live ONLY until the user picks explicitly (review fixes #10/#31).
 * Dark is the server-rendered default (`<html class="dark">` from the root
 * layout), and this runs at the top of the site subtree before the content
 * below it paints — a stored/OS light preference flips it with minimal flash.
 *
 * It also keeps `<meta name="theme-color">` in sync (review #5): the
 * media-scoped metas from `viewport` only follow the OS preference, so when
 * the applied theme differs (stored choice or manual toggle) every
 * theme-color meta gets the active `--background` value — #f7f9fd light /
 * #030711 dark. Keep these hex values in sync with site.css, the `viewport`
 * export below, and theme-toggle.tsx.
 */
/**
 * Structured data (schema.org) — tells search engines this is a free,
 * cross-platform file-transfer app, which reinforces relevance for the
 * high-intent queries we target ("AirDrop for Android", "send files iPhone to
 * Android", "cross-platform file transfer"). English is fine site-wide; the
 * hreflang alternates cover the localized pages.
 */
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://bishare.app/#org",
      name: "BIShare",
      url: "https://bishare.app",
      logo: "https://bishare.app/logo.png",
      description: DESCRIPTION,
      sameAs: ["https://apps.apple.com/app/id6760924092"],
    },
    {
      "@type": "WebSite",
      "@id": "https://bishare.app/#website",
      url: "https://bishare.app",
      name: "BIShare",
      description: DESCRIPTION,
      inLanguage: "en",
      publisher: { "@id": "https://bishare.app/#org" },
    },
    {
      "@type": "SoftwareApplication",
      name: "BIShare",
      operatingSystem: "iOS, Android, macOS, Windows, Linux",
      applicationCategory: "UtilitiesApplication",
      description:
        "BIShare sends files across any device — iPhone, Android, Windows, Mac, Linux. Like AirDrop, but cross-platform: instant over your local Wi-Fi, or a link the recipient opens in any browser with no app needed on their end. Free, no account.",
      url: "https://bishare.app",
      downloadUrl: "https://bishare.app/download",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: { "@id": "https://bishare.app/#org" },
    },
  ],
};

const THEME_SCRIPT = `try{var d=document.documentElement,k="bishare-theme",s=localStorage.getItem(k),m=window.matchMedia("(prefers-color-scheme: light)"),f=function(l){d.classList.toggle("dark",!l);d.classList.toggle("light",!!l);var c=l?"#f7f9fd":"#030711",t=document.querySelectorAll('meta[name="theme-color"]'),i=0;if(t.length)for(;i<t.length;i++)t[i].setAttribute("content",c);else{var n=document.createElement("meta");n.setAttribute("name","theme-color");n.setAttribute("content",c);document.head.appendChild(n)}};f(s?s==="light":m.matches);m.addEventListener("change",function(e){if(!localStorage.getItem(k))f(e.matches)})}catch(e){}`;

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      <PWARegister />
      <MotionProvider>{children}</MotionProvider>
      <CookieNotice />
      <div className="noise" aria-hidden />
    </div>
  );
}
