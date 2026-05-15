---
phase: 03-repair-loop-light-theme-safety
plan: "02"
subsystem: splunk-viz-packs/validation
tags: [repair-loop, contrast-check, validate-viz-sh, integration-tests, T17-T22]
dependency_graph:
  requires:
    - repair_findings.js (Plan 01 — reads FINDING: NDJSON, applies B10/B9/B7/B5/B20 fixes)
    - check_contrast.js (Plan 03 — WCAG AA contrast checker, FINDING: NDJSON on stderr)
    - validate_ast.js (extended in Plan 01 with FINDING: emission for --html mode)
  provides:
    - validate_viz.sh --repair flag (fix -> rebuild -> re-validate loop, max 3 attempts)
    - validate_viz.sh check_contrast.js wiring (automatic when shared/theme.js exists)
    - validate_viz.sh --html stderr-split (FINDING: lines route to validate_findings.ndjson)
    - test_validate_viz_integration.sh T17-T22 (6 new tests covering Phase 3 integration)
  affects:
    - vp-create/validate_viz.sh shim (exec-delegates, inherits all changes automatically)
tech_stack:
  added: []
  patterns:
    - stderr-split pattern for --html: html_err_$$ temp file, grep '^FINDING:' to FINDINGS_FILE
    - Anti-recursion guard: repair sub-call omits --repair flag (T-03-05)
    - REPAIR_MODE flag parsing: loop over "$@", non-flag arg = APP_DIR
    - Repair loop: node repair_findings.js -> node build_flat.js -> bash "$0" APP_DIR (no --repair)
    - Contrast wiring: check_contrast.js stdout inline, stderr FINDING: to FINDINGS_FILE
key_files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/test_validate_viz_integration.sh
decisions:
  - "T14 updated: test25 now correctly exits 1 due to contrast violations; test asserts no B10/B9 structural failures instead of exit 0"
  - "T19 asserts no FAIL B10 in post-repair validation (not exit 0) — contrast violations persist after repair (report-only by design)"
  - "T22 asserts Contrast Check section appears (not exit 0) — test25 has real light.textDim contrast failures correctly surfaced"
  - "repair loop runs after contrast check section — contrast FINDING: lines write to FINDINGS_FILE but repair_findings.js skips CONTRAST code (not in FIXABLE_CODES)"
metrics:
  duration: ~27 minutes
  completed: "2026-05-15"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 3 Plan 02: validate_viz.sh Integration Glue Summary

Integration wiring that completes Phase 3: validate_viz.sh --html now uses stderr-split so FINDING: lines reach validate_findings.ndjson, --repair flag drives a fix-rebuild-revalidate loop via repair_findings.js and build_flat.js (max 3 attempts), and check_contrast.js runs automatically when shared/theme.js exists.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend validate_viz.sh — stderr split, --repair loop, check_contrast wiring | 70006bd | validate_viz.sh |
| 2 | Extend test_validate_viz_integration.sh with T17-T22 | 62cb9ff | test_validate_viz_integration.sh |

## What Was Built

**Task 1 -- Three changes to validate_viz.sh:**

**CHANGE 1 — --html stderr split:**
The prior code used `OUTPUT=$(node "$VALIDATE_AST" --html "$f" 2>&1)` which merged stderr into stdout and prevented FINDING: lines from reaching validate_findings.ndjson. Replaced with the same stderr-split pattern already used for --cross: `HTML_OUT=$(node "$VALIDATE_AST" --html "$f" 2>/tmp/html_err_$$)` then `grep '^FINDING:' /tmp/html_err_$$ >> "$FINDINGS_FILE"` then `rm -f /tmp/html_err_$$`.

**CHANGE 2 -- --repair flag and loop:**
- Argument parsing: loop over `"$@"`, detect `--repair` to set `REPAIR_MODE=1`, non-flag arg becomes `APP_DIR`.
- Phase 3 capability detection: `REPAIR_FINDINGS="$SCRIPT_DIR/repair_findings.js"` and `CHECK_CONTRAST="$SCRIPT_DIR/check_contrast.js"`.
- Repair loop placed after all validation checks (including contrast) and before final summary block.
- Guard: `TOTAL_FAIL != 0 AND REPAIR_MODE=1 AND HAS_NODE=1 AND repair_findings.js exists`.
- Truncates REPAIR_LOG on entry; loop runs up to MAX_ATTEMPTS=3.
- Per attempt: `node repair_findings.js FINDINGS_FILE APP_DIR REPAIR_LOG ATTEMPT` (break on non-zero), `node build_flat.js APP_DIR` (break on non-zero), truncate FINDINGS_FILE, `bash "$0" "$APP_DIR"` (NO --repair — anti-recursion), capture exit as new TOTAL_FAIL.

