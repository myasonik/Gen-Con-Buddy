# Redo Customize Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Worktree:** REQUIRED — use `superpowers:using-git-worktrees` at execution time. Do NOT commit to main.

**Goal:** Reorganize the event table toolbar into named Visibility, Format, and Sort drawers, move the filters drawer to the right, and expose format controls inline in column action popovers.

**Architecture:** Delete `ColumnControlsPanel` and replace it with three focused drawer components (`VisibilityDrawer`, `FormatDrawer`, `SortDrawer`). The controls bar in `SearchResults` gains these three buttons on the left with pagination on the right. `ColumnActionsPopover` gains an optional `formatControls` prop for inline format controls on the event type and day columns.

**Tech Stack:** React, TypeScript, CSS Modules, Base UI (`@base-ui/react/dialog`), `@testing-library/react`, Vitest, `@tanstack/react-table`

---

## File Map

| Action | Path                                                        | Responsibility                                                                     |
| ------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Modify | `src/components/SearchForm/SearchForm.tsx`                  | Filters drawer → right side                                                        |
| Create | `src/components/EventTable/VisibilityDrawer.tsx`            | Drawer button + column visibility checkboxes                                       |
| Create | `src/components/EventTable/VisibilityDrawer.module.css`     | Styles for VisibilityDrawer                                                        |
| Create | `src/components/EventTable/VisibilityDrawer.test.tsx`       | Tests for VisibilityDrawer                                                         |
| Create | `src/components/EventTable/FormatDrawer.tsx`                | Drawer button + format controls; exports `TypeFormatControls`, `DayFormatControls` |
| Create | `src/components/EventTable/FormatDrawer.module.css`         | Styles for FormatDrawer                                                            |
| Create | `src/components/EventTable/FormatDrawer.test.tsx`           | Tests for FormatDrawer                                                             |
| Create | `src/components/EventTable/SortDrawer.tsx`                  | Stub drawer button                                                                 |
| Create | `src/components/EventTable/SortDrawer.test.tsx`             | Tests for SortDrawer                                                               |
| Modify | `src/components/EventTable/ColumnActionsPopover.tsx`        | Add `formatControls?: React.ReactNode` prop                                        |
| Modify | `src/components/EventTable/ColumnActionsPopover.module.css` | Add `.divider` + `.formatSection` styles                                           |
| Modify | `src/components/EventTable/ColumnActionsPopover.test.tsx`   | New tests for formatControls prop                                                  |
| Modify | `src/components/EventTable/EventTable.tsx`                  | Pass format controls to relevant columns; remove `showColumnControls`              |
| Modify | `src/components/EventTable/EventTable.test.tsx`             | Remove `showColumnControls` references                                             |
| Modify | `src/components/EventTable/EventTable.stories.tsx`          | Remove `showColumnControls` references                                             |
| Modify | `src/components/SearchResults/SearchResults.tsx`            | New controls bar layout; use new drawer components                                 |
| Modify | `src/components/SearchResults/SearchResults.module.css`     | `space-between` controlsBar + `tableControls` group                                |
| Modify | `src/components/SearchResults/SearchResults.test.tsx`       | Update tests that clicked "Customize columns"                                      |
| Modify | `src/components/ChangelogPage/ChangelogPage.tsx`            | Replace `ColumnControlsPanel` with `VisibilityDrawer` + `FormatDrawer`             |
| Modify | `src/components/ChangelogPage/ChangelogPage.module.css`     | Add `.controls` class                                                              |
| Delete | `src/components/EventTable/ColumnControlsPanel.tsx`         | Replaced by three focused components                                               |
| Delete | `src/components/EventTable/ColumnControlsPanel.test.tsx`    | Tests replaced by per-component test files                                         |
| Modify | `src/components/EventTable/EventTable.module.css`           | Remove obsolete column panel styles                                                |

---

## Task 1: Fix filters drawer → right side

**Files:**

- Modify: `src/components/SearchForm/SearchForm.tsx`
- Modify: `src/components/SearchForm/SearchForm.test.tsx`

- [ ] **Step 1: Write the failing test**

Add this test to `src/components/SearchForm/SearchForm.test.tsx`:

```tsx
test("Filters drawer opens on the right side", async () => {
  const user = userEvent.setup();
  renderSearchForm();
  await user.click(screen.getByRole("button", { name: /Filters/i }));
  expect(screen.getByRole("dialog")).toHaveAttribute("data-side", "right");
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/components/SearchForm/SearchForm.test.tsx
```

Expected: FAIL — `data-side` is `"left"` not `"right"`.

- [ ] **Step 3: Add `side="right"` to the Filters drawer in SearchForm**

In `src/components/SearchForm/SearchForm.tsx`, find the `<Drawer` that wraps Advanced Filters and add `side="right"`:

```tsx
// Before:
<Drawer
  trigger={
    <Button type="button" variant="secondary" className={styles.filtersButton}>
      <SlidersHorizontal size={14} aria-hidden="true" /> Filters
    </Button>
  }
  title="Advanced Filters"
  footer={...}
>

// After:
<Drawer
  trigger={
    <Button type="button" variant="secondary" className={styles.filtersButton}>
      <SlidersHorizontal size={14} aria-hidden="true" /> Filters
    </Button>
  }
  title="Advanced Filters"
  side="right"
  footer={...}
>
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx vitest run src/components/SearchForm/SearchForm.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/SearchForm/SearchForm.tsx src/components/SearchForm/SearchForm.test.tsx
git commit -m "feat: move filters drawer to right side"
```

---

## Task 2: Create VisibilityDrawer

**Files:**

