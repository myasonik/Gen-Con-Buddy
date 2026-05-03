# Package Upgrades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade 11 packages across 5 sequential waves, each landing as its own passing PR before the next wave begins.

**Architecture:** Each wave installs only the packages for that increment. The package.json currently has all target versions as an uncommitted draft; Task 1 resets it to the committed baseline so changes land one wave at a time. No shims, no compatibility wrappers — clean installs and fix-forward only.

**Tech Stack:** npm, TypeScript 5→6, Vite 5→8, Vitest 2→4, ESLint 9→10, React 18→19, date-fns 3→4, jsdom 25→29

---

### Task 1: Reset baseline and verify green

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Verify all quality checks pass on the current committed state**

```bash
npm run lint && npm run typecheck && npm test
```

Expected: all pass. If anything is red, fix it before proceeding — every wave needs to start from a green baseline.

- [ ] **Step 2: Reset package.json to the committed (pre-draft) state**

The working-tree `package.json` has all target versions drafted but uncommitted. The target versions are recorded in `docs/superpowers/specs/2026-05-03-package-upgrades-design.md`. Reset to the committed baseline so each wave's diff is minimal:

```bash
git checkout -- package.json
```

Verify the reset by confirming `react` is still at `^18.3.1`:

```bash
grep '"react"' package.json
```

Expected output:

```
    "react": "^18.3.1",
```

- [ ] **Step 3: Confirm node_modules is aligned with the baseline**

```bash
npm install
```

Expected: no version changes, only lock-file alignment (or a no-op if already in sync).

---

### Task 2: Wave 1 — jsdom + date-fns

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Branch**

```bash
git checkout -b deps/wave-1-jsdom-date-fns
```

- [ ] **Step 2: Bump jsdom and date-fns in package.json**

In `package.json` `devDependencies`, change:

```json
"jsdom": "^25.0.1",
```

to:

```json
"jsdom": "^29.1.1",
```

In `dependencies`, change:

```json
"date-fns": "^3.6.0",
```

to:

```json
"date-fns": "^4.1.0",
```

- [ ] **Step 3: Install**

```bash
npm install
```

- [ ] **Step 4: Verify no UTC-suffixed date-fns APIs are in use**

date-fns v4's breaking changes are limited to UTC API renames. Confirm none are used:

```bash
grep -r "UTCDate\|addDaysToUTC\|subDaysFromUTC\|startOfUTC\|endOfUTC" src/
```

Expected: no output. All five date-fns-using files (`EventDetail.tsx`, `ChangelogRow.tsx`, `googleCalendar.ts`, `EventListMobile.tsx`, `columns.tsx`) only call `format()`, which is unchanged in v4.

- [ ] **Step 5: Run the quality gate**

```bash
npm run lint && npm run typecheck && npm test
```

Expected: all pass. If a test fails, it is a jsdom behavior change — read the failure message and update the test to match new behavior (e.g., a DOM API that changed its return value or error type between jsdom 25 and 29).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps(wave-1): bump jsdom 25→29, date-fns 3→4"
```

- [ ] **Step 7: Open PR and merge**

```bash
gh pr create --title "deps(wave-1): bump jsdom 25→29, date-fns 3→4" --body "$(cat <<'EOF'
Bumps jsdom (test environment only) and date-fns.

date-fns v4 breaking changes are UTC API renames — not used here. All five date-fns files only call \`format()\`.

Quality gate: lint ✓ typecheck ✓ test ✓
EOF
)"
```

After the PR merges, pull main:

```bash
git checkout main && git pull
```

---

### Task 3: Wave 2 — ESLint

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Branch from updated main**

```bash
git checkout -b deps/wave-2-eslint
```

- [ ] **Step 2: Bump eslint in package.json**

In `package.json` `devDependencies`, change:

```json
"eslint": "^9.39.4",
```

to:

```json
"eslint": "^10.3.0",
```

- [ ] **Step 3: Install**

```bash
npm install
```

- [ ] **Step 4: Run the quality gate**

```bash
npm run lint && npm run typecheck && npm test
```

Expected: all pass. The project already uses flat config (`eslint.config.js`) and ESM (`"type": "module"` in `package.json`), so ESLint 10's removal of CommonJS output requires no config changes. `@typescript-eslint/parser@8` is compatible with ESLint 10.

