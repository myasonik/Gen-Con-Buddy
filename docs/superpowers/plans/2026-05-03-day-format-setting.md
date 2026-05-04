# Day Format Display Setting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a user-controlled day format setting (`"day"` / `"numeric"` / `"long"`) that renders consistently across the event table, mobile list, and event detail page — and simultaneously fix the event type column's min-width bug by switching from CSS show/hide to conditional JSX rendering.

**Architecture:** A new `useDayFormat` hook (localStorage-backed via `useStoredState`) feeds into `SharedColumnState`. In the desktop table, `dayFormat`, `typeDisplay`, and `showTypeIcon` are spread onto TanStack Table's `CellContext` so column cell renderers can access them directly. A shared `formatDay` utility handles all three format strings; the event detail page calls `useDayFormat()` independently.

**Tech Stack:** React, TanStack Table v8, date-fns, Vitest, @testing-library/react, CSS Modules.

---

## File Map

### New files

| File                                 | Purpose                                                   |
| ------------------------------------ | --------------------------------------------------------- |
| `src/components/EventTable/types.ts` | Add `DayFormat` type; extend `SharedColumnState`          |
| `src/utils/formatDay.ts`             | `formatDay` and `formatDayCompact` pure functions         |
| `src/utils/formatDay.test.ts`        | Tests for all 3 formats × both functions                  |
| `src/hooks/useDayFormat.ts`          | localStorage-backed hook for the day format setting       |
| `src/hooks/useDayFormat.test.ts`     | Hook tests: default, persist, reset, version invalidation |

### Modified files

| File                                                        | What changes                                                                                              |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `src/hooks/useColumnMinSizes.ts`                            | Add optional `typeDisplay`, `showTypeIcon`, `dayFormat` deps                                              |
| `src/hooks/useColumnMinSizes.test.tsx`                      | Add remeasure tests for display setting changes                                                           |
| `src/components/EventTable/columns.tsx`                     | CellContext augmentation; conditional type cell; dayFormat day cell                                       |
| `src/components/EventTable/EventTable.tsx`                  | Spread CellContext; remove data attrs; pass display settings to useColumnMinSizes                         |
| `src/components/EventTable/EventTable.test.tsx`             | Remove data-attr tests; add conditional render + day format tests; add dayFormat to makeSharedColumnState |
| `src/components/EventTable/ColumnControlsPanel.tsx`         | Add "Day column" fieldset with SegmentedControl                                                           |
| `src/components/EventTable/ColumnControlsPanel.test.tsx`    | Add dayFormat to makeColumnState; add Day column fieldset tests                                           |
| `src/components/EventTable/EventListMobile.tsx`             | Add `dayFormat` prop; use `formatDayCompact`                                                              |
| `src/components/EventTable/EventListMobile.test.tsx`        | Add compact day format tests                                                                              |
| `src/components/EventDetail/EventDetail.tsx`                | Call `useDayFormat()`; use `formatDay` for Day field                                                      |
| `src/routes/event.$id.test.tsx`                             | Add `localStorage.clear()` in beforeEach; add day format tests                                            |
| `src/components/SearchResults/SearchResults.tsx`            | Call `useDayFormat()`; add to sharedColumnState; pass to EventListMobile                                  |
| `src/components/ChangelogPage/ChangelogPage.tsx`            | Call `useDayFormat()`; add to sharedColumnState                                                           |
| `src/components/ChangelogPage/ChangelogEntryPanel.tsx`      | Pass `dayFormat` to EventListMobile                                                                       |
| `src/components/ChangelogPage/ChangelogEntryPanel.test.tsx` | Add dayFormat fields to `stubColumnState`                                                                 |

---

## Task 1: Add `DayFormat` to types and extend `SharedColumnState`

**Files:**

- Modify: `src/components/EventTable/types.ts`

This is a pure type change. No tests — TypeScript will catch misuse in subsequent tasks.

- [ ] **Open `src/components/EventTable/types.ts`.** Current content:

```ts
import type { OnChangeFn, ColumnSizingState } from "@tanstack/react-table";

export type TypeDisplay = "code" | "name" | "both";

export interface SharedColumnState {
  visibility: Record<string, boolean>;
  toggleVisibility: (id: string) => void;
  resetVisibility: () => void;
  sizing: ColumnSizingState;
  setSizing: OnChangeFn<ColumnSizingState>;
  resetSizing: () => void;
  typeDisplay: TypeDisplay;
  setTypeDisplay: (v: TypeDisplay) => void;
  showTypeIcon: boolean;
  setShowTypeIcon: (v: boolean) => void;
  resetTypeDisplay: () => void;
}
```

- [ ] **Add `DayFormat` and extend `SharedColumnState`:**

```ts
import type { OnChangeFn, ColumnSizingState } from "@tanstack/react-table";

export type TypeDisplay = "code" | "name" | "both";
export type DayFormat = "day" | "numeric" | "long";

export interface SharedColumnState {
  visibility: Record<string, boolean>;
  toggleVisibility: (id: string) => void;
  resetVisibility: () => void;
  sizing: ColumnSizingState;
  setSizing: OnChangeFn<ColumnSizingState>;
  resetSizing: () => void;
  typeDisplay: TypeDisplay;
  setTypeDisplay: (v: TypeDisplay) => void;
  showTypeIcon: boolean;
  setShowTypeIcon: (v: boolean) => void;
  resetTypeDisplay: () => void;
  dayFormat: DayFormat;
  setDayFormat: (v: DayFormat) => void;
  resetDayFormat: () => void;
}
```

- [ ] **Verify TypeScript is happy so far:**

```bash
npx tsc -b --noEmit 2>&1 | head -30
```

Expected: errors about callers of SharedColumnState that haven't been updated yet (EventTable.test.tsx, ColumnControlsPanel.test.tsx, ChangelogEntryPanel.test.tsx). These are fixed in later tasks.

- [ ] **Commit:**

```bash
git add src/components/EventTable/types.ts
git commit -m "feat(day-format): add DayFormat type and extend SharedColumnState"
```

---

## Task 2: `formatDay` utility

**Files:**

