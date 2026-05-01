# Replace Prettier with Oxfmt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Prettier with Oxfmt (the OXC formatter), enforce formatting in the pre-commit hook, and remove now-unused Prettier dependencies.

**Architecture:** Straight dependency swap — uninstall `prettier` and `eslint-config-prettier`, install `oxfmt`, update scripts, clean up config files, reformat the codebase under Oxfmt defaults, then wire `format:check` into the pre-commit hook last (so the hook doesn't block the reformat commit).

**Tech Stack:** oxfmt, npm, husky

---

## Files

- Modify: `package.json` — swap deps, update `format` and `format:check` scripts
- Modify: `eslint.config.js` — remove `eslint-config-prettier` import and spread
- Modify: `.husky/pre-commit` — add `npm run format:check`
- Delete: `.prettierrc`
- Keep: `.prettierignore` — oxfmt reads it by default alongside `.gitignore`

---

### Task 1: Swap npm dependencies

**Files:**

- Modify: `package.json` (devDependencies)

- [ ] **Step 1: Uninstall prettier and eslint-config-prettier**

```bash
npm uninstall prettier eslint-config-prettier
```

Expected: both packages removed from `package.json` devDependencies and `node_modules`.

- [ ] **Step 2: Install oxfmt**

```bash
npm install --save-dev oxfmt
```

Expected: `oxfmt` appears in `package.json` devDependencies.

- [ ] **Step 3: Verify oxfmt is installed**

```bash
npx oxfmt --version
```

Expected: prints a version string, e.g. `oxfmt 0.x.x`.

---

### Task 2: Remove eslint-config-prettier from ESLint config

**Files:**

- Modify: `eslint.config.js`

- [ ] **Step 1: Remove the import and the spread**

Edit `eslint.config.js`. Remove line 3 (the import) and line 51 (the spread):

```js
// Before:
import eslintConfigPrettier from 'eslint-config-prettier'
// ...
export default [
  { ignores: ['dist', 'public/mockServiceWorker.js', 'src/routeTree.gen.ts'] },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      local: { rules: { 'no-inline-live-regions': noInlineLiveRegions } },
    },
    rules: {
      'react-hooks/exhaustive-deps': 'error',
      'local/no-inline-live-regions': 'error',
    },
  },
  eslintConfigPrettier,
]

// After:
export default [
  { ignores: ['dist', 'public/mockServiceWorker.js', 'src/routeTree.gen.ts'] },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      local: { rules: { 'no-inline-live-regions': noInlineLiveRegions } },
    },
    rules: {
      'react-hooks/exhaustive-deps': 'error',
      'local/no-inline-live-regions': 'error',
    },
  },
]
```

- [ ] **Step 2: Verify ESLint still runs cleanly**

```bash
npm run lint
```

Expected: exits 0, no errors (the two active rules — `react-hooks/exhaustive-deps` and `local/no-inline-live-regions` — are unaffected by this change).

---

### Task 3: Update npm scripts and delete .prettierrc

**Files:**

- Modify: `package.json` (scripts)
- Delete: `.prettierrc`

- [ ] **Step 1: Update the format scripts in package.json**

In `package.json`, change the `format` and `format:check` scripts:

```json
"format": "oxfmt --write .",
"format:check": "oxfmt --check .",
```

- [ ] **Step 2: Delete .prettierrc**

```bash
rm .prettierrc
```

`.prettierignore` stays — oxfmt reads it by default.

- [ ] **Step 3: Verify oxfmt can run (diffs expected at this point)**

```bash
npm run format:check
```

Expected: exits non-zero and lists files that need reformatting. This is correct — the codebase hasn't been reformatted yet.

- [ ] **Step 4: Commit the infrastructure changes**

```bash
git add package.json package-lock.json eslint.config.js .prettierrc
git commit -m "chore: replace prettier with oxfmt"
```

---

### Task 4: Reformat the codebase

**Files:**

- Modify: all source files (formatting only)

- [ ] **Step 1: Run oxfmt over the whole codebase**

```bash
npm run format
```

Expected: oxfmt rewrites files in-place under its defaults. Many files will be touched.

- [ ] **Step 2: Verify format:check now passes**

```bash
npm run format:check
```

Expected: exits 0. All files are now formatted.

- [ ] **Step 3: Verify tests still pass**

```bash
npm test
```

Expected: all tests pass. Reformatting is whitespace-only and cannot affect test behaviour.

- [ ] **Step 4: Verify typecheck still passes**

```bash
npm run typecheck
```

Expected: exits 0.

- [ ] **Step 5: Commit the reformat**

```bash
git add -A
git commit -m "chore: reformat codebase with oxfmt defaults"
```

---

### Task 5: Enforce formatting in the pre-commit hook

**Files:**

- Modify: `.husky/pre-commit`

- [ ] **Step 1: Add format:check to the pre-commit hook**

Edit `.husky/pre-commit` so it reads:

```sh
npm run typecheck
npm run lint
npm run format:check
npm test
```

- [ ] **Step 2: Verify the hook works by doing a dry run**

```bash
npm run typecheck && npm run lint && npm run format:check && npm test
```

Expected: all four commands exit 0.

- [ ] **Step 3: Commit**

```bash
git add .husky/pre-commit
git commit -m "chore: enforce formatting in pre-commit hook"
```
