# Deferred hardening work

## C3 — Pin timezone in tests

### Problem

Date formatting in the app uses `date-fns` `format()` on ISO strings: `format(new Date(iso), 'EEEE')`, `format(new Date(iso), 'HH:mm')`. These calls are timezone-sensitive. The test factory uses `'2024-08-01T10:00:00Z'` as a reference timestamp. On a CI box in any timezone other than UTC, this produces different day names and times than a developer's local machine.

The test setup file (`src/test/setup.ts`) does NOT pin `TZ`, and no rendering test asserts specific day names or time strings. This means:
- The formatting logic is completely untested by value
- Tests that assert a day name or time string will be flaky across machines

### Fix

**Step 1:** Pin the timezone in `src/test/setup.ts`:

```ts
// At the very top, before any other imports
process.env.TZ = 'America/Indianapolis'
```

`America/Indianapolis` is UTC-4 (no DST) — same as Gen Con's physical location.
With this pin, `'2024-08-01T10:00:00Z'` renders as "Thursday" and "06:00".

**Step 2:** Add time/date assertions to `src/components/EventDetail/EventDetail.test.tsx`.
The component formats `startDateTime`, `endDateTime`, and `lastModified` but no test asserts any of those values. After pinning TZ, add assertions in `'renders all key event attributes'`:

```ts
// startDateTime '2024-08-01T10:00:00Z' → 06:00 in EDT
expect(screen.getByText('Thursday')).toBeInTheDocument()
expect(screen.getByText('06:00')).toBeInTheDocument() // start
expect(screen.getByText('10:00')).toBeInTheDocument() // end (14:00Z → 10:00 EDT)
expect(screen.getByText('2024-01-01')).toBeInTheDocument() // lastModified
```

Also check `src/ui/EventTable/columns.tsx` — `format(..., 'EEEE')` and `format(..., 'HH:mm')` are used in the `day` and `startDateTime`/`endDateTime` columns. Add assertions in `EventTable.test.tsx` if not already present.

**Step 3:** Document the TZ pin in `AGENTS.md` under the Testing section so future contributors know why it's there.

---

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

## Design system audit (2026-04-27)

### Critical

#### DS-1 — Color and typography tokens referenced but never defined

`tokens.css` only declares `--space-*`, `--size-*`, `--motion-*`, `--z-*`. Multiple CSS Modules reference tokens that don't exist and have no fallback:

- `--color-gold` — `__root.module.css:8`
- `--color-parchment`, `--color-parchment-light` — `EventTable.module.css:46,49`
- `--color-bark-light` — `EventTable.module.css:53`
- `--font-display` — `__root.module.css:9`, `Badge.module.css:13`, `ChangelogRow.module.css:43`
- `--text-label` — `__root.module.css:11`, `ChangelogRow.module.css:45,53`, `ChangelogEntryPanel.module.css:18`
- `--text-badge` — `Badge.module.css:14`

These all silently resolve to `unset`. Also, `index.html` loads `IBM Plex Sans` / `IM Fell English` but the design spec calls for `Press Start 2P` / `Courier Prime`.

**Fix:** Define the full color/typography palette in `tokens.css` (or split into `tokens.colors.css`/`tokens.type.css`) and update `index.html` with the correct Google Fonts.

---

#### DS-2 — Double `<h1>` on every event detail page

`__root.tsx` renders `<h1>Gen Con Buddy</h1>` and `EventDetail.tsx:48` renders its own `<h1>` for the event title. Two `<h1>` elements per page is invalid heading hierarchy.

**Fix:** Demote the `EventDetail` title from `<h1>` to `<h2>`, or demote the global branding to a styled `<p>`.

---

#### DS-3 — Nested interactive elements in table sort headers

`EventTable.tsx:191-220`: each `<th>` contains a sort `<button>` plus a `<ColumnActionsPopover>` trigger (also a `<button>`). The sort button has `aria-label="Sort by X"` which overrides the visible label, breaking voice dictation ("click Title" fails — must say "click sort by title").

**Fix:** Remove `aria-label` from the sort button and let visible header text be the accessible name. `aria-sort` on `<th>` already conveys sort state.

---

#### DS-4 — `EventTypeSelect` chip remove buttons: hardcoded id + awkward tab order

