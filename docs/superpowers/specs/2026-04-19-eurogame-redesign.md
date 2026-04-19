# Eurogame Visual Redesign

**Date:** 2026-04-19  
**Scope:** Full design language overhaul — typography, shadow system, color, meeple iconography, panel treatment

## Goal

Shift the app's aesthetic from retro video game (pixel font, hard pixel shadows) to warm Eurogame (Catan / Ticket to Ride / Wingspan energy). The existing parchment/bark/gold color palette stays — it's already right. Everything else changes.

---

## Design Decisions

### Typography

- **Remove:** `--font-pixel: "Press Start 2P"` — this is the loudest video game signal
- **Add:** `--font-display: "IM Fell English", serif` — old English typesetter feel, atmospheric without being unreadable
- **Keep:** `--font-data: "Courier Prime", monospace` — unchanged for all data text (event titles, times, descriptions)
- IM Fell is used for: page/section headings, panel headers, field labels, button labels, badges
- The pixel-multiple type scale constraint (all sizes must be multiples of 8px) is dropped — it was only relevant for the pixel font

### Shadow & Border System

Replace the hard pixel drop-shadow system with organic warm cast shadows:

| Token                    | Before                              | After                             |
| ------------------------ | ----------------------------------- | --------------------------------- |
| `--shadow-panel`         | `4px 4px 0 var(--color-bark-dark)`  | `2px 3px 8px rgba(59,30,10,0.18)` |
| `--shadow-button`        | `3px 3px 0 var(--color-bark-dark)`  | `1px 2px 5px rgba(59,30,10,0.25)` |
| `--shadow-button-active` | `1px 1px 0 var(--color-bark-dark)`  | `0px 1px 2px rgba(59,30,10,0.2)`  |
| `--shadow-table-inset`   | `inset 0 0 0 3px var(--color-bark)` | removed                           |
| `--shadow-panel-inset`   | `inset 0 0 0 2px var(--color-bark)` | removed                           |

### Panel Treatment

Panels use a board-tile style: dark bark header band with a gold accent underline, linen-textured body.

**Panel anatomy:**

- Header band: `background: var(--color-bark)`, `border-bottom: 3px solid var(--color-gold)`, IM Fell italic text in parchment
- Body: parchment-light background with subtle CSS linen texture
- Outer border: `2px solid var(--color-bark)`, `border-radius: 4px`
- Shadow: new organic shadow token

**Linen texture (pure CSS, no image files):**

```css
background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23f5e6c8'/%3E%3Crect x='0' y='0' width='1' height='1' fill='%23d4a76a' opacity='0.15'/%3E%3Crect x='2' y='2' width='1' height='1' fill='%23d4a76a' opacity='0.15'/%3E%3C/svg%3E");
```

Applied to: panel bodies, the page background (replacing the existing grain texture), sidebar.

### Meeple SVG

A custom meeple SVG is saved at `src/assets/meeple.svg`. It has a 3D wooden-token look: white front face with black stroke, black shadow layer offset 30px upper-left. The fill color is themeable via CSS `fill` on the `<use>` elements or by overriding with a wrapper.

**Usage — woven throughout, tastefully:**

| Location                    | Usage                                                                                               |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| Site header                 | Meeple as logo mark, gold fill on bark background                                                   |
| `PixelState` empty state    | Meeple SVG replaces the die emoji (⚄)                                                               |
| `PixelState` error state    | `meeple-flat.svg` rendered with a red-tinted fill replaces ✗ — no separate broken-meeple SVG needed |
| `PixelState` loading        | Progress bar stays; no animation change                                                             |
| `ToggleTile` selected state | Small flat meeple silhouette appears when tile is selected (see below)                              |
| Event card player count     | Small pawn icon (separate simpler SVG) beside player count                                          |

A second, simpler **flat meeple silhouette** SVG (`src/assets/meeple-flat.svg`) is needed for UI indicators — no 3D shadow, just the solid silhouette. This is used inside ToggleTiles and anywhere a small inline indicator is needed.

### ToggleTile Selected State

When a ToggleTile is selected, a small meeple appears in a reserved slot at the left of the tile — like placing a meeple on a board space. The meeple inherits the tile's concept color.

- The meeple slot is always present (fixed width, ~14px) so no layout shift occurs on toggle
- Unselected: slot is empty (meeple hidden via `visibility: hidden` or `opacity: 0`)
- Selected: meeple snaps/fades in, tile background and border adopt the concept color
- The meeple fill color matches the tile's active color, set via two CSS custom properties on the tile element: `--tile-color` (foreground) and `--tile-color-bg` (background). These are passed as `style` props from the parent (SearchForm knows the concept color for each tile). The ToggleTile CSS uses `var(--tile-color)` and `var(--tile-color-bg)` in its `[data-pressed]` selector.

### Color System

