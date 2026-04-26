# Changelog Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/changelog` route displaying a list of data-update entries with inline-expandable event tables, backed by a rolling prefetch strategy.

**Architecture:** `EventTable` is extracted as a shared primitive (pulling `ColumnActionsPopover` and `ColumnResizeDialog` with it to `ui/EventTable/`). `SearchResults` delegates its table rendering to `EventTable`. `ChangelogPage` uses `useChangelogPrefetch` for rolling prefetch and renders `ChangelogRow` entries; each expanded row renders `ChangelogEntryPanel` with up to three collapsible `EventTable` instances (created / updated / deleted).

**Tech Stack:** React, TanStack Router, TanStack Table, MSW (tests), CSS Modules, date-fns

---

## File Map

**Created:**

- `src/ui/EventTable/EventTable.tsx` — shared table primitive (owns COLUMNS, visibility, sizing, optional sort)
- `src/ui/EventTable/EventTable.module.css` — table styles (moved from SearchResults)
- `src/ui/EventTable/EventTable.test.tsx`
- `src/ui/EventTable/ColumnActionsPopover.tsx` — moved from `SearchResults/`
- `src/ui/EventTable/ColumnActionsPopover.module.css` — moved
- `src/ui/EventTable/ColumnActionsPopover.test.tsx` — moved; import path unchanged (relative)
- `src/ui/EventTable/ColumnResizeDialog.tsx` — moved from `SearchResults/`
- `src/ui/EventTable/ColumnResizeDialog.module.css` — moved
- `src/ui/EventTable/ColumnResizeDialog.test.tsx` — moved; import path unchanged (relative)
- `src/components/ChangelogPage/useChangelogPrefetch.ts`
- `src/components/ChangelogPage/ChangelogEntryPanel.tsx`
- `src/components/ChangelogPage/ChangelogEntryPanel.module.css`
- `src/components/ChangelogPage/ChangelogRow.tsx`
- `src/components/ChangelogPage/ChangelogRow.module.css`
- `src/components/ChangelogPage/ChangelogPage.tsx`
- `src/components/ChangelogPage/ChangelogPage.module.css`
- `src/routes/changelog.tsx`
- `src/routes/changelog.test.tsx`

**Modified:**

- `src/utils/types.ts` — add changelog types
- `src/utils/api.ts` — add changelog API functions
- `src/test/msw/factory.ts` — add changelog factory helpers
- `src/test/msw/handlers.ts` — add default changelog MSW handlers
- `src/components/SearchResults/SearchResults.tsx` — strip COLUMNS / useReactTable / visibility / sizing; delegate to EventTable
- `src/components/SearchResults/SearchResults.module.css` — all styles moved to EventTable.module.css; file becomes empty
- `src/routes/__root.tsx` — add changelog nav link

**Deleted** (moved to `ui/EventTable/`)**:**

- `src/components/SearchResults/ColumnActionsPopover.tsx`
- `src/components/SearchResults/ColumnActionsPopover.module.css`
- `src/components/SearchResults/ColumnActionsPopover.test.tsx`
- `src/components/SearchResults/ColumnResizeDialog.tsx`
- `src/components/SearchResults/ColumnResizeDialog.module.css`
- `src/components/SearchResults/ColumnResizeDialog.test.tsx`

---

### Task 1: Add Changelog Types and API Functions

**Files:**

- Modify: `src/utils/types.ts`
- Modify: `src/utils/api.ts`

- [ ] **Step 1: Append changelog types to `src/utils/types.ts`**

Add at the bottom of the file:

```typescript
export interface ChangelogSummary {
  id: string;
  date: string;
  updatedCount: number;
  deletedCount: number;
  createdCount: number;
}

export interface ChangelogEntry {
  id: string;
  date: string;
  updatedEvents: Event[];
  deletedEvents: Event[];
  createdEvents: Event[];
}

export interface ListChangelogsResponse {
  error?: string;
  entries?: ChangelogSummary[];
}

export interface FetchChangelogResponse {
  error?: string;
  entry?: ChangelogEntry;
}
```

- [ ] **Step 2: Add API functions to `src/utils/api.ts`**

Update the import at the top of the file to include the new types:

```typescript
import type {
  EventSearchResponse,
  SearchParams,
  ListChangelogsResponse,
  FetchChangelogResponse,
  ChangelogEntry,
} from "./types";
```

Append to the bottom of the file:

