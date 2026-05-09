# Collapsible Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hand-rolled `AnimatedDetails` component and `useAnimatedDetails` hook with a thin wrapper around Base UI's `Collapsible` primitive.

**Architecture:** A single `Collapsible` component in `src/ui/Collapsible/` wraps `BaseCollapsible.Root`, `BaseCollapsible.Trigger`, and `BaseCollapsible.Panel` from `@base-ui/react/collapsible`. All open/close state and aria wiring is delegated to Base UI. Animation is CSS-only via `data-starting-style` / `data-ending-style` and `--collapsible-panel-height`. Three callsites are updated; all `AnimatedDetails` source files and the `useAnimatedDetails` hook are deleted.

**Tech Stack:** React, Base UI `@base-ui/react` v1.3, CSS Modules, Vitest + Testing Library

---

### Task 1: Write failing tests for Collapsible

**Files:**

- Create: `src/ui/Collapsible/Collapsible.test.tsx`

- [ ] **Step 1: Create the test file**

```tsx
import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Collapsible } from "./Collapsible";

test("renders trigger button with provided content", () => {
  render(<Collapsible trigger="Open me">content</Collapsible>);
  expect(screen.getByRole("button", { name: "Open me" })).toBeInTheDocument();
});

test("panel content is hidden by default (uncontrolled)", () => {
  render(<Collapsible trigger="Toggle">hidden content</Collapsible>);
  expect(screen.queryByText("hidden content")).not.toBeInTheDocument();
});

test("open={true} shows panel content", () => {
  render(
    <Collapsible trigger="Toggle" open>
      visible content
    </Collapsible>,
  );
  expect(screen.getByText("visible content")).toBeInTheDocument();
});

test("open={false} hides panel content", () => {
  render(
    <Collapsible trigger="Toggle" open={false}>
      hidden content
    </Collapsible>,
  );
  expect(screen.queryByText("hidden content")).not.toBeInTheDocument();
});

test("clicking trigger opens an uncontrolled collapsible", async () => {
  render(<Collapsible trigger="Toggle">body content</Collapsible>);
  await userEvent.click(screen.getByRole("button", { name: "Toggle" }));
  expect(screen.getByText("body content")).toBeInTheDocument();
});

test("clicking trigger twice closes an uncontrolled collapsible", async () => {
  render(<Collapsible trigger="Toggle">body content</Collapsible>);
  await userEvent.click(screen.getByRole("button", { name: "Toggle" }));
  await userEvent.click(screen.getByRole("button", { name: "Toggle" }));
  expect(screen.queryByText("body content")).not.toBeInTheDocument();
});

test("onOpenChange is called with true when closed trigger is clicked", async () => {
  const onOpenChange = vi.fn();
  render(
    <Collapsible trigger="Toggle" open={false} onOpenChange={onOpenChange}>
      content
    </Collapsible>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Toggle" }));
  expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
});

test("onOpenChange is called with false when open trigger is clicked", async () => {
  const onOpenChange = vi.fn();
  render(
    <Collapsible trigger="Toggle" open={true} onOpenChange={onOpenChange}>
      content
    </Collapsible>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Toggle" }));
  expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
});

test("className applies to the root element", () => {
  render(
    <Collapsible trigger="Toggle" className="my-class">
      content
    </Collapsible>,
  );
  expect(document.querySelector(".my-class")).toBeInTheDocument();
});

test("triggerClassName applies to the trigger button", () => {
  render(
    <Collapsible trigger="Toggle" triggerClassName="btn-class">
      content
    </Collapsible>,
  );
  expect(screen.getByRole("button", { name: "Toggle" })).toHaveClass("btn-class");
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- src/ui/Collapsible/Collapsible.test.tsx
```

Expected: All tests fail with `Cannot find module './Collapsible'`.

---

### Task 2: Create Collapsible component, CSS, and stories

**Files:**

- Create: `src/ui/Collapsible/Collapsible.module.css`
- Create: `src/ui/Collapsible/Collapsible.tsx`
- Create: `src/ui/Collapsible/Collapsible.stories.tsx`

- [ ] **Step 1: Write the CSS module**

Create `src/ui/Collapsible/Collapsible.module.css`:

```css
.panel {
  overflow: clip;
  height: var(--collapsible-panel-height);
  transition: height var(--motion-expand);
}

.panel[data-starting-style],
.panel[data-ending-style] {
  height: 0;
}

/* Prevent child padding from creating a minimum height floor */
.panelInner {
  overflow: hidden;
}

@media (prefers-reduced-motion: reduce) {
  .panel {
    transition: none;
  }
}
```

- [ ] **Step 2: Write the component**

Create `src/ui/Collapsible/Collapsible.tsx`:

