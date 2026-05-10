# Multisort Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add multisort to the search and changelog pages via a new `SortDrawer` UI, drag-and-drop reordering, and updated column-header sort behavior.

**Architecture:** Pure utility functions (`parseSorts`, `serializeSorts`, `sortEventsMulti`, `addSort`, `removeSort`, `setSortDir`, `reorderSort`) replace single-sort utilities. `SortState[]` replaces `activeSortField`/`activeSortDir` props everywhere. `SortDrawer` is a controlled drawer with a combobox add-field control and a dnd-kit sortable list. Column headers add/toggle fields when `activeSort.length < 2` and open the drawer when `>= 2`. Both pages use a `?sort=` URL param.

**Tech Stack:** React, TypeScript, Vitest, `@testing-library/react`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, Base UI (`@base-ui/react/combobox`, `@base-ui/react/dialog`), Lucide React, CSS Modules

---

## File Map

| File                                                        | Action                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------- |
| `src/utils/parseSorts.ts`                                   | Create — `parseSorts`, `serializeSorts`                       |
| `src/utils/parseSorts.test.ts`                              | Create                                                        |
| `src/utils/sortManipulation.ts`                             | Create — `addSort`, `removeSort`, `setSortDir`, `reorderSort` |
| `src/utils/sortManipulation.test.ts`                        | Create                                                        |
| `src/utils/sortEventsMulti.ts`                              | Create — replaces `sortEvents.ts`                             |
| `src/utils/sortEventsMulti.test.ts`                         | Create                                                        |
| `src/utils/parseSortString.ts`                              | Delete (Task 9)                                               |
| `src/utils/parseSortString.test.ts`                         | Delete (Task 9)                                               |
| `src/utils/sortEvents.ts`                                   | Delete (Task 12)                                              |
| `src/utils/sortEvents.test.ts`                              | Delete (Task 12)                                              |
| `src/hooks/useSortState.ts`                                 | Delete (Task 9)                                               |
| `src/hooks/useSortState.test.ts`                            | Delete (Task 9)                                               |
| `src/ui/Drawer/Drawer.tsx`                                  | Modify — add optional `open`/`onOpenChange` controlled props  |
| `src/ui/Drawer/Drawer.test.tsx`                             | Modify — add controlled-mode test                             |
| `src/components/EventTable/SortDrawer.tsx`                  | Rewrite                                                       |
| `src/components/EventTable/SortDrawer.module.css`           | Create                                                        |
| `src/components/EventTable/SortDrawer.test.tsx`             | Rewrite                                                       |
| `src/components/EventTable/ColumnActionsPopover.tsx`        | Modify                                                        |
| `src/components/EventTable/ColumnActionsPopover.test.tsx`   | Modify                                                        |
| `src/components/EventTable/EventTable.tsx`                  | Modify                                                        |
| `src/components/EventTable/EventTable.test.tsx`             | Modify                                                        |
| `src/components/EventTable/EventTable.stories.tsx`          | Modify                                                        |
| `src/components/SearchResults/SearchResults.tsx`            | Modify                                                        |
| `src/components/ChangelogPage/openParam.ts`                 | Modify — simplify, remove sort                                |
| `src/components/ChangelogPage/openParam.test.ts`            | Modify                                                        |
| `src/components/EventTable/ColumnControlsPanel.tsx`         | Modify — add SortDrawer                                       |
| `src/routes/changelog.tsx`                                  | Modify — add `sort` to validateSearch                         |
| `src/components/ChangelogPage/ChangelogPage.tsx`            | Modify                                                        |
| `src/components/ChangelogPage/ChangelogRow.tsx`             | Modify                                                        |
| `src/components/ChangelogPage/ChangelogRow.test.tsx`        | Modify                                                        |
| `src/components/ChangelogPage/ChangelogEntryPanel.tsx`      | Modify                                                        |
| `src/components/ChangelogPage/ChangelogEntryPanel.test.tsx` | Modify                                                        |

---

## Task 1: Install dnd-kit

**Files:**

- Modify: `package.json` (via npm)

- [ ] **Step 1: Install packages**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Expected: packages added to `node_modules` and `package.json` dependencies.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities"
```

---

## Task 2: Add `parseSorts` and `serializeSorts` utilities

**Files:**

- Create: `src/utils/parseSorts.ts`
- Create: `src/utils/parseSorts.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/utils/parseSorts.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseSorts, serializeSorts } from "./parseSorts";

describe("parseSorts", () => {
  it("parses a single asc entry", () => {
    expect(parseSorts("startDateTime.asc")).toStrictEqual([{ field: "startDateTime", dir: "asc" }]);
  });

  it("parses multiple entries", () => {
    expect(parseSorts("startDateTime.asc,title.desc")).toStrictEqual([
      { field: "startDateTime", dir: "asc" },
      { field: "title", dir: "desc" },
    ]);
  });

  it("returns [] for empty string", () => {
    expect(parseSorts("")).toStrictEqual([]);
  });

  it("skips tokens with invalid direction", () => {
    expect(parseSorts("startDateTime.sideways")).toStrictEqual([]);
  });

  it("skips tokens missing direction", () => {
    expect(parseSorts("startDateTime")).toStrictEqual([]);
  });

  it("preserves order", () => {
    const result = parseSorts("cost.desc,title.asc,startDateTime.asc");
    expect(result.map((s) => s.field)).toStrictEqual(["cost", "title", "startDateTime"]);
  });
});

describe("serializeSorts", () => {
  it("serializes a single entry", () => {
    expect(serializeSorts([{ field: "startDateTime", dir: "asc" }])).toBe("startDateTime.asc");
  });

  it("serializes multiple entries", () => {
    expect(
      serializeSorts([
        { field: "startDateTime", dir: "asc" },
        { field: "title", dir: "desc" },
      ]),
    ).toBe("startDateTime.asc,title.desc");
  });

  it("returns undefined for empty array", () => {
    expect(serializeSorts([])).toBeUndefined();
  });
});

