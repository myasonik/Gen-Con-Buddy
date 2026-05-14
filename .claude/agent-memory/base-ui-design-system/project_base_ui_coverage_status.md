---
name: Base UI primitives in active use vs. notable gaps
description: Snapshot of which @base-ui/react primitives the codebase already wraps in src/ui/ and which interactive controls still hand-roll behavior (updated 2026-05-14).
metadata:
  type: project
---

**In active use (wrapped in src/ui/):**

- `Button` — variants `primary`/`secondary`/`ghost`, plus `icon` and `large` size.
- `Checkbox` — wraps Base UI Checkbox; used for column visibility lists, toggles.
- `Chip` — pill badge with tone variants and optional remove button; sm/md sizes.
- `Collapsible` — wraps Base UI Collapsible; replaces the old `AnimatedDetails` wrapper around native `<details>`.
- `DescriptionList` — semantic dl/dt/dd layout for event details.
- `Drawer` — wraps Dialog to produce left/right slide-in panel with backdrop, header, scroll area, footer. Consolidates two former duplicate drawer implementations.
- `EmptyState` — loading/error/empty state with animated Meeple icon.
- `Field` — wraps `<label>/<input>` pairs.
- `MultiCombobox` — multi-select combobox with chip pills. Uses `Combobox.Portal`, `Combobox.Positioner`, `Combobox.Status`. Ongoing gaps — see [[Base-UI-Combobox-sub-components-ignored]].
- `SegmentedControl` — wraps Base UI RadioGroup for type-display toggle. Consolidates two former hand-rolled radio/toggle implementations.
- `Select` — wraps native `<select>`.
- `Toggletip` — wraps Popover.

**Still hand-rolled (Base UI primitives exist but are not yet used):**

- Native `<input type="checkbox">` in a few one-off contexts outside `src/ui/Checkbox/` — not systematic enough to be a gap yet.

**How to apply:** When adding new form controls or interactive surfaces, prefer Base UI primitives wrapped in `src/ui/`. The former "most valuable missing primitives" list (Chip, Drawer, SegmentedControl, Checkbox) is fully resolved as of this snapshot.
