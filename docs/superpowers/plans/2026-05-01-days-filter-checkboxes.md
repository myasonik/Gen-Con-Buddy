# Days Filter: Checkboxes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the toggle-button day filter in SearchForm with native `<input type="checkbox">` elements.

**Architecture:** Update SearchForm's DAYS section in-place — swap `ToggleTileGroup`/`ToggleTile` for a flex `<div>` of `<label>`+`<input type="checkbox">` pairs. The `days` comma-separated string state is unchanged. Update tests first, then implementation. Delete the now-unused `ToggleTile` component.

**Tech Stack:** React, react-hook-form, Vitest, @testing-library/react, CSS Modules

---

## File Map

| File                                              | Change                                                                                  |
| ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `src/components/SearchForm/SearchForm.test.tsx`   | Update day-filter tests to use checkbox role/`checked` instead of button/`aria-pressed` |
| `src/components/SearchForm/SearchForm.tsx`        | Replace `ToggleTileGroup`/`ToggleTile` with native checkboxes; update toggletip message |
| `src/components/SearchForm/SearchForm.module.css` | Add `.dayLabel` utility class                                                           |
| `src/ui/ToggleTile/` (whole directory)            | Delete — no remaining consumers                                                         |

---

### Task 1: Update day-filter tests to expect checkboxes (write failing tests)

**Files:**

- Modify: `src/components/SearchForm/SearchForm.test.tsx:105-165`

- [ ] **Step 1: Replace the five day-tile tests**

In `SearchForm.test.tsx`, replace lines 105–165 with the following. (Keep everything outside that range unchanged.)

```tsx
const DAYS = ["Wed", "Thu", "Fri", "Sat", "Sun"] as const;

test("renders day filters as checkboxes in the DAYS fieldset", () => {
  render(<SearchForm values={{}} onSearch={noop} />);
  for (const day of DAYS) {
    expect(screen.getByRole("checkbox", { name: day })).toBeInTheDocument();
  }
});

test("checking a day checkbox submits the correct days value", async () => {
  const user = userEvent.setup();
  const handleSearch = vi.fn<(values: SearchFormValues) => void>();
  render(<SearchForm values={{}} onSearch={handleSearch} />);

  await user.click(screen.getByRole("checkbox", { name: "Thu" }));
  await user.click(screen.getByRole("button", { name: "▶ Search" }));

  expect(handleSearch.mock.calls[0][0].days).toBe("thu");
});

test("checking multiple day checkboxes submits comma-separated days", async () => {
  const user = userEvent.setup();
  const handleSearch = vi.fn<(values: SearchFormValues) => void>();
  render(<SearchForm values={{}} onSearch={handleSearch} />);

  await user.click(screen.getByRole("checkbox", { name: "Wed" }));
  await user.click(screen.getByRole("checkbox", { name: "Sun" }));
  await user.click(screen.getByRole("button", { name: "▶ Search" }));

  expect(handleSearch.mock.calls[0][0].days).toBe("wed,sun");
});

test("populates day checkboxes from values prop", () => {
  render(<SearchForm values={{ days: "fri,sat" }} onSearch={noop} />);
  expect(screen.getByRole("checkbox", { name: "Fri" })).toBeChecked();
  expect(screen.getByRole("checkbox", { name: "Sat" })).toBeChecked();
  expect(screen.getByRole("checkbox", { name: "Wed" })).not.toBeChecked();
});

test("reset button clears day checkboxes", async () => {
  const user = userEvent.setup();
  render(<SearchForm values={{ days: "thu" }} onSearch={noop} />);

  await user.click(screen.getByRole("button", { name: "↺ Reset" }));

  expect(screen.getByRole("checkbox", { name: "Thu" })).not.toBeChecked();
});

test("day checkboxes are disabled when startDateTimeStart has a value", () => {
  render(<SearchForm values={{ startDateTimeStart: "2024-08-01T10:00" }} onSearch={noop} />);
  for (const day of DAYS) {
    expect(screen.getByRole("checkbox", { name: day })).toBeDisabled();
  }
});

test("day checkboxes are disabled when startDateTimeEnd has a value", () => {
  render(<SearchForm values={{ startDateTimeEnd: "2024-08-01T14:00" }} onSearch={noop} />);
  for (const day of DAYS) {
    expect(screen.getByRole("checkbox", { name: day })).toBeDisabled();
  }
});
```

- [ ] **Step 2: Update the toggletip message test**

Find this test in `SearchForm.test.tsx` (currently around line 209):

```tsx
test("toggletip message for disabled start date explains to clear day buttons", async () => {
  const user = userEvent.setup();
  render(<SearchForm values={{ days: "thu" }} onSearch={noop} />);

  await user.click(screen.getByRole("button", { name: /why.*start date/i }));

  expect(screen.getByText(/clear the day buttons/i)).toBeInTheDocument();
});
```

Replace it with:

```tsx
test("toggletip message for disabled start date explains to clear day checkboxes", async () => {
  const user = userEvent.setup();
  render(<SearchForm values={{ days: "thu" }} onSearch={noop} />);

  await user.click(screen.getByRole("button", { name: /why.*start date/i }));

  expect(screen.getByText(/clear the day checkboxes/i)).toBeInTheDocument();
});
```

- [ ] **Step 3: Run tests to confirm failures**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy && npx vitest run src/components/SearchForm/SearchForm.test.tsx 2>&1 | tail -30
```

Expected: multiple failures — "Unable to find role="checkbox"", "Unable to find role="button" with name matching /clear the day checkboxes/i", etc. If zero tests fail, re-check the edits above.

---

### Task 2: Replace ToggleTile with native checkboxes in SearchForm.tsx

**Files:**

- Modify: `src/components/SearchForm/SearchForm.tsx`
- Modify: `src/components/SearchForm/SearchForm.module.css`

- [ ] **Step 1: Remove the ToggleTile import**

In `SearchForm.tsx`, delete line:

```tsx
import { ToggleTile, ToggleTileGroup } from "../../ui/ToggleTile/ToggleTile";
```

- [ ] **Step 2: Replace the DAYS fieldset body**

In `SearchForm.tsx`, replace the entire `{/* DAYS */}` fieldset body (the `ToggleTileGroup` block, currently lines 114–129):

```tsx
<ToggleTileGroup
  value={days ? days.split(",") : []}
  onValueChange={(v) => setValue("days", DAY_KEYS.filter((d) => v.includes(d)).join(","))}
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

With:

```tsx
<div className={styles.dayTiles}>
  {DAY_KEYS.map((key) => (
    <label key={key} className={styles.dayLabel}>
      <input
        type="checkbox"
        checked={(days ?? "").split(",").includes(key)}
        onChange={(e) => {
          const current = days ? days.split(",") : [];
          const next = e.target.checked
            ? DAY_KEYS.filter((d) => current.includes(d) || d === key)
            : current.filter((d) => d !== key);
          setValue("days", next.join(","));
        }}
        disabled={daysDisabled}
      />
      {DAY_LABELS[key]}
    </label>
  ))}
</div>
```

- [ ] **Step 3: Update the toggletip messages that reference "day buttons"**

In `SearchForm.tsx`, find the Toggletip in the TIME section for Start Date (around line 111):

```tsx
<Toggletip
  label="Why are day filters disabled?"
  message="Clear the Start Date fields in the Time section to enable the day buttons."
/>
```

The `message` prop doesn't need changing (it says "enable the day buttons" but the test only checks the DAYS-section toggletip via `/clear the start date fields/i` — that's fine).

Find the Start Date Toggletip (around line 137):

```tsx
<Toggletip
  label="Why are Start Date fields disabled?"
  message="Clear the day buttons in the DAYS section to enable custom Start Date fields."
/>
```

Change its `message` to:

```tsx
message = "Clear the day checkboxes in the DAYS section to enable custom Start Date fields.";
```

Find the End Date Toggletip (around line 174):

```tsx
<Toggletip
  label="Why are End Date fields disabled?"
  message="Clear the day buttons in the DAYS section to enable custom End Date fields."
/>
```

Change its `message` to:

```tsx
message = "Clear the day checkboxes in the DAYS section to enable custom End Date fields.";
```

- [ ] **Step 4: Add `.dayLabel` to SearchForm.module.css**

In `SearchForm.module.css`, add after the `.dayTiles` rule:

```css
.dayLabel {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  cursor: pointer;
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy && npx vitest run src/components/SearchForm/SearchForm.test.tsx 2>&1 | tail -20
```

Expected: all tests pass (0 failures).

- [ ] **Step 6: Commit**

```bash
git add src/components/SearchForm/SearchForm.tsx src/components/SearchForm/SearchForm.module.css src/components/SearchForm/SearchForm.test.tsx
git commit -m "feat(search): replace day toggle buttons with native checkboxes"
```

---

### Task 3: Delete the ToggleTile component

**Files:**

- Delete: `src/ui/ToggleTile/` (entire directory)

- [ ] **Step 1: Confirm no remaining imports**

```bash
grep -r "ToggleTile" /home/myasonik/Workspace/Gen-Con-Buddy/src --include="*.tsx" --include="*.ts"
```

Expected: no output. If any file still imports `ToggleTile`, fix it before continuing.

- [ ] **Step 2: Delete the directory**

```bash
rm -rf /home/myasonik/Workspace/Gen-Con-Buddy/src/ui/ToggleTile
```

- [ ] **Step 3: Run the full test suite**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy && npx vitest run 2>&1 | tail -20
```

Expected: all tests pass. If any test references `ToggleTile`, it wasn't caught by the grep — fix it now.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove ToggleTile component (replaced by native checkboxes)"
```