```tsx
import React, { type ReactNode } from "react";
import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import styles from "./Collapsible.module.css";

interface CollapsibleProps {
  trigger: ReactNode;
  triggerClassName?: string;
  children: ReactNode;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Collapsible({
  trigger,
  triggerClassName,
  children,
  className,
  open,
  onOpenChange,
}: CollapsibleProps): React.JSX.Element {
  return (
    <BaseCollapsible.Root open={open} onOpenChange={onOpenChange} className={className}>
      <BaseCollapsible.Trigger className={triggerClassName}>{trigger}</BaseCollapsible.Trigger>
      <BaseCollapsible.Panel className={styles.panel}>
        <div className={styles.panelInner}>{children}</div>
      </BaseCollapsible.Panel>
    </BaseCollapsible.Root>
  );
}
```

- [ ] **Step 3: Write stories**

Create `src/ui/Collapsible/Collapsible.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Collapsible } from "./Collapsible";

const meta = {
  title: "UI/Collapsible",
  component: Collapsible,
  tags: ["autodocs"],
  args: {
    trigger: "Toggle details",
    children: "This is the expandable content.",
  },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const StartOpen: Story = {
  args: { open: true },
};

export const RichTrigger: Story = {
  args: {
    open: true,
    trigger: (
      <span>
        <strong>12</strong> events &mdash; <em>click to collapse</em>
      </span>
    ),
  },
};

export const TallContent: Story = {
  args: {
    open: true,
    children: (
      <ul>
        {Array.from({ length: 12 }, (_, i) => (
          <li key={i}>Item {i + 1}</li>
        ))}
      </ul>
    ),
  },
};
```

- [ ] **Step 4: Run the Collapsible tests to confirm they pass**

```bash
npm test -- src/ui/Collapsible/Collapsible.test.tsx
```

Expected: All 10 tests pass.

- [ ] **Step 5: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/ui/Collapsible/
git commit -m "feat(ui): add Collapsible component wrapping Base UI"
```

---

### Task 3: Update ChangelogRow callsite

**Files:**

- Modify: `src/components/ChangelogPage/ChangelogRow.tsx`

- [ ] **Step 1: Update the file**

Replace the import at the top:

```tsx
// Before
import { AnimatedDetails } from "../../ui/AnimatedDetails/AnimatedDetails";

// After
import { Collapsible } from "../../ui/Collapsible/Collapsible";
```

Also remove `type { ReactEventHandler }` from the React import if present (it's used by the old `onToggle` type; the new `onOpenChange` doesn't need it). The import line is:

```tsx
// Before
import React, { startTransition, useState } from "react";

// After (unchanged — ReactEventHandler was never imported here; it lived on the prop type)
import React, { startTransition, useState } from "react";
```

Replace the `<AnimatedDetails>` JSX (lines 60–98):

```tsx
// Before
<AnimatedDetails
  className={styles.row}
  summaryClassName={styles.summary}
  open={isOpen}
  onToggle={(e) => {
    const { open } = e.currentTarget as HTMLDetailsElement;
    // jsdom spuriously fires toggle on an outer <details> when a nested <details> toggles;
    // the state hasn't actually changed in that case, so guard against it.
    if (open === isOpen) {
      return;
    }
    setIsOpen(open);
    syncOpenToUrl(open);
    if (open) {
      onOpen();
    }
  }}
  summary={
    <>
      <time dateTime={summary.date} className={styles.date}>
        {format(new Date(summary.date), "MMM d, yyyy h:mm a")}
      </time>
      <span className={styles.counts}>
        <Chip tone="jade">{summary.createdCount} created</Chip>
        <Chip tone="cobalt">{summary.updatedCount} updated</Chip>
        <Chip tone="amber">{summary.deletedCount} deleted</Chip>
      </span>
    </>
  }
>
  <ChangelogEntryPanel
    entry={isError ? "error" : entry}
    sharedColumnState={sharedColumnState}
    openParam={openParam}
    position={position}
    navigate={navigate}
  />
</AnimatedDetails>

// After
<Collapsible
  className={styles.row}
  triggerClassName={styles.summary}
  open={isOpen}
  onOpenChange={(open) => {
    setIsOpen(open);
    syncOpenToUrl(open);
    if (open) {
      onOpen();
    }
  }}
  trigger={
    <>
      <time dateTime={summary.date} className={styles.date}>
        {format(new Date(summary.date), "MMM d, yyyy h:mm a")}
      </time>
      <span className={styles.counts}>
        <Chip tone="jade">{summary.createdCount} created</Chip>
        <Chip tone="cobalt">{summary.updatedCount} updated</Chip>
        <Chip tone="amber">{summary.deletedCount} deleted</Chip>
      </span>
    </>
  }
>
  <ChangelogEntryPanel
    entry={isError ? "error" : entry}
    sharedColumnState={sharedColumnState}
    openParam={openParam}
    position={position}
    navigate={navigate}
  />
