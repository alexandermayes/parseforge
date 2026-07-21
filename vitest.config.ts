import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Resolve the `@/*` path alias (tsconfig paths map `@/*` -> `./*`) so tests can
// import app modules the same way the app does.
const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: { "@": root.replace(/\/$/, "") },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "app/**/*.test.ts"],
  },
});
