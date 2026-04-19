# Eurogame Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shift Gen Con Buddy from a retro pixel-game aesthetic to a warm Eurogame aesthetic — IM Fell English typography, organic shadows, linen textures, board-tile panels, meeple icons, and a semantic color system for event types, days, and experience levels.

**Architecture:** New CSS tokens cascade to all components without per-component changes to logic; semantic color mapping lives in a single utility (`conceptColors.ts`) consumed by a new `ConceptBadge` component and the `SearchForm` day tiles; meeple/pawn shapes are React inline-SVG components so they're themeable via `fill="currentColor"` and CSS custom properties.

**Tech Stack:** React, CSS Modules, Vite, Vitest, Base UI Toggle/ToggleGroup

---

## File Map

| File                                                    | Action | Purpose                                                                       |
| ------------------------------------------------------- | ------ | ----------------------------------------------------------------------------- |
| `src/styles/tokens.css`                                 | Modify | Replace pixel font/shadow tokens; add color family/day tokens                 |
| `src/styles/global.css`                                 | Modify | Replace grain texture with linen; fix body font reference                     |
| `index.html`                                            | Modify | Swap Google Font from Press Start 2P to IM Fell English                       |
| `src/ui/icons/Meeple.tsx`                               | Create | 3D meeple React component (header logo)                                       |
| `src/ui/icons/MeepleFlat.tsx`                           | Create | Flat meeple silhouette (ToggleTile indicator, PixelState)                     |
| `src/ui/icons/Pawn.tsx`                                 | Create | Pawn silhouette (player count in results table)                               |
| `src/utils/conceptColors.ts`                            | Create | Maps event type codes → color family; day names → color; experience → color   |
| `src/utils/conceptColors.test.ts`                       | Create | Covers all 19 event types, 5 days, 3 experience levels                        |
| `src/ui/Badge/Badge.tsx`                                | Modify | Add `ConceptBadge` named export                                               |
| `src/ui/Badge/Badge.module.css`                         | Modify | Add `.conceptBadge` style using CSS custom properties                         |
| `src/ui/Badge/Badge.test.tsx`                           | Modify | Add ConceptBadge tests                                                        |
| `src/ui/ToggleTile/ToggleTile.tsx`                      | Modify | Add meeple slot to tile interior                                              |
| `src/ui/ToggleTile/ToggleTile.module.css`               | Modify | Meeple slot visibility; `--tile-color`/`--tile-color-bg` selected state       |
| `src/ui/ToggleTile/ToggleTile.test.tsx`                 | Modify | Assert meeple SVG present in tile DOM                                         |
| `src/ui/PixelState/PixelState.tsx`                      | Modify | Replace emoji with `MeepleFlat` SVG                                           |
| `src/ui/PixelState/PixelState.module.css`               | Modify | New icon sizing/color styles; remove old `.die` pixel styles                  |
| `src/ui/PixelState/PixelState.test.tsx`                 | Modify | Assert SVG renders instead of emoji                                           |
| `src/ui/Button/Button.module.css`                       | Modify | `--font-display`, `border-radius: 3px`, organic shadow tokens                 |
| `src/routes/__root.tsx`                                 | Modify | Add `Meeple` icon + subtitle to site header                                   |
| `src/routes/index.module.css`                           | Modify | Header meeple layout; linen sidebar; remove inset shadow usage                |
| `src/components/SearchForm/SearchForm.tsx`              | Modify | Pass `--tile-color`/`--tile-color-bg` style to day `ToggleTile`s              |
| `src/components/SearchForm/SearchForm.module.css`       | Modify | Board-tile panel treatment; IM Fell labels/legend                             |
| `src/components/SearchResults/SearchResults.tsx`        | Modify | Day stripe `<td>`; `ConceptBadge` for eventType/day/experience columns        |
| `src/components/SearchResults/SearchResults.module.css` | Modify | Day stripe cell; board-tile table header; remove `--shadow-table-inset` usage |

---

## Task 1: Foundation — tokens, global CSS, Google Font

**Files:**

- Modify: `src/styles/tokens.css`
- Modify: `src/styles/global.css`
- Modify: `index.html`

- [ ] **Step 1: Replace tokens.css**

Replace the entire file:

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
  --font-display: "IM Fell English", serif;
  --font-data: "Courier Prime", monospace;

  /* Type scale */
  --text-display: 22px;
  --text-heading: 18px;
  --text-label: 14px;
  --text-badge: 11px;
  --text-icon: 48px;
  --text-body: 16px;
  --text-small: 14px;

  /* Spacing — 8px grid */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 16px;
  --space-4: 24px;
  --space-5: 32px;

  /* Sizes */
  --size-sidebar: 280px;
  --size-detail-max: 800px;

  /* Shadow — warm organic cast */
  --shadow-panel: 2px 3px 8px rgba(59, 30, 10, 0.18);
  --shadow-button: 1px 2px 5px rgba(59, 30, 10, 0.25);
  --shadow-button-active: 0px 1px 2px rgba(59, 30, 10, 0.2);

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

  /* Event type family colors */
  --color-type-roleplay: #5c3a7a;
  --color-type-roleplay-bg: #f0eaf7;
  --color-type-board: #2a5c3a;
  --color-type-board-bg: #e8f2ea;
  --color-type-mini: #1a3d5c;
  --color-type-mini-bg: #e4edf5;
  --color-type-electronic: #7a4a00;
  --color-type-electronic-bg: #fdf0d8;
  --color-type-learning: #1a5c5c;
  --color-type-learning-bg: #e4f2f2;
  --color-type-entertainment: #7a2040;
  --color-type-entertainment-bg: #f5e4ea;

  /* Convention day colors */
  --color-day-wed: #4a3570;
  --color-day-wed-bg: #edeaf7;
  --color-day-thu: #7a4a00;
  --color-day-thu-bg: #fdf0d8;
  --color-day-fri: #2a5c3a;
  --color-day-fri-bg: #e8f2ea;
  --color-day-sat: #1a3d5c;
  --color-day-sat-bg: #e4edf5;
  --color-day-sun: #7a2040;
  --color-day-sun-bg: #f5e4ea;

  /* interpolate-size: allow <details> height: auto transitions */
  interpolate-size: allow-keywords;
}
```

- [ ] **Step 2: Update global.css — replace grain texture with linen**

Replace the entire `html` rule at the top of `src/styles/global.css`:

```css
/* ─── Linen Texture ──────────────────────────────────────────────────────── */
html {
  background-color: var(--color-parchment);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23f5e6c8'/%3E%3Crect x='0' y='0' width='1' height='1' fill='%23d4a76a' opacity='0.15'/%3E%3Crect x='2' y='2' width='1' height='1' fill='%23d4a76a' opacity='0.15'/%3E%3C/svg%3E");
  background-attachment: fixed;
}
```

- [ ] **Step 3: Swap Google Font in index.html**

Replace the Google Fonts `<link>` with:

```html
<link
  href="https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=IM+Fell+English:ital@0;1&display=swap"
  rel="stylesheet"
