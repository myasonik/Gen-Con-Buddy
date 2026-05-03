---
name: src/ui/ scope and what does/doesn't belong
description: Decision rule for what belongs in src/ui/ (primitives) vs. src/components/ (feature components), based on the 1.0 audit.
type: project
---

**Rule:** `src/ui/` is for primitives and brand-neutral components. `src/components/` is for Gen Con-specific feature components.

The test: would a different product (say, PaxConBuddy) be able to use this with no rename and no domain-knowledge changes? If yes → `src/ui/`. If no → `src/components/`.

**Currently in `src/ui/` but should be in `src/components/`:**

- `EventTable/` — the entire folder. Hardcodes Gen Con `Event` shape, event-type codes, column groupings, sort fields. ~1,400 lines of feature code.
- `ActiveFilters/` — `getActiveFilters.ts` is a 290-line def of Gen Con `SearchParams` filter chips. Component imports Gen Con enums.
- `EventTypeSelect/` — hardcodes `EVENT_TYPES` and `EVENT_TYPE_ICONS`. The reusable artifact is a generic `<Combobox multiple>` wrapper, not this.

**Currently in `src/ui/` and should stay (true primitives):**

- `Button`, `Field`, `Select`, `DescriptionList`, `Toggletip`, `AnimatedDetails`, `icons/`, `storyMatrix.tsx`

**Edge case: `EmptyState/`** — currently hardcodes the `Meeple` icon, which is brand-specific. Decide: either accept an `icon` prop (then it's a primitive) or rename to `QuestState` (then it's brand). Today it's marketed as the former but behaves as the latter.

**How to apply:** When reviewing additions to `src/ui/`, apply the "would another product use this?" test. If a new component imports from `utils/enums.ts`, `utils/types.ts`, or any Gen Con-specific module, it doesn't belong in `src/ui/`.