```typescript
export async function fetchChangelogList(
  limit = 6,
): Promise<ListChangelogsResponse> {
  const url = new URL("/api/changelog/list", window.location.origin);
  url.searchParams.set("limit", String(limit));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<ListChangelogsResponse>;
}

export async function fetchChangelogEntry(id: string): Promise<ChangelogEntry> {
  const url = new URL("/api/changelog/fetch", window.location.origin);
  url.searchParams.set("id", id);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as FetchChangelogResponse;
  if (data.error) throw new Error(data.error);
  if (!data.entry) throw new Error("Missing entry in response");
  return data.entry;
}
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/utils/types.ts src/utils/api.ts
git commit -m "feat(changelog): add types and API functions"
```

---

### Task 2: Add MSW Factory Helpers and Default Handlers

**Files:**

- Modify: `src/test/msw/factory.ts`
- Modify: `src/test/msw/handlers.ts`

- [ ] **Step 1: Update `src/test/msw/factory.ts`**

Update the import at the top:

```typescript
import type {
  Event,
  ChangelogSummary,
  ChangelogEntry,
} from "../../utils/types";
```

Append to the bottom of the file (after `makeEvent`):

```typescript
export function makeChangelogSummary(
  overrides: Partial<ChangelogSummary> = {},
): ChangelogSummary {
  counter++;
  return {
    id: `entry-${counter}`,
    date: "2026-04-25T12:00:00Z",
    createdCount: 2,
    updatedCount: 1,
    deletedCount: 0,
    ...overrides,
  };
}

export function makeChangelogEntry(
  overrides: Partial<ChangelogEntry> = {},
): ChangelogEntry {
  const base: ChangelogEntry = {
    id: `entry-${counter}`,
    date: "2026-04-25T12:00:00Z",
    createdEvents: [makeEvent()],
    updatedEvents: [],
    deletedEvents: [],
  };
  return { ...base, ...overrides };
}
```

- [ ] **Step 2: Update `src/test/msw/handlers.ts`**

Update the imports at the top:

```typescript
import { http, HttpResponse } from "msw";
import type {
  EventSearchResponse,
  ListChangelogsResponse,
  FetchChangelogResponse,
} from "../../utils/types";
import { makeEvent, makeChangelogSummary, makeChangelogEntry } from "./factory";
```

Add to the `handlers` array after the existing `/api/events/search` handler:

```typescript
http.get("/api/changelog/list", () => {
  const response: ListChangelogsResponse = {
    entries: [makeChangelogSummary({ id: "entry-1" })],
  };
  return HttpResponse.json(response);
}),
http.get("/api/changelog/fetch", () => {
  const response: FetchChangelogResponse = {
    entry: makeChangelogEntry({ id: "entry-1" }),
  };
  return HttpResponse.json(response);
}),
```

- [ ] **Step 3: Run existing tests — verify no regressions**

Run: `npx vitest run`
Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add src/test/msw/factory.ts src/test/msw/handlers.ts
git commit -m "test(changelog): add MSW factory helpers and default handlers"
```

---

### Task 3: Move ColumnActionsPopover and ColumnResizeDialog to ui/EventTable/

**Files:**

- Move: `src/components/SearchResults/ColumnActionsPopover.{tsx,module.css,test.tsx}` → `src/ui/EventTable/`
- Move: `src/components/SearchResults/ColumnResizeDialog.{tsx,module.css,test.tsx}` → `src/ui/EventTable/`
- Modify: `src/components/SearchResults/SearchResults.tsx` (update two imports)

- [ ] **Step 1: Move files**

```bash
mkdir -p src/ui/EventTable
mv src/components/SearchResults/ColumnActionsPopover.tsx src/ui/EventTable/ColumnActionsPopover.tsx
mv src/components/SearchResults/ColumnActionsPopover.module.css src/ui/EventTable/ColumnActionsPopover.module.css
mv src/components/SearchResults/ColumnActionsPopover.test.tsx src/ui/EventTable/ColumnActionsPopover.test.tsx
mv src/components/SearchResults/ColumnResizeDialog.tsx src/ui/EventTable/ColumnResizeDialog.tsx
mv src/components/SearchResults/ColumnResizeDialog.module.css src/ui/EventTable/ColumnResizeDialog.module.css
mv src/components/SearchResults/ColumnResizeDialog.test.tsx src/ui/EventTable/ColumnResizeDialog.test.tsx
```

- [ ] **Step 2: Verify moved test files need no import changes**

Both test files import their subject with `"./ColumnActionsPopover"` and `"./ColumnResizeDialog"` respectively — relative paths that still resolve correctly in the new location. No changes needed.

- [ ] **Step 3: Update imports in `src/components/SearchResults/SearchResults.tsx`**

Find these two lines:

```typescript
import { ColumnActionsPopover } from "./ColumnActionsPopover";
import { ColumnResizeDialog } from "./ColumnResizeDialog";
```

Replace with:

```typescript
import { ColumnActionsPopover } from "../../ui/EventTable/ColumnActionsPopover";
import { ColumnResizeDialog } from "../../ui/EventTable/ColumnResizeDialog";
```

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`
Expected: all tests pass — moved tests still run from new location

