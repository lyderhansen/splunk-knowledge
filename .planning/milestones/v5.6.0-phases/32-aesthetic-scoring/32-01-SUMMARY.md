---
phase: 32-aesthetic-scoring
plan: 01
subsystem: vp-viz/scripts
tags: [aesthetic-scoring, viz-quality, tooling, es5]
dependency_graph:
  requires: []
  provides: [score_design.js, test_score_design.js]
  affects: [vp-viz pipeline, validate_viz.sh (future Phase 32-02)]
tech_stack:
  added: []
  patterns: [ES5 CJS CLI script, Node.js built-ins only, spawnSync test pattern]
key_files:
  created:
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/score_design.js
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/test_score_design.js
  modified: []
decisions:
  - "Exit code 2 for missing files (consistent with check_design.js convention)"
  - "T1 total is 15 (not 20) — baseline without dynamic sizing or color variety but with 1 font size and hardcoded layout"
  - "Typography dimension uses px-value regex against ctx.font assignments; captures both literal and arithmetic font patterns"
metrics:
  duration: "2m 40s"
  completed_date: "2026-05-22"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 0
---

# Phase 32 Plan 01: Aesthetic Scoring Script Summary

**One-liner:** Aesthetic scoring script (score_design.js) that reads viz source and theme files, outputs a 0-100 score across 5 dimensions with per-dimension breakdown.

## What Was Built

### score_design.js

New script at `plugins/splunk-viz-packs/skills/vp-viz/scripts/score_design.js` (204 lines).

CLI: `node score_design.js <visualization_source.js> <theme.js> [viz_name]`

Output format: `  SCORE: {total}/100 (gradient: {g}, typography: {t}, spacing: {s}, color: {c}, animation: {a})`

With viz name: `  SCORE [my_viz]: {total}/100 ...`

The 5 scoring dimensions (each 0-20 pts):

| Dimension | Signals | Scoring |
|-----------|---------|---------|
| Gradient | createLinearGradient / createRadialGradient count | 0=0, 1=10, 2+=20 |
| Typography | Distinct px font sizes in ctx.font assignments | 1=5, 2=10, 3+=20 |
| Spacing | Dynamic sizing (w * factor, h * factor) count | 0=5, 1-3=10, 4+=20 |
| Color | Distinct fillStyle/strokeStyle values | 1-2=5, 3-4=10, 5+=15, +5 for t.accent/t.series |
| Animation | requestAnimationFrame / setInterval / _onMouseMove | none=0, one=10, full=20 |

Exit codes: 0 (always, informational), 2 (usage/file-not-found error).

### test_score_design.js

New test file at `plugins/splunk-viz-packs/skills/vp-viz/scripts/test_score_design.js` (228 lines).

8 test cases, 21 assertions, all pass. Each test creates isolated temp files in /tmp, runs score_design.js via spawnSync, parses SCORE output, and asserts specific dimension values or total ranges.

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1+2 | score_design.js + test_score_design.js | d773a0cb | scripts/score_design.js, scripts/test_score_design.js |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] T1 total assertion corrected from 20 to 15**
- **Found during:** Task 2 test run
- **Issue:** Plan spec said "Total should be 15" but test was asserting 20 (0+5+5+5+0=15)
- **Fix:** Changed `assert('T1 -- total=20', ...)` to `assert('T1 -- total=15', ...)`
- **Files modified:** test_score_design.js
- **Commit:** d773a0cb (included in same commit)

## Known Stubs

None — both files are complete and functional.

## Threat Flags

None — both files are local-only scripts reading CLI-provided file paths. No network access, no user-facing output beyond stdout.

## Self-Check: PASSED

- [x] score_design.js exists: /Users/joehanse/Library/CloudStorage/OneDrive-Cisco/Documents/03_Funny_Projects/splunk-knowledge/plugins/splunk-viz-packs/skills/vp-viz/scripts/score_design.js
- [x] test_score_design.js exists: /Users/joehanse/Library/CloudStorage/OneDrive-Cisco/Documents/03_Funny_Projects/splunk-knowledge/plugins/splunk-viz-packs/skills/vp-viz/scripts/test_score_design.js
- [x] Commit d773a0cb exists in git log
- [x] 21/21 tests pass
- [x] ES5 compliance: grep -c 'const |let | => ' returns 0
- [x] Line count: 204 lines (within 100-250 range)
- [x] Exit 0 on valid input, exit 2 on missing args/files
