# ADR 002: MSW-Only Network Mocking

**Status:** Accepted

## Context

Tests that mock internal modules (e.g. `vi.mock("../../utils/api")`) decouple from the actual HTTP contract. Bugs in parameter serialisation inside the API utilities — such as incorrect URL construction in `fetchEvents` — go undetected because the mock replaces the entire fetch path. The goal is tests that verify the full stack from a React Query hook down to the HTTP request.

## Decision

Network interception via MSW only. `vi.mock` is never used on internal API utilities or fetch helpers. MSW intercepts at the network layer, so tests exercise the complete path from `useQuery` through `fetchEvents` through the actual `fetch` call, with only the HTTP response faked.

The MSW server and its default handlers live in `src/test/msw/` (`server.ts`, `handlers.ts`, `factory.ts`). The server is started in `src/test/setup.ts` with `onUnhandledRequest: "error"` so unexpected requests fail loudly. Per-test handler overrides use `server.use(...)` inside individual test files, with `afterEach(() => server.resetHandlers())` restoring defaults between tests.

## Consequences

- Tests are slower than pure unit tests that mock internals, but they catch serialisation bugs and contract drift.
- Adding a new API endpoint requires a corresponding default handler in `src/test/msw/handlers.ts` (or a per-test override) or the test will fail with an unhandled request error.
- The pattern extends to all network-dependent components regardless of which hook or utility they use.
