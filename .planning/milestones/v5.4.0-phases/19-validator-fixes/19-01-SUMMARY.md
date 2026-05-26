---
phase: 19-validator-fixes
plan: 01
subsystem: testing
tags: [validate_dash, check_design, validator, ES5, javascript, tdd]

# Dependency graph
requires: []
provides:
  - validate_dash.js DS4 check accepts both item.item and item.vizId in structure arrays
  - validate_dash.js DS5 WARN (DS5w) for non-wildcard token defaults (exits 0)
  - validate_dash.js emitWarn function (stdout only, no FINDING NDJSON)
  - check_design.js D11 uses lastIndexOf so scan starts at method definition not first comment
affects:
  - phase-20
  - phase-21

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "emitWarn pattern: stdout only, no FINDING NDJSON, does not increment violations"
    - "TDD RED/GREEN per task: commit failing test first, then implement fix"

key-files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_dash.js
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/test_validate_dash.js
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/check_design.js
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/test_check_design.js

key-decisions:
  - "DS4 uses item.item || item.vizId — Dashboard Studio spec uses item property, not vizId; fallback preserves backwards compat (D-01)"
  - "DS5w is WARN not FAIL — non-wildcard token defaults are suspicious but sometimes intentional; WARN exits 0 (D-03)"
  - "D11 uses lastIndexOf — method definition is always the last occurrence; indexOf returns comment positions (D-02)"

patterns-established:
  - "emitWarn(code, vizId, detail): mirrors emitFail but stdout only — established for DS5w"
  - "D11 guard scan: always use lastIndexOf for method name lookup when comment mentions may precede definition"

requirements-completed:
  - VF-01
  - VF-02
  - VF-03

# Metrics
duration: 20min
completed: 2026-05-19
---

# Phase 19 Plan 01: Validator Fixes Summary

**Three false-positive/false-negative bugs fixed in validate_dash.js and check_design.js — DS4 now accepts Dashboard Studio spec-correct item property, DS5 distinguishes missing default (FAIL) from non-wildcard default (WARN DS5w), D11 scans from method definition not first comment mention**

## Performance

- **Duration:** 20 min
- **Started:** 2026-05-19T00:00:00Z
- **Completed:** 2026-05-19T00:20:00Z
- **Tasks:** 3 (2 TDD, 1 verification)
- **Files modified:** 4

## Accomplishments

- Fixed DS4 false positive: structure items using Dashboard Studio spec-correct "item" property now pass hasTitleAtTop() check (was always failing because check only looked at "vizId")
- Added DS5w WARN: drilldown token with non-wildcard default value emits WARN (not FAIL), exits 0 — distinguishes broken (missing default, FAIL DS5) from suspicious (non-wildcard, WARN DS5w)
- Fixed D11 false positive: scan now starts from the last occurrence of _onMouseMove (the method definition), not the first (often a comment) — prevents false FAIL D11 when a JSDoc comment mentions _onMouseMove above a guarded method

## Task Commits

Each task was committed atomically with TDD RED/GREEN pattern:

1. **Task 1 RED: DS4 item key + DS5w tests** - `da5d63a` (test)
2. **Task 1 GREEN: DS4 fix + emitWarn + DS5w** - `d6206a7` (feat)
3. **Task 2 RED: D11 comment-before-definition test** - `80b6551` (test)
4. **Task 2 GREEN: D11 lastIndexOf fix** - `cb5ff99` (feat)
5. **Task 3: Both suites verified — no additional commit (verification only)**

## Files Created/Modified

- `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_dash.js` - Added emitWarn(), fixed item.item||item.vizId in hasTitleAtTop(), added DS5w WARN else-if branch
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/test_validate_dash.js` - Added DS4 item key fixture and DS5w non-wildcard fixture (5 new assertions)
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/check_design.js` - Changed indexOf to lastIndexOf on line 239
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/test_check_design.js` - Added D11 comment-before-definition fixture with >1500-char filler gap

## Decisions Made

- DS4 uses `item.item || item.vizId` — Dashboard Studio spec uses "item" property in structure arrays, not "vizId". Fallback to "vizId" preserves backwards compat with existing dashboards (D-01)
- DS5w is WARN not FAIL — non-wildcard defaults are suspicious (may not show all data before first click) but sometimes intentional (e.g., time range tokens). WARN doesn't increment violations, exits 0 (D-03)
- D11 uses `lastIndexOf` — the extend({}) object method is always the last occurrence of the method name in the file. Comments before the definition were causing false FAIL D11 (D-02)

## Deviations from Plan

None - plan executed exactly as written. All three fixes implemented as specified in the CONTEXT.md decisions D-01, D-02, D-03.

## Issues Encountered

During Task 2 RED phase, the initial D11 test fixture did not expose the indexOf bug because the comment and definition were too close (definition within the 1500-char window). Resolved by adding >1500 chars of filler string declarations between the comment and the method definition to push the definition outside the scan window. This is the correct approach — it produces a fixture that provably catches the bug.

## User Setup Required

None - no external service configuration required. All changes are to Node.js validator scripts run locally.

## Next Phase Readiness

- Validators are now accurate: phases 20 and 21 can generate new patterns against this pipeline without false positives from DS4 item property mismatch, D11 comment false positives, or incorrect DS5 strictness
- Both test suites pass: 79 (validate_dash) + 31 (check_design) = 110 total, 0 failed

---
*Phase: 19-validator-fixes*
*Completed: 2026-05-19*
