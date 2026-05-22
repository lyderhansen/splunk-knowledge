---
phase: 30-data-drilldown-adapter
plan: "02"
subsystem: vp-viz/references
tags: [documentation, edge-cases, extension-api]
dependency_graph:
  requires: []
  provides: [edge-cases.md ECR-09]
  affects: [viz-blueprints.md Extension API Data Access]
tech_stack:
  added: []
  patterns: [ECR pattern structure]
key_files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/references/edge-cases.md
decisions:
  - "ECR-09 combines loading gate and dataSources null check into one code block for conciseness"
  - "Trimmed to 598 lines (within 575-600 target) by collapsing WRONG/CORRECT pairs onto fewer lines"
metrics:
  duration: "2m"
  completed: 2026-05-22
  tasks: 1
  files: 1
---

# Phase 30 Plan 02: ECR-09 Extension API Edge Cases Summary

Extension API loading gate, null dataSources chain, string-typed numerics, iframe sandbox, and no-formatData patterns added as ECR-09 to edge-cases.md.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add ECR-09 Extension API edge cases | 5dc57f33 | edge-cases.md (+56 lines) |

## Outcome

edge-cases.md updated from 542 lines to 598 lines. ECR-09 covers all five Extension API-specific pitfalls:

1. **Loading gate** — `if (ds.loading) return;` guard at render entry
2. **dataSources null check** — defensive `&&` chain replacing Classic `!data.rows` guard
3. **String-to-number** — all `data.columns` values are strings; use `safeNum` before arithmetic
4. **iframe sandboxing** — no `window.parent` access; use `document.getElementById('root')` and `VisualizationAPI`
5. **No formatData** — field-index resolution moves inside the render function

ECR-09 ends with a Rules section that notes it applies only to Extension API vizs; Classic vizs continue using ECR-01 through ECR-08 unchanged.

## Deviations from Plan

None — plan executed exactly as written. Initial draft at 605 lines was trimmed to 598 by collapsing comment-heavy code examples, staying within the 575-600 line target.

## Self-Check: PASSED

- [x] `grep -c "ECR-09" edge-cases.md` → 2 (section header + scope note)
- [x] `grep -c "loading" edge-cases.md` → 3
- [x] `grep -c "dataSources" edge-cases.md` → 7
- [x] `grep -c "iframe" edge-cases.md` → 3
- [x] `grep -c "formatData" edge-cases.md` → 6
- [x] `wc -l edge-cases.md` → 598 (within 575-600 target)
- [x] Commit 5dc57f33 verified in git log
