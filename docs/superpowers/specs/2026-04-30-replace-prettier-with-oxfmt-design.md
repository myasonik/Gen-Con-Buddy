# Replace Prettier with Oxfmt

**Date:** 2026-04-30
**Status:** Approved

## Summary

Swap Prettier for Oxfmt (the OXC formatter), enforce formatting via pre-commit, and clean up now-unused Prettier dependencies.

## Background

The project already uses Oxlint from the OXC toolchain. Oxfmt is the complementary OXC formatter — ~30x faster than Prettier, Prettier-compatible in output. The current setup has a `format:check` script that is never actually enforced (not in the pre-commit hook).

## Changes

### Dependencies

- Remove: `prettier`, `eslint-config-prettier`
- Add: `oxfmt`

### Config files

- Delete `.prettierrc` — use Oxfmt defaults
- Keep `.prettierignore` — Oxfmt reads it by default (alongside `.gitignore`)

### ESLint

- Remove `eslint-config-prettier` import and spread from `eslint.config.js`
- No replacement needed: the only active ESLint rules (`react-hooks/exhaustive-deps`, `local/no-inline-live-regions`) are not formatting rules

### npm scripts

- `format`: `prettier --write .` → `oxfmt --write .`
- `format:check`: `prettier --check .` → `oxfmt --check .`

### Pre-commit hook

- Add `npm run format:check` after `npm run lint` in `.husky/pre-commit`

### Codebase reformat

- Run `oxfmt --write .` after everything is wired up to reformat all files under Oxfmt defaults

## Out of Scope

- No oxfmt configuration file — defaults only
- No `eslint-plugin-oxfmt` — ESLint usage here doesn't warrant it
