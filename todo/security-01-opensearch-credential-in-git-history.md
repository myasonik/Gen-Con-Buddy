# Hardcoded Credential in Git History

**Severity:** HIGH  
**Confidence:** 10/10  
**Repo:** Gen-Con-Buddy-API  
**File:** `docker-compose.yml` (branch `feat/bgg-cascade-matcher`)

## Problem

The OpenSearch admin password `Xk9#mP2wvL8n` is committed as the default fallback value in `docker-compose.yml` (`${OS_PASSWORD:-Xk9#mP2wvL8n}`). The `.env` file currently uses this same password in production. If the API repo is made public without purging this branch, the live credential is exposed.

## Fix

1. **Rotate the OpenSearch password immediately** — the committed default matches production.
2. Remove the fallback: use `${OS_PASSWORD}` with no default value.
3. Run `git filter-repo` (or BFG) to purge the password from all branches and history before publishing.