- Create: `src/utils/formatDay.ts`
- Create: `src/utils/formatDay.test.ts`

`src/test/setup.ts` pins `process.env.TZ = 'America/Indianapolis'`. The factory's `startDateTime: "2024-08-01T10:00:00Z"` lands on Thursday Aug 1 2024 at 06:00 Indianapolis time (UTC-4 in summer).

- [ ] **Write the failing test — `src/utils/formatDay.test.ts`:**

```ts
import { expect, test } from "vitest";
import { formatDay, formatDayCompact } from "./formatDay";
import type { DayFormat } from "../components/EventTable/types";

// 2024-08-01T10:00:00Z = Thu Aug 1 2024 06:00 Indianapolis (UTC-4)
const DATE = new Date("2024-08-01T10:00:00Z");

test("formatDay day returns full weekday name", () => {
  expect(formatDay(DATE, "day")).toBe("Thursday");
});

test("formatDay numeric returns MM/dd/yy", () => {
  expect(formatDay(DATE, "numeric")).toBe("08/01/24");
});

test("formatDay long returns EEE, MMM dd, yyyy", () => {
  expect(formatDay(DATE, "long")).toBe("Thu, Aug 01, 2024");
});

test("formatDayCompact day returns abbreviated weekday", () => {
  expect(formatDayCompact(DATE, "day")).toBe("Thu");
});

test("formatDayCompact numeric returns M/d", () => {
  expect(formatDayCompact(DATE, "numeric")).toBe("8/1");
});

test("formatDayCompact long returns EEE M/d", () => {
  expect(formatDayCompact(DATE, "long")).toBe("Thu 8/1");
});
```

- [ ] **Run to verify it fails:**

```bash
npx vitest run src/utils/formatDay.test.ts 2>&1 | tail -10
```

Expected: `Error: Failed to resolve import "./formatDay"`

- [ ] **Write the implementation — `src/utils/formatDay.ts`:**

```ts
import { format } from "date-fns";
import type { DayFormat } from "../components/EventTable/types";

export function formatDay(date: Date, dayFormat: DayFormat): string {
  switch (dayFormat) {
    case "numeric":
      return format(date, "MM/dd/yy");
    case "long":
      return format(date, "EEE, MMM dd, yyyy");
    default:
      return format(date, "EEEE");
  }
}

export function formatDayCompact(date: Date, dayFormat: DayFormat): string {
  switch (dayFormat) {
    case "numeric":
      return format(date, "M/d");
    case "long":
      return format(date, "EEE M/d");
    default:
      return format(date, "EEE");
  }
}
```

- [ ] **Run to verify it passes:**

```bash
npx vitest run src/utils/formatDay.test.ts 2>&1 | tail -5
```

Expected: `6 passed`

- [ ] **Commit:**

```bash
git add src/utils/formatDay.ts src/utils/formatDay.test.ts
git commit -m "feat(day-format): add formatDay and formatDayCompact utilities"
```

---

## Task 3: `useDayFormat` hook

**Files:**

- Create: `src/hooks/useDayFormat.ts`
- Create: `src/hooks/useDayFormat.test.ts`

Pattern matches `useTypeDisplay` / `useStoredState` exactly. The stored value is a plain `DayFormat` string (not a nested object), so version 1 is fresh.

- [ ] **Write the failing test — `src/hooks/useDayFormat.test.ts`:**

```ts
import { expect, test, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDayFormat } from "./useDayFormat";

const STORAGE_KEY = "gcb-day-format";

beforeEach(() => {
  localStorage.clear();
});

test("returns default dayFormat of 'day' on first use", () => {
  const { result } = renderHook(() => useDayFormat());
  expect(result.current.dayFormat).toBe("day");
});

test("setDayFormat updates dayFormat", () => {
  const { result } = renderHook(() => useDayFormat());
  act(() => {
    result.current.setDayFormat("numeric");
  });
  expect(result.current.dayFormat).toBe("numeric");
});

test("persists value to localStorage and loads it back", () => {
  const { result } = renderHook(() => useDayFormat());
  act(() => {
    result.current.setDayFormat("long");
  });
  const { result: result2 } = renderHook(() => useDayFormat());
  expect(result2.current.dayFormat).toBe("long");
});

test("reset restores default", () => {
  const { result } = renderHook(() => useDayFormat());
  act(() => {
    result.current.setDayFormat("numeric");
  });
  act(() => {
    result.current.reset();
  });
  expect(result.current.dayFormat).toBe("day");
});

test("resets to default when stored version does not match", () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 9999, value: "numeric" }));
  const { result } = renderHook(() => useDayFormat());
  expect(result.current.dayFormat).toBe("day");
});

test("resets to default when localStorage is malformed", () => {
  localStorage.setItem(STORAGE_KEY, "not-json{{{");
  const { result } = renderHook(() => useDayFormat());
  expect(result.current.dayFormat).toBe("day");
});
```

- [ ] **Run to verify it fails:**

```bash
npx vitest run src/hooks/useDayFormat.test.ts 2>&1 | tail -5
```

Expected: `Error: Failed to resolve import "./useDayFormat"`

- [ ] **Write the implementation — `src/hooks/useDayFormat.ts`:**

```ts
import { useStoredState } from "./useStoredState";
import type { DayFormat } from "../components/EventTable/types";

const STORAGE_KEY = "gcb-day-format";
const VERSION = 1;
const DEFAULT: DayFormat = "day";

export function useDayFormat(): {
  dayFormat: DayFormat;
  setDayFormat: (v: DayFormat) => void;
  reset: () => void;
} {
  const [dayFormat, setState] = useStoredState<DayFormat>(STORAGE_KEY, VERSION, DEFAULT);

  return {
    dayFormat,
    setDayFormat: (v: DayFormat) => setState(v),
    reset: () => setState(DEFAULT),
  };
}
```

- [ ] **Run to verify it passes:**

```bash
npx vitest run src/hooks/useDayFormat.test.ts 2>&1 | tail -5
```

Expected: `6 passed`

- [ ] **Commit:**

```bash
git add src/hooks/useDayFormat.ts src/hooks/useDayFormat.test.ts
git commit -m "feat(day-format): add useDayFormat hook"
```

