# Search Param Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the triple-enumeration bug class by replacing four separate hand-maintained lists with a single `SCHEMA` constant that drives all types and conversion functions.

**Architecture:** Create `src/utils/searchParamSchema.ts` as the single source of truth — it holds the `SCHEMA` record, derived `SearchParams` and `SearchFormValues` types (via mapped types), and all three conversion functions (`coerceSearchParams`, `parseSearchParams`, `buildSearchParams`). Delete `coerceSearchParams.ts`, strip the two functions from `searchParams.ts`, and remove the two types from `types.ts`. No behavior changes anywhere — only the location of definitions moves.

**Tech Stack:** TypeScript, Vitest, React, TanStack Router

---

### Task 1: Write the failing tests for `searchParamSchema.ts`

**Files:**

- Create: `src/utils/searchParamSchema.test.ts`

- [ ] **Step 1: Create `src/utils/searchParamSchema.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { coerceSearchParams, parseSearchParams, buildSearchParams } from "./searchParamSchema";

describe("coerceSearchParams", () => {
  it("coerces string params", () => {
    expect(coerceSearchParams({ title: "Dragons" }).title).toBe("Dragons");
  });

  it("coerces number params", () => {
    expect(coerceSearchParams({ limit: 25 }).limit).toBe(25);
  });

  it("drops string param given as number", () => {
    expect(coerceSearchParams({ title: 42 }).title).toBeUndefined();
  });

  it("drops number param given as string", () => {
    expect(coerceSearchParams({ limit: "25" }).limit).toBeUndefined();
  });

  it("ignores unknown keys", () => {
    const result = coerceSearchParams({ unknownKey: "value" });
    expect(Object.keys(result)).not.toContain("unknownKey");
  });
});

describe("parseSearchParams", () => {
  it("passes string fields through unchanged", () => {
    expect(parseSearchParams({ title: "Dragons" }).title).toBe("Dragons");
  });

  it("splits range field into Min/Max", () => {
    const result = parseSearchParams({ minPlayers: "[2,6]" });
    expect(result.minPlayersMin).toBe("2");
    expect(result.minPlayersMax).toBe("6");
  });

  it("returns undefined Min/Max when range param absent", () => {
    const result = parseSearchParams({});
    expect(result.minPlayersMin).toBeUndefined();
    expect(result.minPlayersMax).toBeUndefined();
  });

  it("splits dateRange field into Start/End", () => {
    const result = parseSearchParams({
      lastModified: "[2026-01-01T00:00:00Z,2026-08-01T00:00:00Z]",
    });
    expect(result.lastModifiedStart).toBe("2026-01-01T00:00");
    expect(result.lastModifiedEnd).toBe("2026-08-01T00:00");
  });

  it("excludes apiOnly params (sort is not in SearchFormValues)", () => {
    const result = parseSearchParams({ sort: "startDateTime.asc" });
    expect(Object.keys(result)).not.toContain("sort");
  });
});

describe("buildSearchParams", () => {
  it("includes non-empty string fields", () => {
    expect(buildSearchParams({ title: "Dragons" }).title).toBe("Dragons");
  });

  it("omits empty string fields", () => {
    expect(buildSearchParams({ title: "" })).not.toHaveProperty("title");
  });

  it("encodes range fields as [min,max]", () => {
    expect(buildSearchParams({ minPlayersMin: "2", minPlayersMax: "6" }).minPlayers).toBe("[2,6]");
  });

  it("encodes partial range with empty side", () => {
    expect(buildSearchParams({ minPlayersMin: "2" }).minPlayers).toBe("[2,]");
  });

  it("omits range when both sides absent", () => {
    expect(buildSearchParams({})).not.toHaveProperty("minPlayers");
  });

  it("encodes dateRange field with :00Z suffix", () => {
    expect(
      buildSearchParams({
        lastModifiedStart: "2026-01-01T00:00",
        lastModifiedEnd: "2026-08-01T00:00",
      }).lastModified,
    ).toBe("[2026-01-01T00:00:00Z,2026-08-01T00:00:00Z]");
  });
});
```

