import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_URL ?? "http://localhost:8080";
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
      pool: "threads",
      minWorkers: 1,
      maxWorkers: 8,
      testTimeout: 15000,
      coverage: {
        provider: "v8",
        include: ["src/**"],
        exclude: [
          "src/test/**",
          "src/**/*.test.{ts,tsx}",
          "src/**/*.stories.{ts,tsx}",
          "src/routeTree.gen.ts",
          "src/vite-env.d.ts",
          "src/main.tsx",
          "src/ui/storyMatrix.tsx",
          "src/ui/icons/**",
        ],
        reporter: ["text", "html", "json", "json-summary"],
        thresholds: {
          statements: 90,
          branches: 90,
          functions: 90,
          lines: 90,
        },
      },
    },
  };
});
