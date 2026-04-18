# URL-Driven Form State

## Problem

`react-hook-form` reads `defaultValues` only on initial mount. When the URL changes after mount (browser back/forward, direct URL editing), the form does not re-sync to the new URL state.

## Solution

Add `key={JSON.stringify(search)}` to `<SearchForm>` in `src/routes/index.tsx`.

When the URL search params change, the new key causes React to unmount and remount the form. The fresh mount picks up `parseSearchParams(search)` as `defaultValues`, correctly initializing all fields from the URL.

## Scope

- One-line change in `src/routes/index.tsx`
- No changes to `SearchForm`, `searchParams.ts`, or any other file

## Behavior

- URL → Form: always (on mount and on URL change via back/forward/direct navigation)
- Form → URL: only on submit (unchanged)

## Why this works for all field types

The remount re-runs `parseSearchParams(search)`, which already handles:
- Simple strings (`filter`, `title`, `eventType`, etc.)
- Numeric ranges (`minPlayers`, `cost`, etc.) via `[min,max]` parsing
- Date ranges (`startDateTime`, `endDateTime`, etc.) via `:00Z` stripping
- Booleans (`materialsProvided`, `tournament`)
