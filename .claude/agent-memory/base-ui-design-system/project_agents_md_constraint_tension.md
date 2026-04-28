---
name: AGENTS.md CSS architecture (resolved)
description: AGENTS.md now correctly documents CSS Modules + global tokens as the project's styling architecture. The former "no CSS" tension is resolved.
type: project
---

`AGENTS.md` now reflects the actual CSS architecture: global tokens in `src/styles/tokens.css`, component styles via co-located CSS Modules, headless primitives from `@base-ui/react`. No CSS-in-JS, no utility frameworks.

**Why:** Was a stale tension between an old "plain HTML only" rule and the approved pixel-art design spec. Resolved when AGENTS.md was updated during the design system implementation work.

**How to apply:** No longer a concern. The doc and reality are in sync.
