# parseCSV Utility and Trailing-Comma Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a `parseCSV` utility that always filters empty strings from comma-separated values, fix the two sites missing this guard, and add tests that would catch a regression.

**Architecture:** Create a single `parseCSV(value: string | undefined): string[]` utility in `src/utils/`. Migrate the four raw `.split(",")` / `.split(",").filter(Boolean)` call sites to use it. Add unit tests for the utility and two component-level regression tests for the trailing-comma edge case.

**Tech Stack:** TypeScript, Vitest, React Testing Library, MSW (for SearchForm tests)

---

### Task 1: Create `parseCSV` utility with failing tests

**Files:**

- Create: `src/utils/parseCSV.ts`
- Create: `src/utils/parseCSV.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/parseCSV.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { parseCSV } from "./parseCSV";

describe("parseCSV", () => {
  test("undefined returns empty array", () => {
    expect(parseCSV(undefined)).toEqual([]);
  });

  test("empty string returns empty array", () => {
    expect(parseCSV("")).toEqual([]);
  });

  test("single value returns single-element array", () => {
    expect(parseCSV("RPG")).toEqual(["RPG"]);
  });

  test("two values returns two-element array", () => {
    expect(parseCSV("RPG,BGM")).toEqual(["RPG", "BGM"]);
  });

  test("trailing comma is ignored", () => {
    expect(parseCSV("RPG,")).toEqual(["RPG"]);
  });

  test("leading comma is ignored", () => {
    expect(parseCSV(",RPG")).toEqual(["RPG"]);
  });

  test("double comma is collapsed", () => {
    expect(parseCSV("RPG,,BGM")).toEqual(["RPG", "BGM"]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/utils/parseCSV.test.ts --reporter=verbose
```

Expected: FAIL — `parseCSV` is not defined / module not found.

- [ ] **Step 3: Write the implementation**

Create `src/utils/parseCSV.ts`:

```ts
export function parseCSV(value: string | undefined): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/utils/parseCSV.test.ts --reporter=verbose
```

