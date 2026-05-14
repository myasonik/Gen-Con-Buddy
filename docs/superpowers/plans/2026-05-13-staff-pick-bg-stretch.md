# Staff Pick Background Stretch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stretch the Wildhavens background image seamlessly across consecutive staff-pick rows by moving it from individual elements to their shared parent containers.

**Architecture:** The background image lives on the nearest bounded parent (`.tableWrapper` for desktop, `.list` for mobile). Non-pick children paint over it with explicit solid `background-color`s; pick children are transparent and reveal it. Pure CSS — no JS, no DOM restructuring.

**Tech Stack:** CSS Modules, CSS `background-image` multi-layer technique (gradient overlay + image URL), `oklch()` relative color syntax.

---

### Task 1: Fix pre-existing lint errors

These errors are on the branch before any new changes and block the commit hook. Fix them all in one pass.

**Files:**
- Modify: `src/components/ThemePopover/ThemePopover.tsx:4-5`
- Modify: `src/components/EventTable/columns.test.tsx:20`
- Modify: `src/components/ThemePopover/ThemeRadioGroup.test.tsx:11`
- Modify: `src/components/EventDetail/EventDetail.test.tsx:425`
- Modify: `src/components/EventDetail/EventDetail.test.tsx:460`

- [ ] **Fix duplicate lucide-react imports in ThemePopover.tsx**

Current lines 4–5:
```tsx
import { Sun } from "lucide-react";
import { Moon } from "lucide-react";
```
Replace with:
```tsx
import { Sun, Moon } from "lucide-react";
```

- [ ] **Fix Array destructuring in columns.test.tsx**

Current line 20:
```ts
const STAFF_PICK_GAME_ID = Array.from(STAFF_PICK_IDS)[0];
```
Replace with:
```ts
const [STAFF_PICK_GAME_ID] = Array.from(STAFF_PICK_IDS);
```

- [ ] **Fix vi.fn() missing type parameter in ThemeRadioGroup.test.tsx**

Current line 11:
```tsx
<ThemeRadioGroup theme="auto" onValueChange={vi.fn()} {...overrides} />
```
Replace with:
```tsx
<ThemeRadioGroup theme="auto" onValueChange={vi.fn<(v: ThemePreference) => void>()} {...overrides} />
```

Add the import for `ThemePreference` at the top of the file (after existing imports):
```ts
import type { ThemePreference } from "../../hooks/useTheme";
```

- [ ] **Fix Array destructuring in EventDetail.test.tsx (two sites)**

Line 425:
```ts
const gameId = WILDHAVENS_GAME_IDS[0];
```
Replace with:
```ts
const [gameId] = WILDHAVENS_GAME_IDS;
```

Line 460 (same pattern, same fix):
```ts
const gameId = WILDHAVENS_GAME_IDS[0];
```
Replace with:
```ts
const [gameId] = WILDHAVENS_GAME_IDS;
```

- [ ] **Verify lint passes**

```bash
npm run lint
```
Expected: no errors, exit 0.

- [ ] **Commit**

```bash
git add src/components/ThemePopover/ThemePopover.tsx \
        src/components/EventTable/columns.test.tsx \
        src/components/ThemePopover/ThemeRadioGroup.test.tsx \
        src/components/EventDetail/EventDetail.test.tsx
git commit -m "fix: resolve pre-existing lint errors (duplicate import, destructuring, vi.fn type)"
```

---

### Task 2: Fix failing SearchResults test and add "Staff Picks" heading

The test at `SearchResults.test.tsx:711` expects "Staff Picks" text from `StaffPickCallout`, but two things are broken: (1) the MSW handler uses `group` param to detect the staff-pick query when the actual query uses `gameId`, so the mock returns empty data; (2) `StaffPickCallout` never renders any "Staff Picks" text for the test to find.

**Files:**
- Modify: `src/components/SearchResults/SearchResults.test.tsx:700-706`
- Modify: `src/components/StaffPickCallout/StaffPickCallout.tsx`

- [ ] **Fix the MSW handler param check in SearchResults.test.tsx**

Current lines 700–706:
```tsx
server.use(
  http.get("/api/events/search", ({ request }) => {
    const url = new URL(request.url);
    const response: EventSearchResponse = url.searchParams.has("group")
      ? { data: staffPickEvents, meta: { total: staffPickEvents.length }, links: { self: "" }, error: null }
      : { data: [], meta: { total: 0 }, links: { self: "" }, error: null };
    return HttpResponse.json(response);
  }),
);
```
Replace `"group"` with `"gameId"`:
```tsx
server.use(
  http.get("/api/events/search", ({ request }) => {
    const url = new URL(request.url);
    const response: EventSearchResponse = url.searchParams.has("gameId")
      ? { data: staffPickEvents, meta: { total: staffPickEvents.length }, links: { self: "" }, error: null }
      : { data: [], meta: { total: 0 }, links: { self: "" }, error: null };
    return HttpResponse.json(response);
  }),
);
```

