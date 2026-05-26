---
phase: 18-interactive-dashboard-features
plan: "03"
subsystem: ui
tags: [splunk, vp-viz, formatter, drilldown, canvas-viz, series-colors, conf-templates]

# Dependency graph
requires:
  - phase: 16-canvas-code-quality
    provides: vp-viz SKILL.md and viz-blueprints.md in stable state
  - phase: 17-dashboard-schema-composition
    provides: dashboard-json-template.md with depth-layer background
provides:
  - Series color controls (backgroundColor, fontColor, series1-5Color, seriesColorsOverflow, fieldColorMap) in formatter-patterns.md replacing defunct accentColor picker
  - getSeriesColor() JS helper pattern with overflow and fieldColorMap parsing
  - supports_drilldown=true and supports_trellis=true in conf-templates.md visualizations.conf stanza
  - _onClick drilldown code template in viz-blueprints.md (D-03)
  - Per-viz drilldown hit-test notes for Leaderboard, Donut/Ring, Status Matrix, Horizontal Bar List, Data Table
  - vp-viz SKILL.md updated to reflect accentColor removal and cross-reference dashboard-interactivity.md
affects: [18-01, 18-02, vp-create, vp-viz]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Series color controls: 5 splunk-color-picker slots + seriesColorsOverflow text input for series 6+"
    - "fieldColorMap parsing with hexFromSplunk() on color values (T-18-05 mitigation)"
    - "_onClick drilldown: store _clickField in updateView, hit-test by mx/my in event handler"

key-files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/conf-templates.md
    - plugins/splunk-viz-packs/skills/vp-viz/SKILL.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md

key-decisions:
  - "accentColor picker removed from formatter Color and style section (D-10) — replaced with explicit series color controls matching Splunk built-in viz model"
  - "fontColor and backgroundColor added to formatter (D-11) — Phase 18 overrides prior D-03 guidance that said DS owns panel-level colors"
  - "supports_trellis=true added to conf stanza for future compatibility only — trellis internal rendering in Canvas vizs is deferred"
  - "_onClick drilldown template uses SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN with integer 1 as fallback"
  - "fieldColorMap parsing uses hexFromSplunk() on color half to satisfy T-18-05 injection mitigation"

patterns-established:
  - "Color controls pattern: themeMode + backgroundColor + fontColor + series1-5Color + seriesColorsOverflow + fieldColorMap + accentIntensity = 11 controls in Color and style section"
  - "getSeriesColor(i, fallback) helper pattern: checks 5-picker array then overflow array for index >= 5"
  - "Drilldown pattern: store _clickField in updateView; hit-test by mx/my in _onClick; call this.drilldown({action: FIELD_VALUE_DRILLDOWN, field, value})"

requirements-completed: [INT-01, INT-02, INT-03]

# Metrics
duration: 12min
completed: 2026-05-19
---

# Phase 18 Plan 03: Viz Layer Reference Updates Summary

**Series color pickers (5 slots + overflow + fieldColorMap) replace accentColor in formatter; _onClick drilldown template added to viz-blueprints.md; supports_drilldown/trellis flags added to conf-templates.md**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-19T00:00:00Z
- **Completed:** 2026-05-19T00:12:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Replaced defunct `accentColor` formatter control with a proper 11-control Color and style section (backgroundColor, fontColor, series1-5Color, seriesColorsOverflow, fieldColorMap, accentIntensity) — matches Splunk built-in viz color model
- Added `getSeriesColor(i, fallback)` JS reading helper with overflow array and `hexFromSplunk()` sanitization (T-18-05 mitigation for fieldColorMap injection)
- Extended `visualizations.conf` stanza with `supports_drilldown = true` and `supports_trellis = true` plus trellis-limitation note
- Added `### Drilldown — _onClick template (D-03)` section to viz-blueprints.md with ES5 code, initialize listener, and Dashboard JSON wiring guidance
- Added per-viz drilldown hit-test notes to 5 clickable viz types: Leaderboard (row index), Donut/Ring (arc angle), Status Matrix (grid cell), Horizontal Bar List (bar index), Data Table (row index)
- Updated vp-viz SKILL.md: accentColor universal trio replaced with series color pickers, Quick rule #15 cross-references dashboard-interactivity.md

## Task Commits

1. **Task 1: Replace accentColor with series color controls, add drilldown/trellis conf flags** - `0cb5212` (feat)
2. **Task 2: Update SKILL.md accentColor refs and add _onClick drilldown template to viz-blueprints.md** - `0c2cecb` (feat)

## Files Created/Modified

- `plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md` - Replaced Color and style form (3 controls → 11), updated WRONG patterns table, added JS reading patterns for series colors and getSeriesColor() helper
- `plugins/splunk-viz-packs/skills/vp-viz/references/conf-templates.md` - Added supports_drilldown and supports_trellis to visualizations.conf stanza with trellis-limitation note
- `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md` - Updated formatter structure description, universal pair (removed accentColor), Quick rule #15 cross-reference; file stays at 460 lines (under 500 limit)
- `plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md` - Added _onClick drilldown template section before KPI, added per-viz Drilldown notes to 5 viz types

## Decisions Made

- `fontColor` and `backgroundColor` added to formatter controls — Phase 18 D-11 overrides older D-03 guidance. These are viz-level renderer controls, not DS panel-level settings.
- `accentColor` picker removed entirely per D-10 — it silently did nothing useful for data-series colors. Can be re-added when properly implemented.
- `supports_trellis = true` is set for future compatibility but trellis internal rendering is deferred — documented with explicit note in conf-templates.md.
- `fieldColorMap` parsing applies `hexFromSplunk()` on the color values to mitigate T-18-05 injection surface.

## Deviations from Plan

None — plan executed exactly as written. All edits matched the PATTERNS.md verbatim specifications.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- formatter-patterns.md now has correct color controls for Phase 18 code generation
- viz-blueprints.md has _onClick template that vp-viz generation can copy verbatim
- conf-templates.md has drilldown/trellis flags ready for packaging
- vp-viz SKILL.md cross-references dashboard-interactivity.md (delivered by plan 18-01) for full drilldown wiring patterns
- All Wave 1 plans (18-01, 18-02, 18-03) are independent — no merge conflicts expected

---
*Phase: 18-interactive-dashboard-features*
*Completed: 2026-05-19*

## Self-Check: PASSED

Files verified present:
- `plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md` — FOUND (series1Color=2, accentColor=1)
- `plugins/splunk-viz-packs/skills/vp-viz/references/conf-templates.md` — FOUND (supports_drilldown=1)
- `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md` — FOUND (460 lines, under 500)
- `plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md` — FOUND (FIELD_VALUE_DRILLDOWN=2, 5 drilldown notes)

Commits verified:
- `0cb5212` — FOUND (Task 1)
- `0c2cecb` — FOUND (Task 2)