- Create: `src/components/EventTable/VisibilityDrawer.tsx`
- Create: `src/components/EventTable/VisibilityDrawer.module.css`
- Create: `src/components/EventTable/VisibilityDrawer.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/EventTable/VisibilityDrawer.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test } from "vitest";
import { VisibilityDrawer } from "./VisibilityDrawer";
import { COLUMNS } from "./columns";
import type { SharedColumnState } from "./types";

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

test("renders Visibility trigger button", () => {
  render(<VisibilityDrawer columnState={makeColumnState()} />);
  expect(screen.getByRole("button", { name: "Visibility" })).toBeInTheDocument();
});

test("does not show column groups before the button is clicked", () => {
  render(<VisibilityDrawer columnState={makeColumnState()} />);
  expect(screen.queryByRole("group", { name: "The Event" })).not.toBeInTheDocument();
});

test("opens drawer showing all four column groups on button click", async () => {
  const user = userEvent.setup();
  render(<VisibilityDrawer columnState={makeColumnState()} />);
  await user.click(screen.getByRole("button", { name: "Visibility" }));
  expect(screen.getByRole("group", { name: "The Event" })).toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Players" })).toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Logistics" })).toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Contact" })).toBeInTheDocument();
});

test("Title checkbox is inside the The Event group", async () => {
  const user = userEvent.setup();
  render(<VisibilityDrawer columnState={makeColumnState()} />);
  await user.click(screen.getByRole("button", { name: "Visibility" }));
  const group = screen.getByRole("group", { name: "The Event" });
  expect(within(group).getByRole("checkbox", { name: "Title" })).toBeInTheDocument();
});

test("clicking a checkbox calls toggleVisibility with column id", async () => {
  const user = userEvent.setup();
  const toggleVisibility = vi.fn<SharedColumnState["toggleVisibility"]>();
  render(<VisibilityDrawer columnState={makeColumnState({ toggleVisibility })} />);
  await user.click(screen.getByRole("button", { name: "Visibility" }));
  await user.click(screen.getByRole("checkbox", { name: "Title" }));
  expect(toggleVisibility).toHaveBeenCalledWith("title");
});

test("Reset button calls resetVisibility and resetSizing", async () => {
  const user = userEvent.setup();
  const resetVisibility = vi.fn<SharedColumnState["resetVisibility"]>();
  const resetSizing = vi.fn<SharedColumnState["resetSizing"]>();
  render(<VisibilityDrawer columnState={makeColumnState({ resetVisibility, resetSizing })} />);
  await user.click(screen.getByRole("button", { name: "Visibility" }));
  await user.click(screen.getByRole("button", { name: "Reset" }));
  expect(resetVisibility).toHaveBeenCalledTimes(1);
  expect(resetSizing).toHaveBeenCalledTimes(1);
});

test("Close button dismisses the drawer", async () => {
  const user = userEvent.setup();
  render(<VisibilityDrawer columnState={makeColumnState()} />);
  await user.click(screen.getByRole("button", { name: "Visibility" }));
  expect(screen.getByRole("group", { name: "The Event" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("group", { name: "The Event" })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/components/EventTable/VisibilityDrawer.test.tsx
```

Expected: FAIL — `VisibilityDrawer` does not exist.

- [ ] **Step 3: Create VisibilityDrawer.module.css**

Create `src/components/EventTable/VisibilityDrawer.module.css`:

```css
.columnFieldset {
  border: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.columnGroup {
  border: none;
  margin: 0;
  padding: 0;
}

.columnGroupLegend {
  display: block;
  width: 100%;
  padding: 0 0 var(--space-1) var(--space-2);
  margin-bottom: var(--space-2);
  border-bottom: var(--border-width) solid var(--color-ink-divider);
  font-family: var(--font-slab);
  font-size: var(--text-md);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: var(--tracking-eyebrow);
  color: var(--color-ink-muted);
}

.columnList {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
}

.columnActions {
  display: flex;
  justify-content: flex-end;
  border-top: var(--border-width) solid var(--color-ink-divider);
  padding-top: var(--space-2);
  margin-top: var(--space-1);
}
```

- [ ] **Step 4: Create VisibilityDrawer.tsx**

Create `src/components/EventTable/VisibilityDrawer.tsx`:

```tsx
import React from "react";
import { Button } from "../../ui/Button/Button";
import { Drawer } from "../../ui/Drawer/Drawer";
import type { SharedColumnState } from "./types";
import { COLUMNS, COLUMN_GROUPS } from "./columns";
import { Checkbox } from "../../ui/Checkbox/Checkbox";
import styles from "./VisibilityDrawer.module.css";

interface VisibilityDrawerProps {
  columnState: SharedColumnState;
}

export function VisibilityDrawer({ columnState }: VisibilityDrawerProps): React.JSX.Element {
  const { visibility, toggleVisibility, resetVisibility, resetSizing } = columnState;
  const colById = new Map(COLUMNS.filter((c) => c.id !== undefined).map((c) => [c.id, c]));

  return (
    <Drawer
      trigger={
        <Button type="button" variant="secondary">
          Visibility
        </Button>
      }
      title="Visibility"
    >
      <fieldset className={styles.columnFieldset}>
        {COLUMN_GROUPS.map((group) => (
          <fieldset key={group.label} className={styles.columnGroup}>
            <legend className={styles.columnGroupLegend}>{group.label}</legend>
            <ul className={styles.columnList}>
              {group.columnIds.map((id) => {
                const col = colById.get(id);
                if (!col) {
                  return null;
                }
                const isChecked = Boolean(visibility[id]);
                return (
                  <li key={id}>
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleVisibility(id)}
                      label={typeof col.header === "string" ? col.header : id}
                    />
                  </li>
                );
              })}
            </ul>
          </fieldset>
        ))}
        <div className={styles.columnActions}>
          <Button
            variant="ghost"
            onClick={() => {
              resetVisibility();
              resetSizing();
            }}
          >
            Reset
          </Button>
        </div>
      </fieldset>
    </Drawer>
  );
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npx vitest run src/components/EventTable/VisibilityDrawer.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/EventTable/VisibilityDrawer.tsx src/components/EventTable/VisibilityDrawer.module.css src/components/EventTable/VisibilityDrawer.test.tsx
git commit -m "feat: add VisibilityDrawer component"
```

