# Column Minimum Sizes — Design Spec

**Date:** 2026-05-02

## Problem

The search results table supports column resizing, but columns can be dragged narrower than their cell content. For example, the Day column can be resized smaller than "Wednesday". The column header already enforces a content-based minimum (via `min-width: max-content` in CSS), but cells have no equivalent constraint.

## Goal

After each page load, automatically compute a minimum pixel width for every visible column based on the widest cell content on the current page. Enforce that minimum during drag-resize and in the resize dialog. Minimums recompute on every page navigation.

## Approach

Post-render canvas measurement. After the table renders, scan every `td` using the Canvas 2D API to measure text content and the DOM to measure SVG icons. No extra renders, no DOM structure changes beyond a `data-col-id` attribute on each `td`.

### Content width definition

For any cell, the minimum column width is the width of its **longest word** (by character count), not the full text content. This is correct because:

- For bounded single-token cells (day names, times, IDs, costs), the single token is the only word — full-width measurement.
- For wrapping text cells (descriptions, titles), words wrap at whitespace boundaries, so the column only needs to fit the longest word.

Longest word is found by sorting words by `.length` descending and taking the first — one `measureText` call per cell.

### Per-cell formula

```
longestWord = td.textContent.trim().split(/\s+/).sort((a,b) => b.length - a.length)[0]
textWidth   = ctx.measureText(longestWord).width
svgWidth    = sum of Number(svg.getAttribute('width') ?? 0) for each svg in td
flexParent  = svg.parentElement (the direct parent of the first svg, if any)
gap         = svgWidth > 0 ? parseFloat(getComputedStyle(flexParent).gap) || 4 : 0
minWidth    = Math.ceil(textWidth + svgWidth + gap + paddingH + borderH)
```

`paddingH` and `borderH` are read once from `getComputedStyle` on a sample `td` and reused for all cells.

For `gap`: only the `eventType` column currently renders icons. `getComputedStyle` is called once per unique flex-parent element (keyed by element reference, not per cell) to avoid redundant style recalculations.

### Performance

All reads are synchronous in a `useEffect` (post-paint), so no user-visible blocking. Key operations:

- `svg.getAttribute('width')` — attribute read, zero layout cost (replaces `getBoundingClientRect`)
- `ctx.measureText` — pure JS, zero layout cost
- `getComputedStyle` — one style recalculation, amortized across all cells

With 100 rows and ~15 visible columns (~1,500 `td` iterations), this completes well under a millisecond.

## Files changed

### New: `src/hooks/useColumnMinSizes.ts`

```ts
useColumnMinSizes(
  tableRef: RefObject<HTMLTableElement>,
  events: Event[]
): Record<string, number>
```

- Runs in `useEffect` on `events`.
- Returns `{}` if `tableRef.current` is null or no `td[data-col-id]` elements exist.
- Returns `{}` if `canvas.getContext('2d')` returns null (rare browser constraint).
- Returns a map of `columnId → minimum pixel width`.

### Modified: `src/ui/EventTable/EventTable.tsx`

- Add `const tableRef = useRef<HTMLTableElement>(null)` and attach it to the `<table>` element.
- Add `data-col-id={cell.column.id}` to each `td` in the row render.
- Call `useColumnMinSizes(tableRef, events)`.
- Clamp in `onColumnSizingChange` (handling both the value and functional-updater forms that TanStack passes):
  ```ts
  onColumnSizingChange: (updater) => {
    setSizing((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return Object.fromEntries(
        Object.entries(next).map(([id, size]) => [id, Math.max(size, columnMinSizes[id] ?? 0)])
      );
    });
  },
  ```
- Pass `minWidth={columnMinSizes[resizeTarget.columnId] ?? 0}` to `ColumnResizeDialog`.

### Modified: `src/ui/EventTable/ColumnResizeDialog.tsx`

- Add `minWidth?: number` prop (defaults to `0`).
- Set `min={minWidth}` on the number input (browser native validation).
- On Apply: `onApply(Math.max(Number(value), minWidth))`.

## Testing

### `src/hooks/useColumnMinSizes.test.ts` (new)

- Mock `HTMLCanvasElement.prototype.getContext` to return `{ measureText: (t) => ({ width: t.length * 8 }), font: '' }`.
- Render a minimal table with `data-col-id` on `td` elements and known `textContent`.
- Assert returned minimums reflect the longest word in each column's cells.
- Assert SVG `width` attributes are summed into the result for a cell that contains an `<svg width="14">`.
- Assert `{}` is returned when the ref is null.
- Assert `{}` is returned when `getContext` returns null.

### `src/ui/EventTable/ColumnResizeDialog.test.tsx` (existing, extended)

- Given `minWidth={80}`, submitting with input value `50` calls `onApply(80)`.
- Given `minWidth={80}`, submitting with input value `120` calls `onApply(120)` (minimum not applied when value exceeds it).
- The number input has `min="80"`.

### `src/ui/EventTable/EventTable.test.tsx` (existing, extended)

- After render with known event data, programmatically trigger `onColumnSizingChange` with a size below the computed minimum for a column. Assert the stored size is clamped to the minimum, not the requested value.
