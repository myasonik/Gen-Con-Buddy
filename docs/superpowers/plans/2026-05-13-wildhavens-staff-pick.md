# Wildhavens Staff Pick Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Highlight 7 Wildhavens board game events as staff picks — accented rows with a badge in search results, plus a full-table callout below the empty state.

**Architecture:** A `staffPicks.ts` constants module drives two surfaces: (1) `columns.tsx` and `EventListMobile.tsx` check each event's `gameId` against `STAFF_PICK_IDS` for row styling and badge injection; (2) a new `WildhavensCallout` component fetches the 7 events by group name, renders them in the standard `EventTable`/`EventListMobile`, and is mounted below the empty state in `SearchResults`.

**Tech Stack:** React, TanStack Query (`useQuery`), TanStack Router (`Link`), MSW (tests), Vitest + React Testing Library, CSS Modules.

---

## File Map

| Status | Path | Purpose |
|--------|------|---------|
| Create | `src/utils/staffPicks.ts` | IDs constant and Set for O(1) lookup |
| Create | `src/utils/staffPicks.test.ts` | Unit tests for the constants |
| Modify | `src/components/EventTable/columns.tsx` | Badge in title cell |
| Modify | `src/components/EventTable/columns.module.css` | `.titleCell` flex layout |
| Modify | `src/components/EventTable/EventTable.tsx` | `data-staff-pick` on `<tr>` |
| Modify | `src/components/EventTable/EventTable.module.css` | Accent row background |
| Modify | `src/components/EventTable/EventTable.test.tsx` | Badge and row-attribute tests |
| Modify | `src/components/EventTable/EventListMobile.tsx` | Badge + `data-staff-pick` on `<li>` |
| Modify | `src/components/EventTable/EventListMobile.module.css` | Accent card background |
| Modify | `src/components/EventTable/EventListMobile.test.tsx` | Badge and list-item tests |
| Modify | `src/test/msw/handlers.ts` | Export `makeWildhavensHandler` |
| Create | `src/components/WildhavensCallout/WildhavensCallout.tsx` | Callout panel component |
| Create | `src/components/WildhavensCallout/WildhavensCallout.module.css` | Panel styles |
| Create | `src/components/WildhavensCallout/WildhavensCallout.test.tsx` | Component tests |
| Modify | `src/components/SearchResults/SearchResults.tsx` | Mount callout on empty state |
| Modify | `src/components/SearchResults/SearchResults.test.tsx` | Callout integration tests |

---

## Task 1: Data Layer — `staffPicks.ts`

**Files:**
- Create: `src/utils/staffPicks.ts`
- Create: `src/utils/staffPicks.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/utils/staffPicks.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { WILDHAVENS_GAME_IDS, STAFF_PICK_IDS } from "./staffPicks";

describe("WILDHAVENS_GAME_IDS", () => {
  it("contains exactly 7 IDs", () => {
    expect(WILDHAVENS_GAME_IDS).toHaveLength(7);
  });

  it("contains no duplicates", () => {
    expect(new Set(WILDHAVENS_GAME_IDS).size).toBe(WILDHAVENS_GAME_IDS.length);
  });

  it("contains all expected game IDs", () => {
    expect(WILDHAVENS_GAME_IDS).toContain("BGM26ND310303");
    expect(WILDHAVENS_GAME_IDS).toContain("BGM26ND310286");
    expect(WILDHAVENS_GAME_IDS).toContain("BGM26ND310299");
    expect(WILDHAVENS_GAME_IDS).toContain("BGM26ND310301");
    expect(WILDHAVENS_GAME_IDS).toContain("BGM26ND310296");
    expect(WILDHAVENS_GAME_IDS).toContain("BGM26ND310298");
    expect(WILDHAVENS_GAME_IDS).toContain("BGM26ND310302");
  });
});

describe("STAFF_PICK_IDS", () => {
  it("is a Set derived from WILDHAVENS_GAME_IDS", () => {
    for (const id of WILDHAVENS_GAME_IDS) {
      expect(STAFF_PICK_IDS.has(id)).toBe(true);
    }
  });

  it("does not contain IDs outside WILDHAVENS_GAME_IDS", () => {
    expect(STAFF_PICK_IDS.has("RPG24000001")).toBe(false);
    expect(STAFF_PICK_IDS.has("")).toBe(false);
  });

  it("has the same size as WILDHAVENS_GAME_IDS", () => {
    expect(STAFF_PICK_IDS.size).toBe(WILDHAVENS_GAME_IDS.length);
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
npx vitest run src/utils/staffPicks.test.ts
```