If `npm run lint` fails with a plugin-not-found or peer dependency error, check whether any installed ESLint plugin needs a bump for ESLint 10 compatibility and install the updated version.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps(wave-2): bump eslint 9→10"
```

- [ ] **Step 6: Open PR and merge**

```bash
gh pr create --title "deps(wave-2): bump eslint 9→10" --body "$(cat <<'EOF'
ESLint 10 drops CJS output. No config changes needed — project uses flat config and ESM already.

Quality gate: lint ✓ typecheck ✓ test ✓
EOF
)"
```

```bash
git checkout main && git pull
```

---

### Task 4: Wave 3 — Vite + @vitejs/plugin-react + vitest

**Files:**

- Modify: `package.json`
- Modify: `vite.config.ts`

- [ ] **Step 1: Branch from updated main**

```bash
git checkout -b deps/wave-3-vite-vitest
```

- [ ] **Step 2: Confirm @tanstack/router-plugin supports Vite 8**

```bash
npm info @tanstack/router-plugin peerDependencies
```

The currently installed version (1.167.22) declares `vite: '>=5.0.0 || >=6.0.0'`. Vite 8 satisfies `>=6.0.0`, so no bump is needed. If the output shows a range that excludes Vite 8, bump `@tanstack/router-plugin` to the latest `^1` release and add it to this wave's diff.

- [ ] **Step 3: Bump vite, @vitejs/plugin-react, and vitest in package.json**

In `package.json` `devDependencies`, change:

```json
"@vitejs/plugin-react": "^4.3.4",
```

to:

```json
"@vitejs/plugin-react": "^6.0.1",
```

Change:

```json
"vite": "^5.4.14",
```

to:

```json
"vite": "^8.0.10",
```

Change:

```json
"vitest": "^2.1.9"
```

to:

```json
"vitest": "^4.1.5"
```

- [ ] **Step 4: Install**

```bash
npm install
```

Do **not** install `@rolldown/plugin-babel` or `babel-plugin-react-compiler`. These are optional peer deps for the React Compiler opt-in feature, which this project does not use.

- [ ] **Step 5: Update vite.config.ts for vitest v4**

vitest v4 removes the `/// <reference types="vitest" />` triple-slash directive. Replace it by importing `defineConfig` from `vitest/config` instead of `vite`. `vitest/config` re-exports the full Vite config API plus the typed `test` block — no other changes to the file are needed.

Replace the top of `vite.config.ts`:

```typescript
/// <reference types="vitest" />
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
```

with:

```typescript
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
```

The rest of `vite.config.ts` is unchanged.

- [ ] **Step 6: Run the quality gate**

```bash
npm run lint && npm run typecheck && npm test
```