- [ ] **Step 5: Commit**

```bash
git add src/ui/EventTable/ src/components/SearchResults/SearchResults.tsx
git rm src/components/SearchResults/ColumnActionsPopover.tsx \
       src/components/SearchResults/ColumnActionsPopover.module.css \
       src/components/SearchResults/ColumnActionsPopover.test.tsx \
       src/components/SearchResults/ColumnResizeDialog.tsx \
       src/components/SearchResults/ColumnResizeDialog.module.css \
       src/components/SearchResults/ColumnResizeDialog.test.tsx
git commit -m "refactor: move ColumnActionsPopover and ColumnResizeDialog to ui/EventTable"
```

---

### Task 4: Create EventTable (TDD)

**Files:**

- Create: `src/ui/EventTable/EventTable.test.tsx`
- Create: `src/ui/EventTable/EventTable.tsx`
- Create: `src/ui/EventTable/EventTable.module.css`

- [ ] **Step 1: Write failing tests**

Create `src/ui/EventTable/EventTable.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  createMemoryHistory,
} from "@tanstack/react-router";
import { makeEvent } from "../../test/msw/factory";
import { EventTable } from "./EventTable";
import type { Event } from "../../utils/types";

beforeEach(() => {
  localStorage.clear();
});

function renderEventTable(events: Event[] = [makeEvent()]) {
  const rootRoute = createRootRoute({
    component: () => <EventTable events={events} />,
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
  render(<RouterProvider router={router} />);
}

test("renders a table row for each event", () => {
  renderEventTable([makeEvent(), makeEvent()]);
  const rows = screen.getAllByRole("row");
  expect(rows).toHaveLength(3); // 1 header + 2 data rows
});

test("renders empty state when no events provided", () => {
  renderEventTable([]);
  expect(screen.getByText("No events.")).toBeInTheDocument();
});

test("title column is visible by default and shows event title", () => {
  renderEventTable([makeEvent({ title: "Dragon Hunt" })]);
  expect(screen.getByText("Dragon Hunt")).toBeInTheDocument();
});

test("title link points to the event detail route", () => {
  renderEventTable([
    makeEvent({ gameId: "RPG24000042", title: "Dragon Hunt" }),
  ]);
  expect(screen.getByRole("link", { name: "Dragon Hunt" })).toHaveAttribute(
    "href",
    "/event/RPG24000042",
  );
});

test("renders the column visibility panel", () => {
  renderEventTable();
  expect(screen.getByText("Customize columns")).toBeInTheDocument();
});

test("toggling a column off hides its header", async () => {
  const user = userEvent.setup();
  renderEventTable();
  await user.click(screen.getByRole("checkbox", { name: "Title" }));
  expect(
    screen.queryByRole("columnheader", { name: "Title" }),
  ).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests — verify all fail**

Run: `npx vitest run src/ui/EventTable/EventTable.test.tsx`
Expected: 6 failures — "Cannot find module './EventTable'"

- [ ] **Step 3: Create EventTable.module.css**

Create `src/ui/EventTable/EventTable.module.css` with the exact content of `src/components/SearchResults/SearchResults.module.css` (copy verbatim — all `.tableWrapper`, `.visibilityPanel`, `.sortButton`, `.thContent`, `.sortIndicator`, `.resizableTh`, `.resizeHandle`, `.isResizing` class rules).

- [ ] **Step 4: Implement EventTable**

Create `src/ui/EventTable/EventTable.tsx`:

```tsx
import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { useColumnVisibility } from "../../hooks/useColumnVisibility";
import { useColumnSizing } from "../../hooks/useColumnSizing";
import { ColumnActionsPopover } from "./ColumnActionsPopover";
import { ColumnResizeDialog } from "./ColumnResizeDialog";
import { announce } from "../../lib/announce";
import { ConceptBadge } from "../Badge/Badge";
import { Pawn } from "../icons/Pawn";
import { EXP } from "../../utils/enums";
import type { Event } from "../../utils/types";
import styles from "./EventTable.module.css";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    sortField?: string;
  }
}

// Copy the COLUMNS constant verbatim from
// src/components/SearchResults/SearchResults.tsx lines 38–299.
// No changes to any column definition.
export const COLUMNS: ColumnDef<Event>[] = [
  /* … paste lines 38–299 here … */
];

interface EventTableProps {
  events: Event[];
  activeSortField?: string;
  activeSortDir?: "asc" | "desc";
  onSort?: (sort: string | undefined) => void;
}

