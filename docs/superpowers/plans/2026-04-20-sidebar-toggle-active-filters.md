# Sidebar Toggle & Active Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent sidebar open/close toggle and an always-visible active filters bar above the results table where each chip can be clicked to remove that filter.

**Architecture:** A `useSidebarOpen` hook wraps `localStorage` and drives a `data-sidebar-open` CSS attribute on the shell grid. A `getActiveFilters` utility maps `SearchParams` to human-readable chips; `<ActiveFilters>` renders them in the results column above `<SearchResults>`. `SearchForm` and `SearchResults` are unchanged.

**Tech Stack:** React, CSS Modules, `@testing-library/react`, `vitest`, `localStorage`

---

## File Map

| Action | File                                            | Responsibility                              |
| ------ | ----------------------------------------------- | ------------------------------------------- |
| Modify | `src/styles/tokens.css`                         | Update `--size-sidebar` to `360px`          |
| Create | `src/hooks/useSidebarOpen.ts`                   | localStorage-backed boolean toggle hook     |
| Create | `src/hooks/useSidebarOpen.test.ts`              | Unit tests for the hook                     |
| Create | `src/ui/ActiveFilters/getActiveFilters.ts`      | Maps `SearchParams` → `{ key, label }[]`    |
| Create | `src/ui/ActiveFilters/getActiveFilters.test.ts` | Unit tests for each param category          |
| Create | `src/ui/ActiveFilters/ActiveFilters.tsx`        | Chip list component                         |
| Create | `src/ui/ActiveFilters/ActiveFilters.module.css` | Chip styles                                 |
| Create | `src/ui/ActiveFilters/ActiveFilters.test.tsx`   | Component tests                             |
| Modify | `src/routes/index.module.css`                   | Add closed-state grid + toolbar styles      |
| Modify | `src/routes/index.tsx`                          | Wire up hook, toggle button, ActiveFilters  |
| Modify | `src/routes/index.test.tsx`                     | Integration tests for toggle + filter chips |

---

## Task 1: Update sidebar token

**Files:**

- Modify: `src/styles/tokens.css:33`

- [ ] **Step 1: Change the token value**

In `src/styles/tokens.css`, change line 33:

```css
--size-sidebar: 360px;
```

(was `280px`; 360 = 45 × 8px grid units)

- [ ] **Step 2: Commit**

```bash
git add src/styles/tokens.css
git commit -m "feat: increase sidebar token to 360px"
```

---

## Task 2: `useSidebarOpen` hook

**Files:**

- Create: `src/hooks/useSidebarOpen.ts`
- Create: `src/hooks/useSidebarOpen.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/hooks/useSidebarOpen.test.ts`:

```ts
import { renderHook, act } from "@testing-library/react";
import { useSidebarOpen } from "./useSidebarOpen";

const KEY = "sidebarOpen";

beforeEach(() => {
  localStorage.clear();
});

test("defaults to true when localStorage has no entry", () => {
  const { result } = renderHook(() => useSidebarOpen());
  expect(result.current[0]).toBe(true);
});

test("toggle flips from true to false", () => {
  const { result } = renderHook(() => useSidebarOpen());
  act(() => {
    result.current[1]();
  });
  expect(result.current[0]).toBe(false);
});

test("toggle flips from false back to true", () => {
  const { result } = renderHook(() => useSidebarOpen());
  act(() => {
    result.current[1]();
  });
  act(() => {
    result.current[1]();
  });
  expect(result.current[0]).toBe(true);
});

test("persists state to localStorage on toggle", () => {
  const { result } = renderHook(() => useSidebarOpen());
  act(() => {
    result.current[1]();
  });
  const { result: result2 } = renderHook(() => useSidebarOpen());
  expect(result2.current[0]).toBe(false);
});

test("reads existing true value from localStorage", () => {
  localStorage.setItem(KEY, "true");
  const { result } = renderHook(() => useSidebarOpen());
  expect(result.current[0]).toBe(true);
});

test("reads existing false value from localStorage", () => {
  localStorage.setItem(KEY, "false");
  const { result } = renderHook(() => useSidebarOpen());
  expect(result.current[0]).toBe(false);
});

test("defaults to true when localStorage value is not 'true' or 'false'", () => {
  localStorage.setItem(KEY, "garbage");
  const { result } = renderHook(() => useSidebarOpen());
  expect(result.current[0]).toBe(true);
});
```

