# Game System Typeahead — Design Spec

**Date:** 2026-05-06
**Issue:** [#20 Introduce game system typeahead](https://github.com/myasonik/Gen-Con-Buddy/issues/20)
**Backend:** [API PR #34](https://github.com/pkbigmarsh/Gen-Con-Buddy-API/pull/34) (merged)

## Context

The backend now serves `GET /api/events/facets/gameSystem` returning all distinct game system values with event counts. Critically, the `gameSystem` search parameter now requires exact keyword matches — partial/fuzzy input no longer works. The existing plain `<input type="text">` for game system in the Advanced Filters drawer must be replaced with a typeahead that guides users to valid values.

## Decision summary

- **Multi-select** with chip UX (same model as `EventTypeSelect`)
- **Stays in the Advanced Filters drawer** under the Details fieldset
- **Facets fetched lazily** on first drawer open, cached for the session (`staleTime: Infinity`)

## Architecture

### 1. `src/ui/MultiCombobox/MultiCombobox.tsx`

A new shared primitive in the `src/ui/` design system library. Extracts all repeated `@base-ui/react/combobox` boilerplate shared between `EventTypeSelect` and the new `GameSystemSelect`.

**Props:**

```ts
interface MultiComboboxOption {
  value: string;
  label: string;
}

interface MultiComboboxProps {
  label: string;
  value: string;                  // comma-separated selected values
  onValueChange: (value: string) => void;
  options: MultiComboboxOption[];
  filterOption?: (option: MultiComboboxOption, filterText: string) => boolean;
  renderChipContent?: (option: MultiComboboxOption, isOpen: boolean) => React.ReactNode;
  renderOptionContent?: (option: MultiComboboxOption) => React.ReactNode;
  isLoading?: boolean;
}
```

**Defaults:**
- `filterOption`: contains-match on `option.value` and `option.label` via `Combobox.useFilter()`
- `renderChipContent`: `option.label`
- `renderOptionContent`: `option.label`
- `isLoading`: `false` — input is disabled and placeholder reads "Loading…" when `true`

**Handles:** open/filter state, chip scaffolding with `Chip` + remove button, backspace-to-remove-last, `Combobox.ItemIndicator` checkmark, focus/blur open management.

All CSS moves to `MultiCombobox.module.css`. Styles are identical to the current `EventTypeSelect.module.css`.

### 2. `EventTypeSelect` refactored

`EventTypeSelect` becomes a thin wrapper (~30 lines) that provides domain-specific renderers to `MultiCombobox`:

- `filterOption`: matches on event code OR human-readable name
- `renderChipContent`: icon + code text + full name (only shown when dropdown is open)
- `renderOptionContent`: icon + code badge + name text

Behavior is unchanged; existing tests pass without modification.

### 3. `fetchGameSystemFacets()` in `src/utils/api.ts`

```ts
async function fetchGameSystemFacets(): Promise<{ value: string; count: number }[]>
```

Fetches `GET /api/events/facets/gameSystem`. Returns the `values` array sorted as the API provides (by count descending). Throws on non-OK response.

Type `GameSystemFacetsResponse` added to `src/utils/types.ts`.

### 4. `src/components/GameSystemSelect/GameSystemSelect.tsx`

Fetches facets via `useQuery({ queryKey: ['gameSystemFacets'], queryFn: fetchGameSystemFacets, staleTime: Infinity })`.

Maps the response to `MultiComboboxOption[]` — the API's `facet.value` string (e.g. `"Dungeons & Dragons 5E"`) becomes both `option.value` and `option.label`, since the game system name is the canonical identifier. Passes a custom `renderOptionContent` that appends event count as secondary text.

No custom chip renderer — default label display is sufficient.

## Data flow

`GameSystemSelect` mounts only when the drawer opens (`Dialog.Portal` unmounts children when closed). First mount fires the `useQuery` fetch. Subsequent opens hit the in-memory cache instantly. The `gameSystem` form field remains a comma-separated string, matching the existing `SearchFormValues` shape — no type changes required.

## Error handling & edge cases

| Scenario | Behaviour |
|---|---|
| Fetching | Input disabled, placeholder "Loading…" |
| Fetch error | `GameSystemSelect` renders `null` — field silently absent from drawer |
| Empty API result | Empty option list; user sees no suggestions |
| Pre-filled URL param (bookmarked/shared) | Chips render immediately from the comma-separated value. `MultiCombobox` must handle selected values not yet present in `options` — chip label falls back to the raw value string until options load |

## Testing

### `MultiCombobox` unit tests
- Renders selected values as chips
- Type-to-filter narrows the options list
- Selecting an option adds it; deselecting removes it
- Backspace on empty input removes the last chip
- Custom `renderChipContent` and `renderOptionContent` are called with correct args
- `isLoading={true}` disables the input

### `EventTypeSelect` tests
- Existing test suite passes without changes (refactor only)

### `GameSystemSelect` tests (MSW)
- Shows loading state while `GET /api/events/facets/gameSystem` is pending
- Renders options from the API response
- Selecting a game system updates the form value as a comma-separated string
- Error response causes the component to render nothing

### `SearchForm` tests
- Existing tests pass
- One new assertion: the Game System field renders chips (not a plain `<input>`) when options are available

### MSW default handlers
- Add `GET /api/events/facets/gameSystem` to `src/test/msw/handlers.ts` returning a small fixture list (3–5 systems with counts)
