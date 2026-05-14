---
name: Test methodology — what to keep, what to cut
description: Patterns observed during the 1.0 hardening audit on which tests are pulling weight vs duplicating cheaper coverage
type: project
---

Found during the 2026-05-03 1.0 audit. Use this when triaging which tests to add, delete, or restructure.

**Why:** Tests are getting slower (8GB heap + forks pool). The user is asking whether tests are providing proportional value. The answer is mixed — most are good; ~10–15% are duplicating cheaper coverage at integration cost.

**How to apply:**

1. **Gold standard for behavior testing** — `src/lib/announce.test.ts`. Tests live-region textContent (the observable behavior), exercises queue ordering, missing-node fallback, fake-timer timing. Use as a template.

2. **Gold standard for utility + MSW** — `src/utils/api.test.ts`. MSW is doing real work (capturing URLs, returning realistic envelopes, exercising error envelopes for all 3 functions). Behavior-focused, not implementation. Replicate the URL-capture pattern (`captureUrl()` helper at top) for any new API function tests.

3. **Gold standard for meta-testing infrastructure** — `src/test/msw/handlers.test.ts`. Asserts that the default MSW handler and `makeEventPool` factory work as expected. Without this, MSW changes silently break every other test.

4. **Anti-pattern: route-level tests that only verify URL coercion or component-shape.** `src/routes/index.test.tsx` is the worst offender — many of its 24 tests are smoke tests like "page param read without crashing" that should be `coerceSearchParams.test.ts` tests, or component-shape tests like "day tiles are checkboxes" that belong in `SearchForm.test.tsx`. Each unnecessary route test costs a full router boot + QueryClient.

5. **Anti-pattern: re-testing useStoredState through every consumer.** `useColumnSizing.test.ts`, `useColumnVisibility.test.ts`, `useTypeDisplay.test.ts` all repeat the same 6 storage-layer tests (defaults, set, persist, reload, version mismatch, malformed JSON) instead of trusting the underlying hook test. Consumer hook tests should only assert consumer-specific logic (e.g., the `removeItem` side-effect when sizing is empty in `useColumnSizing`).

6. **Anti-pattern: assertions on CSS Module class-name regex.** `EventTable.test.tsx` checks `'[class*="typeRPG"]'` etc. Brittle to renames. Either use a `data-event-type="RPG"` attribute or accept the coupling explicitly with a comment.

7. **`renderRoute` is the canonical helper** at `src/test/renderRoute.tsx`. Other test files re-implement it (`renderSearchPage`, `renderChangelogPage`, `renderEventDetailPage`, `renderAboutPage`) — these should converge on `renderRoute` where possible. The exception is when the test needs a `router` reference returned (`renderRoute` doesn't currently return it). Worth extending `renderRoute` to optionally return the router so duplicates can be deleted.

8. **All test helpers must wrap in `<StrictMode>`** — every existing helper does. Without it, effect-driven side effects (announce, query prefetch) don't double-invoke in tests, masking React 19 strict-mode regressions.

9. **Gold standard for testing TanStack Router `head()` output** — the SEO branch (merged 2026-05-14, ~commit `2cc1052`). `event.$id.test.tsx`, `changelog.test.tsx`, `about.test.tsx`, `__root.test.tsx` assert `document.title` and `meta[property="og:..."]` content directly via `document.querySelector` after a `renderRoute` boot, plus the JSON-LD `script[type="application/ld+json"]` is parsed and asserted (including the SoldOut branch and the not-found → root-title fallback). Replicate this for any new route `head()`. Note: these DO need a full router boot (head resolution is router behavior), so they are a justified exception to anti-pattern #4 — unlike URL-coercion smoke tests, there is no cheaper layer to test head() at.