- [ ] **Step 2: Run tests and confirm they fail**

```bash
npx vitest run src/hooks/useSidebarOpen.test.ts
```

Expected: `Cannot find module './useSidebarOpen'`

- [ ] **Step 3: Implement the hook**

Create `src/hooks/useSidebarOpen.ts`:

```ts
import { useState, useEffect } from "react";

const STORAGE_KEY = "sidebarOpen";

function readFromStorage(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "false") return false;
    if (raw === "true") return true;
    return true;
  } catch {
    return true;
  }
}

export function useSidebarOpen(): [boolean, () => void] {
  const [open, setOpen] = useState<boolean>(readFromStorage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(open));
  }, [open]);

  const toggle = () => setOpen((prev) => !prev);

  return [open, toggle];
}
```

- [ ] **Step 4: Run tests and confirm they pass**

```bash
npx vitest run src/hooks/useSidebarOpen.test.ts
```

Expected: all 7 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useSidebarOpen.ts src/hooks/useSidebarOpen.test.ts
git commit -m "feat: add useSidebarOpen hook with localStorage persistence"
```

---

## Task 3: `getActiveFilters` utility

**Files:**

- Create: `src/ui/ActiveFilters/getActiveFilters.ts`
- Create: `src/ui/ActiveFilters/getActiveFilters.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/ui/ActiveFilters/getActiveFilters.test.ts`:

```ts
import { getActiveFilters } from "./getActiveFilters";
import type { SearchParams } from "../../utils/types";

test("returns empty array when no filters are set", () => {
  expect(getActiveFilters({})).toEqual([]);
});

test("ignores page, limit, and sort params", () => {
  expect(getActiveFilters({ page: 2, limit: 100, sort: "title.asc" })).toEqual(
    [],
  );
});

test("filter param produces 'Search:' label", () => {
  const result = getActiveFilters({ filter: "dragon" });
  expect(result).toEqual([{ key: "filter", label: "Search: dragon" }]);
});

test("eventType param uses EVENT_TYPES enum for label", () => {
  const result = getActiveFilters({ eventType: "RPG" });
  expect(result).toEqual([
    { key: "eventType", label: "Type: RPG - Role Playing Game" },
  ]);
});

test("eventType falls back to raw value when code is unknown", () => {
  const result = getActiveFilters({ eventType: "XYZ" });
  expect(result).toEqual([{ key: "eventType", label: "Type: XYZ" }]);
});

test("ageRequired uses AGE_GROUPS enum for label", () => {
  const result = getActiveFilters({ ageRequired: "21+" });
  expect(result).toEqual([{ key: "ageRequired", label: "Age: 21+" }]);
});

test("experienceRequired uses EXP enum for label", () => {
  const result = getActiveFilters({
    experienceRequired:
      "None (You've never played before - rules will be taught)",
  });
  expect(result).toEqual([{ key: "experienceRequired", label: "Exp: None" }]);
});

test("attendeeRegistration uses REGISTRATION enum for label", () => {
  const result = getActiveFilters({
    attendeeRegistration: "No, this event does not require tickets!",
  });
  expect(result).toEqual([
    {
      key: "attendeeRegistration",
      label: "Registration: Free (no ticket needed)",
    },
  ]);
});

test("specialCategory uses CATEGORY enum for label", () => {
  const result = getActiveFilters({ specialCategory: "Premier Event" });
  expect(result).toEqual([
    { key: "specialCategory", label: "Category: Premier Event" },
  ]);
});

test("days param expands keys to capitalized labels", () => {
  const result = getActiveFilters({ days: "fri,sat" });
  expect(result).toEqual([{ key: "days", label: "Days: Fri, Sat" }]);
});

test("days param with single day", () => {
  const result = getActiveFilters({ days: "wed" });
  expect(result).toEqual([{ key: "days", label: "Days: Wed" }]);
});

test("cost range formats with dollar signs", () => {
  const result = getActiveFilters({ cost: "[0,5]" });
  expect(result).toEqual([{ key: "cost", label: "Cost: $0–$5" }]);
});

test("cost range with only min", () => {
  const result = getActiveFilters({ cost: "[3,]" });
  expect(result).toEqual([{ key: "cost", label: "Cost: $3–" }]);
});