New color tokens for semantic grouping. These are **additive** — they extend `tokens.css`, not replace the existing palette.

#### Event Type Families

The 19 Gen Con event types are grouped into 6 color families:

| Family        | Types                             | Color                                 |
| ------------- | --------------------------------- | ------------------------------------- |
| Roleplay      | RPG, LRP, TDA                     | Deep purple `#5c3a7a` / bg `#f0eaf7`  |
| Board & Card  | BGM, CGM, TCG                     | Forest green `#2a5c3a` / bg `#e8f2ea` |
| Miniatures    | HMN, NMN, MHE                     | Steel blue `#1a3d5c` / bg `#e4edf5`   |
| Electronic    | EGM                               | Amber brown `#7a4a00` / bg `#fdf0d8`  |
| Learning      | SEM, WKS                          | Teal `#1a5c5c` / bg `#e4f2f2`         |
| Entertainment | ANI, ENT, FLM, KID, SPA, TRD, ZED | Rose `#7a2040` / bg `#f5e4ea`         |

#### Convention Days

| Day       | Color     | Background |
| --------- | --------- | ---------- |
| Wednesday | `#4a3570` | `#edeaf7`  |
| Thursday  | `#7a4a00` | `#fdf0d8`  |
| Friday    | `#2a5c3a` | `#e8f2ea`  |
| Saturday  | `#1a3d5c` | `#e4edf5`  |
| Sunday    | `#7a2040` | `#f5e4ea`  |

#### Experience Required

| Level  | Color     | Background |
| ------ | --------- | ---------- |
| None   | `#2a5c3a` | `#e8f2ea`  |
| Some   | `#7a4a00` | `#fdf0d8`  |
| Expert | `#7a2040` | `#f5e4ea`  |

#### Application

Colors appear as:

1. **Badges** in the results table (event type, day, experience columns)
2. **ToggleTile active state** in the search form (day filter tiles, event type tiles)
3. **Day stripe** — a narrow `<td>` cell (5px wide, no padding) at the start of each table row with `background` set to the day's color. CSS `border-left` on `<tr>` is not used — browser support is unreliable.

A new `Badge` variant or a `ConceptBadge` component handles the semantic color mapping (type → color family). It accepts a `concept` prop (`eventType | day | experience`) and a `value` prop, and maps them to the correct color tokens.

---

## Files Changed

| File                                                    | Change                                                                                                                   |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `src/styles/tokens.css`                                 | Remove `--font-pixel`, add `--font-display`; update shadow tokens; add color tokens for event families, days, experience |
| `src/styles/global.css`                                 | Replace grain texture with linen texture; update `body` font reference                                                   |
| `src/assets/meeple.svg`                                 | New — 3D meeple logo (already created)                                                                                   |
| `src/assets/meeple-flat.svg`                            | New — flat meeple silhouette for UI indicators                                                                           |
| `src/assets/pawn.svg`                                   | New — simple pawn silhouette for player count column in results table                                                    |
| `src/ui/ToggleTile/ToggleTile.tsx`                      | Add meeple slot to tile; accept color prop for selected state                                                            |
| `src/ui/ToggleTile/ToggleTile.module.css`               | Meeple slot styles; selected state color theming                                                                         |
| `src/ui/PixelState/PixelState.tsx`                      | Replace emoji icons with SVG meeple                                                                                      |
| `src/ui/PixelState/PixelState.module.css`               | Update styles to match new design language                                                                               |
| `src/ui/Badge/Badge.tsx`                                | Add `ConceptBadge` component for semantic color mapping                                                                  |
| `src/ui/Badge/Badge.module.css`                         | Badge color styles using new tokens                                                                                      |
| `src/ui/Button/Button.module.css`                       | Update font to `--font-display`; update shadow tokens                                                                    |
| `src/components/SearchForm/SearchForm.module.css`       | Panel header treatment; linen texture; updated field styles                                                              |
| `src/components/SearchResults/SearchResults.module.css` | Panel header treatment; day stripe on rows; badge integration                                                            |
| `src/components/SearchForm/SearchForm.tsx`              | Pass color context to ToggleTile for day/type filters                                                                    |
| `src/components/SearchResults/SearchResults.tsx`        | Render `ConceptBadge` for type/day/experience columns; add day stripe                                                    |
| `src/routes/__root.tsx`                                 | Add site header with meeple logo                                                                                         |

---

## Out of Scope

- No changes to routing, data fetching, or API integration
- No changes to the EventDetail component layout (typography tokens will cascade naturally)
- No new fonts beyond IM Fell English (already identified — load from Google Fonts)
- No animation changes beyond removing the pixel-press active shadow offset

---

## Testing

Each changed component gets updated tests or story snapshots. No new test patterns required — existing MSW handlers and render tests are sufficient. The `ConceptBadge` component gets a unit test covering the type→color mapping for all 19 event types.
