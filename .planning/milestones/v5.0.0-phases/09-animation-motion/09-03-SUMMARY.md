---
phase: 09-animation-motion
plan: "03"
subsystem: splunk-viz-packs/skills/vp-viz
tags: [animation, skill-wiring, SKILL.md, canvas-recipes, D08, rAF, vp-viz]
dependency_graph:
  requires: [09-01-animation-recipes-expansion, 09-02-formatter-patterns-animation-section]
  provides: [SKILL.md animation wiring, canvas-recipes rAF stagger, D08 validation confirmed]
  affects: [vp-viz code generation — Claude will now load animation-recipes.md automatically]
tech_stack:
  added: []
  patterns: [SKILL.md MUST-LOAD wiring, rAF stagger pattern, D08 bidirectional wiring validation]
key_files:
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/SKILL.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/canvas-recipes.md
decisions:
  - "Added animation-recipes.md as MUST-LOAD bullet in SKILL.md — ensures Claude loads it before every updateView() animation implementation"
  - "Replaced setTimeout stagger with rAF timestamp-based _startStagger() — single rAF loop instead of N setTimeouts, cancelable, 500ms cap"
  - "PREFER cross-reference added after Animation lifecycle setInterval section — retains setInterval for reference while directing to rAF pattern"
  - "D08 synthetic test confirmed 0 FAIL findings for all 4 animation controls (showEntrance, flashCritical, showHoverEffect, animationSpeed)"
  - "setTimeout mention retained in stagger description prose ('instead of N setTimeouts') — this is documentation, not code"
metrics:
  duration: "~8 min"
  completed: "2026-05-16"
  tasks_completed: 3
  files_modified: 2
---

# Phase 9 Plan 03: Animation Skill Wiring Summary

**One-liner:** animation-recipes.md wired into vp-viz SKILL.md MUST-LOAD, canvas-recipes.md stagger upgraded from setTimeout to rAF timestamp math, D08 bidirectional check confirmed passing for all 4 animation formatter controls.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Wire animation-recipes.md into SKILL.md MUST-LOAD and pre-code checklist | 104fa8c | plugins/splunk-viz-packs/skills/vp-viz/SKILL.md |
| 2 | Update canvas-recipes.md stagger snippet and animation lifecycle cross-reference | 6590a09 | plugins/splunk-viz-packs/skills/vp-viz/references/canvas-recipes.md |
| 3 | Verify D08 bidirectional wiring compatibility with synthetic test | (no commit — verification only, /tmp fixtures cleaned up) | /tmp/test_animation_d08/ (deleted) |

## What Was Built

### Task 1: SKILL.md Animation Wiring

Made two minimal additions to `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md` (469 → 471 lines, well within 500-line limit):

1. **MUST-LOAD bullet** added after Consistency grid in the "MUST-LOAD for every viz" section:
   ```
   - **[Animation recipes](../../vp-recipes/references/animation-recipes.md)** — ANI-01 through ANI-06: rAF entrance, LED pulse, hover easing, stagger patterns, prefers-reduced-motion. Load before writing updateView() animation logic.
   ```
   This ensures Claude automatically loads animation-recipes.md during every future `vp-viz` run.

2. **Pre-code checklist item** added at end of the checkbox list:
   ```
   □ Animation opt() reads — showEntrance, flashCritical, showHoverEffect, animationSpeed read via opt() with correct defaults (true, false, true, normal); prefersReducedMotion() check before starting animations
   ```
   This reinforces the pattern from formatter-patterns.md with a pre-code verification step.

### Task 2: canvas-recipes.md Updates

Two surgical edits to `plugins/splunk-viz-packs/skills/vp-viz/references/canvas-recipes.md` (979 → 998 lines):

1. **Stagger snippet replaced:** The old 10-line setTimeout loop (`for (var i...) { (function(idx) { setTimeout(...) })(i); }`) replaced with a 25-line rAF-based `_startStagger()` method:
   - Single `requestAnimationFrame` loop instead of N concurrent `setTimeout` calls
   - `rowDelay = Math.min(30, 500 / rows.length)` — caps total stagger at 500ms regardless of row count
   - Per-row progress computed from elapsed timestamp: `(elapsed - i * rowDelay * speedMult) / (200 * speedMult)`
   - easeOutQuart applied via `rowProgress^4` multiplication
   - `cancelAnimationFrame` in `destroy()` documented
   - Comment notes this replaces the old setTimeout pattern per Phase 9 D-11