Expected: FAIL — `Cannot find module './staffPicks'`

- [ ] **Step 3: Create `src/utils/staffPicks.ts`**

```ts
export const WILDHAVENS_GAME_IDS: ReadonlyArray<string> = [
  "BGM26ND310303",
  "BGM26ND310286",
  "BGM26ND310299",
  "BGM26ND310301",
  "BGM26ND310296",
  "BGM26ND310298",
  "BGM26ND310302",
] as const;

export const STAFF_PICK_IDS: ReadonlySet<string> = new Set(WILDHAVENS_GAME_IDS);
```

- [ ] **Step 4: Run test to confirm pass**

```bash
npx vitest run src/utils/staffPicks.test.ts
```

Expected: PASS — 6 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/utils/staffPicks.ts src/utils/staffPicks.test.ts
git commit -m "feat: add WILDHAVENS_GAME_IDS and STAFF_PICK_IDS constants"
```

---

## Task 2: Title Cell Badge in `columns.tsx`

**Files:**
- Modify: `src/components/EventTable/columns.tsx`
- Modify: `src/components/EventTable/columns.module.css`
- Modify: `src/components/EventTable/EventTable.test.tsx` (add tests)

- [ ] **Step 1: Write the failing tests**

Add to `src/components/EventTable/EventTable.test.tsx`:

```tsx
test("renders Staff Pick badge for staff pick event in title cell", async () => {
  await renderEventTable([makeEvent({ gameId: "BGM26ND310303", title: "Wildhavens Game" })]);
  expect(screen.getByText("Staff Pick")).toBeInTheDocument();
});

test("does not render Staff Pick badge for non-staff-pick event", async () => {
  await renderEventTable([makeEvent({ gameId: "OTHER0001", title: "Some Other Game" })]);
  expect(screen.queryByText("Staff Pick")).not.toBeInTheDocument();
});

test("Staff Pick badge only appears once when one of seven staff pick IDs is rendered", async () => {
  await renderEventTable([
    makeEvent({ gameId: "BGM26ND310303" }),
    makeEvent({ gameId: "OTHER0001" }),
  ]);
  expect(screen.getAllByText("Staff Pick")).toHaveLength(1);
});
```

- [ ] **Step 2: Run tests to confirm failure**

```bash
npx vitest run src/components/EventTable/EventTable.test.tsx
```

Expected: FAIL — `Unable to find an element with the text: Staff Pick`

- [ ] **Step 3: Add `.titleCell` to `src/components/EventTable/columns.module.css`**

```css
.titleCell {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}
```

- [ ] **Step 4: Update the title cell in `src/components/EventTable/columns.tsx`**

Add the import at the top of the file (STAFF_PICK_IDS needs to be imported):

```tsx
import { STAFF_PICK_IDS } from "../../utils/staffPicks";
```

Replace the existing `title` column definition:

```tsx
  {
    id: "title",
    header: "Title",
    meta: { sortField: "title" },
    cell: ({ row, linkState }) => {
      const { gameId, title } = row.original.attributes;
      const isStaffPick = STAFF_PICK_IDS.has(gameId);
      return (
        <span className={styles.titleCell}>
          {isStaffPick && <Chip tone="accent" size="sm">Staff Pick</Chip>}
          <Link to="/event/$id" params={{ id: gameId }} state={linkState}>
            {title}
          </Link>
        </span>
      );
    },
  },
