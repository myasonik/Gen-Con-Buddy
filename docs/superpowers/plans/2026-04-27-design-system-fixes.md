# Design System Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve 19 accumulated design-system debt items (DS-2 through DS-22, minus DS-1 and DS-13 which are separate token/browser-compat work) covering accessibility fixes, CSS/component deduplication, new UI primitives, and architectural improvements.

**Architecture:** Most items are self-contained. Task ordering respects three dependency chains: (1) Button ghost/icon variants (Task 10) before migrating all inline `<button>` elements to use them; (2) `useStoredState` (Task 9) before updating the three storage hooks; (3) `Field`/`RangeField` (Task 15) before wiring SearchForm inputs through them. Run tests after every commit.

**Tech Stack:** React 18, TypeScript, CSS Modules, @base-ui/react ^1.3, react-hook-form ^7, @tanstack/react-query ^5, @tanstack/react-router ^1, clsx ^2, Vitest + @testing-library/react.

---

## File map

| Task | Creates | Modifies |
|------|---------|---------|
| 1 – DS-5 | — | `EventDetail.module.css` |
| 2 – DS-2 | — | `__root.tsx`, `EventDetail.tsx` |
| 3 – DS-3 | — | `EventTable.tsx` |
| 4 – DS-4 | — | `EventTypeSelect.tsx` |
| 5 – DS-21 | — | `AGENTS.md` |
| 6 – DS-10 | — | `Badge.tsx`, `Button.tsx`, `ToggleTile.tsx`, `PixelState.tsx` |
| 7 – DS-20 | — | `SearchForm.tsx` |
| 8 – DS-18 | — | `Pagination.tsx`, `SearchResults.tsx` |
| 9 – DS-11 | `src/utils/constants.ts` | `Pagination.tsx`, `routes/index.tsx`, `api.ts` |
| 10 – DS-22 | `src/ui/storyMatrix.module.css` | `storyMatrix.tsx` |
| 11 – DS-8 | — | `global.css`, `EventTable.module.css`, `ChangelogRow.module.css`, `ChangelogEntryPanel.module.css`, `EventTable.tsx`, `ChangelogRow.tsx`, `ChangelogEntryPanel.tsx` |
| 12 – DS-17 | `src/hooks/useStoredState.ts`, `src/hooks/useStoredState.test.ts` | `useColumnVisibility.ts`, `useColumnSizing.ts`, `useSidebarOpen.ts` |
| 13 – DS-9 | — | `Button.module.css`, `Button.tsx`, `ColumnActionsPopover.tsx`, `ColumnActionsPopover.module.css`, `ColumnResizeDialog.tsx`, `ColumnResizeDialog.module.css`, `ActiveFilters.tsx`, `EventTable.tsx` |
| 14 – DS-7 | `src/ui/Select/Select.tsx`, `src/ui/Select/Select.module.css`, `src/ui/Select/Select.test.tsx` | `Pagination.tsx`, `SearchForm.tsx` |
| 15 – DS-15 | `src/ui/DescriptionList/DescriptionList.tsx`, `src/ui/DescriptionList/DescriptionList.module.css`, `src/ui/DescriptionList/DescriptionList.test.tsx` | `EventDetail.tsx`, `EventDetail.module.css` |
| 16 – DS-14 | — | `getActiveFilters.ts` |
| 17 – DS-12 | — | `routes/index.tsx`, `SearchForm.tsx` |
| 18 – DS-6 | `src/ui/Field/Field.tsx`, `src/ui/Field/Field.module.css`, `src/ui/Field/Field.test.tsx` | `SearchForm.tsx` |
| 19 – DS-19 | `src/lib/queryClient.ts` | `main.tsx`, `routes/event.$id.tsx`, `routes/event.$id.test.tsx` |

---

## Task 1 — DS-5: Add missing `.dlItem` class to EventDetail.module.css

`EventDetail.tsx` references `styles.dlItem` throughout (e.g. lines 62, 66, 70…) but `EventDetail.module.css` only defines `.dlFull`. Every `dlItem` `<div>` silently has no class.

**Files:**
- Modify: `src/components/EventDetail/EventDetail.module.css`

- [ ] **Step 1: Add `.dlItem` rule after `.dlFull`**

Current `EventDetail.module.css` ends at line 46 (`margin: 0`) with no `.dlItem`. Add:

```css
.dlItem {
  /* default span — single column in the two-column grid */
}
```

