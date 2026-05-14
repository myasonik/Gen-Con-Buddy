---
name: Base UI Combobox sub-component coverage
description: Which Combobox parts MultiCombobox uses, which it skips, and the key FloatingFocusManager trap to avoid
type: project
---

`MultiCombobox` in `src/ui/MultiCombobox/` uses: `Root`, `InputGroup`, `Input`, `Trigger`, `Chips`, `Chip`, `ChipRemove`, `Portal`, `Positioner`, `List`, `Item`, `ItemIndicator`, `Status`, `useFilter`.

**Intentionally NOT used — `Combobox.Popup`**

`Combobox.Popup` internally instantiates `FloatingFocusManager` (from floating-ui-react). For a non-modal combobox with a typeable input (`isUntrappedTypeableCombobox = true`), FloatingFocusManager calls `markOthers()` with `ariaHidden: true`, which applies `aria-hidden="true"` to every sibling element NOT in its `insideElements` list. The `insideElements` list only contains the floating popup and the Input element — NOT the chips toolbar (sibling of Input) or any ancestor dialog content.

**Why this matters:** Using `Combobox.Popup` aria-hides the `Combobox.Chips` toolbar whenever the dropdown opens. Chip remove buttons become inaccessible to AT. If the combobox is inside a dialog, the dialog's own buttons (e.g. "Apply Filters") also become aria-hidden.

**Current approach:** Use `{open && <Combobox.Portal>}` with a plain `<div className={styles.popup}>` (instead of `Combobox.Popup`) to avoid FloatingFocusManager entirely. Open/close is managed by controlled `open` state: set in `Combobox.Input`'s `onFocus`, cleared in root `onBlur` when focus leaves the component, and synced with Base UI via `onOpenChange`.

**Still hand-rolled:**

- Manual `open` state + `onFocus`/`onBlur` — needed because Tab-to-open requires controlled state; Base UI's internal open management doesn't expose a "open on input focus" hook cleanly.
- Backspace-to-remove-last-chip in `Input.onKeyDown` — `comboboxChipsContext` (which Base UI uses internally for Backspace) is only available to descendants of `Combobox.Chips`, not to `Combobox.Input` (a sibling). Base UI's built-in Backspace handler can't reach the chip context from the input.
- `suppressFocusOpenRef` — prevents `Combobox.ChipRemove`'s programmatic `input.focus()` (called after chip removal) from reopening the dropdown.

**Still not used:**

- `Combobox.Label` — replaced by `useId()` + `<label id>` + `aria-labelledby` on Input. (`Combobox.Input` ignores an `id` prop — it generates its own via `useBaseUiId()`. Use `aria-labelledby` instead.)
- `Combobox.Empty` — replaced by a manual `{filteredOptions.length === 0 && <div>No results</div>}` check.
- `Combobox.Clear` — not needed in this UI.
