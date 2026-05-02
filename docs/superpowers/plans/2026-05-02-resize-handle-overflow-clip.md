# Resize Handle Overflow Clip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clip column resize handles to the table's visible bounds so they cannot bleed outside the table's right edge.

**Architecture:** Wrap the existing `tableWrapper` div in a new `tableClipWrapper` div that has `position: relative; overflow: clip`. Portal resize handles into `tableClipWrapper` (via a state-based callback ref that triggers a re-render on mount) instead of `document.body`. Change handle positioning from `position: fixed` to `position: absolute` so the wrapper's `overflow: clip` naturally clips any overflow.

**Tech Stack:** React (useState, createPortal), CSS Modules, CSS Anchor Positioning

**Spec:** `docs/superpowers/specs/2026-05-02-resize-handle-overflow-clip-design.md`

---

## File Map

| File                                      | Change                                                                |
| ----------------------------------------- | --------------------------------------------------------------------- |
| `src/ui/EventTable/EventTable.tsx`        | Add `useState` callback ref; wrap `tableWrapper`; retarget portal     |
| `src/ui/EventTable/EventTable.module.css` | Add `.tableClipWrapper`; update `.resizeHandle` position + visibility |
| `src/ui/EventTable/EventTable.test.tsx`   | Add portal-target pin test                                            |

---

### Task 1: Write and verify the failing test

**Files:**

- Modify: `src/ui/EventTable/EventTable.test.tsx`

- [ ] **Step 1: Add the portal-target pin test**

Open `src/ui/EventTable/EventTable.test.tsx` and add this test at the bottom of the file (after the last existing test):

```tsx
test("resize handles portal into the table clip wrapper, not document.body", async () => {
  await renderEventTable([makeEvent()]);
  const handles = screen.getAllByTestId(/^resize-handle-/);
  expect(handles.length).toBeGreaterThan(0);
  const clipWrapper = document.querySelector("[data-testid='table-clip-wrapper']");
  expect(clipWrapper).not.toBeNull();
  expect(clipWrapper).toContainElement(handles[0]);
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/ui/EventTable/EventTable.test.tsx --reporter=verbose
```

Expected: the new test fails — `clipWrapper` will be `null` because the `data-testid` doesn't exist yet, so `expect(clipWrapper).not.toBeNull()` throws. All other tests should still pass.

---

### Task 2: Implement the clip wrapper

**Files:**

- Modify: `src/ui/EventTable/EventTable.tsx` (lines ~1, ~155–159, ~238–259)
- Modify: `src/ui/EventTable/EventTable.module.css` (lines ~1–4, ~240–250)

- [ ] **Step 3: Add `useState` import and callback ref**

In `src/ui/EventTable/EventTable.tsx`, line 1, `useState` is already imported. No import change needed — it's already there:

```tsx
import { useState, useId } from "react";
```

Inside the component function, find where local state is declared (around line 35–45 — look for the `useState` calls). Add the clip wrapper state alongside the other state declarations:

```tsx
const [clipWrapper, setClipWrapper] = useState<HTMLDivElement | null>(null);
```

- [ ] **Step 4: Wrap the tableWrapper div and add data-testid**

In `src/ui/EventTable/EventTable.tsx`, find the `<div className={styles.tableWrapper}>` (around line 159). Wrap it in the clip wrapper div:

```tsx
<div ref={setClipWrapper} className={styles.tableClipWrapper} data-testid="table-clip-wrapper">
  <div className={styles.tableWrapper}>
    <table>{/* ... existing table content unchanged ... */}</table>
  </div>
</div>
```

Do not change anything inside the `tableWrapper` div — only the outer wrapping changes.

- [ ] **Step 5: Retarget the portal**

In `src/ui/EventTable/EventTable.tsx`, find the `createPortal(...)` call (around line 238). Change its second argument from `document.body` to `clipWrapper`, and guard it with a null check:

```tsx
{
  clipWrapper &&
    createPortal(
      table
        .getHeaderGroups()
        .flatMap((hg) => hg.headers)
        .filter((h) => h.column.getCanResize())
        .map((header) => (
          <div
            key={header.id}
            className={styles.resizeHandle}
            style={
              {
                positionAnchor: `--col-${tableId}-${header.id}`,
              } as React.CSSProperties & { positionAnchor: string }
            }
            onPointerDown={header.getResizeHandler()}
            aria-hidden="true"
            data-testid={`resize-handle-${header.id}`}
            data-resizing={header.column.getIsResizing() || undefined}
          />
        )),
      clipWrapper,
    );
}
```

- [ ] **Step 6: Add `.tableClipWrapper` CSS rule**

In `src/ui/EventTable/EventTable.module.css`, add a new rule immediately before `.tableWrapper` (at the very top of the file, before line 1):

```css
.tableClipWrapper {
  position: relative;
  overflow: clip;
}
```

`overflow: clip` is intentional — unlike `overflow: hidden` it does not establish a new block formatting context, avoiding unintended stacking context or scroll side effects on the inner `tableWrapper`.

- [ ] **Step 7: Update `.resizeHandle` positioning**

In `src/ui/EventTable/EventTable.module.css`, find `.resizeHandle` (around line 240 after the new rule is added). Change `position: fixed` to `position: absolute` and add `position-visibility: anchors-visible`:

```css
.resizeHandle {
  position: absolute;
  position-visibility: anchors-visible;
  left: anchor(right);
  top: anchor(top);
  height: anchor-size(height);
  width: 1.5rem;
  transform: translateX(-50%);
  cursor: col-resize;
  background: transparent;
  user-select: none;
  z-index: var(--z-sticky);
}
```

All other `.resizeHandle` rules (the `::after`, `:hover::after`, `[data-resizing]::after`, and `@media` rules) remain unchanged.

- [ ] **Step 8: Run the full test suite**

```bash
npx vitest run src/ui/EventTable/EventTable.test.tsx --reporter=verbose
```

Expected: all tests pass, including the new portal-target pin test.

- [ ] **Step 9: Run typecheck and lint**

```bash
npm run typecheck && npm run lint
```

Expected: no errors. (Pre-existing lint warnings about `label-has-associated-control` and `anchor-has-content` in other files are known and can be ignored.)

- [ ] **Step 10: Commit**

```bash
git add src/ui/EventTable/EventTable.tsx src/ui/EventTable/EventTable.module.css src/ui/EventTable/EventTable.test.tsx
git commit -m "fix(event-table): clip resize handles to table bounds via portal retargeting"
```