`EventTypeSelect.tsx:51-72`: chip remove `<button>` elements inside `Combobox.InputGroup` create unexpected tab order (group container → chip removes → input). Also, `id="event-type-input"` is hardcoded — duplicate ids if the component is ever rendered twice.

**Fix:** Use `useId()` for the input id. Document or reconsider the keyboard model for chip removal.

---

#### DS-5 — `EventDetail` references `dlItem` CSS class that isn't defined

`EventDetail.tsx` references `styles.dlItem` throughout, but `EventDetail.module.css` only defines `dlFull` — not `dlItem`. Half the `<dl>` items silently have no class applied.

**Fix:** Define `.dlItem` in `EventDetail.module.css` (or rename the JSX references to match what exists).

---

### Design System Improvements

#### DS-6 — No `Field` or `RangeField` primitive in `src/ui/`

`SearchForm.tsx` (512 lines) repeats the `<label> + <input>` pattern inline ~30 times. Every range field (Duration, Players, Cost, Rounds, Dates, etc.) is a copy-pasted block. Base UI ships `Field` parts (`Field.Root`, `Field.Label`, `Field.Control`, `Field.Description`, `Field.Error`) with proper id wiring.

**Fix:** Create `src/ui/Field/` and `src/ui/RangeField/` primitives backed by Base UI `Field` and route all `SearchForm` inputs through them.

---

#### DS-7 — No `Select` primitive; native `<select>` appears 5× with copy-pasted boilerplate

`SearchForm.tsx:262-269,273-280,331-338,464-471` and `Pagination.tsx:96-106` all use native `<select>` with the same `<option value="">Any</option>` + map pattern. `Combobox` is already in use for `EventTypeSelect`, so Base UI `Select` fits the established architecture.

**Fix:** Create a `src/ui/Select/` primitive backed by Base UI `Select` and route all five call sites through it.

---

#### DS-8 — `<details>` transition CSS copy-pasted 3×

The same 10-line `::details-content` animation block lives in `EventTable.module.css:73-83`, `ChangelogRow.module.css:12-22`, and `ChangelogEntryPanel.module.css:22-32`. `ChangelogEntryPanel.tsx` renders three `<details open>` side-by-side — that's `Accordion` shaped.

**Fix:** Either wrap Base UI `Collapsible`/`Accordion` in a `src/ui/Disclosure/` primitive and migrate all three, or extract a shared CSS partial to compose from.

---

#### DS-9 — `Button` bypassed in 6+ places; no `ghost`/`icon` variants

Hand-rolled `<button>` elements with duplicated focus/hover/cursor CSS appear in `ColumnActionsPopover.tsx:43-77`, `ColumnResizeDialog.tsx:47-59`, `ActiveFilters.tsx:20-22`, `EventTable.tsx:151-159` (reset), `EventTable.tsx:192-204` (sort header), `EventTypeSelect.tsx:63-69` (chip remove).

**Fix:** Add `ghost` and `icon` variants to `src/ui/Button/Button.tsx` and route all six sites through it.

---

#### DS-10 — `clsx` installed but used once; everywhere else uses `.filter(Boolean).join(' ')`

`clsx` is in `package.json` and used at `Pagination.tsx:72-74`. All other conditional classname joins use the verbose array-filter pattern (`Badge.tsx:17,33,48`, `Button.tsx:20`, `ToggleTile.tsx:13,29`, `PixelState.tsx:29`).

**Fix:** Standardize on `clsx` throughout.

---

#### DS-11 — Pagination business constants duplicated across 3 files

`PAGE_SIZE_OPTIONS`, `BACKEND_MAX_RESULTS`, and the default page size of 100 are referenced in `Pagination.tsx`, `routes/index.tsx:79`, and commented in `utils/api.ts:33-37`.

**Fix:** Centralize in `src/utils/constants.ts` and import everywhere.

---

#### DS-12 — `key={JSON.stringify(search)}` remounts `SearchForm` on every URL change

`routes/index.tsx:102`: the form is fully unmounted/remounted on every sort click, page change, or browser back — destroying focus, scroll position, and all React state inside the form, even when form values didn't change.

