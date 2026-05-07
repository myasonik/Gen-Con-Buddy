# Search Sort URL Persistence and Cross-Page Unification

**Date:** 2026-05-06

## Problem

The search page has a bug: when the user submits a new search via the form, `handleSearch` rebuilds the URL using `buildSearchParams`, which does not include `sort`. The `sort` param is therefore dropped on every re-search, even though clicking a column header correctly writes it to the URL and pagination preserves it.

The changelog page recently received URL-persisted sort. In doing that work, several utilities were created or identified that should be shared across both pages but currently aren't:

- `SortState` is defined in a changelog-specific module (`openParam.ts`) even though it's the common vocabulary for all sort machinery.
- The `"field.dir"` string parse-and-validate pattern is duplicated verbatim in three production files.
- `SearchResults` and `ChangelogPage` contain byte-for-byte identical 20-line column state composition blocks that ADR 003 itself acknowledges as duplicated.

## Changes

### 1. Move `SortState` to `src/utils/types.ts`

`SortState` (`{ field: string; dir: "asc" | "desc" }`) moves from `src/components/ChangelogPage/openParam.ts` to `src/utils/types.ts`. It is the shared vocabulary of both pages' sort machinery and should not live in a changelog-specific module.

`openParam.ts` imports `SortState` from `../../utils/types`. `ChangelogEntryPanel.tsx` imports it from `../../utils/types` instead of `./openParam`.

No behavioral change.

### 2. New `src/utils/parseSortString.ts`

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

Replaces the identical split-validate pattern in:

- `SearchResults.tsx` — inline parse of `searchParams.sort` into `activeSortField`/`activeSortDir`
- `ChangelogEntryPanel.tsx` — inside `makeOnSort` where the sort string from `EventTable` is parsed back into `SortState`
- `EventTable.tsx` — inside `handlePopoverSort` where the sort string is parsed to extract field/dir for internal sorting

The MSW handler in `src/test/msw/handlers.ts` also has the same pattern but is left as-is; test infrastructure coupling to production utilities is a separate decision.

### 3. New `src/hooks/useSharedColumnState.ts`

Extracts the identical 20-line column state composition from `SearchResults.tsx` and `ChangelogPage.tsx`:

```typescript
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

Both `SearchResults` and `ChangelogPage` replace their inline composition with `const sharedColumnState = useSharedColumnState()`.

ADR 003 is updated: the "Consequences" bullet that notes inline composition at both use sites is revised to reflect the new hook.

### 4. Fix `handleSearch` in `src/routes/index.tsx`

```typescript
const handleSearch = (values: SearchFormValues): void => {
  void navigate({
    search: (prev) => ({ ...buildSearchParams(values), limit: prev.limit, sort: prev.sort }),
  });
};
```

`sort: prev.sort` is added alongside the existing `limit: prev.limit`. The sort param survives form re-submission, consistent with pagination's `handleNavigate` which already uses `...prev`.

## Testing

### `src/utils/parseSortString.test.ts` (new)

- Valid `"field.asc"` → `{ field: "field", dir: "asc" }`
- Valid `"startDateTime.desc"` → `{ field: "startDateTime", dir: "desc" }`
- Missing dir (`"field"`) → `null`
- Invalid dir (`"field.sideways"`) → `null`
- Empty string → `null`
- Extra segments (`"a.b.c"`) — the split gives `field = "a"`, `dir = "b"`, which passes; behavior is acceptable (extra parts are ignored)

### `src/routes/index.test.tsx` (extend)

- **Sort survives re-search:** render at `/?sort=startDateTime.asc`, submit the search form, verify the `sort` param is still present in the outgoing API URL.
- **URL sort → indicator:** render at `/?sort=startDateTime.asc`, wait for the table, verify the "Start" column header has `aria-sort="ascending"`.

## Out of Scope

- Updating the MSW handler to use `parseSortString`
- `serializeSortString` helper — `${field}.${dir}` is clear enough inline and appears in only two places
- Any changes to `EventTable` prop types (e.g., accepting `SortState` instead of separate `activeSortField`/`activeSortDir`) — useful but a larger refactor than this task justifies
