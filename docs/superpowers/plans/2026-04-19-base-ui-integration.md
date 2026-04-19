# Base UI Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hand-rolled interactive primitives with Base UI headless components to eliminate accessibility gaps, add portal-based positioning, and consolidate Button/LinkButton into a single polymorphic component.

**Architecture:** Install `@base-ui-components/react`. Migrate `Toggletip` → `Popover` (ports, positioning, outside-click); `ToggleTile` → `Toggle` + `ToggleTileGroup` (arrow-key navigation); `Button` → wraps Base UI Button with render prop (eliminates `LinkButton`). Also fix two non-Base-UI a11y issues discovered in review: `PixelState` must call `announce()`, and `BoolBadge` must use visually-hidden text instead of `aria-label` on a `<span>`.

**Tech Stack:** React 18, TypeScript, CSS Modules, `@base-ui-components/react`, Vitest, Testing Library

---

## File Map

**Modified files:**

- `AGENTS.md` — update "No external UI component libraries" to allow headless primitives
- `src/ui/Toggletip/Toggletip.tsx` — rewrite using `Popover.Root/Trigger/Portal/Positioner/Popup`
- `src/ui/Toggletip/Toggletip.module.css` — remove hand-rolled absolute positioning (Positioner handles it)
- `src/ui/Toggletip/Toggletip.test.tsx` — add outside-click dismissal test; update to test `aria-expanded`
- `src/ui/ToggleTile/ToggleTile.tsx` — rewrite `ToggleTile` with `Toggle.Root`; add `ToggleTileGroup` export using `ToggleGroup.Root`
- `src/ui/ToggleTile/ToggleTile.module.css` — replace `.selected`/`.selected:hover` with `[data-pressed]`/`[data-pressed]:hover`; add `.group`
- `src/ui/ToggleTile/ToggleTile.test.tsx` — `selected` → `pressed`; add `ToggleTileGroup` arrow-key navigation tests
- `src/ui/Button/Button.tsx` — wrap Base UI `Button`; delete `LinkButton`
- `src/ui/Button/Button.test.tsx` — replace `LinkButton` describe with `render prop` describe
- `src/ui/PixelState/PixelState.tsx` — import `announce`; call in `useEffect`
- `src/ui/PixelState/PixelState.test.tsx` — set up live region nodes; assert announcement text
- `src/ui/Badge/Badge.tsx` — `BoolBadge`: replace `aria-label` with `sr-only` span
- `src/ui/Badge/Badge.test.tsx` — assert sr-only text instead of aria-label
- `src/components/SearchForm/SearchForm.tsx` — use `ToggleTileGroup`; remove `handleDayChange`; simplify days state
- `src/components/EventDetail/EventDetail.tsx` — replace `<LinkButton to="/">` with `<Button render={<Link to="/" />}>`
- `package.json` / `package-lock.json` — add `@base-ui-components/react`

---

## Task 1: Commit baseline, update AGENTS.md, install Base UI

**Files:**

- Modify: `AGENTS.md`
- Modify: `package.json`

- [ ] **Step 1: Stage and commit all unstaged design system work**

```bash
git add -A
git commit -m "feat: design system — CSS split, Storybook, Button, Toggletip, PixelState, ToggleTile, Badge primitives"
```

- [ ] **Step 2: Update AGENTS.md philosophy line**

Open `AGENTS.md`. Replace:

```
No external UI component libraries. All styling via CSS Modules; global tokens in `src/styles/tokens.css`; reset/utilities in `src/styles/global.css`.
```

With:

```
No external *styled* UI component libraries. Headless accessibility primitives (`@base-ui-components/react`) are allowed for interactive overlays and controls where the a11y cost of hand-rolling is high (popover, toggle, dialog). All styling via CSS Modules; global tokens in `src/styles/tokens.css`; reset/utilities in `src/styles/global.css`.
```

- [ ] **Step 3: Install Base UI**

```bash
npm install @base-ui-components/react
```

- [ ] **Step 4: Verify install**

Run: `npm test -- --run`
Expected: all existing tests still pass (no count change — nothing broken by install).

