# Timezone Display Fix + Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix Start/End/Day columns to display in Indianapolis time by default, and add a "Time columns" toggle (Indianapolis/Local) to the FormatDrawer and column-header popovers.

**Architecture:** A new `TimeZone = "indy" | "local"` preference is stored via `useTimeZone` (mirrors `useDayFormat`), threaded through `SharedColumnState` and `CellContext`, and applied at call sites by replacing `new Date(value)` with `toDisplayDate(value, timeZone)` — a new exported helper in `formatDay.ts` that returns a `TZDate` for `"indy"` or a plain `Date` for `"local"`. `EventDetail` calls `useTimeZone()` directly. UI surface is `TimeFormatControls` in `FormatDrawer.tsx`, also wired into `getFormatControls` in `EventTable.tsx` for the `startDateTime` and `endDateTime` column-header action popovers.

**Tech Stack:** React, TypeScript, TanStack Table, date-fns v4, @date-fns/tz (new), vitest, @testing-library/react

---

## File Map

| File                                                 | Role                                                                                |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `src/components/EventTable/types.ts`                 | Add `TimeZone` type; extend `SharedColumnState`                                     |
| `src/hooks/useTimeZone.ts`                           | **new** — stored preference hook, mirrors `useDayFormat`                            |
| `src/hooks/useTimeZone.test.ts`                      | **new** — unit tests for the hook                                                   |
| `src/hooks/useSharedColumnState.ts`                  | Wire in `useTimeZone`                                                               |
| `src/utils/formatDay.ts`                             | Export `toDisplayDate` helper                                                       |
| `src/utils/formatDay.test.ts`                        | Add tests for `toDisplayDate`                                                       |
| `src/components/EventTable/columns.tsx`              | Extend `CellContext` with `timeZone`; update day/start/end cells                    |
| `src/components/EventTable/EventTable.tsx`           | Pass `timeZone` in cell context; wire `TimeFormatControls` into `getFormatControls` |
| `src/components/EventTable/EventListMobile.tsx`      | Add `timeZone` prop; use `toDisplayDate`                                            |
| `src/components/EventTable/EventListMobile.test.tsx` | Update `renderList` helper; add timezone spot-check                                 |
| `src/components/EventTable/FormatDrawer.tsx`         | Add `TimeFormatControls`; wire into `FormatDrawer`                                  |
| `src/components/EventTable/FormatDrawer.test.tsx`    | Update `makeColumnState`; add tests for new control                                 |
| `src/components/EventDetail/EventDetail.tsx`         | Call `useTimeZone()`; use `toDisplayDate`                                           |
| `src/components/SearchResults/SearchResults.tsx`     | Pass `timeZone` from `sharedColumnState` to `EventListMobile`                       |

---

## Task 1: Create worktree

- [ ] **Create the worktree as a sibling of the repo root**

```bash
git worktree add ../Gen-Con-Buddy-timezone-fix -b fix/timezone-display
```

- [ ] **Enter the worktree and verify the branch**

```bash
cd ../Gen-Con-Buddy-timezone-fix
git branch
```

Expected: `* fix/timezone-display`

---

## Task 2: Install @date-fns/tz

**Files:**

- Modify: `package.json` (automatic via npm)

- [ ] **Install the package**

```bash
npm install @date-fns/tz
```

- [ ] **Verify it appears in package.json dependencies**

```bash
grep "@date-fns/tz" package.json
```

Expected output: a line like `"@date-fns/tz": "^1.x.x"`

- [ ] **Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @date-fns/tz"
```

---

## Task 3: Add TimeZone type and extend SharedColumnState

**Files:**

- Modify: `src/components/EventTable/types.ts`

- [ ] **Add `TimeZone` and extend `SharedColumnState`**

Replace the entire file with:

```ts
import type { OnChangeFn, ColumnSizingState } from "@tanstack/react-table";

export type TypeDisplay = "code" | "name" | "both";
export type DayFormat = "day" | "numeric" | "long";
export type TimeZone = "indy" | "local";

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
  timeZone: TimeZone;
  setTimeZone: (v: TimeZone) => void;
  resetTimeZone: () => void;
}
```

- [ ] **Run typecheck — expect errors because useSharedColumnState doesn't implement the new fields yet**

```bash
npm run typecheck 2>&1 | grep -c "error TS"
```

Expected: non-zero (errors are expected at this stage)

- [ ] **Commit**

```bash
git add src/components/EventTable/types.ts
git commit -m "feat: add TimeZone type and extend SharedColumnState"
```

---

## Task 4: Create useTimeZone hook (TDD)

**Files:**

- Create: `src/hooks/useTimeZone.test.ts`
- Create: `src/hooks/useTimeZone.ts`

- [ ] **Write the failing tests first**

Create `src/hooks/useTimeZone.test.ts`:

```ts
import { expect, test, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTimeZone } from "./useTimeZone";

