# Changelog Search Strip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a client-side filter strip (event type, days, time) to the changelog page that filters events within expanded entries and dims/marks entry rows by match state.

**Architecture:** `SearchForm` gets a `changelogMode` boolean prop that hides the keyword field and Filters drawer. `ChangelogPage` renders `SearchForm changelogMode` at the top, reads four URL params (`eventType`, `days`, `timeStart`, `timeEnd`), and passes an `activeFilter` down to each `ChangelogRow` and `ChangelogEntryPanel`. A new pure utility `filterChangelogEvents` does the actual client-side matching.

**Tech Stack:** React, TanStack Router, react-hook-form, React Query, Vitest, MSW, CSS Modules

---

## Prerequisite: create worktree

All work happens in a worktree, never on `main`.

```bash
git worktree add ../Gen-Con-Buddy-changelog-filter -b feature/changelog-search-strip
cd ../Gen-Con-Buddy-changelog-filter
npm install
```

All subsequent commands run from `/home/myasonik/Workspace/Gen-Con-Buddy-changelog-filter`.

---

## File Map

| File                                                        | Action                                                 |
| ----------------------------------------------------------- | ------------------------------------------------------ |
| `src/utils/searchParams.ts`                                 | Export `DAY_DATES` (currently unexported)              |
| `src/utils/filterChangelogEvents.ts`                        | **NEW** — pure filter function                         |
| `src/utils/filterChangelogEvents.test.ts`                   | **NEW** — unit tests                                   |
| `src/components/SearchForm/SearchForm.tsx`                  | Add `changelogMode?: boolean` prop                     |
| `src/components/SearchForm/SearchForm.test.tsx`             | Add `changelogMode` tests                              |
| `src/routes/changelog.tsx`                                  | Extend `validateSearch` with four filter params        |
| `src/components/ChangelogPage/ChangelogPage.tsx`            | Render `SearchForm changelogMode`, pass `activeFilter` |
| `src/components/ChangelogPage/ChangelogPage.module.css`     | Flex column layout to pin filter strip at top          |
| `src/components/ChangelogPage/ChangelogPage.test.tsx`       | Add filter integration tests                           |
| `src/components/ChangelogPage/ChangelogRow.tsx`             | Read cache, render match-state indicators              |
| `src/components/ChangelogPage/ChangelogRow.module.css`      | Add `.dimmed` opacity rule                             |
| `src/components/ChangelogPage/ChangelogRow.test.tsx`        | Add match-state tests                                  |
| `src/components/ChangelogPage/ChangelogEntryPanel.tsx`      | Filter event arrays before rendering                   |
| `src/components/ChangelogPage/ChangelogEntryPanel.test.tsx` | Add filter tests                                       |

---

## Task 1: Export `DAY_DATES` and implement `filterChangelogEvents`

**Files:**

- Modify: `src/utils/searchParams.ts` — add `export` to `DAY_DATES`
- Create: `src/utils/filterChangelogEvents.ts`
- Create: `src/utils/filterChangelogEvents.test.ts`

### Step 1a — Write the failing tests

