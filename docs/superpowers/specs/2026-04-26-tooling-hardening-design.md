# Tooling Hardening: Adopt camellia-fe Practices

**Date:** 2026-04-26
**Status:** Approved

## Goal

Close the tooling gap between Gen-Con-Buddy and camellia-fe. camellia-fe is the reference implementation. Where configs can be copied wholesale, they will be. Existing violations are fixed as each layer lands — no deferred cleanup.

## Approach

Layer by layer. Each layer: update config → fix all violations → commit. Main stays green throughout. The pre-commit hook is the last layer; it enforces everything the earlier layers established.

---

## Layer 1 — Prettier config

**What:** Add `.prettierrc` copied from camellia-fe.

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "semi": false,
  "printWidth": 100,
  "tabWidth": 2
}
```

**Also:** Add `"format:check": "prettier --check ."` to `package.json` scripts and add it as a step in the existing `lint` CI job (`.github/workflows/ci.yml`) after `npm run lint`.

**Fix step:** Run `prettier --write .` after adding the config. This reformats every file in one shot — a large but purely cosmetic diff with no logic changes.

---

## Layer 2 — Scripts & TypeScript

**Scripts to add to `package.json`:**

- `"typecheck": "tsc -b --noEmit"` — standalone type check without building

**TypeScript change:** Add `"noUncheckedSideEffectImports": true` to `tsconfig.app.json` under `compilerOptions`.

**Fix step:** Run `npm run typecheck` and fix any errors that surface. Expected to be few since strict mode is already on.

---

## Layer 3 — Oxlint tightening

**What:** Replace `.oxlintrc.json` with camellia-fe's config.

Key additions over the current config:

- Enable `"suspicious"` and `"style"` categories as errors (currently only 3 individual rules are active)
- Add specific rules: `no-non-null-assertion`, `no-floating-promises`, `no-explicit-any`, `explicit-function-return-type`, `explicit-module-boundary-types`, `no-empty-object-type`, `react/button-has-type`, `react/jsx-no-constructed-context-values`, `react/no-danger`
- Add vitest matcher specificity rules

**Fix step:** Run `oxlint .` and fix all violations. `explicit-function-return-type` will flag every arrow function and component missing a return type — expect a large fix commit touching many files.

---

## Layer 4 — Stylelint

**What:** Fix the existing broken stylelint setup and wire it into the lint pipeline.

Current state: `.stylelintrc.json` exists but is not in any script. `.stylelintignore` references Ember paths (stale leftover).

**Changes:**

- Replace `.stylelintrc.json` with camellia-fe's config: `stylelint-config-standard` base, rem-only units (no `px`/`em`), CSS Modules `composes` allowed
- Delete the stale `.stylelintignore` file — camellia-fe uses `--ignore-path .gitignore` instead of a separate ignore file
- Add `"lint:css": "stylelint '**/*.css' --ignore-path .gitignore"` to `package.json` scripts
- Add `&& npm run lint:css` to the end of the existing `lint` script

**Fix step:** Run `npm run lint:css` and fix all violations. The rem-only rule will require converting raw `px`/`em` values in CSS modules and token files to `rem` equivalents.

---

## Layer 5 — Pre-commit hook

**What:** Replace the current `lint-staged`-based pre-commit with camellia-fe's full-suite gate.

**Current `.husky/pre-commit`:**

```sh
npx lint-staged
```

**New `.husky/pre-commit`:**

```sh
npm run typecheck
npm run lint
npx vitest run
```

**Also:** Delete the inert `.husky/commit-msg` stub — it references a `./h` helper that doesn't exist in this repo and does nothing.

**Rationale for dropping `lint-staged`:** lint-staged only checks staged files, which means you can commit code that breaks things outside your touched files. Running the full suite catches cross-file breakage. The tradeoff is slower commits, but with 26 test files the suite is fast enough.

**`lint-staged` config in `package.json`** can be removed entirely once this is in place.

---

## What is NOT changing

- ESLint config — already matches camellia-fe (same custom `no-inline-live-regions` rule, same plugins)
- Architecture — routes/components/ui split, CSS Modules, design tokens
- Testing methodology — MSW, co-located tests, Testing Library
- CI jobs for lint and test — already present; only `format:check` is being added

---

## Success criteria

- `npm run typecheck` exits 0
- `npm run lint` exits 0 (oxlint + eslint + stylelint)
- `npm run format:check` exits 0
- `npx vitest run` exits 0
- Pre-commit hook blocks a commit that introduces a type error, lint violation, or test failure
- No `px`/`em` units in any `.css` file
- No `any`, non-null assertions, or missing return type annotations in source files
