# Mobile Hamburger Nav Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On mobile (≤60rem), replace the horizontal nav bar with a hamburger button that opens a dropdown popover containing nav links and an inline theme radio group.

**Architecture:** Extract the radio group out of `ThemePopover` into a shared `ThemeRadioGroup` component, create a `MobileNav` component that uses `@base-ui/react/popover` with the inline radio group, and wire both into `AppShell` via CSS that hides the desktop nav on mobile and shows the hamburger instead.

**Tech Stack:** `@base-ui/react` Popover, TanStack Router `Link`, CSS Modules, Vitest + Testing Library.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/components/ThemePopover/ThemeRadioGroup.tsx` | Create | Fieldset + RadioGroup — no side effects, pure render |
| `src/components/ThemePopover/ThemeRadioGroup.test.tsx` | Create | Unit tests for radio group in isolation |
| `src/components/ThemePopover/ThemePopover.tsx` | Modify | Delegates radio rendering to `ThemeRadioGroup` |
| `src/components/MobileNav/MobileNav.tsx` | Create | Hamburger trigger + Popover with links + inline radio group |
| `src/components/MobileNav/MobileNav.module.css` | Create | Styles for trigger and dropdown panel |
| `src/components/MobileNav/MobileNav.test.tsx` | Create | Integration tests via `renderRoute` |
| `src/routes/__root.tsx` | Modify | Render `MobileNav` alongside `<nav>` |
| `src/routes/__root.module.css` | Modify | Hide `.nav` / show `.mobileNav` at ≤60rem |
| `src/routes/__root.test.tsx` | Modify | Add test: hamburger button present |

---

## Task 1: Extract ThemeRadioGroup (TDD)

The radio group UI in `ThemePopover` needs to be a standalone component so `MobileNav` can render it inline without nesting a popover inside a popover.

**Files:**
- Create: `src/components/ThemePopover/ThemeRadioGroup.test.tsx`
- Create: `src/components/ThemePopover/ThemeRadioGroup.tsx`
- Modify: `src/components/ThemePopover/ThemePopover.tsx`

### Background

`ThemePopover.tsx` currently renders a `<fieldset>` + `RadioGroup` inline. The relevant CSS classes already exist in `ThemePopover.module.css`: `.fieldset`, `.radioGroup`, `.option`, `.radio`, `.radioIndicator`, `.resolvedNote`. `ThemeRadioGroup` will import from that same CSS module — no new stylesheet needed.

- [ ] **Step 1: Write the failing tests**

Create `src/components/ThemePopover/ThemeRadioGroup.test.tsx`:

```tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test } from "vitest";
import { ThemeRadioGroup } from "./ThemeRadioGroup";

function renderGroup(
  overrides: Partial<React.ComponentProps<typeof ThemeRadioGroup>> = {},
): ReturnType<typeof render> {
  return render(
    <ThemeRadioGroup theme="auto" resolvedTheme="light" onValueChange={vi.fn()} {...overrides} />,
  );
}

test("renders three radio options", () => {
  renderGroup();
  expect(screen.getByRole("radio", { name: /Light/i })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: /Dark/i })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: /Auto/i })).toBeInTheDocument();
});

test("Auto radio is checked when theme is 'auto'", () => {
  renderGroup({ theme: "auto" });
  expect(screen.getByRole("radio", { name: /Auto/i })).toBeChecked();
});

test("Light radio is checked when theme is 'light'", () => {
  renderGroup({ theme: "light" });
  expect(screen.getByRole("radio", { name: /Light/i })).toBeChecked();
});

test("Dark radio is checked when theme is 'dark'", () => {
  renderGroup({ theme: "dark" });
  expect(screen.getByRole("radio", { name: /Dark/i })).toBeChecked();
});

test("shows 'Currently: Dark' when theme is auto and resolvedTheme is dark", () => {
  renderGroup({ theme: "auto", resolvedTheme: "dark" });
  expect(screen.getByText("Currently: Dark")).toBeInTheDocument();
});

