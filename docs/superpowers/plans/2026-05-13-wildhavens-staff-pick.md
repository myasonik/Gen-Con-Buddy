# Wildhavens Staff Pick Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Highlight 7 Wildhavens board game events as staff picks — accented rows with a badge in search results, plus a full-table callout below the empty state.

**Architecture:** A `staffPicks.ts` constants module drives both surfaces and is the single file to edit next year: it exports the game IDs, a lookup Set, and the display strings (group name, heading, subtext). Row treatment checks `STAFF_PICK_IDS` in `columns.tsx` and `EventListMobile.tsx`. A new `StaffPickCallout` component reads all strings from `staffPicks.ts`, fetches events by `STAFF_PICK_GROUP`, and renders them in the standard table — mounted below the empty state in `SearchResults`.

**Tech Stack:** React, TanStack Query (`useQuery`), TanStack Router (`Link`), MSW (tests), Vitest + React Testing Library, CSS Modules.

---

## File Map

| Status | Path | Purpose |
|--------|------|---------|
| Create | `src/utils/staffPicks.ts` | IDs, lookup Set, and display string constants |
| Create | `src/utils/staffPicks.test.ts` | Unit tests for all constants |
| Modify | `src/components/EventTable/columns.tsx` | Badge in title cell |
| Modify | `src/components/EventTable/columns.module.css` | `.titleCell` flex layout |
| Modify | `src/components/EventTable/EventTable.tsx` | `data-staff-pick` on `<tr>` |
| Modify | `src/components/EventTable/EventTable.module.css` | Accent row background |
| Modify | `src/components/EventTable/EventTable.test.tsx` | Badge and row-attribute tests |
| Modify | `src/components/EventTable/EventListMobile.tsx` | Badge + `data-staff-pick` on `<li>` |
| Modify | `src/components/EventTable/EventListMobile.module.css` | Accent card background |
| Modify | `src/components/EventTable/EventListMobile.test.tsx` | Badge and list-item tests |
| Modify | `src/test/msw/handlers.ts` | Export `makeStaffPickHandler` |
| Create | `src/components/StaffPickCallout/StaffPickCallout.tsx` | Callout panel component |
| Create | `src/components/StaffPickCallout/StaffPickCallout.module.css` | Panel styles |
| Create | `src/components/StaffPickCallout/StaffPickCallout.test.tsx` | Component tests |
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
import {
  WILDHAVENS_GAME_IDS,
  STAFF_PICK_IDS,
  STAFF_PICK_GROUP,
  STAFF_PICK_HEADING,
  STAFF_PICK_SUBTEXT,
} from "./staffPicks";

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

