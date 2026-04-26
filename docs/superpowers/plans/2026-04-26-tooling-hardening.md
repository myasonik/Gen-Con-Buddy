# Tooling Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the tooling gap between Gen-Con-Buddy and camellia-fe by adopting camellia-fe's prettier config, stricter oxlint rules, stylelint, typecheck script, and full-suite pre-commit hook.

**Architecture:** Five independent layers applied in order. Each layer: update config → fix all violations → commit. Main stays green throughout. The pre-commit hook (Layer 5) goes in last because it enforces everything the earlier layers establish.

**Tech Stack:** Prettier 3, Oxlint 1.x, Stylelint 17, TypeScript strict, Husky 9, Vitest 2

---

## Files Changed

| File                       | Change                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `.prettierrc`              | Create — formatting config from camellia-fe                                                                    |
| `package.json`             | Add `typecheck`, `format:check`, `lint:css` scripts; update `lint` script; remove `lint-staged` config and dep |
| `.github/workflows/ci.yml` | Add `format:check` step to lint job                                                                            |
| `tsconfig.json`            | Add `noUncheckedSideEffectImports: true`                                                                       |
| `.oxlintrc.json`           | Replace with camellia-fe config (adapted paths)                                                                |
| `.oxlintignore`            | Create — replace inline `ignorePatterns`                                                                       |
| `.stylelintrc.json`        | Create — camellia-fe config                                                                                    |
| `.stylelintignore`         | Delete — stale Ember leftover                                                                                  |
| `src/styles/tokens.css`    | Convert `px` values to `rem`                                                                                   |
| `src/styles/global.css`    | Convert `px` values to `rem`                                                                                   |
| `src/**/*.module.css`      | Convert any `px`/`em` values to `rem`                                                                          |
| `src/**/*.ts(x)`           | Fix oxlint violations (return types, type imports, etc.)                                                       |
| `.husky/pre-commit`        | Replace `lint-staged` with full-suite gate                                                                     |

---

## Layer 1 — Prettier Config

### Task 1: Add `.prettierrc` and reformat everything

**Files:**

- Create: `.prettierrc`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Create `.prettierrc`**

  Create `/home/myasonik/Workspace/Gen-Con-Buddy/.prettierrc` with this exact content:

  ```json
  {
    "singleQuote": true,
    "trailingComma": "all",
    "semi": false,
    "printWidth": 100,
    "tabWidth": 2
  }
  ```

- [ ] **Step 2: Add `format:check` script to `package.json`**

  In the `"scripts"` block of `package.json`, add after `"format"`:

  ```json
  "format:check": "prettier --check .",
  ```

- [ ] **Step 3: Reformat the entire codebase**

  Run:

  ```bash
  npm run format
  ```

  This touches every `.ts`, `.tsx`, `.js`, `.json`, `.css`, and `.md` file. It is a purely cosmetic change — no logic is altered.

- [ ] **Step 4: Add `format:check` to CI**

  In `.github/workflows/ci.yml`, add a step to the `lint` job after the existing `Lint` step:

  ```yaml
  - name: Check Formatting
    run: npm run format:check
  ```

  The full `lint` job steps should now be:

  ```yaml
  steps:
    - uses: actions/checkout@v3
    - name: Install Node
      uses: actions/setup-node@v3
      with:
        node-version: 18
        cache: npm
    - name: Install Dependencies
      run: npm ci
    - name: Lint
      run: npm run lint
    - name: Check Formatting
      run: npm run format:check
  ```

- [ ] **Step 5: Verify**

  ```bash
  npm run format:check
  ```

  Expected: all files pass (exits 0). If any file fails, re-run `npm run format`.

- [ ] **Step 6: Commit**

  ```bash
  git add .prettierrc package.json .github/workflows/ci.yml src/ docs/
  git commit -m "chore: adopt camellia-fe prettier config, reformat codebase"
  ```

---

## Layer 2 — Typecheck Script & TypeScript Strictness

### Task 2: Add `typecheck` script and `noUncheckedSideEffectImports`

**Files:**

- Modify: `package.json`
- Modify: `tsconfig.json`

