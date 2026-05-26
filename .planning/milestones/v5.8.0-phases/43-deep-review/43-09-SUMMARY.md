---
phase: 43-deep-review
plan: "09"
subsystem: splunk-viz-packs/vp-debug + vp-viz/scripts
tags: [broken-rules, documentation, validator, contrast, dashboard, xfile, test-fixture]
dependency_graph:
  requires: []
  provides:
    - broken-rules.md DS1-DS5 documentation
    - broken-rules.md XFILE documentation
    - broken-rules.md CONTRAST WCAG AA documentation
    - broken-rules.md B17 detail section
    - validate_viz.sh R2/R3/N1 code tags
    - check_contrast.js accurate WCAG AA comment
  affects:
    - plugins/splunk-viz-packs/skills/vp-debug/references/broken-rules.md
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/check_contrast.js
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/repair_findings.js
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/test_validate_viz_integration.sh
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_ast.js
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/score_design.js
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/test_validate_ast.js
tech_stack:
  added: []
  patterns:
    - WCAG AA 4.5:1 / 3.0:1 contrast threshold documentation
    - R2/R3/N1 structured code tags for structure checks in validate_viz.sh
key_files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-debug/references/broken-rules.md
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/check_contrast.js
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/repair_findings.js
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/test_validate_viz_integration.sh
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_ast.js
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/score_design.js
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/test_validate_ast.js
decisions:
  - broken-rules.md chosen as canonical doc home for DS1-DS5, XFILE, CONTRAST (single lookup target pattern)
  - B17 detail section added inline in broken-rules.md (not a new file)
  - T_ANEW_1 fixture reduced 400->50 bytes to reliably trigger <100-byte A01 threshold
  - score_design.js themeContent comment is documentation-only — no scoring logic changed
metrics:
  duration_minutes: 25
  completed_date: "2026-05-25"
  tasks_completed: 2
  files_modified: 8
---

# Phase 43 Plan 09: Cluster B broken-rules.md backfill + script comment fixes Summary

Backfilled broken-rules.md with 8 new documentation entries for 24 previously ENFORCED-ONLY codes (DS1-DS5, XFILE, CONTRAST, B17). Fixed 4 script files with targeted comment and code-tag improvements. Closed BLOCKERs B-12 through B-15 and B-17.

## Tasks Completed

### Task 1: broken-rules.md backfill (B-12, B-13, B-14, B-15)

Commit: `b6f0833b`

Added to `plugins/splunk-viz-packs/skills/vp-debug/references/broken-rules.md`:

1. **DS1-DS5 section** — Five dashboard validator codes with JSON fix patterns:
   - DS1: Undeclared data source (dataSources object mismatch)
   - DS2: Tab schema error (array vs object, layoutDefinitionId vs layoutId)
   - DS3: Missing bg_gradient background asset
   - DS4: Missing splunk.Markdown title panel
   - DS5: Drilldown token with no defaults.tokens.default entry

2. **XFILE section** — Formatter-to-JS option key mismatch, with explanation of FAIL vs WARN levels and common causes (renamed key, missing formatter control, B10 namespace issue).

3. **CONTRAST section** — WCAG AA thresholds (4.5:1 normal text, 3.0:1 large/UI), explanation that no auto-repair exists, common causes including textFaint on light backgrounds.

4. **B17 detail section** — getBoundingClientRect unreliable in AMD context; correct pattern uses `this.el.clientWidth / clientHeight` with `window.innerWidth/Height` fallback.

5. **B22/B23 summary rows** — Added "(no static check; enforce visually or via integration test)" and "(no static check; verify visually in light mode)" respectively.

### Task 2: Script comment fixes + T_ANEW_1 fixture (B-15, B-17, W-19, W-22, N-9, N-10, N-11, N-12)

Commit: `f43735f6`

| File | Change | Issue Closed |
|------|--------|--------------|
| check_contrast.js | `(D-11)` comment replaced with `(WCAG AA — check_contrast.js)` | B-15 |
| repair_findings.js | Exclusion comment added above FIXABLE_CODES array | W-22 |
| validate_viz.sh | B20 divergence note (grep-based vs DOM-based strategy) | W-19 |
| validate_viz.sh | `FAIL:` -> `FAIL R2:`, `FAIL:` -> `FAIL R3:`, `WARN:` -> `WARN N1:` | N-9, N-10, N-11 |
| test_validate_viz_integration.sh | T_ANEW_1 fixture: 400 -> 50 bytes (reliably below 100-byte threshold) | B-17 |
| validate_ast.js | XFILE cross-reference comment pointing to broken-rules.md | B-13 |
| score_design.js | themeContent load annotated as unused (future scoreGradient hook) | W-21 |
| test_validate_ast.js | Dead TESTS_ROOT double-assignment removed | N-12 |

## Deviations from Plan

None — plan executed exactly as written. All 8 tasks completed in order.

## Known Stubs

None.

## Threat Flags

None — all changes are documentation, comments, and a test fixture size reduction. No new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check: PASSED

Files created/modified verified present:
- `plugins/splunk-viz-packs/skills/vp-debug/references/broken-rules.md` — FOUND (DS1:3, XFILE:4, CONTRAST:4, B17:3 matches)
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/check_contrast.js` — FOUND (WCAG AA:2 matches)
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/repair_findings.js` — FOUND (intentionally excluded:1)
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh` — FOUND (FAIL R2:1, FAIL R3:1, WARN N1:1)
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/test_validate_viz_integration.sh` — FOUND (bs=50:1)
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_ast.js` — FOUND (XFILE/broken-rules.md comment)
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/score_design.js` — FOUND (themeContent comment)
- `plugins/splunk-viz-packs/skills/vp-viz/scripts/test_validate_ast.js` — FOUND (dead assignment removed)

Commits verified:
- `b6f0833b` (docs(43-09): backfill broken-rules.md DS1-DS5, XFILE, CONTRAST, B17) — FOUND
- `f43735f6` (fix(43-09): script comment fixes, T_ANEW_1 fixture, R2/R3/N1 tags) — FOUND
