# Design: Clip resize handles to table bounds

**Date:** 2026-05-02  
**Status:** Approved

## Problem

Column resize handles in `EventTable` are portaled to `document.body` and positioned with `position: fixed` + CSS Anchor Positioning. Because they live outside the `tableWrapper`'s overflow boundary, the rightmost column's handle bleeds 0.75rem past the table's right edge and overlaps adjacent page content.

## Solution

Introduce a thin clip wrapper around the table. Portal resize handles into that wrapper instead of `document.body`. Change handle positioning from `fixed` to `absolute` so the wrapper's `overflow: clip` constrains them.

## Architecture

### New wrapper element

Wrap the existing `.tableWrapper` div in a `.tableClipWrapper` div. Use a state-based callback ref so that when the wrapper mounts, a state update triggers a re-render and the portal can render:

```jsx
const [clipWrapper, setClipWrapper] = (useState < HTMLDivElement) | (null > null);

<div ref={setClipWrapper} className={styles.tableClipWrapper}>
  <div className={styles.tableWrapper}>
    <table>…</table>
  </div>
</div>;
```

A plain `useRef` cannot be used here — ref changes do not trigger re-renders, so `createPortal` would never see a non-null target.

### Portal target change

```jsx
// Before
createPortal(handles, document.body);

// After
clipWrapper && createPortal(handles, clipWrapper);
```

The guard means handles render on the second paint (after mount). This is imperceptible to users.

### CSS changes

**`.tableClipWrapper`** (new rule):

```css
.tableClipWrapper {
  position: relative; /* containing block for absolute handles */
  overflow: clip; /* clips overflow without creating BFC */
}
```

`overflow: clip` is used over `overflow: hidden` deliberately — it clips painted overflow without establishing a new block formatting context, avoiding any unintended stacking context or scroll side effects.

**`.resizeHandle`** (changed):

```css
.resizeHandle {
  position: absolute; /* was: fixed */
  position-visibility: anchors-visible; /* hide when anchor is off-screen */
  /* all anchor() / anchor-size() declarations unchanged */
}
```

Changing to `position: absolute` makes `tableClipWrapper` the containing block. CSS Anchor Positioning resolves `left: anchor(right)` relative to that containing block, tracking the `<th>`'s visual position even as the inner `tableWrapper` scrolls horizontally.

`position-visibility: anchors-visible` is a CSS Anchor Positioning built-in that hides the handle automatically when its anchor `<th>` is fully clipped by an overflow container. This prevents handles from appearing at off-screen coordinates for columns scrolled completely out of view.

## Data flow

1. `tableWrapper` scrolls → `<th>` elements move visually
2. CSS Anchor Positioning re-resolves `left: anchor(right)` for each handle
3. Handles move to follow their anchor's visual right edge
4. Any handle extending past `tableClipWrapper`'s boundary is clipped by `overflow: clip`
5. Handles whose anchor is fully scrolled off-screen are hidden by `position-visibility: anchors-visible`

## Testing

- Existing resize handle render/pointer-event tests require no changes (internal portal target is an implementation detail that tests don't assert on).
- Add one new test: after render, assert that resize handles are children of the `tableClipWrapper` element, not `document.body`. This pins the portal target against future regression.

## What is not changing

- Handle appearance (size, position relative to column border, hover/active styles)
- Drag-resize UX for all columns including the last
- `tableWrapper` scroll behavior
- Mobile hide rule (`@media (width <= 60rem)`)
- `ColumnActionsPopover` and `ColumnResizeDialog`
