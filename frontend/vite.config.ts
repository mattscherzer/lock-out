import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // relative so the build also works from a subpath such as GitHub Pages
  base: "./",
  plugins: [react(), tailwindcss()],
  // scripts/*.test.mts run under node --test, not vitest
  test: { include: ["src/**/*.test.{ts,tsx}"], environment: "jsdom", setupFiles: ["./src/test-setup.ts"] },
});
