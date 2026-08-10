import type { Metadata } from "next";

/**
 * Root 404 for URLs that match NO route (e.g. an unknown `/foo.txt` — excluded
 * from the i18n middleware, so never rewritten into [locale]). The shared root
 * layout (src/app/layout.tsx) is a passthrough with no <html>/<body> — each
 * surface owns its own document root — so this file renders its OWN complete
 * HTML document; otherwise Next has no shell to render the 404 in and returns a
 * 500. Self-contained (no layout/i18n context), hence inline styles + English.
 * Next injects <meta name="robots" content="noindex"> automatically on 404s.
 *
 * Localized unknown paths are NOT handled here — they match
 * [locale]/(site)/[...rest] and render the branded, localized not-found.
 */
export const metadata: Metadata = {
  title: "Page not found · BIShare",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          background: "#0a0a0a",
          color: "#fafafa",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <main style={{ maxWidth: "28rem", padding: "2rem", textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#3b82f6",
              fontWeight: 600,
            }}
          >
            404
          </p>
          <h1
            style={{
              margin: "0.75rem 0 0",
              fontSize: "1.75rem",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              fontWeight: 600,
            }}
          >
            Page not found
          </h1>
          <p
            style={{
              margin: "0.75rem 0 0",
              fontSize: "0.95rem",
              lineHeight: 1.6,
              color: "#a1a1a1",
            }}
          >
            The page you are looking for doesn’t exist or has moved.
          </p>
          <a
            href="/"
            style={{
              display: "inline-block",
              marginTop: "1.75rem",
              padding: "0.65rem 1.4rem",
              borderRadius: "0.6rem",
              background: "#fafafa",
              color: "#0a0a0a",
              fontSize: "0.9rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Back to BIShare
          </a>
        </main>
      </body>
    </html>
  );
}
