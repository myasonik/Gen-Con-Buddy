# Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract shared UI primitives into `src/ui/`, split CSS into tokens/global files, and add Storybook for visual documentation.

**Architecture:** Each primitive lives in `src/ui/<Component>/` with its own `.tsx`, `.module.css`, `.test.tsx`, and `.stories.tsx`. The existing `src/index.css` becomes two imports pointing to `src/styles/tokens.css` (design tokens) and `src/styles/global.css` (reset + utilities). Global `.btn-*` classes are deleted after being replaced by the `Button` primitive.

**Tech Stack:** React 18, CSS Modules, Vite, Vitest, Testing Library, Storybook 10 (`@storybook/react-vite`), `clsx`

---

## File Map

**New files:**

- `src/styles/tokens.css` — design tokens only (`:root { ... }`)
- `src/styles/global.css` — grain, reset, `sr-only`, reduced-motion (no button classes)
- `src/ui/storyMatrix.tsx` — cartesian story grid utility
- `src/ui/storyMatrix.test.tsx` — tests for storyMatrix
- `src/ui/Button/Button.tsx` — `Button` + `LinkButton` primitives
- `src/ui/Button/Button.module.css` — button visual identity
- `src/ui/Button/Button.test.tsx`
- `src/ui/Button/Button.stories.tsx`
- `src/ui/Toggletip/Toggletip.tsx` — info tooltip button
- `src/ui/Toggletip/Toggletip.module.css`
- `src/ui/Toggletip/Toggletip.test.tsx`
- `src/ui/Toggletip/Toggletip.stories.tsx`
- `src/ui/PixelState/PixelState.tsx` — loading / empty / error states
- `src/ui/PixelState/PixelState.module.css`
- `src/ui/PixelState/PixelState.test.tsx`
- `src/ui/PixelState/PixelState.stories.tsx`
- `src/ui/ToggleTile/ToggleTile.tsx` — `aria-pressed` button for day selection
- `src/ui/ToggleTile/ToggleTile.module.css`
- `src/ui/ToggleTile/ToggleTile.test.tsx`
- `src/ui/ToggleTile/ToggleTile.stories.tsx`
- `src/ui/Badge/Badge.tsx` — pill badge + bool display
- `src/ui/Badge/Badge.module.css`
- `src/ui/Badge/Badge.test.tsx`
- `src/ui/Badge/Badge.stories.tsx`
- `.storybook/main.ts`
- `.storybook/preview.ts`
- `.storybook/preview-head.html`

**Modified files:**

- `AGENTS.md` — replace "Plain HTML only — no styles" guidance
- `src/index.css` — replace content with two `@import` lines
- `package.json` — add storybook devDeps + scripts
- `src/components/SearchForm/SearchForm.tsx` — use `Button`, `Toggletip`, `ToggleTile`; remove `clsx` import
- `src/components/SearchForm/SearchForm.module.css` — remove toggletip, dayTile, dayCheckbox styles
- `src/components/SearchForm/SearchForm.test.tsx` — update day tile tests (checkbox → button)
- `src/components/Pagination/Pagination.tsx` — use `Button`, import `Toggletip` from ui
- `src/components/SearchResults/SearchResults.tsx` — use `PixelState`
- `src/components/SearchResults/SearchResults.module.css` — scope bare `table` selectors; remove state styles
- `src/components/EventDetail/EventDetail.tsx` — use `PixelState`, `Badge`, `BoolBadge`, `LinkButton`
- `src/components/EventDetail/EventDetail.module.css` — remove state, pill styles; `.backLink` becomes layout-only
- `src/routes/index.test.tsx` — update day tile test

---

### Task 1: CSS split + Storybook setup + AGENTS.md

**Files:**

- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Modify: `src/index.css`
- Modify: `package.json`
- Create: `.storybook/main.ts`
- Create: `.storybook/preview.ts`
- Create: `.storybook/preview-head.html`
- Modify: `AGENTS.md`

- [ ] **Step 1: Update AGENTS.md**

Replace the Philosophy section's first line:

Old:

```
Plain HTML only — no styles, no CSS, no UI libraries. Use semantic elements.
```

New:

```
Use semantic HTML elements. Use the `src/ui/` component library for shared UI primitives. No external UI component libraries. All styling via CSS Modules; global tokens in `src/styles/tokens.css`; reset/utilities in `src/styles/global.css`.
```

- [ ] **Step 2: Create `src/styles/tokens.css`**

```css
/* ─── Design Tokens ──────────────────────────────────────────────────────── */
:root {
  /* Colors */
  --color-parchment: #f5e6c8;
  --color-parchment-light: #fff9ee;
  --color-bark: #8b4513;
  --color-bark-dark: #5c3317;
  --color-bark-light: #d4a76a;
  --color-ink: #3b1e0a;
  --color-gold: #c9a84c;

  /* Typography */
  --font-pixel: "Press Start 2P", monospace;
  --font-data: "Courier Prime", monospace;

  /* Type scale — Press Start 2P only; all sizes must be multiples of 8px */
  --text-display: 18px; /* page title */
  --text-heading: 16px; /* section headings, fieldset legends */
  --text-label: 16px; /* button labels, column headers, field labels */
  --text-badge: 8px; /* incidental badges only (Game ID badge, sort arrows) */

  /* Data font sizes */
  --text-body: 16px; /* standard data text (Courier Prime body) */
  --text-small: 14px; /* secondary data text (ranges, summaries) */

  /* Spacing — 8px grid */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 16px;
  --space-4: 24px;
  --space-5: 32px;

  /* Sizes */
  --size-sidebar: 280px;
  --size-detail-max: 800px;

  /* Shadow / Pixel Border System */
  --shadow-panel: 4px 4px 0 var(--color-bark-dark);
  --shadow-panel-inset: inset 0 0 0 2px var(--color-bark);
  --shadow-button: 3px 3px 0 var(--color-bark-dark);
  --shadow-button-active: 1px 1px 0 var(--color-bark-dark);
  --shadow-table-inset: inset 0 0 0 3px var(--color-bark);

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
  --z-grain: 50;

  /* interpolate-size: allow <details> height: auto transitions */
  interpolate-size: allow-keywords;
}
```

- [ ] **Step 3: Create `src/styles/global.css`**

This is everything from the current `src/index.css` EXCEPT the `:root { ... }` block. The `.btn-primary`/`.btn-secondary` classes stay here for now — Task 3 removes them once all callers use `<Button>`:

```css
/* ─── Grain Texture ──────────────────────────────────────────────────────── */
/* Applied to html so it never participates in stacking context */
html {
  background-color: var(--color-parchment);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  background-attachment: fixed;
}

/* ─── Global Reset ───────────────────────────────────────────────────────── */
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  background: transparent; /* html provides the parchment + grain */
  color: var(--color-ink);
  font-family: var(--font-data);
  margin: 0;
  min-height: 100vh;
}

a {
  color: var(--color-bark-dark);
  text-decoration: underline;
}

a:hover {
  color: var(--color-gold);
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

/* ─── Global Button Classes ──────────────────────────────────────────────── */
/* Temporary — Task 3 removes these once all callers use <Button> */
.btn-primary {
  background: var(--color-bark);
  color: var(--color-parchment);
  border: 2px solid var(--color-bark);
  border-radius: 0;
  font-family: var(--font-pixel);
  font-size: var(--text-label);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  box-shadow: var(--shadow-button);
  transition:
    box-shadow var(--motion-press),
    transform var(--motion-press);
}

.btn-primary:active {
  box-shadow: var(--shadow-button-active);
  transform: translate(2px, 2px);
}

.btn-primary:focus-visible {
  outline: 2px solid var(--color-bark-dark);
  outline-offset: 2px;
}

.btn-secondary {
  background: transparent;
  color: var(--color-bark);
  border: 2px solid var(--color-bark);
  border-radius: 0;
  font-family: var(--font-pixel);
  font-size: var(--text-label);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  box-shadow: var(--shadow-button);
  transition:
    box-shadow var(--motion-press),
    transform var(--motion-press);
}

.btn-secondary:active {
  box-shadow: var(--shadow-button-active);
  transform: translate(2px, 2px);
}

.btn-secondary:focus-visible {
  outline: 2px solid var(--color-bark-dark);
  outline-offset: 2px;
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

- [ ] **Step 4: Rewrite `src/index.css`**

Replace the entire file with:

```css
@import "./styles/tokens.css";
@import "./styles/global.css";
```

- [ ] **Step 5: Verify tests pass**

Run: `npm test`
Expected: 141 passing, 0 failing.

If any test fails, the CSS import chain is broken. Check that `src/styles/tokens.css` and `src/styles/global.css` exist and the paths are correct.

- [ ] **Step 6: Add Storybook to `package.json`**

Add to `"scripts"`:

```json
"storybook": "storybook dev -p 6006",
"build-storybook": "storybook build"
```

Add to `"devDependencies"`:

```json
"@storybook/react-vite": "^10.3.5",
"storybook": "^10.3.5"
```

- [ ] **Step 7: Install packages**

Run: `npm install`
Expected: Installs without errors.

- [ ] **Step 8: Create `.storybook/main.ts`**

```ts
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/ui/**/*.stories.@(ts|tsx)"],
  addons: [],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
};

export default config;
```

- [ ] **Step 9: Create `.storybook/preview.ts`**

```ts
import type { Preview } from "@storybook/react";
import "../src/styles/tokens.css";
import "../src/styles/global.css";

const preview: Preview = {
  parameters: {
    layout: "padded",
  },
};

export default preview;
```

- [ ] **Step 10: Create `.storybook/preview-head.html`**

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Press+Start+2P&display=swap"
  rel="stylesheet"
/>
```

- [ ] **Step 11: Commit**

```bash
git add AGENTS.md src/styles/tokens.css src/styles/global.css src/index.css package.json package-lock.json .storybook/main.ts .storybook/preview.ts .storybook/preview-head.html
git commit -m "feat: split CSS into tokens/global, add Storybook scaffold, update AGENTS.md"
```

---

### Task 2: storyMatrix utility

**Files:**

- Create: `src/ui/storyMatrix.tsx`
- Create: `src/ui/storyMatrix.test.tsx`

This utility generates a cartesian product of story variants. It is copied verbatim from the reference implementation in `../camellia-fe/src/ui/storyMatrix.tsx`.

- [ ] **Step 1: Create `src/ui/storyMatrix.tsx`**

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

type AxisValues = Record<string, readonly unknown[]>;

type Combo<T extends AxisValues> = {
  [K in keyof T]: T[K][number];
};

export function cartesian<T extends AxisValues>(axes: T): Combo<T>[] {
  const keys = Object.keys(axes);
  let result: Partial<Combo<T>>[] = [{}];

  for (const key of keys) {
    const next: Partial<Combo<T>>[] = [];
    for (const combo of result) {
      for (const val of axes[key]) {
        next.push({ ...combo, [key]: val });
      }
    }
    result = next;
  }

  return result as Combo<T>[];
}