const STORAGE_KEY = "gcb-time-zone";

beforeEach(() => {
  localStorage.clear();
});

test("returns default timeZone of 'indy' on first use", () => {
  const { result } = renderHook(() => useTimeZone());
  expect(result.current.timeZone).toBe("indy");
});

test("setTimeZone updates timeZone", () => {
  const { result } = renderHook(() => useTimeZone());
  act(() => {
    result.current.setTimeZone("local");
  });
  expect(result.current.timeZone).toBe("local");
});

test("persists value to localStorage and loads it back", () => {
  const { result } = renderHook(() => useTimeZone());
  act(() => {
    result.current.setTimeZone("local");
  });
  const { result: result2 } = renderHook(() => useTimeZone());
  expect(result2.current.timeZone).toBe("local");
});

test("reset restores default", () => {
  const { result } = renderHook(() => useTimeZone());
  act(() => {
    result.current.setTimeZone("local");
  });
  act(() => {
    result.current.reset();
  });
  expect(result.current.timeZone).toBe("indy");
});

test("resets to default when stored version does not match", () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 9999, value: "local" }));
  const { result } = renderHook(() => useTimeZone());
  expect(result.current.timeZone).toBe("indy");
});

test("resets to default when localStorage is malformed", () => {
  localStorage.setItem(STORAGE_KEY, "not-json{{{");
  const { result } = renderHook(() => useTimeZone());
  expect(result.current.timeZone).toBe("indy");
});
```

- [ ] **Run the tests to confirm they fail**

```bash
npx vitest run src/hooks/useTimeZone.test.ts
```

Expected: FAIL — `useTimeZone` is not defined

- [ ] **Implement the hook**

Create `src/hooks/useTimeZone.ts`:

```ts
import { useStoredState } from "./useStoredState";
import type { TimeZone } from "../components/EventTable/types";

const STORAGE_KEY = "gcb-time-zone";
const VERSION = 1;
const DEFAULT: TimeZone = "indy";

export function useTimeZone(): {
  timeZone: TimeZone;
  setTimeZone: (v: TimeZone) => void;
  reset: () => void;
} {
  const [timeZone, setState] = useStoredState<TimeZone>(STORAGE_KEY, VERSION, DEFAULT);

  return {
    timeZone,
    setTimeZone: (v: TimeZone) => setState(v),
    reset: () => setState(DEFAULT),
  };
}
```

- [ ] **Run the tests — all should pass**

```bash
npx vitest run src/hooks/useTimeZone.test.ts
```

Expected: all 6 tests PASS

- [ ] **Commit**

```bash
git add src/hooks/useTimeZone.ts src/hooks/useTimeZone.test.ts
git commit -m "feat: add useTimeZone hook"
```

---

## Task 5: Wire useTimeZone into useSharedColumnState

**Files:**

- Modify: `src/hooks/useSharedColumnState.ts`

- [ ] **Update useSharedColumnState to include the new fields**

Replace the entire file with:

```ts
import { useColumnVisibility } from "./useColumnVisibility";
import { useColumnSizing } from "./useColumnSizing";
import { useTypeDisplay } from "./useTypeDisplay";
import { useDayFormat } from "./useDayFormat";
import { useTimeZone } from "./useTimeZone";
import type { SharedColumnState } from "../components/EventTable/types";

export function useSharedColumnState(): SharedColumnState {
  const { visibility, toggle: toggleVisibility, reset: resetVisibility } = useColumnVisibility();
  const { sizing, setSizing, reset: resetSizing } = useColumnSizing();
  const {
    typeDisplay,
    setTypeDisplay,
    showTypeIcon,
    setShowTypeIcon,
    reset: resetTypeDisplay,
  } = useTypeDisplay();
  const { dayFormat, setDayFormat, reset: resetDayFormat } = useDayFormat();
  const { timeZone, setTimeZone, reset: resetTimeZone } = useTimeZone();
  return {
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
    timeZone,
    setTimeZone,
    resetTimeZone,
  };
}
```

- [ ] **Run typecheck — errors should decrease (SharedColumnState is now satisfied)**

```bash
npm run typecheck 2>&1 | grep "error TS" | head -10
```

Expected: errors from FormatDrawer.test.tsx (makeColumnState missing new fields) and EventTable.tsx (cell context missing timeZone) — those are fixed in later tasks

- [ ] **Commit**

```bash
git add src/hooks/useSharedColumnState.ts
git commit -m "feat: wire useTimeZone into useSharedColumnState"
```

---

## Task 6: Add toDisplayDate to formatDay.ts (TDD)

**Files:**

- Modify: `src/utils/formatDay.ts`
- Modify: `src/utils/formatDay.test.ts`

- [ ] **Add the failing tests to formatDay.test.ts**

Append to the existing file (keep all existing tests — they continue to pass unchanged):

```ts
import { toDisplayDate } from "./formatDay";
import type { TimeZone } from "../components/EventTable/types";