- [ ] **Step 2: Run to confirm RED**

```bash
npx vitest run src/utils/searchParamSchema.test.ts
```

Expected: fails with `Cannot find module './searchParamSchema'`

---

### Task 2: Implement `src/utils/searchParamSchema.ts`

**Files:**

- Create: `src/utils/searchParamSchema.ts`

- [ ] **Step 1: Create `src/utils/searchParamSchema.ts`**

```typescript
export const SCHEMA = {
  // Pagination
  limit: "number",
  page: "number",

  // API-computed — present in SearchParams but never touch the form
  startDateTime: "apiOnly",
  endDateTime: "apiOnly",
  sort: "apiOnly",

  // Simple string passthroughs
  filter: "string",
  gameId: "string",
  title: "string",
  eventType: "string",
  group: "string",
  shortDescription: "string",
  longDescription: "string",
  gameSystem: "string",
  rulesEdition: "string",
  ageRequired: "string",
  experienceRequired: "string",
  materialsProvided: "string",
  materialsRequired: "string",
  materialsRequiredDetails: "string",
  gmNames: "string",
  website: "string",
  email: "string",
  tournament: "string",
  attendeeRegistration: "string",
  location: "string",
  roomName: "string",
  tableNumber: "string",
  specialCategory: "string",
  days: "string",
  timeStart: "string",
  timeEnd: "string",

  // Range fields — encoded as "[min,max]" in the URL
  minPlayers: "range",
  maxPlayers: "range",
  duration: "range",
  roundNumber: "range",
  totalRounds: "range",
  minimumPlayTime: "range",
  cost: "range",
  ticketsAvailable: "range",

  // Date range — encoded as "[isoStart,isoEnd]" in the URL
  lastModified: "dateRange",
} as const satisfies Record<string, "string" | "number" | "range" | "dateRange" | "apiOnly">;

type Schema = typeof SCHEMA;
type SchemaKey = keyof Schema;

/** URL search params — map directly to API query params. Ranges encoded as "[min,max]". */
export type SearchParams = {
  [K in SchemaKey]?: Schema[K] extends "number" ? number : string;
};

type FormKey<K extends SchemaKey> = Schema[K] extends "range"
  ? `${K}Min` | `${K}Max`
  : Schema[K] extends "dateRange"
    ? `${K}Start` | `${K}End`
    : Schema[K] extends "apiOnly" | "number"
      ? never
      : K;

/** React Hook Form values — ranges split into min/max fields. */
export type SearchFormValues = {
  [K in SchemaKey as FormKey<K>]?: string;
};

function parseRange(val: string | undefined): {
  min: string | undefined;
  max: string | undefined;
} {
  const match = val?.match(/^\[([^,]*),([^\]]*)\]$/);
  return match ? { min: match[1], max: match[2] } : { min: undefined, max: undefined };
}

function parseDateRange(val: string | undefined): {
  start: string | undefined;
  end: string | undefined;
} {
  const match = val?.match(/^\[([^,]*),([^\]]*)\]$/);
  if (!match) return { start: undefined, end: undefined };
  return {
    start: match[1] ? match[1].replace(/:00Z$/, "") : "",
    end: match[2] ? match[2].replace(/:00Z$/, "") : "",
  };
}

export function coerceSearchParams(raw: Record<string, unknown>): SearchParams {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(SCHEMA) as SchemaKey[]) {
    const val = raw[key];
    if (SCHEMA[key] === "number") {
      if (typeof val === "number") result[key] = val;
    } else {
      if (typeof val === "string") result[key] = val;
    }
  }
  return result as SearchParams;
}

export function parseSearchParams(params: SearchParams): SearchFormValues {
  const p = params as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(SCHEMA) as SchemaKey[]) {
    const kind = SCHEMA[key];
    const val = p[key] as string | undefined;
    if (kind === "string") {
      result[key] = val;
    } else if (kind === "range") {
      const { min, max } = parseRange(val);
      result[`${key}Min`] = val ? min : undefined;
      result[`${key}Max`] = val ? max : undefined;
    } else if (kind === "dateRange") {
      const { start, end } = parseDateRange(val);
      result[`${key}Start`] = val ? start : undefined;
      result[`${key}End`] = val ? end : undefined;
    }
    // 'number' and 'apiOnly' have no form fields — skip
  }
  return result as SearchFormValues;
}

export function buildSearchParams(values: SearchFormValues): SearchParams {
  const v = values as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(SCHEMA) as SchemaKey[]) {
    const kind = SCHEMA[key];
    if (kind === "string") {
      const val = v[key] as string | undefined;
      if (val) result[key] = val;
    } else if (kind === "range") {
      const min = v[`${key}Min`] as string | undefined;
      const max = v[`${key}Max`] as string | undefined;
      if (min || max) result[key] = `[${min ?? ""},${max ?? ""}]`;
    } else if (kind === "dateRange") {
      const start = v[`${key}Start`] as string | undefined;
      const end = v[`${key}End`] as string | undefined;
      if (start || end) result[key] = `[${start ? `${start}:00Z` : ""},${end ? `${end}:00Z` : ""}]`;
    }
    // 'number' and 'apiOnly' are set externally (handleNavigate / handleSort)
  }
  return result as SearchParams;
}
```

