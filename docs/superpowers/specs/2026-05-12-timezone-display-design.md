# Timezone Display Fix + Toggle

**Date:** 2026-05-12
**Issue:** [#32 — Times are shown in local time. Should default to gencon time and show a control.](https://github.com/myasonik/Gen-Con-Buddy/issues/32)

## Problem

Start, End, and Day columns display times in the browser's local timezone. The API returns times in Indianapolis time with an explicit RFC3339 offset (e.g. `2026-07-30T10:00:00-04:00`). `new Date()` converts this to UTC internally; `format()` from date-fns then renders in the user's local offset. A CDT user (UTC-5) sees `09:00` for a 10am Indianapolis event.

The time filter in `searchParams.ts` is already correct — it hardcodes `-04:00` and does not change.

## Solution

Fix the default to always display in Indianapolis time, and add a user-controlled toggle to switch to local time.

## Architecture

### New type

```ts
// src/components/EventTable/types.ts
export type TimeZone = "indy" | "local";
```

`TimeZone` is added to `SharedColumnState` alongside `DayFormat`:

```ts
timeZone: TimeZone;
setTimeZone: (v: TimeZone) => void;
resetTimeZone: () => void;
```

`CellContext` (the TanStack Table module augmentation in `columns.tsx`) gains a `timeZone: TimeZone` field, threaded in from `EventTable.tsx` the same way `dayFormat` is today.

### New hook: `useTimeZone`

Mirrors `useDayFormat` exactly:

```ts
// src/hooks/useTimeZone.ts
const STORAGE_KEY = "gcb-time-zone";
const VERSION = 1;
const DEFAULT: TimeZone = "indy"; // fixes the bug by default
```

Wired into `useSharedColumnState` the same way `useDayFormat` is.

### Formatting utility

`src/utils/formatDay.ts` exports a new helper:

```ts
export function toDisplayDate(value: string, timeZone: TimeZone): Date {
  return timeZone === "indy" ? new TZDate(value, "America/Indiana/Indianapolis") : new Date(value);
}
```

`formatDay` and `formatDayCompact` signatures are **unchanged** — they already accept a `Date`. Callers switch from `new Date(rawValue)` to `toDisplayDate(rawValue, timeZone)`. Because `TZDate` extends `Date`, all downstream `format()` calls — including start/end time cells and the `formatDayCompact` call in `EventListMobile` — automatically use Indianapolis time with no further changes. In `EventListMobile`, this is especially clean:

```ts
// Before
const start = new Date(a.startDateTime);
const end = new Date(a.endDateTime);

// After
const start = toDisplayDate(a.startDateTime, timeZone);
const end = toDisplayDate(a.endDateTime, timeZone);
// all downstream format() and formatDayCompact() calls unchanged
```

### `@date-fns/tz` dependency

Install `@date-fns/tz`. `TZDate` creates a Date object that date-fns treats as being in the specified timezone, so `format(new TZDate(value, "America/Indiana/Indianapolis"), "HH:mm")` produces the Indianapolis-local time string. Consistent with existing date-fns v4 usage throughout the codebase.

## UI: FormatDrawer

New `TimeFormatControls` component follows the same pattern as `DayFormatControls`:

```
<fieldset>
  <legend>Time columns</legend>
  <SegmentedControl value={timeZone} onValueChange={setTimeZone}>
    <Option value="indy">Indianapolis</Option>
    <Option value="local">Local</Option>
  </SegmentedControl>
</fieldset>
```

Placed between the existing "Day column" fieldset and the Reset button. The Reset button calls `resetTimeZone()` alongside the existing resets.

## Files Changed

| File                                            | Change                                                                                       |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `package.json`                                  | add `@date-fns/tz`                                                                           |
| `src/components/EventTable/types.ts`            | add `TimeZone`, extend `SharedColumnState` and `CellContext`                                 |
| `src/hooks/useTimeZone.ts`                      | new file — stored preference hook                                                            |
| `src/hooks/useSharedColumnState.ts`             | wire in `useTimeZone`                                                                        |
| `src/utils/formatDay.ts`                        | export `toDisplayDate` helper (no signature change to existing functions)                    |
| `src/components/EventTable/columns.tsx`         | add `timeZone` to `CellContext` extension; update start/end/day cells to use `toDisplayDate` |
| `src/components/EventTable/EventTable.tsx`      | pass `timeZone` in cell context                                                              |
| `src/components/EventTable/EventListMobile.tsx` | add `timeZone` prop; apply to `formatDayCompact` and time `format()` calls                   |
| `src/components/EventTable/FormatDrawer.tsx`    | add `TimeFormatControls`; wire into `FormatDrawer` and `FormatDrawerProps`                   |
| `src/components/EventDetail/EventDetail.tsx`    | call `useTimeZone()` directly; apply to `formatDay` and time `format()` calls                |

## Testing

### `src/utils/formatDay.test.ts`

Add cases with a UTC-offset date that differs from Indianapolis time to verify:

- `"indy"` correctly shows the Indianapolis-local day and compact format
- `"local"` shows the system-local interpretation (pinned to Indianapolis by `setup.ts`, so existing tests still pass)

### `src/hooks/useTimeZone.test.ts` (new)

Mirrors `useDayFormat.test.ts`: default value is `"indy"`, set, reset, and localStorage round-trip.

### `src/components/EventTable/FormatDrawer.test.tsx`

- Update `makeColumnState` with `timeZone`, `setTimeZone`, `resetTimeZone` fields
- Add tests: "Time columns" fieldset renders "Indianapolis" and "Local" radios; clicking "Local" calls `setTimeZone("local")`; Reset calls `resetTimeZone`

### `src/components/EventTable/EventListMobile.test.tsx` / `EventTable.test.tsx`

Spot-check: time cells display Indianapolis time when `timeZone="indy"` and local time when `timeZone="local"`.

## Acceptance Criteria

- [ ] Start and End time columns display in Indianapolis time for users in any timezone (default)
- [ ] Day column assigns events to the correct Indianapolis calendar day (default)
- [ ] A user in UTC-5 sees `10:00` for a 10am Indianapolis event, not `09:00`
- [ ] "Time columns" control in FormatDrawer lets users switch between "Indianapolis" and "Local"
- [ ] Preference persists across page reloads (localStorage)
- [ ] Reset button in FormatDrawer resets timezone preference to "indy"
- [ ] EventDetail page respects the same preference
- [ ] All existing tests continue to pass
