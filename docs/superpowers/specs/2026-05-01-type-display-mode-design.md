# Type Display Mode

**Date:** 2026-05-01

## Overview

Users can choose how event type is displayed in the "Type" table column: the 3-letter code only, the full name only, or both (default). The preference persists across sessions.

## Data Model

A new `useTypeDisplay` hook in `src/hooks/useTypeDisplay.ts` owns the preference. It follows the same shape as `useColumnVisibility`: a value typed as `'code' | 'name' | 'both'`, defaulting to `'both'`, persisted via `useStoredState` under the key `gen-con-buddy-type-display` at version 1.

The three values map to the following rendered output in the Type column:

| Value  | Example output          |
| ------ | ----------------------- |
| `code` | RPG                     |
| `name` | Role Playing Game       |
| `both` | RPG - Role Playing Game |

`'name'` strips the `"CODE - "` prefix from the `EVENT_TYPES[code]` label. If a code is unknown, all three modes fall back to rendering the raw code string.

## Column Cell Renderer

`columns.tsx` augments TanStack Table's `TableMeta` interface (same module-augmentation pattern already used for `ColumnMeta`):

```ts
declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    typeDisplay?: "code" | "name" | "both";
  }
}
```

The `eventType` cell reads `table.options.meta?.typeDisplay`, falling back to `'both'` if absent. `EventTable` calls `useTypeDisplay()` and passes the value into `useReactTable({ meta: { typeDisplay } })`.

The preference is **not** added to `SharedColumnState` — it is a global display preference, not per-table instance state.

## Slider UI

A new `TypeDisplaySlider` component in `src/ui/TypeDisplaySlider/`. It renders:

- A native `<input type="range" min="0" max="2" step="1">` with an associated `<datalist>` for tick marks
- Visible labels "Code", "Name", "Both" beneath the three stops
- Styled via CSS Module

Stop-to-value mapping: `0 → 'code'`, `1 → 'name'`, `2 → 'both'`.

Props: `value: 'code' | 'name' | 'both'` and `onChange: (value: 'code' | 'name' | 'both') => void`.

The slider lives in the "Customize columns" `<details>` panel in `EventTable`, visually separated from the column visibility checkboxes by a divider. The existing "Reset to defaults" button resets column visibility, column sizing, **and** `typeDisplay` back to `'both'`.

## Testing

1. **`useTypeDisplay.test.ts`** — default is `'both'`, updates persist to localStorage, version mismatch falls back to default.
2. **`TypeDisplaySlider.test.tsx`** — renders correctly for each value, fires `onChange` when the slider moves.
3. **`columns.test.tsx`** (new) — unit tests the `eventType` cell for all three `typeDisplay` values, plus fallback for an unknown code.
4. **`EventTable` / `SearchResults` integration** — one test confirming the slider in the panel changes the rendered text in the Type column.
