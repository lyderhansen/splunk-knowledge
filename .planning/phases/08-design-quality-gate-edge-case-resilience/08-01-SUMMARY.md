---
phase: 08-design-quality-gate-edge-case-resilience
plan: "01"
subsystem: validation
tags: [nodejs, cheerio, check_design, design-quality-gate, splunk-viz-packs]

# Dependency graph
requires:
  - phase: 03-repair-loop-light-theme-safety
    provides: check_contrast.js structural pattern (emitFail/emitWarn, exit codes, FINDING: NDJSON)
  - phase: 07-generation-quality-theme-parity
    provides: D-03 decision (4 formatter sections minimum), D-03 severity model decisions
provides:
  - check_design.js script with D01-D06 + D08 design quality gate checks
  - emitFail writes FINDING: NDJSON to stderr; emitWarn stdout-only
  - bidirectional wiring check (formatter↔JS), hero formula check, section count check
affects:
  - phase: 08-02 (validate_viz.sh wiring for Phase 4)
  - phase: 08-03 (edge-cases.md reference file)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "check_design.js follows check_contrast.js structural pattern exactly (CJS ES5, emitFail/emitWarn, exit 0/1/2)"
    - "Bidirectional wiring: extract keys from formatter name= attrs, grep JS for quoted strings, reverse via opt() regex"
    - "D03 accepts getTypoScale() OR (Math.min + Math.max) as valid hero formula — per CONTEXT.md decision"

key-files:
  created:
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/check_design.js
  modified: []

key-decisions:
  - "WARN checks never write FINDING: NDJSON to stderr — only emitFail does (per check_contrast.js line 131 pattern)"
  - "D03 accepts getTypoScale() as alternative to Math.min+Math.max for hero formula detection"
  - "D08 forward direction is FAIL (formatter key not in JS), reverse direction is WARN (opt() key not in formatter)"
  - "D05 threshold is 4 sections, matching Phase 7 D-12 formatter section minimum"

patterns-established:
  - "Design gate script: CJS ES5, 3-file argv (formatter, JS, theme), emitFail/emitWarn pattern from check_contrast.js"
  - "Formatter key extraction: strip {{VIZ_NAMESPACE}}. prefix via lastIndexOf('.'), collect unique keys"

requirements-completed: [DQG-01, DQG-02, DQG-03, DQG-04, DQG-05, DQG-06, DQG-08]

# Metrics
duration: 10min
completed: 2026-05-16
---

# Phase 8 Plan 01: Design Quality Gate Script Summary

**Node.js CJS script check_design.js with 7 design checks (D01-D06, D08) — FAIL for missing hero formula, insufficient formatter sections, and broken wiring; WARN for missing gradients, shadows, tinted neutrals, and color pickers**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-05-16T13:52:00Z
- **Completed:** 2026-05-16T14:02:56Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created check_design.js (177 lines, pure ES5 CJS) modeled on check_contrast.js structural pattern
- Implemented all 7 checks: D01-D06 + D08 bidirectional wiring
- Correct severity model: FAIL for D03/D05/D08-forward, WARN for D01/D02/D04/D06/D08-reverse
- emitFail writes FINDING: NDJSON to stderr; emitWarn writes stdout only (no stderr)
- All acceptance criteria pass: usage guard (exit 2), file-not-found guard (exit 1), ES5 clean, getTypoScale alternative, form[section-label] selector, process.exit(failures > 0 ? 1 : 0)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create check_design.js with all seven design checks** - `3fb024d` (feat)

**Plan metadata:** (to be committed with this SUMMARY)

## Files Created/Modified
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/check_design.js` - Design quality gate Node.js script with D01-D06 + D08 checks

## Decisions Made
- Used CONTEXT.md D-01 decision: WARNs always shown, no suppress mechanism
- Used CONTEXT.md D-02 decision: DQG-05 threshold is 4 sections
- Used CONTEXT.md D-03 severity mapping: FAIL = D03/D05/D08 forward, WARN = D01/D02/D04/D06/D08 reverse
- Used CONTEXT.md D-06 decision: namespace extraction from formatter name= attrs, grep presence in JS for wiring check
- Used CONTEXT.md D-07 decision: no special whitelist for themeMode — grep presence is sufficient

## Deviations from Plan

None - plan executed exactly as written. The 08-PATTERNS.md and 08-RESEARCH.md files referenced in the plan's context did not exist on disk, but all required patterns were fully documented in the plan's `<interfaces>` block — no deviation required.

## Issues Encountered

08-PATTERNS.md and 08-RESEARCH.md were listed in the plan's `<context>` block but did not exist as files. The `<interfaces>` section in the plan itself contained all necessary check patterns and logic, so implementation proceeded without them.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- check_design.js is ready to be wired into validate_viz.sh Phase 4 section (08-02 PLAN)
- All 7 checks callable as: `node check_design.js <formatter.html> <viz.js> <theme.js>`
- cheerio dependency path: `vendor/node_modules/cheerio` (same vendor dir as other scripts)

---
*Phase: 08-design-quality-gate-edge-case-resilience*
*Completed: 2026-05-16*