- [ ] **Step 5: Commit**

```bash
git add AGENTS.md package.json package-lock.json
git commit -m "chore: add @base-ui-components/react; allow headless primitives in AGENTS.md"
```

---

## Task 2: Migrate Toggletip → Base UI Popover

**Files:**

- Modify: `src/ui/Toggletip/Toggletip.tsx`
- Modify: `src/ui/Toggletip/Toggletip.module.css`
- Modify: `src/ui/Toggletip/Toggletip.test.tsx`

**Why:** The current Toggletip has four real a11y/usability bugs: (1) no `aria-describedby` wiring between trigger and tooltip content; (2) no outside-click dismissal; (3) no viewport-edge positioning — clips inside overflow containers and tables; (4) not portaled — clipped by `overflow:hidden` ancestors. Base UI `Popover` closes all of them.

- [ ] **Step 1: Update tests first**

Replace the entire contents of `src/ui/Toggletip/Toggletip.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toggletip } from "./Toggletip";

describe("Toggletip", () => {
  it("renders a ? button with the given aria-label", () => {
    render(
      <Toggletip
        label="Why are day filters disabled?"
        message="Because reasons"
      />,
    );
    expect(
      screen.getByRole("button", { name: "Why are day filters disabled?" }),
    ).toBeInTheDocument();
  });

  it("does not show tooltip initially", () => {
    render(<Toggletip label="Why?" message="Because" />);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows tooltip content when button is clicked", async () => {
    render(<Toggletip label="Why?" message="Clear the day checkboxes" />);
    await userEvent.click(screen.getByRole("button", { name: "Why?" }));
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "Clear the day checkboxes",
    );
  });

  it("hides tooltip when button is clicked a second time", async () => {
    render(<Toggletip label="Why?" message="Because" />);
    const btn = screen.getByRole("button", { name: "Why?" });
    await userEvent.click(btn);
    await userEvent.click(btn);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("hides tooltip on Escape key", async () => {
    render(<Toggletip label="Why?" message="Because" />);
    await userEvent.click(screen.getByRole("button", { name: "Why?" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("hides tooltip when clicking outside", async () => {
    render(
      <div>
        <Toggletip label="Why?" message="Because" />
        <button type="button">Outside</button>
      </div>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Why?" }));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("sets aria-expanded on trigger when open", async () => {
    render(<Toggletip label="Why?" message="Because" />);
    const btn = screen.getByRole("button", { name: "Why?" });
    expect(btn).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "true");
  });
});
```

- [ ] **Step 2: Run tests to confirm failures**

Run: `npm test -- --run src/ui/Toggletip/Toggletip.test.tsx`
Expected: FAIL — "hides tooltip when clicking outside" and "sets aria-expanded" fail with current implementation.

- [ ] **Step 3: Rewrite Toggletip.tsx**

Replace the entire contents of `src/ui/Toggletip/Toggletip.tsx`:

```tsx
import { Popover } from "@base-ui-components/react/popover";
import styles from "./Toggletip.module.css";

interface ToggletipProps {
  label: string;
  message: string;
}

export function Toggletip({ label, message }: ToggletipProps) {
  return (
    <Popover.Root>
      <Popover.Trigger aria-label={label} className={styles.button}>
        ?
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={4}>
          <Popover.Popup
            render={<span role="tooltip" />}
            className={styles.tooltip}
          >
            {message}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
```

- [ ] **Step 4: Update Toggletip.module.css**

Replace the entire contents of `src/ui/Toggletip/Toggletip.module.css`:

```css
.button {
  font-family: var(--font-pixel);
  font-size: var(--text-badge);
  background: var(--color-parchment);
  border: 2px solid var(--color-bark);
  color: var(--color-bark);
  padding: var(--space-1) var(--space-2);
  cursor: pointer;
}

.button:focus-visible {
  outline: 2px solid var(--color-bark-dark);
  outline-offset: 2px;
}

.tooltip {
  z-index: var(--z-popover);
  background: var(--color-parchment-light);
  border: 2px solid var(--color-bark);
  padding: var(--space-2);
  font-family: var(--font-data);
  font-size: var(--text-small);
  color: var(--color-ink);
  min-width: 200px;
  box-shadow: var(--shadow-panel);
}
```

