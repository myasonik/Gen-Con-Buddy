# Filters Drawer → Base UI ARIA Dialog

**Date:** 2026-05-01
**Status:** Approved

## Problem

The advanced filters drawer in `SearchForm` is missing proper dialog semantics: no `role="dialog"`, no focus trap, no Escape-key handling, no focus restoration on close. All of these are required for assistive technology to work correctly with a modal overlay.

## Approach

Adopt Base UI's `Dialog` primitives with `keepMounted` and CSS transition classes (`[data-starting-style]` / `[data-ending-style]`) for the slide animation (Option B).

## Component Structure

`Dialog.Root` wraps the entire `SearchForm` return value (no extra DOM node). The `useState(drawerOpen)` and all manual open/close handlers are removed; Base UI owns the open state.

| Current                                        | Replacement                               |
| ---------------------------------------------- | ----------------------------------------- |
| `useState(drawerOpen)`                         | `Dialog.Root` internal state              |
| `<div className={styles.backdrop}>`            | `Dialog.Backdrop`                         |
| `<div className={styles.drawer}>`              | `Dialog.Popup keepMounted`                |
| `<span className={styles.drawerTitle}>`        | `Dialog.Title`                            |
| Close `<Button onClick>`                       | `Dialog.Close` wrapping existing `Button` |
| Filters `<Button aria-expanded aria-controls>` | `Dialog.Trigger render={<Button>}`        |

`Dialog.Portal` wraps both `Dialog.Backdrop` and `Dialog.Popup`, moving them to `document.body`.

Removed attributes: `id="advanced-filters"`, `aria-label="Advanced Filters"` on the drawer div, `aria-controls` and `data-open` on the trigger, `aria-hidden` on the backdrop. Base UI manages all of these.

## CSS Animation

Replace the `data-open="true"` attribute pattern with Base UI's enter/exit transition classes on the drawer:

```css
.drawer {
  transform: translateX(0);
  transition:
    transform var(--motion-expand),
    visibility var(--motion-expand);
}

.drawer[data-starting-style],
.drawer[data-ending-style] {
  transform: translateX(-100%);
  visibility: hidden;
}
```

Backdrop gains a fade animation (currently no animation):

```css
.backdrop {
  opacity: 1;
  transition: opacity var(--motion-expand);
}

.backdrop[data-starting-style],
.backdrop[data-ending-style] {
  opacity: 0;
}
```

Removed: `.drawer[data-open="true"]` rule and the inline `style={{ display: drawerOpen ? "block" : "none" }}` on the backdrop.

## Behavior Change

`Dialog.Portal` moves the drawer outside the `<form>` DOM node. Pressing Enter inside a drawer input will no longer trigger form submission. This is correct behavior for a modal dialog.

## Testing

### New tests

- Dialog has `role="dialog"` with accessible name "Advanced Filters" when open
- Pressing Escape closes the dialog; focus returns to the Filters button
- Clicking the backdrop closes the dialog
- Clicking the close button closes the dialog

### Updated tests

Tests that currently query drawer inputs without opening the drawer (e.g. `"renders advanced filter fields in the form"`) must open the dialog first. With `keepMounted`, Base UI adds `hidden` to the closed popup, removing those elements from the accessibility tree.

Tests that only assert submitted payload values using pre-populated `values` prop do not need to open the drawer.

### Unchanged tests

All strip-level tests (keyword, event type, days, time, Reset, Search) are unaffected. The `aria-expanded` test survives: Base UI's `Dialog.Trigger` manages `aria-expanded` automatically.
