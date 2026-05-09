---
name: Base UI Combobox sub-component coverage
description: Reminders about which Combobox parts the codebase tends to skip and what they buy you
type: project
---

`@base-ui/react/combobox` exports a full set of parts. The `MultiCombobox` primitive in `src/ui/MultiCombobox/` currently uses only `Root`, `InputGroup`, `Input`, `Trigger`, `List`, `Item`, `ItemIndicator`, `useFilter`. It hand-rolls everything else.

**Why:** Each skipped part is doing real work that the wrapper now duplicates (often less correctly):

- `Combobox.Portal` + `Combobox.Positioner` + `Combobox.Popup` — anchored positioning, viewport collision, `aria-hidden` on the rest of the page, scroll/resize tracking. Without them, `position: absolute` on `.list` will clip inside any overflow ancestor (the Drawer already overflows in `SearchForm`).
- `Combobox.Chips` + `Combobox.Chip` + `Combobox.ChipRemove` — keyboard nav between chips and Backspace-to-remove are wired up automatically. The current wrapper re-implements Backspace in `onKeyDown` and skips chip-to-chip keyboard nav entirely.
- `Combobox.Label` — automatic `id`/`for` association. Replaces the `useId()` + `<label htmlFor>` boilerplate.
- `Combobox.Empty` and `Combobox.Status` — politely announce "no matches" / loading state. The current "Loading…" placeholder text is silent to AT.
- `Combobox.Clear` — accessible "clear all" button.
- Open-state management on `Root` is internal; passing `open`/`onOpenChange` plus an outer `onFocus`/`onBlur` is fighting the library, not using it.

**How to apply:** When reviewing or extending `MultiCombobox` (or a future single-select Combobox), prefer adopting the missing sub-components in this order: Portal/Positioner/Popup (fixes drawer clipping today), then Chips/Chip/ChipRemove (removes manual focus + Backspace code), then Label/Empty/Status (a11y wins), then drop the manual `open` state entirely.
