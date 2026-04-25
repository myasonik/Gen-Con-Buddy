# Style Strip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strip all visual theming from every CSS file, keeping only structural/functional CSS, and add a mobile drawer layout with a fixed sidebar that slides in from the left.

**Architecture:** Edit-in-place across 16 CSS files and 2 TSX files. No new files created. Each file is stripped of colors, fonts, shadows, decorative borders, and background textures — leaving only layout (grid/flex), overflow, positioning, z-index, cursor, and accessibility utilities. The shell layout adds a `<768px` media query that turns the sidebar into a `position:fixed` drawer with a tap-to-dismiss backdrop.

**Tech Stack:** CSS Modules, Vite, React, TanStack Router, Vitest

---

## File Map

**Modified CSS files:**

- `src/styles/tokens.css` — reduce to spacing, sizing, motion, z-index only
- `src/styles/global.css` — bare reset + `.sr-only` + reduced-motion only
- `src/routes/index.module.css` — bare shell grid + mobile drawer media query
- `src/ui/Button/Button.module.css` — structural only
- `src/components/SearchForm/SearchForm.module.css` — layout only
- `src/components/SearchResults/SearchResults.module.css` — table structure + resize handle
- `src/components/SearchResults/ColumnActionsPopover.module.css` — positioning only
- `src/components/SearchResults/ColumnResizeDialog.module.css` — fixed centering + backdrop
- `src/components/Pagination/Pagination.module.css` — flex layout only
- `src/ui/ActiveFilters/ActiveFilters.module.css` — flex chip row only
- `src/ui/Badge/Badge.module.css` — inline-block + white-space only
- `src/ui/ToggleTile/ToggleTile.module.css` — inline-flex + pressed hook
- `src/ui/EventTypeSelect/EventTypeSelect.module.css` — positioned dropdown + chip flex
- `src/ui/Toggletip/Toggletip.module.css` — z-index + min-width
- `src/components/EventDetail/EventDetail.module.css` — max-width centering + dl grid
- `src/ui/PixelState/PixelState.module.css` — centering + progress animation

**Modified TSX files:**

- `src/routes/index.tsx` — add backdrop `<div>` for mobile drawer dismiss
- `src/routes/__root.tsx` — remove token-dependent color props from `<Meeple>`

---

## Task 1: Token and Global Layer

**Files:**

- Modify: `src/styles/tokens.css`
- Modify: `src/styles/global.css`

- [ ] **Step 1: Replace tokens.css with structural tokens only**

Replace the entire file content with:

```css
/* ─── Design Tokens ──────────────────────────────────────────────────────── */
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

- [ ] **Step 2: Replace global.css with bare reset**

Replace the entire file content with:

```css
/* ─── Global Reset ───────────────────────────────────────────────────────── */
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
}

/* ─── Screen Reader Utility ──────────────────────────────────────────────── */
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

/* ─── Reduced Motion ─────────────────────────────────────────────────────── */
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

- [ ] **Step 3: Run the build to confirm no errors**

```bash
npm run build
```

Expected: exits 0 with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/styles/tokens.css src/styles/global.css
git commit -m "style: strip tokens and global css to structural layer only"
```

---

## Task 2: Shell Layout + Mobile Drawer

**Files:**

- Modify: `src/routes/index.module.css`
- Modify: `src/routes/index.tsx`
- Modify: `src/routes/__root.tsx`

- [ ] **Step 1: Replace index.module.css with bare layout + mobile drawer**

Replace the entire file content with:

```css
.shell {
  display: grid;
  grid-template-columns: var(--size-sidebar) 1fr;
  height: calc(100vh - 72px);
  transition: grid-template-columns var(--motion-expand);
}

.shell[data-sidebar-open="false"] {
  grid-template-columns: 0 1fr;
}

.shell[data-sidebar-open="false"] .sidebar {
  visibility: hidden;
}

.resultsToolbar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}

.sidebar {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.results {
  overflow: auto;
  padding: var(--space-3);
}

.header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4);
}

.headerMeeple {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
}

