# Event Page Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "Add to Google Calendar" and "View on Gen Con" action buttons to the event detail page, rendered below the event title before the first content section.

**Architecture:** Two new inline SVG icon components; a pure utility function `buildGoogleCalendarUrl` that constructs a pre-filled Google Calendar URL from event attributes; minimal changes to `EventDetail.tsx` to render an action row with two ghost buttons.

**Tech Stack:** React, CSS Modules, `date-fns` (already installed), `@base-ui/react` Button primitive, Vitest + Testing Library + MSW for tests.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/ui/icons/CalendarPlus.tsx` | **Create** | Calendar-plus SVG icon component |
| `src/ui/icons/ExternalLink.tsx` | **Create** | External-link arrow SVG icon component |
| `src/utils/googleCalendar.ts` | **Create** | `buildGoogleCalendarUrl` utility |
| `src/utils/googleCalendar.test.ts` | **Create** | Unit tests for the URL builder |
| `src/components/EventDetail/EventDetail.tsx` | **Modify** | Add action row between `<h1>` and first `<section>` |
| `src/components/EventDetail/EventDetail.module.css` | **Modify** | Add `.actions` and `.actionIcon` styles |
| `src/components/EventDetail/EventDetail.test.tsx` | **Modify** | Add two integration tests for the rendered links |

---

## Task 1: Icon Components

No tests needed — pure SVG rendering, no logic.

**Files:**
- Create: `src/ui/icons/CalendarPlus.tsx`
- Create: `src/ui/icons/ExternalLink.tsx`

- [ ] **Step 1: Create `CalendarPlus.tsx`**

```tsx
import React from 'react'

interface CalendarPlusProps {
  className?: string
  style?: React.CSSProperties
  'aria-hidden'?: true | 'true'
}

export function CalendarPlus({
  className,
  style,
  'aria-hidden': ariaHidden,
}: CalendarPlusProps): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden={ariaHidden}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="12" y1="13" x2="12" y2="19" />
      <line x1="9" y1="16" x2="15" y2="16" />
    </svg>
  )
}
```

- [ ] **Step 2: Create `ExternalLink.tsx`**

```tsx
import React from 'react'

interface ExternalLinkProps {
  className?: string
  style?: React.CSSProperties
  'aria-hidden'?: true | 'true'
}

export function ExternalLink({
  className,
  style,
  'aria-hidden': ariaHidden,
}: ExternalLinkProps): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden={ariaHidden}
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/icons/CalendarPlus.tsx src/ui/icons/ExternalLink.tsx
git commit -m "feat: add CalendarPlus and ExternalLink icon components"
```

---

## Task 2: `buildGoogleCalendarUrl` Utility (TDD)

**Files:**
- Create: `src/utils/googleCalendar.ts`
- Create: `src/utils/googleCalendar.test.ts`

The function constructs a Google Calendar "add event" URL. Key decisions:
- Dates formatted as `yyyyMMdd'T'HHmmss` (no `Z`) — local Indianapolis time. Tests run with `TZ=America/Indianapolis` (pinned in `src/test/setup.ts`), so `format(new Date(isoString), ...)` is deterministic.
- Location: `{location} — {roomName}, Table {tableNumber}`. Omit `, Table {tableNumber}` if `tableNumber` is empty.
- Details block: `longDescription` at top (omitted if empty string), then structured fields, then Gen Con URL at the end. Empty string fields are omitted. `cost` is always included even if zero.
- Uses `URLSearchParams` via `new URL(...)` to handle encoding automatically.

The factory defaults (used in tests) produce these formatted dates with `TZ=America/Indianapolis`:
- `startDateTime: '2024-08-01T10:00:00Z'` → `20240801T060000` (UTC-4, EDT)
- `endDateTime: '2024-08-01T14:00:00Z'` → `20240801T100000`

- [ ] **Step 1: Write failing tests in `src/utils/googleCalendar.test.ts`**

```typescript
import { describe, expect, test } from 'vitest'
import { buildGoogleCalendarUrl } from './googleCalendar'
import { makeEvent } from '../test/msw/factory'

function parseUrl(attrs: ReturnType<typeof makeEvent>['attributes']) {
  return new URL(buildGoogleCalendarUrl(attrs))
}

