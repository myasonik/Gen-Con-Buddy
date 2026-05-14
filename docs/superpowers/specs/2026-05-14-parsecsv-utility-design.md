# Design: `parseCSV` Utility and Trailing-Comma Hardening

**Date:** 2026-05-14  
**Status:** Approved  
**Related todo:** `todo/hardening-02-eventtype-trailing-comma.md`

## Problem

`MultiCombobox` splits its comma-separated `value` prop with `value.split(",")` (no `.filter(Boolean)`). A trailing comma — e.g. `"RPG,"` from a hand-crafted URL — produces `["RPG", ""]`, rendering an empty chip with no label and a dangling remove button. The same gap exists in `decodeDays` in `searchParams.ts`.

The broader issue: `.split(",").filter(Boolean)` is the correct pattern but was applied inconsistently — present in `getActiveFilters.ts` and `filterChangelogEvents.ts`, absent in `MultiCombobox` and `decodeDays`. No tests exercised the edge case at the component level, so the regression surface was invisible.

## Solution

### 1. `parseCSV` utility

New file: `src/utils/parseCSV.ts`

```ts
export function parseCSV(value: string | undefined): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}
```

Handles: `undefined`, `""`, trailing comma, leading comma, double comma. One named, testable, discoverable location for this logic.

### 2. Migration targets

Replace raw `split(",")` (or `split(",").filter(Boolean)`) with `parseCSV` at four call sites:

| File | Reason |
|---|---|
| `src/ui/MultiCombobox/MultiCombobox.tsx:58` | Bug fix — renders empty chips |
| `src/utils/searchParams.ts:62` (`decodeDays`) | Bug fix — could return `[""]` |
| `src/components/ActiveFilters/getActiveFilters.ts:259` | Standardize |
| `src/utils/filterChangelogEvents.ts:26` | Standardize |

**Left alone** (domain-specific filtering beyond empty strings):
- `searchParams.ts:43` — filters by `DAY_DATES[d]`
- `filterChangelogEvents.ts:27` — filters by `d in DAY_DATES`
- `getActiveFilters.ts:268` — inner remove closure filters by `c !== code`

### 3. Tests

**`src/utils/parseCSV.test.ts`** — unit tests covering:
- `undefined` → `[]`
- `""` → `[]`
- `"RPG"` → `["RPG"]`
- `"RPG,BGM"` → `["RPG", "BGM"]`
- `"RPG,"` → `["RPG"]`
- `",RPG"` → `["RPG"]`
- `"RPG,,BGM"` → `["RPG", "BGM"]`

**`src/components/EventTypeSelect/EventTypeSelect.test.tsx`** — add one test: `value="RPG,"` renders exactly one chip remove button (no empty chip).

**`src/components/SearchForm/SearchForm.test.tsx`** — add one test: `renderSearchForm({ eventType: "RPG," })` renders exactly one remove button.

## What is not in scope

- Fixing domain-specific splits that filter by valid values (day codes, etc.)
- Normalizing at the URL/routing layer — the component-level fix is sufficient
- Changing how `onValueChange` serializes values (it already uses `join(",")` which never produces trailing commas from normal interaction)
