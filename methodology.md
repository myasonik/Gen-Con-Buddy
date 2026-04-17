**Tech Stack:** Vite 5, React 18, TypeScript 5, TanStack Router v1, TanStack Query v5, React Hook Form v7, Vitest 2, React Testing Library 16, MSW v2

---

Ways of Working
Test-driven development (strictly)

- Write the failing test first, before any implementation code. No exceptions — not
  for features, not for bug fixes.
- Tests co-locate with the code they test.

Subagents without ceremony

- Use parallel agents automatically when tasks are independent. Never ask permission
  to spawn them.

---

Architecture Decisions

Route files are thin shells

- src/routes/ contains only auth guards + component pointers.
- All logic lives in src/components/. This enables code-splitting.

Test files in route directories, excluded from scanning

- Co-location with routes, but routeFileIgnorePattern prevents them from being picked
  up as routes.

MSW for all network mocking

- Never mock the backend or internal modules directly.
- A shared server + handlers in src/test/msw/, with per-test overrides via
  server.use(...).

---

Code Philosophy

No speculative abstraction

- Three similar lines beats a premature abstraction.
- No deferred cleanup, no compatibility shims, no features for hypothetical future
  needs.

Use onSettled not onSuccess for mandatory side effects

- Side effects that must run regardless of server response (e.g., clearing tokens) go
  in onSettled.

Semantic HTML only, no CSS-in-JS or UI libraries for styling

- Plain semantic elements. Use well-maintained libraries for substantial problems
  (auth, routing, forms) — not for layout.

No nested interactive elements

- Cards with multiple actions use sibling DOM structure, not nesting.
- Use real <button> and <a> elements — never fake interactivity with onClick on divs.
