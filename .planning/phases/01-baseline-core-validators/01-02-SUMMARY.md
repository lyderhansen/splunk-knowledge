---
phase: 01-baseline-core-validators
plan: "02"
subsystem: splunk-viz-packs/scripts
tags: [validation, ast, acorn, cheerio, shell, integration, tdd]
requirements: [VAL-01, VAL-02]

dependency_graph:
  requires:
    - validate_ast.js (acorn ES5 AST walk + cheerio HTML checks) — from 01-01
  provides:
    - validate_viz.sh enhanced with node capability detection and AST delegation
    - vp-create/validate_viz.sh delegation shim (exec to canonical)
  affects:
    - All future vp-create and vp-viz builds use unified canonical validator

tech_stack:
  added: []
  patterns:
    - Capability detection: command -v node + vendor dir presence check
    - AST delegation: node "$VALIDATE_AST" --html / --js with exit code capture
    - Graceful fallback: WARN message + grep checks when node/vendor unavailable
    - Delegation shim: exec bash "$CANONICAL" "$@" for transparent pass-through

key_files:
  created:
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/test_validate_viz_integration.sh
    - tests/test28_drilldown_tabs/cloudflare_noc/static/appIcon.png
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh
    - plugins/splunk-viz-packs/skills/vp-create/scripts/validate_viz.sh

decisions:
  - "USE_AST=1 requires all three conditions: node in PATH, acorn.js present, validate_ast.js present"
  - "Control count WARN kept outside if/else block — runs regardless of AST mode"
  - "B20/B21/theme grep checks in JS section kept outside AST block (grep, not AST)"
  - "exec bash delegation for shim — process replacement passes stdout, exit codes, args transparently"
  - "test28 appIcon.png created as test fixture fix (pre-existing FAIL in test fixture)"

metrics:
  duration: "12m"
  completed: "2026-05-15T08:35:00Z"
  tasks_completed: 2
  files_created: 2
  files_modified: 2
---

# Phase 01 Plan 02: validate_viz.sh AST Integration + vp-create Shim Summary

**One-liner:** validate_viz.sh wired to validate_ast.js for HTML/JS content checks via node capability detection with grep fallback; vp-create duplicate replaced with 10-line exec delegation shim.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (TDD RED) | Add failing integration tests | 6d2f341 | test_validate_viz_integration.sh, tests/test28/static/appIcon.png |
| 1 (TDD GREEN) | Enhance validate_viz.sh with AST delegation | a703e26 | validate_viz.sh, test_validate_viz_integration.sh (T8 fix) |
| 2 | Replace vp-create duplicate with delegation shim | c29965f | vp-create/validate_viz.sh |

## Verification Results

All plan success criteria met:

- `bash validate_viz.sh tests/test28_drilldown_tabs/cloudflare_noc` exits 0 (AST mode active, no FAIL lines)
- `bash validate_viz.sh tests/test21_patagonia/patagonia_outdoor_ops` exits 1 (FAIL lines: B7, B21 violations)
- validate_ast.js --js on synthetic ES6 fixture produces `FAIL F3: ... at line 5:` with line numbers
- `bash vp-create/validate_viz.sh tests/test28.../cloudflare_noc` exits 0, output identical to canonical
- vp-create/validate_viz.sh is 10 lines (shim, not full copy)
- validate_viz.sh contains `VALIDATE_AST=`, `USE_AST=`, `node "$VALIDATE_AST" --html`, `node "$VALIDATE_AST" --js`
- Structure checks (visualizations.conf, savedsearches.conf.spec, app.conf stanzas, B9, R8) unchanged
- All 15 integration tests pass (test_validate_viz_integration.sh)

## TDD Gate Compliance

- RED gate: commit 6d2f341 — `test(01-02): add failing integration tests for validate_viz.sh AST delegation`
- GREEN gate: commit a703e26 — `feat(01-02): enhance validate_viz.sh with node capability detection and AST delegation`

## Deviations from Plan

**1. [Rule 3 - Blocker] 01-PATTERNS.md and 01-RESEARCH.md not found**
- **Found during:** Task 1 (read_first step)
- **Issue:** Plan references these files but they do not exist in the worktree
- **Fix:** Derived patterns directly from plan action/behavior sections and existing code conventions
- **Impact:** None — all acceptance criteria met

**2. [Rule 1 - Bug] test28 fixture missing static/appIcon.png**
- **Found during:** Task 1 baseline run of validate_viz.sh on test28
- **Issue:** The plan requires test28 to exit 0, but the fixture was missing `static/appIcon.png`, causing a pre-existing FAIL in the structure check
- **Fix:** Created a minimal valid 36x36 PNG (98 bytes) at `tests/test28_drilldown_tabs/cloudflare_noc/static/appIcon.png`
- **Files modified:** `tests/test28_drilldown_tabs/cloudflare_noc/static/appIcon.png` (created)
- **Commit:** 6d2f341

**3. [Rule 1 - Bug] T8 test checked wrong expectation (line numbers for B7, not F3)**
- **Found during:** TDD RED run of test_validate_viz_integration.sh
- **Issue:** T8 tested for "line N:" in FAIL lines from test21, but test21 has only B7 HTML violations (DOM count-based, no line numbers) and no F3 ES6 violations. Line numbers come from acorn only for F3.
- **Fix:** Updated T8 to test validate_ast.js directly with a synthetic JS fixture containing a `const` declaration, which properly triggers F3 with line number output
- **Impact:** Test now correctly validates the line-number feature

## Known Stubs

None. validate_viz.sh integration is fully functional with real delegation to validate_ast.js.

## Threat Flags

None. File paths passed to node subprocess are derived from glob expansion over the app directory argument, not user text input — consistent with T-02-01 and T-02-02 accept dispositions in plan threat model.

## Self-Check: PASSED

- validate_viz.sh modified: FOUND
- validate_viz.sh contains VALIDATE_AST=: FOUND
- validate_viz.sh contains USE_AST=: FOUND
- validate_viz.sh contains node "$VALIDATE_AST" --html: FOUND
- validate_viz.sh contains node "$VALIDATE_AST" --js: FOUND
- vp-create/validate_viz.sh is shim (10 lines): FOUND
- vp-create/validate_viz.sh contains exec bash: FOUND
- test_validate_viz_integration.sh exists: FOUND
- tests/test28/static/appIcon.png exists: FOUND
- commit 6d2f341 exists: FOUND
- commit a703e26 exists: FOUND
- commit c29965f exists: FOUND
