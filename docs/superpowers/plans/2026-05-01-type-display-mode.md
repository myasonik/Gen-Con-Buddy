# Type Display Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 3-stop slider to "Customize columns" that controls whether the Type column shows the event type code ("RPG"), full name ("Role Playing Game"), or both ("RPG - Role Playing Game"); preference persists to localStorage.

**Architecture:** `useTypeDisplay` persists the preference via `useStoredState` (same pattern as `useColumnVisibility`). The value flows into TanStack Table's table-level meta where the `eventType` cell reads it. `TypeDisplaySlider` is a native `<input type="range">` with 3 stops. `SharedColumnState` gains optional `typeDisplay`/`setTypeDisplay` fields and is extracted to `src/ui/EventTable/types.ts` to avoid a circular import once `EventTable` imports `ColumnControlsPanel`. `ColumnControlsPanel` owns the slider with `useTypeDisplay()` as a local fallback when the parent does not supply the values. `EventTable`'s previously duplicated inline panel is replaced by `ColumnControlsPanel`.

**Tech Stack:** React, TanStack Table, CSS Modules, Vitest + @testing-library/react + @testing-library/user-event

---

## File Structure

**Create:**

- `src/hooks/useTypeDisplay.ts` — `TypeDisplay` type + localStorage-backed hook
- `src/hooks/useTypeDisplay.test.ts` — hook unit tests
- `src/ui/EventTable/types.ts` — `SharedColumnState` interface (extracted from `EventTable.tsx` to prevent circular import)
- `src/ui/TypeDisplaySlider/TypeDisplaySlider.tsx` — range input with 3 labelled stops
- `src/ui/TypeDisplaySlider/TypeDisplaySlider.module.css` — slider layout styles
- `src/ui/TypeDisplaySlider/TypeDisplaySlider.test.tsx` — slider unit tests

**Modify:**

- `src/ui/EventTable/columns.tsx` — augment `TableMeta`, update `eventType` cell renderer
- `src/ui/EventTable/EventTable.tsx` — import `SharedColumnState` from `types.ts`, call `useTypeDisplay`, pass to table meta, replace inline panel with `ColumnControlsPanel`
- `src/ui/EventTable/EventTable.module.css` — add `.panelDivider`
- `src/ui/EventTable/EventTable.test.tsx` — integration tests for slider ↔ column display
- `src/ui/EventTable/ColumnControlsPanel.tsx` — add `TypeDisplaySlider`, read optional `typeDisplay`/`setTypeDisplay` from `columnState`
- `src/components/ChangelogPage/ChangelogPage.tsx` — call `useTypeDisplay`, add to `sharedColumnState`
- `src/components/ChangelogPage/ChangelogEntryPanel.tsx` — update `SharedColumnState` import path
- `src/components/ChangelogPage/ChangelogEntryPanel.test.tsx` — update `SharedColumnState` import path
- `src/components/ChangelogPage/ChangelogRow.tsx` — update `SharedColumnState` import path
- `src/components/ChangelogPage/ChangelogRow.test.tsx` — update `SharedColumnState` import path

---

## Task 1: `useTypeDisplay` hook

**Files:**

- Create: `src/hooks/useTypeDisplay.ts`
- Create: `src/hooks/useTypeDisplay.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/hooks/useTypeDisplay.test.ts
import { expect, test, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTypeDisplay } from "./useTypeDisplay";

const STORAGE_KEY = "gen-con-buddy-type-display";

beforeEach(() => {
  localStorage.clear();
});

test("returns 'both' as the default value", () => {
  const { result } = renderHook(() => useTypeDisplay());
  expect(result.current.typeDisplay).toBe("both");
});

test("setTypeDisplay updates the value", () => {
  const { result } = renderHook(() => useTypeDisplay());
  act(() => {
    result.current.setTypeDisplay("code");
  });
  expect(result.current.typeDisplay).toBe("code");
});

test("persists the value to localStorage", () => {
  const { result } = renderHook(() => useTypeDisplay());
  act(() => {
    result.current.setTypeDisplay("name");
  });
  const { result: result2 } = renderHook(() => useTypeDisplay());
  expect(result2.current.typeDisplay).toBe("name");
});

test("reset restores the value to 'both'", () => {
  const { result } = renderHook(() => useTypeDisplay());
  act(() => {
    result.current.setTypeDisplay("code");
  });
  act(() => {
    result.current.reset();
  });
  expect(result.current.typeDisplay).toBe("both");
});

test("falls back to 'both' when stored version does not match", () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 9999, value: "code" }));
  const { result } = renderHook(() => useTypeDisplay());
  expect(result.current.typeDisplay).toBe("both");
});

test("falls back to 'both' when stored data is malformed", () => {
  localStorage.setItem(STORAGE_KEY, "not-json{{{");
  const { result } = renderHook(() => useTypeDisplay());
  expect(result.current.typeDisplay).toBe("both");
});
```

