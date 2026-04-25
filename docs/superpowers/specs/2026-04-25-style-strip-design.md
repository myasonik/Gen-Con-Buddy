# Style Strip Design

**Date:** 2026-04-25
**Branch:** feat/column-actions (or new branch from main)

## Goal

Strip all visual theming from the Gen Con Buddy frontend, leaving only structural/functional CSS. The result is an unstyled but correctly-structured app ready to be skinned from scratch. Everything must be mobile-responsive.

## What "Bare" Means

**Keep (structural):**

- `display: grid/flex` and associated layout properties
- `overflow`, `overflow-x`, `overflow-y`
- `position`, `top`, `bottom`, `left`, `right`, `inset`, `z-index`
- `width`, `height`, `min-width`, `max-width`, `min-height`
- `padding`, `margin` (layout spacing)
- `table-layout: fixed`, `border-collapse: collapse`
- `cursor` and `user-select` (interactive affordance)
- `visibility: hidden` (used for sidebar a11y)
- `white-space: nowrap` (overflow behavior)
- `box-sizing: border-box` (reset)
- `flex: 1`, `flex-shrink: 0`, `flex-wrap`
- `transition` on the sidebar open/close (behavioral)
- Functional animations (loading progress bar)
- `outline` on `:focus-visible` (accessibility)
- `position: fixed` + centering for modals/popovers
- `transform: translate(-50%, -50%)` for dialog centering

**Remove (visual):**

- All color tokens and references (`color`, `background`, `background-color`, `background-image`)
- All border declarations (purely decorative)
- `border-radius`
- `box-shadow`
- `font-family`, `font-style: italic`, `letter-spacing`
- Decorative `opacity` and hover `background` transitions
- Decorative animations (`sortPulse` in SearchResults)
- SVG inline background textures
- Shadow tokens

## Section 1: Token and Global Layer

### tokens.css

Reduce to structural tokens only:

```css
:root {
  /* Spacing — 8px grid */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 16px;
  --space-4: 24px;
  --space-5: 32px;

  /* Sizes */
  --size-sidebar: 360px;
  --size-detail-max: 800px;

  /* Motion */
  --motion-press: 30ms linear;
  --motion-hover: 80ms ease;
  --motion-expand: 150ms ease-out;

  /* Z-index scale */
  --z-content: 1;
  --z-sticky: 10;
  --z-header: 20;
  --z-popover: 30;
  --z-modal: 40;

  /* interpolate-size: allow <details> height: auto transitions */
  interpolate-size: allow-keywords;
}
```

All color tokens, typography tokens (fonts, type scale), shadow tokens, and event-type/day color families are removed.

### global.css

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

No linen texture, no parchment color, no font-family, no link colors.

## Section 2: Shell Layout and Mobile Drawer

### index.module.css (desktop, ≥768px)

The existing grid layout is preserved. Visual chrome (header background, gold border, parchment sidebar, shadows, background images) is removed. The header is a flex container for alignment only.

- `.shell`: `display: grid; grid-template-columns: var(--size-sidebar) 1fr; height: calc(100vh - 72px);` with `transition: grid-template-columns var(--motion-expand)`
- `.shell[data-sidebar-open="false"]`: collapses sidebar column to `0`
- `.shell[data-sidebar-open="false"] .sidebar`: `visibility: hidden`
- `.sidebar`: `display: flex; flex-direction: column; overflow: hidden;`
- `.results`: `overflow: auto; padding: var(--space-3);`
- `.resultsToolbar`: `display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-1);`
- `.header`: `display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) var(--space-4);`

### index.module.css (mobile, <768px)

```css
@media (max-width: 768px) {
  .shell {
    display: block;
    height: auto;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: min(80vw, var(--size-sidebar));
    z-index: var(--z-modal);
    overflow-y: auto;
    transform: translateX(-100%);
    transition: transform var(--motion-expand);
  }

  .shell[data-sidebar-open="true"] .sidebar {
    transform: translateX(0);
    visibility: visible;
  }

  .shell[data-sidebar-open="false"] .sidebar {
    visibility: hidden;
  }

  .backdrop {
    display: none;
    position: fixed;
    inset: 0;
    z-index: calc(var(--z-modal) - 1);
  }

  .shell[data-sidebar-open="true"] .backdrop {
    display: block;
  }

  .resizeHandle,
  .resizableTh {
    display: none; /* column resize is desktop-only */
  }
}
```

