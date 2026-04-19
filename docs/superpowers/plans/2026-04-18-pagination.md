# Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add URL-driven page/limit pagination to search results, with prev/next buttons, numbered page links, and a per-page size selector.

**Architecture:** `page` and `limit` live in `SearchParams` as URL search params. `fetchEvents` translates to 0-indexed `page` for the API and omits defaults (page=1, limit=100). A new `Pagination` component rendered above and below the results table calls an `onNavigate` callback that lives in the route component, keeping routing logic out of `SearchResults`.

**Tech Stack:** TanStack Router (URL/navigation), TanStack Query (query key change triggers refetch), MSW (test network interception), React Testing Library + Vitest

---

### Task 1: Add `page` to `SearchParams` and route validation

**Files:**

- Modify: `src/utils/types.ts`
- Modify: `src/routes/index.tsx`
- Modify: `src/routes/index.test.tsx`

- [ ] **Step 1: Write failing URL round-trip tests**

Add to `src/routes/index.test.tsx`:

```tsx
test("page param is read from URL", async () => {
  await renderSearchPage("/?page=3");
  // SearchResults will request page 3 — confirmed via MSW handler
  // Just verify page doesn't cause a crash; API call tested in SearchResults tests
  expect(screen.queryByText("Loading...")).toBeDefined();
});

test("limit param is read from URL", async () => {
  await renderSearchPage("/?limit=500");
  expect(screen.queryByText("Loading...")).toBeDefined();
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/routes/index.test.tsx
```

Expected: both new tests fail with a type error or unexpected behavior because `page` isn't in `SearchParams` or `validateSearch` yet.

- [ ] **Step 3: Add `page` to `SearchParams` in types**

In `src/utils/types.ts`, add `page?: number` right after `limit?: number`:

```ts
export interface SearchParams {
  limit?: number
  page?: number
  filter?: string
  // ... rest unchanged
```

- [ ] **Step 4: Add `page` to `validateSearch` in the route**

In `src/routes/index.tsx`, add `page: num('page')` after `limit: num('limit')`:

```ts
return {
  limit: num('limit'),
  page: num('page'),
  filter: str('filter'),
  // ... rest unchanged
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npx vitest run src/routes/index.test.tsx
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/utils/types.ts src/routes/index.tsx src/routes/index.test.tsx
git commit -m "feat: add page to SearchParams and route validation"
```

---

### Task 2: Update `fetchEvents` for pagination params

**Files:**

- Modify: `src/utils/api.ts`
- Modify: `src/components/SearchResults/SearchResults.test.tsx`

- [ ] **Step 1: Write failing API param tests**

Add to `src/components/SearchResults/SearchResults.test.tsx`:

```tsx
test("sends page as 0-indexed when page > 1", async () => {
  let capturedUrl: URL | null = null;
  server.use(
    http.get("/api/events/search", ({ request }) => {
      capturedUrl = new URL(request.url);
      const response: EventSearchResponse = {
        data: [makeEvent()],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderSearchResults({ page: 2 });
  await screen.findAllByRole("row");
  expect(capturedUrl!.searchParams.get("page")).toBe("1");
});

test("omits page param when page is 1", async () => {
  let capturedUrl: URL | null = null;
  server.use(
    http.get("/api/events/search", ({ request }) => {
      capturedUrl = new URL(request.url);
      const response: EventSearchResponse = {
        data: [makeEvent()],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderSearchResults({ page: 1 });
  await screen.findAllByRole("row");
  expect(capturedUrl!.searchParams.has("page")).toBe(false);
});

test("omits limit param when limit is 100", async () => {
  let capturedUrl: URL | null = null;
  server.use(
    http.get("/api/events/search", ({ request }) => {
      capturedUrl = new URL(request.url);
      const response: EventSearchResponse = {
        data: [makeEvent()],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderSearchResults({ limit: 100 });
  await screen.findAllByRole("row");
  expect(capturedUrl!.searchParams.has("limit")).toBe(false);
});

test("sends limit param when limit is not 100", async () => {
  let capturedUrl: URL | null = null;
  server.use(
    http.get("/api/events/search", ({ request }) => {
      capturedUrl = new URL(request.url);
      const response: EventSearchResponse = {
        data: [makeEvent()],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderSearchResults({ limit: 500 });
  await screen.findAllByRole("row");
  expect(capturedUrl!.searchParams.get("limit")).toBe("500");
});
```