---

## Task 3: Create FormatDrawer

**Files:**

- Create: `src/components/EventTable/FormatDrawer.tsx`
- Create: `src/components/EventTable/FormatDrawer.module.css`
- Create: `src/components/EventTable/FormatDrawer.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/EventTable/FormatDrawer.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test } from "vitest";
import { FormatDrawer, TypeFormatControls, DayFormatControls } from "./FormatDrawer";
import type { SharedColumnState, TypeDisplay, DayFormat } from "./types";

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

// FormatDrawer tests
test("renders Format trigger button", () => {
  render(<FormatDrawer columnState={makeColumnState()} />);
  expect(screen.getByRole("button", { name: "Format" })).toBeInTheDocument();
});

test("does not show format groups before the button is clicked", () => {
  render(<FormatDrawer columnState={makeColumnState()} />);
  expect(screen.queryByRole("group", { name: "Event type column" })).not.toBeInTheDocument();
});

test("opens drawer showing Event type column and Day column fieldsets", async () => {
  const user = userEvent.setup();
  render(<FormatDrawer columnState={makeColumnState()} />);
  await user.click(screen.getByRole("button", { name: "Format" }));
  expect(screen.getByRole("group", { name: "Event type column" })).toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Day column" })).toBeInTheDocument();
});

test("Reset button calls resetTypeDisplay and resetDayFormat", async () => {
  const user = userEvent.setup();
  const resetTypeDisplay = vi.fn<SharedColumnState["resetTypeDisplay"]>();
  const resetDayFormat = vi.fn<SharedColumnState["resetDayFormat"]>();
  render(<FormatDrawer columnState={makeColumnState({ resetTypeDisplay, resetDayFormat })} />);
  await user.click(screen.getByRole("button", { name: "Format" }));
  await user.click(screen.getByRole("button", { name: "Reset" }));
  expect(resetTypeDisplay).toHaveBeenCalledTimes(1);
  expect(resetDayFormat).toHaveBeenCalledTimes(1);
});

test("Close button dismisses the drawer", async () => {
  const user = userEvent.setup();
  render(<FormatDrawer columnState={makeColumnState()} />);
  await user.click(screen.getByRole("button", { name: "Format" }));
  expect(screen.getByRole("group", { name: "Event type column" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("group", { name: "Event type column" })).not.toBeInTheDocument();
});

// TypeFormatControls tests
test("TypeFormatControls renders Show icon checkbox checked when showTypeIcon is true", () => {
  render(
    <TypeFormatControls
      typeDisplay="name"
      setTypeDisplay={vi.fn<(v: TypeDisplay) => void>()}
      showTypeIcon={true}
      setShowTypeIcon={vi.fn<(v: boolean) => void>()}
    />,
  );
  expect(screen.getByRole("checkbox", { name: "Show icon" })).toBeChecked();
});

test("TypeFormatControls renders Show icon checkbox unchecked when showTypeIcon is false", () => {
  render(
    <TypeFormatControls
      typeDisplay="name"
      setTypeDisplay={vi.fn<(v: TypeDisplay) => void>()}
      showTypeIcon={false}
      setShowTypeIcon={vi.fn<(v: boolean) => void>()}
    />,
  );
  expect(screen.getByRole("checkbox", { name: "Show icon" })).not.toBeChecked();
});

test("TypeFormatControls clicking Show icon checkbox calls setShowTypeIcon with toggled value", async () => {
  const user = userEvent.setup();
  const setShowTypeIcon = vi.fn<(v: boolean) => void>();
  render(
    <TypeFormatControls
      typeDisplay="name"
      setTypeDisplay={vi.fn<(v: TypeDisplay) => void>()}
      showTypeIcon={true}
      setShowTypeIcon={setShowTypeIcon}
    />,
  );
  await user.click(screen.getByRole("checkbox", { name: "Show icon" }));
  expect(setShowTypeIcon).toHaveBeenCalledWith(false);
});

test("TypeFormatControls renders Code, Name, Both radio buttons", () => {
  render(
    <TypeFormatControls
      typeDisplay="name"
      setTypeDisplay={vi.fn<(v: TypeDisplay) => void>()}
      showTypeIcon={true}
      setShowTypeIcon={vi.fn<(v: boolean) => void>()}
    />,
  );
  expect(screen.getByRole("radio", { name: "Code" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Name" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Both" })).toBeInTheDocument();
});

test("TypeFormatControls clicking Code radio calls setTypeDisplay with code", async () => {
  const user = userEvent.setup();
  const setTypeDisplay = vi.fn<(v: TypeDisplay) => void>();
  render(
    <TypeFormatControls
      typeDisplay="name"
      setTypeDisplay={setTypeDisplay}
      showTypeIcon={true}
      setShowTypeIcon={vi.fn<(v: boolean) => void>()}
    />,
  );
  await user.click(screen.getByRole("radio", { name: "Code" }));
  expect(setTypeDisplay).toHaveBeenCalledWith("code");
});

test("TypeFormatControls clicking Both radio calls setTypeDisplay with both", async () => {
  const user = userEvent.setup();
  const setTypeDisplay = vi.fn<(v: TypeDisplay) => void>();
  render(
    <TypeFormatControls
      typeDisplay="name"
      setTypeDisplay={setTypeDisplay}
      showTypeIcon={true}
      setShowTypeIcon={vi.fn<(v: boolean) => void>()}
    />,
  );
  await user.click(screen.getByRole("radio", { name: "Both" }));
  expect(setTypeDisplay).toHaveBeenCalledWith("both");
});

// DayFormatControls tests
test("DayFormatControls renders Day, MM/DD/YY, Full date radio buttons", () => {
  render(<DayFormatControls dayFormat="day" setDayFormat={vi.fn<(v: DayFormat) => void>()} />);
  expect(screen.getByRole("radio", { name: "Day" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "MM/DD/YY" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Full date" })).toBeInTheDocument();
});

test("DayFormatControls Day radio is checked when dayFormat is day", () => {
  render(<DayFormatControls dayFormat="day" setDayFormat={vi.fn<(v: DayFormat) => void>()} />);
  expect(screen.getByRole("radio", { name: "Day" })).toBeChecked();
  expect(screen.getByRole("radio", { name: "MM/DD/YY" })).not.toBeChecked();
});

test("DayFormatControls clicking MM/DD/YY radio calls setDayFormat with numeric", async () => {
  const user = userEvent.setup();
  const setDayFormat = vi.fn<(v: DayFormat) => void>();
  render(<DayFormatControls dayFormat="day" setDayFormat={setDayFormat} />);
  await user.click(screen.getByRole("radio", { name: "MM/DD/YY" }));
  expect(setDayFormat).toHaveBeenCalledWith("numeric");
});

test("DayFormatControls clicking Full date radio calls setDayFormat with long", async () => {
  const user = userEvent.setup();
  const setDayFormat = vi.fn<(v: DayFormat) => void>();
  render(<DayFormatControls dayFormat="day" setDayFormat={setDayFormat} />);
  await user.click(screen.getByRole("radio", { name: "Full date" }));
  expect(setDayFormat).toHaveBeenCalledWith("long");
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/components/EventTable/FormatDrawer.test.tsx
```