- [ ] **Step 2: Run to verify the tests fail**

```
npm run test -- --run src/hooks/useTypeDisplay.test.ts
```

Expected: FAIL — "Cannot find module './useTypeDisplay'"

- [ ] **Step 3: Implement the hook**

```ts
// src/hooks/useTypeDisplay.ts
import { useStoredState } from "./useStoredState";

export type TypeDisplay = "code" | "name" | "both";

const STORAGE_KEY = "gen-con-buddy-type-display";
const VERSION = 1;
const DEFAULT: TypeDisplay = "both";

export function useTypeDisplay(): {
  typeDisplay: TypeDisplay;
  setTypeDisplay: (value: TypeDisplay) => void;
  reset: () => void;
} {
  const [typeDisplay, setStored] = useStoredState<TypeDisplay>(STORAGE_KEY, VERSION, DEFAULT);
  return {
    typeDisplay,
    setTypeDisplay: (value: TypeDisplay): void => setStored(value),
    reset: (): void => setStored(DEFAULT),
  };
}
```

- [ ] **Step 4: Run to verify the tests pass**

```
npm run test -- --run src/hooks/useTypeDisplay.test.ts
```

Expected: 6 tests passed

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTypeDisplay.ts src/hooks/useTypeDisplay.test.ts
git commit -m "feat(type-display): add useTypeDisplay hook"
```

---

## Task 2: `eventType` column renderer

**Files:**

- Create: `src/ui/EventTable/columns.test.tsx`
- Modify: `src/ui/EventTable/columns.tsx`

The tests render through `EventTable` (which is how the cell gets a full TanStack Table context with meta) and pre-seed localStorage to control the display mode.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/ui/EventTable/columns.test.tsx
import { expect, test, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  createMemoryHistory,
} from "@tanstack/react-router";
import { makeEvent } from "../../test/msw/factory";
import { EventTable } from "./EventTable";
import type { TypeDisplay } from "../../hooks/useTypeDisplay";

beforeEach(() => {
  localStorage.clear();
});

async function renderWithTypeDisplay(
  typeDisplay: TypeDisplay,
  eventType: string = "RPG",
): Promise<void> {
  localStorage.setItem(
    "gen-con-buddy-type-display",
    JSON.stringify({ version: 1, value: typeDisplay }),
  );
  const rootRoute = createRootRoute({
    component: () => <EventTable events={[makeEvent({ eventType })]} />,
  });
  const eventRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/event/$id",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([eventRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await router.load();
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

test("shows code only when typeDisplay is 'code'", async () => {
  await renderWithTypeDisplay("code");
  expect(screen.getByRole("cell", { name: "RPG" })).toBeInTheDocument();
  expect(screen.queryByText("Role Playing Game")).not.toBeInTheDocument();
});

test("shows name only when typeDisplay is 'name'", async () => {
  await renderWithTypeDisplay("name");
  expect(screen.getByRole("cell", { name: "Role Playing Game" })).toBeInTheDocument();
  expect(screen.queryByText("RPG - Role Playing Game")).not.toBeInTheDocument();
});

test("shows code and name when typeDisplay is 'both'", async () => {
  await renderWithTypeDisplay("both");
  expect(screen.getByRole("cell", { name: "RPG - Role Playing Game" })).toBeInTheDocument();
});

test("falls back to raw code when event type is not in EVENT_TYPES", async () => {
  await renderWithTypeDisplay("name", "XYZ");
  expect(screen.getByRole("cell", { name: "XYZ" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify the tests fail**

```
npm run test -- --run src/ui/EventTable/columns.test.tsx
```

Expected: FAIL — all display modes show "RPG - Role Playing Game" regardless of localStorage

- [ ] **Step 3: Augment `TableMeta` and update the `eventType` cell in `columns.tsx`**

`columns.tsx` already has a `declare module "@tanstack/react-table"` block for `ColumnMeta`. Add `TableMeta` to the same block, then import `EVENT_TYPES` (it is already imported), and update the `eventType` column. The full updated module augmentation:

```ts
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    sortField?: string;
  }
  interface TableMeta<TData> {
    typeDisplay?: "code" | "name" | "both";
  }
}
```

Replace the `eventType` column definition (currently lines 41–46) with:

```tsx
{
  id: "eventType",
  header: "Type",
  meta: { sortField: "eventType" },
  cell: ({ row, table }) => {
    const code = row.original.attributes.eventType;
    const typeDisplay = table.options.meta?.typeDisplay ?? "both";
    if (typeDisplay === "code") return <>{code}</>;
    const full = EVENT_TYPES[code];
    const name = full?.replace(/^[A-Z]+ - /, "") ?? code;
    if (typeDisplay === "name") return <>{name}</>;
    return <>{full ?? code}</>;
  },
},
```

- [ ] **Step 4: Run to verify the tests pass**

```
npm run test -- --run src/ui/EventTable/columns.test.tsx
```

Expected: 4 tests passed

- [ ] **Step 5: Commit**

```bash
git add src/ui/EventTable/columns.tsx src/ui/EventTable/columns.test.tsx
git commit -m "feat(type-display): update eventType cell to read typeDisplay from table meta"
```

---

## Task 3: `TypeDisplaySlider` component

**Files:**

- Create: `src/ui/TypeDisplaySlider/TypeDisplaySlider.tsx`
- Create: `src/ui/TypeDisplaySlider/TypeDisplaySlider.module.css`
- Create: `src/ui/TypeDisplaySlider/TypeDisplaySlider.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// src/ui/TypeDisplaySlider/TypeDisplaySlider.test.tsx
import { expect, test, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TypeDisplaySlider } from "./TypeDisplaySlider";

