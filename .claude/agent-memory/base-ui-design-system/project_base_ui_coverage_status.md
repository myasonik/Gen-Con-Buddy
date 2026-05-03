---
name: Base UI primitives in active use vs. notable gaps
description: Snapshot of which @base-ui/react primitives the codebase already wraps in src/ui/ and which interactive controls still hand-roll behavior or use bare HTML (updated 2026-05-03 during 1.0 audit).
type: project
---

**In active use (wrapped in src/ui/):**

- `Button` — variants `primary`/`secondary`/`ghost`, plus `icon` and `large` size. All inline `<button>` uses route through it.
- `Popover` → `Toggletip` and `EventTable/ColumnActionsPopover`
- `Combobox` → `EventTypeSelect` (multi-select chips, but with hand-rolled focus/blur fighting Base UI — see audit)
- `Dialog` → `EventTable/ColumnResizeDialog`, `EventTable/ColumnControlsPanel` (drawer variant), `SearchForm` (drawer)
- `Field` → wraps `<label>/<input>` pairs in SearchForm via `Field` and `RangeField`
- `Select` — wraps native `<select>` (used in SearchForm and Pagination)

**Not yet wrapped (hand-rolled where Base UI exists):**

- `<details>` / `<summary>` — `AnimatedDetails` is a wrapper around native `<details>`. Used by `ColumnControlsPanel` (inline variant), `ChangelogRow`, `ChangelogEntryPanel`. Base UI `Collapsible`/`Accordion` could replace, but the native `<details>` is intentional for progressive enhancement.
- Native `<input type="checkbox">` — column visibility list, "Show icon" toggle, day-of-week filters in SearchForm. All hand-rolled with sr-only input + visible aria-hidden indicator. Base UI `Checkbox` could replace.
- Native `<input type="radio">` — type-display segmented control in `ColumnControlsPanel`. Base UI `RadioGroup` could replace.
- **No ToggleGroup / SegmentedControl primitive exists.** `SearchForm` day-of-week toggles and `ColumnControlsPanel` Code/Name/Both radios are two separate hand-rolled implementations of the same UX pattern. Base UI ships `ToggleGroup`.
- **No Drawer primitive.** Two complete drawers (`SearchForm` advanced filters, `ColumnControlsPanel` mobile variant) duplicate scaffolding (.backdrop + .drawer + .drawerHeader + .drawerScroll + .drawerFooter, plus `data-starting-style` animation hooks). Both should compose into a single `<Drawer>` wrapping `Dialog.*`.
- **No Chip primitive.** `.soldOut` is hand-rolled in 3 places (identical CSS); changelog count pills, ActiveFilters chip, EventTypeSelect chip are 4 more variations. All share radius-pill + slab-uppercase + tone surface+border but drift on padding.

**How to apply:** When adding new form controls or interactive surfaces, prefer Base UI primitives wrapped in `src/ui/`. The most valuable missing primitives in priority order: `<Chip>` (deletes ~80 lines duplicate CSS), `<Drawer>` (consolidates two drawer impls), `<SegmentedControl>` / Base UI `ToggleGroup` (consolidates day toggles + type-display radios).
