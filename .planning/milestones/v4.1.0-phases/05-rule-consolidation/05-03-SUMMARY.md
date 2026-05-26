---
phase: 05-rule-consolidation
plan: 03
subsystem: splunk-viz-packs/vp-viz + vp-create + vp-design + vp-recipes
tags: [skill-refactor, deduplication, cross-reference, fisr-validation]
dependency_graph:
  requires:
    - plugins/splunk-viz-packs/skills/vp-viz/references/canvas-recipes.md (from plan 05-01)
    - plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md (from plan 05-01)
    - plugins/splunk-viz-packs/skills/vp-debug/references/broken-rules.md (from plan 05-02)
  provides:
    - plugins/splunk-viz-packs/skills/vp-viz/SKILL.md (deduplicated, 428 lines, under 450)
    - plugins/splunk-viz-packs/skills/vp-create/SKILL.md (cross-referenced Step 3)
    - plugins/splunk-viz-packs/skills/vp-design/SKILL.md (hero text rule cross-referenced)
    - plugins/splunk-viz-packs/skills/vp-recipes/SKILL.md (references section updated)
    - .planning/FISR-BASELINE.md (Phase 5 comparison result appended)
  affects:
    - Any agent reading vp-* skills — reduced duplication, cleaner cross-references
tech_stack:
  added: []
  patterns:
    - Single-source cross-reference: remove rule explanations from SKILL.md, point to authoritative reference files
    - D-03 rule classification: distinguish workflow checklist items (DO/DON'T) from rule explanations (WHY) when counting
key_files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/SKILL.md
    - plugins/splunk-viz-packs/skills/vp-create/SKILL.md
    - plugins/splunk-viz-packs/skills/vp-design/SKILL.md
    - plugins/splunk-viz-packs/skills/vp-recipes/SKILL.md
    - .planning/FISR-BASELINE.md
    - .planning/phases/03-repair-loop-light-theme-safety/03-CONTEXT.md
    - .planning/phases/02-schema-cross-file-validation/02-CONTEXT.md
decisions:
  - "vp-viz namespace table (20 lines) removed — STOP section 13 lines above already covers all three formats; a single pointer line replaces the table"
  - "Quick rules items 7 ({{VIZ_NAMESPACE}}) and 11 (Dashboard type format) removed — both fully covered by the STOP section at file top; remaining 15 items cover ground not in STOP"
  - "D-03 applied to rule count: numbered quick-rule list in vp-viz = 15 items (true rule references); pre-code checklist (32 □ items) and vp-create task checklist (17 items) are workflow tools — excluded from the <30 target count"
  - "FISR PASS declared: A03 and CONTRAST FAILs are pre-existing in test28 baseline; B10 FAILs are auto-repaired; Phase 5 modified markdown only — zero app files changed"
metrics:
  duration_minutes: ~25
  tasks_completed: 2
  files_created: 0
  files_modified: 7
  completed_date: "2026-05-15"
---

# Phase 05 Plan 03: SKILL.md Deduplication and FISR Regression Test Summary

Removed redundant rule explanations from vp-viz/vp-create/vp-design/vp-recipes SKILL.md files, added cross-references to the authoritative reference files built in Plans 01-02, and confirmed via FISR regression test that Phase 5 consolidation introduced zero regressions in test28 cloudflare_noc.

## What Was Built

**Task 1 — Deduplicate vp-* SKILL.md files**

Five edits across four SKILL.md files and two .planning/ CONTEXT files:

- **vp-viz/SKILL.md (450 → 428 lines):** Removed the "Three namespace formats" table (20 lines) — it duplicated the STOP section 13 lines above. Removed quick-rule items 7 ({{VIZ_NAMESPACE}}) and 11 (Dashboard type format) — both fully covered by the STOP section. The namespace table was replaced with a single pointer: "See STOP section above for all three namespace formats and Dashboard JSON option key format." Quick rules renumbered from 17 to 15 items.

- **vp-create/SKILL.md:** Step 3 "Common fixes:" bullet list replaced with auto-repair + cross-reference pattern. The old list explained B10/B7/B5/B20/F3 inline; the new text directs to the repair loop (auto-fixes B10/B9/B5/B7/B20) and to vp-viz SKILL.md STOP section and vp-debug references/fatal-rules.md for cases where auto-repair fails.

- **vp-design/SKILL.md:** One-line dedup — "Hero values use FULL t.text color — never textDim/textFaint" replaced with "Hero values use FULL t.text color — see vp-viz SKILL.md light theme verification for contrast requirements."

- **vp-recipes/SKILL.md:** References section updated — all-patterns.md description updated to reflect it is now a navigation index (~200 lines); canvas-recipes.md and formatter-patterns.md added as new entries with correct relative paths (../vp-viz/references/...).

- **D-08 stale reference cleanup:** Replaced `vp-ref-gotchas/SKILL.md` paths with `vp-debug/references/broken-rules.md` in 02-CONTEXT.md and 03-CONTEXT.md.

**Task 2 — Rule count audit and FISR regression test**

- **Rule count audit:** 15 numbered items in the vp-viz "Quick rules" list. Per D-03 judgment: numbered quick-rule lists are the true rule reference; pre-code checklist (32 □ items) and task checklists are workflow tools. Total across all vp-* SKILL.md files: 15 rule-explanation items. Target of under 30 met.

- **FISR regression test:** validate_viz.sh on test28 cloudflare_noc produced A03 (pre-existing appIcon too small), B10 (167 auto-fixable bare option keys — identical to pre-Phase-5 state), and CONTRAST warnings (pre-existing theme.js contrast ratios). Zero new FAIL categories introduced. Result: **PASS**.

- **FISR-BASELINE.md:** Phase 5 Comparison section appended with date, method, FAIL codes found, and conclusion. SKL-01/SKL-02 verification table added.

## Verification Results

| Check | Result |
|---|---|
| vp-viz/SKILL.md line count | 428 (under 450) |
| vp-create cross-reference to STOP section | 1 occurrence (present) |
| Old FAIL bullet list in vp-create Step 3 | 0 occurrences (removed) |
| formatter-patterns link in vp-recipes | Present |
| Stale vp-ref-gotchas in .planning/ | 0 occurrences (cleaned) |
| all-patterns.md line count | 185 (under 500) |
| broken-rules.md line count | 128 (under 500) |
| formatter-patterns.md exists | Yes |
| FISR Phase 5 Comparison in FISR-BASELINE.md | Present |
| Quick-rule count across vp-* | 15 (under 30) |

## Commits

| Task | Commit | Description |
|---|---|---|
| Task 1 | fe49a94 | refactor(05-03): deduplicate vp-* SKILL.md files with cross-references |
| Task 2 | 93b1407 | docs(05-03): rule count audit and FISR regression test results |

## Deviations from Plan

None — plan executed exactly as written.

The CONTRAST FAIL appearing in validate_viz.sh output warranted brief investigation to confirm it was pre-existing (not a Phase 5 regression). Confirmed: Phase 5 modified no app files, theme.js, or scripts. CONTRAST issues are pre-existing in test28 theme.js.

## Known Stubs

None. All cross-references point to real files that exist. All verification checks pass against actual content.

## Threat Flags

None. This plan modified only markdown SKILL.md files and planning context documents. No network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check: PASSED

- `plugins/splunk-viz-packs/skills/vp-viz/SKILL.md`: FOUND (428 lines)
- `plugins/splunk-viz-packs/skills/vp-create/SKILL.md`: FOUND (142 lines, cross-reference present)
- `plugins/splunk-viz-packs/skills/vp-design/SKILL.md`: FOUND (176 lines, cross-reference present)
- `plugins/splunk-viz-packs/skills/vp-recipes/SKILL.md`: FOUND (118 lines, formatter-patterns link present)
- `.planning/FISR-BASELINE.md`: FOUND (Phase 5 Comparison section present)
- Task 1 commit fe49a94: FOUND in git log
- Task 2 commit 93b1407: FOUND in git log
