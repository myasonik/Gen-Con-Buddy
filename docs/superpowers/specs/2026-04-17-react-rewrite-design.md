# Gen-Con-Buddy React Rewrite

**Date:** 2026-04-17
**Scope:** Full feature-parity rewrite from Ember.js to React/TypeScript/Vite

## Background

The app is a Gen Con event search tool. Users filter 40+ parameters to find events, view results in a configurable table, and navigate to individual event detail pages. It was originally built in Ember.js; this rewrite adopts the stack and principles in `methodology.md`.

## Tech Stack

- Vite 5, React 18, TypeScript 5
- TanStack Router v1 (routing + URL search params)
- TanStack Query v5 (data fetching)
- React Hook Form v7 (filter form)
- Vitest 2 + React Testing Library 16 (testing)
- MSW v2 (network mocking in both dev and test)
- Plain CSS (minimal — just enough to be usable)

## Project Setup

The Ember codebase is deleted in its entirety. A fresh Vite/React/TS project is scaffolded in the same repository. Git history is preserved.

## Routes

`/` is the search page — there is no separate landing page.

- `/` (search) — filter form + results table
- `/event/$id` — event detail page

Route files are thin shells: they read URL search params and pass them to components. All logic lives in `src/components/`.

## Directory Structure

```
src/
  routes/
    index.tsx          # Search page shell
    event.$id.tsx      # Event detail shell
  components/
    SearchForm/
      SearchForm.tsx
      SearchForm.test.tsx
    SearchResults/
      SearchResults.tsx
      SearchResults.test.tsx
    EventDetail/
      EventDetail.tsx
      EventDetail.test.tsx
  hooks/
    useColumnVisibility.ts
    useColumnVisibility.test.ts
  test/
    msw/
      handlers.ts      # Default MSW handlers
      server.ts        # Node server for Vitest
      browser.ts       # Service worker for dev
  utils/
    enums.ts           # Event types, age groups, experience levels, etc.
```

## Data Flow

1. User lands on `/` — TanStack Router reads URL search params and passes them as `defaultValues` to `SearchForm`.
2. User edits filters — React Hook Form holds draft state locally. No fetch is triggered while editing.
3. User submits the form — `navigate({ to: '/', search: formValues })` commits the filter state to the URL.
4. TanStack Query key includes the URL search params — triggers `GET /api/events/search?...`.
5. Results render in `SearchResults`.

The URL always reflects the last committed search (shareable and bookmarkable). The form can diverge from the URL while the user is editing without triggering a new fetch.

## API Contract

The backend is a JSON:API-flavored Go service.

**Search endpoint:** `GET /api/events/search`

Query params: all filter fields by name, plus `limit` (default 100, max 5000) and `page` (default 0).

Response shape:

```json
{
  "data": [{ "id": "...", "type": "events", "attributes": { ... } }],
  "meta": { "total": 42 },
  "links": { "self": "...", "first": "...", "last": "...", "next": "...", "previous": "..." },
  "error": null
}
```

Event attributes include: `gameId`, `title`, `shortDescription`, `longDescription`, `eventType`, `gameSystem`, `rulesEdition`, `minPlayers`, `maxPlayers`, `ageRequired`, `experienceRequired`, `materialsProvided`, `startDateTime`, `duration`, `endDateTime`, `gmNames`, `website`, `email`, `tournament`, `roundNumber`, `totalRounds`, `minimumPlayTime`, `attendeeRegistration`, `cost`, `location`, `roomName`, `tableNumber`, `specialCategory`, `ticketsAvailable`, `lastModified`, `group`, `year`, `alsoRuns`, `prize`, `rulesComplexity`.

## Components

### SearchForm

React Hook Form with all 40+ filter fields. Receives current URL search params as `defaultValues`. On submit, navigates with form values as URL search params. Includes a reset action that clears all filters.

### SearchResults

Receives the TanStack Query result. Renders a `<table>`. Above the table, a `<details>`/`<summary>` disclosure ("Customize columns") contains a checklist of all ~30 columns. Checking/unchecking a column shows/hides it in the table. Each row links to `/event/$id`. Renders an empty state when there are no results.

### EventDetail

Fetches a single event by `gameId` (TanStack Query, filtered search against the same endpoint). Renders all event fields in a `<dl>`.

### useColumnVisibility

Custom hook backed by `localStorage`. Exposes `{ visibility, toggle }` where `visibility` is a `Record<string, boolean>`. On mount, reads stored state; if the stored version constant doesn't match the current one, resets to defaults. Defaults mirror current app behavior (title, short description, min/max players, day, start/end time, tickets available are on by default).

## MSW Setup

- `src/test/msw/handlers.ts` — default handler for `GET /api/events/search` returning a small set of seeded fake events built with a factory function.
- `src/test/msw/server.ts` — MSW Node server, started in Vitest setup file.
- `src/test/msw/browser.ts` — MSW service worker, started in `main.tsx` in development only.

Per-test overrides use `server.use(...)`. No direct module mocking anywhere.

## Testing Strategy

TDD strictly: failing test before any implementation. Tests co-locate with their components.

**SearchForm:** form renders all filter fields; submitting with values navigates to correct URL search params; reset clears all fields.

**SearchResults:** renders correct columns per visibility state; column toggle updates display; event row links to correct detail route; empty state renders when results are empty.

**useColumnVisibility:** returns defaults on first use; persists toggles across re-mounts (via localStorage); resets to defaults on version mismatch.

**EventDetail:** renders all event fields; handles not-found state gracefully.

## CSS

Minimal plain CSS only — enough to make the app usable (readable table, basic form spacing). No porting of existing Ember styles.