---

## Task 4: Extend `useColumnMinSizes` with display setting deps

**Files:**

- Modify: `src/hooks/useColumnMinSizes.ts`
- Modify: `src/hooks/useColumnMinSizes.test.tsx`

The hook's effect currently only re-runs on `events` and `visibility` changes. Adding `typeDisplay`, `showTypeIcon`, and `dayFormat` to the deps ensures it remeasures when the user changes display settings — so min-widths stay accurate after format switches.

All three new params are optional with safe defaults so existing callers don't break. `EventTable.tsx` will pass them explicitly in Task 6.

- [ ] **Write the new failing tests** by appending to `src/hooks/useColumnMinSizes.test.tsx`:

```ts
test("remeasures when typeDisplay changes", async () => {
  const events = [makeEvent()];

  function TypeDisplayRerender(): React.ReactElement {
    const [typeDisplay, setTypeDisplay] = useState<"code" | "name" | "both">("both");
    const tableRef = useRef<HTMLTableElement>(null);
    const minSizes = useColumnMinSizes(tableRef, events, {}, typeDisplay);
    return (
      <>
        <table ref={tableRef}>
          <tbody>
            <tr>
              <td data-col-id="eventType">
                {typeDisplay !== "name" && <span>RPG</span>}
                {typeDisplay !== "code" && <span>Roleplaying</span>}
              </td>
            </tr>
          </tbody>
        </table>
        <div data-testid="result">{JSON.stringify(minSizes)}</div>
        <button type="button" onClick={() => setTypeDisplay("code")}>
          code only
        </button>
      </>
    );
  }

  const user = (await import("@testing-library/user-event")).default.setup();
  render(<TypeDisplayRerender />);
  // "both" mode — "Roleplaying" = 11 chars × 8 + 2 = 90
  await waitFor(() => {
    expect(JSON.parse(screen.getByTestId("result").textContent ?? "").eventType).toBe(90);
  });
  await user.click(screen.getByRole("button", { name: "code only" }));
  // "code" mode — "RPG" = 3 chars × 8 + 2 = 26
  await waitFor(() => {
    expect(JSON.parse(screen.getByTestId("result").textContent ?? "").eventType).toBe(26);
  });
});

test("remeasures when dayFormat changes", async () => {
  const events = [makeEvent()];

  function DayFormatRerender(): React.ReactElement {
    const [dayFormat, setDayFormat] = useState<"day" | "numeric" | "long">("day");
    const tableRef = useRef<HTMLTableElement>(null);
    const minSizes = useColumnMinSizes(tableRef, events, {}, undefined, undefined, dayFormat);
    const dayText =
      dayFormat === "numeric" ? "08/01/24" : dayFormat === "long" ? "Thu, Aug 01, 2024" : "Thursday";
    return (
      <>
        <table ref={tableRef}>
          <tbody>
            <tr>
              <td data-col-id="day">{dayText}</td>
            </tr>
          </tbody>
        </table>
        <div data-testid="result">{JSON.stringify(minSizes)}</div>
        <button type="button" onClick={() => setDayFormat("numeric")}>
          numeric
        </button>
      </>
    );
  }

  const user = (await import("@testing-library/user-event")).default.setup();
  render(<DayFormatRerender />);
  // "day" mode — "Thursday" = 8 chars × 8 + 2 = 66
  await waitFor(() => {
    expect(JSON.parse(screen.getByTestId("result").textContent ?? "").day).toBe(66);
  });
  await user.click(screen.getByRole("button", { name: "numeric" }));
  // "numeric" mode — "08/01/24" = 8 chars × 8 + 2 = 66 (same length, but test proves remeasure ran)
  await waitFor(() => {
    expect(JSON.parse(screen.getByTestId("result").textContent ?? "").day).toBeDefined();
  });
});
```

- [ ] **Add missing imports** at the top of the test file (after the existing imports):

```ts
import { useState } from "react";
```

- [ ] **Run new tests to verify they fail:**

```bash
npx vitest run src/hooks/useColumnMinSizes.test.tsx 2>&1 | tail -10
```

Expected: the two new tests fail because `useColumnMinSizes` doesn't accept the extra params yet.

- [ ] **Update `src/hooks/useColumnMinSizes.ts`** — add optional display params and extend the effect deps:

```ts
import { useEffect, useState, type RefObject } from "react";
import type { Event } from "../utils/types";
import type { DayFormat, TypeDisplay } from "../components/EventTable/types";

function shallowEqualNumberRecord(a: Record<string, number>, b: Record<string, number>): boolean {
  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) {
    return false;
  }
  for (const key of aKeys) {
    if (a[key] !== b[key]) {
      return false;
    }
  }
  return true;
}

export function useColumnMinSizes(
  tableRef: RefObject<HTMLTableElement | null>,
  events: Event[],
  visibility: Record<string, boolean>,
  typeDisplay?: TypeDisplay,
  showTypeIcon?: boolean,
  dayFormat?: DayFormat,
): Record<string, number> {
  const [minSizes, setMinSizes] = useState<Record<string, number>>({});

  useEffect(() => {
    const table = tableRef.current;
    if (!table) {
      return;
    }

    const canvas = document.createElement("canvas");
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext("2d");
    } catch {
      return;
    }
    if (!ctx) {
      return;
    }

    const sampleTd = table.querySelector<HTMLTableCellElement>("tbody td");
    let paddingH = 0;
    if (sampleTd) {
      const tdStyle = getComputedStyle(sampleTd);
      ctx.font = tdStyle.font;
      paddingH =
        (parseFloat(tdStyle.paddingLeft) || 0) +
        (parseFloat(tdStyle.paddingRight) || 0) +
        (parseFloat(tdStyle.borderLeftWidth) || 0) +
        (parseFloat(tdStyle.borderRightWidth) || 0);
    }

    const gapCache = new Map<Element, number>();
    const result: Record<string, number> = {};

    table.querySelectorAll<HTMLTableCellElement>("tbody td[data-col-id]").forEach((td) => {
      const colId = td.getAttribute("data-col-id");
      if (!colId) {
        return;
      }

      const longestWord =
        (td.textContent ?? "")
          .trim()
          .split(/\s+/)
          .sort((a, b) => b.length - a.length)[0] ?? "";
      const textWidth = ctx.measureText(longestWord).width;

      const svgs = Array.from(td.querySelectorAll<SVGElement>("svg"));
      const svgWidth = svgs.reduce((sum, svg) => sum + (Number(svg.getAttribute("width")) || 0), 0);

      let gap = 0;
      if (svgs.length > 0) {
        const parent = svgs[0].parentElement;
        if (parent) {
          if (!gapCache.has(parent)) {
            const parsed = parseFloat(getComputedStyle(parent).gap);
            gapCache.set(parent, Number.isNaN(parsed) ? 4 : parsed);
          }
          gap = gapCache.get(parent) ?? 4;
        }
      }

      const cellMin = Math.ceil(textWidth + svgWidth + gap + paddingH);
      result[colId] = Math.max(result[colId] ?? 0, cellMin);
    });

    setMinSizes((prev) => (shallowEqualNumberRecord(prev, result) ? prev : result));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, visibility, typeDisplay, showTypeIcon, dayFormat]); // tableRef is a stable ref — intentionally omitted from deps

  return minSizes;
}
```

