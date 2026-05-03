# ADR 001: URL as Source of Truth for Search/Filter State

**Status:** Accepted

## Context

The search/filter page needs shareability, bookmarkability, and back-button support. Users should be able to copy a URL and share it with the exact same filter combination applied, or use the browser back button to return to a previous search. Local React state and context don't survive page refresh or URL sharing.

## Decision

URL search params are the single source of truth for all search/filter state. All mutations go through `navigate()`, not `setState`. The route's `validateSearch` option (implemented via `coerceSearchParams`) normalises incoming params, and `Route.useSearch()` provides the typed state to components. Every filter interaction — submitting the search form, changing sort, paginating, removing a filter chip — calls `navigate()` with an updated search object.

## Consequences

- Components read filter state from the URL via `Route.useSearch()`. There is no local React state for filter values.
- Deep-linking and back navigation work without any extra effort.
- The `validateSearch` / `coerceSearchParams` layer is the single place responsible for sanitising raw URL params into the typed `SearchParams` shape.
- Any filter state not in the URL is invisible to sharing and navigation.
