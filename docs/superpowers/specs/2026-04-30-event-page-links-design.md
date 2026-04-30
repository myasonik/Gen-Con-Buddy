# Event Page: Google Calendar & Gen Con Links

**Date:** 2026-04-30
**Status:** Approved

## Overview

Add two action buttons to the event detail page:

1. **Add to Google Calendar** — opens a pre-filled Google Calendar event in a new tab
2. **View on Gen Con** — opens the official Gen Con event page in a new tab

Both buttons appear in an action row directly below the event `<h1>` title, before the first content section.

## Components & Structure

### New icon components (`src/ui/icons/`)

- `CalendarPlus.tsx` — calendar-with-plus SVG icon, follows existing `Pawn.tsx` pattern
- `ExternalLink.tsx` — arrow-out-of-box SVG icon, follows existing `Pawn.tsx` pattern

Both icons accept `className`, `style`, and `aria-hidden` props. They are rendered `aria-hidden="true"` inside the buttons; accessible label comes from the button text.

### New utility (`src/utils/googleCalendar.ts`)

```ts
buildGoogleCalendarUrl(attrs: EventAttributes): string
```

Constructs a `https://calendar.google.com/calendar/render` URL with:

| Parameter | Value |
|---|---|
| `action` | `TEMPLATE` |
| `text` | `attrs.title` |
| `dates` | `{start}/{end}` formatted as `yyyyMMdd'T'HHmmss` (local Indianapolis time, no `Z`) |
| `location` | `{location} — {roomName}, Table {tableNumber}` (table segment omitted if `tableNumber` is empty) |
| `details` | See details block below |

Dates use `date-fns/format` (already a project dependency). No UTC conversion — Gen Con is a physical event in Indianapolis; local time is correct.

### Google Calendar `details` block

```
{longDescription}

GM(s): {gmNames}
Location: {location} — {roomName}, Table {tableNumber}
Cost: ${cost}
Duration: {duration} hours
Experience Required: {experienceRequired}
Materials Required: {materialsRequired}
Materials Details: {materialsRequiredDetails}

Gen Con event page: https://www.gencon.com/events/{gameId}
```

Fields with no meaningful value (empty string) are omitted to avoid noisy blank lines. `cost` is always included — "$0.00" is useful to show explicitly that an event is free. The Gen Con URL is always included at the end.

### Gen Con URL

No utility function needed:

```ts
`https://www.gencon.com/events/${a.gameId}`
```

### EventDetail changes (`src/components/EventDetail/EventDetail.tsx`)

Insert an action row between the `<h1>` and the first `<section>`:

```tsx
<div className={styles.actions}>
  <Button
    render={<a href={buildGoogleCalendarUrl(a)} target="_blank" rel="noopener noreferrer" />}
    variant="ghost"
  >
    <CalendarPlus aria-hidden="true" className={styles.actionIcon} />
    Add to Google Calendar
  </Button>
  <Button
    render={<a href={`https://www.gencon.com/events/${a.gameId}`} target="_blank" rel="noopener noreferrer" />}
    variant="ghost"
  >
    <ExternalLink aria-hidden="true" className={styles.actionIcon} />
    View on Gen Con
  </Button>
</div>
```

Both URLs are computed inline from the already-loaded event attributes — no memoization needed.

## Error Handling & Edge Cases

- **Missing table number:** `tableNumber` is an empty string for some events. The location string drops the `Table {tableNumber}` segment, producing `{location} — {roomName}`.
- **Empty optional fields:** Fields like `materialsRequired`, `materialsRequiredDetails`, `longDescription` may be empty strings. They are omitted from the details block.
- **Zero cost:** `cost === 0` renders as `Cost: $0.00` — explicitly communicates the event is free.
- **No new async work:** Both links are pure URL construction from already-loaded data. No loading states, no error boundaries needed.
- **External link safety:** Both anchors use `target="_blank" rel="noopener noreferrer"`.

## Testing

### `src/utils/googleCalendar.test.ts` (new)

Unit tests for `buildGoogleCalendarUrl`:

- Happy path: all fields populated → correct URL, properly formatted dates, full details block present
- Missing `tableNumber`: `Table` segment absent from location string
- Empty optional fields (`materialsRequired`, `materialsRequiredDetails`, empty `longDescription`): omitted from details block, no blank lines
- Zero `cost`: cost line renders as `Cost: $0.00` (not omitted)

### `src/components/EventDetail/EventDetail.test.tsx` (additions)

Two new integration tests using existing MSW setup:

- Renders "Add to Google Calendar" link with an `href` starting with `https://calendar.google.com/calendar/render`
- Renders "View on Gen Con" link with `href` of `https://www.gencon.com/events/{gameId}`