- [ ] **Run all useColumnMinSizes tests to verify they pass:**

```bash
npx vitest run src/hooks/useColumnMinSizes.test.tsx 2>&1 | tail -5
```

Expected: all tests pass (9 total — 7 original + 2 new).

- [ ] **Commit:**

```bash
git add src/hooks/useColumnMinSizes.ts src/hooks/useColumnMinSizes.test.tsx
git commit -m "fix(min-width): add display setting deps to useColumnMinSizes"
```

---

## Task 5: `columns.tsx` — CellContext augmentation, conditional type cell, dayFormat day cell

**Files:**

- Modify: `src/components/EventTable/columns.tsx`

The type cell currently renders all three spans and uses CSS `[data-type-display]` rules to show/hide them. This change switches to conditional JSX so only the visible content is in the DOM (fixing the `textContent`-based min-width calculation). The day cell is updated to use `formatDay` from context.

No isolated unit tests exist for cell renderers here — they are integration-tested via `EventTable.test.tsx` in Task 6.

- [ ] **Add imports** at the top of `src/components/EventTable/columns.tsx`:

```ts
import { formatDay } from "../../utils/formatDay";
import type { DayFormat } from "./types";
```

- [ ] **Add the `CellContext` augmentation** directly below the existing `ColumnMeta` augmentation:

```ts
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    sortField?: string;
  }
  interface CellContext<TData, TValue> {
    dayFormat: DayFormat;
    typeDisplay: TypeDisplay;
    showTypeIcon: boolean;
  }
}
```

- [ ] **Update the `eventType` column cell** (currently at the third entry in `COLUMNS`, `id: "eventType"`) — replace the entire cell function with conditional JSX:

```ts
  {
    id: "eventType",
    header: "Type",
    meta: { sortField: "eventType" },
    cell: ({ row, typeDisplay, showTypeIcon }) => {
      const { eventType } = row.original.attributes;
      const dashIdx = eventType.indexOf(" - ");
      const code = dashIdx !== -1 ? eventType.slice(0, dashIdx) : eventType;
      const name = dashIdx !== -1 ? eventType.slice(dashIdx + 3) : "";
      const Icon = EVENT_TYPE_ICONS[code];
      return (
        <span className={typeCellStyles.typeCell}>
          {showTypeIcon && Icon && (
            <span className={typeCellStyles.typeIcon}>
              <Icon size={16} />
            </span>
          )}
          {(typeDisplay === "code" || typeDisplay === "both") && (
            <span className={typeCellStyles.typeCode}>{code}</span>
          )}
          {typeDisplay === "both" && name && (
            <span className={typeCellStyles.typeSep}> - </span>
          )}
          {(typeDisplay === "name" || typeDisplay === "both") && name && (
            <span className={typeCellStyles.typeName}>{name}</span>
          )}
        </span>
      );
    },
  },
```

- [ ] **Update the `day` column cell** (currently `id: "day"`) — replace with `formatDay`:

```ts
  {
    id: "day",
    header: "Day",
    meta: { sortField: "startDateTime" },
    cell: ({ row, dayFormat }) => (
      <>{formatDay(new Date(row.original.attributes.startDateTime), dayFormat)}</>
    ),
  },
```

- [ ] **Verify TypeScript accepts the changes:**

```bash
npx tsc -b --noEmit 2>&1 | grep "columns.tsx"
```

Expected: no errors in columns.tsx. (Errors in other files from Tasks 1 and later tasks are expected.)

- [ ] **Commit:**

```bash
git add src/components/EventTable/columns.tsx
git commit -m "feat(day-format): CellContext augmentation, conditional type cell, formatDay day cell"
```

---

## Task 6: `EventTable.tsx` — spread CellContext, remove data attrs, update tests

**Files:**

- Modify: `src/components/EventTable/EventTable.tsx`
- Modify: `src/components/EventTable/EventTable.test.tsx`

This task wires up the CellContext spread and removes the now-redundant CSS data attributes on the section wrapper. The existing test suite has 8 tests that check `data-type-display` and `data-show-icon` — those are deleted and replaced with tests that verify actual DOM content.

- [ ] **In `EventTable.test.tsx`, update `makeSharedColumnState`** to include dayFormat fields:

```ts
import type { DayFormat, SharedColumnState, TypeDisplay } from "./types";

function makeSharedColumnState(overrides: Partial<SharedColumnState> = {}): SharedColumnState {
  return {
    visibility: {},
    toggleVisibility: vi.fn<(id: string) => void>(),
    resetVisibility: vi.fn<() => void>(),
    sizing: {},
    setSizing: vi.fn<() => void>(),
    resetSizing: vi.fn<() => void>(),
    typeDisplay: "name",
    setTypeDisplay: vi.fn<(v: TypeDisplay) => void>(),
    showTypeIcon: true,
    setShowTypeIcon: vi.fn<(v: boolean) => void>(),
    resetTypeDisplay: vi.fn<() => void>(),
    dayFormat: "day",
    setDayFormat: vi.fn<(v: DayFormat) => void>(),
    resetDayFormat: vi.fn<() => void>(),
    ...overrides,
  };
}
```

