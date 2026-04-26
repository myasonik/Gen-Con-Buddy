# Changelog Page Design

**Date:** 2026-04-25

## Overview

Add a `/changelog` route that surfaces the backend changelog API. Users can see a list of data-update entries (each showing date and counts of created/updated/deleted events), expand any entry inline to see three collapsible event tables, and benefit from a rolling prefetch strategy that keeps adjacent entries ready without blocking the initial load.

---

## Architecture

**Route:** `src/routes/changelog.tsx` — thin file route pointing at `ChangelogPage`. All logic lives in `src/components/ChangelogPage/`.

**Header nav:** `src/routes/__root.tsx` gets a nav link to `/changelog` in the existing `<header>` element.

**API functions** added to `src/utils/api.ts`:

- `fetchChangelogList(limit?: number)` — `GET /api/changelog/list?limit=N`
- `fetchChangelogEntry(id: string)` — `GET /api/changelog/fetch?id=...`

**Types** added to `src/utils/types.ts`:

```ts
interface ChangelogSummary {
  id: string;
  date: string; // RFC3339
  updatedCount: number;
  deletedCount: number;
  createdCount: number;
}

interface ChangelogEntry {
  id: string;
  date: string;
  updatedEvents: Event[];
  deletedEvents: Event[];
  createdEvents: Event[];
}

interface ListChangelogsResponse {
  error?: string;
  entries?: ChangelogSummary[];
}

interface FetchChangelogResponse {
  error?: string;
  entry?: ChangelogEntry;
}
```

---

## Prefetch Logic

`useChangelogPrefetch(summaries: ChangelogSummary[])` manages an entry cache as `Map<string, ChangelogEntry | 'loading' | 'error'>`. It exposes:

- `getEntry(id)` — returns the cached entry, `'loading'`, `'error'`, or `undefined`
- `openEntry(index)` — triggers the fetch cascade for `summaries[index]`

**Cascade rules:**

1. **On mount** — immediately start fetching `summaries[0]` (most recent entry) in the background.
2. **`openEntry(i)` when entry[i] is already cached** — background-fetch `summaries[i+1]` if not already cached or loading.
3. **`openEntry(i)` when entry[i] is not cached** — fetch `summaries[i]` immediately (blocking for that entry), then queue background fetches for `summaries[0]` through `summaries[i-1]` and `summaries[i+1]`.
4. **Skip in-flight fetches** — entries already `'loading'` are never re-requested.

---

## Component Structure

```
src/components/ChangelogPage/
  ChangelogPage.tsx          — fetches summary list, renders ChangelogRow list
  ChangelogRow.tsx           — one summary row + <details> expand/collapse
  ChangelogEntryPanel.tsx    — three collapsible event tables (created/updated/deleted)
  useChangelogPrefetch.ts    — prefetch hook
```

### ChangelogPage

- Fetches the summary list on mount (default limit: 6).
- Passes `summaries`, `getEntry`, and `openEntry` down to each `ChangelogRow`.
- Renders empty state ("No changelog entries yet.") if the list is empty.
- Renders an inline error if the list fetch fails.

### ChangelogRow

- Renders date and created/updated/deleted counts as badges.
- Uses a `<details>`/`<summary>` element for expand/collapse (leverages the existing `interpolate-size` CSS token for animated height transitions).
- On `<details>` toggle (open), calls `openEntry(i)`.
- Passes `getEntry(id)` result into `ChangelogEntryPanel`.

### ChangelogEntryPanel

- Receives a `ChangelogEntry | 'loading' | 'error' | undefined`.
- Shows a loading skeleton while `'loading'`.
- Shows an inline error if the entry failed to load (collapse + re-expand retries).
- Renders three sub-sections, each as a `<details>`/`<summary>` (individually collapsible):
  - **Created** (`createdEvents`)
  - **Updated** (`updatedEvents`)
  - **Deleted** (`deletedEvents`)
- Each sub-section is hidden entirely when its event array is empty.
- Each sub-section renders an `EventTable` with the events for that category.

### EventTable (new shared primitive)

`src/ui/EventTable/EventTable.tsx` — accepts `events: Event[]`, renders the same column-based table as search results with no data-fetching, no pagination, and no filter bar.

`SearchResults` is refactored to use `EventTable` internally. `ChangelogEntryPanel` also uses `EventTable` directly.

---

## Error Handling & Loading States

| Scenario          | Behavior                                                                       |
| ----------------- | ------------------------------------------------------------------------------ |
| List fetch fails  | Inline error message in place of the list                                      |
| Entry fetch fails | Inline error inside the expanded row; collapse + re-expand retries             |
| Entry loading     | Skeleton/spinner in expanded panel; no visible state for background prefetches |
| Empty list        | Short empty state message                                                      |

---

## Testing

Tests co-locate with the route file per project convention.

**`src/routes/changelog.test.tsx`** — MSW handlers for both endpoints added to `src/test/msw/handlers.ts`. Covers:

- Summary list renders
- Expanding a row fetches and displays the entry panel
- Empty state (list returns no entries)
- Error state (list fetch fails)
- Error state (entry fetch fails)

**`src/ui/EventTable/EventTable.test.tsx`** — unit tests for the shared table primitive:

- Renders events correctly
- Renders empty state

Prefetch cascade behavior is verified through the page-level tests (observable outcomes) rather than unit-testing hook internals.
