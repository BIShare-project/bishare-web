import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // The production form of the compiled elements: src/jsx has no development one.
  esbuild: { jsx: "automatic", jsxImportSource: "@/jsx", jsxDev: false },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.{ts,tsx}", "tool/**/*.test.ts"] },
});
