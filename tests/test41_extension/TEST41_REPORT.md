# Test 41: Extension API End-to-End Build Report

**Date:** 2026-05-22
**Node.js version:** v25.9.0
**npm version:** 11.12.1

---

## Scaffold Method

**Manual scaffold** (per plan D-02 fallback rule). No `@splunk/create` CLI used — the project
structure was hand-built following `visualization-js-template.md` and `config-json-template.md`
specifications exactly. `@splunk/dashboard-studio-extension` was publicly available on npm and
installed successfully.

---

## Viz Inventory

| Viz Name | Type | Canvas Technique |
|----------|------|-----------------|
| kpi_tile | Single-value KPI tile | Linear gradient value bg, rounded card, delta arrow |
| horizontal_bar | Multi-row horizontal bar chart | Per-row gradient fills, label truncation, bar tracks |
| ring_gauge | Arc-rendering ring gauge | Conical gradient arc, zone-based coloring (danger/warn/success), glow tip |

All 3 vizs use: ESM import of `VisualizationAPI`, all 4 listeners (data/options/theme/dimensions),
inlined `DARK`/`LIGHT` token objects, Canvas 2D rendering, click drilldown via `triggerDrilldown`.

---

## npm install Results

```
@splunk/dashboard-studio-extension  — INSTALLED (latest, public on npmjs.com)
esbuild                             — INSTALLED (latest)
added 3 packages, audited 4 packages in 2s
found 0 vulnerabilities
```

---

## Build Results (node build.mjs)

All 3 vizs bundled with esbuild (format: esm, external: @splunk/dashboard-studio-extension):

| Viz | Output Size | Status |
|-----|-------------|--------|
| kpi_tile | 7.5 KB | Built |
| horizontal_bar | 7.0 KB | Built |
| ring_gauge | 7.3 KB | Built |

Stage directory: `stage/ext_api_test_pack/appserver/static/visualizations/{viz}/`
Each viz output contains: `visualization.js` (ESM bundle) + `config.json` (copied)

---

## validate_viz.sh Results

**Run:** `bash plugins/splunk-viz-packs/skills/vp-viz/scripts/validate_viz.sh tests/test41_extension/ext_api_test_pack/stage/ext_api_test_pack`

**Final result after package.mjs generated structure files:**

```
============================================
  Viz Pack Validator
============================================

--- Extension API: horizontal_bar ---
  OK

--- Extension API: kpi_tile ---
  OK

--- Extension API: ring_gauge ---
  OK

--- JS (bundle): horizontal_bar ---
  WARN B17: 1 getBoundingClientRect usage (OK if only in mouse handlers)
  OK

--- JS (bundle): kpi_tile ---
  OK

--- JS (bundle): ring_gauge ---
  OK

--- Structure ---
[all structure checks PASS after package.mjs run]

--- Dashboard XML ---
[no dashboard XML files]

--- Contrast Check ---
  SKIP: shared/theme.js not found or Node.js unavailable

--- Design Quality Gate ---
[no Classic formatter.html files to check]

============================================
  ALL CHECKS PASSED
```

### E01-E05 Results (all 3 vizs)