describe('buildGoogleCalendarUrl', () => {
  test('returns a Google Calendar render URL', () => {
    const url = parseUrl(makeEvent().attributes)
    expect(url.origin + url.pathname).toBe(
      'https://calendar.google.com/calendar/render',
    )
    expect(url.searchParams.get('action')).toBe('TEMPLATE')
  })

  test('sets text to event title', () => {
    const url = parseUrl(makeEvent({ title: 'Epic Dragon Hunt' }).attributes)
    expect(url.searchParams.get('text')).toBe('Epic Dragon Hunt')
  })

  test('formats dates as local Indianapolis time without Z suffix', () => {
    const url = parseUrl(
      makeEvent({
        startDateTime: '2024-08-01T10:00:00Z',
        endDateTime: '2024-08-01T14:00:00Z',
      }).attributes,
    )
    expect(url.searchParams.get('dates')).toBe('20240801T060000/20240801T100000')
  })

  test('builds location with table number', () => {
    const url = parseUrl(
      makeEvent({ location: 'ICC', roomName: 'Hall A', tableNumber: '12' }).attributes,
    )
    expect(url.searchParams.get('location')).toBe('ICC — Hall A, Table 12')
  })

  test('omits table segment when tableNumber is empty', () => {
    const url = parseUrl(
      makeEvent({ location: 'ICC', roomName: 'Hall A', tableNumber: '' }).attributes,
    )
    expect(url.searchParams.get('location')).toBe('ICC — Hall A')
  })

  test('details block contains long description', () => {
    const url = parseUrl(
      makeEvent({ longDescription: 'A detailed description.' }).attributes,
    )
    expect(url.searchParams.get('details')).toContain('A detailed description.')
  })

  test('details block omits long description when empty', () => {
    const url = parseUrl(makeEvent({ longDescription: '' }).attributes)
    const details = url.searchParams.get('details')!
    expect(details).not.toMatch(/^\n/)
  })

  test('details block includes GM names', () => {
    const url = parseUrl(makeEvent({ gmNames: 'Jane Smith' }).attributes)
    expect(url.searchParams.get('details')).toContain('GM(s): Jane Smith')
  })

  test('details block always includes cost, even at zero', () => {
    const url = parseUrl(makeEvent({ cost: 0 }).attributes)
    expect(url.searchParams.get('details')).toContain('Cost: $0.00')
  })

  test('details block includes non-zero cost', () => {
    const url = parseUrl(makeEvent({ cost: 4 }).attributes)
    expect(url.searchParams.get('details')).toContain('Cost: $4.00')
  })

  test('details block includes duration', () => {
    const url = parseUrl(makeEvent({ duration: 4 }).attributes)
    expect(url.searchParams.get('details')).toContain('Duration: 4 hours')
  })

  test('details block omits empty materialsRequired', () => {
    const url = parseUrl(makeEvent({ materialsRequired: '' }).attributes)
    expect(url.searchParams.get('details')).not.toContain('Materials Required:')
  })

  test('details block includes non-empty materialsRequired', () => {
    const url = parseUrl(
      makeEvent({ materialsRequired: 'Pencil and paper' }).attributes,
    )
    expect(url.searchParams.get('details')).toContain('Materials Required: Pencil and paper')
  })

  test('details block omits empty materialsRequiredDetails', () => {
    const url = parseUrl(makeEvent({ materialsRequiredDetails: '' }).attributes)
    expect(url.searchParams.get('details')).not.toContain('Materials Details:')
  })

  test('details block always ends with Gen Con event page URL', () => {
    const url = parseUrl(makeEvent({ gameId: 'RPG24000099' }).attributes)
    expect(url.searchParams.get('details')).toContain(
      'Gen Con event page: https://www.gencon.com/events/RPG24000099',
    )
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- googleCalendar
```

Expected: All tests fail with "Cannot find module './googleCalendar'" or similar.

- [ ] **Step 3: Implement `src/utils/googleCalendar.ts`**

```typescript
import { format } from 'date-fns'
import type { EventAttributes } from './types'

export function buildGoogleCalendarUrl(attrs: EventAttributes): string {
  const formatDate = (iso: string) => format(new Date(iso), "yyyyMMdd'T'HHmmss")

  let location = `${attrs.location} — ${attrs.roomName}`
  if (attrs.tableNumber) {
    location += `, Table ${attrs.tableNumber}`
  }

  const lines: string[] = []
  if (attrs.longDescription) {
    lines.push(attrs.longDescription)
    lines.push('')
  }
  if (attrs.gmNames) { lines.push(`GM(s): ${attrs.gmNames}`) }
  lines.push(`Location: ${location}`)
  lines.push(`Cost: $${attrs.cost.toFixed(2)}`)
  lines.push(`Duration: ${attrs.duration} hours`)
  if (attrs.experienceRequired) { lines.push(`Experience Required: ${attrs.experienceRequired}`) }
  if (attrs.materialsRequired) { lines.push(`Materials Required: ${attrs.materialsRequired}`) }
  if (attrs.materialsRequiredDetails) { lines.push(`Materials Details: ${attrs.materialsRequiredDetails}`) }
  lines.push('')
  lines.push(`Gen Con event page: https://www.gencon.com/events/${attrs.gameId}`)

  const url = new URL('https://calendar.google.com/calendar/render')
  url.searchParams.set('action', 'TEMPLATE')
  url.searchParams.set('text', attrs.title)
  url.searchParams.set('dates', `${formatDate(attrs.startDateTime)}/${formatDate(attrs.endDateTime)}`)
  url.searchParams.set('details', lines.join('\n'))
  url.searchParams.set('location', location)

  return url.toString()
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- googleCalendar
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/googleCalendar.ts src/utils/googleCalendar.test.ts
git commit -m "feat: add buildGoogleCalendarUrl utility"
```

---

## Task 3: EventDetail Action Row (TDD)

**Files:**
- Modify: `src/components/EventDetail/EventDetail.tsx`
- Modify: `src/components/EventDetail/EventDetail.module.css`
- Modify: `src/components/EventDetail/EventDetail.test.tsx`

The action row sits between the `<h1>` and the first `<section>`. Both links open in a new tab. The `Button` component accepts a `render` prop that replaces the underlying element — pass `<a>` to render an accessible link styled as a button.

- [ ] **Step 1: Write two failing integration tests — append to `EventDetail.test.tsx`**

Add these two tests at the end of `src/components/EventDetail/EventDetail.test.tsx` (after the existing tests, inside the same file — no new `describe` block needed):

```tsx
test('renders Add to Google Calendar link', async () => {
  server.use(
    http.get('/api/events/search', () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: 'RPG24000001' })],
        meta: { total: 1 },
        links: { self: '' },
        error: null,
      }
      return HttpResponse.json(response)
    }),
  )
  renderEventDetail('RPG24000001')
  await screen.findByText('THE EVENT')
  const link = screen.getByRole('link', { name: /add to google calendar/i })
  expect(link).toHaveAttribute('href', expect.stringContaining('calendar.google.com/calendar/render'))
  expect(link).toHaveAttribute('target', '_blank')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
})