### JSX change (index.tsx)

Add a `<div className={styles.backdrop} onClick={() => { if (sidebarOpen) toggleSidebar(); }} aria-hidden="true" />` inside the shell. The element exists in both states; CSS shows/hides it. `useSidebarOpen` only exposes a toggle, so the backdrop guards against calling it when already closed.

## Section 3: Component CSS Files

All files follow the same rule: keep structural, strip visual.

### Button.module.css

Keep: `display: inline-block`, `cursor: pointer`, `line-height: 1`, `:focus-visible` outline, `:disabled cursor: not-allowed`.
Remove: font-family, italic, letter-spacing, colors, shadows, transitions.

### SearchForm.module.css

Keep: flex column layout, `overflow-y: auto` on scroll area, `position: sticky` on button bar, `width: 100%` on inputs, `display: flex; flex-wrap: wrap; gap` on day tiles.
Remove: bark borders, gold accents, parchment backgrounds, display font styling.

### SearchResults.module.css

Keep: `overflow-x: auto` on table wrapper, `table-layout: fixed`, `border-collapse: collapse`, resize handle positioning (`position: absolute`, dimensions), column visibility `details` height transition.
Remove: bark/parchment table theme, gold sort indicator, shadow, `sortPulse` animation.

### Pagination.module.css

Keep: flex layout, `flex-wrap`, alignment, `justify-content: flex-end`.
Remove: bark colors, pixel font references, decorative select styling.

### ActiveFilters.module.css

Keep: `display: flex; flex-wrap: wrap; gap`, `list-style: none`, `cursor: pointer`, `display: inline-flex; align-items: center`.
Remove: chip colors, hover backgrounds, border-radius, font styling.

### Badge.module.css

Keep: `display: inline-block`, `white-space: nowrap` on concept badge.
Remove: nearly everything else — borders, colors, font styling, border-radius.

### ToggleTile.module.css

Keep: `display: inline-flex`, gap, `cursor: pointer`, `user-select: none`, `data-pressed` attribute targeting (hook for skinning), `display: flex; flex-wrap: wrap; gap` on group.
Remove: bark/parchment colors, shadow, italic font, meeple opacity slot (decorative).

### EventTypeSelect.module.css

Keep: `position: absolute; z-index` on dropdown list, `max-height; overflow-y: auto`, chip `display: inline-flex`, input `flex: 1; min-width`.
Remove: all colors, font styling, borders throughout.

### Toggletip.module.css

Keep: `z-index` on tooltip, `min-width`, `cursor: pointer` on button.
Remove: bark colors, pixel font, borders, shadow.

### EventDetail.module.css

Keep: `max-width: var(--size-detail-max); margin: 0 auto` on article, `display: grid; grid-template-columns: 1fr 1fr; gap` on dl, `grid-column: 1 / -1` on full-width dl items.
Remove: parchment card background, noise texture, bark borders, pixel font references.

### PixelState.module.css

Keep: `text-align: center`, progress bar structural dimensions (`width`, `height`, `max-width`, `overflow: hidden`), `loadingProgress` animation (functional — communicates loading state).
Remove: bark/gold decorative styling, dashed border, icon colors.

### ColumnActionsPopover.module.css

Keep: `position: absolute` on trigger, `z-index` on popup, `display: flex; flex-direction: column` on popup, `cursor: pointer`, `width: 100%` on action buttons.
Remove: parchment/bark theming, italic fonts, hover backgrounds, borders.

### ColumnResizeDialog.module.css

Keep: backdrop `position: fixed; inset: 0; z-index`, dialog `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index`, `display: flex; gap; justify-content: flex-end` on actions, `width: 100%` on input.
Remove: parchment/bark colors, italic fonts, borders on all elements.

## Out of Scope

- No changes to TypeScript/TSX beyond the one JSX addition (backdrop div) in `index.tsx`
- No changes to test files
- The `data-pressed`, `data-sidebar-open`, `data-highlighted`, `data-selected` attribute hooks are preserved — they're structural anchors for future skinning
- No new utility classes or abstractions introduced
- The `src/index.css` file (which only imports global.css) is unchanged