Expected: 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/parseCSV.ts src/utils/parseCSV.test.ts
git commit -m "feat: add parseCSV utility with full edge-case coverage"
```

---

### Task 2: Fix `MultiCombobox` — the source of the empty-chip bug

**Files:**

- Modify: `src/ui/MultiCombobox/MultiCombobox.tsx:58`

- [ ] **Step 1: Write the failing regression test**

Open `src/ui/MultiCombobox/MultiCombobox.test.tsx` and add this test at the bottom of the file:

```ts
test("trailing comma in value does not render an empty chip", () => {
  render(
    <MultiCombobox
      label="Test"
      value="RPG,"
      onValueChange={() => {}}
      options={[{ value: "RPG", label: "Roleplaying Game" }]}
    />,
  );
  expect(screen.getAllByRole("button", { name: /^Remove/ })).toHaveLength(1);
  expect(screen.getByRole("button", { name: "Remove RPG" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/ui/MultiCombobox/MultiCombobox.test.tsx --reporter=verbose
```

Expected: FAIL — test finds 2 Remove buttons instead of 1 (one for "RPG", one for "").

- [ ] **Step 3: Apply the fix**

In `src/ui/MultiCombobox/MultiCombobox.tsx`, replace line 58:

```ts
// Before
const selectedValues = value ? value.split(",") : [];
```

```ts
// After
import { parseCSV } from "../../utils/parseCSV";
// ...
const selectedValues = parseCSV(value);
```

The full diff: add the import near the top of the file alongside existing imports, and replace line 58's expression.

Exact import line to add (after the existing imports):

```ts
import { parseCSV } from "../../utils/parseCSV";
```

Exact replacement at line 58:

```ts
const selectedValues = parseCSV(value);
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/ui/MultiCombobox/MultiCombobox.test.tsx --reporter=verbose
```

Expected: all tests PASS (new test included).

- [ ] **Step 5: Commit**

```bash
git add src/ui/MultiCombobox/MultiCombobox.tsx src/ui/MultiCombobox/MultiCombobox.test.tsx
git commit -m "fix: use parseCSV in MultiCombobox to prevent empty chips from trailing commas"
```

---

### Task 3: Add EventTypeSelect trailing-comma regression test

**Files:**

- Modify: `src/components/EventTypeSelect/EventTypeSelect.test.tsx`

- [ ] **Step 1: Write the failing test**

Add at the bottom of `src/components/EventTypeSelect/EventTypeSelect.test.tsx`:

```ts
test("trailing comma in value renders only one chip", () => {
  render(<EventTypeSelect value="RPG," onValueChange={() => {}} />);
  expect(screen.getAllByRole("button", { name: /^Remove/ })).toHaveLength(1);
  expect(screen.getByRole("button", { name: "Remove RPG" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it passes (Task 2's fix already covers this)**

```bash
npx vitest run src/components/EventTypeSelect/EventTypeSelect.test.tsx --reporter=verbose
```

Expected: all tests PASS — the fix in Task 2 resolves this too.

> Note: This test should pass immediately because `EventTypeSelect` delegates to `MultiCombobox`, which was fixed in Task 2. The test is valuable as a contract — it pins the behavior at the component boundary so a future refactor can't silently reintroduce the bug.

- [ ] **Step 3: Commit**

```bash
git add src/components/EventTypeSelect/EventTypeSelect.test.tsx
git commit -m "test: add trailing-comma regression test for EventTypeSelect"
```

---

### Task 4: Add SearchForm trailing-comma regression test

**Files:**

- Modify: `src/components/SearchForm/SearchForm.test.tsx`

- [ ] **Step 1: Write the failing test**

Add at the bottom of the existing tests in `src/components/SearchForm/SearchForm.test.tsx` (before the `changelogMode` block is fine, or at the very end):

```ts
test("trailing comma in eventType value renders only one chip", () => {
  renderSearchForm({ eventType: "RPG," });
  expect(screen.getAllByRole("button", { name: /^Remove/ })).toHaveLength(1);
  expect(screen.getByRole("button", { name: "Remove RPG" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it passes**

```bash
npx vitest run src/components/SearchForm/SearchForm.test.tsx --reporter=verbose
```

Expected: all tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/SearchForm/SearchForm.test.tsx
git commit -m "test: add trailing-comma regression test for SearchForm"
```

---

### Task 5: Standardize remaining call sites to use `parseCSV`

**Files:**

- Modify: `src/utils/searchParams.ts:62` (`decodeDays`)
- Modify: `src/components/ActiveFilters/getActiveFilters.ts:259`
- Modify: `src/utils/filterChangelogEvents.ts:26`

These sites already behave correctly (two have `.filter(Boolean)`, one filters by valid day keys). This task standardizes them onto `parseCSV` for consistency — future readers see one pattern, not three.

- [ ] **Step 1: Update `decodeDays` in `searchParams.ts`**

Add import at the top of `src/utils/searchParams.ts`:

```ts
import { parseCSV } from "./parseCSV";
```

Replace the body of `decodeDays` (lines 58–63):

```ts
// Before
export function decodeDays(str?: string): string[] {
  if (!str) {
    return [];
  }
  return str.split(",");
}
```

```ts
// After
export function decodeDays(str?: string): string[] {
  return parseCSV(str);
}
```

- [ ] **Step 2: Update `getActiveFilters.ts`**

Add import at the top of `src/components/ActiveFilters/getActiveFilters.ts`:

```ts
import { parseCSV } from "../../utils/parseCSV";
```

Replace line 259:

```ts
// Before
        for (const code of (val as string).split(",").filter(Boolean)) {
```

```ts
// After
        for (const code of parseCSV(val as string)) {
```

- [ ] **Step 3: Update `filterChangelogEvents.ts`**

Add import at the top of `src/utils/filterChangelogEvents.ts`:

```ts
import { parseCSV } from "./parseCSV";
```

Replace line 26:

```ts
// Before
const eventTypes = filter.eventType ? filter.eventType.split(",").filter(Boolean) : [];
```

```ts
// After
const eventTypes = parseCSV(filter.eventType);
```

- [ ] **Step 4: Run all tests to verify nothing regressed**

```bash
npx vitest run --reporter=verbose 2>&1 | tail -5
```

Expected: all 1045+ tests PASS, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/utils/searchParams.ts src/components/ActiveFilters/getActiveFilters.ts src/utils/filterChangelogEvents.ts
git commit -m "refactor: standardize comma-split call sites to use parseCSV"
```

---

### Task 6: Final full-suite verification

- [ ] **Step 1: Run the complete test suite**

```bash
npx vitest run --reporter=verbose 2>&1 | tail -10
```

Expected: all tests PASS, 0 failures. Total count should be higher than the baseline (1045) by 10 new tests: 7 utility + 1 MultiCombobox + 1 EventTypeSelect + 1 SearchForm.

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.
