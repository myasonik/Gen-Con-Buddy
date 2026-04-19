# Agents

## Subagents

Always use subagents without asking. Never prompt the user to confirm whether subagents should be used — just use them when warranted.

## Philosophy

Use semantic HTML elements. Use the `src/ui/` component library for shared UI primitives. No external _styled_ UI component libraries. Headless accessibility primitives (`@base-ui/react`) are allowed for interactive overlays and controls where the a11y cost of hand-rolling is high (popover, toggle, dialog). All styling via CSS Modules; global tokens in `src/styles/tokens.css`; reset/utilities in `src/styles/global.css`.

Use well-maintained open source libraries for substantial problems (auth, data fetching, routing, forms). Don't hand-roll what the ecosystem solves well.

Write tests first. Every feature, every bug fix. No exceptions.

Keep the codebase clean as you go — no deferred cleanup, no compatibility shims, no speculative abstractions.

## Architecture

Route files (`src/routes/`) are thin: auth guard in `beforeLoad` + `component:` pointing to a component. All page logic lives in `src/components/`. This split is required for TanStack Router code-splitting.

Test files co-locate with route files in `src/routes/` and are excluded from route scanning via `routeFileIgnorePattern` in `vite.config.ts`.

## Testing

All tests use MSW for network interception — never mock API requests or internal modules directly. The MSW server and its default handlers live in `src/test/msw/`. Override specific handlers per-test with `server.use(...)`.

## Accessibility

Never use inline `aria-live` regions or `role="alert"` / `role="status"` on rendered elements. Windows screen readers are buggy around dynamically inserted live regions, which all React apps produce. Always use the `announce()` utility from `src/lib/announce.ts` instead. Call `announce()` imperatively (e.g., in a `useEffect` or event handler) when something needs to be read out to screen readers.

This is enforced by the `local/no-inline-live-regions` ESLint rule in `eslint.config.js`. The rule is an error, not a warning — the build will fail if violated.
