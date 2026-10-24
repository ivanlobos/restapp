import { defineConfig } from "vitest/config";
import path from "path";

// Suprimir warning de Vite sobre ESM en CommonJS — no relevante para tests
process.env.VITE_CONFIG_NATIVE_IGNORE_WARNING = "true";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/app/api/**/*.ts", "src/lib/**/*.ts"],
      exclude: ["**/*.test.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
