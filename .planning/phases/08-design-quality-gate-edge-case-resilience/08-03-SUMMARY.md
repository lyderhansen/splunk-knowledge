---
phase: 08-design-quality-gate-edge-case-resilience
plan: "03"
subsystem: validation
tags: [nodejs, testing, validate_viz, design-quality-gate, skill-md, splunk-viz-packs]

# Dependency graph
requires:
  - phase: 08-01
    provides: check_design.js script with D01-D08 checks
  - phase: 08-02
    provides: edge-cases.md reference file (ECR-01 through ECR-05)
provides:
  - test_check_design.js: 16-test synthetic fixture suite for DQG-01/02/03/05/08
  - validate_viz.sh Phase 4 block: check_design.js wired per-viz with SKIP branch
  - SKILL.md edge-cases.md MUST-READ bullet in Other references
affects:
  - All future vp-viz builds: validate_viz.sh now runs design quality gate automatically
  - Claude generating new vizs: SKILL.md now surfaces edge-cases.md as MUST-READ for step 5

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "test_check_design.js follows test_check_contrast.js infrastructure pattern exactly (tmpFile, run, assert, assertIncludes, assertNotIncludes, cleanup, summary)"
    - "D01/D02 WARN tests use minimal formatters with matching opt() keys in JS to avoid D08 interference"
    - "Phase 4 bash block: same FINDINGS_FILE append pattern as Phase 3 contrast check (lines 260-262)"

key-files:
  created:
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/test_check_design.js
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh
    - plugins/splunk-viz-packs/skills/vp-viz/SKILL.md

key-decisions:
  - "D01/D02 WARN test fixtures use dedicated FORMATTER_MINIMAL (not FORMATTER_4_SECTIONS) to ensure all formatter keys are present in JS opt() calls — prevents D08 FAIL from masking the WARN-only exit code check"
  - "Phase 4 block declared CHECK_DESIGN inline (not as top-level variable) to keep diff minimal per plan instructions"
  - "SKILL.md line count is 469/500 after addition (was 468/500) — well within budget"

patterns-established:
  - "Test isolation: each DQG check test uses its own tmpFile fixtures with only the signals relevant to that check"
  - "Phase 4 in validate_viz.sh: guard is HAS_NODE + file existence; per-viz loop prefers src/ over bundle (same as Phase 1 JS checks)"

requirements-completed: [DQG-07]

# Metrics
duration: 15min
completed: 2026-05-16
---

# Phase 8 Plan 03: Pipeline Wiring and Test Suite Summary

**test_check_design.js (16 synthetic fixture tests), validate_viz.sh Phase 4 design quality gate block (check_design.js wired per-viz with SKIP fallback), and SKILL.md edge-cases.md MUST-READ bullet — full Phase 8 pipeline now operational**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-05-16T14:05:00Z
- **Completed:** 2026-05-16T14:20:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created test_check_design.js (pure ES5 CJS, 300+ lines, 16 tests, 0 failures)
- Tests cover: usage guard, D03 FAIL/PASS (getTypoScale and Math.min+Math.max), D05 FAIL/PASS (section threshold = 4), D01 WARN (no gradient, exits 0), D02 WARN (no shadow, exits 0), D08 FAIL forward, D08 PASS forward
- Added Phase 4 Design Quality Gate block to validate_viz.sh after repair loop (line 307), before final results
- Phase 4 loops each formatter.html, prefers src/visualization_source.js over bundle, runs check_design.js, appends FINDING: NDJSON to FINDINGS_FILE, sets TOTAL_FAIL=1 on failures, prints SKIP when check_design.js absent or Node unavailable
- Added edge-cases.md MUST-READ bullet to SKILL.md Other references section (469/500 lines)
- bash -n syntax check passes; test_check_contrast.js regression: 19 passed, 0 failed

## Task Commits

Each task was committed atomically:

1. **Task 1: Create test_check_design.js** - `4aac456` (test)
2. **Task 2: Add Phase 4 to validate_viz.sh and edge-cases.md bullet to SKILL.md** - `ec5c3cd` (feat)

## Files Created/Modified

- `plugins/splunk-viz-packs/skills/vp-viz/scripts/test_check_design.js` - 16-test suite for check_design.js DQG checks
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh` - Phase 4 Design Quality Gate block added
- `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md` - edge-cases.md MUST-READ bullet in Other references

## Decisions Made

- D01/D02 WARN test fixtures use FORMATTER_MINIMAL (not FORMATTER_4_SECTIONS) to prevent D08 interference: all formatter keys must have matching opt() calls in the JS fixture or D08 FAIL would set exit code 1, masking the test for WARN-only exit behavior
- Phase 4 CHECK_DESIGN variable declared inline in Phase 4 block (not as a top-level variable alongside CHECK_CONTRAST) per plan instructions to keep diff minimal
- Phase 4 block uses the same FINDINGS_FILE append pattern (>>) as Phase 3 to prevent overwriting earlier findings (T-08-06 threat mitigation)

## Deviations from Plan

None — plan executed exactly as written. D08_FORMATTER_PASS tmpFile created but unused (D08 PASS test reuses D08_FORMATTER directly); that unused tmpFile line was removed to keep code clean.

## Known Stubs

None — all three files are fully implemented with no placeholder content.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. Phase 4 block uses the same file-path patterns as existing phases.

---

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| test_check_design.js exists | FOUND |
| validate_viz.sh exists | FOUND |
| SKILL.md exists | FOUND |
| commit 4aac456 exists | FOUND |
| commit ec5c3cd exists | FOUND |
| 'Design Quality Gate' in validate_viz.sh | PASS |
| edge-cases.md in SKILL.md | PASS |
| SKILL.md <= 500 lines (469) | PASS |
| test_check_design.js >= 80 lines (409) | PASS |
