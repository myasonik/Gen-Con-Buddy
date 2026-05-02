# Type Column Display Controls — Design Spec

**Date:** 2026-05-02

## Summary

Add controls to the "Customize columns" panel that let users configure how the event type column is displayed: separately toggle icon visibility and choose between short code, full name, or both for the text portion. Affects both the desktop table and the mobile list view.

---

## Background

The eventType column currently always shows an icon alongside the full API string (e.g., `🎲 RPG - Role Playing Game`). A previous implementation attempt tried conditional JSX rendering gated on TanStack Table state, which failed because TanStack Table's internal memoization does not re-evaluate cell renderers when external state changes. This design avoids that problem entirely by rendering all DOM parts unconditionally and using CSS classes on an ancestor element to show/hide parts.

---

## User-Visible Controls

Inside the collapsible "Customize columns" panel, a new **"Event type column"** section appears above the existing column-group checkboxes, separated by a divider. It contains:

1. **Show icon** — a checkbox (default: checked). Uses the existing `D6Face` + square-indicator pattern identical to the column-visibility checkboxes.
2. **Text display** — three radio buttons: **Code** (`RPG`), **Name** (`Role Playing Game`), **Both** (`RPG - Role Playing Game`). Default: **Name**. Uses a new `Targeted` icon + circular indicator.

Combined default: icon shown + name → renders `🎲 Role Playing Game`.

Both controls reset when "Reset to defaults" is clicked.

---

## State Model

### `TypeDisplay` type

```ts
type TypeDisplay = "code" | "name" | "both";
```

Lives in `src/ui/EventTable/types.ts` alongside `SharedColumnState`.

### `useTypeDisplay()` hook

File: `src/hooks/useTypeDisplay.ts`

Follows the exact same shape as `useColumnVisibility` and `useColumnSizing`.

- localStorage key: `gen-con-buddy-type-display`
- Stored value: `{ textMode: TypeDisplay; showIcon: boolean }`
- Defaults: `{ textMode: "name", showIcon: true }`
- Returns: `{ typeDisplay, setTypeDisplay, showTypeIcon, setShowTypeIcon, reset }`

### `SharedColumnState` additions

```ts
typeDisplay: TypeDisplay;
setTypeDisplay: (v: TypeDisplay) => void;
showTypeIcon: boolean;
setShowTypeIcon: (v: boolean) => void;
resetTypeDisplay: () => void;
```

All five fields are required (not optional). The three consumer callsites — `SearchResults`, `ChangelogPage`, and `EventTable`'s internal fallback — each call `useTypeDisplay()` and include these fields.

---

## CSS Architecture

### New file: `src/ui/EventTable/typeCell.module.css`

Contains all type-cell styling. Imported by `columns.tsx` (cell-part classes), `EventListMobile.tsx` (cell-part classes + parent mode class), and `EventTable.tsx` (parent mode class only).

```css
/* Cell layout */
.typeCell {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
.typeIcon {
  display: flex;
  flex-shrink: 0;
}
.typeCode {
}
.typeSep {
}
.typeName {
}

/* Text mode: "code" — hide separator and name */
.typeDisplayCode .typeSep,
.typeDisplayCode .typeName {
  display: none;
}

/* Text mode: "name" — hide code and separator */
.typeDisplayName .typeCode,
.typeDisplayName .typeSep {
  display: none;
}

/* Text mode: "both" — no class needed, raw DOM shows everything */

/* Icon toggle */
.typeHideIcon .typeIcon {
  display: none;
}
```

Since all classes are in the same module, CSS Modules scopes both parent and child classes to the same hash — the cascade works without any `:global()`.

### Parent class application

The parent element receives up to two classes: the text-mode class and optionally `.typeHideIcon`.

```tsx
const textClass =
  typeDisplay === "code" ? typeCellStyles.typeDisplayCode
  : typeDisplay === "name" ? typeCellStyles.typeDisplayName
  : undefined; // "both" needs no class

const iconClass = showTypeIcon ? undefined : typeCellStyles.typeHideIcon;

// Applied to EventTable's <section> and EventListMobile's <ul>
className={[textClass, iconClass].filter(Boolean).join(" ") || undefined}
```

---

## Cell Restructuring

### `columns.tsx` — eventType cell

The API returns `eventType` as the short code only (e.g., `"RPG"`). The full label is looked up from `EVENT_TYPES` in `enums.ts` (e.g., `"RPG - Role Playing Game"`). The name portion is extracted by stripping the code prefix.

```tsx
import typeCellStyles from "./typeCell.module.css";
import { EVENT_TYPES } from "../../utils/enums";

cell: ({ row }) => {
  const { eventType } = row.original.attributes;
  const Icon = EVENT_TYPE_ICONS[eventType];
  const fullLabel = EVENT_TYPES[eventType] ?? eventType;
  const name = fullLabel.startsWith(`${eventType} - `)
    ? fullLabel.slice(eventType.length + 3)
    : "";
  return (
    <span className={typeCellStyles.typeCell}>
      {Icon && <span className={typeCellStyles.typeIcon}><Icon size={14} /></span>}
      <span className={typeCellStyles.typeCode}>{eventType}</span>
      {name && <span className={typeCellStyles.typeSep}> - </span>}
      {name && <span className={typeCellStyles.typeName}>{name}</span>}
    </span>
  );
},
```