/>
```

(Keep the existing `<link rel="preconnect">` tags above it.)

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors. CSS custom properties that reference removed tokens (`--font-pixel`, `--shadow-table-inset`, `--shadow-panel-inset`) will show as browser warnings but won't break the build — they're cleaned up in later tasks.

- [ ] **Step 5: Commit**

```bash
git add src/styles/tokens.css src/styles/global.css index.html
git commit -m "feat: replace pixel font/shadow tokens with eurogame design language"
```

---

## Task 2: Icon components

**Files:**

- Create: `src/ui/icons/Meeple.tsx`
- Create: `src/ui/icons/MeepleFlat.tsx`
- Create: `src/ui/icons/Pawn.tsx`

No tests needed — these are pure SVG render components with no logic.

- [ ] **Step 1: Create Meeple.tsx (3D logo variant)**

```tsx
// src/ui/icons/Meeple.tsx
interface MeepleProps {
  frontFill?: string;
  shadowFill?: string;
  stroke?: string;
  strokeWidth?: number;
  className?: string;
  "aria-hidden"?: true | "true";
}

const PATH =
  "M 214,169 C 164,194 96,219 80,248 C 67,278 96,295 130,282 C 159,269 189,265 193,278 L 189,320 L 126,421 L 206,421 L 256,341 L 306,421 L 386,421 L 323,320 L 319,278 C 323,265 353,269 382,282 C 416,295 445,278 432,248 C 416,219 348,194 298,169 C 311,143 319,114 319,93 A 63 63 0 0 0 193,93 C 193,114 201,143 214,169 Z";

