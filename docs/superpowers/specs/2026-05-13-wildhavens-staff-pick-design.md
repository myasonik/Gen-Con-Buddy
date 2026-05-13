# Wildhavens Staff Pick Design Spec

**Date:** 2026-05-13
**Status:** Approved

## Overview

Highlight seven specific Wildhavens events as staff picks in Gen Con Buddy. Two surfaces are affected: (1) matching rows in search results get an accent background and a "Staff Pick" badge; (2) when a search returns zero results, a Wildhavens callout appears below the empty state showing the 7 events in the standard table format.

The implementation is hardcoded — no config system, no generalizable "staff picks" abstraction. If the featured events change, the constant is edited directly.

---

## 1. Data Layer

**`src/utils/staffPicks.ts`** — new file, two exports:

```ts
export const WILDHAVENS_GAME_IDS: ReadonlyArray<string> = [
  "BGM26ND310303",
  "BGM26ND310286",
  "BGM26ND310299",
  "BGM26ND310301",
  "BGM26ND310296",
  "BGM26ND310298",
  "BGM26ND310302",
] as const;

export const STAFF_PICK_IDS: ReadonlySet<string> = new Set(WILDHAVENS_GAME_IDS);
```

`STAFF_PICK_IDS` is used for O(1) row-highlight lookups. `WILDHAVENS_GAME_IDS` is used by the callout to construct the API fetch. No titles are hardcoded — events are always fetched live.

---

## 2. Row Treatment

### `src/components/EventTable/columns.tsx` — title cell

The title column cell wraps the existing link in a `<span>` and prepends a badge when the event is a staff pick:

```tsx
cell: ({ row, linkState }) => {
  const { gameId, title } = row.original.attributes;
  const isStaffPick = STAFF_PICK_IDS.has(gameId);
  return (
    <span className={styles.titleCell}>
      {isStaffPick && <Chip tone="accent" size="sm">Staff Pick</Chip>}
      <Link to="/event/$id" params={{ id: gameId }} state={linkState}>{title}</Link>
    </span>
  );
}
```

`styles.titleCell` is a new CSS Modules rule: `display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap;`.

### `src/components/EventTable/EventTable.tsx` — row background

The `<tr>` receives `data-staff-pick` (attribute present = staff pick, absent = not):

```tsx
<tr
  key={row.id}
  data-staff-pick={STAFF_PICK_IDS.has(row.original.attributes.gameId) || undefined}
>
```

In `EventTable.module.css`:

```css
.tableWrapper tbody tr[data-staff-pick] td {
  background: var(--color-accent-surface);
}
```

### `src/components/EventTable/EventListMobile.tsx` — mobile cards

Each list item `<li>` receives `data-staff-pick` on the same condition. A `<Chip tone="accent" size="sm">Staff Pick</Chip>` is rendered alongside the title. The card background is styled in `EventListMobile.module.css`:

```css
.card[data-staff-pick] {
  background: var(--color-accent-surface);
}
```

---

## 3. Empty State Callout

### New component: `src/components/WildhavensCallout/`

`WildhavensCallout.tsx` — a self-contained panel that fetches the 7 events and renders them in the standard table format.

**Data fetching:** Use React Query with `fetchEvents({ group: "Wildhavens", limit: 10 })`. The group name "Wildhavens" must be verified against the live API before implementation. If the API does not support a clean group filter for these events, fall back to `useQueries` — one `fetchEvents({ gameId, limit: 1 })` per ID — and merge the results into a single `Event[]`.

**States:**
- Loading: `<EmptyState variant="loading" text="LOADING STAFF PICKS…" />`
- Error: render nothing (fail silently — this is a secondary surface)
- Success with data: render the panel
- Success with empty data: render nothing (events may not be live yet)

**Panel structure:**

```
┌─ accent-surface background, accent-border border ──────────────┐
│  [heading: "Staff Picks" — font-slab]                          │
│  [subtext: "Our picks for best new publisher at Gen Con 2026"] │
│  [VisibilityDrawer] [SortDrawer]                               │
│  [EventTable or EventListMobile with the 7 events]             │
└────────────────────────────────────────────────────────────────┘
```

The table inside the panel is the unmodified `EventTable` / `EventListMobile`. Row highlighting from Section 2 applies automatically since all 7 events are in `STAFF_PICK_IDS`.

The `WildhavensCallout` uses the same `useMediaQuery("(width <= 60rem)")` breakpoint as `SearchResults` to decide which table variant to render. Column state (`useSharedColumnState`) is instantiated locally within the callout — it does not share state with the main search results table.

Sort and visibility controls are rendered above the table using the same `VisibilityDrawer` and `SortDrawer` components used in `SearchResults`. Sort state is local to the callout (managed via `useSortState`) — it does not affect URL params. No pagination is rendered (7 events, all shown at once). The `FormatDrawer` is omitted — format preferences are inherited from the local column state defaults.

### `src/components/SearchResults/SearchResults.tsx` — integration

```tsx
{data && data.data.length === 0 && (
  <>
    <EmptyState variant="empty" text="NO QUESTS FOUND" subtext="Try broadening your search." />
    <WildhavensCallout />
  </>
)}
```

No other changes to `SearchResults`.

---

## 4. Testing

All new code is test-first (TDD). Key test surfaces:

- **`staffPicks.ts`**: `STAFF_PICK_IDS` contains exactly the 7 expected IDs; `WILDHAVENS_GAME_IDS` has no duplicates.
- **`columns.tsx`**: staff pick rows render the badge; non-staff-pick rows do not.
- **`EventTable.tsx`**: staff pick rows have `data-staff-pick` attribute; non-staff-pick rows do not.
- **`EventListMobile.tsx`**: same attribute and badge assertions.
- **`WildhavensCallout.tsx`**: renders panel when fetch succeeds with data; renders nothing on error; renders nothing when fetch returns 0 events; renders loading state while fetching; VisibilityDrawer and SortDrawer are present when data loads; sort does not change URL params.
- **`SearchResults.tsx`**: `WildhavensCallout` appears when results are empty; does not appear when results are non-empty or loading.

MSW handlers for the Wildhavens fetch live in `src/test/msw/` as a named handler, overridable per-test.
