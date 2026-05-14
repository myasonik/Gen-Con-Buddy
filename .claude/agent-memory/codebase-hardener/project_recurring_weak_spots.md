---
name: Recurring weak spots in Gen Con Buddy
description: Open regression risks found during hardening audits — error branches, trailing-comma edge cases, silent storage corruption, URL param triple-enumeration, test memory cost
type: project
---

Updated 2026-05-14. Watch for these in any future feature work or audit pass.

**Why:** The user wants the codebase deterministic and refactor-safe. These are the gaps most likely to bite next.

**How to apply:** When auditing or reviewing new code, check each of these specifically:

1. **Error-branch test gaps** — every `useQuery` consumer renders an `isError` state that has historically had zero test coverage. Verify each new query consumer adds an MSW 500 test. Status as of 2026-05-06: changelog covers list-fetch and entry-fetch errors; GameSystemSelect covers its error branch. Verify new consumers do the same.

2. **EventTypeSelect non-empty tail handling** — `value="RPG,"` (trailing comma) needs to behave the same in form, URL, and ActiveFilters. ActiveFilters tests cover this; EventTypeSelect/SearchForm do not. Add coverage if you touch chip rendering.

3. **localStorage version-mismatch reset is silent** — `useColumnVisibility`/`useColumnSizing` reset on version mismatch with no UI breadcrumb. If you bump VERSION, users lose customization with no warning. This is intended, but document the version field on every change.

4. **`useStoredState` version-bump silent miswrite** — `useStoredState(key, version, default)` reads from storage in a `useState` initializer (one-shot) but writes via `useEffect([key, version, value])`. If `version` increases mid-lifecycle, the effect writes the OLD `value` under the NEW version number, silently corrupting storage. All current consumers pass module-level constants so this is latent. Either constrain `version` at the type level (literal type / docs) or add a re-read effect on version change. Add a regression test before fixing.

5. **`coerceSearchParams` / `SearchParams` / `parseSearchParams` triple-enumeration** — every URL param must be added to all three places. There's no compile-time guard. New fields silently fall through. Consider a single source-of-truth descriptor that drives all three. Until then: when reviewing a PR that adds a SearchParams field, grep for the field name across the trio.

6. **`renderSearchPage` is the dominant test-memory cost** — `src/routes/index.test.tsx` runs ~24 router-mounted tests, many of which only need to verify URL coercion or component-shape. The 8GB heap and `pool: "forks"` in package.json/vite.config.ts are workarounds for this accumulation. When auditing routes, ask: "could this be a `coerceSearchParams.test.ts` test instead?" first.