export function makeMatrix<TMeta extends Meta<any>>(
  meta: TMeta,
  axes: AxisValues,
  defaults?: Record<string, unknown>,
): {
  stories: Record<string, StoryObj<TMeta>>;
  Grid: () => React.JSX.Element;
} {
  const combos = cartesian(axes);
  if (!meta.component)
    throw new Error("makeMatrix requires meta.component to be defined");
  const Component = meta.component as React.ComponentType<
    Record<string, unknown>
  >;

  const stories: Record<string, StoryObj<TMeta>> = {};
  for (const combo of combos) {
    const vals = Object.values(combo).map(String);
    const key = vals.join("_");
    const name = vals.join(" / ");
    stories[key] = {
      name,
      args: { ...defaults, ...combo } as StoryObj<TMeta>["args"],
    };
  }

  function Grid() {
    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1.5rem",
          padding: "1rem",
        }}
      >
        {combos.map((combo) => {
          const key = Object.values(combo).map(String).join("_");
          const label = Object.entries(combo)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ");
          return (
            <div
              key={key}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                alignItems: "flex-start",
              }}
            >
              <Component {...defaults} {...combo} />
              <span
                style={{
                  fontSize: "var(--text-small)",
                  color: "var(--color-bark-light)",
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return { stories, Grid };
}
```

- [ ] **Step 2: Create `src/ui/storyMatrix.test.tsx`**

This test imports `Button` to satisfy `makeMatrix`'s requirement for a component — we use the Button we're building in Task 3. But since Button doesn't exist yet, use a simple stub component here:

```tsx
import { describe, it, expect } from "vitest";
import React from "react";
import { cartesian, makeMatrix } from "./storyMatrix";
import type { Meta } from "@storybook/react-vite";

const StubComponent = ({ children }: { children?: React.ReactNode }) => (
  <button type="button">{children}</button>
);

describe("cartesian", () => {
  it("produces all combinations of two axes", () => {
    const result = cartesian({
      variant: ["a", "b"] as const,
      size: ["sm", "md"] as const,
    });
    expect(result).toHaveLength(4);
    expect(result).toContainEqual({ variant: "a", size: "sm" });
    expect(result).toContainEqual({ variant: "a", size: "md" });
    expect(result).toContainEqual({ variant: "b", size: "sm" });
    expect(result).toContainEqual({ variant: "b", size: "md" });
  });

  it("returns a single empty object for empty axes", () => {
    expect(cartesian({})).toEqual([{}]);
  });

  it("handles a single axis", () => {
    expect(cartesian({ variant: ["x", "y"] as const })).toEqual([
      { variant: "x" },
      { variant: "y" },
    ]);
  });

  it("produces the correct count for three axes", () => {
    const result = cartesian({
      a: [1, 2] as const,
      b: ["x", "y"] as const,
      c: [true, false] as const,
    });
    expect(result).toHaveLength(8);
    expect(result).toContainEqual({ a: 1, b: "x", c: true });
  });
});

describe("makeMatrix", () => {
  const meta = { component: StubComponent } satisfies Meta<
    typeof StubComponent
  >;

  it("returns one story per combination", () => {
    const { stories } = makeMatrix(meta, {
      variant: ["primary", "secondary"] as const,
      size: ["sm", "md"] as const,
    });
    expect(Object.keys(stories)).toHaveLength(4);
  });

  it("keys stories by underscore-joined values", () => {
    const { stories } = makeMatrix(meta, {
      variant: ["primary"] as const,
      size: ["md"] as const,
    });
    expect(stories).toHaveProperty("primary_md");
  });

  it("sets a human-readable name on each story", () => {
    const { stories } = makeMatrix(meta, {
      variant: ["primary"] as const,
      size: ["md"] as const,
    });
    expect(stories["primary_md"].name).toBe("primary / md");
  });

  it("merges defaults into story args", () => {
    const { stories } = makeMatrix(
      meta,
      { variant: ["primary"] as const },
      { children: "Click me" },
    );
    expect(stories["primary"].args).toMatchObject({
      children: "Click me",
      variant: "primary",
    });
  });

  it("returns a Grid render function", () => {
    const { Grid } = makeMatrix(meta, { variant: ["primary"] as const });
    expect(typeof Grid).toBe("function");
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: 5 new storyMatrix tests pass, 141 existing tests pass, total 146.

- [ ] **Step 4: Commit**

```bash
git add src/ui/storyMatrix.tsx src/ui/storyMatrix.test.tsx
git commit -m "feat: add storyMatrix utility for Storybook variant grids"
```

---

### Task 3: Button primitive

**Files:**

- Create: `src/ui/Button/Button.tsx`
- Create: `src/ui/Button/Button.module.css`
- Create: `src/ui/Button/Button.test.tsx`
- Create: `src/ui/Button/Button.stories.tsx`
- Modify: `src/components/SearchForm/SearchForm.tsx` (replace `clsx("btn-primary"...)` + `clsx("btn-secondary"...)`)
- Modify: `src/components/Pagination/Pagination.tsx` (replace `clsx("btn-secondary"...)`)
- Modify: `src/components/EventDetail/EventDetail.tsx` (replace `<Link className={styles.backLink}>` with `<LinkButton>`)
- Modify: `src/components/EventDetail/EventDetail.module.css` (`.backLink` becomes layout-only margin)
- Modify: `src/styles/global.css` (this task does NOT touch global.css — button classes remain there until all callers are migrated; then remove in the same commit once SearchForm, Pagination, EventDetail are all updated)

**Important:** The global `.btn-primary` and `.btn-secondary` classes in `src/styles/global.css` must be deleted in this task's final commit — after all three callers (SearchForm, Pagination, EventDetail) are updated to use `<Button>`/`<LinkButton>`. Leaving them in global.css after no callers use them would be dead code.

- [ ] **Step 1: Write `src/ui/Button/Button.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createRootRoute,
  createRouter,
  RouterProvider,
  createMemoryHistory,
} from "@tanstack/react-router";
import { Button, LinkButton } from "./Button";

function renderWithRouter(ui: React.ReactNode) {
  const rootRoute = createRootRoute({ component: () => <>{ui}</> });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  render(<RouterProvider router={router} />);
}

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole("button", { name: "Click me" }),
    ).toBeInTheDocument();
  });

  it("defaults type to button to prevent accidental form submission", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("accepts type='submit'", () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("is disabled when disabled prop is set", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("calls onClick when clicked", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("does not call onClick when disabled", async () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"), {
      pointerEventsCheck: 0,
    });
    expect(handleClick).not.toHaveBeenCalled();
  });
});

describe("LinkButton", () => {
  it("renders as a link", () => {
    renderWithRouter(<LinkButton to="/">Back</LinkButton>);
    expect(screen.getByRole("link", { name: "Back" })).toBeInTheDocument();
  });

  it("navigates to the given route", () => {
    renderWithRouter(<LinkButton to="/">Back to results</LinkButton>);
    expect(
      screen.getByRole("link", { name: "Back to results" }),
    ).toHaveAttribute("href", "/");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/ui/Button/Button.test.tsx`
Expected: FAIL — `Cannot find module './Button'`

- [ ] **Step 3: Create `src/ui/Button/Button.module.css`**

```css
.button {
  display: inline-block;
  border-radius: 0;
  font-family: var(--font-pixel);
  font-size: var(--text-label);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  box-shadow: var(--shadow-button);
  border: 2px solid var(--color-bark);
  text-decoration: none;
  transition:
    box-shadow var(--motion-press),
    transform var(--motion-press);
  line-height: 1;
}

.button:active {
  box-shadow: var(--shadow-button-active);
  transform: translate(2px, 2px);
}

.button:focus-visible {
  outline: 2px solid var(--color-bark-dark);
  outline-offset: 2px;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.primary {
  background: var(--color-bark);
  color: var(--color-parchment);
}

.secondary {
  background: transparent;
  color: var(--color-bark);
}
```

- [ ] **Step 4: Create `src/ui/Button/Button.tsx`**

```tsx
import React from "react";
import { Link } from "@tanstack/react-router";
import type { LinkProps } from "@tanstack/react-router";
import styles from "./Button.module.css";

export const BUTTON_VARIANTS = ["primary", "secondary"] as const;
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", type = "button", className, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={[styles.button, styles[variant], className]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    );
  },
);

interface LinkButtonProps extends Omit<LinkProps, "className"> {
  variant?: ButtonVariant;
  className?: string;
}

export const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(
  function LinkButton({ variant = "secondary", className, ...props }, ref) {
    return (
      <Link
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

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test src/ui/Button/Button.test.tsx`
Expected: 8 tests pass.

- [ ] **Step 6: Create `src/ui/Button/Button.stories.tsx`**

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, BUTTON_VARIANTS } from "./Button";
import { makeMatrix } from "../storyMatrix";

const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    children: "Button",
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: "primary" },
};

export const Secondary: Story = {
  args: { variant: "secondary" },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const SubmitType: Story = {
  args: { type: "submit", children: "▶ Search" },
};

const { stories, Grid } = makeMatrix(
  meta,
  { variant: BUTTON_VARIANTS, disabled: [false, true] },
  { children: "Button" },
);

export const AllVariants: Story = { render: Grid };

export const { primary_false, primary_true, secondary_false, secondary_true } =
  stories;
```

- [ ] **Step 7: Update `src/components/SearchForm/SearchForm.tsx`**

Remove the `clsx` import (no longer needed). Add imports for `Button`:

```tsx
import { Button } from "../../ui/Button/Button";
```

Replace the two button elements in the `buttonBar`:

Old:

```tsx
<button
  type="submit"
  className={clsx("btn-primary", styles.actionButton)}
>
  ▶ Search
</button>
<button
  type="button"
  className={clsx("btn-secondary", styles.actionButton)}
  onClick={() => reset(EMPTY_VALUES)}
>
  ↺ Reset
</button>
```

New:

```tsx
<Button
  type="submit"
  variant="primary"
  className={styles.actionButton}
>
  ▶ Search
</Button>
<Button
  variant="secondary"
  className={styles.actionButton}
  onClick={() => reset(EMPTY_VALUES)}
>
  ↺ Reset
</Button>
```

Also remove `import clsx from "clsx";` from the top of the file.

- [ ] **Step 8: Update `src/components/Pagination/Pagination.tsx`**

Add import:

```tsx
import { Button } from "../../ui/Button/Button";
```

Replace the three `<button>` elements that use `btn-secondary`:

Old (Previous button):

```tsx
<button
  type="button"
  className={clsx("btn-secondary", styles.navButton)}
  onClick={() => onNavigate(page - 1, limit)}
  disabled={page === 1}
>
  ◀ Previous
</button>
```

New:

```tsx
<Button
  variant="secondary"
  className={styles.navButton}
  onClick={() => onNavigate(page - 1, limit)}
  disabled={page === 1}
>
  ◀ Previous
</Button>
```

Old (page number button):

```tsx
<button
  key={p}
  type="button"
  className={clsx("btn-secondary", styles.pageButton, {
    [styles.activePage]: p === page,
  })}
  onClick={() => onNavigate(p, limit)}
  aria-current={p === page ? "page" : undefined}
  disabled={p === page}
>
  {p}
</button>
```

New:

```tsx
<Button
  key={p}
  variant="secondary"
  className={clsx(styles.pageButton, {
    [styles.activePage]: p === page,
  })}
  onClick={() => onNavigate(p, limit)}
  aria-current={p === page ? "page" : undefined}
  disabled={p === page}
>
  {p}
</Button>
```

Old (Next button):

```tsx
<button
  type="button"
  className={clsx("btn-secondary", styles.navButton)}
  onClick={() => onNavigate(page + 1, limit)}
  disabled={page === totalPages}
>
  Next ▶
</button>
```

New:

```tsx
<Button
  variant="secondary"
  className={styles.navButton}
  onClick={() => onNavigate(page + 1, limit)}
  disabled={page === totalPages}
>
  Next ▶
</Button>
```

Note: `clsx` is still needed in Pagination for `clsx(styles.pageButton, { [styles.activePage]: p === page })`, so keep `import clsx from "clsx"`.

- [ ] **Step 9: Update `src/components/EventDetail/EventDetail.tsx`**

Add import:

```tsx
import { LinkButton } from "../../ui/Button/Button";
```

Replace:

```tsx
<Link to="/" className={styles.backLink}>
  ← Back to results
</Link>
```

With:

```tsx
<LinkButton to="/" className={styles.backLink}>
  ← Back to results
</LinkButton>
```

- [ ] **Step 10: Update `src/components/EventDetail/EventDetail.module.css`**

The `.backLink` class should now only control layout (margin), not visual identity — that lives in `Button.module.css`:

Old:

```css
.backLink {
  display: inline-block;
  font-family: var(--font-pixel);
  font-size: var(--text-label);
  color: var(--color-bark);
  text-decoration: none;
  border: 2px solid var(--color-bark);
  padding: var(--space-2) var(--space-3);
  box-shadow: var(--shadow-button);
  margin-bottom: var(--space-4);
  transition:
    box-shadow var(--motion-press),
    transform var(--motion-press);
}

.backLink:active {
  box-shadow: var(--shadow-button-active);
  transform: translate(2px, 2px);
}
```

New:

```css
.backLink {
  margin-bottom: var(--space-4);
}
```

- [ ] **Step 11: Remove `.btn-primary` and `.btn-secondary` from `src/styles/global.css`**

Delete the entire `/* ─── Global Button Classes ──────────────────────────────────────────────── */` section and the `.btn-primary` and `.btn-secondary` rules (including `:active` and `:focus-visible` variants for both).

After deletion, `src/styles/global.css` should only have: grain, reset, sr-only, reduced-motion.

- [ ] **Step 12: Run all tests**

Run: `npm test`
Expected: 149 tests pass (141 existing + 8 Button tests).

If any test fails, it's likely a reference to the old `btn-primary`/`btn-secondary` classes. Those classes no longer exist — the fix is to use `<Button>` in the component.

- [ ] **Step 13: Commit**

```bash
git add src/ui/Button/ src/components/SearchForm/SearchForm.tsx src/components/Pagination/Pagination.tsx src/components/EventDetail/EventDetail.tsx src/components/EventDetail/EventDetail.module.css src/styles/global.css
git commit -m "feat: extract Button and LinkButton primitives, remove global btn-* classes"
```

---

### Task 4: Toggletip primitive

**Files:**

- Create: `src/ui/Toggletip/Toggletip.tsx`
- Create: `src/ui/Toggletip/Toggletip.module.css`
- Create: `src/ui/Toggletip/Toggletip.test.tsx`
- Create: `src/ui/Toggletip/Toggletip.stories.tsx`
- Modify: `src/components/SearchForm/SearchForm.tsx` (remove inline `Toggletip`, import from ui)
- Modify: `src/components/SearchForm/SearchForm.module.css` (remove toggletip styles)
- Modify: `src/components/Pagination/Pagination.tsx` (remove inline `Toggletip`, import from ui)

- [ ] **Step 1: Write `src/ui/Toggletip/Toggletip.test.tsx`**

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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/ui/Toggletip/Toggletip.test.tsx`
Expected: FAIL — `Cannot find module './Toggletip'`

- [ ] **Step 3: Create `src/ui/Toggletip/Toggletip.module.css`**

```css
.wrapper {
  position: relative;
  display: inline-block;
}

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
  position: absolute;
  z-index: var(--z-popover);
  background: var(--color-parchment-light);
  border: 2px solid var(--color-bark);
  padding: var(--space-2);
  font-family: var(--font-data);
  font-size: var(--text-small);
  color: var(--color-ink);
  min-width: 200px;
  left: 0;
  top: 100%;
  box-shadow: var(--shadow-panel);
}
```

- [ ] **Step 4: Create `src/ui/Toggletip/Toggletip.tsx`**

```tsx
import { useState, useEffect } from "react";
import styles from "./Toggletip.module.css";

interface ToggletipProps {
  label: string;
  message: string;
}

export function Toggletip({ label, message }: ToggletipProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <span className={styles.wrapper}>
      <button
        type="button"
        aria-label={label}
        className={styles.button}
        onClick={() => setOpen((o) => !o)}
      >
        ?
      </button>
      {open && (
        <span role="tooltip" className={styles.tooltip}>
          {message}
        </span>
      )}
    </span>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test src/ui/Toggletip/Toggletip.test.tsx`
Expected: 5 tests pass.

- [ ] **Step 6: Create `src/ui/Toggletip/Toggletip.stories.tsx`**

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toggletip } from "./Toggletip";

const meta = {
  title: "UI/Toggletip",
  component: Toggletip,
  tags: ["autodocs"],
  args: {
    label: "Why is this disabled?",
    message: "Clear the day checkboxes above to use custom date fields.",
  },
} satisfies Meta<typeof Toggletip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongMessage: Story = {
  args: {
    message:
      "Results are capped at 10,000 events. Narrow your search to see more pages.",
  },
};
```

- [ ] **Step 7: Update `src/components/SearchForm/SearchForm.tsx`**

Remove the inline `Toggletip` component definition (lines 72–101 of the current file). Add an import at the top:

```tsx
import { Toggletip } from "../../ui/Toggletip/Toggletip";
```

No other changes needed — the JSX usage of `<Toggletip label="..." message="..." />` remains identical.

- [ ] **Step 8: Remove toggletip styles from `src/components/SearchForm/SearchForm.module.css`**

Delete these three rule blocks:

```css
/* Toggletip */
.toggletipWrapper {
  position: relative;
  display: inline-block;
}

.toggletipButton {
  font-family: var(--font-pixel);
  font-size: var(--text-badge);
  background: var(--color-parchment);
  border: 2px solid var(--color-bark);
  color: var(--color-bark);
  padding: var(--space-1) var(--space-2);
  cursor: pointer;
}

.tooltip {
  position: absolute;
  z-index: var(--z-popover);
  background: var(--color-parchment-light);
  border: 2px solid var(--color-bark);
  padding: var(--space-2);
  font-family: var(--font-data);
  font-size: 0.9rem;
  color: var(--color-ink);
  min-width: 200px;
  left: 0;
  top: 100%;
  box-shadow: var(--shadow-panel);
}
```

Also update the JSX in `SearchForm.tsx` that references `styles.toggletipWrapper`, `styles.toggletipButton`, `styles.tooltip` — these class names no longer exist in the module. The Toggletip component is now self-contained and uses its own module CSS.

- [ ] **Step 9: Update `src/components/Pagination/Pagination.tsx`**

Remove the inline `Toggletip` component definition (lines 8–34 of the current file). Add import:

```tsx
import { Toggletip } from "../../ui/Toggletip/Toggletip";
```

The JSX usage `<Toggletip label="..." message="..." />` is already identical to the new import, so no JSX changes needed. Also remove the `useState` and `useEffect` imports if they are no longer used after removing the inline Toggletip (check the rest of Pagination — it does not use `useState` or `useEffect` itself).

The `useState` and `useEffect` imports in Pagination.tsx are only used by the old inline Toggletip. Remove them:

Old:

```tsx
import { useState, useEffect } from "react";
```

New: remove entirely (or check if any other code in the file uses them — currently none do).

- [ ] **Step 10: Run all tests**

Run: `npm test`
Expected: 154 tests pass (149 existing + 5 Toggletip tests).

- [ ] **Step 11: Commit**

```bash
git add src/ui/Toggletip/ src/components/SearchForm/SearchForm.tsx src/components/SearchForm/SearchForm.module.css src/components/Pagination/Pagination.tsx
git commit -m "feat: extract Toggletip primitive, deduplicate SearchForm and Pagination copies"
```

---

### Task 5: PixelState primitive

**Files:**

- Create: `src/ui/PixelState/PixelState.tsx`
- Create: `src/ui/PixelState/PixelState.module.css`
- Create: `src/ui/PixelState/PixelState.test.tsx`
- Create: `src/ui/PixelState/PixelState.stories.tsx`
- Modify: `src/components/SearchResults/SearchResults.tsx`
- Modify: `src/components/SearchResults/SearchResults.module.css`
- Modify: `src/components/EventDetail/EventDetail.tsx`
- Modify: `src/components/EventDetail/EventDetail.module.css`

- [ ] **Step 1: Write `src/ui/PixelState/PixelState.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { PixelState } from "./PixelState";

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

  it("does not show subtext when not provided", () => {
    render(<PixelState variant="loading" text="LOADING..." />);
    expect(
      screen.queryByRole("paragraph", { name: /subtext/ }),
    ).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/ui/PixelState/PixelState.test.tsx`
Expected: FAIL — `Cannot find module './PixelState'`

- [ ] **Step 3: Create `src/ui/PixelState/PixelState.module.css`**

```css
.state {
  text-align: center;
  border: 2px dashed var(--color-bark-light);
  padding: var(--space-5);
  margin: var(--space-4) 0;
}

.die {
  font-size: 48px;
  line-height: 1;
  margin-bottom: var(--space-3);
}

.text {
  font-family: var(--font-pixel);
  font-size: var(--text-label);
  color: var(--color-bark-dark);
  margin: var(--space-2) 0;
}

.subtext {
  font-family: var(--font-data);
  font-size: var(--text-body);
  color: var(--color-bark);
  margin: 0;
}

.progressBar {
  width: 200px;
  height: 16px;
  border: 2px solid var(--color-bark);
  margin: 0 auto var(--space-3);
  overflow: hidden;
}

.progressFill {
  height: 100%;
  background: repeating-linear-gradient(
    90deg,
    var(--color-bark) 0px,
    var(--color-bark) 8px,
    var(--color-gold) 8px,
    var(--color-gold) 16px
  );
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

- [ ] **Step 4: Create `src/ui/PixelState/PixelState.tsx`**

```tsx
import styles from "./PixelState.module.css";

interface PixelStateProps {
  variant: "loading" | "empty" | "error";
  text: string;
  subtext?: string;
}

export function PixelState({ variant, text, subtext }: PixelStateProps) {
  return (
    <div className={styles.state}>
      {variant === "loading" && (
        <div className={styles.progressBar}>
          <div className={styles.progressFill} />
        </div>
      )}
      {variant === "empty" && (
        <div className={styles.die} aria-hidden="true">
          ⚄
        </div>
      )}
      <p className={styles.text}>{text}</p>
      {subtext && <p className={styles.subtext}>{subtext}</p>}
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test src/ui/PixelState/PixelState.test.tsx`
Expected: 5 tests pass.

- [ ] **Step 6: Create `src/ui/PixelState/PixelState.stories.tsx`**

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { PixelState } from "./PixelState";

const meta = {
  title: "UI/PixelState",
  component: PixelState,
  tags: ["autodocs"],
} satisfies Meta<typeof PixelState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: { variant: "loading", text: "LOADING QUESTS..." },
};

export const Empty: Story = {
  args: {
    variant: "empty",
    text: "NO QUESTS FOUND",
    subtext: "Try broadening your search.",
  },
};

export const Error: Story = {
  args: {
    variant: "error",
    text: "QUEST FAILED",
    subtext: "Unable to load events. Please try again.",
  },
};

export const LoadingEvent: Story = {
  args: { variant: "loading", text: "LOADING QUEST..." },
};

export const NotFound: Story = {
  args: {
    variant: "empty",
    text: "EVENT NOT FOUND",
    subtext: "This quest does not exist.",
  },
};
```

- [ ] **Step 7: Update `src/components/SearchResults/SearchResults.tsx`**

Add import:

```tsx
import { PixelState } from "../../ui/PixelState/PixelState";
```

Replace the three state blocks:

Old loading block:

```tsx
{
  isLoading && (
    <div className={styles.state}>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} />
      </div>
      <p className={styles.stateText}>LOADING QUESTS...</p>
    </div>
  );
}
```

New:

```tsx
{
  isLoading && <PixelState variant="loading" text="LOADING QUESTS..." />;
}
```

Old error block:

```tsx
{
  isError && (
    <div className={styles.state}>
      <p className={styles.stateText}>QUEST FAILED</p>
      <p className={styles.stateSubtext}>
        Unable to load events. Please try again.
      </p>
    </div>
  );
}
```

New:

```tsx
{
  isError && (
    <PixelState
      variant="error"
      text="QUEST FAILED"
      subtext="Unable to load events. Please try again."
    />
  );
}
```

Old empty block:

```tsx
{
  data && data.data.length === 0 && (
    <div className={styles.state}>
      <div className={styles.stateDie} aria-hidden="true">
        ⚄
      </div>
      <p className={styles.stateText}>NO QUESTS FOUND</p>
      <p className={styles.stateSubtext}>Try broadening your search.</p>
    </div>
  );
}
```

New:

```tsx
{
  data && data.data.length === 0 && (
    <PixelState
      variant="empty"
      text="NO QUESTS FOUND"
      subtext="Try broadening your search."
    />
  );
}
```

- [ ] **Step 8: Remove state styles from `src/components/SearchResults/SearchResults.module.css`**

Delete these rule blocks (they now live in PixelState.module.css):

```css
/* States */
.state { ... }
.stateDie { ... }
.stateText { ... }
.stateSubtext { ... }
.progressBar { ... }
.progressFill { ... }
@keyframes loadingProgress { ... }
```

- [ ] **Step 9: Update `src/components/EventDetail/EventDetail.tsx`**

Add import:

```tsx
import { PixelState } from "../../ui/PixelState/PixelState";
```

Replace the three early returns:

Old loading return:

```tsx
if (isLoading) {
  return (
    <div className={styles.state}>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} />
      </div>
      <p className={styles.stateText}>LOADING QUEST...</p>
    </div>
  );
}
```

New:

```tsx
if (isLoading) {
  return <PixelState variant="loading" text="LOADING QUEST..." />;
}
```

Old error return:

```tsx
if (isError) {
  return (
    <div className={styles.state}>
      <p className={styles.stateText}>QUEST FAILED</p>
      <p className={styles.stateSubtext}>
        Unable to load event. Please try again.
      </p>
    </div>
  );
}
```

New:

```tsx
if (isError) {
  return (
    <PixelState
      variant="error"
      text="QUEST FAILED"
      subtext="Unable to load event. Please try again."
    />
  );
}
```

Old not-found return:

```tsx
if (!data || data.data.length === 0) {
  return (
    <div className={styles.state}>
      <div className={styles.stateDie} aria-hidden="true">
        ⚄
      </div>
      <p className={styles.stateText}>EVENT NOT FOUND</p>
      <p className={styles.stateSubtext}>This quest does not exist.</p>
    </div>
  );
}
```

New:

```tsx
if (!data || data.data.length === 0) {
  return (
    <PixelState
      variant="empty"
      text="EVENT NOT FOUND"
      subtext="This quest does not exist."
    />
  );
}
```

- [ ] **Step 10: Remove state styles from `src/components/EventDetail/EventDetail.module.css`**

Delete these rule blocks:

```css
/* States */
.state { ... }
.stateDie { ... }
.stateText { ... }
.stateSubtext { ... }
.progressBar { ... }
.progressFill { ... }
@keyframes loadingProgress { ... }
```

- [ ] **Step 11: Run all tests**

Run: `npm test`
Expected: 159 tests pass (154 + 5 PixelState tests).

- [ ] **Step 12: Commit**

```bash
git add src/ui/PixelState/ src/components/SearchResults/SearchResults.tsx src/components/SearchResults/SearchResults.module.css src/components/EventDetail/EventDetail.tsx src/components/EventDetail/EventDetail.module.css
git commit -m "feat: extract PixelState primitive, deduplicate loading/empty/error states"
```

---

### Task 6: ToggleTile primitive + update day tile tests

**Files:**

- Create: `src/ui/ToggleTile/ToggleTile.tsx`
- Create: `src/ui/ToggleTile/ToggleTile.module.css`
- Create: `src/ui/ToggleTile/ToggleTile.test.tsx`
- Create: `src/ui/ToggleTile/ToggleTile.stories.tsx`
- Modify: `src/components/SearchForm/SearchForm.tsx`
- Modify: `src/components/SearchForm/SearchForm.module.css`
- Modify: `src/components/SearchForm/SearchForm.test.tsx`
- Modify: `src/routes/index.test.tsx`

**Why change from checkbox to button:** The current day tiles are hidden `<input type="checkbox">` elements styled via sibling CSS selectors — a CSS-only toggle trick. Replacing with `aria-pressed` buttons is semantically cleaner: the button role directly communicates "this is a toggle" without relying on a hidden input. The `days` string field in react-hook-form is already managed via `setValue`, so removing the checkboxes doesn't break form state.

- [ ] **Step 1: Write `src/ui/ToggleTile/ToggleTile.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToggleTile } from "./ToggleTile";

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

  it("has aria-pressed='true' when selected", () => {
    render(<ToggleTile selected>Fri</ToggleTile>);
    expect(screen.getByRole("button", { name: "Fri" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("is disabled when disabled prop is set", () => {
    render(<ToggleTile disabled>Sat</ToggleTile>);
    expect(screen.getByRole("button", { name: "Sat" })).toBeDisabled();
  });

  it("calls onClick when clicked", async () => {
    const handleClick = vi.fn();
    render(<ToggleTile onClick={handleClick}>Sun</ToggleTile>);
    await userEvent.click(screen.getByRole("button", { name: "Sun" }));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("does not call onClick when disabled", async () => {
    const handleClick = vi.fn();
    render(
      <ToggleTile disabled onClick={handleClick}>
        Wed
      </ToggleTile>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Wed" }), {
      pointerEventsCheck: 0,
    });
    expect(handleClick).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/ui/ToggleTile/ToggleTile.test.tsx`
Expected: FAIL — `Cannot find module './ToggleTile'`

- [ ] **Step 3: Create `src/ui/ToggleTile/ToggleTile.module.css`**

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
}

.tile:focus-visible {
  outline: 2px solid var(--color-bark-dark);
  outline-offset: 2px;
}

.tile:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.selected {
  background: var(--color-bark);
  color: var(--color-parchment);
}
```

- [ ] **Step 4: Create `src/ui/ToggleTile/ToggleTile.tsx`**

```tsx
import React from "react";
import styles from "./ToggleTile.module.css";

interface ToggleTileProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export const ToggleTile = React.forwardRef<HTMLButtonElement, ToggleTileProps>(
  function ToggleTile({ selected = false, className, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={selected}
        className={[
          styles.tile,
          selected ? styles.selected : undefined,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    );
  },
);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test src/ui/ToggleTile/ToggleTile.test.tsx`
Expected: 6 tests pass.

- [ ] **Step 6: Create `src/ui/ToggleTile/ToggleTile.stories.tsx`**

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ToggleTile } from "./ToggleTile";
import { makeMatrix } from "../storyMatrix";

const meta = {
  title: "UI/ToggleTile",
  component: ToggleTile,
  tags: ["autodocs"],
  args: { children: "Fri" },
} satisfies Meta<typeof ToggleTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unselected: Story = {
  args: { selected: false },
};

export const Selected: Story = {
  args: { selected: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledSelected: Story = {
  args: { selected: true, disabled: true },
};

const { stories, Grid } = makeMatrix(
  meta,
  { selected: [false, true], disabled: [false, true] },
  { children: "Fri" },
);

export const AllVariants: Story = { render: Grid };

export const { false_false, false_true, true_false, true_true } = stories;
```

- [ ] **Step 7: Update `src/components/SearchForm/SearchForm.tsx`**

Add import:

```tsx
import { ToggleTile } from "../../ui/ToggleTile/ToggleTile";
```

Replace the day tiles rendering block:

Old (inside the DAYS fieldset):

```tsx
<div className={styles.dayTiles}>
  {DAY_KEYS.map((key) => (
    <label key={key} className={styles.dayTile}>
      <input
        type="checkbox"
        className={styles.dayCheckbox}
        checked={selectedDays.has(key)}
        disabled={daysDisabled}
        onChange={(e) => handleDayChange(key, e.target.checked)}
      />
      <span>{DAY_LABELS[key]}</span>
    </label>
  ))}
</div>
```

New:

```tsx
<div className={styles.dayTiles}>
  {DAY_KEYS.map((key) => (
    <ToggleTile
      key={key}
      selected={selectedDays.has(key)}
      disabled={daysDisabled}
      onClick={() => handleDayChange(key, !selectedDays.has(key))}
    >
      {DAY_LABELS[key]}
    </ToggleTile>
  ))}
</div>
```

- [ ] **Step 8: Remove day tile styles from `src/components/SearchForm/SearchForm.module.css`**

Delete these rule blocks (the ToggleTile component is now self-contained):

```css
/* Day toggle tiles */
.dayTiles { ... }
.dayTile { ... }
.dayCheckbox { ... }
.dayTile span { ... }
.dayCheckbox:checked + span { ... }
.dayCheckbox:disabled + span { ... }
.dayCheckbox:focus-visible + span { ... }
```

Keep `.dayTiles` only as a layout wrapper if the display/gap is still needed:

```css
.dayTiles {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-2);
}
```

Delete `.dayTile`, `.dayCheckbox`, and all sibling selector rules.

- [ ] **Step 9: Update `src/components/SearchForm/SearchForm.test.tsx`**

The day tests currently use `getByRole("checkbox")`. Update them to use `getByRole("button")` and `aria-pressed`:

Replace this test:

```tsx
test("renders day checkboxes in the top-level form area", () => {
  render(<SearchForm defaultValues={{}} onSearch={noop} />);
  for (const day of DAYS) {
    expect(screen.getByRole("checkbox", { name: day })).toBeInTheDocument();
  }
});
```

With:

```tsx
test("renders day tiles as toggle buttons in the DAYS fieldset", () => {
  render(<SearchForm defaultValues={{}} onSearch={noop} />);
  for (const day of DAYS) {
    expect(screen.getByRole("button", { name: day })).toBeInTheDocument();
  }
});
```

Replace this test:

```tsx
test("checking a day checkbox submits the correct days value", async () => {
  const user = userEvent.setup();
  const handleSearch = vi.fn<[SearchFormValues], void>();
  render(<SearchForm defaultValues={{}} onSearch={handleSearch} />);

  await user.click(screen.getByRole("checkbox", { name: "Thu" }));
  await user.click(screen.getByRole("button", { name: "▶ Search" }));

  expect(handleSearch.mock.calls[0][0].days).toBe("thu");
});
```

With:

```tsx
test("clicking a day tile submits the correct days value", async () => {
  const user = userEvent.setup();
  const handleSearch = vi.fn<[SearchFormValues], void>();
  render(<SearchForm defaultValues={{}} onSearch={handleSearch} />);

  await user.click(screen.getByRole("button", { name: "Thu" }));
  await user.click(screen.getByRole("button", { name: "▶ Search" }));

  expect(handleSearch.mock.calls[0][0].days).toBe("thu");
});
```

Replace this test:

```tsx
test("checking multiple day checkboxes submits comma-separated days", async () => {
  const user = userEvent.setup();
  const handleSearch = vi.fn<[SearchFormValues], void>();
  render(<SearchForm defaultValues={{}} onSearch={handleSearch} />);

  await user.click(screen.getByRole("checkbox", { name: "Wed" }));
  await user.click(screen.getByRole("checkbox", { name: "Sun" }));
  await user.click(screen.getByRole("button", { name: "▶ Search" }));

  expect(handleSearch.mock.calls[0][0].days).toBe("wed,sun");
});
```

With:

```tsx
test("clicking multiple day tiles submits comma-separated days", async () => {
  const user = userEvent.setup();
  const handleSearch = vi.fn<[SearchFormValues], void>();
  render(<SearchForm defaultValues={{}} onSearch={handleSearch} />);

  await user.click(screen.getByRole("button", { name: "Wed" }));
  await user.click(screen.getByRole("button", { name: "Sun" }));
  await user.click(screen.getByRole("button", { name: "▶ Search" }));

  expect(handleSearch.mock.calls[0][0].days).toBe("wed,sun");
});
```

Replace this test:

```tsx
test("populates day checkboxes from defaultValues", () => {
  render(<SearchForm defaultValues={{ days: "fri,sat" }} onSearch={noop} />);
  expect(screen.getByRole("checkbox", { name: "Fri" })).toBeChecked();
  expect(screen.getByRole("checkbox", { name: "Sat" })).toBeChecked();
  expect(screen.getByRole("checkbox", { name: "Wed" })).not.toBeChecked();
});
```

With:

```tsx
test("populates day tiles from defaultValues using aria-pressed", () => {
  render(<SearchForm defaultValues={{ days: "fri,sat" }} onSearch={noop} />);
  expect(screen.getByRole("button", { name: "Fri" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByRole("button", { name: "Sat" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByRole("button", { name: "Wed" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});
```

Replace this test:

```tsx
test("Reset button clears day checkboxes", async () => {
  const user = userEvent.setup();
  render(<SearchForm defaultValues={{ days: "thu" }} onSearch={noop} />);

  await user.click(screen.getByRole("button", { name: "↺ Reset" }));

  expect(screen.getByRole("checkbox", { name: "Thu" })).not.toBeChecked();
});
```

With:

```tsx
test("Reset button clears day tiles", async () => {
  const user = userEvent.setup();
  render(<SearchForm defaultValues={{ days: "thu" }} onSearch={noop} />);

  await user.click(screen.getByRole("button", { name: "↺ Reset" }));

  expect(screen.getByRole("button", { name: "Thu" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});
```

Replace these two tests:

```tsx
test("day checkboxes are disabled when startDateTimeStart has a value", () => {
  render(
    <SearchForm
      defaultValues={{ startDateTimeStart: "2024-08-01T10:00" }}
      onSearch={noop}
    />,
  );
  for (const day of DAYS) {
    expect(screen.getByRole("checkbox", { name: day })).toBeDisabled();
  }
});

test("day checkboxes are disabled when startDateTimeEnd has a value", () => {
  render(
    <SearchForm
      defaultValues={{ startDateTimeEnd: "2024-08-01T14:00" }}
      onSearch={noop}
    />,
  );
  for (const day of DAYS) {
    expect(screen.getByRole("checkbox", { name: day })).toBeDisabled();
  }
});
```

With:

```tsx
test("day tiles are disabled when startDateTimeStart has a value", () => {
  render(
    <SearchForm
      defaultValues={{ startDateTimeStart: "2024-08-01T10:00" }}
      onSearch={noop}
    />,
  );
  for (const day of DAYS) {
    expect(screen.getByRole("button", { name: day })).toBeDisabled();
  }
});

test("day tiles are disabled when startDateTimeEnd has a value", () => {
  render(
    <SearchForm
      defaultValues={{ startDateTimeEnd: "2024-08-01T14:00" }}
      onSearch={noop}
    />,
  );
  for (const day of DAYS) {
    expect(screen.getByRole("button", { name: day })).toBeDisabled();
  }
});
```

- [ ] **Step 10: Update `src/routes/index.test.tsx`**

Replace this test:

```tsx
test("day checkboxes have span wrappers (CSS toggle tiles require them)", async () => {
  await renderSearchPage("/");
  const wedLabel = screen
    .getByRole("checkbox", { name: "Wed" })
    .closest("label");
  expect(wedLabel?.querySelector("span")).toBeInTheDocument();
});
```

With:

```tsx
test("day tiles are toggle buttons with aria-pressed", async () => {
  await renderSearchPage("/");
  expect(screen.getByRole("button", { name: "Wed" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});
```

- [ ] **Step 11: Run all tests**

Run: `npm test`
Expected: 165 tests pass (159 + 6 ToggleTile tests).

If a test fails with "Found multiple elements with role 'button' and name 'Thu'", there is a conflict between the day tiles buttons and the Search/Reset buttons. The day tiles are named by day label, so this should not happen. Check that no other button has the name "Wed", "Thu", etc.

- [ ] **Step 12: Commit**

```bash
git add src/ui/ToggleTile/ src/components/SearchForm/SearchForm.tsx src/components/SearchForm/SearchForm.module.css src/components/SearchForm/SearchForm.test.tsx src/routes/index.test.tsx
git commit -m "feat: extract ToggleTile primitive, replace hidden-checkbox day tiles with aria-pressed buttons"
```

---

### Task 7: Badge primitive

**Files:**

- Create: `src/ui/Badge/Badge.tsx`
- Create: `src/ui/Badge/Badge.module.css`
- Create: `src/ui/Badge/Badge.test.tsx`
- Create: `src/ui/Badge/Badge.stories.tsx`
- Modify: `src/components/EventDetail/EventDetail.tsx`
- Modify: `src/components/EventDetail/EventDetail.module.css`

- [ ] **Step 1: Write `src/ui/Badge/Badge.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { Badge, BoolBadge } from "./Badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>ticketed</Badge>);
    expect(screen.getByText("ticketed")).toBeInTheDocument();
  });

  it("renders filled variant (default)", () => {
    const { container } = render(<Badge variant="filled">ticketed</Badge>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders outline variant", () => {
    render(<Badge variant="outline">free</Badge>);
    expect(screen.getByText("free")).toBeInTheDocument();
  });
});

describe("BoolBadge", () => {
  it("shows ✓ for true", () => {
    render(<BoolBadge value={true} />);
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("shows ✓ for 'yes' string (case-insensitive)", () => {
    render(<BoolBadge value="yes" />);
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("shows ✓ for 'Yes' (capitalized)", () => {
    render(<BoolBadge value="Yes" />);
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("shows — for false", () => {
    render(<BoolBadge value={false} />);
    expect(screen.getByText("—")).toBeInTheDocument();
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

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/ui/Badge/Badge.test.tsx`
Expected: FAIL — `Cannot find module './Badge'`

- [ ] **Step 3: Create `src/ui/Badge/Badge.module.css`**

```css
.badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border: 2px solid var(--color-bark);
  font-family: var(--font-data);
  font-size: var(--text-small);
}

.filled {
  background: var(--color-bark);
  color: var(--color-parchment);
}

.outline {
  background: transparent;
  color: var(--color-bark);
}

.boolYes {
  color: var(--color-bark);
}

.boolNo {
  color: var(--color-bark-light);
}
```

- [ ] **Step 4: Create `src/ui/Badge/Badge.tsx`**

```tsx
import styles from "./Badge.module.css";

export const BADGE_VARIANTS = ["filled", "outline"] as const;
export type BadgeVariant = (typeof BADGE_VARIANTS)[number];

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "filled", className }: BadgeProps) {
  return (
    <span
      className={[styles.badge, styles[variant], className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}

interface BoolBadgeProps {
  value: string | boolean;
}

export function BoolBadge({ value }: BoolBadgeProps) {
  const isYes =
    value === true ||
    (typeof value === "string" && value.toLowerCase() === "yes");
  return (
    <span className={isYes ? styles.boolYes : styles.boolNo}>
      {isYes ? "✓" : "—"}
    </span>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test src/ui/Badge/Badge.test.tsx`
Expected: 9 tests pass.

- [ ] **Step 6: Create `src/ui/Badge/Badge.stories.tsx`**

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge, BoolBadge, BADGE_VARIANTS } from "./Badge";
import { makeMatrix } from "../storyMatrix";

const meta = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: { children: "ticketed" },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Filled: Story = {
  args: { variant: "filled", children: "ticketed" },
};

export const Outline: Story = {
  args: { variant: "outline", children: "free" },
};

const { stories, Grid } = makeMatrix(
  meta,
  { variant: BADGE_VARIANTS },
  { children: "ticketed" },
);

export const AllVariants: Story = { render: Grid };

export const { filled, outline } = stories;

export const BoolTrue: StoryObj = {
  render: () => <BoolBadge value={true} />,
};

export const BoolFalse: StoryObj = {
  render: () => <BoolBadge value={false} />,
};
```

- [ ] **Step 7: Update `src/components/EventDetail/EventDetail.tsx`**

Remove the inline `BoolField` component (lines 11–22 of the current file). Add imports:

```tsx
import { Badge, BoolBadge } from "../../ui/Badge/Badge";
```

Replace all `<BoolField value={...} />` usages with `<BoolBadge value={...} />`:

Old:

```tsx
<BoolField value={a.tournament} />
```

New:

```tsx
<BoolBadge value={a.tournament} />
```

Old:

```tsx
<BoolField value={a.materialsProvided} />
```

New:

```tsx
<BoolBadge value={a.materialsProvided} />
```

Replace the attendee registration pill:

Old:

```tsx
<span
  className={
    a.attendeeRegistration === "ticketed"
      ? styles.pillFilled
      : styles.pillOutline
  }
>
  {a.attendeeRegistration}
</span>
```

New:

```tsx
<Badge variant={a.attendeeRegistration === "ticketed" ? "filled" : "outline"}>
  {a.attendeeRegistration}
</Badge>
```

- [ ] **Step 8: Remove pill styles from `src/components/EventDetail/EventDetail.module.css`**

Delete these rule blocks:

```css
/* Registration pill */
.pillFilled { ... }
.pillOutline { ... }
```

- [ ] **Step 9: Run all tests**

Run: `npm test`
Expected: 174 tests pass (165 + 9 Badge tests).

- [ ] **Step 10: Commit**

```bash
git add src/ui/Badge/ src/components/EventDetail/EventDetail.tsx src/components/EventDetail/EventDetail.module.css
git commit -m "feat: extract Badge and BoolBadge primitives, remove inline BoolField and pill styles"
```

---

### Task 8: Fix bare table selectors in SearchResults

**Files:**

- Modify: `src/components/SearchResults/SearchResults.module.css`

The `SearchResults.module.css` file uses bare `table`, `table thead`, `table thead th`, etc. selectors. CSS Modules only scope class selectors (`.foo`), not element selectors (`table`). These rules currently leak globally, affecting any `<table>` in the app. The fix is to scope them under `.tableWrapper`.

- [ ] **Step 1: Write a failing test to confirm the behavior we want**

No test needed for this specific style change (visual correctness is not unit-testable). Verify that the existing 174 tests still pass after the change.

- [ ] **Step 2: Rewrite the table selectors in `src/components/SearchResults/SearchResults.module.css`**

The current file starts with:

```css
/* Table container */
.tableWrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-data);
  box-shadow: var(--shadow-table-inset);
}

table thead { ... }
table thead th { ... }
table thead th button { ... }
table thead th button:hover { ... }
table thead th button span { ... }
table tbody tr:nth-child(odd) { ... }
table tbody tr:nth-child(even) { ... }
table tbody tr { ... }
table tbody tr:hover { ... }
table td { ... }
```

Replace the entire table section with scoped selectors:

```css
/* Table container */
.tableWrapper {
  overflow-x: auto;
}

.tableWrapper table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-data);
  box-shadow: var(--shadow-table-inset);
}

.tableWrapper table thead {
  background: var(--color-bark);
  color: var(--color-parchment);
}

.tableWrapper table thead th {
  font-family: var(--font-pixel);
  font-size: var(--text-label);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-bark-light);
  text-align: left;
}

.tableWrapper table thead th button {
  background: none;
  border: none;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  cursor: pointer;
  padding: 0;
  text-align: left;
  width: 100%;
}

.tableWrapper table thead th button:hover {
  opacity: 0.8;
}

.tableWrapper table thead th button span {
  color: var(--color-gold);
}

.tableWrapper table tbody tr:nth-child(odd) {
  background: var(--color-parchment-light);
}

.tableWrapper table tbody tr:nth-child(even) {
  background: var(--color-parchment);
}

.tableWrapper table tbody tr {
  transition: background-color var(--motion-hover);
}

.tableWrapper table tbody tr:hover {
  background: var(--color-bark-light);
}

.tableWrapper table td {
  border: 1px solid var(--color-bark-light);
  padding: var(--space-1) var(--space-3);
  font-family: var(--font-data);
  font-size: var(--text-small);
  color: var(--color-ink);
}
```

Note: `font-size: 0.95rem` on `table td` is updated to `var(--text-small)` (14px) — the closest design token.

- [ ] **Step 3: Run all tests**

Run: `npm test`
Expected: 174 tests pass (no change in count).

- [ ] **Step 4: Commit**

```bash
git add src/components/SearchResults/SearchResults.module.css
git commit -m "fix: scope bare table selectors under .tableWrapper to prevent global CSS leakage"
```