**CHANGE 3 -- check_contrast.js wiring:**
- Placed after Dashboard XML section and before repair loop.
- Guard: `HAS_NODE=1 AND CHECK_CONTRAST file exists AND shared/theme.js exists in APP_DIR`.
- `CONTRAST_OUT=$(node "$CHECK_CONTRAST" "$THEME_JS" 2>/tmp/contrast_err_$$)` — stdout printed, FINDING: lines from stderr routed to FINDINGS_FILE, temp file cleaned.
- Non-zero exit sets TOTAL_FAIL=1. If guard fails: `SKIP: shared/theme.js not found or Node.js unavailable`.

**Task 2 -- T17-T22 integration tests:**

All 6 new tests use the TEST25 and TEST28 path variables already defined in the script. T18 and T19 work on temporary copies of test28 (via `mktemp -d`) to avoid modifying the fixture.

- T17: grep validates --repair flag present in validate_viz.sh
- T18: --repair on temp copy of test28; assert validate_repair_log.ndjson alongside app dir
- T19: --repair on temp copy of test28; re-run without --repair; assert 0 FAIL B10 lines (all repaired in attempt 1); assert repair log has content
- T20: grep validates check_contrast referenced in validate_viz.sh
- T21: validate_viz.sh on test28; assert "Contrast Check" section header in output
- T22: validate_viz.sh on test25; assert "Contrast Check" section header in output

## Verification Results

```
Integration suite:
  Results: 26 passed, 0 failed
  ALL INTEGRATION TESTS PASSED

Unit suites (no regression):
  validate_ast.js:    54 passed, 0 failed
  validate_dash.js:   46 passed, 0 failed
  repair_findings.js: 28 passed, 0 failed
  check_contrast.js:  19 passed, 0 failed
```

Manual smoke test result: `bash validate_viz.sh --repair tests/test28_drilldown_tabs/cloudflare_noc` — attempt 1 applies 166 repairs, rebuilds 5 vizs, re-validates. Dashboard XML exits 0. Only remaining failures are FAIL CONTRAST (light.textDim/bg 4.31:1) and WARN CONTRAST lines — correct behavior since contrast is report-only. validate_repair_log.ndjson created alongside app dir.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] T14 expectation updated: test25 now exits 1 due to contrast violations**

- **Found during:** Task 1 (when running T1-T16 after wiring check_contrast.js)
- **Issue:** T14 asserted `validate_viz.sh on test25 exits 0`. After wiring check_contrast.js, test25's real light.textDim contrast failures (4.32:1, needs 4.5:1) correctly cause validate_viz.sh to exit 1. The prior test expectation was now wrong.
- **Fix:** T14 updated to assert no B10/B9 structural failures (the true intent: test25 has a clean namespaced dashboard). Comment added explaining Phase 3 behavior change.
- **Files modified:** test_validate_viz_integration.sh

**2. [Rule 1 - Bug] T19 strategy adjusted: grep all-output for B10 was wrong**

- **Found during:** Task 2 (first T19 run)
- **Issue:** Initial T19 grep'd all output from `--repair` run for `FAIL B10` lines and found 166 (from the initial pre-repair validation output in the combined run). The repair loop embeds all prior output, so scanning the combined output finds the original violations.
- **Fix:** T19 now runs `--repair` first (discarding output), then re-runs validate_viz.sh WITHOUT --repair on the modified copy to get a clean final-state report. FINAL_B10 from that clean run = 0 (repair worked). This correctly validates the repair contract.
- **Files modified:** test_validate_viz_integration.sh

**3. [Rule 1 - Bug] T22 expectation adjusted: test25 has real contrast failures**

- **Found during:** Task 2 (wave1_context pre-warned about this)
- **Issue:** The plan's original T22 description said "assert exit 0 AND output contains 'Contrast Check' with no FAIL CONTRAST lines". Both conditions are wrong: test25 exits 1 and does have FAIL CONTRAST.
- **Fix:** T22 asserts only that the "Contrast Check" section header appears in output, proving check_contrast.js was called. The contrast failures are correct behavior — the tool found real issues. Per wave1_context guidance.
- **Files modified:** test_validate_viz_integration.sh

## Known Stubs

None — validate_viz.sh changes are fully wired. The contrast violations in test28 and test25 are real findings reported correctly by the tool.

## Threat Flags

None — validate_viz.sh repair sub-call enforces the anti-recursion guard (bash "$0" "$APP_DIR" with no --repair). Temp files use PID-namespaced /tmp paths and are cleaned after each use. MAX_ATTEMPTS=3 hard limit prevents infinite loops.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| validate_viz.sh | FOUND |
| test_validate_viz_integration.sh | FOUND |
| 03-02-SUMMARY.md | FOUND |
| commit 70006bd | FOUND |
| commit 62cb9ff | FOUND |
