---
name: ds-ref-anti-patterns
description: AI-slop and anti-pattern catalog for Splunk Dashboard Studio — the reflex defaults to refuse (uniform-color KPI rows, default Splunk grey canvas, 7-slice pies, rainbow on ordered severity), absolute bans (status colors as series colors, red/green sole differentiator, unbounded searches, defaultless inputs), and the Splunk Dashboard Slop Test (13-item quality gate). Use when reviewing for slop, when ds-critique is scoring, or when ds-polish is applying corrective fixes.
---

# ds-ref-anti-patterns — AI-slop and anti-pattern catalog

> **Status:** skeleton only. Body extracted from `ds-ref-design-principles` in a follow-up task.

## Scope (what's IN)

- 8 reflex defaults to reject (DETECT / WHY / REWRITE format).
- 5 absolute bans (BAN / PATTERN / WHY / REWRITE format).
- The Splunk Dashboard Slop Test (13-item quality gate).
- Archetype-conditional anti-pattern matrix (some patterns OK on SOC wall, slop on exec).

## Out of scope (what's NOT here)

- Auto-fix actions — see `ds-polish`.
- Scoring against criteria — see `ds-critique`.
- Color-specific rules — see `ds-ref-color` (referenced from this skill, not duplicated).

## Consults

- `ds-ref-color` (for color-specific bans).
- `ds-ref-archetypes` (for archetype-conditional patterns).

## Consulted by

- `ds-couture` (slop refusal mid-design).
- `ds-critique` (scorecard).
- `ds-polish` (fix catalog source).

## Source / migration

- Extracted from: `ds-ref-design-principles` "Reflex defaults to reject", "Absolute bans", "The Splunk Dashboard Slop Test" sections (most of the Phase 1 impeccable-style additions).
- New content: archetype-conditional anti-pattern matrix.

## Estimated size

L
