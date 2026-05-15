---
phase: 02-schema-cross-file-validation
plan: "02"
subsystem: validate_ast
tags: [tdd, validation, cross-file, ast, dom, cheerio, acorn, es5]
dependency_graph:
  requires:
    - "01-01: validate_ast.js baseline (--js and --html modes)"
    - "acorn vendor install (ACORN_PATH)"
    - "cheerio vendor install (CHEERIO_PATH)"
    - "test28_drilldown_tabs/cloudflare_noc/cf_kpi_tile fixture pair"
  provides:
    - "validate_ast.js --cross mode: runCrossFileChecks(formatterPath, jsPath)"
    - "FAIL XFILE: orphaned formatter option detection"
    - "WARN XFILE: undeclared JS opt() read detection"
    - "FINDING:{json} NDJSON to stderr for Phase 3 repair loop input"
  affects:
    - "02-03: validate_viz.sh integration of --cross mode (consumes FINDING: stderr)"
tech_stack:
  added: []
  patterns:
    - "acorn AST walk via recursive Object.keys(node) — identical pattern to existing walk() in runJsChecks"
    - "cheerio $('[name]') DOM scan + lastIndexOf('.') suffix extraction"
    - "NDJSON FINDING:{json} on stderr for structured downstream consumption"
key_files:
  created: []
  modified:
    - "plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_ast.js"
    - "plugins/splunk-viz-packs/skills/vp-viz/scripts/test_validate_ast.js"
decisions:
  - "WARN XFILE uses stdout violations array (not FINDING stderr) — only FAIL XFILE emits FINDING per D-06, satisfying plan spec"
  - "walkForOptCalls() implemented as named inner function (same recursive pattern as existing walk()) for consistency"
  - "File existence guards split by mode: --cross checks both args[1] and args[2]; --js/--html check single filePath"
metrics:
  duration_minutes: 12
  completed_date: "2026-05-15"
  tasks_completed: 2
  tasks_total: 2
  files_created: 0
  files_modified: 2
---

# Phase 02 Plan 02: Cross-File Option Name Consistency Summary

**One-liner:** `--cross` mode added to validate_ast.js using cheerio DOM + acorn AST walk to diff formatter `name=` keys against JS `opt()` calls, emitting FAIL XFILE with FINDING:{json} to stderr for Phase 3 consumption.

## What Was Built

Extended `validate_ast.js` with a third CLI mode `--cross <formatter.html> <visualization_source.js>` that performs cross-file option name consistency checks between a Splunk custom viz formatter and its visualization source.

### runCrossFileChecks() implementation

- **Formatter key extraction:** cheerio `$('[name]')` scan + `lastIndexOf('.')` suffix extraction — handles `{{VIZ_NAMESPACE}}.keyName` template form
- **JS key extraction:** acorn AST `walkForOptCalls()` — detects `CallExpression` where `callee.name === 'opt'` and first argument is a `Literal`
- **FAIL XFILE:** formatter key not found in JS `opt()` calls → stdout violation + `FINDING:{json}` to stderr (type, code, file, key, message)
- **WARN XFILE:** JS `opt()` call key not declared in formatter → stdout violation only (no FINDING per D-06)
- **Exit 1** when violations array is non-empty; **exit 0** on clean

### Guard additions

- `args.length < 2` usage guard updated to include `--cross` in the usage text
- Mode guard extended: `mode !== '--cross'` added to the unknown-mode check
- New `--cross` specific arg-count guard: exits 2 if fewer than 3 total args
- File existence split by mode: `--cross` checks both formatter and JS paths

### TDD gate compliance

RED commit `0181778` (test-only) precedes GREEN commit `6b89a13` (implementation).

**Test coverage added (20 new tests, total 54/54 passing):**

| Test category | Tests |
|---------------|-------|
| --cross CLI arg errors (usage, missing files) | 6 |
| --cross clean test28 cf_kpi_tile fixture pair | 2 |
| --cross synthetic matched pair (exits 0) | 1 |
| --cross orphaned formatter option (FAIL XFILE) | 3 |
| --cross FINDING:{json} stderr verification | 2 |
| --cross extra JS read (WARN XFILE) | 3 |
| --cross partial match (one orphaned key) | 3 |

## Deviations from Plan

None — plan executed exactly as written.

## TDD Gate Compliance

- RED gate: `test(02-02)` commit `0181778` — 34 existing tests pass, 14 new cross-file tests fail
- GREEN gate: `feat(02-02)` commit `6b89a13` — all 54 tests pass (34 existing + 20 new)
- REFACTOR: not required — implementation was clean on first pass

## Self-Check

**Files exist:**
- plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_ast.js — FOUND (modified)
- plugins/splunk-viz-packs/skills/vp-viz/scripts/test_validate_ast.js — FOUND (modified)

**Commits exist:**
- 0181778 — FOUND (test RED commit)
- 6b89a13 — FOUND (feat GREEN commit)

**Test suite:** 54/54 PASSED

**ES5 compliance:** grep for `const |let |=>` returns only a comment (line 14) — no code violations.

## Self-Check: PASSED
