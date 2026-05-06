# Changelog Sort URL Persistence

**Date:** 2026-05-06
**Issue:** [#24 — Changelog event table sorting does not function](https://github.com/myasonik/Gen-Con-Buddy/issues/24)

## Problem

Clicking column headers in an expanded changelog group (Created / Updated / Deleted) has no visible effect. The sort indicator never appears and rows don't reorder.

**Root cause:** `EventTable` supports two sort modes — external (via `onSort` prop, used in search results) and internal (no `onSort`, used in changelog). The internal path delegates to TanStack Table's `getSortedRowModel`, but every column in `COLUMNS` is a display column (only `id` + `cell`, no `accessorKey`/`accessorFn`). TanStack Table cannot extract a comparable value from each row, so sort state updates but rows stay in their original order.

Rather than only fixing the internal sort, we extend the fix to also persist sort state in the URL — so that refresh, back-button, and link-sharing all preserve the user's chosen sort.

## Approach

Add a `sort` search param to the changelog route (array of strings, analogous to `open`). `ChangelogEntryPanel` reads the sort state per group from the URL, sorts the events array client-side before rendering, and writes back whenever the user clicks a header. This uses `EventTable`'s existing external sort path (`onSort` / `activeSortField` / `activeSortDir`) — no changes to `EventTable.tsx`.

## URL Format

A new `sort` param, an array of strings. Each string encodes one group's sort state:

```
{position}.{group}.{field}.{dir}
```

Examples:
- `?sort=2.created.gameId.asc`
- `?sort=2.created.startDateTime.desc&sort=3.deleted.title.asc`

`field` is a key of `Event["attributes"]` (matching the existing `sortField` values in `columns.tsx`). `dir` is `asc` or `desc`. Malformed entries are silently dropped on parse.

When a group is closed, its sort entry is removed from the URL at the same time its open entry is removed.

## New Files

### `src/components/ChangelogPage/sortParam.ts`

Mirrors `openParam.ts`.

```typescript
export type SortMap = Map<number, Map<string, { field: string; dir: "asc" | "desc" }>>;

export function parseSortParam(values: string[]): SortMap
export function serializeSortParam(map: SortMap): string[]
```

`parseSortParam` splits each value on `.`, validates position (positive integer), group (non-empty string), field (non-empty string), and dir (`asc` | `desc`). Silently drops invalid entries. Stable output from `serializeSortParam` (sorted by position, then group).

### `src/utils/sortEvents.ts`

```typescript
export function sortEvents(
  events: Event[],
  field: string,
  dir: "asc" | "desc",
): Event[]
```

- Treats `typeof value === "number"` fields as numeric; everything else via `String(val).localeCompare(...)`.
- ISO date strings sort correctly lexicographically via `localeCompare`.
- Never mutates the input array.
- Null/undefined values coerce to `""` / `0` for comparison.

## Changed Files

### `src/routes/changelog.tsx`

Add `sort` to `validateSearch` using the same inline coercion pattern already used for `open` (no shared helper needed — just duplicate the three-branch `Array.isArray` / single-value / empty-array logic):

```typescript
validateSearch: (search: Record<string, unknown>) => {
  // ... existing open coercion ...
  const rawSort = search.sort;
  let sort: string[];
  if (Array.isArray(rawSort)) {
    sort = rawSort.map(String);
  } else if (rawSort !== undefined && rawSort !== null) {
    sort = [String(rawSort)];
  } else {
    sort = [];
  }
  return { open, sort };
}
```

Pass `sortParam={sort}` to `ChangelogPage` in the route component.

### `src/components/ChangelogPage/ChangelogPage.tsx`

Accept and thread `sortParam: string[]` (default `[]`) down to each `ChangelogEntryPanel`. No logic changes.

### `src/components/ChangelogPage/ChangelogEntryPanel.tsx`

Accept `sortParam?: string[]` (default `[]`).

**Reading:** `parseSortParam(sortParam).get(position)?.get(group)` → `{ field, dir } | undefined` per group.

**Writing:** New `syncGroupSortToUrl(group, sort)` function parallel to `syncGroupToUrl`:
- Parses current `sortParam` into a `SortMap`.
- Sets or deletes the entry for `(position, group)`.
- Calls `navigate({ search: (prev) => ({ ...prev, sort: serializeSortParam(newMap) }), replace: true })` inside `startTransition`.

The `onSort` callback passed to `EventGroup`/`EventTable` wraps this:
- When `onSort(s: string)` is called (e.g. `"gameId.asc"`), parse `field` and `dir` from the string and call `syncGroupSortToUrl(group, { field, dir })`.
- When `onSort(undefined)` is called (user cleared sort), call `syncGroupSortToUrl(group, undefined)`.

**Clearing on close:** When `syncGroupToUrl` is called with `nowOpen: false`, also call `syncGroupSortToUrl(group, undefined)`.

**Sorting data:** Before rendering each `EventGroup`, sort the events array if sort state exists for that group:
```typescript
const sort = sortGroups.get("created");
const events = sort ? sortEvents(entry.createdEvents, sort.field, sort.dir) : entry.createdEvents;
```

### `src/components/ChangelogPage/ChangelogEntryPanel.tsx` — `EventGroup`

Add optional props: `activeSortField?: string`, `activeSortDir?: "asc" | "desc"`, `onSort?: (sort: string | undefined) => void`. Pass them through to `EventTable`. No default sort indicator shown when props are absent.

## Testing

### `src/components/ChangelogPage/sortParam.test.ts` (new)

- Round-trips through parse → serialize.
- Drops entries with bad position, unknown dir, empty field.
- Empty input → empty map.
- Multiple positions and groups serialize in stable order.

### `src/utils/sortEvents.test.ts` (new)

- Sorts string field ascending and descending.
- Sorts numeric field numerically (not lexicographically).
- Sorts ISO date string field correctly.
- Null/undefined field values sort stably.
- Does not mutate the original array.

### `src/components/ChangelogPage/ChangelogEntryPanel.test.tsx` (extend)

- Clicking a sortable header writes the correct `sort` param to the URL.
- Clicking the same header again flips direction.
- Clicking a third time clears sort (removes from URL).
- Closing a group removes its sort entry from the URL.
- A `sortParam` on mount pre-sorts the visible rows.

### `src/routes/changelog.test.tsx` (extend)

- `sort` param survives round-trip through `validateSearch`.
- URL with both `open` and `sort` renders the correct sorted row order.

## Out of Scope

- Fixing `accessorFn` on `COLUMNS` for internal sort: not needed for this feature, and should be a separate cleanup.
- Persisting sort for the search results table: that already uses server-side sort via `onSort`.
- Sort state for the mobile list view (`EventListMobile`): it has no column headers, so sort is not user-controllable there.