test("minPlayers range formats without dollar signs", () => {
  const result = getActiveFilters({ minPlayers: "[2,6]" });
  expect(result).toEqual([{ key: "minPlayers", label: "Min players: 2–6" }]);
});

test("duration range formats with hrs suffix", () => {
  const result = getActiveFilters({ duration: "[1,4]" });
  expect(result).toEqual([{ key: "duration", label: "Duration: 1–4 hrs" }]);
});

test("startDateTime date range formats dates", () => {
  const result = getActiveFilters({
    startDateTime: "[2024-08-02T00:00:00Z,2024-08-03T00:00:00Z]",
  });
  expect(result[0].key).toBe("startDateTime");
  expect(result[0].label).toMatch(/^Start:/);
});

test("plain string params show their value", () => {
  expect(getActiveFilters({ title: "dragon" })).toEqual([
    { key: "title", label: "Title: dragon" },
  ]);
  expect(getActiveFilters({ location: "Hall A" })).toEqual([
    { key: "location", label: "Location: Hall A" },
  ]);
  expect(getActiveFilters({ gmNames: "Bob" })).toEqual([
    { key: "gmNames", label: "GM: Bob" },
  ]);
});

test("multiple params produce one entry each", () => {
  const result = getActiveFilters({ filter: "dragon", days: "fri" });
  expect(result).toHaveLength(2);
  expect(result.map((r) => r.key)).toContain("filter");
  expect(result.map((r) => r.key)).toContain("days");
});
```

- [ ] **Step 2: Run tests and confirm they fail**

```bash
npx vitest run src/ui/ActiveFilters/getActiveFilters.test.ts
```

Expected: `Cannot find module './getActiveFilters'`

- [ ] **Step 3: Implement `getActiveFilters`**

Create `src/ui/ActiveFilters/getActiveFilters.ts`:

```ts
import {
  AGE_GROUPS,
  CATEGORY,
  EVENT_TYPES,
  EXP,
  REGISTRATION,
} from "../../utils/enums";
import type { SearchParams } from "../../utils/types";

export interface ActiveFilter {
  key: keyof SearchParams;
  label: string;
}

const DAY_LABELS: Record<string, string> = {
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

function parseRange(val: string): { min: string; max: string } | null {
  const m = val.match(/^\[([^,]*),([^\]]*)\]$/);
  if (!m) return null;
  return { min: m[1], max: m[2] };
}

function fmtDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtRange(val: string, prefix: string, suffix = ""): string {
  const r = parseRange(val);
  if (!r) return `${prefix}${val}`;
  return `${prefix}${r.min}–${r.max}${suffix ? " " + suffix : ""}`;
}

function fmtDateRange(val: string, prefix: string): string {
  const r = parseRange(val);
  if (!r) return `${prefix}${val}`;
  return `${prefix}${fmtDate(r.min)}–${fmtDate(r.max)}`;
}

function fmtCostRange(val: string): string {
  const r = parseRange(val);
  if (!r) return `Cost: ${val}`;
  return `Cost: $${r.min}–$${r.max}`;
}

