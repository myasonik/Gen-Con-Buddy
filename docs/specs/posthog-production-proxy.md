# PostHog Production Reverse Proxy

## Summary

The PostHog SDK is configured to send events to `/ingest` on the same origin (via `api_host: "/ingest"` in `PostHogProvider`). Vite's dev server proxies `/ingest` to PostHog. Production has no equivalent proxy, so event capture silently drops in production — defeating the entire point of the integration.

---

## Background

The reverse proxy pattern exists so that PostHog traffic blends in with first-party API calls and isn't blocked by ad-blockers (which commonly block `*.posthog.com` and `*.i.posthog.com`). Without the proxy, roughly 30–40% of users with ad-blockers installed get zero analytics coverage.

The dev-side config in `vite.config.ts`:

```ts
proxy: {
  "/ingest/static": { target: "https://us-assets.i.posthog.com", rewrite: ... },
  "/ingest/array":  { target: "https://us-assets.i.posthog.com", rewrite: ... },
  "/ingest":        { target: env.VITE_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com", rewrite: ... },
}
```

This only runs in the Vite dev server. The production build is a static bundle with no server-side proxy.

---

## Current Production Setup

Determine how the production build is currently served on Railway before implementing. The approach differs:

- **Static file serving only** (e.g., `serve`, Railway's static deploy) → need to add a server layer (Caddy recommended).
- **Already behind nginx/Caddy** → add proxy rules to the existing config.
- **Node.js server** → add proxy middleware to the existing server.

Run `railway status` or inspect the Railway dashboard to confirm.

---

## Recommended Solution: Caddy

Add Caddy as the production web server. Caddy serves the static build output AND reverse-proxies PostHog paths. This adds zero new runtime dependencies to the JavaScript bundle and requires only a `Caddyfile` at the repo root.

### Files to add/modify

**`Caddyfile`** (repo root):

```
:{$PORT:3000}

root * /app/dist
file_server

# PostHog reverse proxy — must come before the SPA catch-all
reverse_proxy /ingest/static/* https://us-assets.i.posthog.com {
  header_up Host us-assets.i.posthog.com
  uri strip_prefix /ingest
}

reverse_proxy /ingest/array/* https://us-assets.i.posthog.com {
  header_up Host us-assets.i.posthog.com
  uri strip_prefix /ingest
}

reverse_proxy /ingest/* https://us.i.posthog.com {
  header_up Host us.i.posthog.com
  uri strip_prefix /ingest
}

# SPA fallback — serve index.html for all unmatched routes
try_files {path} /index.html
```

> `{$PORT}` reads the `PORT` env var Railway injects. Caddy listens on `0.0.0.0:$PORT`.
> Use `VITE_PUBLIC_POSTHOG_HOST` to override the PostHog host if the project is on an EU data center.

**`Dockerfile`** (new, if not already present):

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:2-alpine
COPY --from=build /app/dist /app/dist
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 3000
```

**`railway.toml`** (new or update):

```toml
[build]
builder = "dockerfile"

[deploy]
startCommand = "caddy run --config /etc/caddy/Caddyfile"
```

---

## Alternative: Direct PostHog Host

If the production proxy is too much infra overhead for now, change `api_host` in `PostHogProvider` from `"/ingest"` back to the direct PostHog host:

```tsx
options={{
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
  // ...
}}
```

This means ad-block users (estimated 30–40% of a gaming audience) will have analytics dropped. Acceptable as a temporary measure; revisit before relying on analytics for product decisions.

---

## Out of Scope

- EU data residency / `eu.i.posthog.com` hosting (use `VITE_PUBLIC_POSTHOG_HOST` env var if needed).
- Cookie consent / GDPR banner (PostHog's `persistence: "memory"` mode can be used if needed).
- Proxying PostHog's `decide` endpoint for feature flags (not currently used).
