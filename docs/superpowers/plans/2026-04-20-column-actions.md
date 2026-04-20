# Column Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an accessible actions popover to each resizable column header with sort toggles and a resize-by-number-input dialog.

**Architecture:** Two new co-located components: `ColumnActionsPopover` (Base UI Popover with sort toggle buttons and a Resize… trigger) and `ColumnResizeDialog` (Base UI Dialog with a `<input type="number">`). `SearchResults` gains `resizeTarget` state to bridge the two and renders both alongside the existing sort button and drag handle.

**Tech Stack:** `@base-ui/react` Popover and Dialog, React `useState`, CSS Modules, `@testing-library/react`, `userEvent`.

---

## File Structure

| File                                                           | Action | Responsibility                                                                                         |
| -------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| `src/components/SearchResults/ColumnActionsPopover.tsx`        | Create | Kebab button + Base UI Popover with sort toggles and Resize… button                                    |
| `src/components/SearchResults/ColumnActionsPopover.module.css` | Create | Popover trigger, popup, and action button styles                                                       |
| `src/components/SearchResults/ColumnActionsPopover.test.tsx`   | Create | Unit tests for the popover                                                                             |
| `src/components/SearchResults/ColumnResizeDialog.tsx`          | Create | Base UI Dialog with number input                                                                       |
| `src/components/SearchResults/ColumnResizeDialog.module.css`   | Create | Dialog backdrop, popup, input, and button styles                                                       |
| `src/components/SearchResults/ColumnResizeDialog.test.tsx`     | Create | Unit tests for the dialog                                                                              |
| `src/components/SearchResults/SearchResults.tsx`               | Modify | Add `resizeTarget` state, import and render both new components                                        |
| `src/components/SearchResults/SearchResults.module.css`        | Modify | Add `padding-right` to `.resizableTh` to make room for the kebab button                                |
| `src/components/SearchResults/SearchResults.test.tsx`          | Modify | Integration tests: actions button present, popover opens, dialog opens, Apply persists to localStorage |

---

### Task 1: `ColumnActionsPopover`

**Files:**

- Create: `src/components/SearchResults/ColumnActionsPopover.tsx`
- Create: `src/components/SearchResults/ColumnActionsPopover.module.css`
- Create: `src/components/SearchResults/ColumnActionsPopover.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/SearchResults/ColumnActionsPopover.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { ColumnActionsPopover } from "./ColumnActionsPopover";

function renderPopover(
  overrides: Partial<React.ComponentProps<typeof ColumnActionsPopover>> = {},
) {
  return render(
    <ColumnActionsPopover
      sortField="title"
      activeSortField={undefined}
      activeSortDir={undefined}
      onSort={vi.fn()}
      onOpenResize={vi.fn()}
      {...overrides}
    />,
  );
}

test("renders a column actions button", () => {
  renderPopover();
  expect(
    screen.getByRole("button", { name: "Column actions" }),
  ).toBeInTheDocument();
});

test("opens popover with sort and resize actions when clicked", async () => {
  const user = userEvent.setup();
  renderPopover();
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(
    screen.getByRole("button", { name: "Sort ascending" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Sort descending" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Resize…" })).toBeInTheDocument();
});

test("Sort ascending has aria-pressed=false when column is unsorted", async () => {
  const user = userEvent.setup();
  renderPopover({ activeSortField: undefined });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(
    screen.getByRole("button", { name: "Sort ascending" }),
  ).toHaveAttribute("aria-pressed", "false");
});

test("Sort ascending has aria-pressed=true when column is sorted ascending", async () => {
  const user = userEvent.setup();
  renderPopover({ activeSortField: "title", activeSortDir: "asc" });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(
    screen.getByRole("button", { name: "Sort ascending" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("Sort descending has aria-pressed=true when column is sorted descending", async () => {
  const user = userEvent.setup();
  renderPopover({ activeSortField: "title", activeSortDir: "desc" });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(
    screen.getByRole("button", { name: "Sort descending" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("clicking Sort ascending when unsorted calls onSort with field.asc", async () => {
  const user = userEvent.setup();
  const onSort = vi.fn();
  renderPopover({ onSort });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  await user.click(screen.getByRole("button", { name: "Sort ascending" }));
  expect(onSort).toHaveBeenCalledWith("title.asc");
});

test("clicking Sort ascending when already ascending calls onSort with undefined", async () => {
  const user = userEvent.setup();
  const onSort = vi.fn();
  renderPopover({ activeSortField: "title", activeSortDir: "asc", onSort });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  await user.click(screen.getByRole("button", { name: "Sort ascending" }));
  expect(onSort).toHaveBeenCalledWith(undefined);
});

test("clicking Sort descending when ascending calls onSort with field.desc", async () => {
  const user = userEvent.setup();
  const onSort = vi.fn();
  renderPopover({ activeSortField: "title", activeSortDir: "asc", onSort });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  await user.click(screen.getByRole("button", { name: "Sort descending" }));
  expect(onSort).toHaveBeenCalledWith("title.desc");
});

test("clicking Resize… calls onOpenResize", async () => {
  const user = userEvent.setup();
  const onOpenResize = vi.fn();
  renderPopover({ onOpenResize });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  await user.click(screen.getByRole("button", { name: "Resize…" }));
  expect(onOpenResize).toHaveBeenCalledTimes(1);
});

test("does not render sort buttons when sortField is undefined", async () => {
  const user = userEvent.setup();
  renderPopover({ sortField: undefined });
  await user.click(screen.getByRole("button", { name: "Column actions" }));
  expect(
    screen.queryByRole("button", { name: "Sort ascending" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Sort descending" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Resize…" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/myasonik/Workspace/Gen-Con-Buddy-column-resize && npx vitest run src/components/SearchResults/ColumnActionsPopover.test.tsx
```