test("renders a slider with aria-label 'Type display'", () => {
  render(<TypeDisplaySlider value="both" onChange={vi.fn()} />);
  expect(screen.getByRole("slider", { name: "Type display" })).toBeInTheDocument();
});

test("slider value is 0 when prop is 'code'", () => {
  render(<TypeDisplaySlider value="code" onChange={vi.fn()} />);
  expect(screen.getByRole("slider")).toHaveValue("0");
});

test("slider value is 1 when prop is 'name'", () => {
  render(<TypeDisplaySlider value="name" onChange={vi.fn()} />);
  expect(screen.getByRole("slider")).toHaveValue("1");
});

test("slider value is 2 when prop is 'both'", () => {
  render(<TypeDisplaySlider value="both" onChange={vi.fn()} />);
  expect(screen.getByRole("slider")).toHaveValue("2");
});

test("calls onChange with 'code' when moved to position 0", () => {
  const onChange = vi.fn();
  render(<TypeDisplaySlider value="both" onChange={onChange} />);
  fireEvent.change(screen.getByRole("slider"), { target: { value: "0" } });
  expect(onChange).toHaveBeenCalledWith("code");
});

test("calls onChange with 'name' when moved to position 1", () => {
  const onChange = vi.fn();
  render(<TypeDisplaySlider value="both" onChange={onChange} />);
  fireEvent.change(screen.getByRole("slider"), { target: { value: "1" } });
  expect(onChange).toHaveBeenCalledWith("name");
});

test("calls onChange with 'both' when moved to position 2", () => {
  const onChange = vi.fn();
  render(<TypeDisplaySlider value="code" onChange={onChange} />);
  fireEvent.change(screen.getByRole("slider"), { target: { value: "2" } });
  expect(onChange).toHaveBeenCalledWith("both");
});