2. **PREFER cross-reference** added after Animation lifecycle section (before "## Common mistakes"):
   ```
   PREFER: For production animations, use the rAF timestamp-based pattern in animation-recipes.md which provides smooth 60fps, auto-pauses on hidden tabs, and is cancelable via a single flag. The setInterval pattern above is retained as a simple reference for non-animated vizs that just need a timer.
   ```

### Task 3: D08 Validation

Created a synthetic test fixture at `/tmp/test_animation_d08/` with:
- `formatter.html`: 4 form sections, 8 controls including all 4 animation controls (`showEntrance`, `flashCritical`, `showHoverEffect`, `animationSpeed`) with `{{VIZ_NAMESPACE}}` resolved to `test_app.test_viz`
- `visualization_source.js`: ES5 source reading all 4 animation controls via `opt()`, includes `Math.max`/`Math.min` for D03, has `requestAnimationFrame` usage
- `theme.js`: Minimal DARK/LIGHT theme with `rgba()` values

Result of `node check_design.js formatter.html visualization_source.js theme.js`:
- FAIL D08: **0** (all 4 animation controls pass forward wiring check)
- WARN D01, D02: Expected (no gradients/shadows in minimal test fixture — WARNs don't fail the gate)
- FAIL D03, D05: **0** (Math.min + Math.max present; 4 form sections present)

Cleanup: `/tmp/test_animation_d08/` removed after verification.

## Verification Results

| Check | Result | Target |
|-------|--------|--------|
| SKILL.md animation-recipes link | 1 occurrence | >=1 |
| SKILL.md MUST-LOAD bullet (Animation recipes) | 1 occurrence | 1 |
| SKILL.md pre-code checklist (showEntrance.*flashCritical) | 1 occurrence | 1 |
| SKILL.md line count | 471 lines | <=500 |
| SKILL.md existing content intact (Design principles) | 1 occurrence | 1 |
| canvas-recipes.md rAF in stagger (A25 context) | 2 occurrences | >=1 |
| canvas-recipes.md animation-recipes.md xref | 2 occurrences | >=1 |
| canvas-recipes.md PREFER note | 1 occurrence | >=1 |
| canvas-recipes.md line count | 998 lines | 975-1000 |
| D08 FAIL count (synthetic test) | 0 | 0 |
| /tmp/test_animation_d08 cleaned up | Removed | Not exist |

## Deviations from Plan

### Note on setTimeout in stagger verification

The plan's acceptance criterion `grep -A15 'Stagger entrance for lists' canvas-recipes.md | grep -c 'setTimeout' returns 0` evaluates against 15-line context. The replacement stagger snippet is ~25 lines, and the description line reads "instead of N setTimeouts" — this prose word appears within the wider context window. The code block itself has zero `setTimeout` calls; only the descriptive text contains the word as documentation. All other acceptance criteria pass without adjustment. The plan's verification grep check at `-A15` is too narrow for the replacement code size — the actual implementation is correct.

## Known Stubs

None — all three files contain complete, runnable code patterns with no placeholder content.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes. This plan modified two markdown reference files and performed read-only validation against an existing JavaScript script. No threat flags.

## Self-Check: PASSED

- [x] File exists: `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md` (471 lines, <=500)
- [x] File exists: `plugins/splunk-viz-packs/skills/vp-viz/references/canvas-recipes.md` (998 lines)
- [x] Commit 104fa8c exists (Task 1 — SKILL.md)
- [x] Commit 6590a09 exists (Task 2 — canvas-recipes.md)
- [x] D08 synthetic test: 0 FAIL D08 findings confirmed
- [x] animation-recipes.md MUST-LOAD bullet present in SKILL.md
- [x] Animation opt() checklist item present in SKILL.md
- [x] rAF stagger snippet present in canvas-recipes.md
- [x] PREFER cross-reference present in canvas-recipes.md