- [ ] **Step 1: Add `typecheck` script to `package.json`**

  In the `"scripts"` block, add after `"build"`:

  ```json
  "typecheck": "tsc -b --noEmit",
  ```

- [ ] **Step 2: Add `noUncheckedSideEffectImports` to `tsconfig.json`**

  In `tsconfig.json`, add `"noUncheckedSideEffectImports": true` after `"noFallthroughCasesInSwitch"`:

  ```json
  {
    "compilerOptions": {
      ...
      "noFallthroughCasesInSwitch": true,
      "noUncheckedSideEffectImports": true,
      ...
    }
  }
  ```

- [ ] **Step 3: Run typecheck and fix any errors**

  ```bash
  npm run typecheck
  ```

  Expected output: exits 0 with no errors (the codebase is already strict, this flag only affects bare side-effect imports like `import 'some-module'`). If any errors appear, fix them before proceeding.

- [ ] **Step 4: Commit**

  ```bash
  git add package.json tsconfig.json
  git commit -m "chore: add typecheck script and noUncheckedSideEffectImports"
  ```

---

## Layer 3 — Oxlint Tightening

### Task 3: Replace `.oxlintrc.json` and fix all violations

**Files:**

- Modify: `.oxlintrc.json`
- Create: `.oxlintignore`
- Modify: `package.json`
- Modify: `src/**/*.ts(x)` — fix all violations

- [ ] **Step 1: Create `.oxlintignore`**

  Create `/home/myasonik/Workspace/Gen-Con-Buddy/.oxlintignore` with:

  ```
  dist
  storybook-static
  public/mockServiceWorker.js
  src/routeTree.gen.ts
  src/test/setup.ts
  ```

- [ ] **Step 2: Replace `.oxlintrc.json`**

  Replace the entire contents of `.oxlintrc.json` with:

  ```json
  {
    "categories": {
      "suspicious": "error",
      "style": "error"
    },
    "rules": {
      "no-nested-ternary": "error",
      "typescript/no-non-null-assertion": "error",
      "typescript/no-floating-promises": "error",
      "typescript/no-explicit-any": "error",
      "typescript/explicit-function-return-type": "error",
      "typescript/explicit-module-boundary-types": "error",
      "typescript/no-empty-object-type": "error",
      "typescript/no-import-type-side-effects": "error",
      "react-hooks/exhaustive-deps": "error",
      "react/button-has-type": "error",
      "react/jsx-no-constructed-context-values": "error",
      "react/no-danger": "error",
      "vitest/require-mock-type-parameters": "error",
      "new-cap": "error",
      "react/react-in-jsx-scope": "off",
      "sort-keys": "off",
      "no-null": "off",
      "no-magic-numbers": "off",
      "id-length": "off",
      "unicorn/filename-case": "off",
      "no-ternary": "off",
      "react/jsx-max-depth": "off",
      "react/jsx-props-no-spreading": "off",
      "capitalized-comments": "off",
      "func-style": "off",
      "jest/no-hooks": "off",
      "jest/no-conditional-expect": "error",
      "jest/no-untyped-mock-factory": "off",
      "vitest/prefer-describe-function-title": "off",
      "vitest/no-importing-vitest-globals": "off",
      "vitest/prefer-import-in-mock": "off",
      "vitest/prefer-called-with": "error",
      "vitest/prefer-called-times": "error",
      "vitest/prefer-called-once": "off",
      "vitest/prefer-strict-boolean-matchers": "error",
      "vitest/prefer-to-be-truthy": "off",
      "vitest/prefer-to-be-falsy": "off",
      "max-statements": "off",
      "sort-imports": "off",
      "typescript/consistent-type-imports": "error"
    },
    "plugins": ["react", "typescript", "react-hooks", "jsx-a11y", "vitest"],
    "env": { "browser": true },
    "overrides": [
      {
        "files": ["src/lib/announce.ts", "src/main.tsx"],
        "rules": {
          "jest/require-hook": "off"
        }
      },
      {
        "files": ["src/ui/Button/Button.tsx"],
        "rules": {
          "react/button-has-type": "off"
        }
      },
      {
        "files": ["vite.config.ts"],
        "rules": {
          "new-cap": "off"
        }
      }
    ]
  }
  ```

  Note: `src/ui/Button/Button.tsx` differs from camellia-fe's `src/ui/Button.tsx` — Gen-Con-Buddy uses a subdirectory per component.

