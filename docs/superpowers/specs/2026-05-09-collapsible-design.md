# Collapsible: replace AnimatedDetails with Base UI

Date: 2026-05-09

## Goal

Replace the hand-rolled `AnimatedDetails` component and its `useAnimatedDetails` hook with a thin wrapper around Base UI's `Collapsible` primitive. The migration improves accessibility (canonical `<button aria-expanded>` disclosure pattern), eliminates JS-driven animation class manipulation, and aligns with the project's existing use of Base UI for interactive controls.

## What changes

### Deleted

- `src/ui/AnimatedDetails/` (entire directory: component, CSS module, tests, stories)
- `src/hooks/useAnimatedDetails.ts`
- `src/hooks/useAnimatedDetails.test.ts`

### New

- `src/ui/Collapsible/Collapsible.tsx`
- `src/ui/Collapsible/Collapsible.module.css`
- `src/ui/Collapsible/Collapsible.test.tsx`
- `src/ui/Collapsible/Collapsible.stories.tsx`

### Updated callsites

- `src/components/ChangelogPage/ChangelogRow.tsx`
- `src/components/ChangelogPage/ChangelogEntryPanel.tsx`
- `src/components/EventTable/ColumnControlsPanel.tsx`

## Component API

```tsx
interface CollapsibleProps {
  trigger: ReactNode; // was: summary
  triggerClassName?: string; // was: summaryClassName
  children: ReactNode;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void; // was: onToggle (ReactEventHandler<HTMLDetailsElement>)
}
```

`open` and `onOpenChange` are both optional. When neither is provided, Base UI manages the open state internally (starts closed). When `open` is provided, the component is controlled — callers must pair it with `onOpenChange` to update state.

## Implementation

The wrapper delegates entirely to Base UI:

```tsx
<Collapsible.Root open={open} onOpenChange={onOpenChange} className={className}>
  <Collapsible.Trigger className={triggerClassName}>{trigger}</Collapsible.Trigger>
  <Collapsible.Panel className={styles.panel}>
    <div className={styles.panelInner}>{children}</div>
  </Collapsible.Panel>
</Collapsible.Root>
```

- `Collapsible.Root` renders a `<div>`
- `Collapsible.Trigger` renders a `<button>` with `aria-expanded` and `aria-controls` wired automatically
- `Collapsible.Panel` renders a `<div>` with `hidden` when closed, plus Base UI's CSS custom properties during animation

No custom hook. No JS class manipulation.

## Animation

CSS-only, driven by Base UI's data attributes and CSS custom property:

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

.panelInner {
  overflow: hidden;
}
```

`--collapsible-panel-height` is set by Base UI on the panel element during transitions. `data-starting-style` and `data-ending-style` target the before/after states for the enter and exit animations respectively. The inner wrapper's `overflow: hidden` prevents child padding from creating a minimum height floor — same role as `contentInner` in the old CSS.

This replaces the `is-opening` / `is-closing` / `is-animating` class approach entirely.

## Callsite migration

Controlled callers (`ChangelogRow`, `ChangelogEntryPanel`) change:

```diff
- <AnimatedDetails
-   summary={...}
-   summaryClassName={styles.foo}
-   open={isOpen}
-   onToggle={(e) => {
-     const { open } = e.currentTarget as HTMLDetailsElement;
-     doSomething(open);
-   }}
- >
+ <Collapsible
+   trigger={...}
+   triggerClassName={styles.foo}
+   open={isOpen}
+   onOpenChange={(open) => {
+     doSomething(open);
+   }}
+ >
```

Uncontrolled callers (`ColumnControlsPanel`) change only the import path and prop name:

```diff
- <AnimatedDetails
-   className={styles.visibilityPanel}
-   summary={...}
- >
+ <Collapsible
+   className={styles.visibilityPanel}
+   trigger={...}
+ >
```

## Testing

`Collapsible.test.tsx` covers:

- Renders trigger button and panel content
- `triggerClassName` applies to the trigger button
- `className` applies to the root
- `open={true}` starts expanded; `open={false}` starts collapsed
- `onOpenChange` is called with the correct boolean when the trigger is clicked
- Clicking the trigger on a closed uncontrolled collapsible opens it
- Clicking the trigger on an open uncontrolled collapsible closes it

No animation behavior tests — Base UI owns the transition logic; testing it would be testing the library.

## Accessibility notes

The `<button aria-expanded>` + `aria-controls` pattern is the canonical ARIA disclosure widget. This is an improvement over `<details>/<summary>`, which has inconsistent screen reader support across browser/AT combinations. Base UI wires the aria attributes automatically.

The `hiddenUntilFound` prop on `Collapsible.Panel` (not used initially) can be added later to restore native browser find-in-page expansion if needed.
