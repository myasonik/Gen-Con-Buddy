---
name: Recurring weak spots in Gen Con Buddy
description: Systemic patterns of regression risk found during repeated hardening audits — error envelopes, timezone-coupled dates, day-date pinning, version-bump silent miswrites, route-test cost
type: project
---

Updated 2026-05-06. Watch for these in any future feature work or audit pass.

**Why:** The user wants the codebase deterministic and refactor-safe. These are the gaps most likely to bite next.

**How to apply:** When auditing or reviewing new code, check each of these specifically:

1. **Error-branch test gaps** — every `useQuery` consumer renders an `isError` state that has historically had zero test coverage. Verify each new query consumer adds an MSW 500 test. Status as of 2026-05-06: changelog covers list-fetch and entry-fetch errors; GameSystemSelect covers its error branch. Verify new consumers do the same.

2. **Date formatting (resolved)** — `src/test/setup.ts` pins `process.env.TZ = 'America/Indianapolis'`. All date display is relative to Indianapolis time (Gen Con's host city). New date display tests automatically run under the correct timezone.

3. **Day → date pinning to GEN_CON_YEAR=2024** — `DAY_DATES` in `src/utils/searchParams.ts` is computed from `GEN_CON_YEAR = 2024`. There is **no test that flags drift when the API ships 2025 data**. Add `expect(GEN_CON_YEAR).toBe(2024)` (or whichever year is current) so a year change is a deliberate two-file edit.

4. **API error envelope (NEW gap 2026-05-06)** — `fetchEvents`, `fetchChangelogList`, `fetchChangelogEntry` all check `data.error` and throw. **`fetchGameSystemFacets` does NOT check for an error envelope and does NOT validate `data.values` exists.** If the backend returns `{ error: "..." }` (200), `data.values` is `undefined` and `.map(...)` later in `GameSystemSelect` will throw. Add `if (data.error) throw new Error(data.error)` and `return data.values ?? []` to mirror the changelog pattern. Add an MSW test asserting the 200-with-error-envelope path throws.

5. **Route shells (resolved for current routes)** — `index.test.tsx`, `event.$id.test.tsx`, `changelog.test.tsx`, `about.test.tsx` all exist. Future routes must follow the same pattern.

6. **StrictMode in tests (regression in two new helpers)** — `renderRoute.tsx` and the per-file `renderSearchPage`/`renderChangelogPage`/`renderEventDetailPage`/`renderAboutPage` helpers wrap in `<StrictMode>`. New helpers `renderGameSystemSelect` (in `GameSystemSelect.test.tsx`) and `renderSearchForm` (in `SearchForm.test.tsx`) **do NOT wrap in `<StrictMode>`**. Effect double-invocation, idempotency of effect-driven state, and double-mount behavior of the `useQuery({ staleTime: Infinity })` pattern are not exercised. Wrap in `<StrictMode>`.

7. **EventTypeSelect non-empty tail handling** — `value="RPG,"` (trailing comma) needs to behave the same in form, URL, and ActiveFilters. ActiveFilters tests cover this; EventTypeSelect/SearchForm do not. Add coverage if you touch chip rendering.

8. **localStorage version-mismatch reset is silent** — `useColumnVisibility`/`useColumnSizing` reset on version mismatch with no UI breadcrumb. If you bump VERSION, users lose customization with no warning. This is intended, but document the version field on every change.

9. **`useStoredState` version-bump silent miswrite** — `useStoredState(key, version, default)` reads from storage in a `useState` initializer (one-shot) but writes via `useEffect([key, version, value])`. If `version` increases mid-lifecycle, the effect writes the OLD `value` under the NEW version number, silently corrupting storage. All current consumers pass module-level constants so this is latent. Either constrain `version` at the type level (literal type / docs) or add a re-read effect on version change. Add a regression test before fixing.

10. **`coerceSearchParams` / `SearchParams` / `parseSearchParams` triple-enumeration** — every URL param must be added to all three places. There's no compile-time guard. New fields silently fall through. Consider a single source-of-truth descriptor that drives all three. Until then: when reviewing a PR that adds a SearchParams field, grep for the field name across the trio.

11. **`renderSearchPage` is the dominant test-memory cost** — `src/routes/index.test.tsx` runs ~24 router-mounted tests, many of which only need to verify URL coercion or component-shape. The 8GB heap and `pool: "forks"` in package.json/vite.config.ts are workarounds for this accumulation. When auditing routes, ask: "could this be a `coerceSearchParams.test.ts` test instead?" first.

12. **Frontend → API contract drift (NEW 2026-05-06)** — `fetchGameSystemFacets` calls `/api/events/facets/gameSystem`. The Go API at `~/Workspace/Gen-Con-Buddy-API` does NOT implement this route — `event_handler.go` only registers `/api/events/search`. The contract exists only in the MSW handler. The feature will silently produce empty options against prod until the Go side ships. There is no test that catches this — MSW always answers. Track the API change before merging the frontend.
