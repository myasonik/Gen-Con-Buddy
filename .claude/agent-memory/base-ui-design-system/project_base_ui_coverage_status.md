---
name: Base UI primitives in active use vs. notable gaps
description: Snapshot of which @base-ui/react primitives the codebase already wraps in src/ui/ and which interactive controls still hand-roll behavior or use bare HTML (as of 2026-04-27).
type: project
---

**In active use (wrapped in src/ui/):**

- `Button` (Base UI button) — variants `primary`/`secondary`
- `Toggle` + `ToggleGroup` → `ToggleTile`/`ToggleTileGroup` (day-of-week filter, default multiple=true)
- `Popover` → `Toggletip` and `ColumnActionsPopover`
- `Combobox` → `EventTypeSelect` (multi-select chips)
- `Dialog` → `ColumnResizeDialog`

**Hand-rolled or native where Base UI exists:**

- Native `<select>` — used in `SearchForm` (ageRequired, experienceRequired, attendeeRegistration, specialCategory) and `Pagination` (per-page). Base UI ships `Select`. No `Select` wrapper exists in `src/ui/`.
- Native `<input>` (text/number/datetime-local) — `SearchForm` repeats `<label>` + `<input className={styles.input}>` 30+ times. No `Input`/`Field` wrapper. Base UI ships `Field` + `Input` + `NumberField` (the latter would also fix the "type=number with step=0.5" repetition).
- Native `<details>`/`<summary>` — `EventTable` column visibility panel, `ChangelogRow`, `ChangelogEntryPanel` group sections. Base UI ships `Collapsible` and `Accordion`. The `details::details-content` transition pattern is duplicated across three CSS Modules.
- Plain `type="checkbox"` for column visibility list in `EventTable`. Base UI ships `Checkbox`.

**Other notes:**

- `BoolBadge` and `ConceptBadge` live in `Badge.tsx` but `ConceptBadge` doesn't actually compose `Badge` — it's a separate `<span>` with its own padding rules.
- `ColumnActionsPopover` and `ColumnResizeDialog` define their own `<button>` elements with private CSS rather than reusing `src/ui/Button`. Inconsistent with `Pagination` and `SearchForm` which do use `Button`.

**How to apply:** When reviewing form-heavy or list-disclosure work, the first question is "should this become a `src/ui/` wrapper?" The pattern is well-established for Toggle/Popover/Dialog/Combobox; Select/Field/Collapsible/Checkbox are the obvious next additions. Avoid creating one-off styled `<button>` inside features when `Button` exists.
