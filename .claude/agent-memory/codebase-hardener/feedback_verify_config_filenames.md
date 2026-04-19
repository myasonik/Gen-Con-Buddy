---
name: Always verify tool config files are at their auto-discovery filename
description: Tools silently ignore config files at non-standard names — check with --print-config or equivalent, don't just read the JSON
type: feedback
---

When a tool (linter, formatter, test runner, bundler) has a config file in the repo, verify the tool actually loads it. Reading the JSON and assuming it's active is not enough.

**Why:** During the oxlint migration audit (2026-04-19), the repo had a tracked `oxlint.json` with carefully-crafted rules AND an untracked `.oxlintrc.json` with minimal rules. oxlint auto-discovers only `.oxlintrc.json`, so `oxlint.json` was silently ignored for every lint invocation. `npm run lint` still exited 0, giving false confidence. The fix was obvious only after running `npx oxlint --print-config` and seeing that the resolved plugin list and rule list did not match `oxlint.json`.

**How to apply:**

- For any tool with a config file, find out the exact filename(s) it auto-discovers (check `--help`, docs, or source). Common traps: `oxlint` wants `.oxlintrc.json` not `oxlint.json`; `eslint` wants `eslint.config.js` or `.eslintrc.*`; `prettier` wants `.prettierrc*` or `prettier.config.*`.
- Run the tool's "print resolved config" command (`npx oxlint --print-config`, `npx eslint --print-config <file>`, `npx prettier --find-config-path <file>`) and diff against what the committed file says.
- If the repo has two files that look like they might both be configs for the same tool, that's almost always a bug. Flag it immediately.
- Untracked config files in a worktree are especially suspect — they make the working copy behave differently from a fresh clone / CI. Always check for them when auditing tool config changes.
