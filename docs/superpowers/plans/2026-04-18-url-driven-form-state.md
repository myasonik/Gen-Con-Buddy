# URL-Driven Form State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the search form always reflect the current URL search params, including after back/forward navigation.

**Architecture:** Add `key={JSON.stringify(search)}` to `<SearchForm>` in the index route. When the URL changes, React unmounts and remounts the form, which picks up fresh `defaultValues` from the already-correct `parseSearchParams(search)`. Two tests guard the fix: a `SearchForm` unit test verifying the key-based remount mechanism, and a `SearchPage` integration test verifying the full URL → form sync behavior.

**Tech Stack:** React, TanStack Router, react-hook-form, Vitest, React Testing Library, MSW

---

### Task 1: SearchForm unit test — key-based remount picks up new defaultValues

**Files:**
- Modify: `src/components/SearchForm/SearchForm.test.tsx`

This test verifies that `SearchForm` correctly initializes from `defaultValues` on each mount. It would catch regressions where `SearchForm` stops respecting `defaultValues`.

- [ ] **Step 1: Write the failing test**

Add to `src/components/SearchForm/SearchForm.test.tsx`:

```tsx
test('picks up new defaultValues when re-mounted with a new key', () => {
  const { rerender } = render(
    <SearchForm key="a" defaultValues={{ eventType: 'BGM' }} onSearch={noop} />
  )
  expect(screen.getByRole('combobox', { name: 'Event Type' })).toHaveValue('BGM')

  rerender(<SearchForm key="b" defaultValues={{ eventType: 'RPG' }} onSearch={noop} />)

  expect(screen.getByRole('combobox', { name: 'Event Type' })).toHaveValue('RPG')
})
```

- [ ] **Step 2: Run the test to confirm it passes (SearchForm already respects defaultValues — this is a regression guard)**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy && npx vitest run src/components/SearchForm/SearchForm.test.tsx
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/SearchForm/SearchForm.test.tsx
git commit -m "test: verify SearchForm picks up new defaultValues on key-based remount"
```

---

### Task 2: SearchPage integration test — URL change updates form

**Files:**
- Create: `src/routes/index.test.tsx`

This test catches the actual bug: rendering `SearchPage` with one URL, then navigating to a different URL, and asserting the form reflects the new params. It would have failed before the fix (because the form wouldn't update) and must pass after.

- [ ] **Step 1: Create the test file with a router helper**

Create `src/routes/index.test.tsx`:

```tsx
import { act, render, screen } from '@testing-library/react'
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
} from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from '../routeTree.gen'

function renderSearchPage(initialEntry = '/') {
  const history = createMemoryHistory({ initialEntries: [initialEntry] })
  const router = createRouter({ routeTree, history })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}
```

- [ ] **Step 2: Write the first test — URL params populate the form on load**

Add to `src/routes/index.test.tsx`:

```tsx
test('populates eventType dropdown from URL search param on load', () => {
  renderSearchPage('/?eventType=BGM')
  expect(screen.getByRole('combobox', { name: 'Event Type' })).toHaveValue('BGM')
})
```

- [ ] **Step 3: Run to confirm it passes (this works today via defaultValues on initial mount)**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy && npx vitest run src/routes/index.test.tsx
```

Expected: passes.

- [ ] **Step 4: Write the regression test — URL change updates the form**

Add to `src/routes/index.test.tsx`:

```tsx
test('updates form when URL search params change after initial render', async () => {
  const router = renderSearchPage('/?eventType=BGM')
  expect(screen.getByRole('combobox', { name: 'Event Type' })).toHaveValue('BGM')

  await act(async () => {
    await router.navigate({ to: '/', search: { eventType: 'RPG' } })
  })

  expect(screen.getByRole('combobox', { name: 'Event Type' })).toHaveValue('RPG')
})
```

- [ ] **Step 5: Run to confirm it FAILS (the bug is not yet fixed)**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy && npx vitest run src/routes/index.test.tsx
```

Expected: the second test fails — the combobox still shows `BGM` after navigation.

- [ ] **Step 6: Commit the failing test**

```bash
git add src/routes/index.test.tsx
git commit -m "test: add failing regression test for URL-driven form state"
```

---

### Task 3: Apply the fix and verify both tests pass

**Files:**
- Modify: `src/routes/index.tsx`

- [ ] **Step 1: Apply the one-line change**

In `src/routes/index.tsx`, change:

```tsx
<SearchForm defaultValues={parseSearchParams(search)} onSearch={handleSearch} />
```

to:

```tsx
<SearchForm key={JSON.stringify(search)} defaultValues={parseSearchParams(search)} onSearch={handleSearch} />
```

- [ ] **Step 2: Run all tests**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy && npx vitest run
```

Expected: all tests pass, including the previously-failing regression test.

- [ ] **Step 3: Commit**

```bash
git add src/routes/index.tsx
git commit -m "feat: remount SearchForm on URL change so form always reflects URL state"
```
