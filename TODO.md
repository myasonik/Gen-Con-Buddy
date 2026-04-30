# Deferred hardening work

## C4 — Centralize Gen Con year / dates

### Problem

`DAY_DATES` in `src/utils/searchParams.ts` hardcodes 2024 dates:

```ts
const DAY_DATES: Record<string, string> = {
  wed: '2024-07-31',
  thu: '2024-08-01',
  fri: '2024-08-02',
  sat: '2024-08-03',
  sun: '2024-08-04',
}
```

`searchParams.test.ts` asserts the literal strings `'2024-07-31'` etc. There is no single constant to bump, so updating for Gen Con 2025 requires editing both `searchParams.ts` AND the tests — and it's easy to forget.

Gen Con dates by year:
- 2024: Jul 31 – Aug 4 (Wed–Sun)
- 2025: Jul 30 – Aug 3 (Wed–Sun)
- 2026: Jul 29 – Aug 2 (Wed–Sun)

### Fix

**Step 1:** Introduce a single `GEN_CON_YEAR` constant (or derive from a start date):

```ts
// src/utils/searchParams.ts

// Update this each year. Gen Con always runs Wed–Sun in late July/early August.
export const GEN_CON_YEAR = 2025

// Derive Wed offset: find the Wednesday on or before Aug 1 of that year
function genConWednesday(year: number): Date {
  // Aug 1 of the year
  const aug1 = new Date(year, 7, 1)
  // Wednesday = 3; back up to Wednesday
  const dayOfWeek = aug1.getDay()
  const daysBack = (dayOfWeek - 3 + 7) % 7
  return new Date(year, 7, 1 - daysBack)
}

function offsetDate(base: Date, days: number): string {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const wed = genConWednesday(GEN_CON_YEAR)
const DAY_DATES: Record<string, string> = {
  wed: offsetDate(wed, 0),
  thu: offsetDate(wed, 1),
  fri: offsetDate(wed, 2),
  sat: offsetDate(wed, 3),
  sun: offsetDate(wed, 4),
}
```

**Step 2:** Update `searchParams.test.ts` to use `GEN_CON_YEAR` instead of literal date strings:

```ts
import { GEN_CON_YEAR } from './searchParams'

test('daysToStartDateTime for thu includes the correct year', () => {
  const result = daysToStartDateTime('thu')
  expect(result).toContain(String(GEN_CON_YEAR))
})
```

This way, bumping `GEN_CON_YEAR = 2025` automatically updates all tests.

**Step 3:** Add a test that pins the derivation logic itself (so a wrong algorithm is caught even before year-bump):

```ts
test('gen con wednesday is always in late July or early August', () => {
  const result = daysToStartDateTime('wed')
  const date = new Date(result!.split('[')[0]) // strip range brackets if present
  expect(date.getMonth()).toBeGreaterThanOrEqual(6) // July=6
  expect(date.getMonth()).toBeLessThanOrEqual(7) // August=7
  expect(date.getDay()).toBe(3) // Wednesday
})
```

---

## DS-16 — `ConceptBadge` CSS vars never set; `conceptColors.ts` is dead code

`Badge.tsx` and `Badge.module.css:6-18`: `--concept-color` / `--concept-bg` are read in CSS but never written from JS. Every `ConceptBadge` renders with `#666`/`#fff` fallbacks regardless of concept. The `src/utils/conceptColors.ts` utility is unused by `Badge.tsx` (it has its own test file but is never imported by the component).

The Badge tests at lines 102–116 assert the vars are empty strings — documenting the broken state rather than the fixed one.

### Fix

Either wire up `style={{ '--concept-color': ..., '--concept-bg': ... }}` from `conceptColors.ts` in `ConceptBadge`, or delete `conceptColors.ts`, its test file, and the dead CSS vars.