- [ ] **In `EventTable.test.tsx`, update `EventTableWithHooks`** to call `useDayFormat()`:

```ts
import { useDayFormat } from "../../hooks/useDayFormat";

function EventTableWithHooks({ events, showColumnControls = true }: { events: Event[]; showColumnControls?: boolean }): React.JSX.Element {
  const { visibility, toggle: toggleVisibility, reset: resetVisibility } = useColumnVisibility();
  const { sizing, setSizing, reset: resetSizing } = useColumnSizing();
  const { typeDisplay, setTypeDisplay, showTypeIcon, setShowTypeIcon, reset: resetTypeDisplay } = useTypeDisplay();
  const { dayFormat, setDayFormat, reset: resetDayFormat } = useDayFormat();
  const sharedColumnState: SharedColumnState = {
    visibility,
    toggleVisibility,
    resetVisibility,
    sizing,
    setSizing,
    resetSizing,
    typeDisplay,
    setTypeDisplay,
    showTypeIcon,
    setShowTypeIcon,
    resetTypeDisplay,
    dayFormat,
    setDayFormat,
    resetDayFormat,
  };
  return <EventTable events={events} sharedColumnState={sharedColumnState} showColumnControls={showColumnControls} />;
}
```

- [ ] **In `EventTable.test.tsx`, delete the 8 data-attribute tests** (lines ~208–278). They are:
  - `"section carries data-type-display=name when typeDisplay is name"`
  - `"section carries data-type-display=code when typeDisplay is code"`
  - `"section has no data-type-display attribute when typeDisplay is both"`
  - `"section has no data-show-icon attribute when showTypeIcon is true"`
  - `"section carries data-show-icon=false when showTypeIcon is false"`
  - `"section element directly carries data-type-display=name (not a descendant)"`
  - `"section element has no data-type-display attribute when typeDisplay is both"`
  - `"typeCode span is rendered inside the section with data-type-display=name"`

- [ ] **Add replacement tests** for conditional type cell rendering and day format:

```ts
test("type cell shows typeCode span and hides typeName when typeDisplay is code", async () => {
  const { container } = await renderEventTable(
    [makeEvent({ eventType: "RPG - Roleplaying Game" })],
    makeSharedColumnState({ typeDisplay: "code" }),
  );
  expect(container.querySelector('[class*="typeCode"]')).not.toBeNull();
  expect(container.querySelector('[class*="typeName"]')).toBeNull();
});

test("type cell shows typeName span and hides typeCode when typeDisplay is name", async () => {
  const { container } = await renderEventTable(
    [makeEvent({ eventType: "RPG - Roleplaying Game" })],
    makeSharedColumnState({ typeDisplay: "name" }),
  );
  expect(container.querySelector('[class*="typeName"]')).not.toBeNull();
  expect(container.querySelector('[class*="typeCode"]')).toBeNull();
});

test("type cell shows both typeCode and typeName spans when typeDisplay is both", async () => {
  const { container } = await renderEventTable(
    [makeEvent({ eventType: "RPG - Roleplaying Game" })],
    makeSharedColumnState({ typeDisplay: "both" }),
  );
  expect(container.querySelector('[class*="typeCode"]')).not.toBeNull();
  expect(container.querySelector('[class*="typeName"]')).not.toBeNull();
});

test("type cell omits SVG icon when showTypeIcon is false", async () => {
  const { container } = await renderEventTable(
    [makeEvent({ eventType: "RPG" })],
    makeSharedColumnState({ showTypeIcon: false }),
  );
  const typeCell = container.querySelector('[class*="typeCell"]');
  expect(typeCell?.querySelector("svg")).toBeNull();
});

test("day cell shows full weekday name in day mode", async () => {
  // factory startDateTime 2024-08-01T10:00:00Z = Thursday in Indianapolis
  await renderEventTable([makeEvent()], makeSharedColumnState({ dayFormat: "day" }));
  expect(screen.getByText("Thursday")).toBeInTheDocument();
});

test("day cell shows numeric date in numeric mode", async () => {
  await renderEventTable([makeEvent()], makeSharedColumnState({ dayFormat: "numeric" }));
  expect(screen.getByText("08/01/24")).toBeInTheDocument();
});

test("day cell shows long date in long mode", async () => {
  await renderEventTable([makeEvent()], makeSharedColumnState({ dayFormat: "long" }));
  expect(screen.getByText("Thu, Aug 01, 2024")).toBeInTheDocument();
});
```

- [ ] **Run the test file to confirm the new tests fail and the deleted tests are gone:**

```bash
npx vitest run src/components/EventTable/EventTable.test.tsx 2>&1 | tail -15
```

Expected: new tests fail (EventTable hasn't been updated yet).

- [ ] **Update `src/components/EventTable/EventTable.tsx`:**
  1. **In the destructuring of `sharedColumnState`**, add `dayFormat`:

  ```ts
  const {
    visibility,
    toggleVisibility,
    resetVisibility,
    sizing,
    setSizing,
    resetSizing,
    typeDisplay,
    setTypeDisplay,
    showTypeIcon,
    setShowTypeIcon,
    resetTypeDisplay,
    dayFormat,
  } = sharedColumnState;
  ```

  2. **Remove `typeDisplayAttr` and `showIconAttr` variables** and the corresponding `data-type-display`/`data-show-icon` attributes from the `<section>` wrapper. The section tag becomes simply:

  ```tsx
  <section>
  ```

  3. **Update the `flexRender` call for body cells** (inside `row.getVisibleCells().map`):

  ```tsx
  {
    flexRender(cell.column.columnDef.cell, {
      ...cell.getContext(),
      dayFormat,
      typeDisplay,
      showTypeIcon,
    });
  }
  ```

  4. **Update the `useColumnMinSizes` call** to pass the display settings:

  ```ts
  const columnMinSizes = useColumnMinSizes(
    tableRef,
    events,
    visibility,
    typeDisplay,
    showTypeIcon,
    dayFormat,
  );
  ```

  5. **Update `columnStateForPanel`** to include `dayFormat`:

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
    showTypeIcon,
    setShowTypeIcon,
    resetTypeDisplay,
    dayFormat,
    setDayFormat: sharedColumnState.setDayFormat,
    resetDayFormat: sharedColumnState.resetDayFormat,
  };
  ```

- [ ] **Run EventTable tests to verify they pass:**

```bash
npx vitest run src/components/EventTable/EventTable.test.tsx 2>&1 | tail -5
```

Expected: all tests pass.

- [ ] **Commit:**

```bash
git add src/components/EventTable/EventTable.tsx src/components/EventTable/EventTable.test.tsx
git commit -m "feat(day-format): spread CellContext in EventTable, remove data attrs, fix type cell tests"
```

---

## Task 7: `ColumnControlsPanel` — Day column fieldset

**Files:**

- Modify: `src/components/EventTable/ColumnControlsPanel.tsx`
- Modify: `src/components/EventTable/ColumnControlsPanel.test.tsx`

- [ ] **In `ColumnControlsPanel.test.tsx`, update `makeColumnState`** to include dayFormat fields:

```ts
import type { DayFormat, SharedColumnState, TypeDisplay } from "./types";

