# Search Sort URL Persistence and Cross-Page Unification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix sort being dropped on search form re-submission, and unify three cross-page duplications: the `SortState` type, the `"field.dir"` parse pattern, and the shared column state composition boilerplate.

**Architecture:** Four independent refactors applied in sequence, each committed separately. Tasks 1–3 are pure refactors with no behavior change; Task 4 is the functional bug fix with two new regression tests. All changes are verified against the existing 805-test suite.

**Tech Stack:** TypeScript, React, Vitest, Testing Library, TanStack Router, TanStack Table

---

### Task 1: Move `SortState` to `src/utils/types.ts`

`SortState` is currently defined in `src/components/ChangelogPage/openParam.ts` — a changelog-specific module. It is the shared vocabulary of sort machinery on both pages and belongs in the central types file.

**Files:**

- Modify: `src/utils/types.ts`
- Modify: `src/components/ChangelogPage/openParam.ts`
- Modify: `src/components/ChangelogPage/ChangelogEntryPanel.tsx`

- [ ] **Step 1: Add `SortState` to `src/utils/types.ts`**

Append to the bottom of `src/utils/types.ts`:

```typescript
export interface SortState {
  field: string;
  dir: "asc" | "desc";
}
```

- [ ] **Step 2: Update `openParam.ts` to import `SortState` from types**

In `src/components/ChangelogPage/openParam.ts`, remove the `SortState` interface (lines 1–4):

```typescript
export interface SortState {
  field: string;
  dir: "asc" | "desc";
}
```

And add this import at the top of the file in its place:

```typescript
import type { SortState } from "../../utils/types";
```

The file now starts with:

```typescript
import type { SortState } from "../../utils/types";

export type OpenMap = Map<number, Map<string, SortState | undefined>>;
```

Everything else in `openParam.ts` stays unchanged.

- [ ] **Step 3: Update `ChangelogEntryPanel.tsx` to import `SortState` from types**

In `src/components/ChangelogPage/ChangelogEntryPanel.tsx`, change the import on line 10 from:

```typescript
import { parseOpenParam, serializeOpenParam, type SortState } from "./openParam";
```

to two separate imports:

```typescript
import { parseOpenParam, serializeOpenParam } from "./openParam";
import type { SortState } from "../../utils/types";
```

- [ ] **Step 4: Run tests to verify the refactor is clean**

```bash
npm test -- --run
```

Expected: 805 tests pass, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/utils/types.ts src/components/ChangelogPage/openParam.ts src/components/ChangelogPage/ChangelogEntryPanel.tsx
git commit -m "refactor: move SortState to src/utils/types"
```

---

### Task 2: Extract `parseSortString` utility

The `"field.dir"` split-and-validate pattern is duplicated verbatim in three production files. Extract it to a shared utility.

**Files:**

- Create: `src/utils/parseSortString.ts`
- Create: `src/utils/parseSortString.test.ts`
- Modify: `src/components/SearchResults/SearchResults.tsx`
- Modify: `src/components/ChangelogPage/ChangelogEntryPanel.tsx`
- Modify: `src/components/EventTable/EventTable.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/parseSortString.test.ts`:

```typescript
import { test, expect } from "vitest";
import { parseSortString } from "./parseSortString";

test("parses a valid asc sort string", () => {
  expect(parseSortString("startDateTime.asc")).toEqual({ field: "startDateTime", dir: "asc" });
});

test("parses a valid desc sort string", () => {
  expect(parseSortString("title.desc")).toEqual({ field: "title", dir: "desc" });
});

test("returns null for a string with no dot", () => {
  expect(parseSortString("startDateTime")).toBeNull();
});

test("returns null for an invalid dir", () => {
  expect(parseSortString("startDateTime.sideways")).toBeNull();
});

test("returns null for an empty string", () => {
  expect(parseSortString("")).toBeNull();
});

