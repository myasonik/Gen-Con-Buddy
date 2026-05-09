# Changelog Search Strip

**Date:** 2026-05-09
**Status:** Approved

## Overview

Add a simplified, client-side filter strip to the changelog page containing three controls: event type, days, and time. The strip reuses `SearchForm` directly by adding a `changelogMode` prop. Filtering runs client-side against already-loaded entry data; the architecture anticipates a future API-backed version.

## SearchForm Modification

`SearchForm` gains one new optional boolean prop: `changelogMode?: boolean`.

When `true`, two sections are hidden:

- The keyword text input
- The "Filters" drawer button

All other behavior is unchanged — `onSearch` still receives the full `SearchFormValues`, the reset button works as normal, and the submit button triggers the same `handleSubmit` flow. This keeps the contract identical between the search page and changelog page consumers.

## URL State and Route

The changelog route's `validateSearch` is extended with four new string params (empty-string default):

```
eventType: string
days: string
timeStart: string
timeEnd: string
```

The existing `open` param is unchanged.

`ChangelogPage` reads all five params. It constructs a `SearchFormValues` object from the four filter params to hydrate `SearchForm`, and passes an `onSearch` handler that calls `navigate` to write updated values back to the URL (same pattern as the search page, scoped to these four fields).

An `activeFilter` object (the current four param values) is derived in `ChangelogPage` and passed as a prop to each `ChangelogRow`.

## Client-Side Filtering

A new pure utility function:

```ts
filterChangelogEvents(events: Event[], filter: SearchFormValues): Event[]
```

Lives in `src/utils/filterChangelogEvents.ts`. Applies three predicates:

- **eventType**: `event.attributes.eventType` must be one of the comma-separated codes in `filter.eventType`. Skipped when `filter.eventType` is empty.
- **days**: `event.attributes.startDateTime` must fall within the date range for at least one selected day. Uses the `DAY_DATES` map from `searchParams.ts` (exported). Skipped when `filter.days` is empty.
- **time**: the time portion of `startDateTime` must fall within `filter.timeStart`–`filter.timeEnd`. Skipped when both are empty; partial bounds (only start or only end set) are honored.

Any predicate whose filter value is empty is skipped entirely — no filtering applied for that field.

`ChangelogEntryPanel` calls this function on each of its three event arrays (`createdEvents`, `updatedEvents`, `deletedEvents`) before rendering, when `activeFilter` is non-empty.

This function is the single source of filtering truth — `ChangelogRow` also calls it when deriving filtered counts from cached entry data.

## ChangelogRow Match States

`ChangelogRow` receives `activeFilter` as a prop. When a filter is active (at least one field non-empty), it reads its entry from the React Query cache via `queryClient.getQueryData(["changelog", "entry", summary.id])` — a synchronous, non-fetching read that returns `undefined` on cache miss.

| Cache state           | Rendering                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| Not yet fetched       | Renders normally; shows a "?" indicator alongside the count chips to signal unknown match state |
| Fetched, has matches  | Renders normally; count chips reflect filtered counts (e.g. "3 created" → "1 created")          |
| Fetched, zero matches | Row is visually dimmed (reduced opacity); all count chips show 0                                |

When no filter is active, `ChangelogRow` uses the original summary counts from `ChangelogSummary` and renders normally with no indicators.

Filtered counts are derived by calling `filterChangelogEvents` against the cached entry data — no duplication of filtering logic between `ChangelogRow` and `ChangelogEntryPanel`.

## Architecture Notes

The `onSearch` callback on the changelog page is intentionally structured identically to the search page — it receives `SearchFormValues` and is responsible for acting on it. Today it does client-side filtering via URL params; in the future it can dispatch an API call instead. No changes to `SearchForm` will be needed at that point.

`DAY_DATES` in `searchParams.ts` must be exported (currently unexported) so `filterChangelogEvents` can import it without duplicating the date arithmetic.

## File Changes

| File                                                   | Change                                                                              |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `src/components/SearchForm/SearchForm.tsx`             | Add `changelogMode?: boolean` prop; conditionally render keyword and Filters drawer |
| `src/components/SearchForm/SearchForm.module.css`      | No changes expected                                                                 |
| `src/routes/changelog.tsx`                             | Extend `validateSearch` with four filter params; pass to `ChangelogPage`            |
| `src/components/ChangelogPage/ChangelogPage.tsx`       | Render `SearchForm` with `changelogMode`; derive `activeFilter`; pass to rows       |
| `src/components/ChangelogPage/ChangelogRow.tsx`        | Accept `activeFilter`; derive match state from cache; render indicators             |
| `src/components/ChangelogPage/ChangelogEntryPanel.tsx` | Accept `activeFilter`; filter event arrays before rendering                         |
| `src/utils/filterChangelogEvents.ts`                   | New pure filter utility                                                             |
| `src/utils/searchParams.ts`                            | Export `DAY_DATES`                                                                  |

## Testing

- **`src/utils/filterChangelogEvents.test.ts`** — pure unit tests covering: eventType filtering, day filtering, time filtering, combined filters, empty filter (returns all), partial filter (only some fields set)
- **`src/components/SearchForm/SearchForm.test.tsx`** — add cases for `changelogMode={true}`: keyword absent, Filters drawer absent, submit still fires `onSearch`
- **`src/components/ChangelogPage/ChangelogPage.test.tsx`** — MSW integration tests: submit filter → verify only matching events render; verify dimmed/unknown row states; verify URL params update; verify reset clears filters
- **`src/components/ChangelogPage/ChangelogRow.test.tsx`** — unit tests for the three match states (unknown, has-matches, zero-matches) by controlling React Query cache state
