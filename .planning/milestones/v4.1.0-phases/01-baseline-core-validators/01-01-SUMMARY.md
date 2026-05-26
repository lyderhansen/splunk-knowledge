---
phase: 01-baseline-core-validators
plan: "01"
subsystem: splunk-viz-packs/scripts
tags: [validation, ast, acorn, cheerio, es5, tdd]
requirements: [VAL-01, VAL-02]

dependency_graph:
  requires: []
  provides:
    - validate_ast.js (acorn ES5 AST walk + cheerio HTML checks, FAIL F3/B5/B7/B10/B20)
    - vendor/node_modules/acorn@8.16.0 (CJS, committed)
    - vendor/node_modules/cheerio@1.2.0 (CJS conditional export, committed)
  affects:
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh (future integration point)

tech_stack:
  added:
    - acorn 8.16.0 (vendored CJS AST parser)
    - cheerio 1.2.0 (vendored CJS HTML/DOM parser)
  patterns:
    - vendor/ directory committed to git with .gitignore negation rules
    - Pure ES5 CJS script (shebang, var declarations, require(), process.argv/exit)
    - TDD: RED (test_validate_ast.js) → GREEN (validate_ast.js) commit sequence

key_files:
  created:
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_ast.js
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/test_validate_ast.js
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/vendor/ (acorn + cheerio + deps, 1226 files)
  modified:
    - .gitignore (added negation lines for vendor/ after node_modules/ rule)

decisions:
  - "vendored libs in scripts/vendor/node_modules/ committed to git — zero npm install at runtime"
  - "validate_ast.js written in pure ES5 CJS to match build_flat.js project convention"
  - "cheerio.load(html, null, false) for fragment mode — avoids html/head/body wrapper injection"
  - "acorn ecmaVersion: 2020 to parse ES6+ code and detect violations (not reject it)"

metrics:
  duration: "4m"
  completed: "2026-05-15T07:55:17Z"
  tasks_completed: 2
  files_created: 3
  files_modified: 1
---

# Phase 01 Plan 01: Vendor Install + validate_ast.js (acorn+cheerio) Summary

**One-liner:** validate_ast.js with acorn 8.16.0 AST walk (FAIL F3 ES6 violations with line numbers) and cheerio 1.2.0 DOM checks (FAIL B5/B7/B10/B20) — vendored, zero npm install needed.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install vendor dependencies + fix .gitignore | 83f13f9 | vendor/ (1226 files), .gitignore |
| 2 (TDD RED) | Write failing test suite | 50a78ec | test_validate_ast.js |
| 2 (TDD GREEN) | Implement validate_ast.js | 799cc35 | validate_ast.js |

## Verification Results

All plan success criteria met:

- `node validate_ast.js --js tests/test28.../cf_kpi_tile/src/visualization_source.js` → exit 0, no FAIL output
- `node validate_ast.js --html tests/test28.../cf_kpi_tile/formatter.html` → exit 0, no FAIL output
- `node validate_ast.js` (no args) → exit 2, usage to stderr
- 34/34 TDD tests pass
- validate_ast.js contains zero `const`/`let`/arrow/template/`import` — pure ES5 CJS verified
- FAIL lines begin with exactly two spaces (`  FAIL `)
- FAIL F3 lines include line numbers (`  FAIL F3: ... at line N:`)
- acorn and cheerio require() both resolve without network access

## TDD Gate Compliance

- RED gate: commit 50a78ec — `test(01-01): add failing test suite for validate_ast.js`
- GREEN gate: commit 799cc35 — `feat(01-01): implement validate_ast.js — acorn ES5 AST walk + cheerio HTML checks`

## Deviations from Plan

**1. [Rule 3 - Blocker] 01-RESEARCH.md and 01-PATTERNS.md not found**
- **Found during:** Task 2 (read_first step)
- **Issue:** The plan references `.planning/phases/01-baseline-core-validators/01-RESEARCH.md` and `01-PATTERNS.md` but these files do not exist in the worktree
- **Fix:** Derived the implementation patterns directly from the existing codebase: `build_flat.js` (ES5 CJS conventions), `validate_viz.sh` (FAIL/WARN format), and the test28 fixtures (known-good reference inputs)
- **Impact:** None — all acceptance criteria met

No other deviations. Plan executed within scope.

## Known Stubs

None. validate_ast.js is fully functional: all five check types (F3, B5, B7, B10, B20) are implemented and verified.

## Threat Flags

None. validate_ast.js reads file paths from process.argv within a controlled build-script context. No new network surfaces or trust boundaries introduced (matches T-01-01 and T-01-02 dispositions in plan threat model).

## Self-Check: PASSED

- validate_ast.js exists: FOUND
- test_validate_ast.js exists: FOUND
- vendor/node_modules/acorn/dist/acorn.js exists: FOUND
- vendor/node_modules/cheerio/dist/commonjs/index.js exists: FOUND
- commit 83f13f9 exists: FOUND
- commit 50a78ec exists: FOUND
- commit 799cc35 exists: FOUND
