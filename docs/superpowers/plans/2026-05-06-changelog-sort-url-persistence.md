# Changelog Sort URL Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix non-functional changelog event table sort and persist sort state in the URL as `?sort={pos}.{group}.{field}.{dir}`.

**Architecture:** Add a `sort` search param to the changelog route (array of strings, analogous to `open`). `ChangelogEntryPanel` reads sort state per group from the URL, sorts events client-side before rendering using a new `sortEvents` utility, and writes sort changes back to the URL using `EventTable`'s existing external-sort prop path (`onSort`/`activeSortField`/`activeSortDir`). All `navigate` calls are updated from direct-object form to functional `(prev) => ({ ...prev, ... })` form so that adding `sort` doesn't wipe the `open` param and vice versa. No changes to `EventTable.tsx`.

**Tech Stack:** TanStack Router (search params + functional navigate), TanStack Table (external sort already wired), Vitest + Testing Library + MSW (tests)

---

## File Map

| File                                                        | Status     | Responsibility                                                                                                                                                        |
| ----------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/ChangelogPage/sortParam.ts`                 | **Create** | Parse and serialize the `sort` URL param                                                                                                                              |
| `src/components/ChangelogPage/sortParam.test.ts`            | **Create** | Unit tests for sortParam                                                                                                                                              |
| `src/utils/sortEvents.ts`                                   | **Create** | Client-side event comparator                                                                                                                                          |
| `src/utils/sortEvents.test.ts`                              | **Create** | Unit tests for sortEvents                                                                                                                                             |
| `src/routes/changelog.tsx`                                  | **Modify** | Add `sort` to `validateSearch`; pass `sortParam` to `ChangelogPage`                                                                                                   |
| `src/components/ChangelogPage/ChangelogPage.tsx`            | **Modify** | Accept and thread `sortParam` to `ChangelogRow`                                                                                                                       |
| `src/components/ChangelogPage/ChangelogRow.tsx`             | **Modify** | Accept and thread `sortParam`; fix `syncOpenToUrl` to functional navigate                                                                                             |
| `src/components/ChangelogPage/ChangelogEntryPanel.tsx`      | **Modify** | Accept `sortParam`; fix `syncGroupToUrl` (functional nav + clear sort on close); add `syncGroupSortToUrl`; extend `EventGroup` props; call `sortEvents` before render |
| `src/components/ChangelogPage/ChangelogEntryPanel.test.tsx` | **Modify** | Test pre-sort on mount                                                                                                                                                |
| `src/routes/changelog.test.tsx`                             | **Modify** | Integration tests for sort URL writes                                                                                                                                 |

---

### Task 1: `sortParam` utility

**Files:**

- Create: `src/components/ChangelogPage/sortParam.ts`
- Create: `src/components/ChangelogPage/sortParam.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/components/ChangelogPage/sortParam.test.ts`:

```typescript
import { expect, test } from "vitest";
import { parseSortParam, serializeSortParam } from "./sortParam";

test("parseSortParam returns empty map for empty input", () => {
  expect(parseSortParam([])).toEqual(new Map());
});

test("parseSortParam parses a single asc entry", () => {
  const result = parseSortParam(["2.created.gameId.asc"]);
  expect(result.get(2)?.get("created")).toEqual({ field: "gameId", dir: "asc" });
});

test("parseSortParam parses a desc entry", () => {
  const result = parseSortParam(["3.deleted.title.desc"]);
  expect(result.get(3)?.get("deleted")).toEqual({ field: "title", dir: "desc" });
});

test("parseSortParam drops entries with non-numeric position", () => {
  expect(parseSortParam(["abc.created.gameId.asc"]).size).toBe(0);
});

test("parseSortParam drops entries with zero position", () => {
  expect(parseSortParam(["0.created.gameId.asc"]).size).toBe(0);
});

test("parseSortParam drops entries with invalid dir", () => {
  expect(parseSortParam(["2.created.gameId.sideways"]).size).toBe(0);
});

test("parseSortParam drops entries with fewer than 4 parts", () => {
  expect(parseSortParam(["2.created.gameId"]).size).toBe(0);
});

