import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import createNextIntlPlugin from "next-intl/plugin";

// Makes getCloudflareContext() (bindings D1/R2/DO) work during `next dev` —
// dipakai admin panel (server components) tanpa harus lewat wrangler dev.
initOpenNextCloudflareForDev();

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
  },
};

export default withNextIntl(nextConfig);