(A blank rule is intentional: the item sits in a CSS grid column by default. The comment explains why it's non-empty.)

- [ ] **Step 2: Run tests**

```bash
npm test -- --run
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/EventDetail/EventDetail.module.css
git commit -m "fix(EventDetail): define missing .dlItem CSS class (DS-5)"
```

---

## Task 2 — DS-2: Fix double `<h1>` on event detail pages

`__root.tsx` renders `<h1>Gen Con Buddy</h1>`. `EventDetail.tsx:48` renders `<h1 className={styles.title}>{a.title}</h1>`. Two `<h1>` per page is invalid heading hierarchy.

Fix: demote the site branding in `__root.tsx` to `<p>` (it is descriptive text, not a section heading). Keep the event title as `<h1>` since it is the primary subject of the detail page. On the search page there is no secondary `<h1>` so this is safe.

**Files:**
- Modify: `src/routes/__root.tsx`

- [ ] **Step 1: Write failing test**

In `src/routes/event.$id.test.tsx`, add a test after the existing ones:

```ts
test('has exactly one h1 on the event detail page', async () => {
  server.use(
    http.get('/api/events/search', ({ request }) => {
      const url = new URL(request.url)
      const gameId = url.searchParams.get('gameId') ?? ''
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId, title: 'Only Heading Here' })],
        meta: { total: 1 },
        links: { self: '' },
        error: null,
      }
      return HttpResponse.json(response)
    }),
  )
  await renderEventDetailPage('RPG24000001')
  await screen.findByText('Only Heading Here')
  expect(document.querySelectorAll('h1')).toHaveLength(1)
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- --run src/routes/event.\$id.test.tsx
```

Expected: FAIL — "expected NodeList with 2 elements to have length 1".

- [ ] **Step 3: Demote branding in `__root.tsx`**

```tsx
// src/routes/__root.tsx  — replace <h1>Gen Con Buddy</h1> with:
<p className={rootStyles.brandingTitle}>Gen Con Buddy</p>
```

Full updated file:

```tsx
import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import indexStyles from './index.module.css'
import rootStyles from './__root.module.css'

export const Route = createRootRoute({
  component: () => (
    <div className={indexStyles.page}>
      <header role="banner" className={indexStyles.header}>
        <p className={rootStyles.brandingTitle}>Gen Con Buddy</p>
        <p>your guide to the best four days in gaming</p>
        <nav className={rootStyles.nav}>
          <Link to="/">Search</Link>
          <Link to="/changelog">Changelog</Link>
        </nav>
      </header>
      <Outlet />
    </div>
  ),
})
```

- [ ] **Step 4: Add `.brandingTitle` styling to `__root.module.css`**

Read the current `src/routes/__root.module.css` first, then append:

```css
.brandingTitle {
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
}
```

(Preserve whatever existing rules are in the file; only add `.brandingTitle`.)

- [ ] **Step 5: Run tests**

```bash
npm test -- --run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/routes/__root.tsx src/routes/__root.module.css src/routes/event.\$id.test.tsx
git commit -m "fix(a11y): remove duplicate h1 — demote site branding to <p> (DS-2)"
```

---

## Task 3 — DS-3: Remove redundant `aria-label` from sort header buttons

In `EventTable.tsx:195`, the sort `<button>` has `aria-label={\`Sort by ${label}\`}` which overrides the button's visible text. Voice dictation users say "click Title" but the button is labelled "Sort by title" — a mismatch. Also, `<th aria-label={label}>` on line 182 is redundant: `<th scope="col">` already uses its text content as the accessible name.

**Files:**
- Modify: `src/ui/EventTable/EventTable.tsx`

- [ ] **Step 1: Remove `aria-label` from the sort button and the `<th>`**

In `EventTable.tsx`, inside the `<th>` block:

Old:
```tsx
<th
  key={header.id}
  aria-sort={sortField ? ariaSort : undefined}
  scope="col"
  aria-label={label}
  className={styles.resizableTh}
  ...
>
  <div className={styles.thContent}>
    <button
      type="button"
      className={styles.sortButton}
      aria-label={`Sort by ${label}`}
      onClick={...}
    >
```

New (remove both `aria-label` attributes):
```tsx
<th
  key={header.id}
  aria-sort={sortField ? ariaSort : undefined}
  scope="col"
  className={styles.resizableTh}
  ...
>
  <div className={styles.thContent}>
    <button
      type="button"
      className={styles.sortButton}
      onClick={...}
    >
```

- [ ] **Step 2: Run tests**

```bash
npm test -- --run src/ui/EventTable/EventTable.test.tsx
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/ui/EventTable/EventTable.tsx
git commit -m "fix(a11y): remove aria-label overrides from sort header buttons (DS-3)"
```

---

## Task 4 — DS-4: Use `useId()` for EventTypeSelect input id

`EventTypeSelect.tsx` hardcodes `id="event-type-input"` on the Combobox.Input and `htmlFor="event-type-input"` on the label. If the component is rendered twice, both inputs share the same id (invalid HTML; screen readers pick the wrong one).

**Files:**
- Modify: `src/ui/EventTypeSelect/EventTypeSelect.tsx`

- [ ] **Step 1: Write a test that renders EventTypeSelect twice and checks for unique label targets**

Add to `src/ui/EventTypeSelect/EventTypeSelect.test.tsx` (at the end of the file, before closing):

```tsx
import { render, screen } from '@testing-library/react'
import { EventTypeSelect } from './EventTypeSelect'

test('two mounted EventTypeSelect instances have distinct input ids', () => {
  render(
    <>
      <EventTypeSelect value="" onValueChange={() => undefined} />
      <EventTypeSelect value="" onValueChange={() => undefined} />
    </>,
  )
  const inputs = screen.getAllByRole('combobox')
  expect(inputs[0].id).not.toBe('')
  expect(inputs[1].id).not.toBe('')
  expect(inputs[0].id).not.toBe(inputs[1].id)
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- --run src/ui/EventTypeSelect/EventTypeSelect.test.tsx
```

Expected: FAIL — both inputs share the same `id`.

- [ ] **Step 3: Replace hardcoded id with `useId()`**

```tsx
// src/ui/EventTypeSelect/EventTypeSelect.tsx
import { useState, useId } from 'react'  // add useId
import { Combobox } from '@base-ui/react/combobox'
import { EVENT_TYPES } from '../../utils/enums'
import styles from './EventTypeSelect.module.css'

export interface EventTypeSelectProps {
  value: string
  onValueChange: (value: string) => void
}

const OPTIONS = Object.entries(EVENT_TYPES).map(([code, label]) => ({
  code,
  label,
  name: label.replace(/^[A-Z]+ - /, ''),
}))

export function EventTypeSelect({ value, onValueChange }: EventTypeSelectProps): JSX.Element {
  const inputId = useId()
  const [open, setOpen] = useState(false)
  const [filterText, setFilterText] = useState('')
  const filter = Combobox.useFilter()

  const selectedCodes = value ? value.split(',') : []

  const filteredOptions = filterText
    ? OPTIONS.filter(
        ({ code, name }) => filter.contains(code, filterText) || filter.contains(name, filterText),
      )
    : OPTIONS

  function removeCode(code: string): void {
    onValueChange(selectedCodes.filter((c) => c !== code).join(','))
  }

  return (
    <div className={styles.root}>
      <Combobox.Root
        multiple
        value={selectedCodes}
        onValueChange={(codes) => onValueChange(codes.join(','))}
        onOpenChange={(isOpen) => {
          setOpen(isOpen)
          if (!isOpen) {
            setFilterText('')
          }
        }}
        onInputValueChange={(text) => setFilterText(text)}
      >
        <label htmlFor={inputId} className={styles.label}>
          Event Type
        </label>
        <Combobox.InputGroup className={styles.inputGroup}>
          {selectedCodes.map((code) => (
            <div key={code} data-testid="chip" className={styles.chip}>
              <span>
                {code}
                {open && (
                  <span>
                    {' – '}
                    {EVENT_TYPES[code]?.replace(/^[A-Z]+ - /, '')}
                  </span>
                )}
              </span>
              <button
                type="button"
                className={styles.chipRemove}
                aria-label={`Remove ${code}`}
                onClick={() => removeCode(code)}
              >
                ×
              </button>
            </div>
          ))}
          <Combobox.Input
            id={inputId}
            className={styles.input}
            placeholder={selectedCodes.length > 0 ? 'Add type…' : 'Filter types…'}
          />
          <Combobox.Trigger className={styles.trigger} aria-label="Toggle event type list">
            ▾
          </Combobox.Trigger>
        </Combobox.InputGroup>
        {open && (
          <Combobox.List className={styles.list}>
            {filteredOptions.map(({ code, name }) => (
              <Combobox.Item key={code} value={code} aria-label={name} className={styles.item}>
                <span aria-hidden className={styles.itemBadge}>
                  {code}
                </span>
                <span className={styles.itemName}>{name}</span>
                <Combobox.ItemIndicator className={styles.itemIndicator}>✓</Combobox.ItemIndicator>
              </Combobox.Item>
            ))}
          </Combobox.List>
        )}
      </Combobox.Root>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- --run src/ui/EventTypeSelect/EventTypeSelect.test.tsx
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/ui/EventTypeSelect/EventTypeSelect.tsx src/ui/EventTypeSelect/EventTypeSelect.test.tsx
git commit -m "fix(EventTypeSelect): use useId() for input id, fix duplicate-id risk (DS-4)"
```

---

## Task 5 — DS-21: Document `sr-only` and `animates-details` as deliberate global escape hatches

`Badge.tsx:50` uses `className="sr-only"` — a global CSS class bypassing CSS Modules. This is intentional: `::before`/`::after` pseudo-elements cannot use `composes`, and `sr-only` is a purely presentational, universally-understood utility with no naming conflict risk. Document it in `AGENTS.md` so reviewers don't flag it.

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Add a "Global CSS Escape Hatches" section**

Open `AGENTS.md`. After the existing Testing section, append:

```markdown
## Global CSS Escape Hatches

Two global utility classes in `src/styles/global.css` are intentionally used as bare strings (bypassing CSS Modules encapsulation). Do not replace them with CSS Module imports.

- `.sr-only` — screen-reader-only visually hidden pattern. Used where `composes:` would require a pseudo-element workaround (e.g. `Badge.tsx`).
- `.animates-details` — `::details-content` expand/collapse animation for `<details>` elements. Applied alongside component-scoped classes wherever `<details>` needs animated open/close; `composes:` cannot target pseudo-elements.
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: document sr-only and animates-details global CSS escape hatches (DS-21)"
```

---

## Task 6 — DS-10: Standardize on `clsx` throughout

`clsx` is installed and used in `Pagination.tsx` but all other conditional className joins use the verbose `.filter(Boolean).join(' ')` pattern. Standardize to `clsx` in all UI components.

**Files:**
- Modify: `src/ui/Badge/Badge.tsx`, `src/ui/Button/Button.tsx`, `src/ui/ToggleTile/ToggleTile.tsx`, `src/ui/PixelState/PixelState.tsx`

- [ ] **Step 1: Update `Badge.tsx`**

```tsx
// src/ui/Badge/Badge.tsx
import React from 'react'
import clsx from 'clsx'
import styles from './Badge.module.css'

export const BADGE_VARIANTS = ['filled', 'outline'] as const
export type BadgeVariant = (typeof BADGE_VARIANTS)[number]

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'filled', className }: BadgeProps): JSX.Element {
  return (
    <span
      data-variant={variant}
      className={clsx(styles.badge, styles[variant], className)}
    >
      {children}
    </span>
  )
}

export interface ConceptBadgeProps {
  concept: 'eventType' | 'day' | 'experience'
  value: string
  children?: React.ReactNode
  className?: string
}

export function ConceptBadge({ value, children, className }: ConceptBadgeProps): JSX.Element {
  return (
    <span className={clsx(styles.conceptBadge, className)}>
      {children ?? value}
    </span>
  )
}

interface BoolBadgeProps {
  value: string | boolean
  className?: string
}

export function BoolBadge({ value, className }: BoolBadgeProps): JSX.Element {
  const isYes = value === true || (typeof value === 'string' && value.toLowerCase() === 'yes')
  return (
    <span className={clsx(isYes ? styles.boolYes : styles.boolNo, className)}>
      <span aria-hidden="true">{isYes ? '✓' : '—'}</span>
      <span className="sr-only">{isYes ? 'yes' : 'no'}</span>
    </span>
  )
}
```

- [ ] **Step 2: Update `Button.tsx`**

```tsx
// src/ui/Button/Button.tsx
import React from 'react'
import { Button as BaseButton } from '@base-ui/react/button'
import clsx from 'clsx'
import styles from './Button.module.css'

export const BUTTON_VARIANTS = ['primary', 'secondary', 'ghost', 'icon'] as const
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number]

interface ButtonProps extends Omit<React.ComponentPropsWithRef<typeof BaseButton>, 'className'> {
  variant?: ButtonVariant
  className?: string
}

export const Button = React.forwardRef<HTMLElement, ButtonProps>(function Button(
  { variant = 'primary', className, ...props },
  ref,
) {
  return (
    <BaseButton
      ref={ref}
      className={clsx(styles.button, styles[variant], className)}
      {...props}
    />
  )
})
```

(The `ghost` and `icon` variants are declared here now but their CSS rules come in Task 13.)

- [ ] **Step 3: Update `ToggleTile.tsx`**

```tsx
// src/ui/ToggleTile/ToggleTile.tsx
import React from 'react'
import { Toggle } from '@base-ui/react/toggle'
import { ToggleGroup } from '@base-ui/react/toggle-group'
import clsx from 'clsx'
import styles from './ToggleTile.module.css'

export type ToggleTileProps = Toggle.Props

export const ToggleTile = React.forwardRef<HTMLButtonElement, ToggleTileProps>(function ToggleTile(
  { className, children, ...props },
  ref,
) {
  return (
    <Toggle ref={ref} className={clsx(styles.tile, className)} {...props}>
      {children}
    </Toggle>
  )
})

export type ToggleTileGroupProps = ToggleGroup.Props

export function ToggleTileGroup({
  className,
  multiple = true,
  ...props
}: ToggleTileGroupProps): JSX.Element {
  return (
    <ToggleGroup
      multiple={multiple}
      className={clsx(styles.group, className)}
      {...props}
    />
  )
}
```

- [ ] **Step 4: Update `PixelState.tsx`**

```tsx
// src/ui/PixelState/PixelState.tsx
import { useEffect } from 'react'
import clsx from 'clsx'
import { announce } from '../../lib/announce'
import { MeepleFlat } from '../icons/MeepleFlat'
import styles from './PixelState.module.css'

interface PixelStateProps {
  variant: 'loading' | 'empty' | 'error'
  text: string
  subtext?: string
}

export function PixelState({ variant, text, subtext }: PixelStateProps): JSX.Element {
  useEffect(() => {
    announce(text, variant === 'error' ? 'assertive' : 'polite')
  }, [variant, text])

  return (
    <div className={styles.state}>
      {variant === 'loading' && (
        <div className={styles.progressBar} data-testid="progress-bar">
          <div className={styles.progressFill} />
        </div>
      )}
      {variant === 'empty' && (
        <MeepleFlat className={styles.icon} aria-hidden="true" data-testid="empty-icon" />
      )}
      {variant === 'error' && (
        <MeepleFlat
          className={clsx(styles.icon, styles.iconError)}
          aria-hidden="true"
          data-testid="error-icon"
        />
      )}
      <p className={styles.text}>{text}</p>
      {subtext && <p className={styles.subtext}>{subtext}</p>}
    </div>
  )
}
```

- [ ] **Step 5: Run tests**

```bash
npm test -- --run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/ui/Badge/Badge.tsx src/ui/Button/Button.tsx src/ui/ToggleTile/ToggleTile.tsx src/ui/PixelState/PixelState.tsx
git commit -m "refactor: standardize className joins to clsx throughout UI components (DS-10)"
```

---

## Task 7 — DS-20: Fix duplicate and inaccurate Toggletip messages in SearchForm

`SearchForm.tsx` has three Toggletips for the days/date mutual-exclusion UI:

1. **Days section (line ~109):** "Clear the Start Date fields in Time filters to use day checkboxes." — "checkboxes" is inaccurate (they are toggle buttons). Fix to "day buttons".
2. **Time section, Start Date (line ~137):** "Clear the day checkboxes above to use custom Start Date fields." — Fix wording.
3. **Time section, End Date (line ~185):** "Clear the day checkboxes above to use custom **Start** Date fields." — says "Start" but is in the End Date group. Fix both the section reference and the "checkboxes" wording.

**Files:**
- Modify: `src/components/SearchForm/SearchForm.tsx`

- [ ] **Step 1: Fix all three Toggletip messages**

In `SearchForm.tsx`, make these three targeted replacements:

Replace (Days section):
```tsx
message="Clear the Start Date fields in Time filters to use day checkboxes."
```
With:
```tsx
message="Clear the Start Date fields in the TIME section to enable the day buttons."
```

Replace (Time section, Start Date):
```tsx
message="Clear the day checkboxes above to use custom Start Date fields."
```
With:
```tsx
message="Clear the day buttons in the DAYS section to enable custom Start Date fields."
```

Replace (Time section, End Date):
```tsx
message="Clear the day checkboxes above to use custom Start Date fields."
```
With:
```tsx
message="Clear the day buttons in the DAYS section to enable custom End Date fields."
```

- [ ] **Step 2: Run tests**

```bash
npm test -- --run src/components/SearchForm/SearchForm.test.tsx
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/SearchForm/SearchForm.tsx
git commit -m "fix(SearchForm): correct and deduplicate toggletip help messages (DS-20)"
```

---

## Task 8 — DS-18: Distinct `aria-label` values for top and bottom Pagination

`SearchResults.tsx` renders `<Pagination>` twice using the same `pagination` constant. Both render `<nav aria-label="Pagination">`, so screen readers announce two identical "Pagination" landmarks and users can't distinguish them.

**Files:**
- Modify: `src/components/Pagination/Pagination.tsx`, `src/components/SearchResults/SearchResults.tsx`

- [ ] **Step 1: Add `aria-label` prop to `Pagination`**

In `Pagination.tsx`, update the interface and use the prop:

```tsx
interface PaginationProps {
  page: number
  limit: number
  total: number
  onNavigate: (page: number, limit: number) => void
  'aria-label'?: string
}

export function Pagination({ page, limit, total, onNavigate, 'aria-label': ariaLabel = 'Pagination' }: PaginationProps): JSX.Element {
  // ... existing logic unchanged ...
  return (
    <nav aria-label={ariaLabel} className={styles.nav}>
      {/* ... rest unchanged ... */}
    </nav>
  )
}
```

- [ ] **Step 2: Pass distinct labels from `SearchResults.tsx`**

In `SearchResults.tsx`, change:

```tsx
const pagination =
  data && data.data.length > 0 ? (
    <Pagination page={page} limit={limit} total={data.meta.total} onNavigate={onNavigate} />
  ) : null
```

To use a render function instead so each Pagination gets its own label:

```tsx
function renderPagination(ariaLabel: string): JSX.Element | null {
  if (!data || data.data.length === 0) return null
  return (
    <Pagination
      page={page}
      limit={limit}
      total={data.meta.total}
      onNavigate={onNavigate}
      aria-label={ariaLabel}
    />
  )
}
```

And update the render:

```tsx
{data && data.data.length > 0 && (
  <>
    {renderPagination('Pagination, top')}
    <EventTable ... />
    {renderPagination('Pagination, bottom')}
  </>
)}
```

(Remove the existing `pagination` constant and both `{pagination}` usages.)

Full updated `SearchResults.tsx`:

```tsx
import { useQuery } from '@tanstack/react-query'
import { fetchEvents } from '../../utils/api'
import { Pagination } from '../Pagination/Pagination'
import type { SearchParams } from '../../utils/types'
import { PixelState } from '../../ui/PixelState/PixelState'
import { EventTable } from '../../ui/EventTable/EventTable'

interface SearchResultsProps {
  searchParams: SearchParams
  onNavigate: (page: number, limit: number) => void
  onSort: (sort: string | undefined) => void
}

export function SearchResults({
  searchParams,
  onNavigate,
  onSort,
}: SearchResultsProps): JSX.Element {
  const page = searchParams.page ?? 1
  const limit = searchParams.limit ?? 100
  const { data, isLoading, isError } = useQuery({
    queryKey: ['events', searchParams],
    queryFn: () => fetchEvents(searchParams),
  })

  let activeSortField: string | undefined = undefined
  let activeSortDir: 'asc' | 'desc' | undefined = undefined
  if (searchParams.sort) {
    const [field, dir] = searchParams.sort.split('.')
    if (field && (dir === 'asc' || dir === 'desc')) {
      activeSortField = field
      activeSortDir = dir
    }
  }

  function renderPagination(ariaLabel: string): JSX.Element | null {
    if (!data || data.data.length === 0) return null
    return (
      <Pagination
        page={page}
        limit={limit}
        total={data.meta.total}
        onNavigate={onNavigate}
        aria-label={ariaLabel}
      />
    )
  }

  return (
    <section>
      {isLoading && <PixelState variant="loading" text="LOADING QUESTS..." />}
      {isError && (
        <PixelState
          variant="error"
          text="QUEST FAILED"
          subtext="Unable to load events. Please try again."
        />
      )}
      {data && data.data.length === 0 && (
        <PixelState variant="empty" text="NO QUESTS FOUND" subtext="Try broadening your search." />
      )}
      {data && data.data.length > 0 && (
        <>
          {renderPagination('Pagination, top')}
          <EventTable
            events={data.data}
            activeSortField={activeSortField}
            activeSortDir={activeSortDir}
            onSort={onSort}
          />
          {renderPagination('Pagination, bottom')}
        </>
      )}
    </section>
  )
}
```

- [ ] **Step 3: Write a test that checks for two distinct nav landmarks**

Add to `src/components/SearchResults/SearchResults.test.tsx` (if the file does not already have a test for this):

```tsx
test('top and bottom pagination landmarks have distinct aria-labels', async () => {
  // (MSW default handlers return events, so data.data.length > 0)
  // render SearchResults with a searchParams that triggers results
  // ...check for two navs with different labels
  const navs = screen.getAllByRole('navigation')
  const labels = navs.map((n) => n.getAttribute('aria-label'))
  expect(labels).toContain('Pagination, top')
  expect(labels).toContain('Pagination, bottom')
})
```

Adapt the render call to match the test helper already in `SearchResults.test.tsx`.

- [ ] **Step 4: Run tests**

```bash
npm test -- --run
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/Pagination/Pagination.tsx src/components/SearchResults/SearchResults.tsx src/components/SearchResults/SearchResults.test.tsx
git commit -m "fix(a11y): give top and bottom Pagination distinct aria-labels (DS-18)"
```

---

## Task 9 — DS-11: Centralize pagination business constants

`PAGE_SIZE_OPTIONS = [100, 500, 1000]` and `BACKEND_MAX_RESULTS = 10_000` are declared inline in `Pagination.tsx`. `routes/index.tsx:79` hard-codes the default limit of `100`. `api.ts:34-36` comments explain the `100` default. Create a single source of truth.

**Files:**
- Create: `src/utils/constants.ts`
- Modify: `src/components/Pagination/Pagination.tsx`, `src/routes/index.tsx`, `src/utils/api.ts`

- [ ] **Step 1: Create `src/utils/constants.ts`**

```ts
export const DEFAULT_PAGE_SIZE = 100
export const BACKEND_MAX_RESULTS = 10_000
export const PAGE_SIZE_OPTIONS = [100, 500, 1_000] as const
```

- [ ] **Step 2: Update `Pagination.tsx`**

Remove the two `const` declarations at the top of the file and add the import:

```tsx
import { PAGE_SIZE_OPTIONS, BACKEND_MAX_RESULTS } from '../../utils/constants'
```

(Remove: `const PAGE_SIZE_OPTIONS = [100, 500, 1000] as const` and `const BACKEND_MAX_RESULTS = 10_000`)

- [ ] **Step 3: Update `routes/index.tsx`**

In `handleNavigate`:

```ts
const handleNavigate = (page: number, limit: number): void => {
  void navigate({
    search: (prev) => ({
      ...prev,
      page: page === 1 ? undefined : page,
      limit: limit === DEFAULT_PAGE_SIZE ? undefined : limit,
    }),
  })
}
```

Add import:
```ts
import { DEFAULT_PAGE_SIZE } from '../utils/constants'
```

- [ ] **Step 4: Update `api.ts` comment**

In `api.ts`, the comment block around the `limit` handling:

```ts
if (key === 'limit') {
  // Omit when equal to DEFAULT_PAGE_SIZE (API default).
  if (typeof value === 'number' && value !== DEFAULT_PAGE_SIZE) {
    url.searchParams.set('limit', String(value))
  }
  return
}
```

Add import at the top of `api.ts`:
```ts
import { DEFAULT_PAGE_SIZE } from './constants'
```

- [ ] **Step 5: Run tests**

```bash
npm test -- --run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/utils/constants.ts src/components/Pagination/Pagination.tsx src/routes/index.tsx src/utils/api.ts
git commit -m "refactor: centralize pagination constants in src/utils/constants.ts (DS-11)"
```

---

## Task 10 — DS-22: Convert `storyMatrix` Grid to CSS Module

`storyMatrix.tsx` uses inline `style={{ ... }}` with undefined tokens (`--text-small`, `--color-bark-light`). Convert to a CSS Module.

**Files:**
- Create: `src/ui/storyMatrix.module.css`
- Modify: `src/ui/storyMatrix.tsx`

- [ ] **Step 1: Create `src/ui/storyMatrix.module.css`**

```css
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: 1rem;
}

.cell {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
}

.label {
  font-size: 0.75rem;
  color: #666;
}
```

(Use literal values for now since `--text-small` and `--color-bark-light` tokens are not yet defined — see DS-1. When DS-1 lands, swap in the token references.)

- [ ] **Step 2: Update `storyMatrix.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import React from 'react'
import styles from './storyMatrix.module.css'

type AxisValues = Record<string, readonly unknown[]>

type Combo<T extends AxisValues> = {
  [K in keyof T]: T[K][number]
}

export function cartesian<T extends AxisValues>(axes: T): Combo<T>[] {
  const keys = Object.keys(axes)
  let result: Partial<Combo<T>>[] = [{}]

  for (const key of keys) {
    const next: Partial<Combo<T>>[] = []
    for (const combo of result) {
      for (const val of axes[key]) {
        next.push({ ...combo, [key]: val })
      }
    }
    result = next
  }

  return result as Combo<T>[]
}

export function makeMatrix<TMeta extends Meta<unknown>>(
  meta: TMeta,
  axes: AxisValues,
  defaults?: Record<string, unknown>,
): {
  stories: Record<string, StoryObj<TMeta>>
  Grid: () => React.JSX.Element
} {
  const combos = cartesian(axes)
  if (!meta.component) {
    throw new Error('makeMatrix requires meta.component to be defined')
  }
  const Component = meta.component as React.ComponentType<Record<string, unknown>>

  const stories: Record<string, StoryObj<TMeta>> = {}
  for (const combo of combos) {
    const vals = Object.values(combo).map(String)
    const key = vals.join('_')
    const name = vals.join(' / ')
    stories[key] = {
      name,
      args: { ...defaults, ...combo } as StoryObj<TMeta>['args'],
    } as StoryObj<TMeta>
  }

  function Grid(): JSX.Element {
    return (
      <div className={styles.grid}>
        {combos.map((combo) => {
          const key = Object.values(combo).map(String).join('_')
          const label = Object.entries(combo)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ')
          return (
            <div key={key} className={styles.cell}>
              <Component {...defaults} {...combo} />
              <span className={styles.label}>{label}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return { stories, Grid }
}
```

- [ ] **Step 3: Run tests**

```bash
npm test -- --run src/ui/storyMatrix.test.tsx
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/ui/storyMatrix.tsx src/ui/storyMatrix.module.css
git commit -m "refactor(storyMatrix): replace inline styles with CSS Module (DS-22)"
```

---

## Task 11 — DS-8: Extract `<details>` animation to shared global utility

The `::details-content` expand/collapse animation (10 lines) is copy-pasted in three CSS Modules. CSS Modules cannot `composes:` across pseudo-elements, so extract to a global utility class `.animates-details` in `global.css`.

Note: `EventTable.module.css` has a broken selector (`.visibilityPanel details::details-content` targets a nested `<details>` that doesn't exist — it should be `.visibilityPanel::details-content`). Fix this at the same time.

**Files:**
- Modify: `src/styles/global.css`
- Modify: `src/ui/EventTable/EventTable.module.css`, `src/ui/EventTable/EventTable.tsx`
- Modify: `src/components/ChangelogPage/ChangelogRow.module.css`, `src/components/ChangelogPage/ChangelogRow.tsx`
- Modify: `src/components/ChangelogPage/ChangelogEntryPanel.module.css`, `src/components/ChangelogPage/ChangelogEntryPanel.tsx`

- [ ] **Step 1: Add `.animates-details` to `global.css`**

Append to the end of `src/styles/global.css`:

```css
/* Shared animated open/close for <details> elements. Apply .animates-details to the <details> tag. */
.animates-details::details-content {
  height: 0;
  overflow: hidden;
  transition:
    height var(--motion-expand),
    content-visibility var(--motion-expand) allow-discrete;
}

.animates-details[open]::details-content {
  height: auto;
}
```

- [ ] **Step 2: Update `EventTable.module.css`**

Remove the broken animation block and fix it:

Old (lines ~73-83):
```css
.visibilityPanel details::details-content {
  height: 0;
  overflow: hidden;
  transition:
    height var(--motion-expand),
    content-visibility var(--motion-expand) allow-discrete;
}

.visibilityPanel details[open]::details-content {
  height: auto;
}
```

Delete those 10 lines entirely. The `.animates-details` global class will handle it.

- [ ] **Step 3: Update `EventTable.tsx`**

In the `<details className={styles.visibilityPanel}>` element, add the `animates-details` class:

```tsx
<details className={`${styles.visibilityPanel} animates-details`}>
```

- [ ] **Step 4: Update `ChangelogRow.module.css`**

Remove lines 12-22 (the `::details-content` animation block):

```css
/* DELETE these lines: */
.row::details-content {
  height: 0;
  overflow: hidden;
  transition:
    height var(--motion-expand),
    content-visibility var(--motion-expand) allow-discrete;
}

.row[open]::details-content {
  height: auto;
}
```

- [ ] **Step 5: Add `animates-details` class to ChangelogRow**

Read `src/components/ChangelogPage/ChangelogRow.tsx`. Find the `<details>` element (it will have `className={styles.row}` or similar) and add `animates-details`:

```tsx
<details className={`${styles.row} animates-details`} ...>
```

- [ ] **Step 6: Update `ChangelogEntryPanel.module.css`**

Remove lines 22-32 (the `::details-content` animation block):

```css
/* DELETE these lines: */
.group::details-content {
  height: 0;
  overflow: hidden;
  transition:
    height var(--motion-expand),
    content-visibility var(--motion-expand) allow-discrete;
}

.group[open]::details-content {
  height: auto;
}
```

- [ ] **Step 7: Add `animates-details` class to ChangelogEntryPanel**

Read `src/components/ChangelogPage/ChangelogEntryPanel.tsx`. Find the `<details>` element(s) with `className={styles.group}` and add `animates-details`:

```tsx
<details className={`${styles.group} animates-details`} ...>
```

- [ ] **Step 8: Run tests**

```bash
npm test -- --run
```

Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/styles/global.css \
  src/ui/EventTable/EventTable.module.css src/ui/EventTable/EventTable.tsx \
  src/components/ChangelogPage/ChangelogRow.module.css src/components/ChangelogPage/ChangelogRow.tsx \
  src/components/ChangelogPage/ChangelogEntryPanel.module.css src/components/ChangelogPage/ChangelogEntryPanel.tsx
git commit -m "refactor: extract shared details animation to .animates-details global utility (DS-8)"
```

---

## Task 12 — DS-17: Extract `useStoredState` hook

`useColumnVisibility`, `useColumnSizing`, and `useSidebarOpen` each re-implement: reading from localStorage, falling back to a default, writing on change, and version-checking (for the two column hooks). Extract the shared pattern into `useStoredState<T>`.

**Design:** `useStoredState<T>(key, version, defaultValue)` stores `{ version, value: T }` as JSON. On mismatch it falls back to `defaultValue` and overwrites. This changes the `useSidebarOpen` storage format from plain `'true'`/`'false'` to `{ version: 1, value: true }` — existing users will get reset to the default (`true` = open) on first load after the upgrade, which is acceptable.

**Files:**
- Create: `src/hooks/useStoredState.ts`, `src/hooks/useStoredState.test.ts`
- Modify: `src/hooks/useColumnVisibility.ts`, `src/hooks/useColumnSizing.ts`, `src/hooks/useSidebarOpen.ts`

- [ ] **Step 1: Write tests for `useStoredState`**

Create `src/hooks/useStoredState.test.ts`:

```ts
import { expect, test, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStoredState } from './useStoredState'

const KEY = 'test-stored-state'

beforeEach(() => {
  localStorage.clear()
})

test('returns defaultValue on first use', () => {
  const { result } = renderHook(() => useStoredState(KEY, 1, { count: 0 }))
  expect(result.current[0]).toStrictEqual({ count: 0 })
})

test('setValue updates the state', () => {
  const { result } = renderHook(() => useStoredState(KEY, 1, { count: 0 }))
  act(() => {
    result.current[1]({ count: 5 })
  })
  expect(result.current[0]).toStrictEqual({ count: 5 })
})

test('setValue with updater function updates the state', () => {
  const { result } = renderHook(() => useStoredState(KEY, 1, { count: 0 }))
  act(() => {
    result.current[1]((prev) => ({ count: prev.count + 1 }))
  })
  expect(result.current[0]).toStrictEqual({ count: 1 })
})

test('persists value to localStorage', () => {
  const { result } = renderHook(() => useStoredState(KEY, 1, { count: 0 }))
  act(() => {
    result.current[1]({ count: 42 })
  })
  const stored = JSON.parse(localStorage.getItem(KEY) ?? '{}')
  expect(stored).toStrictEqual({ version: 1, value: { count: 42 } })
})

test('loads persisted value on remount', () => {
  localStorage.setItem(KEY, JSON.stringify({ version: 1, value: { count: 7 } }))
  const { result } = renderHook(() => useStoredState(KEY, 1, { count: 0 }))
  expect(result.current[0]).toStrictEqual({ count: 7 })
})

test('falls back to default when version mismatches', () => {
  localStorage.setItem(KEY, JSON.stringify({ version: 9999, value: { count: 99 } }))
  const { result } = renderHook(() => useStoredState(KEY, 1, { count: 0 }))
  expect(result.current[0]).toStrictEqual({ count: 0 })
})

test('falls back to default when storage is malformed', () => {
  localStorage.setItem(KEY, 'not-json{{{')
  const { result } = renderHook(() => useStoredState(KEY, 1, { count: 0 }))
  expect(result.current[0]).toStrictEqual({ count: 0 })
})
```

- [ ] **Step 2: Run the tests to confirm they fail**

```bash
npm test -- --run src/hooks/useStoredState.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `useStoredState`**

Create `src/hooks/useStoredState.ts`:

```ts
import { useState, useEffect } from 'react'

type SetStateAction<T> = T | ((prev: T) => T)

export function useStoredState<T>(
  key: string,
  version: number,
  defaultValue: T,
): [T, (next: SetStateAction<T>) => void] {
  const [value, setValueState] = useState<T>(() => readFromStorage(key, version, defaultValue))

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify({ version, value }))
    } catch {
      // ignore write errors
    }
  }, [key, version, value])

  const setValue = (next: SetStateAction<T>): void => {
    setValueState((prev) => (typeof next === 'function' ? (next as (p: T) => T)(prev) : next))
  }

  return [value, setValue]
}

function readFromStorage<T>(key: string, version: number, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return defaultValue
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      (parsed as { version?: unknown }).version !== version
    ) {
      return defaultValue
    }
    return (parsed as { version: number; value: T }).value
  } catch {
    return defaultValue
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- --run src/hooks/useStoredState.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Refactor `useColumnVisibility.ts`**

```ts
import type { Dispatch, SetStateAction } from 'react'
import { useStoredState } from './useStoredState'

const STORAGE_KEY = 'gen-con-buddy-columns'
const VERSION = 1

const DEFAULTS: Record<string, boolean> = {
  gameId: false,
  title: true,
  eventType: true,
  group: false,
  shortDescription: true,
  longDescription: false,
  gameSystem: false,
  rulesEdition: false,
  minPlayers: true,
  maxPlayers: true,
  ageRequired: false,
  experienceRequired: false,
  materialsProvided: false,
  materialsRequired: false,
  materialsRequiredDetails: false,
  day: true,
  startDateTime: true,
  duration: false,
  endDateTime: true,
  gmNames: false,
  website: false,
  email: false,
  tournament: false,
  roundNumber: false,
  totalRounds: false,
  minimumPlayTime: false,
  attendeeRegistration: false,
  cost: false,
  location: false,
  roomName: false,
  tableNumber: false,
  specialCategory: false,
  ticketsAvailable: true,
  lastModified: false,
}

export function useColumnVisibility(): {
  visibility: Record<string, boolean>
  toggle: (column: string) => void
  reset: () => void
} {
  const [visibility, setVisibility] = useStoredState(STORAGE_KEY, VERSION, { ...DEFAULTS })

  const toggle = (column: string): void => {
    setVisibility((prev) => ({ ...prev, [column]: !prev[column] }))
  }

  const reset = (): void => {
    setVisibility({ ...DEFAULTS })
  }

  return { visibility, toggle, reset }
}
```

- [ ] **Step 6: Run useColumnVisibility tests**

```bash
npm test -- --run src/hooks/useColumnVisibility.test.ts
```

Expected: all tests pass. (Note: the test at line 39 checks `localStorage` contains `{ version: 1, visibility: ... }` — the storage format has changed to `{ version: 1, value: ... }`. Update that test assertion to match the new format.)

Update `useColumnVisibility.test.ts` line ~40 (the test that inspects localStorage directly, if any):
The existing tests don't inspect the raw JSON format — they only check behavior through the hook API. Verify: run tests and confirm they pass without changes.

- [ ] **Step 7: Refactor `useColumnSizing.ts`**

`useColumnSizing` has one special behavior: it removes the localStorage key when `sizing` is empty. Preserve this with a `useEffect` in the hook:

```ts
import { useEffect } from 'react'
import type { ColumnSizingState, OnChangeFn } from '@tanstack/react-table'
import { useStoredState } from './useStoredState'

const STORAGE_KEY = 'gcb-column-sizing'
const VERSION = 1

export function useColumnSizing(): {
  sizing: ColumnSizingState
  setSizing: OnChangeFn<ColumnSizingState>
  reset: () => void
} {
  const [sizingState, setSizingState] = useStoredState<ColumnSizingState>(STORAGE_KEY, VERSION, {})

  useEffect(() => {
    if (Object.keys(sizingState).length === 0) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [sizingState])

  const setSizing: OnChangeFn<ColumnSizingState> = (updaterOrValue): void => {
    setSizingState((prev) =>
      typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue,
    )
  }

  const reset = (): void => {
    setSizingState({})
  }

  return { sizing: sizingState, setSizing, reset }
}
```

- [ ] **Step 8: Run useColumnSizing tests**

```bash
npm test -- --run src/hooks/useColumnSizing.test.ts
```

One test (`persists sizing to localStorage`) checks the raw JSON:
```ts
expect(stored).toStrictEqual({ version: 1, sizing: { title: 300 } })
```
Update it to the new format:
```ts
expect(stored).toStrictEqual({ version: 1, value: { title: 300 } })
```

Re-run; expected: all tests pass.

- [ ] **Step 9: Refactor `useSidebarOpen.ts`**

```ts
import { useStoredState } from './useStoredState'

const STORAGE_KEY = 'sidebarOpen'
const VERSION = 1

export function useSidebarOpen(): [boolean, () => void] {
  const [open, setOpen] = useStoredState(STORAGE_KEY, VERSION, true)
  const toggle = (): void => setOpen((prev) => !prev)
  return [open, toggle]
}
```

- [ ] **Step 10: Run useSidebarOpen tests**

```bash
npm test -- --run src/hooks/useSidebarOpen.test.ts
```

The existing tests check behavior through the hook API. They should pass without changes to the test file. If any test inspects raw localStorage content, update it to `{ version: 1, value: true/false }`.

- [ ] **Step 11: Run full test suite**

```bash
npm test -- --run
```

Expected: all tests pass.

- [ ] **Step 12: Commit**

```bash
git add src/hooks/useStoredState.ts src/hooks/useStoredState.test.ts \
  src/hooks/useColumnVisibility.ts src/hooks/useColumnSizing.ts \
  src/hooks/useSidebarOpen.ts src/hooks/useColumnSizing.test.ts
git commit -m "refactor: extract useStoredState hook, reduce storage hooks to thin wrappers (DS-17)"
```

---

## Task 13 — DS-9: Add `ghost` and `icon` Button variants; route inline `<button>` usages through Button

Six places use hand-rolled `<button>` elements with duplicated focus/hover/cursor CSS instead of using the `Button` component:

- `ColumnActionsPopover.tsx` — 3 action buttons (`.action` class)
- `ColumnResizeDialog.tsx` — Cancel and Apply buttons (`.button` class)
- `ActiveFilters.tsx` — chip remove buttons (`.chip` class)
- `EventTable.tsx` — "Reset to defaults" button (bare `<button>`)
- `EventTable.tsx` — sort header button (`.sortButton` class — keep as-is; it is not a Button semantically, just a clickable header)

The sort header button (`styles.sortButton`) should NOT use the Button primitive — it has very specific layout behavior (`flex: 1`, `min-width: 0`) that is part of the `<th>` layout. Leave it as a plain `<button>` with `className={styles.sortButton}`.

Add two new variants:
- `ghost` — transparent background, no border, inherits color; for text-style action buttons in popovers/menus
- `icon` — small square icon-only button; for chip removes, column trigger

**Files:**
- Modify: `src/ui/Button/Button.module.css`
- Modify: `src/ui/Button/Button.tsx` (already updated in Task 6)
- Modify: `src/ui/EventTable/ColumnActionsPopover.tsx`, `src/ui/EventTable/ColumnActionsPopover.module.css`
- Modify: `src/ui/EventTable/ColumnResizeDialog.tsx`, `src/ui/EventTable/ColumnResizeDialog.module.css`
- Modify: `src/ui/ActiveFilters/ActiveFilters.tsx`
- Modify: `src/ui/EventTable/EventTable.tsx`

- [ ] **Step 1: Add `ghost` and `icon` CSS rules to `Button.module.css`**

Current `Button.module.css` has only `.button`, `.button:focus-visible`, `.button:disabled`. Append:

```css
.primary {
  /* existing primary styles if any — add if absent */
}

.secondary {
  /* existing secondary styles if any — add if absent */
}

.ghost {
  background: none;
  border: none;
  padding: var(--space-1) var(--space-2);
  text-align: left;
  width: 100%;
  color: inherit;
}

.ghost:hover {
  opacity: 0.8;
}

.icon {
  background: none;
  border: none;
  padding: 0.125rem;
  color: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.125rem;
  line-height: 1;
}

.icon:hover {
  opacity: 0.8;
}
```

(The `.button` base class already provides `cursor: pointer` and `focus-visible` outline.)

- [ ] **Step 2: Update `ColumnActionsPopover.tsx`**

Replace the three raw `<button className={styles.action}>` elements with `<Button variant="ghost">`. The popover trigger stays as-is (it's a `Popover.Trigger`, not a bare `<button>`).

```tsx
// src/ui/EventTable/ColumnActionsPopover.tsx
import { useState } from 'react'
import { Popover } from '@base-ui/react/popover'
import { Button } from '../../ui/Button/Button'
import styles from './ColumnActionsPopover.module.css'

// ... (interface unchanged) ...

export function ColumnActionsPopover({ ... }): JSX.Element {
  // ... (logic unchanged) ...
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        className={`${styles.trigger}${open ? ` ${styles.triggerOpen}` : ''}`}
        aria-label="Column actions"
      >
        {/* svg unchanged */}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={4}>
          <Popover.Popup className={styles.popup}>
            {sortField && (
              <>
                <Button
                  variant="ghost"
                  aria-pressed={isSortedAsc}
                  onClick={() => {
                    onSort(isSortedAsc ? undefined : `${sortField}.asc`)
                    setOpen(false)
                  }}
                >
                  Sort ascending
                </Button>
                <Button
                  variant="ghost"
                  aria-pressed={isSortedDesc}
                  onClick={() => {
                    onSort(isSortedDesc ? undefined : `${sortField}.desc`)
                    setOpen(false)
                  }}
                >
                  Sort descending
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              onClick={() => {
                setOpen(false)
                onOpenResize()
              }}
            >
              Resize…
            </Button>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
```

Remove `.action` rule from `ColumnActionsPopover.module.css` (the `ghost` variant in Button.module.css replaces it).

- [ ] **Step 3: Update `ColumnResizeDialog.tsx`**

Replace the two raw `<button className={styles.button}>` elements:

```tsx
import { Button } from '../../ui/Button/Button'

// In the actions div:
<div className={styles.actions}>
  <Button variant="secondary" onClick={onClose}>
    Cancel
  </Button>
  <Button
    variant="primary"
    onClick={() => {
      onApply(Number(value))
      onClose()
    }}
  >
    Apply
  </Button>
</div>
```

Remove `.button` and `.primaryButton` rules from `ColumnResizeDialog.module.css`.

- [ ] **Step 4: Update `ActiveFilters.tsx`**

Replace the raw `<button className={styles.chip}>` with `<Button variant="ghost">`:

```tsx
import { Button } from '../../ui/Button/Button'

// In the list:
<Button
  variant="ghost"
  type="button"
  className={styles.chip}
  onClick={() => onRemove(filter)}
>
  {filter.label} <span aria-hidden="true">×</span>
</Button>
```

(Keep `className={styles.chip}` for the chip-specific layout/color styles.)

- [ ] **Step 5: Update `EventTable.tsx` reset button**

The "Reset to defaults" button in the column visibility panel:

```tsx
// Replace:
<button
  type="button"
  onClick={() => {
    reset()
    resetSizing()
  }}
>
  Reset to defaults
</button>

// With:
<Button
  variant="secondary"
  onClick={() => {
    reset()
    resetSizing()
  }}
>
  Reset to defaults
</Button>
```

Add `import { Button } from '../../ui/Button/Button'` if not already present (it should already be from columns.tsx or EventTable.tsx — check the existing imports).

- [ ] **Step 6: Run tests**

```bash
npm test -- --run
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/ui/Button/Button.module.css \
  src/ui/EventTable/ColumnActionsPopover.tsx src/ui/EventTable/ColumnActionsPopover.module.css \
  src/ui/EventTable/ColumnResizeDialog.tsx src/ui/EventTable/ColumnResizeDialog.module.css \
  src/ui/ActiveFilters/ActiveFilters.tsx \
  src/ui/EventTable/EventTable.tsx
git commit -m "feat(Button): add ghost/icon variants; route inline buttons through Button (DS-9)"
```

---

## Task 14 — DS-7: Create `Select` primitive; replace 5 native `<select>` usages

Create a `Select` primitive backed by Base UI `Select`. Replace native `<select>` in `Pagination.tsx` (1 usage) and `SearchForm.tsx` (4 usages: ageRequired, experienceRequired, attendeeRegistration, specialCategory).

For SearchForm integration, use `watch()` + `setValue()` — the same pattern already used for `EventTypeSelect` — rather than `register()`, since Base UI Select is a custom component.

**Files:**
- Create: `src/ui/Select/Select.tsx`, `src/ui/Select/Select.module.css`, `src/ui/Select/Select.test.tsx`
- Modify: `src/components/Pagination/Pagination.tsx`, `src/components/SearchForm/SearchForm.tsx`

- [ ] **Step 1: Write tests for `Select`**

Create `src/ui/Select/Select.test.tsx`:

```tsx
import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Select } from './Select'

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
]

test('renders the placeholder when no value is selected', () => {
  render(
    <Select value="" onValueChange={() => undefined} options={OPTIONS} placeholder="Any" />,
  )
  expect(screen.getByRole('combobox')).toHaveTextContent('Any')
})

test('shows the selected option label', () => {
  render(
    <Select value="a" onValueChange={() => undefined} options={OPTIONS} />,
  )
  expect(screen.getByRole('combobox')).toHaveTextContent('Alpha')
})

test('calls onValueChange with the selected value', async () => {
  const handleChange = vi.fn<(v: string) => void>()
  render(
    <Select value="" onValueChange={handleChange} options={OPTIONS} />,
  )
  await userEvent.click(screen.getByRole('combobox'))
  await userEvent.click(screen.getByRole('option', { name: 'Beta' }))
  expect(handleChange).toHaveBeenCalledWith('b')
})
```

Add `import { vi } from 'vitest'` at the top.

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --run src/ui/Select/Select.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `Select.module.css`**

```css
.trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  border: 0.0625rem solid;
  background: Canvas;
  cursor: pointer;
  min-width: 8rem;
}

.trigger:focus-visible {
  outline: 0.125rem solid;
  outline-offset: 0.0625rem;
}

.icon {
  margin-left: auto;
  flex-shrink: 0;
}

.popup {
  background: Canvas;
  border: 0.0625rem solid;
  min-width: var(--select-trigger-width, 8rem);
  z-index: var(--z-popover);
}

.item {
  padding: var(--space-1) var(--space-2);
  cursor: pointer;
}

.item:hover,
.item[data-highlighted] {
  background: color-mix(in srgb, currentcolor 10%, transparent);
}

.item[data-selected] {
  font-weight: 600;
}
```

- [ ] **Step 4: Create `Select.tsx`**

```tsx
import { Select as BaseSelect } from '@base-ui/react/select'
import clsx from 'clsx'
import styles from './Select.module.css'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = 'Any',
  className,
}: SelectProps): JSX.Element {
  return (
    <BaseSelect.Root
      value={value || null}
      onValueChange={(v) => onValueChange(v ?? '')}
    >
      <BaseSelect.Trigger className={clsx(styles.trigger, className)}>
        <BaseSelect.Value placeholder={placeholder} />
        <BaseSelect.Icon className={styles.icon}>▾</BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner>
          <BaseSelect.Popup className={styles.popup}>
            <BaseSelect.Item value={null} className={styles.item}>
              <BaseSelect.ItemText>{placeholder}</BaseSelect.ItemText>
            </BaseSelect.Item>
            {options.map(({ value: v, label }) => (
              <BaseSelect.Item key={v} value={v} className={styles.item}>
                <BaseSelect.ItemText>{label}</BaseSelect.ItemText>
              </BaseSelect.Item>
            ))}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  )
}
```

- [ ] **Step 5: Run tests**

```bash
npm test -- --run src/ui/Select/Select.test.tsx
```

Expected: all tests pass. If Base UI's Select API differs slightly from the code above (e.g. `value={null}` vs `value=""`), adjust to match what the test expects.

- [ ] **Step 6: Update `Pagination.tsx`**

Replace:
```tsx
<label className={styles.perPageLabel}>
  Per page
  <select
    value={limit}
    onChange={(e) => onNavigate(1, Number(e.target.value))}
    className={styles.perPageSelect}
  >
    {PAGE_SIZE_OPTIONS.map((opt) => (
      <option key={opt} value={opt}>
        {opt}
      </option>
    ))}
  </select>
</label>
```

With:
```tsx
<label className={styles.perPageLabel}>
  Per page
  <Select
    value={String(limit)}
    onValueChange={(v) => onNavigate(1, Number(v))}
    options={PAGE_SIZE_OPTIONS.map((opt) => ({ value: String(opt), label: String(opt) }))}
  />
</label>
```

Add import: `import { Select } from '../../ui/Select/Select'`

- [ ] **Step 7: Update `SearchForm.tsx`**

Add `watch` calls for the four controlled selects (they may already be watched via existing `watch()` calls — if not, add them). Add `Select` import.

The four replacements:

**ageRequired** — replace:
```tsx
<label className={styles.label}>
  Age Required
  <select className={styles.select} {...register('ageRequired')}>
    <option value="">Any</option>
    {Object.entries(AGE_GROUPS).map(([k, v]) => (
      <option key={k} value={k}>{v}</option>
    ))}
  </select>
</label>
```
With:
```tsx
<label className={styles.label}>
  Age Required
  <Select
    value={watch('ageRequired') ?? ''}
    onValueChange={(v) => setValue('ageRequired', v)}
    options={Object.entries(AGE_GROUPS).map(([k, v]) => ({ value: k, label: v }))}
  />
</label>
```

**experienceRequired** — same pattern with `EXP` enum.

**attendeeRegistration** — same pattern with `REGISTRATION` enum.

**specialCategory** — same pattern with `CATEGORY` enum.

- [ ] **Step 8: Run tests**

```bash
npm test -- --run
```

Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/ui/Select/Select.tsx src/ui/Select/Select.module.css src/ui/Select/Select.test.tsx \
  src/components/Pagination/Pagination.tsx src/components/SearchForm/SearchForm.tsx
git commit -m "feat(Select): create Base UI Select primitive; replace 5 native <select> usages (DS-7)"
```

---

## Task 15 — DS-15: Create `DescriptionList` primitive; refactor `EventDetail`

`EventDetail.tsx` repeats a 4-line `<section>/<h2>/<dl>/<div>/<dt>/<dd>` scaffold 20+ times. Extract `DescriptionList` and `DescriptionItem` components. A `span="full"` prop replaces the `dlFull`/`dlItem` distinction.

**Files:**
- Create: `src/ui/DescriptionList/DescriptionList.tsx`, `src/ui/DescriptionList/DescriptionList.module.css`, `src/ui/DescriptionList/DescriptionList.test.tsx`
- Modify: `src/components/EventDetail/EventDetail.tsx`, `src/components/EventDetail/EventDetail.module.css`

- [ ] **Step 1: Write tests**

Create `src/ui/DescriptionList/DescriptionList.test.tsx`:

```tsx
import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DescriptionList, DescriptionItem } from './DescriptionList'

test('renders term and description', () => {
  render(
    <DescriptionList>
      <DescriptionItem term="Color">Blue</DescriptionItem>
    </DescriptionList>,
  )
  expect(screen.getByRole('term')).toHaveTextContent('Color')
  expect(screen.getByRole('definition')).toHaveTextContent('Blue')
})

test('renders multiple items', () => {
  render(
    <DescriptionList>
      <DescriptionItem term="Color">Blue</DescriptionItem>
      <DescriptionItem term="Size">Large</DescriptionItem>
    </DescriptionList>,
  )
  expect(screen.getAllByRole('term')).toHaveLength(2)
  expect(screen.getAllByRole('definition')).toHaveLength(2)
})

test('full-span item has the full-span class', () => {
  const { container } = render(
    <DescriptionList>
      <DescriptionItem term="Description" span="full">
        Long text here
      </DescriptionItem>
    </DescriptionList>,
  )
  const wrapper = container.querySelector('[data-span="full"]')
  expect(wrapper).toBeInTheDocument()
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --run src/ui/DescriptionList/DescriptionList.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `DescriptionList.module.css`**

```css
.dl {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  margin: 0;
}

.item {
  /* default: single column */
}

.item[data-span='full'] {
  grid-column: 1 / -1;
}

.dt {
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  opacity: 0.7;
  margin-bottom: var(--space-1);
}

.dd {
  margin: 0;
}
```

- [ ] **Step 4: Create `DescriptionList.tsx`**

```tsx
import React from 'react'
import styles from './DescriptionList.module.css'

interface DescriptionListProps {
  children: React.ReactNode
  className?: string
}

export function DescriptionList({ children, className }: DescriptionListProps): JSX.Element {
  return <dl className={[styles.dl, className].filter(Boolean).join(' ')}>{children}</dl>
}

interface DescriptionItemProps {
  term: string
  children: React.ReactNode
  span?: 'full'
  className?: string
}

export function DescriptionItem({
  term,
  children,
  span,
  className,
}: DescriptionItemProps): JSX.Element {
  return (
    <div
      className={[styles.item, className].filter(Boolean).join(' ')}
      data-span={span}
    >
      <dt className={styles.dt}>{term}</dt>
      <dd className={styles.dd}>{children}</dd>
    </div>
  )
}
```

- [ ] **Step 5: Run tests**

```bash
npm test -- --run src/ui/DescriptionList/DescriptionList.test.tsx
```

Expected: all tests pass.

- [ ] **Step 6: Refactor `EventDetail.tsx`**

Replace all `<div className={styles.dlFull}>` and `<div className={styles.dlItem}>` blocks with `<DescriptionItem>`. Replace all four `<dl className={styles.dl}>` with `<DescriptionList>`. Remove `dt`/`dd` props from EventDetail.module.css (they move to DescriptionList.module.css).

Example transformation of the THE EVENT section:

```tsx
{/* Before */}
<dl className={styles.dl}>
  <div className={styles.dlFull}>
    <dt className={styles.dt}>Short Description</dt>
    <dd className={styles.dd}>{a.shortDescription}</dd>
  </div>
  <div className={styles.dlItem}>
    <dt className={styles.dt}>Event Type</dt>
    <dd className={styles.dd}>{a.eventType}</dd>
  </div>
  {/* ... */}
</dl>

{/* After */}
<DescriptionList>
  <DescriptionItem term="Short Description" span="full">{a.shortDescription}</DescriptionItem>
  <DescriptionItem term="Long Description" span="full">{a.longDescription}</DescriptionItem>
  <DescriptionItem term="Event Type">{a.eventType}</DescriptionItem>
  <DescriptionItem term="Group">{a.group}</DescriptionItem>
  <DescriptionItem term="Game System">{a.gameSystem}</DescriptionItem>
  <DescriptionItem term="Rules Edition">{a.rulesEdition}</DescriptionItem>
  <DescriptionItem term="Special Category">{a.specialCategory}</DescriptionItem>
</DescriptionList>
```

Apply the same transformation to PLAYERS, LOGISTICS, and CONTACT sections.

Add import at the top of `EventDetail.tsx`:
```ts
import { DescriptionList, DescriptionItem } from '../../ui/DescriptionList/DescriptionList'
```

- [ ] **Step 7: Clean up `EventDetail.module.css`**

Remove the `.dl`, `.dlFull`, `.dlItem`, `.dt`, `.dd` rules (they now live in `DescriptionList.module.css`). Keep `.article`, `.backLink`, `.card`, `.gameIdBadge`, `.title`, `.section`, `.sectionHeading`.

- [ ] **Step 8: Run EventDetail tests**

```bash
npm test -- --run src/components/EventDetail/EventDetail.test.tsx
```

Expected: all tests pass (the tests use `screen.getByRole('term')` and `screen.getByRole('definition')`, and the DescriptionItem still renders `<dt>`/`<dd>`).

- [ ] **Step 9: Commit**

```bash
git add src/ui/DescriptionList/DescriptionList.tsx src/ui/DescriptionList/DescriptionList.module.css \
  src/ui/DescriptionList/DescriptionList.test.tsx \
  src/components/EventDetail/EventDetail.tsx src/components/EventDetail/EventDetail.module.css
git commit -m "feat(DescriptionList): extract primitive; refactor EventDetail (DS-15)"
```

---

## Task 16 — DS-14: Refactor `getActiveFilters` to a registry approach

`getActiveFilters.ts` has ~150 lines of `if (params.X) { add(...) }` repetition. Every filter rule is one of four patterns: plain text, range, date-range, or multi-value. Extract a registry table.

**Files:**
- Modify: `src/ui/ActiveFilters/getActiveFilters.ts`

- [ ] **Step 1: Run existing tests to establish baseline**

```bash
npm test -- --run src/ui/ActiveFilters/getActiveFilters.test.ts
```

Expected: all tests pass. Note the test count; the refactor must not change behavior.

- [ ] **Step 2: Replace the implementation**

The helper functions (`parseRange`, `fmtDate`, `fmtRange`, `fmtDateRange`, `fmtCostRange`) stay. Replace the body of `getActiveFilters` with a registry-driven approach:

```ts
import { AGE_GROUPS, CATEGORY, EVENT_TYPES, EXP, REGISTRATION } from '../../utils/enums'
import type { SearchParams } from '../../utils/types'

export interface ActiveFilter {
  id: string
  label: string
  remove: (prev: SearchParams) => SearchParams
}

const DAY_LABELS: Record<string, string> = {
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
}

function parseRange(val: string): { min: string; max: string } | null {
  const m = val.match(/^\[([^,]*),([^\]]*)\]$/)
  if (!m) return null
  return { min: m[1], max: m[2] }
}

function fmtDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtRange(val: string, prefix: string, suffix = ''): string {
  const r = parseRange(val)
  if (!r) return `${prefix}${val}`
  return `${prefix}${r.min}–${r.max}${suffix ? ` ${suffix}` : ''}`
}

function fmtDateRange(val: string, prefix: string): string {
  const r = parseRange(val)
  if (!r) return `${prefix}${val}`
  return `${prefix}${fmtDate(r.min)}–${fmtDate(r.max)}`
}

function fmtCostRange(val: string): string {
  const r = parseRange(val)
  if (!r) return `Cost: ${val}`
  const min = r.min ? `$${r.min}` : ''
  const max = r.max ? `$${r.max}` : ''
  const dash = min || max ? '–' : ''
  return `Cost: ${min}${dash}${max}`
}

type FilterRule =
  | { type: 'plain'; key: keyof SearchParams; label: (v: string) => string }
  | { type: 'range'; key: keyof SearchParams; label: (v: string) => string }
  | { type: 'dateRange'; key: keyof SearchParams; label: (v: string) => string }
  | { type: 'multi'; key: keyof SearchParams; itemLabel: (code: string) => string; dayLabels?: Record<string, string> }

const RULES: FilterRule[] = [
  { type: 'plain', key: 'filter', label: (v) => `Search: ${v}` },
  { type: 'plain', key: 'gameId', label: (v) => `Game ID: ${v}` },
  { type: 'plain', key: 'title', label: (v) => `Title: ${v}` },
  { type: 'multi', key: 'eventType', itemLabel: (code) => EVENT_TYPES[code] ?? code },
  { type: 'plain', key: 'group', label: (v) => `Group: ${v}` },
  { type: 'plain', key: 'shortDescription', label: (v) => `Short desc: ${v}` },
  { type: 'plain', key: 'longDescription', label: (v) => `Long desc: ${v}` },
  { type: 'plain', key: 'gameSystem', label: (v) => `System: ${v}` },
  { type: 'plain', key: 'rulesEdition', label: (v) => `Rules: ${v}` },
  { type: 'plain', key: 'ageRequired', label: (v) => `Age: ${AGE_GROUPS[v] ?? v}` },
  { type: 'plain', key: 'experienceRequired', label: (v) => `Exp: ${EXP[v] ?? v}` },
  { type: 'plain', key: 'materialsProvided', label: (v) => `Materials provided: ${v}` },
  { type: 'plain', key: 'materialsRequired', label: (v) => `Materials required: ${v}` },
  { type: 'plain', key: 'materialsRequiredDetails', label: (v) => `Materials details: ${v}` },
  { type: 'multi', key: 'days', itemLabel: (code) => DAY_LABELS[code] ?? code },
  { type: 'dateRange', key: 'startDateTime', label: (v) => fmtDateRange(v, 'Start: ') },
  { type: 'range', key: 'duration', label: (v) => fmtRange(v, 'Duration: ', 'hrs') },
  { type: 'dateRange', key: 'endDateTime', label: (v) => fmtDateRange(v, 'End: ') },
  { type: 'range', key: 'minPlayers', label: (v) => fmtRange(v, 'Min players: ') },
  { type: 'range', key: 'maxPlayers', label: (v) => fmtRange(v, 'Max players: ') },
  { type: 'plain', key: 'gmNames', label: (v) => `GM: ${v}` },
  { type: 'plain', key: 'website', label: (v) => `Website: ${v}` },
  { type: 'plain', key: 'email', label: (v) => `Email: ${v}` },
  { type: 'plain', key: 'tournament', label: (v) => `Tournament: ${v}` },
  { type: 'range', key: 'roundNumber', label: (v) => fmtRange(v, 'Round: ') },
  { type: 'range', key: 'totalRounds', label: (v) => fmtRange(v, 'Total rounds: ') },
  { type: 'range', key: 'minimumPlayTime', label: (v) => fmtRange(v, 'Min play time: ') },
  { type: 'plain', key: 'attendeeRegistration', label: (v) => `Registration: ${REGISTRATION[v] ?? v}` },
  { type: 'plain', key: 'cost', label: (v) => fmtCostRange(v) },
  { type: 'plain', key: 'location', label: (v) => `Location: ${v}` },
  { type: 'plain', key: 'roomName', label: (v) => `Room: ${v}` },
  { type: 'plain', key: 'tableNumber', label: (v) => `Table: ${v}` },
  { type: 'plain', key: 'specialCategory', label: (v) => `Category: ${CATEGORY[v] ?? v}` },
  { type: 'range', key: 'ticketsAvailable', label: (v) => fmtRange(v, 'Tickets: ') },
  { type: 'dateRange', key: 'lastModified', label: (v) => fmtDateRange(v, 'Modified: ') },
]

