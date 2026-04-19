---
name: Custom lint rule local/no-inline-live-regions is load-bearing for accessibility
description: The custom ESLint rule blocking aria-live/role=alert/role=status is safety-critical and must always be tested and enforced as error
type: project
---

`local/no-inline-live-regions` is the project's enforcement mechanism for the "use announce() utility instead of inline live regions" rule in AGENTS.md. It is not a stylistic rule — it exists because inline `aria-live` / `role="alert"` / `role="status"` regions are buggy on Windows screen readers in React apps.

**Why:** Windows screen reader bugs in live regions caused real accessibility regressions. AGENTS.md documents this as a hard requirement. The rule is configured as `error`, not `warn`, because a missing announcement is an accessibility failure that ships silently.

**How to apply:**

- Any time this rule is touched, audited, or migrated, verify it is still enforced as `error` and still fires against: `aria-live` attribute (any value), `role="alert"`, `role="status"`.
- The rule has known coverage gaps that are worth re-checking on each audit: dynamic role (`role={var}`), role="log"/"marquee"/"timer" (all ARIA live regions), JSX spread attributes containing aria-live. Decide explicitly each time whether these should be caught or documented as out of scope.
- If no `*.test.*` file exists for this rule, flag it as a blocking issue. The rule is too important to leave untested.
- The `announce()` utility lives at `src/lib/announce.ts`.
