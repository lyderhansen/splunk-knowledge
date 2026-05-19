---
phase: 20-data-binding-drilldown
plan: "01"
subsystem: vp-viz skill layer
tags: [data-binding, drilldown, formatter, viz-blueprints, skill-docs]
dependency_graph:
  requires: []
  provides: [DB-01, DB-02, DB-03, DB-04, DR-01, DR-02]
  affects:
    - plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/conf-templates.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md
    - plugins/splunk-viz-packs/skills/vp-viz/SKILL.md
tech_stack:
  added: []
  patterns:
    - formatData() colIdx map for field binding (no formatter text inputs)
    - search_fragment as user-facing data contract in visualizations.conf
    - Per-viz hit-test patterns for _onClick drilldown
key_files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/conf-templates.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md
    - plugins/splunk-viz-packs/skills/vp-viz/SKILL.md
decisions:
  - "Remove Data configurations formatter section for most vizs; only KPI/generic table get optional field input (D-01)"
  - "search_fragment is the user-facing data contract — must contain realistic SPL shape (D-01)"
  - "All 16 viz types get Expected columns + Drilldown notes including simple whole-canvas patterns for gauges/KPIs (D-02)"
metrics:
  duration: "3 minutes"
  completed: "2026-05-19"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 4
---

# Phase 20 Plan 01: Data Binding & Drilldown Reference Updates Summary

**One-liner:** Enforced formatData() colIdx field binding (no Data configurations section) and wired per-viz drilldown hit-test patterns across all 16 viz types in reference docs.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Remove Data configurations from formatter-patterns.md + conf-templates.md + SKILL.md | 91479bb | formatter-patterns.md, conf-templates.md, SKILL.md |
| 2 | Add Expected columns + drilldown notes to all 16 viz types + SKILL.md checklist item | 1f043e9 | viz-blueprints.md, SKILL.md |

## Changes Summary

### Task 1: Data binding rule enforcement

**formatter-patterns.md:**
- Section structure item 1 now reads "NO Data configurations section for most vizs" with explanation that field binding is via `formatData()` column-index map
- Added D-01 data binding rule blockquote explaining the colIdx pattern, search_fragment contract, and single-value/table exception
- Full formatter example updated from "4 sections, 12 controls" to "3 sections, 10 controls" with the Data configurations `<form>` block replaced by a comment

**conf-templates.md:**
- Added data contract guidance blockquote immediately after `search_fragment = {{FRAGMENT_80}}` requiring a realistic SPL shape with column names

**vp-viz SKILL.md:**
- Formatter structure list item 1 updated to "NO Data configurations section for most vizs — field binding via formatData() colIdx map (per D-01)"
- Updated note from "4-section full example" to "3-section full example and data binding note"

### Task 2: Expected columns + drilldown notes

**viz-blueprints.md — all 16 viz types now have:**
- `Expected columns:` entry showing the SPL shape for search_fragment
- `Drilldown:` entry with interaction model and specific hit-test code pattern

Hit-test patterns by type:
- Simple (whole-canvas): Single Value Tile (KPI), Ring Gauge, Needle Gauge — no position test needed
- Row-based: Live Ticker, Leaderboard, Spark Strip (multi), Horizontal Bar List, Data Table
- Segment/bar: Process Flow, Waterfall Chart
- Arc-based: Donut / Ring
- Cell-based: Heat Grid / Matrix, Status Matrix / Health Grid
- Nearest-point: Line Chart
- Axis-based: Radar / Spider Chart

**vp-viz SKILL.md:**
- Added `_onClick` drilldown item to CRITICAL SUBSET pre-code checklist (position: after safeStr/safeNum, before Dashboard JSON type item)

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

```
Expected columns count: 16 (matches all viz types)
Drilldown notes count: 16 (one per viz type)
SKILL.md line count: 461 (under 500 limit)
formatter-patterns.md line count: 430 (under 500 limit)
viz-blueprints.md line count: 494 (under 500 limit)
```

## Known Stubs

None — all changes are reference documentation only. No data wiring stubs.

## Threat Flags

None — all changes are markdown reference files consumed by Claude. No new network endpoints, auth paths, or data trust boundaries introduced.

## Self-Check: PASSED

- [x] formatter-patterns.md contains D-01 data binding rule block
- [x] formatter-patterns.md Full formatter example has no Data configurations form block
- [x] conf-templates.md search_fragment has data contract guidance blockquote
- [x] viz-blueprints.md has 16 Expected columns entries
- [x] viz-blueprints.md has 16 Drilldown entries
- [x] SKILL.md pre-code CRITICAL SUBSET includes _onClick/FIELD_VALUE_DRILLDOWN item
- [x] SKILL.md stays under 500 lines (461)
- [x] Task 1 commit 91479bb exists
- [x] Task 2 commit 1f043e9 exists
