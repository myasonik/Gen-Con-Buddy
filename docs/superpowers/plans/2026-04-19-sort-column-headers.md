# Sort via Column Heading Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three-state sortable column headers to the search results table, with `aria-sort` accessibility and screen reader announcements via `announce()`.

**Architecture:** `sort` flows as a plain string (`"field.asc"` / `"field.desc"`) through `SearchParams` → URL → `validateSearch` → `fetchEvents` → API with no transformation. `SearchResults` renders sortable `<th>` buttons, calls an `onSort` callback on click, and announces changes. `handleSort` in `index.tsx` navigates with the new sort value and always resets `page` to 1.

**Tech Stack:** React, TanStack Router, TanStack Query, MSW (tests), Vitest, Testing Library

---

## File Map

| File | Change |
|------|--------|
| `src/utils/types.ts` | Add `sort?: string` to `SearchParams` |
| `src/utils/api.ts` | No change — `sort` passes through the existing `Object.entries` loop automatically |
| `src/routes/index.tsx` | Add `sort` to `validateSearch`; add `handleSort`; pass `onSort` to `SearchResults` |
| `src/components/SearchResults/SearchResults.tsx` | Add `sortField` to `COLUMNS`; add `onSort` prop; render sortable `<th>` buttons with `aria-sort`; call `announce()` |
| `src/routes/index.test.tsx` | Add: sort URL param test, sort resets page test |
| `src/components/SearchResults/SearchResults.test.tsx` | Add: sort cycle tests, `aria-sort` tests, `announce` tests; update `renderSearchResults` helper |

---

### Task 1: Add `sort` to `SearchParams`, route validation, and `handleSort`

**Files:**
- Modify: `src/utils/types.ts`
- Modify: `src/routes/index.tsx`
- Test: `src/routes/index.test.tsx`

- [ ] **Step 1: Write the failing route test — sort param is read from URL**

In `src/routes/index.test.tsx`, add after the existing tests:

```tsx
test('sort param is read from URL without crashing', async () => {
  await renderSearchPage('/?sort=startDateTime.asc')
  expect(screen.getByRole('main')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy && npx vitest run src/routes/index.test.tsx
```

Expected: fails with "sort" not recognized by `validateSearch` (TanStack Router strips unknown params).

- [ ] **Step 3: Add `sort` to `SearchParams` in `src/utils/types.ts`**

In the `SearchParams` interface, add after `days?: string`:

```ts
sort?: string
```

- [ ] **Step 4: Add `sort` to `validateSearch` and add `handleSort` in `src/routes/index.tsx`**

In `validateSearch`, add after `days: str('days')`:

```ts
sort: str('sort'),
```

After `handleNavigate`, add:

```tsx
const handleSort = (sort: string | undefined) => {
  void navigate({
    search: (prev) => ({
      ...prev,
      sort,
      page: undefined,
    }),
  })
}
```

