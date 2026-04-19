# ESLint → oxlint Migration Design

## Summary

Replace ESLint as the primary linter with oxlint for speed, keeping a minimal residual ESLint config solely to enforce the custom `local/no-inline-live-regions` rule that oxlint cannot express.

## Dependencies

**Remove:**

- `@eslint/js`
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`
- `typescript-eslint`

**Keep:**

- `eslint` (still needed to run the residual custom rule)
- `eslint-config-prettier` (disables ESLint rules that conflict with Prettier)

**Add:**

- `oxlint`

## oxlint Config (`oxlint.json`)

Covers all standard linting previously handled by ESLint:

- React Hooks rules (exhaustive-deps, rules-of-hooks)
- TypeScript rules (previously from typescript-eslint recommended)
- `no-nested-ternary` (error)
- Ignores: `dist/`, `public/mockServiceWorker.js`

## Residual ESLint Config (`eslint.config.js`)

Stripped to the absolute minimum — only what is needed to enforce the custom rule:

- Loads a JSX-capable parser (to traverse JSX attributes)
- Defines and registers the `local/no-inline-live-regions` custom rule
- Sets the rule to `"error"`
- No `@eslint/js`, no `typescript-eslint`, no react plugins

## Lint Script

```json
"lint": "oxlint && eslint ."
```

oxlint runs first. If it fails, ESLint does not run (fast-fail). In CI, the same command is used.

## What Gets Dropped

- `react-refresh/only-export-components` warning — HMR-only, not a correctness rule, safe to remove
- `eslint-plugin-react-refresh` package — removed entirely

## What Stays Enforced

- All react-hooks rules (via oxlint)
- TypeScript linting (via oxlint)
- `no-nested-ternary` (via oxlint)
- `local/no-inline-live-regions` (via residual ESLint)
- Prettier formatting compatibility (via `eslint-config-prettier` in residual ESLint)

## Testing

No new tests needed — this is a tooling change. Verification: `npm run lint` passes on the current codebase after migration. The existing `no-inline-live-regions` rule enforcement is validated by confirming ESLint errors on any file containing `aria-live`, `role="alert"`, or `role="status"` attributes.