No changes to TanStack Table setup. No conditional rendering based on `typeDisplay` state. The cell renderer is identical regardless of mode — CSS does the work.

### `EventListMobile.tsx` — typeTag

Same restructuring applied to the type tag span — same `EVENT_TYPES` lookup, same span structure. `EventListMobile` accepts new `typeDisplay?: TypeDisplay` and `showTypeIcon?: boolean` props (both optional — absence degrades gracefully to "both" + icon shown, since no parent class = full display). Imports `typeCell.module.css` for both cell-part classes and parent mode class.

---

## State Wiring

### `SearchResults.tsx`

Calls `useTypeDisplay()`. Includes all five new fields in `sharedColumnState`. Passes `typeDisplay` and `showTypeIcon` to `EventListMobile`.

### `ChangelogPage.tsx`

Calls `useTypeDisplay()`. Includes all five new fields in `sharedColumnState`. No `EventListMobile` here.

### `EventTable.tsx`

- Imports `typeCell.module.css`
- Adds internal fallback: calls `useTypeDisplay()` and uses its values when no `sharedColumnState` is provided (parallel to `internalVis` / `internalSizing`)
- Applies `textClass` + `iconClass` to its `<section>` wrapper
- Includes the five new fields in `columnStateForPanel` (passed to `ColumnControlsPanel` when `showColumnControls` is true)
- **No changes to the cell rendering loop** — `flexRender` is unchanged

---

## New Icon

File: `src/ui/icons/Targeted.tsx`

```tsx
import { createIcon } from "./createIcon";

// game-icons.net — "targeted" by sbed (CC BY 3.0)
export const Targeted = createIcon(
  "Targeted",
  "0 0 512 512",
  <path d="M256 16C123.45 16 16 123.45 16 256s107.45 240 240 240 240-107.45 240-240S388.55 16 256 16zm0 60c99.41 0 180 80.59 180 180s-80.59 180-180 180S76 355.41 76 256 156.59 76 256 76zm-15 30a15 15 0 0 0-15 15v30a15 15 0 0 0 15 15h30a15 15 0 0 0 15-15v-30a15 15 0 0 0-15-15h-30zm16.75 90.03A60 60 0 0 0 196 256a60 60 0 0 0 120 0 60 60 0 0 0-58.25-59.97zM121 226a15 15 0 0 0-15 15v30a15 15 0 0 0 15 15h30a15 15 0 0 0 15-15v-30a15 15 0 0 0-15-15h-30zm240 0a15 15 0 0 0-15 15v30a15 15 0 0 0 15 15h30a15 15 0 0 0 15-15v-30a15 15 0 0 0-15-15h-30zM241 346a15 15 0 0 0-15 15v30a15 15 0 0 0 15 15h30a15 15 0 0 0 15-15v-30a15 15 0 0 0-15-15h-30z" />,
);
```

---

## Control UI

### Placement

A new `<fieldset>` with `<legend>Event type column</legend>` is inserted at the top of the `ColumnControlsPanel` content, above the existing column-group fieldsets, with a visible bottom divider separating it.

### Show icon checkbox

Native `<input type="checkbox">` with `.sr-only`. Visual indicator: `.columnCheckbox` (same existing square + `D6Face` pattern as column-visibility checkboxes). Checked state: accent fill.

### Text mode radio buttons

Native `<input type="radio">` with a shared `name` derived from `useId()` inside `ColumnControlsPanel` (e.g., `name={id + "-typeDisplay"}`). This prevents radio-group collisions when multiple `ColumnControlsPanel` instances appear on the same page. Visual indicator: new `.radioIndicator` class — same dimensions and transitions as `.columnCheckbox` but `border-radius: 50%` (circular). Icon: `Targeted` at 16px. Checked state: accent fill (same as checkboxes).

Layout: radio options render in a horizontal row (three options fit comfortably). The icon checkbox sits above the radio group on its own line.

Labels (text only — no live icon preview in label):

| Value  | Label       |
| ------ | ----------- |
| `code` | Code        |
| `name` | Name        |
| `both` | Code + name |

### Reset to defaults

The existing `onClick` is extended to also call `resetTypeDisplay()`.

---

## Testing

- **`useTypeDisplay.test.ts`** — default values, persistence to localStorage, `reset()` restores defaults, each setter updates independently.
- **`ColumnControlsPanel.test.tsx`** — icon checkbox renders and toggles `setShowTypeIcon`; radio buttons render with correct default checked state; selecting a radio calls `setTypeDisplay`; "Reset to defaults" calls `resetTypeDisplay`.
- **`EventTable.test.tsx`** — correct parent class applied to `<section>` for each `typeDisplay` value and for `showTypeIcon: false`; no class for "both" + icon shown.
- **`EventListMobile.test.tsx`** — same parent class assertions on `<ul>`.
- CSS cascade itself is not testable in jsdom; class application is the proxy.

All tests use MSW for any network interaction; no internal module mocking.