```

- [ ] **Step 5: Run tests to confirm pass**

```bash
npx vitest run src/components/EventTable/EventTable.test.tsx
```

Expected: PASS — all tests pass (previously passing tests should still pass)

- [ ] **Step 6: Commit**

```bash
git add src/components/EventTable/columns.tsx src/components/EventTable/columns.module.css src/components/EventTable/EventTable.test.tsx
git commit -m "feat: add Staff Pick badge to title cell for Wildhavens events"
```

---

## Task 3: Accent Row in `EventTable.tsx`

**Files:**
- Modify: `src/components/EventTable/EventTable.tsx`
- Modify: `src/components/EventTable/EventTable.module.css`
- Modify: `src/components/EventTable/EventTable.test.tsx` (add tests)

- [ ] **Step 1: Write the failing test**

Add to `src/components/EventTable/EventTable.test.tsx`:

```tsx
test("staff pick row has data-staff-pick attribute", async () => {
  await renderEventTable([
    makeEvent({ gameId: "BGM26ND310303", title: "Staff Pick Game" }),
    makeEvent({ gameId: "OTHER0001", title: "Regular Game" }),
  ]);
  const rows = screen.getAllByRole("row");
  // rows[0] is the header; rows[1] and rows[2] are data rows
  const staffPickRow = rows.find((r) => r.textContent?.includes("Staff Pick Game"));
  const regularRow = rows.find((r) => r.textContent?.includes("Regular Game"));
  expect(staffPickRow).toHaveAttribute("data-staff-pick");
  expect(regularRow).not.toHaveAttribute("data-staff-pick");
});
```

- [ ] **Step 2: Run test to confirm failure**

```bash
npx vitest run src/components/EventTable/EventTable.test.tsx
```

Expected: FAIL — `Expected element to have attribute "data-staff-pick"` (since the attribute doesn't exist yet)

- [ ] **Step 3: Add `STAFF_PICK_IDS` import to `EventTable.tsx`**

Add to the imports at the top of `src/components/EventTable/EventTable.tsx`:

```tsx
import { STAFF_PICK_IDS } from "../../utils/staffPicks";
```

- [ ] **Step 4: Add `data-staff-pick` to the `<tr>` in `EventTable.tsx`**

Find the row rendering in the `<tbody>` (around line 304) and change:

```tsx
<tr key={row.id}>
```

to:

```tsx
<tr
  key={row.id}
  data-staff-pick={STAFF_PICK_IDS.has(row.original.attributes.gameId) || undefined}
>
```

- [ ] **Step 5: Add accent row CSS to `EventTable.module.css`**

Add after the existing `tbody tr:hover` rule:

```css
.tableWrapper tbody tr[data-staff-pick] td {
  background: var(--color-accent-surface);
}
```

- [ ] **Step 6: Run tests to confirm pass**

```bash
npx vitest run src/components/EventTable/EventTable.test.tsx
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/EventTable/EventTable.tsx src/components/EventTable/EventTable.module.css src/components/EventTable/EventTable.test.tsx
git commit -m "feat: accent row background for staff pick events in EventTable"
```

---

## Task 4: Badge and Accent Card in `EventListMobile`

**Files:**
- Modify: `src/components/EventTable/EventListMobile.tsx`
- Modify: `src/components/EventTable/EventListMobile.module.css`
- Modify: `src/components/EventTable/EventListMobile.test.tsx`

- [ ] **Step 1: Write the failing tests**

Add to `src/components/EventTable/EventListMobile.test.tsx`:

```tsx
test("renders Staff Pick badge for staff pick event", async () => {
  await renderList([makeEvent({ gameId: "BGM26ND310303" })]);
  expect(screen.getByText("Staff Pick")).toBeInTheDocument();
});

test("does not render Staff Pick badge for non-staff-pick event", async () => {
  await renderList([makeEvent({ gameId: "OTHER0001" })]);
  expect(screen.queryByText("Staff Pick")).not.toBeInTheDocument();
});

