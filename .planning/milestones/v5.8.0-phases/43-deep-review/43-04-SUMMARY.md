---
phase: 43-deep-review
plan: "04"
subsystem: vp-create-scripts
tags: [review, wave-4, vp-create, generate_assets, generate_previews, build_flat, scripts]
dependency_graph:
  requires: []
  provides: [43-WAVE-4-REVIEW-VP-CREATE-SCRIPTS.md]
  affects: []
tech_stack:
  added: []
  patterns: [exhaustive-review, BLOCKER/WARNING/NIT, Phase-41-D01-D02-contract-verification]
key_files:
  created:
    - .planning/phases/43-deep-review/43-WAVE-4-REVIEW-VP-CREATE-SCRIPTS.md
  modified: []
decisions:
  - "PA-01 '2x 600x400 preview' claim in STATE.md was never implemented in either generate_assets.js or generate_previews.py — classify as WARNING, not BLOCKER (116x76 is Splunk's required preview size)"
  - "STATE.md [41-01] font path documents extras/ttf/ but actual path is scripts/fonts/ — documentation drift"
  - "CONTEXT.md test pack count is correct at 45; RESEARCH.md claim of 46 was transient state"
metrics:
  duration: "8 minutes"
  completed_date: "2026-05-24"
  tasks_completed: 3
  files_modified: 1
---

# Phase 43 Plan 04: Wave 4 Review — vp-create/scripts/ Summary

Wave 4 reviewed all 5 actionable files in `plugins/splunk-viz-packs/skills/vp-create/scripts/` (build_flat.js, generate_assets.js, generate_previews.py, validate_viz.sh wrapper; fonts/ binary subdir excluded), verified Phase 41 D-01/D-02 preview ownership split, and produced `43-WAVE-4-REVIEW-VP-CREATE-SCRIPTS.md` with zero BLOCKERs, 3 WARNINGs, and 7 NITs.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1+2+3 | Write all Wave 4 review sections (preview pair + build/wrapper/CONTEXT + Coverage Summary) | cb63ecbe | .planning/phases/43-deep-review/43-WAVE-4-REVIEW-VP-CREATE-SCRIPTS.md |

Note: All 3 tasks were written in a single pass to the same output file; committed in one atomic commit.

## Deviations from Plan

### Auto-fixed Issues

None.

### Informational Notes

**1. Tasks 1-3 committed together**

All 3 plan tasks write to the same output file `43-WAVE-4-REVIEW-VP-CREATE-SCRIPTS.md`. The entire file was written in one pass after reading all source scripts end-to-end (per D-02 exhaustive read requirement). The verification checks for all 3 tasks passed before commit.

## Key Findings

### Zero BLOCKERs

The Phase 41 D-01/D-02 split contract is correctly implemented:
- `generate_previews.py` owns preview.png by default (PP-01, PP-02 verified)
- `generate_assets.js --legacy-previews` gate works correctly (line 1498-1508)
- Font is bundled and accessible (scripts/fonts/Inter-Regular.ttf, 407KB)

### 3 WARNINGs (documentation drift, no runtime bugs)

1. **PA-01 2x preview gap** — STATE.md records PA-01 as "add 2x output at 600x400" but neither generate_assets.js nor generate_previews.py produces a 600x400 preview variant. Splunk's required size is 116x76. Wave 7 needs to either implement preview_2x.png or update STATE.md to reflect the scope was narrowed.

2. **STATE.md font path drift** — STATE.md [41-01] documents the Inter TTF at `extras/ttf/Inter-Regular.ttf` but the actual path is `scripts/fonts/Inter-Regular.ttf`. No runtime bug (generate_previews.py uses `os.path.dirname(__file__)` relative path correctly). STATE.md update needed.

3. **D-04 decision ID ambiguity in generate_previews.py** — Comments use "D-04" to refer to the Phase 41 CONTEXT.md 3-tier detection cascade decision, but Phase 43 CONTEXT.md also has a D-04 ("fix everything found inline"). Adding "(Phase 41)" qualifiers resolves the ambiguity.

### build_flat.js diff result

Exactly **one line difference** between vp-create/scripts/build_flat.js and vp-viz/scripts/build_flat.js: the vp-create copy adds a "Canonical source" comment at line 4. All logic is byte-for-byte identical. This is a managed copy, not drift.

### CONTEXT inventory drift

Both CONTEXT.md drifts are flagged as NITs:
- Script count: CONTEXT.md says "4 scripts", actual is 5 (validate_viz.sh was not counted). Wave 4 reviewed all 5.
- Test pack count: RESEARCH.md claimed 46, current filesystem shows 45. CONTEXT.md's 45 is correct.

## Stub Tracking

None — this plan produces only a review document, no UI-rendering code.

## Threat Flags

None — review-only output. No new executable surface introduced.

## Self-Check

```bash
[ -f ".planning/phases/43-deep-review/43-WAVE-4-REVIEW-VP-CREATE-SCRIPTS.md" ] && echo "FOUND" || echo "MISSING"
git log --oneline --all | grep -q "cb63ecbe" && echo "FOUND: cb63ecbe" || echo "MISSING: cb63ecbe"
```

## Self-Check: PASSED

- .planning/phases/43-deep-review/43-WAVE-4-REVIEW-VP-CREATE-SCRIPTS.md: FOUND (created)
- Commit cb63ecbe: FOUND in git log
- All 3 automated verify blocks: PASS (confirmed before commit)
