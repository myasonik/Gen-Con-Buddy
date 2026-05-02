# Type Column Display Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Show icon" checkbox and a Code/Name/Both radio group to the Customize Columns panel that controls how the eventType column renders — via CSS class toggling on the section/ul wrapper, bypassing TanStack Table's memoization entirely.

**Architecture:** All three cell parts (icon, code, name) are always rendered in the DOM; CSS classes on an ancestor element hide unwanted parts. State (`typeDisplay: "code"|"name"|"both"` + `showTypeIcon: boolean`) is managed by `useTypeDisplay()`, persisted to localStorage, and threaded through `SharedColumnState`. `typeCell.module.css` defines both the parent mode classes and child cell-part classes in one module so the cascade works without `:global()`. The API returns `eventType` as a short code (e.g. `"RPG"`); the full name comes from the `EVENT_TYPES` enum in `enums.ts`.

**Tech Stack:** React 18, Vitest, @testing-library/react, CSS Modules, TanStack Table v8

---

## File Map

| Action | File                                                  |
| ------ | ----------------------------------------------------- |
| Modify | `src/ui/EventTable/types.ts`                          |
| Create | `src/hooks/useTypeDisplay.ts`                         |
| Create | `src/hooks/useTypeDisplay.test.ts`                    |
| Create | `src/ui/icons/Targeted.tsx`                           |
| Create | `src/ui/EventTable/typeCell.module.css`               |
| Modify | `src/ui/EventTable/columns.tsx`                       |
| Modify | `src/ui/EventTable/columns.module.css`                |
| Modify | `src/ui/EventTable/EventListMobile.tsx`               |
| Modify | `src/ui/EventTable/EventListMobile.test.tsx`          |
| Modify | `src/ui/EventTable/EventTable.module.css`             |
| Modify | `src/ui/EventTable/ColumnControlsPanel.tsx`           |
| Modify | `src/ui/EventTable/ColumnControlsPanel.test.tsx`      |
| Modify | `src/ui/EventTable/EventTable.tsx`                    |
| Modify | `src/components/SearchResults/SearchResults.tsx`      |
| Modify | `src/components/SearchResults/SearchResults.test.tsx` |
| Modify | `src/components/ChangelogPage/ChangelogPage.tsx`      |

---

### Task 1: Add TypeDisplay type and extend SharedColumnState

**Files:**

- Modify: `src/ui/EventTable/types.ts`

- [ ] **Step 1: Replace types.ts**

```ts
import type { OnChangeFn, ColumnSizingState } from "@tanstack/react-table";

export type TypeDisplay = "code" | "name" | "both";

export interface SharedColumnState {
  visibility: Record<string, boolean>;
  toggleVisibility: (id: string) => void;
  resetVisibility: () => void;
  sizing: ColumnSizingState;
  setSizing: OnChangeFn<ColumnSizingState>;
  resetSizing: () => void;
  typeDisplay: TypeDisplay;
  setTypeDisplay: (v: TypeDisplay) => void;
  showTypeIcon: boolean;
  setShowTypeIcon: (v: boolean) => void;
  resetTypeDisplay: () => void;
}
```

- [ ] **Step 2: Verify TypeScript errors are only about the new required fields**

Run: `npm run typecheck 2>&1 | grep "error TS" | head -20`

Expected: Errors about missing `typeDisplay`, `setTypeDisplay`, `showTypeIcon`, `setShowTypeIcon`, `resetTypeDisplay` fields in `SearchResults.tsx`, `ChangelogPage.tsx`, and `EventTable.tsx`. No other new errors.

- [ ] **Step 3: Commit**

```bash
git add src/ui/EventTable/types.ts
git commit -m "feat(type-display): add TypeDisplay type and extend SharedColumnState interface"
```

---

### Task 2: useTypeDisplay hook

**Files:**

- Create: `src/hooks/useTypeDisplay.test.ts`
- Create: `src/hooks/useTypeDisplay.ts`

- [ ] **Step 1: Write failing tests**

Create `src/hooks/useTypeDisplay.test.ts`:

```ts
import { expect, test, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTypeDisplay } from "./useTypeDisplay";

const STORAGE_KEY = "gen-con-buddy-type-display";

beforeEach(() => {
  localStorage.clear();
});

test("returns default typeDisplay of 'name' on first use", () => {
  const { result } = renderHook(() => useTypeDisplay());
  expect(result.current.typeDisplay).toBe("name");
});

test("returns showTypeIcon true by default", () => {
  const { result } = renderHook(() => useTypeDisplay());
  expect(result.current.showTypeIcon).toBe(true);
});

test("setTypeDisplay updates typeDisplay", () => {
  const { result } = renderHook(() => useTypeDisplay());
  act(() => {
    result.current.setTypeDisplay("code");
  });
  expect(result.current.typeDisplay).toBe("code");
});

test("setShowTypeIcon updates showTypeIcon", () => {
  const { result } = renderHook(() => useTypeDisplay());
  act(() => {
    result.current.setShowTypeIcon(false);
  });
  expect(result.current.showTypeIcon).toBe(false);
});

test("persists both values to localStorage and loads them back", () => {
  const { result } = renderHook(() => useTypeDisplay());
  act(() => {
    result.current.setTypeDisplay("code");
    result.current.setShowTypeIcon(false);
  });
  const { result: result2 } = renderHook(() => useTypeDisplay());
  expect(result2.current.typeDisplay).toBe("code");
  expect(result2.current.showTypeIcon).toBe(false);
});

test("reset restores defaults", () => {
  const { result } = renderHook(() => useTypeDisplay());
  act(() => {
    result.current.setTypeDisplay("both");
    result.current.setShowTypeIcon(false);
  });
  act(() => {
    result.current.reset();
  });
  expect(result.current.typeDisplay).toBe("name");
  expect(result.current.showTypeIcon).toBe(true);
});

test("resets to defaults when stored version does not match", () => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: 9999, value: { textMode: "code", showIcon: false } }),
  );
  const { result } = renderHook(() => useTypeDisplay());
  expect(result.current.typeDisplay).toBe("name");
  expect(result.current.showTypeIcon).toBe(true);
});

test("resets to defaults when localStorage is malformed", () => {
  localStorage.setItem(STORAGE_KEY, "not-json{{{");
  const { result } = renderHook(() => useTypeDisplay());
  expect(result.current.typeDisplay).toBe("name");
  expect(result.current.showTypeIcon).toBe(true);
});
```

