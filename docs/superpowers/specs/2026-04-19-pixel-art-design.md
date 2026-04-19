# Pixel Art Board Game Design System

**Date:** 2026-04-19
**Status:** Approved

## Overview

Full visual redesign of Gen Con Buddy using a "Parchment & Pixel" aesthetic — warm parchment tones, pixel art typography for headings and labels, readable monospace for data, and chunky board-game-inspired borders. No CSS libraries introduced; the existing plain HTML + semantic elements constraint is preserved.

## Design Decisions

### Aesthetic Direction

Parchment & Pixel: warm parchment background (#f5e6c8), earthy brown palette, fantasy RPG / board game rulebook feel. Clean and minimal — no emoji icons or corner ornaments. Solid filled buttons (dark fill / light text for primary, outline for secondary).

### Typography

- **Press Start 2P** (Google Fonts): headings, labels, button text, nav elements, column headers
- **Courier Prime** (Google Fonts): table cell data, form input values, body copy, descriptions

### Table Library

**TanStack Table** (headless) replaces the current hand-rolled `<table>`. Rationale:

- Headless by design — zero built-in markup or styles, compatible with plain HTML constraint
- Built by the same org as TanStack Router and React Query (already in the project)
- Pure semantic HTML output → Testing Library queries work with no special selectors
- Full CSS control for pixel-art theming
- MUI X Data Grid was rejected: requires `@mui/material` and Emotion CSS-in-JS as peer dependencies

### CSS Architecture

- **`index.css`**: CSS custom properties (design tokens), global resets, button base classes (`.btn-primary`, `.btn-secondary`)
- **Per-component `.module.css` files**: component-scoped styles using CSS Modules (built into Vite, no extra config)

### Layout

Sidebar Quest Log: fixed-width search panel (280px) pinned left, results fill the remaining width. A full-width header bar spans both columns above. The search panel and results panel each scroll independently.

---

## Design Tokens (`index.css`)

### Color Palette

```css
--color-parchment: #f5e6c8 /* page bg, card fills */
  --color-parchment-light: #fff9ee /* input bg, alternating table rows */
  --color-bark: #8b4513 /* primary borders, button fills, header bg */
  --color-bark-dark: #5c3317 /* text, dark accents */
  --color-bark-light: #d4a76a /* secondary borders, dividers, zebra stripes */
  --color-ink: #3b1e0a /* body text, max contrast on parchment */;
```

### Typography

```css
--font-pixel:
  "Press Start 2P", monospace --font-data: "Courier Prime", monospace;
```

Both loaded from Google Fonts via a `<link>` in `index.html`.

### Button Base Classes

`.btn-primary`:

- `background: var(--color-bark)`, `color: var(--color-parchment)`
- `border: 2px solid var(--color-bark)`, no border-radius
- Press Start 2P font, consistent padding
- `:focus-visible` outline: `2px solid var(--color-bark-dark)`, `outline-offset: 2px`

`.btn-secondary`:

- `background: transparent`, `color: var(--color-bark)`
- `border: 2px solid var(--color-bark)`, no border-radius
- Same font and focus treatment

### Global Resets

- `box-sizing: border-box` on `*`
- `body`: `background: var(--color-parchment)`, `color: var(--color-ink)`, `font-family: var(--font-data)`, `margin: 0`
- `.sr-only` (already exists, keep as-is)
- `a`: `color: var(--color-bark-dark)`, `text-decoration: underline`
- `prefers-reduced-motion` guard for any future transitions

---

## Component Designs

### Page Shell (`SearchPage.module.css`)

Two-column CSS grid layout:

```
grid-template-columns: 280px 1fr
grid-template-rows: auto 1fr
```

Header bar spans both columns:

- `background: var(--color-bark)`, full width
- App title "GEN CON BUDDY" in Press Start 2P, `color: var(--color-parchment)`
- Padding `0.75rem 1rem`

Sidebar and results panels each use `overflow: auto` and fill the remaining viewport height.

### Search Form (`SearchForm.module.css`)

**Panel:**

- `background: var(--color-parchment-light)`
- `border-right: 3px solid var(--color-bark)`
- Internal padding `1rem`

**Labels:** Press Start 2P, 8px, `color: var(--color-bark)`

**Inputs and selects:**

- `background: var(--color-parchment)`, `border: 2px solid var(--color-bark)`, no border-radius
- `font-family: var(--font-data)`
- `:focus`: `outline: 2px solid var(--color-bark-dark)`, `outline-offset: 2px`

**Day checkboxes:** Horizontal strip of toggle tiles. Each `<label>` renders as a pixel-bordered tile. Checked state: `background: var(--color-bark)`, parchment text. Unchecked: outlined. Implemented via `input[type=checkbox]:checked + span` adjacent sibling selector — no JS required. Requires a `<span>` wrapper around the day label text in the markup (e.g., `<label><input type="checkbox" /><span>Fri</span></label>`) — the current markup lacks this and will need updating.

**Advanced Filters `<details>`:**

- `<summary>` in Press Start 2P with CSS `▸`/`▼` triangle indicator
- When open: filter list below with `border-top: 1px solid var(--color-bark-light)` separator

**Buttons:** `[▶ SEARCH]` uses `.btn-primary`, `[↺ RESET]` uses `.btn-secondary`. Both full-width, stacked at bottom of sidebar.

**Toggletip:** `?` button uses same pixel border as inputs. Tooltip popup: `background: var(--color-parchment-light)`, bark border, Courier Prime text.

### Search Results (`SearchResults.module.css`)

**TanStack Table wiring:**

- `manualSorting: true`, `manualPagination: true`
- Column definitions replace current `COLUMNS` array; cell renderers reuse existing `EventCell` logic
- `onSort` and `onNavigate` props on `SearchResults` are unchanged — TanStack Table calls them

**Table:**

- `width: 100%`, `border-collapse: collapse`, `font-family: var(--font-data)`
- Outer border: `3px solid var(--color-bark)`
- Cell borders: `1px solid var(--color-bark-light)`
- `<thead>`: `background: var(--color-bark)`, `color: var(--color-parchment)`, Press Start 2P headers
- Zebra striping: odd rows `var(--color-parchment-light)`, even rows `var(--color-parchment)`
- Horizontal scroll on the results panel handles 35 columns

**Sort header buttons:**

- No background (inherits bark thead)
- `:hover`: slight opacity reduction
- Active sort shows `▲` or `▼` in Press Start 2P alongside label
- `aria-sort` attribute on `<th>` (already implemented)

**Column visibility panel:** Same pixel `<details>`/`<summary>` treatment as Advanced Filters. Day-toggle tile style for checkboxes.

**Loading / error / empty states:** Centered text in Courier Prime, bark-colored, inside a `border: 2px dashed var(--color-bark-light)` box.

### Pagination (`Pagination.module.css`)

Right-aligned bar below the table.

**Structure:**

```
◀ PREV    [1] [2] [3] … [24]    NEXT ▶
              247 events • 100 per page
```

- Prev/Next: `.btn-secondary` with `◀`/`▶` prefix
- Page numbers: `.btn-secondary` for inactive, `.btn-primary` for active page
- Truncation: first, last, current ± 1 pages with `…` gaps (existing behavior retained)
- "N events • N per page" summary: Courier Prime, `color: var(--color-bark-dark)`, right-aligned below buttons
- Per-page `<select>`: same input styling as search form

### Event Detail (`EventDetail.module.css`)

Single centered column, max-width ~800px.

**Back link:** `← BACK TO RESULTS` in Press Start 2P small size, `.btn-secondary` style, at top.

**Event card:**

- `background: var(--color-parchment-light)`, `border: 3px solid var(--color-bark)`
- Padding `1.5rem`

**Inside the card:**

- Game ID: Press Start 2P label above the title (like a card type indicator)
- Event title: `<h1>` in Press Start 2P, `color: var(--color-bark-dark)`, `border-bottom: 3px solid var(--color-bark)` underline
- Fields: `<dl>` definition list — `<dt>` in Press Start 2P at 8px (bark), `<dd>` in Courier Prime
- Short fields (players, cost, duration): two-column grid inside the `<dl>`
- Long fields (descriptions): full-width
- Boolean fields (tournament, materials provided): `✓` in bark or `—` in bark-light
- Registration status: pill with `border: 2px solid var(--color-bark)`; filled bark background if ticketed

**Loading / error states:** Same dashed-border empty box as results table.

---

## File Changes Summary

| File                                                    | Action                                                               |
| ------------------------------------------------------- | -------------------------------------------------------------------- |
| `index.html`                                            | Add Google Fonts `<link>` (Press Start 2P, Courier Prime)            |
| `src/index.css`                                         | Replace with design tokens, resets, `.btn-primary`, `.btn-secondary` |
| `src/routes/__root.tsx`                                 | Add header bar markup                                                |
| `src/routes/index.tsx`                                  | Add sidebar/results grid layout                                      |
| `src/components/SearchForm/SearchForm.module.css`       | New — component styles                                               |
| `src/components/SearchResults/SearchResults.module.css` | New — component styles                                               |
| `src/components/SearchResults/SearchResults.tsx`        | Replace table with TanStack Table                                    |
| `src/components/Pagination/Pagination.module.css`       | New — component styles                                               |
| `src/components/EventDetail/EventDetail.module.css`     | New — component styles                                               |
| `src/routes/index.module.css`                           | New — SearchPage grid layout styles                                  |

**New dependency:** `@tanstack/react-table`

---

## Accessibility Notes

- All existing `aria-sort`, `aria-label`, `announce()` usage is preserved
- Press Start 2P is a bitmap font — use 8px as the minimum size everywhere; it renders poorly at non-multiples of 8px. Use Courier Prime for all dense data.
- Focus styles use `outline` (not `box-shadow`) to respect Windows High Contrast mode
- CSS Modules class names don't affect semantic structure — all existing ARIA attributes and roles remain unchanged
- `prefers-reduced-motion` guard in `index.css` prevents any future animation from causing issues
