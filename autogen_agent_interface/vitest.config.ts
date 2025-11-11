/**
 * Vitest Configuration
 * Configuração para testes unitários e de integração
 */

import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["node_modules", "dist", ".parcel-dist"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "tests/",
        "**/*.d.ts",
        "**/*.config.ts",
        "**/dist/",
        "**/.parcel-dist/",
      ],
    },
    timeout: 10000, // 10 segundos
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./server"),
      "@/utils": path.resolve(__dirname, "./server/utils"),
      "@/tests": path.resolve(__dirname, "./tests"),
    },
  },
});