describe("round-trip", () => {
  it("parse then serialize returns the original string", () => {
    const s = "startDateTime.asc,title.desc,cost.asc";
    expect(serializeSorts(parseSorts(s))).toBe(s);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/utils/parseSorts.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/utils/parseSorts.ts`:

```ts
import type { SortState } from "./types";

export function parseSorts(s: string): SortState[] {
  if (!s) return [];
  return s.split(",").reduce<SortState[]>((acc, token) => {
    const dot = token.indexOf(".");
    if (dot === -1) return acc;
    const field = token.slice(0, dot);
    const dir = token.slice(dot + 1);
    if (field && (dir === "asc" || dir === "desc")) {
      acc.push({ field, dir });
    }
    return acc;
  }, []);
}

export function serializeSorts(sorts: SortState[]): string | undefined {
  if (sorts.length === 0) return undefined;
  return sorts.map((s) => `${s.field}.${s.dir}`).join(",");
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/utils/parseSorts.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/parseSorts.ts src/utils/parseSorts.test.ts
git commit -m "feat: add parseSorts and serializeSorts utilities"
```

---

## Task 3: Add sort manipulation utilities

**Files:**

- Create: `src/utils/sortManipulation.ts`
- Create: `src/utils/sortManipulation.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/utils/sortManipulation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { addSort, removeSort, setSortDir, reorderSort } from "./sortManipulation";
import type { SortState } from "./types";

const s1: SortState = { field: "title", dir: "asc" };
const s2: SortState = { field: "cost", dir: "desc" };
const s3: SortState = { field: "startDateTime", dir: "asc" };

describe("addSort", () => {
  it("appends a new field with asc direction by default", () => {
    expect(addSort([], "title")).toStrictEqual([{ field: "title", dir: "asc" }]);
  });

  it("appends with specified direction", () => {
    expect(addSort([], "title", "desc")).toStrictEqual([{ field: "title", dir: "desc" }]);
  });

  it("does not add a field already present", () => {
    expect(addSort([s1], "title")).toStrictEqual([s1]);
  });

  it("does not mutate the original array", () => {
    const original = [s1];
    addSort(original, "cost");
    expect(original).toHaveLength(1);
  });
});

describe("removeSort", () => {
  it("removes the matching field", () => {
    expect(removeSort([s1, s2], "title")).toStrictEqual([s2]);
  });

  it("returns the same array when field is not present", () => {
    expect(removeSort([s1], "cost")).toStrictEqual([s1]);
  });

  it("does not mutate the original array", () => {
    const original = [s1, s2];
    removeSort(original, "title");
    expect(original).toHaveLength(2);
  });
});

describe("setSortDir", () => {
  it("updates direction for the matching field", () => {
    expect(setSortDir([s1], "title", "desc")).toStrictEqual([{ field: "title", dir: "desc" }]);
  });

  it("leaves other fields unchanged", () => {
    expect(setSortDir([s1, s2], "title", "desc")).toStrictEqual([
      { field: "title", dir: "desc" },
      s2,
    ]);
  });

  it("does not mutate the original array", () => {
    const original = [s1];
    setSortDir(original, "title", "desc");
    expect(original[0].dir).toBe("asc");
  });
});

describe("reorderSort", () => {
  it("moves an entry forward", () => {
    expect(reorderSort([s1, s2, s3], 0, 2)).toStrictEqual([s2, s3, s1]);
  });

  it("moves an entry backward", () => {
    expect(reorderSort([s1, s2, s3], 2, 0)).toStrictEqual([s3, s1, s2]);
  });

  it("no-op when fromIndex equals toIndex", () => {
    expect(reorderSort([s1, s2], 1, 1)).toStrictEqual([s1, s2]);
  });

  it("does not mutate the original array", () => {
    const original = [s1, s2];
    reorderSort(original, 0, 1);
    expect(original[0]).toBe(s1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/utils/sortManipulation.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/utils/sortManipulation.ts`:

```ts
import type { SortState } from "./types";

export function addSort(
  sorts: SortState[],
  field: string,
  dir: "asc" | "desc" = "asc",
): SortState[] {
  if (sorts.some((s) => s.field === field)) return sorts;
  return [...sorts, { field, dir }];
}

export function removeSort(sorts: SortState[], field: string): SortState[] {
  return sorts.filter((s) => s.field !== field);
}

export function setSortDir(sorts: SortState[], field: string, dir: "asc" | "desc"): SortState[] {
  return sorts.map((s) => (s.field === field ? { ...s, dir } : s));
}

export function reorderSort(sorts: SortState[], fromIndex: number, toIndex: number): SortState[] {
  const next = [...sorts];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/utils/sortManipulation.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/sortManipulation.ts src/utils/sortManipulation.test.ts
git commit -m "feat: add sort manipulation utilities"
```

---

## Task 4: Add `sortEventsMulti`

**Files:**

- Create: `src/utils/sortEventsMulti.ts`
- Create: `src/utils/sortEventsMulti.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/utils/sortEventsMulti.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { sortEventsMulti } from "./sortEventsMulti";
import { makeEvent } from "../test/msw/factory";

describe("sortEventsMulti", () => {
  it("returns the same array when sorts is empty", () => {
    const events = [makeEvent({ title: "B" }), makeEvent({ title: "A" })];
    expect(sortEventsMulti(events, [])).toStrictEqual(events);
  });

  it("sorts by a single string field ascending", () => {
    const events = [
      makeEvent({ title: "B" }),
      makeEvent({ title: "A" }),
      makeEvent({ title: "C" }),
    ];
    const sorted = sortEventsMulti(events, [{ field: "title", dir: "asc" }]);
    expect(sorted.map((e) => e.attributes.title)).toStrictEqual(["A", "B", "C"]);
  });

  it("sorts by a single string field descending", () => {
    const events = [
      makeEvent({ title: "B" }),
      makeEvent({ title: "A" }),
      makeEvent({ title: "C" }),
    ];
    const sorted = sortEventsMulti(events, [{ field: "title", dir: "desc" }]);
    expect(sorted.map((e) => e.attributes.title)).toStrictEqual(["C", "B", "A"]);
  });

  it("sorts by a numeric field ascending", () => {
    const events = [makeEvent({ cost: 3 }), makeEvent({ cost: 1 }), makeEvent({ cost: 2 })];
    const sorted = sortEventsMulti(events, [{ field: "cost", dir: "asc" }]);
    expect(sorted.map((e) => e.attributes.cost)).toStrictEqual([1, 2, 3]);
  });

  it("applies secondary sort as tiebreaker", () => {
    const events = [
      makeEvent({ cost: 10, title: "B" }),
      makeEvent({ cost: 5, title: "A" }),
      makeEvent({ cost: 10, title: "A" }),
    ];
    const sorted = sortEventsMulti(events, [
      { field: "cost", dir: "asc" },
      { field: "title", dir: "asc" },
    ]);
    expect(sorted.map((e) => `${e.attributes.cost}:${e.attributes.title}`)).toStrictEqual([
      "5:A",
      "10:A",
      "10:B",
    ]);
  });

  it("does not mutate the original array", () => {
    const events = [makeEvent({ title: "B" }), makeEvent({ title: "A" })];
    sortEventsMulti(events, [{ field: "title", dir: "asc" }]);
    expect(events[0].attributes.title).toBe("B");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/utils/sortEventsMulti.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/utils/sortEventsMulti.ts`:

```ts
import type { Event, EventAttributes, SortState } from "./types";

export function sortEventsMulti(events: Event[], sorts: SortState[]): Event[] {
  if (sorts.length === 0) return events;
  return [...events].sort((a, b) => {
    for (const { field, dir } of sorts) {
      const av = a.attributes[field as keyof EventAttributes];
      const bv = b.attributes[field as keyof EventAttributes];
      let cmp = 0;
      if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv;
      } else if (av !== undefined && bv !== undefined) {
        cmp = String(av).localeCompare(String(bv));
      }
      if (cmp !== 0) return dir === "desc" ? -cmp : cmp;
    }
    return 0;
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/utils/sortEventsMulti.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/sortEventsMulti.ts src/utils/sortEventsMulti.test.ts
git commit -m "feat: add sortEventsMulti utility"
```

---

## Task 5: Add controlled-mode support to `Drawer`

**Files:**

- Modify: `src/ui/Drawer/Drawer.tsx`
- Modify: `src/ui/Drawer/Drawer.test.tsx`

- [ ] **Step 1: Add a failing test for controlled open**

Open `src/ui/Drawer/Drawer.test.tsx`. Add at the end:

```tsx
test("opens when open prop is true and closes when changed to false", async () => {
  const onOpenChange = vi.fn<(open: boolean) => void>();
  const { rerender } = render(
    <Drawer
      trigger={<button type="button">Open</button>}
      title="Test"
      open={true}
      onOpenChange={onOpenChange}
    >
      Content
    </Drawer>,
  );
  expect(screen.getByRole("dialog", { name: "Test" })).toBeInTheDocument();

  rerender(
    <Drawer
      trigger={<button type="button">Open</button>}
      title="Test"
      open={false}
      onOpenChange={onOpenChange}
    >
      Content
    </Drawer>,
  );
  expect(screen.queryByRole("dialog", { name: "Test" })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/ui/Drawer/Drawer.test.tsx
```

Expected: the new test fails because `Drawer` ignores `open` prop.

- [ ] **Step 3: Update `Drawer` to support controlled mode**

Open `src/ui/Drawer/Drawer.tsx`. Add `open` and `onOpenChange` to the props interface and wire them to `Dialog.Root`:

```tsx
interface DrawerProps {
  trigger: React.ReactNode;
  title: string;
  footer?: React.ReactNode;
  side?: "left" | "right";
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Drawer({
  trigger,
  title,
  footer,
  side = "left",
  children,
  open,
  onOpenChange,
}: DrawerProps): React.JSX.Element {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {/* rest of JSX unchanged */}
    </Dialog.Root>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/ui/Drawer/Drawer.test.tsx
```

Expected: all tests pass including the new controlled-mode test.

- [ ] **Step 5: Commit**

```bash
git add src/ui/Drawer/Drawer.tsx src/ui/Drawer/Drawer.test.tsx
git commit -m "feat(Drawer): add controlled open/onOpenChange props"
```

---

## Task 6: Build `SortDrawer` — empty state, combobox, and sort list

**Files:**

- Create: `src/components/EventTable/SortDrawer.module.css`
- Rewrite: `src/components/EventTable/SortDrawer.tsx`
- Rewrite: `src/components/EventTable/SortDrawer.test.tsx`

- [ ] **Step 1: Write failing tests**

Rewrite `src/components/EventTable/SortDrawer.test.tsx`:

```tsx
import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test, describe } from "vitest";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  createMemoryHistory,
} from "@tanstack/react-router";
import { SortDrawer } from "./SortDrawer";
import type { SortState } from "../../utils/types";

function renderDrawer(
  props: Partial<React.ComponentProps<typeof SortDrawer>> = {},
): ReturnType<typeof render> {
  const rootRoute = createRootRoute({ component: () => <RouterProvider router={router} /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => (
      <SortDrawer
        activeSort={[]}
        onSort={vi.fn()}
        columnVisibility={{}}
        open={true}
        onOpenChange={vi.fn()}
        {...props}
      />
    ),
  });
  const routeTree = rootRoute.addChildren([indexRoute]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(<RouterProvider router={router} />);
}

test("renders Sort trigger button", () => {
  render(
    <SortDrawer
      activeSort={[]}
      onSort={vi.fn()}
      columnVisibility={{}}
      open={false}
      onOpenChange={vi.fn()}
    />,
  );
  expect(screen.getByRole("button", { name: "Sort" })).toBeInTheDocument();
});

test("shows trigger badge count when active sorts exist", () => {
  render(
    <SortDrawer
      activeSort={[
        { field: "title", dir: "asc" },
        { field: "cost", dir: "desc" },
      ]}
      onSort={vi.fn()}
      columnVisibility={{}}
      open={false}
      onOpenChange={vi.fn()}
    />,
  );
  expect(screen.getByRole("button", { name: /Sort/ })).toHaveTextContent("Sort · 2");
});

describe("drawer content (open=true)", () => {
  test("shows 'No fields sorted' empty state when activeSort is empty", () => {
    renderDrawer({ activeSort: [] });
    expect(screen.getByText("No fields sorted")).toBeInTheDocument();
  });

  test("shows combobox label 'Pick fields to sort by'", () => {
    renderDrawer();
    expect(screen.getByText("Pick fields to sort by")).toBeInTheDocument();
  });

  test("adding a field via combobox calls onSort with field appended as asc", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn<(sorts: SortState[]) => void>();
    renderDrawer({ onSort, columnVisibility: {} });
    await user.click(screen.getByRole("combobox", { name: "Pick fields to sort by" }));
    await user.click(screen.getByRole("option", { name: "Title" }));
    expect(onSort).toHaveBeenCalledWith([{ field: "title", dir: "asc" }]);
  });

  test("already-sorted fields are not shown in the combobox", async () => {
    const user = userEvent.setup();
    renderDrawer({ activeSort: [{ field: "title", dir: "asc" }], columnVisibility: {} });
    await user.click(screen.getByRole("combobox", { name: "Pick fields to sort by" }));
    expect(screen.queryByRole("option", { name: "Title" })).not.toBeInTheDocument();
  });

  test("shows sort list rows for each active sort", () => {
    renderDrawer({
      activeSort: [
        { field: "title", dir: "asc" },
        { field: "cost", dir: "desc" },
      ],
    });
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Cost")).toBeInTheDocument();
  });

  test("remove button calls onSort without that field", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn<(sorts: SortState[]) => void>();
    renderDrawer({
      activeSort: [
        { field: "title", dir: "asc" },
        { field: "cost", dir: "desc" },
      ],
      onSort,
    });
    await user.click(screen.getByRole("button", { name: "Remove Title sort" }));
    expect(onSort).toHaveBeenCalledWith([{ field: "cost", dir: "desc" }]);
  });

  test("asc/desc toggle button calls onSort with flipped direction", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn<(sorts: SortState[]) => void>();
    renderDrawer({
      activeSort: [{ field: "title", dir: "asc" }],
      onSort,
    });
    await user.click(screen.getByRole("button", { name: "Title: ascending, click to toggle" }));
    expect(onSort).toHaveBeenCalledWith([{ field: "title", dir: "desc" }]);
  });

  test("up arrow calls onSort with item moved earlier", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn<(sorts: SortState[]) => void>();
    renderDrawer({
      activeSort: [
        { field: "title", dir: "asc" },
        { field: "cost", dir: "desc" },
      ],
      onSort,
    });
    await user.click(screen.getByRole("button", { name: "Move Cost up" }));
    expect(onSort).toHaveBeenCalledWith([
      { field: "cost", dir: "desc" },
      { field: "title", dir: "asc" },
    ]);
  });

  test("down arrow calls onSort with item moved later", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn<(sorts: SortState[]) => void>();
    renderDrawer({
      activeSort: [
        { field: "title", dir: "asc" },
        { field: "cost", dir: "desc" },
      ],
      onSort,
    });
    await user.click(screen.getByRole("button", { name: "Move Title down" }));
    expect(onSort).toHaveBeenCalledWith([
      { field: "cost", dir: "desc" },
      { field: "title", dir: "asc" },
    ]);
  });

  test("up arrow is disabled for the first item", () => {
    renderDrawer({
      activeSort: [
        { field: "title", dir: "asc" },
        { field: "cost", dir: "desc" },
      ],
    });
    expect(screen.getByRole("button", { name: "Move Title up" })).toBeDisabled();
  });

  test("down arrow is disabled for the last item", () => {
    renderDrawer({
      activeSort: [
        { field: "title", dir: "asc" },
        { field: "cost", dir: "desc" },
      ],
    });
    expect(screen.getByRole("button", { name: "Move Cost down" })).toBeDisabled();
  });

  test("clear sorting button calls onSort with empty array", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn<(sorts: SortState[]) => void>();
    renderDrawer({
      activeSort: [{ field: "title", dir: "asc" }],
      onSort,
    });
    await user.click(screen.getByRole("button", { name: "Clear sorting" }));
    expect(onSort).toHaveBeenCalledWith([]);
  });

  test("clear sorting button is not shown when activeSort is empty", () => {
    renderDrawer({ activeSort: [] });
    expect(screen.queryByRole("button", { name: "Clear sorting" })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/EventTable/SortDrawer.test.tsx
```

Expected: FAIL — tests reference new props not yet on `SortDrawer`.

- [ ] **Step 3: Create the CSS module**

Create `src/components/EventTable/SortDrawer.module.css`:

```css
.emptyState {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  margin: 0;
}

.sortList {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.sortItem {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) 0;
}

.fieldName {
  flex: 1;
  font-size: var(--font-size-sm);
}

.dragHandle {
  cursor: grab;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  background: none;
  border: none;
  padding: 0;
}

.dragHandle:active {
  cursor: grabbing;
}

.drawerBody {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
```

- [ ] **Step 4: Implement `SortDrawer`**

Rewrite `src/components/EventTable/SortDrawer.tsx`:

```tsx
import React, { useState } from "react";
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  X,
  Check,
  ChevronDown as DropIcon,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Combobox } from "@base-ui/react/combobox";
import { Drawer } from "../../ui/Drawer/Drawer";
import { Button } from "../../ui/Button/Button";
import { COLUMNS } from "./columns";
import { addSort, removeSort, setSortDir, reorderSort } from "../../utils/sortManipulation";
import type { SortState } from "../../utils/types";
import styles from "./SortDrawer.module.css";

interface SortDrawerProps {
  activeSort: SortState[];
  onSort: (sorts: SortState[]) => void;
  columnVisibility: Record<string, boolean>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getSortFieldLabel(sortField: string): string {
  const col = COLUMNS.find((c) => c.meta?.sortField === sortField);
  return typeof col?.header === "string" ? col.header : sortField;
}

interface SortableItemProps {
  sort: SortState;
  isFirst: boolean;
  isLast: boolean;
  onUp: () => void;
  onDown: () => void;
  onToggleDir: () => void;
  onRemove: () => void;
}

function SortableItem({
  sort,
  isFirst,
  isLast,
  onUp,
  onDown,
  onToggleDir,
  onRemove,
}: SortableItemProps): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: sort.field,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const label = getSortFieldLabel(sort.field);

  return (
    <li ref={setNodeRef} style={style} className={styles.sortItem}>
      <button
        type="button"
        className={styles.dragHandle}
        aria-label={`Drag ${label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} aria-hidden="true" />
      </button>
      <button type="button" onClick={onUp} disabled={isFirst} aria-label={`Move ${label} up`}>
        <ChevronUp size={14} aria-hidden="true" />
      </button>
      <button type="button" onClick={onDown} disabled={isLast} aria-label={`Move ${label} down`}>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      <span className={styles.fieldName}>{label}</span>
      <button
        type="button"
        onClick={onToggleDir}
        aria-label={`${label}: ${sort.dir === "asc" ? "ascending" : "descending"}, click to toggle`}
      >
        {sort.dir === "asc" ? "Asc" : "Desc"}
      </button>
      <button type="button" onClick={onRemove} aria-label={`Remove ${label} sort`}>
        <X size={14} aria-hidden="true" />
      </button>
    </li>
  );
}

export function SortDrawer({
  activeSort,
  onSort,
  columnVisibility,
  open,
  onOpenChange,
}: SortDrawerProps): React.JSX.Element {
  const [resetKey, setResetKey] = useState(0);
  const filter = Combobox.useFilter();

  const sortedFields = new Set(activeSort.map((s) => s.field));

  const allOptions = COLUMNS.filter(
    (c) => c.id && c.meta?.sortField && !sortedFields.has(c.meta.sortField),
  ).map((c) => ({
    value: c.meta!.sortField!,
    label: typeof c.header === "string" ? c.header : (c.id ?? ""),
    visible: columnVisibility[c.id!] !== false,
  }));

  const visibleOptions = allOptions.filter((o) => o.visible);
  const hiddenOptions = allOptions
    .filter((o) => !o.visible)
    .sort((a, b) => a.label.localeCompare(b.label));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const fromIndex = activeSort.findIndex((s) => s.field === active.id);
      const toIndex = activeSort.findIndex((s) => s.field === over.id);
      if (fromIndex !== -1 && toIndex !== -1) {
        onSort(reorderSort(activeSort, fromIndex, toIndex));
      }
    }
  }

  const triggerLabel = activeSort.length > 0 ? `Sort · ${activeSort.length}` : "Sort";

  return (
    <Drawer
      trigger={
        <Button type="button" variant="secondary">
          {triggerLabel}
        </Button>
      }
      title="Sort"
      open={open}
      onOpenChange={onOpenChange}
      footer={
        activeSort.length > 0 ? (
          <Button type="button" variant="ghost" onClick={() => onSort([])}>
            Clear sorting
          </Button>
        ) : undefined
      }
    >
      <div className={styles.drawerBody}>
        <Combobox.Root
          key={resetKey}
          onValueChange={(value) => {
            if (value) {
              onSort(addSort(activeSort, value));
              setResetKey((k) => k + 1);
            }
          }}
        >
          <label>
            Pick fields to sort by
            <Combobox.InputGroup>
              <Combobox.Input placeholder="Search fields…" />
              <Combobox.Trigger aria-label="Toggle field list">
                <DropIcon size={14} aria-hidden="true" />
              </Combobox.Trigger>
            </Combobox.InputGroup>
          </label>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.List>
                  {visibleOptions.length > 0 && (
                    <>
                      <Combobox.GroupLabel>Visible columns</Combobox.GroupLabel>
                      {visibleOptions.map((opt) => (
                        <Combobox.Item key={opt.value} value={opt.value}>
                          {opt.label}
                          <Combobox.ItemIndicator>
                            <Check size={12} aria-hidden="true" />
                          </Combobox.ItemIndicator>
                        </Combobox.Item>
                      ))}
                    </>
                  )}
                  {hiddenOptions.length > 0 && (
                    <>
                      <Combobox.GroupLabel>Other fields</Combobox.GroupLabel>
                      {hiddenOptions.map((opt) => (
                        <Combobox.Item key={opt.value} value={opt.value}>
                          {opt.label}
                          <Combobox.ItemIndicator>
                            <Check size={12} aria-hidden="true" />
                          </Combobox.ItemIndicator>
                        </Combobox.Item>
                      ))}
                    </>
                  )}
                  {visibleOptions.length === 0 && hiddenOptions.length === 0 && (
                    <div>No fields available</div>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>

        {activeSort.length === 0 ? (
          <p className={styles.emptyState}>No fields sorted</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={activeSort.map((s) => s.field)}
              strategy={verticalListSortingStrategy}
            >
              <ul className={styles.sortList}>
                {activeSort.map((sort, index) => (
                  <SortableItem
                    key={sort.field}
                    sort={sort}
                    isFirst={index === 0}
                    isLast={index === activeSort.length - 1}
                    onUp={() => onSort(reorderSort(activeSort, index, index - 1))}
                    onDown={() => onSort(reorderSort(activeSort, index, index + 1))}
                    onToggleDir={() =>
                      onSort(
                        setSortDir(activeSort, sort.field, sort.dir === "asc" ? "desc" : "asc"),
                      )
                    }
                    onRemove={() => onSort(removeSort(activeSort, sort.field))}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </Drawer>
  );
}
```

**Note on Combobox API:** The Base UI Combobox may not have `GroupLabel` — if this component does not exist, render group headings as non-interactive `<div role="presentation">` elements between items instead.

- [ ] **Step 5: Run tests**

```bash
npx vitest run src/components/EventTable/SortDrawer.test.tsx
```

Expected: all tests pass. Adjust component implementation if any fail due to Base UI API differences.

- [ ] **Step 6: Commit**

```bash
git add src/components/EventTable/SortDrawer.tsx src/components/EventTable/SortDrawer.module.css src/components/EventTable/SortDrawer.test.tsx
git commit -m "feat: implement SortDrawer with multisort UI"
```

---

## Task 7: Update `ColumnActionsPopover`

**Files:**

- Modify: `src/components/EventTable/ColumnActionsPopover.tsx`
- Modify: `src/components/EventTable/ColumnActionsPopover.test.tsx`

- [ ] **Step 1: Update the existing tests and add new ones**

Rewrite `src/components/EventTable/ColumnActionsPopover.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test } from "vitest";
import { ColumnActionsPopover } from "./ColumnActionsPopover";
import type { SortState } from "../../utils/types";

function renderPopover(
  overrides: Partial<React.ComponentProps<typeof ColumnActionsPopover>> = {},
): ReturnType<typeof render> {
  return render(
    <ColumnActionsPopover
      sortField="title"
      activeSort={[]}
      onSort={vi.fn<(sorts: SortState[]) => void>()}
      onOpenSortDrawer={vi.fn<() => void>()}
      onOpenResize={vi.fn<() => void>()}
      formatControls={undefined}
      {...overrides}
    />,
  );
}

test("renders a column actions button", () => {
  renderPopover();
  expect(screen.getByRole("button", { name: "Column actions" })).toBeInTheDocument();
});

test("shows sort and resize actions when 0 sorts active", async () => {
  const user = userEvent.setup();
  renderPopover({ activeSort: [] });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(screen.getByRole("button", { name: "Sort ascending" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sort descending" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Resize…" })).toBeInTheDocument();
});

test("shows sort and resize actions when 1 sort active on a different field", async () => {
  const user = userEvent.setup();
  renderPopover({ activeSort: [{ field: "cost", dir: "asc" }] });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(screen.getByRole("button", { name: "Sort ascending" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sort descending" })).toBeInTheDocument();
});

test("shows 'Sort by this field…' when 2+ sorts active and field not sorted", async () => {
  const user = userEvent.setup();
  renderPopover({
    activeSort: [
      { field: "cost", dir: "asc" },
      { field: "startDateTime", dir: "asc" },
    ],
  });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(screen.getByRole("button", { name: "Sort by this field…" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Sort ascending" })).not.toBeInTheDocument();
});

test("'Sort by this field…' calls onOpenSortDrawer", async () => {
  const user = userEvent.setup();
  const onOpenSortDrawer = vi.fn<() => void>();
  renderPopover({
    activeSort: [
      { field: "cost", dir: "asc" },
      { field: "startDateTime", dir: "asc" },
    ],
    onOpenSortDrawer,
  });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  await user.click(screen.getByRole("button", { name: "Sort by this field…" }));
  expect(onOpenSortDrawer).toHaveBeenCalledTimes(1);
});

test("shows sort buttons and Remove sort when field is in activeSort", async () => {
  const user = userEvent.setup();
  renderPopover({ activeSort: [{ field: "title", dir: "asc" }] });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(screen.getByRole("button", { name: "Sort ascending" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sort descending" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Remove sort" })).toBeInTheDocument();
});

test("Sort ascending has aria-pressed=true when field is sorted asc", async () => {
  const user = userEvent.setup();
  renderPopover({ activeSort: [{ field: "title", dir: "asc" }] });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(screen.getByRole("button", { name: "Sort ascending" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("Sort descending has aria-pressed=true when field is sorted desc", async () => {
  const user = userEvent.setup();
  renderPopover({ activeSort: [{ field: "title", dir: "desc" }] });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(screen.getByRole("button", { name: "Sort descending" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("clicking Sort ascending when unsorted calls onSort with field added", async () => {
  const user = userEvent.setup();
  const onSort = vi.fn<(sorts: SortState[]) => void>();
  renderPopover({ activeSort: [], onSort });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  await user.click(screen.getByRole("button", { name: "Sort ascending" }));
  expect(onSort).toHaveBeenCalledWith([{ field: "title", dir: "asc" }]);
});

test("clicking Sort descending when unsorted calls onSort with field added desc", async () => {
  const user = userEvent.setup();
  const onSort = vi.fn<(sorts: SortState[]) => void>();
  renderPopover({ activeSort: [], onSort });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  await user.click(screen.getByRole("button", { name: "Sort descending" }));
  expect(onSort).toHaveBeenCalledWith([{ field: "title", dir: "desc" }]);
});

test("clicking Sort ascending when already asc calls onSort removing the field", async () => {
  const user = userEvent.setup();
  const onSort = vi.fn<(sorts: SortState[]) => void>();
  renderPopover({ activeSort: [{ field: "title", dir: "asc" }], onSort });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  await user.click(screen.getByRole("button", { name: "Sort ascending" }));
  expect(onSort).toHaveBeenCalledWith([]);
});

test("clicking Sort descending when sorted asc calls onSort changing direction", async () => {
  const user = userEvent.setup();
  const onSort = vi.fn<(sorts: SortState[]) => void>();
  renderPopover({ activeSort: [{ field: "title", dir: "asc" }], onSort });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  await user.click(screen.getByRole("button", { name: "Sort descending" }));
  expect(onSort).toHaveBeenCalledWith([{ field: "title", dir: "desc" }]);
});

test("clicking Remove sort calls onSort without that field", async () => {
  const user = userEvent.setup();
  const onSort = vi.fn<(sorts: SortState[]) => void>();
  renderPopover({
    activeSort: [
      { field: "title", dir: "asc" },
      { field: "cost", dir: "desc" },
    ],
    onSort,
  });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  await user.click(screen.getByRole("button", { name: "Remove sort" }));
  expect(onSort).toHaveBeenCalledWith([{ field: "cost", dir: "desc" }]);
});

test("clicking Resize… calls onOpenResize", async () => {
  const user = userEvent.setup();
  const onOpenResize = vi.fn<() => void>();
  renderPopover({ onOpenResize });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  await user.click(screen.getByRole("button", { name: "Resize…" }));
  expect(onOpenResize).toHaveBeenCalledTimes(1);
});

test("does not render sort buttons when sortField is undefined", async () => {
  const user = userEvent.setup();
  renderPopover({ sortField: undefined });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(screen.queryByRole("button", { name: "Sort ascending" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Sort by this field…" })).not.toBeInTheDocument();
});

test("renders formatControls inside the popup when provided", async () => {
  const user = userEvent.setup();
  renderPopover({ formatControls: <div>Format options</div> });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(screen.getByText("Format options")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/EventTable/ColumnActionsPopover.test.tsx
```

Expected: failures on prop type mismatches and new behavior tests.

- [ ] **Step 3: Update `ColumnActionsPopover`**

Rewrite `src/components/EventTable/ColumnActionsPopover.tsx`:

```tsx
import React from "react";
import { EllipsisVertical } from "lucide-react";
import { Popover } from "@base-ui/react/popover";
import { Button } from "../../ui/Button/Button";
import { addSort, removeSort, setSortDir } from "../../utils/sortManipulation";
import type { SortState } from "../../utils/types";
import styles from "./ColumnActionsPopover.module.css";

interface ColumnActionsPopoverProps {
  sortField: string | undefined;
  activeSort: SortState[];
  onSort: (sorts: SortState[]) => void;
  onOpenSortDrawer: () => void;
  onOpenResize: () => void;
  formatControls?: React.ReactNode;
}

export function ColumnActionsPopover({
  sortField,
  activeSort,
  onSort,
  onOpenSortDrawer,
  onOpenResize,
  formatControls,
}: ColumnActionsPopoverProps): React.JSX.Element {
  const sortEntry = sortField ? activeSort.find((s) => s.field === sortField) : undefined;
  const isInSort = sortEntry !== undefined;
  const isSortedAsc = sortEntry?.dir === "asc";
  const isSortedDesc = sortEntry?.dir === "desc";
  const showDrawerButton = Boolean(sortField) && !isInSort && activeSort.length >= 2;

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
                {showDrawerButton ? (
                  <Popover.Close
                    render={<Button variant="ghost" className={styles.menuItem} />}
                    onClick={() => onOpenSortDrawer()}
                  >
                    Sort by this field…
                  </Popover.Close>
                ) : (
                  <>
                    <Popover.Close
                      render={<Button variant="ghost" className={styles.menuItem} />}
                      aria-pressed={isSortedAsc}
                      onClick={() => {
                        if (isInSort) {
                          onSort(
                            isSortedAsc
                              ? removeSort(activeSort, sortField)
                              : setSortDir(activeSort, sortField, "asc"),
                          );
                        } else {
                          onSort(addSort(activeSort, sortField, "asc"));
                        }
                      }}
                    >
                      Sort ascending
                    </Popover.Close>
                    <Popover.Close
                      render={<Button variant="ghost" className={styles.menuItem} />}
                      aria-pressed={isSortedDesc}
                      onClick={() => {
                        if (isInSort) {
                          onSort(
                            isSortedDesc
                              ? removeSort(activeSort, sortField)
                              : setSortDir(activeSort, sortField, "desc"),
                          );
                        } else {
                          onSort(addSort(activeSort, sortField, "desc"));
                        }
                      }}
                    >
                      Sort descending
                    </Popover.Close>
                    {isInSort && (
                      <Popover.Close
                        render={<Button variant="ghost" className={styles.menuItem} />}
                        onClick={() => onSort(removeSort(activeSort, sortField))}
                      >
                        Remove sort
                      </Popover.Close>
                    )}
                  </>
                )}
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

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/EventTable/ColumnActionsPopover.test.tsx
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/EventTable/ColumnActionsPopover.tsx src/components/EventTable/ColumnActionsPopover.test.tsx
git commit -m "feat(ColumnActionsPopover): update for multisort"
```

---

## Task 8: Update `EventTable`

**Files:**

- Modify: `src/components/EventTable/EventTable.tsx`
- Modify: `src/components/EventTable/EventTable.test.tsx`

- [ ] **Step 1: Add new tests and update existing ones**

Open `src/components/EventTable/EventTable.test.tsx`. Find tests that use `activeSortField`/`activeSortDir` and update them to use `activeSort`. Then add the following new tests (use the existing `renderTable` helper pattern):

Key tests to add — find the test file's existing render helper and add:

```tsx
// In the existing test file, find how EventTable is rendered and adapt these tests.
// The render helper should accept activeSort, onSort, onOpenSortDrawer props.

test("clicking a column header with 0 active sorts calls onSort adding that field as asc", async () => {
  const user = userEvent.setup();
  const onSort = vi.fn<(sorts: SortState[]) => void>();
  // render EventTable with onSort={onSort}, activeSort={[]}
  // click the "Title" header button
  // expect onSort called with [{ field: "title", dir: "asc" }]
});

test("clicking a sorted column header with 1 active sort toggles to desc", async () => {
  const user = userEvent.setup();
  const onSort = vi.fn<(sorts: SortState[]) => void>();
  // render with activeSort={[{ field: "title", dir: "asc" }]}, onSort
  // click Title header
  // expect onSort called with [{ field: "title", dir: "desc" }]
});

test("clicking a different column header with 1 active sort adds that field", async () => {
  const user = userEvent.setup();
  const onSort = vi.fn<(sorts: SortState[]) => void>();
  // render with activeSort={[{ field: "title", dir: "asc" }]}, onSort
  // click Cost header
  // expect onSort called with [{ field: "title", dir: "asc" }, { field: "cost", dir: "asc" }]
});

test("clicking any column header with 2+ active sorts calls onOpenSortDrawer instead", async () => {
  const user = userEvent.setup();
  const onOpenSortDrawer = vi.fn<() => void>();
  const onSort = vi.fn<(sorts: SortState[]) => void>();
  // render with activeSort={[{ field: "title", dir: "asc" }, { field: "cost", dir: "asc" }]}
  // click any sortable header
  // expect onOpenSortDrawer called, onSort NOT called
});
```

Look at the existing test file to understand how `EventTable` is rendered (it needs a router context). Mirror the existing pattern for render setup.

- [ ] **Step 2: Run updated tests to see failures**

```bash
npx vitest run src/components/EventTable/EventTable.test.tsx
```

Expected: failures on prop mismatches and new behavior tests.

- [ ] **Step 3: Update `EventTable`**

Open `src/components/EventTable/EventTable.tsx`. Make the following changes:

**a) Update the props interface:**

```tsx
interface EventTableProps {
  events: Event[];
  activeSort?: SortState[]; // replaces activeSortField + activeSortDir
  onSort?: (sorts: SortState[]) => void;
  onOpenSortDrawer?: () => void; // new
  sharedColumnState: SharedColumnState;
  linkState?: { from: string };
}
```

**b) Remove `useSortState` import and usage. Remove `parseSortString` import.**

**c) Derive effective sort:**

```tsx
const [internalSorting, setInternalSorting] = useState<SortState[]>([]);
const effectiveSort: SortState[] = onSort ? (activeSort ?? []) : internalSorting;

// For TanStack table internal sorting (used when no onSort):
const tanstackSorting = internalSorting.map((s) => ({
  id: COL_ID_BY_SORT_FIELD.get(s.field) ?? s.field,
  desc: s.dir === "desc",
}));
```

**d) Replace `handleHeaderSortClick`:**

```tsx
const handleHeaderSortClick = (sortField: string, label: string): void => {
  if (effectiveSort.length >= 2) {
    onOpenSortDrawer?.();
    return;
  }

  const existing = effectiveSort.find((s) => s.field === sortField);
  let newSort: SortState[];

  if (!existing) {
    newSort = addSort(effectiveSort, sortField);
    announce(`Added ${label} to sort, ascending`);
  } else if (existing.dir === "asc") {
    newSort = setSortDir(effectiveSort, sortField, "desc");
    announce(`${label} sorted descending`);
  } else {
    newSort = removeSort(effectiveSort, sortField);
    announce(`${label} removed from sort`);
  }

  if (onSort) {
    onSort(newSort);
  } else {
    setInternalSorting(newSort);
  }
  posthog.capture("results_sorted", {
    sort_fields: newSort.map((s) => s.field),
    sort_count: newSort.length,
  });
};
```

**e) Replace `handlePopoverSort`:**

```tsx
const handlePopoverSort = (newSort: SortState[], label: string): void => {
  if (onSort) {
    onSort(newSort);
  } else {
    setInternalSorting(newSort);
  }
  if (newSort.length === 0) {
    announce("Sort cleared");
  } else {
    announce(`Sort updated`);
  }
  posthog.capture("results_sorted", { sort_fields: newSort.map((s) => s.field) });
};
```

**f) Update the header sort indicator:**

```tsx
const isActive = Boolean(sortField) && effectiveSort.some((s) => s.field === sortField);
const activeEntry = effectiveSort.find((s) => s.field === sortField);
let ariaSort: "ascending" | "descending" | "none" = "none";
if (isActive && activeEntry) {
  ariaSort = activeEntry.dir === "asc" ? "ascending" : "descending";
}
```

**g) Update `ColumnActionsPopover` call site:**

```tsx
<ColumnActionsPopover
  sortField={sortField}
  activeSort={effectiveSort}
  onSort={(newSort) => handlePopoverSort(newSort, label)}
  onOpenSortDrawer={() => onOpenSortDrawer?.()}
  onOpenResize={...}
  formatControls={...}
/>
```

**h) Update TanStack table state:**

```tsx
const table = useReactTable({
  ...
  state: {
    columnVisibility: visibility,
    columnSizing: sizing,
    sorting: onSort ? [] : tanstackSorting,
  },
  manualSorting: Boolean(onSort),
  ...
});
```

**i) Add imports:**

```tsx
import { addSort, removeSort, setSortDir } from "../../utils/sortManipulation";
import type { SortState } from "../../utils/types";
```

**j) Remove imports:**

- `import { useSortState } from "../../hooks/useSortState";`
- `import { parseSortString } from "../../utils/parseSortString";`

After this change, `useSortState.ts` has no callers — delete it:

```bash
rm src/hooks/useSortState.ts src/hooks/useSortState.test.ts
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/EventTable/EventTable.test.tsx
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/EventTable/EventTable.tsx src/components/EventTable/EventTable.test.tsx
git rm src/hooks/useSortState.ts src/hooks/useSortState.test.ts
git commit -m "feat(EventTable): update for multisort, remove useSortState"
```

---

## Task 9: Update `SearchResults`

**Files:**

- Modify: `src/components/SearchResults/SearchResults.tsx`

- [ ] **Step 1: Update `SearchResults`**

Open `src/components/SearchResults/SearchResults.tsx`. Apply these changes:

**a) Replace `parseSortString` import:**

```tsx
// Remove:
import { parseSortString } from "../../utils/parseSortString";
// Add:
import { parseSorts, serializeSorts } from "../../utils/parseSorts";
import type { SortState } from "../../utils/types";
```

**b) Update props:**

```tsx
interface SearchResultsProps {
  searchParams: SearchParams;
  onNavigate: (page: number, limit: number) => void;
  onSort: (sorts: SortState[]) => void; // was: (sort: string | undefined) => void
}
```

**c) Parse sort state:**

```tsx
// Remove the three activeSortState/activeSortField/activeSortDir lines.
// Replace with:
const activeSort = parseSorts(searchParams.sort ?? "");
const [sortDrawerOpen, setSortDrawerOpen] = useState(false);
```

**d) Update `SortDrawer` usage:**

```tsx
<SortDrawer
  activeSort={activeSort}
  onSort={onSort}
  columnVisibility={sharedColumnState.visibility}
  open={sortDrawerOpen}
  onOpenChange={setSortDrawerOpen}
/>
```

**e) Update `EventTable` usage (both desktop and mobile controls):**

```tsx
<EventTable
  events={data.data}
  activeSort={activeSort}
  onSort={onSort}
  onOpenSortDrawer={() => setSortDrawerOpen(true)}
  sharedColumnState={sharedColumnState}
/>
```

- [ ] **Step 2: Update `index.tsx` to serialize before calling `handleSort`**

Open `src/routes/index.tsx`. Update `handleSort`:

```tsx
const handleSort = (sorts: SortState[]): void => {
  void navigate({
    search: (prev) => ({
      ...prev,
      sort: serializeSorts(sorts),
      page: undefined,
    }),
  });
};
```

Add imports:

```tsx
import { serializeSorts } from "../utils/parseSorts";
import type { SortState } from "../utils/types";
```

Update the `onSort` prop on `SearchResults`:

```tsx
<SearchResults searchParams={search} onNavigate={handleNavigate} onSort={handleSort} />
```

After this change, `parseSortString` has no remaining callers — delete it:

```bash
rm src/utils/parseSortString.ts src/utils/parseSortString.test.ts
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run src/components/SearchResults/SearchResults.test.tsx src/routes/index.test.tsx
```

Expected: all tests pass. Fix any type errors from prop changes.

- [ ] **Step 4: Commit**

```bash
git add src/components/SearchResults/SearchResults.tsx src/routes/index.tsx
git rm src/utils/parseSortString.ts src/utils/parseSortString.test.ts
git commit -m "feat(SearchResults): wire multisort, remove parseSortString"
```

---

## Task 10: Simplify `openParam`

**Files:**

- Modify: `src/components/ChangelogPage/openParam.ts`
- Modify: `src/components/ChangelogPage/openParam.test.ts`

- [ ] **Step 1: Update the tests**

Open `src/components/ChangelogPage/openParam.test.ts`. Apply these changes:

- `OpenMap` is now `Map<number, Map<string, undefined>>` — remove all references to `SortState` values
- Update the "4-segment value" test to confirm groups are recognized but sort is silently dropped:

```ts
it("4-segment value parses as open with group, sort silently ignored", () => {
  const result = parseOpenParam(["2.updated.title.asc"]);
  const expected: OpenMap = new Map([[2, new Map([["updated", undefined]])]]);
  expect(result).toStrictEqual(expected);
});

it("parses desc direction as open with group, sort silently ignored", () => {
  const result = parseOpenParam(["1.deleted.startDateTime.desc"]);
  const expected: OpenMap = new Map([[1, new Map([["deleted", undefined]])]]);
  expect(result).toStrictEqual(expected);
});
```

- Update the "multiple values for same position" test — the `updated` group now has `undefined` value (no sort)
- Update the serialization tests — `serializeOpenParam` no longer writes sort, so a map entry that previously had a sort now serializes as `"2.updated"` not `"2.updated.title.asc"`
- Update the round-trip test:

```ts
it("parse then serialize drops sort from old-format values", () => {
  const values = ["1.created", "1.updated.title.asc", "3.deleted.startDateTime.desc"];
  expect(serializeOpenParam(parseOpenParam(values))).toStrictEqual([
    "1.created",
    "1.updated",
    "3.deleted",
  ]);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/ChangelogPage/openParam.test.ts
```

Expected: failures on tests expecting `SortState` values.

- [ ] **Step 3: Rewrite `openParam.ts`**

Rewrite `src/components/ChangelogPage/openParam.ts`:

```ts
export type OpenMap = Map<number, Map<string, undefined>>;

export function parseOpenParam(values: string[]): OpenMap {
  const result: OpenMap = new Map();
  for (const value of values) {
    const parts = value.split(".");
    const segCount = parts.length;
    // Accept 1-segment (position), 2-segment (position.group),
    // and legacy 4-segment (position.group.field.dir) — sort portion silently ignored.
    // Drop 3-segment and 5+-segment values.
    if (segCount !== 1 && segCount !== 2 && segCount !== 4) continue;

    const position = parseInt(parts[0], 10);
    if (isNaN(position) || position <= 0) continue;

    if (segCount === 1) {
      if (!result.has(position)) result.set(position, new Map());
      continue;
    }

    const group = parts[1];
    if (!group) continue;

    // For legacy 4-segment, validate sort portion before accepting group.
    if (segCount === 4) {
      const dir = parts[3];
      if (!parts[2] || (dir !== "asc" && dir !== "desc")) continue;
    }

    let groupMap = result.get(position);
    if (!groupMap) {
      groupMap = new Map();
      result.set(position, groupMap);
    }
    groupMap.set(group, undefined);
  }
  return result;
}

export function serializeOpenParam(map: OpenMap): string[] {
  const result: string[] = [];
  const positions = [...map.keys()].sort((a, b) => a - b);
  for (const pos of positions) {
    const groupMap = map.get(pos);
    if (!groupMap) continue;
    if (groupMap.size === 0) {
      result.push(String(pos));
    } else {
      const groups = [...groupMap.keys()].sort();
      for (const group of groups) {
        result.push(`${pos}.${group}`);
      }
    }
  }
  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/ChangelogPage/openParam.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/ChangelogPage/openParam.ts src/components/ChangelogPage/openParam.test.ts
git commit -m "refactor(openParam): remove sort state, simplify to group tracking only"
```

---

## Task 11: Wire multisort into the changelog

**Files:**

- Modify: `src/routes/changelog.tsx`
- Modify: `src/components/EventTable/ColumnControlsPanel.tsx`
- Modify: `src/components/ChangelogPage/ChangelogPage.tsx`

- [ ] **Step 1: Add `sort` to the changelog route**

Open `src/routes/changelog.tsx`. Update `validateSearch`:

```tsx
validateSearch: (search: Record<string, unknown>) => ({
  open: coerceStringArray(search.open),
  sort: coerceOptionalString(search.sort),   // add this line
  eventType: coerceOptionalString(search.eventType),
  days: coerceOptionalString(search.days),
  timeStart: coerceOptionalString(search.timeStart),
  timeEnd: coerceOptionalString(search.timeEnd),
}),
```

Update `ChangelogPageRoute` to pass `sort` to `ChangelogPage`:

```tsx
function ChangelogPageRoute(): React.JSX.Element {
  const { open, sort, eventType, days, timeStart, timeEnd } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <ChangelogPage
      openParam={open}
      navigate={navigate}
      sort={sort}
      activeFilter={{
        eventType: eventType ?? "",
        days: days ?? "",
        timeStart: timeStart ?? "",
        timeEnd: timeEnd ?? "",
      }}
    />
  );
}
```

- [ ] **Step 2: Update `ColumnControlsPanel`**

Rewrite `src/components/EventTable/ColumnControlsPanel.tsx`:

```tsx
import React from "react";
import { VisibilityDrawer } from "./VisibilityDrawer";
import { FormatDrawer } from "./FormatDrawer";
import { SortDrawer } from "./SortDrawer";
import type { SharedColumnState } from "./types";
import type { SortState } from "../../utils/types";
import styles from "./ColumnControlsPanel.module.css";

interface ColumnControlsPanelProps {
  columnState: SharedColumnState;
  activeSort: SortState[];
  onSort: (sorts: SortState[]) => void;
  sortDrawerOpen: boolean;
  onSortDrawerOpenChange: (open: boolean) => void;
}

export function ColumnControlsPanel({
  columnState,
  activeSort,
  onSort,
  sortDrawerOpen,
  onSortDrawerOpenChange,
}: ColumnControlsPanelProps): React.JSX.Element {
  return (
    <div className={styles.controls}>
      <VisibilityDrawer columnState={columnState} />
      <FormatDrawer columnState={columnState} />
      <SortDrawer
        activeSort={activeSort}
        onSort={onSort}
        columnVisibility={columnState.visibility}
        open={sortDrawerOpen}
        onOpenChange={onSortDrawerOpenChange}
      />
    </div>
  );
}
```

- [ ] **Step 3: Update `ChangelogPage`**

Open `src/components/ChangelogPage/ChangelogPage.tsx`. Apply these changes:

**a) Add imports:**

```tsx
import { parseSorts, serializeSorts } from "../../utils/parseSorts";
import type { SortState } from "../../utils/types";
```

**b) Update props:**

```tsx
interface ChangelogPageProps {
  openParam?: string[];
  navigate?: NavigateFn;
  activeFilter?: SearchFormValues;
  sort?: string; // add
}
```

**c) Inside `ChangelogPage` function:**

```tsx
const activeSort = parseSorts(sort ?? "");
const [sortDrawerOpen, setSortDrawerOpen] = useState(false);

function handleSort(sorts: SortState[]): void {
  if (!navigate) return;
  void navigate({
    to: ".",
    search: (prev) => ({ ...prev, sort: serializeSorts(sorts) }),
    replace: true,
    resetScroll: false,
  });
}
```

**d) Update `ColumnControlsPanel`:**

```tsx
<ColumnControlsPanel
  columnState={sharedColumnState}
  activeSort={activeSort}
  onSort={handleSort}
  sortDrawerOpen={sortDrawerOpen}
  onSortDrawerOpenChange={setSortDrawerOpen}
/>
```

**e) Pass sort props to each `ChangelogRow`:**

```tsx
<ChangelogRow
  key={summary.id}
  position={i + 1}
  openParam={openParam}
  navigate={navigate}
  summary={summary}
  onOpen={() => handleOpen(i)}
  sharedColumnState={sharedColumnState}
  activeFilter={activeFilter}
  activeSort={activeSort}
  onSort={handleSort}
  onOpenSortDrawer={() => setSortDrawerOpen(true)}
/>
```

- [ ] **Step 4: Run changelog page tests**

```bash
npx vitest run src/components/ChangelogPage/ChangelogPage.test.tsx
```

Expected: tests pass. Fix any prop type errors.

- [ ] **Step 5: Commit**

```bash
git add src/routes/changelog.tsx src/components/EventTable/ColumnControlsPanel.tsx src/components/ChangelogPage/ChangelogPage.tsx
git commit -m "feat(changelog): add sort URL param and SortDrawer to ColumnControlsPanel"
```

---

## Task 12: Update `ChangelogRow` and `ChangelogEntryPanel`

**Files:**

- Modify: `src/components/ChangelogPage/ChangelogRow.tsx`
- Modify: `src/components/ChangelogPage/ChangelogRow.test.tsx`
- Modify: `src/components/ChangelogPage/ChangelogEntryPanel.tsx`
- Modify: `src/components/ChangelogPage/ChangelogEntryPanel.test.tsx`

- [ ] **Step 1: Update `ChangelogRow`**

Open `src/components/ChangelogPage/ChangelogRow.tsx`. Add sort props to the interface and thread them to `ChangelogEntryPanel`:

```tsx
// Add to ChangelogRowProps:
activeSort?: SortState[];
onSort?: (sorts: SortState[]) => void;
onOpenSortDrawer?: () => void;

// Add to function params:
activeSort = [],
onSort,
onOpenSortDrawer,

// Pass to ChangelogEntryPanel:
<ChangelogEntryPanel
  entry={isError ? "error" : entry}
  sharedColumnState={sharedColumnState}
  openParam={openParam}
  position={position}
  navigate={navigate}
  activeFilter={activeFilter}
  activeSort={activeSort}
  onSort={onSort}
  onOpenSortDrawer={onOpenSortDrawer}
/>
```

Add import: `import type { SortState } from "../../utils/types";`

- [ ] **Step 2: Update `ChangelogEntryPanel`**

Open `src/components/ChangelogPage/ChangelogEntryPanel.tsx`. Apply these changes:

**a) Remove old imports:**

```tsx
// Remove:
import { parseSortString } from "../../utils/parseSortString";
import { sortEvents } from "../../utils/sortEvents";
```

**b) Add new imports:**

```tsx
import { sortEventsMulti } from "../../utils/sortEventsMulti";
import type { SortState } from "../../utils/types";
```

**c) Update `EventGroup` props:**

