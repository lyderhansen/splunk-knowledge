---
phase: 20-data-binding-drilldown
plan: "02"
subsystem: splunk-viz-packs/vp-create
tags: [drilldown, skill, reference, dashboard-interactivity, seriesColors]
dependency_graph:
  requires: []
  provides: [drilldown-enforcement-vp-create, seriesColors-reference]
  affects: [plugins/splunk-viz-packs/skills/vp-create/SKILL.md, plugins/splunk-viz-packs/skills/vp-create/references/dashboard-interactivity.md]
tech_stack:
  added: []
  patterns: [drilldown-wiring-all-panels, seriesColors-builtin-viz, seriesColorsByField-named]
key_files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-create/SKILL.md
    - plugins/splunk-viz-packs/skills/vp-create/references/dashboard-interactivity.md
decisions:
  - "D-02: Drilldown wiring enforced on ALL viz panels via Step 3c item 6 and packaging checklist"
  - "D-03: seriesColors and seriesColorsByField documented in new Section 8 of dashboard-interactivity.md"
metrics:
  duration_minutes: 2
  completed_date: "2026-05-19"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Phase 20 Plan 02: Drilldown Enforcement and seriesColors Reference Summary

Enforced drilldown wiring on every dashboard panel and documented seriesColors/seriesColorsByField for built-in viz panels in vp-create skill files.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add drilldown enforcement to vp-create SKILL.md Step 3c and packaging checklist | 764b9f4 | plugins/splunk-viz-packs/skills/vp-create/SKILL.md |
| 2 | Update Section 1 and add Section 8 to dashboard-interactivity.md | 1e06b3a | plugins/splunk-viz-packs/skills/vp-create/references/dashboard-interactivity.md |

## What Was Built

### Task 1 — vp-create SKILL.md

Added **Step 3c Requirements item 6**: explicit instruction requiring that EVERY custom viz panel (`{app_id}.{viz_name}` type) must have both `"drilldown": "all"` in options AND an `eventHandlers` array with `drilldown.setToken`. Includes guidance that built-in viz panels also get `"drilldown": "all"` when interactive.

Added **packaging checklist item**: "Drilldown wired on every custom viz panel (options.drilldown: 'all' + eventHandlers setToken — not just example panels)" after the existing drilldown tokens item.

File remains 207 lines (well under the 500-line CLAUDE.md constraint).

### Task 2 — dashboard-interactivity.md

Added **Section 1 "Mandatory for every panel" blockquote**: Placed immediately after the opening paragraph that ends "invisible failure." The note explicitly requires the drilldown pattern on EVERY custom viz panel and instructs iterating all `{app_id}.*` type panels to confirm compliance.

Added **Section 8 "Built-in Viz Panel Colors — DR-03"**: New section before the WRONG patterns separator documenting:
- `seriesColors` (positional array, maps to alphabetical series order) — example with `splunk.area`
- `seriesColorsByField` (named field-to-color map, refactor-safe) — example with `splunk.column`
- Usage rules distinguishing when to use each, how they coexist, and that hex values should come from `shared/theme.js`
- Clear distinction: custom vizs use formatter color pickers; built-in vizs use these JSON options

File grows from 223 to 279 lines — no line limit concern (this is a reference file, not a SKILL.md).

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None. Both files are instruction/reference material with no data binding or UI rendering stubs.

## Threat Flags

None. Changes are limited to markdown reference files consumed by Claude agents. No new runtime surface introduced.

## Self-Check: PASSED

- plugins/splunk-viz-packs/skills/vp-create/SKILL.md modified and committed at 764b9f4
- plugins/splunk-viz-packs/skills/vp-create/references/dashboard-interactivity.md modified and committed at 1e06b3a
- Step 3c item 6 "Drilldown wiring — ALL viz panels" present at line 89
- Packaging checklist "Drilldown wired on every custom viz panel" present at line 205
- Section 1 "Mandatory for every panel" note present at line 11 of dashboard-interactivity.md
- Section 8 "Built-in Viz Panel Colors" present at line 217 of dashboard-interactivity.md
- Both seriesColors and seriesColorsByField documented with splunk.area and splunk.column examples
- SKILL.md: 207 lines (under 500 limit)
