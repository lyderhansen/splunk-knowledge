---
phase: 04-visual-identity-assets
plan: "03"
subsystem: splunk-viz-packs/validation-pipeline
tags: [validate_viz, asset-quality, png, icons, previews, des-02, des-03]
dependency_graph:
  requires:
    - 04-01 (generate_assets.js — produces the correct asset sizes/dimensions this plan enforces)
  provides:
    - validate_viz.sh FAIL A01 (preview.png < 500 bytes)
    - validate_viz.sh FAIL A02 (preview.png dimensions != 300x200)
    - validate_viz.sh FAIL A03 (appIcon.png missing or < 100 bytes)
    - validate_viz.sh FAIL A04 (appIcon.png dimensions != 36x36)
    - test_validate_viz_integration.sh T_ANEW_1 through T_ANEW_5
    - vp-create/SKILL.md step 3b replacing Pillow with generate_assets.js
  affects:
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/test_validate_viz_integration.sh
    - plugins/splunk-viz-packs/skills/vp-create/SKILL.md
tech_stack:
  added:
    - od-based PNG dimension extraction (macOS/Linux safe, no external tools)
  patterns:
    - FAIL code namespace: A-series codes for asset quality checks
    - wc -c threshold enforcement (500B preview, 100B icon)
    - PNG IHDR dimension read via od -An -tx1 -j16/j20 -N4 + printf hex conversion
key_files:
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/test_validate_viz_integration.sh
    - plugins/splunk-viz-packs/skills/vp-create/SKILL.md
    - plugins/splunk-viz-packs/skills/vp-create/scripts/validate_viz.sh (shim restored)
decisions:
  - "FAIL A01/A02 check both size and dimensions — size fires first (< 500B), then dimensions; both can fire independently on same viz"
  - "FAIL A03/A04: size check (< 100B) fires before dimension check, preventing od from running on degenerate 1-byte files"
  - "T_ANEW_2 uses python3 inline to write a real valid PNG at 100x100 to test pure dimension failure"
  - "T_ANEW_4 pads IDAT with non-PNG bytes to get > 100B icon so the dimension check (A04) can fire rather than size check (A03)"
  - "vp-create/SKILL.md line count reduced from 181 to 142 — 39 lines of Pillow code removed"
metrics:
  duration_seconds: 420
  completed_date: "2026-05-15"
  tasks_completed: 2
  files_created: 0
  files_modified: 4
---

# Phase 04 Plan 03: Validation Pipeline + vp-create SKILL Update Summary

**One-liner:** validate_viz.sh upgraded with four A-series FAIL codes for PNG asset quality (size + od-based dimension extraction), plus vp-create SKILL.md Pillow blocks replaced by a single generate_assets.js step.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| T1 | Update validate_viz.sh — add FAIL A01/A02/A03/A04 asset checks | 87d72bc | validate_viz.sh, test_validate_viz_integration.sh (+wave1 prereqs restored) |
| T2 | Update vp-create/SKILL.md — replace Pillow steps with generate_assets.js | e7ce514 | vp-create/SKILL.md |

## Verification Results

### Integration Test Suite: 31/31 PASS

All 22 pre-existing tests continue to pass. New tests T_ANEW_1 through T_ANEW_5 all pass:

```
--- T_ANEW_1: FAIL A01 — solid-color placeholder preview (<500 bytes) ---
  PASS: T_ANEW_1: FAIL A01 raised for solid-color placeholder preview (<500 bytes)
--- T_ANEW_2: FAIL A02 — wrong preview dimensions ---
  PASS: T_ANEW_2: FAIL A02 raised for wrong preview dimensions (100x100, 286 bytes)
--- T_ANEW_3: FAIL A03 — missing appIcon.png ---
  PASS: T_ANEW_3: FAIL A03 raised for missing static/appIcon.png
--- T_ANEW_4: FAIL A04 — wrong appIcon dimensions (1x1 placeholder) ---
  PASS: T_ANEW_4: FAIL A04 raised for wrong appIcon dimensions (1x1)
--- T_ANEW_5: PASS — generate_assets.js produces valid assets (no FAIL A0x) ---
  PASS: T_ANEW_5: no FAIL A0x codes after running generate_assets.js on test28
```

### Spot Check — test25 (known solid-color placeholders)

```
FAIL A01: nps_ring_gauge preview.png solid-color placeholder (68 bytes, need >500)
FAIL A02: nps_ring_gauge preview.png wrong dimensions (1x1, need 300x200)
FAIL A03: appIcon.png too small (68 bytes — likely 1x1 pixel placeholder)
FAIL A04: appIcon.png wrong dimensions (1x1, need 36x36)
```

### FAIL R8 removed
`grep "FAIL R8.*preview" validate_viz.sh` returns empty — old 100-byte threshold gone.

### Pillow removed from vp-create/SKILL.md
`grep -i "Pillow|ImageDraw|ImageFont" vp-create/SKILL.md` returns empty.
generate_assets.js appears 3 times in SKILL.md (step 3b command + 2 checklist entries).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vp-create/scripts/validate_viz.sh was a stale full copy, not the delegation shim**
- **Found during:** Task 1 — integration test T9/T10/T11 revealed the shim was not present
- **Issue:** The worktree's vp-create/scripts/validate_viz.sh was the 170-line pre-phase-1 copy; integration tests T9 (<=12 line check) and T10 (exec bash check) both failed; T11 showed output divergence because the stale copy still used old `FAIL: missing static/appIcon.png` message vs the new `FAIL A03: ...` message from the canonical
- **Fix:** Restored the 10-line delegation shim from base commit 90442f1
- **Files modified:** plugins/splunk-viz-packs/skills/vp-create/scripts/validate_viz.sh
- **Commit:** 87d72bc (included in Task 1 commit)

**2. [Rule 1 - Bug] Wave 1 prerequisites not in worktree branch**
- **Found during:** Task 1 setup — the worktree branch was cut from a pre-wave1 base, missing validate_ast.js, validate_dash.js, check_contrast.js, repair_findings.js, vendor/, generate_assets.js
- **Fix:** Checked out all wave 1 files from base commit 90442f1 (the wave 1 merge point) and committed them
- **Files:** All scripts and vendor directory
- **Commit:** 87d72bc

## Known Stubs

None — all validation codes are fully implemented and exercised by integration tests.

## Threat Surface

No new network endpoints, auth paths, or trust boundaries introduced. The od-based PNG dimension extraction runs on local files only. T-04-08 mitigation verified in place (tr -d ' \n' stripping + 2>/dev/null || echo 0 fallback).

## Self-Check: PASSED

Files modified confirmed to exist:
- plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh — FOUND
- plugins/splunk-viz-packs/skills/vp-viz/scripts/test_validate_viz_integration.sh — FOUND
- plugins/splunk-viz-packs/skills/vp-create/SKILL.md — FOUND

Commits verified:
- 87d72bc — feat(04-03): add FAIL A01-A04 asset checks + extend integration tests
- e7ce514 — feat(04-03): replace Pillow steps 3b/3c with generate_assets.js in vp-create SKILL.md