/* backdrop is desktop-invisible; shown by mobile media query */
.backdrop {
  display: none;
}

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
}
```

- [ ] **Step 2: Add backdrop div to index.tsx**

In `src/routes/index.tsx`, locate the `return` statement in `SearchPage`. Add a backdrop `<div>` as the first child of `<main>`:

```tsx
return (
  <main className={styles.shell} data-sidebar-open={String(sidebarOpen)}>
    <div
      className={styles.backdrop}
      onClick={() => {
        if (sidebarOpen) toggleSidebar();
      }}
      aria-hidden="true"
    />
    <div id="sidebar" className={styles.sidebar}>
      <SearchForm
        key={JSON.stringify(search)}
        defaultValues={parseSearchParams(search)}
        onSearch={handleSearch}
      />
    </div>
    <div className={styles.results}>
      <div className={styles.resultsToolbar}>
        <Button
          variant="secondary"
          onClick={toggleSidebar}
          aria-expanded={sidebarOpen}
          aria-controls="sidebar"
        >
          {sidebarOpen ? "◀ Filters" : "▶ Filters"}
        </Button>
      </div>
      <ActiveFilters searchParams={search} onRemove={handleRemoveFilter} />
      <SearchResults
        searchParams={search}
        onNavigate={handleNavigate}
        onSort={handleSort}
      />
    </div>
  </main>
);
```

- [ ] **Step 3: Remove token-dependent color props from Meeple in \_\_root.tsx**

In `src/routes/__root.tsx`, the `<Meeple>` receives `frontFill`, `shadowFill`, and `stroke` props pointing at removed CSS tokens. Remove those props so the component uses its defaults (`frontFill="white"`, `shadowFill="black"`, `stroke="black"`):

```tsx
export const Route = createRootRoute({
  component: () => (
    <>
      <header role="banner" className={styles.header}>
        <Meeple className={styles.headerMeeple} aria-hidden="true" />
        <div>
          <p className={styles.headerTitle}>Gen Con Buddy</p>
          <p className={styles.headerSubtitle}>
            your guide to the best four days in gaming
          </p>
        </div>
      </header>
      <Outlet />
    </>
  ),
});
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: all tests pass (CSS changes don't affect JSDOM-based component tests).

- [ ] **Step 5: Run build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/routes/index.module.css src/routes/index.tsx src/routes/__root.tsx
git commit -m "style: bare shell layout with mobile drawer; add backdrop element"
```

---

## Task 3: Button Component

**Files:**

- Modify: `src/ui/Button/Button.module.css`

- [ ] **Step 1: Replace Button.module.css with structural-only styles**

Replace the entire file content with:

```css
.button {
  display: inline-block;
  cursor: pointer;
  line-height: 1;
  text-decoration: none;
}

.button:focus-visible {
  outline: 2px solid;
  outline-offset: 2px;
}

.button:disabled {
  cursor: not-allowed;
}
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/ui/Button/Button.module.css
git commit -m "style: strip Button to structural css only"
```

---

## Task 4: Search Form

**Files:**

- Modify: `src/components/SearchForm/SearchForm.module.css`

- [ ] **Step 1: Replace SearchForm.module.css with structural-only styles**

Replace the entire file content with:

```css
.form {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.filterScroll {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-3);
}

.fieldset {
  margin: 0 0 var(--space-3) 0;
  padding: 0;
}

.fieldsetBody {
  padding: var(--space-2) var(--space-3) var(--space-3);
}

.label {
  display: block;
  margin-bottom: var(--space-1);
}

.input,
.select {
  display: block;
  width: 100%;
  padding: var(--space-1) var(--space-2);
  margin-top: var(--space-1);
  margin-bottom: var(--space-2);
}

.input:disabled {
  cursor: not-allowed;
}

.rangeGroup {
  margin-bottom: var(--space-3);
}

.dayTiles {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-1);
}

.buttonBar {
  position: sticky;
  bottom: 0;
  padding: var(--space-3);
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.actionButton {
  width: 100%;
}
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/SearchForm/SearchForm.module.css
git commit -m "style: strip SearchForm to structural css only"
```

---

## Task 5: Search Results Table

**Files:**

- Modify: `src/components/SearchResults/SearchResults.module.css`

- [ ] **Step 1: Replace SearchResults.module.css with structural-only styles**

Replace the entire file content with:

```css
.tableWrapper {
  overflow-x: auto;
}

.tableWrapper table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.tableWrapper table thead th {
  white-space: nowrap;
  text-align: left;
  padding: var(--space-2) var(--space-3);
}

.tableWrapper table thead th button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-align: left;
  width: 100%;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
}

.tableWrapper table td {
  padding: var(--space-1) var(--space-3);
}

/* Day stripe — narrow left column, no padding */
.dayStripe {
  width: 6px;
  min-width: 6px;
  max-width: 6px;
  padding: 0 !important;
}

/* Column visibility panel */
.visibilityPanel {
  margin-bottom: var(--space-3);
}

