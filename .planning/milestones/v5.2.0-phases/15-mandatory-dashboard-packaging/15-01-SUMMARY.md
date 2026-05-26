---
phase: 15-mandatory-dashboard-packaging
plan: "01"
subsystem: vp-create skill
tags: [skill-authoring, dashboard, packaging, validation-gate]
dependency_graph:
  requires: []
  provides: [Step 3c mandatory dashboard generation, dashboard packaging checklist items]
  affects: [plugins/splunk-viz-packs/skills/vp-create/SKILL.md]
tech_stack:
  added: []
  patterns: [validation gate before dashboard generation, panel count verification]
key_files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-create/SKILL.md
decisions:
  - "Dashboard generation gated on zero-FAIL validate_viz.sh exit (DSB-03) — prevents broken viz packs from shipping with dashboards"
  - "Panel type uses {app_id}.{viz_name} directly (not 'custom' + customVizId) — matches Splunk Dashboard Studio v2 custom viz format"
  - "Demo search uses inputlookup {pack_id}_demo_{viz_name}.csv — not makeresults, ensuring real data paths"
  - "Step 3b added to workflow checkbox list alongside Step 3c for completeness"
metrics:
  duration_seconds: 67
  completed_date: "2026-05-18"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 1
---

# Phase 15 Plan 01: Mandatory Dashboard Packaging Summary

**One-liner:** Step 3c mandatory dashboard generation added to vp-create with validate_viz.sh zero-FAIL gate, dashboard-composition.md MUST LOAD, panel count verification, and 3 packaging checklist items.

## What Was Built

Added `## Step 3c: Generate dashboard with ALL vizs (MANDATORY)` to `vp-create/SKILL.md`, inserting it between the existing Step 3b (asset generation) and Step 4 (packaging). The section contains:

- A hard STOP gate requiring zero FAIL from validate_viz.sh before proceeding
- A MUST LOAD directive for `vp-design/references/dashboard-composition.md`
- Five ordered requirements: one panel per viz, `{app_id}.{viz_name}` type format, `inputlookup` demo searches, `bg_gradient.png` background via `splunk.image`, 1920x1080 canvas
- Output file paths for JSON (`appserver/static/dashboards/{pack_id}_overview.json`) and XML wrapper (`default/data/ui/views/{pack_id}_overview.xml`) with the Dashboard Studio v2 XML structure
- Panel count verification instruction (viz directory count must equal `{app_id}.*` panel count)
- Nav bar default view update instruction

Also updated:
- Workflow checkbox list: Step 3b and Step 3c entries added
- Packaging checklist: 3 new items (dashboard exists, dashboard references ALL vizs, nav bar default set to dashboard)
- Step 6 completion output: Dashboard line added between Vizs and Install

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 — Step 3c section | 214a0f7 | feat(15-01): add Step 3c mandatory dashboard generation with validation gate |
| 2 — Checklist + output | 8b7e7ca | feat(15-01): add dashboard verification to packaging checklist and completion output |

## Verification Results

```
Step 3c occurrences: 2 (workflow list + section header)
zero FAIL occurrences: 2 (gate + checklist)
dashboard-composition.md references: 1
inputlookup occurrences: 1
Checklist items (- [ ]): 23 (was 12; +8 workflow items +3 dashboard items)
Final line count: 192 (under 500-line SKILL.md limit)
```

All plan verification commands pass:
- `grep "Step 3c"` — found in workflow list and section header
- `grep "dashboard-composition.md"` — MUST LOAD reference present
- `grep "zero FAIL"` — validation gate and checklist item both present
- `grep -c "^\- \[ \]"` — 23 items (well above 15+ requirement)
- `wc -l` — 192 lines (under 500)

## Success Criteria Status

- [x] DSB-01: vp-create has mandatory Step 3c that generates a Dashboard Studio view with ALL vizs
- [x] DSB-02: Dashboard panel count equals viz directory count — verified in packaging checklist
- [x] DSB-03: Dashboard generation is gated on clean validate_viz.sh exit — STOP gate at top of Step 3c
- [x] File stays under 500 lines (192 lines)
- [x] No scope creep: no new scripts, no validate_viz.sh changes, no new files created — SKILL.md authoring only

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — this is a SKILL.md authoring change with no runtime data paths.

## Threat Flags

None — SKILL.md is developer-authored markdown; no user input flows into it; no new network endpoints or auth paths introduced.

## Self-Check: PASSED

- [x] `plugins/splunk-viz-packs/skills/vp-create/SKILL.md` exists and contains Step 3c
- [x] Commit 214a0f7 exists: `git log --oneline | grep 214a0f7`
- [x] Commit 8b7e7ca exists: `git log --oneline | grep 8b7e7ca`
