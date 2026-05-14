# Mobile Hamburger Nav Design

## Goal

On mobile viewports (≤60rem), replace the horizontal nav bar with a hamburger button that opens a dropdown popover containing the nav links and an inline theme radio group.

## Architecture

Two targeted changes:

1. **Extract `ThemeRadioGroup`** from `ThemePopover` into a standalone component so the radio UI can be reused inline in the mobile nav without nesting popovers.
2. **Create `MobileNav`** — a `@base-ui/react` Popover triggered by a hamburger button, containing nav links and the inline radio group.

CSS in `__root.module.css` hides the desktop `<nav>` at ≤60rem and shows `MobileNav` instead. Both elements exist in the DOM; the breakpoint determines which is visible.

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/components/ThemePopover/ThemeRadioGroup.tsx` | Create | Fieldset + RadioGroup — no side effects, just renders options |
| `src/components/ThemePopover/ThemeRadioGroup.test.tsx` | Create | Unit tests for the radio group in isolation |
| `src/components/ThemePopover/ThemePopover.tsx` | Modify | Delegates radio rendering to `ThemeRadioGroup` |
| `src/components/MobileNav/MobileNav.tsx` | Create | Hamburger trigger + Popover with links + inline radio group |
| `src/components/MobileNav/MobileNav.module.css` | Create | Styles for hamburger trigger and dropdown panel |
| `src/components/MobileNav/MobileNav.test.tsx` | Create | Tests for the mobile nav |
| `src/routes/__root.tsx` | Modify | Render `MobileNav` alongside `<nav>`; pass `theme`/`setTheme` |
| `src/routes/__root.module.css` | Modify | Hide `.nav` and show `.mobileNav` at ≤60rem |
| `src/routes/__root.test.tsx` | Modify | Add test: hamburger button present on mobile |

---

## ThemeRadioGroup

**File:** `src/components/ThemePopover/ThemeRadioGroup.tsx`

A pure presentational component. Renders the `<fieldset>` + `<legend>` + `RadioGroup` with Light, Dark, and Auto options. Handles no side effects — caller is responsible for calling `announce()` and any open-state changes.

```ts
interface ThemeRadioGroupProps {
  theme: ThemePreference;
  onValueChange: (v: ThemePreference) => void;
}
```

- Imports `RadioGroup` and `Radio` from `@base-ui/react`
- Imports `Sun`, `Moon`, `Eclipse` icons
- Imports `styles` from `ThemePopover.module.css` — reuses existing CSS classes (`.fieldset`, `.radioGroup`, `.option`, `.radio`, `.radioIndicator`)
- No new CSS file needed — all classes already exist in `ThemePopover.module.css`

**ThemePopover update:** The existing `handleChange` (which calls `setTheme`, `announce`, `setOpen(false)`) is passed as `onValueChange` to `ThemeRadioGroup`. No behavior change — all existing ThemePopover tests continue to pass.

---

## MobileNav

**File:** `src/components/MobileNav/MobileNav.tsx`

```ts
interface MobileNavProps {
  theme: ThemePreference;
  setTheme: (v: ThemePreference) => void;
}
```

**Trigger:** A `<Button icon>` with `aria-label="Navigation"` rendering a `Menu` icon (from `lucide-react`). Uses `Popover.Trigger render={<Button icon />}` — the same pattern as `ThemePopover`.

**Popup contents (top to bottom):**
1. Search `<Link to="/">` — clicking closes the popover
2. Changelog `<Link to="/changelog">` — clicking closes the popover
3. A `<hr>` divider
4. `<ThemeRadioGroup>` — inline, no nesting

**Close behavior:**
- Link clicks: close the popover (`setOpen(false)` in the click handler)
- Theme selection: calls `setTheme(next)` and `announce(`Theme: ${LABELS[next]}`)` but does **not** close the popover — user may still want to navigate after changing theme

**Popover configuration:**
- `Popover.Positioner align="end" sideOffset={4}` — drops below and right-aligns to the trigger
- `z-index: var(--z-popover)` on the positioner

**Changelog link search params:** must pass the same `search` object as the desktop nav to avoid TanStack Router type errors:
```ts
search={{ open: [], eventType: undefined, days: undefined, timeStart: undefined, timeEnd: undefined }}
```

---

## MobileNav CSS

**File:** `src/components/MobileNav/MobileNav.module.css`

```css
/* ─── Hamburger trigger ──────────────────────────────────────────────────── */
.trigger {
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: var(--color-ink-faint);
}

