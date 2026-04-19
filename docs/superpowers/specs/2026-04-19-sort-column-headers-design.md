# Sort via Column Heading Controls

## Overview

Add sortable column headers to the search results table. Clicking a column header cycles through three states: ascending → descending → no sort. Sort is encoded in the URL and passed to the backend as `sort={field}.{asc|desc}`.

## Data Flow

`sort` is added to `SearchParams` as `sort?: string`. The value is the raw API format (`"startDateTime.asc"`, `"cost.desc"`, etc.) — no frontend transformation needed. It flows through:

1. URL query string (`?sort=startDateTime.asc`)
2. `validateSearch` in `index.tsx`
3. `fetchEvents` → passed directly as a query param to `/api/events/search`
4. Backend parses `sort={field}.{asc|desc}`

Changing sort resets `page` to 1 (changing sort order invalidates the current page position).

## Column Configuration

Each entry in the `COLUMNS` array in `SearchResults.tsx` gains an optional `sortField?: string`. Columns without `sortField` are non-sortable.

The `day` column is a display-only derived field (formatted from `startDateTime`). It maps to `sortField: 'startDateTime'`. When `startDateTime` is the active sort field, both the `day` and `startDateTime` column headers reflect the active sort state.

## Three-State Toggle

Clicking a sortable column header cycles:

- **No sort** → `field.asc`
- **Active ascending** → `field.desc`
- **Active descending** → no sort (clears the `sort` param from the URL)

## Component Changes

### `SearchResults`

- New `onSort: (sort: string | undefined) => void` prop (same pattern as `onNavigate`)
- Reads current sort from `searchParams.sort` to determine active sort field and direction
- Sortable `<th>` renders a `<button>` inside; non-sortable `<th>` renders plain text
- `<th>` carries `aria-sort`: `"ascending"` | `"descending"` | `"none"` for sortable columns; omitted for non-sortable
- Visual sort indicators (e.g. ▲ ▼) are `aria-hidden="true"`
- Calls `announce()` after each sort change (see Accessibility below)

### `index.tsx`

- `sort` added to `validateSearch`
- `handleSort(sort: string | undefined)` navigates merging the new sort value and resetting page

### `types.ts`

- `sort?: string` added to `SearchParams`

### `api.ts`

- `fetchEvents` passes `sort` directly as a URL query param (no transformation)

## Accessibility

The ARIA grid pattern specifies `aria-sort` on `<th>` elements to communicate sort state. Values:

- `"none"` — column is sortable but not currently sorted
- `"ascending"` — column is sorted ascending
- `"descending"` — column is sorted descending
- Omitted — column is not sortable

The sort button's accessible name is static: `"Sort by [Column Label]"`. The `aria-sort` on the parent `<th>` provides state context to screen readers, avoiding label churn.

After every sort state change, `announce()` is called imperatively:

- Sort applied: `"Sorted by [Label], ascending"` / `"Sorted by [Label], descending"`
- Sort cleared: `"Sort cleared"`

This covers screen readers that don't reliably surface `aria-sort` mutations on dynamic React updates, consistent with the project's existing `announce()` pattern.

## Tests

Tests live in `SearchResults.test.tsx` and `index.test.tsx`, using MSW for network interception.

- Clicking an unsorted sortable header sets `sort=field.asc` in the URL
- Clicking again sets `sort=field.desc`
- Clicking a third time clears `sort` from the URL
- Changing sort resets `page` to 1
- `aria-sort` reflects current sort state on the correct `<th>`
- `announce()` is called with the correct message on each transition
- Non-sortable columns render plain `<th>` with no button and no `aria-sort`