- [ ] **Step 2: Run `searchParamSchema.test.ts` to confirm GREEN**

```bash
npx vitest run src/utils/searchParamSchema.test.ts
```

Expected: all tests pass.

- [ ] **Step 3: Run the full test suite to confirm nothing is broken**

```bash
npm test
```

Expected: all tests pass (existing files still import from their original locations).

- [ ] **Step 4: Commit**

```bash
git add src/utils/searchParamSchema.ts src/utils/searchParamSchema.test.ts
git commit -m "feat: add searchParamSchema — single source of truth for URL params"
```

---

### Task 3: Migrate `coerceSearchParams.test.ts`, delete `coerceSearchParams.ts`

**Files:**

- Modify: `src/utils/coerceSearchParams.test.ts` (import only)
- Delete: `src/utils/coerceSearchParams.ts`

- [ ] **Step 1: Update the import in `src/utils/coerceSearchParams.test.ts`**

Change line 2 from:

```typescript
import { coerceSearchParams } from "./coerceSearchParams";
```

to:

```typescript
import { coerceSearchParams } from "./searchParamSchema";
```

- [ ] **Step 2: Delete `src/utils/coerceSearchParams.ts`**

```bash
rm src/utils/coerceSearchParams.ts
```

- [ ] **Step 3: Run the coerce test file to confirm GREEN**

```bash
npx vitest run src/utils/coerceSearchParams.test.ts
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/utils/coerceSearchParams.test.ts
git rm src/utils/coerceSearchParams.ts
git commit -m "refactor: migrate coerceSearchParams to searchParamSchema, delete old file"
```

---

### Task 4: Migrate `searchParams.test.ts`, strip functions from `searchParams.ts`

`searchParams.ts` currently exports `buildSearchParams` and `parseSearchParams` in addition to the day/time utilities. Both functions move to `searchParamSchema.ts`; the test file updates its import source.

**Files:**

- Modify: `src/utils/searchParams.test.ts` (imports only)
- Modify: `src/utils/searchParams.ts` (delete two functions)

- [ ] **Step 1: Update imports in `src/utils/searchParams.test.ts`**

The top of the file currently reads:

```typescript
import { expect, describe, it } from "vitest";
import {
  buildSearchParams,
  daysAndTimeToStartDateTime,
  GEN_CON_YEAR,
  parseSearchParams,
  decodeDays,
  encodeDays,
} from "./searchParams";
```

Change to:

```typescript
import { expect, describe, it } from "vitest";
import { daysAndTimeToStartDateTime, GEN_CON_YEAR, decodeDays, encodeDays } from "./searchParams";
import { buildSearchParams, parseSearchParams } from "./searchParamSchema";
```

