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
  --color-ink: #3b1e0a /* body text, max contrast on parchment */
  --color-gold: #c9a84c
  /* accent: header title, active page, active sort, link hover */;
```

`--color-gold` is the only sharp accent in an otherwise monochromatic brown palette. Use it specifically and sparingly: the "GEN CON BUDDY" header title, the active page number in pagination, the active sort `▲`/`▼` indicator, and table row link hover color. Do not use it for backgrounds or borders — gold is a highlight, not a fill.

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

- `background: var(--color-bark)` with a subtle repeating cross-hatch `background-image` for wood grain depth (see Texture & Atmosphere)
- App title "GEN CON BUDDY" in Press Start 2P at **18px**, `color: var(--color-gold)`, `letter-spacing: 0.15em`
- Padding `1rem 1.5rem`
- The title is the marquee — it should feel like box cover typography, not a nav label

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

**Filter groups:** The sidebar has room — don't hide filters behind a `<details>` collapse. Show all filters, organized into labeled `<fieldset>` groups with Press Start 2P `<legend>` labels at 8px. Groups:

- **SEARCH** — free-text filter, event type select
- **DAYS** — day toggle tiles (Wed–Sun)
- **TIME** — start date range, duration range, end date range
- **PLAYERS** — min players range, max players range, age required, experience required
- **LOGISTICS** — location, room, table number, cost range, tickets available, attendee registration
- **DETAILS** — game system, rules edition, materials, tournament, special category, GMs, round/total rounds, last modified

Each `<fieldset>` has `border: 1px solid var(--color-bark-light)` and `margin-bottom: 1rem`. The existing `<details>` for advanced filters is removed entirely from the sidebar. The current `Toggletip` for Start Date / Days conflict remains — only the trigger condition changes (now always visible fields, not hidden ones).

**Buttons:** `[▶ SEARCH]` uses `.btn-primary`, `[↺ RESET]` uses `.btn-secondary`. Both full-width, stacked at bottom of sidebar, `position: sticky; bottom: 0` so they're always accessible without scrolling to the bottom.

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
- Active sort shows `▲` or `▼` in `--color-gold` alongside label — the gold makes the active column immediately scannable against the bark header
- `aria-sort` attribute on `<th>` (already implemented)

**Column visibility panel:** Same pixel `<details>`/`<summary>` treatment as Advanced Filters. Day-toggle tile style for checkboxes.

**Loading state:** A pixel progress bar — a `<div>` containing a fixed-width inner `<div>` that animates from 0% to 75% width via CSS `@keyframes`, followed by the text `LOADING QUESTS...` in Press Start 2P at 8px below it. The bar uses alternating `--color-bark` and `--color-gold` stripes via `repeating-linear-gradient`. Respects `prefers-reduced-motion` by showing static text only.

**Error state:** `QUEST FAILED` in Press Start 2P (8px, bark-dark), with the actual error message below in Courier Prime. Dashed border box.

**Empty state:** A Unicode die face `⚄` at 48px as a decorative element, then `NO QUESTS FOUND` in Press Start 2P (8px), then a Courier Prime suggestion ("Try broadening your search."). Centered, dashed border box.

### Pagination (`Pagination.module.css`)

Right-aligned bar below the table.

**Structure:**

```
◀ PREV    [1] [2] [3] … [24]    NEXT ▶
              247 events • 100 per page