.visibilityPanel summary {
  cursor: pointer;
  padding: var(--space-2) var(--space-3);
  display: inline-block;
  margin-bottom: var(--space-2);
}

.visibilityPanel details::details-content {
  height: 0;
  overflow: hidden;
  transition:
    height var(--motion-expand),
    content-visibility var(--motion-expand) allow-discrete;
}

.visibilityPanel details[open]::details-content {
  height: auto;
}

.sortIndicator {
  display: inline-block;
}

/* Column resize handle */
.resizableTh {
  position: relative;
  padding-right: 26px;
}

.resizeHandle {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 4px;
  cursor: col-resize;
  user-select: none;
}

@media (max-width: 768px) {
  .resizableTh,
  .resizeHandle {
    display: none;
  }
}
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/SearchResults/SearchResults.module.css
git commit -m "style: strip SearchResults to structural css only"
```

---

## Task 6: Column Overlays

**Files:**

- Modify: `src/components/SearchResults/ColumnActionsPopover.module.css`
- Modify: `src/components/SearchResults/ColumnResizeDialog.module.css`

- [ ] **Step 1: Replace ColumnActionsPopover.module.css**

Replace the entire file content with:

```css
.trigger {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
}

:global(th):hover .trigger,
.trigger:focus-visible,
.triggerOpen {
  opacity: 1;
}

.trigger:focus-visible {
  outline: 2px solid;
  outline-offset: 1px;
}

.popup {
  display: flex;
  flex-direction: column;
  min-width: 148px;
  z-index: var(--z-popover);
}

.action {
  background: none;
  border: none;
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  text-align: left;
  width: 100%;
}
```

- [ ] **Step 2: Replace ColumnResizeDialog.module.css**

Replace the entire file content with:

```css
.backdrop {
  position: fixed;
  inset: 0;
  z-index: calc(var(--z-modal) - 1);
}

.popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: var(--space-4);
  min-width: 260px;
  z-index: var(--z-modal);
}

.title {
  margin: 0 0 var(--space-3);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-bottom: var(--space-4);
}

.input {
  padding: var(--space-1) var(--space-2);
  width: 100%;
}

.input:focus {
  outline: 2px solid;
  outline-offset: 1px;
}

.actions {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
}

.button {
  cursor: pointer;
  padding: var(--space-1) var(--space-3);
}
```

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/SearchResults/ColumnActionsPopover.module.css src/components/SearchResults/ColumnResizeDialog.module.css
git commit -m "style: strip column overlay components to structural css only"
```

---

## Task 7: Pagination

**Files:**

- Modify: `src/components/Pagination/Pagination.module.css`

- [ ] **Step 1: Replace Pagination.module.css with structural-only styles**

Replace the entire file content with:

```css
.nav {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
  padding: var(--space-3) 0;
}

.controls {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  justify-content: flex-end;
}

.summary {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/Pagination/Pagination.module.css
git commit -m "style: strip Pagination to structural css only"
```

---

## Task 8: Active Filters + Badge

**Files:**

- Modify: `src/ui/ActiveFilters/ActiveFilters.module.css`
- Modify: `src/ui/Badge/Badge.module.css`

- [ ] **Step 1: Replace ActiveFilters.module.css**

Replace the entire file content with:

```css
.bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  padding: var(--space-2) 0;
  list-style: none;
  margin: 0;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  cursor: pointer;
}

.chip:focus-visible {
  outline: 2px solid;
  outline-offset: 2px;
}
```

- [ ] **Step 2: Replace Badge.module.css**

Replace the entire file content with:

```css
.badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
}

.conceptBadge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  white-space: nowrap;
}
```

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/ui/ActiveFilters/ActiveFilters.module.css src/ui/Badge/Badge.module.css
git commit -m "style: strip ActiveFilters and Badge to structural css only"
```

---

## Task 9: Toggle Tile

**Files:**

- Modify: `src/ui/ToggleTile/ToggleTile.module.css`

- [ ] **Step 1: Replace ToggleTile.module.css with structural-only styles**

Replace the entire file content with:

```css
.tile {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  cursor: pointer;
  user-select: none;
}

.tile:focus-visible {
  outline: 2px solid;
  outline-offset: 2px;
}

.tile:disabled {
  cursor: not-allowed;
}

