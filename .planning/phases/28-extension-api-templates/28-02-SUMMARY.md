---
phase: 28-extension-api-templates
plan: "02"
subsystem: vp-viz-references
tags: [extension-api, canvas-viz, template, visualization-js]
dependency_graph:
  requires: []
  provides:
    - visualization-js-template.md (Extension API visualization.js generation template)
  affects:
    - plugins/splunk-viz-packs/skills/vp-viz/SKILL.md (consumers load this template during code generation)
tech_stack:
  added: []
  patterns:
    - ESM import wrapper for Canvas 2D Extension API vizs
    - Listener-based state management (data, options, theme, dimensions)
    - Columnar data access (columns[fieldIdx][rowIdx])
key_files:
  created:
    - plugins/splunk-viz-packs/skills/vp-viz/references/visualization-js-template.md
  modified: []
decisions:
  - "package.json and app.conf included as sections within visualization-js-template.md (per D-03 — too small for standalone files)"
  - "VISUAL_LANG placeholder included alongside DARK/LIGHT tokens so check_design.js D01 field is always present"
  - "No-data fallback uses brand textFaint color on bg, not a blank canvas"
metrics:
  duration: "~84 seconds"
  completed: "2026-05-22"
  tasks_completed: 1
  files_created: 1
---

# Phase 28 Plan 02: visualization-js-template.md Summary

ESM Canvas 2D Extension API wrapper template with all 4 listeners, columnar data access, inlined DARK/LIGHT tokens, package.json, and app.conf sections at 298 lines.

## What Was Built

Created `plugins/splunk-viz-packs/skills/vp-viz/references/visualization-js-template.md` — a complete, copy-paste generation template for Extension API Canvas 2D visualizations. The file provides:

1. A full ESM `visualization.js` module template with `VisualizationAPI` import, inlined DARK/LIGHT token placeholders, all utility functions (`safeStr`, `safeNum`, `hexFromSplunk`, `withAlpha`, `lerpColor`), Canvas setup, state object, `render()` with loading gate and no-data fallback, all 4 listener registrations, and drilldown wiring examples.

2. A Classic vs Extension lifecycle comparison table mapping every Classic method to its Extension equivalent.

3. `package.json` template with `@splunk/dashboard-studio-extension` dependency, `esbuild` devDep, and `build`/`dev`/`package` scripts.

4. `app.conf` template with `[package]`, `[launcher]`, `[ui]` stanzas. Note: simpler than Classic — no `[install]` or `[id]` stanzas needed.

5. WRONG/RIGHT patterns table covering the six most common Classic-to-Extension migration mistakes.

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create visualization-js-template.md | 21da2d4 | plugins/splunk-viz-packs/skills/vp-viz/references/visualization-js-template.md |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. The template file uses `{{PLACEHOLDER}}` markers that are intentional fill targets — not data stubs.

## Self-Check: PASSED

- `plugins/splunk-viz-packs/skills/vp-viz/references/visualization-js-template.md` — FOUND
- Commit `21da2d4` — FOUND
- Line count 298 — within 150-350 range
- All 16 verification grep checks — PASS
