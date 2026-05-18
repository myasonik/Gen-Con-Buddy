# Facet-backed filter controls

**Date:** 2026-05-17
**Backend reference:** Gen-Con-Buddy-API PR #42 — unified `/api/events/facets/{field}` endpoint

## Background

The backend added facet support for 7 new fields beyond `gameSystem`: `group`, `location`, `roomName`, `ageRequired`, `experienceRequired`, `attendeeRegistration`, `specialCategory`. The frontend needs to replace static/plain controls with live facet-backed ones.

## API layer

Generalize the existing `GameSystemFacet` / `GameSystemFacetsResponse` types into shared types in `src/utils/types.ts`:

```ts
export interface FacetValue {
  value: string;
  count: number;
}
export interface FacetResponse {
  error?: string;
  values?: FacetValue[];
}
```

Add a single generic fetch function in `src/utils/api.ts`:

```ts
export async function fetchFacets(field: string): Promise<FacetValue[]>;
```

Remove `fetchGameSystemFacets` and the now-redundant `GameSystemFacet` / `GameSystemFacetsResponse` types. Update MSW handlers to use the generic endpoint pattern.

## Components

### `FacetMultiSelect` (`src/components/FacetMultiSelect/`)

Generic multi-select combobox backed by a facet endpoint.

**Props:** `field: string`, `label: string`, `value: string`, `onValueChange: (v: string) => void`

- Fetches `fetchFacets(field)` via `useQuery`, `staleTime: Infinity`
- Passes options to the existing `MultiCombobox` primitive
- Renders value + count in each option row
- Returns `null` on error (same pattern as current `GameSystemSelect`)

Replaces `GameSystemSelect` entirely. `GameSystemSelect` component and its test file are deleted.

**Used for:** `gameSystem`, `group`, `location`, `roomName`

### `FacetSelect` (`src/components/FacetSelect/`)

Single-select dropdown backed by a facet endpoint, with human-readable label mapping.

**Props:** `field: string`, `label: string`, `labelMap: Record<string, string>`, `value: string`, `onValueChange: (v: string) => void`

- Fetches `fetchFacets(field)` via `useQuery`, `staleTime: Infinity`
- Maps each raw backend value through `labelMap`; falls back to the raw value if not found
- Passes mapped options to the existing `Select` primitive
- Shows count alongside each label

**Used for:** `ageRequired` (`AGE_GROUPS`), `experienceRequired` (`EXP`), `attendeeRegistration` (`REGISTRATION`), `specialCategory` (`CATEGORY`)

## SearchForm changes

- `gameSystem`: replace `<GameSystemSelect>` with `<FacetMultiSelect field="gameSystem" label="Game System">`
- `location`, `roomName`: replace `<Field>` (plain text) with `<FacetMultiSelect>`
- `group`: replace `<Field>` with `<FacetMultiSelect>`; move from "Details" section into "Logistics" (better fit alongside location/roomName)
- `ageRequired`, `experienceRequired`, `attendeeRegistration`, `specialCategory`: replace `<Select options={enumOptions(key)}>` with `<FacetSelect field={key} labelMap={...}>`

Delete the now-unused `enumOptions()` helper from `src/utils/filterFields.ts`. The `FILTER_FIELDS` constant and `FieldDescriptor` types stay — they are still used by active filter chips and the sort drawer.

No URL schema changes needed — `group`, `location`, `roomName` are already `"string"` type (comma-separated, same as `gameSystem`).

## Backend search note

`group`, `location`, and `roomName` currently use full-text `match` on the backend. Comma-separated multi-values produce a token-level OR (approximate, not exact). This is acceptable for now — users select from known facet values so results will be close enough. A follow-up backend change (switch to `NewKeyword(f+".keyword", value)`) would make it exact OR, but is not in scope here.

## Testing

- MSW handlers: add `GET /api/events/facets/:field` happy-path handler in `src/test/msw/handlers.ts`; expose `withNetworkError()` and `withServerError()` variants via `src/test/apiError.ts` pattern
- `FacetMultiSelect.test.tsx`: options rendered, counts shown, loading state, network error (returns null), server error (returns null)
- `FacetSelect.test.tsx`: options rendered with mapped labels, counts shown, loading state, network error, server error
- `GameSystemSelect.test.tsx`: deleted
- `SearchForm.test.tsx`: update MSW overrides for renamed/new facet fields
