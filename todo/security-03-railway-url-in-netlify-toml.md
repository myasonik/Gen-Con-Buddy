# Production Railway URL Hardcoded in `netlify.toml`

**Severity:** HIGH (open-source context)  
**Confidence:** 10/10  
**Repo:** Gen-Con-Buddy  
**File:** `netlify.toml:7`

## Problem

```toml
to = "https://web-production-e0d43.up.railway.app/api/:splat"
```

Publishing this exposes the canonical backend URL, allowing anyone to bypass the Netlify proxy layer entirely and hit the API directly — circumventing any future rate limiting or IP filtering added at the Netlify layer.

## Fix

1. Replace the hardcoded URL with a Netlify environment variable:
   ```toml
   to = "${API_UPSTREAM_URL}/api/:splat"
   ```
   Set `API_UPSTREAM_URL` in the Netlify dashboard (not in the file).
2. Configure Railway to only accept requests with a shared secret header set by Netlify, rejecting direct traffic.
