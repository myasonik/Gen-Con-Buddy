# Column Resizing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users drag-resize table columns in SearchResults, with widths persisted to localStorage and reset by the existing "Reset to defaults" button.

**Architecture:** A new `useColumnSizing` hook (mirroring `useColumnVisibility`) manages `ColumnSizingState` in localStorage. It is wired into `useReactTable` alongside the existing visibility state. Each resizable `<th>` renders a drag handle that calls TanStack's `header.getResizeHandler()`. The `dayStripe` column is excluded from resizing via `enableResizing: false`.

**Tech Stack:** TanStack React Table v8 (`columnResizeMode`, `ColumnSizingState`, `OnChangeFn`), React, CSS Modules, `@testing-library/react` `renderHook`.

---

## File Structure

| File                                                    | Action | Responsibility                                                        |
| ------------------------------------------------------- | ------ | --------------------------------------------------------------------- |
| `src/hooks/useColumnSizing.ts`                          | Create | Column sizing state + localStorage persistence                        |
| `src/hooks/useColumnSizing.test.ts`                     | Create | Unit tests for the hook                                               |
| `src/components/SearchResults/SearchResults.tsx`        | Modify | Wire sizing into `useReactTable`, render handles, update Reset button |
| `src/components/SearchResults/SearchResults.module.css` | Modify | Resize handle styles                                                  |
| `src/components/SearchResults/SearchResults.test.tsx`   | Modify | Integration tests for resize handle rendering and localStorage        |

---

### Task 1: `useColumnSizing` hook

**Files:**

- Create: `src/hooks/useColumnSizing.ts`
- Create: `src/hooks/useColumnSizing.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/hooks/useColumnSizing.test.ts`:

```ts
import { renderHook, act } from "@testing-library/react";
import { useColumnSizing } from "./useColumnSizing";

const STORAGE_KEY = "gcb-column-sizing";

beforeEach(() => {
  localStorage.clear();
});

test("returns empty sizing on first use", () => {
  const { result } = renderHook(() => useColumnSizing());
  expect(result.current.sizing).toEqual({});
});

test("setSizing with a value updates state", () => {
  const { result } = renderHook(() => useColumnSizing());

  act(() => {
    result.current.setSizing({ title: 300 });
  });

  expect(result.current.sizing).toEqual({ title: 300 });
});

test("setSizing with an updater function updates state", () => {
  const { result } = renderHook(() => useColumnSizing());

  act(() => {
    result.current.setSizing({ title: 200 });
  });
  act(() => {
    result.current.setSizing((prev) => ({ ...prev, gameId: 100 }));
  });

  expect(result.current.sizing).toEqual({ title: 200, gameId: 100 });
});

test("persists sizing to localStorage", () => {
  const { result } = renderHook(() => useColumnSizing());

  act(() => {
    result.current.setSizing({ title: 300 });
  });

  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
  expect(stored).toEqual({ version: 1, sizing: { title: 300 } });
});

test("loads sizing from localStorage on mount", () => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: 1, sizing: { title: 300, gameId: 150 } }),
  );

  const { result } = renderHook(() => useColumnSizing());
  expect(result.current.sizing).toEqual({ title: 300, gameId: 150 });
});

test("returns empty sizing when stored version does not match", () => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: 9999, sizing: { title: 300 } }),
  );

  const { result } = renderHook(() => useColumnSizing());
  expect(result.current.sizing).toEqual({});
});

test("returns empty sizing when localStorage is malformed", () => {
  localStorage.setItem(STORAGE_KEY, "not-json{{{");

  const { result } = renderHook(() => useColumnSizing());
  expect(result.current.sizing).toEqual({});
});

test("reset clears sizing state and removes localStorage key", () => {
  const { result } = renderHook(() => useColumnSizing());

  act(() => {
    result.current.setSizing({ title: 300 });
  });

  expect(result.current.sizing).toEqual({ title: 300 });

  act(() => {
    result.current.reset();
  });

  expect(result.current.sizing).toEqual({});
  expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx vitest run src/hooks/useColumnSizing.test.ts
```

Expected: FAIL — `useColumnSizing` does not exist.

- [ ] **Step 3: Implement the hook**