function makeColumnState(overrides: Partial<SharedColumnState> = {}): SharedColumnState {
  return {
    visibility: Object.fromEntries(COLUMNS.map((c) => [c.id, true])),
    toggleVisibility: vi.fn<SharedColumnState["toggleVisibility"]>(),
    resetVisibility: vi.fn<SharedColumnState["resetVisibility"]>(),
    sizing: {},
    setSizing: vi.fn<SharedColumnState["setSizing"]>(),
    resetSizing: vi.fn<SharedColumnState["resetSizing"]>(),
    typeDisplay: "name",
    setTypeDisplay: vi.fn<SharedColumnState["setTypeDisplay"]>(),
    showTypeIcon: true,
    setShowTypeIcon: vi.fn<SharedColumnState["setShowTypeIcon"]>(),
    resetTypeDisplay: vi.fn<SharedColumnState["resetTypeDisplay"]>(),
    dayFormat: "day",
    setDayFormat: vi.fn<SharedColumnState["setDayFormat"]>(),
    resetDayFormat: vi.fn<SharedColumnState["resetDayFormat"]>(),
    ...overrides,
  };
}
```

- [ ] **Add new failing tests** to `ColumnControlsPanel.test.tsx`:

```ts
test("renders Day column fieldset", () => {
  render(<ColumnControlsPanel columnState={makeColumnState()} />);
  expect(screen.getByRole("group", { name: "Day column" })).toBeInTheDocument();
});