- [ ] **Add "Staff Picks" heading to StaffPickCallout.tsx**

The component needs a visible heading that tests (and screen readers) can find. Add an `<h2>` before the preamble paragraph. Current render block:

```tsx
return (
  <div className={styles.panel}>
    <p className={styles.preamble}>{STAFF_PICK_PREAMBLE}</p>
```
Replace with:
```tsx
return (
  <div className={styles.panel}>
    <h2 className={styles.heading}>Staff Picks</h2>
    <p className={styles.preamble}>{STAFF_PICK_PREAMBLE}</p>
```

Add a `.heading` rule to `StaffPickCallout.module.css`:
```css
.heading {
  font-size: var(--text-lg);
  font-weight: 700;
  margin: 0 0 var(--space-2);
  color: var(--color-ink);
}
```

- [ ] **Run the failing test to verify it passes**

```bash
npx vitest run src/components/SearchResults/SearchResults.test.tsx
```
Expected: all tests pass including the two "StaffPickCallout" tests at lines 696 and 714.

- [ ] **Commit**

```bash
git add src/components/SearchResults/SearchResults.test.tsx \
        src/components/StaffPickCallout/StaffPickCallout.tsx \
        src/components/StaffPickCallout/StaffPickCallout.module.css
git commit -m "fix: repair failing StaffPickCallout test and add Staff Picks heading"
```

---

### Task 3: Move background image to .tableWrapper (desktop)

The image and overlay currently repeat on every `tr[data-staff-pick]`. Move them to `.tableWrapper` so consecutive pick rows reveal adjacent parts of one continuous image.

**Files:**
- Modify: `src/components/EventTable/EventTable.module.css`

- [ ] **Add background to .tableWrapper**

Find the `.tableWrapper` rule (currently just `overflow-x: scroll; margin-top: -0.0625rem;`) and add the background declarations. New rule:

```css
.tableWrapper {
  overflow-x: scroll;
  margin-top: -0.0625rem;
  background-image:
    linear-gradient(
      oklch(from var(--color-surface-page) l c h / 0.82),
      oklch(from var(--color-surface-page) l c h / 0.82)
    ),
    url('/wildhavens-bg.webp');
  background-size: cover;
  background-position: center 60%;
}
```

- [ ] **Strip background-image from tr[data-staff-pick]**

The current rule for `tr[data-staff-pick]` is:
```css
.tableWrapper table tbody tr[data-staff-pick],
.tableWrapper table tbody tr[data-staff-pick]:nth-child(odd),
.tableWrapper table tbody tr[data-staff-pick]:nth-child(even) {
  background-color: var(--color-surface-page);
  background-image:
    linear-gradient(
      oklch(from var(--color-surface-page) l c h / 0.82),
      oklch(from var(--color-surface-page) l c h / 0.82)
    ),
    url('/wildhavens-bg.webp');
  background-size: cover;
  background-position: center 60%;
}
```
Replace entirely with (transparent so the parent image shows through):
```css
.tableWrapper table tbody tr[data-staff-pick],
.tableWrapper table tbody tr[data-staff-pick]:nth-child(odd),
.tableWrapper table tbody tr[data-staff-pick]:nth-child(even) {
  background: transparent;
}
```

- [ ] **Update dark-mode rule for .tableWrapper**

The existing dark-mode block repeats the `background-image` on `tr[data-staff-pick]`. Replace it with the background on `.tableWrapper` instead:

Find and replace the entire existing dark-mode block:
```css
:global([data-theme="dark"]) .tableWrapper table tbody tr[data-staff-pick],
:global([data-theme="dark"]) .tableWrapper table tbody tr[data-staff-pick]:nth-child(odd),
:global([data-theme="dark"]) .tableWrapper table tbody tr[data-staff-pick]:nth-child(even) {
  background-color: var(--color-surface-page);
  background-image:
    linear-gradient(
      oklch(from var(--color-surface-page) l c h / 0.82),
      oklch(from var(--color-surface-page) l c h / 0.82)
    ),
    url('/wildhavens-bg.webp');
}
```
Replace with:
```css
:global([data-theme="dark"]) .tableWrapper {
  background-image:
    linear-gradient(
      oklch(from var(--color-surface-page) l c h / 0.82),
      oklch(from var(--color-surface-page) l c h / 0.82)
    ),
    url('/wildhavens-bg.webp');
}
```

- [ ] **Run tests**

```bash
npx vitest run src/components/EventTable/
```
Expected: all pass. (No new tests for a CSS-only change — existing tests exercise `data-staff-pick` attribute presence.)

