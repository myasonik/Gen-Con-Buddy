---
name: Pixel-art "Parchment & Pixel" visual direction
description: The approved visual direction for Gen Con Buddy is a board-game-rulebook aesthetic using Press Start 2P for headings and Courier Prime for data, on warm parchment tones with earthy browns and a gold accent.
type: project
---

The project's visual direction is "Parchment & Pixel" — a board-game / fantasy-RPG-rulebook aesthetic. Spec lives at `docs/superpowers/specs/2026-04-19-pixel-art-design.md`.

Key constraints that shape every UI decision:

- Press Start 2P is a bitmap font; sizes **must** be multiples of 8px (8, 16, 24, 32...). Non-multiples render fuzzy.
- Gold (`#c9a84c`) is an accent only — never a text color on light backgrounds (fails WCAG), never a border or fill. Use it for the app title, active sort glyph, and active pagination state (paired with bark-dark, not bark).
- The design calls for stacked `box-shadow` "pixel borders" (inset + drop) instead of real `border`s — this pattern repeats across panels/buttons/table and should live in tokens, not be copy-pasted.

**Why:** This is the single biggest design commitment in the project. Every component decision — spacing, motion, elevation, semantics of interactive states — must fit inside this aesthetic or the whole thing reads as inconsistent.

**How to apply:** When reviewing or designing UI, first check: is the type size a multiple of 8? Is gold used as a text/border/fill (bad) or as an accent glyph/active-state only (good)? Are pixel borders pulled from a shared token or reinvented locally? If a component needs a "subtle" visual treatment, reach for bark-light or parchment-light tones — do not invent new shades.