export function getActiveFilters(params: SearchParams): ActiveFilter[] {
  const filters: ActiveFilter[] = [];

  const add = (key: keyof SearchParams, label: string) => {
    filters.push({ key, label });
  };

  if (params.filter) add("filter", `Search: ${params.filter}`);
  if (params.gameId) add("gameId", `Game ID: ${params.gameId}`);
  if (params.title) add("title", `Title: ${params.title}`);
  if (params.eventType)
    add(
      "eventType",
      `Type: ${EVENT_TYPES[params.eventType] ?? params.eventType}`,
    );
  if (params.group) add("group", `Group: ${params.group}`);
  if (params.shortDescription)
    add("shortDescription", `Short desc: ${params.shortDescription}`);
  if (params.longDescription)
    add("longDescription", `Long desc: ${params.longDescription}`);
  if (params.gameSystem) add("gameSystem", `System: ${params.gameSystem}`);
  if (params.rulesEdition) add("rulesEdition", `Rules: ${params.rulesEdition}`);
  if (params.ageRequired)
    add(
      "ageRequired",
      `Age: ${AGE_GROUPS[params.ageRequired] ?? params.ageRequired}`,
    );
  if (params.experienceRequired)
    add(
      "experienceRequired",
      `Exp: ${EXP[params.experienceRequired] ?? params.experienceRequired}`,
    );
  if (params.materialsProvided)
    add("materialsProvided", `Materials provided: ${params.materialsProvided}`);
  if (params.materialsRequired)
    add("materialsRequired", `Materials required: ${params.materialsRequired}`);
  if (params.materialsRequiredDetails)
    add(
      "materialsRequiredDetails",
      `Materials details: ${params.materialsRequiredDetails}`,
    );
  if (params.days) {
    const labels = params.days
      .split(",")
      .map((d) => DAY_LABELS[d] ?? d)
      .join(", ");
    add("days", `Days: ${labels}`);
  }
  if (params.startDateTime)
    add("startDateTime", fmtDateRange(params.startDateTime, "Start: "));
  if (params.duration)
    add("duration", fmtRange(params.duration, "Duration: ", "hrs"));
  if (params.endDateTime)
    add("endDateTime", fmtDateRange(params.endDateTime, "End: "));
  if (params.minPlayers)
    add("minPlayers", fmtRange(params.minPlayers, "Min players: "));
  if (params.maxPlayers)
    add("maxPlayers", fmtRange(params.maxPlayers, "Max players: "));
  if (params.gmNames) add("gmNames", `GM: ${params.gmNames}`);
  if (params.website) add("website", `Website: ${params.website}`);
  if (params.email) add("email", `Email: ${params.email}`);
  if (params.tournament) add("tournament", `Tournament: ${params.tournament}`);
  if (params.roundNumber)
    add("roundNumber", fmtRange(params.roundNumber, "Round: "));
  if (params.totalRounds)
    add("totalRounds", fmtRange(params.totalRounds, "Total rounds: "));
  if (params.minimumPlayTime)
    add("minimumPlayTime", fmtRange(params.minimumPlayTime, "Min play time: "));
  if (params.attendeeRegistration)
    add(
      "attendeeRegistration",
      `Registration: ${REGISTRATION[params.attendeeRegistration] ?? params.attendeeRegistration}`,
    );
  if (params.cost) add("cost", fmtCostRange(params.cost));
  if (params.location) add("location", `Location: ${params.location}`);
  if (params.roomName) add("roomName", `Room: ${params.roomName}`);
  if (params.tableNumber) add("tableNumber", `Table: ${params.tableNumber}`);
  if (params.specialCategory)
    add(
      "specialCategory",
      `Category: ${CATEGORY[params.specialCategory] ?? params.specialCategory}`,
    );
  if (params.ticketsAvailable)
    add("ticketsAvailable", fmtRange(params.ticketsAvailable, "Tickets: "));
  if (params.lastModified)
    add("lastModified", fmtDateRange(params.lastModified, "Modified: "));

  return filters;
}
```

- [ ] **Step 4: Run tests and confirm they pass**

```bash
npx vitest run src/ui/ActiveFilters/getActiveFilters.test.ts
```

Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add src/ui/ActiveFilters/getActiveFilters.ts src/ui/ActiveFilters/getActiveFilters.test.ts
git commit -m "feat: add getActiveFilters utility"
```

---

## Task 4: `<ActiveFilters>` component

**Files:**

