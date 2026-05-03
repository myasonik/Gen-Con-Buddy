---
name: Design token coverage gaps as of 1.0 audit
description: Token categories that exist in tokens.css vs. token categories where the codebase still hardcodes values (typography, borders, scrim, surface-tone borders).
type: project
---

`src/styles/tokens.css` covers: colors (surfaces, ink, accent + 4 status tones), font *families*, spacing 8px grid (`--space-1` through `--space-6`), radius (subtle/card/pill), motion, focus, z-index, sizes (drawer width, detail-max).

**Missing token categories — values are inlined throughout CSS modules:**

- **Type scale** — `font-size: 0.75rem | 0.8125rem | 0.875rem | 0.9375rem | 1rem | 1.0625rem | 1.125rem | 2rem` appears 50+ times across 18 files. No `--text-*` tokens exist.
- **Font weight / line-height / letter-spacing** — same story. `letter-spacing` drifts between `0.03rem`–`0.06rem` for what is morally the same "uppercase eyebrow" treatment.
- **Border width / shorthand** — `0.0625rem solid var(--color-...)` repeats 40+ times. No `--border-hairline` or similar.
- **Surface-tone borders** — `oklch(from var(--color-{tone}-surface) calc(l - 0.07) c h)` is the established pattern (see `ChangelogRow.module.css` jade/cobalt/amber, `ActiveFilters.module.css` accent at -0.08, sold-out hardcoded `oklch(78% 0.07 22deg)` at three sites). Pattern is good, just not tokenized.
- **Scrim / backdrop overlay** — `oklch(22% 0.03 48deg / 0.4)` appears verbatim in `SearchForm.module.css:11` and `EventTable.module.css:294`. This is `--color-ink` at 0.4 alpha; should be `--color-scrim`.

**Why it matters:** the inline values aren't *wrong* — they're consistent enough that the design holds together. But there's no system enforcing the consistency, so the next contributor will type `0.9375rem` from memory or pick a slightly different `letter-spacing` value, and the design will erode invisibly.

**How to apply:** When reviewing new CSS, flag any raw `font-size`, `letter-spacing`, `border: 0.0625rem solid`, or solo `oklch(...)` declaration. After type-scale tokens land, a stylelint rule banning bare rem font-sizes would prevent regression.
