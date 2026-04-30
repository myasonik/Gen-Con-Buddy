# Memory Unification Design

**Date:** 2026-04-29

## Summary

Fix stale and inconsistent documentation across the main agent memory, subagent memory files, and agent definition files. Add cross-reference entries to the main agent MEMORY.md so the main agent knows where to find subagent knowledge.

## Changes

### 1. Main agent MEMORY.md — add cross-references

Add two entries pointing to the subagent memory indexes:

- `base-ui-design-system` subagent memory
- `codebase-hardener` subagent memory

The main agent follows these links when spawning a subagent or when working on a topic that overlaps with design system or hardening concerns.

### 2. base-ui-design-system subagent memory — delete visual direction

Delete `project_pixel_art_design_direction.md`. The visual direction is baked into the codebase (tokens, components, CSS) and is derivable by reading the code. The referenced spec file (`docs/superpowers/specs/2026-04-19-pixel-art-design.md`) was pruned in commit `b823f66` and no longer exists. Remove the corresponding entry from the subagent's `MEMORY.md`.

### 3. Agent definition files — fix stale footer

Both `base-ui-design-system.md` and `codebase-hardener.md` end with a footer saying "Your MEMORY.md is currently empty." Both have non-empty memory indexes. Replace each footer with the actual current `MEMORY.md` content so the agent starts each session aware of its memories.

### 4. codebase-hardener agent definition — remove GraphQL boilerplate

The type safety standards section says "GraphQL response types must be fully typed — no partial `{}` types or untyped destructuring." This project uses REST/fetch, not GraphQL. Remove this line; replace with the REST/fetch error-envelope pattern the codebase actually uses (`fetchEvents` vs `fetchChangelogList` inconsistency already documented in `project_recurring_weak_spots.md`).

## Out of scope

- Promoting subagent memories into the main agent as duplicate entries (option A/B — rejected in favor of cross-references)
- Any changes to AGENTS.md or CLAUDE.md project docs
- Any changes to source code
