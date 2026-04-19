# Pixel Art Board Game Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the full Parchment & Pixel visual redesign — design tokens, CSS Modules, TanStack Table migration, and restructured HTML — to every component in the app.

**Architecture:** Global design tokens in `src/index.css` (colors, spacing, shadows, motion, z-index); per-component CSS Modules for layout and local styles; `clsx` for composing global `.btn-*` classes with module classes; TanStack Table (headless) replaces the hand-rolled `<table>` in SearchResults while keeping all existing sort/pagination/visibility behavior intact.

**Tech Stack:** React 18, TanStack Router, React Query, TanStack Table, CSS Modules (Vite built-in), clsx, Press Start 2P + Courier Prime (Google Fonts)

**Spec:** `docs/superpowers/specs/2026-04-19-pixel-art-design.md`

---

## File Map

| File                                                    | Action                                                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `index.html`                                            | Add Google Fonts `<link>`                                                                         |
| `src/index.css`                                         | Complete rewrite — design tokens + global resets + `.btn-primary` / `.btn-secondary`              |
| `src/routes/__root.tsx`                                 | Add `<header>` bar with app title                                                                 |
| `src/routes/index.tsx`                                  | Wrap content in two-column grid shell                                                             |
| `src/routes/index.module.css`                           | New — page grid, header styles                                                                    |
| `src/components/SearchForm/SearchForm.tsx`              | Restructure: `<details>` → `<fieldset>` groups; day checkbox `<span>` wrappers; `clsx` on buttons |
| `src/components/SearchForm/SearchForm.module.css`       | New — sidebar panel, labels, inputs, fieldsets, sticky button bar                                 |
| `src/components/SearchResults/SearchResults.tsx`        | Migrate to TanStack Table; update loading/empty/error state text                                  |
| `src/components/SearchResults/SearchResults.module.css` | New — table, states, column visibility panel                                                      |
| `src/components/Pagination/Pagination.tsx`              | Add event count + per-page summary row; ensure `aria-current="page"` present                      |
| `src/components/Pagination/Pagination.module.css`       | New — pagination bar styles                                                                       |
| `src/components/EventDetail/EventDetail.tsx`            | Restructure: four `<section>` groups, stacked `<dl>`, boolean `✓`/`—`, update state text          |
| `src/components/EventDetail/EventDetail.module.css`     | New — event card, section layout, two-column dl grid                                              |

---

## Task 1: Install dependencies

**Files:**

- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install clsx and @tanstack/react-table**

```bash
npm install clsx @tanstack/react-table
```

Expected output: both packages appear in `package.json` `dependencies`.

- [ ] **Step 2: Verify TypeScript can see the types**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors about missing types (both packages ship their own types).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add clsx and @tanstack/react-table dependencies"
```

---

## Task 2: Design tokens + Google Fonts

**Files:**

- Modify: `index.html`
- Modify: `src/index.css`

No behavioral tests — purely visual infrastructure.

- [ ] **Step 1: Add Google Fonts to `index.html`**

Replace the `<head>` in `index.html` with:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Gen Con Buddy</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Press+Start+2P&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <div
      id="live-polite"
      aria-live="polite"
      aria-atomic="true"
      class="sr-only"
    ></div>
    <div
      id="live-assertive"
      aria-live="assertive"
      aria-atomic="true"
      class="sr-only"
    ></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Rewrite `src/index.css` with full token system**

Replace the entire contents of `src/index.css`:

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
/* Visual identity only. Layout (width, position, margin) belongs in modules. */
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

- [ ] **Step 3: Run tests to confirm nothing breaks**

```bash
npm test
```

Expected: all tests pass (no behavioral changes in this task).

- [ ] **Step 4: Commit**

```bash
git add index.html src/index.css
git commit -m "feat: add design tokens, Google Fonts, and grain texture"
```

---

## Task 3: Page shell — header bar + two-column grid

**Files:**

- Modify: `src/routes/__root.tsx`
- Modify: `src/routes/index.tsx`
- Create: `src/routes/index.module.css`

- [ ] **Step 1: Write a failing test for the header landmark**

Add to `src/routes/index.test.tsx` (inside the existing file, after the last test):

```tsx
test("renders a banner landmark with the app title", async () => {
  await renderSearchPage("/");
  expect(screen.getByRole("banner")).toBeInTheDocument();
  expect(screen.getByRole("banner")).toHaveTextContent("GEN CON BUDDY");
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- --reporter=verbose src/routes/index.test.tsx
```

Expected: FAIL — "Unable to find role='banner'"

- [ ] **Step 3: Update `__root.tsx` to add the header**

```tsx
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <>
      <header role="banner">
        <span>GEN CON BUDDY</span>
      </header>
      <Outlet />
    </>
  ),
});
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm test -- --reporter=verbose src/routes/index.test.tsx
```

Expected: PASS

- [ ] **Step 5: Create `src/routes/index.module.css`**

```css
.shell {
  display: grid;
  grid-template-columns: var(--size-sidebar) 1fr;
  grid-template-rows: 1fr;
  height: calc(100vh - 60px); /* subtract header height */
}

.sidebar {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 3px solid var(--color-bark);
  box-shadow: var(--shadow-panel), var(--shadow-panel-inset);
  background: var(--color-parchment-light);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
}

.results {
  overflow: auto;
  padding: var(--space-3);
}

.header {
  background: var(--color-bark);
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 4px,
    rgba(0, 0, 0, 0.04) 4px,
    rgba(0, 0, 0, 0.04) 5px
  );
  grid-column: 1 / -1;
  padding: var(--space-3) var(--space-4);
  z-index: var(--z-header);
}

.headerTitle {
  font-family: var(--font-pixel);
  font-size: var(--text-display);
  color: var(--color-gold);
  letter-spacing: 0.15em;
  margin: 0;
}
```

- [ ] **Step 6: Update `src/routes/__root.tsx` to use module styles**

```tsx
import { createRootRoute, Outlet } from "@tanstack/react-router";
import styles from "./index.module.css";

