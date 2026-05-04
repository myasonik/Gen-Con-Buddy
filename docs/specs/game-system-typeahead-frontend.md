# Game System Typeahead — Frontend Spec

## Summary

Replace the plain text `gameSystem` input in the Advanced Filters drawer with a multi-select combobox typeahead. Extract shared combobox logic from `EventTypeSelect` into a new `src/ui/MultiCombobox/` primitive. Build `GameSystemSelect` on top of it.

---

## 1. New Primitive: `src/ui/MultiCombobox/`

### Purpose

A reusable headless multi-select combobox built on `@base-ui/react` Combobox. Handles open/close state, filter text, keyboard nav, backspace-to-remove, and ARIA. Styling via CSS Modules.

### Files

```
src/ui/MultiCombobox/
  MultiCombobox.tsx
  MultiCombobox.module.css
  MultiCombobox.test.tsx
```

### API

```tsx
// Top-level component
<MultiCombobox.Root
  value={string}              // comma-joined selected values
  onValueChange={(v) => void} // called with new comma-joined string
  options={Option[]}          // { value: string; label: string }[]
  label={string}              // visible label text
  placeholder={string}        // input placeholder when empty
  addPlaceholder={string}     // input placeholder when items are selected
  renderChip?                 // optional render prop: (value, label, onRemove) => ReactNode
  renderOption?               // optional render prop: (value, label, selected) => ReactNode
/>
```

`Option`:

```ts
interface Option {
  value: string;
  label: string;
}
```

### Sub-components (composable, exported from MultiCombobox.tsx)

- `MultiCombobox.Root` — manages state, renders the Base UI `Combobox.Root` + input group + list
- Internal — input group border, trigger chevron, list container all styled in `MultiCombobox.module.css`

### Behavior

- Options filtered client-side using `Combobox.useFilter().contains()` against both `value` and `label`.
- Selecting an item adds it to the comma-joined value; selecting again removes it.
- Backspace on empty input removes the last selected value.
- Blur (focus leaving the component) closes the list and clears filter text.
- `renderChip` defaults to a `<Chip tone="accent">` showing `label`.
- `renderOption` defaults to label text + a checkmark indicator for selected items.

### CSS

Extract shared chrome from `EventTypeSelect.module.css` into `MultiCombobox.module.css`:

- Input group border/focus ring
- Trigger button
- List container (popup positioning, shadow, border-radius)
- Item hover/selected states
- Item indicator (checkmark)

`EventTypeSelect.module.css` retains only event-type-specific styles (icon sizing, badge pill, etc.).

---

## 2. Refactor: `EventTypeSelect`

`EventTypeSelect` is refactored to use `MultiCombobox.Root` with custom `renderChip` and `renderOption` props that add the event type icon and code badge. No behavior changes — this is a mechanical refactor.

Write tests verifying behavior is unchanged before refactoring (or confirm existing tests cover it).

---

## 3. New Component: `src/components/GameSystemSelect/`

### Files

```
src/components/GameSystemSelect/
  GameSystemSelect.tsx
  GameSystemSelect.test.tsx
```

### API

```tsx
<GameSystemSelect
  value={string}              // comma-joined selected game system strings
  onValueChange={(v) => void}
/>
```

### Data fetching

Fetches game system values from `GET /api/events/facets/gameSystem` via React Query.

```ts
useQuery({
  queryKey: ["facets", "gameSystem"],
  queryFn: fetchGameSystemFacets, // new function in src/utils/api.ts
  staleTime: Infinity,
});
```

Add `fetchGameSystemFacets` to `src/utils/api.ts`:

```ts
export async function fetchGameSystemFacets(): Promise<string[]> {
  const res = await fetch("/api/events/facets/gameSystem");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { values: string[] };
  return data.values;
}
```

### Rendering

Uses `MultiCombobox.Root` with:

- `options` mapped from `string[]` → `{ value: s, label: s }` (identity — game system values are their own labels)
- `label="Game System"`
- `placeholder="Filter systems…"` / `addPlaceholder="Add system…"`
- Default chip and option rendering (no custom icons needed)

Shows a disabled/skeleton state while the facet query is loading.

---

## 4. SearchForm Integration

In `src/components/SearchForm/SearchForm.tsx`:

- Replace the `<Field label="Game System"><input ... /></Field>` in the "Details" fieldset with `<GameSystemSelect>`.
- Wire to `watch("gameSystem")` and `setValue("gameSystem", v)` — same as `EventTypeSelect`.

---

## 5. ActiveFilters Update

In `src/components/ActiveFilters/getActiveFilters.ts`:

Change the `gameSystem` entry in `FILTER_DEFS` from:

```ts
{ type: "plain", key: "gameSystem", label: "System", icon: RuleBook }
```

to:

```ts
{ type: "multi", key: "gameSystem", map: {}, prefix: "gameSystem", icon: RuleBook }
```

The `"multi"` handler falls back to `code` when a key is not found in `map`, so passing `{}` renders each selected game system as its own removable chip with the system name as the label.

---

## 6. API Types / Search Params

No changes to `SearchFormValues`, `SearchParams`, `buildSearchParams`, or `parseSearchParams`. The `gameSystem` field is already `string` (comma-joined) throughout.

---

## 7. MSW Handlers

Add a handler for the new facet endpoint in `src/test/msw/handlers.ts`:

```ts
http.get("/api/events/facets/gameSystem", () =>
  HttpResponse.json({ values: ["Dungeons & Dragons 5E", "Pathfinder 2E", "Stars Without Number"] }),
);
```

Update `src/test/msw/factory.ts` if needed.

---

## 8. Test Requirements

All tests written first (TDD).

| Component          | What to test                                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `MultiCombobox`    | renders options, filters on input, selects/deselects, backspace removes last, closes on blur, chip remove works, keyboard nav |
| `GameSystemSelect` | shows options from facet response, multi-select commits comma-joined value, loading state, empty state                        |
| `EventTypeSelect`  | existing tests pass unchanged after refactor                                                                                  |
| `getActiveFilters` | `gameSystem` multi-value produces one chip per system, each with correct remove behavior                                      |
| `SearchForm`       | `GameSystemSelect` rendered in drawer, selected values appear in form state                                                   |

---

## Out of Scope

- Promoting `GameSystemSelect` to the primary search strip (decided: stays in drawer).
- Free-text fallback for unrecognized game system values (decided: selection-only, keyword match).
- Generic `MultiCombobox` support for icons per-option (handled via `renderOption` prop if needed in future).
