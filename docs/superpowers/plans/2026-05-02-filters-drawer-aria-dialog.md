# Filters Drawer → Base UI ARIA Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hand-rolled filters drawer in `SearchForm` with Base UI `Dialog` primitives to gain `role="dialog"`, focus trap, Escape key handling, and focus restoration automatically.

**Architecture:** `Dialog.Root` wraps the `SearchForm` output (no extra DOM node). The Filters button becomes `Dialog.Trigger render={<Button>}`. The drawer and backdrop render through `Dialog.Portal` to `document.body`. `keepMounted` keeps the drawer in DOM so the CSS slide animation can run; Base UI's `[data-starting-style]` / `[data-ending-style]` data attributes drive enter/exit transitions.

**Tech Stack:** React, Base UI (`@base-ui/react/dialog`), React Hook Form, Vitest, Testing Library

---

## File Map

| File                                              | Change                                                                                  |
| ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `src/components/SearchForm/SearchForm.test.tsx`   | Add 4 new dialog-behavior tests; update 7 existing field tests to open dialog first     |
| `src/components/SearchForm/SearchForm.tsx`        | Swap to Dialog primitives; remove `useState(drawerOpen)`                                |
| `src/components/SearchForm/SearchForm.module.css` | Replace `data-open="true"` animation with `[data-starting-style]`/`[data-ending-style]` |

---

## Task 1: Write new failing dialog-behavior tests

**Files:**

- Modify: `src/components/SearchForm/SearchForm.test.tsx`

- [ ] **Step 1: Add the 4 new tests at the end of the test file**

These tests will FAIL with the current implementation because there is no `role="dialog"` on the drawer.

```tsx
test("filters drawer has role=dialog with accessible name when open", async () => {
  const user = userEvent.setup();
  render(<SearchForm values={{}} onSearch={noop} />);
  await user.click(screen.getByRole("button", { name: "Filters" }));
  expect(screen.getByRole("dialog", { name: "Advanced Filters" })).toBeInTheDocument();
});

test("Escape key closes the filters dialog", async () => {
  const user = userEvent.setup();
  render(<SearchForm values={{}} onSearch={noop} />);
  await user.click(screen.getByRole("button", { name: "Filters" }));
  expect(screen.getByRole("dialog", { name: "Advanced Filters" })).toBeInTheDocument();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog", { name: "Advanced Filters" })).not.toBeInTheDocument();
});

test("clicking the backdrop closes the filters dialog", async () => {
  const user = userEvent.setup();
  render(<SearchForm values={{}} onSearch={noop} />);
  await user.click(screen.getByRole("button", { name: "Filters" }));
  expect(screen.getByRole("dialog", { name: "Advanced Filters" })).toBeInTheDocument();
  await user.click(screen.getByTestId("drawer-backdrop"));
  expect(screen.queryByRole("dialog", { name: "Advanced Filters" })).not.toBeInTheDocument();
});

test("clicking the close button closes the filters dialog", async () => {
  const user = userEvent.setup();
  render(<SearchForm values={{}} onSearch={noop} />);
  await user.click(screen.getByRole("button", { name: "Filters" }));
  expect(screen.getByRole("dialog", { name: "Advanced Filters" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Close advanced filters" }));
  expect(screen.queryByRole("dialog", { name: "Advanced Filters" })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the new tests and confirm they fail**

```bash
npx vitest run src/components/SearchForm/SearchForm.test.tsx
```

Expected: The 4 new tests FAIL with "Unable to find an accessible element with the role 'dialog'". All prior tests still pass.

---

## Task 2: Update existing field tests to open the dialog first

**Why:** After migration, `Dialog.Popup keepMounted` will have the HTML `hidden` attribute when closed, removing its contents from the accessibility tree. `getByRole` will not find inputs inside the closed dialog. Tests must open the dialog before querying drawer fields.

**These tests currently PASS, and must continue to pass** with the current code after being updated (clicking Filters currently opens the drawer, making the fields accessible).

**Files:**

- Modify: `src/components/SearchForm/SearchForm.test.tsx`

- [ ] **Step 3: Replace the 7 affected tests with these updated versions**

Find and replace each test by its name. The changes: make async where needed, add `await user.click(screen.getByRole("button", { name: "Filters" }))` before querying drawer fields, close dialog before clicking Search.

```tsx
test("renders advanced filter fields in the form", async () => {
  const user = userEvent.setup();
  render(<SearchForm values={{}} onSearch={noop} />);
  await user.click(screen.getByRole("button", { name: "Filters" }));
  expect(screen.getByRole("textbox", { name: "Title" })).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Game ID" })).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Location" })).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Materials Required Details" })).toBeInTheDocument();
});

