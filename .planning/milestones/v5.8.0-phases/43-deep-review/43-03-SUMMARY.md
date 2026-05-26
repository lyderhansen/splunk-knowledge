---
phase: 43-deep-review
plan: "03"
subsystem: vp-viz/scripts tooling
tags: [review, validation, code-symmetry, drift-analysis]
dependency_graph:
  requires: []
  provides: [43-WAVE-3-REVIEW-VP-VIZ-SCRIPTS.md]
  affects: [pre-code-checklist.md, broken-rules.md, vp-create/SKILL.md, plugin.json]
tech_stack:
  added: []
  patterns: [bash-validator, node-es5-cjs, code-symmetry-table]
key_files:
  created:
    - .planning/phases/43-deep-review/43-WAVE-3-REVIEW-VP-VIZ-SCRIPTS.md
  modified: []
decisions:
  - "Task 1 automated verify has BSD awk bug (same start/end pattern in range) — doc satisfies all acceptance criteria but automated verify reports FAIL due to awk range immediately closing; documented as known verify limitation"
  - "All 3 tasks completed as a single commit since all tasks write to the same output file"
metrics:
  duration: "~45 minutes"
  completed: "2026-05-24"
  tasks_completed: 3
  tasks_total: 3
  files_changed: 1
---

# Phase 43 Plan 03: Wave 3 Review — vp-viz/scripts/ Summary

Wave 3 exhaustive read of all 17 scripts in `plugins/splunk-viz-packs/skills/vp-viz/scripts/` (excluding `vendor/`). Produced `43-WAVE-3-REVIEW-VP-VIZ-SCRIPTS.md` with per-cluster findings and canonical code-symmetry Coverage Summary.

## What Was Delivered

`43-WAVE-3-REVIEW-VP-VIZ-SCRIPTS.md` — 296 lines covering:

- **Cluster 1 (6 primary validators):** 4 BLOCKERs, 5 WARNINGs, 5 NITs
- **Cluster 2 (11 test/repair/build scripts):** 2 BLOCKERs, 6 WARNINGs, 4 NITs
- **Coverage Summary:** Full code-symmetry table across B1-B23, D01-D11, E01-E05, F3, A01-A04, R1/R6, DS1-DS5, CONTRAST, XFILE
- **plugin.json description audit:** WARNING with recommended fix

## Key Findings

### Highest-value (CONTEXT D-05 class — "docs say X, linter enforces Y")

The Coverage Summary reveals 24 ENFORCED-ONLY codes (script emits FAIL/WARN, no matching code tag anywhere in docs):

- **D01-D08 (8 codes):** `check_design.js` enforces all Design Quality Gate checks but none are tagged in `pre-code-checklist.md` (D09, D10, D11 are the three exceptions — they have tags and enforcement)
- **E01-E05 (5 codes):** `validate_viz.sh` enforces Extension API checks; `pre-code-checklist.md` Extension checklist describes the rules but doesn't tag them E01-E05
- **A01-A04 (4 codes):** Asset dimension checks enforced but not tagged in any doc
- **DS1-DS5 (5 codes):** `validate_dash.js` dashboard JSON rules have zero doc homes
- **CONTRAST:** `check_contrast.js` emits this code; not referenced in any doc
- **XFILE:** `validate_ast.js --cross` emits this code; zero doc home

### Phase 41 D-01/D-02 split gap (BLOCKER)

`generate_assets.js` in `vp-viz/scripts/` still generates `preview.png` unconditionally. The `--legacy-previews` flag referenced in `vp-create/SKILL.md:80` does not exist in `generate_assets.js` — the flag is silently ignored. The Phase 41 split landed in `vp-create/SKILL.md` skill instructions but not in the actual `generate_assets.js` code.

### Integration test target staleness (WARNING)

All integration test fixtures (test21, test25, test28) predate THM-05 and AF-01. Tests encode pre-fix violation profiles, making it hard to add a "known-good modern pack" baseline.

### plugin.json over-promise (WARNING)

Plugin description claims "50+ validation checks (B1-B23, D1-D11, E1-E5, F1-F12)". Actual enforced count is approximately 37 distinct codes across all scripts. Only 7 B-codes are enforced (not 23); only F3 is enforced (not F1-F12). Recommendation: trim description to actual count.

## Deviations from Plan

### Known Verify Limitation

**[Plan 43-03 Task 1 automated verify]** The `<verify><automated>` block for Task 1 uses `awk "/^## Cluster 1/,/^## Cluster/"` which has a BSD awk edge case: when the start pattern (`/^## Cluster 1/`) also matches the end pattern (`/^## Cluster/`), BSD awk enters and immediately exits the range on the same line, producing only one line of output. The document DOES satisfy all acceptance criteria (H2 present, all 6 scripts cited, BLOCKER/WARNING/NIT sections present), but the automated grep check against the awk output fails.

This is a plan-level verify script bug, not a document content issue. The review file is complete.

## Self-Check: PASSED

- `43-WAVE-3-REVIEW-VP-VIZ-SCRIPTS.md` exists and contains: `## Cluster 1: Primary Validators`, `## Cluster 2: Tests + Repair + Build`, `## Coverage Summary`, `### plugin.json description audit`
- All 17 scripts cited by name (6 primary validators + 11 test/repair/build)
- Commit `4342fa29` exists with file addition confirmed
- No source files modified (review-only plan)