- [ ] **Step 2: Delete `buildSearchParams` and `parseSearchParams` from `src/utils/searchParams.ts`**

Remove the `export function buildSearchParams` and `export function parseSearchParams` declarations and their full bodies. Also remove the now-unused `import type { SearchFormValues, SearchParams } from "./types"` line (line 2). The resulting file is:

```typescript
import { parseCSV } from "./parseCSV";

// Update this each year once new event data is loaded. Gen Con always runs Wed–Sun in late July/early August.
export const GEN_CON_YEAR = 2026;

function genConWednesday(year: number): Date {
  const aug1 = new Date(year, 7, 1);
  const daysBack = (aug1.getDay() - 3 + 7) % 7;
  return new Date(year, 7, 1 - daysBack);
}

function offsetDateTime(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}T00:00:00-04:00`;
}

const wed = genConWednesday(GEN_CON_YEAR);
export const DAY_DATES: Record<string, { start: string; end: string }> = {
  wed: { start: offsetDateTime(wed, 0), end: offsetDateTime(wed, 1) },
  thu: { start: offsetDateTime(wed, 1), end: offsetDateTime(wed, 2) },
  fri: { start: offsetDateTime(wed, 2), end: offsetDateTime(wed, 3) },
  sat: { start: offsetDateTime(wed, 3), end: offsetDateTime(wed, 4) },
  sun: { start: offsetDateTime(wed, 4), end: offsetDateTime(wed, 5) },
};

/**
 * Convert day codes (e.g. "thu,fri") and optional HH:MM time bounds into the
 * bracket-range syntax the API expects for startDateTime.
 *
 * When timeStart/timeEnd are provided, each selected day gets a time-windowed
 * range: [2026-07-30T09:00:00-04:00,2026-07-30T17:00:00-04:00]
 * When omitted, each day gets its full midnight-to-midnight range.
 */
export function daysAndTimeToStartDateTime(
  days: string,
  timeStart?: string,
  timeEnd?: string,
): string | undefined {
  const dayList = days.split(",").filter((d) => DAY_DATES[d]);
  if (dayList.length === 0) {
    return undefined;
  }

  const ranges = dayList.map((d) => {
    const dayDate = DAY_DATES[d].start.substring(0, 10); // "2024-08-01"
    const start = timeStart ? `${dayDate}T${timeStart}:00-04:00` : DAY_DATES[d].start;
    const end = timeEnd ? `${dayDate}T${timeEnd}:00-04:00` : DAY_DATES[d].end;
    return `[${start},${end}]`;
  });

  return ranges.join(",");
}

export function decodeDays(str?: string): string[] {
  return parseCSV(str);
}

export function encodeDays(days: string[]): string {
  return days.join(",");
}
```

- [ ] **Step 3: Run the searchParams test file to confirm GREEN**

```bash
npx vitest run src/utils/searchParams.test.ts
```

Expected: all tests pass.

- [ ] **Step 4: Run the full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/searchParams.test.ts src/utils/searchParams.ts
git commit -m "refactor: move buildSearchParams/parseSearchParams to searchParamSchema"
```

---

### Task 5: Remove types from `types.ts`, update all import sites

`SearchParams` and `SearchFormValues` are still declared in `types.ts`. Removing them will cause TypeScript errors in every file that imports them from there. Fix all import sites in one pass, then verify.

**Files:**

- Modify: `src/utils/types.ts`
- Modify: `src/utils/api.ts`
- Modify: `src/utils/filterChangelogEvents.ts`
- Modify: `src/routes/index.tsx`
- Modify: `src/test/renderRoute.tsx`
- Modify: `src/components/ActiveFilters/ActiveFilters.tsx`
- Modify: `src/components/ActiveFilters/getActiveFilters.ts`
- Modify: `src/components/SearchResults/SearchResults.tsx`
- Modify: `src/components/SearchResults/SearchResults.test.tsx`
- Modify: `src/components/SearchForm/SearchForm.tsx`
- Modify: `src/components/SearchForm/SearchForm.test.tsx`
- Modify: `src/components/ChangelogPage/ChangelogEntryPanel.tsx`
- Modify: `src/components/ChangelogPage/ChangelogEntryPanel.test.tsx`
- Modify: `src/components/ChangelogPage/ChangelogPage.tsx`
- Modify: `src/components/ChangelogPage/ChangelogRow.tsx`
- Modify: `src/components/ChangelogPage/ChangelogRow.test.tsx`