// toDisplayDate tests
// The test suite pins TZ=America/Indianapolis (see src/test/setup.ts), so "indy" and "local"
// both resolve to Indianapolis time in this environment. The TZDate approach used for "indy"
// is what ensures correctness for UTC+ users in production.

// "2024-08-01T10:00:00-04:00" is explicitly 10am Indianapolis time.
const INDY_10AM = "2024-08-01T10:00:00-04:00";

test('toDisplayDate "indy" formats the explicit Indianapolis offset to 10:00', () => {
  const d = toDisplayDate(INDY_10AM, "indy");
  expect(format(d, "HH:mm")).toBe("10:00");
});

test('toDisplayDate "local" formats the explicit Indianapolis offset to 10:00 (TZ pinned)', () => {
  const d = toDisplayDate(INDY_10AM, "local");
  expect(format(d, "HH:mm")).toBe("10:00");
});

test('toDisplayDate "indy" assigns the correct Indianapolis day for near-midnight UTC', () => {
  // "2024-08-02T02:00:00Z" = 10pm Indianapolis Aug 1 (UTC-4)
  const d = toDisplayDate("2024-08-02T02:00:00Z", "indy");
  expect(format(d, "yyyy-MM-dd")).toBe("2024-08-01");
});

test('toDisplayDate "indy" works with formatDay', () => {
  const d = toDisplayDate(INDY_10AM, "indy");
  expect(formatDay(d, "day")).toBe("Thursday");
});
```

Note: the import for `format` and `formatDay` are already at the top of the test file. `toDisplayDate` and `TimeZone` need to be added to the import lines. The existing import line is:

```ts
import { expect, test } from "vitest";
import { formatDay, formatDayCompact } from "./formatDay";
```

Update it to:

```ts
import { expect, test } from "vitest";
import { format } from "date-fns";
import { formatDay, formatDayCompact, toDisplayDate } from "./formatDay";
```

- [ ] **Run only the new tests to confirm they fail**

```bash
npx vitest run src/utils/formatDay.test.ts 2>&1 | tail -20
```

Expected: FAIL — `toDisplayDate is not a function` (or not exported)

- [ ] **Implement toDisplayDate in formatDay.ts**

Add to the top of `src/utils/formatDay.ts` (after the existing imports):

```ts
import { TZDate } from "@date-fns/tz";
import type { TimeZone } from "../components/EventTable/types";

export function toDisplayDate(value: string, timeZone: TimeZone): Date {
  return timeZone === "indy" ? new TZDate(value, "America/Indiana/Indianapolis") : new Date(value);
}
```

The full file should look like:

```ts
import { format } from "date-fns";
import { TZDate } from "@date-fns/tz";
import type { DayFormat } from "../components/EventTable/types";
import type { TimeZone } from "../components/EventTable/types";

export function toDisplayDate(value: string, timeZone: TimeZone): Date {
  return timeZone === "indy" ? new TZDate(value, "America/Indiana/Indianapolis") : new Date(value);
}

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

- [ ] **Run all formatDay tests — all should pass**

```bash
npx vitest run src/utils/formatDay.test.ts
```

Expected: all 10 tests PASS (6 existing + 4 new)

- [ ] **Commit**

```bash
git add src/utils/formatDay.ts src/utils/formatDay.test.ts
git commit -m "feat: add toDisplayDate helper to formatDay"
```

---

## Task 7: Update columns.tsx — extend CellContext and fix time/day cells

**Files:**

- Modify: `src/components/EventTable/columns.tsx`

- [ ] **Update the module augmentation to add `timeZone`, import `TimeZone`, and import `toDisplayDate`**

Update the top of `src/components/EventTable/columns.tsx`. The existing imports are:

```ts
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import { EXP } from "../../utils/enums";
import type { Event } from "../../utils/types";
import { EVENT_TYPE_ICONS } from "../../ui/icons/eventTypeIcons";
import { Chip } from "../../ui/Chip/Chip";
import styles from "./columns.module.css";
import typeCellStyles from "./typeCell.module.css";
import { formatDay } from "../../utils/formatDay";
import type { DayFormat, TypeDisplay } from "./types";
```

Replace with:

```ts
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import { EXP } from "../../utils/enums";
import type { Event } from "../../utils/types";
import { EVENT_TYPE_ICONS } from "../../ui/icons/eventTypeIcons";
import { Chip } from "../../ui/Chip/Chip";
import styles from "./columns.module.css";
import typeCellStyles from "./typeCell.module.css";
import { formatDay, toDisplayDate } from "../../utils/formatDay";
import type { DayFormat, TypeDisplay, TimeZone } from "./types";
```

