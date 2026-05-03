# ADR 003: Shared Column State as a Required Prop

**Status:** Accepted

## Context

`EventTable` needs to reflect column visibility, sizing, and event-type display preferences. The same preferences must also be readable and mutable by `ColumnControlsPanel`, which is rendered as a sibling — not a child — of `EventTable` at two distinct use sites: `SearchResults` (search page) and `ChangelogPage` (changelog). If `EventTable` owned its column state internally, sharing it with the sibling panel would require lifting state up anyway, and each use site would repeat that lifting independently.

## Decision

`sharedColumnState` is a required prop on `EventTable` (type `SharedColumnState`, defined in `src/ui/EventTable/types.ts`). `EventTable` never creates or owns its column state. The parent component always provides it. Each use site constructs the state object by composing three hooks (`useColumnVisibility`, `useColumnSizing`, `useTypeDisplay`) and passes the result to both `EventTable` and `ColumnControlsPanel`.

## Consequences

- `EventTable` cannot be used in isolation without a caller providing `sharedColumnState`. There is no standalone or self-contained mode.
- Cross-panel state sharing (between `EventTable` and `ColumnControlsPanel`) is straightforward: both receive the same object.
- Both current use sites (`SearchResults` and `ChangelogPage`) compose the state inline using the same three hooks rather than a single dedicated `useSharedColumnState` hook.
- Any future use site of `EventTable` must supply a `SharedColumnState` object.