export function Meeple({
  frontFill = "white",
  shadowFill = "black",
  stroke = "black",
  strokeWidth = 12,
  className,
  "aria-hidden": ariaHidden,
}: MeepleProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      aria-hidden={ariaHidden}
    >
      <path d={PATH} fill={shadowFill} transform="translate(-30,-30)" />
      <path
        d={PATH}
        fill={frontFill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
```

- [ ] **Step 2: Create MeepleFlat.tsx (flat silhouette, currentColor)**

```tsx
// src/ui/icons/MeepleFlat.tsx
interface MeepleFlatProps {
  className?: string;
  "aria-hidden"?: true | "true";
}

export function MeepleFlat({
  className,
  "aria-hidden": ariaHidden,
}: MeepleFlatProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      aria-hidden={ariaHidden}
    >
      <path
        fill="currentColor"
        d="M 214,169 C 164,194 96,219 80,248 C 67,278 96,295 130,282 C 159,269 189,265 193,278 L 189,320 L 126,421 L 206,421 L 256,341 L 306,421 L 386,421 L 323,320 L 319,278 C 323,265 353,269 382,282 C 416,295 445,278 432,248 C 416,219 348,194 298,169 C 311,143 319,114 319,93 A 63 63 0 0 0 193,93 C 193,114 201,143 214,169 Z"
      />
    </svg>
  );
}
```

- [ ] **Step 3: Create Pawn.tsx**

```tsx
// src/ui/icons/Pawn.tsx
interface PawnProps {
  className?: string;
  "aria-hidden"?: true | "true";
}

export function Pawn({ className, "aria-hidden": ariaHidden }: PawnProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 120"
      className={className}
      aria-hidden={ariaHidden}
    >
      <circle cx="50" cy="28" r="18" fill="currentColor" />
      <path
        d="M 43,44 L 40,54 Q 20,62 18,90 L 18,110 L 82,110 L 82,90 Q 80,62 60,54 L 57,44 Z"
        fill="currentColor"
      />
    </svg>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/ui/icons/
git commit -m "feat: add Meeple, MeepleFlat, and Pawn inline SVG components"
```

---

## Task 3: Color utilities

**Files:**

- Create: `src/utils/conceptColors.ts`
- Create: `src/utils/conceptColors.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/utils/conceptColors.test.ts
import {
  EVENT_TYPE_COLORS,
  DAY_COLORS,
  EXPERIENCE_COLORS,
} from "./conceptColors";

const ALL_EVENT_TYPE_CODES = [
  "ANI",
  "BGM",
  "CGM",
  "EGM",
  "ENT",
  "FLM",
  "HMN",
  "KID",
  "LRP",
  "MHE",
  "NMN",
  "RPG",
  "SEM",
  "SPA",
  "TCG",
  "TDA",
  "TRD",
  "WKS",
  "ZED",
] as const;

describe("EVENT_TYPE_COLORS", () => {
  it.each(ALL_EVENT_TYPE_CODES)("maps %s to a color entry", (code) => {
    expect(EVENT_TYPE_COLORS[code]).toMatchObject({
      color: expect.stringMatching(/^#[0-9a-f]{6}$/),
      bg: expect.stringMatching(/^#[0-9a-f]{6}$/),
    });
  });

  it("maps RPG, LRP, TDA to the roleplay family", () => {
    expect(EVENT_TYPE_COLORS["RPG"]).toEqual(EVENT_TYPE_COLORS["LRP"]);
    expect(EVENT_TYPE_COLORS["RPG"]).toEqual(EVENT_TYPE_COLORS["TDA"]);
    expect(EVENT_TYPE_COLORS["RPG"].color).toBe("#5c3a7a");
  });

  it("maps BGM, CGM, TCG to the board & card family", () => {
    expect(EVENT_TYPE_COLORS["BGM"]).toEqual(EVENT_TYPE_COLORS["CGM"]);
    expect(EVENT_TYPE_COLORS["BGM"].color).toBe("#2a5c3a");
  });

  it("maps HMN, NMN, MHE to the miniatures family", () => {
    expect(EVENT_TYPE_COLORS["HMN"]).toEqual(EVENT_TYPE_COLORS["NMN"]);
    expect(EVENT_TYPE_COLORS["HMN"].color).toBe("#1a3d5c");
  });
});

describe("DAY_COLORS", () => {
  it.each(["Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])(
    "maps %s to a color entry",
    (day) => {
      expect(DAY_COLORS[day]).toMatchObject({
        color: expect.stringMatching(/^#[0-9a-f]{6}$/),
        bg: expect.stringMatching(/^#[0-9a-f]{6}$/),
      });
    },
  );

  it("maps Thursday to amber", () => {
    expect(DAY_COLORS["Thursday"].color).toBe("#7a4a00");
  });
});

describe("EXPERIENCE_COLORS", () => {
  it("maps the full None string to green", () => {
    expect(
      EXPERIENCE_COLORS[
        "None (You've never played before - rules will be taught)"
      ].color,
    ).toBe("#2a5c3a");
  });

  it("maps the full Some string to amber", () => {
    expect(
      EXPERIENCE_COLORS[
        "Some (You've played it a bit and understand the basics)"
      ].color,
    ).toBe("#7a4a00");
  });

  it("maps the full Expert string to rose", () => {
    expect(
      EXPERIENCE_COLORS["Expert (You play it regularly and know all the rules)"]
        .color,
    ).toBe("#7a2040");
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- conceptColors
```

Expected: FAIL — `Cannot find module './conceptColors'`

- [ ] **Step 3: Implement conceptColors.ts**

```ts
// src/utils/conceptColors.ts
export interface ConceptColor {
  color: string;
  bg: string;
}

const ROLEPLAY: ConceptColor = { color: "#5c3a7a", bg: "#f0eaf7" };
const BOARD_CARD: ConceptColor = { color: "#2a5c3a", bg: "#e8f2ea" };
const MINIATURES: ConceptColor = { color: "#1a3d5c", bg: "#e4edf5" };
const ELECTRONIC: ConceptColor = { color: "#7a4a00", bg: "#fdf0d8" };
const LEARNING: ConceptColor = { color: "#1a5c5c", bg: "#e4f2f2" };
const ENTERTAINMENT: ConceptColor = { color: "#7a2040", bg: "#f5e4ea" };

export const EVENT_TYPE_COLORS: Record<string, ConceptColor> = {
  RPG: ROLEPLAY,
  LRP: ROLEPLAY,
  TDA: ROLEPLAY,
  BGM: BOARD_CARD,
  CGM: BOARD_CARD,
  TCG: BOARD_CARD,
  HMN: MINIATURES,
  NMN: MINIATURES,
  MHE: MINIATURES,
  EGM: ELECTRONIC,
  SEM: LEARNING,
  WKS: LEARNING,
  ANI: ENTERTAINMENT,
  ENT: ENTERTAINMENT,
  FLM: ENTERTAINMENT,
  KID: ENTERTAINMENT,
  SPA: ENTERTAINMENT,
  TRD: ENTERTAINMENT,
  ZED: ENTERTAINMENT,
};

export const DAY_COLORS: Record<string, ConceptColor> = {
  Wednesday: { color: "#4a3570", bg: "#edeaf7" },
  Thursday: { color: "#7a4a00", bg: "#fdf0d8" },
  Friday: { color: "#2a5c3a", bg: "#e8f2ea" },
  Saturday: { color: "#1a3d5c", bg: "#e4edf5" },
  Sunday: { color: "#7a2040", bg: "#f5e4ea" },
};

export const EXPERIENCE_COLORS: Record<string, ConceptColor> = {
  "None (You've never played before - rules will be taught)": {
    color: "#2a5c3a",
    bg: "#e8f2ea",
  },
  "Some (You've played it a bit and understand the basics)": {
    color: "#7a4a00",
    bg: "#fdf0d8",
  },
  "Expert (You play it regularly and know all the rules)": {
    color: "#7a2040",
    bg: "#f5e4ea",
  },
};
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- conceptColors
```

Expected: PASS — 9 tests

- [ ] **Step 5: Commit**

```bash
git add src/utils/conceptColors.ts src/utils/conceptColors.test.ts
git commit -m "feat: add conceptColors utility mapping event types, days, and experience to colors"
```

---

## Task 4: ConceptBadge component

**Files:**

- Modify: `src/ui/Badge/Badge.tsx`
- Modify: `src/ui/Badge/Badge.module.css`
- Modify: `src/ui/Badge/Badge.test.tsx`

- [ ] **Step 1: Write failing tests for ConceptBadge**

Add to `src/ui/Badge/Badge.test.tsx`:

```tsx
import { ConceptBadge } from "./Badge";

describe("ConceptBadge", () => {
  it("renders the value as text when no children given", () => {
    render(<ConceptBadge concept="eventType" value="RPG" />);
    expect(screen.getByText("RPG")).toBeInTheDocument();
  });

  it("renders children instead of value when provided", () => {
    render(
      <ConceptBadge
        concept="experience"
        value="None (You've never played before - rules will be taught)"
      >
        None
      </ConceptBadge>,
    );
    expect(screen.getByText("None")).toBeInTheDocument();
  });

  it("applies roleplay color custom properties for RPG", () => {
    const { container } = render(
      <ConceptBadge concept="eventType" value="RPG" />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.getPropertyValue("--concept-color")).toBe("#5c3a7a");
    expect(el.style.getPropertyValue("--concept-bg")).toBe("#f0eaf7");
  });

  it("applies Thursday color custom properties for day", () => {
    const { container } = render(
      <ConceptBadge concept="day" value="Thursday" />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.getPropertyValue("--concept-color")).toBe("#7a4a00");
    expect(el.style.getPropertyValue("--concept-bg")).toBe("#fdf0d8");
  });

  it("applies no inline style for an unknown value", () => {
    const { container } = render(
      <ConceptBadge concept="eventType" value="UNKNOWN" />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.getPropertyValue("--concept-color")).toBe("");
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- Badge
```

Expected: FAIL — `ConceptBadge is not exported from './Badge'`

- [ ] **Step 3: Implement ConceptBadge in Badge.tsx**

Add to `src/ui/Badge/Badge.tsx` (after the existing `BoolBadge`):

```tsx
import {
  EVENT_TYPE_COLORS,
  DAY_COLORS,
  EXPERIENCE_COLORS,
} from "../../utils/conceptColors";
import type { ConceptColor } from "../../utils/conceptColors";

interface ConceptBadgeProps {
  concept: "eventType" | "day" | "experience";
  value: string;
  children?: React.ReactNode;
  className?: string;
}

export function ConceptBadge({
  concept,
  value,
  children,
  className,
}: ConceptBadgeProps) {
  let colors: ConceptColor | undefined;
  if (concept === "eventType") colors = EVENT_TYPE_COLORS[value];
  else if (concept === "day") colors = DAY_COLORS[value];
  else if (concept === "experience") colors = EXPERIENCE_COLORS[value];

  const style = colors
    ? ({
        "--concept-color": colors.color,
        "--concept-bg": colors.bg,
      } as React.CSSProperties)
    : undefined;

  return (
    <span
      className={[styles.conceptBadge, className].filter(Boolean).join(" ")}
      style={style}
    >
      {children ?? value}
    </span>
  );
}
```

- [ ] **Step 4: Add .conceptBadge styles to Badge.module.css**

```css
.conceptBadge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--concept-color, var(--color-bark));
  border-radius: 10px;
  background: var(--concept-bg, var(--color-parchment-light));
  color: var(--concept-color, var(--color-bark));
  font-family: var(--font-display);
  font-size: var(--text-badge);
  font-style: italic;
  white-space: nowrap;
  letter-spacing: 0.03em;
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npm test -- Badge
```

Expected: PASS — all existing Badge/BoolBadge tests plus 5 new ConceptBadge tests

- [ ] **Step 6: Commit**

```bash
git add src/ui/Badge/Badge.tsx src/ui/Badge/Badge.module.css src/ui/Badge/Badge.test.tsx
git commit -m "feat: add ConceptBadge for semantic event type/day/experience color mapping"
```

---

## Task 5: ToggleTile — meeple selected state

**Files:**

- Modify: `src/ui/ToggleTile/ToggleTile.tsx`
- Modify: `src/ui/ToggleTile/ToggleTile.module.css`
- Modify: `src/ui/ToggleTile/ToggleTile.test.tsx`

- [ ] **Step 1: Write failing test**

Add to `src/ui/ToggleTile/ToggleTile.test.tsx`:

```tsx
it("renders an aria-hidden meeple SVG inside the tile", () => {
  render(<ToggleTile>Thu</ToggleTile>);
  const btn = screen.getByRole("button", { name: "Thu" });
  expect(btn.querySelector("svg[aria-hidden='true']")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- ToggleTile
```

Expected: FAIL — `querySelector` returns null

- [ ] **Step 3: Update ToggleTile.tsx to include meeple slot**

Replace the full content of `src/ui/ToggleTile/ToggleTile.tsx`:

```tsx
import React from "react";
import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { MeepleFlat } from "../icons/MeepleFlat";
import styles from "./ToggleTile.module.css";

export interface ToggleTileProps extends Toggle.Props {}

export const ToggleTile = React.forwardRef<HTMLButtonElement, ToggleTileProps>(
  function ToggleTile({ className, children, ...props }, ref) {
    return (
      <Toggle
        ref={ref}
        className={[styles.tile, className].filter(Boolean).join(" ")}
        {...props}
      >
        <MeepleFlat className={styles.meepleSlot} aria-hidden="true" />
        {children}
      </Toggle>
    );
  },
);

export interface ToggleTileGroupProps extends ToggleGroup.Props {}

export function ToggleTileGroup({
  className,
  multiple = true,
  ...props
}: ToggleTileGroupProps) {
  return (
    <ToggleGroup
      multiple={multiple}
      className={[styles.group, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
```

- [ ] **Step 4: Update ToggleTile.module.css**

Replace the entire file:

```css
.tile {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-family: var(--font-display);
  font-size: var(--text-label);
  font-style: italic;
  color: var(--color-bark);
  border: 1px solid var(--color-bark-light);
  border-radius: 4px;
  background: var(--color-parchment-light);
  padding: var(--space-1) var(--space-2);
  cursor: pointer;
  user-select: none;
  box-shadow: var(--shadow-button);
  transition:
    box-shadow var(--motion-press),
    background var(--motion-hover),
    border-color var(--motion-hover),
    color var(--motion-hover);
}

.tile:hover {
  background: var(--color-parchment);
  border-color: var(--color-bark);
}

.tile:active {
  box-shadow: var(--shadow-button-active);
}

.tile:focus-visible {
  outline: 2px solid var(--color-bark-dark);
  outline-offset: 2px;
}

.tile:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Selected state — uses CSS custom properties set by parent via style prop */
.tile[data-pressed] {
  background: var(--tile-color-bg, var(--color-bark));
  color: var(--tile-color, var(--color-parchment));
  border-color: var(--tile-color, var(--color-bark));
}

.tile[data-pressed]:hover {
  opacity: 0.9;
}

/* Meeple slot — always present to prevent layout shift */
.meepleSlot {
  width: 12px;
  height: 16px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity var(--motion-press);
}

.tile[data-pressed] .meepleSlot {
  opacity: 1;
}

.group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npm test -- ToggleTile
```

Expected: PASS — all existing tests plus the new meeple test

- [ ] **Step 6: Commit**

```bash
git add src/ui/ToggleTile/ToggleTile.tsx src/ui/ToggleTile/ToggleTile.module.css src/ui/ToggleTile/ToggleTile.test.tsx
git commit -m "feat(ToggleTile): add meeple placement indicator and concept-color selected state"
```

---

## Task 6: PixelState — replace emoji icons with SVG meeple

**Files:**

- Modify: `src/ui/PixelState/PixelState.tsx`
- Modify: `src/ui/PixelState/PixelState.module.css`
- Modify: `src/ui/PixelState/PixelState.test.tsx`

- [ ] **Step 1: Write failing tests**

Read `src/ui/PixelState/PixelState.test.tsx` to see what currently exists, then add:

```tsx
it("renders an SVG for the empty variant", () => {
  render(<PixelState variant="empty" text="No results" />);
  // SVG is aria-hidden; query by container
  const svg = document.querySelector('[data-testid="empty-icon"]');
  expect(svg).toBeInTheDocument();
});

it("renders an SVG for the error variant", () => {
  render(<PixelState variant="error" text="Error" />);
  expect(
    document.querySelector('[data-testid="error-icon"]'),
  ).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- PixelState
```

Expected: FAIL — `querySelector` returns null (elements don't have `data-testid` yet)

- [ ] **Step 3: Update PixelState.tsx**

Replace full file content:

```tsx
import { useEffect } from "react";
import { announce } from "../../lib/announce";
import { MeepleFlat } from "../icons/MeepleFlat";
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
        <MeepleFlat
          className={styles.icon}
          aria-hidden="true"
          data-testid="empty-icon"
        />
      )}
      {variant === "error" && (
        <MeepleFlat
          className={[styles.icon, styles.iconError].join(" ")}
          aria-hidden="true"
          data-testid="error-icon"
        />
      )}
      <p className={styles.text}>{text}</p>
      {subtext && <p className={styles.subtext}>{subtext}</p>}
    </div>
  );
}
```

Note: `MeepleFlat` doesn't accept `data-testid` by default. Add it to its props interface in `src/ui/icons/MeepleFlat.tsx`:

```tsx
interface MeepleFlatProps {
  className?: string;
  "aria-hidden"?: true | "true";
  "data-testid"?: string;
}

export function MeepleFlat({
  className,
  "aria-hidden": ariaHidden,
  "data-testid": testId,
}: MeepleFlatProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      aria-hidden={ariaHidden}
      data-testid={testId}
    >
      <path
        fill="currentColor"
        d="M 214,169 C 164,194 96,219 80,248 C 67,278 96,295 130,282 C 159,269 189,265 193,278 L 189,320 L 126,421 L 206,421 L 256,341 L 306,421 L 386,421 L 323,320 L 319,278 C 323,265 353,269 382,282 C 416,295 445,278 432,248 C 416,219 348,194 298,169 C 311,143 319,114 319,93 A 63 63 0 0 0 193,93 C 193,114 201,143 214,169 Z"
      />
    </svg>
  );
}
```

- [ ] **Step 4: Update PixelState.module.css**

Replace full file content:

```css
.state {
  text-align: center;
  border: 2px dashed var(--color-bark-light);
  border-radius: 4px;
  padding: var(--space-5);
  margin: var(--space-4) 0;
}

.icon {
  width: 48px;
  height: 48px;
  color: var(--color-bark-light);
  margin: 0 auto var(--space-3);
  display: block;
}

.iconError {
  color: #8b0000;
}

.text {
  font-family: var(--font-display);
  font-size: var(--text-heading);
  font-style: italic;
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
  width: 100%;
  max-width: 200px;
  height: var(--space-3);
  border: 2px solid var(--color-bark-light);
  border-radius: 2px;
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

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npm test -- PixelState
```

Expected: PASS — all existing announce tests plus the 2 new SVG tests

- [ ] **Step 6: Commit**

```bash
git add src/ui/icons/MeepleFlat.tsx src/ui/PixelState/PixelState.tsx src/ui/PixelState/PixelState.module.css src/ui/PixelState/PixelState.test.tsx
git commit -m "feat(PixelState): replace emoji icons with MeepleFlat SVG"
```

---

## Task 7: Button CSS — font and shadow

**Files:**

- Modify: `src/ui/Button/Button.module.css`

No new tests — existing Button tests cover rendering; this is a visual-only change.

- [ ] **Step 1: Update Button.module.css**

Replace the full file:

```css
.button {
  display: inline-block;
  border-radius: 3px;
  font-family: var(--font-display);
  font-size: var(--text-label);
  font-style: italic;
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  box-shadow: var(--shadow-button);
  border: 2px solid var(--color-bark);
  text-decoration: none;
  transition:
    box-shadow var(--motion-press),
    opacity var(--motion-hover);
  line-height: 1;
  letter-spacing: 0.03em;
}

.button:active {
  box-shadow: var(--shadow-button-active);
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

.primary:hover {
  opacity: 0.9;
}

.secondary {
  background: transparent;
  color: var(--color-bark);
}

.secondary:hover {
  background: var(--color-parchment-light);
}
```

- [ ] **Step 2: Run all tests to confirm no regressions**

```bash
npm test
```

Expected: PASS — all tests

- [ ] **Step 3: Commit**

```bash
git add src/ui/Button/Button.module.css
git commit -m "feat(Button): switch to IM Fell English and organic shadow"
```

---

## Task 8: Site header — meeple logo

**Files:**

- Modify: `src/routes/__root.tsx`
- Modify: `src/routes/index.module.css`

- [ ] **Step 1: Write failing test**

The existing test suite doesn't test the header specifically. Add to `src/routes/index.test.tsx`:

```tsx
test("site header contains the app title", async () => {
  await renderSearchPage();
  expect(screen.getByRole("banner")).toBeInTheDocument();
  expect(screen.getByText("Gen Con Buddy")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to confirm current state**

```bash
npm test -- index.test
```

The test may pass or fail depending on current text — confirm behavior before proceeding.

- [ ] **Step 3: Update \_\_root.tsx**

Replace full file content:

```tsx
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Meeple } from "../ui/icons/Meeple";
import styles from "./index.module.css";

export const Route = createRootRoute({
  component: () => (
    <>
      <header role="banner" className={styles.header}>
        <Meeple
          className={styles.headerMeeple}
          frontFill="var(--color-parchment)"
          shadowFill="rgba(0,0,0,0.35)"
          stroke="var(--color-parchment)"
          strokeWidth={8}
          aria-hidden="true"
        />
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

- [ ] **Step 4: Update header and sidebar styles in index.module.css**

Replace only the `.header`, `.headerTitle`, and `.sidebar` blocks (keep `.shell` and `.results` unchanged):

```css
.shell {
  display: grid;
  grid-template-columns: var(--size-sidebar) 1fr;
  grid-template-rows: 1fr;
  height: calc(100vh - 72px); /* updated to match new header height */
}

.sidebar {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 2px solid var(--color-bark-light);
  box-shadow: var(--shadow-panel);
  background-color: var(--color-parchment-light);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23fff9ee'/%3E%3Crect x='0' y='0' width='1' height='1' fill='%23d4a76a' opacity='0.12'/%3E%3Crect x='2' y='2' width='1' height='1' fill='%23d4a76a' opacity='0.12'/%3E%3C/svg%3E");
}

.results {
  overflow: auto;
  padding: var(--space-3);
}

.header {
  background: var(--color-bark-dark);
  border-bottom: 3px solid var(--color-gold);
  grid-column: 1 / -1;
  padding: var(--space-2) var(--space-4);
  z-index: var(--z-header);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.headerMeeple {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
}

.headerTitle {
  font-family: var(--font-display);
  font-size: var(--text-display);
  font-style: italic;
  color: var(--color-parchment);
  letter-spacing: 0.05em;
  margin: 0;
  line-height: 1;
}

.headerSubtitle {
  font-family: var(--font-display);
  font-size: 11px;
  font-style: italic;
  color: var(--color-gold);
  margin: 2px 0 0;
  letter-spacing: 0.05em;
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npm test -- index.test
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/routes/__root.tsx src/routes/index.module.css
git commit -m "feat: update site header with meeple logo and IM Fell English title"
```

---

## Task 9: SearchForm — board-tile panel + color day tiles

**Files:**

- Modify: `src/components/SearchForm/SearchForm.tsx`
- Modify: `src/components/SearchForm/SearchForm.module.css`

- [ ] **Step 1: Write failing test**

Add to `src/routes/index.test.tsx`:

```tsx
test("day toggle tiles have concept color style properties", async () => {
  await renderSearchPage();
  const thuBtn = screen.getByRole("button", { name: "Thu" });
  expect(thuBtn.style.getPropertyValue("--tile-color")).toBe("#7a4a00");
  expect(thuBtn.style.getPropertyValue("--tile-color-bg")).toBe("#fdf0d8");
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- index.test
```

Expected: FAIL — style property is empty string

- [ ] **Step 3: Update SearchForm.tsx — pass color style to day tiles**

In `src/components/SearchForm/SearchForm.tsx`, add the import and the day color mapping near the top of the file (after existing imports):

```tsx
import { DAY_COLORS } from "../../utils/conceptColors";

const DAY_FULL: Record<string, string> = {
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};
```

Then in the JSX, update the `ToggleTile` inside `DAY_KEYS.map(...)`:

```tsx
{
  DAY_KEYS.map((key) => {
    const colors = DAY_COLORS[DAY_FULL[key]];
    return (
      <ToggleTile
        key={key}
        value={key}
        style={
          colors
            ? ({
                "--tile-color": colors.color,
                "--tile-color-bg": colors.bg,
              } as React.CSSProperties)
            : undefined
        }
      >
        {DAY_LABELS[key]}
      </ToggleTile>
    );
  });
}
```

- [ ] **Step 4: Update SearchForm.module.css — board-tile panel treatment**

Replace the full file:

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

/* Board-tile fieldset panel */
.fieldset {
  border: 2px solid var(--color-bark);
  border-radius: 4px;
  margin: 0 0 var(--space-3) 0;
  padding: 0;
  overflow: hidden;
  box-shadow: var(--shadow-panel);
}

.legend {
  display: block;
  width: 100%;
  background: var(--color-bark);
  border-bottom: 2px solid var(--color-gold);
  font-family: var(--font-display);
  font-size: var(--text-label);
  font-style: italic;
  color: var(--color-parchment);
  padding: var(--space-1) var(--space-3);
  letter-spacing: 0.04em;
}

.fieldsetBody {
  padding: var(--space-2) var(--space-3) var(--space-3);
}

.label {
  display: block;
  font-family: var(--font-display);
  font-size: var(--text-label);
  font-style: italic;
  color: var(--color-bark);
  margin-bottom: var(--space-1);
  letter-spacing: 0.03em;
}

.input,
.select {
  display: block;
  width: 100%;
  background: var(--color-parchment-light);
  border: 1px solid var(--color-bark-light);
  border-radius: 3px;
  font-family: var(--font-data);
  font-size: 1rem;
  padding: var(--space-1) var(--space-2);
  color: var(--color-ink);
  margin-top: var(--space-1);
  margin-bottom: var(--space-2);
}

.input:focus,
.select:focus {
  outline: 2px solid var(--color-bark-dark);
  outline-offset: 2px;
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.rangeGroup {
  font-family: var(--font-data);
  font-size: 0.9rem;
  color: var(--color-bark-dark);
  margin-bottom: var(--space-3);
}

.dayTiles {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-1);
}

/* Sticky action buttons */
.buttonBar {
  position: sticky;
  bottom: 0;
  background: var(--color-parchment-light);
  border-top: 2px solid var(--color-bark-light);
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

- [ ] **Step 5: Update SearchForm.tsx — wrap fieldset body in .fieldsetBody div**

The CSS now uses `.fieldsetBody` for padding inside the fieldset. In `SearchForm.tsx`, each `<fieldset>` that had `padding` from the old `.fieldset` rule now needs its contents wrapped in a `<div className={styles.fieldsetBody}>`. Add this wrapper inside each `<fieldset>`:

```tsx
<fieldset className={styles.fieldset}>
  <legend className={styles.legend}>DAYS</legend>
  <div className={styles.fieldsetBody}>
    {/* ... existing fieldset content ... */}
  </div>
</fieldset>
```

Apply this pattern to every `<fieldset>` in the form.

- [ ] **Step 6: Run tests**

```bash
npm test -- index.test
```

Expected: PASS — all existing tests plus the new day color test

- [ ] **Step 7: Commit**

```bash
git add src/components/SearchForm/SearchForm.tsx src/components/SearchForm/SearchForm.module.css
git commit -m "feat(SearchForm): board-tile panel treatment and color-aware day ToggleTiles"
```

---

## Task 10: SearchResults — day stripe and ConceptBadge columns

**Files:**

- Modify: `src/components/SearchResults/SearchResults.tsx`
- Modify: `src/components/SearchResults/SearchResults.module.css`

- [ ] **Step 1: Write failing tests**

Add to `src/routes/index.test.tsx`. First find an existing test that renders results (e.g., one that checks table rows), and add alongside it:

```tsx
test("results table rows include a day stripe cell", async () => {
  server.use(
    http.get("/api/events", () =>
      HttpResponse.json({
        data: [
          makeEvent({
            eventType: "RPG",
            experienceRequired:
              "None (You've never played before - rules will be taught)",
            startDateTime: "2025-08-07T10:00:00-05:00", // Thursday
          }),
        ],
        meta: { total: 1 },
      }),
    ),
  );
  await renderSearchPage();
  await screen.findByRole("table");
  expect(
    document.querySelector('[data-testid="day-stripe"]'),
  ).toBeInTheDocument();
});

test("eventType column renders a ConceptBadge", async () => {
  server.use(
    http.get("/api/events", () =>
      HttpResponse.json({
        data: [makeEvent({ eventType: "RPG" })],
        meta: { total: 1 },
      }),
    ),
  );
  await renderSearchPage();
  await screen.findByRole("table");
  // ConceptBadge renders the value as text in a styled span
  expect(screen.getByText("RPG")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- index.test
```

Expected: FAIL — `querySelector` returns null for day-stripe

- [ ] **Step 3: Update SearchResults.tsx — add imports, day stripe column, ConceptBadge cells**

At the top of `src/components/SearchResults/SearchResults.tsx`, add:

```tsx
import { ConceptBadge } from "../../ui/Badge/Badge";
import { Pawn } from "../../ui/icons/Pawn";
import { DAY_COLORS } from "../../utils/conceptColors";
import { EXP } from "../../utils/enums";
```

Add a day stripe as the first entry in `COLUMNS`:

```tsx
const COLUMNS: ColumnDef<Event>[] = [
  {
    id: "dayStripe",
    header: () => null,
    cell: () => null, // rendered specially in the row loop below
  },
  // ... all existing columns follow unchanged
```

Update the `eventType` column cell to use `ConceptBadge`:

```tsx
{
  id: "eventType",
  header: "Type",
  meta: { sortField: "eventType" },
  cell: ({ row }) => (
    <ConceptBadge concept="eventType" value={row.original.attributes.eventType} />
  ),
},
```

Update the `day` column cell to use `ConceptBadge`:

```tsx
{
  id: "day",
  header: "Day",
  meta: { sortField: "startDateTime" },
  cell: ({ row }) => {
    const dayName = format(
      new Date(row.original.attributes.startDateTime),
      "EEEE",
    );
    return <ConceptBadge concept="day" value={dayName} />;
  },
},
```

Update the `experienceRequired` column cell to use `ConceptBadge` with short label:

```tsx
{
  id: "experienceRequired",
  header: "Experience Required",
  meta: { sortField: "experienceRequired" },
  cell: ({ row }) => {
    const raw = row.original.attributes.experienceRequired;
    return (
      <ConceptBadge concept="experience" value={raw}>
        {EXP[raw] ?? raw}
      </ConceptBadge>
    );
  },
},
```

Update the row render loop to handle the day stripe specially:

```tsx
<tbody>
  {table.getRowModel().rows.map((row) => {
    const dayName = format(
      new Date(row.original.attributes.startDateTime),
      "EEEE",
    );
    const dayColors = DAY_COLORS[dayName];
    return (
      <tr key={row.id}>
        {row.getVisibleCells().map((cell) => {
          if (cell.column.id === "dayStripe") {
            return (
              <td
                key={cell.id}
                className={styles.dayStripe}
                style={dayColors ? { background: dayColors.color } : undefined}
                aria-hidden="true"
                data-testid="day-stripe"
              />
            );
          }
          return (
            <td key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          );
        })}
      </tr>
    );
  })}
</tbody>
```

Also update the header row loop to handle the day stripe `<th>`:

```tsx
{headerGroup.headers.map((header) => {
  if (header.column.id === "dayStripe") {
    return (
      <th
        key={header.id}
        className={styles.dayStripe}
        aria-hidden="true"
      />
    );
  }
  // ... existing th rendering unchanged
```

- [ ] **Step 4: Update SearchResults.module.css**

Replace the entire file:

```css
/* Table container */
.tableWrapper {
  overflow-x: auto;
}

.tableWrapper table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-data);
  border: 2px solid var(--color-bark);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: var(--shadow-panel);
}

.tableWrapper table thead {
  background: var(--color-bark);
  border-bottom: 3px solid var(--color-gold);
}

.tableWrapper table thead th {
  font-family: var(--font-display);
  font-size: var(--text-label);
  font-style: italic;
  color: var(--color-parchment);
  padding: var(--space-2) var(--space-3);
  border-right: 1px solid var(--color-bark-dark);
  text-align: left;
  white-space: nowrap;
}

.tableWrapper table thead th:last-child {
  border-right: none;
}

.tableWrapper table thead th button {
  background: none;
  border: none;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  font-style: inherit;
  cursor: pointer;
  padding: 0;
  text-align: left;
  width: 100%;
}

.tableWrapper table thead th button:hover {
  opacity: 0.8;
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
  background: color-mix(
    in srgb,
    var(--color-bark-light) 30%,
    var(--color-parchment-light)
  );
}

.tableWrapper table td {
  border-right: 1px solid var(--color-bark-light);
  border-bottom: 1px solid var(--color-bark-light);
  padding: var(--space-1) var(--space-3);
  font-family: var(--font-data);
  font-size: var(--text-small);
  color: var(--color-ink);
}

.tableWrapper table td:last-child {
  border-right: none;
}

/* Day stripe — narrow colored left cell */
.dayStripe {
  width: 6px;
  min-width: 6px;
  max-width: 6px;
  padding: 0 !important;
  border: none !important;
}

/* Column visibility panel */
.visibilityPanel {
  margin-bottom: var(--space-3);
}

.visibilityPanel summary {
  font-family: var(--font-display);
  font-size: var(--text-label);
  font-style: italic;
  color: var(--color-bark);
  cursor: pointer;
  padding: var(--space-2) var(--space-3);
  border: 2px solid var(--color-bark);
  border-radius: 4px;
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
  color: var(--color-gold);
  animation: sortPulse 100ms ease-out;
}

@keyframes sortPulse {
  0% {
    transform: scale(1.4);
  }
  100% {
    transform: scale(1);
  }
}
```

- [ ] **Step 5: Run all tests**

```bash
npm test
```

Expected: PASS — all tests

- [ ] **Step 6: Commit**

```bash
git add src/components/SearchResults/SearchResults.tsx src/components/SearchResults/SearchResults.module.css
git commit -m "feat(SearchResults): add day stripe and ConceptBadge for type/day/experience columns"
```

---

## Self-Review Checklist

**Spec coverage:**

- [x] Typography: IM Fell English replaces Press Start 2P — Tasks 1, 7, 8, 9, 10
- [x] Shadow system: organic shadows replace pixel offsets — Task 1
- [x] Linen texture: panel bodies and page background — Tasks 1, 9
- [x] Board-tile panels: header band + gold accent — Tasks 8, 9, 10
- [x] Meeple SVG (3D): site header — Task 8
- [x] Meeple SVG (flat): PixelState empty/error, ToggleTile indicator — Tasks 5, 6
- [x] Pawn SVG: player count column — Task 2 (created), Task 10 (imported but not yet placed in player count column — see note below)
- [x] ToggleTile selected state with meeple — Task 5
- [x] Color system: event types, days, experience — Tasks 3, 4
- [x] ConceptBadge: eventType, day, experience in results table — Task 4, 10
- [x] Day stripe in results table — Task 10
- [x] Color-aware day ToggleTiles in search form — Task 9

**Note on Pawn:** The spec calls for a pawn icon beside player count in the results table. Task 10 imports `Pawn` but the `minPlayers`/`maxPlayers` columns still render plain text. Update those column cells in Task 10 Step 3 to:

```tsx
{
  id: "minPlayers",
  header: "Min Players",
  meta: { sortField: "minPlayers" },
  cell: ({ row }) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <Pawn aria-hidden="true" style={{ width: 10, height: 12, color: "var(--color-bark-light)" }} />
      {row.original.attributes.minPlayers}
    </span>
  ),
},
```

Apply the same pattern to `maxPlayers`. The `Pawn` component needs a `style` prop — add it to `PawnProps` in `src/ui/icons/Pawn.tsx`:

```tsx
interface PawnProps {
  className?: string;
  style?: React.CSSProperties;
  "aria-hidden"?: true | "true";
}
```
