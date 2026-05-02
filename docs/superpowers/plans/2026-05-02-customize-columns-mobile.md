# Customize Columns Mobile Support — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire column visibility state into the mobile list view and expose it via a drawer on mobile, using the same shared preferences as the desktop table.

**Architecture:** `ColumnControlsPanel` gains a `variant?: "inline" | "drawer"` prop (default `"inline"`). `SearchResults` places `variant="inline"` inside `.tableView` and `variant="drawer"` inside `.mobileView`, letting the existing CSS breakpoint switching handle visibility — no JS media-query detection needed. `EventListMobile` gains a `visibility?: Record<string, boolean>` prop; every field is shown if `visibility[id] !== false`, with no special-cased columns. Meta bar fields (eventType, time group, players, tickets) render inline; all other visible columns render as a `<dl>` detail section.

**Tech Stack:** React, TypeScript, CSS Modules, TanStack Router, Base UI `Dialog`, Vitest, `@testing-library/react`, `@testing-library/user-event`

---

### Task 1: Export COLUMN_VISIBILITY_DEFAULTS from useColumnVisibility

**Files:**

- Modify: `src/hooks/useColumnVisibility.ts`

- [ ] **Step 1: Rename and export the defaults constant**

Open `src/hooks/useColumnVisibility.ts`. Rename the internal `DEFAULTS` const to `COLUMN_VISIBILITY_DEFAULTS` and add `export`:

```ts
export const COLUMN_VISIBILITY_DEFAULTS: Record<string, boolean> = {
  gameId: false,
  title: true,
  eventType: true,
  group: false,
  shortDescription: true,
  longDescription: false,
  gameSystem: false,
  rulesEdition: false,
  minPlayers: true,
  maxPlayers: true,
  ageRequired: false,
  experienceRequired: false,
  materialsProvided: false,
  materialsRequired: false,
  materialsRequiredDetails: false,
  day: true,
  startDateTime: true,
  duration: false,
  endDateTime: true,
  gmNames: false,
  website: false,
  email: false,
  tournament: false,
  roundNumber: false,
  totalRounds: false,
  minimumPlayTime: false,
  attendeeRegistration: false,
  cost: false,
  location: false,
  roomName: false,
  tableNumber: false,
  specialCategory: false,
  ticketsAvailable: true,
  lastModified: false,
};
```

Update the two internal uses of the old `DEFAULTS` name inside `useColumnVisibility`:

```ts
const [visibility, setVisibility] = useStoredState(STORAGE_KEY, VERSION, {
  ...COLUMN_VISIBILITY_DEFAULTS,
});

const reset = (): void => {
  setVisibility({ ...COLUMN_VISIBILITY_DEFAULTS });
};
```

- [ ] **Step 2: Run existing hook tests**

```
npx vitest run src/hooks/useColumnVisibility.test.ts
```