Update the `<SearchResults>` render to pass `onSort` (the prop doesn't exist yet but TypeScript will error in Task 2 — add it now to avoid two-pass editing):

```tsx
<SearchResults searchParams={search} onNavigate={handleNavigate} onSort={handleSort} />
```

- [ ] **Step 5: Run the route tests to verify the first test passes**

```bash
npx vitest run src/routes/index.test.tsx
```

Expected: "sort param is read from URL without crashing" passes. All previous tests still pass. TypeScript may warn about `onSort` prop not existing on `SearchResults` — that resolves in Task 2.

- [ ] **Step 6: Commit**

```bash
git add src/utils/types.ts src/routes/index.tsx src/routes/index.test.tsx
git commit -m "feat: add sort to SearchParams, validateSearch, and handleSort"
```

---

### Task 2: Render sortable column headers with `aria-sort`

**Files:**
- Modify: `src/components/SearchResults/SearchResults.tsx`
- Test: `src/components/SearchResults/SearchResults.test.tsx`

- [ ] **Step 1: Update the `renderSearchResults` helper to accept `onSort`**

In `src/components/SearchResults/SearchResults.test.tsx`, update the helper:

```tsx
function renderSearchResults(
  searchParams: SearchParams = {},
  onNavigate = vi.fn(),
  onSort = vi.fn(),
) {
  const rootRoute = createRootRoute({
    component: () => (
      <SearchResults searchParams={searchParams} onNavigate={onNavigate} onSort={onSort} />
    ),
  })
  const eventRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/event/$id',
    component: () => null,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([eventRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}
```

- [ ] **Step 2: Write the failing sort tests**

Add to `src/components/SearchResults/SearchResults.test.tsx`:

```tsx
test('sends sort param to API when provided in searchParams', async () => {
  let capturedUrl: URL | null = null
  server.use(
    http.get('/api/events/search', ({ request }) => {
      capturedUrl = new URL(request.url)
      const response: EventSearchResponse = {
        data: [makeEvent()],
        meta: { total: 1 },
        links: { self: '' },
        error: null,
      }
      return HttpResponse.json(response)
    }),
  )
  renderSearchResults({ sort: 'startDateTime.asc' })
  await screen.findAllByRole('row')
  expect(capturedUrl!.searchParams.get('sort')).toBe('startDateTime.asc')
})

test('omits sort param from API when not in searchParams', async () => {
  let capturedUrl: URL | null = null
  server.use(
    http.get('/api/events/search', ({ request }) => {
      capturedUrl = new URL(request.url)
      const response: EventSearchResponse = {
        data: [makeEvent()],
        meta: { total: 1 },
        links: { self: '' },
        error: null,
      }
      return HttpResponse.json(response)
    }),
  )
  renderSearchResults({})
  await screen.findAllByRole('row')
  expect(capturedUrl!.searchParams.has('sort')).toBe(false)
})

test('unsorted sortable column has aria-sort="none"', async () => {
  renderSearchResults({})
  const th = await screen.findByRole('columnheader', { name: 'Title' })
  expect(th).toHaveAttribute('aria-sort', 'none')
})

test('active ascending column has aria-sort="ascending"', async () => {
  renderSearchResults({ sort: 'title.asc' })
  const th = await screen.findByRole('columnheader', { name: 'Title' })
  expect(th).toHaveAttribute('aria-sort', 'ascending')
})

test('active descending column has aria-sort="descending"', async () => {
  renderSearchResults({ sort: 'title.desc' })
  const th = await screen.findByRole('columnheader', { name: 'Title' })
  expect(th).toHaveAttribute('aria-sort', 'descending')
})

test('clicking unsorted column calls onSort with field.asc', async () => {
  const user = userEvent.setup()
  const onSort = vi.fn()
  renderSearchResults({}, vi.fn(), onSort)
  await screen.findAllByRole('row')
  await user.click(screen.getByRole('button', { name: 'Sort by Title' }))
  expect(onSort).toHaveBeenCalledWith('title.asc')
})

test('clicking ascending column calls onSort with field.desc', async () => {
  const user = userEvent.setup()
  const onSort = vi.fn()
  renderSearchResults({ sort: 'title.asc' }, vi.fn(), onSort)
  await screen.findAllByRole('row')
  await user.click(screen.getByRole('button', { name: 'Sort by Title' }))
  expect(onSort).toHaveBeenCalledWith('title.desc')
})

test('clicking descending column calls onSort with undefined (clears sort)', async () => {
  const user = userEvent.setup()
  const onSort = vi.fn()
  renderSearchResults({ sort: 'title.desc' }, vi.fn(), onSort)
  await screen.findAllByRole('row')
  await user.click(screen.getByRole('button', { name: 'Sort by Title' }))
  expect(onSort).toHaveBeenCalledWith(undefined)
})

test('day column has aria-sort="ascending" when sorted by startDateTime ascending', async () => {
  renderSearchResults({ sort: 'startDateTime.asc' })
  const th = await screen.findByRole('columnheader', { name: 'Day' })
  expect(th).toHaveAttribute('aria-sort', 'ascending')
})
```

- [ ] **Step 3: Run to verify they fail**

```bash
npx vitest run src/components/SearchResults/SearchResults.test.tsx
```

Expected: the new tests fail — `onSort` prop doesn't exist on `SearchResults`, no sort buttons rendered.

- [ ] **Step 4: Replace `COLUMNS` in `SearchResults.tsx` with `sortField` entries**

Replace the `COLUMNS` const entirely:

```tsx
const COLUMNS = [
  { key: 'gameId', label: 'Game ID', sortField: 'gameId' },
  { key: 'title', label: 'Title', sortField: 'title' },
  { key: 'eventType', label: 'Type', sortField: 'eventType' },
  { key: 'group', label: 'Group', sortField: 'group' },
  { key: 'shortDescription', label: 'Short Description', sortField: 'shortDescription' },
  { key: 'longDescription', label: 'Long Description', sortField: 'longDescription' },
  { key: 'gameSystem', label: 'Game System', sortField: 'gameSystem' },
  { key: 'rulesEdition', label: 'Rules Edition', sortField: 'rulesEdition' },
  { key: 'minPlayers', label: 'Min Players', sortField: 'minPlayers' },
  { key: 'maxPlayers', label: 'Max Players', sortField: 'maxPlayers' },
  { key: 'ageRequired', label: 'Age Required', sortField: 'ageRequired' },
  { key: 'experienceRequired', label: 'Experience Required', sortField: 'experienceRequired' },
  { key: 'materialsProvided', label: 'Materials Provided', sortField: 'materialsProvided' },
  { key: 'materialsRequired', label: 'Materials Required', sortField: 'materialsRequired' },
  { key: 'materialsRequiredDetails', label: 'Materials Required Details', sortField: 'materialsRequiredDetails' },
  { key: 'day', label: 'Day', sortField: 'startDateTime' },
  { key: 'startDateTime', label: 'Start', sortField: 'startDateTime' },
  { key: 'duration', label: 'Duration', sortField: 'duration' },
  { key: 'endDateTime', label: 'End', sortField: 'endDateTime' },
  { key: 'gmNames', label: 'GMs', sortField: 'gmNames' },
  { key: 'website', label: 'Website', sortField: 'website' },
  { key: 'email', label: 'Email', sortField: 'email' },
  { key: 'tournament', label: 'Tournament', sortField: 'tournament' },
  { key: 'roundNumber', label: 'Round Number', sortField: 'roundNumber' },
  { key: 'totalRounds', label: 'Total Rounds', sortField: 'totalRounds' },
  { key: 'minimumPlayTime', label: 'Min Time', sortField: 'minimumPlayTime' },
  { key: 'attendeeRegistration', label: 'Attendee Registration', sortField: 'attendeeRegistration' },
  { key: 'cost', label: 'Cost', sortField: 'cost' },
  { key: 'location', label: 'Location', sortField: 'location' },
  { key: 'roomName', label: 'Room', sortField: 'roomName' },
  { key: 'tableNumber', label: 'Table Number', sortField: 'tableNumber' },
  { key: 'specialCategory', label: 'Special Category', sortField: 'specialCategory' },
  { key: 'ticketsAvailable', label: 'Tickets Available', sortField: 'ticketsAvailable' },
  { key: 'lastModified', label: 'Last Modified', sortField: 'lastModified' },
] as const
```

- [ ] **Step 5: Update `SearchResultsProps` and add sort state derivation**

Replace the `SearchResultsProps` interface:

```tsx
interface SearchResultsProps {
  searchParams: SearchParams
  onNavigate: (page: number, limit: number) => void
  onSort: (sort: string | undefined) => void
}
```

At the top of the `SearchResults` function body, after the existing hook calls, add:

```tsx
const [activeSortField, activeSortDir] = searchParams.sort
  ? searchParams.sort.split('.')
  : [undefined, undefined]

const handleSortClick = (sortField: string, label: string) => {
  if (activeSortField !== sortField) {
    onSort(`${sortField}.asc`)
  } else if (activeSortDir === 'asc') {
    onSort(`${sortField}.desc`)
  } else {
    onSort(undefined)
  }
}
```

Update the function signature to destructure `onSort`:

```tsx
export function SearchResults({ searchParams, onNavigate, onSort }: SearchResultsProps) {
```

- [ ] **Step 6: Replace the `<th>` rendering in the table head**

Replace:

```tsx
{visibleColumns.map((col) => (
  <th key={col.key}>{col.label}</th>
))}
```

With:

```tsx
{visibleColumns.map((col) => {
  const isActive = activeSortField === col.sortField
  const ariaSort = isActive
    ? activeSortDir === 'asc'
      ? ('ascending' as const)
      : ('descending' as const)
    : ('none' as const)
  return (
    <th key={col.key} aria-sort={ariaSort} scope="col" aria-label={col.label}>
      <button
        type="button"
        aria-label={`Sort by ${col.label}`}
        onClick={() => handleSortClick(col.sortField, col.label)}
      >
        {col.label}
        {isActive && (
          <span aria-hidden="true">
            {activeSortDir === 'asc' ? ' ▲' : ' ▼'}
          </span>
        )}
      </button>
    </th>
  )
})}
```

- [ ] **Step 7: Run the tests to verify they pass**

```bash
npx vitest run src/components/SearchResults/SearchResults.test.tsx
```

Expected: all tests pass. If TypeScript complains about `ColumnKey` type (since `sortField` is now part of the `as const` entries), verify that `type ColumnKey = (typeof COLUMNS)[number]['key']` still compiles — it should since `key` is still the unique identifier property.

- [ ] **Step 8: Commit**

```bash
git add src/components/SearchResults/SearchResults.tsx src/components/SearchResults/SearchResults.test.tsx
git commit -m "feat: render sortable column headers with three-state toggle and aria-sort"
```

---

### Task 3: Announce sort changes for screen readers

**Files:**
- Modify: `src/components/SearchResults/SearchResults.tsx`
- Test: `src/components/SearchResults/SearchResults.test.tsx`

- [ ] **Step 1: Write the failing announce tests**

Add these imports to `src/components/SearchResults/SearchResults.test.tsx` (after the existing imports):

```tsx
import * as announceModule from '../../lib/announce'
import { __reset } from '../../lib/announce'
```

Add a second `beforeEach` after the existing `localStorage.clear()` one:

```tsx
beforeEach(() => {
  __reset()
  vi.restoreAllMocks()
})
```

Add the tests:

```tsx
test('announces "Sorted by Title, ascending" when clicking unsorted column', async () => {
  const user = userEvent.setup()
  const spy = vi.spyOn(announceModule, 'announce')
  renderSearchResults({}, vi.fn(), vi.fn())
  await screen.findAllByRole('row')
  await user.click(screen.getByRole('button', { name: 'Sort by Title' }))
  expect(spy).toHaveBeenCalledWith('Sorted by Title, ascending')
})

test('announces "Sorted by Title, descending" when clicking ascending column', async () => {
  const user = userEvent.setup()
  const spy = vi.spyOn(announceModule, 'announce')
  renderSearchResults({ sort: 'title.asc' }, vi.fn(), vi.fn())
  await screen.findAllByRole('row')
  await user.click(screen.getByRole('button', { name: 'Sort by Title' }))
  expect(spy).toHaveBeenCalledWith('Sorted by Title, descending')
})

test('announces "Sort cleared" when clicking descending column', async () => {
  const user = userEvent.setup()
  const spy = vi.spyOn(announceModule, 'announce')
  renderSearchResults({ sort: 'title.desc' }, vi.fn(), vi.fn())
  await screen.findAllByRole('row')
  await user.click(screen.getByRole('button', { name: 'Sort by Title' }))
  expect(spy).toHaveBeenCalledWith('Sort cleared')
})
```

- [ ] **Step 2: Run to verify they fail**

```bash
npx vitest run src/components/SearchResults/SearchResults.test.tsx
```

Expected: the three announce tests fail — `announce` is not yet called.

- [ ] **Step 3: Add `announce` import and calls in `SearchResults.tsx`**

Add import at the top of `src/components/SearchResults/SearchResults.tsx`:

```tsx
import { announce } from '../../lib/announce'
```

Update `handleSortClick` to call `announce`:

```tsx
const handleSortClick = (sortField: string, label: string) => {
  if (activeSortField !== sortField) {
    onSort(`${sortField}.asc`)
    announce(`Sorted by ${label}, ascending`)
  } else if (activeSortDir === 'asc') {
    onSort(`${sortField}.desc`)
    announce(`Sorted by ${label}, descending`)
  } else {
    onSort(undefined)
    announce('Sort cleared')
  }
}
```

- [ ] **Step 4: Run to verify all tests pass**

```bash
npx vitest run src/components/SearchResults/SearchResults.test.tsx
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/SearchResults/SearchResults.tsx src/components/SearchResults/SearchResults.test.tsx
git commit -m "feat: announce sort state changes via announce() for screen readers"
```

---

### Task 4: Integration test — sort navigates and resets page

**Files:**
- Test: `src/routes/index.test.tsx`

The route already has `handleSort` wired (Task 1). Now that the sort button exists (Task 2), the integration test can be written and run.

- [ ] **Step 1: Write the failing integration test**

Add to `src/routes/index.test.tsx`:

```tsx
test('clicking a sort column header updates the URL with sort param and resets page', async () => {
  const user = userEvent.setup()
  let latestUrl: URL | null = null
  server.use(
    http.get('/api/events/search', ({ request }) => {
      latestUrl = new URL(request.url)
      const response: EventSearchResponse = {
        data: [makeEvent()],
        meta: { total: 200 },
        links: { self: '' },
        error: null,
      }
      return HttpResponse.json(response)
    }),
  )
  await renderSearchPage('/?page=3')
  await screen.findAllByRole('navigation', { name: 'Pagination' })
  latestUrl = null
  await user.click(screen.getByRole('button', { name: 'Sort by Start' }))
  await screen.findAllByRole('navigation', { name: 'Pagination' })
  expect(latestUrl!.searchParams.has('page')).toBe(false)
  expect(latestUrl!.searchParams.get('sort')).toBe('startDateTime.asc')
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run src/routes/index.test.tsx
```

Expected: fails — the button exists now but the route wiring may not be complete. If it passes, that's also fine — the wiring from Task 1 was already correct.

- [ ] **Step 3: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests pass. If any fail, fix before committing.

- [ ] **Step 4: Commit**

```bash
git add src/routes/index.test.tsx
git commit -m "test: integration test for sort navigation and page reset"
```
