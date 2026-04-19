/// <reference types="vitest" />
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const apiTarget = process.env.VITE_API_URL ?? "http://localhost:8080";

export default defineConfig({
  server: {
    host: true,
    proxy: {
      "/api": apiTarget,
    },
  },
  plugins: [
    TanStackRouterVite({
      routeFileIgnorePattern: "\\.test\\.tsx?$",
    }),
    react(),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
