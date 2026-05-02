# Column Minimum Sizes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically compute a minimum pixel width per column from cell content after each page load, then enforce that minimum during drag-resize and in the resize dialog.

**Architecture:** A new `useColumnMinSizes` hook measures content after render using canvas `measureText` for text and SVG `width` attributes for icons. `EventTable` calls the hook and clamps all column-size updates against the returned minimums. `ColumnResizeDialog` gains a `minWidth` prop that constrains its input and clamps on Apply.

**Tech Stack:** React `useRef`/`useEffect`, Canvas 2D API, TanStack Table `ColumnSizingState`, `@testing-library/react`, Vitest.

---

## File Map

| Action | Path                                            | Responsibility                                     |
| ------ | ----------------------------------------------- | -------------------------------------------------- |
| Create | `src/hooks/useColumnMinSizes.ts`                | Post-render canvas measurement; returns min widths |
| Create | `src/hooks/useColumnMinSizes.test.tsx`          | Tests for the hook (uses JSX wrapper)              |
| Modify | `src/ui/EventTable/ColumnResizeDialog.tsx`      | Add `minWidth` prop; enforce in input + Apply      |
| Modify | `src/ui/EventTable/ColumnResizeDialog.test.tsx` | Tests for `minWidth` enforcement                   |
| Modify | `src/ui/EventTable/EventTable.tsx`              | Wire hook; `data-col-id` on td; clamp onChange     |
| Modify | `src/ui/EventTable/EventTable.test.tsx`         | Integration tests for wiring                       |

---

## Task 1: `useColumnMinSizes` hook

**Files:**

