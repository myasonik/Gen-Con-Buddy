# Atomic Filter Chips Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace combined multi-value filter chips (e.g. "Days: Fri, Sat") with individual atomic chips (e.g. "Fri" + "Sat"), each independently removable from the URL.

**Architecture:** `ActiveFilter` drops its `key` field and gains a `remove` function — each chip carries its own removal logic. Single-value params get a `remove` that clears the whole key; CSV params (`days`, `eventType`) split into one chip per value, each `remove` filtering only its own code. `ActiveFilters.tsx` passes the whole filter object to `onRemove`; `SearchPage` calls `filter.remove(prev)` inside `navigate`.

**Tech Stack:** TypeScript, React, TanStack Router (`navigate` with functional updater), Vitest, Testing Library

---

## File Structure

**Modified — no new files:**

- `src/ui/ActiveFilters/getActiveFilters.ts` — interface change + CSV splitting logic
- `src/ui/ActiveFilters/getActiveFilters.test.ts` — update all tests for new interface; add atomic CSV tests
- `src/ui/ActiveFilters/ActiveFilters.tsx` — `onRemove` signature change; `key` prop uses `label`
- `src/ui/ActiveFilters/ActiveFilters.test.tsx` — update mock assertions; add atomic chip tests
- `src/routes/index.tsx` — `handleRemoveFilter` uses `filter.remove(prev)`; import `ActiveFilter` type
- `src/routes/index.test.tsx` — update days integration test; add atomic click tests

---

### Task 1: Refactor `ActiveFilter` interface and update all callers

Drops `key` from `ActiveFilter`, adds `remove`. All single-value params (everything except `days` and `eventType`) get a `remove` that clears the whole param. Update `ActiveFilters.tsx`, `SearchPage`, and all existing tests.

**Files:**

- Modify: `src/ui/ActiveFilters/getActiveFilters.ts`
- Modify: `src/ui/ActiveFilters/getActiveFilters.test.ts`
- Modify: `src/ui/ActiveFilters/ActiveFilters.tsx`
- Modify: `src/ui/ActiveFilters/ActiveFilters.test.tsx`
- Modify: `src/routes/index.tsx`

- [ ] **Step 1: Update `getActiveFilters.ts` — interface and `add` helper**

Replace the `ActiveFilter` interface and the `add` helper. Everything else in the file stays the same for this task (`days` and `eventType` still use `add`).

```ts
// src/ui/ActiveFilters/getActiveFilters.ts
import {
  AGE_GROUPS,
  CATEGORY,
  EVENT_TYPES,
  EXP,
  REGISTRATION,
} from "../../utils/enums";
import type { SearchParams } from "../../utils/types";

export interface ActiveFilter {
  label: string;
  remove: (prev: SearchParams) => SearchParams;
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
  const min = r.min ? `$${r.min}` : "";
  const max = r.max ? `$${r.max}` : "";
  const dash = min || max ? "–" : "";
  return `Cost: ${min}${dash}${max}`;
}

export function getActiveFilters(params: SearchParams): ActiveFilter[] {
  const filters: ActiveFilter[] = [];

  const add = (key: keyof SearchParams, label: string) => {
    filters.push({ label, remove: (prev) => ({ ...prev, [key]: undefined }) });
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

- [ ] **Step 2: Update `getActiveFilters.test.ts`**

Replace all assertions that referenced `key`. Each test now checks `label` and calls `remove` to verify the right param is cleared. Replace the entire file:

```ts
// src/ui/ActiveFilters/getActiveFilters.test.ts
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

test("filter param produces 'Search:' label and remove clears filter", () => {
  const [chip] = getActiveFilters({ filter: "dragon" });
  expect(chip.label).toBe("Search: dragon");
  expect(chip.remove({ filter: "dragon", title: "foo" })).toEqual({
    title: "foo",
  });
});

test("eventType param uses EVENT_TYPES enum for label", () => {
  const [chip] = getActiveFilters({ eventType: "RPG" });
  expect(chip.label).toBe("Type: RPG - Role Playing Game");
  expect(chip.remove({ eventType: "RPG" })).toEqual({});
});

