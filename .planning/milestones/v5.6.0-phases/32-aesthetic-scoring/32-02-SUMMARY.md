---
phase: 32-aesthetic-scoring
plan: "02"
subsystem: validate_viz.sh
tags: [validation, scoring, aesthetic, cli-flag, shell]
dependency_graph:
  requires: [32-01]
  provides: [AS-02]
  affects: [validate_viz.sh]
tech_stack:
  added: []
  patterns: [optional-phase-gating, informational-score-output]
key_files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh
decisions:
  - "Phase 5 block uses same viz-dir loop pattern as Phase 4 for consistency"
  - "SCORE_DESIGN variable declared alongside CHECK_DESIGN to keep path declarations co-located"
  - "JS source fallback order matches Phase 4: src/visualization_source.js, then src/visualization.js, then root visualization.js"
metrics:
  duration: "2m"
  completed: "2026-05-22T10:09:16Z"
  tasks_completed: 2
  files_modified: 1
---

# Phase 32 Plan 02: Score Integration in validate_viz.sh Summary

One-liner: --score flag gates a Phase 5 block in validate_viz.sh that runs score_design.js per viz to emit informational SCORE lines without touching TOTAL_FAIL.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add --score flag parsing and Phase 5 block | 669503f6 | validate_viz.sh (+22 lines) |
| 2 | End-to-end verification with test38_strava | (no commit — verification only) | — |

## What Was Built

Three targeted changes to `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh`:

1. **Argument parsing** (lines 7-18): Added `SCORE_MODE=0` before the for loop. Added an `elif [ "$arg" = "--score" ]` branch that sets `SCORE_MODE=1` without consuming it as `APP_DIR`. The existing `--repair` handling is unchanged.

2. **SCORE_DESIGN path declaration** (line 383): `SCORE_DESIGN="$SCRIPT_DIR/score_design.js"` added directly after the `CHECK_DESIGN` declaration, keeping all script-path variables co-located in Phase 4's capability block.

3. **Phase 5 block** (lines 414-430): Runs only when `SCORE_MODE=1 && HAS_NODE=1 && score_design.js exists`. Iterates the same viz directories as Phase 4, finds JS source in the same priority order (src/visualization_source.js > src/visualization.js > visualization.js), and invokes `node "$SCORE_DESIGN" "$JS_SRC" "$THEME_JS" "$VIZ"`. Never modifies `TOTAL_FAIL`.

## Verification Results

Test app: `tests/test38_strava/strava_coaching_viz` (7 vizs, all with src/visualization_source.js)

**Without --score:** Zero lines containing "Aesthetic Score" or "SCORE:" appeared. Exit code and final summary block identical to pre-change behavior.

**With --score:** Phase 5 emitted:
- `--- Aesthetic Score ---` header
- One `SCORE [viz_name]: N/100 (gradient: G, typography: T, spacing: S, color: C, animation: A)` line per viz
- All 7 vizs scored: activity_heatmap (40), elevation_profile (85), fitness_fatigue_trend (90), hr_zone_donut (55), pace_waterfall (50), segment_leaderboard (45), training_load_kpi (50)
- Final summary block and exit code identical to without-score run

**Syntax check:** `bash -n validate_viz.sh` passes.

## Deviations from Plan

None — plan executed exactly as written. Three edits matched the plan specification byte-for-byte.

## Known Stubs

None — no placeholder data or hardcoded values were introduced.

## Threat Flags

None — the `--score` flag only enables informational output. No security-relevant surface was added.

## Self-Check: PASSED

- [x] `plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh` exists and modified
- [x] Commit 669503f6 exists in git log
- [x] `grep -c 'SCORE_MODE' validate_viz.sh` returns 3
- [x] `grep -c 'Aesthetic Score' validate_viz.sh` returns 1 (the echo line contains the string once)
- [x] Phase 5 block contains no `TOTAL_FAIL` assignments
- [x] `bash -n validate_viz.sh` passes