Create `src/utils/filterChangelogEvents.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { filterChangelogEvents } from "./filterChangelogEvents";
import type { Event } from "./types";

function makeEvent(overrides: Partial<Event["attributes"]> = {}): Event {
  return {
    id: "1",
    type: "events",
    attributes: {
      gameId: "RPG2600001",
      year: 2026,
      group: "Test",
      title: "Test Event",
      shortDescription: "",
      longDescription: "",
      eventType: "RPG",
      gameSystem: "D&D",
      rulesEdition: "5e",
      minPlayers: 2,
      maxPlayers: 6,
      ageRequired: "everyone",
      experienceRequired: "none",
      materialsProvided: "Yes",
      materialsRequired: "No",
      materialsRequiredDetails: "",
      // Thursday July 30 2026 at 10:00 ET
      startDateTime: "2026-07-30T10:00:00-04:00",
      duration: 4,
      endDateTime: "2026-07-30T14:00:00-04:00",
      gmNames: "Jane",
      website: "",
      email: "",
      tournament: "No",
      roundNumber: 1,
      totalRounds: 1,
      minimumPlayTime: 4,
      attendeeRegistration: "open",
      cost: 0,
      location: "ICC",
      roomName: "Hall A",
      tableNumber: "1",
      specialCategory: "none",
      ticketsAvailable: 3,
      lastModified: "2026-01-01T00:00:00Z",
      alsoRuns: "",
      prize: "",
      rulesComplexity: "Medium",
      originalOrder: 1,
      ...overrides,
    },
  };
}

// Gen Con 2026: Wed July 29 – Sun Aug 2
const THU_EVENT = makeEvent({ startDateTime: "2026-07-30T10:00:00-04:00" }); // Thu 10am ET
const SAT_EVENT = makeEvent({ startDateTime: "2026-08-01T14:00:00-04:00" }); // Sat 2pm ET
const RPG_EVENT = makeEvent({ eventType: "RPG" });
const BGM_EVENT = makeEvent({ eventType: "BGM" });

describe("filterChangelogEvents", () => {
  test("returns all events when filter is empty", () => {
    expect(filterChangelogEvents([RPG_EVENT, BGM_EVENT], {})).toHaveLength(2);
  });

  test("filters by single eventType", () => {
    const result = filterChangelogEvents([RPG_EVENT, BGM_EVENT], { eventType: "RPG" });
    expect(result).toHaveLength(1);
    expect(result[0].attributes.eventType).toBe("RPG");
  });

  test("filters by multiple eventTypes (comma-separated)", () => {
    const zkill = makeEvent({ eventType: "ZED" });
    const result = filterChangelogEvents([RPG_EVENT, BGM_EVENT, zkill], { eventType: "RPG,BGM" });
    expect(result).toHaveLength(2);
  });

  test("returns empty array when no events match eventType", () => {
    expect(filterChangelogEvents([RPG_EVENT], { eventType: "BGM" })).toHaveLength(0);
  });

  test("filters by single day", () => {
    const result = filterChangelogEvents([THU_EVENT, SAT_EVENT], { days: "thu" });
    expect(result).toHaveLength(1);
    expect(result[0].attributes.startDateTime).toBe("2026-07-30T10:00:00-04:00");
  });

  test("filters by multiple days", () => {
    const result = filterChangelogEvents([THU_EVENT, SAT_EVENT], { days: "thu,sat" });
    expect(result).toHaveLength(2);
  });

  test("returns empty array when event falls outside selected days", () => {
    expect(filterChangelogEvents([SAT_EVENT], { days: "thu" })).toHaveLength(0);
  });

  test("filters by timeStart (inclusive)", () => {
    const early = makeEvent({ startDateTime: "2026-07-30T08:00:00-04:00" }); // 8am
    const later = makeEvent({ startDateTime: "2026-07-30T10:00:00-04:00" }); // 10am
    const result = filterChangelogEvents([early, later], { timeStart: "09:00" });
    expect(result).toHaveLength(1);
    expect(result[0].attributes.startDateTime).toBe("2026-07-30T10:00:00-04:00");
  });

  test("filters by timeEnd (inclusive)", () => {
    const early = makeEvent({ startDateTime: "2026-07-30T08:00:00-04:00" }); // 8am
    const later = makeEvent({ startDateTime: "2026-07-30T14:00:00-04:00" }); // 2pm
    const result = filterChangelogEvents([early, later], { timeEnd: "12:00" });
    expect(result).toHaveLength(1);
    expect(result[0].attributes.startDateTime).toBe("2026-07-30T08:00:00-04:00");
  });

  test("filters by timeStart and timeEnd together", () => {
    const early = makeEvent({ startDateTime: "2026-07-30T07:00:00-04:00" }); // 7am
    const mid = makeEvent({ startDateTime: "2026-07-30T10:00:00-04:00" }); // 10am
    const late = makeEvent({ startDateTime: "2026-07-30T18:00:00-04:00" }); // 6pm
    const result = filterChangelogEvents([early, mid, late], {
      timeStart: "09:00",
      timeEnd: "12:00",
    });
    expect(result).toHaveLength(1);
    expect(result[0].attributes.startDateTime).toBe("2026-07-30T10:00:00-04:00");
  });

  test("combines eventType and days filters", () => {
    const rpgThu = makeEvent({ eventType: "RPG", startDateTime: "2026-07-30T10:00:00-04:00" });
    const bgmThu = makeEvent({ eventType: "BGM", startDateTime: "2026-07-30T10:00:00-04:00" });
    const rpgSat = makeEvent({ eventType: "RPG", startDateTime: "2026-08-01T10:00:00-04:00" });
    const result = filterChangelogEvents([rpgThu, bgmThu, rpgSat], {
      eventType: "RPG",
      days: "thu",
    });
    expect(result).toHaveLength(1);
    expect(result[0].attributes.startDateTime).toBe("2026-07-30T10:00:00-04:00");
  });

  test("returns empty array when no events exist", () => {
    expect(filterChangelogEvents([], { eventType: "RPG" })).toHaveLength(0);
  });
});
```

- [ ] **Step 1b — Run tests to confirm they fail**

```bash
npx vitest run src/utils/filterChangelogEvents.test.ts
```

Expected: `FAIL` — `Cannot find module './filterChangelogEvents'`

- [ ] **Step 1c — Export `DAY_DATES` from `searchParams.ts`**

In `src/utils/searchParams.ts`, change line 22 from:

```ts
const DAY_DATES: Record<string, { start: string; end: string }> = {
```

to:

```ts
export const DAY_DATES: Record<string, { start: string; end: string }> = {
```

- [ ] **Step 1d — Create `filterChangelogEvents.ts`**

Create `src/utils/filterChangelogEvents.ts`:

```ts
import type { Event } from "./types";
import type { SearchFormValues } from "./types";
import { DAY_DATES } from "./searchParams";

function extractTimeET(dateStr: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Indiana/Indianapolis",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(dateStr));
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hour === "24" ? "00" : hour}:${minute}`;
}

export function filterChangelogEvents(events: Event[], filter: SearchFormValues): Event[] {
  const eventTypes = filter.eventType ? filter.eventType.split(",").filter(Boolean) : [];
  const dayList = filter.days ? filter.days.split(",").filter((d) => d in DAY_DATES) : [];
  const hasTimeFilter = Boolean(filter.timeStart || filter.timeEnd);

  if (eventTypes.length === 0 && dayList.length === 0 && !hasTimeFilter) {
    return events;
  }

  return events.filter((event) => {
    if (eventTypes.length > 0 && !eventTypes.includes(event.attributes.eventType)) {
      return false;
    }

    if (dayList.length > 0) {
      const startDate = new Date(event.attributes.startDateTime);
      const matchesDay = dayList.some((day) => {
        const dayStart = new Date(DAY_DATES[day].start);
        const dayEnd = new Date(DAY_DATES[day].end);
        return startDate >= dayStart && startDate < dayEnd;
      });
      if (!matchesDay) return false;
    }

    if (hasTimeFilter) {
      const eventTime = extractTimeET(event.attributes.startDateTime);
      if (filter.timeStart && eventTime < filter.timeStart) return false;
      if (filter.timeEnd && eventTime > filter.timeEnd) return false;
    }

    return true;
  });
}
```

- [ ] **Step 1e — Run tests to confirm they pass**

```bash
npx vitest run src/utils/filterChangelogEvents.test.ts
```

Expected: all tests pass.

- [ ] **Step 1f — Run full type check**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 1g — Commit**

```bash
git add src/utils/searchParams.ts src/utils/filterChangelogEvents.ts src/utils/filterChangelogEvents.test.ts
git commit -m "feat: add filterChangelogEvents utility and export DAY_DATES"
```

---

## Task 2: Add `changelogMode` prop to `SearchForm`

**Files:**

- Modify: `src/components/SearchForm/SearchForm.tsx`
- Modify: `src/components/SearchForm/SearchForm.test.tsx`

- [ ] **Step 2a — Write failing tests**

At the bottom of `src/components/SearchForm/SearchForm.test.tsx`, add:

```ts
// ── changelogMode ──────────────────────────────────────────────────────────