test('renders View on Gen Con link', async () => {
  server.use(
    http.get('/api/events/search', () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: 'RPG24000001' })],
        meta: { total: 1 },
        links: { self: '' },
        error: null,
      }
      return HttpResponse.json(response)
    }),
  )
  renderEventDetail('RPG24000001')
  await screen.findByText('THE EVENT')
  const link = screen.getByRole('link', { name: /view on gen con/i })
  expect(link).toHaveAttribute('href', 'https://www.gencon.com/events/RPG24000001')
  expect(link).toHaveAttribute('target', '_blank')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- EventDetail
```

Expected: The two new tests fail with something like "Unable to find role 'link' with name /add to google calendar/i".

- [ ] **Step 3: Add action row to `EventDetail.tsx`**

The full updated return statement in `EventDetail.tsx`. Import the new icons and utility at the top of the file alongside existing imports:

```tsx
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Link } from '@tanstack/react-router'
import { fetchEvents } from '../../utils/api'
import { buildGoogleCalendarUrl } from '../../utils/googleCalendar'
import { Button } from '../../ui/Button/Button'
import { PixelState } from '../../ui/PixelState/PixelState'
import { Badge, BoolBadge } from '../../ui/Badge/Badge'
import { DescriptionList, DescriptionItem } from '../../ui/DescriptionList/DescriptionList'
import { CalendarPlus } from '../../ui/icons/CalendarPlus'
import { ExternalLink } from '../../ui/icons/ExternalLink'
import styles from './EventDetail.module.css'
```

Then replace the card's opening section (from the `<p className={styles.gameIdBadge}>` line through `</h1>`) with:

```tsx
        <p className={styles.gameIdBadge}>{a.gameId}</p>
        <h1 className={styles.title}>{a.title}</h1>

        <div className={styles.actions}>
          <Button
            render={
              <a
                href={buildGoogleCalendarUrl(a)}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
            variant="ghost"
          >
            <CalendarPlus aria-hidden="true" className={styles.actionIcon} />
            Add to Google Calendar
          </Button>
          <Button
            render={
              <a
                href={`https://www.gencon.com/events/${a.gameId}`}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
            variant="ghost"
          >
            <ExternalLink aria-hidden="true" className={styles.actionIcon} />
            View on Gen Con
          </Button>
        </div>
```

- [ ] **Step 4: Add styles to `EventDetail.module.css`**

Append to the end of the file:

```css
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.actionIcon {
  width: 1em;
  height: 1em;
  vertical-align: middle;
}
```

- [ ] **Step 5: Run all tests to confirm they pass**

```bash
npm test -- EventDetail
```

Expected: All tests pass including the two new link tests.

- [ ] **Step 6: Run the full test suite to catch regressions**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/EventDetail/EventDetail.tsx \
        src/components/EventDetail/EventDetail.module.css \
        src/components/EventDetail/EventDetail.test.tsx
git commit -m "feat: add Google Calendar and Gen Con links to event detail page"
```