Expected: FAIL — `ColumnActionsPopover` does not exist.

- [ ] **Step 3: Create the CSS module**

Create `src/components/SearchResults/ColumnActionsPopover.module.css`:

```css
/* Absolutely positioned within the resizable <th> (which has position: relative) */
.trigger {
  position: absolute;
  right: 6px; /* sits left of the 4px drag handle */
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  color: var(--color-parchment);
  opacity: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  transition: opacity var(--motion-hover);
}

/* Show on header hover or when the popover is open */
:global(th):hover .trigger,
.trigger:focus-visible,
.triggerOpen {
  opacity: 1;
}

.trigger:focus-visible {
  outline: 2px solid var(--color-gold);
  outline-offset: 1px;
}

.popup {
  background: var(--color-parchment-light);
  border: 2px solid var(--color-bark);
  box-shadow: var(--shadow-panel);
  display: flex;
  flex-direction: column;
  min-width: 148px;
  z-index: var(--z-popover);
}

.action {
  background: none;
  border: none;
  border-bottom: 1px solid var(--color-bark-light);
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-display);
  font-size: var(--text-label);
  font-style: italic;
  color: var(--color-ink);
  cursor: pointer;
  text-align: left;
  width: 100%;
}

.action:last-child {
  border-bottom: none;
}

.action:hover {
  background: color-mix(
    in srgb,
    var(--color-bark-light) 20%,
    var(--color-parchment-light)
  );
}

.action[aria-pressed="true"] {
  color: var(--color-bark);
  font-weight: bold;
}
```

- [ ] **Step 4: Implement `ColumnActionsPopover`**

Create `src/components/SearchResults/ColumnActionsPopover.tsx`:

```tsx
import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import styles from "./ColumnActionsPopover.module.css";

interface ColumnActionsPopoverProps {
  sortField: string | undefined;
  activeSortField: string | undefined;
  activeSortDir: "asc" | "desc" | undefined;
  onSort: (sort: string | undefined) => void;
  onOpenResize: () => void;
}

export function ColumnActionsPopover({
  sortField,
  activeSortField,
  activeSortDir,
  onSort,
  onOpenResize,
}: ColumnActionsPopoverProps) {
  const [open, setOpen] = useState(false);

  const isSortedAsc =
    !!sortField && activeSortField === sortField && activeSortDir === "asc";
  const isSortedDesc =
    !!sortField && activeSortField === sortField && activeSortDir === "desc";

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        className={`${styles.trigger}${open ? ` ${styles.triggerOpen}` : ""}`}
        aria-label="Column actions"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="6" cy="2" r="1.5" fill="currentColor" />
          <circle cx="6" cy="6" r="1.5" fill="currentColor" />
          <circle cx="6" cy="10" r="1.5" fill="currentColor" />
        </svg>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={4}>
          <Popover.Popup className={styles.popup}>
            {sortField && (
              <>
                <button
                  type="button"
                  className={styles.action}
                  aria-pressed={isSortedAsc}
                  onClick={() => {
                    onSort(isSortedAsc ? undefined : `${sortField}.asc`);
                    setOpen(false);
                  }}
                >
                  Sort ascending
                </button>
                <button
                  type="button"
                  className={styles.action}
                  aria-pressed={isSortedDesc}
                  onClick={() => {
                    onSort(isSortedDesc ? undefined : `${sortField}.desc`);
                    setOpen(false);
                  }}
                >
                  Sort descending
                </button>
              </>
            )}
            <button
              type="button"
              className={styles.action}
              onClick={() => {
                setOpen(false);
                onOpenResize();
              }}
            >
              Resize…
            </button>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
```

