---
phase: 03-repair-loop-light-theme-safety
plan: "01"
subsystem: splunk-viz-packs/validation
tags: [repair-loop, validate-ast, NDJSON, B5, B7, B20, B10, B9, cheerio, ES5]
dependency_graph:
  requires: []
  provides:
    - validate_ast.js --html FINDING: NDJSON stderr emission for B5/B7/B20
    - repair_findings.js auto-repair for B10/B9/B5/B7/B20 violations
    - test_repair_findings.js unit test suite (28 tests)
  affects:
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh (repair loop consumer)
tech_stack:
  added: []
  patterns:
    - FINDING: NDJSON stderr emission (extended from --cross mode to --html mode)
    - Group-by-file repair: load once, apply all fixes, write once
    - CDATA extract/reinject for dashboard XML mutations
    - Cheerio fragment mode for formatter HTML mutations
    - Path traversal guard using path.resolve + indexOf
key_files:
  created:
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/repair_findings.js
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/test_repair_findings.js
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_ast.js
decisions:
  - B5 section-label violation excluded from FINDING: emission -- not auto-fixable (confirmed per D-01/D-02 in 03-CONTEXT.md)
  - repair_findings.js exits 0 on missing findings file -- allows repair loop to run safely when no prior run exists
  - Group-by-file strategy: all findings for a file are applied in one read/write cycle to avoid overwrite conflicts
metrics:
  duration: 25 minutes
  completed: "2026-05-15"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 3 Plan 01: FINDING: Emission and repair_findings.js Summary

FINDING: NDJSON emission added to validate_ast.js --html for B5/B7/B20, plus new repair_findings.js that reads those findings and applies mechanical fixes to source files in a single grouped pass.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend validate_ast.js --html to emit FINDING: NDJSON | 17c2a3a | validate_ast.js |
| 2 | Create repair_findings.js and test_repair_findings.js | d6adf89 | repair_findings.js, test_repair_findings.js |

## What Was Built

**Task 1 -- validate_ast.js FINDING: emission:**

The `runHtmlChecks()` function previously accumulated violations[] and only printed to stdout at end. No FINDING: NDJSON lines were written to stderr for B5/B7/B20 violations. This meant the repair loop (which reads NDJSON from stderr) could never fix formatter HTML issues.

Added three `process.stderr.write('FINDING:...')` calls immediately after each violation push:
- After B7 (default= attrs): `FINDING:{"type":"FAIL","code":"B7","file":"...","context":{"count":N}}`
- After B5 (color picker missing type=custom): `FINDING:{"type":"FAIL","code":"B5","file":"...","context":{"count":N}}`
- After B20 (themeMode no auto option): `FINDING:{"type":"FAIL","code":"B20","file":"...","context":{}}`
- B5 section-label is excluded -- report-only, not auto-fixable

Pattern copied exactly from the existing `--cross` mode block (lines 344-352) and `validate_dash.js emitFail()`.

**Task 2 -- repair_findings.js:**

New file that closes the repair loop for formatter HTML violations. Reads FINDING: NDJSON lines from a findings file, groups findings by resolved file path, then processes each file once (load/fix/write):

- XML files (.xml): extracts CDATA JSON, applies B10/B9 mutations, reinjects
  - B10: `viz.options[vizType + '.' + bareKey] = viz.options[bareKey]; delete viz.options[bareKey]`
  - B9: `viz.type = vizType.replace(/^custom\./, '')`
- HTML files (.html): cheerio.load(html, null, false) fragment mode, applies B5/B7/B20 mutations
  - B7: `$('[default]').each` -- copy val, removeAttr('default'), attr('value', val)
  - B5: `$('splunk-color-picker').each` -- if type !== 'custom', set type='custom'
  - B20: `$('[name*=themeMode]').each` -- if no option[value=auto], prepend auto option

Security: path traversal guard ensures only files within appDir are written.

**Task 2 -- test_repair_findings.js:**

28-test suite using synthetic fixtures covering all 5 fixable codes plus error cases:
- B10: two findings for same file -- both fixed in one write cycle
- B9: custom. prefix stripped from viz type
- B7: default= renamed to value= in HTML
- B5: type=custom added to color picker
- B20: auto option prepended to themeMode radio
- CLI: no args exits 2, 3 args exits 2, missing findings file exits 0
- Path traversal: finding with file outside appDir is silently skipped
- Malformed NDJSON: invalid lines skipped, valid findings still applied

## Verification Results

- node test_validate_ast.js: 54/54 pass (no regression)
- node test_repair_findings.js: 28/28 pass (all repair cases covered)
- Manual inline test: B7+B20 FINDING: lines confirmed in stderr output

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None -- all fixes are wired end-to-end. The repair_findings.js script is functional for all 5 codes.

## TDD Gate Compliance

Both tasks had tdd="true". The RED gate was confirmed by running the inline verification test before implementation (stderr had no FINDING: lines). GREEN gate confirmed by running tests after implementation. No REFACTOR gate needed -- code was clean on first pass.

Commits:
- test phase (RED confirmed by inline verification before coding)
- 17c2a3a -- feat: validate_ast.js FINDING: emission (GREEN)
- d6adf89 -- feat: repair_findings.js + test suite (GREEN)

## Self-Check: PASSED

| Item | Status |
|------|--------|
| validate_ast.js | FOUND |
| repair_findings.js | FOUND |
| test_repair_findings.js | FOUND |
| 03-01-SUMMARY.md | FOUND |
| commit 17c2a3a | FOUND |
| commit d6adf89 | FOUND |
