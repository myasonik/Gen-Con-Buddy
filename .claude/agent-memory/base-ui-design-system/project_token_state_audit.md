---
name: Token system is half-built — color/typography tokens referenced but undefined
description: As of 2026-04-27, src/styles/tokens.css defines only spacing/sizing/motion/z-index. Color, typography, and font-display tokens are referenced across CSS Modules but never declared, so styles silently no-op or fall back.
type: project
---

`src/styles/tokens.css` declares only: `--space-*`, `--size-*`, `--motion-*`, `--z-*`, plus `interpolate-size`. There are no color or typography tokens defined.

But across the codebase the following tokens are *referenced* via `var(--…)` and have no fallback in many cases:

- `--color-gold` (root nav)
- `--color-parchment`, `--color-parchment-light` (table zebra)
- `--color-bark-light` (table hover, story matrix label)
- `--font-display` (root nav, badges, changelog date/heading)
- `--text-label` (root nav, changelog headings)
- `--text-badge` (concept badge)
- `--text-small` (story matrix label)

`index.html` loads `IBM Plex Sans` and `IM Fell English`. The approved spec (`docs/superpowers/specs/2026-04-19-pixel-art-design.md`) specifies `Press Start 2P` + `Courier Prime` and a full color palette under `--color-bark`, `--color-bark-dark`, etc. Neither set has been wired up.

**Why:** The "Parchment & Pixel" redesign was approved but only partially implemented — spacing/sizing tokens shipped; color and typography did not. The result is a codebase that *looks* token-driven but where every color reference falls through to UA defaults.

**How to apply:** When reviewing CSS work, expect to find broken `var(--color-*)` and `var(--font-*)` references. Don't suggest adding more references to the same missing tokens — flag the gap. Any work touching `src/components/ChangelogPage/*.module.css` should also be the moment to stop hardcoding `#000`/`#666`/`#fff`/`#ccc`/`#ddd`/`#f5f5f5` and define real tokens.