Expected: FAIL — `FormatDrawer` does not exist.

- [ ] **Step 3: Create FormatDrawer.module.css**

Create `src/components/EventTable/FormatDrawer.module.css`:

```css
.columnFieldset {
  border: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.columnGroup {
  border: none;
  margin: 0;
  padding: 0;
}

.columnGroupLegend {
  display: block;
  width: 100%;
  padding: 0 0 var(--space-1) var(--space-2);
  margin-bottom: var(--space-2);
  border-bottom: var(--border-width) solid var(--color-ink-divider);
  font-family: var(--font-slab);
  font-size: var(--text-md);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: var(--tracking-eyebrow);
  color: var(--color-ink-muted);
}

.typeDisplayRadioGroup {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  padding-top: var(--space-1);
}

.columnActions {
  display: flex;
  justify-content: flex-end;
  border-top: var(--border-width) solid var(--color-ink-divider);
  padding-top: var(--space-2);
  margin-top: var(--space-1);
}
```

- [ ] **Step 4: Create FormatDrawer.tsx**

Create `src/components/EventTable/FormatDrawer.tsx`:

```tsx
import React from "react";
import { Button } from "../../ui/Button/Button";
import { Drawer } from "../../ui/Drawer/Drawer";
import { Checkbox } from "../../ui/Checkbox/Checkbox";
import { SegmentedControl } from "../../ui/SegmentedControl/SegmentedControl";
import { Targeted } from "../../ui/icons/Targeted";
import type { SharedColumnState, TypeDisplay, DayFormat } from "./types";
import styles from "./FormatDrawer.module.css";

interface TypeFormatControlsProps {
  typeDisplay: TypeDisplay;
  setTypeDisplay: (v: TypeDisplay) => void;
  showTypeIcon: boolean;
  setShowTypeIcon: (v: boolean) => void;
}

export function TypeFormatControls({
  typeDisplay,
  setTypeDisplay,
  showTypeIcon,
  setShowTypeIcon,
}: TypeFormatControlsProps): React.JSX.Element {
  return (
    <fieldset className={styles.columnGroup}>
      <legend className={styles.columnGroupLegend}>Event type column</legend>
      <Checkbox
        checked={showTypeIcon}
        onCheckedChange={(checked) => setShowTypeIcon(checked)}
        label="Show icon"
      />
      <div className={styles.typeDisplayRadioGroup}>
        <SegmentedControl
          value={typeDisplay}
          onValueChange={(v) => setTypeDisplay(v as TypeDisplay)}
        >
          <SegmentedControl.Option value="code" indicator={<Targeted size={16} />}>
            Code
          </SegmentedControl.Option>
          <SegmentedControl.Option value="name" indicator={<Targeted size={16} />}>
            Name
          </SegmentedControl.Option>
          <SegmentedControl.Option value="both" indicator={<Targeted size={16} />}>
            Both
          </SegmentedControl.Option>
        </SegmentedControl>
      </div>
    </fieldset>
  );
}

interface DayFormatControlsProps {
  dayFormat: DayFormat;
  setDayFormat: (v: DayFormat) => void;
}

export function DayFormatControls({
  dayFormat,
  setDayFormat,
}: DayFormatControlsProps): React.JSX.Element {
  return (
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
  );
}

interface FormatDrawerProps {
  columnState: SharedColumnState;
}

export function FormatDrawer({ columnState }: FormatDrawerProps): React.JSX.Element {
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

  return (
    <Drawer
      trigger={
        <Button type="button" variant="secondary">
          Format
        </Button>
      }
      title="Format"
    >
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
    </Drawer>
  );
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npx vitest run src/components/EventTable/FormatDrawer.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/EventTable/FormatDrawer.tsx src/components/EventTable/FormatDrawer.module.css src/components/EventTable/FormatDrawer.test.tsx
git commit -m "feat: add FormatDrawer component with TypeFormatControls and DayFormatControls"
```

