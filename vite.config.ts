import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

const apiTarget = process.env.VITE_API_URL ?? "http://localhost:8080";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      host: true,
      proxy: {
        "/api": apiTarget,
        "/ingest/static": {
          target: "https://us-assets.i.posthog.com",
          changeOrigin: true,
          rewrite: (path: string): string => path.replace(/^\/ingest/, ""),
        },
        "/ingest/array": {
          target: "https://us-assets.i.posthog.com",
          changeOrigin: true,
          rewrite: (path: string): string => path.replace(/^\/ingest/, ""),
        },
        "/ingest": {
          target: env.VITE_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
          changeOrigin: true,
          rewrite: (path: string): string => path.replace(/^\/ingest/, ""),
        },
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
      exclude: ["**/node_modules/**", "**/.claude/worktrees/**"],
      pool: "forks",
      minWorkers: 1,
      maxWorkers: 8,
      testTimeout: 15000,
    },
  };
});
