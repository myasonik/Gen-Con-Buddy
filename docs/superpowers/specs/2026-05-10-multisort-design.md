# Multisort Design

**Date:** 2026-05-10
**Scope:** Frontend (Gen-Con-Buddy) + Backend (Gen-Con-Buddy-API)

## Overview

Replace single-field sorting with multisort across the search results and changelog pages. Users configure sort order via a new `SortDrawer` UI; column header clicks continue to work as a quick-add mechanism.

---

## Wire Format & Core Types

### URL / API format

A single comma-separated string in the `sort` query param:

```
?sort=startDateTime.asc,title.desc
```

`SearchParams.sort` stays `string | undefined` — no type change. Single-sort URLs parse identically to today.

### Types

`SortState` in `src/utils/types.ts` is unchanged:

```ts
interface SortState {
  field: string;
  dir: "asc" | "desc";
}
```

Multisort is `SortState[]`.

### New/updated utilities (`src/utils/`)

| Utility                                  | Description                                                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `parseSorts(str)`                        | Replaces `parseSortString`. Splits on `,`, returns `SortState[]`. Returns `[]` on empty/invalid input. |
| `serializeSorts(sorts)`                  | Joins to `"field.dir,..."`. Returns `undefined` when array is empty.                                   |
| `sortEventsMulti(events, sorts)`         | Replaces `sortEvents`. Applies criteria in order; earlier entries are the primary sort.                |
| `addSort(sorts, field)`                  | Appends `{ field, dir: "asc" }` if field not already present.                                          |
| `removeSort(sorts, field)`               | Removes entry by field.                                                                                |
| `setSortDir(sorts, field, dir)`          | Updates direction for an existing entry.                                                               |
| `reorderSort(sorts, fromIndex, toIndex)` | Moves entry to new position.                                                                           |

`parseSortString` and `sortEvents` are deleted; all callers updated.

### Prop changes everywhere

`activeSortField: string | undefined` + `activeSortDir: "asc" | "desc" | undefined` are replaced with `activeSort: SortState[]` across `EventTable`, `ColumnActionsPopover`, `EventGroup`, and `ChangelogEntryPanel`.

---

## Backend (Gen-Con-Buddy-API)

### Wire format

A single `sort` param, comma-separated: `?sort=startDateTime.asc,title.desc`. Passing multiple separate `sort=` params (e.g. `?sort=a.asc&sort=b.desc`) remains a 400 error.

### `SearchRequest` changes

```go
// Before
SortField Field
SortDir   string

// After
Sorts []SortEntry  // type SortEntry struct { Field Field; Dir string }
```

### `event_handler.go`

The `case "sort":` block splits the single value on `,`, calls `event.ParseSort` on each segment, and populates `searchReq.Sorts`. Still rejects `len(values) > 1`.

### `repo.go`

Builds the OpenSearch `sort` array from `req.Sorts`. Falls back to `startDateTime asc` when empty. Each entry applies the `.keyword` subfield for text fields.

### `ParseSort`

Unchanged — still parses a single `"field.dir"` token. Now called in a loop.

---

## SortDrawer Component

**File:** `src/components/EventTable/SortDrawer.tsx`

### Props