test("staff pick list item has data-staff-pick attribute", async () => {
  await renderList([
    makeEvent({ gameId: "BGM26ND310303", title: "Staff Pick Game" }),
    makeEvent({ gameId: "OTHER0001", title: "Regular Game" }),
  ]);
  const items = screen.getAllByRole("listitem");
  const staffPickItem = items.find((i) => i.textContent?.includes("Staff Pick Game"));
  const regularItem = items.find((i) => i.textContent?.includes("Regular Game"));
  expect(staffPickItem).toHaveAttribute("data-staff-pick");
  expect(regularItem).not.toHaveAttribute("data-staff-pick");
});
```

- [ ] **Step 2: Run tests to confirm failure**

```bash
npx vitest run src/components/EventTable/EventListMobile.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Add import to `EventListMobile.tsx`**

Add to the imports at the top of `src/components/EventTable/EventListMobile.tsx`:

```tsx
import { STAFF_PICK_IDS } from "../../utils/staffPicks";
```

- [ ] **Step 4: Update the `<li>` and add badge in `EventListMobile.tsx`**

In the `events.map(...)` return block, change the `<li>` opening tag (around line 202):

```tsx
<li
  key={event.id}
  className={styles.item}
  data-staff-pick={STAFF_PICK_IDS.has(a.gameId) || undefined}
>
```

Inside the `<Link>`, add the badge immediately before `{isVisible("title") && ...}`:

```tsx
{STAFF_PICK_IDS.has(a.gameId) && (
  <Chip tone="accent" size="sm">Staff Pick</Chip>
)}
{isVisible("title") && <span className={styles.title}>{a.title}</span>}
```

- [ ] **Step 5: Add accent CSS to `EventListMobile.module.css`**

Add after the existing `.item:nth-child(even)` rule:

```css
.item[data-staff-pick] {
  background: var(--color-accent-surface);
}
```

- [ ] **Step 6: Run tests to confirm pass**

```bash
npx vitest run src/components/EventTable/EventListMobile.test.tsx
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/EventTable/EventListMobile.tsx src/components/EventTable/EventListMobile.module.css src/components/EventTable/EventListMobile.test.tsx
git commit -m "feat: accent card and Staff Pick badge for Wildhavens events in EventListMobile"
```

---

## Task 5: Verify Group Name

**Files:** none (investigation step)

- [ ] **Step 1: Fetch one of the Wildhavens events from the production API**

```bash
curl -s 'https://web-production-e0d43.up.railway.app/api/events/search?gameId=BGM26ND310303&limit=1' | python3 -m json.tool | grep '"group"'
```

Expected output (example — verify the exact string):
```
"group": "Wildhavens",
```

- [ ] **Step 2: Record the exact group name**

The exact value of `attributes.group` is the string to use in `fetchEvents({ group: "..." })` in the WildhavensCallout. If it differs from `"Wildhavens"`, update every occurrence in Task 6 steps accordingly before implementing.

---

## Task 6: MSW Handler + `WildhavensCallout` Component

**Files:**
- Modify: `src/test/msw/handlers.ts`
- Create: `src/components/WildhavensCallout/WildhavensCallout.tsx`
- Create: `src/components/WildhavensCallout/WildhavensCallout.module.css`
- Create: `src/components/WildhavensCallout/WildhavensCallout.test.tsx`

### Step 6a — MSW handler export

- [ ] **Step 1: Add `makeWildhavensHandler` to `src/test/msw/handlers.ts`**

Add after the existing `makeEventPool` export:

```ts
export function makeWildhavensHandler(events: Event[]): HttpHandler {
  return http.get("/api/events/search", ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get("group") !== null) {
      const response: EventSearchResponse = {
        data: events,
        meta: { total: events.length },
        links: { self: request.url },
        error: null,
      };
      return HttpResponse.json(response);
    }
  });
}
```

### Step 6b — WildhavensCallout tests

- [ ] **Step 2: Write the failing tests**

Create `src/components/WildhavensCallout/WildhavensCallout.test.tsx`:

```tsx
import { StrictMode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { vi, expect, test, beforeEach } from "vitest";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  createMemoryHistory,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../../test/msw/server";
import { makeEvent } from "../../test/msw/factory";
import { makeWildhavensHandler } from "../../test/msw/handlers";
import { WildhavensCallout } from "./WildhavensCallout";
import type { EventSearchResponse } from "../../utils/types";
import { WILDHAVENS_GAME_IDS } from "../../utils/staffPicks";

beforeEach(() => {
  localStorage.clear();
});

function renderCallout(): ReturnType<typeof render> {
  const rootRoute = createRootRoute({
    component: () => <WildhavensCallout />,
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
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <StrictMode>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
}

test("shows loading state while fetching", async () => {
  server.use(makeWildhavensHandler([]));
  renderCallout();
  expect(screen.getByText("LOADING STAFF PICKS…")).toBeInTheDocument();
});

test("renders panel heading and controls when events load", async () => {
  const events = WILDHAVENS_GAME_IDS.map((gameId) => makeEvent({ gameId }));
  server.use(makeWildhavensHandler(events));
  renderCallout();
  await screen.findByText("Staff Picks");
  expect(screen.getByRole("button", { name: /visibility/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /sort/i })).toBeInTheDocument();
});

test("renders a row for each fetched event", async () => {
  const events = WILDHAVENS_GAME_IDS.map((gameId) => makeEvent({ gameId }));
  server.use(makeWildhavensHandler(events));
  renderCallout();
  await screen.findByText("Staff Picks");
  const rows = screen.getAllByRole("row");
  // 1 header row + 7 data rows
  expect(rows).toHaveLength(8);
});

test("renders nothing when fetch returns 0 events", async () => {
  server.use(makeWildhavensHandler([]));
  renderCallout();
  await waitFor(() => {
    expect(screen.queryByText("Staff Picks")).not.toBeInTheDocument();
    expect(screen.queryByText("LOADING STAFF PICKS…")).not.toBeInTheDocument();
  });
});

test("renders nothing when fetch errors", async () => {
  server.use(
    http.get("/api/events/search", () => HttpResponse.error()),
  );
  renderCallout();
  await waitFor(() => {
    expect(screen.queryByText("Staff Picks")).not.toBeInTheDocument();
    expect(screen.queryByText("LOADING STAFF PICKS…")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests to confirm failure**

```bash
npx vitest run src/components/WildhavensCallout/WildhavensCallout.test.tsx
```

Expected: FAIL — `Cannot find module './WildhavensCallout'`

### Step 6c — Implementation

- [ ] **Step 4: Create `src/components/WildhavensCallout/WildhavensCallout.module.css`**

```css
.panel {
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--color-accent-surface);
  border: var(--border-width) solid var(--color-accent-border);
  border-radius: var(--radius-card);
}

.heading {
  font-family: var(--font-slab);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-ink);
  margin: 0 0 var(--space-1);
}

.subtext {
  font-size: var(--text-sm);
  color: var(--color-ink-muted);
  margin: 0 0 var(--space-3);
}