test("ignores extra dot-separated segments", () => {
  expect(parseSortString("startDateTime.asc.extra")).toEqual({
    field: "startDateTime",
    dir: "asc",
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npm test -- --run src/utils/parseSortString.test.ts
```

Expected: FAIL — `parseSortString` is not defined.

- [ ] **Step 3: Create `src/utils/parseSortString.ts`**

```typescript
import type { SortState } from "./types";

export function parseSortString(s: string): SortState | null {
  const [field, dir] = s.split(".");
  if (field && (dir === "asc" || dir === "desc")) {
    return { field, dir };
  }
  return null;
}
```

- [ ] **Step 4: Run the new tests to verify they pass**

```bash
npm test -- --run src/utils/parseSortString.test.ts
```

Expected: 6 tests pass, 0 failures.

- [ ] **Step 5: Replace inline parse in `SearchResults.tsx`**

In `src/components/SearchResults/SearchResults.tsx`, add this import after the existing imports:

```typescript
import { parseSortString } from "../../utils/parseSortString";
```

Replace the sort-parsing block (lines 62–69):

```typescript
// remove this:
let activeSortField: string | undefined = undefined;
let activeSortDir: "asc" | "desc" | undefined = undefined;
if (searchParams.sort) {
  const [field, dir] = searchParams.sort.split(".");
  if (field && (dir === "asc" || dir === "desc")) {
    activeSortField = field;
    activeSortDir = dir;
  }
}
```

With:

```typescript
const activeSortState = searchParams.sort ? parseSortString(searchParams.sort) : null;
const activeSortField = activeSortState?.field;
const activeSortDir = activeSortState?.dir;
```

- [ ] **Step 6: Replace inline parse in `ChangelogEntryPanel.tsx`**

In `src/components/ChangelogPage/ChangelogEntryPanel.tsx`, add this import after the existing imports:

```typescript
import { parseSortString } from "../../utils/parseSortString";
```

In `makeOnSort` (around line 135), replace:

```typescript
return (s) => {
  if (s === undefined) {
    syncGroupSortToUrl(group, undefined);
  } else {
    const [field, dir] = s.split(".");
    if (field && (dir === "asc" || dir === "desc")) {
      syncGroupSortToUrl(group, { field, dir });
    }
  }
};
```

With:

```typescript
return (s) => {
  if (s === undefined) {
    syncGroupSortToUrl(group, undefined);
  } else {
    const parsed = parseSortString(s);
    if (parsed) {
      syncGroupSortToUrl(group, parsed);
    }
  }
};
```

- [ ] **Step 7: Replace inline parse in `EventTable.tsx`**

In `src/components/EventTable/EventTable.tsx`, add this import after the existing imports:

```typescript
import { parseSortString } from "../../utils/parseSortString";
```

In `handlePopoverSort`, in the `else` branch (internal-sort path, where `onSort` is absent, around line 150), replace:

```typescript
    } else {
      if (s === undefined) {
        setInternalSorting([]);
        announce("Sort cleared");
        posthog.capture("results_sorted", { sort_field: null, sort_direction: null, label });
      } else {
        const [field, dir] = s.split(".");
        if (field && (dir === "asc" || dir === "desc")) {
          const colId = COL_ID_BY_SORT_FIELD.get(field) ?? field;
          setInternalSorting([{ id: colId, desc: dir === "desc" }]);
          announce(`Sorted by ${label}, ${dir === "asc" ? "ascending" : "descending"}`);
          posthog.capture("results_sorted", { sort_field: field, sort_direction: dir, label });
        }
      }
    }
```

With:

```typescript
    } else {
      if (s === undefined) {
        setInternalSorting([]);
        announce("Sort cleared");
        posthog.capture("results_sorted", { sort_field: null, sort_direction: null, label });
      } else {
        const parsed = parseSortString(s);
        if (parsed) {
          const colId = COL_ID_BY_SORT_FIELD.get(parsed.field) ?? parsed.field;
          setInternalSorting([{ id: colId, desc: parsed.dir === "desc" }]);
          announce(`Sorted by ${label}, ${parsed.dir === "asc" ? "ascending" : "descending"}`);
          posthog.capture("results_sorted", {
            sort_field: parsed.field,
            sort_direction: parsed.dir,
            label,
          });
        }
      }
    }
```

- [ ] **Step 8: Run the full test suite**

```bash
npm test -- --run
```

Expected: 811 tests pass (805 existing + 6 new), 0 failures.

- [ ] **Step 9: Commit**

```bash
git add src/utils/parseSortString.ts src/utils/parseSortString.test.ts src/components/SearchResults/SearchResults.tsx src/components/ChangelogPage/ChangelogEntryPanel.tsx src/components/EventTable/EventTable.tsx
git commit -m "refactor: extract parseSortString utility; replace three inline parse duplicates"
```

---

### Task 3: Extract `useSharedColumnState` hook

`SearchResults.tsx` and `ChangelogPage.tsx` each contain an identical 20-line block that composes four hooks into a `SharedColumnState` object. ADR 003 notes this duplication explicitly.

**Files:**

- Create: `src/hooks/useSharedColumnState.ts`
- Modify: `src/components/SearchResults/SearchResults.tsx`
- Modify: `src/components/ChangelogPage/ChangelogPage.tsx`
- Modify: `docs/adr/003-shared-column-state.md`

- [ ] **Step 1: Create `src/hooks/useSharedColumnState.ts`**

```typescript
import { useColumnVisibility } from "./useColumnVisibility";
import { useColumnSizing } from "./useColumnSizing";
import { useTypeDisplay } from "./useTypeDisplay";
import { useDayFormat } from "./useDayFormat";
import type { SharedColumnState } from "../components/EventTable/types";

export function useSharedColumnState(): SharedColumnState {
  const { visibility, toggle: toggleVisibility, reset: resetVisibility } = useColumnVisibility();
  const { sizing, setSizing, reset: resetSizing } = useColumnSizing();
  const {
    typeDisplay,
    setTypeDisplay,
    showTypeIcon,
    setShowTypeIcon,
    reset: resetTypeDisplay,
  } = useTypeDisplay();
  const { dayFormat, setDayFormat, reset: resetDayFormat } = useDayFormat();
  return {
    visibility,
    toggleVisibility,
    resetVisibility,
    sizing,
    setSizing,
    resetSizing,
    typeDisplay,
    setTypeDisplay,
    showTypeIcon,
    setShowTypeIcon,
    resetTypeDisplay,
    dayFormat,
    setDayFormat,
    resetDayFormat,
  };
}
```

- [ ] **Step 2: Replace column state boilerplate in `SearchResults.tsx`**

In `src/components/SearchResults/SearchResults.tsx`:

**a)** Add this import:

```typescript
import { useSharedColumnState } from "../../hooks/useSharedColumnState";
```

**b)** Remove these four now-unused imports:

```typescript
import { useColumnVisibility } from "../../hooks/useColumnVisibility";
import { useColumnSizing } from "../../hooks/useColumnSizing";
import { useTypeDisplay } from "../../hooks/useTypeDisplay";
import { useDayFormat } from "../../hooks/useDayFormat";
```

**c)** Replace the 20-line hook composition block (lines 31–56) with one line:

```typescript
const sharedColumnState = useSharedColumnState();
```

**d)** The `EventListMobile` component (mobile view) receives three props from what used to be local variables. Update those three props to come from `sharedColumnState` instead. The relevant JSX block currently reads:

```typescript
<EventListMobile
  events={data.data}
  visibility={sharedColumnState.visibility}
  typeDisplay={typeDisplay}
  showTypeIcon={showTypeIcon}
  dayFormat={dayFormat}
/>
```

Change to:

```typescript
<EventListMobile
  events={data.data}
  visibility={sharedColumnState.visibility}
  typeDisplay={sharedColumnState.typeDisplay}
  showTypeIcon={sharedColumnState.showTypeIcon}
  dayFormat={sharedColumnState.dayFormat}
/>
```

- [ ] **Step 3: Replace column state boilerplate in `ChangelogPage.tsx`**

In `src/components/ChangelogPage/ChangelogPage.tsx`:

**a)** Add this import:

```typescript
import { useSharedColumnState } from "../../hooks/useSharedColumnState";
```

**b)** Remove these four now-unused imports:

```typescript
import { useColumnVisibility } from "../../hooks/useColumnVisibility";
import { useColumnSizing } from "../../hooks/useColumnSizing";
import { useTypeDisplay } from "../../hooks/useTypeDisplay";
import { useDayFormat } from "../../hooks/useDayFormat";
```

**c)** Replace the 20-line hook composition block (lines 25–50) with one line:

```typescript
const sharedColumnState = useSharedColumnState();
```

The rest of `ChangelogPage.tsx` accesses all fields via `sharedColumnState` already, so no further JSX changes are needed.

- [ ] **Step 4: Run the full test suite**

```bash
npm test -- --run
```

Expected: 811 tests pass, 0 failures.

- [ ] **Step 5: Update ADR 003**

In `docs/adr/003-shared-column-state.md`, update the Consequences section. Find the bullet:

```markdown
- Both current use sites (`SearchResults` and `ChangelogPage`) compose the state inline using the same three hooks rather than a single dedicated `useSharedColumnState` hook.
```

Replace with:

```markdown
- Both current use sites (`SearchResults` and `ChangelogPage`) compose the state via `useSharedColumnState` (`src/hooks/useSharedColumnState.ts`), which encapsulates the four-hook composition pattern.
```

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useSharedColumnState.ts src/components/SearchResults/SearchResults.tsx src/components/ChangelogPage/ChangelogPage.tsx docs/adr/003-shared-column-state.md
git commit -m "refactor: extract useSharedColumnState hook; eliminate column state boilerplate duplication"
```

---

### Task 4: Fix `handleSearch` and add regression tests

`handleSearch` in `src/routes/index.tsx` rebuilds the URL from form values but does not preserve `sort`. The sort param is stripped from the URL every time the user submits the search form. This task fixes the bug and adds two regression tests.

**Files:**

- Modify: `src/routes/index.tsx`
- Modify: `src/routes/index.test.tsx`

- [ ] **Step 1: Write the failing test for sort survival**

In `src/routes/index.test.tsx`, add this test after the `"submitting a new search resets page to 1"` test:

```typescript
test("submitting a new search preserves the active sort", async () => {
  const user = userEvent.setup();
  let latestUrl: URL | null = null;
  server.use(
    http.get("/api/events/search", ({ request }) => {
      latestUrl = new URL(request.url);
      const response: EventSearchResponse = {
        data: [makeEvent()],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  await renderRoute("/?sort=startDateTime.asc");
  await screen.findByRole("navigation", { name: "Pagination, top" });
  latestUrl = null;
  await user.click(screen.getByRole("button", { name: "Search" }));
  await screen.findByRole("navigation", { name: "Pagination, top" });
  // oxlint-disable-next-line typescript/no-non-null-assertion
  expect(latestUrl!.searchParams.get("sort")).toBe("startDateTime.asc");
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- --run src/routes/index.test.tsx
```

Expected: FAIL — `sort` param is absent from the API URL after re-search.

- [ ] **Step 3: Fix `handleSearch` in `src/routes/index.tsx`**

In `src/routes/index.tsx`, change `handleSearch` from:

```typescript
const handleSearch = (values: SearchFormValues): void => {
  void navigate({
    search: (prev) => ({ ...buildSearchParams(values), limit: prev.limit }),
  });
};
```

To:

```typescript
const handleSearch = (values: SearchFormValues): void => {
  void navigate({
    search: (prev) => ({ ...buildSearchParams(values), limit: prev.limit, sort: prev.sort }),
  });
};
```

- [ ] **Step 4: Run the failing test to verify it now passes**

```bash
npm test -- --run src/routes/index.test.tsx
```

Expected: the sort-survival test passes.

- [ ] **Step 5: Write the URL-to-indicator regression test**

In `src/routes/index.test.tsx`, add this test immediately after the sort-survival test:

```typescript
test("loading with sort param in URL shows sort indicator on column header", async () => {
  server.use(
    http.get("/api/events/search", () =>
      HttpResponse.json<EventSearchResponse>({
        data: [makeEvent()],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      }),
    ),
  );
  await renderRoute("/?sort=startDateTime.asc");
  const startButton = await screen.findByRole("button", { name: "Start" });
  expect(startButton.closest("th")).toHaveAttribute("aria-sort", "ascending");
});
```

- [ ] **Step 6: Run the full test suite**

```bash
npm test -- --run
```

Expected: 813 tests pass (811 + 2 new), 0 failures.

- [ ] **Step 7: Commit**

```bash
git add src/routes/index.tsx src/routes/index.test.tsx
git commit -m "fix(search): preserve sort param through search form re-submission"
```