- [ ] **Add `timeZone` to the CellContext module augmentation**

Find the existing augmentation:

```ts
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    sortField?: string;
  }
  interface CellContext<TData, TValue> {
    dayFormat: DayFormat;
    typeDisplay: TypeDisplay;
    showTypeIcon: boolean;
    linkState?: { from: string };
  }
}
```

Replace with:

```ts
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    sortField?: string;
  }
  interface CellContext<TData, TValue> {
    dayFormat: DayFormat;
    typeDisplay: TypeDisplay;
    showTypeIcon: boolean;
    linkState?: { from: string };
    timeZone: TimeZone;
  }
}
```

- [ ] **Update the `day` column cell**

Find:

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

Replace with:

```ts
  {
    id: "day",
    header: "Day",
    meta: { sortField: "startDateTime" },
    cell: ({ row, dayFormat, timeZone }) => (
      <>{formatDay(toDisplayDate(row.original.attributes.startDateTime, timeZone), dayFormat)}</>
    ),
  },
```

- [ ] **Update the `startDateTime` column cell**

Find:

```ts
  {
    id: "startDateTime",
    header: "Start",
    meta: { sortField: "startDateTime" },
    cell: ({ row }) => <>{format(new Date(row.original.attributes.startDateTime), "HH:mm")}</>,
  },
```

Replace with:

```ts
  {
    id: "startDateTime",
    header: "Start",
    meta: { sortField: "startDateTime" },
    cell: ({ row, timeZone }) => (
      <>{format(toDisplayDate(row.original.attributes.startDateTime, timeZone), "HH:mm")}</>
    ),
  },
```

- [ ] **Update the `endDateTime` column cell**

Find:

```ts
  {
    id: "endDateTime",
    header: "End",
    meta: { sortField: "endDateTime" },
    cell: ({ row }) => <>{format(new Date(row.original.attributes.endDateTime), "HH:mm")}</>,
  },
```

Replace with:

```ts
  {
    id: "endDateTime",
    header: "End",
    meta: { sortField: "endDateTime" },
    cell: ({ row, timeZone }) => (
      <>{format(toDisplayDate(row.original.attributes.endDateTime, timeZone), "HH:mm")}</>
    ),
  },
```

- [ ] **Run typecheck — errors should reduce further**

```bash
npm run typecheck 2>&1 | grep "error TS" | head -10
```

- [ ] **Run the columns tests**

```bash
npx vitest run src/components/EventTable/columns.test.ts
```

Expected: all PASS

- [ ] **Commit**

```bash
git add src/components/EventTable/columns.tsx
git commit -m "fix: use toDisplayDate in day/start/end columns"
```

---

## Task 8: Add TimeFormatControls to FormatDrawer.tsx (TDD)

**Files:**

- Modify: `src/components/EventTable/FormatDrawer.test.tsx`
- Modify: `src/components/EventTable/FormatDrawer.tsx`

- [ ] **Update `makeColumnState` in FormatDrawer.test.tsx to include the new fields**

Find in `src/components/EventTable/FormatDrawer.test.tsx`:

```ts
function makeColumnState(overrides: Partial<SharedColumnState> = {}): SharedColumnState {
  return {
    visibility: {},
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

Replace with:

```ts
function makeColumnState(overrides: Partial<SharedColumnState> = {}): SharedColumnState {
  return {
    visibility: {},
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
    timeZone: "indy",
    setTimeZone: vi.fn<SharedColumnState["setTimeZone"]>(),
    resetTimeZone: vi.fn<SharedColumnState["resetTimeZone"]>(),
    ...overrides,
  };
}
```

- [ ] **Add the import for `TimeZone` at the top of FormatDrawer.test.tsx**

Find:

```ts
import type { SharedColumnState, TypeDisplay, DayFormat } from "./types";
```

Replace with:

```ts
import type { SharedColumnState, TypeDisplay, DayFormat, TimeZone } from "./types";
```

- [ ] **Add the new TimeFormatControls tests to FormatDrawer.test.tsx**

Append to the end of the file:

```ts
test("opens drawer showing Time columns fieldset", async () => {
  const user = userEvent.setup();
  render(<FormatDrawer columnState={makeColumnState()} />);
  await user.click(screen.getByRole("button", { name: "Format" }));
  expect(screen.getByRole("group", { name: "Time columns" })).toBeInTheDocument();
});

test("Reset button also calls resetTimeZone", async () => {
  const user = userEvent.setup();
  const resetTimeZone = vi.fn<SharedColumnState["resetTimeZone"]>();
  render(<FormatDrawer columnState={makeColumnState({ resetTimeZone })} />);
  await user.click(screen.getByRole("button", { name: "Format" }));
  await user.click(screen.getByRole("button", { name: "Reset" }));
  expect(resetTimeZone).toHaveBeenCalledTimes(1);
});