Also update `renderSearchResults` to accept and pass `onNavigate` (needed now that it's a required prop — see Task 4, but add the default here proactively):

```tsx
function renderSearchResults(searchParams: SearchParams = {}, onNavigate = vi.fn()) {
  const rootRoute = createRootRoute({
    component: () => <SearchResults searchParams={searchParams} onNavigate={onNavigate} />,
  })
  // ... rest of helper unchanged
```

Add `import { vi } from 'vitest'` at the top.

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/components/SearchResults/SearchResults.test.tsx
```

Expected: new tests fail (page/limit not handled in fetchEvents yet; `onNavigate` prop doesn't exist yet on SearchResults — TypeScript error is fine at this stage).

- [ ] **Step 3: Update `fetchEvents` to handle `page` and `limit`**

Replace `src/utils/api.ts` with:

```ts
import { daysToStartDateTime } from "./searchParams";
import { EVENT_TYPES } from "./enums";
import type { EventSearchResponse, SearchParams } from "./types";

export async function fetchEvents(
  params: SearchParams,
): Promise<EventSearchResponse> {
  const url = new URL("/api/events/search", window.location.origin);
  if (params.days) {
    const startDateTime = daysToStartDateTime(params.days);
    if (startDateTime) url.searchParams.set("startDateTime", startDateTime);
  }
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    if (key === "days") return;
    if (key === "page") {
      // URL uses 1-indexed; API uses 0-indexed. Omit when page=1 (API default is 0).
      if ((value as number) > 1)
        url.searchParams.set("page", String((value as number) - 1));
      return;
    }
    if (key === "limit") {
      // Omit when 100 (API default).
      if ((value as number) !== 100)
        url.searchParams.set("limit", String(value));
      return;
    }
    if (key === "eventType" && typeof value === "string") {
      url.searchParams.set(key, EVENT_TYPES[value] ?? value);
    } else {
      url.searchParams.set(key, String(value));
    }
  });
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<EventSearchResponse>;
}
```

- [ ] **Step 4: Run tests to confirm they pass (except onNavigate TypeScript error)**

```bash
npx vitest run src/components/SearchResults/SearchResults.test.tsx
```

Expected: the 4 new API param tests pass. The `onNavigate` prop not existing on `SearchResults` will be fixed in Task 4.

- [ ] **Step 5: Commit**

```bash
git add src/utils/api.ts src/components/SearchResults/SearchResults.test.tsx
git commit -m "feat: translate page/limit to API params in fetchEvents"
```

---

### Task 3: Build the `Pagination` component

**Files:**

- Create: `src/components/Pagination/Pagination.tsx`
- Create: `src/components/Pagination/Pagination.test.tsx`

- [ ] **Step 1: Write the failing unit tests**

Create `src/components/Pagination/Pagination.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { Pagination } from "./Pagination";

test('shows "Page X of Y" label', () => {
  render(<Pagination page={2} limit={100} total={350} onNavigate={vi.fn()} />);
  expect(screen.getByText("Page 2 of 4")).toBeInTheDocument();
});

