# Day Format Display Setting

**Date:** 2026-05-03
**Status:** Approved

## Overview

Add a user-controlled setting that determines how the event day is rendered across the app: as a full day name (default), a numeric date, or a long readable date. The setting also fixes an existing min-width bug in the event type column, which shares the same root cause.

## Format Options

| Setting value | Desktop output    | Mobile output |
| ------------- | ----------------- | ------------- |
| `"day"`       | Wednesday         | Wed           |
| `"numeric"`   | 08/01/26          | 8/1           |
| `"long"`      | Sat, Aug 01, 2026 | Sat 8/1       |

`"day"` is the default and matches current behavior.

## Architecture & Data Flow

### New type and hook

- `DayFormat = "day" | "numeric" | "long"` added to `src/components/EventTable/types.ts`
- `src/hooks/useDayFormat.ts` — new hook using `useStoredState`, storage key `"gcb-day-format"`, version `1`, default `"day"`. Same pattern as `useTypeDisplay`.
- `SharedColumnState` gains `dayFormat`, `setDayFormat`, `resetDayFormat`.

### Format utility

`src/utils/formatDay.ts` exports two functions:

```ts
formatDay(date: Date, dayFormat: DayFormat): string
// "day"     → format(date, "EEEE")             → "Wednesday"
// "numeric" → format(date, "MM/dd/yy")          → "08/01/26"
// "long"    → format(date, "EEE, MMM dd, yyyy") → "Sat, Aug 01, 2026"

formatDayCompact(date: Date, dayFormat: DayFormat): string
// "day"     → format(date, "EEE")     → "Wed"
// "numeric" → format(date, "M/d")     → "8/1"
// "long"    → format(date, "EEE M/d") → "Sat 8/1"
```

### CellContext — how settings reach column cells

TanStack Table column cell renderers receive a `CellContext` object via `cell.getContext()`. `EventTable.tsx` currently passes this object verbatim to `flexRender`. We spread additional display settings onto it:

```tsx
// EventTable.tsx
flexRender(cell.column.columnDef.cell, {
  ...cell.getContext(),
  dayFormat,
  typeDisplay,
  showTypeIcon,
});
```

`columns.tsx` augments the TanStack `CellContext` interface (same module already used for `ColumnMeta`):

```ts
declare module "@tanstack/react-table" {
  interface CellContext<TData, TValue> {
    dayFormat: DayFormat;
    typeDisplay: TypeDisplay;
    showTypeIcon: boolean;
  }
}
```

(No `extends RowData` constraint — consistent with the existing `ColumnMeta` augmentation in this file.)

Cell renderers destructure the values they need directly from context.

### Setting surfaces

| Surface           | How it receives the setting                                   |
| ----------------- | ------------------------------------------------------------- |
| Desktop table     | CellContext spread in `EventTable.tsx`                        |
| Mobile list       | `dayFormat` prop on `EventListMobile`                         |
| Event detail page | Calls `useDayFormat()` directly (reads same localStorage key) |

`SearchResults.tsx` and `ChangelogPage.tsx` both call `useDayFormat()` and include it in the `sharedColumnState` object they construct.

### Min-width fix

`useColumnMinSizes` computes minimum column widths by reading `td.textContent` from the live DOM. When cells used CSS `display: none` to hide content, the hidden text still appeared in `textContent`, producing incorrect minimums. Switching to conditional JSX rendering means only visible content is in the DOM.

`useColumnMinSizes` signature gains `typeDisplay`, `showTypeIcon`, and `dayFormat` as optional parameters, all added to the effect dependency array. This ensures measurements re-run whenever any display setting changes.

## Component Changes

### `ColumnControlsPanel`

New "Day column" fieldset placed after "Event type column":

```
Day column
[ Day ] [ MM/DD/YY ] [ Full date ]
```

Uses `SegmentedControl` (same component as the event type text-mode control). "Reset to defaults" calls `resetDayFormat()` in addition to existing resets.

### `columns.tsx` — type cell

Replaces CSS show/hide spans with conditional JSX:

```tsx
cell: ({ row, typeDisplay, showTypeIcon }) => {
  const { eventType } = row.original.attributes;
  // ... parse code/name ...
  return (
    <span className={typeCellStyles.typeCell}>
      {showTypeIcon && Icon && (
        <span className={typeCellStyles.typeIcon}>
          <Icon size={16} />
        </span>
      )}
      {(typeDisplay === "code" || typeDisplay === "both") && (
        <span className={typeCellStyles.typeCode}>{code}</span>
      )}
      {typeDisplay === "both" && name && <span className={typeCellStyles.typeSep}> - </span>}
      {(typeDisplay === "name" || typeDisplay === "both") && name && (
        <span className={typeCellStyles.typeName}>{name}</span>
      )}
    </span>
  );
};
```

### `columns.tsx` — day cell

```tsx
cell: ({ row, dayFormat }) => (
  <>{formatDay(new Date(row.original.attributes.startDateTime), dayFormat)}</>
);
```

### `EventTable.tsx`

- `data-type-display` and `data-show-icon` attributes removed from the `<section>` wrapper (no longer needed for table rendering; mobile list continues to use them).
- `flexRender` call for body cells spreads `dayFormat`, `typeDisplay`, `showTypeIcon` onto context.
- `useColumnMinSizes` called with the new parameters.

### `EventListMobile.tsx`

- Receives `dayFormat?: DayFormat` prop.
- Day display changes from `format(start, "EEE")` to `formatDayCompact(start, dayFormat ?? "day")`.
- Type display remains CSS data-attribute based (no resize constraint on mobile; no fix needed).

### `EventDetail.tsx`

- Calls `useDayFormat()` at the component level.
- "Day" `<DescriptionItem>` uses `formatDay(new Date(a.startDateTime), dayFormat)`.

## CSS

`typeCell.module.css` CSS rules for `[data-type-display]` and `[data-show-icon]` are **not removed** — they continue to serve `EventListMobile`. No CSS changes required.

## Testing

| File                                                     | What's tested                                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `src/hooks/useDayFormat.test.ts`                         | Default value, localStorage persistence, reset, version invalidation                                          |
| `src/utils/formatDay.test.ts`                            | All three formats × both functions                                                                            |
| `src/components/EventTable/columns.test.ts`              | Day cell output for each `dayFormat`; type cell conditional rendering for each `typeDisplay` × `showTypeIcon` |
| `src/hooks/useColumnMinSizes.test.tsx`                   | Effect re-runs on `typeDisplay` and `dayFormat` changes                                                       |
| `src/components/EventTable/ColumnControlsPanel.test.tsx` | Day segmented control renders; interaction updates `dayFormat`; reset clears to default                       |
| `src/components/EventTable/EventListMobile.test.tsx`     | Compact day format for each `dayFormat` value                                                                 |
| `src/routes/event.$id.test.tsx`                          | Day field reflects `dayFormat` from `useDayFormat`                                                            |

All tests use MSW for network interception. No new handlers needed; format changes are presentational only.

## Files Changed

### New

- `src/hooks/useDayFormat.ts`
- `src/utils/formatDay.ts`
- `src/utils/formatDay.test.ts`
- `src/hooks/useDayFormat.test.ts`

### Modified

- `src/components/EventTable/types.ts`
- `src/components/EventTable/columns.tsx`
- `src/components/EventTable/ColumnControlsPanel.tsx`
- `src/components/EventTable/EventTable.tsx`
- `src/components/EventTable/EventListMobile.tsx`
- `src/components/EventDetail/EventDetail.tsx`
- `src/components/SearchResults/SearchResults.tsx`
- `src/components/ChangelogPage/ChangelogPage.tsx`
- `src/components/ChangelogPage/ChangelogEntryPanel.tsx`
- `src/hooks/useColumnMinSizes.ts`
- `src/components/EventTable/columns.test.ts`
- `src/hooks/useColumnMinSizes.test.tsx`
- `src/components/EventTable/ColumnControlsPanel.test.tsx`
- `src/components/EventTable/EventListMobile.test.tsx`
- `src/routes/event.$id.test.tsx`