```

- Prev/Next: `.btn-secondary` with `◀`/`▶` prefix
- Page numbers: `.btn-secondary` for inactive; active page gets `background: var(--color-bark)`, `color: var(--color-gold)` — not plain parchment text, gold
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

- Game ID: Press Start 2P at 8px, `color: var(--color-gold)`, above the title — acts as a card type badge
- Event title: `<h1>` in Press Start 2P at 16px, `color: var(--color-bark-dark)`, `border-bottom: 3px solid var(--color-bark)`, `padding-bottom: 0.75rem`, `margin-bottom: 1rem`

**`<dl>` layout:** `<dt>` labels sit **above** their `<dd>` values (stacked, not side-by-side). This is a deliberate choice: side-by-side `<dt>`/`<dd>` pairs require a fixed label width that breaks at long label names. Stacked is more robust and reads better with Press Start 2P's wide character spacing.

Fields are organized into four `<section>` groups, each with a Press Start 2P `<h2>` at 8px and `border-bottom: 1px solid var(--color-bark-light)`:

- **THE EVENT** — title, short description, long description, event type, group, game system, rules edition, special category
- **PLAYERS** — min/max players, age required, experience required, tournament (`✓`/`—`), round number, total rounds
- **LOGISTICS** — day, start time, end time, duration, minimum play time, location, room, table number, cost, attendee registration, tickets available, materials provided (`✓`/`—`), materials required, materials required details
- **CONTACT** — GMs, website, email, last modified

Within each section, short single-value fields (`<dt>`/`<dd>` pairs) are laid out in a two-column CSS grid (`grid-template-columns: 1fr 1fr`). Long text fields (descriptions, materials details) span both columns via `grid-column: 1 / -1`.

**Registration status pill:** Inline element next to "Attendee Registration" `<dd>` — `border: 2px solid var(--color-bark)`, `padding: 2px 8px`, filled bark background + parchment text if ticketed, outlined if not.

**Boolean fields** (`tournament`, `materialsProvided`): `✓` rendered in `--color-bark` or `—` in `--color-bark-light`.

**Loading / error states:** Same pixel progress bar (loading) and dashed-border box (error) as results table.

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

## Texture & Atmosphere

Solid `#f5e6c8` is beige, not parchment. Texture is what makes the difference.

**Body background:** Apply a repeating SVG noise grain overlay via a `body::before` pseudo-element — `position: fixed`, `inset: 0`, `pointer-events: none`, `z-index: 9999`, `opacity: 0.04`. The SVG uses a `<feTurbulence>` filter to generate organic noise. This sits above everything and adds paper grain without affecting layout or interaction.

**Sidebar and card surfaces:** Apply a second, subtler `background-image` using a base64-encoded SVG noise pattern directly on `--color-parchment-light` surfaces (sidebar panel, event card). Opacity 0.06 — visible up close, invisible at a glance.

**The bark header:** Add a very subtle repeating pixel cross-hatch pattern (`background-image: repeating-linear-gradient`) on top of the solid bark fill to give it depth — like worn cloth or aged wood grain.

---

## Motion

One well-placed animation beats ten scattered ones. `prefers-reduced-motion: reduce` disables all of these.

**Table row hover:** `background-color` transition, 80ms ease — shifts the row to a slightly darker parchment tone. Fast enough to feel responsive, slow enough to feel warm.

**Button `:active`:** `transform: translateY(2px)` at 30ms — simulates pressing a physical key on a board. No easing, snaps back instantly on release. This is the single most tactile detail in the whole UI.

**`<details>` expansion:** The filter list animates open via a CSS `@keyframes` that transitions `max-height` from 0 to full, 150ms ease-out. The `▸` indicator rotates 90° to `▼` on open.

**Sort header click:** After a sort is applied, the `▲`/`▼` indicator does a single brief `transform: scale(1.4) → 1` pulse (100ms) to confirm the action registered. No bounce — just a clean pop.

---

## Pixel Border Technique

Standard `border: 3px solid` produces a generic rectangle. Authentic pixel borders use stacked `box-shadow` offsets to create a stepped, hand-drawn feel.

**Panel borders** (sidebar, event card):

```css
box-shadow:
  4px 4px 0 var(--color-bark-dark),
  inset 0 0 0 2px var(--color-bark);
```

The inset shadow acts as the border; the offset shadow creates a hard drop that reads as depth, like a raised game board component.

**Button borders** (`.btn-primary`, `.btn-secondary` `:active` state removes the drop):

```css
/* default */
box-shadow: 3px 3px 0 var(--color-bark-dark);
/* :active */
box-shadow: 1px 1px 0 var(--color-bark-dark);
transform: translate(2px, 2px);
```

This makes buttons feel physically pressable — they "sink" when clicked.

**Table outer border:** Same `inset` technique — `box-shadow: inset 0 0 0 3px var(--color-bark)` instead of a `border`, so the border renders inside the table's bounds and doesn't cause layout shifts.

---

## Accessibility Notes

- All existing `aria-sort`, `aria-label`, `announce()` usage is preserved
- Press Start 2P is a bitmap font — use 8px as the minimum size everywhere; it renders poorly at non-multiples of 8px. Use Courier Prime for all dense data.
- Focus styles use `outline` (not `box-shadow`) to respect Windows High Contrast mode
- CSS Modules class names don't affect semantic structure — all existing ARIA attributes and roles remain unchanged
- `prefers-reduced-motion` guard in `index.css` prevents any future animation from causing issues
