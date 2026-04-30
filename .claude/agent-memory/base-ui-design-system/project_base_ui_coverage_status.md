---
name: Base UI primitives in active use vs. notable gaps
description: Snapshot of which @base-ui/react primitives the codebase already wraps in src/ui/ and which interactive controls still hand-roll behavior or use bare HTML (updated 2026-04-28 after DS work).
type: project
---

**In active use (wrapped in src/ui/):**

- `Button` — variants `primary`/`secondary`/`ghost`/`icon`; all inline `<button>` uses in EventTable, ActiveFilters, ColumnActionsPopover, ColumnResizeDialog now route through it
- `Toggle` + `ToggleGroup` → `ToggleTile`/`ToggleTileGroup` (day-of-week filter)
- `Popover` → `Toggletip` and `ColumnActionsPopover`
- `Combobox` → `EventTypeSelect` (multi-select chips)
- `Dialog` → `ColumnResizeDialog`
- `Select` — wraps all `<select>` usages (4 in SearchForm, 1 in Pagination)
- `Field` / `RangeField` — wraps all `<label>/<input>` pairs in SearchForm (18 simple fields, 11 range groups)

**Remaining hand-rolled where Base UI exists:**

- Native `<details>`/`<summary>` — `EventTable` column visibility panel, `ChangelogRow`, `ChangelogEntryPanel`. Base UI ships `Collapsible` and `Accordion`. The animation is now a shared `.animates-details` global utility class rather than copy-pasted CSS, but the element is still native `<details>`.
- Plain `type="checkbox"` for column visibility list in `EventTable`. Base UI ships `Checkbox`.
- Native `<input>` still used inside `Field`/`RangeField` (Field.Control wires the label; the input itself is still native — this is correct).

**How to apply:** Select, Field, and all Button variants are now first-class. When adding new form controls, reach for `Field`/`Select` from `src/ui/`. The remaining gap is `<details>` → `Collapsible` and checkboxes → `Checkbox` if those are ever worth standardizing.
