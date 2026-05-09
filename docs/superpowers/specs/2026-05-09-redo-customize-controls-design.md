# Redo Customize Controls — Design

**Date:** 2026-05-09

## Overview

Reorganize the table toolbar and filter drawer to give each concern its own named entry point: Visibility (column show/hide), Format (column display options), Sort (ordering), and Filters (advanced search). The current `ColumnControlsPanel` inline `<AnimatedDetails>` panel on desktop is removed; all controls move into left-side drawers accessible from a controls bar that shares a row with pagination.

## 1. Filters drawer → right side

In `SearchForm.tsx`, the `<Drawer>` wrapping Advanced Filters gains `side="right"`. One-line change.

## 2. Controls bar layout

`SearchResults` currently renders a controls bar containing only `<Pagination singleLine />`. The new layout:

```
[Visibility] [Format] [Sort]          [← 1 2 3 →]
```

Three buttons on the left, pagination anchored right via `justify-content: space-between`. All three buttons open left-side drawers.

The `ColumnControlsPanel variant="inline"` (`<AnimatedDetails>`) is removed. Desktop now uses the same drawer pattern as mobile.

On mobile, `mobileControls` currently renders a single "Customize columns" drawer button. It becomes the same three buttons (Visibility, Format, Sort).

## 3. Visibility drawer

**Trigger:** "Visibility" button in the controls bar. Opens a left-side drawer titled "Visibility".

**Contents:**

- Column checkbox groups (same grouping as current `ColumnControlsPanel`)
- "Reset" button → `resetVisibility()` + `resetSizing()`

`ColumnControlsPanel` (both variants) is deleted; `VisibilityDrawer` replaces it entirely.

## 4. Format drawer

**Trigger:** "Format" button in the controls bar. Opens a left-side drawer titled "Format".

**Contents:**

- **Event type column** fieldset: show icon checkbox + Code/Name/Both segmented control
- **Day column** fieldset: Day/MM/DD/YY/Full date segmented control
- "Reset" button → `resetTypeDisplay()` + `resetDayFormat()`

### Inline format controls in ColumnActionsPopover

The same format controls also appear inline at the bottom of the `⋮` column actions popover for their respective columns:

- Event type column `⋮` → shows `TypeFormatControls`
- Day column `⋮` → shows `DayFormatControls`

`ColumnActionsPopover` gains an optional `formatControls?: React.ReactNode` prop. `EventTable` passes the appropriate sub-component when rendering those two columns.

`TypeFormatControls` and `DayFormatControls` are exported from `FormatDrawer.tsx` for reuse in both the drawer and the popover.

## 5. Sort drawer (stub)

**Trigger:** "Sort" button in the controls bar. Opens a left-side drawer titled "Sort".

**Contents:** Empty for now — body content is deferred to a later task. The component shell (`SortDrawer.tsx`) is created so the button and drawer chrome are in place.

## 6. Component map

### New files (`src/components/EventTable/`)

| File                        | Purpose                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| `VisibilityDrawer.tsx`      | Drawer button + column visibility checkboxes                                                |
| `VisibilityDrawer.test.tsx` | Tests                                                                                       |
| `FormatDrawer.tsx`          | Drawer button + type/day format controls; exports `TypeFormatControls`, `DayFormatControls` |
| `FormatDrawer.test.tsx`     | Tests                                                                                       |
| `SortDrawer.tsx`            | Drawer button stub (empty body)                                                             |
| `SortDrawer.test.tsx`       | Tests                                                                                       |

### Modified files

| File                       | Change                                                                                                                                                      |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SearchForm.tsx`           | Add `side="right"` to Filters `<Drawer>`                                                                                                                    |
| `SearchResults.tsx`        | Controls bar: add three drawer buttons left of pagination; remove `ColumnControlsPanel` import; apply to both desktop and mobile views                      |
| `ChangelogPage.tsx`        | Replace `ColumnControlsPanel` with `VisibilityDrawer` + `FormatDrawer` buttons in a small controls bar above the changelog section (no Sort, no pagination) |
| `ColumnActionsPopover.tsx` | Add `formatControls?: React.ReactNode` prop; render at bottom of popup                                                                                      |
| `EventTable.tsx`           | Pass `formatControls` for event type and day columns; remove `showColumnControls` prop and dead `ColumnControlsPanel` call                                  |

### Deleted files

- `src/components/EventTable/ColumnControlsPanel.tsx`
- `src/components/EventTable/ColumnControlsPanel.test.tsx`

## Testing

All new components covered by unit tests using MSW where network interception is needed (not required here — these are pure UI). Tests verify:

- `VisibilityDrawer`: renders trigger, opens drawer, checkbox toggles call `toggleVisibility`, reset calls both reset fns
- `FormatDrawer`: renders trigger, opens drawer, segmented controls call setters, reset calls both reset fns; `TypeFormatControls` and `DayFormatControls` sub-components are testable in isolation
- `SortDrawer`: renders trigger, opens drawer (empty body)
- `ColumnActionsPopover`: when `formatControls` prop is provided, renders it at the bottom of the popup; when absent, renders nothing extra
- `SearchResults`: controls bar renders all three buttons; filters drawer opens right; `ColumnControlsPanel` is gone
