---
phase: 14-smart-fields-domain-ideation
plan: "02"
subsystem: viz-skill
tags: [auto-field-discovery, dynamic-fields, data.fields, splunk-viz-packs, canvas-viz, ES5]

# Dependency graph
requires:
  - phase: 13-accent-architecture-foundation
    provides: "theme.getSeriesColor(i, t) established; t.series indexed array for multi-series color assignment"
provides:
  - "auto-field-patterns.md: RESERVED exclusion list, isNumericCol helper, three-tier resolver, per-viz-type table"
  - "vp-viz SKILL.md formatData template passes data.fields through to updateView"
  - "vp-viz SKILL.md pre-code checklist has 3 auto-field discovery checklist items"
  - "vp-viz SKILL.md References section cross-links to auto-field-patterns.md"
affects: [vp-viz, vp-create, 15-domain-vizs, generated-visualization-source-js]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Three-tier field resolver: Tier 1=formatter override, Tier 2=auto-discover via isNumericCol, Tier 3=position fallback"
    - "RESERVED + charAt(0)==='_' dual-gate for internal Splunk field exclusion"
    - "Auto-field reference file pattern: deep reference loaded on demand, SKILL.md has checklist + link only"

key-files:
  created:
    - "plugins/splunk-viz-packs/skills/vp-viz/references/auto-field-patterns.md"
  modified:
    - "plugins/splunk-viz-packs/skills/vp-viz/SKILL.md"

key-decisions:
  - "Three-tier resolver approach: formatter config takes precedence, auto-discovery is fallback, position index is last resort — ensures backward compat with existing formatter configurations"
  - "charAt(0) === '_' runtime gate preferred over RESERVED object lookup — more future-proof as Splunk may add new _ prefixed internal fields"
  - "isNumericCol samples up to 3 rows (not 1) — handles sparse SPL results where first row may have null values"
  - "maxSeries cap via opt('maxSeries','6') exposed in formatter — prevents legend overflow in multi-series vizs"
  - "SKILL.md edits held to 4 net new lines (3 checklist + 1 reference link) to stay well under 500-line limit"

patterns-established:
  - "Auto-field-patterns.md pattern: deep reference for runtime patterns, SKILL.md gets only checklist reminders + reference link"
  - "isNumericCol: skip null/empty values during sampling rather than treating as non-numeric"
  - "Multi-series color assignment: theme.getSeriesColor(si, t) with maxSeries cap"

requirements-completed: [SFD-01, SFD-02, SFD-03, SFD-04]

# Metrics
duration: 18min
completed: 2026-05-18
---

# Phase 14 Plan 02: Auto-Field Discovery Reference and SKILL.md Update Summary

**Auto-field discovery reference (auto-field-patterns.md) and SKILL.md template update — vizs now use three-tier dynamic field resolution instead of hardcoded column names, with _ prefix exclusion gate and theme.getSeriesColor multi-series color assignment**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-05-18T00:00:00Z
- **Completed:** 2026-05-18T00:18:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created auto-field-patterns.md (158 lines) with RESERVED exclusion list, isNumericCol helper, three-tier field resolver pattern, per-viz-type application table covering all 16 viz types, multi-series color assignment using theme.getSeriesColor(i, t), and CP-01 through CP-04 pitfall reminders
- Updated vp-viz SKILL.md formatData template to pass `fields: data.fields` through to updateView (one-line change enabling dynamic field enumeration)
- Added 3 pre-code checklist items for auto-field discovery (formatData fields pass-through, _ prefix exclusion, formatter-first resolver order) and 1 reference link — 4 net new lines, file stays at 482 lines (well under 500)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create auto-field-patterns.md reference file** - `fc5240d` (feat)
2. **Task 2: Update vp-viz SKILL.md formatData template and pre-code checklist** - `62d0cb0` (feat)

**Plan metadata:** committed below (docs: complete plan)

## Files Created/Modified

- `plugins/splunk-viz-packs/skills/vp-viz/references/auto-field-patterns.md` — New reference file: RESERVED list, isNumericCol, three-tier resolver, per-viz-type table, multi-series color, pitfalls CP-01–CP-04
- `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md` — formatData result now includes fields: data.fields; 3 auto-field checklist items added; auto-field-patterns.md reference link added

## Decisions Made

- Three-tier resolver approach (config → auto-discover → position) preserves backward compatibility with any existing formatter configurations that explicitly set field names
- `charAt(0) === '_'` gate chosen over RESERVED object alone — handles undocumented future internal fields that Splunk may add with `_` prefix
- `isNumericCol` samples up to 3 rows rather than checking only row[0] — handles sparse SPL results where the first row may have null/empty values for a numeric column
- `maxSeries` cap exposed as a formatter control so users can reduce visible series if the auto-discovery produces too many for their legend

## Deviations from Plan

None — plan executed exactly as written. All three edits to SKILL.md matched the plan specification. auto-field-patterns.md matches the specified sections and content.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- auto-field-patterns.md is ready for immediate use by any viz generation task
- SKILL.md formatData template change propagates automatically to all new vizs generated with the updated template
- The three-tier resolver pattern and RESERVED exclusion logic is available for reference when writing updateView code
- Phase 14 Plan 03 (domain viz types) can reference auto-field-patterns.md for field discovery patterns in new viz blueprints

---
*Phase: 14-smart-fields-domain-ideation*
*Completed: 2026-05-18*