Create `src/hooks/useColumnSizing.ts`:

```ts
import { useState, useEffect } from "react";
import type { ColumnSizingState, OnChangeFn } from "@tanstack/react-table";

const STORAGE_KEY = "gcb-column-sizing";
const VERSION = 1;

function readFromStorage(): ColumnSizingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      (parsed as { version?: unknown }).version !== VERSION
    ) {
      return {};
    }
    return (parsed as { version: number; sizing: ColumnSizingState }).sizing;
  } catch {
    return {};
  }
}

export function useColumnSizing() {
  const [sizing, setSizingState] = useState<ColumnSizingState>(readFromStorage);

  useEffect(() => {
    if (Object.keys(sizing).length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: VERSION, sizing }),
      );
    }
  }, [sizing]);

  const setSizing: OnChangeFn<ColumnSizingState> = (updaterOrValue) => {
    setSizingState((prev) =>
      typeof updaterOrValue === "function"
        ? updaterOrValue(prev)
        : updaterOrValue,
    );
  };

  const reset = () => {
    setSizingState({});
  };

  return { sizing, setSizing, reset };
}
```

- [ ] **Step 4: Run the tests and verify they pass**

```bash
npx vitest run src/hooks/useColumnSizing.test.ts
```

Expected: all 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useColumnSizing.ts src/hooks/useColumnSizing.test.ts
git commit -m "feat(useColumnSizing): add hook for column sizing with localStorage persistence"
```

---

### Task 2: Resize handle CSS

**Files:**

- Modify: `src/components/SearchResults/SearchResults.module.css`

- [ ] **Step 1: Add resize handle styles**

Append to the end of `src/components/SearchResults/SearchResults.module.css`:

```css
/* Column resize handle */
.resizableTh {
  position: relative;
}

.resizeHandle {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 4px;
  cursor: col-resize;
  background: transparent;
  opacity: 0;
  transition: opacity 100ms;
  user-select: none;
}

