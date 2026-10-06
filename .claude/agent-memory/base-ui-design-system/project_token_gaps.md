---
name: Design token coverage gaps as of pre-stable audit
description: Token categories that exist in tokens.css vs. categories where the codebase still hardcodes values (eyebrow tracking variants, display type, hex in storyMatrix).
type: project
---

`src/styles/tokens.css` now covers: colors (surfaces, ink, accent + 4 status tones with -deep/-surface/-border variants), scrim, shadow-overlay, **type scale** (`--text-2xs` through `--text-2xl`), font families, `--tracking-eyebrow` (0.05rem), spacing (`--space-1`–`--space-6`), `--border-width`, radius, motion, focus, z-index, sizes. The major gaps from the 1.0 audit (type scale, border width, scrim, surface borders) are RESOLVED.

**Remaining gaps as of 2026-05-14:**

- **Eyebrow tracking drift** — `--tracking-eyebrow` exists (0.05rem) but is bypassed. `letter-spacing: 0.03rem` (Button, Chip `.chip`), `0.04rem` (Chip `[data-size=sm]`, SegmentedControl `.option`, MultiCombobox `.chip`, Pagination `.summary`) appear instead. Three near-identical-but-not values for the same morphological role. Either widen the token set (`--tracking-eyebrow`, `--tracking-tight`) or collapse onto one.
- **Display type scale untokenized** — `font-size: 2rem` (`__root.module.css` `.brandingTitle`), `clamp(2rem,4vw,2.5rem)` (EventDetail `.title`), `clamp(1.75rem,4vw,2.5rem)` (AboutPage `.heading`). DESIGN.md defines a single Display role at `clamp(1.75rem,4vw,2.5rem)`. Three call sites, three different values. Needs `--text-display` + `--text-display-sm` or a shared `.display` composes class.
- **Letter-spacing -0.01rem** — display tracking repeated at 3 sites (brandingTitle, EventDetail title, AboutPage heading). Tokenize as `--tracking-display`.
- **Hardcoded hex** — `#666` in `src/ui/storyMatrix.module.css:17` — a literal cool-gray, violates No Pure Black / cool-gray ban (storybook-only but still wrong; use `--color-ink-faint`).
- **Caret/chevron pseudo-element borders** — `0.125rem solid` repeated in ChangelogRow + ChangelogEntryPanel `::after` carets. Minor; acceptable as one-offs but the two carets are copy-paste duplicates of each other.

**How to apply:** When reviewing new CSS, flag any raw `font-size`, `letter-spacing` (other than `var(--tracking-eyebrow)`), or hex value. The eyebrow-tracking drift is the highest-value fix — it is the same drift class that caused issue #29.