export function getActiveFilters(params: SearchParams): ActiveFilter[] {
  const filters: ActiveFilter[] = []

  for (const rule of RULES) {
    const val = params[rule.key]
    if (!val) continue

    if (rule.type === 'multi') {
      for (const code of String(val).split(',').filter(Boolean)) {
        const label = rule.itemLabel(code)
        filters.push({
          id: `${rule.key}:${code}`,
          label,
          remove: (prev) => {
            const remaining = (String(prev[rule.key] ?? ''))
              .split(',')
              .filter((c) => c !== code)
              .join(',')
            if (!remaining) {
              const { [rule.key]: _removed, ...rest } = prev
              return rest
            }
            return { ...prev, [rule.key]: remaining }
          },
        })
      }
    } else {
      const labelStr = rule.label(String(val))
      filters.push({
        id: rule.key,
        label: labelStr,
        remove: (prev) => {
          const { [rule.key]: _removed, ...rest } = prev
          return rest
        },
      })
    }
  }

  return filters
}
```

- [ ] **Step 3: Run tests**

```bash
npm test -- --run src/ui/ActiveFilters/getActiveFilters.test.ts
```

Expected: same count, all pass. If any test fails, the registry entry for that field is wrong — compare the label function output with the old implementation.

- [ ] **Step 4: Commit**

```bash
git add src/ui/ActiveFilters/getActiveFilters.ts
git commit -m "refactor(getActiveFilters): replace 150-line if-chain with registry table (DS-14)"
```

---

## Task 17 — DS-12: Fix `SearchForm` key-remount on URL change

`routes/index.tsx:102` has `key={JSON.stringify(search)}`. This fully unmounts and remounts `SearchForm` on every sort click, page change, or browser back — destroying focus, scroll position, and React state inside the form. Fix by using react-hook-form's `values` prop (syncs form to current URL state automatically).

**Files:**
- Modify: `src/routes/index.tsx`, `src/components/SearchForm/SearchForm.tsx`

- [ ] **Step 1: Update `SearchForm` interface from `defaultValues` to `values`**

```tsx
// src/components/SearchForm/SearchForm.tsx — change the interface and useForm call