test("eventType falls back to raw value when code is unknown", () => {
  const [chip] = getActiveFilters({ eventType: "XYZ" });
  expect(chip.label).toBe("Type: XYZ");
});

test("ageRequired uses AGE_GROUPS enum for label", () => {
  const [chip] = getActiveFilters({ ageRequired: "21+" });
  expect(chip.label).toBe("Age: 21+");
  expect(chip.remove({ ageRequired: "21+" })).toEqual({});
});

test("experienceRequired uses EXP enum for label", () => {
  const [chip] = getActiveFilters({
    experienceRequired:
      "None (You've never played before - rules will be taught)",
  });
  expect(chip.label).toBe("Exp: None");
});

test("attendeeRegistration uses REGISTRATION enum for label", () => {
  const [chip] = getActiveFilters({
    attendeeRegistration: "No, this event does not require tickets!",
  });
  expect(chip.label).toBe("Registration: Free (no ticket needed)");
});

test("specialCategory uses CATEGORY enum for label", () => {
  const [chip] = getActiveFilters({ specialCategory: "Premier Event" });
  expect(chip.label).toBe("Category: Premier Event");
});

test("days param produces one chip with all days joined (pre-atomic)", () => {
  const result = getActiveFilters({ days: "fri,sat" });
  expect(result).toHaveLength(1);
  expect(result[0].label).toBe("Days: Fri, Sat");
  expect(result[0].remove({ days: "fri,sat" })).toEqual({});
});

test("days param with single day", () => {
  const [chip] = getActiveFilters({ days: "wed" });
  expect(chip.label).toBe("Days: Wed");
});

test("cost range formats with dollar signs", () => {
  const [chip] = getActiveFilters({ cost: "[0,5]" });
  expect(chip.label).toBe("Cost: $0–$5");
  expect(chip.remove({ cost: "[0,5]" })).toEqual({});
});

test("cost range with only min", () => {
  const [chip] = getActiveFilters({ cost: "[3,]" });
  expect(chip.label).toBe("Cost: $3–");
});

test("cost range with only max", () => {
  const [chip] = getActiveFilters({ cost: "[,5]" });
  expect(chip.label).toBe("Cost: –$5");
});

test("minPlayers range formats without dollar signs", () => {
  const [chip] = getActiveFilters({ minPlayers: "[2,6]" });
  expect(chip.label).toBe("Min players: 2–6");
});

test("duration range formats with hrs suffix", () => {
  const [chip] = getActiveFilters({ duration: "[1,4]" });
  expect(chip.label).toBe("Duration: 1–4 hrs");
});

test("duration range with only max", () => {
  const [chip] = getActiveFilters({ duration: "[,4]" });
  expect(chip.label).toBe("Duration: –4 hrs");
});

test("startDateTime date range formats dates", () => {
  const [chip] = getActiveFilters({
    startDateTime: "[2024-08-02T00:00:00Z,2024-08-03T00:00:00Z]",
  });
  expect(chip.label).toMatch(/^Start:/);
});

test("plain string params show their value", () => {
  expect(getActiveFilters({ title: "dragon" })[0].label).toBe("Title: dragon");
  expect(getActiveFilters({ location: "Hall A" })[0].label).toBe(
    "Location: Hall A",
  );
  expect(getActiveFilters({ gmNames: "Bob" })[0].label).toBe("GM: Bob");
});

test("multiple params produce one entry each", () => {
  const result = getActiveFilters({ filter: "dragon", days: "fri" });
  expect(result).toHaveLength(2);
  const labels = result.map((r) => r.label);
  expect(labels).toContain("Search: dragon");
  expect(labels).toContain("Days: Fri");
});
```

- [ ] **Step 3: Run unit tests to verify they pass**

```bash
npx vitest run src/ui/ActiveFilters/getActiveFilters.test.ts
```

Expected: all tests pass.

- [ ] **Step 4: Update `ActiveFilters.tsx`**

Change `onRemove` to accept an `ActiveFilter` object; use `filter.label` as the React `key`.

```tsx
// src/ui/ActiveFilters/ActiveFilters.tsx
import type { SearchParams } from "../../utils/types";
import type { ActiveFilter } from "./getActiveFilters";
import { getActiveFilters } from "./getActiveFilters";
import styles from "./ActiveFilters.module.css";