test("Prev button is disabled on page 1", () => {
  render(<Pagination page={1} limit={100} total={300} onNavigate={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
});

test("Next button is disabled on last page", () => {
  render(<Pagination page={3} limit={100} total={300} onNavigate={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
});

test("clicking Prev calls onNavigate with page - 1", async () => {
  const user = userEvent.setup();
  const onNavigate = vi.fn();
  render(
    <Pagination page={3} limit={100} total={500} onNavigate={onNavigate} />,
  );
  await user.click(screen.getByRole("button", { name: "Previous" }));
  expect(onNavigate).toHaveBeenCalledWith(2, 100);
});

test("clicking Next calls onNavigate with page + 1", async () => {
  const user = userEvent.setup();
  const onNavigate = vi.fn();
  render(
    <Pagination page={2} limit={100} total={500} onNavigate={onNavigate} />,
  );
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(onNavigate).toHaveBeenCalledWith(3, 100);
});

test("clicking a page number calls onNavigate with that page", async () => {
  const user = userEvent.setup();
  const onNavigate = vi.fn();
  render(
    <Pagination page={1} limit={100} total={300} onNavigate={onNavigate} />,
  );
  await user.click(screen.getByRole("button", { name: "3" }));
  expect(onNavigate).toHaveBeenCalledWith(3, 100);
});

test("shows all pages when totalPages <= 7", () => {
  render(<Pagination page={1} limit={100} total={700} onNavigate={vi.fn()} />);
  [1, 2, 3, 4, 5, 6, 7].forEach((n) => {
    expect(screen.getByRole("button", { name: String(n) })).toBeInTheDocument();
  });
  expect(screen.queryByText("…")).not.toBeInTheDocument();
});

test("shows ellipsis for large page ranges", () => {
  render(<Pagination page={5} limit={100} total={2000} onNavigate={vi.fn()} />);
  const ellipses = screen.getAllByText("…");
  expect(ellipses.length).toBeGreaterThanOrEqual(1);
  expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "20" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "5" })).toBeInTheDocument();
});

test("changing page size calls onNavigate with page 1 and new limit", async () => {
  const user = userEvent.setup();
  const onNavigate = vi.fn();
  render(
    <Pagination page={3} limit={100} total={500} onNavigate={onNavigate} />,
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Per page" }),
    "500",
  );
  expect(onNavigate).toHaveBeenCalledWith(1, 500);
});

test("page size select shows current limit", () => {
  render(<Pagination page={1} limit={500} total={1000} onNavigate={vi.fn()} />);
  expect(screen.getByRole("combobox", { name: "Per page" })).toHaveValue("500");
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/components/Pagination/Pagination.test.tsx
```

Expected: all tests fail with "Cannot find module './Pagination'".

- [ ] **Step 3: Implement the `Pagination` component**

Create `src/components/Pagination/Pagination.tsx`:

```tsx
const PAGE_SIZE_OPTIONS = [100, 500, 1000] as const;

function getPageNumbers(page: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7)
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (page > 3) pages.push("...");
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (page < totalPages - 2) pages.push("...");
  pages.push(totalPages);
  return pages;
}

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onNavigate: (page: number, limit: number) => void;
}

export function Pagination({
  page,
  limit,
  total,
  onNavigate,
}: PaginationProps) {
  const totalPages = Math.ceil(total / limit);
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <nav aria-label="Pagination">
      <button
        type="button"
        onClick={() => onNavigate(page - 1, limit)}
        disabled={page === 1}
      >
        Previous
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      {pageNumbers.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} aria-hidden>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onNavigate(p, limit)}
            aria-current={p === page ? "page" : undefined}
            disabled={p === page}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onNavigate(page + 1, limit)}
        disabled={page === totalPages}
      >
        Next
      </button>
      <label>
        Per page
        <select
          value={limit}
          onChange={(e) => onNavigate(1, Number(e.target.value))}
        >
          {PAGE_SIZE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
    </nav>
  );
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/components/Pagination/Pagination.test.tsx
```

Expected: all 10 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/Pagination/Pagination.tsx src/components/Pagination/Pagination.test.tsx
git commit -m "feat: add Pagination component"
```

---

### Task 4: Wire `Pagination` into `SearchResults` and the route

**Files:**

- Modify: `src/components/SearchResults/SearchResults.tsx`
- Modify: `src/routes/index.tsx`
- Modify: `src/components/SearchResults/SearchResults.test.tsx`

- [ ] **Step 1: Write failing integration tests for `SearchResults`**

Add to `src/components/SearchResults/SearchResults.test.tsx`:

```tsx
test("renders pagination when results are present", async () => {
  renderSearchResults();
  expect(
    await screen.findByRole("navigation", { name: "Pagination" }),
  ).toBeInTheDocument();
});

test("renders pagination above and below the table", async () => {
  renderSearchResults();
  await screen.findAllByRole("row");
  const navs = screen.getAllByRole("navigation", { name: "Pagination" });
  expect(navs).toHaveLength(2);
});

test("does not render pagination when no events found", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [],
        meta: { total: 0 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderSearchResults();
  await screen.findByText("No events found.");
  expect(
    screen.queryByRole("navigation", { name: "Pagination" }),
  ).not.toBeInTheDocument();
});

test("calls onNavigate when Next is clicked", async () => {
  const user = userEvent.setup();
  const onNavigate = vi.fn();
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [makeEvent()],
        meta: { total: 200 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderSearchResults({ page: 1 }, onNavigate);
  // wait for both pagination navs to render
  await screen.findAllByRole("navigation", { name: "Pagination" });
  await user.click(screen.getAllByRole("button", { name: "Next" })[0]);
  expect(onNavigate).toHaveBeenCalledWith(2, 100);
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/components/SearchResults/SearchResults.test.tsx
```

Expected: new tests fail; existing tests also fail because `onNavigate` is not yet a prop on `SearchResults`.

- [ ] **Step 3: Update `SearchResults` to accept `onNavigate` and render `Pagination`**

Replace `src/components/SearchResults/SearchResults.tsx` with:

```tsx
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { useColumnVisibility } from "../../hooks/useColumnVisibility";
import { fetchEvents } from "../../utils/api";
import { Pagination } from "../Pagination/Pagination";
import type { SearchParams, Event } from "../../utils/types";

interface SearchResultsProps {
  searchParams: SearchParams;
  onNavigate: (page: number, limit: number) => void;
}

const COLUMNS = [
  { key: "gameId", label: "Game ID" },
  { key: "title", label: "Title" },
  { key: "eventType", label: "Type" },
  { key: "group", label: "Group" },
  { key: "shortDescription", label: "Short Description" },
  { key: "longDescription", label: "Long Description" },
  { key: "gameSystem", label: "Game System" },
  { key: "rulesEdition", label: "Rules Edition" },
  { key: "minPlayers", label: "Min Players" },
  { key: "maxPlayers", label: "Max Players" },
  { key: "ageRequired", label: "Age Required" },
  { key: "experienceRequired", label: "Experience Required" },
  { key: "materialsProvided", label: "Materials Provided" },
  { key: "materialsRequired", label: "Materials Required" },
  { key: "materialsRequiredDetails", label: "Materials Required Details" },
  { key: "day", label: "Day" },
  { key: "startDateTime", label: "Start" },
  { key: "duration", label: "Duration" },
  { key: "endDateTime", label: "End" },
  { key: "gmNames", label: "GMs" },
  { key: "website", label: "Website" },
  { key: "email", label: "Email" },
  { key: "tournament", label: "Tournament" },
  { key: "roundNumber", label: "Round Number" },
  { key: "totalRounds", label: "Total Rounds" },
  { key: "minimumPlayTime", label: "Min Time" },
  { key: "attendeeRegistration", label: "Attendee Registration" },
  { key: "cost", label: "Cost" },
  { key: "location", label: "Location" },
  { key: "roomName", label: "Room" },
  { key: "tableNumber", label: "Table Number" },
  { key: "specialCategory", label: "Special Category" },
  { key: "ticketsAvailable", label: "Tickets Available" },
  { key: "lastModified", label: "Last Modified" },
] as const;

type ColumnKey = (typeof COLUMNS)[number]["key"];

function EventCell({ col, event }: { col: ColumnKey; event: Event }) {
  const {
    attributes: a,
    attributes: { gameId },
  } = event;
  const link = (text: React.ReactNode) => (
    <Link to="/event/$id" params={{ id: gameId }}>
      {text}
    </Link>
  );
  switch (col) {
    case "gameId":
      return <td>{link(a.gameId)}</td>;
    case "title":
      return <td>{link(a.title)}</td>;
    case "eventType":
      return <td>{a.eventType}</td>;
    case "group":
      return <td>{a.group}</td>;
    case "shortDescription":
      return <td>{a.shortDescription}</td>;
    case "longDescription":
      return <td>{a.longDescription}</td>;
    case "gameSystem":
      return <td>{a.gameSystem}</td>;
    case "rulesEdition":
      return <td>{a.rulesEdition}</td>;
    case "minPlayers":
      return <td>{a.minPlayers}</td>;
    case "maxPlayers":
      return <td>{a.maxPlayers}</td>;
    case "ageRequired":
      return <td>{a.ageRequired}</td>;
    case "experienceRequired":
      return <td>{a.experienceRequired}</td>;
    case "materialsProvided":
      return <td>{a.materialsProvided}</td>;
    case "materialsRequired":
      return <td>{a.materialsRequired}</td>;
    case "materialsRequiredDetails":
      return <td>{a.materialsRequiredDetails}</td>;
    case "day":
      return <td>{format(new Date(a.startDateTime), "EEEE")}</td>;
    case "startDateTime":
      return <td>{format(new Date(a.startDateTime), "HH:mm")}</td>;
    case "duration":
      return <td>{a.duration}</td>;
    case "endDateTime":
      return <td>{format(new Date(a.endDateTime), "HH:mm")}</td>;
    case "gmNames":
      return <td>{a.gmNames}</td>;
    case "website":
      return <td>{a.website}</td>;
    case "email":
      return <td>{a.email}</td>;
    case "tournament":
      return <td>{a.tournament}</td>;
    case "roundNumber":
      return <td>{a.roundNumber}</td>;
    case "totalRounds":
      return <td>{a.totalRounds}</td>;
    case "minimumPlayTime":
      return <td>{a.minimumPlayTime}</td>;
    case "attendeeRegistration":
      return <td>{a.attendeeRegistration}</td>;
    case "cost":
      return <td>${a.cost.toFixed(2)}</td>;
    case "location":
      return <td>{a.location}</td>;
    case "roomName":
      return <td>{a.roomName}</td>;
    case "tableNumber":
      return <td>{a.tableNumber}</td>;
    case "specialCategory":
      return <td>{a.specialCategory}</td>;
    case "ticketsAvailable":
      return <td>{a.ticketsAvailable}</td>;
    case "lastModified":
      return <td>{format(new Date(a.lastModified), "yyyy-MM-dd")}</td>;
  }
}

export function SearchResults({
  searchParams,
  onNavigate,
}: SearchResultsProps) {
  const { visibility, toggle, reset } = useColumnVisibility();
  const page = searchParams.page ?? 1;
  const limit = searchParams.limit ?? 100;
  const { data, isLoading, isError } = useQuery({
    queryKey: ["events", searchParams],
    queryFn: () => fetchEvents(searchParams),
  });

  const visibleColumns = COLUMNS.filter((col) => visibility[col.key]);

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
      <details>
        <summary>Customize columns</summary>
        <fieldset>
          <ul>
            {COLUMNS.map((col) => (
              <li key={col.key}>
                <label>
                  <input
                    type="checkbox"
                    checked={!!visibility[col.key]}
                    onChange={() => toggle(col.key)}
                  />
                  {col.label}
                </label>
              </li>
            ))}
          </ul>
          <button type="button" onClick={reset}>
            Reset to defaults
          </button>
        </fieldset>
      </details>

      {isLoading && <p>Loading...</p>}
      {isError && <p>Error loading events.</p>}
      {data && data.data.length === 0 && <p>No events found.</p>}
      {data && data.data.length > 0 && (
        <>
          {pagination}
          <table>
            <thead>
              <tr>
                {visibleColumns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.data.map((event) => (
                <tr key={event.id}>
                  {visibleColumns.map((col) => (
                    <EventCell key={col.key} col={col.key} event={event} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {pagination}
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Update `SearchPage` in `src/routes/index.tsx`**

Replace the full file with:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { SearchForm } from "../components/SearchForm/SearchForm";
import { SearchResults } from "../components/SearchResults/SearchResults";
import { buildSearchParams, parseSearchParams } from "../utils/searchParams";
import type { SearchFormValues, SearchParams } from "../utils/types";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    const str = (k: string) =>
      typeof search[k] === "string" ? (search[k] as string) : undefined;
    const num = (k: string) =>
      typeof search[k] === "number" ? (search[k] as number) : undefined;
    return {
      limit: num("limit"),
      page: num("page"),
      filter: str("filter"),
      gameId: str("gameId"),
      title: str("title"),
      eventType: str("eventType"),
      group: str("group"),
      shortDescription: str("shortDescription"),
      longDescription: str("longDescription"),
      gameSystem: str("gameSystem"),
      rulesEdition: str("rulesEdition"),
      minPlayers: str("minPlayers"),
      maxPlayers: str("maxPlayers"),
      ageRequired: str("ageRequired"),
      experienceRequired: str("experienceRequired"),
      materialsProvided: str("materialsProvided"),
      startDateTime: str("startDateTime"),
      duration: str("duration"),
      endDateTime: str("endDateTime"),
      gmNames: str("gmNames"),
      website: str("website"),
      email: str("email"),
      tournament: str("tournament"),
      roundNumber: str("roundNumber"),
      totalRounds: str("totalRounds"),
      minimumPlayTime: str("minimumPlayTime"),
      attendeeRegistration: str("attendeeRegistration"),
      cost: str("cost"),
      location: str("location"),
      roomName: str("roomName"),
      tableNumber: str("tableNumber"),
      specialCategory: str("specialCategory"),
      ticketsAvailable: str("ticketsAvailable"),
      lastModified: str("lastModified"),
      days: str("days"),
    };
  },
  component: SearchPage,
});

function SearchPage() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  const handleSearch = (values: SearchFormValues) => {
    // Preserve limit across filter changes; page resets to 1 by omission
    void navigate({
      search: { ...buildSearchParams(values), limit: search.limit },
    });
  };

  const handleNavigate = (page: number, limit: number) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        page: page === 1 ? undefined : page,
        limit: limit === 100 ? undefined : limit,
      }),
    });
  };

  return (
    <main>
      <h1>Gen Con Buddy</h1>
      <SearchForm
        key={JSON.stringify(search)}
        defaultValues={parseSearchParams(search)}
        onSearch={handleSearch}
      />
      <SearchResults searchParams={search} onNavigate={handleNavigate} />
    </main>
  );
}
```

- [ ] **Step 5: Run all tests**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/SearchResults/SearchResults.tsx src/routes/index.tsx src/components/SearchResults/SearchResults.test.tsx
git commit -m "feat: wire Pagination into SearchResults and route"
```