function renderChangelogMode(
  values: SearchFormValues = {},
  onSearch: (v: SearchFormValues) => void = noop,
): ReturnType<typeof render> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <SearchForm values={values} onSearch={onSearch} changelogMode />
    </QueryClientProvider>,
  );
}

test("changelogMode hides the keyword search field", () => {
  renderChangelogMode();
  expect(screen.queryByRole("textbox", { name: "Search" })).not.toBeInTheDocument();
});

test("changelogMode hides the Filters drawer button", () => {
  renderChangelogMode();
  expect(screen.queryByRole("button", { name: "Filters" })).not.toBeInTheDocument();
});

test("changelogMode still renders event type combobox", () => {
  renderChangelogMode();
  expect(screen.getByRole("combobox", { name: "Event Type" })).toBeInTheDocument();
});

test("changelogMode still renders day checkboxes", () => {
  renderChangelogMode();
  expect(screen.getByRole("checkbox", { name: "Thu" })).toBeInTheDocument();
});

test("changelogMode still renders time inputs", () => {
  const { container } = renderChangelogMode();
  expect(container.querySelector('input[name="timeStart"]')).toBeInTheDocument();
  expect(container.querySelector('input[name="timeEnd"]')).toBeInTheDocument();
});

test("changelogMode still renders Search and Reset buttons", () => {
  renderChangelogMode();
  expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
});

test("changelogMode submits onSearch with selected values", async () => {
  const user = userEvent.setup();
  const handleSearch = vi.fn<(values: SearchFormValues) => void>();
  renderChangelogMode({}, handleSearch);

  await user.click(screen.getByRole("checkbox", { name: "Thu" }));
  await user.click(screen.getByRole("button", { name: "Search" }));

  expect(handleSearch).toHaveBeenCalledTimes(1);
  expect(handleSearch.mock.calls[0][0].days).toBe("thu");
});

test("changelogMode reset button clears fields", async () => {
  const user = userEvent.setup();
  renderChangelogMode({ days: "fri" });

  await user.click(screen.getByRole("button", { name: "Reset" }));

  expect(screen.getByRole("checkbox", { name: "Fri" })).not.toBeChecked();
});
```

- [ ] **Step 2b — Run tests to confirm they fail**

```bash
npx vitest run src/components/SearchForm/SearchForm.test.tsx
```

Expected: the new `changelogMode` tests fail with `Unknown prop` or type error.

- [ ] **Step 2c — Add `changelogMode` prop to `SearchForm`**

In `src/components/SearchForm/SearchForm.tsx`, update the `SearchFormProps` interface and the function signature:

```ts
interface SearchFormProps {
  values: SearchFormValues;
  onSearch: (values: SearchFormValues) => void;
  changelogMode?: boolean;
}

export function SearchForm({ values, onSearch, changelogMode }: SearchFormProps): React.JSX.Element {
```

Then wrap the keyword field with a conditional (around line 107):

```tsx
{
  /* Keyword search — hidden in changelogMode */
}
{
  !changelogMode && (
    <div className={styles.searchField}>
      <label htmlFor="strip-keyword" className={styles.stripLabel}>
        Search
      </label>
      <div className={styles.searchGroup}>
        <Search size={15} className={styles.searchIcon} aria-hidden="true" />
        <input
          type="text"
          id="strip-keyword"
          className={styles.searchInput}
          placeholder="Search events…"
          {...register("filter")}
        />
      </div>
    </div>
  );
}
```

Then wrap the Filters `<Drawer>` with a conditional (inside `stripActions`, around line 192):

```tsx
<div className={styles.stripActions}>
  {!changelogMode && (
    <Drawer
      trigger={
        <Button type="button" variant="secondary" className={styles.filtersButton}>
          <SlidersHorizontal size={14} aria-hidden="true" /> Filters
        </Button>
      }
      title="Advanced Filters"
      footer={
        <Dialog.Close
          render={
            <Button
              type="submit"
              form="search-form"
              variant="primary"
              className={styles.applyButton}
            >
              Apply Filters
            </Button>
          }
        />
      }
    >
      {/* ... all existing drawer content unchanged ... */}
    </Drawer>
  )}

  <Button type="button" variant="secondary" onClick={handleReset} className={styles.resetButton}>
    <RotateCcw size={14} aria-hidden="true" /> Reset
  </Button>
  <Button type="submit" variant="primary" className={styles.searchButton}>
    <Search size={14} aria-hidden="true" /> Search
  </Button>
</div>
```

- [ ] **Step 2d — Run tests to confirm they pass**

```bash
npx vitest run src/components/SearchForm/SearchForm.test.tsx
```

Expected: all tests pass.

- [ ] **Step 2e — Commit**

```bash
git add src/components/SearchForm/SearchForm.tsx src/components/SearchForm/SearchForm.test.tsx
git commit -m "feat: add changelogMode prop to SearchForm"
```

---

## Task 3: Extend changelog route `validateSearch`

**Files:**

- Modify: `src/routes/changelog.tsx`

No new tests for this task — the route wiring is exercised by the `ChangelogPage` integration tests in Task 4.

- [ ] **Step 3a — Update `validateSearch` and `ChangelogPageRoute`**

Replace the contents of `src/routes/changelog.tsx` with:

```ts
import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChangelogPage } from "../components/ChangelogPage/ChangelogPage";
import { fetchChangelogEntry, fetchChangelogList } from "../utils/api";
import { parseOpenParam } from "../components/ChangelogPage/openParam";

function coerceStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String);
  }
  if (value !== undefined && value !== null) {
    return [String(value)];
  }
  return [];
}

function coerceString(value: unknown): string {
  if (typeof value === "string") return value;
  return "";
}

export const Route = createFileRoute("/changelog")({
  validateSearch: (search: Record<string, unknown>) => ({
    open: coerceStringArray(search.open),
    eventType: coerceString(search.eventType),
    days: coerceString(search.days),
    timeStart: coerceString(search.timeStart),
    timeEnd: coerceString(search.timeEnd),
  }),
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
  const { open, eventType, days, timeStart, timeEnd } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <ChangelogPage
      openParam={open}
      navigate={navigate}
      eventType={eventType}
      days={days}
      timeStart={timeStart}
      timeEnd={timeEnd}
    />
  );
}
```

- [ ] **Step 3b — Run type check**

```bash
npm run typecheck
```

Expected: type errors pointing to `ChangelogPage` not yet accepting the new props. That's expected — Task 4 fixes this.

- [ ] **Step 3c — Commit the route change (will be fixed in Task 4)**

Do not commit yet — wait until Task 4 makes `ChangelogPage` accept the props so typecheck passes.

---

## Task 4: Update `ChangelogPage` with filter strip

**Files:**

- Modify: `src/components/ChangelogPage/ChangelogPage.tsx`
- Modify: `src/components/ChangelogPage/ChangelogPage.module.css`
- Modify: `src/components/ChangelogPage/ChangelogPage.test.tsx`

- [ ] **Step 4a — Write failing integration tests**

Add these tests to the bottom of `src/components/ChangelogPage/ChangelogPage.test.tsx`.

First, update the `renderChangelogPage` helper to accept optional props (replace the existing helper):

```ts
async function renderChangelogPage(
  props: Partial<React.ComponentProps<typeof ChangelogPage>> = {},
): Promise<void> {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const changelogRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/changelog",
    component: () => <ChangelogPage {...props} />,
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
    render(
      <StrictMode>
        <QueryClientProvider client={client}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </StrictMode>,
    );
  });
}
```

Then add these new tests at the bottom of the file:

```ts
test("renders SearchForm in changelogMode (no keyword, no Filters button)", async () => {
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({ entries: [] }),
    ),
  );
  await renderChangelogPage();
  expect(screen.queryByRole("textbox", { name: "Search" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Filters" })).not.toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Event Type" })).toBeInTheDocument();
});

test("filters events within an expanded entry when eventType filter is active", async () => {
  const user = userEvent.setup();
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [
          makeChangelogSummary({
            id: "entry-1",
            createdCount: 2,
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
          createdEvents: [
            makeEvent({ title: "Dragon Hunt", eventType: "RPG" }),
            makeEvent({ title: "Catan Open", eventType: "BGM" }),
          ],
          updatedEvents: [],
          deletedEvents: [],
        }),
      }),
    ),
  );

  await renderChangelogPage({ eventType: "RPG" });

  // Open the entry row
  await user.click(await screen.findByText(/created/));
  await screen.findByText("Created");

  expect(screen.getByText("Dragon Hunt")).toBeInTheDocument();
  expect(screen.queryByText("Catan Open")).not.toBeInTheDocument();
});

