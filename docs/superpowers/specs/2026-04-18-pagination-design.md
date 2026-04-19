# Pagination Design

**Date:** 2026-04-18

## Overview

Add page-based pagination to search results. Page and limit are URL-driven, consistent with existing filter state. Pagination UI renders both above and below the results table.

## URL & Types

Add `page` (number, default 1) and `limit` (number, default 100) to `SearchParams` in `src/utils/types.ts`.

Both round-trip through `parseSearchParams` and `buildSearchParams` in `src/utils/searchParams.ts`. `limit` is omitted from the URL when it equals the default (100).

When `SearchForm` submits a new search, it always sets `page: 1` in the resulting URL.

## API Integration

`fetchEvents` in `src/utils/api.ts`:
- The URL and UI use 1-indexed pages (first page = 1); `fetchEvents` translates to 0-indexed before sending (sends `page=0` when `page === 1`)
- Omits `page` from the request when it equals 1 (translates to 0, which is the server default)
- Omits `limit` from the request when it equals 100 (server default)

Do not use `links.next/previous/first/last` from the API response — the backend does not populate them. Derive all pagination state client-side from `meta.total`, `limit`, and `page`.

## Pagination Component

New component at `src/components/Pagination/Pagination.tsx`.

**Props:** `page: number`, `limit: number`, `total: number`, `onNavigate: (page: number, limit: number) => void`

**Renders:**
- "Page X of Y" label with Prev and Next buttons (disabled at boundaries)
- Numbered page links showing up to 7 entries with ellipsis gaps for large ranges (e.g. `1 … 4 5 6 … 20`)
- A `<select>` for page size with options 100 / 500 / 1000; changing it resets to page 1

`SearchResults` renders `Pagination` both above and below the table, passing `onNavigate` as a callback that updates the URL search params.

## Data Flow

The index route passes `searchParams` (including `page` and `limit`) down to `SearchResults`. `SearchResults` includes `page` and `limit` in the `useQuery` key so React Query refetches on changes.

`SearchForm`'s submit handler always sets `page: 1` when constructing the new URL, so any filter change resets to the first page.

## Testing

All tests use MSW for network interception — no direct API mocks.

- **`Pagination` unit tests:** correct total page count from `total`/`limit`; ellipsis logic for large page ranges; Prev disabled on page 1, Next disabled on last page; changing page size resets to page 1
- **`SearchResults` integration tests:** `page` sent correctly; `limit` omitted when 100, included otherwise; submitting a new search resets `page` to 1
- **URL round-trip tests:** `page` and `limit` parse and serialize correctly; `limit` absent from URL when default (100)