Changes from original: removed `.wrapper`, removed `position: absolute`, `left: 0`, `top: 100%` from `.tooltip` (Positioner handles this). Kept `z-index` — portaled elements still need it.

- [ ] **Step 5: Run Toggletip tests**

Run: `npm test -- --run src/ui/Toggletip/Toggletip.test.tsx`
Expected: 7 tests pass.

- [ ] **Step 6: Run full suite**

Run: `npm test -- --run`
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/ui/Toggletip/
git commit -m "feat(Toggletip): migrate to Base UI Popover — portaled, positioned, outside-click dismiss, aria-expanded"
```

---

## Task 3: Migrate ToggleTile → Base UI Toggle + ToggleTileGroup

**Files:**

- Modify: `src/ui/ToggleTile/ToggleTile.tsx`
- Modify: `src/ui/ToggleTile/ToggleTile.module.css`
- Modify: `src/ui/ToggleTile/ToggleTile.test.tsx`
- Modify: `src/components/SearchForm/SearchForm.tsx`

**Why:** Base UI `Toggle` adds `data-pressed` for CSS styling (cleaner than the conditional class), and `ToggleGroup` adds roving-tabindex arrow-key navigation across the day tiles for free.

**API change:** `ToggleTile` prop `selected` → `pressed` (Base UI's natural API). `ToggleTileGroup` is a new export. `SearchForm` switches from individual `onClick` handlers to a single `ToggleTileGroup` `onValueChange`.

- [ ] **Step 1: Update ToggleTile tests**

Replace the entire contents of `src/ui/ToggleTile/ToggleTile.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToggleTile, ToggleTileGroup } from "./ToggleTile";

