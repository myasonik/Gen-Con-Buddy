# ADR 004: No External Styled UI Component Libraries

**Status:** Accepted

## Context

MUI X Data Grid was evaluated as a table option for `EventTable`. It was rejected because it requires `@mui/material` and Emotion CSS-in-JS as peer dependencies. Emotion manages styles at runtime via a separate styling system that conflicts with the CSS Modules architecture used throughout this codebase.

The broader pattern applies to any external UI library that brings its own styling mechanism (Emotion, styled-components, Chakra, Mantine, etc.).

## Decision

No external styled UI component libraries. All visual styling goes through CSS Modules, with global design tokens in `src/styles/tokens.css` and reset/utility classes in `src/styles/global.css`. The shared UI component library lives in `src/ui/`.

`@base-ui/react` headless primitives are explicitly approved for interactive components where hand-rolling the accessibility behaviour is high-cost. It is used for: Popover (`Toggletip`, `ColumnActionsPopover`), Dialog (`ColumnControlsPanel`, `ColumnResizeDialog`), Combobox (`EventTypeSelect`), Button (`Button`), and Field (`Field`). All styling of these components is done entirely via CSS Modules — `@base-ui/react` contributes only behaviour and ARIA wiring.

## Consequences

- The `src/ui/` component library is the only source of reusable UI primitives.
- New interactive components with high a11y cost (popover, dialog, combobox, toggle) may use `@base-ui/react` for behaviour, but must be styled exclusively via CSS Modules.
- Dependency choices for future table, chart, or data-display needs must be headless or plain, not styled.