- Create: `src/ui/ActiveFilters/ActiveFilters.tsx`
- Create: `src/ui/ActiveFilters/ActiveFilters.module.css`
- Create: `src/ui/ActiveFilters/ActiveFilters.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/ui/ActiveFilters/ActiveFilters.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActiveFilters } from "./ActiveFilters";
import type { SearchParams } from "../../utils/types";

test("renders nothing when no filters are active", () => {
  const { container } = render(
    <ActiveFilters searchParams={{}} onRemove={() => {}} />,
  );
  expect(container.firstChild).toBeNull();
});

test("renders nothing when only page/limit/sort are set", () => {
  const { container } = render(
    <ActiveFilters
      searchParams={{ page: 2, limit: 100, sort: "title.asc" }}
      onRemove={() => {}}
    />,
  );
  expect(container.firstChild).toBeNull();
});

test("renders a chip for each active filter", () => {
  render(
    <ActiveFilters
      searchParams={{ filter: "dragon", location: "Hall A" }}
      onRemove={() => {}}
    />,
  );
  expect(
    screen.getByRole("button", { name: /Search: dragon/ }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /Location: Hall A/ }),
  ).toBeInTheDocument();
});

test("each chip is a button containing the label and × character", () => {
  render(
    <ActiveFilters searchParams={{ filter: "dragon" }} onRemove={() => {}} />,
  );
  const chip = screen.getByRole("button", { name: /Search: dragon/ });
  expect(chip).toHaveTextContent("Search: dragon");
  expect(chip).toHaveTextContent("×");
});

test("clicking a chip calls onRemove with the correct key", async () => {
  const user = userEvent.setup();
  const onRemove = vi.fn();
  render(
    <ActiveFilters
      searchParams={{ filter: "dragon", days: "fri" }}
      onRemove={onRemove}
    />,
  );
  await user.click(screen.getByRole("button", { name: /Search: dragon/ }));
  expect(onRemove).toHaveBeenCalledWith("filter");
  expect(onRemove).toHaveBeenCalledTimes(1);
});

test("clicking days chip calls onRemove with 'days'", async () => {
  const user = userEvent.setup();
  const onRemove = vi.fn();
  render(
    <ActiveFilters searchParams={{ days: "fri,sat" }} onRemove={onRemove} />,
  );
  await user.click(screen.getByRole("button", { name: /Days: Fri, Sat/ }));
  expect(onRemove).toHaveBeenCalledWith("days");
});
```

- [ ] **Step 2: Run tests and confirm they fail**

```bash
npx vitest run src/ui/ActiveFilters/ActiveFilters.test.tsx
```

Expected: `Cannot find module './ActiveFilters'`

- [ ] **Step 3: Implement the component**

Create `src/ui/ActiveFilters/ActiveFilters.tsx`:

```tsx
import type { SearchParams } from "../../utils/types";
import { getActiveFilters } from "./getActiveFilters";
import styles from "./ActiveFilters.module.css";

interface ActiveFiltersProps {
  searchParams: SearchParams;
  onRemove: (key: keyof SearchParams) => void;
}

export function ActiveFilters({ searchParams, onRemove }: ActiveFiltersProps) {
  const filters = getActiveFilters(searchParams);
  if (filters.length === 0) return null;

  return (
    <div className={styles.bar} aria-label="Active filters">
      {filters.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          className={styles.chip}
          onClick={() => onRemove(key)}
        >
          {label} <span aria-hidden="true">×</span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create the CSS module**

Create `src/ui/ActiveFilters/ActiveFilters.module.css`:

```css
.bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  padding: var(--space-2) 0;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  background: var(--color-bark-light);
  color: var(--color-ink);
  border: 1px solid var(--color-bark);
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: var(--text-small);
  cursor: pointer;
  transition: background var(--motion-hover);
}

.chip:hover {
  background: var(--color-bark);
  color: var(--color-parchment);
}
```

- [ ] **Step 5: Run tests and confirm they pass**

```bash
npx vitest run src/ui/ActiveFilters/ActiveFilters.test.tsx
```

Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add src/ui/ActiveFilters/
git commit -m "feat: add ActiveFilters component"
```

---

## Task 5: Wire up `SearchPage`

**Files:**

- Modify: `src/routes/index.module.css`
- Modify: `src/routes/index.tsx`
- Modify: `src/routes/index.test.tsx`

- [ ] **Step 1: Write failing integration tests**

Add these tests to the end of `src/routes/index.test.tsx`:

```tsx
test("sidebar toggle button is present in the results area", async () => {
  await renderSearchPage("/");
  expect(screen.getByRole("button", { name: /Filters/ })).toBeInTheDocument();
});

test("sidebar toggle button has aria-expanded=true by default", async () => {
  localStorage.clear();
  await renderSearchPage("/");
  expect(screen.getByRole("button", { name: /Filters/ })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
});

test("clicking toggle button flips aria-expanded to false", async () => {
  const user = userEvent.setup();
  localStorage.clear();
  await renderSearchPage("/");
  const btn = screen.getByRole("button", { name: /Filters/ });
  await user.click(btn);
  expect(btn).toHaveAttribute("aria-expanded", "false");
});

test("no active filter chips when no filters are set", async () => {
  await renderSearchPage("/");
  expect(screen.queryByRole("button", { name: /Search:/ })).toBeNull();
});

test("active filter chip appears when filter param is in URL", async () => {
  await renderSearchPage("/?filter=dragon");
  expect(
    screen.getByRole("button", { name: /Search: dragon/ }),
  ).toBeInTheDocument();
});

test("clicking a filter chip removes it from the URL", async () => {
  const user = userEvent.setup();
  const router = await renderSearchPage("/?filter=dragon&location=Hall+A");
  expect(
    screen.getByRole("button", { name: /Search: dragon/ }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /Search: dragon/ }));
  expect(router.state.location.search).not.toContain("filter=");
  expect(router.state.location.search).toContain("location=");
});

test("days active filter chip appears when days param is in URL", async () => {
  await renderSearchPage("/?days=fri%2Csat");
  expect(
    screen.getByRole("button", { name: /Days: Fri, Sat/ }),
  ).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests and confirm they fail**

```bash
npx vitest run src/routes/index.test.tsx
```

Expected: the 7 new tests fail (toggle button and chip tests)

- [ ] **Step 3: Update `index.module.css`**

Add these rules to `src/routes/index.module.css` (append after existing rules):

```css
.shell {
  transition: grid-template-columns var(--motion-expand);
}