```tsx
// Remove activeSortField, activeSortDir from EventGroup props.
// Add:
activeSort?: SortState[];
onSort?: (sort: SortState[]) => void;
onOpenSortDrawer?: () => void;
```

**d) Update `EventGroup` to pass new props to `EventTable`:**

```tsx
<EventTable
  events={events}
  sharedColumnState={sharedColumnState}
  linkState={CHANGELOG_LINK_STATE}
  activeSort={activeSort ?? []}
  onSort={onSort}
  onOpenSortDrawer={onOpenSortDrawer}
/>
```

**e) Update `ChangelogEntryPanel` props:**

```tsx
// Remove: openParam, position usage for sort (keep for group open tracking)
// Add to ChangelogEntryPanelProps:
activeSort?: SortState[];
onSort?: (sorts: SortState[]) => void;
onOpenSortDrawer?: () => void;
```

**f) Remove `openForPosition`, `syncGroupSortToUrl`, `makeOnSort` — these three functions are deleted entirely.**

The `syncGroupToUrl` function (which tracks group open/close) stays as-is.

**g) Apply client-side sort to events before passing:**

```tsx
// Previously: events={sort ? sortEvents(events, sort.field, sort.dir) : events}
// Now:
events={sortEventsMulti(events, activeSort ?? [])}
```