test("TimeFormatControls renders Indianapolis and Local radio buttons", () => {
  render(
    <TimeFormatControls
      timeZone="indy"
      setTimeZone={vi.fn<(v: TimeZone) => void>()}
    />,
  );
  expect(screen.getByRole("radio", { name: "Indianapolis" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Local" })).toBeInTheDocument();
});

test("TimeFormatControls Indianapolis radio is checked when timeZone is indy", () => {
  render(
    <TimeFormatControls
      timeZone="indy"
      setTimeZone={vi.fn<(v: TimeZone) => void>()}
    />,
  );
  expect(screen.getByRole("radio", { name: "Indianapolis" })).toBeChecked();
  expect(screen.getByRole("radio", { name: "Local" })).not.toBeChecked();
});

test("TimeFormatControls clicking Local radio calls setTimeZone with local", async () => {
  const user = userEvent.setup();
  const setTimeZone = vi.fn<(v: TimeZone) => void>();
  render(<TimeFormatControls timeZone="indy" setTimeZone={setTimeZone} />);
  await user.click(screen.getByRole("radio", { name: "Local" }));
  expect(setTimeZone).toHaveBeenCalledWith("local");
});

test("TimeFormatControls clicking Indianapolis radio calls setTimeZone with indy", async () => {
  const user = userEvent.setup();
  const setTimeZone = vi.fn<(v: TimeZone) => void>();
  render(<TimeFormatControls timeZone="local" setTimeZone={setTimeZone} />);
  await user.click(screen.getByRole("radio", { name: "Indianapolis" }));
  expect(setTimeZone).toHaveBeenCalledWith("indy");
});
```

Also add `TimeFormatControls` to the import at the top of the test file. Find:

```ts
import { FormatDrawer, TypeFormatControls, DayFormatControls } from "./FormatDrawer";
```

Replace with:

```ts
import {
  FormatDrawer,
  TypeFormatControls,
  DayFormatControls,
  TimeFormatControls,
} from "./FormatDrawer";
```

- [ ] **Run the tests to confirm new ones fail**

```bash
npx vitest run src/components/EventTable/FormatDrawer.test.tsx 2>&1 | tail -20
```

Expected: existing tests PASS, new `TimeFormatControls` tests FAIL — component not yet exported

- [ ] **Implement TimeFormatControls and wire it into FormatDrawer**

In `src/components/EventTable/FormatDrawer.tsx`:

Add `TimeZone` to the types import:

```ts
import type { SharedColumnState, TypeDisplay, DayFormat, TimeZone } from "./types";
```

Add the new component after `DayFormatControls` (before `FormatDrawerProps`):

```tsx
interface TimeFormatControlsProps {
  timeZone: TimeZone;
  setTimeZone: (v: TimeZone) => void;
}

export function TimeFormatControls({
  timeZone,
  setTimeZone,
}: TimeFormatControlsProps): React.JSX.Element {
  return (
    <fieldset className={styles.columnGroup}>
      <legend className={styles.columnGroupLegend}>Time columns</legend>
      <div className={styles.typeDisplayRadioGroup}>
        <SegmentedControl value={timeZone} onValueChange={(v) => setTimeZone(v as TimeZone)}>
          <SegmentedControl.Option value="indy" indicator={<Targeted size={16} />}>
            Indianapolis
          </SegmentedControl.Option>
          <SegmentedControl.Option value="local" indicator={<Targeted size={16} />}>
            Local
          </SegmentedControl.Option>
        </SegmentedControl>
      </div>
    </fieldset>
  );
}
```

Update `FormatDrawer` to destructure `timeZone`, `setTimeZone`, `resetTimeZone` from `columnState` and render `TimeFormatControls`:

Find:

```tsx
const {
  typeDisplay,
  setTypeDisplay,
  showTypeIcon,
  setShowTypeIcon,
  resetTypeDisplay,
  dayFormat,
  setDayFormat,
  resetDayFormat,
} = columnState;
```

Replace with:

```tsx
const {
  typeDisplay,
  setTypeDisplay,
  showTypeIcon,
  setShowTypeIcon,
  resetTypeDisplay,
  dayFormat,
  setDayFormat,
  resetDayFormat,
  timeZone,
  setTimeZone,
  resetTimeZone,
} = columnState;
```

Find the JSX inside `FormatDrawer` (the `<fieldset>` contents):

```tsx
<fieldset className={styles.columnFieldset}>
  <TypeFormatControls
    typeDisplay={typeDisplay}
    setTypeDisplay={setTypeDisplay}
    showTypeIcon={showTypeIcon}
    setShowTypeIcon={setShowTypeIcon}
  />
  <DayFormatControls dayFormat={dayFormat} setDayFormat={setDayFormat} />
  <div className={styles.columnActions}>
    <Button
      variant="ghost"
      onClick={() => {
        resetTypeDisplay();
        resetDayFormat();
      }}
    >
      Reset
    </Button>
  </div>
</fieldset>
```

Replace with:

```tsx
<fieldset className={styles.columnFieldset}>
  <TypeFormatControls
    typeDisplay={typeDisplay}
    setTypeDisplay={setTypeDisplay}
    showTypeIcon={showTypeIcon}
    setShowTypeIcon={setShowTypeIcon}
  />
  <DayFormatControls dayFormat={dayFormat} setDayFormat={setDayFormat} />
  <TimeFormatControls timeZone={timeZone} setTimeZone={setTimeZone} />
  <div className={styles.columnActions}>
    <Button
      variant="ghost"
      onClick={() => {
        resetTypeDisplay();
        resetDayFormat();
        resetTimeZone();
      }}
    >
      Reset
    </Button>
  </div>
</fieldset>
```

- [ ] **Run the FormatDrawer tests — all should pass**

```bash
npx vitest run src/components/EventTable/FormatDrawer.test.tsx
```

Expected: all tests PASS (existing + 6 new)

- [ ] **Commit**

```bash
git add src/components/EventTable/FormatDrawer.tsx src/components/EventTable/FormatDrawer.test.tsx
git commit -m "feat: add TimeFormatControls to FormatDrawer"
```

---

## Task 9: Wire timeZone into EventTable.tsx (cell context + getFormatControls)

**Files:**

- Modify: `src/components/EventTable/EventTable.tsx`

- [ ] **Import TimeFormatControls**

Find in `EventTable.tsx`:

```ts
import { TypeFormatControls, DayFormatControls } from "./FormatDrawer";
```

Replace with:

```ts
import { TypeFormatControls, DayFormatControls, TimeFormatControls } from "./FormatDrawer";
```

- [ ] **Destructure `timeZone` and `setTimeZone` from sharedColumnState**

Find:

```ts
const {
  visibility,
  sizing,
  setSizing,
  typeDisplay,
  setTypeDisplay,
  showTypeIcon,
  setShowTypeIcon,
  dayFormat,
  setDayFormat,
} = sharedColumnState;
```

Replace with:

```ts
const {
  visibility,
  sizing,
  setSizing,
  typeDisplay,
  setTypeDisplay,
  showTypeIcon,
  setShowTypeIcon,
  dayFormat,
  setDayFormat,
  timeZone,
  setTimeZone,
} = sharedColumnState;
```

- [ ] **Add timeZone to the cell context pass-through**

Find:

```tsx
{
  flexRender(cell.column.columnDef.cell, {
    ...cell.getContext(),
    dayFormat,
    typeDisplay,
    showTypeIcon,
    linkState,
  });
}
```

Replace with:

```tsx
{
  flexRender(cell.column.columnDef.cell, {
    ...cell.getContext(),
    dayFormat,
    typeDisplay,
    showTypeIcon,
    linkState,
    timeZone,
  });
}
```

- [ ] **Wire TimeFormatControls into getFormatControls**

Find:

```ts
  const getFormatControls = (columnId: string): React.ReactNode => {
    if (columnId === "eventType") {
      return (
        <TypeFormatControls
          typeDisplay={typeDisplay}
          setTypeDisplay={setTypeDisplay}
          showTypeIcon={showTypeIcon}
          setShowTypeIcon={setShowTypeIcon}
        />
      );
    }
    if (columnId === "day") {
      return <DayFormatControls dayFormat={dayFormat} setDayFormat={setDayFormat} />;
    }
    return undefined;
  };
```

Replace with:

```ts
  const getFormatControls = (columnId: string): React.ReactNode => {
    if (columnId === "eventType") {
      return (
        <TypeFormatControls
          typeDisplay={typeDisplay}
          setTypeDisplay={setTypeDisplay}
          showTypeIcon={showTypeIcon}
          setShowTypeIcon={setShowTypeIcon}
        />
      );
    }
    if (columnId === "day") {
      return <DayFormatControls dayFormat={dayFormat} setDayFormat={setDayFormat} />;
    }
    if (columnId === "startDateTime" || columnId === "endDateTime") {
      return <TimeFormatControls timeZone={timeZone} setTimeZone={setTimeZone} />;
    }
    return undefined;
  };
```

- [ ] **Run typecheck**

```bash
npm run typecheck
```

Expected: fewer errors (EventTable now satisfies the CellContext type)

- [ ] **Run EventTable tests**

```bash
npx vitest run src/components/EventTable/EventTable.test.tsx
```

Expected: all PASS

- [ ] **Commit**

```bash
git add src/components/EventTable/EventTable.tsx
git commit -m "feat: pass timeZone in cell context and wire TimeFormatControls to column popovers"
```

---

## Task 10: Update EventListMobile.tsx + SearchResults.tsx + spot-check test

**Files:**

- Modify: `src/components/EventTable/EventListMobile.tsx`
- Modify: `src/components/EventTable/EventListMobile.test.tsx`
- Modify: `src/components/SearchResults/SearchResults.tsx`

- [ ] **Add `TimeZone` to the import in EventListMobile.tsx**

Find:

```ts
import type { DayFormat, TypeDisplay } from "./types";
```

Replace with:

```ts
import type { DayFormat, TypeDisplay, TimeZone } from "./types";
```

- [ ] **Import toDisplayDate in EventListMobile.tsx**

Find:

```ts
import { formatDayCompact } from "../../utils/formatDay";
```

Replace with:

```ts
import { formatDayCompact, toDisplayDate } from "../../utils/formatDay";
```

- [ ] **Add `timeZone` to EventListMobileProps**

Find:

```ts
interface EventListMobileProps {
  events: Event[];
  visibility?: Partial<Record<string, boolean>>;
  typeDisplay?: TypeDisplay;
  showTypeIcon?: boolean;
  dayFormat?: DayFormat;
  linkState?: { from: string };
}
```

Replace with:

```ts
interface EventListMobileProps {
  events: Event[];
  visibility?: Partial<Record<string, boolean>>;
  typeDisplay?: TypeDisplay;
  showTypeIcon?: boolean;
  dayFormat?: DayFormat;
  timeZone?: TimeZone;
  linkState?: { from: string };
}
```

- [ ] **Destructure `timeZone` in the component function**

Find:

```ts
export function EventListMobile({
  events,
  visibility,
  typeDisplay,
  showTypeIcon,
  dayFormat,
  linkState,
}: EventListMobileProps): React.JSX.Element {
```

Replace with:

```ts
export function EventListMobile({
  events,
  visibility,
  typeDisplay,
  showTypeIcon,
  dayFormat,
  timeZone,
  linkState,
}: EventListMobileProps): React.JSX.Element {
```

- [ ] **Replace `new Date(...)` with `toDisplayDate(...)` for start and end**

Find:

```ts
const start = new Date(a.startDateTime);
const end = new Date(a.endDateTime);
```

Replace with:

```ts
const start = toDisplayDate(a.startDateTime, timeZone ?? "indy");
const end = toDisplayDate(a.endDateTime, timeZone ?? "indy");
```

- [ ] **Update SearchResults.tsx to pass `timeZone` to EventListMobile**

Find in `src/components/SearchResults/SearchResults.tsx`:

```tsx
<EventListMobile
  events={data.data}
  visibility={sharedColumnState.visibility}
  typeDisplay={sharedColumnState.typeDisplay}
  showTypeIcon={sharedColumnState.showTypeIcon}
  dayFormat={sharedColumnState.dayFormat}
/>
```

Replace with:

```tsx
<EventListMobile
  events={data.data}
  visibility={sharedColumnState.visibility}
  typeDisplay={sharedColumnState.typeDisplay}
  showTypeIcon={sharedColumnState.showTypeIcon}
  dayFormat={sharedColumnState.dayFormat}
  timeZone={sharedColumnState.timeZone}
/>
```

- [ ] **Add spot-check test to EventListMobile.test.tsx**

Update the `renderList` helper signature to accept `timeZone`:

Find:

```ts
async function renderList(
  events: Event[] = [makeEvent()],
  visibility?: Partial<Record<string, boolean>>,
  opts: { typeDisplay?: TypeDisplay; showTypeIcon?: boolean; dayFormat?: DayFormat } = {},
): Promise<ReturnType<typeof render>> {
  const { dayFormat, ...typeDisplayProps } = opts;
  const rootRoute = createRootRoute({
    component: () => (
      <EventListMobile
        events={events}
        visibility={visibility}
        dayFormat={dayFormat}
        {...typeDisplayProps}
      />
    ),
  });
```

Replace with:

```ts
async function renderList(
  events: Event[] = [makeEvent()],
  visibility?: Partial<Record<string, boolean>>,
  opts: { typeDisplay?: TypeDisplay; showTypeIcon?: boolean; dayFormat?: DayFormat; timeZone?: TimeZone } = {},
): Promise<ReturnType<typeof render>> {
  const { dayFormat, timeZone, ...typeDisplayProps } = opts;
  const rootRoute = createRootRoute({
    component: () => (
      <EventListMobile
        events={events}
        visibility={visibility}
        dayFormat={dayFormat}
        timeZone={timeZone}
        {...typeDisplayProps}
      />
    ),
  });
```

Add `TimeZone` to the import at the top of the file:

Find:

```ts
import type { DayFormat, TypeDisplay } from "./types";
```

Replace with:

```ts
import type { DayFormat, TypeDisplay, TimeZone } from "./types";
```

Append a spot-check test at the end of the file:

```ts
test('shows start and end times in Indianapolis time when timeZone is "indy"', async () => {
  // factory startDateTime "2024-08-01T10:00:00Z" = 06:00 Indianapolis (UTC-4)
  // factory endDateTime "2024-08-01T14:00:00Z" = 10:00 Indianapolis
  await renderList([makeEvent()], undefined, { timeZone: "indy" });
  expect(screen.getByText(/06:00/)).toBeInTheDocument();
  expect(screen.getByText(/10:00/)).toBeInTheDocument();
});
```

- [ ] **Run EventListMobile tests — all should pass**

```bash
npx vitest run src/components/EventTable/EventListMobile.test.tsx
```

Expected: all PASS

- [ ] **Commit**

```bash
git add src/components/EventTable/EventListMobile.tsx src/components/EventTable/EventListMobile.test.tsx src/components/SearchResults/SearchResults.tsx
git commit -m "feat: add timeZone prop to EventListMobile and pass from SearchResults"
```

---

## Task 11: Update EventDetail.tsx

**Files:**

- Modify: `src/components/EventDetail/EventDetail.tsx`

- [ ] **Add useTimeZone import**

Find:

```ts
import { useDayFormat } from "../../hooks/useDayFormat";
import { formatDay } from "../../utils/formatDay";
```

Replace with:

```ts
import { useDayFormat } from "../../hooks/useDayFormat";
import { useTimeZone } from "../../hooks/useTimeZone";
import { formatDay, toDisplayDate } from "../../utils/formatDay";
```

- [ ] **Call useTimeZone in the component**

Find the line that calls `useDayFormat()`:

```ts
const { dayFormat } = useDayFormat();
```

Replace with:

```ts
const { dayFormat } = useDayFormat();
const { timeZone } = useTimeZone();
```

- [ ] **Replace the three time/day format calls**

Find:

```tsx
            <DescriptionItem term="Day">
              {formatDay(new Date(a.startDateTime), dayFormat)}
            </DescriptionItem>
            <DescriptionItem term="Start">
              {format(new Date(a.startDateTime), "HH:mm")}
            </DescriptionItem>
            <DescriptionItem term="End">{format(new Date(a.endDateTime), "HH:mm")}</DescriptionItem>
```

Replace with:

```tsx
            <DescriptionItem term="Day">
              {formatDay(toDisplayDate(a.startDateTime, timeZone), dayFormat)}
            </DescriptionItem>
            <DescriptionItem term="Start">
              {format(toDisplayDate(a.startDateTime, timeZone), "HH:mm")}
            </DescriptionItem>
            <DescriptionItem term="End">
              {format(toDisplayDate(a.endDateTime, timeZone), "HH:mm")}
            </DescriptionItem>
```

- [ ] **Run EventDetail tests**

```bash
npx vitest run src/components/EventDetail/EventDetail.test.tsx
```

Expected: all PASS

- [ ] **Commit**

```bash
git add src/components/EventDetail/EventDetail.tsx
git commit -m "fix: use toDisplayDate in EventDetail for timezone-aware display"
```

---

## Task 12: Full suite, typecheck, and final commit

- [ ] **Run full typecheck**

```bash
npm run typecheck
```

Expected: 0 errors

- [ ] **Run full test suite**

```bash
npm test
```

Expected: all tests PASS

- [ ] **If any failures, fix them before proceeding**

Common issues to check:

- Any test file importing from `FormatDrawer` that uses `makeColumnState` — it needs the three new `timeZone` fields (same fix as Task 8's `makeColumnState` update)
- Any test that renders `EventTable` with a mocked `SharedColumnState` — same fix

- [ ] **Commit any remaining fixes, then tag the branch clean**

```bash
git add -A
git commit -m "fix: resolve any remaining test and type issues"
```

---

## Acceptance Criteria Checklist

- [ ] Start and End time columns display in Indianapolis time for users in any timezone (default)
- [ ] Day column assigns events to the correct Indianapolis calendar day (default)
- [ ] A user in UTC-5 sees `10:00` for a 10am Indianapolis event, not `09:00`
- [ ] "Time columns" control in FormatDrawer lets users switch between "Indianapolis" and "Local"
- [ ] Preference persists across page reloads (localStorage)
- [ ] Reset button in FormatDrawer resets timezone preference to "indy"
- [ ] EventDetail page respects the same preference
- [ ] All existing tests continue to pass