Expected: all pass. If a test fails with an unexpected vitest error, check the [vitest v3 migration guide](https://vitest.dev/guide/migration#migrating-from-vitest-2) and [v4 migration guide](https://vitest.dev/guide/migration) for the specific error pattern. The most likely culprit is a renamed `pool` or `poolOptions` key; if so, update the relevant key in the `test` block of `vite.config.ts`.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vite.config.ts
git commit -m "deps(wave-3): bump vite 5→8, @vitejs/plugin-react 4→6, vitest 2→4"
```

- [ ] **Step 8: Open PR and merge**

```bash
gh pr create --title "deps(wave-3): bump vite 5→8, plugin-react 4→6, vitest 2→4" --body "$(cat <<'EOF'
Vite 8 (Rolldown internals), @vitejs/plugin-react 6 (requires Vite 8), vitest 4 (requires Vite 6+).

Config change: replaced \`/// <reference types="vitest" />\` + \`import { defineConfig } from "vite"\` with \`import { defineConfig } from "vitest/config"\`.

Quality gate: lint ✓ typecheck ✓ test ✓
EOF
)"
```

```bash
git checkout main && git pull
```

---

### Task 5: Wave 4 — React 18 → 19

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Branch from updated main**

```bash
git checkout -b deps/wave-4-react-19
```

- [ ] **Step 2: Bump react packages in package.json**

In `package.json` `dependencies`, change:

```json
"react": "^18.3.1",
"react-dom": "^18.3.1",
```

to:

```json
"react": "^19.2.5",
"react-dom": "^19.2.5",
```

In `devDependencies`, change:

```json
"@types/react": "^18.3.1",
"@types/react-dom": "^18.3.1",
```

to:

```json
"@types/react": "^19.2.14",
"@types/react-dom": "^19.2.3",
```

- [ ] **Step 3: Install**

```bash
npm install
```

- [ ] **Step 4: Run the quality gate**

```bash
npm run lint && npm run typecheck && npm test
```

Expected: all pass. Pre-migration scan confirmed zero deprecated React 18 APIs in the codebase. `@testing-library/react@16` and Storybook 10 both already support React 19.

**If `npm run typecheck` fails** with `useRef` errors: React 19 changed `useRef()` called with no argument to return `RefObject<undefined>`. All existing `useRef` calls in this codebase already pass `null` and carry an explicit generic (`useRef<T>(null)`), so this should not occur — but if it does, add the explicit type argument.

**If a test fails** with an unexpected effect-count assertion: React 19 removed the development-mode double-invocation of effects. Update the expectation to count single invocations.

`React.forwardRef` is soft-deprecated in React 19 but still fully functional — no changes are required to `Button.tsx`, `createIcon.tsx`, or `QuestionMark.tsx`.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps(wave-4): bump react + react-dom + @types/* 18→19"
```

- [ ] **Step 6: Open PR and merge**

```bash
gh pr create --title "deps(wave-4): bump react 18→19" --body "$(cat <<'EOF'
React 19, react-dom 19, @types/react 19, @types/react-dom 19.

Pre-migration scan confirmed no deprecated API usage. @testing-library/react@16 and Storybook 10 already support React 19.

Quality gate: lint ✓ typecheck ✓ test ✓
EOF
)"
```

```bash
git checkout main && git pull
```

---

### Task 6: Wave 5 — TypeScript 6

**Files:**

- Modify: `package.json`
- Possibly modify: source files with new type errors

- [ ] **Step 1: Branch from updated main**

```bash
git checkout -b deps/wave-5-typescript-6
```

- [ ] **Step 2: Bump typescript in package.json**

In `package.json` `devDependencies`, change:

```json
"typescript": "^5.6.3",
```

to:

```json
"typescript": "^6.0.3",
```

- [ ] **Step 3: Install**

```bash
npm install
```

- [ ] **Step 4: Run typecheck and fix any errors**

```bash
npm run typecheck
```

TypeScript 6 strengthens inference around module augmentation, generic constraints, and some `isolatedModules` edge cases. With `strict: true` already in `tsconfig.json`, new errors will surface as hard failures. Fix forward — do not relax any `tsconfig.json` options.

Common TypeScript 6 error patterns to watch for:

| Error pattern                                                               | Fix                                                                                                                                                             |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Type 'X' is not assignable to 'Y'` where `Y` is narrower than TS5 inferred | Add an explicit type annotation at the declaration or call site                                                                                                 |
| Module augmentation error on a `declare global` block                       | The file must be a module — add `export {}` if it has no other imports/exports                                                                                  |
| `Namespace 'X' has no exported member 'Y'`                                  | A `lib.d.ts` type was removed; find the replacement in the [TypeScript 6.0 release notes](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/) |

After fixing all errors, re-run to confirm clean:

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 5: Run the full quality gate**

```bash
npm run lint && npm run typecheck && npm test
```

Expected: all pass.

- [ ] **Step 6: Commit**

Stage `package.json`, `package-lock.json`, and any source files that needed type fixes:

```bash
git add package.json package-lock.json
# If source files were changed:
# git add src/path/to/changed-file.ts
git commit -m "deps(wave-5): bump typescript 5→6; fix type errors"
```

- [ ] **Step 7: Open PR and merge**

```bash
gh pr create --title "deps(wave-5): bump typescript 5→6" --body "$(cat <<'EOF'
TypeScript 6. Fixed any type errors surfaced by stricter inference.

Quality gate: lint ✓ typecheck ✓ test ✓
EOF
)"
```

```bash
git checkout main && git pull
```

All 5 waves complete. `package.json` now matches the target versions from the spec.