**Fix:** Use `useForm({ values: parseSearchParams(search) })` (react-hook-form's `values` prop syncs automatically) instead of `defaultValues` + key remount.

---

#### DS-13 — CSS anchor positioning used with no browser support fallback

`EventTable.tsx:239-260` and `EventTable.module.css:90-118` use `anchor-name`, `anchor()`, `anchor-size()` — Chrome-only as of Apr 2026.

**Fix:** Add `@supports (anchor-name: --x) { … }` with a graceful fallback, or document the browser constraint in `AGENTS.md`.

---

#### DS-14 — `getActiveFilters.ts` is 226 lines of repeated `if` blocks

`src/ui/ActiveFilters/getActiveFilters.ts:78-222` — every filter rule is one of four patterns (plain text, range, date-range, multi-value). A small registry table would reduce this to ~50 lines and prevent linear growth as filters multiply.

**Fix:** Refactor to a data-driven registry approach.

---

#### DS-15 — `EventDetail` `<dl>` scaffold repeated 20+ times; needs a `DescriptionList` primitive

`EventDetail.tsx:50-210` repeats the same 4-line `<section> → <h2> → <dl> → <div> → <dt>/<dd>` scaffold for every field across four sections (THE EVENT, PLAYERS, LOGISTICS, CONTACT).

**Fix:** Create `src/ui/DescriptionList/` with `DescriptionList` and `DescriptionItem` components; `span="full"` prop replaces the `dlFull` / `dlItem` distinction.

---

### Other findings

#### DS-16 — `ConceptBadge` CSS vars never set; `conceptColors.ts` is dead code

`Badge.tsx:31-37` and `Badge.module.css:6-18`: `--concept-color` / `--concept-bg` are read in CSS but never written from JS. Every `ConceptBadge` renders with `#666`/`#fff` fallbacks regardless of concept. The 60-line `src/utils/conceptColors.ts` utility is unused.

**Fix:** Wire up `style={{ '--concept-color': ..., '--concept-bg': ... }}` from `conceptColors.ts`, or delete `conceptColors.ts` and the dead prop.

---

#### DS-17 — `useColumnVisibility`, `useColumnSizing`, `useSidebarOpen` all reimplement the same localStorage hook

Three hooks share identical `STORAGE_KEY`, `VERSION`, `readFromStorage`, and `useEffect` write logic.

**Fix:** Extract `useStoredState<T>(key, version, defaultValue)` in `src/hooks/` and reduce each to a one-liner.

---

#### DS-18 — Two unlabelled `<nav aria-label="Pagination">` per search page

`SearchResults.tsx:36-39,56,63` renders `<Pagination>` twice (top + bottom). Each wraps `<nav aria-label="Pagination">`, so screen readers announce two indistinguishable pagination landmarks.

**Fix:** Pass distinct `aria-label` values: `"Pagination, top"` / `"Pagination, bottom"`.

---

#### DS-19 — No route-level data fetching; all queries are component-level

All `useQuery` calls are in components, not TanStack Router loaders. For `/event/$id` the gameId is available at route resolution time.

**Fix:** Use `loader` + `queryClient.ensureQueryData(...)` in `routes/event.$id.tsx` to start fetching during route resolution and cut TTI.

---

#### DS-20 — Duplicate toggletip content and inaccurate wording in `SearchForm`

`SearchForm.tsx:136-141` and `186-191` both show identical "Clear the day checkboxes above…" toggletip messages. Also, `ToggleTile` renders as `role="button"` + `aria-pressed`, not checkboxes — the help text is inaccurate.

**Fix:** Render one shared explanation per disabled group; update wording from "checkboxes" to "day filters" or "day buttons".

---

#### DS-21 — `sr-only` is a global utility class referenced as a string literal

`global.css:14-24` defines `.sr-only` as the only global utility class; `Badge.tsx:50` uses it as `className="sr-only"`, bypassing CSS Modules encapsulation.

**Fix:** Either export it as a CSS Module composable class or accept this as a deliberate escape hatch and document it.

---

#### DS-22 — `storyMatrix.tsx` uses inline styles and references undefined tokens

`src/ui/storyMatrix.tsx:55-86` uses `style={{ … }}` with `--text-small` and `--color-bark-light` (undefined tokens) instead of a CSS Module.

**Fix:** Convert to a CSS Module consistent with project convention.