test("passes activeFilter to ChangelogRow so it can dim zero-match rows", async () => {
  server.use(
    http.get("/api/changelog/list", () =>
      HttpResponse.json<ListChangelogsResponse>({
        entries: [makeChangelogSummary({ id: "entry-1", createdCount: 1 })],
      }),
    ),
  );

  // Render with a filter but don't open the row — entry is not in cache
  await renderChangelogPage({ eventType: "RPG" });

  await screen.findByText(/created/);
  // The unknown-state indicator should be present (entry not cached yet)
  expect(screen.getByLabelText("Filter match unknown")).toBeInTheDocument();
});
```

- [ ] **Step 4b — Run tests to confirm they fail**

```bash
npx vitest run src/components/ChangelogPage/ChangelogPage.test.tsx
```

Expected: failures because `ChangelogPage` doesn't accept filter props yet and doesn't render `SearchForm`.

- [ ] **Step 4c — Update `ChangelogPage.tsx`**

Replace `src/components/ChangelogPage/ChangelogPage.tsx` with:

```tsx
import React, { useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { NavigateFn } from "@tanstack/react-router";
import { useSharedColumnState } from "../../hooks/useSharedColumnState";
import { EmptyState } from "../../ui/EmptyState/EmptyState";
import { ColumnControlsPanel } from "../EventTable/ColumnControlsPanel";
import { fetchChangelogEntry, fetchChangelogList } from "../../utils/api";
import { SearchForm } from "../SearchForm/SearchForm";
import type { SearchFormValues } from "../../utils/types";
import styles from "./ChangelogPage.module.css";
import { ChangelogRow } from "./ChangelogRow";

interface ChangelogPageProps {
  openParam?: string[];
  navigate?: NavigateFn;
  eventType?: string;
  days?: string;
  timeStart?: string;
  timeEnd?: string;
}

export function ChangelogPage({
  openParam = [],
  navigate,
  eventType = "",
  days = "",
  timeStart = "",
  timeEnd = "",
}: ChangelogPageProps): React.JSX.Element {
  const posthog = usePostHog();
  const queryClient = useQueryClient();
  const sharedColumnState = useSharedColumnState();
  const {
    data: summaries = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["changelog", "list"],
    queryFn: () => fetchChangelogList(),
  });

  useEffect(() => {
    if (summaries.length > 0) {
      void queryClient.prefetchQuery({
        queryKey: ["changelog", "entry", summaries[0].id],
        queryFn: () => fetchChangelogEntry(summaries[0].id),
      });
    }
  }, [summaries, queryClient]);

  const activeFilter: SearchFormValues = { eventType, days, timeStart, timeEnd };

  const handleSearch = (values: SearchFormValues): void => {
    if (!navigate) return;
    void navigate({
      to: ".",
      search: (prev) => ({
        ...prev,
        eventType: values.eventType || undefined,
        days: values.days || undefined,
        timeStart: values.timeStart || undefined,
        timeEnd: values.timeEnd || undefined,
      }),
      replace: false,
      resetScroll: false,
    });
  };

  const handleOpen = (index: number): void => {
    const current = summaries[index];
    if (current) {
      posthog.capture("changelog_entry_opened", { entry_id: current.id });
    }
    const next = summaries[index + 1];
    if (next) {
      void queryClient.prefetchQuery({
        queryKey: ["changelog", "entry", next.id],
        queryFn: () => fetchChangelogEntry(next.id),
      });
    }
  };

  return (
    <main className={styles.page}>
      <SearchForm values={activeFilter} onSearch={handleSearch} changelogMode />
      <div className={styles.content}>
        {isLoading && <EmptyState variant="loading" text="LOADING CHANGELOG…" />}
        {isError && <p>Could not load changelog. Try refreshing.</p>}
        {!isLoading && !isError && summaries.length === 0 && <p>No changelog entries yet.</p>}
        {summaries.length > 0 && (
          <>
            <h1 className={styles.heading}>Changelog</h1>
            <ColumnControlsPanel columnState={sharedColumnState} />
            <section className={styles.changelogSection}>
              {summaries.map((summary, i) => (
                <ChangelogRow
                  key={summary.id}
                  position={i + 1}
                  openParam={openParam}
                  navigate={navigate}
                  summary={summary}
                  onOpen={() => handleOpen(i)}
                  sharedColumnState={sharedColumnState}
                  activeFilter={activeFilter}
                />
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 4d — Update `ChangelogPage.module.css`**

Replace `src/components/ChangelogPage/ChangelogPage.module.css` with:

```css
.page {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.content {
  flex: 1;
  overflow-y: scroll;
  padding: var(--space-4);
}

.changelogSection {
  margin-top: var(--space-2);
}

@media (width <= 60rem) {
  .page {
    overflow: visible;
  }

  .content {
    overflow: visible;
    padding: var(--space-3);
  }
}

.heading {
  margin-bottom: var(--space-4);
}
```

- [ ] **Step 4e — Run type check**

```bash
npm run typecheck
```

Expected: no errors (including the route file from Task 3).

- [ ] **Step 4f — Run tests**

```bash
npx vitest run src/components/ChangelogPage/ChangelogPage.test.tsx
```

Expected: all tests pass.

- [ ] **Step 4g — Commit**

```bash
git add src/routes/changelog.tsx src/components/ChangelogPage/ChangelogPage.tsx src/components/ChangelogPage/ChangelogPage.module.css src/components/ChangelogPage/ChangelogPage.test.tsx
git commit -m "feat: add changelog filter strip to ChangelogPage"
```

---

## Task 5: Update `ChangelogRow` with match-state indicators

**Files:**

- Modify: `src/components/ChangelogPage/ChangelogRow.tsx`
- Modify: `src/components/ChangelogPage/ChangelogRow.module.css`
- Modify: `src/components/ChangelogPage/ChangelogRow.test.tsx`

- [ ] **Step 5a — Write failing tests**

Update the `renderRow` helper in `src/components/ChangelogPage/ChangelogRow.test.tsx` to accept an options object (replacing the existing signature):

```ts
import type { SearchFormValues } from "../../utils/types";

// Replace existing renderRow:
function renderRow({
  summary = makeChangelogSummary({ id: "entry-1" }),
  onOpen = vi.fn<() => void>(),
  activeFilter,
  client,
}: {
  summary?: ChangelogSummary;
  onOpen?: () => void;
  activeFilter?: SearchFormValues;
  client?: QueryClient;
} = {}): ReturnType<typeof render> {
  const qc = client ?? new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const rootRoute = createRootRoute({
    component: () => (
      <ChangelogRow
        summary={summary}
        onOpen={onOpen}
        sharedColumnState={stubColumnState}
        activeFilter={activeFilter}
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
  return render(
    <StrictMode>
      <QueryClientProvider client={qc}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
}
```

Update all existing `renderRow(...)` call sites to use the new object form:

- `renderRow()` → `renderRow()` (no change needed, defaults still work)
- `renderRow(makeChangelogSummary({ createdCount: 3, ... }), vi.fn())` → `renderRow({ summary: makeChangelogSummary({ createdCount: 3, ... }), onOpen: vi.fn() })`
- etc. — update each call in the existing tests

Then add these new tests at the bottom of the file:

```ts
// ── Filter match states ────────────────────────────────────────────────────

test("shows unknown indicator when filter is active and entry not in cache", () => {
  renderRow({ activeFilter: { eventType: "RPG" } });
  expect(screen.getByLabelText("Filter match unknown")).toBeInTheDocument();
});

test("no unknown indicator when no filter is active", async () => {
  renderRow();
  await screen.findByText(/created/);
  expect(screen.queryByLabelText("Filter match unknown")).not.toBeInTheDocument();
});

test("dims row when cached entry has no events matching active filter", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(
    ["changelog", "entry", "entry-1"],
    makeChangelogEntry({
      id: "entry-1",
      createdEvents: [makeEvent({ eventType: "RPG" })],
      updatedEvents: [],
      deletedEvents: [],
    }),
  );
  const { container } = renderRow({
    summary: makeChangelogSummary({ id: "entry-1", createdCount: 1 }),
    activeFilter: { eventType: "BGM" },
    client,
  });
  await screen.findByText(/created/);
  expect(container.querySelector("[data-filter-state='dimmed']")).toBeInTheDocument();
});

test("shows filtered counts when cached entry has matching events", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(
    ["changelog", "entry", "entry-1"],
    makeChangelogEntry({
      id: "entry-1",
      createdEvents: [makeEvent({ eventType: "RPG" }), makeEvent({ eventType: "BGM" })],
      updatedEvents: [],
      deletedEvents: [],
    }),
  );
  renderRow({
    summary: makeChangelogSummary({ id: "entry-1", createdCount: 2 }),
    activeFilter: { eventType: "RPG" },
    client,
  });
  expect(await screen.findByText("1 created")).toBeInTheDocument();
  expect(screen.queryByText("2 created")).not.toBeInTheDocument();
});

test("shows normal counts when no filter is active even if entry is cached", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(
    ["changelog", "entry", "entry-1"],
    makeChangelogEntry({
      id: "entry-1",
      createdEvents: [makeEvent({ eventType: "RPG" }), makeEvent({ eventType: "BGM" })],
      updatedEvents: [],
      deletedEvents: [],
    }),
  );
  renderRow({
    summary: makeChangelogSummary({ id: "entry-1", createdCount: 2 }),
    client,
    // no activeFilter
  });
  expect(await screen.findByText("2 created")).toBeInTheDocument();
});
```

Also add `QueryClient` import if missing:

```ts
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ChangelogSummary } from "../../utils/types";
```

- [ ] **Step 5b — Run tests to confirm they fail**

```bash
npx vitest run src/components/ChangelogPage/ChangelogRow.test.tsx
```

Expected: failures on the new tests (type error on `activeFilter` prop and missing indicator/dimmed logic).

- [ ] **Step 5c — Update `ChangelogRow.tsx`**

Replace `src/components/ChangelogPage/ChangelogRow.tsx` with:

```tsx
import React, { startTransition, useState } from "react";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChangelogEntry, ChangelogSummary, SearchFormValues } from "../../utils/types";
import { fetchChangelogEntry } from "../../utils/api";
import { ChangelogEntryPanel } from "./ChangelogEntryPanel";
import type { SharedColumnState } from "../EventTable/types";
import { AnimatedDetails } from "../../ui/AnimatedDetails/AnimatedDetails";
import { Chip } from "../../ui/Chip/Chip";
import { parseOpenParam, serializeOpenParam } from "./openParam";
import { filterChangelogEvents } from "../../utils/filterChangelogEvents";
import type { NavigateFn } from "@tanstack/react-router";
import styles from "./ChangelogRow.module.css";

interface ChangelogRowProps {
  position?: number;
  openParam?: string[];
  navigate?: NavigateFn;
  summary: ChangelogSummary;
  onOpen: () => void;
  sharedColumnState: SharedColumnState;
  activeFilter?: SearchFormValues;
}

function isFilterActive(filter: SearchFormValues): boolean {
  return Boolean(filter.eventType || filter.days || filter.timeStart || filter.timeEnd);
}

export function ChangelogRow({
  position,
  openParam = [],
  navigate,
  summary,
  onOpen,
  sharedColumnState,
  activeFilter,
}: ChangelogRowProps): React.JSX.Element {
  const openMap = parseOpenParam(openParam);
  const [isOpen, setIsOpen] = useState(() => position !== undefined && openMap.has(position));
  const queryClient = useQueryClient();
  const { data: entry, isError } = useQuery({
    queryKey: ["changelog", "entry", summary.id],
    queryFn: () => fetchChangelogEntry(summary.id),
    enabled: isOpen,
  });

  const cachedEntry = queryClient.getQueryData<ChangelogEntry>(["changelog", "entry", summary.id]);
  const filterActive = activeFilter ? isFilterActive(activeFilter) : false;

  // Derive display counts and filter state
  let createdCount = summary.createdCount;
  let updatedCount = summary.updatedCount;
  let deletedCount = summary.deletedCount;
  let filterState: "dimmed" | "unknown" | undefined;

  if (filterActive && activeFilter) {
    if (cachedEntry) {
      const filteredCreated = filterChangelogEvents(cachedEntry.createdEvents, activeFilter);
      const filteredUpdated = filterChangelogEvents(cachedEntry.updatedEvents, activeFilter);
      const filteredDeleted = filterChangelogEvents(cachedEntry.deletedEvents, activeFilter);
      createdCount = filteredCreated.length;
      updatedCount = filteredUpdated.length;
      deletedCount = filteredDeleted.length;
      if (createdCount === 0 && updatedCount === 0 && deletedCount === 0) {
        filterState = "dimmed";
      }
    } else {
      filterState = "unknown";
    }
  }

  function syncOpenToUrl(nowOpen: boolean): void {
    if (!navigate || position === undefined) {
      return;
    }
    const newMap = new Map(openMap);
    if (nowOpen) {
      newMap.set(position, newMap.get(position) ?? new Map());
    } else {
      newMap.delete(position);
    }
    startTransition(() => {
      void navigate({
        to: ".",
        search: (prev) => ({ ...prev, open: serializeOpenParam(newMap) }),
        replace: true,
        resetScroll: false,
      });
    });
  }

  return (
    <AnimatedDetails
      className={styles.row}
      summaryClassName={styles.summary}
      open={isOpen}
      data-filter-state={filterState}
      onToggle={(e) => {
        const { open } = e.currentTarget as HTMLDetailsElement;
        if (open === isOpen) {
          return;
        }
        setIsOpen(open);
        syncOpenToUrl(open);
        if (open) {
          onOpen();
        }
      }}
      summary={
        <>
          <time dateTime={summary.date} className={styles.date}>
            {format(new Date(summary.date), "MMM d, yyyy h:mm a")}
          </time>
          <span className={styles.counts}>
            <Chip tone="jade">{createdCount} created</Chip>
            <Chip tone="cobalt">{updatedCount} updated</Chip>
            <Chip tone="amber">{deletedCount} deleted</Chip>
            {filterState === "unknown" && (
              <span className={styles.unknownBadge} aria-label="Filter match unknown">
                ?
              </span>
            )}
          </span>
        </>
      }
    >
      <ChangelogEntryPanel
        entry={isError ? "error" : entry}
        sharedColumnState={sharedColumnState}
        openParam={openParam}
        position={position}
        navigate={navigate}
        activeFilter={activeFilter}
      />
    </AnimatedDetails>
  );
}
```

- [ ] **Step 5d — Check that `AnimatedDetails` accepts `data-filter-state`**

Open `src/ui/AnimatedDetails/AnimatedDetails.tsx`. If its props type doesn't spread HTML attributes, add `data-filter-state?: string` to its props or use `React.HTMLAttributes<HTMLDetailsElement>` spread. If it already uses `...rest` or spreads HTML props, no change needed.

If a change is needed, add to `AnimatedDetailsProps`:

```ts
"data-filter-state"?: string;
```

and pass it through to the `<details>` element.

- [ ] **Step 5e — Update `ChangelogRow.module.css`**

Add to `src/components/ChangelogPage/ChangelogRow.module.css`:

```css
.row[data-filter-state="dimmed"] {
  opacity: 0.4;
}

.unknownBadge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: var(--color-ink-faint);
  color: var(--color-ink-muted);
  font-family: var(--font-slab);
  font-size: var(--text-xs);
  font-weight: 700;
}
```

- [ ] **Step 5f — Run tests**

```bash
npx vitest run src/components/ChangelogPage/ChangelogRow.test.tsx
```

Expected: all tests pass.

- [ ] **Step 5g — Run type check**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 5h — Commit**

```bash
git add src/components/ChangelogPage/ChangelogRow.tsx src/components/ChangelogPage/ChangelogRow.module.css src/components/ChangelogPage/ChangelogRow.test.tsx
git commit -m "feat: add filter match-state indicators to ChangelogRow"
```

---

## Task 6: Update `ChangelogEntryPanel` to filter events

**Files:**

- Modify: `src/components/ChangelogPage/ChangelogEntryPanel.tsx`
- Modify: `src/components/ChangelogPage/ChangelogEntryPanel.test.tsx`

- [ ] **Step 6a — Write failing tests**

In `src/components/ChangelogPage/ChangelogEntryPanel.test.tsx`, add the following imports at the top:

```ts
import type { SearchFormValues } from "../../utils/types";
```

Then add these tests at the bottom of the file (after the existing tests):

```ts
// ── Filter tests ───────────────────────────────────────────────────────────

test("shows only matching events when activeFilter eventType is set", () => {
  const entry = makeChangelogEntry({
    id: "entry-1",
    createdEvents: [
      makeEvent({ title: "Dragon Hunt", eventType: "RPG" }),
      makeEvent({ title: "Catan Open", eventType: "BGM" }),
    ],
    updatedEvents: [],
    deletedEvents: [],
  });
  renderPanelWithRouter(entry, stubColumnState, ["1.created"], { eventType: "RPG" });

  expect(screen.getByText("Dragon Hunt")).toBeInTheDocument();
  expect(screen.queryByText("Catan Open")).not.toBeInTheDocument();
});

test("hides a group entirely when all its events are filtered out", () => {
  const entry = makeChangelogEntry({
    id: "entry-1",
    createdEvents: [makeEvent({ eventType: "BGM" })],
    updatedEvents: [makeEvent({ eventType: "RPG" })],
    deletedEvents: [],
  });
  // Filter for RPG — created group should have 0 results and not render
  renderPanelWithRouter(entry, stubColumnState, ["1.created", "1.updated"], { eventType: "RPG" });

  expect(screen.queryByText("Created")).not.toBeInTheDocument();
  expect(screen.getByText("Updated")).toBeInTheDocument();
});

test("shows all events when activeFilter is empty", () => {
  const entry = makeChangelogEntry({
    id: "entry-1",
    createdEvents: [
      makeEvent({ title: "Dragon Hunt", eventType: "RPG" }),
      makeEvent({ title: "Catan Open", eventType: "BGM" }),
    ],
    updatedEvents: [],
    deletedEvents: [],
  });
  renderPanelWithRouter(entry, stubColumnState, ["1.created"], {});

  expect(screen.getByText("Dragon Hunt")).toBeInTheDocument();
  expect(screen.getByText("Catan Open")).toBeInTheDocument();
});
```

Also update the `renderPanelWithRouter` helper to accept an optional `activeFilter` param. Find the existing helper and update its signature and usage:

```ts
function renderPanelWithRouter(
  entry: ChangelogEntry,
  columnState: SharedColumnState = stubColumnState,
  openParam: string[] = ["1.created", "1.updated", "1.deleted"],
  activeFilter?: SearchFormValues,
): ReturnType<typeof render> {
  const rootRoute = createRootRoute({
    component: () => (
      <ChangelogEntryPanel
        entry={entry}
        sharedColumnState={columnState}
        openParam={openParam}
        position={1}
        activeFilter={activeFilter}
      />
    ),
  });
  // ... rest of helper unchanged
```

- [ ] **Step 6b — Run tests to confirm they fail**

```bash
npx vitest run src/components/ChangelogPage/ChangelogEntryPanel.test.tsx
```

Expected: failures on the new tests (type error — `activeFilter` prop doesn't exist yet).

- [ ] **Step 6c — Update `ChangelogEntryPanel.tsx`**

At the top, add the new import:

```ts
import { filterChangelogEvents } from "../../utils/filterChangelogEvents";
import type { SearchFormValues } from "../../utils/types";
```

Update `ChangelogEntryPanelProps`:

```ts
interface ChangelogEntryPanelProps {
  entry: EntryValue;
  sharedColumnState: SharedColumnState;
  openParam?: string[];
  position?: number;
  navigate?: NavigateFn;
  activeFilter?: SearchFormValues;
}
```

Update the function signature:

```ts
export function ChangelogEntryPanel({
  entry,
  sharedColumnState,
  openParam = [],
  position,
  navigate,
  activeFilter,
}: ChangelogEntryPanelProps): React.JSX.Element {
```

After the existing early-return guards (the `if (entry === undefined || ...)` and `if (entry === "error")` blocks), keep the **original** empty-entry check unchanged:

```tsx
if (
  entry.createdEvents.length === 0 &&
  entry.updatedEvents.length === 0 &&
  entry.deletedEvents.length === 0
) {
  return (
    <EmptyState variant="empty" text="NO CHANGES" subtext="This entry has no event changes." />
  );
}
```

Then, after that check, add the filter logic and a new filter-specific empty state:

```tsx
// Apply client-side filter if active
const createdEvents = activeFilter
  ? filterChangelogEvents(entry.createdEvents, activeFilter)
  : entry.createdEvents;
const updatedEvents = activeFilter
  ? filterChangelogEvents(entry.updatedEvents, activeFilter)
  : entry.updatedEvents;
const deletedEvents = activeFilter
  ? filterChangelogEvents(entry.deletedEvents, activeFilter)
  : entry.deletedEvents;

if (
  activeFilter &&
  createdEvents.length === 0 &&
  updatedEvents.length === 0 &&
  deletedEvents.length === 0
) {
  return (
    <EmptyState variant="empty" text="NO MATCHES" subtext="No events match the current filter." />
  );
}
```

Then replace all references to `entry.createdEvents`, `entry.updatedEvents`, `entry.deletedEvents` with the local filtered variables:

```tsx
  const createdSort = openForPosition.get("created");
  const updatedSort = openForPosition.get("updated");
  const deletedSort = openForPosition.get("deleted");

  return (
    <div className={styles.panel}>
      {createdEvents.length > 0 && (
        <AnimatedDetails
          ...
          summary={
            <span>
              <span className={styles.groupVerbCreated}>Created</span>{" "}
              <Chip tone="neutral" className={styles.groupCount}>
                {createdEvents.length}
              </Chip>
            </span>
          }
        >
          <EventGroup
            events={
              createdSort
                ? sortEvents(createdEvents, createdSort.field, createdSort.dir)
                : createdEvents
            }
            ...
          />
        </AnimatedDetails>
      )}
      {updatedEvents.length > 0 && (
        <AnimatedDetails
          ...
          summary={
            <span>
              <span className={styles.groupVerbUpdated}>Updated</span>{" "}
              <Chip tone="neutral" className={styles.groupCount}>
                {updatedEvents.length}
              </Chip>
            </span>
          }
        >
          <EventGroup
            events={
              updatedSort
                ? sortEvents(updatedEvents, updatedSort.field, updatedSort.dir)
                : updatedEvents
            }
            ...
          />
        </AnimatedDetails>
      )}
      {deletedEvents.length > 0 && (
        <AnimatedDetails
          ...
          summary={
            <span>
              <span className={styles.groupVerbDeleted}>Deleted</span>{" "}
              <Chip tone="neutral" className={styles.groupCount}>
                {deletedEvents.length}
              </Chip>
            </span>
          }
        >
          <EventGroup
            events={
              deletedSort
                ? sortEvents(deletedEvents, deletedSort.field, deletedSort.dir)
                : deletedEvents
            }
            ...
          />
        </AnimatedDetails>
      )}
    </div>
  );
```

Note: the `onToggle` handlers and sort wiring remain unchanged — just swap `entry.createdEvents` → `createdEvents` etc. throughout.

- [ ] **Step 6d — Run tests**

```bash
npx vitest run src/components/ChangelogPage/ChangelogEntryPanel.test.tsx
```

Expected: all tests pass.

- [ ] **Step 6e — Run the full test suite**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 6f — Run type check and lint**

```bash
npm run typecheck && npm run lint
```

Expected: no errors.

- [ ] **Step 6g — Commit**

```bash
git add src/components/ChangelogPage/ChangelogEntryPanel.tsx src/components/ChangelogPage/ChangelogEntryPanel.test.tsx
git commit -m "feat: filter events in ChangelogEntryPanel when activeFilter is set"
```

---

## Task 7: Verify in browser and merge

- [ ] **Step 7a — Start dev server**

```bash
npm run dev
```

- [ ] **Step 7b — Manual smoke test**

1. Open the changelog page in the browser
2. Confirm the filter strip renders at the top (event type combobox, day checkboxes Wed–Sun, time inputs, Reset and Search buttons)
3. Confirm there is no keyword input and no Filters button
4. Select a day and click Search — verify URL updates with `days=thu` (or similar)
5. Expand a changelog entry — confirm only events on that day appear
6. Click Reset — confirm URL clears and all events reappear
7. Confirm entries without cached data show the `?` indicator when a filter is active
8. Expand an entry with no matches — confirm the row dims

- [ ] **Step 7c — Stop dev server, run final checks**

```bash
npm run test && npm run typecheck && npm run lint
```

Expected: all pass.

- [ ] **Step 7d — Merge or open PR**

Use `superpowers:finishing-a-development-branch` to decide how to integrate.