---

## Task 4: Create SortDrawer stub

**Files:**

- Create: `src/components/EventTable/SortDrawer.tsx`
- Create: `src/components/EventTable/SortDrawer.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/EventTable/SortDrawer.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { SortDrawer } from "./SortDrawer";

test("renders Sort trigger button", () => {
  render(<SortDrawer />);
  expect(screen.getByRole("button", { name: "Sort" })).toBeInTheDocument();
});

test("opens drawer with title Sort on button click", async () => {
  const user = userEvent.setup();
  render(<SortDrawer />);
  await user.click(screen.getByRole("button", { name: "Sort" }));
  expect(screen.getByRole("dialog", { name: "Sort" })).toBeInTheDocument();
});

test("Close button dismisses the Sort drawer", async () => {
  const user = userEvent.setup();
  render(<SortDrawer />);
  await user.click(screen.getByRole("button", { name: "Sort" }));
  await user.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("dialog", { name: "Sort" })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/components/EventTable/SortDrawer.test.tsx
```

Expected: FAIL — `SortDrawer` does not exist.

- [ ] **Step 3: Create SortDrawer.tsx**

Create `src/components/EventTable/SortDrawer.tsx`:

```tsx
import React from "react";
import { Button } from "../../ui/Button/Button";
import { Drawer } from "../../ui/Drawer/Drawer";

export function SortDrawer(): React.JSX.Element {
  return (
    <Drawer
      trigger={
        <Button type="button" variant="secondary">
          Sort
        </Button>
      }
      title="Sort"
    >
      {null}
    </Drawer>
  );
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/components/EventTable/SortDrawer.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/EventTable/SortDrawer.tsx src/components/EventTable/SortDrawer.test.tsx
git commit -m "feat: add SortDrawer stub"
```

---

## Task 5: Update ColumnActionsPopover with formatControls prop

**Files:**

- Modify: `src/components/EventTable/ColumnActionsPopover.tsx`
- Modify: `src/components/EventTable/ColumnActionsPopover.module.css`
- Modify: `src/components/EventTable/ColumnActionsPopover.test.tsx`

- [ ] **Step 1: Write the failing tests**

Add these two tests to `src/components/EventTable/ColumnActionsPopover.test.tsx`:

```tsx
test("renders formatControls inside the popup when provided", async () => {
  const user = userEvent.setup();
  renderPopover({ formatControls: <div>Format options</div> });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(screen.getByText("Format options")).toBeInTheDocument();
});

test("does not render extra content when formatControls is absent", async () => {
  const user = userEvent.setup();
  renderPopover();
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(screen.queryByText("Format options")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to confirm the new ones fail**

```bash
npx vitest run src/components/EventTable/ColumnActionsPopover.test.tsx
```

Expected: existing tests PASS, two new tests FAIL — `renderPopover` does not accept `formatControls`.

- [ ] **Step 3: Add divider and formatSection styles to ColumnActionsPopover.module.css**

Add at the end of `src/components/EventTable/ColumnActionsPopover.module.css`:

```css
.divider {
  border: none;
  border-top: var(--border-width) solid var(--color-ink-divider);
  margin: var(--space-1) 0;
}

.formatSection {
  padding: var(--space-1) var(--space-2) var(--space-2);
}
```

- [ ] **Step 4: Update ColumnActionsPopover.tsx**

Replace the `ColumnActionsPopoverProps` interface and component in `src/components/EventTable/ColumnActionsPopover.tsx`:

```tsx
import React from "react";
import { EllipsisVertical } from "lucide-react";
import { Popover } from "@base-ui/react/popover";
import { Button } from "../../ui/Button/Button";
import styles from "./ColumnActionsPopover.module.css";

interface ColumnActionsPopoverProps {
  sortField: string | undefined;
  activeSortField: string | undefined;
  activeSortDir: "asc" | "desc" | undefined;
  onSort: (sort: string | undefined) => void;
  onOpenResize: () => void;
  formatControls?: React.ReactNode;
}

