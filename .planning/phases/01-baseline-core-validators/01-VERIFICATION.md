---
phase: 01-baseline-core-validators
verified: 2026-05-15T10:00:00Z
status: human_needed
score: 4/4 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Review Render-OK and Settings-OK scores in .planning/FISR-BASELINE.md for tests 21-28"
    expected: "Scores accurately reflect actual Splunk install and render outcomes from memory of each test session"
    why_human: "Render-OK and Settings-OK are scored from handover notes, not from automation. The human review section in FISR-BASELINE.md acknowledges the notes were incomplete. The reviewer indicated most vizs were installed and tested but the handover docs did not capture all testing. A human must confirm whether the scores are accurate enough to serve as a measurement baseline, or correct specific rows."
---

# Phase 01: Baseline & Core Validators Verification Report

**Phase Goal:** Validators catch real bugs deterministically, and a FISR baseline exists to measure all future improvements
**Verified:** 2026-05-15T10:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Running validate_viz.sh on a viz pack performs acorn AST parsing in ES5 mode and reports ES6+ violations with line numbers | VERIFIED | `validate_ast.js --js` with synthetic `const foo = 2;` produced `  FAIL F3: const declaration at line 2: const foo = 2;` and exited 1. `validate_viz.sh` wires `node "$VALIDATE_AST" --js` per lines 110-111. |
| 2 | Running validate_viz.sh on a viz pack performs cheerio DOM parsing on formatter.html and reports structural HTML issues | VERIFIED | `validate_ast.js --html` handles B5/B7/B10/B20 checks. `validate_viz.sh` wires `node "$VALIDATE_AST" --html` per lines 40-41. Both run clean (exit 0) against test28 cf_kpi_tile formatter. |
| 3 | A documented FISR score exists for tests 21-28 stored in .planning/ | VERIFIED | `.planning/FISR-BASELINE.md` exists with 44 data rows, `**FISR Score:** 1 / 26 vizs passing = **3.8%**`, and a Human Review section dated 2026-05-15 showing the reviewer acknowledged scoring limitations. |
| 4 | Existing grep-based checks continue to pass — no regression in current detection | VERIFIED | `validate_viz.sh` run on test28 cloudflare_noc exits 0 with `ALL CHECKS PASSED`. Structure checks (visualizations.conf, savedsearches.conf.spec, app.conf stanzas, B9, R8) confirmed present at lines 158-205. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_ast.js` | AST (acorn) + DOM (cheerio) validation with FAIL/WARN output | VERIFIED | Exists, 250+ lines, pure ES5 CJS (0 arrow functions, 0 template literals, 0 const/let as JS keywords), F3/B5/B7/B10/B20 all implemented |
| `plugins/splunk-viz-packs/skills/vp-viz/scripts/vendor/node_modules/acorn/dist/acorn.js` | Bundled acorn 8.16.0 CJS | VERIFIED | Exists, `typeof parse === 'function'` confirmed, git-tracked |
| `plugins/splunk-viz-packs/skills/vp-viz/scripts/vendor/node_modules/cheerio` | Bundled cheerio 1.2.0 with CJS conditional export | VERIFIED | Exists, `typeof load === 'function'` confirmed |
| `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh` | Enhanced entry-point with node capability detection and AST delegation | VERIFIED | 205 lines, contains `VALIDATE_AST=`, `USE_AST=`, `node "$VALIDATE_AST" --html`, `node "$VALIDATE_AST" --js` |
| `plugins/splunk-viz-packs/skills/vp-create/scripts/validate_viz.sh` | Delegation shim to canonical vp-viz copy | VERIFIED | 10 lines, contains `exec bash "$CANONICAL" "$@"` and correct relative path `../../vp-viz/scripts/validate_viz.sh` |
| `.planning/FISR-BASELINE.md` | Per-viz FISR scoring table for tests 21-28 with overall FISR percentage | VERIFIED | Exists, 121 lines, 44 data rows (well above 15-row minimum), all test22/22b/22c rows contain "self-reported", every row has Y/N/? in all three scoring columns |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `validate_ast.js` | `vendor/node_modules/acorn/dist/acorn.js` | `path.join(__dirname, 'vendor', 'node_modules', 'acorn', 'dist', 'acorn.js')` | WIRED | Line 24 defines ACORN_PATH, line 63 requires it. Runtime confirms `acorn OK`. |
| `validate_ast.js` | `vendor/node_modules/cheerio` | `path.join(__dirname, 'vendor', 'node_modules', 'cheerio')` | WIRED | Line 25 defines CHEERIO_PATH, line 167 requires it. Runtime confirms `cheerio OK`. |
| `validate_viz.sh (formatter loop)` | `validate_ast.js --html` | `node "$VALIDATE_AST" --html "$f"` | WIRED | Lines 40-41 in validate_viz.sh; exit code captured; end-to-end test exits 0. |
| `validate_viz.sh (JS loop)` | `validate_ast.js --js` | `node "$VALIDATE_AST" --js "$f"` | WIRED | Lines 110-111 in validate_viz.sh; exit code captured; end-to-end test exits 0. |
| `vp-create/scripts/validate_viz.sh` | `vp-viz/scripts/validate_viz.sh` | `exec bash "$CANONICAL" "$@"` | WIRED | Last line of shim. Output of both runs on test28 cloudflare_noc is byte-for-byte identical; both exit 0. |

### Data-Flow Trace (Level 4)

Not applicable — all artifacts are CLI tools (validators) that read file paths from argv and write to stdout. No dynamic data rendering path to trace.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Clean ES5 exits 0 | `node validate_ast.js --js cf_kpi_tile/src/visualization_source.js` | (no output), exit 0 | PASS |
| Clean formatter exits 0 | `node validate_ast.js --html cf_kpi_tile/formatter.html` | (no output), exit 0 | PASS |
| ES6 violation detected with line number | `node validate_ast.js --js /tmp/test_es6_violation.js` (file contains `const foo = 2;`) | `  FAIL F3: const declaration at line 2: const foo = 2;`, exit 1 | PASS |
| End-to-end via canonical | `bash vp-viz/scripts/validate_viz.sh tests/test28.../cloudflare_noc` | `ALL CHECKS PASSED`, exit 0 | PASS |
| End-to-end via delegation shim | `bash vp-create/scripts/validate_viz.sh tests/test28.../cloudflare_noc` | `ALL CHECKS PASSED`, exit 0 (output identical to canonical) | PASS |
| No-args exits 2 with usage | `node validate_ast.js` (no args) | usage printed to stderr, exit 2 | PASS |
| Vendor deps load without network | `node -e "require('.../acorn/dist/acorn.js').parse"` | `acorn OK` | PASS |
| Vendor cheerio loads | `node -e "require('.../cheerio').load"` | `cheerio OK` | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| VAL-01 | 01-01, 01-02 | validate_viz.sh uses acorn AST parsing in ES5 mode to enforce pure ES5 compliance | SATISFIED | validate_ast.js implements acorn walk detecting const/let/arrow/class/template/destructuring with line numbers; wired into validate_viz.sh via capability detection |
| VAL-02 | 01-01, 01-02 | validate_viz.sh uses cheerio DOM parsing for formatter.html — catches structural HTML bugs | SATISFIED | validate_ast.js implements B5/B7/B10/B20 cheerio checks; wired into validate_viz.sh formatter loop |
| SKL-03 | 01-03 | FISR baseline — retroactively score First-Install Success Rate for tests 21-28 | SATISFIED | `.planning/FISR-BASELINE.md` exists with per-viz table, 3.8% FISR score, and human review section |

No orphaned requirements. REQUIREMENTS.md maps exactly VAL-01, VAL-02, SKL-03 to Phase 1 — all three are covered.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | — | — | — |

No TODOs, FIXMEs, placeholder comments, empty return values, or hardcoded stub data found in `validate_ast.js`, `validate_viz.sh`, or `vp-create/scripts/validate_viz.sh`.

Note: `validate_ast.js` line 112 contains the string `'const'` and `'let'` — these are JavaScript string values being checked, not ES6 declarations. Not a stub.

### Human Verification Required

#### 1. FISR Render-OK / Settings-OK Score Accuracy

**Test:** Open `.planning/FISR-BASELINE.md` and review the per-viz table. For each test session you remember deploying to Splunk, verify whether Render-OK and Settings-OK values match your actual memory of outcomes.

**Expected:** Scores are accurate enough to serve as a measurement start point for comparing future improvement.

**Why human:** Render-OK and Settings-OK cannot be verified programmatically — they depend on whether a viz actually rendered data in Splunk and whether the formatter settings panel applied correctly. The FISR-BASELINE.md already contains a Human Review section (lines 105-121) acknowledging that the reviewer corrected the automated scoring: "All vizs were installed and tested in Splunk" but "handover docs did not capture all testing that occurred." This means the current scores (mostly `?` for Render-OK and Settings-OK on test24-test28) may understate actual Render-OK performance. The reviewer's conclusion was "the baseline is approximate" and "a fresh end-to-end test after Phase 1 validators are complete will provide accurate numbers." Human must confirm: (1) is the 3.8% baseline accepted as the measurement start point despite scoring uncertainty, or (2) do specific rows need correction before acceptance?

### Gaps Summary

No gaps. All four roadmap success criteria are verified by codebase evidence and behavioral spot-checks. The only open item is human acceptance of the FISR Render-OK/Settings-OK scores — the baseline document exists, has the required structure, and was already reviewed once (2026-05-15), but the plan specified a blocking human checkpoint (plan 01-03, Task 2) requiring "approved" or specific corrections.

---

_Verified: 2026-05-15T10:00:00Z_
_Verifier: Claude (gsd-verifier)_