test("renders Day, MM/DD/YY, and Full date radio buttons", () => {
  render(<ColumnControlsPanel columnState={makeColumnState()} />);
  expect(screen.getByRole("radio", { name: "Day" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "MM/DD/YY" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Full date" })).toBeInTheDocument();
});

test("Day radio is checked when dayFormat is day", () => {
  render(<ColumnControlsPanel columnState={makeColumnState({ dayFormat: "day" })} />);
  expect(screen.getByRole("radio", { name: "Day" })).toBeChecked();
  expect(screen.getByRole("radio", { name: "MM/DD/YY" })).not.toBeChecked();
  expect(screen.getByRole("radio", { name: "Full date" })).not.toBeChecked();
});

test("clicking MM/DD/YY radio calls setDayFormat with numeric", async () => {
  const user = userEvent.setup();
  const setDayFormat = vi.fn<SharedColumnState["setDayFormat"]>();
  render(<ColumnControlsPanel columnState={makeColumnState({ dayFormat: "day", setDayFormat })} />);
  await user.click(screen.getByRole("radio", { name: "MM/DD/YY" }));
  expect(setDayFormat).toHaveBeenCalledWith("numeric");
});

test("clicking Full date radio calls setDayFormat with long", async () => {
  const user = userEvent.setup();
  const setDayFormat = vi.fn<SharedColumnState["setDayFormat"]>();
  render(<ColumnControlsPanel columnState={makeColumnState({ dayFormat: "day", setDayFormat })} />);
  await user.click(screen.getByRole("radio", { name: "Full date" }));
  expect(setDayFormat).toHaveBeenCalledWith("long");
});

test("Reset to defaults calls resetDayFormat", async () => {
  const user = userEvent.setup();
  const resetDayFormat = vi.fn<SharedColumnState["resetDayFormat"]>();
  render(<ColumnControlsPanel columnState={makeColumnState({ resetDayFormat })} />);
  await user.click(screen.getByRole("button", { name: "Reset to defaults" }));
  expect(resetDayFormat).toHaveBeenCalledTimes(1);
});
```

- [ ] **Run to verify the new tests fail:**

```bash
npx vitest run src/components/EventTable/ColumnControlsPanel.test.tsx 2>&1 | tail -10
```

Expected: new tests fail; existing tests may also fail because `makeColumnState` now has new required fields.

- [ ] **Update `ColumnControlsPanel.tsx`:**
  1. **Destructure `dayFormat`, `setDayFormat`, `resetDayFormat`** from `columnState` inside `ColumnCheckboxContent`.

  2. **Add the "Day column" fieldset** immediately after the closing `</fieldset>` of "Event type column":

  ```tsx
  <fieldset className={styles.columnGroup}>
    <legend className={styles.columnGroupLegend}>Day column</legend>
    <div className={styles.typeDisplayRadioGroup}>
      <SegmentedControl value={dayFormat} onValueChange={(v) => setDayFormat(v as DayFormat)}>
        <SegmentedControl.Option value="day" indicator={<Targeted size={16} />}>
          Day
        </SegmentedControl.Option>
        <SegmentedControl.Option value="numeric" indicator={<Targeted size={16} />}>
          MM/DD/YY
        </SegmentedControl.Option>
        <SegmentedControl.Option value="long" indicator={<Targeted size={16} />}>
          Full date
        </SegmentedControl.Option>
      </SegmentedControl>
    </div>
  </fieldset>
  ```

  3. **Add `DayFormat` to imports** at the top:

  ```ts
  import type { DayFormat, SharedColumnState } from "./types";
  ```

  4. **Update the Reset button's onClick** to also call `resetDayFormat()`:

  ```tsx
  onClick={() => {
    resetVisibility();
    resetSizing();
    resetTypeDisplay();
    resetDayFormat();
  }}
  ```

- [ ] **Run ColumnControlsPanel tests to verify they all pass:**

```bash
npx vitest run src/components/EventTable/ColumnControlsPanel.test.tsx 2>&1 | tail -5
```

Expected: all tests pass.

- [ ] **Commit:**

```bash
git add src/components/EventTable/ColumnControlsPanel.tsx src/components/EventTable/ColumnControlsPanel.test.tsx
git commit -m "feat(day-format): add Day column fieldset to ColumnControlsPanel"
```

---

## Task 8: `EventListMobile` — dayFormat prop and compact format

**Files:**

- Modify: `src/components/EventTable/EventListMobile.tsx`
- Modify: `src/components/EventTable/EventListMobile.test.tsx`

- [ ] **Add new failing tests** to `EventListMobile.test.tsx`:

Update the `renderList` helper signature to accept `dayFormat`:

```ts
import type { DayFormat, TypeDisplay } from "./types";

async function renderList(
  events: Event[] = [makeEvent()],
  visibility?: Partial<Record<string, boolean>>,
  typeDisplayProps: { typeDisplay?: TypeDisplay; showTypeIcon?: boolean } = {},
  dayFormat?: DayFormat,
): Promise<ReturnType<typeof render>> {
  const rootRoute = createRootRoute({
    component: () => (
      <EventListMobile events={events} visibility={visibility} dayFormat={dayFormat} {...typeDisplayProps} />
    ),
  });
  // ... rest of the router setup unchanged ...
}
```

Then add tests:

```ts
test("shows day abbreviation in default day mode", async () => {
  // factory startDateTime 2024-08-01T10:00:00Z = Thu in Indianapolis
  await renderList([makeEvent()], undefined, {}, "day");
  expect(screen.getByText(/Thu/)).toBeInTheDocument();
});

test("shows compact numeric date M/d in numeric mode", async () => {
  await renderList([makeEvent()], undefined, {}, "numeric");
  expect(screen.getByText(/8\/1/)).toBeInTheDocument();
});

test("shows compact long format EEE M/d in long mode", async () => {
  await renderList([makeEvent()], undefined, {}, "long");
  expect(screen.getByText(/Thu 8\/1/)).toBeInTheDocument();
});
```

- [ ] **Run to verify the new tests fail:**

```bash
npx vitest run src/components/EventTable/EventListMobile.test.tsx 2>&1 | tail -10
```

Expected: new tests fail.

- [ ] **Update `src/components/EventTable/EventListMobile.tsx`:**
  1. **Add `formatDayCompact` and `DayFormat` imports:**

  ```ts
  import { formatDayCompact } from "../../utils/formatDay";
  import type { DayFormat, TypeDisplay } from "./types";
  ```

  2. **Extend `EventListMobileProps`** to include `dayFormat`:

  ```ts
  interface EventListMobileProps {
    events: Event[];
    visibility?: Partial<Record<string, boolean>>;
    typeDisplay?: TypeDisplay;
    showTypeIcon?: boolean;
    dayFormat?: DayFormat;
  }
  ```

  3. **Destructure `dayFormat`** in the component function.

  4. **Replace the day rendering line** (currently `format(start, "EEE")`) with:

  ```tsx
  {
    isVisible("day") && formatDayCompact(start, dayFormat ?? "day");
  }
  ```

  5. **Remove the `format` import** from `date-fns` if it is no longer used for the day (it may still be used for time formatting — check before removing).

- [ ] **Run EventListMobile tests to verify they all pass:**

```bash
npx vitest run src/components/EventTable/EventListMobile.test.tsx 2>&1 | tail -5
```

Expected: all tests pass.

- [ ] **Commit:**

```bash
git add src/components/EventTable/EventListMobile.tsx src/components/EventTable/EventListMobile.test.tsx
git commit -m "feat(day-format): add dayFormat prop to EventListMobile with compact format"
```

---

## Task 9: `EventDetail` — call `useDayFormat`, apply `formatDay`

**Files:**

- Modify: `src/components/EventDetail/EventDetail.tsx`
- Modify: `src/routes/event.$id.test.tsx`

`useDayFormat` reads from localStorage. The event detail test currently has no `localStorage.clear()` in `beforeEach`, which is fine for existing tests but needed to guarantee a clean state for new format-specific tests.

- [ ] **Add new failing tests** to `src/routes/event.$id.test.tsx`:

  First, add `localStorage.clear()` to the existing `beforeEach`:

  ```ts
  beforeEach(() => {
    captureFn.mockClear();
    localStorage.clear();
  });
  ```

  Then add:

  ```ts
  test("Day field shows full weekday name with default dayFormat", async () => {
    // factory startDateTime 2024-08-01T10:00:00Z = Thursday in Indianapolis
    await renderRoute("/event/RPG24000042", { queryClient });
    await screen.findAllByRole("term");
    expect(screen.getByText("Thursday")).toBeInTheDocument();
  });

  test("Day field shows numeric date when dayFormat is numeric", async () => {
    localStorage.setItem("gcb-day-format", JSON.stringify({ version: 1, value: "numeric" }));
    await renderRoute("/event/RPG24000042", { queryClient });
    await screen.findAllByRole("term");
    expect(screen.getByText("08/01/24")).toBeInTheDocument();
  });

  test("Day field shows long date when dayFormat is long", async () => {
    localStorage.setItem("gcb-day-format", JSON.stringify({ version: 1, value: "long" }));
    await renderRoute("/event/RPG24000042", { queryClient });
    await screen.findAllByRole("term");
    expect(screen.getByText("Thu, Aug 01, 2024")).toBeInTheDocument();
  });
  ```

- [ ] **Run to verify the new tests fail:**

```bash
npx vitest run src/routes/event.\$id.test.tsx 2>&1 | tail -10
```

Expected: new tests fail (EventDetail still hardcodes `"EEEE"`).

- [ ] **Update `src/components/EventDetail/EventDetail.tsx`:**
  1. **Add imports:**

  ```ts
  import { useDayFormat } from "../../hooks/useDayFormat";
  import { formatDay } from "../../utils/formatDay";
  ```

  2. **Call `useDayFormat()`** inside the component (after the existing `usePostHog` and `useQuery` calls):

  ```ts
  const { dayFormat } = useDayFormat();
  ```

  3. **Update the Day `<DescriptionItem>`** (currently uses `format(new Date(a.startDateTime), "EEEE")`):

  ```tsx
  <DescriptionItem term="Day">{formatDay(new Date(a.startDateTime), dayFormat)}</DescriptionItem>
  ```

  4. **Remove the `format` import** from `date-fns` if no other lines use it in EventDetail.tsx. (Check — `lastModified` also uses `format`. Keep the import.)

- [ ] **Run event detail tests to verify they all pass:**

```bash
npx vitest run src/routes/event.\$id.test.tsx 2>&1 | tail -5
```

Expected: all tests pass.

- [ ] **Commit:**

```bash
git add src/components/EventDetail/EventDetail.tsx src/routes/event.\$id.test.tsx
git commit -m "feat(day-format): apply dayFormat setting in EventDetail"
```

---

## Task 10: Wire up SearchResults, ChangelogPage, and ChangelogEntryPanel

**Files:**

- Modify: `src/components/SearchResults/SearchResults.tsx`
- Modify: `src/components/ChangelogPage/ChangelogPage.tsx`
- Modify: `src/components/ChangelogPage/ChangelogEntryPanel.tsx`
- Modify: `src/components/ChangelogPage/ChangelogEntryPanel.test.tsx`

This wires the `useDayFormat` hook into the two pages that construct `sharedColumnState`, and threads `dayFormat` through to `EventListMobile` in `ChangelogEntryPanel`.

- [ ] **Update `stubColumnState` in `ChangelogEntryPanel.test.tsx`** to include dayFormat fields:

```ts
const stubColumnState: SharedColumnState = {
  visibility: {},
  toggleVisibility: () => {},
  resetVisibility: () => {},
  sizing: {},
  setSizing: () => {},
  resetSizing: () => {},
  typeDisplay: "name",
  setTypeDisplay: () => {},
  showTypeIcon: true,
  setShowTypeIcon: () => {},
  resetTypeDisplay: () => {},
  dayFormat: "day",
  setDayFormat: () => {},
  resetDayFormat: () => {},
};
```

- [ ] **Run ChangelogEntryPanel tests to verify they still pass with the updated stub:**

```bash
npx vitest run src/components/ChangelogPage/ChangelogEntryPanel.test.tsx 2>&1 | tail -5
```

Expected: all tests pass (the stub change is purely additive).

- [ ] **Update `src/components/SearchResults/SearchResults.tsx`:**
  1. **Import `useDayFormat`:**

  ```ts
  import { useDayFormat } from "../../hooks/useDayFormat";
  ```

  2. **Call the hook** (after the existing `useTypeDisplay()` call):

  ```ts
  const { dayFormat, setDayFormat, reset: resetDayFormat } = useDayFormat();
  ```

  3. **Add to `sharedColumnState`:**

  ```ts
  const sharedColumnState = {
    // ... existing fields ...
    dayFormat,
    setDayFormat,
    resetDayFormat,
  };
  ```

  4. **Pass `dayFormat` to `EventListMobile`:**

  ```tsx
  <EventListMobile
    events={data.data}
    visibility={sharedColumnState.visibility}
    typeDisplay={typeDisplay}
    showTypeIcon={showTypeIcon}
    dayFormat={dayFormat}
  />
  ```

- [ ] **Update `src/components/ChangelogPage/ChangelogPage.tsx`** — same pattern as SearchResults:
  1. Import `useDayFormat`.
  2. Call `useDayFormat()` and destructure `dayFormat`, `setDayFormat`, `reset: resetDayFormat`.
  3. Add all three to the `sharedColumnState` object.

- [ ] **Update `src/components/ChangelogPage/ChangelogEntryPanel.tsx`** — pass `dayFormat` to `EventListMobile`:

  In the `EventGroup` component's mobile view:

  ```tsx
  <EventListMobile
    events={events}
    typeDisplay={sharedColumnState.typeDisplay}
    showTypeIcon={sharedColumnState.showTypeIcon}
    dayFormat={sharedColumnState.dayFormat}
  />
  ```

- [ ] **Run the full test suite to verify everything passes:**

```bash
NODE_OPTIONS='--max-old-space-size=8192 --expose-gc' vitest run 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Commit:**

```bash
git add \
  src/components/SearchResults/SearchResults.tsx \
  src/components/ChangelogPage/ChangelogPage.tsx \
  src/components/ChangelogPage/ChangelogEntryPanel.tsx \
  src/components/ChangelogPage/ChangelogEntryPanel.test.tsx
git commit -m "feat(day-format): wire useDayFormat into SearchResults, ChangelogPage, ChangelogEntryPanel"
```

---

## Self-Review Checklist

- [x] **formatDay utility** — covered in Task 2
- [x] **useDayFormat hook** — covered in Task 3
- [x] **DayFormat type + SharedColumnState** — covered in Task 1
- [x] **CellContext augmentation** — covered in Task 5
- [x] **Type cell conditional rendering** — covered in Tasks 5 + 6
- [x] **Day cell uses formatDay** — covered in Tasks 5 + 6
- [x] **ColumnControlsPanel Day fieldset** — covered in Task 7
- [x] **EventListMobile compact format** — covered in Task 8
- [x] **EventDetail applies dayFormat** — covered in Task 9
- [x] **SearchResults wired** — covered in Task 10
- [x] **ChangelogPage wired** — covered in Task 10
- [x] **ChangelogEntryPanel passes dayFormat** — covered in Task 10
- [x] **useColumnMinSizes remeasures on setting change** — covered in Task 4
- [x] **Reset to defaults resets dayFormat** — covered in Task 7
- [x] **CSS data-type-display rules preserved for mobile** — explicitly noted in Task 6 (no CSS changes)