export const Route = createRootRoute({
  component: () => (
    <>
      <header role="banner" className={styles.header}>
        <p className={styles.headerTitle}>GEN CON BUDDY</p>
      </header>
      <Outlet />
    </>
  ),
});
```

- [ ] **Step 7: Update `src/routes/index.tsx` to add grid shell**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { SearchForm } from "../components/SearchForm/SearchForm";
import { SearchResults } from "../components/SearchResults/SearchResults";
import { buildSearchParams, parseSearchParams } from "../utils/searchParams";
import type { SearchFormValues, SearchParams } from "../utils/types";
import styles from "./index.module.css";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    const str = (k: string) =>
      typeof search[k] === "string" ? (search[k] as string) : undefined;
    const num = (k: string) =>
      typeof search[k] === "number" ? (search[k] as number) : undefined;
    return {
      limit: num("limit"),
      page: num("page"),
      filter: str("filter"),
      gameId: str("gameId"),
      title: str("title"),
      eventType: str("eventType"),
      group: str("group"),
      shortDescription: str("shortDescription"),
      longDescription: str("longDescription"),
      gameSystem: str("gameSystem"),
      rulesEdition: str("rulesEdition"),
      minPlayers: str("minPlayers"),
      maxPlayers: str("maxPlayers"),
      ageRequired: str("ageRequired"),
      experienceRequired: str("experienceRequired"),
      materialsProvided: str("materialsProvided"),
      startDateTime: str("startDateTime"),
      duration: str("duration"),
      endDateTime: str("endDateTime"),
      gmNames: str("gmNames"),
      website: str("website"),
      email: str("email"),
      tournament: str("tournament"),
      roundNumber: str("roundNumber"),
      totalRounds: str("totalRounds"),
      minimumPlayTime: str("minimumPlayTime"),
      attendeeRegistration: str("attendeeRegistration"),
      cost: str("cost"),
      location: str("location"),
      roomName: str("roomName"),
      tableNumber: str("tableNumber"),
      specialCategory: str("specialCategory"),
      ticketsAvailable: str("ticketsAvailable"),
      lastModified: str("lastModified"),
      days: str("days"),
      sort: str("sort"),
    };
  },
  component: SearchPage,
});

function SearchPage() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  const handleSearch = (values: SearchFormValues) => {
    void navigate({
      search: (prev) => ({ ...buildSearchParams(values), limit: prev.limit }),
    });
  };

  const handleNavigate = (page: number, limit: number) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        page: page === 1 ? undefined : page,
        limit: limit === 100 ? undefined : limit,
      }),
    });
  };

  const handleSort = (sort: string | undefined) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        sort,
        page: undefined,
      }),
    });
  };

  return (
    <main className={styles.shell}>
      <div className={styles.sidebar}>
        <SearchForm
          key={JSON.stringify(search)}
          defaultValues={parseSearchParams(search)}
          onSearch={handleSearch}
        />
      </div>
      <div className={styles.results}>
        <SearchResults
          searchParams={search}
          onNavigate={handleNavigate}
          onSort={handleSort}
        />
      </div>
    </main>
  );
}
```

- [ ] **Step 8: Run all tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/routes/__root.tsx src/routes/index.tsx src/routes/index.module.css
git commit -m "feat: add header bar and two-column sidebar grid shell"
```

---

## Task 4: SearchForm — fieldset groups + CSS module

**Files:**

- Modify: `src/components/SearchForm/SearchForm.tsx`
- Create: `src/components/SearchForm/SearchForm.module.css`

- [ ] **Step 1: Write failing tests for fieldset structure**

Add to the bottom of `src/routes/index.test.tsx`:

```tsx
test("renders SEARCH fieldset in search form", async () => {
  await renderSearchPage("/");
  expect(screen.getByRole("group", { name: "SEARCH" })).toBeInTheDocument();
});

test("renders DAYS fieldset in search form", async () => {
  await renderSearchPage("/");
  expect(screen.getByRole("group", { name: "DAYS" })).toBeInTheDocument();
});