export function EventTable({
  events,
  activeSortField,
  activeSortDir,
  onSort,
}: EventTableProps) {
  const { visibility, toggle, reset } = useColumnVisibility();
  const { sizing, setSizing, reset: resetSizing } = useColumnSizing();
  const [resizeTarget, setResizeTarget] = useState<{
    columnId: string;
    columnName: string;
    currentWidth: number;
  } | null>(null);

  const handleSortClick = (sortField: string, label: string) => {
    if (!onSort) return;
    if (activeSortField !== sortField) {
      onSort(`${sortField}.asc`);
      announce(`Sorted by ${label}, ascending`);
    } else if (activeSortDir === "asc") {
      onSort(`${sortField}.desc`);
      announce(`Sorted by ${label}, descending`);
    } else {
      onSort(undefined);
      announce("Sort cleared");
    }
  };

  const table = useReactTable({
    data: events,
    columns: COLUMNS,
    columnResizeMode: "onChange",
    state: { columnVisibility: visibility, columnSizing: sizing },
    onColumnSizingChange: setSizing,
    manualSorting: true,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  });

  if (events.length === 0) {
    return <p>No events.</p>;
  }

  return (
    <section>
      <details className={styles.visibilityPanel}>
        <summary>Customize columns</summary>
        <fieldset>
          <ul>
            {COLUMNS.map((col) => (
              <li key={col.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={!!visibility[col.id!]}
                    onChange={() => toggle(col.id!)}
                  />
                  {col.header as string}
                </label>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              reset();
              resetSizing();
            }}
          >
            Reset to defaults
          </button>
        </fieldset>
      </details>

      <div className={styles.tableWrapper}>
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortField = header.column.columnDef.meta?.sortField;
                  const label = header.column.columnDef.header as string;
                  const isActive =
                    !!onSort && !!sortField && activeSortField === sortField;
                  let ariaSort: "ascending" | "descending" | "none" = "none";
                  if (isActive) {
                    ariaSort =
                      activeSortDir === "asc" ? "ascending" : "descending";
                  }
                  return (
                    <th
                      key={header.id}
                      aria-sort={onSort ? ariaSort : undefined}
                      scope="col"
                      aria-label={label}
                      className={`${styles.resizableTh}${header.column.getIsResizing() ? ` ${styles.isResizing}` : ""}`}
                      style={{ width: header.getSize() }}
                    >
                      <div className={styles.thContent}>
                        {onSort ? (
                          <button
                            type="button"
                            className={styles.sortButton}
                            aria-label={`Sort by ${label}`}
                            onClick={() =>
                              sortField && handleSortClick(sortField, label)
                            }
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {isActive && (
                              <span
                                aria-hidden="true"
                                className={styles.sortIndicator}
                              >
                                {activeSortDir === "asc" ? " ▲" : " ▼"}
                              </span>
                            )}
                          </button>
                        ) : (
                          <span>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                          </span>
                        )}
                        {header.column.getCanResize() && (
                          <ColumnActionsPopover
                            sortField={onSort ? sortField : undefined}
                            activeSortField={activeSortField}
                            activeSortDir={activeSortDir}
                            onSort={onSort ?? (() => {})}
                            onOpenResize={() =>
                              setResizeTarget({
                                columnId: header.column.id,
                                columnName: label,
                                currentWidth: header.getSize(),
                              })
                            }
                          />
                        )}
                      </div>
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
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {resizeTarget && (
        <ColumnResizeDialog
          columnName={resizeTarget.columnName}
          currentWidth={resizeTarget.currentWidth}
          onApply={(width) => {
            setSizing((prev) => ({ ...prev, [resizeTarget.columnId]: width }));
          }}
          onClose={() => setResizeTarget(null)}
        />
      )}
    </section>
  );
}
```

- [ ] **Step 5: Run EventTable tests**

Run: `npx vitest run src/ui/EventTable/EventTable.test.tsx`
Expected: all 6 pass

- [ ] **Step 6: Commit**

```bash
git add src/ui/EventTable/EventTable.tsx src/ui/EventTable/EventTable.module.css src/ui/EventTable/EventTable.test.tsx
git commit -m "feat(EventTable): extract shared event table primitive from SearchResults"
```

---

### Task 5: Refactor SearchResults to Use EventTable

**Files:**

- Modify: `src/components/SearchResults/SearchResults.tsx`
- Modify: `src/components/SearchResults/SearchResults.module.css`

- [ ] **Step 1: Record baseline test count**

Run: `npx vitest run src/components/SearchResults src/routes/index.test.tsx`
Expected: all pass. Note the total count — they must all pass again after the refactor.

- [ ] **Step 2: Replace SearchResults.tsx**

Overwrite `src/components/SearchResults/SearchResults.tsx` with:

```tsx
import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "../../utils/api";
import { Pagination } from "../Pagination/Pagination";
import type { SearchParams } from "../../utils/types";
import { PixelState } from "../../ui/PixelState/PixelState";
import { EventTable } from "../../ui/EventTable/EventTable";

interface SearchResultsProps {
  searchParams: SearchParams;
  onNavigate: (page: number, limit: number) => void;
  onSort: (sort: string | undefined) => void;
}

export function SearchResults({
  searchParams,
  onNavigate,
  onSort,
}: SearchResultsProps) {
  const page = searchParams.page ?? 1;
  const limit = searchParams.limit ?? 100;
  const { data, isLoading, isError } = useQuery({
    queryKey: ["events", searchParams],
    queryFn: () => fetchEvents(searchParams),
  });

  let activeSortField: string | undefined;
  let activeSortDir: "asc" | "desc" | undefined;
  if (searchParams.sort) {
    const [field, dir] = searchParams.sort.split(".");
    if (field && (dir === "asc" || dir === "desc")) {
      activeSortField = field;
      activeSortDir = dir;
    }
  }

  const pagination =
    data && data.data.length > 0 ? (
      <Pagination
        page={page}
        limit={limit}
        total={data.meta.total}
        onNavigate={onNavigate}
      />
    ) : null;

  return (
    <section>
      {isLoading && <PixelState variant="loading" text="LOADING QUESTS..." />}
      {isError && (
        <PixelState
          variant="error"
          text="QUEST FAILED"
          subtext="Unable to load events. Please try again."
        />
      )}
      {data && data.data.length === 0 && (
        <PixelState
          variant="empty"
          text="NO QUESTS FOUND"
          subtext="Try broadening your search."
        />
      )}
      {data && data.data.length > 0 && (
        <>
          {pagination}
          <EventTable
            events={data.data}
            activeSortField={activeSortField}
            activeSortDir={activeSortDir}
            onSort={onSort}
          />
          {pagination}
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Clear SearchResults.module.css**

All styles have moved to `EventTable.module.css`. Replace the entire file content with an empty string (or a single blank line).

- [ ] **Step 4: Run tests again — verify same count, all pass**

Run: `npx vitest run src/components/SearchResults src/routes/index.test.tsx`
Expected: same count, all pass

- [ ] **Step 5: Commit**

```bash
git add src/components/SearchResults/SearchResults.tsx src/components/SearchResults/SearchResults.module.css
git commit -m "refactor(SearchResults): delegate table rendering to EventTable"
```

---

### Task 6: Write Failing Changelog Route Tests and Stub Route

**Files:**

- Create: `src/routes/changelog.tsx` (stub only)
- Create: `src/routes/changelog.test.tsx`

- [ ] **Step 1: Create stub changelog route**

Create `src/routes/changelog.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/changelog")({
  component: () => (
    <main>
      <p>Changelog</p>
    </main>
  ),
});
```

- [ ] **Step 2: Write the full test file**

Create `src/routes/changelog.test.tsx`:

```tsx
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  createMemoryHistory,
  Outlet,
} from "@tanstack/react-router";
import { server } from "../test/msw/server";
import {
  makeChangelogSummary,
  makeChangelogEntry,
  makeEvent,
} from "../test/msw/factory";
import type {
  ListChangelogsResponse,
  FetchChangelogResponse,
} from "../utils/types";
import { ChangelogPage } from "../components/ChangelogPage/ChangelogPage";

beforeEach(() => {
  localStorage.clear();
});

async function renderChangelogPage() {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const changelogRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/changelog",
    component: ChangelogPage,
  });
  const eventRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/event/$id",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([changelogRoute, eventRoute]),
    history: createMemoryHistory({ initialEntries: ["/changelog"] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

test("renders a summary row for each changelog entry", async () => {
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [
          makeChangelogSummary({
            id: "entry-1",
            createdCount: 3,
            updatedCount: 1,
            deletedCount: 0,
          }),
        ],
      }),
    ),
  );
  await renderChangelogPage();
  expect(await screen.findByText(/3 created/)).toBeInTheDocument();
  expect(screen.getByText(/1 updated/)).toBeInTheDocument();
  expect(screen.getByText(/0 deleted/)).toBeInTheDocument();
});

test("shows empty state when no entries returned", async () => {
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({ entries: [] }),
    ),
  );
  await renderChangelogPage();
  expect(
    await screen.findByText("No changelog entries yet."),
  ).toBeInTheDocument();
});

test("shows error state when list fetch fails", async () => {
  server.use(
    http.get(
      "/api/changelog/list",
      () => new HttpResponse(null, { status: 500 }),
    ),
  );
  await renderChangelogPage();
  expect(
    await screen.findByText(/could not load changelog/i),
  ).toBeInTheDocument();
});

test("expanding a row fetches and displays the event table", async () => {
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
          updatedEvents: [],
          deletedEvents: [],
        }),
      }),
    ),
  );
  await renderChangelogPage();
  await user.click(await screen.findByText(/1 created/));
  expect(await screen.findByText("Dragon Hunt")).toBeInTheDocument();
});

test("shows entry error message when entry fetch fails", async () => {
  const user = userEvent.setup();
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [makeChangelogSummary({ id: "entry-1" })],
      }),
    ),
    http.get(
      "/api/changelog/fetch",
      () => new HttpResponse(null, { status: 500 }),
    ),
  );
  await renderChangelogPage();
  await user.click(await screen.findByText(/2 created/));
  expect(
    await screen.findByText(/could not load this entry/i),
  ).toBeInTheDocument();
});

test("does not render section headers for empty event groups", async () => {
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
          updatedEvents: [],
          deletedEvents: [],
        }),
      }),
    ),
  );
  await renderChangelogPage();
  await user.click(await screen.findByText(/1 created/));
  expect(await screen.findByText("Created (1)")).toBeInTheDocument();
  expect(screen.queryByText("Updated (0)")).not.toBeInTheDocument();
  expect(screen.queryByText("Deleted (0)")).not.toBeInTheDocument();
});
```

- [ ] **Step 3: Run tests — verify all fail**

Run: `npx vitest run src/routes/changelog.test.tsx`
Expected: all 6 fail with "Cannot find module '../components/ChangelogPage/ChangelogPage'"

- [ ] **Step 4: Commit stub and tests**

```bash
git add src/routes/changelog.tsx src/routes/changelog.test.tsx
git commit -m "test(changelog): add failing route tests and route stub"
```

---

### Task 7: Implement Changelog Page Components

**Files:**

- Create: `src/components/ChangelogPage/useChangelogPrefetch.ts`
- Create: `src/components/ChangelogPage/ChangelogEntryPanel.tsx`
- Create: `src/components/ChangelogPage/ChangelogEntryPanel.module.css`
- Create: `src/components/ChangelogPage/ChangelogRow.tsx`
- Create: `src/components/ChangelogPage/ChangelogRow.module.css`
- Create: `src/components/ChangelogPage/ChangelogPage.tsx`
- Create: `src/components/ChangelogPage/ChangelogPage.module.css`

- [ ] **Step 1: Create useChangelogPrefetch**

Create `src/components/ChangelogPage/useChangelogPrefetch.ts`:

```typescript
import { useCallback, useEffect, useReducer, useRef } from "react";
import type { ChangelogEntry, ChangelogSummary } from "../../utils/types";
import { fetchChangelogEntry } from "../../utils/api";

type CacheValue = ChangelogEntry | "loading" | "error";

export function useChangelogPrefetch(summaries: ChangelogSummary[]) {
  const cache = useRef<Map<string, CacheValue>>(new Map());
  const summariesRef = useRef(summaries);
  summariesRef.current = summaries;
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  const fetchOne = useCallback(async (id: string): Promise<void> => {
    const current = cache.current.get(id);
    // Skip if already loading or successfully fetched; retry if "error"
    if (current === "loading" || (current !== undefined && current !== "error"))
      return;
    cache.current.set(id, "loading");
    forceUpdate();
    try {
      const entry = await fetchChangelogEntry(id);
      cache.current.set(id, entry);
    } catch {
      cache.current.set(id, "error");
    }
    forceUpdate();
  }, []);

  // Prefetch entry[0] as soon as the summary list is available
  useEffect(() => {
    if (summaries.length > 0) {
      void fetchOne(summaries[0].id);
    }
  }, [summaries, fetchOne]);

  const getEntry = useCallback(
    (id: string): CacheValue | undefined => cache.current.get(id),
    [],
  );

  const openEntry = useCallback(
    (index: number): void => {
      const list = summariesRef.current;
      const summary = list[index];
      if (!summary) return;

      const current = cache.current.get(summary.id);
      const isReady =
        current !== undefined && current !== "loading" && current !== "error";

      if (isReady) {
        // Already fetched — background-fetch next
        if (index + 1 < list.length) void fetchOne(list[index + 1].id);
      } else {
        // Fetch target first, then fill in surrounding entries
        void fetchOne(summary.id).then(() => {
          for (let j = 0; j < index; j++) void fetchOne(list[j].id);
          if (index + 1 < list.length) void fetchOne(list[index + 1].id);
        });
      }
    },
    [fetchOne],
  );

  return { getEntry, openEntry };
}
```

- [ ] **Step 2: Create ChangelogEntryPanel**

Create `src/components/ChangelogPage/ChangelogEntryPanel.tsx`:

```tsx
import type { ChangelogEntry } from "../../utils/types";
import { EventTable } from "../../ui/EventTable/EventTable";
import styles from "./ChangelogEntryPanel.module.css";

type EntryValue = ChangelogEntry | "loading" | "error" | undefined;

interface ChangelogEntryPanelProps {
  entry: EntryValue;
}

export function ChangelogEntryPanel({ entry }: ChangelogEntryPanelProps) {
  if (entry === undefined || entry === "loading") {
    return (
      <p className={styles.status} aria-busy="true">
        Loading…
      </p>
    );
  }

  if (entry === "error") {
    return (
      <p className={styles.status}>
        Could not load this entry. Collapse and re-expand to retry.
      </p>
    );
  }

  return (
    <div className={styles.panel}>
      {entry.createdEvents.length > 0 && (
        <details open className={styles.group}>
          <summary>Created ({entry.createdEvents.length})</summary>
          <EventTable events={entry.createdEvents} />
        </details>
      )}
      {entry.updatedEvents.length > 0 && (
        <details open className={styles.group}>
          <summary>Updated ({entry.updatedEvents.length})</summary>
          <EventTable events={entry.updatedEvents} />
        </details>
      )}
      {entry.deletedEvents.length > 0 && (
        <details open className={styles.group}>
          <summary>Deleted ({entry.deletedEvents.length})</summary>
          <EventTable events={entry.deletedEvents} />
        </details>
      )}
    </div>
  );
}
```

Create `src/components/ChangelogPage/ChangelogEntryPanel.module.css`:

```css
.status {
  padding: var(--space-3) var(--space-4);
  color: var(--color-bark);
}

.panel {
  padding: var(--space-2) 0;
}

.group {
  margin-bottom: var(--space-3);
}

.group summary {
  cursor: pointer;
  padding: var(--space-2) var(--space-4);
  font-weight: 600;
  font-size: var(--text-label);
  color: var(--color-ink);
}

.group::details-content {
  height: 0;
  overflow: hidden;
  transition:
    height var(--motion-expand),
    content-visibility var(--motion-expand) allow-discrete;
}

.group[open]::details-content {
  height: auto;
}
```

- [ ] **Step 3: Create ChangelogRow**

Create `src/components/ChangelogPage/ChangelogRow.tsx`:

```tsx
import { format } from "date-fns";
import type { ChangelogEntry, ChangelogSummary } from "../../utils/types";
import { ChangelogEntryPanel } from "./ChangelogEntryPanel";
import styles from "./ChangelogRow.module.css";

type EntryValue = ChangelogEntry | "loading" | "error" | undefined;

interface ChangelogRowProps {
  summary: ChangelogSummary;
  entry: EntryValue;
  onOpen: () => void;
}

export function ChangelogRow({ summary, entry, onOpen }: ChangelogRowProps) {
  return (
    <details
      className={styles.row}
      onToggle={(e) => {
        if ((e.currentTarget as HTMLDetailsElement).open) onOpen();
      }}
    >
      <summary className={styles.summary}>
        <time dateTime={summary.date} className={styles.date}>
          {format(new Date(summary.date), "MMM d, yyyy h:mm a")}
        </time>
        <span className={styles.counts}>
          <span>{summary.createdCount} created</span>
          <span>{summary.updatedCount} updated</span>
          <span>{summary.deletedCount} deleted</span>
        </span>
      </summary>
      <ChangelogEntryPanel entry={entry} />
    </details>
  );
}
```

Create `src/components/ChangelogPage/ChangelogRow.module.css`:

```css
.row {
  border: 1px solid var(--color-bark-light);
  border-radius: 4px;
  margin-bottom: var(--space-2);
  background: var(--color-parchment-light);
}

.row::details-content {
  height: 0;
  overflow: hidden;
  transition:
    height var(--motion-expand),
    content-visibility var(--motion-expand) allow-discrete;
}

.row[open]::details-content {
  height: auto;
}

.summary {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
  list-style: none;
}

.summary::-webkit-details-marker {
  display: none;
}

.date {
  font-family: var(--font-display);
  font-style: italic;
  font-size: var(--text-label);
  color: var(--color-ink);
  flex: 1;
}

.counts {
  display: flex;
  gap: var(--space-3);
  font-size: var(--text-label);
  color: var(--color-bark);
}
```

- [ ] **Step 4: Create ChangelogPage**

Create `src/components/ChangelogPage/ChangelogPage.tsx`:

```tsx
import { useEffect, useState } from "react";
import { fetchChangelogList } from "../../utils/api";
import type { ChangelogSummary } from "../../utils/types";
import { useChangelogPrefetch } from "./useChangelogPrefetch";
import { ChangelogRow } from "./ChangelogRow";
import { PixelState } from "../../ui/PixelState/PixelState";
import styles from "./ChangelogPage.module.css";

export function ChangelogPage() {
  const [summaries, setSummaries] = useState<ChangelogSummary[]>([]);
  const [listState, setListState] = useState<"loading" | "error" | "done">(
    "loading",
  );
  const { getEntry, openEntry } = useChangelogPrefetch(summaries);

  useEffect(() => {
    fetchChangelogList()
      .then((res) => {
        if (res.error) {
          setListState("error");
        } else {
          setSummaries(res.entries ?? []);
          setListState("done");
        }
      })
      .catch(() => setListState("error"));
  }, []);

  return (
    <main className={styles.page}>
      {listState === "loading" && (
        <PixelState variant="loading" text="LOADING CHANGELOG…" />
      )}
      {listState === "error" && (
        <p>Could not load changelog. Try refreshing.</p>
      )}
      {listState === "done" && summaries.length === 0 && (
        <p>No changelog entries yet.</p>
      )}
      {listState === "done" && summaries.length > 0 && (
        <>
          <h1 className={styles.heading}>Changelog</h1>
          <section>
            {summaries.map((summary, i) => (
              <ChangelogRow
                key={summary.id}
                summary={summary}
                entry={getEntry(summary.id)}
                onOpen={() => openEntry(i)}
              />
            ))}
          </section>
        </>
      )}
    </main>
  );
}
```

Create `src/components/ChangelogPage/ChangelogPage.module.css`:

```css
.page {
  padding: var(--space-4);
  max-width: var(--size-detail-max);
  margin: 0 auto;
}

.heading {
  font-family: var(--font-display);
  font-size: var(--text-heading);
  font-style: italic;
  color: var(--color-ink);
  margin-bottom: var(--space-4);
}
```

- [ ] **Step 5: Run changelog tests**

Run: `npx vitest run src/routes/changelog.test.tsx`
Expected: all 6 pass

- [ ] **Step 6: Run full suite**

Run: `npx vitest run`
Expected: all tests pass

- [ ] **Step 7: Commit**

```bash
git add src/components/ChangelogPage/
git commit -m "feat(changelog): implement ChangelogPage, ChangelogRow, ChangelogEntryPanel, useChangelogPrefetch"
```

---

### Task 8: Wire Up Route and Add Nav Link

**Files:**

- Modify: `src/routes/changelog.tsx` (swap stub for real component)
- Modify: `src/routes/__root.tsx` (add nav link)

- [ ] **Step 1: Update changelog route to use ChangelogPage**

Replace `src/routes/changelog.tsx` with:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { ChangelogPage } from "../components/ChangelogPage/ChangelogPage";

export const Route = createFileRoute("/changelog")({
  component: ChangelogPage,
});
```

- [ ] **Step 2: Add nav link to the root layout**

The current `src/routes/__root.tsx` has `<h1>Gen Con Buddy</h1>` and a subtitle `<p>`. Add a `<nav>` with links to Search and Changelog. The existing `createRootRoute` import stays; add `Link` to the import:

```tsx
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import styles from "./index.module.css";

export const Route = createRootRoute({
  component: () => (
    <div className={styles.page}>
      <header role="banner" className={styles.header}>
        <h1>Gen Con Buddy</h1>
        <p>your guide to the best four days in gaming</p>
        <nav className={styles.nav}>
          <Link to="/">Search</Link>
          <Link to="/changelog">Changelog</Link>
        </nav>
      </header>
      <Outlet />
    </div>
  ),
});
```

Add `.nav` to `src/routes/index.module.css` (the root layout CSS file):

```css
.nav {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.nav a {
  color: var(--color-gold);
  font-family: var(--font-display);
  font-style: italic;
  font-size: var(--text-label);
  text-decoration: none;
}

.nav a:hover {
  text-decoration: underline;
}
```

- [ ] **Step 3: Regenerate routeTree.gen**

The TanStack Router Vite plugin auto-generates `src/routeTree.gen.ts` during `vite build`. Run:

```bash
npm run build 2>&1 | tail -10
```

Expected: build succeeds. `src/routeTree.gen.ts` now includes `/changelog`.

If the build fails for unrelated reasons, run just the plugin via the dev server briefly:

```bash
npx vite optimize --force 2>&1 | head -5
```

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`
Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add src/routes/changelog.tsx src/routes/__root.tsx src/routes/index.module.css src/routeTree.gen.ts
git commit -m "feat(changelog): wire up route and add header nav link"
```