.trigger:hover,
.trigger:focus-visible,
.trigger[data-popup-open] {
  background: var(--color-surface-hover);
  color: var(--color-ink);
}

/* ─── Popover shell ──────────────────────────────────────────────────────── */
.positioner {
  z-index: var(--z-popover);
}

.popup {
  composes: surface from "../../styles/popup.module.css";
  min-width: 14rem;
  border-radius: var(--radius-card);
  padding: var(--space-2) 0;
}

/* ─── Nav links ──────────────────────────────────────────────────────────── */
.link {
  display: block;
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-slab);
  font-size: var(--text-md);
  font-weight: 600;
  letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase;
  text-decoration: none;
  color: var(--color-ink-muted);
  transition: color var(--motion-hover);
}

.link:hover {
  color: var(--color-ink);
  background: var(--color-surface-hover);
}

.link[data-status="active"] {
  color: var(--color-accent);
}

/* ─── Divider ────────────────────────────────────────────────────────────── */
.divider {
  border: none;
  border-top: var(--border-width) solid var(--color-ink-divider);
  margin: var(--space-1) 0;
}
```

---

## Responsive wiring in `__root.module.css`

Add `.mobileNav` class and update the existing `@media (width <= 60rem)` block:

```css
.mobileNav {
  display: none;
}

/* inside the existing @media (width <= 60rem) block: */
.nav {
  display: none;
}

.mobileNav {
  display: flex;
  margin-left: auto;
}
```

`margin-left: auto` on `.mobileNav` pushes the hamburger to the right edge of the header flex row on mobile (where the tagline is hidden and no longer consumes remaining space).

---

## `__root.tsx` changes

```tsx
import { MobileNav } from "../components/MobileNav/MobileNav";

// In AppShell, add className to nav and add MobileNav sibling:
<nav className={rootStyles.nav}>
  <Link ...>Search</Link>
  <Link ...>Changelog</Link>
  <ThemePopover theme={theme} setTheme={setTheme} />
</nav>
<div className={rootStyles.mobileNav}>
  <MobileNav theme={theme} setTheme={setTheme} />
</div>
```

---

## Tests

### `ThemeRadioGroup.test.tsx`

- Renders three radio options (Light, Dark, Auto)
- Correct radio is checked for each `theme` value
- `onValueChange` called with `"light"` / `"dark"` / `"auto"` on radio click

### `MobileNav.test.tsx`

- Renders a button with `aria-label="Navigation"` 
- Clicking the button opens the popover showing Search link, Changelog link, and three radio options
- Clicking the Search link closes the popover
- Clicking the Changelog link closes the popover
- Clicking a radio option does NOT close the popover
- Clicking a radio option calls `setTheme` with the correct value
- Clicking a radio option fires `announce("Theme: ...")` 
### `__root.test.tsx` addition

```ts
test("hamburger button is present in the nav", () => {
  await renderRoute("/");
  expect(screen.getByRole("button", { name: "Navigation" })).toBeInTheDocument();
});
```

---

## Constraints

- No new dependencies — `Menu` is already in `lucide-react` (used alongside `X` in `Drawer.tsx`)
- CSS Modules throughout
- No inline `aria-live` — all announcements via `announce()`
- Breakpoint `60rem` — consistent with all other responsive breakpoints in the codebase
- TDD: write tests first for every new file
