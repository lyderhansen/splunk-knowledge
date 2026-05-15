---
phase: 02-schema-cross-file-validation
plan: "01"
subsystem: validation
tags: [tdd, ajv, dashboard-studio, schema-validation, b9, b10]
dependency_graph:
  requires: []
  provides: [validate_dash.js, ajv-vendor]
  affects: [vp-viz skill, validate_viz.sh integration]
tech_stack:
  added: [ajv@8.20.0, fast-deep-equal, fast-uri, json-schema-traverse, require-from-string]
  patterns: [TDD RED/GREEN, vendored dependencies, NDJSON structured output, dual-channel output]
key_files:
  created:
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_dash.js
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/test_validate_dash.js
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/vendor/node_modules/ajv/
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/vendor/node_modules/fast-deep-equal/
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/vendor/node_modules/fast-uri/
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/vendor/node_modules/json-schema-traverse/
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/vendor/node_modules/require-from-string/
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/vendor/package.json
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/vendor/package-lock.json
decisions:
  - "Used vendor/ require() pattern (same as acorn/cheerio) -- no network at runtime"
  - "B9 check skips custom. prefix detection for splunk.* and input.* built-in types"
  - "B10 checks viz.options{} keys only, not Object.keys(viz) -- per RESEARCH.md Pitfall 3"
  - "Dangling data source references emit FAIL B9 (reusing existing code) not a new B9-DS code"
  - "NDJSON FINDING: lines emitted inline (per violation) rather than batched at end"
metrics:
  duration: "~8 minutes"
  completed: "2026-05-15"
  tasks: 3
  files: 7 created, 2 modified
---

# Phase 02 Plan 01: validate_dash.js Dashboard Studio JSON Validator Summary

**One-liner:** ajv@8.20.0 vendored into scripts/vendor/ and validate_dash.js created with TDD — catches B9 custom. prefix format errors, B10 bare option keys, and dangling data source refs, with dual-channel FAIL/NDJSON output.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | TDD RED: Failing test suite | a37709c | test_validate_dash.js |
| 2 | Prereq: Install ajv@8.20.0 into vendor/ | 3b5dfdf | vendor/node_modules/ajv/ + 4 deps |
| 3 | TDD GREEN: Implement validate_dash.js | ca4acc4 | validate_dash.js |

## TDD Gate Compliance

- RED gate: `test(02-01): add failing test suite for validate_dash.js` — commit a37709c
- GREEN gate: `feat(02-01): implement validate_dash.js -- ajv schema + B9/B10/dataSource checks` — commit ca4acc4
- No REFACTOR phase needed (implementation was clean on first pass)

All 41 tests pass. Exit code 0.

## Verification Results

1. Unit tests: `node test_validate_dash.js` -- exits 0 (41/41 passed)
2. Clean dashboard (test25): exits 0, no FAIL lines
3. Dirty dashboard (test28): exits 1, FAIL B10 lines emitted
4. NDJSON check: FINDING: lines parse as valid JSON with file/vizId/code/message fields
5. ES5 check: 0 occurrences of const/let/arrow/template literals in validate_dash.js

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None -- validate_dash.js is fully functional with real checks against real test fixtures.

## Threat Surface Scan

No new network endpoints, auth paths, or trust boundary changes introduced. validate_dash.js reads files from CLI args (same pattern as validate_ast.js). T-02-01-04 mitigation applied: JSON.parse wrapped in try/catch, exits 1 on error (never eval).

## Self-Check

Verified created files exist:
- validate_dash.js -- FOUND
- test_validate_dash.js -- FOUND
- vendor/node_modules/ajv/dist/ajv.js -- FOUND

Verified commits exist:
- a37709c -- test(02-01) RED phase
- 3b5dfdf -- chore(02-01) vendor install
- ca4acc4 -- feat(02-01) GREEN phase

## Self-Check: PASSED
