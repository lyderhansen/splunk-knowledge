---
name: ds-ref-archetypes
description: Splunk Dashboard Studio archetypes reference — the four canonical layouts (executive summary, operational monitoring, analytical deep-dive, SOC overview / wall) with panel-mix fingerprints, audience profiles, viewing context, and per-archetype defaults. Use when picking layout shape for a new dashboard, when ds-couture commits to an archetype, or when the user asks "what should this look like for X audience?".
---

# ds-ref-archetypes — Splunk dashboard archetypes

> **Status:** skeleton only. Body extracted from `ds-ref-design-principles` in a follow-up task.

## Scope (what's IN)

- The 4 archetypes (executive summary, operational monitoring, analytical deep-dive, SOC overview / wall) with deep-dive per archetype.
- Panel-mix fingerprints per archetype.
- Canvas dimensions per archetype (1440×960 exec, 1920×1080 SOC wall, etc.).
- When-to-use rules per archetype.
- Hybrid examples and smells (when archetypes mix).

## Out of scope (what's NOT here)

- Color palette per archetype — see `ds-ref-color`.
- Grid/spacing math — see `ds-ref-layout-grid`.
- Anti-pattern detection per archetype — see `ds-ref-anti-patterns`.

## Consults

- `ds-ref-personas` (persona → archetype mapping).

## Consulted by

- `ds-couture` (after Design Context Protocol, when committing to an archetype).
- `ds-design` (when wireframing a new layout).
- `ds-init` (during scope phase).

## Source / migration

- Extracted from: `ds-ref-design-principles` "Dashboard archetypes" section (lines ~25–115 of pre-split file in `_backup/2026-04-29/`).
- New content: hybrid examples, audience-context expansion.

## Estimated size

M