```ts
interface SortDrawerProps {
  activeSort: SortState[];
  onSort: (sorts: SortState[]) => void;
  columnVisibility: Record<string, boolean>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

### Drawer trigger button

Shows a count badge when `activeSort.length > 0` (e.g. "Sort · 2").

### Controlled Drawer

`src/ui/Drawer/Drawer.tsx` gains optional `open?: boolean` and `onOpenChange?: (open: boolean) => void` props wired to `Dialog.Root`'s controlled mode.

### Combobox (add field)

- Label: "Pick fields to sort by"
- Single-select (not `MultiCombobox`) — selecting a field is a one-shot add action
- Two option groups rendered inside the dropdown:
  - **Visible columns** — columns where `visibility[colId] !== false`, in `COLUMNS` array order
  - **Hidden columns** — remaining columns, alphabetical order
- Fields already in `activeSort` are excluded from both groups
- Selecting a field calls `addSort(activeSort, field)` with default `asc` and resets the input

### Empty state

When `activeSort.length === 0`: render a muted `<p>No fields sorted</p>` (inline text, not `EmptyState`).

### Sort list

A `<ul>` wrapped in dnd-kit's `DndContext` + `SortableContext` (vertical list strategy). Each `<li>` uses `useSortable` and contains, in order:

1. `<GripVertical>` drag handle (Lucide)
2. Up / Down arrow buttons — call `reorderSort`; disabled at list boundaries
3. Field display name (from `COLUMNS` header string)
4. Asc/Desc toggle button — calls `setSortDir`
5. Remove button (× icon) — calls `removeSort`

### Footer

"Clear sorting" button — calls `onSort([])`. Rendered only when `activeSort.length > 0`.

---

## EventTable & ColumnActionsPopover

### `EventTable` prop changes

- Remove: `activeSortField`, `activeSortDir`
- Add: `activeSort: SortState[]` (default `[]`)
- Add: `onOpenSortDrawer?: () => void`

### Column header click behavior

| Active sort count | Click same field            | Click different field     |
| ----------------- | --------------------------- | ------------------------- |
| 0                 | Set to asc                  | Set to asc                |
| 1                 | Toggle dir (asc→desc→clear) | Add field (now 2 sorts)   |
| 2+                | Call `onOpenSortDrawer()`   | Call `onOpenSortDrawer()` |

### Header sort indicator

Arrow up/down on any column whose `sortField` appears anywhere in `activeSort`. No rank badge.

### `ColumnActionsPopover` prop changes

- Replace: `activeSortField`, `activeSortDir`
- Add: `activeSort: SortState[]`
- Add: `onOpenSortDrawer: () => void`

### Popover sort button behavior

| Condition                                           | Buttons shown                                                     |
| --------------------------------------------------- | ----------------------------------------------------------------- |
| Field not in `activeSort`, `activeSort.length < 2`  | "Sort ascending" + "Sort descending" (direct action)              |
| Field not in `activeSort`, `activeSort.length >= 2` | "Sort by this field…" → calls `onOpenSortDrawer()`                |
| Field in `activeSort`                               | "Sort ascending" + "Sort descending" (functional) + "Remove sort" |

---

## SearchResults & Search Page Wiring

### `SearchResults` changes

- Parse `searchParams.sort` → `SortState[]` via `parseSorts`
- Add `sortDrawerOpen: boolean` state
- `onSort` callback: calls `serializeSorts`, navigates with result (or `undefined` when empty)
- Pass to `SortDrawer`: `activeSort`, `onSort`, `columnVisibility` (from `sharedColumnState.visibility`), `open={sortDrawerOpen}`, `onOpenChange`
- Pass to `EventTable`: `activeSort`, `onSort`, `onOpenSortDrawer={() => setSortDrawerOpen(true)}`

### `SearchResults` prop change

`onSort` prop changes from `(sort: string | undefined) => void` to `(sorts: SortState[]) => void`. `SearchResults` serializes to a string internally before calling the route's `handleSort`. `handleSort` in `index.tsx` stays `(sort: string | undefined) => void` — no change needed there.

---

## Changelog Wiring

### `openParam` URL format change

The inner map changes from `Map<groupKey, SortState | undefined>` to a single `SortState[] | undefined` per entry:

```
Before: Map<position, Map<groupKey, SortState | undefined>>
After:  Map<position, SortState[] | undefined>
```

`parseOpenParam` and `serializeOpenParam` are updated accordingly.

### `ChangelogEntryPanel` changes

- Owns sort state: reads `activeSort: SortState[]` from its entry's slot in `openParam` (via `parseOpenParam`)
- Owns `sortDrawerOpen: boolean` state
- `makeOnSort(group)` removed; single `syncEntrySortToUrl` handler updates the entry's sort in the URL
- All three `EventGroup` instances receive the same `activeSort` and `onSort`
- Renders a per-entry sort controls row (above the EventGroups) containing only a `SortDrawer`
- Passes `onOpenSortDrawer={() => setSortDrawerOpen(true)}` to each `EventTable`

### `ColumnControlsPanel` — no changes

`ColumnControlsPanel` is page-level (Visibility + Format, shared across all entries). Sort is per-entry, so the `SortDrawer` lives inside `ChangelogEntryPanel` directly, not in `ColumnControlsPanel`. No prop threading through `ChangelogPage` or `ChangelogRow` is required.

---

## Dependencies

`@dnd-kit/core` and `@dnd-kit/sortable` are not currently installed. Both packages are required and must be added.

---

## Testing Strategy

### New utility tests

- `parseSorts` / `serializeSorts`: round-trip, single entry, multiple entries, malformed input, empty string
- `sortEventsMulti`: single-field (parity with existing `sortEvents` tests), multi-field tiebreaking
- `addSort`, `removeSort`, `setSortDir`, `reorderSort`: unit tests for each operation

### `SortDrawer.test.tsx`

- Empty state renders "No fields sorted"
- Combobox: visible columns in top group, hidden in bottom group, already-sorted fields absent
- Adding a field appends it to the list at asc
- Up/Down buttons reorder; disabled at boundaries
- Asc/Desc toggle updates direction
- Remove button removes the field
- "Clear sorting" fires `onSort([])`
- Keyboard drag-and-drop reorders (dnd-kit supports keyboard DnD)

### `EventTable.test.tsx` additions

- Header click with 0 sorts → sets sort to asc
- Header click with 1 sort on same field → toggles direction
- Header click with 1 sort on different field → adds (now 2 sorts)
- Header click with 2+ sorts → calls `onOpenSortDrawer`

### `ColumnActionsPopover.test.tsx` additions

- Not sorted + 0–1 active: shows "Sort ascending" / "Sort descending"
- Not sorted + 2+ active: shows "Sort by this field…" only
- Sorted: shows both direction buttons + "Remove sort"

### Backend tests (`internal/event/`)

- Handler: parses comma-separated sort param correctly; rejects multiple `sort=` params
- Repo: builds correct multi-entry OpenSearch sort array; falls back to default when `Sorts` is empty
