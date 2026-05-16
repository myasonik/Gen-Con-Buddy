---
name: Recurring design-system violations found in pre-stable audit
description: Cross-cutting issues found 2026-05-14 — chip primitive bypass, hand-rolled radio, quest vocabulary, lucide vs game-icons, dead code.
type: project
---

Patterns seen repeatedly across the codebase (pre-stable milestone audit, 2026-05-14):

**1. Chip primitive bypassed in two places.**
`src/ui/Chip/Chip.module.css` is the canonical pill. But `MultiCombobox.module.css` `.chip`/`.chipRemove` re-declares the sm+accent variant by hand (~30 lines duplicating Chip's `data-size=sm` + `data-tone=accent`), and `Combobox.Chip` is used instead of the `Chip` primitive. The comment even admits "matching Chip primitive's sm+accent variant." Reason it's not trivially fixable: `Combobox.Chip`/`Combobox.ChipRemove` carry Base UI combobox wiring. Recommended fix: extract the chip _visual_ into a `composes:`-able class or accept that Combobox needs its own and tokenize the shared values.

**2. Hand-rolled radio group despite SegmentedControl existing.**
`ThemePopover.module.css` + `ThemeRadioGroup.tsx` hand-roll a Base UI `RadioGroup`/`Radio` with bespoke `.radio`/`.radioIndicator` dot styling. `src/ui/SegmentedControl/` already wraps exactly this. Either ThemeRadioGroup should use SegmentedControl, or SegmentedControl needs a "menu/stacked" variant. This is the third radio-ish implementation historically (SegmentedControl was supposed to consolidate them).

**3. "Quest" vocabulary leaking into UI copy.**
EmptyState text strings say "LOADING QUEST...", "QUEST FAILED", "NO QUESTS FOUND", "This quest does not exist." (`EventDetail.tsx`, `SearchResults.tsx`). DESIGN.md domain vocabulary: the unit is "Event", never "quest". This is fantasy/RPG theming the design doc explicitly bans ("no sword-and-sorcery decoration. Gen Con spans every genre"). The `EmptyState` icon is a Meeple (correct, genre-neutral) but the copy is not.

**4. lucide-react vs game-icons.net split.**
13 files import `lucide-react` for UI chrome icons (chevrons, X, menu, search, sun/moon, arrows). `src/ui/icons/` holds ~45 game-icons.net custom icons (event-type icons, Meeple). `createIcon.tsx` even depends on `LucideProps`. User's global memory says "when asked for an icon, search game-icons.net first." Current state is a deliberate-looking split (lucide = generic chrome, game-icons = brand/domain) but it is undocumented and inconsistent — e.g. MultiCombobox uses lucide `Check`/`ChevronDown`/`X` while EventTypeSelect uses game-icons. Worth a CONTEXT.md note either way.

**5. Dead / stub code.**

- `SortDrawer.tsx` renders `<Drawer title="Sort">{null}</Drawer>` — an empty drawer shipped in SearchResults (x2) and StaffPickCallout. Either build it or remove it.
- `ColumnControlsPanel.tsx` is used only by ChangelogPage; SearchResults + StaffPickCallout inline the identical `<VisibilityDrawer/><FormatDrawer/><SortDrawer/>` JSX three times instead of using it. Consolidate.

**How to apply:** These are systemic, not one-offs. When reviewing, treat (1) and (2) as "primitive exists, use it" failures; (3) as a hard DESIGN.md violation; (4) as needs-a-decision; (5) as cleanup before stable.
