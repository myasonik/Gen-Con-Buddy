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

`src/test/setup.ts` pins `process.env.TZ = 'America/Indianapolis'` so date formatting tests (day names, times) are deterministic on any CI box. Gen Con is held in Indianapolis every year, so all date display is relative to that timezone.

## Global CSS Escape Hatches

One global utility class in `src/styles/global.css` is intentionally used as a bare string (bypassing CSS Modules encapsulation). Do not replace it with a CSS Module import.

- `.sr-only` — screen-reader-only visually hidden pattern. Used where `composes:` would require a pseudo-element workaround (e.g. `Badge.tsx`).

## Key Architecture Decisions

**Table library:** TanStack Table (headless). MUI X Data Grid was considered and rejected — it requires `@mui/material` and Emotion CSS-in-JS as peer dependencies, which conflicts with the "no external styled UI libraries" rule.

**EventDetail `<dl>` layout:** `<dt>`/`<dd>` pairs are stacked (label above value), not side-by-side. Side-by-side requires a fixed label width that breaks visually with long label names.

## Accessibility

Never use inline `aria-live` regions or `role="alert"` / `role="status"` on rendered elements. Windows screen readers are buggy around dynamically inserted live regions, which all React apps produce. Always use the `announce()` utility from `src/lib/announce.ts` instead. Call `announce()` imperatively (e.g., in a `useEffect` or event handler) when something needs to be read out to screen readers.

This is enforced by the `local/no-inline-live-regions` ESLint rule in `eslint.config.js`. The rule is an error, not a warning — the build will fail if violated.

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`myasonik/Gen-Con-Buddy`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default label strings — `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo — `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