export function ColumnActionsPopover({
  sortField,
  activeSortField,
  activeSortDir,
  onSort,
  onOpenResize,
  formatControls,
}: ColumnActionsPopoverProps): React.JSX.Element {
  const isSortedAsc =
    Boolean(sortField) && activeSortField === sortField && activeSortDir === "asc";
  const isSortedDesc =
    Boolean(sortField) && activeSortField === sortField && activeSortDir === "desc";

  return (
    <Popover.Root>
      <Popover.Trigger
        render={<Button icon className={styles.trigger} />}
        aria-label="Column actions"
      >
        <EllipsisVertical size={12} aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={4} className={styles.positioner}>
          <Popover.Popup className={styles.popup}>
            {sortField && (
              <>
                <Popover.Close
                  render={<Button variant="ghost" className={styles.menuItem} />}
                  aria-pressed={isSortedAsc}
                  onClick={() => onSort(isSortedAsc ? undefined : `${sortField}.asc`)}
                >
                  Sort ascending
                </Popover.Close>
                <Popover.Close
                  render={<Button variant="ghost" className={styles.menuItem} />}
                  aria-pressed={isSortedDesc}
                  onClick={() => onSort(isSortedDesc ? undefined : `${sortField}.desc`)}
                >
                  Sort descending
                </Popover.Close>
              </>
            )}
            <Popover.Close
              render={<Button variant="ghost" className={styles.menuItem} />}
              onClick={onOpenResize}
            >
              Resize…
            </Popover.Close>
            {formatControls !== undefined && (
              <>
                <hr className={styles.divider} aria-hidden="true" />
                <div className={styles.formatSection}>{formatControls}</div>
              </>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
```

- [ ] **Step 5: Run all ColumnActionsPopover tests to confirm they pass**

```bash
npx vitest run src/components/EventTable/ColumnActionsPopover.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/EventTable/ColumnActionsPopover.tsx src/components/EventTable/ColumnActionsPopover.module.css src/components/EventTable/ColumnActionsPopover.test.tsx
git commit -m "feat: add formatControls prop to ColumnActionsPopover"
```

---

## Task 6: Update EventTable — pass format controls, remove showColumnControls

**Files:**

- Modify: `src/components/EventTable/EventTable.tsx`
- Modify: `src/components/EventTable/EventTable.test.tsx`
- Modify: `src/components/EventTable/EventTable.stories.tsx`

- [ ] **Step 1: Write a failing test for format controls in column popovers**

Add to `src/components/EventTable/EventTable.test.tsx` (inside the existing test file after the existing imports/helpers):

```tsx
test("eventType column popover renders Show icon checkbox", async () => {
  const user = userEvent.setup();
  const sharedColumnState = makeSharedColumnState();
  await renderEventTable([makeEvent()], sharedColumnState);
  const columnActionsButtons = screen.getAllByRole("button", { name: "Column actions" });
  // eventType is the 3rd column (gameId, title, eventType…)
  const eventTypePopoverBtn = columnActionsButtons[2];
  await user.click(eventTypePopoverBtn);
  expect(screen.getByRole("checkbox", { name: "Show icon" })).toBeInTheDocument();
});

test("day column popover renders Day radio button", async () => {
  const user = userEvent.setup();
  const sharedColumnState = makeSharedColumnState();
  await renderEventTable([makeEvent()], sharedColumnState);
  const columnActionsButtons = screen.getAllByRole("button", { name: "Column actions" });
  // day is the 16th column (0-indexed: gameId=0, title=1, eventType=2, group=3, shortDesc=4, longDesc=5, gameSystem=6, rulesEdition=7, minPlayers=8, maxPlayers=9, ageRequired=10, experienceRequired=11, materialsProvided=12, materialsRequired=13, materialsRequiredDetails=14, day=15)
  const dayPopoverBtn = columnActionsButtons[15];
  await user.click(dayPopoverBtn);
  expect(screen.getByRole("radio", { name: "Day" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to confirm the new ones fail**

```bash
npx vitest run src/components/EventTable/EventTable.test.tsx
```

Expected: existing tests PASS (except those using `showColumnControls` which need fixing), new tests FAIL.

- [ ] **Step 3: Update EventTable.tsx**

In `src/components/EventTable/EventTable.tsx`:

1. Add imports for `TypeFormatControls` and `DayFormatControls`:

```tsx
import { TypeFormatControls, DayFormatControls } from "./FormatDrawer";
```

2. Remove the `ColumnControlsPanel` import and the `showColumnControls` prop:

Remove:

```tsx
import { ColumnControlsPanel } from "./ColumnControlsPanel";
```

3. Remove `showColumnControls` from the `EventTableProps` interface and the destructuring at the top of `EventTable`:

```tsx
// Remove showColumnControls from props interface:
interface EventTableProps {
  events: Event[];
  activeSortField?: string;
  activeSortDir?: "asc" | "desc";
  onSort?: (sort: string | undefined) => void;
  sharedColumnState: SharedColumnState;
  linkState?: { from: string };
}

// Remove showColumnControls from destructuring:
export function EventTable({
  events,
  activeSortField,
  activeSortDir,
  onSort,
  sharedColumnState,
  linkState,
}: EventTableProps): React.JSX.Element {
```

4. Remove the `columnStateForPanel` object and the `{showColumnControls && <ColumnControlsPanel ...>}` render from the JSX.

5. In the `ColumnActionsPopover` render (inside the header map), add `formatControls` based on column id:

```tsx
<ColumnActionsPopover
  sortField={sortField}
  activeSortField={effectiveSortField}
  activeSortDir={effectiveSortDir}
  onSort={(s) => handlePopoverSort(s, label)}
  onOpenResize={() =>
    setResizeTarget({
      columnId: header.column.id,
      columnName: label,
      currentWidth: header.getSize(),
    })
  }
  formatControls={
    header.column.id === "eventType" ? (
      <TypeFormatControls
        typeDisplay={typeDisplay}
        setTypeDisplay={setTypeDisplay}
        showTypeIcon={showTypeIcon}
        setShowTypeIcon={setShowTypeIcon}
      />
    ) : header.column.id === "day" ? (
      <DayFormatControls dayFormat={dayFormat} setDayFormat={setDayFormat} />
    ) : undefined
  }
/>
```

- [ ] **Step 4: Update EventTable.test.tsx — remove showColumnControls references**

In `src/components/EventTable/EventTable.test.tsx`:

1. Update `EventTableWithHooks` — remove `showColumnControls` prop entirely:

```tsx
function EventTableWithHooks({ events }: { events: Event[] }): React.JSX.Element {
  // ... (same body but no showColumnControls parameter or prop)
  return <EventTable events={events} sharedColumnState={sharedColumnState} />;
}
```

2. Update `renderEventTable` — remove the `showColumnControls` conditional:

```tsx
async function renderEventTable(
  events: Event[] = [makeEvent()],
  sharedColumnState?: SharedColumnState,
): Promise<ReturnType<typeof render>> {
  const rootRoute = createRootRoute({
    component: () =>
      sharedColumnState !== undefined ? (
        <EventTable events={events} sharedColumnState={sharedColumnState} />
      ) : (
        <EventTableWithHooks events={events} />
      ),
  });
  // ... rest unchanged
}
```

- [ ] **Step 5: Update EventTable.stories.tsx — remove showColumnControls**

In `src/components/EventTable/EventTable.stories.tsx`, remove all references to `showColumnControls` from the `EventTableStoryProps` interface and `EventTableStory` component.

- [ ] **Step 6: Run tests to confirm they pass**

```bash
npx vitest run src/components/EventTable/EventTable.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/EventTable/EventTable.tsx src/components/EventTable/EventTable.test.tsx src/components/EventTable/EventTable.stories.tsx
git commit -m "feat: add inline format controls to eventType/day column popovers, remove showColumnControls"
```

---

## Task 7: Update SearchResults — new controls bar

**Files:**

- Modify: `src/components/SearchResults/SearchResults.tsx`
- Modify: `src/components/SearchResults/SearchResults.module.css`
- Modify: `src/components/SearchResults/SearchResults.test.tsx`

- [ ] **Step 1: Write failing tests**

In `src/components/SearchResults/SearchResults.test.tsx`, find any tests that reference `"Customize columns"` — these need to be updated or supplemented. Add new tests:

```tsx
test("controls bar renders Visibility, Format, and Sort buttons", async () => {
  server.use(
    http.get("*/api/events", () => HttpResponse.json({ data: [makeEvent()], meta: { total: 1 } })),
  );
  renderSearchResults();
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Visibility" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Format" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sort" })).toBeInTheDocument();
  });
});
```

Also update any existing test that clicks `"Customize columns"` — change the button name to `"Visibility"`.

- [ ] **Step 2: Run tests to see which ones fail**

```bash
npx vitest run src/components/SearchResults/SearchResults.test.tsx
```

Expected: new test FAILS, existing "Customize columns" tests FAIL.

- [ ] **Step 3: Update SearchResults.module.css**

In `src/components/SearchResults/SearchResults.module.css`, replace the `.controlsBar` rule and add `.tableControls`:

```css
.controlsBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.tableControls {
  display: flex;
  gap: var(--space-2);
}
```

In the `@media (width <= 60rem)` block, update `.mobileControls`:

```css
.mobileControls {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
}
```

- [ ] **Step 4: Update SearchResults.tsx**

Replace the imports and render logic in `src/components/SearchResults/SearchResults.tsx`:

```tsx
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "../../utils/api";
import { parseSortString } from "../../utils/parseSortString";
import { Pagination } from "../Pagination/Pagination";
import type { SearchParams } from "../../utils/types";
import { EmptyState } from "../../ui/EmptyState/EmptyState";
import { EventTable } from "../EventTable/EventTable";
import { EventListMobile } from "../EventTable/EventListMobile";
import { VisibilityDrawer } from "../EventTable/VisibilityDrawer";
import { FormatDrawer } from "../EventTable/FormatDrawer";
import { SortDrawer } from "../EventTable/SortDrawer";
import { useSharedColumnState } from "../../hooks/useSharedColumnState";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import styles from "./SearchResults.module.css";

// ... (SearchResultsProps interface unchanged)

export function SearchResults({
  searchParams,
  onNavigate,
  onSort,
}: SearchResultsProps): React.JSX.Element {
  const page = searchParams.page ?? 1;
  const limit = searchParams.limit ?? 100;
  const isMobile = useMediaQuery("(width <= 60rem)");
  const sharedColumnState = useSharedColumnState();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["events", searchParams],
    queryFn: () => fetchEvents(searchParams),
  });

  const activeSortState = searchParams.sort ? parseSortString(searchParams.sort) : null;
  const activeSortField = activeSortState?.field;
  const activeSortDir = activeSortState?.dir;

  return (
    <section>
      {isLoading && <EmptyState variant="loading" text="LOADING QUESTS..." />}
      {isError && (
        <EmptyState
          variant="error"
          text="QUEST FAILED"
          subtext="Unable to load events. Please try again."
        />
      )}
      {data && data.data.length === 0 && (
        <EmptyState variant="empty" text="NO QUESTS FOUND" subtext="Try broadening your search." />
      )}
      {data && data.data.length > 0 && (
        <>
          <div className={styles.controlsBar}>
            <div className={styles.tableControls}>
              <VisibilityDrawer columnState={sharedColumnState} />
              <FormatDrawer columnState={sharedColumnState} />
              <SortDrawer />
            </div>
            <Pagination
              page={page}
              limit={limit}
              total={data.meta.total}
              onNavigate={onNavigate}
              aria-label="Pagination, top"
              singleLine
            />
          </div>
          {!isMobile ? (
            <div className={styles.tableView}>
              <EventTable
                events={data.data}
                activeSortField={activeSortField}
                activeSortDir={activeSortDir}
                onSort={onSort}
                sharedColumnState={sharedColumnState}
              />
            </div>
          ) : (
            <div className={styles.mobileView}>
              <div className={styles.mobileControls}>
                <VisibilityDrawer columnState={sharedColumnState} />
                <FormatDrawer columnState={sharedColumnState} />
                <SortDrawer />
              </div>
              <EventListMobile
                events={data.data}
                visibility={sharedColumnState.visibility}
                typeDisplay={sharedColumnState.typeDisplay}
                showTypeIcon={sharedColumnState.showTypeIcon}
                dayFormat={sharedColumnState.dayFormat}
              />
            </div>
          )}
          <Pagination
            page={page}
            limit={limit}
            total={data.meta.total}
            onNavigate={onNavigate}
            aria-label="Pagination, bottom"
          />
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 5: Update SearchResults.test.tsx — fix "Customize columns" references**

In `src/components/SearchResults/SearchResults.test.tsx`, find every test that opens the column panel by clicking `"Customize columns"` and update those clicks to `"Visibility"` instead. The opened content (column groups, checkboxes) will still be the same since `VisibilityDrawer` contains the same checkboxes.

- [ ] **Step 6: Run tests to confirm they pass**

```bash
npx vitest run src/components/SearchResults/SearchResults.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/SearchResults/SearchResults.tsx src/components/SearchResults/SearchResults.module.css src/components/SearchResults/SearchResults.test.tsx
git commit -m "feat: update SearchResults controls bar with Visibility/Format/Sort drawers"
```

---

## Task 8: Update ChangelogPage

**Files:**

- Modify: `src/components/ChangelogPage/ChangelogPage.tsx`
- Modify: `src/components/ChangelogPage/ChangelogPage.module.css`

- [ ] **Step 1: Write a failing test**

Read `src/components/ChangelogPage/ChangelogPage.test.tsx` first to understand the `renderChangelogPage()` helper, then add this test:

```tsx
test("renders Visibility and Format buttons above the changelog entries", async () => {
  server.use(
    http.get("*/api/changelogs", () =>
      HttpResponse.json({ data: [makeChangelogSummary()], meta: { total: 1 } }),
    ),
  );
  await renderChangelogPage();
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Visibility" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Format" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/components/ChangelogPage/
```

Expected: new test FAIL.

- [ ] **Step 3: Add `.controls` to ChangelogPage.module.css**

In `src/components/ChangelogPage/ChangelogPage.module.css`, add:

```css
.controls {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}
```

- [ ] **Step 4: Update ChangelogPage.tsx**

Replace the `ColumnControlsPanel` import and usage with `VisibilityDrawer` and `FormatDrawer`:

```tsx
// Remove:
import { ColumnControlsPanel } from "../EventTable/ColumnControlsPanel";

// Add:
import { VisibilityDrawer } from "../EventTable/VisibilityDrawer";
import { FormatDrawer } from "../EventTable/FormatDrawer";
```

Replace the render:

```tsx
// Before:
<ColumnControlsPanel columnState={sharedColumnState} />

// After:
<div className={styles.controls}>
  <VisibilityDrawer columnState={sharedColumnState} />
  <FormatDrawer columnState={sharedColumnState} />
</div>
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npx vitest run src/components/ChangelogPage/
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/ChangelogPage/ChangelogPage.tsx src/components/ChangelogPage/ChangelogPage.module.css
git commit -m "feat: update ChangelogPage to use VisibilityDrawer and FormatDrawer"
```

---

## Task 9: Delete ColumnControlsPanel

**Files:**

- Delete: `src/components/EventTable/ColumnControlsPanel.tsx`
- Delete: `src/components/EventTable/ColumnControlsPanel.test.tsx`

- [ ] **Step 1: Verify nothing imports ColumnControlsPanel**

```bash
grep -r "ColumnControlsPanel" src/ --include="*.tsx" --include="*.ts"
```

Expected: no results. If any appear, fix those imports before proceeding.

- [ ] **Step 2: Delete the files**

```bash
rm src/components/EventTable/ColumnControlsPanel.tsx src/components/EventTable/ColumnControlsPanel.test.tsx
```

- [ ] **Step 3: Run the full test suite to confirm nothing breaks**

```bash
npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: delete ColumnControlsPanel replaced by VisibilityDrawer/FormatDrawer"
```

---

## Task 10: Clean up EventTable.module.css

**Files:**

- Modify: `src/components/EventTable/EventTable.module.css`

- [ ] **Step 1: Identify dead styles**

The following classes in `EventTable.module.css` were only used by `ColumnControlsPanel` and are now unused:

- `.visibilityPanel` and its modifiers (`.visibilityPanel[data-open]`, nested selectors)
- `.visibilityTrigger` and its hover/open variants
- `.summaryChevron` and its transform variant
- `.columnFieldset`
- `.columnGroup`
- `.columnGroupLegend`
- `.columnList`
- `.columnToggle` and all its variants
- `.columnLabel`
- `.columnCheckbox` and all its variants
- `.columnActions`
- `.panelDivider`
- `.radioIndicator` and all its variants
- `.typeDisplayDivider`
- `.typeDisplayRadioGroup`

Verify none of these are still imported anywhere:

```bash
grep -r "visibilityPanel\|visibilityTrigger\|summaryChevron\|columnFieldset\|columnGroup\|columnGroupLegend\|columnList\|columnToggle\|columnLabel\|columnCheckbox\|columnActions\|panelDivider\|radioIndicator\|typeDisplayDivider\|typeDisplayRadioGroup" src/ --include="*.tsx" --include="*.ts" --include="*.css"
```

Only occurrences should be in `EventTable.module.css` itself plus the new `VisibilityDrawer.module.css` and `FormatDrawer.module.css` (which define their own copies).

- [ ] **Step 2: Remove the dead CSS**

Delete all the identified dead style rules from `src/components/EventTable/EventTable.module.css`. Keep only the styles used by `EventTable.tsx`:

- `.tableClipWrapper`
- `.tableWrapper` and descendants
- `.resizableTh`
- `.thContent`
- `.sortButton` and hover
- `.sortIndicator`
- `.resizeHandle` and its pseudo-elements, hover states, and media query

- [ ] **Step 3: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 4: Run the linter and type-checker**

```bash
npm run typecheck && npm run lint
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/EventTable/EventTable.module.css
git commit -m "refactor: remove unused column panel styles from EventTable.module.css"
```