Expected: all tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useColumnVisibility.ts
git commit -m "refactor(columns): export COLUMN_VISIBILITY_DEFAULTS from useColumnVisibility"
```

---

### Task 2: EventListMobile — conditional meta bar fields (TDD)

**Files:**

- Modify: `src/ui/EventTable/EventListMobile.test.tsx`
- Modify: `src/ui/EventTable/EventListMobile.tsx`

- [ ] **Step 1: Update renderList and add failing tests**

Open `src/ui/EventTable/EventListMobile.test.tsx`. Update the `renderList` helper to accept a `visibility` parameter:

```tsx
async function renderList(
  events: Event[] = [makeEvent()],
  visibility?: Record<string, boolean>,
): Promise<ReturnType<typeof render>> {
  const rootRoute = createRootRoute({
    component: () => <EventListMobile events={events} visibility={visibility} />,
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

Add these tests at the bottom of the file:

```tsx
test("hides title when visibility.title is false", async () => {
  await renderList([makeEvent({ title: "Dragon Hunt" })], { title: false });
  expect(screen.queryByText("Dragon Hunt")).not.toBeInTheDocument();
});

test("shows title when visibility.title is true", async () => {
  await renderList([makeEvent({ title: "Dragon Hunt" })], { title: true });
  expect(screen.getByText("Dragon Hunt")).toBeInTheDocument();
});

test("hides event type when visibility.eventType is false", async () => {
  await renderList([makeEvent({ eventType: "TCG" })], { eventType: false });
  expect(screen.queryByText("TCG")).not.toBeInTheDocument();
});

test("hides tickets when visibility.ticketsAvailable is false", async () => {
  await renderList([makeEvent({ ticketsAvailable: 5 })], { ticketsAvailable: false });
  expect(screen.queryByText("5 tickets")).not.toBeInTheDocument();
});

test("hides day but shows start time when only startDateTime is visible", async () => {
  await renderList([makeEvent()], { day: false, startDateTime: true, endDateTime: false });
  expect(screen.queryByText(/Thu/)).not.toBeInTheDocument();
  expect(screen.getByText(/06:00/)).toBeInTheDocument();
});

test("hides all time info when day, startDateTime, and endDateTime are all false", async () => {
  await renderList([makeEvent()], { day: false, startDateTime: false, endDateTime: false });
  expect(screen.queryByText(/Thu/)).not.toBeInTheDocument();
  expect(screen.queryByText(/06:00/)).not.toBeInTheDocument();
});

test("hides player count when both minPlayers and maxPlayers are false", async () => {
  await renderList([makeEvent({ minPlayers: 2, maxPlayers: 6 })], {
    minPlayers: false,
    maxPlayers: false,
  });
  expect(screen.queryByText("2–6")).not.toBeInTheDocument();
});

test("shows only minPlayers value when maxPlayers is hidden", async () => {
  await renderList([makeEvent({ minPlayers: 2, maxPlayers: 6 })], {
    minPlayers: true,
    maxPlayers: false,
  });
  expect(screen.getByText("2")).toBeInTheDocument();
  expect(screen.queryByText("2–6")).not.toBeInTheDocument();
});

test("shows only maxPlayers value when minPlayers is hidden", async () => {
  await renderList([makeEvent({ minPlayers: 2, maxPlayers: 6 })], {
    minPlayers: false,
    maxPlayers: true,
  });
  expect(screen.getByText("6")).toBeInTheDocument();
  expect(screen.queryByText("2–6")).not.toBeInTheDocument();
});

test("uses COLUMN_VISIBILITY_DEFAULTS when no visibility prop is passed", async () => {
  await renderList([makeEvent({ title: "Dragon Hunt" })]);
  expect(screen.getByText("Dragon Hunt")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to confirm new tests fail**

```
npx vitest run src/ui/EventTable/EventListMobile.test.tsx
```

Expected: new tests FAIL (component doesn't accept `visibility` yet), existing tests PASS.

- [ ] **Step 3: Implement conditional meta bar in EventListMobile.tsx**

Replace the entire contents of `src/ui/EventTable/EventListMobile.tsx` with:

```tsx
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import type { Event } from "../../utils/types";
import { EVENT_TYPE_ICONS } from "../icons/eventTypeIcons";
import { COLUMN_VISIBILITY_DEFAULTS } from "../../hooks/useColumnVisibility";
import styles from "./EventListMobile.module.css";

interface EventListMobileProps {
  events: Event[];
  visibility?: Record<string, boolean>;
}

export function EventListMobile({ events, visibility }: EventListMobileProps): JSX.Element {
  const vis = visibility ?? COLUMN_VISIBILITY_DEFAULTS;
  const isVisible = (id: string): boolean => vis[id] !== false;

  return (
    <ul role="list" className={styles.list}>
      {events.map((event) => {
        const a = event.attributes;
        const start = new Date(a.startDateTime);
        const end = new Date(a.endDateTime);

        let playersText: string | null = null;
        if (isVisible("minPlayers") && isVisible("maxPlayers")) {
          playersText =
            a.minPlayers === a.maxPlayers
              ? String(a.minPlayers)
              : `${a.minPlayers}–${a.maxPlayers}`;
        } else if (isVisible("minPlayers")) {
          playersText = String(a.minPlayers);
        } else if (isVisible("maxPlayers")) {
          playersText = String(a.maxPlayers);
        }

        const TypeIcon = EVENT_TYPE_ICONS[a.eventType.split(" - ")[0]];
        const showTime = isVisible("day") || isVisible("startDateTime") || isVisible("endDateTime");
        const showMeta =
          isVisible("eventType") ||
          showTime ||
          playersText !== null ||
          isVisible("ticketsAvailable");

        return (
          <li key={event.id} className={styles.item}>
            <Link to="/event/$id" params={{ id: a.gameId }} className={styles.row}>
              {isVisible("title") && <span className={styles.title}>{a.title}</span>}
              {showMeta && (
                <span className={styles.meta}>
                  {isVisible("eventType") && (
                    <span className={styles.typeTag}>
                      {TypeIcon && <TypeIcon size={14} />}
                      {a.eventType}
                    </span>
                  )}
                  {showTime && (
                    <span className={styles.when}>
                      {isVisible("day") && format(start, "EEE")}
                      {isVisible("day") &&
                        (isVisible("startDateTime") || isVisible("endDateTime")) &&
                        " "}
                      {isVisible("startDateTime") && format(start, "HH:mm")}
                      {isVisible("startDateTime") && isVisible("endDateTime") && "–"}
                      {isVisible("endDateTime") && format(end, "HH:mm")}
                    </span>
                  )}
                  {playersText !== null && <span>{playersText}</span>}
                  {isVisible("ticketsAvailable") && (
                    <span className={a.ticketsAvailable === 0 ? styles.soldOut : undefined}>
                      {a.ticketsAvailable > 0
                        ? `${a.ticketsAvailable} ticket${a.ticketsAvailable !== 1 ? "s" : ""}`
                        : "Sold out"}
                    </span>
                  )}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
```

- [ ] **Step 4: Run tests to confirm all pass**

```
npx vitest run src/ui/EventTable/EventListMobile.test.tsx
```

Expected: ALL tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/EventTable/EventListMobile.tsx src/ui/EventTable/EventListMobile.test.tsx
git commit -m "feat(mobile): make EventListMobile meta bar fields respect column visibility"
```

---

### Task 3: EventListMobile — extra detail rows for all other columns (TDD)

**Files:**

- Modify: `src/ui/EventTable/EventListMobile.test.tsx`
- Modify: `src/ui/EventTable/EventListMobile.tsx`
- Modify: `src/ui/EventTable/EventListMobile.module.css`

- [ ] **Step 1: Add failing tests for extra detail rows**

Add these tests at the bottom of `src/ui/EventTable/EventListMobile.test.tsx`:

```tsx
test("shows location as a detail row when visibility.location is true", async () => {
  await renderList([makeEvent({ location: "ICC" })], { location: true });
  expect(screen.getByText("Location")).toBeInTheDocument();
  expect(screen.getByText("ICC")).toBeInTheDocument();
});

test("does not show location detail row when visibility.location is false", async () => {
  await renderList([makeEvent({ location: "ICC" })], { location: false });
  expect(screen.queryByText("Location")).not.toBeInTheDocument();
});

test("shows cost formatted with dollar sign as a detail row", async () => {
  await renderList([makeEvent({ cost: 4 })], { cost: true });
  expect(screen.getByText("Cost")).toBeInTheDocument();
  expect(screen.getByText("$4.00")).toBeInTheDocument();
});

test("shows shortDescription as a detail row when toggled on", async () => {
  await renderList([makeEvent({ shortDescription: "Quick fun" })], { shortDescription: true });
  expect(screen.getByText("Short Description")).toBeInTheDocument();
  expect(screen.getByText("Quick fun")).toBeInTheDocument();
});

test("shows gameId as a detail row when toggled on", async () => {
  await renderList([makeEvent({ gameId: "RPG24000001" })], { gameId: true });
  expect(screen.getByText("Game ID")).toBeInTheDocument();
  expect(screen.getByText("RPG24000001")).toBeInTheDocument();
});

test("does not render a dl element when no extra columns are toggled on", async () => {
  const { container } = await renderList([makeEvent()], {});
  expect(container.querySelector("dl")).toBeNull();
});
```

- [ ] **Step 2: Run tests to confirm new tests fail**

```
npx vitest run src/ui/EventTable/EventListMobile.test.tsx
```

Expected: new tests FAIL, existing tests PASS.

- [ ] **Step 3: Add extra columns imports and helpers to EventListMobile.tsx**

At the top of `src/ui/EventTable/EventListMobile.tsx`, update the imports to add:

```tsx
import { COLUMNS, COLUMN_GROUPS } from "./columns";
import { EXP } from "../../utils/enums";
```

After the imports and before the `EventListMobileProps` interface, add these module-level constants and the value-extractor function:

```tsx
const META_COLUMN_IDS = new Set([
  "eventType",
  "day",
  "startDateTime",
  "endDateTime",
  "minPlayers",
  "maxPlayers",
  "ticketsAvailable",
]);

const COL_BY_ID = new Map(
  COLUMNS.filter((c) => c.id !== undefined).map((c) => [c.id as string, c]),
);

const EXTRA_COLUMN_IDS = COLUMN_GROUPS.flatMap((g) => g.columnIds).filter(
  (id) => id !== "title" && !META_COLUMN_IDS.has(id),
);

function getMobileValue(id: string, a: Event["attributes"]): string {
  switch (id) {
    case "gameId":
      return a.gameId;
    case "group":
      return a.group;
    case "shortDescription":
      return a.shortDescription;
    case "longDescription":
      return a.longDescription;
    case "gameSystem":
      return a.gameSystem;
    case "rulesEdition":
      return a.rulesEdition;
    case "specialCategory":
      return a.specialCategory;
    case "ageRequired":
      return a.ageRequired;
    case "experienceRequired":
      return EXP[a.experienceRequired] ?? a.experienceRequired;
    case "tournament":
      return a.tournament;
    case "roundNumber":
      return String(a.roundNumber);
    case "totalRounds":
      return String(a.totalRounds);
    case "duration":
      return `${a.duration}h`;
    case "minimumPlayTime":
      return `${a.minimumPlayTime}h`;
    case "location":
      return a.location;
    case "roomName":
      return a.roomName;
    case "tableNumber":
      return a.tableNumber;
    case "cost":
      return `$${a.cost.toFixed(2)}`;
    case "attendeeRegistration":
      return a.attendeeRegistration;
    case "materialsProvided":
      return a.materialsProvided;
    case "materialsRequired":
      return a.materialsRequired;
    case "materialsRequiredDetails":
      return a.materialsRequiredDetails;
    case "gmNames":
      return a.gmNames;
    case "website":
      return a.website;
    case "email":
      return a.email;
    case "lastModified":
      return format(new Date(a.lastModified), "yyyy-MM-dd");
    default:
      return "";
  }
}
```

- [ ] **Step 4: Add extra fields computation and rendering inside the map callback**

Inside the `events.map` callback in `EventListMobile`, add this computation after `showMeta` and before the `return`:

```tsx
const extraFields = EXTRA_COLUMN_IDS.filter((id) => isVisible(id))
  .map((id) => {
    const col = COL_BY_ID.get(id);
    const label = typeof col?.header === "string" ? col.header : id;
    const value = getMobileValue(id, a);
    return { id, label, value };
  })
  .filter(({ value }) => value !== "");
```

Inside the `<Link>`, after the `{showMeta && (...)}` block, add:

```tsx
{
  extraFields.length > 0 && (
    <dl className={styles.details}>
      {extraFields.map(({ id, label, value }) => (
        <div key={id} className={styles.detailRow}>
          <dt className={styles.detailTerm}>{label}</dt>
          <dd className={styles.detailValue}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
```

- [ ] **Step 5: Add CSS for the detail section**

Append to `src/ui/EventTable/EventListMobile.module.css`:

```css
.details {
  margin: var(--space-1) 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.detailRow {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0 var(--space-2);
  align-items: baseline;
}

.detailTerm {
  font-family: var(--font-slab);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05rem;
  text-transform: uppercase;
  color: var(--color-ink-faint);
}

.detailValue {
  font-size: 0.875rem;
  color: var(--color-ink-muted);
}
```

- [ ] **Step 6: Run tests to confirm all pass**

```
npx vitest run src/ui/EventTable/EventListMobile.test.tsx
```

Expected: ALL tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/ui/EventTable/EventListMobile.tsx src/ui/EventTable/EventListMobile.module.css src/ui/EventTable/EventListMobile.test.tsx
git commit -m "feat(mobile): add extra column detail rows to EventListMobile"
```

---

### Task 4: Wire EventListMobile visibility from SearchResults

**Files:**

- Modify: `src/components/SearchResults/SearchResults.tsx`

- [ ] **Step 1: Pass visibility prop to EventListMobile**

In `src/components/SearchResults/SearchResults.tsx`, find the `<EventListMobile events={data.data} />` line and update it:

```tsx
<EventListMobile events={data.data} visibility={sharedColumnState.visibility} />
```

- [ ] **Step 2: Run the full test suite**

```
npx vitest run src/components/SearchResults/SearchResults.test.tsx src/ui/EventTable/EventListMobile.test.tsx
```

Expected: ALL tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/SearchResults/SearchResults.tsx
git commit -m "feat(mobile): pass column visibility from SearchResults to EventListMobile"
```

---

### Task 5: Extract ColumnCheckboxContent from ColumnControlsPanel

**Files:**

- Modify: `src/ui/EventTable/ColumnControlsPanel.tsx`

This is a pure refactor — no behaviour change, no new tests needed. The existing tests must continue to pass.

- [ ] **Step 1: Extract the inner JSX into ColumnCheckboxContent**

Replace the full contents of `src/ui/EventTable/ColumnControlsPanel.tsx` with:

```tsx
import { ChevronRight, X } from "lucide-react";
import { Button } from "../Button/Button";
import type { SharedColumnState } from "./types";
import { AnimatedDetails } from "../AnimatedDetails/AnimatedDetails";
import { D6Face } from "../icons/D6Face";
import { COLUMNS, COLUMN_GROUPS } from "./columns";
import styles from "./EventTable.module.css";

interface ColumnControlsPanelProps {
  columnState: SharedColumnState;
  variant?: "inline" | "drawer";
}

function ColumnCheckboxContent({ columnState }: { columnState: SharedColumnState }): JSX.Element {
  const { visibility, toggleVisibility, resetVisibility, resetSizing } = columnState;
  const colById = new Map(COLUMNS.filter((c) => c.id !== undefined).map((c) => [c.id, c]));

  return (
    <fieldset className={styles.columnFieldset}>
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
          }}
        >
          Reset to defaults
        </Button>
      </div>
    </fieldset>
  );
}

export function ColumnControlsPanel({
  columnState,
  variant = "inline",
}: ColumnControlsPanelProps): JSX.Element {
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
      <ColumnCheckboxContent columnState={columnState} />
    </AnimatedDetails>
  );
}
```

(Note: `X` and `variant` are imported/defined now — they are used in the next task.)

- [ ] **Step 2: Run existing tests**

```
npx vitest run src/ui/EventTable/ColumnControlsPanel.test.tsx
```

Expected: ALL tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/ui/EventTable/ColumnControlsPanel.tsx
git commit -m "refactor(columns): extract ColumnCheckboxContent for reuse in drawer variant"
```

---

### Task 6: Add drawer variant to ColumnControlsPanel (TDD)

**Files:**

- Modify: `src/ui/EventTable/ColumnControlsPanel.test.tsx`
- Modify: `src/ui/EventTable/ColumnControlsPanel.tsx`
- Modify: `src/ui/EventTable/EventTable.module.css`

- [ ] **Step 1: Add failing tests for the drawer variant**

Add the following import at the top of `src/ui/EventTable/ColumnControlsPanel.test.tsx`, alongside the existing imports:

```tsx
import userEvent from "@testing-library/user-event";
```

Add these tests at the bottom of the file:

```tsx
test("variant=drawer renders a Customize columns button", () => {
  render(<ColumnControlsPanel columnState={makeColumnState()} variant="drawer" />);
  expect(screen.getByRole("button", { name: "Customize columns" })).toBeInTheDocument();
});

test("variant=drawer does not show column groups before the button is clicked", () => {
  render(<ColumnControlsPanel columnState={makeColumnState()} variant="drawer" />);
  expect(screen.queryByRole("group", { name: "The Event" })).not.toBeInTheDocument();
});

test("variant=drawer opens dialog showing all column groups on button click", async () => {
  const user = userEvent.setup();
  render(<ColumnControlsPanel columnState={makeColumnState()} variant="drawer" />);
  await user.click(screen.getByRole("button", { name: "Customize columns" }));
  expect(screen.getByRole("group", { name: "The Event" })).toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Players" })).toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Logistics" })).toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Contact" })).toBeInTheDocument();
});

test("variant=drawer shows column checkboxes inside the opened dialog", async () => {
  const user = userEvent.setup();
  render(<ColumnControlsPanel columnState={makeColumnState()} variant="drawer" />);
  await user.click(screen.getByRole("button", { name: "Customize columns" }));
  expect(screen.getByRole("checkbox", { name: "Title" })).toBeInTheDocument();
});

test("variant=drawer Close button dismisses the dialog", async () => {
  const user = userEvent.setup();
  render(<ColumnControlsPanel columnState={makeColumnState()} variant="drawer" />);
  await user.click(screen.getByRole("button", { name: "Customize columns" }));
  expect(screen.getByRole("group", { name: "The Event" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("group", { name: "The Event" })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to confirm new tests fail**

```
npx vitest run src/ui/EventTable/ColumnControlsPanel.test.tsx
```

Expected: new tests FAIL, existing tests PASS.

- [ ] **Step 3: Add drawer CSS to EventTable.module.css**

Append to `src/ui/EventTable/EventTable.module.css`:

```css
/* ─── Column Controls Drawer (mobile) ───────────────────────────────────── */
.columnsBackdrop {
  position: fixed;
  inset: 0;
  z-index: calc(var(--z-modal) - 1);
  background: oklch(22% 0.03 48deg / 0.4);
  cursor: pointer;
  opacity: 1;
  transition: opacity var(--motion-expand);
}

.columnsBackdrop[data-starting-style],
.columnsBackdrop[data-ending-style] {
  opacity: 0;
}

.columnsDrawer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--size-drawer);
  z-index: var(--z-modal);
  display: flex;
  flex-direction: column;
  background: var(--color-surface-panel);
  border-right: 0.0625rem solid var(--color-ink-border);
  transform: translateX(0);
  transition: transform var(--motion-expand);
}

.columnsDrawer[data-starting-style],
.columnsDrawer[data-ending-style] {
  transform: translateX(-100%);
}

@media (width <= 60rem) {
  .columnsDrawer {
    width: min(80vw, var(--size-drawer));
  }
}

.columnsDrawerHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 0.0625rem solid var(--color-ink-divider);
  flex-shrink: 0;
}

.columnsDrawerTitle {
  font-family: var(--font-slab);
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: 0.05rem;
  text-transform: uppercase;
  color: var(--color-ink-muted);
}

.columnsDrawerScroll {
  flex: 1;
  overflow-y: scroll;
  padding: var(--space-3) var(--space-4);
}
```

- [ ] **Step 4: Implement the drawer branch in ColumnControlsPanel.tsx**

Add the Dialog import at the top of `src/ui/EventTable/ColumnControlsPanel.tsx`:

```tsx
import { Dialog } from "@base-ui/react/dialog";
```

Replace the `ColumnControlsPanel` export function with this version that branches on `variant`:

```tsx
export function ColumnControlsPanel({
  columnState,
  variant = "inline",
}: ColumnControlsPanelProps): JSX.Element {
  if (variant === "drawer") {
    return (
      <Dialog.Root>
        <Dialog.Trigger
          render={
            <Button type="button" variant="secondary">
              Customize columns
            </Button>
          }
        />
        <Dialog.Portal>
          <Dialog.Backdrop className={styles.columnsBackdrop} />
          <Dialog.Popup className={styles.columnsDrawer}>
            <div className={styles.columnsDrawerHeader}>
              <Dialog.Title className={styles.columnsDrawerTitle}>Customize columns</Dialog.Title>
              <Dialog.Close
                render={
                  <Button type="button" variant="ghost" icon aria-label="Close">
                    <X size={16} />
                  </Button>
                }
              />
            </div>
            <div className={styles.columnsDrawerScroll}>
              <ColumnCheckboxContent columnState={columnState} />
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

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
      <ColumnCheckboxContent columnState={columnState} />
    </AnimatedDetails>
  );
}
```

- [ ] **Step 5: Run tests to confirm all pass**

```
npx vitest run src/ui/EventTable/ColumnControlsPanel.test.tsx
```

Expected: ALL tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/ui/EventTable/ColumnControlsPanel.tsx src/ui/EventTable/EventTable.module.css src/ui/EventTable/ColumnControlsPanel.test.tsx
git commit -m "feat(columns): add drawer variant to ColumnControlsPanel for mobile"
```

---

### Task 7: Split ColumnControlsPanel by view in SearchResults

**Files:**

- Modify: `src/components/SearchResults/SearchResults.tsx`
- Modify: `src/components/SearchResults/SearchResults.module.css`

- [ ] **Step 1: Move ColumnControlsPanel into the view divs**

In `src/components/SearchResults/SearchResults.tsx`, replace:

```tsx
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
  <EventListMobile events={data.data} visibility={sharedColumnState.visibility} />
</div>
```

with:

```tsx
<div className={styles.tableView}>
  <ColumnControlsPanel variant="inline" columnState={sharedColumnState} />
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
  <ColumnControlsPanel variant="drawer" columnState={sharedColumnState} />
  <EventListMobile events={data.data} visibility={sharedColumnState.visibility} />
</div>
```

- [ ] **Step 2: Remove the stale margin-top from .tableView**

In `src/components/SearchResults/SearchResults.module.css`, remove the `margin-top: -0.0625rem` from `.tableView`. The `ColumnControlsPanel` is now inside `.tableView`, so the EventTable's own internal `margin-top: -0.0625rem` on `.tableWrapper` handles the border collapse between the panel and the table. If `.tableView {}` ends up empty, delete the entire block (the class is still referenced in the `@media` rule below it, so CSS Modules won't complain).

- [ ] **Step 3: Run the full test suite**

```
npx vitest run
```

Expected: ALL tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/SearchResults/SearchResults.tsx src/components/SearchResults/SearchResults.module.css
git commit -m "feat(mobile): split ColumnControlsPanel by view — inline for desktop, drawer for mobile"
```
