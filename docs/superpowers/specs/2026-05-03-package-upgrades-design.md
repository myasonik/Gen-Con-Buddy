# Package Upgrades Design

**Date:** 2026-05-03
**Scope:** Upgrade 11 packages across 5 sequential waves

## Background

The following packages were bumped in `package.json` but not yet installed:

| Package                | From    | To       |
| ---------------------- | ------- | -------- |
| `date-fns`             | ^3.6.0  | ^4.1.0   |
| `react`                | ^18.3.1 | ^19.2.5  |
| `react-dom`            | ^18.3.1 | ^19.2.5  |
| `@types/react`         | ^18.3.1 | ^19.2.14 |
| `@types/react-dom`     | ^18.3.1 | ^19.2.3  |
| `@vitejs/plugin-react` | ^4.3.4  | ^6.0.1   |
| `eslint`               | ^9.39.4 | ^10.3.0  |
| `jsdom`                | ^25.0.1 | ^29.1.1  |
| `typescript`           | ^5.6.3  | ^6.0.3   |
| `vite`                 | ^5.4.14 | ^8.0.10  |
| `vitest`               | ^2.1.9  | ^4.1.5   |

## Approach

Sequential atomic PRs, one wave at a time. Each wave must pass `lint + typecheck + test` before the next begins. This keeps every regression bisectable to a single dependency change and makes rollback straightforward.

## Wave Order and Rationale

### Wave 1 — Isolated Libraries: `jsdom` + `date-fns`

No coupling to each other or to the build toolchain.

- **jsdom 25 → 29**: Test environment only. Run the suite; any failure is a direct JSDOM behavior change.
- **date-fns 3 → 4**: Used in 5 files (`EventDetail.tsx`, `ChangelogRow.tsx`, `googleCalendar.ts`, `EventListMobile.tsx`, `columns.tsx`). The v4 breaking changes are UTC-suffixed API renames. None of those APIs are used in this codebase, so this should install cleanly. Verify with a grep for `UTCDate` or UTC-suffixed imports during the PR.

### Wave 2 — Linting: `eslint`

ESLint 9 → 10, isolated from build and runtime.

The primary ESLint 10 breaking change is dropping CommonJS output. This project already uses `"type": "module"` and flat config (`eslint.config.js`), so no config rewrite is required. `@typescript-eslint/parser@8` explicitly supports ESLint 10. Isolating this wave prevents a linting regression from being confused with a build regression.

### Wave 3 — Build + Test Tooling: `vite` + `@vitejs/plugin-react` + `vitest`

These three are tightly coupled and must move together:

- `@vitejs/plugin-react@6` requires `vite: "^8.0.0"` — no Vite 5 support
- `vitest@4.1` requires `vite: "^6.0.0 || ^7.0.0 || ^8.0.0"`

**Wildcard:** `@tanstack/router-plugin` is not in the upgrade list but has Vite as a peer dep. Before installing, run `npm info @tanstack/router-plugin peerDependencies` to confirm Vite 8 compatibility. If the current locked version (1.167.22) doesn't support Vite 8, bump it within the `^1.114.0` range until one does.

**React Compiler:** `@vitejs/plugin-react@6` lists `@rolldown/plugin-babel` and `babel-plugin-react-compiler` as optional peer deps for React Compiler opt-in. Do not install them — this project is not opting into the React Compiler.

The `vite.config.ts` is minimal (proxy + two plugins). Consult the Vite 5→6, 6→7, and 7→8 migration guides for anything that affects the configured options, but breakage here is unlikely.

### Wave 4 — React 18 → 19: `react` + `react-dom` + `@types/react` + `@types/react-dom`

A codebase scan confirmed zero deprecated React 18 APIs: no class components, no `ReactDOM.render`, no string refs, no `defaultProps` on function components. This migration should be install-and-test.

`@testing-library/react@16` already supports React 19. Storybook 10 supports React 19.

Watch for: strict mode behavior changes. React 19 removed the development-mode double-invocation of effects. Any test that implicitly relied on double-invocation may change behavior.

React is Wave 4 rather than Wave 5 because React 19's `@types/react` is cleaner and removes legacy overloads. TypeScript 6's stricter inference should work against the new types, not the old ones.

### Wave 5 — TypeScript 5 → 6

Last because the compiler validates everything — all other packages should be stable before TypeScript finds new problems in your code.

TypeScript 6 tightens inference, changes module augmentation semantics, and introduces erasable syntax. Run `typecheck` after installing and fix any errors surfaced. The current `tsconfig.json` is already strict; the number of new errors should be small.

## Per-Wave Checklist

```
1. Branch from main
2. npm install
3. Review migration guide(s) for any config or API changes
4. npm run lint
5. npm run typecheck
6. npm test
7. PR → merge before starting the next wave
```

## Known Non-Issues

- **No deprecated React APIs in use** — confirmed by grep across all 155 source files
- **date-fns usage is narrow** — 5 files, no UTC API usage
- **ESLint flat config already in place** — no config migration needed for ESLint 10
- **@testing-library/react@16 already supports React 19** — no bump needed
- **Storybook 10 already supports React 19** — no bump needed