| Check | Description | kpi_tile | horizontal_bar | ring_gauge |
|-------|-------------|----------|----------------|------------|
| E01 | config.json has optionsSchema + editorConfig | PASS | PASS | PASS |
| E02 | visualization.js ESM import, no AMD define | PASS | PASS | PASS |
| E03 | addDataSourcesListener present | PASS | PASS | PASS |
| E04 | columns[ access present | PASS | PASS | PASS |
| E05 | no formatter.html alongside config.json | PASS | PASS | PASS |

**B17 WARN (horizontal_bar):** `getBoundingClientRect` used in the click handler for bar
hit-testing — this is the documented OK case (only in mouse handlers, not for canvas sizing).

---

## score_design.js Results

```
SCORE [kpi_tile]:       50/100 (gradient: 20, typography: 10, spacing: 5, color: 15, animation: 0)
SCORE [horizontal_bar]: 50/100 (gradient: 10, typography: 20, spacing: 5, color: 15, animation: 0)
SCORE [ring_gauge]:     55/100 (gradient: 10, typography: 20, spacing: 5, color: 20, animation: 0)
```

Note: score_design.js was run with visualization.js passed as both args (source and theme file),
since Extension API vizs inline DARK/LIGHT tokens — there is no separate `shared/theme.js`.
Animation score is 0 for all vizs as test pack targets functional correctness over animation polish.

---

## .spl Verification

### File Info

```
dist/ext_api_test_pack.spl — 7,598 bytes (7.4K)
Created with: COPYFILE_DISABLE=1 tar czf ... (macOS resource fork protection)
```

### Internal Structure

```
ext_api_test_pack/
  appserver/static/visualizations/
    kpi_tile/
      visualization.js    (ESM bundle, 7.5KB)
      config.json
      preview.png         (116x76 px, brand teal #4ECDC4)
    horizontal_bar/
      visualization.js    (ESM bundle, 7.0KB)
      config.json
      preview.png         (116x76 px, brand blue #45B7D1)
    ring_gauge/
      visualization.js    (ESM bundle, 7.3KB)
      config.json
      preview.png         (116x76 px, brand mint #96CEB4)
  default/
    app.conf              (5 stanzas: package, launcher, ui, install, triggers)
    visualizations.conf   (framework_type=studio_visualization x3)
    data/ui/nav/
      default.xml
  static/
    appIcon.png           (36x36 px, brand teal #4ECDC4)
  metadata/
    default.meta
  README/
    savedsearches.conf.spec
```

### framework_type Verification

```
framework_type = studio_visualization    (kpi_tile)
framework_type = studio_visualization    (horizontal_bar)
framework_type = studio_visualization    (ring_gauge)
```

All 3 vizs correctly declare `framework_type = studio_visualization`.

### File Count Verification

| Expected | Actual |
|----------|--------|
| 3 x config.json | 3 found |
| 3 x visualization.js | 3 found |
| 3 x preview.png (116x76) | 3 found |
| 1 x appIcon.png (36x36) | 1 found |

---

## Classic Pattern Leak Check

| Check | Result |
|-------|--------|
| formatter.html in .spl | NONE — PASS |
| `define([` (AMD) in src/*.js | NONE — PASS |
| `ROW_MAJOR` or `data.rows[` in src/*.js | NONE — PASS |
| `this.el` or `SplunkVisualizationBase` in src/*.js | NONE — PASS |

Zero Classic patterns detected in source or bundle.

---

## D-03 Verification Checklist

| # | Check | Status |
|---|-------|--------|
| 1 | `node package.mjs` produces `.spl` in `dist/` | **PASS** — 7,598 bytes |
| 2 | `.spl` has `framework_type=studio_visualization` for all vizs | **PASS** — all 3 vizs |
| 3 | Each viz has `config.json` + `visualization.js` inside `.spl` | **PASS** — 3 of each |
| 4 | `validate_viz.sh` E01-E05 pass; `score_design.js` outputs scores | **PASS** — all E01-E05 pass; scores 50/50/55 |
| 5 | No Classic patterns leak | **PASS** — zero AMD/formatter/ROW_MAJOR patterns |

**Overall: 5/5 PASS**

---

## Notes and Observations

1. **`@splunk/dashboard-studio-extension` is publicly available on npm** — no Splunk auth
   required. The package installs cleanly and was used as a runtime external in the esbuild
   bundle (not bundled in — resolved by Splunk's runtime environment).

2. **Package script uses `COPYFILE_DISABLE=1`** — prevents macOS resource fork files (._*)
   from entering the archive, which would break Splunk's `splunk install app` command.

3. **preview.png uses proper solid-color 116x76 PNG** — generated with raw Buffer + zlib,
   no external PNG library needed. Files are 218-220 bytes, well above the 100-byte threshold
   required by validator check A01.

4. **appIcon.png is 36x36** — correct dimensions for Splunk's app icon display.

5. **build.mjs uses esbuild ESM format** — each viz produces an ESM bundle with
   `@splunk/dashboard-studio-extension` kept external, matching the Extension API deployment model.

6. **The B17 getBoundingClientRect warning** is expected and documented as OK in the validator
   code — used only in the horizontal_bar click handler for mouse hit-testing, not for canvas sizing.
