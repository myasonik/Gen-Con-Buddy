# Search Param Schema — Design

**Date:** 2026-05-15  
**Status:** Approved

## Problem

Every URL search parameter must be added to four places in lockstep:

1. `SearchParams` interface (`types.ts`)
2. `coerceSearchParams` (`coerceSearchParams.ts`)
3. `parseSearchParams` (`searchParams.ts`)
4. `buildSearchParams` + `SearchFormValues` (`searchParams.ts` / `types.ts`)

There is no compile-time guard. A field added to only some locations silently falls through — lost from the URL, lost from the API call, or lost from form hydration.

## Solution

Introduce a single `SCHEMA` constant that is the only place a param is ever declared. All types and all conversion functions are derived from it. Adding a param is a one-line edit.

## Architecture

### New file: `src/utils/searchParamSchema.ts`

Single source of truth. Contains:

- `SCHEMA` constant
- Derived `SearchParams` type
- Derived `SearchFormValues` type
- `coerceSearchParams`
- `parseSearchParams`
- `buildSearchParams`
- Private helpers `parseRange`, `parseDateRange`

### Existing files

| File | Change |
|---|---|
| `src/utils/types.ts` | Remove `SearchParams`, `SearchFormValues` |
| `src/utils/coerceSearchParams.ts` | Delete |
| `src/utils/searchParams.ts` | Remove `buildSearchParams`, `parseSearchParams` |
| `src/routes/index.tsx` | Update imports |
| `src/utils/api.ts` | Update `SearchParams` import |
| Any component importing `SearchParams`/`SearchFormValues` | Update imports |
| Test files | Update imports to match new locations |

## Schema

```typescript
export const SCHEMA = {
  // Pagination
  limit:            'number',
  page:             'number',

  // API-computed (never touch the form)
  startDateTime:    'apiOnly',
  endDateTime:      'apiOnly',
  sort:             'apiOnly',

  // Simple string passthroughs
  filter:           'string',
  gameId:           'string',
  title:            'string',
  eventType:        'string',
  group:            'string',
  shortDescription: 'string',
  longDescription:  'string',
  gameSystem:       'string',
  rulesEdition:     'string',
  ageRequired:      'string',
  experienceRequired:       'string',
  materialsProvided:        'string',
  materialsRequired:        'string',
  materialsRequiredDetails: 'string',
  gmNames:          'string',
  website:          'string',
  email:            'string',
  tournament:       'string',
  attendeeRegistration: 'string',
  location:         'string',
  roomName:         'string',
  tableNumber:      'string',
  specialCategory:  'string',
  days:             'string',
  timeStart:        'string',
  timeEnd:          'string',

  // Range fields — encoded as "[min,max]" in the URL
  minPlayers:       'range',
  maxPlayers:       'range',
  duration:         'range',
  roundNumber:      'range',
  totalRounds:      'range',
  minimumPlayTime:  'range',
  cost:             'range',
  ticketsAvailable: 'range',

  // Date range — encoded as "[isoStart,isoEnd]"
  lastModified:     'dateRange',
} as const satisfies Record<string, 'string' | 'number' | 'range' | 'dateRange' | 'apiOnly'>;
```

## Derived Types

```typescript
type Schema = typeof SCHEMA;
type SchemaKey = keyof Schema;

// SearchParams: number for 'number' kinds, string for everything else
export type SearchParams = {
  [K in SchemaKey]?: Schema[K] extends 'number' ? number : string;
};

// SearchFormValues: range → Min/Max, dateRange → Start/End, apiOnly/number → excluded
type FormKey<K extends SchemaKey> =
  Schema[K] extends 'range'     ? `${K}Min` | `${K}Max` :
  Schema[K] extends 'dateRange' ? `${K}Start` | `${K}End` :
  Schema[K] extends 'apiOnly' | 'number' ? never :
  K;

export type SearchFormValues = {
  [K in SchemaKey as FormKey<K>]?: string;
};
```

The resulting types are identical to the current explicit interfaces.

## Generated Functions

All three functions iterate over `SCHEMA` and dispatch on kind. No casts appear outside these generic loops.

### `coerceSearchParams`

Loops over schema keys. Coerces to `number` for `'number'` kinds, `string` for everything else. Unknown keys are ignored.

### `parseSearchParams`

- `'string'`: passes value through unchanged
- `'range'`: splits `[min,max]` → `{key}Min` / `{key}Max`; returns `undefined` pair when param absent
- `'dateRange'`: splits `[isoStart,isoEnd]` → `{key}Start` / `{key}End`, strips `:00Z` suffix
- `'number'`, `'apiOnly'`: skipped (no form fields)

### `buildSearchParams`

- `'string'`: sets key if non-empty
- `'range'`: sets `[min,max]` if either side is present
- `'dateRange'`: sets `[isoStart,isoEnd]` if either side is present, appends `:00Z`
- `'number'`, `'apiOnly'`: skipped (set externally in `handleNavigate` / `handleSort`)

## Adding a New Param

```typescript
// ONE line in SCHEMA — all four behaviors derive automatically:
rulesComplexity: 'string',
```

## Testing

All existing tests continue to pass without modification. Only imports change. No new test cases are required — the schema approach eliminates the class of bug rather than testing around it.
