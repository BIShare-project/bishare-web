import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import createNextIntlPlugin from "next-intl/plugin";
import createMDX from "@next/mdx";

// Makes getCloudflareContext() (bindings D1/R2/DO) work during `next dev` —
// dipakai admin panel (server components) tanpa harus lewat wrangler dev.
// DEV ONLY: it reads the wrangler config on load, so running it during the
// production build would fail against the placeholder public wrangler.jsonc.
// The prod build/deploy selects the real config via `-c wrangler.web.jsonc`;
// getCloudflareContext() still works at runtime in the deployed worker.
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

// next-intl request config (marketing surface message loading + locale).
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Workers has no Next.js image optimization
  },
  experimental: {
    // Barrel-optimize the icon set so a page bundles only the icons it imports
    // (lucide-react re-exports hundreds), not the whole module.
    optimizePackageImports: ["lucide-react"],
    // Blog articles are .mdx imported as components; the Rust MDX compiler is
    // the one that works under Turbopack (no JS loader chain).
    mdxRs: true,
  },
};

// Blog content (src/content/blog/*.mdx) imports as React components.
const withMDX = createMDX({});

export default withMDX(withNextIntl(nextConfig));
