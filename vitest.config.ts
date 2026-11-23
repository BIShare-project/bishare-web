import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // next has no exports map; plain Node resolution needs the extension.
      "next/server": fileURLToPath(new URL("./node_modules/next/server.js", import.meta.url)),
    },
  },
  test: {
    server: { deps: { inline: ["next-intl"] } },
    include: ["src/hono/**/*.test.{ts,tsx}", "tool/**/*.test.ts", "worker/**/*.test.ts"] },
});