interface SearchFormProps {
  values: SearchFormValues   // was: defaultValues
  onSearch: (values: SearchFormValues) => void
}

export function SearchForm({ values, onSearch }: SearchFormProps): JSX.Element {
  const { register, handleSubmit, reset, watch, setValue } = useForm<SearchFormValues>({
    values,  // was: defaultValues
  })
  // ... rest unchanged
```

- [ ] **Step 2: Update `routes/index.tsx`**

Remove the `key` prop; change `defaultValues` to `values`:

```tsx
// Before:
<SearchForm
  key={JSON.stringify(search)}
  defaultValues={parseSearchParams(search)}
  onSearch={handleSearch}
/>

// After:
<SearchForm
  values={parseSearchParams(search)}
  onSearch={handleSearch}
/>
```

- [ ] **Step 3: Run SearchForm tests**

```bash
npm test -- --run src/components/SearchForm/SearchForm.test.tsx src/routes/index.test.tsx
```

Expected: all tests pass. Any test that relied on the remount behavior (checking that the form resets on navigation) may need minor updates to reflect that the form now syncs rather than remounts.

- [ ] **Step 4: Commit**

```bash
git add src/components/SearchForm/SearchForm.tsx src/routes/index.tsx
git commit -m "fix(SearchForm): replace key-remount with react-hook-form values sync (DS-12)"
```

---

## Task 18 — DS-6: Create `Field` and `RangeField` primitives; wire SearchForm inputs

Create `Field` (wraps Base UI `Field.Root` + `Field.Label` + `Field.Control` for a single input) and `RangeField` (wraps two `Field` elements with a shared label). Route all `SearchForm` text and number inputs through them.

> **Note:** This task does NOT affect the four `<select>` inputs migrated in Task 14, nor `EventTypeSelect`. Those already have correct label associations.

**Files:**
- Create: `src/ui/Field/Field.tsx`, `src/ui/Field/Field.module.css`, `src/ui/Field/Field.test.tsx`
- Modify: `src/components/SearchForm/SearchForm.tsx`

- [ ] **Step 1: Write tests for `Field`**

Create `src/ui/Field/Field.test.tsx`:

```tsx
import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Field, RangeField } from './Field'

