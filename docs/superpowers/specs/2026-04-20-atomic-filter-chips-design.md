# Atomic Filter Chips Design

## Overview

Each value in a multi-value search param gets its own removable chip in the active filters bar. Today `days="fri,sat"` produces one chip "Days: Fri, Sat"; after this change it produces two chips — "Fri" and "Sat" — each independently removable.

## Interface Change

`ActiveFilter` drops the `key` field and gains a `remove` function:

```ts
export interface ActiveFilter {
  label: string;
  remove: (prev: SearchParams) => SearchParams;
}
```

Each chip carries its own removal logic. Callers no longer need to know which `SearchParams` key a chip belongs to — they just call `filter.remove(prev)` inside `navigate`.

## `getActiveFilters` Logic

Three cases:

**Single-value params** (e.g. `title`, `gameSystem`, `location`, all range params): one chip per param. `remove` clears the whole param.

```ts
remove: (prev) => ({ ...prev, title: undefined });
```

**CSV params** (`days`, `eventType`): split on comma, produce one chip per value. Each chip's `remove` filters only its own value out of the comma-separated string, clearing the param entirely when the last value is removed.

```ts
// days = "fri,sat" → two chips
remove: (prev) => {
  const remaining = prev
    .days!.split(",")
    .filter((d) => d !== "fri")
    .join(",");
  return { ...prev, days: remaining || undefined };
};
```

**Range params** (`cost`, `duration`, `startDateTime`, etc.): commas inside `[min,max]` are part of the syntax, not value separators. These remain single chips. `remove` clears the whole param.

## Component Changes

### `ActiveFilters.tsx`

`onRemove` receives the full `ActiveFilter` object instead of a `keyof SearchParams`:

```tsx
interface ActiveFiltersProps {
  searchParams: SearchParams;
  onRemove: (filter: ActiveFilter) => void;
}
```

The chip `onClick` passes the filter directly:

```tsx
onClick={() => onRemove(filter)}
```

React list `key` uses `label` — naturally unique since each chip has a distinct display string.

### `SearchPage` (`src/routes/index.tsx`)

`handleRemoveFilter` calls `filter.remove` inside `navigate`:

```ts
const handleRemoveFilter = (filter: ActiveFilter) => {
  void navigate({ search: (prev) => filter.remove(prev) });
};
```

No other files change. All splitting logic lives in `getActiveFilters`.

## Testing

**Unit (`getActiveFilters`):**

- `days="fri,sat"` → 2 chips; "Fri" chip `remove` returns `days="sat"`; "Sat" chip `remove` returns `days="fri"`; last chip `remove` clears `days`
- `eventType="RPG,BGM"` → 2 chips; each `remove` removes only its code
- `cost="[0,5]"` → 1 chip (range stays atomic); `remove` clears `cost`
- `title="foo"` → 1 chip; `remove` clears `title`

**Integration (`src/routes/index.test.tsx`):**

- Render with `days=fri,sat` in URL; click "Fri" chip; assert URL has `days=sat` and no `fri`
- Render with `eventType=RPG,BGM`; click "RPG" chip; assert URL has `eventType=BGM`
