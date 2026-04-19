---
name: When auditing linter changes, always quantify rule coverage loss
description: Linter config changes frequently drop rules silently — compare before/after by running old config against deliberately-bad code
type: feedback
---

When reviewing changes to linter configs (ESLint, oxlint, or swaps between them), do not trust summaries like "oxlint handles all standard linting". Quantify actual rule coverage.

**Why:** The oxlint migration audit (2026-04-19) found that the new config silently dropped `@typescript-eslint/no-explicit-any`, `no-empty-interface`, `ban-ts-comment`, and 14 of the 16 `react-hooks/*` recommended rules. Migration docs claimed parity; reality was significant regression. Warnings-vs-errors also matters: warnings don't fail CI.

**How to apply:**

- Stash the old config, run it against a small TS/TSX file with `any`, empty interface, `@ts-ignore`, conditional hook call, missing `useEffect` dep, nested ternary. Note what errors/warnings it reports.
- Restore the new config, run against the same file. Compute the delta.
- Verify `npm run lint` exit code on a file with only warnings — warnings often exit 0 and miss CI gating.
- For each plugin "recommended" preset that's being replaced, enumerate the rules it expanded to (e.g. `console.log(plugin.configs.recommended.rules)`), not just the package name.
- Always report the delta explicitly in the audit, with concrete rule names that are now silently permitted.
