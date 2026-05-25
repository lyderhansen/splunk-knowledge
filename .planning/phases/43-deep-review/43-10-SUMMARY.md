---
phase: 43-deep-review
plan: 10
subsystem: splunk-viz-packs
tags: [pp-01, preview-attribution, generate-previews, generate-assets, skill-md, state-md]
dependency_graph:
  requires: []
  provides: [PP-01-correct-preview-attribution, B7-fixed, B8-fixed, B16-fixed, W23-fixed, W24-fixed, W25-fixed]
  affects: [vp-viz/SKILL.md, vp-init/SKILL.md, vp-create/SKILL.md, generate_assets.js, generate_previews.py, validate_viz.sh, STATE.md]
tech_stack:
  added: []
  patterns: [--legacy-previews argv flag, Phase 41 D-04 comment disambiguation]
key_files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/SKILL.md
    - plugins/splunk-viz-packs/skills/vp-init/SKILL.md
    - plugins/splunk-viz-packs/skills/vp-create/SKILL.md
    - plugins/splunk-viz-packs/skills/vp-viz/scripts/generate_assets.js
    - plugins/splunk-viz-packs/skills/vp-create/scripts/generate_assets.js
    - plugins/splunk-viz-packs/skills/vp-create/scripts/generate_previews.py
    - plugins/splunk-viz-packs/skills/vp-create/scripts/validate_viz.sh
    - .planning/STATE.md
decisions:
  - "B-16 resolved via option (a): wired real --legacy-previews argv flag in vp-viz/scripts/generate_assets.js (mirrors vp-create version) rather than option (b) doc-only fix"
  - "AF-01 note appended inline to existing animation checklist line (not a new line) to stay within 487/500 budget"
  - "W-16 ds-create cross-plugin link uses relative markdown path from vp-init location"
metrics:
  duration: 4min
  completed_date: "2026-05-25"
  tasks_completed: 2
  files_modified: 8
requirements:
  - DR-01
  - DR-02
---

# Phase 43 Plan 10: PP-01 Attribution Sweep (Cluster C) Summary

Cluster C gap-closure: fixed PP-01 (Phase 41 preview ownership split) stale-attribution BLOCKERs in vp-viz/SKILL.md Quick rule 13 and vp-init/SKILL.md STAGE 3; wired real --legacy-previews argv gate in vp-viz generate_assets.js; qualified all D-04 comments in generate_previews.py; corrected STATE.md font path and PA-01 2x preview claim.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | vp-viz + vp-init + vp-create SKILL.md PP-01 fixes | fd0bdf06 | vp-viz/SKILL.md, vp-init/SKILL.md, vp-create/SKILL.md |
| 2 | generate_assets.js (both) + generate_previews.py + validate_viz.sh + STATE.md | db1495c2 | 5 files |

## What Was Fixed

### Task 1 — SKILL.md PP-01 Stale Attribution Fixes

**B-7 (vp-viz/SKILL.md Quick rule 13):** Replaced stale `node generate_assets.js <app_dir>` at 300x200 with correct `python3 generate_previews.py <app_dir>` at 116x76 RGB, with JS fallback via `--legacy-previews`. Line count held at 487/500.

**B-8 (vp-init/SKILL.md STAGE 3):** Updated Step 3b from `generate_assets.js (icons + previews + gradient bg)` to `generate_assets.js (icons + gradient bg) + generate_previews.py (per-viz preview.png, 116x76 RGB, Pillow)`.

**W-12 (AF-01 eager citation):** Appended AF-01 scope note to the existing animation checklist item (no new line — stays at 487 lines).

**W-16 (ds-create full path):** Updated Cross-plugin dependencies table to link ds-create with full relative path `../../../splunk-dashboard-studio/skills/ds-create/SKILL.md`.

**Wave 2 WARNING (Phase 31 reference in vp-create):** Replaced "Full Extension validation rules are defined in Phase 31" with "Extension API checks enforced by validate_viz.sh (E01-E05 codes)."

### Task 2 — Scripts and STATE.md Wave 4 Fixes

**B-16 (generate_assets.js --legacy-previews gate):** Added real `--legacy-previews` argv flag to `vp-viz/scripts/generate_assets.js` (mirroring the existing vp-create version). The flag gates `generatePreviews()` — default behavior now skips JS silhouette previews with an INFO message. This is Option (a) from REVIEW.md: "makes the gate real."

**N-14 (header annotation):** Added `-- only with --legacy-previews flag` to the preview.png output line in both generate_assets.js copies.

**N-15 (D-01/D-02 Phase 41 qualifiers):** Expanded bare `D-01` and `D-02` references to `Phase 41 D-01` and `Phase 41 D-02` in both generate_assets.js copies.

**W-25 (generate_previews.py D-04 disambiguation):** Qualified all 4 bare `D-04` comment occurrences as `(Phase 41 D-04)` to prevent confusion with Phase 43 CONTEXT.md which also has a D-04.

**N-17 (validate_viz.sh Why comment):** Added explicit "Why:" comment to the wrapper script explaining the delegation pattern.

**W-24 (STATE.md font path):** Corrected `[41-01]` entry from `extras/ttf/Inter-Regular.ttf` to `scripts/fonts/Inter-Regular.ttf` (actual path in vp-create/scripts/fonts/).

**W-23 (STATE.md PA-01 2x preview):** Appended note to PA-01 Architecture decision clarifying that 2x preview at 600x400 was not implemented when Phase 41 refactored preview ownership to generate_previews.py at 116x76; deferred.

## Deviations from Plan

None — plan executed exactly as written.

**Decision logged:** B-16 resolved via option (a) (real gate wired) as preferred by REVIEW.md. The vp-create/scripts/generate_assets.js already had this implemented correctly from Phase 41; this plan brought vp-viz/scripts/generate_assets.js to parity.

## Known Stubs

None.

## Threat Flags

None — all changes are documentation/comment edits and an argv parsing addition with no logic change to output paths.

## Self-Check: PASSED

All 8 modified files verified present. Both task commits (fd0bdf06, db1495c2) confirmed in git log.