describe("ToggleTile", () => {
  it("renders as a button with the given label", () => {
    render(<ToggleTile>Wed</ToggleTile>);
    expect(screen.getByRole("button", { name: "Wed" })).toBeInTheDocument();
  });

  it("has aria-pressed='false' by default", () => {
    render(<ToggleTile>Thu</ToggleTile>);
    expect(screen.getByRole("button", { name: "Thu" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("has aria-pressed='true' when pressed", () => {
    render(<ToggleTile pressed>Fri</ToggleTile>);
    expect(screen.getByRole("button", { name: "Fri" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("is disabled when disabled prop is set", () => {
    render(<ToggleTile disabled>Sat</ToggleTile>);
    expect(screen.getByRole("button", { name: "Sat" })).toBeDisabled();
  });

  it("calls onPressedChange when clicked", async () => {
    const handleChange = vi.fn();
    render(<ToggleTile onPressedChange={handleChange}>Sun</ToggleTile>);
    await userEvent.click(screen.getByRole("button", { name: "Sun" }));
    expect(handleChange).toHaveBeenCalledOnce();
  });

  it("does not call onPressedChange when disabled", async () => {
    const handleChange = vi.fn();
    render(
      <ToggleTile disabled onPressedChange={handleChange}>
        Wed
      </ToggleTile>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Wed" }), {
      pointerEventsCheck: 0,
    });
    expect(handleChange).not.toHaveBeenCalled();
  });
});

describe("ToggleTileGroup", () => {
  it("marks pressed tiles via value prop", () => {
    render(
      <ToggleTileGroup value={["wed"]} onValueChange={() => {}}>
        <ToggleTile value="wed">Wed</ToggleTile>
        <ToggleTile value="thu">Thu</ToggleTile>
      </ToggleTileGroup>,
    );
    expect(screen.getByRole("button", { name: "Wed" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Thu" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("calls onValueChange when a tile is clicked", async () => {
    const handleChange = vi.fn();
    render(
      <ToggleTileGroup value={[]} onValueChange={handleChange}>
        <ToggleTile value="wed">Wed</ToggleTile>
      </ToggleTileGroup>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Wed" }));
    expect(handleChange).toHaveBeenCalledOnce();
  });

  it("navigates between tiles with arrow keys", async () => {
    render(
      <ToggleTileGroup value={[]} onValueChange={() => {}}>
        <ToggleTile value="wed">Wed</ToggleTile>
        <ToggleTile value="thu">Thu</ToggleTile>
        <ToggleTile value="fri">Fri</ToggleTile>
      </ToggleTileGroup>,
    );
    screen.getByRole("button", { name: "Wed" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Thu" })).toHaveFocus();
  });

  it("disables all tiles when group is disabled", () => {
    render(
      <ToggleTileGroup value={[]} onValueChange={() => {}} disabled>
        <ToggleTile value="wed">Wed</ToggleTile>
        <ToggleTile value="thu">Thu</ToggleTile>
      </ToggleTileGroup>,
    );
    expect(screen.getByRole("button", { name: "Wed" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Thu" })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run tests to confirm failures**

Run: `npm test -- --run src/ui/ToggleTile/ToggleTile.test.tsx`
Expected: FAIL — `ToggleTileGroup` is not exported, `pressed` prop doesn't exist on current ToggleTile.

- [ ] **Step 3: Rewrite ToggleTile.tsx**

Replace the entire contents of `src/ui/ToggleTile/ToggleTile.tsx`:

```tsx
import React from "react";
import { Toggle } from "@base-ui-components/react/toggle";
import { ToggleGroup } from "@base-ui-components/react/toggle-group";
import styles from "./ToggleTile.module.css";

export interface ToggleTileProps extends Toggle.Root.Props {}

export const ToggleTile = React.forwardRef<HTMLButtonElement, ToggleTileProps>(
  function ToggleTile({ className, ...props }, ref) {
    return (
      <Toggle.Root
        ref={ref}
        className={[styles.tile, className].filter(Boolean).join(" ")}
        {...props}
      />
    );
  },
);

export interface ToggleTileGroupProps extends ToggleGroup.Root.Props {}

export function ToggleTileGroup({ className, ...props }: ToggleTileGroupProps) {
  return (
    <ToggleGroup.Root
      toggleMultiple
      className={[styles.group, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
```

Note: No need to conditionally apply a selected class — Base UI Toggle automatically adds `data-pressed` attribute, which the CSS handles via attribute selectors.

- [ ] **Step 4: Update ToggleTile.module.css**

Replace the entire contents of `src/ui/ToggleTile/ToggleTile.module.css`:

```css
.tile {
  display: inline-block;
  font-family: var(--font-pixel);
  font-size: var(--text-label);
  color: var(--color-bark);
  border: 2px solid var(--color-bark);
  background: transparent;
  padding: var(--space-1) var(--space-2);
  cursor: pointer;
  user-select: none;
  box-shadow: var(--shadow-button);
  transition:
    box-shadow var(--motion-press),
    transform var(--motion-press);
}

.tile:hover {
  background: var(--color-parchment-light);
}

.tile:active {
  box-shadow: var(--shadow-button-active);
  transform: translate(2px, 2px);
}

.tile:focus-visible {
  outline: 2px solid var(--color-bark-dark);
  outline-offset: 2px;
}

.tile:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tile[data-pressed] {
  background: var(--color-bark);
  color: var(--color-parchment);
}

.tile[data-pressed]:hover {
  background: var(--color-bark-light);
  color: var(--color-ink);
}

.group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
```

Changes: `.selected` → `.tile[data-pressed]`; `.selected:hover` → `.tile[data-pressed]:hover`; added `.group` for ToggleTileGroup layout.

- [ ] **Step 5: Run ToggleTile tests**

Run: `npm test -- --run src/ui/ToggleTile/ToggleTile.test.tsx`
Expected: 10 tests pass (6 ToggleTile + 4 ToggleTileGroup).

- [ ] **Step 6: Update SearchForm.tsx**

Read `src/components/SearchForm/SearchForm.tsx`. Make these changes:

1. Add `ToggleTileGroup` to the ToggleTile import:

```tsx
import { ToggleTile, ToggleTileGroup } from "../../ui/ToggleTile/ToggleTile";
```

2. Remove the `selectedDays` Set and `handleDayChange` function. The `days` watch stays:

```tsx
const days = watch("days") ?? "";
// Remove: const selectedDays = new Set(days ? days.split(",") : []);
// Remove: const handleDayChange = (key: string, checked: boolean) => { ... };
```

3. Replace the day tiles section (inside the DAYS fieldset, after the Toggletip):

```tsx
<ToggleTileGroup
  value={days ? days.split(",") : []}
  onValueChange={(v) =>
    setValue("days", DAY_KEYS.filter((d) => v.includes(d)).join(","))
  }
  disabled={daysDisabled}
  className={styles.dayTiles}
>
  {DAY_KEYS.map((key) => (
    <ToggleTile key={key} value={key}>
      {DAY_LABELS[key]}
    </ToggleTile>
  ))}
</ToggleTileGroup>
```

Note: `DAY_KEYS.filter((d) => v.includes(d)).join(",")` preserves canonical day order (wed, thu, fri, sat, sun) regardless of selection order.

- [ ] **Step 7: Run full suite**

Run: `npm test -- --run`
Expected: all tests pass. The SearchForm tests should still pass because the observable behavior (aria-pressed, disabled, submit values) is unchanged — only the implementation changed.

If SearchForm day tests fail, they are likely querying by `getByRole("button", { name: day })`. ToggleTileGroup renders a `<div>` wrapper, not a button, so this should not conflict.

- [ ] **Step 8: Commit**

```bash
git add src/ui/ToggleTile/ src/components/SearchForm/SearchForm.tsx
git commit -m "feat(ToggleTile): migrate to Base UI Toggle + ToggleTileGroup with arrow-key navigation"
```

---

## Task 4: Consolidate Button using Base UI render prop + delete LinkButton

**Files:**

- Modify: `src/ui/Button/Button.tsx`
- Modify: `src/ui/Button/Button.test.tsx`
- Modify: `src/components/EventDetail/EventDetail.tsx`

**Why:** `Button` and `LinkButton` duplicate identical styling wiring. Every future variant, size, or state must be added twice. Base UI `Button`'s `render` prop enables polymorphism: `<Button render={<Link to="/" />}>` renders a styled link without a separate component. `LinkButton` can be deleted.

- [ ] **Step 1: Update Button tests**

Replace the `describe("LinkButton", ...)` block at the bottom of `src/ui/Button/Button.test.tsx` with:

```tsx
describe("Button render prop", () => {
  it("renders as a link when given a Link render element", async () => {
    await renderWithRouter(<Button render={<Link to="/" />}>Back</Button>);
    expect(screen.getByRole("link", { name: "Back" })).toBeInTheDocument();
  });

  it("navigates to the given route via render prop", async () => {
    await renderWithRouter(
      <Button render={<Link to="/" />}>Back to results</Button>,
    );
    expect(
      screen.getByRole("link", { name: "Back to results" }),
    ).toHaveAttribute("href", "/");
  });
});
```

Also add `Link` to the import at the top of the test file (it may already be imported via the `renderWithRouter` setup — check the file):

```tsx
import {
  Link,
  createRootRoute,
  createRouter,
  RouterProvider,
  createMemoryHistory,
} from "@tanstack/react-router";
```

- [ ] **Step 2: Run tests to confirm failure**

Run: `npm test -- --run src/ui/Button/Button.test.tsx`
Expected: FAIL — "renders as a link when given a Link render element" fails because `Button` doesn't yet accept `render` prop. The `LinkButton` tests that were there before are now gone, so the test count may drop then rise.

- [ ] **Step 3: Rewrite Button.tsx**

Replace the entire contents of `src/ui/Button/Button.tsx`:

```tsx
import React from "react";
import { Button as BaseButton } from "@base-ui-components/react/button";
import type { ButtonProps as BaseButtonProps } from "@base-ui-components/react/button";
import styles from "./Button.module.css";

export const BUTTON_VARIANTS = ["primary", "secondary"] as const;
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

interface ButtonProps extends BaseButtonProps {
  variant?: ButtonVariant;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = "primary", className, ...props }, ref) {
    return (
      <BaseButton
        ref={ref}
        className={[styles.button, styles[variant], className]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    );
  },
);
```

`LinkButton` is deleted — use `<Button render={<Link to="..." />}>` instead.

Note on types: `BaseButtonProps` is the props type from `@base-ui-components/react/button`. It includes the `render` prop. If the package doesn't export `ButtonProps` directly, use the alternative:

```tsx
import { Button as BaseButton } from "@base-ui-components/react/button";
// Use ComponentPropsWithRef<typeof BaseButton> if ButtonProps is not exported
```

Check after install: run `node -e "const b = require('@base-ui-components/react/button'); console.log(Object.keys(b))"` to see exports. Adjust the import if needed.

- [ ] **Step 4: Update EventDetail.tsx**

Read `src/components/EventDetail/EventDetail.tsx`. Find the `LinkButton` import and usage.

Replace:

```tsx
import { LinkButton } from "../../ui/Button/Button";
```

With (add `Link` import if not present):

```tsx
import { Button } from "../../ui/Button/Button";
import { Link } from "@tanstack/react-router";
```

Replace the `<LinkButton>` usage:

```tsx
<LinkButton to="/" className={styles.backLink}>
  ◀ Back to results
</LinkButton>
```

With:

```tsx
<Button
  render={<Link to="/" />}
  variant="secondary"
  className={styles.backLink}
>
  ◀ Back to results
</Button>
```

- [ ] **Step 5: Run Button tests**

Run: `npm test -- --run src/ui/Button/Button.test.tsx`
Expected: 8 tests pass (6 Button + 2 render prop).

- [ ] **Step 6: Run full suite**

Run: `npm test -- --run`
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/ui/Button/ src/components/EventDetail/EventDetail.tsx
git commit -m "feat(Button): use Base UI render prop for polymorphism; delete LinkButton"
```

---

## Task 5: Fix PixelState — add announce() for screen reader announcements

**Files:**

- Modify: `src/ui/PixelState/PixelState.tsx`
- Modify: `src/ui/PixelState/PixelState.test.tsx`

**Why:** Loading/error/empty states render silently. A screen reader user navigating by keyboard gets no notification that the UI entered a loading or error state. `AGENTS.md` requires using `announce()` from `src/lib/announce.ts` for this. The `announce()` utility writes to live region nodes with IDs `live-polite` and `live-assertive` in `index.html`. Tests need to set up those nodes manually since JSDOM does not load `index.html`.

- [ ] **Step 1: Update PixelState tests**

Replace the entire contents of `src/ui/PixelState/PixelState.test.tsx`:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import { PixelState } from "./PixelState";
import { __reset } from "../../lib/announce";

function setupLiveRegions() {
  const polite = document.createElement("div");
  polite.id = "live-polite";
  polite.setAttribute("aria-live", "polite");
  document.body.appendChild(polite);

  const assertive = document.createElement("div");
  assertive.id = "live-assertive";
  assertive.setAttribute("aria-live", "assertive");
  document.body.appendChild(assertive);

  return () => {
    polite.remove();
    assertive.remove();
  };
}

afterEach(() => {
  __reset();
});

describe("PixelState", () => {
  it("renders loading text for loading variant", () => {
    render(<PixelState variant="loading" text="LOADING QUESTS..." />);
    expect(screen.getByText("LOADING QUESTS...")).toBeInTheDocument();
  });

  it("does not show die icon for loading variant", () => {
    render(<PixelState variant="loading" text="LOADING QUESTS..." />);
    expect(screen.queryByText("⚄")).not.toBeInTheDocument();
  });

  it("renders die icon and text for empty variant", () => {
    render(
      <PixelState
        variant="empty"
        text="NO QUESTS FOUND"
        subtext="Try broadening your search."
      />,
    );
    expect(screen.getByText("NO QUESTS FOUND")).toBeInTheDocument();
    expect(screen.getByText("Try broadening your search.")).toBeInTheDocument();
    expect(screen.getByText("⚄")).toBeInTheDocument();
  });

  it("renders error text and subtext for error variant", () => {
    render(
      <PixelState
        variant="error"
        text="QUEST FAILED"
        subtext="Unable to load events. Please try again."
      />,
    );
    expect(screen.getByText("QUEST FAILED")).toBeInTheDocument();
    expect(
      screen.getByText("Unable to load events. Please try again."),
    ).toBeInTheDocument();
  });

  it("shows a progress bar for the loading variant", () => {
    render(<PixelState variant="loading" text="Loading..." />);
    expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
  });

  it("does not show subtext element when subtext not provided", () => {
    const { rerender } = render(
      <PixelState variant="loading" text="LOADING..." subtext="hint" />,
    );
    expect(screen.getByText("hint")).toBeInTheDocument();
    rerender(<PixelState variant="loading" text="LOADING..." />);
    expect(screen.queryByText("hint")).not.toBeInTheDocument();
  });

  it("announces loading text politely", async () => {
    const cleanup = setupLiveRegions();
    render(<PixelState variant="loading" text="LOADING QUESTS..." />);
    await waitFor(() => {
      expect(document.getElementById("live-polite")?.textContent).toBe(
        "LOADING QUESTS...",
      );
    });
    cleanup();
  });

  it("announces error text assertively", async () => {
    const cleanup = setupLiveRegions();
    render(<PixelState variant="error" text="QUEST FAILED" />);
    await waitFor(() => {
      expect(document.getElementById("live-assertive")?.textContent).toBe(
        "QUEST FAILED",
      );
    });
    cleanup();
  });

  it("announces empty text politely", async () => {
    const cleanup = setupLiveRegions();
    render(<PixelState variant="empty" text="NO QUESTS FOUND" />);
    await waitFor(() => {
      expect(document.getElementById("live-polite")?.textContent).toBe(
        "NO QUESTS FOUND",
      );
    });
    cleanup();
  });
});
```

- [ ] **Step 2: Run tests to confirm failures**

Run: `npm test -- --run src/ui/PixelState/PixelState.test.tsx`
Expected: FAIL — the three announcement tests fail because `PixelState` doesn't call `announce()` yet.

- [ ] **Step 3: Update PixelState.tsx**

Replace the entire contents of `src/ui/PixelState/PixelState.tsx`:

```tsx
import { useEffect } from "react";
import { announce } from "../../lib/announce";
import styles from "./PixelState.module.css";

interface PixelStateProps {
  variant: "loading" | "empty" | "error";
  text: string;
  subtext?: string;
}

export function PixelState({ variant, text, subtext }: PixelStateProps) {
  useEffect(() => {
    announce(text, variant === "error" ? "assertive" : "polite");
  }, [variant, text]);

  return (
    <div className={styles.state}>
      {variant === "loading" && (
        <div className={styles.progressBar} data-testid="progress-bar">
          <div className={styles.progressFill} />
        </div>
      )}
      {variant === "empty" && (
        <div className={styles.die} aria-hidden="true">
          ⚄
        </div>
      )}
      {variant === "error" && (
        <div className={styles.die} aria-hidden="true">
          ✗
        </div>
      )}
      <p className={styles.text}>{text}</p>
      {subtext && <p className={styles.subtext}>{subtext}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Run PixelState tests**

Run: `npm test -- --run src/ui/PixelState/PixelState.test.tsx`
Expected: 9 tests pass.

- [ ] **Step 5: Run full suite**

Run: `npm test -- --run`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/ui/PixelState/
git commit -m "fix(PixelState): announce loading/error/empty states to screen readers via announce()"
```

---

## Task 6: Fix BoolBadge — visually-hidden text instead of aria-label on span

**Files:**

- Modify: `src/ui/Badge/Badge.tsx`
- Modify: `src/ui/Badge/Badge.test.tsx`

**Why:** `aria-label` on a non-focusable, non-interactive `<span>` is unreliable across screen readers. The span has no role, no tabindex — screen readers may or may not expose `aria-label` on it. The correct pattern is to put the glyph in an `aria-hidden` span (so screen readers skip it) and the semantic text in an `sr-only` span (so screen readers read it instead). The `sr-only` utility class already exists in `src/styles/global.css`.

- [ ] **Step 1: Update Badge tests**

In `src/ui/Badge/Badge.test.tsx`, find and replace the BoolBadge tests to assert on sr-only text instead of aria-label:

Replace the entire `describe("BoolBadge", ...)` block:

```tsx
describe("BoolBadge", () => {
  it("shows ✓ glyph for true", () => {
    render(<BoolBadge value={true} />);
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("shows sr-only 'yes' for true", () => {
    render(<BoolBadge value={true} />);
    expect(screen.getByText("yes")).toBeInTheDocument();
  });

  it("shows ✓ for 'yes' string (case-insensitive)", () => {
    render(<BoolBadge value="yes" />);
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("shows ✓ for 'Yes' (capitalized)", () => {
    render(<BoolBadge value="Yes" />);
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("shows — glyph for false", () => {
    render(<BoolBadge value={false} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows sr-only 'no' for false", () => {
    render(<BoolBadge value={false} />);
    expect(screen.getByText("no")).toBeInTheDocument();
  });

  it("shows — for 'no' string", () => {
    render(<BoolBadge value="no" />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows — for empty string", () => {
    render(<BoolBadge value="" />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to confirm failures**

Run: `npm test -- --run src/ui/Badge/Badge.test.tsx`
Expected: FAIL — "shows sr-only 'yes' for true" and "shows sr-only 'no' for false" fail because the current implementation uses aria-label, not rendered text.

- [ ] **Step 3: Update BoolBadge in Badge.tsx**

Replace the `BoolBadge` function in `src/ui/Badge/Badge.tsx`:

```tsx
export function BoolBadge({ value, className }: BoolBadgeProps) {
  const isYes =
    value === true ||
    (typeof value === "string" && value.toLowerCase() === "yes");
  // Gen Con API returns "Yes"/"No" strings; true/false booleans also accepted
  return (
    <span
      className={[isYes ? styles.boolYes : styles.boolNo, className]
        .filter(Boolean)
        .join(" ")}
    >
      <span aria-hidden="true">{isYes ? "✓" : "—"}</span>
      <span className="sr-only">{isYes ? "yes" : "no"}</span>
    </span>
  );
}
```

The `sr-only` class is defined in `src/styles/global.css` and is loaded globally.

- [ ] **Step 4: Run Badge tests**

Run: `npm test -- --run src/ui/Badge/Badge.test.tsx`
Expected: 12 tests pass (4 Badge + 8 BoolBadge).

- [ ] **Step 5: Run full suite**

Run: `npm test -- --run`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/ui/Badge/
git commit -m "fix(BoolBadge): use sr-only text instead of aria-label on span for reliable screen reader support"
```

---

## Self-Review

**Spec coverage check:**

- ✅ AGENTS.md updated (Task 1)
- ✅ Base UI installed (Task 1)
- ✅ Toggletip → Popover: portaled, positioned, outside-click, aria-expanded (Task 2)
- ✅ ToggleTile → Toggle: data-pressed CSS, Base UI a11y (Task 3)
- ✅ ToggleTileGroup: arrow-key navigation (Task 3)
- ✅ SearchForm updated to use ToggleTileGroup (Task 3)
- ✅ Button → Base UI Button with render prop (Task 4)
- ✅ LinkButton deleted (Task 4)
- ✅ EventDetail updated to use `<Button render={<Link>}>` (Task 4)
- ✅ PixelState calls announce() (Task 5)
- ✅ BoolBadge uses sr-only text (Task 6)

**Placeholder scan:** No TBD/TODO placeholders. All steps show exact code.

**Type consistency:**

- `Toggle.Root.Props` used in Task 3 — Base UI exports component prop types as `Component.Root.Props`
- `ToggleGroup.Root.Props` used in Task 3 — same pattern
- `BaseButtonProps` from `@base-ui-components/react/button` — if not exported under that name, use `ComponentPropsWithRef<typeof BaseButton>` as fallback (noted in Task 4 Step 3)
- `announce()` signature: `announce(message: string, priority?: "polite" | "assertive"): void` — used correctly in Task 5
- `__reset()` — test-only helper exported from `src/lib/announce.ts` — used in Task 5 tests
