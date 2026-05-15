---
phase: 01-baseline-core-validators
plan: 03
subsystem: planning
tags: [fisr, baseline, scoring, quality-metrics]
dependency_graph:
  requires: []
  provides: [FISR-BASELINE.md]
  affects: [all future phase comparisons]
tech_stack:
  added: []
  patterns: [per-viz FISR scoring table, validator-based build-ok scoring]
key_files:
  created:
    - .planning/FISR-BASELINE.md
  modified: []
decisions:
  - "FISR Score is 3.8% (1/26 scoreable vizs) — only test23 engagement_gauge is a confirmed PASS"
  - "test22/22b/22c excluded from FISR denominator (tarball-only, no unpacked dir per Pitfall 4)"
  - "Build-OK=N for test28 (appIcon missing only) despite all formatter/JS checks passing"
metrics:
  duration: "2m"
  completed: "2026-05-15"
---

# Phase 01 Plan 03: FISR Baseline Summary

**One-liner:** Per-viz FISR scoring table for tests 21-28 — 3.8% pass rate (1/26 scoreable vizs), missing appIcon/preview.png as primary Build-OK failure driver.

## Status

**CHECKPOINT REACHED** — Task 1 complete and committed. Task 2 (human-verify) requires human review.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Audit test sessions 21-28 and run validator on unpacked app dirs | 9dcb885 | .planning/FISR-BASELINE.md |

## Task 1 Results

Ran `validate_viz.sh` on all 7 unpacked test app directories (test21, 23, 24, 25, 26, 27, 28). Scored Render-OK and Settings-OK from HANDOVER.md, SESSION-HANDOVER.md, and RESULTS.md.

### Validator Results Summary

| Test | App | Vizs | Validator Result | Key FAILs |
|------|-----|------|-----------------|-----------|
| test21 | patagonia_outdoor_ops | 6 | FAIL | B7 x6, B21 x5, R8 x6, missing appIcon |
| test22 | nike_training_club | 7 | ? (tarball only) | self-reported RESULTS.md |
| test22b | nike_training_club | 7 | ? (tarball only) | self-reported; SESSION-HANDOVER: 100% FAIL formatters (subagent) |
| test22c | nike_training_club | 4 | ? (tarball only) | self-reported RESULTS.md |
| test23 | nike_gauge_single | 1 | PASS | ALL CHECKS PASSED |
| test24 | apple_retail_viz | 5 | FAIL | missing appIcon, allow_user_selection, savedsearches.conf.spec |
| test25 | hospital_nps_gauge | 1 | FAIL | R8: preview.png too small (68 bytes) |
| test26 | riot_liveops_viz | 4 | FAIL | R8 x4 (no preview.png), missing appIcon |
| test27 | stripe_payment_ops_viz | 4 | FAIL | R8 x4 (no preview.png), missing appIcon |
| test28 | cloudflare_noc | 5 | FAIL | missing appIcon only (formatter + JS all pass) |

### FISR Score

**1 / 26 scoreable vizs = 3.8%**

The only confirmed PASS is test23 (nike_gauge_single / engagement_gauge): validator passes clean, handover explicitly confirms "works in both contexts — all vizs render in Dashboard Studio AND ad-hoc search. Formatter settings show and apply correctly."

### Failure Pattern

- **Missing appIcon.png** (test24, test26, test27, test28): All 4 sessions hit this — skill gap in vp-create packaging checklist
- **Missing/small preview.png** (test21, test25, test26, test27): R8 rule added after test21 but size check still catching issues
- **B7 default= attrs** (test21 all 6): Pre-v4.0.0 formatter templates used `default=` — fixed in current skills
- **B21 no null guards** (test21 5 vizs): Pre-safeStr/safeNum patterns — fixed in current skills
- **No Splunk testing** (test26, test27, test28): Sessions ended before install step — Render-OK/?

## Checkpoint: Human Verification Required

Task 2 requires human review of the FISR scores before the baseline is formally accepted as the measurement start point.

**File to review:** `.planning/FISR-BASELINE.md`

**Key questions for reviewer:**
1. Does the 3.8% FISR feel accurate given your memory of these test sessions?
2. test28 (Cloudflare) has all formatter + JS checks passing — only appIcon missing. Do you consider this a true Build-OK=N or should the definition be relaxed for structural-only failures?
3. test24 (Apple): 5 vizs render and settings work but structural failures (appIcon, allow_user_selection) mark Build-OK=N. Do the scores seem right?
4. Is test22b's conservative ? scoring (not N) for Build-OK appropriate, or should the 100% FAIL formatter evidence from SESSION-HANDOVER force Build-OK=N?

**Resume signal:** Type "approved" or describe specific corrections.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — FISR-BASELINE.md is a data file, not a UI component.

## Self-Check

- [x] `.planning/FISR-BASELINE.md` exists at correct path
- [x] Contains `# FISR Baseline — Tests 21-28` header
- [x] Contains `**FISR Score:**` line with percentage
- [x] Contains 44 data rows (well above 15-row minimum)
- [x] All test22/22b/22c rows contain "self-reported"
- [x] Every row has Y, N, or ? in Build-OK, Render-OK, Settings-OK columns
- [x] Contains `**Scored:** 2026-05-15`
- [x] Task commit 9dcb885 exists in git log

## Self-Check: PASSED
