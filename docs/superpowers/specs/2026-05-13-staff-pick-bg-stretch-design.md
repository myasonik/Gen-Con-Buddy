---
title: Staff Pick background image — stretch across consecutive rows
date: 2026-05-13
status: approved
---

## Problem

Both the desktop table and mobile card list apply `background-image` to individual staff-pick rows/items. Each element positions the image relative to its own top-left corner, so all picks show the same crop of the image instead of a continuous stretch across the group.

## Approach: parent container as image canvas

Move the background image from individual staff-pick elements up to their shared parent container. Non-pick elements paint over the container image with explicit solid `background-color`s. Staff-pick elements are transparent — they contribute no background of their own, so the parent's image shows through the CSS table/list rendering layers.

This is pure CSS with no DOM restructuring and no JS. As picks are added, removed, or reordered, the effect is automatic.

## Desktop table

**Container:** `.tableWrapper` (the `overflow-x: scroll` div in `EventTable.module.css`).

This is a better anchor than `<tbody>` because `.tableWrapper`'s width is bounded by the viewport, so `background-size: cover` scales the image relative to the visible area rather than the full scrollable content width.

**Changes:**
- `.tableWrapper` gains `background-image` (image + `oklch` overlay), `background-size: cover`, `background-position: center 60%`. Dark-mode rule matches.
- `tr[data-staff-pick]` drops the `background-image` and `background-size`/`background-position` declarations. It keeps only a transparent `background-color` (no value needed — `transparent` is the initial value, so the existing rule can simply be removed and the `background-color: var(--color-surface-page)` overrides removed too).
- Non-pick rows already have explicit backgrounds (`var(--color-surface-page)` odd, `var(--color-surface-row-alt)` even) that paint over the container image — no changes needed.

**Bonus:** Since the image lives on the scroll container, scrolling the table horizontally leaves the image fixed while transparent pick rows slide over it — a subtle parallax.

## Mobile card list

**Container:** `.list` (the `<ul>` in `EventListMobile.module.css`).

**Changes:**
- `.list` gains `background-image` (same image + overlay), `background-size: cover`, `background-position: center 60%`. Dark-mode rule matches desktop.
- `.item[data-staff-pick]` drops `background-color: var(--color-accent-surface)` (replaced by transparency revealing the list bg).
- Non-pick items need explicit backgrounds because they're currently transparent (relying on the page surface colour bleeding through). Add `background-color: var(--color-surface-page)` to `.item` as a base. `.item:nth-child(even)` already has `var(--color-surface-row-alt)` — no change needed.

**`background-size` note:** For `StaffPickCallout` (7 items, ~600–800px tall) `cover` works cleanly. For a very long search-results list, `cover` scales the image relative to the full list height, which can zoom in heavily. If this looks poor in practice, switch `.list` to `background-size: 100% auto` (scales to container width, maintains aspect ratio) — picks will then show a horizontal strip of the image at their vertical position. Tune during implementation.

## Overlay gradient

Both views use the same multi-layer technique already on desktop:

```css
background-image:
  linear-gradient(
    oklch(from var(--color-surface-page) l c h / 0.82),
    oklch(from var(--color-surface-page) l c h / 0.82)
  ),
  url('/wildhavens-bg.webp');
```

The gradient is a flat semi-transparent wash of the surface colour, ensuring text is legible over any part of the image. Dark mode repeats the same declaration (the CSS variable resolves correctly in dark context).

## What does NOT change

- `data-staff-pick` attribute logic in both components — unchanged
- `EventTable.tsx`, `EventListMobile.tsx` — no changes
- The Staff Pick badge, `StaffPickCallout` wrapper, or any other component

## Testing

Existing tests exercise the `data-staff-pick` attribute presence and the badge rendering. No new test cases are required for this purely visual change. Visual smoke-test checklist:

- [ ] Single staff pick in search results — image visible, adjacent non-picks unaffected
- [ ] Two or more consecutive picks — image stretches seamlessly across all of them
- [ ] All-picks list (StaffPickCallout mobile) — image covers full list
- [ ] Desktop table: same checks for `<tr>` rows
- [ ] Light + dark mode for both views
- [ ] Horizontal table scroll: image parallax looks intentional, not broken