- [ ] **Step 5: Run tests and verify they pass**

```bash
npx vitest run src/components/SearchResults/ColumnActionsPopover.test.tsx
```

Expected: all 10 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/SearchResults/ColumnActionsPopover.tsx src/components/SearchResults/ColumnActionsPopover.module.css src/components/SearchResults/ColumnActionsPopover.test.tsx
git commit -m "feat(ColumnActionsPopover): add popover with sort toggles and resize action"
```

---

### Task 2: `ColumnResizeDialog`

**Files:**

- Create: `src/components/SearchResults/ColumnResizeDialog.tsx`
- Create: `src/components/SearchResults/ColumnResizeDialog.module.css`
- Create: `src/components/SearchResults/ColumnResizeDialog.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/SearchResults/ColumnResizeDialog.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { ColumnResizeDialog } from "./ColumnResizeDialog";

test("renders with the column name in the heading", () => {
  render(
    <ColumnResizeDialog
      columnName="Title"
      currentWidth={150}
      onApply={vi.fn()}
      onClose={vi.fn()}
    />,
  );
  expect(
    screen.getByRole("heading", { name: "Resize Title" }),
  ).toBeInTheDocument();
});

test("pre-fills the number input with currentWidth", () => {
  render(
    <ColumnResizeDialog
      columnName="Title"
      currentWidth={200}
      onApply={vi.fn()}
      onClose={vi.fn()}
    />,
  );
  expect(screen.getByRole("spinbutton", { name: "Width (px)" })).toHaveValue(
    200,
  );
});

test("clicking Apply calls onApply with the parsed number value", async () => {
  const user = userEvent.setup();
  const onApply = vi.fn();
  render(
    <ColumnResizeDialog
      columnName="Title"
      currentWidth={150}
      onApply={onApply}
      onClose={vi.fn()}
    />,
  );
  const input = screen.getByRole("spinbutton", { name: "Width (px)" });
  await user.clear(input);
  await user.type(input, "300");
  await user.click(screen.getByRole("button", { name: "Apply" }));
  expect(onApply).toHaveBeenCalledWith(300);
});

test("clicking Cancel calls onClose without calling onApply", async () => {
  const user = userEvent.setup();
  const onApply = vi.fn();
  const onClose = vi.fn();
  render(
    <ColumnResizeDialog
      columnName="Title"
      currentWidth={150}
      onApply={onApply}
      onClose={onClose}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onApply).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/SearchResults/ColumnResizeDialog.test.tsx
```

Expected: FAIL — `ColumnResizeDialog` does not exist.

- [ ] **Step 3: Create the CSS module**

Create `src/components/SearchResults/ColumnResizeDialog.module.css`:

```css
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(59, 30, 10, 0.35);
  z-index: calc(var(--z-modal) - 1);
}

.popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--color-parchment-light);
  border: 2px solid var(--color-bark);
  box-shadow: var(--shadow-panel);
  padding: var(--space-4);
  min-width: 260px;
  z-index: var(--z-modal);
}

.title {
  font-family: var(--font-display);
  font-size: var(--text-heading);
  font-style: italic;
  color: var(--color-bark);
  margin: 0 0 var(--space-3);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-bottom: var(--space-4);
}

.label {
  font-family: var(--font-display);
  font-size: var(--text-label);
  font-style: italic;
  color: var(--color-ink);
}

.input {
  font-family: var(--font-data);
  font-size: var(--text-small);
  border: 2px solid var(--color-bark);
  padding: var(--space-1) var(--space-2);
  background: var(--color-parchment);
  color: var(--color-ink);
  width: 100%;
}

.input:focus {
  outline: 2px solid var(--color-gold);
  outline-offset: 1px;
}

.actions {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
}

.button {
  font-family: var(--font-display);
  font-size: var(--text-label);
  font-style: italic;
  background: var(--color-parchment);
  border: 2px solid var(--color-bark);
  color: var(--color-bark);
  padding: var(--space-1) var(--space-3);
  cursor: pointer;
}

