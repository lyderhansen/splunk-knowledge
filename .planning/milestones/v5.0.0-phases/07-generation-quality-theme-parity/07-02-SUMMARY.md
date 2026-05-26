---
phase: "07"
plan: "02"
subsystem: vp-viz/references
tags: [formatter, html-templates, section-structure, accentIntensity, Effects, CFG-07, D-03, D-07, D-11, D-12, D-13]
dependency_graph:
  requires:
    - "07-01"
  provides:
    - formatter-patterns.md 4-section structure template
    - accentIntensity template in Color and style section
    - Effects section scaffold with mood-effect toggles
    - Full 12-control KPI formatter example
  affects:
    - plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md
tech_stack:
  added: []
  patterns:
    - "4-section formatter: Data configurations, Data display, Color and style, Effects"
    - "accentIntensity text-input with help text (D-07 — glow/shadow only)"
    - "Effects section with showAmbientLight, showVignette, showGlow toggles"
    - "CFG-07 vs D-03 reconciliation — accentColor only, no fontColor/bgColor"
key_files:
  created: []
  modified:
    - plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md
decisions:
  - "D-12 enforced: minimum 4 sections (was 3); Effects section uses exact label 'Effects'"
  - "D-07 enforced: accentIntensity controls glow and shadow only (not all mood effects)"
  - "D-13 enforced: help= on non-obvious controls only (accentIntensity, effect toggles)"
  - "D-03 takes precedence over CFG-07: no fontColor/bgColor formatter controls; accentColor alone satisfies CFG-07"
  - "D-11 enforced: hybrid grouping — data fields first, appearance clustered by effect"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-16"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 1
---

# Phase 7 Plan 02: Formatter Patterns 4-Section Structure Summary

formatter-patterns.md updated to document 4-section structure with accentIntensity template, Effects section scaffold, and a full 12-control KPI example replacing the prior 3-section 7-control version.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update section structure prose and scaffold to 4 sections | 13137c8 | formatter-patterns.md |
| 2 | Replace full formatter example with 4-section 10+ control KPI | b920b9b | formatter-patterns.md |

## What Was Built

### Task 1: Section Structure Update

Updated `formatter-patterns.md` with five targeted changes:

1. **Section count prose**: "Every viz gets 3 sections" changed to "Every viz gets a minimum of 4 sections"
2. **Effects section added** to numbered list: individual mood effect toggles (showAmbientLight, showVignette, showGlow, showGlassPanel), all defaulting to "true"
3. **Casing table updated**: Added "Effects" row alongside the existing 3 section-label rows
4. **Section scaffold extended**: Fourth `<form>` element with `section-label="Effects"` and comment listing the mood-effect control names
5. **accentIntensity template added**: New `### Accent intensity` template in the templates section — `splunk-text-input` with `value="50"` and `help="Glow and shadow strength (0=off, 100=full)"` (D-07)
6. **WRONG pattern added**: `fontColor or bgColor controls` documented as WRONG with explanation that D-03 takes precedence over CFG-07; only `accentColor` is a viz formatter color control
7. **D-13 help text rule**: Single sentence added after section structure list explaining help text belongs only on non-obvious controls

### Task 2: Full Formatter Example Replacement

Replaced the 3-section 7-control KPI example with a 4-section 12-control version:

- **Section 1 — Data configurations** (2 controls): `valueField`, `deltaField`
- **Section 2 — Data display** (4 controls): `label`, `unit`, `decimals`, `showDelta`
- **Section 3 — Color and style** (3 controls): `themeMode` (value="auto"), `accentColor` (type="custom"), `accentIntensity` (value="50")
- **Section 4 — Effects** (3 controls): `showAmbientLight`, `showVignette`, `showGlow`

All controls use `value=` (not `default=`). Color picker uses `type="custom"`. All `name=` attributes use `{{VIZ_NAMESPACE}}` prefix.

## Verification Results

| Check | Result |
|-------|--------|
| `wc -l formatter-patterns.md` | 247 lines (under 500) |
| `grep -c 'section-label'` | 11 occurrences (>= 4 required) |
| `grep 'section-label="Effects"'` | 2 matches (scaffold + full example) |
| `grep 'accentIntensity'` | 4 matches including splunk-text-input block |
| `grep -c 'default='` | 1 match — only in WRONG patterns doc example, not a control |
| `grep 'type="custom"'` | 4 matches including actual color picker in full example |

## Deviations from Plan

None — plan executed exactly as written.

The 1 occurrence of `default=` in the verification grep was pre-existing content in the WRONG patterns documentation block (`WRONG: default="value" → MUST be value="value"`). This is the prohibition example, not a use of the pattern. No formatter controls in the file use `default=`.

## Known Stubs

None — all controls in the full example have concrete `value=` defaults matching real column names or meaningful defaults (value="50" for accentIntensity, value="auto" for themeMode, value="true"/"false" for radio toggles).

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary changes. The file is a Markdown skill reference document.

## Self-Check: PASSED

- [x] `plugins/splunk-viz-packs/skills/vp-viz/references/formatter-patterns.md` exists and was modified
- [x] Commit `13137c8` exists (Task 1)
- [x] Commit `b920b9b` exists (Task 2)
- [x] File is 247 lines (under 500)
- [x] section-label="Effects" present in both scaffold and full example
- [x] accentIntensity text-input template present with value="50" and help text
- [x] CFG-07 vs D-03 reconciliation documented in WRONG patterns
- [x] D-13 help text rule sentence added
- [x] Full example has 4 sections and 12 splunk-control-group elements