.shell[data-sidebar-open="false"] {
  grid-template-columns: 0 1fr;
}

.resultsToolbar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}
```

Note: the existing `.shell` rule sets `grid-template-columns: var(--size-sidebar) 1fr`. Keep that rule as-is and add the `transition` to it, or add transition separately. To avoid duplication, edit the existing `.shell` rule to add `transition`:

```css
.shell {
  display: grid;
  grid-template-columns: var(--size-sidebar) 1fr;
  grid-template-rows: 1fr;
  height: calc(100vh - 72px);
  transition: grid-template-columns var(--motion-expand);
}
```

Then add the two new rules below it.

- [ ] **Step 4: Update `index.tsx`**

Replace `src/routes/index.tsx` with:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { SearchForm } from "../components/SearchForm/SearchForm";
import { SearchResults } from "../components/SearchResults/SearchResults";
import { ActiveFilters } from "../ui/ActiveFilters/ActiveFilters";
import { useSidebarOpen } from "../hooks/useSidebarOpen";
import { buildSearchParams, parseSearchParams } from "../utils/searchParams";
import type { SearchFormValues, SearchParams } from "../utils/types";
import styles from "./index.module.css";

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
      sort: str("sort"),
    };
  },
  component: SearchPage,
});

function SearchPage() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const [sidebarOpen, toggleSidebar] = useSidebarOpen();

  const handleSearch = (values: SearchFormValues) => {
    void navigate({
      search: (prev) => ({ ...buildSearchParams(values), limit: prev.limit }),
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

  const handleSort = (sort: string | undefined) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        sort,
        page: undefined,
      }),
    });
  };

  const handleRemoveFilter = (key: keyof SearchParams) => {
    void navigate({
      search: (prev) => ({ ...prev, [key]: undefined }),
    });
  };

  return (
    <main className={styles.shell} data-sidebar-open={String(sidebarOpen)}>
      <div id="sidebar" className={styles.sidebar}>
        <SearchForm
          key={JSON.stringify(search)}
          defaultValues={parseSearchParams(search)}
          onSearch={handleSearch}
        />
      </div>
      <div className={styles.results}>
        <div className={styles.resultsToolbar}>
          <button
            type="button"
            onClick={toggleSidebar}
            aria-expanded={sidebarOpen}
            aria-controls="sidebar"
          >
            {sidebarOpen ? "◀ Filters" : "▶ Filters"}
          </button>
        </div>
        <ActiveFilters searchParams={search} onRemove={handleRemoveFilter} />
        <SearchResults
          searchParams={search}
          onNavigate={handleNavigate}
          onSort={handleSort}
        />
      </div>
    </main>
  );
}
```

Note: the `validateSearch` above matches the original exactly. `materialsRequired` and `materialsRequiredDetails` exist in `SearchParams` type but were never in `validateSearch` — preserve that as-is.

- [ ] **Step 5: Run all tests and confirm they pass**

```bash
npx vitest run src/routes/index.test.tsx
```

Expected: all tests (existing + 7 new) pass

- [ ] **Step 6: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests pass with no regressions

- [ ] **Step 7: Commit**

```bash
git add src/routes/index.module.css src/routes/index.tsx src/routes/index.test.tsx
git commit -m "feat: add sidebar toggle and active filters to SearchPage"
```