test("day checkboxes have span wrappers (CSS toggle tiles require them)", async () => {
  await renderSearchPage("/");
  const wedLabel = screen
    .getByRole("checkbox", { name: "Wed" })
    .closest("label");
  expect(wedLabel?.querySelector("span")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --reporter=verbose src/routes/index.test.tsx
```

Expected: FAIL — no group named "SEARCH", no group named "DAYS", no span in day label

- [ ] **Step 3: Rewrite `SearchForm.tsx`**

```tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import clsx from "clsx";
import {
  AGE_GROUPS,
  CATEGORY,
  EVENT_TYPES,
  EXP,
  REGISTRATION,
} from "../../utils/enums";
import type { SearchFormValues } from "../../utils/types";
import styles from "./SearchForm.module.css";

const EMPTY_VALUES: SearchFormValues = {
  filter: "",
  gameId: "",
  title: "",
  eventType: "",
  group: "",
  shortDescription: "",
  longDescription: "",
  gameSystem: "",
  rulesEdition: "",
  minPlayersMin: "",
  minPlayersMax: "",
  maxPlayersMin: "",
  maxPlayersMax: "",
  ageRequired: "",
  experienceRequired: "",
  materialsProvided: "",
  materialsRequired: "",
  materialsRequiredDetails: "",
  startDateTimeStart: "",
  startDateTimeEnd: "",
  durationMin: "",
  durationMax: "",
  endDateTimeStart: "",
  endDateTimeEnd: "",
  gmNames: "",
  website: "",
  email: "",
  tournament: "",
  roundNumberMin: "",
  roundNumberMax: "",
  totalRoundsMin: "",
  totalRoundsMax: "",
  minimumPlayTimeMin: "",
  minimumPlayTimeMax: "",
  attendeeRegistration: "",
  costMin: "",
  costMax: "",
  location: "",
  roomName: "",
  tableNumber: "",
  specialCategory: "",
  ticketsAvailableMin: "",
  ticketsAvailableMax: "",
  lastModifiedStart: "",
  lastModifiedEnd: "",
  days: "",
};

const DAY_KEYS = ["wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABELS: Record<string, string> = {
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

function Toggletip({ label, message }: { label: string; message: string }) {
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
    <span className={styles.toggletipWrapper}>
      <button
        type="button"
        aria-label={label}
        className={styles.toggletipButton}
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

interface SearchFormProps {
  defaultValues: SearchFormValues;
  onSearch: (values: SearchFormValues) => void;
}

export function SearchForm({ defaultValues, onSearch }: SearchFormProps) {
  const { register, handleSubmit, reset, watch, setValue } =
    useForm<SearchFormValues>({ defaultValues });

  const days = watch("days") ?? "";
  const selectedDays = new Set(days ? days.split(",") : []);

  const startDateTimeStart = watch("startDateTimeStart") ?? "";
  const startDateTimeEnd = watch("startDateTimeEnd") ?? "";
  const startDateActive = !!(startDateTimeStart || startDateTimeEnd);
  const daysActive = selectedDays.size > 0;
  const daysDisabled = startDateActive;
  const startDateDisabled = daysActive;

  const handleDayChange = (key: string, checked: boolean) => {
    const next = new Set(selectedDays);
    if (checked) {
      next.add(key);
    } else {
      next.delete(key);
    }
    setValue("days", DAY_KEYS.filter((d) => next.has(d)).join(","));
  };

  return (
    <form onSubmit={handleSubmit(onSearch)} className={styles.form}>
      <div className={styles.filterScroll}>
        {/* SEARCH */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>SEARCH</legend>
          <label className={styles.label}>
            Search
            <input
              type="text"
              className={styles.input}
              {...register("filter")}
            />
          </label>
          <label className={styles.label}>
            Event Type
            <select className={styles.select} {...register("eventType")}>
              <option value="">Any</option>
              {Object.entries(EVENT_TYPES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </fieldset>

        {/* DAYS */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>DAYS</legend>
          {daysDisabled && (
            <Toggletip
              label="Why are day filters disabled?"
              message="Clear the Start Date fields in Time filters to use day checkboxes."
            />
          )}
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
        </fieldset>

        {/* TIME */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>TIME</legend>
          <div className={styles.rangeGroup}>
            Start Date:
            {startDateDisabled && (
              <Toggletip
                label="Why are Start Date fields disabled?"
                message="Clear the day checkboxes above to use custom Start Date fields."
              />
            )}
            <label className={styles.label}>
              from
              <input
                type="datetime-local"
                className={styles.input}
                disabled={startDateDisabled}
                {...register("startDateTimeStart")}
              />
            </label>
            <label className={styles.label}>
              to
              <input
                type="datetime-local"
                className={styles.input}
                disabled={startDateDisabled}
                {...register("startDateTimeEnd")}
              />
            </label>
          </div>
          <div className={styles.rangeGroup}>
            Duration (hours):
            <label className={styles.label}>
              from
              <input
                type="number"
                min="0"
                step="0.5"
                className={styles.input}
                {...register("durationMin")}
              />
            </label>
            <label className={styles.label}>
              to
              <input
                type="number"
                min="0"
                step="0.5"
                className={styles.input}
                {...register("durationMax")}
              />
            </label>
          </div>
          <div className={styles.rangeGroup}>
            End Date:
            {startDateDisabled && (
              <Toggletip
                label="Why are End Date fields disabled?"
                message="Clear the day checkboxes above to use custom End Date fields."
              />
            )}
            <label className={styles.label}>
              from
              <input
                type="datetime-local"
                className={styles.input}
                disabled={startDateDisabled}
                {...register("endDateTimeStart")}
              />
            </label>
            <label className={styles.label}>
              to
              <input
                type="datetime-local"
                className={styles.input}
                disabled={startDateDisabled}
                {...register("endDateTimeEnd")}
              />
            </label>
          </div>
        </fieldset>

        {/* PLAYERS */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>PLAYERS</legend>
          <div className={styles.rangeGroup}>
            Min Players:
            <label className={styles.label}>
              from{" "}
              <input
                type="number"
                min="0"
                className={styles.input}
                {...register("minPlayersMin")}
              />
            </label>
            <label className={styles.label}>
              to{" "}
              <input
                type="number"
                min="0"
                className={styles.input}
                {...register("minPlayersMax")}
              />
            </label>
          </div>
          <div className={styles.rangeGroup}>
            Max Players:
            <label className={styles.label}>
              from{" "}
              <input
                type="number"
                min="0"
                className={styles.input}
                {...register("maxPlayersMin")}
              />
            </label>
            <label className={styles.label}>
              to{" "}
              <input
                type="number"
                min="0"
                className={styles.input}
                {...register("maxPlayersMax")}
              />
            </label>
          </div>
          <label className={styles.label}>
            Age Required
            <select className={styles.select} {...register("ageRequired")}>
              <option value="">Any</option>
              {Object.entries(AGE_GROUPS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.label}>
            Experience Required
            <select
              className={styles.select}
              {...register("experienceRequired")}
            >
              <option value="">Any</option>
              {Object.entries(EXP).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </fieldset>

        {/* LOGISTICS */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>LOGISTICS</legend>
          <label className={styles.label}>
            Location{" "}
            <input
              type="text"
              className={styles.input}
              {...register("location")}
            />
          </label>
          <label className={styles.label}>
            Room Name{" "}
            <input
              type="text"
              className={styles.input}
              {...register("roomName")}
            />
          </label>
          <label className={styles.label}>
            Table{" "}
            <input
              type="text"
              className={styles.input}
              {...register("tableNumber")}
            />
          </label>
          <div className={styles.rangeGroup}>
            Cost:
            <label className={styles.label}>
              from{" "}
              <input
                type="number"
                min="0"
                className={styles.input}
                {...register("costMin")}
              />
            </label>
            <label className={styles.label}>
              to{" "}
              <input
                type="number"
                min="0"
                className={styles.input}
                {...register("costMax")}
              />
            </label>
          </div>
          <div className={styles.rangeGroup}>
            Tickets Available:
            <label className={styles.label}>
              from{" "}
              <input
                type="number"
                min="0"
                className={styles.input}
                {...register("ticketsAvailableMin")}
              />
            </label>
            <label className={styles.label}>
              to{" "}
              <input
                type="number"
                min="0"
                className={styles.input}
                {...register("ticketsAvailableMax")}
              />
            </label>
          </div>
          <label className={styles.label}>
            Attendee Registration
            <select
              className={styles.select}
              {...register("attendeeRegistration")}
            >
              <option value="">Any</option>
              {Object.entries(REGISTRATION).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </fieldset>

        {/* DETAILS */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>DETAILS</legend>
          <label className={styles.label}>
            Game ID{" "}
            <input
              type="text"
              className={styles.input}
              {...register("gameId")}
            />
          </label>
          <label className={styles.label}>
            Title{" "}
            <input
              type="text"
              className={styles.input}
              {...register("title")}
            />
          </label>
          <label className={styles.label}>
            Group{" "}
            <input
              type="text"
              className={styles.input}
              {...register("group")}
            />
          </label>
          <label className={styles.label}>
            Short Description{" "}
            <input
              type="text"
              className={styles.input}
              {...register("shortDescription")}
            />
          </label>
          <label className={styles.label}>
            Long Description{" "}
            <input
              type="text"
              className={styles.input}
              {...register("longDescription")}
            />
          </label>
          <label className={styles.label}>
            Game System{" "}
            <input
              type="text"
              className={styles.input}
              {...register("gameSystem")}
            />
          </label>
          <label className={styles.label}>
            Rules Edition{" "}
            <input
              type="text"
              className={styles.input}
              {...register("rulesEdition")}
            />
          </label>
          <label className={styles.label}>
            Materials Provided{" "}
            <input
              type="text"
              className={styles.input}
              {...register("materialsProvided")}
            />
          </label>
          <label className={styles.label}>
            Materials Required{" "}
            <input
              type="text"
              className={styles.input}
              {...register("materialsRequired")}
            />
          </label>
          <label className={styles.label}>
            Materials Required Details{" "}
            <input
              type="text"
              className={styles.input}
              {...register("materialsRequiredDetails")}
            />
          </label>
          <label className={styles.label}>
            Game Masters{" "}
            <input
              type="text"
              className={styles.input}
              {...register("gmNames")}
            />
          </label>
          <label className={styles.label}>
            Website{" "}
            <input
              type="text"
              className={styles.input}
              {...register("website")}
            />
          </label>
          <label className={styles.label}>
            Email{" "}
            <input
              type="text"
              className={styles.input}
              {...register("email")}
            />
          </label>
          <label className={styles.label}>
            Tournament{" "}
            <input
              type="text"
              className={styles.input}
              {...register("tournament")}
            />
          </label>
          <div className={styles.rangeGroup}>
            Round Number:
            <label className={styles.label}>
              from{" "}
              <input
                type="number"
                min="0"
                className={styles.input}
                {...register("roundNumberMin")}
              />
            </label>
            <label className={styles.label}>
              to{" "}
              <input
                type="number"
                min="0"
                className={styles.input}
                {...register("roundNumberMax")}
              />
            </label>
          </div>
          <div className={styles.rangeGroup}>
            Total Rounds:
            <label className={styles.label}>
              from{" "}
              <input
                type="number"
                min="0"
                className={styles.input}
                {...register("totalRoundsMin")}
              />
            </label>
            <label className={styles.label}>
              to{" "}
              <input
                type="number"
                min="0"
                className={styles.input}
                {...register("totalRoundsMax")}
              />
            </label>
          </div>
          <div className={styles.rangeGroup}>
            Minimum Play Time:
            <label className={styles.label}>
              from{" "}
              <input
                type="number"
                min="0"
                className={styles.input}
                {...register("minimumPlayTimeMin")}
              />
            </label>
            <label className={styles.label}>
              to{" "}
              <input
                type="number"
                min="0"
                className={styles.input}
                {...register("minimumPlayTimeMax")}
              />
            </label>
          </div>
          <label className={styles.label}>
            Special Category
            <select className={styles.select} {...register("specialCategory")}>
              <option value="">Any</option>
              {Object.entries(CATEGORY).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.rangeGroup}>
            Last Modified:
            <label className={styles.label}>
              from{" "}
              <input
                type="datetime-local"
                className={styles.input}
                {...register("lastModifiedStart")}
              />
            </label>
            <label className={styles.label}>
              to{" "}
              <input
                type="datetime-local"
                className={styles.input}
                {...register("lastModifiedEnd")}
              />
            </label>
          </div>
        </fieldset>
      </div>
      {/* end filterScroll */}

      <div className={styles.buttonBar}>
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
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Create `SearchForm.module.css`**

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
  border: 1px solid var(--color-bark-light);
  margin: 0 0 var(--space-3) 0;
  padding: var(--space-2) var(--space-3) var(--space-3);
}

.legend {
  font-family: var(--font-pixel);
  font-size: var(--text-heading);
  color: var(--color-bark);
  padding: 0 var(--space-2);
}

.label {
  display: block;
  font-family: var(--font-pixel);
  font-size: var(--text-label);
  color: var(--color-bark);
  margin-bottom: var(--space-3);
  line-height: 1.8;
}

.input,
.select {
  display: block;
  width: 100%;
  background: var(--color-parchment);
  border: 2px solid var(--color-bark);
  border-radius: 0;
  font-family: var(--font-data);
  font-size: 1rem;
  padding: var(--space-1) var(--space-2);
  color: var(--color-ink);
  margin-top: var(--space-1);
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

/* Day toggle tiles */
.dayTiles {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.dayTile {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.dayCheckbox {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.dayTile span {
  display: inline-block;
  font-family: var(--font-pixel);
  font-size: var(--text-label);
  color: var(--color-bark);
  border: 2px solid var(--color-bark);
  padding: var(--space-1) var(--space-2);
  cursor: pointer;
  user-select: none;
}

.dayCheckbox:checked + span {
  background: var(--color-bark);
  color: var(--color-parchment);
}

.dayCheckbox:disabled + span {
  opacity: 0.5;
  cursor: not-allowed;
}

.dayCheckbox:focus-visible + span {
  outline: 2px solid var(--color-bark-dark);
  outline-offset: 2px;
}

/* Sticky action buttons */
.buttonBar {
  position: sticky;
  bottom: 0;
  background: var(--color-parchment-light);
  border-top: 2px solid var(--color-bark);
  padding: var(--space-3);
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.actionButton {
  width: 100%;
}

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

- [ ] **Step 5: Run all tests**

```bash
npm test
```

Expected: all tests pass. The "Search" button accessible name is preserved (text content is "▶ Search").

- [ ] **Step 6: Commit**

```bash
git add src/components/SearchForm/SearchForm.tsx src/components/SearchForm/SearchForm.module.css
git commit -m "feat: restructure SearchForm into fieldset groups with CSS module"
```

---

## Task 5: SearchResults — on-brand loading/empty/error states

**Files:**

- Modify: `src/components/SearchResults/SearchResults.tsx`
- Modify: `src/components/SearchResults/SearchResults.test.tsx`

- [ ] **Step 1: Update the loading state test**

In `SearchResults.test.tsx`, change the loading test:

```tsx
test("shows loading state while fetching", async () => {
  renderSearchResults();
  expect(await screen.findByText("LOADING QUESTS...")).toBeInTheDocument();
});
```

- [ ] **Step 2: Update the empty state test**

In `SearchResults.test.tsx`, change the empty state test:

```tsx
test("renders empty state when no events are returned", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [],
        meta: { total: 0 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderSearchResults();
  expect(await screen.findByText("NO QUESTS FOUND")).toBeInTheDocument();
});
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
npm test -- --reporter=verbose src/components/SearchResults/SearchResults.test.tsx
```

Expected: FAIL on "LOADING QUESTS..." and "NO QUESTS FOUND"

- [ ] **Step 4: Update state renders in `SearchResults.tsx`**

Find and replace the three state returns in `SearchResults.tsx`. The loading state (currently `<p>Loading...</p>`):

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

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npm test -- --reporter=verbose src/components/SearchResults/SearchResults.test.tsx
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/SearchResults/SearchResults.tsx src/components/SearchResults/SearchResults.test.tsx
git commit -m "feat: update SearchResults loading/empty/error states to pixel art style"
```

---

## Task 6: Migrate SearchResults to TanStack Table

**Files:**

- Modify: `src/components/SearchResults/SearchResults.tsx`

This task replaces the hand-rolled `<table>` with TanStack Table while preserving all existing sort/pagination/visibility behavior. All existing tests must pass after this task.

- [ ] **Step 1: Run the existing tests as a baseline**

```bash
npm test -- --reporter=verbose src/components/SearchResults/SearchResults.test.tsx
```

Expected: all tests pass.

- [ ] **Step 2: Replace `SearchResults.tsx` with TanStack Table implementation**

```tsx
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { useColumnVisibility } from "../../hooks/useColumnVisibility";
import { fetchEvents } from "../../utils/api";
import { Pagination } from "../Pagination/Pagination";
import { announce } from "../../lib/announce";
import type { SearchParams, Event } from "../../utils/types";
import styles from "./SearchResults.module.css";

// Extend TanStack Table's ColumnMeta to include our sortField
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    sortField?: string;
  }
}

interface SearchResultsProps {
  searchParams: SearchParams;
  onNavigate: (page: number, limit: number) => void;
  onSort: (sort: string | undefined) => void;
}

const COLUMNS: ColumnDef<Event>[] = [
  {
    id: "gameId",
    header: "Game ID",
    meta: { sortField: "gameId" },
    cell: ({ row }) => {
      const { gameId } = row.original.attributes;
      return (
        <Link to="/event/$id" params={{ id: gameId }}>
          {gameId}
        </Link>
      );
    },
  },
  {
    id: "title",
    header: "Title",
    meta: { sortField: "title" },
    cell: ({ row }) => {
      const { gameId, title } = row.original.attributes;
      return (
        <Link to="/event/$id" params={{ id: gameId }}>
          {title}
        </Link>
      );
    },
  },
  {
    id: "eventType",
    header: "Type",
    meta: { sortField: "eventType" },
    cell: ({ row }) => <>{row.original.attributes.eventType}</>,
  },
  {
    id: "group",
    header: "Group",
    meta: { sortField: "group" },
    cell: ({ row }) => <>{row.original.attributes.group}</>,
  },
  {
    id: "shortDescription",
    header: "Short Description",
    meta: { sortField: "shortDescription" },
    cell: ({ row }) => <>{row.original.attributes.shortDescription}</>,
  },
  {
    id: "longDescription",
    header: "Long Description",
    meta: { sortField: "longDescription" },
    cell: ({ row }) => <>{row.original.attributes.longDescription}</>,
  },
  {
    id: "gameSystem",
    header: "Game System",
    meta: { sortField: "gameSystem" },
    cell: ({ row }) => <>{row.original.attributes.gameSystem}</>,
  },
  {
    id: "rulesEdition",
    header: "Rules Edition",
    meta: { sortField: "rulesEdition" },
    cell: ({ row }) => <>{row.original.attributes.rulesEdition}</>,
  },
  {
    id: "minPlayers",
    header: "Min Players",
    meta: { sortField: "minPlayers" },
    cell: ({ row }) => <>{row.original.attributes.minPlayers}</>,
  },
  {
    id: "maxPlayers",
    header: "Max Players",
    meta: { sortField: "maxPlayers" },
    cell: ({ row }) => <>{row.original.attributes.maxPlayers}</>,
  },
  {
    id: "ageRequired",
    header: "Age Required",
    meta: { sortField: "ageRequired" },
    cell: ({ row }) => <>{row.original.attributes.ageRequired}</>,
  },
  {
    id: "experienceRequired",
    header: "Experience Required",
    meta: { sortField: "experienceRequired" },
    cell: ({ row }) => <>{row.original.attributes.experienceRequired}</>,
  },
  {
    id: "materialsProvided",
    header: "Materials Provided",
    meta: { sortField: "materialsProvided" },
    cell: ({ row }) => <>{row.original.attributes.materialsProvided}</>,
  },
  {
    id: "materialsRequired",
    header: "Materials Required",
    meta: { sortField: "materialsRequired" },
    cell: ({ row }) => <>{row.original.attributes.materialsRequired}</>,
  },
  {
    id: "materialsRequiredDetails",
    header: "Materials Required Details",
    meta: { sortField: "materialsRequiredDetails" },
    cell: ({ row }) => <>{row.original.attributes.materialsRequiredDetails}</>,
  },
  {
    id: "day",
    header: "Day",
    meta: { sortField: "startDateTime" },
    cell: ({ row }) => (
      <>{format(new Date(row.original.attributes.startDateTime), "EEEE")}</>
    ),
  },
  {
    id: "startDateTime",
    header: "Start",
    meta: { sortField: "startDateTime" },
    cell: ({ row }) => (
      <>{format(new Date(row.original.attributes.startDateTime), "HH:mm")}</>
    ),
  },
  {
    id: "duration",
    header: "Duration",
    meta: { sortField: "duration" },
    cell: ({ row }) => <>{row.original.attributes.duration}</>,
  },
  {
    id: "endDateTime",
    header: "End",
    meta: { sortField: "endDateTime" },
    cell: ({ row }) => (
      <>{format(new Date(row.original.attributes.endDateTime), "HH:mm")}</>
    ),
  },
  {
    id: "gmNames",
    header: "GMs",
    meta: { sortField: "gmNames" },
    cell: ({ row }) => <>{row.original.attributes.gmNames}</>,
  },
  {
    id: "website",
    header: "Website",
    meta: { sortField: "website" },
    cell: ({ row }) => <>{row.original.attributes.website}</>,
  },
  {
    id: "email",
    header: "Email",
    meta: { sortField: "email" },
    cell: ({ row }) => <>{row.original.attributes.email}</>,
  },
  {
    id: "tournament",
    header: "Tournament",
    meta: { sortField: "tournament" },
    cell: ({ row }) => <>{row.original.attributes.tournament}</>,
  },
  {
    id: "roundNumber",
    header: "Round Number",
    meta: { sortField: "roundNumber" },
    cell: ({ row }) => <>{row.original.attributes.roundNumber}</>,
  },
  {
    id: "totalRounds",
    header: "Total Rounds",
    meta: { sortField: "totalRounds" },
    cell: ({ row }) => <>{row.original.attributes.totalRounds}</>,
  },
  {
    id: "minimumPlayTime",
    header: "Min Time",
    meta: { sortField: "minimumPlayTime" },
    cell: ({ row }) => <>{row.original.attributes.minimumPlayTime}</>,
  },
  {
    id: "attendeeRegistration",
    header: "Attendee Registration",
    meta: { sortField: "attendeeRegistration" },
    cell: ({ row }) => <>{row.original.attributes.attendeeRegistration}</>,
  },
  {
    id: "cost",
    header: "Cost",
    meta: { sortField: "cost" },
    cell: ({ row }) => <>${row.original.attributes.cost.toFixed(2)}</>,
  },
  {
    id: "location",
    header: "Location",
    meta: { sortField: "location" },
    cell: ({ row }) => <>{row.original.attributes.location}</>,
  },
  {
    id: "roomName",
    header: "Room",
    meta: { sortField: "roomName" },
    cell: ({ row }) => <>{row.original.attributes.roomName}</>,
  },
  {
    id: "tableNumber",
    header: "Table Number",
    meta: { sortField: "tableNumber" },
    cell: ({ row }) => <>{row.original.attributes.tableNumber}</>,
  },
  {
    id: "specialCategory",
    header: "Special Category",
    meta: { sortField: "specialCategory" },
    cell: ({ row }) => <>{row.original.attributes.specialCategory}</>,
  },
  {
    id: "ticketsAvailable",
    header: "Tickets Available",
    meta: { sortField: "ticketsAvailable" },
    cell: ({ row }) => <>{row.original.attributes.ticketsAvailable}</>,
  },
  {
    id: "lastModified",
    header: "Last Modified",
    meta: { sortField: "lastModified" },
    cell: ({ row }) => (
      <>
        {format(new Date(row.original.attributes.lastModified), "yyyy-MM-dd")}
      </>
    ),
  },
];

export function SearchResults({
  searchParams,
  onNavigate,
  onSort,
}: SearchResultsProps) {
  const { visibility, toggle, reset } = useColumnVisibility();
  const page = searchParams.page ?? 1;
  const limit = searchParams.limit ?? 100;
  const { data, isLoading, isError } = useQuery({
    queryKey: ["events", searchParams],
    queryFn: () => fetchEvents(searchParams),
  });

  let activeSortField: string | undefined;
  let activeSortDir: "asc" | "desc" | undefined;
  if (searchParams.sort) {
    const [field, dir] = searchParams.sort.split(".");
    if (field && (dir === "asc" || dir === "desc")) {
      activeSortField = field;
      activeSortDir = dir;
    }
  }

  const handleSortClick = (sortField: string, label: string) => {
    if (activeSortField !== sortField) {
      onSort(`${sortField}.asc`);
      announce(`Sorted by ${label}, ascending`);
    } else if (activeSortDir === "asc") {
      onSort(`${sortField}.desc`);
      announce(`Sorted by ${label}, descending`);
    } else {
      onSort(undefined);
      announce("Sort cleared");
    }
  };

  const table = useReactTable({
    data: data?.data ?? [],
    columns: COLUMNS,
    state: {
      columnVisibility: visibility,
    },
    manualSorting: true,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const pagination =
    data && data.data.length > 0 ? (
      <Pagination
        page={page}
        limit={limit}
        total={data.meta.total}
        onNavigate={onNavigate}
      />
    ) : null;

  return (
    <section>
      <details>
        <summary>Customize columns</summary>
        <fieldset>
          <ul>
            {COLUMNS.map((col) => (
              <li key={col.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={!!visibility[col.id!]}
                    onChange={() => toggle(col.id!)}
                  />
                  {col.header as string}
                </label>
              </li>
            ))}
          </ul>
          <button type="button" onClick={reset}>
            Reset to defaults
          </button>
        </fieldset>
      </details>

      {isLoading && (
        <div className={styles.state}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} />
          </div>
          <p className={styles.stateText}>LOADING QUESTS...</p>
        </div>
      )}
      {isError && (
        <div className={styles.state}>
          <p className={styles.stateText}>QUEST FAILED</p>
          <p className={styles.stateSubtext}>
            Unable to load events. Please try again.
          </p>
        </div>
      )}
      {data && data.data.length === 0 && (
        <div className={styles.state}>
          <div className={styles.stateDie} aria-hidden="true">
            ⚄
          </div>
          <p className={styles.stateText}>NO QUESTS FOUND</p>
          <p className={styles.stateSubtext}>Try broadening your search.</p>
        </div>
      )}
      {data && data.data.length > 0 && (
        <>
          {pagination}
          <table>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const sortField = header.column.columnDef.meta?.sortField;
                    const label = header.column.columnDef.header as string;
                    const isActive =
                      !!sortField && activeSortField === sortField;
                    const ariaSort = isActive
                      ? activeSortDir === "asc"
                        ? ("ascending" as const)
                        : ("descending" as const)
                      : ("none" as const);
                    return (
                      <th
                        key={header.id}
                        aria-sort={ariaSort}
                        scope="col"
                        aria-label={label}
                      >
                        <button
                          type="button"
                          aria-label={`Sort by ${label}`}
                          onClick={() =>
                            sortField && handleSortClick(sortField, label)
                          }
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {isActive && (
                            <span aria-hidden="true">
                              {activeSortDir === "asc" ? " ▲" : " ▼"}
                            </span>
                          )}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {pagination}
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Run all SearchResults tests**

```bash
npm test -- --reporter=verbose src/components/SearchResults/SearchResults.test.tsx
```

Expected: all tests pass. If any fail, check that column `id` values match the column keys in `useColumnVisibility`'s DEFAULTS (e.g., `'title'`, `'gameId'`).

- [ ] **Step 4: Run the full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/SearchResults/SearchResults.tsx
git commit -m "feat: migrate SearchResults to TanStack Table"
```

---

## Task 7: SearchResults CSS module

**Files:**

- Create: `src/components/SearchResults/SearchResults.module.css`
- Modify: `src/components/SearchResults/SearchResults.tsx` (apply class names)

No new behavioral tests — purely visual.

- [ ] **Step 1: Create `SearchResults.module.css`**

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

table thead {
  background: var(--color-bark);
  color: var(--color-parchment);
}

table thead th {
  font-family: var(--font-pixel);
  font-size: var(--text-label);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-bark-light);
  text-align: left;
}

table thead th button {
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

table thead th button:hover {
  opacity: 0.8;
}

table thead th button span {
  color: var(--color-gold);
}

table tbody tr:nth-child(odd) {
  background: var(--color-parchment-light);
}

table tbody tr:nth-child(even) {
  background: var(--color-parchment);
}

table tbody tr {
  transition: background-color var(--motion-hover);
}

table tbody tr:hover {
  background: var(--color-bark-light);
}

table td {
  border: 1px solid var(--color-bark-light);
  padding: var(--space-1) var(--space-3);
  font-family: var(--font-data);
  font-size: 0.95rem;
  color: var(--color-ink);
}

/* Column visibility panel */
.visibilityPanel {
  margin-bottom: var(--space-3);
}

.visibilityPanel summary {
  font-family: var(--font-pixel);
  font-size: var(--text-label);
  color: var(--color-bark);
  cursor: pointer;
  padding: var(--space-2);
  border: 2px solid var(--color-bark);
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

/* States */
.state {
  text-align: center;
  border: 2px dashed var(--color-bark-light);
  padding: var(--space-5);
  margin: var(--space-4) 0;
}

.stateDie {
  font-size: 48px;
  line-height: 1;
  margin-bottom: var(--space-3);
}

.stateText {
  font-family: var(--font-pixel);
  font-size: var(--text-label);
  color: var(--color-bark-dark);
  margin: var(--space-2) 0;
}

.stateSubtext {
  font-family: var(--font-data);
  font-size: 1rem;
  color: var(--color-bark);
  margin: 0;
}

/* Loading progress bar */
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

- [ ] **Step 2: Apply module class names to `SearchResults.tsx`**

Apply the `styles.visibilityPanel` class to the `<details>` element and wrap the table in `styles.tableWrapper`. Locate these elements in `SearchResults.tsx` and update:

```tsx
<details className={styles.visibilityPanel}>
```

```tsx
<div className={styles.tableWrapper}>
  <table>{/* ... */}</table>
</div>
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/SearchResults/SearchResults.module.css src/components/SearchResults/SearchResults.tsx
git commit -m "feat: add SearchResults CSS module with table styles and pixel states"
```

---

## Task 8: Pagination — add event count + CSS module

**Files:**

- Modify: `src/components/Pagination/Pagination.tsx`
- Create: `src/components/Pagination/Pagination.module.css`
- Modify: `src/components/Pagination/Pagination.test.tsx`

- [ ] **Step 1: Write a failing test for the event count summary**

Add to `Pagination.test.tsx`:

```tsx
test("shows total events and per-page count summary", () => {
  render(<Pagination page={1} limit={100} total={247} onNavigate={vi.fn()} />);
  expect(screen.getByText("247 events • 100 per page")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm test -- --reporter=verbose src/components/Pagination/Pagination.test.tsx
```

Expected: FAIL — "247 events • 100 per page" not found

- [ ] **Step 3: Update `Pagination.tsx`**

Add the summary line and import clsx + module styles:

```tsx
import { useState, useEffect } from "react";
import clsx from "clsx";
import styles from "./Pagination.module.css";

const PAGE_SIZE_OPTIONS = [100, 500, 1000] as const;
const BACKEND_MAX_RESULTS = 10_000;

function Toggletip({ label, message }: { label: string; message: string }) {
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
    <span style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
      >
        ?
      </button>
      {open && (
        <span role="tooltip" style={{ position: "absolute", zIndex: 1 }}>
          {message}
        </span>
      )}
    </span>
  );
}

function getPageNumbers(page: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7)
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (page > 3) pages.push("...");
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (page < totalPages - 2) pages.push("...");
  pages.push(totalPages);
  return pages;
}

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onNavigate: (page: number, limit: number) => void;
}

export function Pagination({
  page,
  limit,
  total,
  onNavigate,
}: PaginationProps) {
  const naturalTotalPages = Math.ceil(total / limit);
  const maxPages = Math.floor(BACKEND_MAX_RESULTS / limit);
  const totalPages = Math.min(naturalTotalPages, maxPages);
  const isTruncated = naturalTotalPages > maxPages;
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <nav aria-label="Pagination" className={styles.nav}>
      <div className={styles.controls}>
        <button
          type="button"
          className={clsx("btn-secondary", styles.navButton)}
          onClick={() => onNavigate(page - 1, limit)}
          disabled={page === 1}
        >
          ◀ Previous
        </button>
        <span className={styles.pageLabel}>
          Page {page} of {totalPages}
        </span>
        {isTruncated && (
          <Toggletip
            label="Why are some pages unavailable?"
            message={`Results are capped at ${BACKEND_MAX_RESULTS.toLocaleString()} events. Narrow your search to see more.`}
          />
        )}
        {pageNumbers.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} aria-hidden className={styles.ellipsis}>
              …
            </span>
          ) : (
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
          ),
        )}
        <button
          type="button"
          className={clsx("btn-secondary", styles.navButton)}
          onClick={() => onNavigate(page + 1, limit)}
          disabled={page === totalPages}
        >
          Next ▶
        </button>
      </div>
      <div className={styles.summary}>
        {total.toLocaleString()} events • {limit} per page
        <label className={styles.perPageLabel}>
          Per page
          <select
            value={limit}
            onChange={(e) => onNavigate(1, Number(e.target.value))}
            className={styles.perPageSelect}
          >
            {PAGE_SIZE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
      </div>
    </nav>
  );
}
```

Note: the existing tests use `getByRole("button", { name: "Previous" })` and `getByRole("button", { name: "Next" })`. The new text is "◀ Previous" and "Next ▶" — these still match because accessible name computation includes the full text content.

- [ ] **Step 4: Run all Pagination tests**

```bash
npm test -- --reporter=verbose src/components/Pagination/Pagination.test.tsx
```

Expected: all tests pass, including the new summary test.

- [ ] **Step 5: Create `Pagination.module.css`**

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

.navButton {
  font-size: var(--text-label);
}

.pageButton {
  min-width: 40px;
  font-size: var(--text-label);
  padding: var(--space-1) var(--space-2);
}

.activePage {
  background: var(--color-bark) !important;
  color: var(--color-gold) !important;
  cursor: default;
}

.pageLabel {
  font-family: var(--font-data);
  font-size: 1rem;
  color: var(--color-bark-dark);
  padding: 0 var(--space-2);
}

.ellipsis {
  font-family: var(--font-data);
  color: var(--color-bark-light);
  padding: 0 var(--space-1);
}

.summary {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-family: var(--font-data);
  font-size: 0.9rem;
  color: var(--color-bark-dark);
}

.perPageLabel {
  font-family: var(--font-pixel);
  font-size: var(--text-badge);
  color: var(--color-bark);
}

.perPageSelect {
  background: var(--color-parchment);
  border: 2px solid var(--color-bark);
  border-radius: 0;
  font-family: var(--font-data);
  font-size: 0.9rem;
  color: var(--color-ink);
  padding: var(--space-1) var(--space-2);
  margin-left: var(--space-2);
}
```

- [ ] **Step 6: Run all tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/Pagination/Pagination.tsx src/components/Pagination/Pagination.module.css src/components/Pagination/Pagination.test.tsx
git commit -m "feat: update Pagination with event count summary and CSS module"
```

---

## Task 9: EventDetail — section groups + CSS module

**Files:**

- Modify: `src/components/EventDetail/EventDetail.tsx`
- Create: `src/components/EventDetail/EventDetail.module.css`
- Modify: `src/components/EventDetail/EventDetail.test.tsx`

- [ ] **Step 1: Write failing tests for section structure and on-brand states**

Add to `EventDetail.test.tsx`:

```tsx
test("renders THE EVENT section heading", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: "RPG24000001", title: "Epic Dragon Hunt" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail("RPG24000001");
  await screen.findByText("Epic Dragon Hunt");
  expect(
    screen.getByRole("heading", { name: "THE EVENT" }),
  ).toBeInTheDocument();
});

test("renders PLAYERS section heading", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [makeEvent({ gameId: "RPG24000001" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail("RPG24000001");
  await screen.findByRole("heading", { name: "THE EVENT" });
  expect(screen.getByRole("heading", { name: "PLAYERS" })).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "LOGISTICS" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "CONTACT" })).toBeInTheDocument();
});

test("shows loading state while fetching", async () => {
  renderEventDetail("RPG24000001");
  expect(await screen.findByText("LOADING QUEST...")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --reporter=verbose src/components/EventDetail/EventDetail.test.tsx
```

Expected: FAIL — no "THE EVENT" heading, no "LOADING QUEST..."

- [ ] **Step 3: Rewrite `EventDetail.tsx`**

```tsx
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { fetchEvents } from "../../utils/api";
import styles from "./EventDetail.module.css";

interface EventDetailProps {
  gameId: string;
}

function BoolField({ value }: { value: string | boolean }) {
  const isYes =
    value === true ||
    (typeof value === "string" && value.toLowerCase() === "yes");
  return (
    <span
      style={{ color: isYes ? "var(--color-bark)" : "var(--color-bark-light)" }}
    >
      {isYes ? "✓" : "—"}
    </span>
  );
}

export function EventDetail({ gameId }: EventDetailProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["event", gameId],
    queryFn: () => fetchEvents({ gameId, limit: 1 }),
  });

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

  const a = data.data[0].attributes;

  return (
    <article className={styles.article}>
      <Link to="/" className={styles.backLink}>
        ← Back to results
      </Link>

      <div className={styles.card}>
        <p className={styles.gameIdBadge}>{a.gameId}</p>
        <h1 className={styles.title}>{a.title}</h1>

        {/* THE EVENT */}
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>THE EVENT</h2>
          <dl className={styles.dl}>
            <div className={styles.dlFull}>
              <dt className={styles.dt}>Short Description</dt>
              <dd className={styles.dd}>{a.shortDescription}</dd>
            </div>
            <div className={styles.dlFull}>
              <dt className={styles.dt}>Long Description</dt>
              <dd className={styles.dd}>{a.longDescription}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Event Type</dt>
              <dd className={styles.dd}>{a.eventType}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Group</dt>
              <dd className={styles.dd}>{a.group}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Game System</dt>
              <dd className={styles.dd}>{a.gameSystem}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Rules Edition</dt>
              <dd className={styles.dd}>{a.rulesEdition}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Special Category</dt>
              <dd className={styles.dd}>{a.specialCategory}</dd>
            </div>
          </dl>
        </section>

        {/* PLAYERS */}
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>PLAYERS</h2>
          <dl className={styles.dl}>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Min Players</dt>
              <dd className={styles.dd}>{a.minPlayers}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Max Players</dt>
              <dd className={styles.dd}>{a.maxPlayers}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Age Required</dt>
              <dd className={styles.dd}>{a.ageRequired}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Experience Required</dt>
              <dd className={styles.dd}>{a.experienceRequired}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Tournament</dt>
              <dd className={styles.dd}>
                <BoolField value={a.tournament} />
              </dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Round</dt>
              <dd className={styles.dd}>
                {a.roundNumber} of {a.totalRounds}
              </dd>
            </div>
          </dl>
        </section>

        {/* LOGISTICS */}
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>LOGISTICS</h2>
          <dl className={styles.dl}>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Day</dt>
              <dd className={styles.dd}>
                {format(new Date(a.startDateTime), "EEEE")}
              </dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Start</dt>
              <dd className={styles.dd}>
                {format(new Date(a.startDateTime), "HH:mm")}
              </dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>End</dt>
              <dd className={styles.dd}>
                {format(new Date(a.endDateTime), "HH:mm")}
              </dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Duration</dt>
              <dd className={styles.dd}>{a.duration} hours</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Min Play Time</dt>
              <dd className={styles.dd}>{a.minimumPlayTime} hours</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Location</dt>
              <dd className={styles.dd}>{a.location}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Room</dt>
              <dd className={styles.dd}>{a.roomName}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Table</dt>
              <dd className={styles.dd}>{a.tableNumber}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Cost</dt>
              <dd className={styles.dd}>${a.cost.toFixed(2)}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Attendee Registration</dt>
              <dd className={styles.dd}>
                <span
                  className={
                    a.attendeeRegistration === "ticketed"
                      ? styles.pillFilled
                      : styles.pillOutline
                  }
                >
                  {a.attendeeRegistration}
                </span>
              </dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Tickets Available</dt>
              <dd className={styles.dd}>{a.ticketsAvailable}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Materials Provided</dt>
              <dd className={styles.dd}>
                <BoolField value={a.materialsProvided} />
              </dd>
            </div>
            <div className={styles.dlFull}>
              <dt className={styles.dt}>Materials Required</dt>
              <dd className={styles.dd}>{a.materialsRequired}</dd>
            </div>
            <div className={styles.dlFull}>
              <dt className={styles.dt}>Materials Required Details</dt>
              <dd className={styles.dd}>{a.materialsRequiredDetails}</dd>
            </div>
          </dl>
        </section>

        {/* CONTACT */}
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>CONTACT</h2>
          <dl className={styles.dl}>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>GMs</dt>
              <dd className={styles.dd}>{a.gmNames}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Website</dt>
              <dd className={styles.dd}>{a.website || "—"}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Email</dt>
              <dd className={styles.dd}>{a.email || "—"}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Last Modified</dt>
              <dd className={styles.dd}>
                {format(new Date(a.lastModified), "yyyy-MM-dd")}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </article>
  );
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- --reporter=verbose src/components/EventDetail/EventDetail.test.tsx
```

Note: the existing test `shows not-found message when event does not exist` checks `screen.findByText("Event not found.")` — update that test to match the new text:

```tsx
test("shows not-found message when event does not exist", async () => {
  server.use(
    http.get("/api/events/search", () => {
      const response: EventSearchResponse = {
        data: [],
        meta: { total: 0 },
        links: { self: "" },
        error: null,
      };
      return HttpResponse.json(response);
    }),
  );
  renderEventDetail("DOESNOTEXIST");
  expect(await screen.findByText("EVENT NOT FOUND")).toBeInTheDocument();
});
```

Also update `shows loading state while fetching`:

```tsx
test("shows loading state while fetching", async () => {
  renderEventDetail("RPG24000001");
  expect(await screen.findByText("LOADING QUEST...")).toBeInTheDocument();
});
```

Re-run:

```bash
npm test -- --reporter=verbose src/components/EventDetail/EventDetail.test.tsx
```

Expected: all tests pass.

- [ ] **Step 5: Create `EventDetail.module.css`**

```css
.article {
  max-width: var(--size-detail-max);
  margin: 0 auto;
  padding: var(--space-4);
}

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

.card {
  background: var(--color-parchment-light);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
  box-shadow: var(--shadow-panel), var(--shadow-panel-inset);
  padding: var(--space-4);
}

.gameIdBadge {
  font-family: var(--font-pixel);
  font-size: var(--text-badge);
  color: var(--color-gold);
  margin: 0 0 var(--space-2) 0;
}

.title {
  font-family: var(--font-pixel);
  font-size: var(--text-display);
  color: var(--color-bark-dark);
  border-bottom: 3px solid var(--color-bark);
  padding-bottom: var(--space-3);
  margin-bottom: var(--space-4);
}

.section {
  margin-bottom: var(--space-5);
}

.sectionHeading {
  font-family: var(--font-pixel);
  font-size: var(--text-heading);
  color: var(--color-bark);
  border-bottom: 1px solid var(--color-bark-light);
  padding-bottom: var(--space-2);
  margin: 0 0 var(--space-3) 0;
}

.dl {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  margin: 0;
}

.dlItem {
  /* occupies one column */
}

.dlFull {
  grid-column: 1 / -1;
}

.dt {
  font-family: var(--font-pixel);
  font-size: var(--text-label);
  color: var(--color-bark);
  margin-bottom: var(--space-1);
}

.dd {
  font-family: var(--font-data);
  font-size: 1rem;
  color: var(--color-ink);
  margin: 0;
}

/* Registration pill */
.pillFilled {
  display: inline-block;
  background: var(--color-bark);
  color: var(--color-parchment);
  border: 2px solid var(--color-bark);
  padding: var(--space-1) var(--space-2);
  font-family: var(--font-data);
  font-size: 0.9rem;
}

.pillOutline {
  display: inline-block;
  background: transparent;
  color: var(--color-bark);
  border: 2px solid var(--color-bark);
  padding: var(--space-1) var(--space-2);
  font-family: var(--font-data);
  font-size: 0.9rem;
}

/* States */
.state {
  text-align: center;
  border: 2px dashed var(--color-bark-light);
  padding: var(--space-5);
  margin: var(--space-4);
}

.stateDie {
  font-size: 48px;
  line-height: 1;
  margin-bottom: var(--space-3);
}

.stateText {
  font-family: var(--font-pixel);
  font-size: var(--text-label);
  color: var(--color-bark-dark);
  margin: var(--space-2) 0;
}

.stateSubtext {
  font-family: var(--font-data);
  font-size: 1rem;
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

- [ ] **Step 6: Run all tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/EventDetail/EventDetail.tsx src/components/EventDetail/EventDetail.module.css src/components/EventDetail/EventDetail.test.tsx
git commit -m "feat: restructure EventDetail with section groups and CSS module"
```

---

## Task 10: Sort indicator pulse animation

**Files:**

- Modify: `src/components/SearchResults/SearchResults.module.css`
- Modify: `src/components/SearchResults/SearchResults.tsx`

The sort `▲`/`▼` indicator gets a brief scale pulse when the sort changes. This is the final motion detail.

- [ ] **Step 1: Add the pulse keyframe to `SearchResults.module.css`**

Add at the bottom of `SearchResults.module.css`:

```css
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

- [ ] **Step 2: Apply `styles.sortIndicator` to the sort indicator span in `SearchResults.tsx`**

Find the sort indicator `<span>` in the header rendering and add the class:

```tsx
{
  isActive && (
    <span aria-hidden="true" className={styles.sortIndicator}>
      {activeSortDir === "asc" ? " ▲" : " ▼"}
    </span>
  );
}
```

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/SearchResults/SearchResults.module.css src/components/SearchResults/SearchResults.tsx
git commit -m "feat: add sort indicator pulse animation"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement                                   | Task covering it    |
| -------------------------------------------------- | ------------------- |
| `--color-gold` accent token                        | Task 2              |
| Press Start 2P + Courier Prime fonts               | Task 2              |
| Full spacing/shadow/motion/z-index token layer     | Task 2              |
| Header bar: 18px gold title                        | Task 3              |
| Two-column sidebar grid                            | Task 3              |
| SVG grain on `html`                                | Task 2              |
| Sidebar grain on parchment-light surfaces          | Task 3, 9           |
| Bark header wood-grain texture                     | Task 3              |
| SearchForm fieldset groups (6 groups)              | Task 4              |
| Day checkbox span wrappers + CSS toggle tiles      | Task 4              |
| Sticky opaque button bar (flex + margin-top: auto) | Task 4              |
| TanStack Table migration                           | Task 6              |
| Column definitions with meta.sortField             | Task 6              |
| Gold sort indicator                                | Task 6, 7           |
| Column visibility panel with details animation     | Task 7              |
| Pixel progress bar loading state                   | Tasks 5, 6, 9       |
| ⚄ die face empty state                             | Tasks 5, 6, 9       |
| QUEST FAILED error state                           | Tasks 5, 6, 9       |
| Pagination event count summary                     | Task 8              |
| Active page gold text                              | Task 8              |
| EventDetail 4 section groups                       | Task 9              |
| Stacked dt/dd layout                               | Task 9              |
| Two-column dl grid                                 | Task 9              |
| Boolean ✓/— fields                                 | Task 9              |
| Registration status pill                           | Task 9              |
| EventDetail card pixel border                      | Task 9              |
| Button `:active` press animation                   | Task 2 (global CSS) |
| Table row hover transition                         | Task 7              |
| Details expansion: interpolate-size                | Task 7              |
| Sort indicator pulse                               | Task 10             |
| clsx composition pattern                           | Tasks 4, 6, 8       |
| `[aria-current="page"]` styling                    | Task 8              |

All spec requirements covered. No gaps found.