.resizableTh:hover .resizeHandle,
.isResizing .resizeHandle {
  opacity: 1;
  background: var(--color-gold);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SearchResults/SearchResults.module.css
git commit -m "feat(SearchResults): add resize handle styles"
```

---

### Task 3: Wire sizing into SearchResults and render handles

**Files:**

- Modify: `src/components/SearchResults/SearchResults.tsx`

- [ ] **Step 1: Update the `dayStripe` column def to disable resizing**

In `src/components/SearchResults/SearchResults.tsx`, the `dayStripe` column def (lines 36–40) currently is:

```ts
{
  id: "dayStripe",
  header: () => null,
  cell: () => null,
},
```

Change it to:

```ts
{
  id: "dayStripe",
  header: () => null,
  cell: () => null,
  enableResizing: false,
},
```

- [ ] **Step 2: Import `useColumnSizing`**

At the top of `SearchResults.tsx`, after the `useColumnVisibility` import, add:

```ts
import { useColumnSizing } from "../../hooks/useColumnSizing";
```

- [ ] **Step 3: Instantiate the hook and wire it into `useReactTable`**

After the existing `const { visibility, toggle, reset } = useColumnVisibility();` line, add:

```ts
const { sizing, setSizing, reset: resetSizing } = useColumnSizing();
```

Update `useReactTable` to include sizing config. Change the `useReactTable` call from:

```ts
const table = useReactTable({
  data: data?.data ?? [],
  columns: COLUMNS,
  state: {
    columnVisibility: visibility,
  },
  manualSorting: true,
  manualPagination: true,
  getCoreRowModel: getCoreRowModel(),
});
```

To:

```ts
const table = useReactTable({
  data: data?.data ?? [],
  columns: COLUMNS,
  columnResizeMode: "onChange",
  state: {
    columnVisibility: visibility,
    columnSizing: sizing,
  },
  onColumnSizingChange: setSizing,
  manualSorting: true,
  manualPagination: true,
  getCoreRowModel: getCoreRowModel(),
});
```

- [ ] **Step 4: Update the Reset button to also reset sizing**

Find the Reset button (around line 379):

```tsx
<button type="button" onClick={reset}>
  Reset to defaults
</button>
```

Change it to:

```tsx
<button
  type="button"
  onClick={() => {
    reset();
    resetSizing();
  }}
>
  Reset to defaults
</button>
```

- [ ] **Step 5: Apply width and render resize handle in the header `<th>`**

Find the `<th>` for sortable columns in the header render (the one with `aria-sort`, around line 429). Change it from:

```tsx
return (
  <th key={header.id} aria-sort={ariaSort} scope="col" aria-label={label}>
    <button
      type="button"
      aria-label={`Sort by ${label}`}
      onClick={() => sortField && handleSortClick(sortField, label)}
    >
      {flexRender(header.column.columnDef.header, header.getContext())}
      {isActive && (
        <span aria-hidden="true" className={styles.sortIndicator}>
          {activeSortDir === "asc" ? " ▲" : " ▼"}
        </span>
      )}
    </button>
  </th>
);
```

To:

```tsx
return (
  <th
    key={header.id}
    aria-sort={ariaSort}
    scope="col"
    aria-label={label}
    className={`${styles.resizableTh}${header.column.getIsResizing() ? ` ${styles.isResizing}` : ""}`}
    style={{ width: header.getSize() }}
  >
    <button
      type="button"
      aria-label={`Sort by ${label}`}
      onClick={() => sortField && handleSortClick(sortField, label)}
    >
      {flexRender(header.column.columnDef.header, header.getContext())}
      {isActive && (
        <span aria-hidden="true" className={styles.sortIndicator}>
          {activeSortDir === "asc" ? " ▲" : " ▼"}
        </span>
      )}
    </button>
    {header.column.getCanResize() && (
      <div
        className={styles.resizeHandle}
        onPointerDown={header.getResizeHandler()}
        aria-hidden="true"
        data-testid="resize-handle"
      />
    )}
  </th>
);
```

- [ ] **Step 6: Verify the app compiles with no TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/SearchResults/SearchResults.tsx
git commit -m "feat(SearchResults): wire column resizing with TanStack Table and persist to localStorage"
```

---

### Task 4: SearchResults integration tests for column resizing

**Files:**

- Modify: `src/components/SearchResults/SearchResults.test.tsx`

- [ ] **Step 1: Add the resize integration tests**

Append to the end of `src/components/SearchResults/SearchResults.test.tsx`:

```ts
test("resize handle is rendered on resizable columns", async () => {
  renderSearchResults();
  await screen.findAllByRole("row");
  const handles = screen.getAllByTestId("resize-handle");
  // dayStripe has no handle; all other visible columns do
  expect(handles.length).toBeGreaterThan(0);
});

test("dayStripe column has no resize handle", async () => {
  renderSearchResults();
  await screen.findAllByRole("row");
  // dayStripe th is aria-hidden — query the DOM directly
  const dayStripes = document.querySelectorAll("th[aria-hidden='true']");
  dayStripes.forEach((th) => {
    expect(th.querySelector("[data-testid='resize-handle']")).toBeNull();
  });
});

test("pre-seeded localStorage sizing is applied to column width on mount", async () => {
  localStorage.setItem(
    "gcb-column-sizing",
    JSON.stringify({ version: 1, sizing: { title: 300 } }),
  );
  renderSearchResults();
  await screen.findAllByRole("row");
  const titleTh = screen.getByRole("columnheader", { name: "Title" });
  expect(titleTh).toHaveStyle({ width: "300px" });
});

test("Reset to defaults clears column sizing from localStorage", async () => {
  const user = userEvent.setup();
  localStorage.setItem(
    "gcb-column-sizing",
    JSON.stringify({ version: 1, sizing: { title: 300 } }),
  );
  renderSearchResults();
  await screen.findAllByRole("row");

  await user.click(screen.getByRole("button", { name: "Reset to defaults" }));

  expect(localStorage.getItem("gcb-column-sizing")).toBeNull();
});
```

- [ ] **Step 2: Run the new tests**

```bash
npx vitest run src/components/SearchResults/SearchResults.test.tsx
```

Expected: all tests PASS, including the 4 new ones.

- [ ] **Step 3: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests PASS with no regressions.

- [ ] **Step 4: Commit**

```bash
git add src/components/SearchResults/SearchResults.test.tsx
git commit -m "test(SearchResults): add column resize integration tests"
```
