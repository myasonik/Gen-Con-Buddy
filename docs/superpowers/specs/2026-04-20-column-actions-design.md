# Column Actions Design

**Date:** 2026-04-20  
**Status:** Approved

## Overview

Add an accessible actions button to each resizable column header. The button opens a popover with sort and resize actions, providing a keyboard-accessible path alongside the existing drag-to-resize handle and click-to-sort button.

## Motivation

The drag-to-resize handle is mouse-only. This design adds a keyboard-accessible resize path (number input in a modal) while also consolidating sort controls into a discoverable popover.

## Header Layout

Each resizable `<th>` contains three controls left-to-right:

1. **Sort button** (existing, unchanged) — click to cycle asc → desc → none
2. **Actions button** — a three-vertical-dots SVG (kebab icon); opens the actions popover
3. **Drag handle** (existing, unchanged) — absolutely positioned at the right edge

The sort button takes remaining width. The actions button and drag handle are positioned at the right edge. The `<th>` already has `position: relative` from the resize implementation.

## Actions Popover

Built with `@base-ui/react` `Popover.Root`, consistent with the existing `Toggletip` pattern.

**Trigger:** The kebab SVG button on the `<th>`.

**Contents (stacked vertically):**

- **Sort Ascending** — `aria-pressed` toggle button. Active when column is sorted ascending. Clicking when inactive sets sort to `field.asc`. Clicking when active clears sort.
- **Sort Descending** — same pattern for `field.desc`. Mutually exclusive with ascending (setting one replaces the other in sort state).
- **Resize…** — plain button that closes the popover and opens the resize dialog.

**Behavior:** Closes on Escape and outside click (Base UI default).

## Resize Dialog

Built with `@base-ui/react` `Dialog.Root`.

**Trigger:** Clicking "Resize…" in the actions popover.

**Contents:**

- Heading: "Resize [Column Name]"
- `<input type="number">` labeled "Width (px)", pre-filled with `header.getSize()`
- "Apply" button — calls `onApply(width)` with the parsed number and closes
- "Cancel" button — closes without changes

**Behavior:** Focus-trapped, closes on Escape, no custom validation (browser native number input).

## Components

### `ColumnActionsPopover`

**Location:** `src/components/SearchResults/ColumnActionsPopover.tsx`

**Props:**

```ts
interface ColumnActionsPopoverProps {
  header: Header<Event, unknown>;
  activeSortField: string | undefined;
  activeSortDir: "asc" | "desc" | undefined;
  onSort: (sort: string | undefined) => void;
  onOpenResize: () => void;
}
```

**Responsibility:** Renders the kebab button and Base UI Popover. Handles sort toggle logic internally (mirrors `handleSortClick` from `SearchResults`). Calls `onOpenResize` when Resize… is clicked.

### `ColumnResizeDialog`

**Location:** `src/components/SearchResults/ColumnResizeDialog.tsx`

**Props:**

```ts
interface ColumnResizeDialogProps {
  columnName: string;
  currentWidth: number;
  onApply: (width: number) => void;
  onClose: () => void;
}
```

**Responsibility:** Renders the Base UI Dialog. Manages local number input state initialized from `currentWidth`. Calls `onApply` with `Number(inputValue)` on Apply, calls `onClose` on Cancel or Escape.

### `SearchResults` changes

- Adds `resizeTarget: { columnId: string; columnName: string; currentWidth: number } | null` state.
- Renders `<ColumnResizeDialog>` when `resizeTarget` is non-null, passing `onApply` which calls `setSizing(prev => ({ ...prev, [resizeTarget.columnId]: width }))` then clears `resizeTarget`.
- Each resizable `<th>` renders `<ColumnActionsPopover>` alongside the existing sort button (between the sort button and the drag handle).

## Testing

### `ColumnActionsPopover.test.tsx`

- Popover opens when kebab button is clicked
- Sort Ascending button has `aria-pressed="false"` when column is unsorted
- Sort Ascending button has `aria-pressed="true"` when column is sorted ascending
- Clicking Sort Ascending (unsorted) calls `onSort("field.asc")`
- Clicking Sort Ascending (already ascending) calls `onSort(undefined)`
- Clicking Sort Descending (ascending active) calls `onSort("field.desc")`
- Clicking Resize… calls `onOpenResize`

### `ColumnResizeDialog.test.tsx`

- Renders with heading "Resize [Column Name]"
- Number input is pre-filled with `currentWidth`
- Clicking Apply calls `onApply` with the input value as a number
- Clicking Cancel calls `onClose` without calling `onApply`

### `SearchResults.test.tsx` additions

- Actions button is present on resizable columns
- Actions button is absent on dayStripe column
- Clicking Resize… on a column opens the resize dialog
- Submitting the resize dialog updates column width in localStorage

## Out of Scope

- Reordering columns
- Column pinning
- Any changes to the drag handle behavior
- Changes to the existing click-to-sort behavior on the sort button
