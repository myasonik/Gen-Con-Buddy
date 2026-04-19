---
name: AGENTS.md "no CSS" rule conflicts with pixel-art redesign
description: The project's AGENTS.md "Plain HTML only — no styles, no CSS, no UI libraries" rule is in active tension with the approved 2026-04-19 pixel art design spec, which introduces CSS tokens, CSS Modules, and Google Fonts.
type: project
---

`AGENTS.md` contains a hard rule: _"Plain HTML only — no styles, no CSS, no UI libraries. Use semantic elements."_ The approved pixel-art design spec at `docs/superpowers/specs/2026-04-19-pixel-art-design.md` directly contradicts this by introducing a full CSS token system, per-component CSS Modules, and Google Fonts.

**Why:** The project started as plain-HTML-only, but a full visual redesign was approved without updating the governing doc. When the redesign implementation PR lands, `AGENTS.md` will be stale the moment it merges unless updated in the same commit.

**How to apply:** Any implementation PR that touches `src/index.css`, adds a `.module.css`, or introduces Google Fonts must also edit `AGENTS.md`. When reviewing future frontend PRs, check that the project instruction file reflects the CSS architecture in use — don't let the doc and reality drift. The replacement rule should be: "Global tokens in `src/index.css`; component styles via co-located CSS Modules. No CSS-in-JS, no utility frameworks, no UI libraries with bundled styles."