**h) Pass sort props to each `EventGroup`:**

```tsx
<EventGroup
  events={sortEventsMulti(events, activeSort ?? [])}
  sharedColumnState={sharedColumnState}
  activeSort={activeSort ?? []}
  onSort={onSort}
  onOpenSortDrawer={onOpenSortDrawer}
/>
```

After these changes, `sortEvents` has no remaining callers — delete it:

```bash
rm src/utils/sortEvents.ts src/utils/sortEvents.test.ts
```

- [ ] **Step 3: Run changelog tests**

```bash
npx vitest run src/components/ChangelogPage/
```

Expected: all tests pass. Fix prop type errors as needed.

- [ ] **Step 4: Commit**

```bash
git add src/components/ChangelogPage/ChangelogRow.tsx src/components/ChangelogPage/ChangelogRow.test.tsx
git add src/components/ChangelogPage/ChangelogEntryPanel.tsx src/components/ChangelogPage/ChangelogEntryPanel.test.tsx
git rm src/utils/sortEvents.ts src/utils/sortEvents.test.ts
git commit -m "feat(changelog): wire multisort through ChangelogRow and ChangelogEntryPanel, remove sortEvents"
```

---

## Task 13: Update `EventTable.stories.tsx` and run the full test suite

**Files:**

- Modify: `src/components/EventTable/EventTable.stories.tsx`

