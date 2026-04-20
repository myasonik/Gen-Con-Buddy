# Sidebar Toggle & Active Filters Design

**Date:** 2026-04-20

## Overview

Two related UX improvements to the search page:

1. The sidebar (filter panel) can be opened and closed. Open width changes from 280px to 360px. State persists in `localStorage`.
2. Active filters are always shown above the results table, regardless of sidebar state. Each filter chip can be clicked to remove that filter.

---

## Layout & Sidebar Toggle

### Token change

Update `--size-sidebar` in `src/styles/tokens.css` from `280px` to `360px` (45 × 8px grid unit).

### State

A `useSidebarOpen()` hook in `src/hooks/useSidebarOpen.ts` wraps `localStorage` with key `"sidebarOpen"`. Defaults to `true`. Returns `[open: boolean, toggle: () => void]`.

### CSS

The shell `<main>` receives a `data-sidebar-open` boolean attribute. CSS handles both states:

```css
.shell {
  grid-template-columns: var(--size-sidebar) 1fr;
}
.shell[data-sidebar-open="false"] {
  grid-template-columns: 0 1fr;
}
```

The sidebar already has `overflow: hidden`, so no additional CSS is needed to hide its content when width collapses to 0. Transition uses `--motion-expand`.

### Toggle button

Lives at the top of the `.results` column (always visible). Uses the existing `Button` primitive. Attributes: `aria-expanded={sidebarOpen}`, `aria-controls="sidebar"`. Labels: `"◀ Filters"` when open, `"▶ Filters"` when closed.

---

## Active Filters

### Utility: `getActiveFilters`

Located at `src/ui/ActiveFilters/getActiveFilters.ts`.

Signature:

```ts
function getActiveFilters(
  params: SearchParams,
): { key: keyof SearchParams; label: string }[];
```

Maps each non-empty `SearchParams` key to a human-readable label. Uses existing enum maps (`EVENT_TYPES`, `AGE_GROUPS`, `EXP`, `REGISTRATION`, `CATEGORY`) for display values. Examples:

| Param         | Value       | Label                       |
| ------------- | ----------- | --------------------------- |
| `eventType`   | `"RPG"`     | `"Type: Role Playing Game"` |
| `days`        | `"fri,sat"` | `"Days: Fri, Sat"`          |
| `cost`        | `"[0,5]"`   | `"Cost: $0–$5"`             |
| `filter`      | `"dragon"`  | `"Search: dragon"`          |
| `ageRequired` | `"21+"`     | `"Age: 21+"`                |

Pagination/sort params (`page`, `limit`, `sort`) are excluded — they are not filters.

### Component: `<ActiveFilters>`

Located at `src/ui/ActiveFilters/ActiveFilters.tsx`.

Props:

```ts
interface ActiveFiltersProps {
  searchParams: SearchParams;
  onRemove: (key: keyof SearchParams) => void;
}
```

Renders nothing when `getActiveFilters(searchParams)` returns an empty array. Otherwise renders a `<div>` containing `<button>` chips — one per active filter. Each chip shows the label and an `×` character. Clicking calls `onRemove(key)`.

### Integration in SearchPage

`handleRemoveFilter` in `index.tsx`:

```ts
const handleRemoveFilter = (key: keyof SearchParams) => {
  void navigate({ search: (prev) => ({ ...prev, [key]: undefined }) });
};
```

`<ActiveFilters>` is placed at the top of the `.results` column, above `<SearchResults>`.

---

## Data Flow

```
SearchPage (index.tsx)
  ├── useSidebarOpen() → [sidebarOpen, toggleSidebar]
  ├── <main data-sidebar-open={sidebarOpen}>
  │     ├── <aside id="sidebar"> → <SearchForm> (unchanged)
  │     └── <div.results>
  │           ├── <button onClick={toggleSidebar}> ← toggle
  │           ├── <ActiveFilters searchParams={search} onRemove={handleRemoveFilter} />
  │           └── <SearchResults> (unchanged)
```

`SearchForm` and `SearchResults` receive no new props.

---

## Testing

| File                                            | Coverage                                                                                                   |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/hooks/useSidebarOpen.test.ts`              | Reads from localStorage, persists on toggle, defaults to `true` when key absent                            |
| `src/ui/ActiveFilters/getActiveFilters.test.ts` | Each param type: plain string, enum lookup, range `[min,max]`, days list, date range                       |
| `src/ui/ActiveFilters/ActiveFilters.test.tsx`   | Renders chips for active params; renders nothing when empty; calls `onRemove` with correct key on click    |
| `src/routes/index.test.tsx`                     | Toggle shows/hides sidebar; filter chips appear after search; clicking a chip removes that filter from URL |