- Create: `src/hooks/useColumnMinSizes.ts`
- Create: `src/hooks/useColumnMinSizes.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/hooks/useColumnMinSizes.test.tsx`:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import { useRef, useState } from "react";
import { expect, test, vi, beforeEach, afterEach } from "vitest";
import { makeEvent } from "../test/msw/factory";
import type { Event } from "../utils/types";
import { useColumnMinSizes } from "./useColumnMinSizes";

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    measureText: (text: string) => ({ width: text.length * 8 }),
    font: "",
  } as unknown as CanvasRenderingContext2D);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function TestTable({
  events,
  rows,
}: {
  events: Event[];
  rows: { colId: string; content: React.ReactNode }[][];
}) {
  const tableRef = useRef<HTMLTableElement>(null);
  const minSizes = useColumnMinSizes(tableRef, events);
  return (
    <>
      <table ref={tableRef}>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map(({ colId, content }) => (
                <td key={colId} data-col-id={colId}>
                  {content}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div data-testid="result">{JSON.stringify(minSizes)}</div>
    </>
  );
}

test("measures the longest word per column across all rows", async () => {
  // "Wednesday" = 9 chars × 8 = 72; "Monday" = 6 chars × 8 = 48 → max = 72
  // padding/borders = 0 in jsdom → min = 72
  render(
    <TestTable
      events={[makeEvent()]}
      rows={[[{ colId: "day", content: "Wednesday" }], [{ colId: "day", content: "Monday" }]]}
    />,
  );
  await waitFor(() => {
    const result = JSON.parse(screen.getByTestId("result").textContent!);
    expect(result.day).toBe(72);
  });
});

test("uses longest word by char count, not full text", async () => {
  // "A short description" → longest word "description" = 11 chars × 8 = 88
  render(
    <TestTable
      events={[makeEvent()]}
      rows={[[{ colId: "desc", content: "A short description" }]]}
    />,
  );
  await waitFor(() => {
    const result = JSON.parse(screen.getByTestId("result").textContent!);
    expect(result.desc).toBe(88);
  });
});

test("adds SVG width and gap to the minimum", async () => {
  // "Board" = 5 chars × 8 = 40; svg width = 14; gap fallback = 4 → total = 58
  render(
    <TestTable
      events={[makeEvent()]}
      rows={[
        [
          {
            colId: "eventType",
            content: (
              <>
                <svg width="14" height="14" />
                Board Game
              </>
            ),
          },
        ],
      ]}
    />,
  );
  await waitFor(() => {
    const result = JSON.parse(screen.getByTestId("result").textContent!);
    expect(result.eventType).toBe(58);
  });
});

test("returns {} when tableRef is null (not yet mounted)", () => {
  // useRef inside a component with no DOM element attached keeps current = null
  function NoTable() {
    const ref = useRef<HTMLTableElement>(null);
    const minSizes = useColumnMinSizes(ref, [makeEvent()]);
    return <div data-testid="result">{JSON.stringify(minSizes)}</div>;
  }
  render(<NoTable />);
  expect(JSON.parse(screen.getByTestId("result").textContent!)).toStrictEqual({});
});

test("returns {} when canvas context is unavailable", async () => {
  vi.restoreAllMocks();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  render(<TestTable events={[makeEvent()]} rows={[[{ colId: "day", content: "Wednesday" }]]} />);
  await waitFor(() => {
    const result = JSON.parse(screen.getByTestId("result").textContent!);
    expect(result).toStrictEqual({});
  });
});

test("remeasures when events change", async () => {
  const events1 = [makeEvent()];
  const events2 = [makeEvent()];

  function Rerender() {
    const [events, setEvents] = useState(events1);
    const tableRef = useRef<HTMLTableElement>(null);
    const minSizes = useColumnMinSizes(tableRef, events);
    return (
      <>
        <table ref={tableRef}>
          <tbody>
            <tr>
              <td data-col-id="day">{events === events1 ? "Monday" : "Wednesday"}</td>
            </tr>
          </tbody>
        </table>
        <div data-testid="result">{JSON.stringify(minSizes)}</div>
        <button onClick={() => setEvents(events2)}>next page</button>
      </>
    );
  }

  const user = (await import("@testing-library/user-event")).default.setup();
  render(<Rerender />);
  await waitFor(() => {
    expect(JSON.parse(screen.getByTestId("result").textContent!).day).toBe(48); // "Monday"
  });
  await user.click(screen.getByRole("button", { name: "next page" }));
  await waitFor(() => {
    expect(JSON.parse(screen.getByTestId("result").textContent!).day).toBe(72); // "Wednesday"
  });
});
```

- [ ] **Step 2: Run the tests and verify they all fail**

```bash
npx vitest run src/hooks/useColumnMinSizes.test.tsx
```

Expected: all 6 tests fail with "Cannot find module './useColumnMinSizes'".

- [ ] **Step 3: Implement the hook**

Create `src/hooks/useColumnMinSizes.ts`:

```ts
import { useEffect, useState, type RefObject } from "react";
import type { Event } from "../utils/types";

export function useColumnMinSizes(
  tableRef: RefObject<HTMLTableElement | null>,
  events: Event[],
): Record<string, number> {
  const [minSizes, setMinSizes] = useState<Record<string, number>>({});

  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sampleTd = table.querySelector<HTMLTableCellElement>("tbody td");
    if (!sampleTd) return;

    const tdStyle = getComputedStyle(sampleTd);
    ctx.font = tdStyle.font;
    const paddingH =
      (parseFloat(tdStyle.paddingLeft) || 0) +
      (parseFloat(tdStyle.paddingRight) || 0) +
      (parseFloat(tdStyle.borderLeftWidth) || 0) +
      (parseFloat(tdStyle.borderRightWidth) || 0);

    const gapCache = new Map<Element, number>();
    const result: Record<string, number> = {};

    table.querySelectorAll<HTMLTableCellElement>("tbody td[data-col-id]").forEach((td) => {
      const colId = td.getAttribute("data-col-id");
      if (!colId) return;

      const longestWord =
        (td.textContent ?? "")
          .trim()
          .split(/\s+/)
          .sort((a, b) => b.length - a.length)[0] ?? "";
      const textWidth = ctx.measureText(longestWord).width;

      const svgs = Array.from(td.querySelectorAll<SVGElement>("svg"));
      const svgWidth = svgs.reduce((sum, svg) => sum + (Number(svg.getAttribute("width")) || 0), 0);

      let gap = 0;
      if (svgWidth > 0) {
        const parent = svgs[0].parentElement;
        if (parent) {
          if (!gapCache.has(parent)) {
            gapCache.set(parent, parseFloat(getComputedStyle(parent).gap) || 4);
          }
          gap = gapCache.get(parent) ?? 4;
        }
      }

      const cellMin = Math.ceil(textWidth + svgWidth + gap + paddingH);
      result[colId] = Math.max(result[colId] ?? 0, cellMin);
    });

    setMinSizes(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]); // tableRef is a stable ref — intentionally omitted from deps

  return minSizes;
}
```

- [ ] **Step 4: Run the tests and verify they all pass**

```bash
npx vitest run src/hooks/useColumnMinSizes.test.tsx
```

Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useColumnMinSizes.ts src/hooks/useColumnMinSizes.test.tsx
git commit -m "feat(hooks): add useColumnMinSizes for canvas-based content measurement"
```

---

## Task 2: `ColumnResizeDialog` — `minWidth` prop

**Files:**

- Modify: `src/ui/EventTable/ColumnResizeDialog.tsx`
- Modify: `src/ui/EventTable/ColumnResizeDialog.test.tsx`

- [ ] **Step 1: Write the failing tests**

Append to `src/ui/EventTable/ColumnResizeDialog.test.tsx`:

```tsx
test("number input has min attribute equal to minWidth", () => {
  render(
    <ColumnResizeDialog
      columnName="Day"
      currentWidth={150}
      minWidth={80}
      onApply={vi.fn<(width: number) => void>()}
      onClose={vi.fn<() => void>()}
    />,
  );
  expect(screen.getByRole("spinbutton", { name: "Width (px)" })).toHaveAttribute("min", "80");
});

test("Apply clamps value to minWidth when input is below minimum", async () => {
  const user = userEvent.setup();
  const onApply = vi.fn<(width: number) => void>();
  render(
    <ColumnResizeDialog
      columnName="Day"
      currentWidth={150}
      minWidth={80}
      onApply={onApply}
      onClose={vi.fn<() => void>()}
    />,
  );
  const input = screen.getByRole("spinbutton", { name: "Width (px)" });
  await user.clear(input);
  await user.type(input, "50");
  await user.click(screen.getByRole("button", { name: "Apply" }));
  expect(onApply).toHaveBeenCalledWith(80);
});

test("Apply passes value unchanged when it exceeds minWidth", async () => {
  const user = userEvent.setup();
  const onApply = vi.fn<(width: number) => void>();
  render(
    <ColumnResizeDialog
      columnName="Day"
      currentWidth={150}
      minWidth={80}
      onApply={onApply}
      onClose={vi.fn<() => void>()}
    />,
  );
  const input = screen.getByRole("spinbutton", { name: "Width (px)" });
  await user.clear(input);
  await user.type(input, "200");
  await user.click(screen.getByRole("button", { name: "Apply" }));
  expect(onApply).toHaveBeenCalledWith(200);
});

test("works without minWidth prop (no clamping)", async () => {
  const user = userEvent.setup();
  const onApply = vi.fn<(width: number) => void>();
  render(
    <ColumnResizeDialog
      columnName="Day"
      currentWidth={150}
      onApply={onApply}
      onClose={vi.fn<() => void>()}
    />,
  );
  const input = screen.getByRole("spinbutton", { name: "Width (px)" });
  await user.clear(input);
  await user.type(input, "10");
  await user.click(screen.getByRole("button", { name: "Apply" }));
  expect(onApply).toHaveBeenCalledWith(10);
});
```

- [ ] **Step 2: Run the failing tests**

```bash
npx vitest run src/ui/EventTable/ColumnResizeDialog.test.tsx
```

Expected: 4 new tests fail (the 4 existing tests still pass).

- [ ] **Step 3: Add `minWidth` prop to `ColumnResizeDialog`**

Replace the contents of `src/ui/EventTable/ColumnResizeDialog.tsx`:

```tsx
import { useState, useId } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "../Button/Button";
import styles from "./ColumnResizeDialog.module.css";

interface ColumnResizeDialogProps {
  columnName: string;
  currentWidth: number;
  minWidth?: number;
  onApply: (width: number) => void;
  onClose: () => void;
}

export function ColumnResizeDialog({
  columnName,
  currentWidth,
  minWidth = 0,
  onApply,
  onClose,
}: ColumnResizeDialogProps): JSX.Element {
  const [value, setValue] = useState(String(currentWidth));
  const inputId = useId();

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Popup className={styles.popup}>
          <Dialog.Title className={styles.title}>Resize {columnName}</Dialog.Title>
          <div className={styles.field}>
            <label htmlFor={inputId} className={styles.label}>
              Width (px)
            </label>
            <input
              id={inputId}
              type="number"
              className={styles.input}
              min={minWidth}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div className={styles.actions}>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onApply(Math.max(Number(value), minWidth));
                onClose();
              }}
            >
              Apply
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 4: Run all `ColumnResizeDialog` tests**

```bash
npx vitest run src/ui/EventTable/ColumnResizeDialog.test.tsx
```

Expected: all 8 tests pass (4 original + 4 new).

- [ ] **Step 5: Commit**

```bash
git add src/ui/EventTable/ColumnResizeDialog.tsx src/ui/EventTable/ColumnResizeDialog.test.tsx
git commit -m "feat(column-resize-dialog): add minWidth prop to enforce content-based minimum"
```

---

## Task 3: Wire `useColumnMinSizes` into `EventTable`

**Files:**

- Modify: `src/ui/EventTable/EventTable.tsx`
- Modify: `src/ui/EventTable/EventTable.test.tsx`

- [ ] **Step 1: Write the failing tests**

Update the top-of-file imports in `src/ui/EventTable/EventTable.test.tsx` to add `vi`, `afterEach`, `waitFor`, and `within`:

```tsx
import { act, render, screen, waitFor, within } from "@testing-library/react";
import { expect, test, beforeEach, vi, afterEach } from "vitest";
```

Then append these tests to the bottom of the file:

```tsx
afterEach(() => {
  vi.restoreAllMocks();
});

test("td cells carry data-col-id attributes matching their column id", async () => {
  await renderEventTable([makeEvent()]);
  // Title is visible by default — all its cells should be tagged
  const titleCells = document.querySelectorAll('td[data-col-id="title"]');
  expect(titleCells).toHaveLength(1);
});

test("resize dialog input has min attribute reflecting measured cell content", async () => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    measureText: (text: string) => ({ width: text.length * 8 }),
    font: "",
  } as unknown as CanvasRenderingContext2D);

  const user = userEvent.setup();
  // 2024-08-07 is a Wednesday — longest day name = 9 chars × 8 = 72px (padding = 0 in jsdom)
  await renderEventTable([makeEvent({ startDateTime: "2024-08-07T10:00:00Z" })]);

  const dayHeader = screen.getByRole("columnheader", { name: /Day/ });
  await user.click(within(dayHeader).getByRole("button", { name: "Column actions" }));
  await user.click(screen.getByRole("button", { name: "Resize…" }));

  await waitFor(() => {
    expect(screen.getByRole("spinbutton", { name: "Width (px)" })).toHaveAttribute("min", "72");
  });
});
```

- [ ] **Step 2: Run the failing tests**

```bash
npx vitest run src/ui/EventTable/EventTable.test.tsx
```

Expected: the 2 new tests fail; all 9 existing tests still pass.

- [ ] **Step 3: Wire up `EventTable`**

Make the following changes to `src/ui/EventTable/EventTable.tsx`.

**3a.** Update the React import to include `useRef`:

```tsx
import { useState, useId, useRef } from "react";
```

**3b.** Add the hook import after the existing hook imports:

```tsx
import { useColumnMinSizes } from "../../hooks/useColumnMinSizes";
```

**3c.** Inside `EventTable`, after the existing `useId()` call, add:

```tsx
const tableRef = useRef<HTMLTableElement>(null);
```

**3d.** After the `tableRef` declaration, add:

```tsx
const columnMinSizes = useColumnMinSizes(tableRef, events);
```

**3e.** Replace the `onColumnSizingChange` handler in `useReactTable`:

```tsx
onColumnSizingChange: (updater) => {
  setSizing((prev) => {
    const next = typeof updater === "function" ? updater(prev) : updater;
    return Object.fromEntries(
      Object.entries(next).map(([id, size]) => [id, Math.max(size, columnMinSizes[id] ?? 0)]),
    );
  });
},
```

**3f.** Add `ref={tableRef}` to the `<table>` element:

```tsx
<table ref={tableRef}>
```

**3g.** Add `data-col-id` to each `<td>` in the row render:

```tsx
{
  row.getVisibleCells().map((cell) => (
    <td key={cell.id} data-col-id={cell.column.id}>
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </td>
  ));
}
```

**3h.** Pass `minWidth` to `ColumnResizeDialog`:

```tsx
{
  resizeTarget && (
    <ColumnResizeDialog
      columnName={resizeTarget.columnName}
      currentWidth={resizeTarget.currentWidth}
      minWidth={columnMinSizes[resizeTarget.columnId] ?? 0}
      onApply={(width) => {
        setSizing((prev: ColumnSizingState) => ({ ...prev, [resizeTarget.columnId]: width }));
      }}
      onClose={() => setResizeTarget(null)}
    />
  );
}
```

- [ ] **Step 4: Run all `EventTable` tests**

```bash
npx vitest run src/ui/EventTable/EventTable.test.tsx
```

Expected: all 11 tests pass.

- [ ] **Step 5: Run the full test suite to check for regressions**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/ui/EventTable/EventTable.tsx src/ui/EventTable/EventTable.test.tsx
git commit -m "feat(event-table): enforce content-based column minimum widths"
```
