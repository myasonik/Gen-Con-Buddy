# Day-of-Week Filter Design

**Date:** 2026-04-18
**Branch:** react-rewrite

## Overview

Add a top-level day filter to the search form with five checkboxes (Wed–Sun) mapping to the Gen Con 2024 convention days (Jul 31–Aug 4). Selecting days filters events by start date using the API's existing `startDateTime` parameter. Mutually exclusive with the advanced Start Date fields.

## Data & URL Layer

### New fields

`SearchParams` and `SearchFormValues` each gain one new optional field:

```ts
days?: string  // comma-separated subset of: wed,thu,fri,sat,sun
```

`days` is front-end only — it is **not** passed to the API. It exists in `SearchParams` solely to survive URL round-trips.

### Day-to-date mapping

Hardcoded constant in `searchParams.ts` (Indianapolis time, UTC-4):

```ts
const DAY_DATES: Record<string, { start: string; end: string }> = {
  wed: { start: '2024-07-31T00:00:00-04:00', end: '2024-08-01T00:00:00-04:00' },
  thu: { start: '2024-08-01T00:00:00-04:00', end: '2024-08-02T00:00:00-04:00' },
  fri: { start: '2024-08-02T00:00:00-04:00', end: '2024-08-03T00:00:00-04:00' },
  sat: { start: '2024-08-03T00:00:00-04:00', end: '2024-08-04T00:00:00-04:00' },
  sun: { start: '2024-08-04T00:00:00-04:00', end: '2024-08-05T00:00:00-04:00' },
}
```

### `buildSearchParams`

If `days` is set and non-empty:
1. Split on `,`, look up each key in `DAY_DATES`
2. Build a comma-separated string of `[start,end]` ranges
3. Write result to `startDateTime` (overrides the explicit datetime fields)
4. Do **not** include `days` in the output params

If `days` is empty/absent, fall through to the existing `setDateRange('startDateTime', ...)` logic unchanged.

### `parseSearchParams`

`days` round-trips directly — read from URL params, written to form values as-is. No translation needed.

## Form UI

### Placement

The day checkbox group renders in the top-level form area alongside Search and Event Type (not inside `<details>`).

### Appearance

```
Days:  [ ] Wed  [ ] Thu  [ ] Fri  [ ] Sat  [ ] Sun
```

### Form state

`SearchFormValues.days` is a comma-separated string (`"thu,sat"`). The checkbox group uses individual controlled checkboxes that toggle a day key in/out of the string, then re-join and call `setValue('days', ...)`.

### Mutual exclusion

| Condition | Effect |
|-----------|--------|
| Any day checkbox checked | Advanced `Start Date` fields disabled |
| Either advanced `Start Date` field has a value | All day checkboxes disabled |

A toggletip (`?` button) appears next to the disabled group with the message:
- Checkboxes disabled: *"Clear the Start Date fields in Advanced Filters to use day checkboxes."*
- Start Date disabled: *"Clear the day checkboxes above to use custom Start Date fields."*

### Reset

`reset()` clears `days` to `""` alongside all other fields.

## Testing

### `buildSearchParams` unit tests
- Single day selected → correct single `[start,end]` range in `startDateTime`
- Multiple non-contiguous days → comma-separated multi-range `startDateTime`
- All five days selected → five ranges
- `days` empty → existing `startDateTimeStart`/`End` path unaffected
- `days` set → `days` key absent from output params

### `parseSearchParams` unit tests
- `days=thu,sat` in URL → `days: "thu,sat"` in form values
- `days` absent → `days` undefined in form values

### `SearchForm` unit tests
- Day checkboxes disabled when `startDateTimeStart` or `startDateTimeEnd` has a value
- Advanced Start Date inputs disabled when any day checkbox is checked
- Toggletip renders with correct message in each disabled state
- Checking/unchecking days updates the `days` string correctly
