---
phase: 27-api-correctness
plan: 01
subsystem: documentation
tags: [splunk-viz-packs, drilldown, formatter, color-picker, threshold]

# Dependency graph
requires:
  - phase: 26-multi-channel-archetype
    provides: Multi-Channel Composite blueprint (drilldown note needed fixing)
provides:
  - Correct Splunk drilldown API shape (data:{} payload) in viz-blueprints.md
  - splunkCategorical series color picker pattern in formatter-patterns.md
  - Threshold 3-band RAG formatter template and JS read pattern
affects: [vp-viz, vp-create, all future generated vizs]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Drilldown: this.drilldown({action:..., data:payload}, e) — payload[field]=val"
    - "Series pickers: type=splunkCategorical for 20+ palette; brand pickers: type=custom"
    - "Threshold 3-band RAG: getThresholdColor(val) with direction-aware band swap"

key-files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md

key-decisions:
  - "AC-01: Drilldown payload shape changed from {field,value} to {data:{field:val}} with browserEvent as second arg — matches official Splunk custom viz API"
  - "AC-02: Series pickers use splunkCategorical (not custom) to expose full 20+ categorical palette; brand/accent pickers keep type=custom"
  - "AC-03: Threshold 3-band RAG template added with 7 formatter controls, direction-swap logic, and per-element toggle pattern"

patterns-established:
  - "Drilldown: build payload object via payload[this._clickField]=val then pass {data:payload} as first arg and browser event e as second arg"
  - "FIELD_VALUE_DRILLDOWN fallback: string 'fieldvalue' not integer 1"
  - "Threshold direction swap: high_good = low->red, high->green; high_bad = low->green, high->red"

requirements-completed: [AC-01, AC-02, AC-03]

# Metrics
duration: 12min
completed: 2026-05-21
---

# Phase 27 Plan 01: API Correctness Summary

**Drilldown payload shape corrected to official Splunk data:{} API; series pickers switched to splunkCategorical; threshold 3-band RAG formatter template added.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-21T19:06:00Z
- **Completed:** 2026-05-21T19:18:51Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Fixed `_onClick` template: `{field, value}` shape replaced with `payload[field]=val` + `{data:payload}` + browser event `e` as second arg — generated vizs now emit the payload shape that populates Dashboard Studio tokens ($click.value$) correctly
- Fixed FIELD_VALUE_DRILLDOWN fallback constant note from integer `1` to string `'fieldvalue'`
- Fixed Multi-Channel Composite drilldown inline code to use data:{} shape
- Split color picker templates: series1-5 now use `type="splunkCategorical"` (Splunk 20+ palette + brand swatches); accentColor/backgroundColor/fontColor keep `type="custom"`
- Added threshold 3-band RAG section: 7 formatter controls, direction-aware JS getThresholdColor(), per-element toggles (colorIcon, colorLabel, colorGlow, colorBg)

## Task Commits

1. **Task 1: Fix drilldown payload shape and fallback note in viz-blueprints.md** - `c4c8c2a` (fix)
2. **Task 2: Split color picker section + add threshold RAG template in formatter-patterns.md** - `c5c051f` (feat)

## Files Created/Modified
- `plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md` - Drilldown template, fallback note, Multi-Channel drilldown corrected to official API shape
- `plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md` - Series/brand picker split, full example updated, threshold RAG section added

## Decisions Made
- Series pickers use `type="splunkCategorical"` rather than `type="custom"` to give users access to Splunk's full 20+ categorical palette while still providing brand swatches as quick picks
- Threshold RAG section uses `type="custom"` pickers (not splunkCategorical) because threshold colors are semantic (red/amber/green) and should not be confused with data series colors
- Added a migration note: existing vizs with `type="custom"` series pickers still work; regeneration updates the type

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 27 Plan 01 complete. All three AC requirements landed.
- Generated vizs in subsequent test sessions will use correct drilldown API, richer series color pickers, and can apply threshold 3-band RAG coloring via standard template.
- No blockers for Phase 27 Plan 02 (if planned).

## Known Stubs

None.

## Threat Flags

None. Changes are documentation-only; no new network endpoints, auth paths, or schema changes introduced.

## Self-Check: PASSED
- `plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md` — exists, contains `data: payload` (2 occurrences), no `field: this._clickField`, contains `'fieldvalue'`
- `plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md` — exists, contains `splunkCategorical` (11 occurrences), `thresholdField` (1), `thresholdDirection` (2), `type="custom"` on accentColor/backgroundColor/fontColor/thresholdColor* pickers
- Commits `c4c8c2a` and `c5c051f` verified in git log

---
*Phase: 27-api-correctness*
*Completed: 2026-05-21*