.button:hover {
  background: var(--color-bark-light);
  color: var(--color-parchment-light);
}

.primaryButton {
  background: var(--color-bark);
  color: var(--color-parchment-light);
}

.primaryButton:hover {
  background: var(--color-bark-dark);
}
```

- [ ] **Step 4: Implement `ColumnResizeDialog`**

Create `src/components/SearchResults/ColumnResizeDialog.tsx`:

```tsx
import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import styles from "./ColumnResizeDialog.module.css";

interface ColumnResizeDialogProps {
  columnName: string;
  currentWidth: number;
  onApply: (width: number) => void;
  onClose: () => void;
}

export function ColumnResizeDialog({
  columnName,
  currentWidth,
  onApply,
  onClose,
}: ColumnResizeDialogProps) {
  const [value, setValue] = useState(String(currentWidth));

  return (
    <Dialog.Root
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Popup className={styles.popup}>
          <Dialog.Title className={styles.title}>
            Resize {columnName}
          </Dialog.Title>
          <div className={styles.field}>
            <label htmlFor="resize-width-input" className={styles.label}>
              Width (px)
            </label>
            <input
              id="resize-width-input"
              type="number"
              className={styles.input}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.button} onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.primaryButton}`}
              onClick={() => onApply(Number(value))}
            >
              Apply
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 5: Run tests and verify they pass**

```bash
npx vitest run src/components/SearchResults/ColumnResizeDialog.test.tsx
```

Expected: all 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/SearchResults/ColumnResizeDialog.tsx src/components/SearchResults/ColumnResizeDialog.module.css src/components/SearchResults/ColumnResizeDialog.test.tsx
git commit -m "feat(ColumnResizeDialog): add modal dialog for setting column width by number"
```

---

### Task 3: Wire into `SearchResults` + CSS + integration tests

**Files:**

- Modify: `src/components/SearchResults/SearchResults.tsx`
- Modify: `src/components/SearchResults/SearchResults.module.css`
- Modify: `src/components/SearchResults/SearchResults.test.tsx`

- [ ] **Step 1: Write the failing integration tests**

Append to `src/components/SearchResults/SearchResults.test.tsx`:

```tsx
test("actions button is present on resizable columns", async () => {
  renderSearchResults();
  await screen.findAllByRole("row");
  const actionButtons = screen.getAllByRole("button", {
    name: "Column actions",
  });
  expect(actionButtons.length).toBeGreaterThan(0);
});

test("actions button is absent on dayStripe column", async () => {
  renderSearchResults();
  await screen.findAllByRole("row");
  const dayStripes = document.querySelectorAll("th[aria-hidden='true']");
  dayStripes.forEach((th) => {
    expect(th.querySelector("[aria-label='Column actions']")).toBeNull();
  });
});

test("clicking Resize… on a column opens the resize dialog", async () => {
  const user = userEvent.setup();
  renderSearchResults();
  await screen.findAllByRole("row");
  const titleTh = screen.getByRole("columnheader", { name: "Title" });
  await user.click(
    within(titleTh).getByRole("button", { name: "Column actions" }),
  );
  await user.click(screen.getByRole("button", { name: "Resize…" }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});

test("submitting resize dialog updates column width in localStorage", async () => {
  const user = userEvent.setup();
  renderSearchResults();
  await screen.findAllByRole("row");
  const titleTh = screen.getByRole("columnheader", { name: "Title" });
  await user.click(
    within(titleTh).getByRole("button", { name: "Column actions" }),
  );
  await user.click(screen.getByRole("button", { name: "Resize…" }));
  const input = screen.getByRole("spinbutton", { name: "Width (px)" });
  await user.clear(input);
  await user.type(input, "400");
  await user.click(screen.getByRole("button", { name: "Apply" }));
  const stored = JSON.parse(localStorage.getItem("gcb-column-sizing")!);
  expect(stored).toEqual({ version: 1, sizing: { title: 400 } });
});
```