test("renders visible labels Code, Name, Both", () => {
  render(<TypeDisplaySlider value="both" onChange={vi.fn()} />);
  expect(screen.getByText("Code")).toBeInTheDocument();
  expect(screen.getByText("Name")).toBeInTheDocument();
  expect(screen.getByText("Both")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify the tests fail**

```
npm run test -- --run src/ui/TypeDisplaySlider/TypeDisplaySlider.test.tsx
```

Expected: FAIL — "Cannot find module './TypeDisplaySlider'"

- [ ] **Step 3: Implement the component**

```tsx
// src/ui/TypeDisplaySlider/TypeDisplaySlider.tsx
import { useId } from "react";
import type { TypeDisplay } from "../../hooks/useTypeDisplay";
import styles from "./TypeDisplaySlider.module.css";

const OPTIONS: TypeDisplay[] = ["code", "name", "both"];
const LABELS: Record<TypeDisplay, string> = { code: "Code", name: "Name", both: "Both" };

interface TypeDisplaySliderProps {
  value: TypeDisplay;
  onChange: (value: TypeDisplay) => void;
}

export function TypeDisplaySlider({ value, onChange }: TypeDisplaySliderProps): JSX.Element {
  const listId = useId();
  return (
    <div className={styles.root}>
      <div className={styles.track}>
        <input
          type="range"
          min={0}
          max={2}
          step={1}
          value={OPTIONS.indexOf(value)}
          list={listId}
          aria-label="Type display"
          aria-valuetext={LABELS[value]}
          className={styles.input}
          onChange={(e) => {
            const next = OPTIONS[Number(e.target.value)];
            if (next) onChange(next);
          }}
        />
        <datalist id={listId}>
          <option value="0" />
          <option value="1" />
          <option value="2" />
        </datalist>
      </div>
      <div className={styles.labels} aria-hidden="true">
        {OPTIONS.map((opt) => (
          <span key={opt}>{LABELS[opt]}</span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create the CSS module**

```css
/* src/ui/TypeDisplaySlider/TypeDisplaySlider.module.css */
.root {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.track {
  position: relative;
}

.input {
  width: 100%;
  cursor: pointer;
}

.labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
}
```

- [ ] **Step 5: Run to verify the tests pass**

```
npm run test -- --run src/ui/TypeDisplaySlider/TypeDisplaySlider.test.tsx
```

Expected: 8 tests passed

- [ ] **Step 6: Commit**

```bash
git add src/ui/TypeDisplaySlider/
git commit -m "feat(type-display): add TypeDisplaySlider component"
```

---

## Task 4: Extract `SharedColumnState` + extend with `typeDisplay` fields

`EventTable.tsx` is about to import `ColumnControlsPanel.tsx`, which currently imports `SharedColumnState` from `EventTable.tsx` — a circular dependency. Extract the interface first.

**Files:**

- Create: `src/ui/EventTable/types.ts`
- Modify: `src/ui/EventTable/EventTable.tsx`
- Modify: `src/ui/EventTable/ColumnControlsPanel.tsx`
- Modify: `src/components/ChangelogPage/ChangelogEntryPanel.tsx`
- Modify: `src/components/ChangelogPage/ChangelogEntryPanel.test.tsx`
- Modify: `src/components/ChangelogPage/ChangelogRow.tsx`
- Modify: `src/components/ChangelogPage/ChangelogRow.test.tsx`

- [ ] **Step 1: Create `src/ui/EventTable/types.ts`**

```ts
// src/ui/EventTable/types.ts
import type { OnChangeFn, ColumnSizingState } from "@tanstack/react-table";
import type { TypeDisplay } from "../../hooks/useTypeDisplay";

export interface SharedColumnState {
  visibility: Record<string, boolean>;
  toggleVisibility: (id: string) => void;
  resetVisibility: () => void;
  sizing: ColumnSizingState;
  setSizing: OnChangeFn<ColumnSizingState>;
  resetSizing: () => void;
  typeDisplay?: TypeDisplay;
  setTypeDisplay?: (value: TypeDisplay) => void;
}
```

- [ ] **Step 2: Update `EventTable.tsx` to re-export `SharedColumnState` from `types.ts`**

In `src/ui/EventTable/EventTable.tsx`, replace the existing `SharedColumnState` interface declaration with an import + re-export:

```ts
// Remove the inline interface. Add this import at the top:
import type { SharedColumnState } from "./types";

// Add this re-export so external consumers still import from EventTable:
export type { SharedColumnState };
```

The rest of `EventTable.tsx` is unchanged for this step.

- [ ] **Step 3: Update `ColumnControlsPanel.tsx` import path**

In `src/ui/EventTable/ColumnControlsPanel.tsx`, change:

```ts
import type { SharedColumnState } from "./EventTable";
```

to:

```ts
import type { SharedColumnState } from "./types";
```

- [ ] **Step 4: Update ChangelogPage component and test import paths**

In each of the four files below, change:

```ts
import type { SharedColumnState } from "../../ui/EventTable/EventTable";
```

to:

```ts
import type { SharedColumnState } from "../../ui/EventTable/types";
```

Files:

- `src/components/ChangelogPage/ChangelogEntryPanel.tsx`
- `src/components/ChangelogPage/ChangelogEntryPanel.test.tsx`
- `src/components/ChangelogPage/ChangelogRow.tsx`
- `src/components/ChangelogPage/ChangelogRow.test.tsx`

Note: `ChangelogEntryPanel.tsx` imports both `EventTable` and `SharedColumnState` from `"../../ui/EventTable/EventTable"`. Split it into two imports:

```ts
import { EventTable } from "../../ui/EventTable/EventTable";
import type { SharedColumnState } from "../../ui/EventTable/types";
```

- [ ] **Step 5: Run the full test suite to confirm no regressions**

```
npm run test -- --run
```

Expected: all tests pass (same count as before)

- [ ] **Step 6: Commit**

```bash
git add src/ui/EventTable/types.ts src/ui/EventTable/EventTable.tsx src/ui/EventTable/ColumnControlsPanel.tsx src/components/ChangelogPage/ChangelogEntryPanel.tsx src/components/ChangelogPage/ChangelogEntryPanel.test.tsx src/components/ChangelogPage/ChangelogRow.tsx src/components/ChangelogPage/ChangelogRow.test.tsx
git commit -m "refactor(type-display): extract SharedColumnState to types.ts, add optional typeDisplay fields"
```

---

## Task 5: Update `ColumnControlsPanel` with the slider

**Files:**

- Modify: `src/ui/EventTable/ColumnControlsPanel.tsx`
- Modify: `src/ui/EventTable/EventTable.module.css`
- Modify: `src/ui/EventTable/EventTable.test.tsx`

- [ ] **Step 1: Write the failing test**

Add to `src/ui/EventTable/EventTable.test.tsx` (the `renderEventTable` helper and router setup are already there — just add the test):

```tsx
test("'Customize columns' panel contains the type display slider", async () => {
  await renderEventTable();
  expect(screen.getByRole("slider", { name: "Type display" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify the test fails**

```
npm run test -- --run src/ui/EventTable/EventTable.test.tsx
```

Expected: FAIL — slider not found

- [ ] **Step 3: Add `.panelDivider` to `EventTable.module.css`**

Append to `src/ui/EventTable/EventTable.module.css`:

```css
.panelDivider {
  border: none;
  border-top: 0.0625rem solid;
  margin: var(--space-2) 0;
}
```

- [ ] **Step 4: Update `ColumnControlsPanel.tsx`**

Replace the entire file content of `src/ui/EventTable/ColumnControlsPanel.tsx` with:

```tsx
import { Button } from "../Button/Button";
import { TypeDisplaySlider } from "../TypeDisplaySlider/TypeDisplaySlider";
import { useTypeDisplay } from "../../hooks/useTypeDisplay";
import type { SharedColumnState } from "./types";
import { AnimatedDetails } from "../AnimatedDetails/AnimatedDetails";
import { COLUMNS } from "./columns";
import styles from "./EventTable.module.css";

interface ColumnControlsPanelProps {
  columnState: SharedColumnState;
}

export function ColumnControlsPanel({ columnState }: ColumnControlsPanelProps): JSX.Element {
  const {
    visibility,
    toggleVisibility,
    resetVisibility,
    resetSizing,
    typeDisplay: externalTypeDisplay,
    setTypeDisplay: externalSetTypeDisplay,
  } = columnState;
  const internal = useTypeDisplay();
  const typeDisplay = externalTypeDisplay ?? internal.typeDisplay;
  const setTypeDisplay = externalSetTypeDisplay ?? internal.setTypeDisplay;
  const resetTypeDisplay = externalSetTypeDisplay
    ? () => externalSetTypeDisplay("both")
    : internal.reset;

  return (
    <AnimatedDetails className={styles.visibilityPanel} summary="Customize columns">
      <fieldset>
        <ul>
          {COLUMNS.map((col) => (
            <li key={col.id}>
              <label>
                <input
                  type="checkbox"
                  checked={col.id !== undefined && Boolean(visibility[col.id])}
                  onChange={() => {
                    if (col.id !== undefined) {
                      toggleVisibility(col.id);
                    }
                  }}
                />
                {typeof col.header === "string" ? col.header : col.id}
              </label>
            </li>
          ))}
        </ul>
        <hr className={styles.panelDivider} />
        <TypeDisplaySlider value={typeDisplay} onChange={setTypeDisplay} />
        <Button
          variant="secondary"
          onClick={() => {
            resetVisibility();
            resetSizing();
            resetTypeDisplay();
          }}
        >
          Reset to defaults
        </Button>
      </fieldset>
    </AnimatedDetails>
  );
}
```

- [ ] **Step 5: Run to verify the test passes**

```
npm run test -- --run src/ui/EventTable/EventTable.test.tsx
```

Expected: all existing tests + new slider test pass

- [ ] **Step 6: Commit**

```bash
git add src/ui/EventTable/EventTable.module.css src/ui/EventTable/ColumnControlsPanel.tsx src/ui/EventTable/EventTable.test.tsx
git commit -m "feat(type-display): add TypeDisplaySlider to ColumnControlsPanel"
```

---

## Task 6: Replace `EventTable`'s inline panel with `ColumnControlsPanel`

`EventTable.tsx` currently has an inline copy of the columns panel. This task removes that duplication, wires `useTypeDisplay` into the table meta, and adds end-to-end integration tests.

**Files:**

- Modify: `src/ui/EventTable/EventTable.tsx`
- Modify: `src/ui/EventTable/EventTable.test.tsx`

- [ ] **Step 1: Write the failing integration tests**

Add to `src/ui/EventTable/EventTable.test.tsx`. First, add `fireEvent` to the existing `@testing-library/react` import at the top of the file:

```ts
import { act, render, screen, fireEvent } from "@testing-library/react";
```

Then add the three tests:

```tsx
test("changing slider to Code shows only the type code in the Type column", async () => {
  const user = userEvent.setup();
  await renderEventTable([makeEvent({ eventType: "RPG" })]);
  await user.click(screen.getByText("Customize columns"));
  const slider = screen.getByRole("slider", { name: "Type display" });
  fireEvent.change(slider, { target: { value: "0" } }); // position 0 = code
  expect(screen.getByRole("cell", { name: "RPG" })).toBeInTheDocument();
  expect(screen.queryByText("RPG - Role Playing Game")).not.toBeInTheDocument();
});

test("changing slider to Name shows only the event type name in the Type column", async () => {
  const user = userEvent.setup();
  await renderEventTable([makeEvent({ eventType: "RPG" })]);
  await user.click(screen.getByText("Customize columns"));
  const slider = screen.getByRole("slider", { name: "Type display" });
  fireEvent.change(slider, { target: { value: "1" } }); // position 1 = name
  expect(screen.getByRole("cell", { name: "Role Playing Game" })).toBeInTheDocument();
});

test("Reset to defaults restores slider to Both and shows full type label", async () => {
  const user = userEvent.setup();
  await renderEventTable([makeEvent({ eventType: "RPG" })]);
  await user.click(screen.getByText("Customize columns"));
  const slider = screen.getByRole("slider", { name: "Type display" });
  fireEvent.change(slider, { target: { value: "0" } }); // move to Code
  await user.click(screen.getByRole("button", { name: "Reset to defaults" }));
  expect(slider).toHaveValue("2"); // back to Both
  expect(screen.getByRole("cell", { name: "RPG - Role Playing Game" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify the tests fail**

```
npm run test -- --run src/ui/EventTable/EventTable.test.tsx
```

Expected: FAIL — type column still shows "RPG - Role Playing Game" regardless of slider position (meta not wired yet)

- [ ] **Step 3: Refactor `EventTable.tsx`**

Make these changes to `src/ui/EventTable/EventTable.tsx`:

**a) Update imports — add `useTypeDisplay` and `ColumnControlsPanel`, remove `AnimatedDetails` and `Button` (they are no longer used directly in EventTable):**

```ts
// Add:
import { useTypeDisplay } from "../../hooks/useTypeDisplay";
import { ColumnControlsPanel } from "./ColumnControlsPanel";
// Remove:
// import { AnimatedDetails } from "../AnimatedDetails/AnimatedDetails";
// import { Button } from "../Button/Button";
```

**b) Update the `SharedColumnState` import — it now lives in `types.ts`:**

```ts
import type { SharedColumnState } from "./types";
export type { SharedColumnState };
```

**c) Inside the `EventTable` function, add the `useTypeDisplay` call alongside the other hook calls:**

```ts
const internalTypeDisplay = useTypeDisplay();
const typeDisplay = sharedColumnState?.typeDisplay ?? internalTypeDisplay.typeDisplay;
const setTypeDisplay = sharedColumnState?.setTypeDisplay ?? internalTypeDisplay.setTypeDisplay;
```

**d) Pass `typeDisplay` into `useReactTable` via `meta`:**

```ts
const table = useReactTable({
  data: events,
  columns: COLUMNS,
  columnResizeMode: "onChange",
  state: {
    columnVisibility: visibility,
    columnSizing: sizing,
    sorting: internalSorting,
  },
  meta: { typeDisplay }, // ← add this line
  onColumnSizingChange: (updater) => {
    setSizing(updater);
  },
  onSortingChange: setInternalSorting,
  manualSorting: Boolean(onSort),
  manualPagination: true,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
});
```

**e) Build `columnStateForPanel` and replace the inline panel in the JSX.**

Before the `return` statement, add:

```ts
const columnStateForPanel: SharedColumnState = {
  visibility,
  toggleVisibility,
  resetVisibility,
  sizing,
  setSizing,
  resetSizing,
  typeDisplay,
  setTypeDisplay,
};
```

In the JSX, replace the entire `{showColumnControls && (<AnimatedDetails ...>...</AnimatedDetails>)}` block (the inline panel) with:

```tsx
{
  showColumnControls && <ColumnControlsPanel columnState={columnStateForPanel} />;
}
```

- [ ] **Step 4: Run to verify all tests pass**

```
npm run test -- --run src/ui/EventTable/EventTable.test.tsx
```

Expected: all existing tests + 3 new integration tests pass

- [ ] **Step 5: Run the full test suite**

```
npm run test -- --run
```

Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add src/ui/EventTable/EventTable.tsx src/ui/EventTable/EventTable.test.tsx
git commit -m "feat(type-display): wire typeDisplay into EventTable meta and replace inline panel"
```

---

## Task 7: Wire `ChangelogPage`

When `ColumnControlsPanel` is used standalone (via `ChangelogPage`) without `typeDisplay` in `sharedColumnState`, each `ColumnControlsPanel` instance falls back to its own `useTypeDisplay()` call. Changing the slider would update localStorage but not re-render the `EventTable` instances in the same session because they hold their own hook instances. Adding `typeDisplay`/`setTypeDisplay` to `sharedColumnState` in `ChangelogPage` fixes this.

**Files:**

- Modify: `src/components/ChangelogPage/ChangelogPage.tsx`

- [ ] **Step 1: Update `ChangelogPage.tsx`**

In `src/components/ChangelogPage/ChangelogPage.tsx`, add the `useTypeDisplay` import and wire it into `sharedColumnState`:

```ts
// Add import:
import { useTypeDisplay } from "../../hooks/useTypeDisplay";

// Inside ChangelogPage(), alongside the other hook calls:
const { typeDisplay, setTypeDisplay } = useTypeDisplay();

// Update sharedColumnState to include it:
const sharedColumnState = {
  visibility,
  toggleVisibility,
  resetVisibility,
  sizing,
  setSizing,
  resetSizing,
  typeDisplay,
  setTypeDisplay,
};
```

- [ ] **Step 2: Run the full test suite**

```
npm run test -- --run
```

Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add src/components/ChangelogPage/ChangelogPage.tsx
git commit -m "feat(type-display): wire typeDisplay through ChangelogPage sharedColumnState"
```