.group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/ui/ToggleTile/ToggleTile.module.css
git commit -m "style: strip ToggleTile to structural css only"
```

---

## Task 10: Event Type Select

**Files:**

- Modify: `src/ui/EventTypeSelect/EventTypeSelect.module.css`

- [ ] **Step 1: Replace EventTypeSelect.module.css with structural-only styles**

Replace the entire file content with:

```css
.root {
  position: relative;
  margin-bottom: var(--space-2);
}

.label {
  display: block;
  margin-bottom: var(--space-1);
}

.inputGroup {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  cursor: text;
  min-height: 34px;
}

.inputGroup:focus-within {
  outline: 2px solid;
  outline-offset: 2px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 1px var(--space-1) 1px var(--space-2);
  white-space: nowrap;
}

.chipRemove {
  border: none;
  background: none;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
}

.input {
  flex: 1;
  min-width: 80px;
  border: none;
  background: none;
  padding: 0;
}

.input:focus {
  outline: none;
}

.trigger {
  border: none;
  background: none;
  cursor: pointer;
  padding: 0 var(--space-1);
  line-height: 1;
}

.list {
  position: absolute;
  z-index: var(--z-popover);
  padding: var(--space-1) 0;
  max-height: 240px;
  overflow-y: auto;
  width: max-content;
}

.item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  cursor: pointer;
}

.itemBadge {
  display: inline-block;
  padding: 1px var(--space-1);
  white-space: nowrap;
  flex-shrink: 0;
}

.itemName {
  flex: 1;
}

.itemIndicator {
  display: none;
  font-size: 12px;
}

.item[data-selected] .itemIndicator {
  display: inline;
}
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/ui/EventTypeSelect/EventTypeSelect.module.css
git commit -m "style: strip EventTypeSelect to structural css only"
```

---

## Task 11: Toggletip

**Files:**

- Modify: `src/ui/Toggletip/Toggletip.module.css`

- [ ] **Step 1: Replace Toggletip.module.css with structural-only styles**

Replace the entire file content with:

```css
.button {
  cursor: pointer;
}

.button:focus-visible {
  outline: 2px solid;
  outline-offset: 2px;
}

.tooltip {
  z-index: var(--z-popover);
  min-width: 200px;
}
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/ui/Toggletip/Toggletip.module.css
git commit -m "style: strip Toggletip to structural css only"
```

---

## Task 12: Event Detail

**Files:**

- Modify: `src/components/EventDetail/EventDetail.module.css`

- [ ] **Step 1: Replace EventDetail.module.css with structural-only styles**

Replace the entire file content with:

```css
.article {
  max-width: var(--size-detail-max);
  margin: 0 auto;
  padding: var(--space-4);
}

.backLink {
  margin-bottom: var(--space-4);
}

.card {
  padding: var(--space-4);
}

.gameIdBadge {
  margin: 0 0 var(--space-2) 0;
}

.title {
  padding-bottom: var(--space-3);
  margin-bottom: var(--space-4);
}

.section {
  margin-bottom: var(--space-5);
}

.sectionHeading {
  padding-bottom: var(--space-2);
  margin: 0 0 var(--space-3) 0;
}

.dl {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  margin: 0;
}

.dlFull {
  grid-column: 1 / -1;
}

.dd {
  margin: 0;
}
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/EventDetail/EventDetail.module.css
git commit -m "style: strip EventDetail to structural css only"
```

---

## Task 13: Pixel State

**Files:**

- Modify: `src/ui/PixelState/PixelState.module.css`

- [ ] **Step 1: Replace PixelState.module.css with structural-only styles**

The `loadingProgress` animation is kept — it communicates loading state by moving a progress bar, which is functional information, not decoration.

Replace the entire file content with:

```css
.state {
  text-align: center;
  padding: var(--space-5);
  margin: var(--space-4) 0;
}

.icon {
  width: 48px;
  height: 48px;
  margin: 0 auto var(--space-3);
  display: block;
}

.text {
  margin: var(--space-2) 0;
}

.subtext {
  margin: 0;
}

.progressBar {
  width: 100%;
  max-width: 200px;
  height: var(--space-3);
  margin: 0 auto var(--space-3);
  overflow: hidden;
}

.progressFill {
  height: 100%;
  animation: loadingProgress 1.5s ease-in-out infinite;
}

@keyframes loadingProgress {
  0% {
    width: 0%;
  }
  60% {
    width: 75%;
  }
  100% {
    width: 75%;
  }
}
```

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 4: Run lint**

```bash
npm run lint
```

Expected: exits 0, no errors.

- [ ] **Step 5: Commit**

```bash
git add src/ui/PixelState/PixelState.module.css
git commit -m "style: strip PixelState to structural css only"
```