test("parseSortParam handles multiple entries across positions and groups", () => {
  const result = parseSortParam(["2.created.gameId.asc", "3.deleted.title.desc"]);
  expect(result.get(2)?.get("created")).toEqual({ field: "gameId", dir: "asc" });
  expect(result.get(3)?.get("deleted")).toEqual({ field: "title", dir: "desc" });
});

test("serializeSortParam returns empty array for empty map", () => {
  expect(serializeSortParam(new Map())).toEqual([]);
});

test("serializeSortParam round-trips a single entry", () => {
  const map = parseSortParam(["2.created.gameId.asc"]);
  expect(serializeSortParam(map)).toEqual(["2.created.gameId.asc"]);
});

test("serializeSortParam sorts output by position then group", () => {
  const map = parseSortParam([
    "3.updated.title.asc",
    "1.created.gameId.desc",
    "3.created.title.asc",
  ]);
  expect(serializeSortParam(map)).toEqual([
    "1.created.gameId.desc",
    "3.created.title.asc",
    "3.updated.title.asc",
  ]);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy-changelog-sort && npx vitest run src/components/ChangelogPage/sortParam.test.ts
```

Expected: 11 tests fail with "Cannot find module './sortParam'".

- [ ] **Step 3: Implement `sortParam.ts`**

Create `src/components/ChangelogPage/sortParam.ts`:

```typescript
export type SortMap = Map<number, Map<string, { field: string; dir: "asc" | "desc" }>>;

export function parseSortParam(values: string[]): SortMap {
  const result: SortMap = new Map();
  for (const value of values) {
    const parts = value.split(".");
    if (parts.length < 4) continue;
    const position = parseInt(parts[0], 10);
    if (isNaN(position) || position <= 0) continue;
    const group = parts[1];
    const field = parts[2];
    const dir = parts[3];
    if (!group || !field) continue;
    if (dir !== "asc" && dir !== "desc") continue;
    const groupMap =
      result.get(position) ?? new Map<string, { field: string; dir: "asc" | "desc" }>();
    groupMap.set(group, { field, dir });
    result.set(position, groupMap);
  }
  return result;
}

export function serializeSortParam(map: SortMap): string[] {
  const result: string[] = [];
  for (const position of Array.from(map.keys()).sort((a, b) => a - b)) {
    const groupMap = map.get(position)!;
    for (const group of Array.from(groupMap.keys()).sort()) {
      const { field, dir } = groupMap.get(group)!;
      result.push(`${position}.${group}.${field}.${dir}`);
    }
  }
  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy-changelog-sort && npx vitest run src/components/ChangelogPage/sortParam.test.ts
```

Expected: 11 tests pass.

- [ ] **Step 5: Commit**

```bash
git -C /home/myasonik/Workspace/Gen-Con-Buddy-changelog-sort add src/components/ChangelogPage/sortParam.ts src/components/ChangelogPage/sortParam.test.ts && git -C /home/myasonik/Workspace/Gen-Con-Buddy-changelog-sort commit -m "feat(changelog): add sortParam URL encode/decode utility"
```

---

### Task 2: `sortEvents` utility

**Files:**

- Create: `src/utils/sortEvents.ts`
- Create: `src/utils/sortEvents.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/sortEvents.test.ts`:

```typescript
import { expect, test } from "vitest";
import { sortEvents } from "./sortEvents";
import { makeEvent } from "../test/msw/factory";

test("sorts by string field ascending", () => {
  const events = [
    makeEvent({ title: "Zebra Hunt" }),
    makeEvent({ title: "Alpha Quest" }),
    makeEvent({ title: "Monster Rally" }),
  ];
  const result = sortEvents(events, "title", "asc");
  expect(result.map((e) => e.attributes.title)).toEqual([
    "Alpha Quest",
    "Monster Rally",
    "Zebra Hunt",
  ]);
});

test("sorts by string field descending", () => {
  const events = [makeEvent({ title: "Alpha Quest" }), makeEvent({ title: "Zebra Hunt" })];
  const result = sortEvents(events, "title", "desc");
  expect(result.map((e) => e.attributes.title)).toEqual(["Zebra Hunt", "Alpha Quest"]);
});

test("sorts by numeric field numerically, not lexicographically", () => {
  const events = [
    makeEvent({ ticketsAvailable: 9 }),
    makeEvent({ ticketsAvailable: 100 }),
    makeEvent({ ticketsAvailable: 2 }),
  ];
  const result = sortEvents(events, "ticketsAvailable", "asc");
  expect(result.map((e) => e.attributes.ticketsAvailable)).toEqual([2, 9, 100]);
});

test("sorts by ISO date string field correctly", () => {
  const events = [
    makeEvent({ startDateTime: "2024-08-03T10:00:00Z" }),
    makeEvent({ startDateTime: "2024-08-01T10:00:00Z" }),
    makeEvent({ startDateTime: "2024-08-02T10:00:00Z" }),
  ];
  const result = sortEvents(events, "startDateTime", "asc");
  expect(result.map((e) => e.attributes.startDateTime)).toEqual([
    "2024-08-01T10:00:00Z",
    "2024-08-02T10:00:00Z",
    "2024-08-03T10:00:00Z",
  ]);
});

test("does not mutate the original array", () => {
  const events = [makeEvent({ title: "Zebra Hunt" }), makeEvent({ title: "Alpha Quest" })];
  const originalFirst = events[0].attributes.title;
  sortEvents(events, "title", "asc");
  expect(events[0].attributes.title).toBe(originalFirst);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy-changelog-sort && npx vitest run src/utils/sortEvents.test.ts
```

Expected: 5 tests fail with "Cannot find module './sortEvents'".

- [ ] **Step 3: Implement `sortEvents.ts`**

Create `src/utils/sortEvents.ts`:

```typescript
import type { Event } from "./types";

export function sortEvents(events: Event[], field: string, dir: "asc" | "desc"): Event[] {
  return [...events].sort((a, b) => {
    const aVal = (a.attributes as Record<string, unknown>)[field];
    const bVal = (b.attributes as Record<string, unknown>)[field];
    let cmp: number;
    if (typeof aVal === "number" && typeof bVal === "number") {
      cmp = aVal - bVal;
    } else {
      cmp = String(aVal ?? "").localeCompare(String(bVal ?? ""));
    }
    return dir === "asc" ? cmp : -cmp;
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy-changelog-sort && npx vitest run src/utils/sortEvents.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git -C /home/myasonik/Workspace/Gen-Con-Buddy-changelog-sort add src/utils/sortEvents.ts src/utils/sortEvents.test.ts && git -C /home/myasonik/Workspace/Gen-Con-Buddy-changelog-sort commit -m "feat(changelog): add sortEvents client-side comparator"
```

---

### Task 3: Thread `sortParam` prop + fix `navigate` calls

**Files:**

- Modify: `src/routes/changelog.tsx`
- Modify: `src/components/ChangelogPage/ChangelogPage.tsx`
- Modify: `src/components/ChangelogPage/ChangelogRow.tsx`
- Modify: `src/components/ChangelogPage/ChangelogEntryPanel.tsx`
- Modify: `src/routes/changelog.test.tsx`

**Context:** Three `navigate` calls currently use `search: { open: ... }` (direct object), which overwrites the entire search and would wipe a future `sort` param. All three must change to the functional form `search: (prev) => ({ ...prev, open: ... })` before `sort` is wired. The `syncGroupToUrl` close path also updates `sort` in the same navigate call to clear sort when a group closes — implemented here since it's part of the navigate fix.

- [ ] **Step 1: Write the `validateSearch` round-trip test**

Add to `src/routes/changelog.test.tsx` (after the last existing test):

```typescript
test("sort param is coerced to a string array by validateSearch", async () => {
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({ entries: [] }),
    ),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { router } = await renderRoute("/changelog?sort=1.created.title.asc", {
    queryClient: client,
  });
  const search = new URLSearchParams(router.state.location.search);
  expect(search.getAll("sort")).toContain("1.created.title.asc");
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy-changelog-sort && npx vitest run src/routes/changelog.test.tsx --reporter=verbose 2>&1 | tail -15
```

Expected: new test fails — `sort` is not in `validateSearch` yet so the param is stripped.

- [ ] **Step 3: Update `src/routes/changelog.tsx`**

Replace the entire file:

```typescript
import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChangelogPage } from "../components/ChangelogPage/ChangelogPage";
import { fetchChangelogEntry, fetchChangelogList } from "../utils/api";
import { parseOpenParam } from "../components/ChangelogPage/openParam";

export const Route = createFileRoute("/changelog")({
  validateSearch: (search: Record<string, unknown>) => {
    const raw = search.open;
    let open: string[];
    if (Array.isArray(raw)) {
      open = raw.map(String);
    } else if (raw !== undefined && raw !== null) {
      open = [String(raw)];
    } else {
      open = [];
    }
    const rawSort = search.sort;
    let sort: string[];
    if (Array.isArray(rawSort)) {
      sort = rawSort.map(String);
    } else if (rawSort !== undefined && rawSort !== null) {
      sort = [String(rawSort)];
    } else {
      sort = [];
    }
    return { open, sort };
  },
  loaderDeps: ({ search }) => ({ open: search.open }),
  loader: async ({ deps, context }) => {
    const { queryClient } = context;
    const summaries = await queryClient.ensureQueryData({
      queryKey: ["changelog", "list"],
      queryFn: () => fetchChangelogList(),
    });
    const openPositions = parseOpenParam(deps.open);
    await Promise.all(
      Array.from(openPositions.keys())
        .map((pos) => summaries[pos - 1])
        .filter((s): s is NonNullable<typeof s> => s !== undefined)
        .map((s) =>
          queryClient.ensureQueryData({
            queryKey: ["changelog", "entry", s.id],
            queryFn: () => fetchChangelogEntry(s.id),
          }),
        ),
    );
  },
  component: ChangelogPageRoute,
});

function ChangelogPageRoute(): React.JSX.Element {
  const { open, sort } = Route.useSearch();
  const navigate = Route.useNavigate();
  return <ChangelogPage openParam={open} sortParam={sort} navigate={navigate} />;
}
```

- [ ] **Step 4: Update `src/components/ChangelogPage/ChangelogPage.tsx`**

Add `sortParam` to the props interface and thread it to `ChangelogRow`. Replace the interface and function signature:

```typescript
interface ChangelogPageProps {
  openParam?: string[];
  sortParam?: string[];
  navigate?: NavigateFn;
}

export function ChangelogPage({
  openParam = [],
  sortParam = [],
  navigate,
}: ChangelogPageProps): React.JSX.Element {
```

In the `summaries.map(...)` JSX, add `sortParam={sortParam}` to `ChangelogRow`:

```tsx
<ChangelogRow
  key={summary.id}
  position={i + 1}
  openParam={openParam}
  sortParam={sortParam}
  navigate={navigate}
  summary={summary}
  onOpen={() => handleOpen(i)}
  sharedColumnState={sharedColumnState}
/>
```

- [ ] **Step 5: Update `src/components/ChangelogPage/ChangelogRow.tsx`**

Add `sortParam` to the props interface and destructuring, fix `syncOpenToUrl` to use functional navigate, and thread `sortParam` to `ChangelogEntryPanel`:

```typescript
interface ChangelogRowProps {
  position?: number;
  openParam?: string[];
  sortParam?: string[];
  navigate?: NavigateFn;
  summary: ChangelogSummary;
  onOpen: () => void;
  sharedColumnState: SharedColumnState;
}

export function ChangelogRow({
  position,
  openParam = [],
  sortParam = [],
  navigate,
  summary,
  onOpen,
  sharedColumnState,
}: ChangelogRowProps): React.JSX.Element {
```

Replace `syncOpenToUrl`:

```typescript
function syncOpenToUrl(nowOpen: boolean): void {
  if (!navigate) return;
  const newMap = new Map(openMap);
  if (nowOpen) {
    newMap.set(position, newMap.get(position) ?? new Set());
  } else {
    newMap.delete(position);
  }
  startTransition(() => {
    void navigate({
      search: (prev) => ({ ...prev, open: serializeOpenParam(newMap) }),
      replace: true,
    });
  });
}
```

In the JSX, pass `sortParam` to `ChangelogEntryPanel`:

```tsx
<ChangelogEntryPanel
  entry={isError ? "error" : entry}
  sharedColumnState={sharedColumnState}
  openParam={openParam}
  sortParam={sortParam}
  position={position}
  navigate={navigate}
/>
```

- [ ] **Step 6: Update `src/components/ChangelogPage/ChangelogEntryPanel.tsx` (prop signature + `syncGroupToUrl` fix)**

Add imports at the top:

```typescript
import { parseSortParam, serializeSortParam } from "./sortParam";
import { sortEvents } from "../../utils/sortEvents";
```

Add `sortParam` to the props interface and destructuring:

```typescript
interface ChangelogEntryPanelProps {
  entry: EntryValue;
  sharedColumnState: SharedColumnState;
  openParam?: string[];
  sortParam?: string[];
  position?: number;
  navigate?: NavigateFn;
}

export function ChangelogEntryPanel({
  entry,
  sharedColumnState,
  openParam = [],
  sortParam = [],
  position,
  navigate,
}: ChangelogEntryPanelProps): React.JSX.Element {
```

Replace `syncGroupToUrl` with a version that uses functional navigate and clears sort on close:

```typescript
function syncGroupToUrl(group: string, nowOpen: boolean): void {
  if (!navigate || position === undefined) return;
  const newOpenMap = new Map(parseOpenParam(openParam));
  if (!newOpenMap.has(position)) return;
  const groups = new Set(newOpenMap.get(position) ?? []);
  if (nowOpen) {
    groups.add(group);
  } else {
    groups.delete(group);
  }
  newOpenMap.set(position, groups);
  startTransition(() => {
    void navigate({
      search: (prev) => {
        if (!nowOpen) {
          const sortMap = new Map(parseSortParam(sortParam));
          const posMap = new Map(sortMap.get(position) ?? []);
          posMap.delete(group);
          posMap.size === 0 ? sortMap.delete(position) : sortMap.set(position, posMap);
          return {
            ...prev,
            open: serializeOpenParam(newOpenMap),
            sort: serializeSortParam(sortMap),
          };
        }
        return { ...prev, open: serializeOpenParam(newOpenMap) };
      },
      replace: true,
    });
  });
}
```

- [ ] **Step 7: Run all tests to verify no regressions**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy-changelog-sort && npx vitest run 2>&1 | tail -5
```

Expected: 730+ tests pass (729 baseline + new validateSearch test).

- [ ] **Step 8: Commit**

```bash
git -C /home/myasonik/Workspace/Gen-Con-Buddy-changelog-sort add \
  src/routes/changelog.tsx \
  src/components/ChangelogPage/ChangelogPage.tsx \
  src/components/ChangelogPage/ChangelogRow.tsx \
  src/components/ChangelogPage/ChangelogEntryPanel.tsx \
  src/routes/changelog.test.tsx && \
git -C /home/myasonik/Workspace/Gen-Con-Buddy-changelog-sort commit -m "feat(changelog): thread sortParam prop and fix navigate to preserve search params"
```

---

### Task 4: Sort logic in `ChangelogEntryPanel`

**Files:**

- Modify: `src/components/ChangelogPage/ChangelogEntryPanel.tsx`
- Modify: `src/components/ChangelogPage/ChangelogEntryPanel.test.tsx`

**Context:** Adds `syncGroupSortToUrl`, `makeOnSort`, extends `EventGroup` with sort props, derives sort state per group, calls `sortEvents` before passing events to each group.

- [ ] **Step 1: Update `renderPanelWithRouter` to accept extra options and write the pre-sort test**

In `src/components/ChangelogPage/ChangelogEntryPanel.test.tsx`, replace `renderPanelWithRouter` with:

```typescript
function renderPanelWithRouter(
  entry: ChangelogEntry,
  columnState: SharedColumnState = stubColumnState,
  opts: { openParam?: string[]; sortParam?: string[]; position?: number } = {},
): ReturnType<typeof render> {
  const rootRoute = createRootRoute({
    component: () => (
      <ChangelogEntryPanel
        entry={entry}
        sharedColumnState={columnState}
        openParam={opts.openParam}
        sortParam={opts.sortParam}
        position={opts.position}
      />
    ),
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
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}
```

Add this test at the end of the file:

```typescript
test("sortParam pre-sorts created events on mount", async () => {
  const entry = makeChangelogEntry({
    createdEvents: [makeEvent({ title: "Zebra Quest" }), makeEvent({ title: "Alpha Hunt" })],
    updatedEvents: [],
    deletedEvents: [],
  });
  renderPanelWithRouter(entry, stubColumnState, {
    position: 1,
    openParam: ["1.created"],
    sortParam: ["1.created.title.asc"],
  });
  const links = await screen.findAllByRole("link", { name: /Zebra Quest|Alpha Hunt/ });
  const texts = links.map((l) => l.textContent ?? "");
  expect(texts.indexOf("Alpha Hunt")).toBeLessThan(texts.indexOf("Zebra Quest"));
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy-changelog-sort && npx vitest run src/components/ChangelogPage/ChangelogEntryPanel.test.tsx --reporter=verbose 2>&1 | tail -15
```

Expected: new test fails — events render in original order (Zebra Quest before Alpha Hunt) because sort logic is not implemented yet.

- [ ] **Step 3: Implement sort logic in `ChangelogEntryPanel.tsx`**

Update `EventGroup` (the inner component near the top of the file) to accept sort props and pass them to `EventTable`:

```typescript
function EventGroup({
  events,
  sharedColumnState,
  activeSortField,
  activeSortDir,
  onSort,
}: {
  events: Event[];
  sharedColumnState: SharedColumnState;
  activeSortField?: string;
  activeSortDir?: "asc" | "desc";
  onSort?: (sort: string | undefined) => void;
}): React.JSX.Element {
  return (
    <>
      <div className={styles.tableView}>
        <EventTable
          events={events}
          activeSortField={activeSortField}
          activeSortDir={activeSortDir}
          onSort={onSort}
          sharedColumnState={sharedColumnState}
          showColumnControls={false}
          linkState={CHANGELOG_LINK_STATE}
        />
      </div>
      <div className={styles.mobileView}>
        <EventListMobile
          events={events}
          typeDisplay={sharedColumnState.typeDisplay}
          showTypeIcon={sharedColumnState.showTypeIcon}
          dayFormat={sharedColumnState.dayFormat}
          linkState={CHANGELOG_LINK_STATE}
        />
      </div>
    </>
  );
}
```

Inside `ChangelogEntryPanel`, after the `openGroups` derivation, add:

```typescript
const sortGroups: Map<string, { field: string; dir: "asc" | "desc" }> =
  position !== undefined
    ? (parseSortParam(sortParam).get(position) ??
      new Map<string, { field: string; dir: "asc" | "desc" }>())
    : new Map();

function syncGroupSortToUrl(
  group: string,
  sort: { field: string; dir: "asc" | "desc" } | undefined,
): void {
  if (!navigate || position === undefined) return;
  const newSortMap = new Map(parseSortParam(sortParam));
  const posMap = new Map(newSortMap.get(position) ?? []);
  if (sort) {
    posMap.set(group, sort);
  } else {
    posMap.delete(group);
  }
  posMap.size === 0 ? newSortMap.delete(position) : newSortMap.set(position, posMap);
  startTransition(() => {
    void navigate({
      search: (prev) => ({ ...prev, sort: serializeSortParam(newSortMap) }),
      replace: true,
    });
  });
}

function makeOnSort(group: string): (s: string | undefined) => void {
  return (s) => {
    if (s === undefined) {
      syncGroupSortToUrl(group, undefined);
    } else {
      const dotIdx = s.lastIndexOf(".");
      const field = s.slice(0, dotIdx);
      const dir = s.slice(dotIdx + 1);
      if (field && (dir === "asc" || dir === "desc")) {
        syncGroupSortToUrl(group, { field, dir });
      }
    }
  };
}

const createdSort = sortGroups.get("created");
const updatedSort = sortGroups.get("updated");
const deletedSort = sortGroups.get("deleted");
```

Then update the three `AnimatedDetails` + `EventGroup` blocks in the return JSX.

Replace the `createdEvents` block:

```tsx
{
  entry.createdEvents.length > 0 && (
    <AnimatedDetails
      className={styles.group}
      summaryClassName={styles.groupSummary}
      open={openGroups.has("created")}
      onToggle={(e) => syncGroupToUrl("created", (e.currentTarget as HTMLDetailsElement).open)}
      summary={
        <span>
          <span className={styles.groupVerbCreated}>Created</span>{" "}
          <Chip tone="neutral" className={styles.groupCount}>
            ({entry.createdEvents.length})
          </Chip>
        </span>
      }
    >
      <EventGroup
        events={
          createdSort
            ? sortEvents(entry.createdEvents, createdSort.field, createdSort.dir)
            : entry.createdEvents
        }
        sharedColumnState={sharedColumnState}
        activeSortField={createdSort?.field}
        activeSortDir={createdSort?.dir}
        onSort={makeOnSort("created")}
      />
    </AnimatedDetails>
  );
}
```

Replace the `updatedEvents` block:

```tsx
{
  entry.updatedEvents.length > 0 && (
    <AnimatedDetails
      className={styles.group}
      summaryClassName={styles.groupSummary}
      open={openGroups.has("updated")}
      onToggle={(e) => syncGroupToUrl("updated", (e.currentTarget as HTMLDetailsElement).open)}
      summary={
        <span>
          <span className={styles.groupVerbUpdated}>Updated</span>{" "}
          <Chip tone="neutral" className={styles.groupCount}>
            ({entry.updatedEvents.length})
          </Chip>
        </span>
      }
    >
      <EventGroup
        events={
          updatedSort
            ? sortEvents(entry.updatedEvents, updatedSort.field, updatedSort.dir)
            : entry.updatedEvents
        }
        sharedColumnState={sharedColumnState}
        activeSortField={updatedSort?.field}
        activeSortDir={updatedSort?.dir}
        onSort={makeOnSort("updated")}
      />
    </AnimatedDetails>
  );
}
```

Replace the `deletedEvents` block:

```tsx
{
  entry.deletedEvents.length > 0 && (
    <AnimatedDetails
      className={styles.group}
      summaryClassName={styles.groupSummary}
      open={openGroups.has("deleted")}
      onToggle={(e) => syncGroupToUrl("deleted", (e.currentTarget as HTMLDetailsElement).open)}
      summary={
        <span>
          <span className={styles.groupVerbDeleted}>Deleted</span>{" "}
          <Chip tone="neutral" className={styles.groupCount}>
            ({entry.deletedEvents.length})
          </Chip>
        </span>
      }
    >
      <EventGroup
        events={
          deletedSort
            ? sortEvents(entry.deletedEvents, deletedSort.field, deletedSort.dir)
            : entry.deletedEvents
        }
        sharedColumnState={sharedColumnState}
        activeSortField={deletedSort?.field}
        activeSortDir={deletedSort?.dir}
        onSort={makeOnSort("deleted")}
      />
    </AnimatedDetails>
  );
}
```

- [ ] **Step 4: Run `ChangelogEntryPanel` tests to verify they pass**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy-changelog-sort && npx vitest run src/components/ChangelogPage/ChangelogEntryPanel.test.tsx
```

Expected: all tests pass including the new pre-sort test.

- [ ] **Step 5: Run full test suite to verify no regressions**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy-changelog-sort && npx vitest run 2>&1 | tail -5
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git -C /home/myasonik/Workspace/Gen-Con-Buddy-changelog-sort add \
  src/components/ChangelogPage/ChangelogEntryPanel.tsx \
  src/components/ChangelogPage/ChangelogEntryPanel.test.tsx && \
git -C /home/myasonik/Workspace/Gen-Con-Buddy-changelog-sort commit -m "feat(changelog): implement URL-persisted sort in ChangelogEntryPanel"
```

---

### Task 5: Integration tests for sort URL persistence

**Files:**

- Modify: `src/routes/changelog.test.tsx`

**Context:** These tests verify the complete user-facing flows end-to-end using `renderRoute` + `userEvent`. Each test is self-contained (no shared setup between tests). The close-group test dispatches `transitionend` + `toggle` events to simulate the animation completing, identical to the existing open-param close tests in this file.

- [ ] **Step 1: Add four integration tests**

Add to `src/routes/changelog.test.tsx` (after the validateSearch test added in Task 3):

```typescript
test("clicking a column header writes sort param to URL", async () => {
  const user = userEvent.setup();
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [
          makeChangelogSummary({
            id: "entry-1",
            createdCount: 1,
            updatedCount: 0,
            deletedCount: 0,
          }),
        ],
      }),
    ),
    http.get("/api/changelog/fetch", () =>
      HttpResponse.json<FetchChangelogResponse>({
        entry: makeChangelogEntry({
          id: "entry-1",
          createdEvents: [makeEvent({ title: "Dragon Hunt" })],
        }),
      }),
    ),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { router } = await renderRoute("/changelog?open=1.created", { queryClient: client });
  await screen.findByText("Dragon Hunt");
  await user.click(screen.getByRole("button", { name: "Title" }));
  const search = new URLSearchParams(router.state.location.search);
  expect(search.getAll("sort").some((v) => v.startsWith("1.created.title."))).toBe(true);
});

test("clicking an already-sorted header flips sort direction in URL", async () => {
  const user = userEvent.setup();
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [
          makeChangelogSummary({
            id: "entry-1",
            createdCount: 1,
            updatedCount: 0,
            deletedCount: 0,
          }),
        ],
      }),
    ),
    http.get("/api/changelog/fetch", () =>
      HttpResponse.json<FetchChangelogResponse>({
        entry: makeChangelogEntry({
          id: "entry-1",
          createdEvents: [makeEvent({ title: "Dragon Hunt" })],
        }),
      }),
    ),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { router } = await renderRoute("/changelog?open=1.created&sort=1.created.title.asc", {
    queryClient: client,
  });
  await screen.findByText("Dragon Hunt");
  await user.click(screen.getByRole("button", { name: /^Title/ }));
  const search = new URLSearchParams(router.state.location.search);
  expect(search.getAll("sort")).toContain("1.created.title.desc");
});

test("clicking a desc-sorted header clears sort from URL", async () => {
  const user = userEvent.setup();
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [
          makeChangelogSummary({
            id: "entry-1",
            createdCount: 1,
            updatedCount: 0,
            deletedCount: 0,
          }),
        ],
      }),
    ),
    http.get("/api/changelog/fetch", () =>
      HttpResponse.json<FetchChangelogResponse>({
        entry: makeChangelogEntry({
          id: "entry-1",
          createdEvents: [makeEvent({ title: "Dragon Hunt" })],
        }),
      }),
    ),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { router } = await renderRoute("/changelog?open=1.created&sort=1.created.title.desc", {
    queryClient: client,
  });
  await screen.findByText("Dragon Hunt");
  await user.click(screen.getByRole("button", { name: /^Title/ }));
  const search = new URLSearchParams(router.state.location.search);
  expect(search.getAll("sort")).not.toContain("1.created.title.asc");
  expect(search.getAll("sort")).not.toContain("1.created.title.desc");
});

test("closing a sub-group removes its sort entry from the URL", async () => {
  const user = userEvent.setup();
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [
          makeChangelogSummary({
            id: "entry-1",
            createdCount: 1,
            updatedCount: 0,
            deletedCount: 0,
          }),
        ],
      }),
    ),
    http.get("/api/changelog/fetch", () =>
      HttpResponse.json<FetchChangelogResponse>({
        entry: makeChangelogEntry({
          id: "entry-1",
          createdEvents: [makeEvent({ title: "Dragon Hunt" })],
        }),
      }),
    ),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { router } = await renderRoute("/changelog?open=1.created&sort=1.created.title.asc", {
    queryClient: client,
  });
  await screen.findByText("Dragon Hunt");
  await user.click(screen.getByText("Created"));
  await act(async () => {
    const openDetails = document.querySelectorAll("details[open]")[1];
    openDetails
      ?.querySelector("[data-animated-content]")
      ?.dispatchEvent(new Event("transitionend"));
    openDetails?.dispatchEvent(new Event("toggle"));
  });
  const search = new URLSearchParams(router.state.location.search);
  expect(search.getAll("sort")).not.toContain("1.created.title.asc");
});
```

- [ ] **Step 2: Run the new tests to verify they pass**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy-changelog-sort && npx vitest run src/routes/changelog.test.tsx --reporter=verbose 2>&1 | tail -20
```

Expected: all 4 new tests pass. If any fail, verify Tasks 3 and 4 are complete and re-check the sort param format in `makeOnSort` (field is everything before the last `.`, dir is the suffix after it).

- [ ] **Step 3: Run full test suite**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy-changelog-sort && npx vitest run 2>&1 | tail -5
```

Expected: all tests pass (745+ total).

- [ ] **Step 4: Commit**

```bash
git -C /home/myasonik/Workspace/Gen-Con-Buddy-changelog-sort add src/routes/changelog.test.tsx && \
git -C /home/myasonik/Workspace/Gen-Con-Buddy-changelog-sort commit -m "test(changelog): add integration tests for sort URL persistence"
```