test("shows 'Currently: Light' when theme is auto and resolvedTheme is light", () => {
  renderGroup({ theme: "auto", resolvedTheme: "light" });
  expect(screen.getByText("Currently: Light")).toBeInTheDocument();
});

test("does not show 'Currently' note when theme is explicit", () => {
  renderGroup({ theme: "dark" });
  expect(screen.queryByText(/Currently:/)).not.toBeInTheDocument();
});

test("onValueChange called with 'light' when Light radio clicked", async () => {
  const onValueChange = vi.fn<(v: string) => void>();
  const user = userEvent.setup();
  renderGroup({ theme: "dark", onValueChange });
  await user.click(screen.getByRole("radio", { name: /Light/i }));
  expect(onValueChange).toHaveBeenCalledWith("light");
});

test("onValueChange called with 'dark' when Dark radio clicked", async () => {
  const onValueChange = vi.fn<(v: string) => void>();
  const user = userEvent.setup();
  renderGroup({ onValueChange });
  await user.click(screen.getByRole("radio", { name: /Dark/i }));
  expect(onValueChange).toHaveBeenCalledWith("dark");
});

test("onValueChange called with 'auto' when Auto radio clicked", async () => {
  const onValueChange = vi.fn<(v: string) => void>();
  const user = userEvent.setup();
  renderGroup({ theme: "dark", onValueChange });
  await user.click(screen.getByRole("radio", { name: /Auto/i }));
  expect(onValueChange).toHaveBeenCalledWith("auto");
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/components/ThemePopover/ThemeRadioGroup.test.tsx 2>&1 | tail -10
```

Expected: all 10 tests fail with "Cannot find module './ThemeRadioGroup'".

- [ ] **Step 3: Create ThemeRadioGroup.tsx**

Create `src/components/ThemePopover/ThemeRadioGroup.tsx`:

```tsx
import React from "react";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Radio } from "@base-ui/react/radio";
import { Sun } from "../../ui/icons/Sun";
import { Moon } from "../../ui/icons/Moon";
import { Eclipse } from "../../ui/icons/Eclipse";
import type { ThemePreference } from "../../hooks/useTheme";
import styles from "./ThemePopover.module.css";

interface ThemeRadioGroupProps {
  theme: ThemePreference;
  resolvedTheme: "light" | "dark";
  onValueChange: (v: ThemePreference) => void;
}

export function ThemeRadioGroup({
  theme,
  resolvedTheme,
  onValueChange,
}: ThemeRadioGroupProps): React.JSX.Element {
  return (
    <fieldset className={styles.fieldset}>
      <legend className="sr-only">Theme</legend>
      <RadioGroup
        value={theme}
        onValueChange={(v) => onValueChange(v as ThemePreference)}
        className={styles.radioGroup}
      >
        <label className={styles.option}>
          <Radio.Root value="light" className={styles.radio}>
            <Radio.Indicator className={styles.radioIndicator} />
          </Radio.Root>
          <Sun size={14} aria-hidden="true" />
          <span>Light</span>
        </label>
        <label className={styles.option}>
          <Radio.Root value="dark" className={styles.radio}>
            <Radio.Indicator className={styles.radioIndicator} />
          </Radio.Root>
          <Moon size={14} aria-hidden="true" />
          <span>Dark</span>
        </label>
        <label className={styles.option}>
          <Radio.Root value="auto" className={styles.radio}>
            <Radio.Indicator className={styles.radioIndicator} />
          </Radio.Root>
          <Eclipse size={14} aria-hidden="true" />
          <span>Auto</span>
        </label>
      </RadioGroup>
      {theme === "auto" && (
        <p className={styles.resolvedNote} aria-hidden="true">
          Currently: {resolvedTheme === "dark" ? "Dark" : "Light"}
        </p>
      )}
    </fieldset>
  );
}
```

- [ ] **Step 4: Update ThemePopover.tsx to use ThemeRadioGroup**

Replace the full contents of `src/components/ThemePopover/ThemePopover.tsx`:

```tsx
import React from "react";
import { Popover } from "@base-ui/react/popover";
import { Button } from "../../ui/Button/Button";
import { Sun } from "../../ui/icons/Sun";
import { Moon } from "../../ui/icons/Moon";
import { Eclipse } from "../../ui/icons/Eclipse";
import { announce } from "../../lib/announce";
import type { ThemePreference } from "../../hooks/useTheme";
import { ThemeRadioGroup } from "./ThemeRadioGroup";
import styles from "./ThemePopover.module.css";

interface ThemePopoverProps {
  theme: ThemePreference;
  resolvedTheme: "light" | "dark";
  setTheme: (v: ThemePreference) => void;
}

function ThemeIcon({ preference }: { preference: ThemePreference }): React.JSX.Element {
  if (preference === "light") return <Sun size={16} aria-hidden="true" />;
  if (preference === "dark") return <Moon size={16} aria-hidden="true" />;
  return <Eclipse size={16} aria-hidden="true" />;
}

const LABELS: Record<ThemePreference, string> = {
  light: "Light",
  dark: "Dark",
  auto: "Auto",
};

export function ThemePopover({
  theme,
  resolvedTheme,
  setTheme,
}: ThemePopoverProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);

  function handleChange(v: ThemePreference): void {
    setTheme(v);
    announce(`Theme: ${LABELS[v]}`);
    setOpen(false);
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        render={<Button icon className={styles.trigger} />}
        aria-label={`Theme: ${LABELS[theme]}`}
      >
        <ThemeIcon preference={theme} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={4} className={styles.positioner}>
          <Popover.Popup className={styles.popup}>
            <ThemeRadioGroup
              theme={theme}
              resolvedTheme={resolvedTheme}
              onValueChange={handleChange}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
```

- [ ] **Step 5: Run all ThemePopover and ThemeRadioGroup tests**

```bash
npx vitest run src/components/ThemePopover/ 2>&1 | tail -15
```

Expected: all 27 tests pass (17 existing ThemePopover + 10 new ThemeRadioGroup).

- [ ] **Step 6: Run full test suite**

```bash
npm test -- --run 2>&1 | tail -8
```

Expected: 948 tests pass (938 baseline + 10 new).

- [ ] **Step 7: Commit**

```bash
git add src/components/ThemePopover/ThemeRadioGroup.tsx src/components/ThemePopover/ThemeRadioGroup.test.tsx src/components/ThemePopover/ThemePopover.tsx
git commit -m "refactor: extract ThemeRadioGroup from ThemePopover for reuse"
```

---

## Task 2: Create MobileNav (TDD)

**Files:**
- Create: `src/components/MobileNav/MobileNav.test.tsx`
- Create: `src/components/MobileNav/MobileNav.module.css`
- Create: `src/components/MobileNav/MobileNav.tsx`

### Background

`MobileNav` uses TanStack Router's `Link`, so tests need a router context. Use `renderRoute` from `src/test/renderRoute` — the same helper used in `__root.test.tsx`. This renders the full app shell, which includes `MobileNav` once it's wired in Task 3. For Task 2 tests, we write them first (they will fail because MobileNav isn't in the shell yet), then implement the component, and wire it up in Task 3.

**Wait — there's a sequencing issue:** `MobileNav.test.tsx` uses `renderRoute` which renders the full app. But `MobileNav` won't be in the shell until Task 3. So tests written against `renderRoute` can't test `MobileNav` in isolation.

**Solution:** Test `MobileNav` as a standalone component using a minimal TanStack Router wrapper. This avoids the full app shell and lets us unit-test in Task 2 without needing Task 3's wiring.

- [ ] **Step 1: Write the failing tests**

```bash
mkdir -p src/components/MobileNav
```

Create `src/components/MobileNav/MobileNav.test.tsx`:

```tsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test, beforeEach } from "vitest";
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
  createMemoryHistory,
} from "@tanstack/react-router";
import { MobileNav } from "./MobileNav";
import { __reset } from "../../lib/announce";