- [ ] **Step 1: Update story args**

Open `src/components/EventTable/EventTable.stories.tsx`. Replace `activeSortField` and `activeSortDir` args with `activeSort: SortState[]`:

```tsx
// Remove:
activeSortField?: string;
activeSortDir?: "asc" | "desc";

// Add:
activeSort?: SortState[];

// Update the story that previously had:
activeSortField: "title",
activeSortDir: "asc",
// to:
activeSort: [{ field: "title", dir: "asc" }],

// Update the component render:
<EventTable
  ...
  activeSort={activeSort ?? []}
  ...
/>
```

Add import: `import type { SortState } from "../../utils/types";`

- [ ] **Step 2: Run the full test suite**

```bash
npm test
```

Expected: all tests pass. If any test fails due to type errors from prop renames (`activeSortField`/`activeSortDir` still referenced somewhere), fix those before proceeding.

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```

Expected: no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/EventTable/EventTable.stories.tsx
git commit -m "chore: update EventTable stories for multisort"
```

---

## Self-Review Checklist (run before claiming complete)

- [ ] `npm test` passes fully
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] No references to `parseSortString`, `sortEvents`, `useSortState`, `activeSortField`, `activeSortDir` remain anywhere in `src/`
- [ ] `SortDrawer` opens when a column header is clicked with 2+ active sorts (manual smoke test)
- [ ] Adding fields via combobox, reordering, removing, and clearing all work in the browser
- [ ] Changelog `?sort=` URL param updates when sorting and persists on page reload
