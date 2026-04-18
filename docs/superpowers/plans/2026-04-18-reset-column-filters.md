# Reset Column Visibility to Defaults Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Reset to defaults" button to the column picker that immediately restores all column visibility to their hardcoded defaults.

**Architecture:** Add a `reset` function to `useColumnVisibility` that calls `setVisibility({ ...DEFAULTS })`; the existing `useEffect` persists it to localStorage automatically. Wire the button in `SearchResults` inside the existing `<fieldset>`.

**Tech Stack:** React, TypeScript, Vitest, @testing-library/react, @testing-library/user-event

---

## Files

- Modify: `src/hooks/useColumnVisibility.ts` — add `reset` to hook return value
- Modify: `src/components/SearchResults/SearchResults.tsx` — destructure `reset`, add button
- Modify: `src/hooks/useColumnVisibility.test.ts` — add `reset` unit test
- Modify: `src/components/SearchResults/SearchResults.test.tsx` — add reset button component test

---

### Task 1: Add `reset` to `useColumnVisibility`

**Files:**
- Modify: `src/hooks/useColumnVisibility.ts`
- Modify: `src/hooks/useColumnVisibility.test.ts`

- [ ] **Step 1: Write the failing test**

Open `src/hooks/useColumnVisibility.test.ts` and add at the end:

```ts
test('reset restores all columns to defaults after toggling', () => {
  const { result } = renderHook(() => useColumnVisibility())

  act(() => {
    result.current.toggle('title')      // title: true → false
    result.current.toggle('gameId')     // gameId: false → true
  })

  expect(result.current.visibility.title).toBe(false)
  expect(result.current.visibility.gameId).toBe(true)

  act(() => {
    result.current.reset()
  })

  expect(result.current.visibility.title).toBe(true)
  expect(result.current.visibility.gameId).toBe(false)
})
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
npx vitest run src/hooks/useColumnVisibility.test.ts
```

Expected: FAIL — `result.current.reset is not a function`

- [ ] **Step 3: Implement `reset` in the hook**

In `src/hooks/useColumnVisibility.ts`, add `reset` before the return statement and include it in the return value:

```ts
export function useColumnVisibility() {
  const [visibility, setVisibility] = useState<Record<string, boolean>>(readFromStorage)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, visibility }))
  }, [visibility])

  const toggle = (column: string) => {
    setVisibility((prev) => ({ ...prev, [column]: !prev[column] }))
  }

  const reset = () => {
    setVisibility({ ...DEFAULTS })
  }

  return { visibility, toggle, reset }
}
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
npx vitest run src/hooks/useColumnVisibility.test.ts
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useColumnVisibility.ts src/hooks/useColumnVisibility.test.ts
git commit -m "feat: add reset function to useColumnVisibility"
```

---

### Task 2: Wire reset button in `SearchResults`

**Files:**
- Modify: `src/components/SearchResults/SearchResults.tsx`
- Modify: `src/components/SearchResults/SearchResults.test.tsx`

- [ ] **Step 1: Write the failing test**

Open `src/components/SearchResults/SearchResults.test.tsx` and add at the end:

```tsx
test('reset button restores default column visibility', async () => {
  const user = userEvent.setup()
  renderSearchResults()
  await screen.findAllByRole('row')

  // gameId is hidden by default — toggle it on
  const checkbox = screen.getByRole('checkbox', { name: 'Game ID' })
  await user.click(checkbox)
  expect(screen.getByRole('columnheader', { name: 'Game ID' })).toBeInTheDocument()

  // click reset — gameId should disappear again
  await user.click(screen.getByRole('button', { name: 'Reset to defaults' }))
  expect(screen.queryByRole('columnheader', { name: 'Game ID' })).not.toBeInTheDocument()

  // title (default-visible) should still be present
  expect(screen.getByRole('columnheader', { name: 'Title' })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
npx vitest run src/components/SearchResults/SearchResults.test.tsx
```

Expected: FAIL — `Unable to find role="button" with name "Reset to defaults"`

- [ ] **Step 3: Add the button to `SearchResults`**

In `src/components/SearchResults/SearchResults.tsx`, destructure `reset` from the hook and add the button inside the `<fieldset>`:

```tsx
export function SearchResults({ searchParams }: SearchResultsProps) {
  const { visibility, toggle, reset } = useColumnVisibility()
  // ... rest unchanged ...

  return (
    <section>
      <details>
        <summary>Customize columns</summary>
        <fieldset>
          <ul>
            {COLUMNS.map((col) => (
              <li key={col.key}>
                <label>
                  <input
                    type="checkbox"
                    checked={!!visibility[col.key]}
                    onChange={() => toggle(col.key)}
                  />
                  {col.label}
                </label>
              </li>
            ))}
          </ul>
          <button type="button" onClick={reset}>Reset to defaults</button>
        </fieldset>
      </details>

      {isLoading && <p>Loading...</p>}
      {isError && <p>Error loading events.</p>}
      {data && data.data.length === 0 && <p>No events found.</p>}
      {data && data.data.length > 0 && (
        <table>
          <thead>
            <tr>
              {visibleColumns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.data.map((event) => (
              <tr key={event.id}>
                {visibleColumns.map((col) => (
                  <EventCell key={col.key} col={col.key} event={event} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
```

- [ ] **Step 4: Run all tests to confirm everything passes**

```bash
npx vitest run
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/SearchResults/SearchResults.tsx src/components/SearchResults/SearchResults.test.tsx
git commit -m "feat: add reset to defaults button to column picker"
```
