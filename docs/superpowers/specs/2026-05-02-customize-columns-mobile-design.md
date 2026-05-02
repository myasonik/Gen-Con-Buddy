# Customize Columns — Mobile Support

**Date:** 2026-05-02

## Problem

`ColumnControlsPanel` (the "Customize columns" UI) is always rendered but its changes only affect `EventTable`. `EventListMobile` hardcodes exactly the same fields regardless of column state. Column customization is effectively a no-op on mobile.

## Approach

`ColumnControlsPanel` gains a `variant` prop. `SearchResults` places each variant inside the appropriate view div, letting the existing CSS breakpoint switching handle which is visible. `EventListMobile` gains a `visibility` prop and renders all columns conditionally.

## Architecture

`SearchResults` moves `ColumnControlsPanel` into each view's existing div:

- Inside `.tableView`: `<ColumnControlsPanel variant="inline" columnState={sharedColumnState} />` — hidden on mobile by existing CSS.
- Inside `.mobileView`: `<ColumnControlsPanel variant="drawer" columnState={sharedColumnState} />` — hidden on desktop by existing CSS.

Both instances share the same `sharedColumnState`, so a change in one is immediately reflected in the other. No JS viewport detection is needed — the existing CSS switching pattern handles it.

`EventListMobile` receives `visibility={sharedColumnState.visibility}`.

## `ColumnControlsPanel` changes

A `variant: "inline" | "drawer"` prop is added, defaulting to `"inline"`.

- **`"inline"`**: current `<AnimatedDetails>` collapsible. Zero changes to this code path.
- **`"drawer"`**: renders a "Customize columns" button that opens a Base UI `Dialog` drawer — same slide-in-from-left pattern as the filters drawer (same CSS variables, same backdrop, same transition).

The checkbox group content is extracted into an internal component so both variants render it without repeating JSX.

## `EventListMobile` changes

All columns follow identical visibility logic: render the field if `visibility[columnId] !== false`, hide it otherwise. No column is excluded or hardcoded as always-on — including title.

Visual grouping (e.g. day + start + end time on one line) is allowed as a presentational optimization, but each column in the group is checked independently. Partial group visibility always renders what is available — it never silently drops a field because a sibling in the group is off.

If `visibility` is not passed (e.g. `ChangelogEntryPanel`), the component falls back to the same defaults defined in `useColumnVisibility` — the columns that are visible on a fresh load — so existing behaviour is preserved without regression.

## Testing

**`ColumnControlsPanel`:**

- `variant="inline"`: extend existing collapsible tests. No media query mocking.
- `variant="drawer"`: dialog opens on button click; checkboxes are present and functional; close button dismisses. No media query mocking.

**`EventListMobile`:**

- Each column shows when visible and hides when `visibility[id] = false`.
- Partial-group scenarios: e.g. `day: true, startDateTime: false` renders only the day.
- No `visibility` prop passed: all default-visible columns appear (backwards-compatibility for `ChangelogEntryPanel`).

## Out of scope

- Column sizing (resize handles) on mobile — not applicable to a list layout.
- Any changes to `ChangelogEntryPanel` — it passes no column state and the fallback handles it.
- Reordering columns on mobile.