- [ ] **Step 2: Run to verify tests fail**

Run: `npm test src/hooks/useTypeDisplay.test.ts`

Expected: FAIL — `Cannot find module './useTypeDisplay'`

- [ ] **Step 3: Implement the hook**

Create `src/hooks/useTypeDisplay.ts`:

```ts
import { useStoredState } from "./useStoredState";
import type { TypeDisplay } from "../ui/EventTable/types";

const STORAGE_KEY = "gen-con-buddy-type-display";
const VERSION = 1;

interface TypeDisplayState {
  textMode: TypeDisplay;
  showIcon: boolean;
}

const DEFAULTS: TypeDisplayState = {
  textMode: "name",
  showIcon: true,
};

export function useTypeDisplay(): {
  typeDisplay: TypeDisplay;
  setTypeDisplay: (v: TypeDisplay) => void;
  showTypeIcon: boolean;
  setShowTypeIcon: (v: boolean) => void;
  reset: () => void;
} {
  const [state, setState] = useStoredState<TypeDisplayState>(STORAGE_KEY, VERSION, {
    ...DEFAULTS,
  });

  const setTypeDisplay = (v: TypeDisplay): void => {
    setState((prev) => ({ ...prev, textMode: v }));
  };

  const setShowTypeIcon = (v: boolean): void => {
    setState((prev) => ({ ...prev, showIcon: v }));
  };

  const reset = (): void => {
    setState({ ...DEFAULTS });
  };

  return {
    typeDisplay: state.textMode,
    setTypeDisplay,
    showTypeIcon: state.showIcon,
    setShowTypeIcon,
    reset,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test src/hooks/useTypeDisplay.test.ts`

Expected: 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTypeDisplay.ts src/hooks/useTypeDisplay.test.ts
git commit -m "feat(type-display): add useTypeDisplay hook with localStorage persistence"
```

---

### Task 3: Targeted icon and typeCell.module.css

**Files:**

- Create: `src/ui/icons/Targeted.tsx`
- Create: `src/ui/EventTable/typeCell.module.css`

- [ ] **Step 1: Create the Targeted icon**

Create `src/ui/icons/Targeted.tsx`:

```tsx
import { createIcon } from "./createIcon";

