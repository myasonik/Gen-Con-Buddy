# ESLint → oxlint Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace ESLint as the primary linter with oxlint, keeping a minimal residual ESLint config solely for the custom `local/no-inline-live-regions` rule that oxlint cannot express.

**Architecture:** oxlint handles all standard linting (react-hooks, TypeScript, no-nested-ternary) via `oxlint.json`. A stripped `eslint.config.js` retains only the custom JSX rule, using `@typescript-eslint/parser` to parse `.tsx` files. Both linters run sequentially via `npm run lint`.

**Tech Stack:** oxlint, eslint (residual), @typescript-eslint/parser, eslint-config-prettier

---

## Files

- **Modify:** `package.json` — devDependencies, `lint` script, `lint-staged`
- **Create:** `oxlint.json` — oxlint configuration
- **Modify:** `eslint.config.js` — stripped to custom rule only

---

### Task 1: Swap dependencies

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Install oxlint and the standalone TypeScript parser**

The residual ESLint config needs `@typescript-eslint/parser` to parse `.tsx` files (previously pulled in transitively by `typescript-eslint`). Install both new direct dependencies:

```bash
npm install oxlint @typescript-eslint/parser --save-dev
```

Expected: both added to `devDependencies` in `package.json`.

- [ ] **Step 2: Remove packages that are no longer needed**

```bash
npm uninstall @eslint/js eslint-plugin-react-hooks eslint-plugin-react-refresh typescript-eslint globals
```

Expected: those five packages removed from `package.json` devDependencies.

- [ ] **Step 3: Verify oxlint is installed**

```bash
npx oxlint --version
```

Expected: prints a version string like `oxlint v0.x.x` and exits 0.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add oxlint, drop unused eslint plugins"
```

---

### Task 2: Create oxlint.json

**Files:**

- Create: `oxlint.json`

- [ ] **Step 1: Create the config at the repo root**

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript"],
  "env": {
    "browser": true,
    "es2020": true
  },
  "rules": {
    "no-nested-ternary": "error",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  },
  "ignorePatterns": ["dist", "public/mockServiceWorker.js"]
}
```

- [ ] **Step 2: Run oxlint and verify it passes**

```bash
npx oxlint .
```

Expected: exits 0. If it reports errors, they reflect real violations in the current codebase — fix them before proceeding (see Step 3). If it reports warnings, review them: suppress with `// oxlint-disable-next-line <rule>` only if the warning is a genuine false-positive.

- [ ] **Step 3: Fix any oxlint violations (if Step 2 produced errors)**

Fix each error at its source. Do not mass-suppress. Commit each fix with a message like `fix: resolve oxlint <rule> violation`.

- [ ] **Step 4: Commit**

```bash
git add oxlint.json
git commit -m "chore: add oxlint config"
```

---

### Task 3: Strip eslint.config.js to custom rule only

**Files:**

- Modify: `eslint.config.js`

- [ ] **Step 1: Replace the entire contents of eslint.config.js**

```js
import tsParser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier";

const noInlineLiveRegions = {
  meta: { type: "problem", schema: [] },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name === "aria-live") {
          context.report({
            node,
            message:
              "Use announce() from src/lib/announce.ts instead of aria-live. Inline live regions are unreliable on Windows screen readers.",
          });
        }
        if (
          node.name.name === "role" &&
          node.value?.type === "Literal" &&
          (node.value.value === "alert" || node.value.value === "status")
        ) {
          context.report({
            node,
            message: `Use announce() from src/lib/announce.ts instead of role="${node.value.value}". Inline live regions are unreliable on Windows screen readers.`,
          });
        }
      },
    };
  },
};

export default [
  { ignores: ["dist", "public/mockServiceWorker.js"] },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      local: { rules: { "no-inline-live-regions": noInlineLiveRegions } },
    },
    rules: {
      "local/no-inline-live-regions": "error",
    },
  },
  eslintConfigPrettier,
];
```

- [ ] **Step 2: Run ESLint and verify it passes on the current codebase**

```bash
npx eslint .
```

Expected: exits 0 with no errors. Only the custom rule is active — no TS or react-hooks rules.

- [ ] **Step 3: Verify the custom rule still fires on a violation**

Open any `.tsx` file and temporarily add `aria-live="polite"` to a JSX element, e.g.:

```tsx
<div aria-live="polite">test</div>
```

Then run:

```bash
npx eslint src/
```

Expected: error on that line — `Use announce() from src/lib/announce.ts instead of aria-live. Inline live regions are unreliable on Windows screen readers.`

Revert the temporary change before proceeding.

- [ ] **Step 4: Commit**

```bash
git add eslint.config.js
git commit -m "chore: strip eslint config to no-inline-live-regions rule only"
```

---

### Task 4: Update lint script and lint-staged

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Update the lint script**

In `package.json`, change:

```json
"lint": "eslint ."
```

to:

```json
"lint": "oxlint . && eslint ."
```

- [ ] **Step 2: Update lint-staged**

In `package.json`, change:

```json
"lint-staged": {
  "*.{ts,tsx,js,json,md}": "prettier --write",
  "*.{ts,tsx,js}": "eslint --fix"
}
```

to:

```json
"lint-staged": {
  "*.{ts,tsx,js,json,md}": "prettier --write",
  "*.{ts,tsx,js}": ["oxlint --fix", "eslint --fix"]
}
```

- [ ] **Step 3: Run the full lint command and verify both linters pass**

```bash
npm run lint
```

Expected: oxlint runs and exits 0, then ESLint runs and exits 0. Total time should be noticeably faster than the old `eslint .` alone.

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore: update lint script and lint-staged to use oxlint"
```