function setupLiveRegions(): () => void {
  const polite = document.createElement("div");
  polite.id = "live-polite";
  document.body.appendChild(polite);
  return () => polite.remove();
}

interface MobileNavProps {
  theme: "light" | "dark" | "auto";
  resolvedTheme: "light" | "dark";
  setTheme: (v: "light" | "dark" | "auto") => void;
}

function renderNav(overrides: Partial<MobileNavProps> = {}): ReturnType<typeof render> {
  const props: MobileNavProps = {
    theme: "auto",
    resolvedTheme: "light",
    setTheme: vi.fn(),
    ...overrides,
  };
  const rootRoute = createRootRoute({ component: () => <MobileNav {...props} /> });
  const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/" });
  const changelogRoute = createRoute({ getParentRoute: () => rootRoute, path: "/changelog" });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, changelogRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(<RouterProvider router={router} />);
}

beforeEach(() => {
  __reset();
});

test("renders a button with aria-label 'Navigation'", () => {
  renderNav();
  expect(screen.getByRole("button", { name: "Navigation" })).toBeInTheDocument();
});

test("popover is closed by default", () => {
  renderNav();
  expect(screen.queryByRole("radio", { name: /Dark/i })).not.toBeInTheDocument();
});

test("clicking the button opens the popover", async () => {
  const user = userEvent.setup();
  renderNav();
  await user.click(screen.getByRole("button", { name: "Navigation" }));
  expect(screen.getByRole("link", { name: "Search" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Changelog" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: /Light/i })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: /Dark/i })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: /Auto/i })).toBeInTheDocument();
});

test("clicking the Search link closes the popover", async () => {
  const user = userEvent.setup();
  renderNav();
  await user.click(screen.getByRole("button", { name: "Navigation" }));
  expect(screen.getByRole("radio", { name: /Dark/i })).toBeInTheDocument();
  await user.click(screen.getByRole("link", { name: "Search" }));
  expect(screen.queryByRole("radio", { name: /Dark/i })).not.toBeInTheDocument();
});

test("clicking the Changelog link closes the popover", async () => {
  const user = userEvent.setup();
  renderNav();
  await user.click(screen.getByRole("button", { name: "Navigation" }));
  expect(screen.getByRole("radio", { name: /Dark/i })).toBeInTheDocument();
  await user.click(screen.getByRole("link", { name: "Changelog" }));
  expect(screen.queryByRole("radio", { name: /Dark/i })).not.toBeInTheDocument();
});

test("clicking a radio option does NOT close the popover", async () => {
  const user = userEvent.setup();
  renderNav();
  await user.click(screen.getByRole("button", { name: "Navigation" }));
  await user.click(screen.getByRole("radio", { name: /Dark/i }));
  expect(screen.getByRole("radio", { name: /Light/i })).toBeInTheDocument();
});

test("clicking Dark radio calls setTheme with 'dark'", async () => {
  const user = userEvent.setup();
  const setTheme = vi.fn<(v: string) => void>();
  renderNav({ setTheme });
  await user.click(screen.getByRole("button", { name: "Navigation" }));
  await user.click(screen.getByRole("radio", { name: /Dark/i }));
  expect(setTheme).toHaveBeenCalledWith("dark");
});

test("clicking Light radio calls setTheme with 'light'", async () => {
  const user = userEvent.setup();
  const setTheme = vi.fn<(v: string) => void>();
  renderNav({ theme: "dark", setTheme });
  await user.click(screen.getByRole("button", { name: "Navigation" }));
  await user.click(screen.getByRole("radio", { name: /Light/i }));
  expect(setTheme).toHaveBeenCalledWith("light");
});

test("clicking Auto radio calls setTheme with 'auto'", async () => {
  const user = userEvent.setup();
  const setTheme = vi.fn<(v: string) => void>();
  renderNav({ theme: "dark", setTheme });
  await user.click(screen.getByRole("button", { name: "Navigation" }));
  await user.click(screen.getByRole("radio", { name: /Auto/i }));
  expect(setTheme).toHaveBeenCalledWith("auto");
});

test("announces 'Theme: Dark' when Dark radio clicked", async () => {
  const cleanup = setupLiveRegions();
  const user = userEvent.setup();
  renderNav();
  await user.click(screen.getByRole("button", { name: "Navigation" }));
  await user.click(screen.getByRole("radio", { name: /Dark/i }));
  await waitFor(() => {
    expect(document.getElementById("live-polite")?.textContent).toBe("Theme: Dark");
  });
  cleanup();
});

test("announces 'Theme: Light' when Light radio clicked", async () => {
  const cleanup = setupLiveRegions();
  const user = userEvent.setup();
  renderNav({ theme: "dark" });
  await user.click(screen.getByRole("button", { name: "Navigation" }));
  await user.click(screen.getByRole("radio", { name: /Light/i }));
  await waitFor(() => {
    expect(document.getElementById("live-polite")?.textContent).toBe("Theme: Light");
  });
  cleanup();
});

test("announces 'Theme: Auto' when Auto radio clicked", async () => {
  const cleanup = setupLiveRegions();
  const user = userEvent.setup();
  renderNav({ theme: "dark" });
  await user.click(screen.getByRole("button", { name: "Navigation" }));
  await user.click(screen.getByRole("radio", { name: /Auto/i }));
  await waitFor(() => {
    expect(document.getElementById("live-polite")?.textContent).toBe("Theme: Auto");
  });
  cleanup();
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/components/MobileNav/MobileNav.test.tsx 2>&1 | tail -10
```

Expected: all 11 tests fail with "Cannot find module './MobileNav'".

- [ ] **Step 3: Create MobileNav.module.css**

Create `src/components/MobileNav/MobileNav.module.css`:

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

- [ ] **Step 4: Create MobileNav.tsx**

Create `src/components/MobileNav/MobileNav.tsx`:

```tsx
import React from "react";
import { Menu } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Popover } from "@base-ui/react/popover";
import { Button } from "../../ui/Button/Button";
import { ThemeRadioGroup } from "../ThemePopover/ThemeRadioGroup";
import { announce } from "../../lib/announce";
import type { ThemePreference } from "../../hooks/useTheme";
import styles from "./MobileNav.module.css";

interface MobileNavProps {
  theme: ThemePreference;
  resolvedTheme: "light" | "dark";
  setTheme: (v: ThemePreference) => void;
}

const LABELS: Record<ThemePreference, string> = {
  light: "Light",
  dark: "Dark",
  auto: "Auto",
};

export function MobileNav({ theme, resolvedTheme, setTheme }: MobileNavProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);

  function handleThemeChange(v: ThemePreference): void {
    setTheme(v);
    announce(`Theme: ${LABELS[v]}`);
    // Intentionally does not close — user may still want to navigate
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        render={<Button icon className={styles.trigger} />}
        aria-label="Navigation"
      >
        <Menu size={20} aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="end" sideOffset={4} className={styles.positioner}>
          <Popover.Popup className={styles.popup}>
            <Link
              to="/"
              className={styles.link}
              activeOptions={{ exact: true, includeSearch: false }}
              onClick={() => setOpen(false)}
            >
              Search
            </Link>
            <Link
              to="/changelog"
              className={styles.link}
              search={{
                open: [],
                eventType: undefined,
                days: undefined,
                timeStart: undefined,
                timeEnd: undefined,
              }}
              activeOptions={{ includeSearch: false }}
              onClick={() => setOpen(false)}
            >
              Changelog
            </Link>
            <hr className={styles.divider} />
            <ThemeRadioGroup
              theme={theme}
              resolvedTheme={resolvedTheme}
              onValueChange={handleThemeChange}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
```

- [ ] **Step 5: Run MobileNav tests**

```bash
npx vitest run src/components/MobileNav/MobileNav.test.tsx 2>&1 | tail -15
```

Expected: all 11 tests pass. If any fail, investigate before continuing.

- [ ] **Step 6: Run full test suite**

```bash
npm test -- --run 2>&1 | tail -8
```

Expected: 959 tests pass (948 from Task 1 + 11 new).

- [ ] **Step 7: Commit**

```bash
git add src/components/MobileNav/MobileNav.tsx src/components/MobileNav/MobileNav.module.css src/components/MobileNav/MobileNav.test.tsx
git commit -m "feat: add MobileNav component with hamburger popover"
```

---

## Task 3: Wire up AppShell

**Files:**
- Modify: `src/routes/__root.test.tsx`
- Modify: `src/routes/__root.tsx`
- Modify: `src/routes/__root.module.css`

### Background

`__root.tsx` renders `AppShell`, which contains the header and `<nav>`. We add `MobileNav` as a sibling `<div>` after `<nav>`. CSS in `__root.module.css` hides `.nav` and shows `.mobileNav` at ≤60rem. The `MobileNav` receives the same `{ theme, resolvedTheme, setTheme }` already destructured from `useTheme()`.

- [ ] **Step 1: Write the failing test**

In `src/routes/__root.test.tsx`, add at the end of the file (before the last line):

```ts
test("hamburger button is present in the nav", async () => {
  await renderRoute("/");
  expect(screen.getByRole("button", { name: "Navigation" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to confirm it fails**

```bash
npx vitest run src/routes/__root.test.tsx 2>&1 | tail -10
```

Expected: the new test fails with "Unable to find an accessible element with the role 'button' and name 'Navigation'".

- [ ] **Step 3: Update __root.tsx**

Replace the full contents of `src/routes/__root.tsx`:

```tsx
import { useEffect } from "react";
import { createRootRouteWithContext, Link, Outlet, useRouterState } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { PostHogProvider, usePostHog } from "posthog-js/react";
import { Meeple3D } from "../ui/icons/Meeple3D";
import { useTheme } from "../hooks/useTheme";
import { ThemePopover } from "../components/ThemePopover/ThemePopover";
import { MobileNav } from "../components/MobileNav/MobileNav";
import indexStyles from "./index.module.css";
import rootStyles from "./__root.module.css";

const POSTHOG_TOKEN = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN as string | undefined;

function PageViewTracker(): null {
  const posthog = usePostHog();
  const { location } = useRouterState();

  useEffect(() => {
    posthog.capture("$pageview");
  }, [location.href, posthog]);

  return null;
}

function AppShell(): React.JSX.Element {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div className={indexStyles.page}>
      {POSTHOG_TOKEN && <PageViewTracker />}
      <header role="banner" className={indexStyles.header}>
        <Link to="/" className={rootStyles.brandingTitle}>
          <Meeple3D size={32} aria-hidden="true" />
          Gen Con Buddy
        </Link>
        <p className={rootStyles.tagline}>your guide to the best four days in gaming</p>
        <nav className={rootStyles.nav}>
          <Link to="/" activeOptions={{ exact: true, includeSearch: false }}>
            Search
          </Link>
          <Link
            to="/changelog"
            search={{
              open: [],
              eventType: undefined,
              days: undefined,
              timeStart: undefined,
              timeEnd: undefined,
            }}
            activeOptions={{ includeSearch: false }}
          >
            Changelog
          </Link>
          <ThemePopover theme={theme} resolvedTheme={resolvedTheme} setTheme={setTheme} />
        </nav>
        <div className={rootStyles.mobileNav}>
          <MobileNav theme={theme} resolvedTheme={resolvedTheme} setTheme={setTheme} />
        </div>
      </header>
      <Outlet />
      <footer className={rootStyles.footer}>
        <Link to="/about" className={rootStyles.footerLink}>
          About
        </Link>
      </footer>
    </div>
  );
}

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: (): React.JSX.Element =>
    POSTHOG_TOKEN ? (
      <PostHogProvider
        apiKey={POSTHOG_TOKEN}
        options={{
          api_host: "/ingest",
          ui_host: (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string) || "https://us.posthog.com",
          defaults: "2026-01-30",
          capture_exceptions: true,
          debug: import.meta.env.DEV,
        }}
      >
        <AppShell />
      </PostHogProvider>
    ) : (
      <AppShell />
    ),
});
```

- [ ] **Step 4: Update __root.module.css**

In `src/routes/__root.module.css`, add `.mobileNav` before the existing `@media` block, and add the responsive overrides inside the existing `@media (width <= 60rem)` block.

The file currently ends with:

```css
@media (width <= 60rem) {
  .tagline {
    display: none;
  }
}
```

Replace that entire block with:

```css
/* ─── Mobile nav wrapper (hidden on desktop) ─────────────────────────────── */
.mobileNav {
  display: none;
}

@media (width <= 60rem) {
  .tagline {
    display: none;
  }

  .nav {
    display: none;
  }

  .mobileNav {
    display: flex;
    margin-left: auto;
  }
}
```

- [ ] **Step 5: Run the __root tests**

```bash
npx vitest run src/routes/__root.test.tsx 2>&1 | tail -10
```

Expected: all 8 tests pass including the new one.

- [ ] **Step 6: Run full test suite**

```bash
npm test -- --run 2>&1 | tail -8
```

Expected: 960 tests pass (959 from Task 2 + 1 new).

- [ ] **Step 7: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: exits 0, no TypeScript or CSS errors.

- [ ] **Step 8: Commit**

```bash
git add src/routes/__root.tsx src/routes/__root.module.css src/routes/__root.test.tsx
git commit -m "feat: wire MobileNav into AppShell, hide desktop nav on mobile"
```

---

## Self-Review

**Spec coverage check:**

- [x] `ThemeRadioGroup` extracted from `ThemePopover` → Task 1
- [x] `ThemeRadioGroup.test.tsx` with 10 tests → Task 1
- [x] `ThemePopover.tsx` delegates to `ThemeRadioGroup` → Task 1
- [x] `MobileNav` with `@base-ui/react` Popover, hamburger trigger → Task 2
- [x] Nav links close popover on click → Task 2
- [x] Theme selection does NOT close popover → Task 2
- [x] `announce()` fires on theme selection → Task 2
- [x] `MobileNav.module.css` with all spec classes → Task 2
- [x] `MobileNav` wired into `AppShell` → Task 3
- [x] `__root.module.css` hides `.nav` / shows `.mobileNav` at ≤60rem → Task 3
- [x] `margin-left: auto` on `.mobileNav` at mobile breakpoint → Task 3
- [x] Changelog link carries required `search` params → Task 2 (MobileNav.tsx)
- [x] Breakpoint `60rem` consistent with codebase → Task 3

**Type consistency check:**

- `ThemeRadioGroup` prop `onValueChange: (v: ThemePreference) => void` — matches call sites in `ThemePopover.tsx` and `MobileNav.tsx`
- `MobileNavProps` shape matches what `AppShell` passes: `{ theme, resolvedTheme, setTheme }` from `useTheme()`
- `LABELS` map duplicated in `ThemePopover.tsx` and `MobileNav.tsx` — intentional, each component owns its own announce message, no shared dependency needed