.controls {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.tableView {
  overflow-x: auto;
}
```

- [ ] **Step 5: Create `src/components/WildhavensCallout/WildhavensCallout.tsx`**

```tsx
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "../../utils/api";
import { useSharedColumnState } from "../../hooks/useSharedColumnState";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { EventTable } from "../EventTable/EventTable";
import { EventListMobile } from "../EventTable/EventListMobile";
import { VisibilityDrawer } from "../EventTable/VisibilityDrawer";
import { SortDrawer } from "../EventTable/SortDrawer";
import { EmptyState } from "../../ui/EmptyState/EmptyState";
import styles from "./WildhavensCallout.module.css";

export function WildhavensCallout(): React.JSX.Element | null {
  const isMobile = useMediaQuery("(width <= 60rem)");
  const sharedColumnState = useSharedColumnState();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["wildhavens"],
    queryFn: () => fetchEvents({ group: "Wildhavens", limit: 10 }),
  });

  if (isLoading) {
    return <EmptyState variant="loading" text="LOADING STAFF PICKS…" />;
  }

  if (isError || !data || data.data.length === 0) {
    return null;
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>Staff Picks</h2>
      <p className={styles.subtext}>Our picks for best new publisher at Gen Con 2026</p>
      <div className={styles.controls}>
        <VisibilityDrawer columnState={sharedColumnState} />
        <SortDrawer />
      </div>
      {!isMobile ? (
        <div className={styles.tableView}>
          <EventTable events={data.data} sharedColumnState={sharedColumnState} />
        </div>
      ) : (
        <EventListMobile
          events={data.data}
          visibility={sharedColumnState.visibility}
          typeDisplay={sharedColumnState.typeDisplay}
          showTypeIcon={sharedColumnState.showTypeIcon}
          dayFormat={sharedColumnState.dayFormat}
          timeZone={sharedColumnState.timeZone}
          timeFormat={sharedColumnState.timeFormat}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 6: Run tests to confirm pass**

```bash
npx vitest run src/components/WildhavensCallout/WildhavensCallout.test.tsx
```

Expected: PASS — 5 tests passing

- [ ] **Step 7: Typecheck**

```bash
npm run typecheck
```

Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add src/test/msw/handlers.ts src/components/WildhavensCallout/
git commit -m "feat: add WildhavensCallout panel with staff pick events table"
```

---

## Task 7: `SearchResults` Integration

**Files:**
- Modify: `src/components/SearchResults/SearchResults.tsx`
- Modify: `src/components/SearchResults/SearchResults.test.tsx`

- [ ] **Step 1: Write the failing tests**

Add to `src/components/SearchResults/SearchResults.test.tsx`:

```tsx
test("shows WildhavensCallout when search returns no results", async () => {
  const wildhavensEvents = WILDHAVENS_GAME_IDS.map((gameId) =>
    makeEvent({ gameId, title: `Wildhavens Game ${gameId}` }),
  );
  server.use(
    http.get("/api/events/search", ({ request }) => {
      const url = new URL(request.url);
      const response: EventSearchResponse = url.searchParams.has("group")
        ? { data: wildhavensEvents, meta: { total: wildhavensEvents.length }, links: { self: "" }, error: null }
        : { data: [], meta: { total: 0 }, links: { self: "" }, error: null };
      return HttpResponse.json(response);
    }),
  );
  renderSearchResults();
  await screen.findByText("NO QUESTS FOUND");
  await screen.findByText("Staff Picks");
});

test("does not show WildhavensCallout when search returns results", async () => {
  renderSearchResults();
  await screen.findAllByRole("row");
  expect(screen.queryByText("Staff Picks")).not.toBeInTheDocument();
});
```

Also add the needed imports at the top of `SearchResults.test.tsx`:

```tsx
import { WILDHAVENS_GAME_IDS } from "../../utils/staffPicks";
```

(`http`, `HttpResponse`, `makeEvent`, `server`, `EventSearchResponse` are already imported)

- [ ] **Step 2: Run tests to confirm failure**

```bash
npx vitest run src/components/SearchResults/SearchResults.test.tsx
```

Expected: FAIL — `Unable to find an element with the text: Staff Picks`

- [ ] **Step 3: Add `WildhavensCallout` to `SearchResults.tsx`**

Add the import at the top of `src/components/SearchResults/SearchResults.tsx`:

```tsx
import { WildhavensCallout } from "../WildhavensCallout/WildhavensCallout";
```

Find the empty-state block (around line 51):

```tsx
{data && data.data.length === 0 && (
  <EmptyState variant="empty" text="NO QUESTS FOUND" subtext="Try broadening your search." />
)}
```

Replace it with:

```tsx
{data && data.data.length === 0 && (
  <>
    <EmptyState variant="empty" text="NO QUESTS FOUND" subtext="Try broadening your search." />
    <WildhavensCallout />
  </>
)}
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
npx vitest run src/components/SearchResults/SearchResults.test.tsx
```

Expected: PASS — all tests passing

- [ ] **Step 5: Run the full test suite**

```bash
npm run test
```

Expected: all tests pass

- [ ] **Step 6: Typecheck**

```bash
npm run typecheck
```

Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add src/components/SearchResults/SearchResults.tsx src/components/SearchResults/SearchResults.test.tsx
git commit -m "feat: mount WildhavensCallout below empty state in SearchResults"
```