- [ ] **Commit**

```bash
git add src/components/EventTable/EventTable.module.css
git commit -m "feat: stretch staff pick bg image across consecutive desktop rows via .tableWrapper"
```

---

### Task 4: Move background image to .list (mobile)

Same pattern as Task 3 but for `EventListMobile.module.css`. Non-pick items currently rely on transparent backgrounds; they need explicit `background-color` to cover the list's image.

**Files:**
- Modify: `src/components/EventTable/EventListMobile.module.css`

- [ ] **Add background to .list**

Current `.list` rule:
```css
.list {
  list-style: none;
  margin: var(--space-2) 0 0;
  padding: 0;
  border-top: var(--border-width) solid var(--color-ink-divider);
}
```
Replace with:
```css
.list {
  list-style: none;
  margin: var(--space-2) 0 0;
  padding: 0;
  border-top: var(--border-width) solid var(--color-ink-divider);
  background-image:
    linear-gradient(
      oklch(from var(--color-surface-page) l c h / 0.82),
      oklch(from var(--color-surface-page) l c h / 0.82)
    ),
    url('/wildhavens-bg.webp');
  background-size: cover;
  background-position: center 60%;
}
```

Add a dark-mode rule immediately after `.list`:
```css
:global([data-theme="dark"]) .list {
  background-image:
    linear-gradient(
      oklch(from var(--color-surface-page) l c h / 0.82),
      oklch(from var(--color-surface-page) l c h / 0.82)
    ),
    url('/wildhavens-bg.webp');
}
```

- [ ] **Give non-pick .item an explicit base background**

Current `.item` rule:
```css
.item {
  border-bottom: var(--border-width) solid var(--color-ink-divider);
}
```
Replace with:
```css
.item {
  border-bottom: var(--border-width) solid var(--color-ink-divider);
  background-color: var(--color-surface-page);
}
```

(`.item:nth-child(even)` already has `var(--color-surface-row-alt)` — no change needed.)

- [ ] **Make staff-pick items transparent**

Current `.item[data-staff-pick]` rule:
```css
.item[data-staff-pick] {
  background-color: var(--color-accent-surface);
}
```
Replace with:
```css
.item[data-staff-pick],
.item[data-staff-pick]:nth-child(even) {
  background-color: transparent;
}
```
(The `:nth-child(even)` override is needed so the alternating row rule doesn't win for even-positioned pick items.)

- [ ] **Run tests**

```bash
npx vitest run src/components/EventTable/EventListMobile
```
Expected: all pass.

- [ ] **Commit**

```bash
git add src/components/EventTable/EventListMobile.module.css
git commit -m "feat: stretch staff pick bg image across consecutive mobile list items via .list"
```

---

### Task 5: Visual smoke test

No automated tests cover visual CSS. Work through the checklist manually using the dev server.

- [ ] **Start the dev server**

```bash
npm run dev
```

- [ ] **Desktop table — single pick**
  - Search for an event, then filter to show one Wildhavens game ID (e.g. `BGM26ND310303`).
  - Confirm the image is visible in that row with the semi-transparent overlay.
  - Confirm adjacent non-pick rows show their normal surface color, not the image.

- [ ] **Desktop table — multiple consecutive picks**
  - Use a filter that returns two or more Wildhavens events consecutively.
  - Confirm the image stretches continuously across all pick rows (no repeated crop).
  - Confirm non-pick rows between groups still cover the image cleanly.

- [ ] **Desktop dark mode**
  - Toggle to dark theme via the theme popover.
  - Confirm the image is still visible through pick rows with the dark overlay.

- [ ] **Desktop horizontal scroll**
  - Narrow the browser window to trigger horizontal scroll.
  - Scroll the table — confirm the background stays fixed to the wrapper (parallax effect).

- [ ] **Mobile card list — multiple consecutive picks**
  - Resize to mobile width (< 960px) or use browser devtools.
  - Confirm the image stretches across consecutive pick cards.
  - If the image looks badly zoomed (very tight crop) on a long list, switch `.list` to `background-size: 100% auto` in `EventListMobile.module.css` and re-test.

- [ ] **StaffPickCallout all-picks list (mobile)**
  - Clear the search to trigger the empty state and show StaffPickCallout.
  - On mobile, confirm the entire picks list shows the image stretching across all cards.

- [ ] **Mobile dark mode**
  - Toggle dark theme and repeat the mobile checks.

- [ ] **Commit any background-size tuning done in this task**

If you changed `background-size` on `.list` from `cover` to `100% auto`:
```bash
git add src/components/EventTable/EventListMobile.module.css
git commit -m "fix: use background-size 100% auto on mobile list to prevent over-zoom"
```
