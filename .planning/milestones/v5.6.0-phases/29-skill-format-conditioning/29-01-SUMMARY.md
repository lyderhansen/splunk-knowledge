---
phase: 29-skill-format-conditioning
plan: "01"
subsystem: splunk-viz-packs/skills/vp-init
tags: [skill, format-conditioning, vp-init, classic, extension-api]
dependency_graph:
  requires: []
  provides: [format-choice-question, format-hand-off-field]
  affects: [vp-design, vp-viz, vp-create]
tech_stack:
  added: []
  patterns: [format-conditional-routing]
key_files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-init/SKILL.md
decisions:
  - "Classic is the default format — Extension is additive, not a replacement"
  - "Format question inserted as Q1 to ensure it is captured before brand research begins"
  - "Format field included in hand-off context so all downstream skills (vp-viz, vp-create) can branch on it"
  - "Pipeline annotations use parenthetical (If format=extension: ...) style for minimal line impact"
metrics:
  duration_minutes: 5
  completed: "2026-05-22T07:45:05Z"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 1
---

# Phase 29 Plan 01: vp-init Format Choice Question Summary

## One-liner

Added Classic vs Extension format choice as Q1 in vp-init, with Format field propagated through the vp-design hand-off block so downstream skills can branch on it.

## What Was Done

**Task 1: Add format question and update hand-off in vp-init SKILL.md**

Three changes applied to `plugins/splunk-viz-packs/skills/vp-init/SKILL.md`:

1. **New Q1 "Target format"** inserted before the existing app name question. Describes Classic (formatter.html + AMD + build_flat.js + tar) vs Extension (config.json + ESM + yarn), with Classic explicitly as default. Previous Q1-Q7 renumbered to Q2-Q8.

2. **Hand-off context block updated** — Format field added as first entry: `Format: {answer to Q1 — "classic" or "extension"}`. Question number references updated to match new numbering. Field count prose updated from "these 5 fields" to "these 6 fields".

3. **Pipeline annotations added** — Two parenthetical notes in the STAGE 2 and STAGE 3 code blocks indicating what changes when format=extension (vp-viz output type and vp-create build/package commands).

Final line count: 128 lines (was 118 before edits, under 140-line target).

## Verification Results

All automated checks passed:
- Lines: 128 — PASS: under 140 lines
- PASS: format choice present (count: 3)
- PASS: Format in hand-off (count: 1)
- PASS: field count updated (count: 1)
- PASS: format=extension annotations in pipeline (count: 2)

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 5f93ed42 | feat(29-01): add format choice question and hand-off field to vp-init SKILL.md |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — format choice is fully specified. Downstream plan 29-02 will add format-conditional branches to vp-viz, and 29-03 will update vp-create and pre-code-checklist.

## Threat Flags

None — format field is a plain string in a Claude-read markdown doc. Invalid values default to classic per T-29-01 disposition in the plan's threat register.

## Self-Check: PASSED

- [x] `plugins/splunk-viz-packs/skills/vp-init/SKILL.md` exists and has 128 lines
- [x] Commit 5f93ed42 exists in git log
- [x] All 4 grep verification checks pass
