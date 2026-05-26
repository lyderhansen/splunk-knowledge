---
phase: 29-skill-format-conditioning
plan: "02"
subsystem: vp-viz skill
tags: [extension-api, format-conditioning, checklist, skill-authoring]
dependency_graph:
  requires: [29-01]
  provides: [vp-viz format-conditional workflow, Extension API pre-code checklist]
  affects: [plugins/splunk-viz-packs/skills/vp-viz/SKILL.md, plugins/splunk-viz-packs/skills/vp-viz/references/pre-code-checklist.md]
tech_stack:
  added: []
  patterns: [format-conditional routing in skill SKILL.md, Extension API checklist gating]
key_files:
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/SKILL.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/pre-code-checklist.md
decisions:
  - "[FC-03]: vp-viz SKILL.md Format-conditional workflow block added after Classic workflow — Extension routes to config-json-template.md and visualization-js-template.md"
  - "[FC-04]: pre-code-checklist.md Extension API Checklist section (12 items) appended after Settings Wiring Verification — Classic-only items explicitly skipped when format=extension"
metrics:
  duration: "112s (~2 min)"
  completed: "2026-05-22"
  tasks_completed: 2
  files_modified: 2
---

# Phase 29 Plan 02: vp-viz Format Conditioning Summary

Format-conditional workflow section added to vp-viz SKILL.md and Extension API checklist section added to pre-code-checklist.md — both guiding Claude to choose config.json+ESM visualization.js instead of formatter.html+AMD when format=extension.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add format-conditional workflow section to vp-viz SKILL.md | 9c71a6c3 | plugins/splunk-viz-packs/skills/vp-viz/SKILL.md |
| 2 | Add Extension API section to pre-code-checklist.md | 6024dcc9 | plugins/splunk-viz-packs/skills/vp-viz/references/pre-code-checklist.md |

## What Was Done

**Task 1 — vp-viz SKILL.md (3 changes):**
- Added `### Format-conditional workflow` block after Classic workflow — 7-step Extension flow directing to config-json-template.md and visualization-js-template.md
- Added VIZ_NAMESPACE exception note in STOP section — Extension API config.json uses bare option names, namespace rules apply to Classic only
- Added checklist hint in Pre-code checklist section — prompts loading Extension API section when format=extension

**Task 2 — pre-code-checklist.md:**
- Added `## Extension API Checklist (format=extension only)` section at end of file
- 12 checklist items: ESM import, columnar data access, addThemeListener, addDrilldownListener, config.json instead of formatter.html, bare option names, orphaned schema entry warning, drilldown flags, src/ directory structure, yarn build, yarn package, dashboard JSON namespace rule (same as Classic)
- Template references to config-json-template.md and visualization-js-template.md at end of section

## Verification Results

- vp-viz SKILL.md: 486 lines (under 500 limit — PASS)
- format=extension appears 3 times in SKILL.md (PASS — minimum 2 required)
- config-json-template and visualization-js-template both referenced in SKILL.md (PASS)
- bare option names noted in SKILL.md (PASS)
- Extension API section present in pre-code-checklist.md (PASS)
- ESM import, columnar data, addDrilldownListener, addThemeListener, config-json-template all present (PASS)
- Classic workflow unchanged — format=classic line confirms additive-only change (PASS)

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None. These are skill instruction files — no data stubs applicable.

## Threat Flags

No new security-relevant surface introduced. Both files are skill instruction documents read by Claude at generation time.

## Self-Check: PASSED

- SKILL.md: FOUND
- pre-code-checklist.md: FOUND
- SUMMARY.md: FOUND
- commit 9c71a6c3: FOUND
- commit 6024dcc9: FOUND