- [ ] **Step 1: Remove `SearchParams` and `SearchFormValues` from `src/utils/types.ts`**

Delete the two interface blocks — the `export interface SearchParams { ... }` declaration and its preceding doc-comment (`/** URL search params...`), and the `export interface SearchFormValues { ... }` declaration and its preceding doc-comment (`/** React Hook Form values...`). Both are in the middle of the file; the surrounding interfaces (`EventAttributes`, `Event`, `EventSearchResponse`, `ChangelogSummary`, etc.) stay untouched.

- [ ] **Step 2: Update `src/utils/api.ts`**

Current import block:

```typescript
import type {
  EventSearchResponse,
  SearchParams,
  ListChangelogsResponse,
  FetchChangelogResponse,
  ChangelogEntry,
  ChangelogSummary,
  GameSystemFacet,
  GameSystemFacetsResponse,
} from "./types";
```

Replace with:

```typescript
import type { SearchParams } from "./searchParamSchema";
import type {
  EventSearchResponse,
  ListChangelogsResponse,
  FetchChangelogResponse,
  ChangelogEntry,
  ChangelogSummary,
  GameSystemFacet,
  GameSystemFacetsResponse,
} from "./types";
```

- [ ] **Step 3: Update `src/utils/filterChangelogEvents.ts`**

Current:

```typescript
import type { Event, SearchFormValues } from "./types";
```

Replace with:

```typescript
import type { SearchFormValues } from "./searchParamSchema";
import type { Event } from "./types";
```

- [ ] **Step 4: Update `src/routes/index.tsx`**

Replace these three import lines:

```typescript
import { buildSearchParams, parseSearchParams } from "../utils/searchParams";
import { coerceSearchParams } from "../utils/coerceSearchParams";
import type { SearchFormValues, SearchParams } from "../utils/types";
```

With one:

```typescript
import {
  buildSearchParams,
  parseSearchParams,
  coerceSearchParams,
  type SearchFormValues,
  type SearchParams,
} from "../utils/searchParamSchema";
```

- [ ] **Step 5: Update `src/test/renderRoute.tsx`**

Current:

```typescript
import type { SearchParams } from "../utils/types";
```

Replace with:

```typescript
import type { SearchParams } from "../utils/searchParamSchema";
```

- [ ] **Step 6: Update `src/components/ActiveFilters/ActiveFilters.tsx`**

Current:

```typescript
import type { SearchParams } from "../../utils/types";
```

Replace with:

```typescript
import type { SearchParams } from "../../utils/searchParamSchema";
```

- [ ] **Step 7: Update `src/components/ActiveFilters/getActiveFilters.ts`**

Current:

```typescript
import type { SearchParams } from "../../utils/types";
```

Replace with:

```typescript
import type { SearchParams } from "../../utils/searchParamSchema";
```

- [ ] **Step 8: Update `src/components/SearchResults/SearchResults.tsx`**

Current:

```typescript
import type { SearchParams } from "../../utils/types";
```

Replace with:

```typescript
import type { SearchParams } from "../../utils/searchParamSchema";
```

- [ ] **Step 9: Update `src/components/SearchResults/SearchResults.test.tsx`**

Current:

```typescript
import type { SearchParams, EventSearchResponse } from "../../utils/types";
```

Replace with:

```typescript
import type { EventSearchResponse } from "../../utils/types";
import type { SearchParams } from "../../utils/searchParamSchema";
```

- [ ] **Step 10: Update `src/components/SearchForm/SearchForm.tsx`**

Current:

```typescript
import type { SearchFormValues } from "../../utils/types";
```

Replace with:

```typescript
import type { SearchFormValues } from "../../utils/searchParamSchema";
```

- [ ] **Step 11: Update `src/components/SearchForm/SearchForm.test.tsx`**

Current:

```typescript
import type { SearchFormValues } from "../../utils/types";
```

Replace with:

```typescript
import type { SearchFormValues } from "../../utils/searchParamSchema";
```

- [ ] **Step 12: Update `src/components/ChangelogPage/ChangelogEntryPanel.tsx`**

Current:

```typescript
import type { ChangelogEntry, Event, SearchFormValues, SortState } from "../../utils/types";
```

Replace with:

```typescript
import type { SearchFormValues } from "../../utils/searchParamSchema";
import type { ChangelogEntry, Event, SortState } from "../../utils/types";
```

- [ ] **Step 13: Update `src/components/ChangelogPage/ChangelogEntryPanel.test.tsx`**

Current:

```typescript
import type { ChangelogEntry, SearchFormValues } from "../../utils/types";
```

Replace with:

```typescript
import type { SearchFormValues } from "../../utils/searchParamSchema";
import type { ChangelogEntry } from "../../utils/types";
```

- [ ] **Step 14: Update `src/components/ChangelogPage/ChangelogPage.tsx`**

Current:

```typescript
import type { SearchFormValues } from "../../utils/types";
```

Replace with:

```typescript
import type { SearchFormValues } from "../../utils/searchParamSchema";
```

- [ ] **Step 15: Update `src/components/ChangelogPage/ChangelogRow.tsx`**

Current:

```typescript
import type { ChangelogEntry, ChangelogSummary, SearchFormValues } from "../../utils/types";
```

Replace with:

```typescript
import type { SearchFormValues } from "../../utils/searchParamSchema";
import type { ChangelogEntry, ChangelogSummary } from "../../utils/types";
```

- [ ] **Step 16: Update `src/components/ChangelogPage/ChangelogRow.test.tsx`**

Current:

```typescript
import type { FetchChangelogResponse, SearchFormValues, ChangelogSummary } from "../../utils/types";
```

Replace with:

```typescript
import type { SearchFormValues } from "../../utils/searchParamSchema";
import type { FetchChangelogResponse, ChangelogSummary } from "../../utils/types";
```

- [ ] **Step 17: Run the full test suite**

```bash
npm test
```

Expected: all tests pass. TypeScript should also compile cleanly — if there are TS errors that vitest surfaces, fix each one by checking the import path.

- [ ] **Step 18: Commit**

```bash
git add \
  src/utils/types.ts \
  src/utils/api.ts \
  src/utils/filterChangelogEvents.ts \
  src/routes/index.tsx \
  src/test/renderRoute.tsx \
  src/components/ActiveFilters/ActiveFilters.tsx \
  src/components/ActiveFilters/getActiveFilters.ts \
  src/components/SearchResults/SearchResults.tsx \
  src/components/SearchResults/SearchResults.test.tsx \
  src/components/SearchForm/SearchForm.tsx \
  src/components/SearchForm/SearchForm.test.tsx \
  src/components/ChangelogPage/ChangelogEntryPanel.tsx \
  src/components/ChangelogPage/ChangelogEntryPanel.test.tsx \
  src/components/ChangelogPage/ChangelogPage.tsx \
  src/components/ChangelogPage/ChangelogRow.tsx \
  src/components/ChangelogPage/ChangelogRow.test.tsx
git commit -m "refactor: migrate SearchParams/SearchFormValues to searchParamSchema, update all imports"
```

---

### Verification

After all tasks complete:

- `src/utils/searchParamSchema.ts` is the only place any `SearchParams` key is declared
- `src/utils/coerceSearchParams.ts` does not exist
- `src/utils/types.ts` contains no `SearchParams` or `SearchFormValues` declaration
- `src/utils/searchParams.ts` contains no `buildSearchParams` or `parseSearchParams`
- Adding a new param requires exactly one line: `newParam: 'string'` in `SCHEMA`
- `npm test` passes in full
