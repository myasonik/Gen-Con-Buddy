# Route Test Cleanup — Design

**Date:** 2026-05-14  
**Status:** Approved  
**Todo:** `todo/hardening-06-rendersearchpage-memory-cost.md`

## Problem

`src/routes/index.test.tsx` has ~33 tests, many of which boot a full TanStack Router + QueryClient to verify behaviors already covered at the component level. Each unnecessary `renderRoute()` call inflates heap pressure. The `--max-old-space-size=8192` Node flag and `pool: "forks"` in `vite.config.ts` are downstream workarounds for this accumulation.

## Goal

- Remove all route-level tests that do not require the router.
- Migrate the subset that adds coverage to the correct component test file.
- Establish a written policy in AGENTS.md so the problem does not recur.
- Re-evaluate the memory workarounds after the migration.

## Test Categorization

### Delete (12 tests) — already covered at component level

| Test                                                                 | Duplicate of                                                |
| -------------------------------------------------------------------- | ----------------------------------------------------------- |
| "populates eventType dropdown from URL search param on load" (L20)   | `SearchForm.test.tsx` L150                                  |
| "materialsRequiredDetails param survives route validator" (L134)     | `coerceSearchParams.test.ts` L99                            |
| "renders a banner landmark with the app title" (L166)                | no router assertion; trivial shape check                    |
| "site header contains the app title" (L172)                          | duplicate of L166                                           |
| "day tiles are checkboxes" (L213)                                    | `SearchForm.test.tsx` L160                                  |
| "day checkboxes are keyboard accessible interactive elements" (L218) | `SearchForm.test.tsx` L160                                  |
| "eventType column renders the event type" (L225)                     | `SearchResults.test.tsx` L554                               |
| "sidebar toggle button is present in the results area" (L246)        | `SearchForm.test.tsx` L51                                   |
| "sidebar toggle button has aria-expanded=false by default" (L251)    | implied by drawer open/close tests in `SearchForm.test.tsx` |
| "clicking the backdrop closes the drawer" (L265)                     | `SearchForm.test.tsx` L305 ("clicking outside")             |
| "no active filter chips when no filters are set" (L280)              | `ActiveFilters.test.tsx` L7                                 |
| "active filter chip appears when filter param is in URL" (L285)      | `ActiveFilters.test.tsx` L19                                |

### Migrate to `SearchForm.test.tsx` (2 tests)

- "renders day toggles as a group in the filter strip" — the `<fieldset>`/group wrapper around day checkboxes is not yet tested at the component level.
- "clicking toggle button flips aria-expanded to true" — aria-expanded state after clicking the Filters button is not explicitly tested.

Both are rewritten as cheap synchronous or single-interaction component tests using the existing `renderSearchForm()` helper.

### Migrate to `ActiveFilters.test.tsx` (2 tests)

- "days filter produces one chip per day" — verifies individual chips per day (not a grouped "Days:" chip). Rewritten by rendering `<ActiveFilters searchParams={{ days: "fri,sat" }} ... />` directly.
- "eventType filter produces one chip per code" — same pattern for event types.

### Keep in `index.test.tsx` (~17 tests)

All remaining tests involve at least one of: URL mutation after interaction, cross-navigation router state, or `head()` output. This includes the full `analytics events` describe block (analytics handlers live on `SearchPage` and use `Route.useNavigate()`, so they cannot be tested without the router).

## AGENTS.md Policy

Add to the Testing section:

> **Route tests vs. component tests.** A test belongs in `src/routes/*.test.tsx` only if it requires the router to be meaningful — meaning it verifies one of:
>
> 1. URL mutation after user interaction (page resets, sort params, filter chip removal updating `router.state.location`)
> 2. Router navigation (`router.navigate()`, `router.state.resolvedLocation`, deep-link hydration across a navigation event)
> 3. Head output (`document.title`, meta tags from `head()`)
>
> Everything else — component shape, aria attributes, chip rendering from search params, form field behavior — belongs in the component's own test file, where it runs without booting a router or QueryClient.

## Memory Settings (post-migration)

1. Switch `pool` from `"forks"` to `"threads"` in `vite.config.ts`. Forks was added to work around memory pressure; threads is faster and lower-overhead. Validate by running the full test suite.
2. Drop `--max-old-space-size=8192` to `--max-old-space-size=4096` (or remove it) in `package.json` `test` and `test:coverage` scripts. Run suite; lower further or remove if it passes.
3. `--expose-gc` can stay — cheap and helps GC reclaim between tests.

## Success Criteria

- `index.test.tsx` has ≤17 tests, all with a clear URL/navigation/head() assertion.
- Migrated tests pass in their new files.
- Full test suite passes with `pool: "threads"` and reduced heap limit.
- AGENTS.md policy is committed.