// game-icons.net — "targeted" by sbed (CC BY 3.0)
export const Targeted = createIcon(
  "Targeted",
  "0 0 512 512",
  <path d="M256 16C123.45 16 16 123.45 16 256s107.45 240 240 240 240-107.45 240-240S388.55 16 256 16zm0 60c99.41 0 180 80.59 180 180s-80.59 180-180 180S76 355.41 76 256 156.59 76 256 76zm-15 30a15 15 0 0 0-15 15v30a15 15 0 0 0 15 15h30a15 15 0 0 0 15-15v-30a15 15 0 0 0-15-15h-30zm16.75 90.03A60 60 0 0 0 196 256a60 60 0 0 0 120 0 60 60 0 0 0-58.25-59.97zM121 226a15 15 0 0 0-15 15v30a15 15 0 0 0 15 15h30a15 15 0 0 0 15-15v-30a15 15 0 0 0-15-15h-30zm240 0a15 15 0 0 0-15 15v30a15 15 0 0 0 15 15h30a15 15 0 0 0 15-15v-30a15 15 0 0 0-15-15h-30zM241 346a15 15 0 0 0-15 15v30a15 15 0 0 0 15 15h30a15 15 0 0 0 15-15v-30a15 15 0 0 0-15-15h-30z" />,
);
```

- [ ] **Step 2: Create typeCell.module.css**

Create `src/ui/EventTable/typeCell.module.css`:

```css
.typeCell {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.typeIcon {
  display: flex;
  flex-shrink: 0;
}

.typeCode {
}

.typeSep {
}

.typeName {
}

/* "code" mode — hide separator and name */
.typeDisplayCode .typeSep,
.typeDisplayCode .typeName {
  display: none;
}

/* "name" mode — hide code and separator */
.typeDisplayName .typeCode,
.typeDisplayName .typeSep {
  display: none;
}

/* "both" mode — no class needed; raw DOM shows everything */

/* Icon toggle */
.typeHideIcon .typeIcon {
  display: none;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/icons/Targeted.tsx src/ui/EventTable/typeCell.module.css
git commit -m "feat(type-display): add Targeted icon and typeCell CSS module"
```

---

### Task 4: Restructure eventType cell in columns.tsx

**Files:**

- Modify: `src/ui/EventTable/columns.tsx`
- Modify: `src/ui/EventTable/columns.module.css`
- Modify: `src/components/SearchResults/SearchResults.test.tsx`

- [ ] **Step 1: Write a failing test**

Add to `src/components/SearchResults/SearchResults.test.tsx` (before the final closing line):

```tsx
test("eventType cell renders code and name spans in the DOM", async () => {
  server.use(
    http.get("/api/events/search", () =>
      HttpResponse.json({
        data: [makeEvent({ eventType: "RPG" })],
        meta: { total: 1 },
        links: { self: "" },
        error: null,
      }),
    ),
  );
  renderSearchResults();
  await screen.findAllByRole("row");
  // Both code and name are always in the DOM; CSS controls which is visible
  expect(screen.getByText("RPG")).toBeInTheDocument();
  expect(screen.getByText("Role Playing Game")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- --reporter=verbose src/components/SearchResults/SearchResults.test.tsx 2>&1 | grep -E "FAIL|eventType cell"`

Expected: FAIL — `Unable to find an element with the text: Role Playing Game`

- [ ] **Step 3: Update columns.tsx**

In `src/ui/EventTable/columns.tsx`:

1. Add two new imports after the existing `import styles from "./columns.module.css"` line:

```tsx
import { EVENT_TYPES } from "../../utils/enums";
import typeCellStyles from "./typeCell.module.css";
```

2. Replace the entire `eventType` column definition (the object starting with `id: "eventType"`) with:

```tsx
  {
    id: "eventType",
    header: "Type",
    meta: { sortField: "eventType" },
    cell: ({ row }) => {
      const { eventType } = row.original.attributes;
      const Icon = EVENT_TYPE_ICONS[eventType];
      const fullLabel = EVENT_TYPES[eventType] ?? eventType;
      const name = fullLabel.startsWith(`${eventType} - `)
        ? fullLabel.slice(eventType.length + 3)
        : "";
      return (
        <span className={typeCellStyles.typeCell}>
          {Icon && (
            <span className={typeCellStyles.typeIcon}>
              <Icon size={14} />
            </span>
          )}
          <span className={typeCellStyles.typeCode}>{eventType}</span>
          {name && <span className={typeCellStyles.typeSep}> - </span>}
          {name && <span className={typeCellStyles.typeName}>{name}</span>}
        </span>
      );
    },
  },
```

- [ ] **Step 4: Remove dead CSS rule from columns.module.css**

In `src/ui/EventTable/columns.module.css`, remove these three lines (the old typeCell icon rule is now dead):

```css
.typeCell svg {
  vertical-align: middle;
  margin-inline-end: var(--space-1);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test src/components/SearchResults/SearchResults.test.tsx`

Expected: All tests pass including the new "eventType cell renders code and name spans" test.

- [ ] **Step 6: Commit**

```bash
git add src/ui/EventTable/columns.tsx src/ui/EventTable/columns.module.css src/components/SearchResults/SearchResults.test.tsx
git commit -m "feat(type-display): restructure eventType cell with explicit code/name/icon spans"
```

---

### Task 5: Update EventListMobile

**Files:**

- Modify: `src/ui/EventTable/EventListMobile.tsx`
- Modify: `src/ui/EventTable/EventListMobile.test.tsx`

- [ ] **Step 1: Write failing tests**

In `src/ui/EventTable/EventListMobile.test.tsx`:

1. Add this import at the top alongside the existing imports:

```tsx
import type { TypeDisplay } from "./types";
```

2. Replace the `renderList` function signature and body:

```tsx
async function renderList(
  events: Event[] = [makeEvent()],
  props: { typeDisplay?: TypeDisplay; showTypeIcon?: boolean } = {},
): Promise<ReturnType<typeof render>> {
  const rootRoute = createRootRoute({
    component: () => <EventListMobile events={events} {...props} />,
  });
  const eventRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/event/$id",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([eventRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await router.load();
  let result: ReturnType<typeof render> | null = null;
  await act(async () => {
    result = render(<RouterProvider router={router} />);
  });
  return result as unknown as ReturnType<typeof render>;
}
```

3. Add these new tests at the end of the file:

```tsx
test("renders event type name in the DOM", async () => {
  await renderList([makeEvent({ eventType: "RPG" })]);
  expect(screen.getByText("Role Playing Game")).toBeInTheDocument();
});

test("applies typeDisplayName class to list when typeDisplay is name", async () => {
  const { container } = await renderList([makeEvent()], { typeDisplay: "name" });
  expect(container.querySelector('[class*="typeDisplayName"]')).not.toBeNull();
});

test("applies typeDisplayCode class to list when typeDisplay is code", async () => {
  const { container } = await renderList([makeEvent()], { typeDisplay: "code" });
  expect(container.querySelector('[class*="typeDisplayCode"]')).not.toBeNull();
});

test("applies typeHideIcon class when showTypeIcon is false", async () => {
  const { container } = await renderList([makeEvent()], { showTypeIcon: false });
  expect(container.querySelector('[class*="typeHideIcon"]')).not.toBeNull();
});

test("no text mode class applied when typeDisplay is both", async () => {
  const { container } = await renderList([makeEvent()], { typeDisplay: "both" });
  expect(container.querySelector('[class*="typeDisplayCode"]')).toBeNull();
  expect(container.querySelector('[class*="typeDisplayName"]')).toBeNull();
});
```

- [ ] **Step 2: Run to verify tests fail**

Run: `npm test src/ui/EventTable/EventListMobile.test.tsx`

Expected: "renders event type name" FAIL (`Unable to find element with text 'Role Playing Game'`); the four class tests FAIL.

- [ ] **Step 3: Replace EventListMobile.tsx**

```tsx
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import type { Event } from "../../utils/types";
import type { TypeDisplay } from "./types";
import { EVENT_TYPES } from "../../utils/enums";
import { EVENT_TYPE_ICONS } from "../icons/eventTypeIcons";
import typeCellStyles from "./typeCell.module.css";
import styles from "./EventListMobile.module.css";

interface EventListMobileProps {
  events: Event[];
  typeDisplay?: TypeDisplay;
  showTypeIcon?: boolean;
}

export function EventListMobile({
  events,
  typeDisplay,
  showTypeIcon,
}: EventListMobileProps): JSX.Element {
  const textClass =
    typeDisplay === "code"
      ? typeCellStyles.typeDisplayCode
      : typeDisplay === "name"
        ? typeCellStyles.typeDisplayName
        : undefined;
  const iconClass = showTypeIcon === false ? typeCellStyles.typeHideIcon : undefined;
  const modeClass = [textClass, iconClass].filter(Boolean).join(" ") || undefined;

  return (
    <ul role="list" className={[styles.list, modeClass].filter(Boolean).join(" ")}>
      {events.map((event) => {
        const a = event.attributes;
        const start = new Date(a.startDateTime);
        const end = new Date(a.endDateTime);
        const players =
          a.minPlayers === a.maxPlayers ? String(a.minPlayers) : `${a.minPlayers}–${a.maxPlayers}`;
        const tickets =
          a.ticketsAvailable > 0
            ? `${a.ticketsAvailable} ticket${a.ticketsAvailable !== 1 ? "s" : ""}`
            : "Sold out";
        const TypeIcon = EVENT_TYPE_ICONS[a.eventType];
        const fullLabel = EVENT_TYPES[a.eventType] ?? a.eventType;
        const name = fullLabel.startsWith(`${a.eventType} - `)
          ? fullLabel.slice(a.eventType.length + 3)
          : "";
        return (
          <li key={event.id} className={styles.item}>
            <Link to="/event/$id" params={{ id: a.gameId }} className={styles.row}>
              <span className={styles.title}>{a.title}</span>
              <span className={styles.meta}>
                <span className={styles.typeTag}>
                  {TypeIcon && (
                    <span className={typeCellStyles.typeIcon}>
                      <TypeIcon size={14} />
                    </span>
                  )}
                  <span className={typeCellStyles.typeCode}>{a.eventType}</span>
                  {name && <span className={typeCellStyles.typeSep}> - </span>}
                  {name && <span className={typeCellStyles.typeName}>{name}</span>}
                </span>
                <span className={styles.when}>
                  {format(start, "EEE")} {format(start, "HH:mm")}–{format(end, "HH:mm")}
                </span>
                <span>{players}</span>
                <span className={a.ticketsAvailable === 0 ? styles.soldOut : undefined}>
                  {tickets}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test src/ui/EventTable/EventListMobile.test.tsx`

Expected: All tests pass including the 5 new ones.

- [ ] **Step 5: Commit**

```bash
git add src/ui/EventTable/EventListMobile.tsx src/ui/EventTable/EventListMobile.test.tsx
git commit -m "feat(type-display): restructure EventListMobile typeTag with mode CSS classes"
```

---

### Task 6: Add radioIndicator CSS and update ColumnControlsPanel

**Files:**

- Modify: `src/ui/EventTable/EventTable.module.css`
- Modify: `src/ui/EventTable/ColumnControlsPanel.tsx`
- Modify: `src/ui/EventTable/ColumnControlsPanel.test.tsx`

- [ ] **Step 1: Write failing tests**

In `src/ui/EventTable/ColumnControlsPanel.test.tsx`:

1. Add `userEvent` import:

```tsx
import userEvent from "@testing-library/user-event";
```

2. Replace the `makeColumnState` function with this version that includes the new required fields:

```tsx
function makeColumnState(overrides: Partial<SharedColumnState> = {}): SharedColumnState {
  return {
    visibility: Object.fromEntries(COLUMNS.map((c) => [c.id, true])),
    toggleVisibility: vi.fn<SharedColumnState["toggleVisibility"]>(),
    resetVisibility: vi.fn<SharedColumnState["resetVisibility"]>(),
    sizing: {},
    setSizing: vi.fn<SharedColumnState["setSizing"]>(),
    resetSizing: vi.fn<SharedColumnState["resetSizing"]>(),
    typeDisplay: "name",
    setTypeDisplay: vi.fn<SharedColumnState["setTypeDisplay"]>(),
    showTypeIcon: true,
    setShowTypeIcon: vi.fn<SharedColumnState["setShowTypeIcon"]>(),
    resetTypeDisplay: vi.fn<SharedColumnState["resetTypeDisplay"]>(),
    ...overrides,
  };
}
```

3. Add these new tests at the end of the file:

```tsx
test("renders Event type column fieldset", () => {
  render(<ColumnControlsPanel columnState={makeColumnState()} />);
  expect(screen.getByRole("group", { name: "Event type column" })).toBeInTheDocument();
});

test("renders Show icon checkbox checked when showTypeIcon is true", () => {
  render(<ColumnControlsPanel columnState={makeColumnState({ showTypeIcon: true })} />);
  expect(screen.getByRole("checkbox", { name: "Show icon" })).toBeChecked();
});

test("renders Show icon checkbox unchecked when showTypeIcon is false", () => {
  render(<ColumnControlsPanel columnState={makeColumnState({ showTypeIcon: false })} />);
  expect(screen.getByRole("checkbox", { name: "Show icon" })).not.toBeChecked();
});

test("clicking Show icon checkbox calls setShowTypeIcon with toggled value", async () => {
  const user = userEvent.setup();
  const setShowTypeIcon = vi.fn<SharedColumnState["setShowTypeIcon"]>();
  render(
    <ColumnControlsPanel columnState={makeColumnState({ showTypeIcon: true, setShowTypeIcon })} />,
  );
  await user.click(screen.getByRole("checkbox", { name: "Show icon" }));
  expect(setShowTypeIcon).toHaveBeenCalledWith(false);
});

test("renders Code, Name, and Both radio buttons", () => {
  render(<ColumnControlsPanel columnState={makeColumnState()} />);
  expect(screen.getByRole("radio", { name: "Code" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Name" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Both" })).toBeInTheDocument();
});

test("Name radio is checked when typeDisplay is name", () => {
  render(<ColumnControlsPanel columnState={makeColumnState({ typeDisplay: "name" })} />);
  expect(screen.getByRole("radio", { name: "Name" })).toBeChecked();
  expect(screen.getByRole("radio", { name: "Code" })).not.toBeChecked();
  expect(screen.getByRole("radio", { name: "Both" })).not.toBeChecked();
});

test("clicking Code radio calls setTypeDisplay with code", async () => {
  const user = userEvent.setup();
  const setTypeDisplay = vi.fn<SharedColumnState["setTypeDisplay"]>();
  render(
    <ColumnControlsPanel columnState={makeColumnState({ typeDisplay: "name", setTypeDisplay })} />,
  );
  await user.click(screen.getByRole("radio", { name: "Code" }));
  expect(setTypeDisplay).toHaveBeenCalledWith("code");
});

test("clicking Both radio calls setTypeDisplay with both", async () => {
  const user = userEvent.setup();
  const setTypeDisplay = vi.fn<SharedColumnState["setTypeDisplay"]>();
  render(
    <ColumnControlsPanel columnState={makeColumnState({ typeDisplay: "name", setTypeDisplay })} />,
  );
  await user.click(screen.getByRole("radio", { name: "Both" }));
  expect(setTypeDisplay).toHaveBeenCalledWith("both");
});

test("Reset to defaults calls resetTypeDisplay", async () => {
  const user = userEvent.setup();
  const resetTypeDisplay = vi.fn<SharedColumnState["resetTypeDisplay"]>();
  render(<ColumnControlsPanel columnState={makeColumnState({ resetTypeDisplay })} />);
  await user.click(screen.getByRole("button", { name: "Reset to defaults" }));
  expect(resetTypeDisplay).toHaveBeenCalledOnce();
});
```

- [ ] **Step 2: Run to verify new tests fail**

Run: `npm test src/ui/EventTable/ColumnControlsPanel.test.tsx`

Expected: The existing 5 tests still pass; the 9 new tests FAIL (`Unable to find element...`).

- [ ] **Step 3: Add CSS to EventTable.module.css**

Append to the end of `src/ui/EventTable/EventTable.module.css`:

```css
/* Radio button indicator — circular counterpart to .columnCheckbox */
.radioIndicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border: 0.0625rem solid var(--color-ink-border);
  border-radius: 50%;
  background: var(--color-surface-page);
  flex-shrink: 0;
  transition:
    background-color var(--motion-hover),
    border-color var(--motion-hover),
    color var(--motion-hover);
  color: transparent;
  overflow: hidden;
}

.radioIndicator svg {
  display: block;
}

.columnToggle input:checked + .radioIndicator {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-surface-page);
}

.columnToggle input:focus-visible + .radioIndicator {
  outline: var(--focus-ring) var(--color-accent);
  outline-offset: var(--focus-ring-offset);
}

/* Divider between type display section and column groups */
.typeDisplayDivider {
  border: none;
  border-top: 0.0625rem solid var(--color-ink-divider);
  margin: var(--space-2) 0;
}

/* Horizontal row layout for the three radio options */
.typeDisplayRadioGroup {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  padding-top: var(--space-1);
}
```

- [ ] **Step 4: Replace ColumnControlsPanel.tsx**

```tsx
import { useId } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "../Button/Button";
import type { SharedColumnState } from "./types";
import { AnimatedDetails } from "../AnimatedDetails/AnimatedDetails";
import { D6Face } from "../icons/D6Face";
import { Targeted } from "../icons/Targeted";
import { COLUMNS, COLUMN_GROUPS } from "./columns";
import styles from "./EventTable.module.css";

interface ColumnControlsPanelProps {
  columnState: SharedColumnState;
}

export function ColumnControlsPanel({ columnState }: ColumnControlsPanelProps): JSX.Element {
  const {
    visibility,
    toggleVisibility,
    resetVisibility,
    resetSizing,
    typeDisplay,
    setTypeDisplay,
    showTypeIcon,
    setShowTypeIcon,
    resetTypeDisplay,
  } = columnState;

  const panelId = useId();
  const radioName = `${panelId}-typeDisplay`;
  const colById = new Map(COLUMNS.filter((c) => c.id !== undefined).map((c) => [c.id, c]));

  return (
    <AnimatedDetails
      className={styles.visibilityPanel}
      summary={
        <>
          Customize columns
          <span className={styles.summaryChevron} aria-hidden="true">
            <ChevronRight size={14} />
          </span>
        </>
      }
    >
      <fieldset className={styles.columnFieldset}>
        <fieldset>
          <legend>Event type column</legend>
          <label className={styles.columnToggle}>
            <input
              type="checkbox"
              className="sr-only"
              checked={showTypeIcon}
              onChange={(e) => setShowTypeIcon(e.target.checked)}
            />
            <span className={styles.columnCheckbox} aria-hidden="true">
              <D6Face size={16} />
            </span>
            <span className={styles.columnLabel}>Show icon</span>
          </label>
          <div className={styles.typeDisplayRadioGroup}>
            {(["code", "name", "both"] as const).map((value) => (
              <label key={value} className={styles.columnToggle}>
                <input
                  type="radio"
                  name={radioName}
                  value={value}
                  className="sr-only"
                  checked={typeDisplay === value}
                  onChange={() => setTypeDisplay(value)}
                />
                <span className={styles.radioIndicator} aria-hidden="true">
                  <Targeted size={16} />
                </span>
                <span className={styles.columnLabel}>
                  {value === "code" ? "Code" : value === "name" ? "Name" : "Both"}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <hr className={styles.typeDisplayDivider} />
        {COLUMN_GROUPS.map((group) => (
          <fieldset key={group.label} className={styles.columnGroup}>
            <legend className={styles.columnGroupLegend}>{group.label}</legend>
            <ul className={styles.columnList}>
              {group.columnIds.map((id) => {
                const col = colById.get(id);
                if (!col) {
                  return null;
                }
                const isChecked = Boolean(visibility[id]);
                return (
                  <li key={id}>
                    <label className={styles.columnToggle}>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={isChecked}
                        onChange={() => toggleVisibility(id)}
                      />
                      <span className={styles.columnCheckbox} aria-hidden="true">
                        <D6Face size={16} />
                      </span>
                      <span className={styles.columnLabel}>
                        {typeof col.header === "string" ? col.header : id}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        ))}
        <div className={styles.columnActions}>
          <Button
            variant="ghost"
            onClick={() => {
              resetVisibility();
              resetSizing();
              resetTypeDisplay();
            }}
          >
            Reset to defaults
          </Button>
        </div>
      </fieldset>
    </AnimatedDetails>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test src/ui/EventTable/ColumnControlsPanel.test.tsx`

Expected: All 14 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/ui/EventTable/EventTable.module.css src/ui/EventTable/ColumnControlsPanel.tsx src/ui/EventTable/ColumnControlsPanel.test.tsx
git commit -m "feat(type-display): add radio indicator CSS and type display controls to ColumnControlsPanel"
```

---

### Task 7: Wire EventTable.tsx

**Files:**

- Modify: `src/ui/EventTable/EventTable.tsx`
- Modify: `src/components/SearchResults/SearchResults.test.tsx`

- [ ] **Step 1: Write failing tests**

Add to `src/components/SearchResults/SearchResults.test.tsx`:

```tsx
test("applies typeDisplayName class to EventTable section when mode is name", async () => {
  localStorage.setItem(
    "gen-con-buddy-type-display",
    JSON.stringify({ version: 1, value: { textMode: "name", showIcon: true } }),
  );
  const { container } = renderSearchResults();
  await screen.findAllByRole("row");
  expect(container.querySelector('[class*="typeDisplayName"]')).not.toBeNull();
});

test("applies typeHideIcon class to EventTable section when showTypeIcon is false", async () => {
  localStorage.setItem(
    "gen-con-buddy-type-display",
    JSON.stringify({ version: 1, value: { textMode: "name", showIcon: false } }),
  );
  const { container } = renderSearchResults();
  await screen.findAllByRole("row");
  expect(container.querySelector('[class*="typeHideIcon"]')).not.toBeNull();
});

test("no text mode class on EventTable section when typeDisplay is both", async () => {
  localStorage.setItem(
    "gen-con-buddy-type-display",
    JSON.stringify({ version: 1, value: { textMode: "both", showIcon: true } }),
  );
  const { container } = renderSearchResults();
  await screen.findAllByRole("row");
  // "both" applies no class — raw DOM shows everything
  expect(container.querySelector('[class*="typeDisplayCode"]')).toBeNull();
  expect(container.querySelector('[class*="typeDisplayName"]')).toBeNull();
});
```

- [ ] **Step 2: Run to verify tests fail**

Run: `npm test -- --reporter=verbose src/components/SearchResults/SearchResults.test.tsx 2>&1 | grep -E "applies typeDisplay|no text mode"`

Expected: All three FAIL — no elements with typeDisplayName/typeHideIcon classes found.

- [ ] **Step 3: Update EventTable.tsx**

1. Add these two imports after the existing hook imports:

```tsx
import { useTypeDisplay } from "../../hooks/useTypeDisplay";
import typeCellStyles from "./typeCell.module.css";
```

2. After the `resetSizing` line (around line 49), add the typeDisplay internal fallback and class computation:

```tsx
const internalTypeDisplay = useTypeDisplay();
const typeDisplay = sharedColumnState?.typeDisplay ?? internalTypeDisplay.typeDisplay;
const setTypeDisplay = sharedColumnState?.setTypeDisplay ?? internalTypeDisplay.setTypeDisplay;
const showTypeIcon = sharedColumnState?.showTypeIcon ?? internalTypeDisplay.showTypeIcon;
const setShowTypeIcon = sharedColumnState?.setShowTypeIcon ?? internalTypeDisplay.setShowTypeIcon;
const resetTypeDisplay = sharedColumnState?.resetTypeDisplay ?? internalTypeDisplay.reset;

const textClass =
  typeDisplay === "code"
    ? typeCellStyles.typeDisplayCode
    : typeDisplay === "name"
      ? typeCellStyles.typeDisplayName
      : undefined;
const iconClass = showTypeIcon ? undefined : typeCellStyles.typeHideIcon;
const typeDisplayClass = [textClass, iconClass].filter(Boolean).join(" ") || undefined;
```

3. Update `columnStateForPanel` (around line 143) to include the five new fields:

```tsx
const columnStateForPanel: SharedColumnState = {
  visibility,
  toggleVisibility,
  resetVisibility,
  sizing,
  setSizing,
  resetSizing,
  typeDisplay,
  setTypeDisplay,
  showTypeIcon,
  setShowTypeIcon,
  resetTypeDisplay,
};
```

4. Update the `<section>` opening tag in the JSX:

```tsx
      <section className={typeDisplayClass}>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test src/components/SearchResults/SearchResults.test.tsx`

Expected: All tests pass including the 3 new class tests.

- [ ] **Step 5: Commit**

```bash
git add src/ui/EventTable/EventTable.tsx src/components/SearchResults/SearchResults.test.tsx
git commit -m "feat(type-display): wire typeDisplay state into EventTable section className"
```

---

### Task 8: Wire SearchResults and ChangelogPage

**Files:**

- Modify: `src/components/SearchResults/SearchResults.tsx`
- Modify: `src/components/ChangelogPage/ChangelogPage.tsx`
- Modify: `src/components/SearchResults/SearchResults.test.tsx`

- [ ] **Step 1: Write failing integration tests**

Add to `src/components/SearchResults/SearchResults.test.tsx`:

```tsx
test("type display radio buttons are present with Name checked by default", async () => {
  renderSearchResults();
  await screen.findAllByRole("row");
  expect(screen.getByRole("radio", { name: "Code" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Name" })).toBeChecked();
  expect(screen.getByRole("radio", { name: "Both" })).toBeInTheDocument();
});

test("Show icon checkbox is present and checked by default", async () => {
  renderSearchResults();
  await screen.findAllByRole("row");
  expect(screen.getByRole("checkbox", { name: "Show icon" })).toBeChecked();
});

test("reset to defaults resets type display to name and icon shown", async () => {
  const user = userEvent.setup();
  localStorage.setItem(
    "gen-con-buddy-type-display",
    JSON.stringify({ version: 1, value: { textMode: "code", showIcon: false } }),
  );
  renderSearchResults();
  await screen.findAllByRole("row");
  expect(screen.getByRole("radio", { name: "Code" })).toBeChecked();
  await user.click(screen.getByRole("button", { name: "Reset to defaults" }));
  expect(screen.getByRole("radio", { name: "Name" })).toBeChecked();
  expect(screen.getByRole("checkbox", { name: "Show icon" })).toBeChecked();
});
```

- [ ] **Step 2: Run to verify tests fail**

Run: `npm test -- --reporter=verbose src/components/SearchResults/SearchResults.test.tsx 2>&1 | grep -E "type display radio|Show icon|reset to defaults resets type"`

Expected: FAIL — `Unable to find element with role 'radio'` (SearchResults hasn't wired ColumnControlsPanel to real type display state yet).

- [ ] **Step 3: Update SearchResults.tsx**

Replace `src/components/SearchResults/SearchResults.tsx`:

```tsx
import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "../../utils/api";
import { Pagination } from "../Pagination/Pagination";
import type { SearchParams } from "../../utils/types";
import { EmptyState } from "../../ui/EmptyState/EmptyState";
import { EventTable } from "../../ui/EventTable/EventTable";
import { EventListMobile } from "../../ui/EventTable/EventListMobile";
import { ColumnControlsPanel } from "../../ui/EventTable/ColumnControlsPanel";
import { useColumnVisibility } from "../../hooks/useColumnVisibility";
import { useColumnSizing } from "../../hooks/useColumnSizing";
import { useTypeDisplay } from "../../hooks/useTypeDisplay";
import styles from "./SearchResults.module.css";

interface SearchResultsProps {
  searchParams: SearchParams;
  onNavigate: (page: number, limit: number) => void;
  onSort: (sort: string | undefined) => void;
}

export function SearchResults({
  searchParams,
  onNavigate,
  onSort,
}: SearchResultsProps): JSX.Element {
  const page = searchParams.page ?? 1;
  const limit = searchParams.limit ?? 100;
  const { visibility, toggle: toggleVisibility, reset: resetVisibility } = useColumnVisibility();
  const { sizing, setSizing, reset: resetSizing } = useColumnSizing();
  const {
    typeDisplay,
    setTypeDisplay,
    showTypeIcon,
    setShowTypeIcon,
    reset: resetTypeDisplay,
  } = useTypeDisplay();
  const sharedColumnState = {
    visibility,
    toggleVisibility,
    resetVisibility,
    sizing,
    setSizing,
    resetSizing,
    typeDisplay,
    setTypeDisplay,
    showTypeIcon,
    setShowTypeIcon,
    resetTypeDisplay,
  };
  const { data, isLoading, isError } = useQuery({
    queryKey: ["events", searchParams],
    queryFn: () => fetchEvents(searchParams),
  });

  let activeSortField: string | undefined = undefined;
  let activeSortDir: "asc" | "desc" | undefined = undefined;
  if (searchParams.sort) {
    const [field, dir] = searchParams.sort.split(".");
    if (field && (dir === "asc" || dir === "desc")) {
      activeSortField = field;
      activeSortDir = dir;
    }
  }

  return (
    <section>
      {isLoading && <EmptyState variant="loading" text="LOADING QUESTS..." />}
      {isError && (
        <EmptyState
          variant="error"
          text="QUEST FAILED"
          subtext="Unable to load events. Please try again."
        />
      )}
      {data && data.data.length === 0 && (
        <EmptyState variant="empty" text="NO QUESTS FOUND" subtext="Try broadening your search." />
      )}
      {data && data.data.length > 0 && (
        <>
          <div className={styles.controlsBar}>
            <Pagination
              page={page}
              limit={limit}
              total={data.meta.total}
              onNavigate={onNavigate}
              aria-label="Pagination, top"
              singleLine
            />
          </div>
          <ColumnControlsPanel columnState={sharedColumnState} />
          <div className={styles.tableView}>
            <EventTable
              events={data.data}
              activeSortField={activeSortField}
              activeSortDir={activeSortDir}
              onSort={onSort}
              sharedColumnState={sharedColumnState}
              showColumnControls={false}
            />
          </div>
          <div className={styles.mobileView}>
            <EventListMobile
              events={data.data}
              typeDisplay={typeDisplay}
              showTypeIcon={showTypeIcon}
            />
          </div>
          <Pagination
            page={page}
            limit={limit}
            total={data.meta.total}
            onNavigate={onNavigate}
            aria-label="Pagination, bottom"
          />
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Update ChangelogPage.tsx**

Replace `src/components/ChangelogPage/ChangelogPage.tsx`:

```tsx
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useColumnSizing } from "../../hooks/useColumnSizing";
import { useColumnVisibility } from "../../hooks/useColumnVisibility";
import { useTypeDisplay } from "../../hooks/useTypeDisplay";
import { EmptyState } from "../../ui/EmptyState/EmptyState";
import { ColumnControlsPanel } from "../../ui/EventTable/ColumnControlsPanel";
import { fetchChangelogEntry, fetchChangelogList } from "../../utils/api";
import styles from "./ChangelogPage.module.css";
import { ChangelogRow } from "./ChangelogRow";

export function ChangelogPage(): JSX.Element {
  const queryClient = useQueryClient();
  const { visibility, toggle: toggleVisibility, reset: resetVisibility } = useColumnVisibility();
  const { sizing, setSizing, reset: resetSizing } = useColumnSizing();
  const {
    typeDisplay,
    setTypeDisplay,
    showTypeIcon,
    setShowTypeIcon,
    reset: resetTypeDisplay,
  } = useTypeDisplay();
  const sharedColumnState = {
    visibility,
    toggleVisibility,
    resetVisibility,
    sizing,
    setSizing,
    resetSizing,
    typeDisplay,
    setTypeDisplay,
    showTypeIcon,
    setShowTypeIcon,
    resetTypeDisplay,
  };
  const {
    data: summaries = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["changelog", "list"],
    queryFn: () => fetchChangelogList(),
  });

  useEffect(() => {
    if (summaries.length > 0) {
      void queryClient.prefetchQuery({
        queryKey: ["changelog", "entry", summaries[0].id],
        queryFn: () => fetchChangelogEntry(summaries[0].id),
      });
    }
  }, [summaries, queryClient]);

  const handleOpen = (index: number): void => {
    const next = summaries[index + 1];
    if (next) {
      void queryClient.prefetchQuery({
        queryKey: ["changelog", "entry", next.id],
        queryFn: () => fetchChangelogEntry(next.id),
      });
    }
  };

  return (
    <main className={styles.page}>
      {isLoading && <EmptyState variant="loading" text="LOADING CHANGELOG…" />}
      {isError && <p>Could not load changelog. Try refreshing.</p>}
      {!isLoading && !isError && summaries.length === 0 && <p>No changelog entries yet.</p>}
      {summaries.length > 0 && (
        <>
          <h1 className={styles.heading}>Changelog</h1>
          <ColumnControlsPanel columnState={sharedColumnState} />
          <section className={styles.changelogSection}>
            {summaries.map((summary, i) => (
              <ChangelogRow
                key={summary.id}
                summary={summary}
                onOpen={() => handleOpen(i)}
                sharedColumnState={sharedColumnState}
              />
            ))}
          </section>
        </>
      )}
    </main>
  );
}
```

- [ ] **Step 5: Run all tests**

Run: `npm test`

Expected: All 37 test files pass. Total tests should be roughly 447 + the new tests added across this plan.

- [ ] **Step 6: Final type check and lint**

Run: `npm run typecheck && npm run lint`

Expected: No errors or new warnings.

- [ ] **Step 7: Commit**

```bash
git add src/components/SearchResults/SearchResults.tsx src/components/ChangelogPage/ChangelogPage.tsx src/components/SearchResults/SearchResults.test.tsx
git commit -m "feat(type-display): wire useTypeDisplay into SearchResults and ChangelogPage"
```
