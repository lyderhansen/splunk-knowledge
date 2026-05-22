---
phase: 33-test-build
plan: 01
subsystem: testing
tags: [extension-api, test-build, validation, canvas, esbuild, spl]
dependency_graph:
  requires:
    - 28-01 (visualization-js-template.md)
    - 28-02 (config-json-template.md)
    - 31-01 (validate_viz.sh E01-E05 checks)
    - 31-02 (.spl structure verification patterns)
  provides:
    - ext_api_test_pack .spl with 3 validated Extension API vizs
    - Proof that dual-format pipeline works end-to-end
  affects:
    - v5.6.0 release confidence (TB-01 requirement)
tech_stack:
  added:
    - esbuild (ESM bundler for Extension API vizs)
    - "@splunk/dashboard-studio-extension (publicly available on npm)"
  patterns:
    - ESM module with VisualizationAPI four-listener pattern
    - buildSolidPng() pure Node.js PNG generation (no external lib)
    - COPYFILE_DISABLE=1 tar packaging for macOS resource fork safety
key_files:
  created:
    - tests/test41_extension/ext_api_test_pack/visualizations/kpi_tile/src/visualization.js
    - tests/test41_extension/ext_api_test_pack/visualizations/kpi_tile/config.json
    - tests/test41_extension/ext_api_test_pack/visualizations/horizontal_bar/src/visualization.js
    - tests/test41_extension/ext_api_test_pack/visualizations/horizontal_bar/config.json
    - tests/test41_extension/ext_api_test_pack/visualizations/ring_gauge/src/visualization.js
    - tests/test41_extension/ext_api_test_pack/visualizations/ring_gauge/config.json
    - tests/test41_extension/ext_api_test_pack/package.json
    - tests/test41_extension/ext_api_test_pack/package/app/app.conf
    - tests/test41_extension/ext_api_test_pack/build.mjs
    - tests/test41_extension/ext_api_test_pack/package.mjs
    - tests/test41_extension/TEST41_REPORT.md
  modified: []
decisions:
  - "@splunk/dashboard-studio-extension is publicly available on npm — no Splunk auth required for install"
  - "Manual scaffold used (no @splunk/create CLI) per plan D-02 fallback — produces identical structure"
  - "preview.png generated with raw Buffer + Node.js zlib — no PNG library dependency needed"
  - "Build uses esbuild ESM format with @splunk/dashboard-studio-extension as external — correct for Splunk runtime resolution"
  - ".gitignore excludes stage/ and dist/ from the test project — generated artifacts only"
metrics:
  duration_minutes: 8
  tasks_completed: 2
  tasks_total: 2
  files_created: 11
  files_modified: 0
  completed_date: "2026-05-22"
---

# Phase 33 Plan 01: Extension API End-to-End Build Summary

**One-liner:** 3-viz Extension API test pack (KPI tile, horizontal bar, ring gauge) built with esbuild, validated E01-E05, packaged to .spl with framework_type=studio_visualization — all D-03 checks pass.

## What Was Built

### ext_api_test_pack Project

A complete manually-scaffolded Extension API viz pack at `tests/test41_extension/ext_api_test_pack/` containing:

- **3 vizs** with ESM `visualization.js` (Canvas 2D) + `config.json` (optionsSchema + editorConfig)
- **build.mjs** — esbuild bundler (ESM format, @splunk/dashboard-studio-extension external)
- **package.mjs** — stages app structure, generates visualizations.conf + structural files, creates .spl

### Viz Details

| Viz | Canvas Technique | Options |
|-----|-----------------|---------|
| kpi_tile | Linear gradient value bg, rounded card panel, optional delta arrow | label, decimals, showDelta, accentColor, accentIntensity |
| horizontal_bar | Per-row gradient bar fills, track bg, label truncation | maxBars, barHeight, showValues, series1Color, series2Color |
| ring_gauge | Arc rendering with zone gradient (danger→warn→success), glow tip | minValue, maxValue, arcWidth, showLabel, accentColor |

All 3 vizs share: VisualizationAPI import, DARK/LIGHT inlined tokens (blue/teal brand), all 4 listeners, click drilldown via triggerDrilldown.

## Task Results

### Task 1: Scaffold (commit abab96de)

All 8 source files created with correct Extension API patterns. Verification: PASS.

### Task 2: Build, Validate, Package (commit 72ade23b)

| Step | Result |
|------|--------|
| npm install | PASS — both @splunk/dashboard-studio-extension and esbuild installed |
| node build.mjs | PASS — 3 vizs bundled (7.0-7.5KB each) |
| validate_viz.sh E01-E05 | PASS — all 3 vizs OK |
| validate_viz.sh ALL CHECKS | PASS |
| node package.mjs | PASS — dist/ext_api_test_pack.spl created (7,598 bytes) |
| .spl framework_type | PASS — studio_visualization x3 |
| .spl file counts | PASS — 3x config.json, 3x visualization.js |
| Classic pattern leak check | PASS — zero AMD/formatter/ROW_MAJOR patterns |
| score_design.js | 50/50/55 (informational) |

### D-03 Checklist (5/5 PASS)

1. `node package.mjs` produces `.spl` in `dist/` — **PASS**
2. `.spl` has `framework_type=studio_visualization` — **PASS** (all 3 vizs)
3. Each viz has `config.json` + `visualization.js` — **PASS**
4. `validate_viz.sh` E01-E05 pass + score_design.js outputs scores — **PASS**
5. No Classic patterns leak — **PASS**

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Notes

- `@splunk/dashboard-studio-extension` was publicly available on npm, so the `npm install` fallback
  (esbuild-only) was not needed.
- The plan verification command used `unzip -l` for .spl inspection; however .spl files are tar.gz
  (not zip) archives. Verification was performed with equivalent `tar tzf` and `tar xzOf` commands —
  same data, correct format.
- B17 WARN in horizontal_bar is expected: `getBoundingClientRect` is used only in the click handler
  for mouse hit-testing, not for canvas sizing (the documented OK case).

## Known Stubs

**preview.png** files are solid-color placeholders (116x76 px, brand palette colors, >100 bytes —
passing A01/A02 validator checks). These are intentional test artifacts. Production viz packs should
use generate_assets.js to produce proper gradient preview images.

## Threat Flags

None. All files are local test artifacts with no network endpoints, auth paths, or trust boundary changes.

## Self-Check: PASSED

All 12 required files confirmed present. Both task commits (abab96de, 72ade23b) verified in git log.