Also add `within` to the import at the top of the test file. The existing import is:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
```

Change it to:

```tsx
import { render, screen, waitFor, within } from "@testing-library/react";
```

- [ ] **Step 2: Run new tests to verify they fail**

```bash
npx vitest run src/components/SearchResults/SearchResults.test.tsx --reporter=verbose 2>&1 | tail -20
```

Expected: the 4 new tests FAIL (actions buttons not yet rendered).

- [ ] **Step 3: Update `SearchResults.module.css` — add padding-right to `.resizableTh`**

In `src/components/SearchResults/SearchResults.module.css`, find the `.resizableTh` rule and add `padding-right`:

```css
/* Column resize handle */
.resizableTh {
  position: relative;
  padding-right: 26px; /* room for kebab actions button (20px) + drag handle (4px) + 2px gap */
}
```

- [ ] **Step 4: Update `SearchResults.tsx` — imports and state**

At the top of `src/components/SearchResults/SearchResults.tsx`, add `useState` to the React import and add the two new component imports after the `useColumnSizing` import:

Change:

```tsx
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
```

To:

```tsx
import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
```

After the `useColumnSizing` import line, add:

```tsx
import { ColumnActionsPopover } from "./ColumnActionsPopover";
import { ColumnResizeDialog } from "./ColumnResizeDialog";
```

- [ ] **Step 5: Add `resizeTarget` state inside `SearchResults`**

Inside the `SearchResults` function body, after the `const { sizing, setSizing, reset: resetSizing } = useColumnSizing();` line, add:

```tsx
const [resizeTarget, setResizeTarget] = useState<{
  columnId: string;
  columnName: string;
  currentWidth: number;
} | null>(null);
```

- [ ] **Step 6: Render `ColumnActionsPopover` inside each resizable `<th>`**

Find the section inside the `<th>` that renders the sort button and resize handle (around lines 449–476 of the current file). Change it from:

```tsx
<button
  type="button"
  aria-label={`Sort by ${label}`}
  onClick={() => sortField && handleSortClick(sortField, label)}
>
  {flexRender(header.column.columnDef.header, header.getContext())}
  {isActive && (
    <span aria-hidden="true" className={styles.sortIndicator}>
      {activeSortDir === "asc" ? " ▲" : " ▼"}
    </span>
  )}
</button>;
{
  header.column.getCanResize() && (
    <div
      className={styles.resizeHandle}
      onPointerDown={header.getResizeHandler()}
      aria-hidden="true"
      data-testid="resize-handle"
    />
  );
}
```

To:

```tsx
<button
  type="button"
  aria-label={`Sort by ${label}`}
  onClick={() => sortField && handleSortClick(sortField, label)}
>
  {flexRender(header.column.columnDef.header, header.getContext())}
  {isActive && (
    <span aria-hidden="true" className={styles.sortIndicator}>
      {activeSortDir === "asc" ? " ▲" : " ▼"}
    </span>
  )}
</button>;
{
  header.column.getCanResize() && (
    <ColumnActionsPopover
      sortField={sortField}
      activeSortField={activeSortField}
      activeSortDir={activeSortDir}
      onSort={onSort}
      onOpenResize={() =>
        setResizeTarget({
          columnId: header.column.id,
          columnName: label,
          currentWidth: header.getSize(),
        })
      }
    />
  );
}
{
  header.column.getCanResize() && (
    <div
      className={styles.resizeHandle}
      onPointerDown={header.getResizeHandler()}
      aria-hidden="true"
      data-testid="resize-handle"
    />
  );
}
```

- [ ] **Step 7: Render `ColumnResizeDialog` at the end of the `<section>`**

Find the closing `</section>` tag at the end of the `SearchResults` return. Change:

```tsx
    </section>
  );
}
```

To:

```tsx
      {resizeTarget && (
        <ColumnResizeDialog
          columnName={resizeTarget.columnName}
          currentWidth={resizeTarget.currentWidth}
          onApply={(width) => {
            setSizing((prev) => ({
              ...prev,
              [resizeTarget.columnId]: width,
            }));
            setResizeTarget(null);
          }}
          onClose={() => setResizeTarget(null)}
        />
      )}
    </section>
  );
}
```

- [ ] **Step 8: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 9: Run the full integration tests**

```bash
npx vitest run src/components/SearchResults/SearchResults.test.tsx
```

Expected: all 38 tests PASS (34 existing + 4 new).

- [ ] **Step 10: Run the full test suite**

```bash
npx vitest run
```

Expected: all 264 tests PASS (250 baseline + 10 ColumnActionsPopover + 4 ColumnResizeDialog).

- [ ] **Step 11: Commit**

```bash
git add src/components/SearchResults/SearchResults.tsx src/components/SearchResults/SearchResults.module.css src/components/SearchResults/SearchResults.test.tsx
git commit -m "feat(SearchResults): wire ColumnActionsPopover and ColumnResizeDialog into column headers"
```