- [ ] **Step 3: Update `lint` script to use `.oxlintignore`**

  In `package.json`, update the `lint` script:

  ```json
  "lint": "oxlint --ignore-path .oxlintignore -c .oxlintrc.json . && eslint .",
  ```

- [ ] **Step 4: Run oxlint and see the violations**

  ```bash
  npx oxlint --ignore-path .oxlintignore -c .oxlintrc.json .
  ```

  This will produce a list of violations. Fix them all before committing. The most common patterns are below.

- [ ] **Step 5: Fix `typescript/explicit-function-return-type` violations**

  Every function and arrow function without an explicit return type will be flagged. Add return type annotations.

  Common patterns:

  ```tsx
  // Before
  export function MyComponent({ name }: Props) {
    return <div>{name}</div>;
  }

  // After
  export function MyComponent({ name }: Props): JSX.Element {
    return <div>{name}</div>;
  }
  ```

  ```ts
  // Before
  const fetchData = async (id: string) => {
    const res = await api.get(id);
    return res.data;
  };

  // After
  const fetchData = async (id: string): Promise<Data> => {
    const res = await api.get(id);
    return res.data;
  };
  ```

  For React components, use `JSX.Element` (single element), `React.ReactNode` (anything renderable), or `null`.
  For hooks that return nothing, use `: void`.
  For event handlers, use `: void`.

- [ ] **Step 6: Fix `typescript/consistent-type-imports` violations**

  Any import that only imports types must use `import type`:

  ```ts
  // Before
  import { Event, SearchParams } from "../utils/types";

  // After
  import type { Event, SearchParams } from "../utils/types";
  ```

  If an import mixes values and types, use inline `type` for the type-only members:

  ```ts
  import { someFunction, type SomeType } from "./module";
  ```

- [ ] **Step 7: Fix `typescript/no-explicit-any` violations**

  Replace `any` with the actual type. If the type is genuinely unknown, use `unknown` and add a type guard.

  ```ts
  // Before
  function handleError(err: any) { ... }

  // After
  function handleError(err: unknown) { ... }
  ```

- [ ] **Step 8: Fix `typescript/no-non-null-assertion` violations**

  Remove `!` assertions. Use type guards or early returns instead.

  ```ts
  // Before
  const value = map.get(key)!;

  // After
  const value = map.get(key);
  if (!value) throw new Error(`Missing key: ${key}`);
  ```

  Exception: `announce.ts` already has a `!` that may need a targeted oxlint-disable comment if the null case is genuinely impossible. Check each case.

- [ ] **Step 9: Fix `react/button-has-type` violations**

  Every `<button>` element that lacks a `type` attribute needs one:

  ```tsx
  // Before
  <button onClick={handleClick}>Click me</button>

  // After
  <button type="button" onClick={handleClick}>Click me</button>
  ```

  Submit buttons inside forms get `type="submit"`.

- [ ] **Step 10: Fix `typescript/no-floating-promises` violations**

  Any `async` function call whose return value is not awaited or explicitly handled:

  ```ts
  // Before
  someAsyncFunction();

  // After — if you need the result
  await someAsyncFunction();

  // After — if you explicitly don't care about the result
  void someAsyncFunction();
  ```

  In React event handlers that are themselves synchronous, use `void`:

  ```tsx
  <button type="button" onClick={() => void handleAsyncClick()}>
  ```

- [ ] **Step 11: Re-run oxlint to confirm 0 violations**

  ```bash
  npx oxlint --ignore-path .oxlintignore -c .oxlintrc.json .
  ```

  Expected: no output, exits 0.

- [ ] **Step 12: Run full lint to confirm ESLint also passes**

  ```bash
  npm run lint
  ```

  Expected: exits 0.

- [ ] **Step 13: Run tests to confirm nothing is broken**

  ```bash
  npm test
  ```

  Expected: all tests pass.