test('Field wires label to input via id', () => {
  render(
    <Field label="Game ID">
      <input type="text" />
    </Field>,
  )
  const input = screen.getByRole('textbox')
  const label = screen.getByText('Game ID')
  expect(label.tagName).toBe('LABEL')
  expect(label).toHaveAttribute('for', input.id)
  expect(input.id).not.toBe('')
})

test('RangeField renders two inputs and a group label', () => {
  render(
    <RangeField label="Duration (hours)">
      <input type="number" aria-label="from" />
      <input type="number" aria-label="to" />
    </RangeField>,
  )
  expect(screen.getByText('Duration (hours)')).toBeInTheDocument()
  expect(screen.getAllByRole('spinbutton')).toHaveLength(2)
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --run src/ui/Field/Field.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `Field.module.css`**

```css
.root {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  opacity: 0.8;
}

.rangeRoot {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.rangeLabel {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  opacity: 0.8;
}

.rangeFields {
  display: flex;
  gap: var(--space-2);
  align-items: flex-end;
}

.rangeFieldLabel {
  font-size: 0.75rem;
  opacity: 0.7;
}
```

- [ ] **Step 4: Create `Field.tsx`**

```tsx
import React from 'react'
import { Field as BaseField } from '@base-ui/react/field'
import styles from './Field.module.css'

interface FieldProps {
  label: string
  children: React.ReactElement
  className?: string
}

export function Field({ label, children, className }: FieldProps): JSX.Element {
  return (
    <BaseField.Root className={[styles.root, className].filter(Boolean).join(' ')}>
      <BaseField.Label className={styles.label}>{label}</BaseField.Label>
      <BaseField.Control render={children} />
    </BaseField.Root>
  )
}

interface RangeFieldProps {
  label: string
  children: [React.ReactElement, React.ReactElement]
  className?: string
}

export function RangeField({ label, children, className }: RangeFieldProps): JSX.Element {
  const [fromInput, toInput] = children
  return (
    <div className={[styles.rangeRoot, className].filter(Boolean).join(' ')}>
      <span className={styles.rangeLabel}>{label}</span>
      <div className={styles.rangeFields}>
        <BaseField.Root>
          <BaseField.Label className={styles.rangeFieldLabel}>from</BaseField.Label>
          <BaseField.Control render={fromInput} />
        </BaseField.Root>
        <BaseField.Root>
          <BaseField.Label className={styles.rangeFieldLabel}>to</BaseField.Label>
          <BaseField.Control render={toInput} />
        </BaseField.Root>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run tests**

```bash
npm test -- --run src/ui/Field/Field.test.tsx
```

Expected: all tests pass.

- [ ] **Step 6: Update `SearchForm.tsx` — simple text/number fields**

Add import: `import { Field, RangeField } from '../../ui/Field/Field'`

Replace each `<label className={styles.label}>` + `<input>` pair with `<Field>`. Example:

```tsx
// Before:
<label className={styles.label}>
  Search
  <input type="text" className={styles.input} {...register('filter')} />
</label>

// After:
<Field label="Search">
  <input type="text" className={styles.input} {...register('filter')} />
</Field>
```

Apply to all simple `<label>/<input>` pairs:
- filter, gameId, title, group, shortDescription, longDescription, gameSystem, rulesEdition
- materialsProvided, materialsRequired, materialsRequiredDetails
- location, roomName, tableNumber
- gmNames, website, email, tournament

- [ ] **Step 7: Update `SearchForm.tsx` — range fields**

Replace each `<div className={styles.rangeGroup}>` block with `<RangeField>`. Example:

```tsx
// Before:
<div className={styles.rangeGroup}>
  Duration (hours):
  <label className={styles.label}>
    from
    <input type="number" min="0" step="0.5" className={styles.input} {...register('durationMin')} />
  </label>
  <label className={styles.label}>
    to
    <input type="number" min="0" step="0.5" className={styles.input} {...register('durationMax')} />
  </label>
</div>

// After:
<RangeField label="Duration (hours)">
  <input type="number" min="0" step="0.5" className={styles.input} {...register('durationMin')} />
  <input type="number" min="0" step="0.5" className={styles.input} {...register('durationMax')} />
</RangeField>
```

Apply to all range groups:
- minPlayers (min/max), maxPlayers (min/max), cost (min/max), ticketsAvailable (min/max)
- roundNumber (min/max), totalRounds (min/max), minimumPlayTime (min/max)
- startDateTime (start/end), endDateTime (start/end), lastModified (start/end)

Keep the `disabled` prop on date range inputs as-is (pass through `...register()` or add directly to the `<input>`).

Remove unused `.label`, `.rangeGroup` CSS classes from `SearchForm.module.css` after migration.

- [ ] **Step 8: Run tests**

```bash
npm test -- --run src/components/SearchForm/SearchForm.test.tsx
```

Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/ui/Field/Field.tsx src/ui/Field/Field.module.css src/ui/Field/Field.test.tsx \
  src/components/SearchForm/SearchForm.tsx src/components/SearchForm/SearchForm.module.css
git commit -m "feat(Field): create Field/RangeField primitives; wire all SearchForm inputs (DS-6)"
```

---

## Task 19 — DS-19: Route-level data fetching for `/event/$id`

Currently `EventDetail` fetches in the component body via `useQuery`. Start the fetch during route resolution so it's in-flight before the component even mounts, cutting TTI.

**Approach:** Export the `QueryClient` singleton to a module so route loaders can call `queryClient.ensureQueryData()`. The component-level `useQuery` remains (for stale-while-revalidate); the loader just primes the cache.

**Files:**
- Create: `src/lib/queryClient.ts`
- Modify: `src/main.tsx`, `src/routes/event.$id.tsx`, `src/routes/event.$id.test.tsx`

- [ ] **Step 1: Create `src/lib/queryClient.ts`**

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient()
```

- [ ] **Step 2: Update `main.tsx` to import from the singleton**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { routeTree } from './routeTree.gen'
import './index.css'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}
createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
```

- [ ] **Step 3: Add a loader to `routes/event.$id.tsx`**

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { fetchEvents } from '../utils/api'
import { queryClient } from '../lib/queryClient'
import { EventDetail } from '../components/EventDetail/EventDetail'

export const Route = createFileRoute('/event/$id')({
  loader: async ({ params }) => {
    await queryClient.ensureQueryData({
      queryKey: ['event', params.id],
      queryFn: () => fetchEvents({ gameId: params.id, limit: 1 }),
    })
  },
  component: EventDetailPage,
})

function EventDetailPage(): JSX.Element {
  const { id } = Route.useParams()
  return (
    <main>
      <EventDetail gameId={id} />
    </main>
  )
}
```

- [ ] **Step 4: Update `event.$id.test.tsx` to use the exported queryClient**

The tests create their own `QueryClient` instances, which is correct for isolation. However, `renderEventDetailPage` calls `router.load()` which will trigger the loader. The loader calls `queryClient.ensureQueryData()` on the **singleton** (imported in the route file), not the per-test client. This means the test's MSW handler must be installed before `router.load()`.

Ensure the test's `server.use(...)` calls happen before `await router.load()`. The existing tests do `server.use(...)` before `renderEventDetailPage()`, which calls `router.load()` internally. This should work correctly.

Add one test that verifies pre-fetching happens during navigation:

```ts
test('loader pre-fetches event data so the component renders without loading state', async () => {
  server.use(
    http.get('/api/events/search', ({ request }) => {
      const url = new URL(request.url)
      const gameId = url.searchParams.get('gameId') ?? ''
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId, title: 'Pre-fetched Event' })],
        meta: { total: 1 },
        links: { self: '' },
        error: null,
      }
      return HttpResponse.json(response)
    }),
  )
  await renderEventDetailPage('RPG24000001')
  // If the cache was primed by the loader, the title should be present
  // without needing to wait for the loading spinner to disappear
  expect(screen.queryByText('LOADING QUEST...')).not.toBeInTheDocument()
  expect(screen.getByText('Pre-fetched Event')).toBeInTheDocument()
})
```

Note: this test may be flaky depending on timing. If it is, use `await screen.findByText(...)` instead of a synchronous check.

- [ ] **Step 5: Run tests**

```bash
npm test -- --run src/routes/event.\$id.test.tsx
```

Expected: all tests pass.

- [ ] **Step 6: Run full test suite**

```bash
npm test -- --run
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/queryClient.ts src/main.tsx src/routes/event.\$id.tsx src/routes/event.\$id.test.tsx
git commit -m "feat: add route-level data fetching for /event/\$id via loader (DS-19)"
```

---

## Self-Review

### Spec coverage

| Issue | Task | Covered? |
|-------|------|----------|
| DS-2 double h1 | Task 2 | ✓ |
| DS-3 sort button aria-label | Task 3 | ✓ |
| DS-4 hardcoded EventTypeSelect id | Task 4 | ✓ |
| DS-5 missing dlItem | Task 1 | ✓ |
| DS-6 Field/RangeField | Task 18 | ✓ |
| DS-7 Select primitive | Task 14 | ✓ |
| DS-8 details CSS duplication | Task 11 | ✓ |
| DS-9 Button ghost/icon | Task 13 | ✓ |
| DS-10 clsx standardization | Task 6 | ✓ |
| DS-11 pagination constants | Task 9 | ✓ |
| DS-12 SearchForm key remount | Task 17 | ✓ |
| DS-14 getActiveFilters registry | Task 16 | ✓ |
| DS-15 DescriptionList | Task 15 | ✓ |
| DS-17 useStoredState | Task 12 | ✓ |
| DS-18 pagination nav labels | Task 8 | ✓ |
| DS-19 route data fetching | Task 19 | ✓ |
| DS-20 duplicate toggletip | Task 7 | ✓ |
| DS-21 sr-only escape hatch | Task 5 | ✓ |
| DS-22 storyMatrix inline styles | Task 10 | ✓ |

### Dependency order

The following tasks must be completed in order before others can start:
- Task 6 (clsx + Button variant declarations) → Task 13 (Button ghost/icon CSS rules and migration)
- Task 12 (useStoredState) → Tasks for useColumnVisibility/Sizing/SidebarOpen within Task 12
- Task 17 (DS-12 form values) should come after Task 18 (DS-6 Field) since Task 18 modifies SearchForm.tsx heavily

All other tasks are independent and can be done in any order within those constraints.

### Type consistency check

- `useStoredState<T>` returns `[T, (next: T | ((prev: T) => T)) => void]` — used consistently in Task 12
- `DescriptionItem` `span` prop is `'full' | undefined` and `data-span={span}` — consistent in test and implementation
- `Select` `onValueChange: (value: string) => void` — consistent in definition and all call sites
- `Field` `children: React.ReactElement` (single element) vs `RangeField` `children: [React.ReactElement, React.ReactElement]` (tuple) — consistent
