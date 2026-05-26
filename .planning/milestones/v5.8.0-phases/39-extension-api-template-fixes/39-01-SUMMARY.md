---
phase: 39-extension-api-template-fixes
plan: "01"
subsystem: splunk-viz-packs/skills/vp-viz/references
tags: [extension-api, template, esbuild, packaging, iife, bare-stanza]
dependency_graph:
  requires: []
  provides:
    - plugins/splunk-viz-packs/skills/vp-viz/references/build-mjs-template.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/package-mjs-template.md
  affects:
    - plugins/splunk-viz-packs/skills/vp-viz/SKILL.md (Plan 2 wires MUST LOAD)
    - plugins/splunk-viz-packs/skills/vp-create/SKILL.md (Plan 2 wires Step 1)
    - plugins/splunk-viz-packs/skills/vp-viz/references/visualization-js-template.md (Plan 2 note rewrite)
tech_stack:
  added: []
  patterns:
    - Verbatim-copy template with {{placeholder}} substitution (existing pattern in references/)
    - WRONG/RIGHT comparison block (existing pattern in conf-templates.md, visualization-js-template.md)
key_files:
  created:
    - plugins/splunk-viz-packs/skills/vp-viz/references/build-mjs-template.md
    - plugins/splunk-viz-packs/skills/vp-viz/references/package-mjs-template.md
  modified: []
decisions:
  - "D-01: New template files referenced from visualization-js-template.md (not embedded inline)"
  - "D-02: Verbatim copy from test42 as source of truth — zero-fix-first-build guarantee"
  - "D-05: WRONG/RIGHT block per finding — located before ## Template heading for awk scope isolation"
metrics:
  duration: "4m"
  completed: "2026-05-23T20:52:53Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 0
---

# Phase 39 Plan 01: Create build-mjs-template.md and package-mjs-template.md Summary

Two new Extension API template files created under `plugins/splunk-viz-packs/skills/vp-viz/references/` — verbatim copies of the proven-working test42 Red Bull build (Phase 36) with brand-specific values replaced by `{{...}}` placeholders and explicit WRONG/RIGHT blocks calling out the three Extension API findings (EF-01 IIFE format, EF-02 bundled extension, EF-03 bare stanza names).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create build-mjs-template.md | d163faf1 | `plugins/splunk-viz-packs/skills/vp-viz/references/build-mjs-template.md` (123 lines) |
| 2 | Create package-mjs-template.md | 6f79cc4a | `plugins/splunk-viz-packs/skills/vp-viz/references/package-mjs-template.md` (275 lines) |

## Files Created

### build-mjs-template.md (123 lines)

Verbatim copy of `tests/test42_redbull/redbull_sports_ext/build.mjs` (91 lines) embedded in a `## Template` javascript fenced block, with:
- `const APP_ID = 'redbull_sports_ext'` replaced by `const APP_ID = '{{APP_ID}}'`
- Line 9 comment corrected from "ESM bundle, @splunk/dashboard-studio-extension kept as external" to "IIFE bundle, @splunk/dashboard-studio-extension bundled into output" (the actual code was already correct; comment was stale)
- WRONG/RIGHT block before `## Template` covering EF-01 (format: iife vs esm) and EF-02 (no external clause)
- Placeholders table and Notes section

### package-mjs-template.md (275 lines)

Verbatim copy of `tests/test42_redbull/redbull_sports_ext/package.mjs` (232 lines) embedded in a `## Template` javascript fenced block, with:
- `const APP_ID = 'redbull_sports_ext'` replaced by `const APP_ID = '{{APP_ID}}'`
- `description = Red Bull Sports Extension API viz pack — ...` replaced by `description = {{PACK_DESCRIPTION}}`
- `label = Red Bull Sports Extension Pack` replaced by `label = {{PACK_LABEL}}`
- `hexToRgb('#DB0032')` (iconColor) replaced by `hexToRgb('{{ACCENT_HEX}}')`
- brandPalette array replaced with `{{PRIMARY_HEX}}`, `{{SECONDARY_HEX}}`, `{{TERTIARY_HEX}}` placeholders and updated comment
- WRONG/RIGHT block before `## Template` covering EF-03 (bare `[${vizName}]` vs prefixed stanza names)
- Cross-reference to conf-templates.md, Placeholders table, Notes section

## Verification Results

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| build-mjs-template.md exists | yes | yes | yes |
| build-mjs-template.md line count | 100-200 | 123 | yes |
| IIFE format in template body | >=1 | 1 | yes |
| No external clause in template body | 0 | 0 | yes (EF-02) |
| {{APP_ID}} placeholder in template body | >=1 | 3 | yes |
| WRONG/RIGHT block in build file | >=2 | 2 | yes |
| ESM bundle in template body | 0 | 0 | yes (stale comment fixed) |
| redbull_sports_ext in template body | 0 | 0 | yes |
| package-mjs-template.md exists | yes | yes | yes |
| package-mjs-template.md line count | 250-450 | 275 | yes |
| Bare stanza pattern | >=1 | 4 | yes (EF-03) |
| Prefixed stanza (WRONG block only) | <=1 | 1 | yes |
| COPYFILE_DISABLE=1 preserved | >=1 | 4 | yes |
| framework_type = studio_visualization | >=1 | 1 | yes |
| allow_user_selection = true | >=1 | 1 | yes |
| redbull_sports_ext in package file | 0 | 0 | yes |

## Deviations from Plan

None — plan executed exactly as written. The two documented changes to build.mjs content ({{APP_ID}} substitution and line 9 comment correction) are the only modifications; all other content is verbatim from test42. The package.mjs substitutions (APP_ID, description, label, iconColor, brandPalette) are exactly as specified.

## Known Stubs

None. Both files are complete template references with no placeholder prose or TODO markers.

## Self-Check: PASSED

- `plugins/splunk-viz-packs/skills/vp-viz/references/build-mjs-template.md` exists at correct path
- `plugins/splunk-viz-packs/skills/vp-viz/references/package-mjs-template.md` exists at correct path
- Commit d163faf1 verified in git log (Task 1)
- Commit 6f79cc4a verified in git log (Task 2)
