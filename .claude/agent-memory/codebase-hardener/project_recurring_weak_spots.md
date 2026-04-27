---
name: Recurring weak spots in Gen Con Buddy
description: Systemic patterns of regression risk found during a hardening audit — error states, timezone-coupled date formatting, untested route components, and the day-date pinning to 2024
type: project
---

The audit on 2026-04-27 surfaced recurring risk patterns. Watch for these in any future feature work or audit pass.

**Why:** The user reports recurring regressions and wants the codebase deterministic. These are the gaps most likely to bite next.

**How to apply:** When auditing or reviewing new code, check each of these specifically:

1. **Error-branch test gaps** — every `useQuery` consumer renders an `isError` PixelState/message that has zero test coverage in the key feature components (`SearchResults`, `EventDetail`, `ChangelogPage`'s entry-error fallback when only the list errors). Verify each new query consumer adds an MSW 500 test.

2. **Date formatting is timezone-coupled** — `format(new Date(iso), 'EEEE'|'HH:mm'|'yyyy-MM-dd')` runs in `EventDetail`, `EventTable.columns`, `ChangelogRow`. Tests pass on the dev machine's TZ but will break on a CI runner in another zone. There is no `process.env.TZ` set anywhere and no `vi.setSystemTime` for these. Any new date display must be tested under a pinned TZ.

3. **Day → date pinning to 2024** — `DAY_DATES` in `src/utils/searchParams.ts` hardcodes 2024 dates. Switching to 2025/2026 will silently break "Wed/Thu/Fri/Sat/Sun" filters with no test catching it. The test suite asserts the 2024 strings literally.

4. **API error envelope inconsistency** — `fetchEvents` does not check `data.error` (despite `EventSearchResponse` declaring it), but `fetchChangelogList`/`fetchChangelogEntry` do. Any backend that returns 200 + error body will silently produce a "found 0 results" state. Mirror the changelog pattern when adding a new API call.

5. **Route shells are untested as routes** — `event.$id.tsx` has no `event.$id.test.tsx`. `EventDetail.test.tsx` mounts the component directly, so route-level concerns (param parsing, auth guard if added later) are not exercised. Same risk for any future route.

6. **Tests don't run under StrictMode** — production wraps the app in `<StrictMode>` (main.tsx) but no test does. Effect-driven side effects (announce, prefetch) get double-invoked in prod and not in tests.

7. **EventTypeSelect non-empty tail handling** — `value="RPG,"` (trailing comma) needs to behave the same in form, URL, and ActiveFilters. ActiveFilters tests cover this; EventTypeSelect/SearchForm do not. Add coverage if you touch chip rendering.

8. **localStorage version-mismatch reset is silent** — `useColumnVisibility`/`useColumnSizing` reset on version mismatch with no UI breadcrumb. If you bump VERSION, users lose customization with no warning. This is intended, but document the version field on every change.