interface ActiveFiltersProps {
  searchParams: SearchParams;
  onRemove: (filter: ActiveFilter) => void;
}

export function ActiveFilters({ searchParams, onRemove }: ActiveFiltersProps) {
  const filters = getActiveFilters(searchParams);
  if (filters.length === 0) return null;

  return (
    <ul className={styles.bar} aria-label="Active filters">
      {filters.map((filter) => (
        <li key={filter.label}>
          <button
            type="button"
            className={styles.chip}
            onClick={() => onRemove(filter)}
          >
            {filter.label} <span aria-hidden="true">×</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 5: Update `ActiveFilters.test.tsx`**

The "clicking a chip calls onRemove" tests now verify the passed `ActiveFilter` object rather than a string key. Replace the entire file:

```tsx
// src/ui/ActiveFilters/ActiveFilters.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActiveFilters } from "./ActiveFilters";
import type { ActiveFilter } from "./getActiveFilters";

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

test("clicking a chip calls onRemove with the filter object", async () => {
  const user = userEvent.setup();
  const onRemove = vi.fn();
  render(
    <ActiveFilters
      searchParams={{ filter: "dragon", days: "fri" }}
      onRemove={onRemove}
    />,
  );
  await user.click(screen.getByRole("button", { name: /Search: dragon/ }));
  expect(onRemove).toHaveBeenCalledTimes(1);
  const [filter] = onRemove.mock.calls[0] as [ActiveFilter];
  expect(filter.label).toBe("Search: dragon");
  expect(filter.remove({ filter: "dragon", days: "fri" })).toEqual({
    days: "fri",
  });
});

test("clicking days chip calls onRemove with filter that clears days", async () => {
  const user = userEvent.setup();
  const onRemove = vi.fn();
  render(
    <ActiveFilters searchParams={{ days: "fri,sat" }} onRemove={onRemove} />,
  );
  await user.click(screen.getByRole("button", { name: /Days: Fri, Sat/ }));
  expect(onRemove).toHaveBeenCalledTimes(1);
  const [filter] = onRemove.mock.calls[0] as [ActiveFilter];
  expect(filter.remove({ days: "fri,sat" })).toEqual({});
});

test("renders a list with accessible label when filters are active", () => {
  render(
    <ActiveFilters searchParams={{ filter: "dragon" }} onRemove={() => {}} />,
  );
  expect(
    screen.getByRole("list", { name: "Active filters" }),
  ).toBeInTheDocument();
});
```

- [ ] **Step 6: Run component tests to verify they pass**

```bash
npx vitest run src/ui/ActiveFilters/ActiveFilters.test.tsx
```

Expected: all tests pass.

- [ ] **Step 7: Update `src/routes/index.tsx`**

Add import for `ActiveFilter` type; update `handleRemoveFilter` to call `filter.remove`.

Find the existing import of `SearchFormValues` and `SearchParams`:

```ts
import type { SearchFormValues, SearchParams } from "../utils/types";
```

Add `ActiveFilter` on a new import line:

```ts
import type { ActiveFilter } from "../ui/ActiveFilters/getActiveFilters";
```

Replace `handleRemoveFilter`:

```ts
const handleRemoveFilter = (filter: ActiveFilter) => {
  void navigate({ search: (prev) => filter.remove(prev) });
};
```

- [ ] **Step 8: Run all tests to verify no regressions**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/ui/ActiveFilters/getActiveFilters.ts \
        src/ui/ActiveFilters/getActiveFilters.test.ts \
        src/ui/ActiveFilters/ActiveFilters.tsx \
        src/ui/ActiveFilters/ActiveFilters.test.tsx \
        src/routes/index.tsx
git commit -m "refactor(ActiveFilters): replace key with remove function on ActiveFilter"
```

---

### Task 2: Make `days` atomic

Split `days="fri,sat"` into two chips — "Fri" and "Sat" — each with a `remove` that filters only its own code.

**Files:**

- Modify: `src/ui/ActiveFilters/getActiveFilters.ts`
- Modify: `src/ui/ActiveFilters/getActiveFilters.test.ts`
- Modify: `src/ui/ActiveFilters/ActiveFilters.test.tsx`
- Modify: `src/routes/index.test.tsx`

- [ ] **Step 1: Write failing unit tests for atomic days chips**

Add these tests to `src/ui/ActiveFilters/getActiveFilters.test.ts`. Replace the two existing days tests:

```ts
test("days param produces one chip per day", () => {
  const result = getActiveFilters({ days: "fri,sat" });
  expect(result).toHaveLength(2);
  expect(result[0].label).toBe("Fri");
  expect(result[1].label).toBe("Sat");
});

test("days chip remove leaves other days intact", () => {
  const [fri] = getActiveFilters({ days: "fri,sat" });
  expect(fri.remove({ days: "fri,sat", title: "foo" })).toEqual({
    days: "sat",
    title: "foo",
  });
});

test("days chip remove clears param when it was the last day", () => {
  const [wed] = getActiveFilters({ days: "wed" });
  expect(wed.remove({ days: "wed" })).toEqual({});
});

test("multiple params: days=fri produces one chip labeled Fri", () => {
  const result = getActiveFilters({ filter: "dragon", days: "fri" });
  expect(result).toHaveLength(2);
  const labels = result.map((r) => r.label);
  expect(labels).toContain("Search: dragon");
  expect(labels).toContain("Fri");
});
```

Also delete the old "multiple params produce one entry each" test (replaced by the one above) and the "days param with single day" test (replaced by the chip-per-day tests).

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/ui/ActiveFilters/getActiveFilters.test.ts
```

Expected: the new days tests fail (still producing "Days: Fri, Sat" as one chip).

- [ ] **Step 3: Update `getActiveFilters.ts` — split days into atomic chips**

Replace the `days` block inside `getActiveFilters`:

```ts
if (params.days) {
  for (const code of params.days.split(",")) {
    const label = DAY_LABELS[code] ?? code;
    filters.push({
      label,
      remove: (prev) => {
        const remaining = (prev.days ?? "")
          .split(",")
          .filter((d) => d !== code)
          .join(",");
        return { ...prev, days: remaining || undefined };
      },
    });
  }
}
```

- [ ] **Step 4: Run unit tests to verify they pass**

```bash
npx vitest run src/ui/ActiveFilters/getActiveFilters.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Update `ActiveFilters.test.tsx` — days chip now shows individual day labels**

Replace the "clicking days chip" test. In this component test there are no day tile buttons, so no ambiguity — query directly.

```tsx
test("clicking Fri chip calls onRemove with filter that leaves Sat", async () => {
  const user = userEvent.setup();
  const onRemove = vi.fn();
  render(
    <ActiveFilters searchParams={{ days: "fri,sat" }} onRemove={onRemove} />,
  );
  expect(screen.getByRole("button", { name: "Fri" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sat" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Fri" }));
  expect(onRemove).toHaveBeenCalledTimes(1);
  const [filter] = onRemove.mock.calls[0] as [ActiveFilter];
  expect(filter.remove({ days: "fri,sat" })).toEqual({ days: "sat" });
});
```

- [ ] **Step 6: Update `index.test.tsx` — days chip integration tests**

Replace the existing "days active filter chip appears when days param is in URL" test.

Note: day tile buttons in the search form are also named "Fri", "Sat", etc. Scope chip queries to the active filters list using `within` to avoid ambiguity. `within` is already imported at line 1 of `index.test.tsx`.

```ts
test("days filter produces one chip per day", async () => {
  await renderSearchPage("/?days=fri%2Csat");
  const bar = screen.getByRole("list", { name: "Active filters" });
  expect(within(bar).getByRole("button", { name: "Fri" })).toBeInTheDocument();
  expect(within(bar).getByRole("button", { name: "Sat" })).toBeInTheDocument();
  expect(within(bar).queryByRole("button", { name: /Days:/ })).toBeNull();
});

test("clicking Fri chip removes fri but leaves sat in URL", async () => {
  const user = userEvent.setup();
  const router = await renderSearchPage("/?days=fri%2Csat");
  const bar = screen.getByRole("list", { name: "Active filters" });
  await user.click(within(bar).getByRole("button", { name: "Fri" }));
  expect(router.state.location.searchStr).toContain("days=sat");
  expect(router.state.location.searchStr).not.toContain("fri");
});
```

- [ ] **Step 7: Run all tests to verify they pass**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/ui/ActiveFilters/getActiveFilters.ts \
        src/ui/ActiveFilters/getActiveFilters.test.ts \
        src/ui/ActiveFilters/ActiveFilters.test.tsx \
        src/routes/index.test.tsx
git commit -m "feat(ActiveFilters): split days into atomic per-day chips"
```

---

### Task 3: Make `eventType` atomic

Split `eventType="RPG,BGM"` into two chips — one per code — each with a `remove` that filters only its own code.

**Files:**

- Modify: `src/ui/ActiveFilters/getActiveFilters.ts`
- Modify: `src/ui/ActiveFilters/getActiveFilters.test.ts`
- Modify: `src/routes/index.test.tsx`

- [ ] **Step 1: Write failing unit tests for atomic eventType chips**

Add these tests to `src/ui/ActiveFilters/getActiveFilters.test.ts`. Replace the two existing eventType tests:

```ts
test("eventType param produces one chip per code", () => {
  const result = getActiveFilters({ eventType: "RPG,BGM" });
  expect(result).toHaveLength(2);
  expect(result[0].label).toBe("RPG - Role Playing Game");
  expect(result[1].label).toBe("BGM - Board Game");
});

test("eventType chip remove leaves other codes intact", () => {
  const [rpg] = getActiveFilters({ eventType: "RPG,BGM" });
  expect(rpg.remove({ eventType: "RPG,BGM", title: "foo" })).toEqual({
    eventType: "BGM",
    title: "foo",
  });
});

test("eventType chip remove clears param when it was the last code", () => {
  const [rpg] = getActiveFilters({ eventType: "RPG" });
  expect(rpg.remove({ eventType: "RPG" })).toEqual({});
});

test("eventType falls back to raw value when code is unknown", () => {
  const [chip] = getActiveFilters({ eventType: "XYZ" });
  expect(chip.label).toBe("XYZ");
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/ui/ActiveFilters/getActiveFilters.test.ts
```

Expected: the new eventType tests fail.

- [ ] **Step 3: Update `getActiveFilters.ts` — split eventType into atomic chips**

Replace the `eventType` block inside `getActiveFilters`:

```ts
if (params.eventType) {
  for (const code of params.eventType.split(",")) {
    const label = EVENT_TYPES[code] ?? code;
    filters.push({
      label,
      remove: (prev) => {
        const remaining = (prev.eventType ?? "")
          .split(",")
          .filter((c) => c !== code)
          .join(",");
        return { ...prev, eventType: remaining || undefined };
      },
    });
  }
}
```

- [ ] **Step 4: Run unit tests to verify they pass**

```bash
npx vitest run src/ui/ActiveFilters/getActiveFilters.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Update `index.test.tsx` — eventType chip integration tests**

Add these tests to the existing `index.test.tsx`:

```ts
test("eventType filter produces one chip per code", async () => {
  await renderSearchPage("/?eventType=RPG%2CBGM");
  expect(
    screen.getByRole("button", { name: /RPG - Role Playing Game/ }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /BGM - Board Game/ }),
  ).toBeInTheDocument();
});

test("clicking RPG active-filter chip removes RPG but leaves BGM in URL", async () => {
  const user = userEvent.setup();
  const router = await renderSearchPage("/?eventType=RPG%2CBGM");
  await user.click(
    screen.getByRole("button", { name: /RPG - Role Playing Game/ }),
  );
  expect(router.state.location.searchStr).toContain("eventType=BGM");
  expect(router.state.location.searchStr).not.toContain("RPG");
});
```

- [ ] **Step 6: Run all tests to verify they pass**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/ui/ActiveFilters/getActiveFilters.ts \
        src/ui/ActiveFilters/getActiveFilters.test.ts \
        src/routes/index.test.tsx
git commit -m "feat(ActiveFilters): split eventType into atomic per-code chips"
```
