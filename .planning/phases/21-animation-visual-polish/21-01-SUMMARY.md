---
phase: 21-animation-visual-polish
plan: "01"
subsystem: splunk-viz-packs
tags: [validator, design-quality, gradient-enforcement, vp-01]
dependency_graph:
  requires: []
  provides: [D01-conditional-fail, fillTechnique-export]
  affects: [check_design.js, test_check_design.js, theme-template.md]
tech_stack:
  added: []
  patterns: [conditional-escalation, design-commitment-enforcement]
key_files:
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/check_design.js
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/test_check_design.js
    - plugins/splunk-viz-packs/skills/vp-viz/references/theme-template.md
decisions:
  - "D01 escalates from WARN to FAIL only when theme.js declares fillTechnique containing 'gradient' — older packs without fillTechnique are unaffected"
  - "fillTechnique detection uses indexOf checks on themeContent for both 'fillTechnique' and 'gradient' strings — simple and ES5-compatible"
  - "VISUAL_LANG object added to theme-template.md with fillTechnique placeholder token following existing {{PLACEHOLDER}} pattern"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-19T20:28:29Z"
  tasks_completed: 2
  files_modified: 3
---

# Phase 21 Plan 01: D01 Conditional FAIL for Gradient Enforcement Summary

D01 validator check now escalates from WARN to FAIL when `theme.js` declares `fillTechnique: 'gradient'` but `visualization_source.js` contains no gradient calls — enforcing design commitments made in the visual language tokens.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Escalate D01 to FAIL when fillTechnique:gradient in theme.js | 3805dc6 | check_design.js |
| 2 | Add three D01 conditional-FAIL tests and fillTechnique to theme-template.md | 1f426a5 | test_check_design.js, theme-template.md |

## What Was Built

### check_design.js — D01 conditional escalation

The D01 block (lines 94–109) now branches on whether the pack has declared a gradient fill commitment:

- When `jsSrc` has no gradient calls AND `themeContent` contains both `fillTechnique` and `gradient`: `emitFail('D01', ...)` with message referencing the fillTechnique declaration
- When `jsSrc` has no gradient calls AND `themeContent` does NOT contain `fillTechnique` (or contains non-gradient fillTechnique): `emitWarn('D01', ...)` — unchanged behavior
- When `jsSrc` has gradient calls: no D01 finding regardless of fillTechnique

Detection uses `themeContent.indexOf('fillTechnique') !== -1 && themeContent.toLowerCase().indexOf('gradient') !== -1` — ES5-compatible and robust against varying whitespace/quote styles.

### test_check_design.js — three new D01 test cases

Added to the D01 test section (after existing WARN test):

- **Test A "D01 FAIL gradient-required"**: theme with `fillTechnique: 'gradient'`, JS with no gradient calls. Asserts exit 1 + stdout contains `FAIL D01`.
- **Test B "D01 WARN no-fillTechnique declared"**: theme without `fillTechnique`, JS with no gradient calls. Asserts exit 0 + stdout contains `WARN D01` (existing behavior unchanged).
- **Test C "D01 PASS gradient-required with gradient calls"**: theme with `fillTechnique: 'gradient'`, JS with `createLinearGradient`. Asserts stdout does NOT contain `D01`.

Total test count: 36 passed, 0 failed (was 31).

### theme-template.md — VISUAL_LANG with fillTechnique

Added `VISUAL_LANG` object before the `DARK` color object with comment documentation. Added `VISUAL_LANG: VISUAL_LANG` to `module.exports`. The `{{FILL_TECHNIQUE}}` placeholder follows the existing template-token pattern used throughout the file.

## Verification

Final test run: `=== Results: 36 passed, 0 failed ===`

Manual spot-checks confirmed:
1. fillTechnique:gradient + no gradient calls → exit 1, FAIL D01
2. No fillTechnique + no gradient calls → exit 0, WARN D01

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `plugins/splunk-viz-packs/skills/vp-viz/scripts/check_design.js` — modified, exists
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/test_check_design.js` — modified, exists
- `plugins/splunk-viz-packs/skills/vp-viz/references/theme-template.md` — modified, exists
- Commit 3805dc6 (Task 1) — exists
- Commit 1f426a5 (Task 2) — exists
