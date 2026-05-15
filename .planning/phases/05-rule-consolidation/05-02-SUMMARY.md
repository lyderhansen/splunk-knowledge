---
phase: 05-rule-consolidation
plan: 02
subsystem: splunk-viz-packs/vp-debug + vp-viz
tags: [skill-refactor, diagnostic-reference, content-migration, broken-rules]
dependency_graph:
  requires:
    - plugins/splunk-viz-packs/skills/vp-viz/references/canvas-recipes.md (from plan 05-01, must exist before Task 1)
  provides:
    - plugins/splunk-viz-packs/skills/vp-debug/references/broken-rules.md (compact diagnostic table, under 500 lines)
    - plugins/splunk-viz-packs/skills/vp-viz/references/canvas-recipes.md (extended with B1/B2/B14/B19 code patterns)
  affects:
    - Any skill that references broken-rules.md for B-series rule explanations
tech_stack:
  added: []
  patterns:
    - Diagnostic table pattern: symptom-to-FAIL-code lookup with Fix column in imperative form
    - Reference linking: non-auto-fixable rules link to canvas-recipes.md or formatter-patterns.md instead of duplicating code
key_files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-debug/references/broken-rules.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/canvas-recipes.md
decisions:
  - "B2 (HiDPI) appended to canvas-recipes.md even though plan only required B1/B14/B19 — it was also missing and referenced in broken-rules.md table as 'No → canvas-recipes.md'"
  - "D-01 note omitted from B1 and B19 Fix cells — these are not auto-fixable rules; the note belongs only on B5/B7/B9/B10/B20"
  - "B4 code section retained in broken-rules.md Section 3 as required — not in canvas-recipes.md since it describes updateView/formatData timing architecture, not a canvas primitive"
metrics:
  duration_minutes: ~20
  tasks_completed: 2
  files_created: 0
  files_modified: 2
  completed_date: "2026-05-15"
---

# Phase 05 Plan 02: broken-rules.md Restructure Summary

Rewrote the 751-line prose-per-rule broken-rules.md into a 128-line diagnostic table plus focused code sections. Extended canvas-recipes.md with B1 (font loading), B2 (HiDPI), B14 (variable scope), and B19 (date parsing) code patterns that had no other home.

## What Was Built

**Task 1 — Append B1/B2/B14/B19 code patterns to canvas-recipes.md**

canvas-recipes.md grew from 1084 to 1200 lines with four new sections appended after the existing content:

- **Font loading (B1):** `loadFont()` helper with `document.fonts.load()` poll — explains why `document.fonts.ready` is wrong, and gives the `onReady` callback integration point.
- **HiDPI canvas scaling (B2):** `setupHiDPI()` function with `devicePixelRatio`, proper `canvas.width/height` vs `style.width/height` separation. Not in plan's required list but missing and referenced in the table.
- **Variable scope in sub-methods (B14):** Full `_draw` → `_drawCenter` pattern showing wrong (local `var gi`) vs correct (`this._gi`) with `delete this._gi` cleanup note.
- **Date parsing for sandboxed iframes (B19):** `parseTimestamp()` regex alternative with `MONTHS` array, explaining the `about:srcdoc` / origin `null` cause.

broken-rules.md was NOT modified during Task 1 (threat model T-05-04 compliance).

**Task 2 — Rewrite broken-rules.md as diagnostic table**

broken-rules.md: 751 lines → 128 lines. Structure:

- **Section 1 (4 lines):** Header + purpose description
- **Section 2 (26 lines):** Summary table covering all 23 B-series rules with symptom, FAIL code, cause, fix, auto-fixed columns
- **Section 3 (~100 lines):** Code reference sections for B1, B4, B14, B19

Auto-fixable rules (B5/B7/B9/B10/B20) carry the D-01 note in the Fix cell: "auto-fixed — but first-try correct code skips repair overhead". Their Auto-fixed column reads "Yes (repair_findings.js)".

Non-auto-fixable rules with canvas code reference as "No → [canvas-recipes.md](...)"; B3 references formatter-patterns.md.

## Verification Results

| Check | Result |
|---|---|
| broken-rules.md line count | 128 (under 500) |
| Table rows (header + 23 rules) | 24 (>= 24) |
| repair_findings.js mentions | 5 (B5/B7/B9/B10/B20) |
| NEVER/never occurrences (non-heading) | 1 (acceptable — in Fix cell: "never rely on _draw locals") |
| D-01 note occurrences | 5 (exactly B5/B7/B9/B10/B20) |
| canvas-recipes.md line count | 1200 (> 195) |
| Font loading pattern in canvas-recipes.md | 6 matches |
| B14 variable scope pattern in canvas-recipes.md | 12 matches |
| B19 date parsing pattern in canvas-recipes.md | 4 matches |

## Commits

| Task | Commit | Description |
|---|---|---|
| Task 1 | 302cdbe | feat(05-02): append B1/B2/B14/B19 code patterns to canvas-recipes.md |
| Task 2 | 11772a5 | refactor(05-02): rewrite broken-rules.md as 128-line diagnostic table |

## Deviations from Plan

**1. [Rule 2 - Missing content] B2 (HiDPI) also appended to canvas-recipes.md**
- **Found during:** Task 1 analysis
- **Issue:** The plan listed B1/B14/B19 to check, but B2 (HiDPI) was also referenced in the plan's table interface as "No → canvas-recipes.md" and was missing from canvas-recipes.md
- **Fix:** Appended `setupHiDPI()` function to canvas-recipes.md as part of Task 1
- **Files modified:** `plugins/splunk-viz-packs/skills/vp-viz/references/canvas-recipes.md`
- **Commit:** 302cdbe

**2. [Correction] D-01 note removed from B1 and B19 Fix cells**
- **Found during:** Task 2 verification
- **Issue:** Initial draft incorrectly added the "auto-fixed — but first-try correct code skips repair overhead" note to B1 and B19, which are NOT auto-fixable
- **Fix:** Removed the note from B1 and B19 Fix cells; only B5/B7/B9/B10/B20 carry the D-01 note
- **Files modified:** `plugins/splunk-viz-packs/skills/vp-debug/references/broken-rules.md`

## Known Stubs

None. All content is real reference material — complete code examples, accurate symptom descriptions, real fix instructions.

## Threat Flags

None. This plan modified markdown reference files only — no network endpoints, no auth paths, no file access patterns, no schema changes.

## Self-Check: PASSED

All files found. All commits verified.

- broken-rules.md: FOUND at `plugins/splunk-viz-packs/skills/vp-debug/references/broken-rules.md` (128 lines)
- canvas-recipes.md: FOUND at `plugins/splunk-viz-packs/skills/vp-viz/references/canvas-recipes.md` (1200 lines)
- Task 1 commit 302cdbe: FOUND in git log
- Task 2 commit 11772a5: FOUND in git log
