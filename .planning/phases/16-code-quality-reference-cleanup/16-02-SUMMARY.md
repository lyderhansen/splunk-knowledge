---
phase: 16-code-quality-reference-cleanup
plan: "02"
subsystem: vp-viz validation scripts and reference docs
tags: [check_design, validation, code-quality, hover-guard, viz-type, accent-intensity]
dependency_graph:
  requires: []
  provides:
    - D09 accentIntensity cap detection in check_design.js
    - D10 @viz-type annotation enforcement in check_design.js
    - D11 showHoverEffect hover guard enforcement in check_design.js
  affects:
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/check_design.js
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/test_check_design.js
    - plugins/splunk-viz-packs/skills/vp-viz/references/pre-code-checklist.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md
tech_stack:
  added: []
  patterns:
    - regex-based pattern detection in ES5 CJS validator
    - heuristic substring extraction for function body scanning (D11)
key_files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/check_design.js
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/test_check_design.js
    - plugins/splunk-viz-packs/skills/vp-viz/references/pre-code-checklist.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/viz-blueprints.md
decisions:
  - D09 uses regex to detect three cap patterns (ternary, double-ternary, Math.min) with priority order to avoid double-match
  - D10 only checks first line to minimize false positives (comment on line 1 is the canonical contract)
  - D11 uses 1500-char heuristic block extraction since function boundaries are hard to parse in ES5 without an AST
  - Pre-existing D01/D02 test fixtures updated to include @viz-type annotation (Rule 1 bug fix)
metrics:
  duration: "~15 min"
  completed: "2026-05-18"
  tasks_completed: 2
  files_modified: 4
requirements:
  - CQ-02
  - CQ-03
  - CQ-04
  - CQ-05
---

# Phase 16 Plan 02: D09/D10/D11 Design Quality Gates Summary

**One-liner:** Added three new FAIL rules to check_design.js — accentIntensity cap detection (D09), @viz-type annotation enforcement (D10), and showHoverEffect hover guard enforcement (D11) — with 9 new passing test cases and strengthened pre-code-checklist.md and viz-blueprints.md documentation.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add D09, D10, D11 rules to check_design.js | 0a3cdd6 | check_design.js (+64 lines) |
| 2 | Add test cases for D09/D10/D11 and update reference docs | a27089a | test_check_design.js, pre-code-checklist.md, viz-blueprints.md |

## What Was Built

### check_design.js — Three new FAIL rules

**D09 (FAIL, CQ-02): accentIntensity cap detection**
Detects when `gi` (accentIntensity) is clamped at 1.0 via:
- Double ternary: `gi = gi < 0 ? 0 : gi > 1 ? 1 : gi`
- Simple ternary: `gi > 1 ? 1 : gi`
- Math.min: `Math.min(gi, 1)` or `Math.min(1, gi)`

Values above 100 are intentional for extreme glow effects. The ceiling clamp silently truncates them.

**D10 (FAIL, CQ-05): @viz-type annotation on first line**
Requires `// @viz-type: <type>` as the very first line of `visualization_source.js`. Valid types: kpi, gauge, bars, grid, line, timeline, radar, progress, scatter, network. Unrecognized types emit WARN (not FAIL) to allow forward compatibility.

**D11 (FAIL, CQ-03): showHoverEffect early-exit guard in _onMouseMove**
When `_onMouseMove` exists, checks a 1500-char heuristic block starting at the function for a guard pattern matching `(showHover|hoverEnabled|hoverEffect).*return` or `if\s*\(\s*!\s*(this\.)?_?showHover`. Skips entirely when `_onMouseMove` is absent.

### test_check_design.js — 9 new test cases

All 30 tests pass (16 pre-existing + 9 new D09/D10/D11 + 5 pre-existing D01/D02/D08 tests that needed @viz-type annotation added to fixtures).

D09 (3 tests): ternary cap FAIL, Math.min cap FAIL, floor-only PASS
D10 (3 tests): missing annotation FAIL, valid annotation PASS, unrecognized type WARN
D11 (3 tests): no guard FAIL, with guard PASS, no _onMouseMove PASS

### pre-code-checklist.md — Enforcement notes added

- D10 enforcement note after the @viz-type checklist item
- D11 hover guard checklist item with code pattern
- D09 accentIntensity enforcement note in Settings Wiring Verification
- D11 reference in toggle controls note

### viz-blueprints.md — KPI sparkline documentation

- Added sparkline rendering paragraph with canvas-recipes.md cross-reference
- Added "Sparkline display mode" creative decision bullet in KPI section

## Verification Results

| Criterion | Result |
|-----------|--------|
| `node test_check_design.js` exits 0 | 30 passed, 0 failed |
| D09/D10/D11 references in check_design.js >= 6 | 11 references |
| showHoverEffect count in pre-code-checklist.md >= 2 | 2 lines |
| sparkPlacement count in viz-blueprints.md >= 2 | 3 lines |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Pre-existing D01/D02 test fixtures missing @viz-type annotation**
- **Found during:** Task 2 (running tests revealed D10 now caused pre-existing tests to fail)
- **Issue:** GOOD_JS, NO_HERO_JS, TYPO_JS, MINMAX_JS, D08_JS_MISSING, D08_JS_PRESENT, NO_GRAD_JS, NO_SHADOW_JS fixtures had no `// @viz-type:` first line. After adding D10 rule, these fixtures all triggered FAIL D10.
- **Fix:** Added `'// @viz-type: kpi',` as first element to all pre-existing JS fixture arrays
- **Files modified:** test_check_design.js
- **Commits:** a27089a

## Threat Flags

None — changes are build-time validation scripts and reference documentation only. No new network endpoints, auth paths, or schema changes.

## Self-Check: PASSED

All 5 files confirmed present. Both task commits confirmed in git log.