describe("display string constants", () => {
  it("STAFF_PICK_GROUP is a non-empty string", () => {
    expect(typeof STAFF_PICK_GROUP).toBe("string");
    expect(STAFF_PICK_GROUP.length).toBeGreaterThan(0);
  });

  it("STAFF_PICK_HEADING is a non-empty string", () => {
    expect(typeof STAFF_PICK_HEADING).toBe("string");
    expect(STAFF_PICK_HEADING.length).toBeGreaterThan(0);
  });

  it("STAFF_PICK_SUBTEXT is a non-empty string", () => {
    expect(typeof STAFF_PICK_SUBTEXT).toBe("string");
    expect(STAFF_PICK_SUBTEXT.length).toBeGreaterThan(0);
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

export const STAFF_PICK_GROUP = "Wildhavens";
export const STAFF_PICK_HEADING = "Staff Picks";
export const STAFF_PICK_SUBTEXT = "Our picks for best new publisher at Gen Con 2026";
```

- [ ] **Step 4: Run test to confirm pass**

```bash
npx vitest run src/utils/staffPicks.test.ts
```

Expected: PASS — 9 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/utils/staffPicks.ts src/utils/staffPicks.test.ts
git commit -m "feat: add staffPicks constants — IDs, lookup Set, and display strings"
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

Add the import at the top of the file:

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

Expected: PASS — all tests pass

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

Expected: FAIL — `Expected element to have attribute "data-staff-pick"`

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

- [ ] **Step 2: Confirm or update `STAFF_PICK_GROUP`**

If the API returns a value that differs from `"Wildhavens"`, update `STAFF_PICK_GROUP` in `src/utils/staffPicks.ts` before proceeding. Every other file reads from that constant — no other changes are needed.

---

## Task 6: MSW Handler + `StaffPickCallout` Component

**Files:**
- Modify: `src/test/msw/handlers.ts`
- Create: `src/components/StaffPickCallout/StaffPickCallout.tsx`
- Create: `src/components/StaffPickCallout/StaffPickCallout.module.css`
- Create: `src/components/StaffPickCallout/StaffPickCallout.test.tsx`

### Step 6a — MSW handler export

- [ ] **Step 1: Add `makeStaffPickHandler` to `src/test/msw/handlers.ts`**

Add after the existing `makeEventPool` export:

```ts
export function makeStaffPickHandler(events: Event[]): HttpHandler {
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

### Step 6b — StaffPickCallout tests

- [ ] **Step 2: Write the failing tests**

Create `src/components/StaffPickCallout/StaffPickCallout.test.tsx`:

```tsx
import { StrictMode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { expect, test, beforeEach } from "vitest";
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
import { makeStaffPickHandler } from "../../test/msw/handlers";
import { StaffPickCallout } from "./StaffPickCallout";
import { WILDHAVENS_GAME_IDS } from "../../utils/staffPicks";

beforeEach(() => {
  localStorage.clear();
});

function renderCallout(): ReturnType<typeof render> {
  const rootRoute = createRootRoute({
    component: () => <StaffPickCallout />,
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
  server.use(makeStaffPickHandler([]));
  renderCallout();
  expect(screen.getByText("LOADING STAFF PICKS…")).toBeInTheDocument();
});

test("renders panel heading and controls when events load", async () => {
  const events = WILDHAVENS_GAME_IDS.map((gameId) => makeEvent({ gameId }));
  server.use(makeStaffPickHandler(events));
  renderCallout();
  await screen.findByText("Staff Picks");
  expect(screen.getByRole("button", { name: /visibility/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /sort/i })).toBeInTheDocument();
});

test("renders a row for each fetched event", async () => {
  const events = WILDHAVENS_GAME_IDS.map((gameId) => makeEvent({ gameId }));
  server.use(makeStaffPickHandler(events));
  renderCallout();
  await screen.findByText("Staff Picks");
  const rows = screen.getAllByRole("row");
  // 1 header row + 7 data rows
  expect(rows).toHaveLength(8);
});

test("renders nothing when fetch returns 0 events", async () => {
  server.use(makeStaffPickHandler([]));
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
npx vitest run src/components/StaffPickCallout/StaffPickCallout.test.tsx
```

Expected: FAIL — `Cannot find module './StaffPickCallout'`

### Step 6c — Implementation

- [ ] **Step 4: Create `src/components/StaffPickCallout/StaffPickCallout.module.css`**

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

- [ ] **Step 5: Create `src/components/StaffPickCallout/StaffPickCallout.tsx`**

```tsx
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "../../utils/api";
import {
  STAFF_PICK_GROUP,
  STAFF_PICK_HEADING,
  STAFF_PICK_SUBTEXT,
} from "../../utils/staffPicks";
import { useSharedColumnState } from "../../hooks/useSharedColumnState";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { EventTable } from "../EventTable/EventTable";
import { EventListMobile } from "../EventTable/EventListMobile";
import { VisibilityDrawer } from "../EventTable/VisibilityDrawer";
import { SortDrawer } from "../EventTable/SortDrawer";
import { EmptyState } from "../../ui/EmptyState/EmptyState";
import styles from "./StaffPickCallout.module.css";

export function StaffPickCallout(): React.JSX.Element | null {
  const isMobile = useMediaQuery("(width <= 60rem)");
  const sharedColumnState = useSharedColumnState();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["staffPick"],
    queryFn: () => fetchEvents({ group: STAFF_PICK_GROUP, limit: 10 }),
  });

  if (isLoading) {
    return <EmptyState variant="loading" text="LOADING STAFF PICKS…" />;
  }

  if (isError || !data || data.data.length === 0) {
    return null;
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>{STAFF_PICK_HEADING}</h2>
      <p className={styles.subtext}>{STAFF_PICK_SUBTEXT}</p>
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
npx vitest run src/components/StaffPickCallout/StaffPickCallout.test.tsx
```

Expected: PASS — 5 tests passing

- [ ] **Step 7: Typecheck**

```bash
npm run typecheck
```

Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add src/test/msw/handlers.ts src/components/StaffPickCallout/
git commit -m "feat: add StaffPickCallout panel with staff pick events table"
```

---

## Task 7: `SearchResults` Integration

**Files:**
- Modify: `src/components/SearchResults/SearchResults.tsx`
- Modify: `src/components/SearchResults/SearchResults.test.tsx`

- [ ] **Step 1: Write the failing tests**

Add to `src/components/SearchResults/SearchResults.test.tsx`:

```tsx
import { WILDHAVENS_GAME_IDS } from "../../utils/staffPicks";
```

(`http`, `HttpResponse`, `makeEvent`, `server`, `EventSearchResponse` are already imported)

```tsx
test("shows StaffPickCallout when search returns no results", async () => {
  const staffPickEvents = WILDHAVENS_GAME_IDS.map((gameId) =>
    makeEvent({ gameId, title: `Staff Pick Game ${gameId}` }),
  );
  server.use(
    http.get("/api/events/search", ({ request }) => {
      const url = new URL(request.url);
      const response: EventSearchResponse = url.searchParams.has("group")
        ? { data: staffPickEvents, meta: { total: staffPickEvents.length }, links: { self: "" }, error: null }
        : { data: [], meta: { total: 0 }, links: { self: "" }, error: null };
      return HttpResponse.json(response);
    }),
  );
  renderSearchResults();
  await screen.findByText("NO QUESTS FOUND");
  await screen.findByText("Staff Picks");
});

test("does not show StaffPickCallout when search returns results", async () => {
  renderSearchResults();
  await screen.findAllByRole("row");
  expect(screen.queryByText("Staff Picks")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to confirm failure**

```bash
npx vitest run src/components/SearchResults/SearchResults.test.tsx
```

Expected: FAIL — `Unable to find an element with the text: Staff Picks`

- [ ] **Step 3: Add `StaffPickCallout` to `SearchResults.tsx`**

Add the import at the top of `src/components/SearchResults/SearchResults.tsx`:

```tsx
import { StaffPickCallout } from "../StaffPickCallout/StaffPickCallout";
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
    <StaffPickCallout />
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
git commit -m "feat: mount StaffPickCallout below empty state in SearchResults"
```
