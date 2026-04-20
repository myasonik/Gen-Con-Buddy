# Column Resizing Design

**Date:** 2026-04-20  
**Status:** Approved

## Overview

Allow users to drag-resize table columns in `SearchResults`. Widths persist to `localStorage` and are reset by the existing "Reset to defaults" button.

## State & Persistence

A new `useColumnSizing` hook (mirroring `useColumnVisibility`) manages column width state:

- Reads initial widths from `localStorage` on mount
- Exposes `sizing` (`ColumnSizingState` — maps column IDs to pixel widths) and `reset`
- `reset` clears stored widths and returns to TanStack defaults
- Wired into `useReactTable` via `state.columnSizing` and `onColumnSizingChange`
- The existing "Reset to defaults" button calls both `useColumnVisibility.reset` and `useColumnSizing.reset`

localStorage key: `gcb-column-sizing` (consistent with `gcb-column-visibility` pattern).

## Table Configuration

- `columnResizeMode: "onChange"` — widths update live during drag
- `dayStripe` column: `enableResizing: false`, keeps fixed 6px width
- All other columns: resizable, widths applied via `header.getSize()` as inline `style={{ width }}`

## Resize Handle

Each resizable `<th>` gets `position: relative`. A resize handle `<div>` is placed as a sibling to the sort button, positioned absolutely at the right edge:

- 4px wide, full cell height
- Visible on `th:hover` with `col-resize` cursor
- While `header.column.getIsResizing()` is true, an `isResizing` class on `<th>` keeps the handle visible
- Calls `header.getResizeHandler()` on `pointerdown`
- No handle rendered for `dayStripe`

## Testing

**`SearchResults.test.tsx`:**

- Drag a resize handle → assert column width attribute changes
- Drag a resize handle → assert new width is written to `localStorage`
- Reset to defaults → assert `localStorage` entry is cleared and column returns to default width

**`useColumnSizing.test.ts`** (co-located with the hook):

- Loads initial sizing from `localStorage` on mount
- Updates state on resize
- `reset` clears `localStorage` and returns to empty sizing state

MSW not needed — resizing is pure client state.

## Out of Scope

- Min/max width clamping (TanStack defaults apply)
- Per-session-only mode (persistence is always on)
