import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  // scripts/*.test.mjs run under node --test, not vitest
  test: { include: ["src/**/*.test.js"] },
});