</Collapsible>
```

Note: The `if (open === isOpen) { return; }` guard is removed. It existed because jsdom spuriously fires `toggle` events on outer `<details>` when nested `<details>` toggle. Base UI Collapsible uses `<div>`/`<button>` — this doesn't happen.

- [ ] **Step 2: Run the ChangelogRow tests**

```bash
npm test -- src/components/ChangelogPage/ChangelogRow.test.tsx
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/ChangelogPage/ChangelogRow.tsx
git commit -m "refactor(changelog): migrate ChangelogRow to Collapsible"
```

---

### Task 4: Update ChangelogEntryPanel callsite

**Files:**

- Modify: `src/components/ChangelogPage/ChangelogEntryPanel.tsx`

- [ ] **Step 1: Update the import**

```tsx
// Before
import { AnimatedDetails } from "../../ui/AnimatedDetails/AnimatedDetails";

// After
import { Collapsible } from "../../ui/Collapsible/Collapsible";
```

- [ ] **Step 2: Update the three AnimatedDetails instances**

There are three identical-in-shape instances for `created`, `updated`, and `deleted`. Update each one. Example for `created` (lines 175–200):

```tsx
// Before
<AnimatedDetails
  className={styles.group}
  summaryClassName={styles.groupSummary}
  open={openForPosition.has("created")}
  onToggle={(e) => syncGroupToUrl("created", (e.currentTarget as HTMLDetailsElement).open)}
  summary={
    <span>
      <span className={styles.groupVerbCreated}>Created</span>{" "}
      <Chip tone="neutral" className={styles.groupCount}>
        {entry.createdEvents.length}
      </Chip>
    </span>
  }
>
  <EventGroup ... />
</AnimatedDetails>

// After
<Collapsible
  className={styles.group}
  triggerClassName={styles.groupSummary}
  open={openForPosition.has("created")}
  onOpenChange={(open) => syncGroupToUrl("created", open)}
  trigger={
    <span>
      <span className={styles.groupVerbCreated}>Created</span>{" "}
      <Chip tone="neutral" className={styles.groupCount}>
        {entry.createdEvents.length}
      </Chip>
    </span>
  }
>
  <EventGroup ... />
</Collapsible>
```

Apply the same pattern for `updated` and `deleted`:

- `"created"` → `"updated"`, `groupVerbCreated` → `groupVerbUpdated`, `entry.createdEvents.length` → `entry.updatedEvents.length`, `createdSort` → `updatedSort`
- `"created"` → `"deleted"`, `groupVerbCreated` → `groupVerbDeleted`, `entry.createdEvents.length` → `entry.deletedEvents.length`, `createdSort` → `deletedSort`

The `<EventGroup>` children inside each block are unchanged.

- [ ] **Step 3: Run the ChangelogEntryPanel tests**

```bash
npm test -- src/components/ChangelogPage/ChangelogEntryPanel.test.tsx
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/ChangelogPage/ChangelogEntryPanel.tsx
git commit -m "refactor(changelog): migrate ChangelogEntryPanel to Collapsible"
```

---

### Task 5: Update ColumnControlsPanel callsite

**Files:**

- Modify: `src/components/EventTable/ColumnControlsPanel.tsx`

- [ ] **Step 1: Update the import**

```tsx
// Before
import { AnimatedDetails } from "../../ui/AnimatedDetails/AnimatedDetails";

// After
import { Collapsible } from "../../ui/Collapsible/Collapsible";
```

- [ ] **Step 2: Update the JSX (lines 142–154)**

```tsx
// Before
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

// After
<Collapsible
  className={styles.visibilityPanel}
  trigger={
    <>
      Customize columns
      <span className={styles.summaryChevron} aria-hidden="true">
        <ChevronRight size={14} />
      </span>
    </>
  }
>
  <ColumnCheckboxContent columnState={columnState} />
</Collapsible>
```

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 4: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/EventTable/ColumnControlsPanel.tsx
git commit -m "refactor(event-table): migrate ColumnControlsPanel to Collapsible"
```

---

### Task 6: Delete AnimatedDetails and useAnimatedDetails

**Files:**

- Delete: `src/ui/AnimatedDetails/AnimatedDetails.tsx`
- Delete: `src/ui/AnimatedDetails/AnimatedDetails.module.css`
- Delete: `src/ui/AnimatedDetails/AnimatedDetails.test.tsx`
- Delete: `src/ui/AnimatedDetails/AnimatedDetails.stories.tsx`
- Delete: `src/hooks/useAnimatedDetails.ts`
- Delete: `src/hooks/useAnimatedDetails.test.ts`

- [ ] **Step 1: Delete all old files**

```bash
rm -rf src/ui/AnimatedDetails
rm src/hooks/useAnimatedDetails.ts src/hooks/useAnimatedDetails.test.ts
```

- [ ] **Step 2: Run full test suite**

```bash
npm test
```

Expected: All tests pass. No references to `AnimatedDetails` or `useAnimatedDetails` remain.

- [ ] **Step 3: Run typecheck and lint**

```bash
npm run typecheck && npm run lint
```

Expected: No errors.

- [ ] **Step 4: Verify no remaining references**

```bash
grep -r "AnimatedDetails\|useAnimatedDetails" src/
```

Expected: No output.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(ui): delete AnimatedDetails and useAnimatedDetails hook"
```
