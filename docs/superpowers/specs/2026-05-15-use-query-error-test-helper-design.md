# useQuery Error-Branch Test Helper

**Date:** 2026-05-15  
**Status:** Approved

## Problem

Every `useQuery` consumer renders an `isError` state. Historically these branches ship with zero test coverage. The gap has been manually patched for most existing consumers, but there is no structural guard — adding an error test requires conscious effort each time.

## Solution

Three-part, all small:

### 1. `src/test/apiError.ts` — narrow MSW helper

Two exported functions that register a one-shot MSW override for a single test:

```ts
export function withNetworkError(url: string): void {
  server.use(http.get(url, () => HttpResponse.error()));
}

export function withServerError(url: string): void {
  server.use(http.get(url, () => new HttpResponse(null, { status: 500 })));
}
```

- `withNetworkError` is the default — covers the most common `isError` branch.
- `withServerError` exists for cases that distinguish error types (none currently do, included for completeness).
- No render involvement. Call it at the top of a test body before rendering.

### 2. AGENTS.md addition — under Testing

Add the following bullet to the Testing section:

> Every `useQuery` call requires an MSW error test in its co-located test file. Use `withNetworkError()` or `withServerError()` from `src/test/apiError.ts` to register the override. Also cover the 200-with-error-envelope path for any fetch function that checks `data.error`.

### 3. ChangelogPage immediate gap fix

`ChangelogPage.tsx` has `isError → <p>Could not load changelog. Try refreshing.</p>` with no test. Add one test to `ChangelogPage.test.tsx`:

```ts
test("shows error message when changelog list fetch fails", async () => {
  withNetworkError("/api/changelog/list");
  await renderChangelogPage();
  expect(screen.getByText("Could not load changelog. Try refreshing.")).toBeInTheDocument();
});
```

## Scope

- New file: `src/test/apiError.ts`
- Modified: `AGENTS.md` (one bullet under Testing)
- Modified: `src/components/ChangelogPage/ChangelogPage.test.tsx` (one new test)

## Out of scope

- No ESLint or CI enforcement (convention-based, enforced by AGENTS.md and code review)
- No changes to existing tests — the existing error tests are fine as-is
- `withServerError` is not used in the immediate fix but is included in the helper for completeness