test("Tournament and Materials Required render as select dropdowns", async () => {
  const user = userEvent.setup();
  render(<SearchForm values={{}} onSearch={noop} />);
  await user.click(screen.getByRole("button", { name: "Filters" }));
  expect(screen.getByRole("combobox", { name: "Tournament" })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Materials Required" })).toBeInTheDocument();
});

test("selecting Yes for Tournament submits correct value", async () => {
  const user = userEvent.setup();
  const handleSearch = vi.fn<(values: SearchFormValues) => void>();
  render(<SearchForm values={{}} onSearch={handleSearch} />);

  await user.click(screen.getByRole("button", { name: "Filters" }));
  await user.selectOptions(screen.getByRole("combobox", { name: "Tournament" }), "Yes");
  await user.click(screen.getByRole("button", { name: "Close advanced filters" }));
  await user.click(screen.getByRole("button", { name: "Search" }));

  expect(handleSearch.mock.calls[0][0].tournament).toBe("Yes");
});

test("selecting Yes for Materials Required submits correct value", async () => {
  const user = userEvent.setup();
  const handleSearch = vi.fn<(values: SearchFormValues) => void>();
  render(<SearchForm values={{}} onSearch={handleSearch} />);

  await user.click(screen.getByRole("button", { name: "Filters" }));
  await user.selectOptions(screen.getByRole("combobox", { name: "Materials Required" }), "Yes");
  await user.click(screen.getByRole("button", { name: "Close advanced filters" }));
  await user.click(screen.getByRole("button", { name: "Search" }));

  expect(handleSearch.mock.calls[0][0].materialsRequired).toBe("Yes");
});

test("populates fields from values", async () => {
  const user = userEvent.setup();
  render(<SearchForm values={{ title: "Dungeon Crawl" }} onSearch={noop} />);
  await user.click(screen.getByRole("button", { name: "Filters" }));
  expect(screen.getByRole("textbox", { name: "Title" })).toHaveValue("Dungeon Crawl");
});

test("submits with the title value passed to onSearch", async () => {
  const user = userEvent.setup();
  const handleSearch = vi.fn<(values: SearchFormValues) => void>();
  render(<SearchForm values={{}} onSearch={handleSearch} />);

  await user.click(screen.getByRole("button", { name: "Filters" }));
  await user.type(screen.getByRole("textbox", { name: "Title" }), "Dragons");
  await user.click(screen.getByRole("button", { name: "Close advanced filters" }));
  await user.click(screen.getByRole("button", { name: "Search" }));

  expect(handleSearch).toHaveBeenCalledTimes(1);
  expect(handleSearch.mock.calls[0][0]).toMatchObject({ title: "Dragons" });
});

test("reset button clears all form fields", async () => {
  const user = userEvent.setup();
  render(<SearchForm values={{ title: "Dungeon Crawl", filter: "dragon" }} onSearch={noop} />);

  await user.click(screen.getByRole("button", { name: "Reset" }));

  expect(screen.getByRole("textbox", { name: "Search" })).toHaveValue("");
  await user.click(screen.getByRole("button", { name: "Filters" }));
  expect(screen.getByRole("textbox", { name: "Title" })).toHaveValue("");
});
```

- [ ] **Step 4: Run all tests and confirm the updated tests still pass**

```bash
npx vitest run src/components/SearchForm/SearchForm.test.tsx
```

Expected: all tests that existed before Task 1 still PASS. The 4 new dialog-behavior tests still FAIL.

- [ ] **Step 5: Commit**

```bash
git add src/components/SearchForm/SearchForm.test.tsx
git commit -m "test(search-form): add dialog-behavior tests and open drawer before querying fields"
```

---

## Task 3: Migrate SearchForm.tsx to Base UI Dialog

**Files:**

- Modify: `src/components/SearchForm/SearchForm.tsx`

- [ ] **Step 6: Replace the full contents of SearchForm.tsx**

Key changes from the original:

- Remove `useState` import (no longer needed)
- Add `Dialog` import from `@base-ui/react/dialog`
- Remove `const [drawerOpen, setDrawerOpen] = useState(false)`
- Wrap return in `<Dialog.Root>` (renders no DOM node — just context)
- Move `<form>` to be the first child of `Dialog.Root`; the strip's Filters button becomes `Dialog.Trigger render={<Button>}`
- Move backdrop + drawer into `<Dialog.Portal>` as a sibling of `<form>` inside `Dialog.Root`
- Replace backdrop `<div>` with `<Dialog.Backdrop>` (keep `data-testid="drawer-backdrop"`)
- Replace drawer `<div>` with `<Dialog.Popup keepMounted>`
- Replace drawer title `<span>` with `<Dialog.Title>`
- Wrap close `<Button>` in `<Dialog.Close render={<Button>}>`
- Remove: `id="advanced-filters"`, `aria-label` on drawer, `data-open`, `aria-expanded`, `aria-controls`, all manual `onClick={() => setDrawerOpen(...)}` handlers

```tsx
import { useForm } from "react-hook-form";
import { Search, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { Dialog } from "@base-ui/react/dialog";
import { AGE_GROUPS, CATEGORY, EXP, REGISTRATION, YES_NO } from "../../utils/enums";
import type { SearchFormValues } from "../../utils/types";
import { Button } from "../../ui/Button/Button";
import { EventTypeSelect } from "../../ui/EventTypeSelect/EventTypeSelect";
import { Select } from "../../ui/Select/Select";
import { Field, RangeField } from "../../ui/Field/Field";
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
  durationMin: "",
  durationMax: "",
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
  timeStart: "",
  timeEnd: "",
};

const DAY_KEYS = ["wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABELS: Record<string, string> = {
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

interface SearchFormProps {
  values: SearchFormValues;
  onSearch: (values: SearchFormValues) => void;
}

export function SearchForm({ values, onSearch }: SearchFormProps): JSX.Element {
  const { register, handleSubmit, reset, watch, setValue } = useForm<SearchFormValues>({
    values,
  });

  const days = watch("days") ?? "";
  const eventType = watch("eventType") ?? "";

  return (
    <Dialog.Root>
      <form onSubmit={handleSubmit(onSearch)} className={styles.formRoot}>
        {/* Primary filter strip */}
        <div className={styles.strip}>
          {/* Keyword search */}
          <div className={styles.searchField}>
            <label htmlFor="strip-keyword" className={styles.stripLabel}>
              Search
            </label>
            <div className={styles.searchGroup}>
              <Search size={15} className={styles.searchIcon} aria-hidden="true" />
              <input
                type="text"
                id="strip-keyword"
                className={styles.searchInput}
                placeholder="Search events…"
                {...register("filter")}
              />
            </div>
          </div>

          {/* Event type */}
          <div className={styles.eventTypeWrap}>
            <EventTypeSelect value={eventType} onValueChange={(v) => setValue("eventType", v)} />
          </div>

          {/* Day toggles + Time range */}
          <div className={styles.dayTimeRow}>
            <div className={styles.dayField}>
              <span aria-hidden="true" className={styles.stripLabel}>
                Days
              </span>
              <div className={styles.dayToggles} role="group" aria-label="Days">
                {DAY_KEYS.map((key) => {
                  const selected = days.split(",").includes(key);
                  return (
                    <div className={styles.dayToggleWrapper} key={key}>
                      <input
                        type="checkbox"
                        id={`day-${key}`}
                        className="sr-only"
                        checked={selected}
                        onChange={(e) => {
                          const current = days ? days.split(",") : [];
                          const next = e.target.checked
                            ? DAY_KEYS.filter((d) => current.includes(d) || d === key)
                            : current.filter((d) => d !== key);
                          setValue("days", next.join(","));
                        }}
                      />
                      <label htmlFor={`day-${key}`} className={styles.dayToggle}>
                        {DAY_LABELS[key]}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Time range */}
            <div className={styles.timeField}>
              <span aria-hidden="true" className={styles.stripLabel}>
                Time
              </span>
              <div className={styles.timeRange} role="group" aria-label="Time range">
                <input
                  type="time"
                  step="1800"
                  aria-label="From"
                  className={styles.timeInput}
                  {...register("timeStart")}
                />
                <span className={styles.timeSep} aria-hidden="true">
                  –
                </span>
                <input
                  type="time"
                  step="1800"
                  aria-label="To"
                  className={styles.timeInput}
                  {...register("timeEnd")}
                />
              </div>
            </div>
          </div>

          {/* Strip actions */}
          <div className={styles.stripActions}>
            <Dialog.Trigger
              render={
                <Button type="button" variant="secondary" className={styles.filtersButton}>
                  <SlidersHorizontal size={14} aria-hidden="true" /> Filters
                </Button>
              }
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => reset(EMPTY_VALUES)}
              className={styles.resetButton}
            >
              <RotateCcw size={14} aria-hidden="true" /> Reset
            </Button>
            <Button type="submit" variant="primary" className={styles.searchButton}>
              <Search size={14} aria-hidden="true" /> Search
            </Button>
          </div>
        </div>
      </form>

      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} data-testid="drawer-backdrop" />
        <Dialog.Popup keepMounted className={styles.drawer}>
          <div className={styles.drawerHeader}>
            <Dialog.Title className={styles.drawerTitle}>Advanced Filters</Dialog.Title>
            <Dialog.Close
              render={
                <Button type="button" variant="ghost" icon aria-label="Close advanced filters">
                  <X size={16} aria-hidden="true" />
                </Button>
              }
            />
          </div>

          <div className={styles.drawerScroll}>
            {/* DURATION */}
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>Duration</legend>
              <div className={styles.fieldsetBody}>
                <RangeField label="Duration (hours)">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className={styles.input}
                    {...register("durationMin")}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className={styles.input}
                    {...register("durationMax")}
                  />
                </RangeField>
              </div>
            </fieldset>

            {/* PLAYERS */}
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>Players</legend>
              <div className={styles.fieldsetBody}>
                <RangeField label="Min Players">
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    {...register("minPlayersMin")}
                  />
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    {...register("minPlayersMax")}
                  />
                </RangeField>
                <RangeField label="Max Players">
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    {...register("maxPlayersMin")}
                  />
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    {...register("maxPlayersMax")}
                  />
                </RangeField>
                <label className={styles.label}>
                  Age Required
                  <Select
                    value={watch("ageRequired") ?? ""}
                    onValueChange={(v) => setValue("ageRequired", v)}
                    options={Object.entries(AGE_GROUPS).map(([k, v]) => ({ value: k, label: v }))}
                  />
                </label>
                <label className={styles.label}>
                  Experience Required
                  <Select
                    value={watch("experienceRequired") ?? ""}
                    onValueChange={(v) => setValue("experienceRequired", v)}
                    options={Object.entries(EXP).map(([k, v]) => ({ value: k, label: v }))}
                  />
                </label>
              </div>
            </fieldset>

            {/* LOGISTICS */}
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>Logistics</legend>
              <div className={styles.fieldsetBody}>
                <Field label="Location">
                  <input type="text" className={styles.input} {...register("location")} />
                </Field>
                <Field label="Room Name">
                  <input type="text" className={styles.input} {...register("roomName")} />
                </Field>
                <Field label="Table">
                  <input type="text" className={styles.input} {...register("tableNumber")} />
                </Field>
                <RangeField label="Cost">
                  <input type="number" min="0" className={styles.input} {...register("costMin")} />
                  <input type="number" min="0" className={styles.input} {...register("costMax")} />
                </RangeField>
                <RangeField label="Tickets Available">
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    {...register("ticketsAvailableMin")}
                  />
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    {...register("ticketsAvailableMax")}
                  />
                </RangeField>
                <label className={styles.label}>
                  Attendee Registration
                  <Select
                    value={watch("attendeeRegistration") ?? ""}
                    onValueChange={(v) => setValue("attendeeRegistration", v)}
                    options={Object.entries(REGISTRATION).map(([k, v]) => ({
                      value: k,
                      label: v,
                    }))}
                  />
                </label>
              </div>
            </fieldset>

            {/* DETAILS */}
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>Details</legend>
              <div className={styles.fieldsetBody}>
                <Field label="Game ID">
                  <input type="text" className={styles.input} {...register("gameId")} />
                </Field>
                <Field label="Title">
                  <input type="text" className={styles.input} {...register("title")} />
                </Field>
                <Field label="Group">
                  <input type="text" className={styles.input} {...register("group")} />
                </Field>
                <Field label="Short Description">
                  <input type="text" className={styles.input} {...register("shortDescription")} />
                </Field>
                <Field label="Long Description">
                  <input type="text" className={styles.input} {...register("longDescription")} />
                </Field>
                <Field label="Game System">
                  <input type="text" className={styles.input} {...register("gameSystem")} />
                </Field>
                <Field label="Rules Edition">
                  <input type="text" className={styles.input} {...register("rulesEdition")} />
                </Field>
                <Field label="Materials Provided">
                  <input type="text" className={styles.input} {...register("materialsProvided")} />
                </Field>
                <label className={styles.label}>
                  Materials Required
                  <Select
                    value={watch("materialsRequired") ?? ""}
                    onValueChange={(v) => setValue("materialsRequired", v)}
                    options={Object.entries(YES_NO).map(([k, v]) => ({ value: k, label: v }))}
                    aria-label="Materials Required"
                  />
                </label>
                <Field label="Materials Required Details">
                  <input
                    type="text"
                    className={styles.input}
                    {...register("materialsRequiredDetails")}
                  />
                </Field>
                <Field label="Game Masters">
                  <input type="text" className={styles.input} {...register("gmNames")} />
                </Field>
                <Field label="Website">
                  <input type="text" className={styles.input} {...register("website")} />
                </Field>
                <Field label="Email">
                  <input type="text" className={styles.input} {...register("email")} />
                </Field>
                <label className={styles.label}>
                  Tournament
                  <Select
                    value={watch("tournament") ?? ""}
                    onValueChange={(v) => setValue("tournament", v)}
                    options={Object.entries(YES_NO).map(([k, v]) => ({ value: k, label: v }))}
                    aria-label="Tournament"
                  />
                </label>
                <RangeField label="Round Number">
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    {...register("roundNumberMin")}
                  />
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    {...register("roundNumberMax")}
                  />
                </RangeField>
                <RangeField label="Total Rounds">
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    {...register("totalRoundsMin")}
                  />
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    {...register("totalRoundsMax")}
                  />
                </RangeField>
                <RangeField label="Minimum Play Time">
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    {...register("minimumPlayTimeMin")}
                  />
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    {...register("minimumPlayTimeMax")}
                  />
                </RangeField>
                <label className={styles.label}>
                  Special Category
                  <Select
                    value={watch("specialCategory") ?? ""}
                    onValueChange={(v) => setValue("specialCategory", v)}
                    options={Object.entries(CATEGORY).map(([k, v]) => ({ value: k, label: v }))}
                  />
                </label>
                <RangeField label="Last Modified" stack>
                  <input
                    type="datetime-local"
                    className={styles.input}
                    {...register("lastModifiedStart")}
                  />
                  <input
                    type="datetime-local"
                    className={styles.input}
                    {...register("lastModifiedEnd")}
                  />
                </RangeField>
              </div>
            </fieldset>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 7: Run all tests**

```bash
npx vitest run src/components/SearchForm/SearchForm.test.tsx
```

Expected: All 4 new dialog-behavior tests now PASS. All previously passing tests continue to PASS. If any test fails, check the failure message — likely a focus/inert issue that can be debugged by reading the error output.

- [ ] **Step 8: Run full lint + typecheck**

```bash
npx tsc -b --noEmit && npx oxlint --ignore-path .oxlintignore -c .oxlintrc.json . && npx eslint .
```

Expected: No errors.

- [ ] **Step 9: Commit**

```bash
git add src/components/SearchForm/SearchForm.tsx src/components/SearchForm/SearchForm.test.tsx
git commit -m "feat(search-form): migrate filters drawer to Base UI Dialog"
```

---

## Task 4: Update CSS animation to Base UI transition classes

**Why:** The current CSS uses `data-open="true"` to drive the slide animation. Base UI does not write this attribute. It writes `[data-starting-style]` (before enter transition) and `[data-ending-style]` (before exit transition). The `hidden` attribute on the closed Popup is managed by Base UI automatically — no `visibility` override is needed in CSS.

**Files:**

- Modify: `src/components/SearchForm/SearchForm.module.css`

- [ ] **Step 10: Update the drawer and backdrop CSS**

In `SearchForm.module.css`, make the following changes:

**Remove** `visibility: hidden;` from `.drawer` (line 29 in current file).

**Remove** the entire `.drawer[data-open="true"]` rule block (lines 32–35):

```css
/* DELETE THIS BLOCK */
.drawer[data-open="true"] {
  transform: translateX(0);
  visibility: visible;
}
```

**Add** enter/exit transition rules for the drawer immediately after `.drawer { ... }`:

```css
.drawer[data-starting-style],
.drawer[data-ending-style] {
  transform: translateX(-100%);
}
```

**Update** the `.backdrop` rule to add opacity transition (replace the existing rule):

```css
.backdrop {
  position: fixed;
  inset: 0;
  z-index: calc(var(--z-modal) - 1);
  background: oklch(22% 0.03 48deg / 0.4);
  cursor: pointer;
  opacity: 1;
  transition: opacity var(--motion-expand);
}

.backdrop[data-starting-style],
.backdrop[data-ending-style] {
  opacity: 0;
}
```

The final `.drawer` block should look like:

```css
.drawer {
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

.drawer[data-starting-style],
.drawer[data-ending-style] {
  transform: translateX(-100%);
}
```

- [ ] **Step 11: Run CSS lint**

```bash
npx stylelint '**/*.css' --ignore-path .gitignore
```

Expected: No errors.

- [ ] **Step 12: Run all tests one final time**

```bash
npx vitest run src/components/SearchForm/SearchForm.test.tsx
```

Expected: All tests pass.

- [ ] **Step 13: Commit**

```bash
git add src/components/SearchForm/SearchForm.module.css
git commit -m "feat(search-form): replace data-open animation with Base UI transition classes"
```