- [ ] **Step 14: Commit**

  ```bash
  git add .oxlintrc.json .oxlintignore package.json src/
  git commit -m "chore: adopt camellia-fe oxlint config, fix all violations"
  ```

---

## Layer 4 — Stylelint

### Task 4: Wire up stylelint and fix all CSS violations

**Files:**

- Create: `.stylelintrc.json`
- Delete: `.stylelintignore`
- Modify: `package.json`
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/global.css`
- Modify: `src/**/*.module.css` — fix px/em violations

- [ ] **Step 1: Install stylelint packages**

  ```bash
  npm install --save-dev stylelint@^17.8.0 stylelint-config-standard@^40.0.0
  ```

- [ ] **Step 2: Create `.stylelintrc.json`**

  Create `/home/myasonik/Workspace/Gen-Con-Buddy/.stylelintrc.json` with:

  ```json
  {
    "extends": ["stylelint-config-standard"],
    "rules": {
      "selector-class-pattern": null,
      "color-function-notation": null,
      "color-function-alias-notation": null,
      "alpha-value-notation": null,
      "property-no-unknown": [
        true,
        {
          "ignoreProperties": ["composes"]
        }
      ],
      "value-keyword-case": [
        "lower",
        {
          "ignoreProperties": ["composes"]
        }
      ],
      "unit-disallowed-list": ["px", "em"]
    }
  }
  ```

- [ ] **Step 3: Delete `.stylelintignore`**

  ```bash
  rm .stylelintignore
  ```

  The stale Ember-era ignore file is replaced by `--ignore-path .gitignore` in the script.

- [ ] **Step 4: Add `lint:css` script and update `lint` in `package.json`**

  Update the `lint` script and add `lint:css`:

  ```json
  "lint": "oxlint --ignore-path .oxlintignore -c .oxlintrc.json . && eslint . && npm run lint:css",
  "lint:css": "stylelint '**/*.css' --ignore-path .gitignore",
  ```

- [ ] **Step 5: Run stylelint to see violations**

  ```bash
  npm run lint:css
  ```

  The main violations will be `unit-disallowed-list` (px/em values). Fix them all.

- [ ] **Step 6: Fix `tokens.css` — convert all px values to rem**

  Replace the contents of `src/styles/tokens.css`:

  ```css
  /* ─── Design Tokens ──────────────────────────────────────────────────────── */
  :root {
    /* Spacing — 8px grid */
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-3: 1rem;
    --space-4: 1.5rem;
    --space-5: 2rem;

    /* Sizes */
    --size-sidebar: 22.5rem;
    --size-detail-max: 50rem;

    /* Motion */
    --motion-press: 30ms linear;
    --motion-hover: 80ms ease;
    --motion-expand: 150ms ease-out;

    /* Z-index scale */
    --z-content: 1;
    --z-sticky: 10;
    --z-header: 20;
    --z-popover: 30;
    --z-modal: 40;

    /* interpolate-size: allow <details> height: auto transitions */
    interpolate-size: allow-keywords;
  }
  ```

  Conversion reference: `4px=0.25rem`, `8px=0.5rem`, `16px=1rem`, `24px=1.5rem`, `32px=2rem`, `360px=22.5rem`, `800px=50rem`.

- [ ] **Step 7: Fix `global.css` — convert px values to rem**

  In `src/styles/global.css`, convert every `px` value:
  - `1px` → `0.0625rem` (used in `.sr-only`, form control border, scrollbar sizing)
  - `8px` → `0.5rem` (used in `::-webkit-scrollbar`)
  - `0.01ms` is `ms` not `px` — leave as-is

  The updated file:

  ```css
  /* ─── Global Reset ───────────────────────────────────────────────────────── */
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    min-height: 100vh;
  }

  /* ─── Screen Reader Utility ──────────────────────────────────────────────── */
  .sr-only {
    position: absolute;
    width: 0.0625rem;
    height: 0.0625rem;
    padding: 0;
    margin: -0.0625rem;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* ─── Form Controls ──────────────────────────────────────────────────────── */
  /* Normalize input/select/textarea border so all form controls match */
  input,
  select,
  textarea {
    border: 0.0625rem solid;
  }

  /* ─── Scrollbars ─────────────────────────────────────────────────────────── */
  /* Classic (non-overlay) scrollbars, always visible when content overflows */
  ::-webkit-scrollbar {
    width: 0.5rem;
    height: 0.5rem;
  }

  ::-webkit-scrollbar-thumb {
    background-color: CanvasText;
  }

  ::-webkit-scrollbar-track {
    background-color: Canvas;
  }

  * {
    scrollbar-width: thin;
    scrollbar-color: CanvasText Canvas;
  }

  /* ─── Reduced Motion ─────────────────────────────────────────────────────── */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```

- [ ] **Step 8: Fix `px`/`em` violations in all `*.module.css` files**

  Run stylelint again to see which component CSS files have violations:

  ```bash
  npm run lint:css
  ```

  For each flagged file, convert `px` values to `rem` using the same conversion factor (`value / 16`):
  - `1px` → `0.0625rem`
  - `2px` → `0.125rem`
  - `4px` → `0.25rem`
  - `8px` → `0.5rem`
  - `10px` → `0.625rem`
  - `12px` → `0.75rem`
  - `14px` → `0.875rem`
  - `16px` → `1rem`
  - `20px` → `1.25rem`
  - `24px` → `1.5rem`
  - `32px` → `2rem`
  - `40px` → `2.5rem`
  - `48px` → `3rem`

  If a value like `360px` appears in a component, convert it too (`360/16 = 22.5rem`). Prefer using the `--size-*` or `--space-*` token instead if one matches the intent.

- [ ] **Step 9: Re-run lint:css to confirm 0 violations**

  ```bash
  npm run lint:css
  ```

  Expected: exits 0.

- [ ] **Step 10: Run full lint and tests**

  ```bash
  npm run lint && npm test
  ```

  Expected: both exit 0.

- [ ] **Step 11: Commit**

  ```bash
  git add .stylelintrc.json package.json package-lock.json src/styles/ src/
  git rm .stylelintignore
  git commit -m "chore: add stylelint, convert px/em to rem throughout"
  ```

---

## Layer 5 — Pre-Commit Hook Upgrade

### Task 5: Replace lint-staged with full-suite pre-commit gate

**Files:**

- Modify: `.husky/pre-commit`
- Modify: `package.json` — remove `lint-staged` config and devDependency

- [ ] **Step 1: Update `.husky/pre-commit`**

  Replace the entire contents of `.husky/pre-commit` with:

  ```sh
  npm run typecheck
  npm run lint
  npx vitest run
  ```

- [ ] **Step 2: Remove `lint-staged` from `package.json`**

  In `package.json`:

  a. Remove `"lint-staged": "^16.4.0"` from `devDependencies`.

  b. Remove the entire `"lint-staged"` config block at the bottom of the file:

  ```json
  "lint-staged": {
    "*.{ts,tsx,js,json,md}": "prettier --write",
    "*.{ts,tsx,js}": [
      "oxlint --fix",
      "eslint --fix"
    ]
  }
  ```

- [ ] **Step 3: Uninstall lint-staged**

  ```bash
  npm uninstall lint-staged
  ```

- [ ] **Step 4: Smoke-test the pre-commit hook manually**

  ```bash
  npm run typecheck && npm run lint && npx vitest run
  ```

  Expected: all three commands exit 0. This is exactly what the hook runs.

- [ ] **Step 5: Commit**

  ```bash
  git add .husky/pre-commit package.json package-lock.json
  git commit -m "chore: replace lint-staged pre-commit with full typecheck + lint + test suite"
  ```

---

## Verification

After all five layers are committed, confirm the full success criteria from the spec:

```bash
npm run typecheck    # exits 0
npm run lint         # exits 0 (oxlint + eslint + stylelint)
npm run format:check # exits 0
npm test             # exits 0
```

Make a test commit with a deliberate violation to confirm the hook blocks it:

```bash
# Add a type error to any file, try to commit, confirm it's blocked
# Then revert
```
