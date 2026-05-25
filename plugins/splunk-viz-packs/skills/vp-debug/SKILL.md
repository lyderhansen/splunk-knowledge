---
name: vp-debug
description: "Diagnostic reference for Splunk custom viz failures — 54 rules organized by severity (fatal, broken, rejected, cosmetic) plus error diagnosis flowchart. Loaded automatically when editing viz source files."
when_to_use: "Use when a viz fails to load, renders incorrectly, or validate_viz.sh reports errors. Triggers on 'viz broken', 'script error', 'debug viz', 'why does my viz', 'formatter not working', 'blank panel'."
paths: "*/visualizations/*/visualization_source.js, */visualizations/*/formatter.html"
---

# vp-debug — diagnostic reference for viz failures

These 54 rules were learned from real bugs across 30+ shipped viz apps. They explain WHY things fail and HOW to fix them.

**For code GENERATION, use vp-viz** — it has all rules baked into the templates. This skill explains the reasoning behind those rules.

## When to load

- A viz fails to load (placeholder icon, Script error)
- A viz renders incorrectly (wrong colors, wrong size, blank)
- validate_viz.sh reports failures
- You need to understand WHY a pattern is required

## Error diagnosis flowchart

```
Viz shows placeholder icon (bar chart in grey box)
├── Console: "Script error for .../visualization.js"
│   ├── File not found? → F9 (wrong directory)
│   ├── Webpack IIFE? → F11 (use flat AMD)
│   ├── jQuery used? → F10 (no $el in DS v2)
│   └── Double AMD wrapper? → F6 (source uses define())
├── Console: "Unknown output mode: undefined"
│   ├── getInitialDataParams missing? → F4 (required method)
│   └── outputMode as property? → F4 (must be in method)
├── Console: "X is not a function"
│   ├── _render? → C6 (wrong method name in reflow)
│   ├── addClass? → F10 (jQuery)
│   └── constructor? → F7 (must use extend object literal)
├── No console errors but blank
│   ├── setupCanvas with wrapper div? → B17
│   ├── this.el has width/height set? → B17
│   ├── formatData returns null? → B15
│   └── Canvas dimensions 0×0? → B17
├── Values show "null" or "undefined" → B21
├── Timestamps show "Jan 1" or "Invalid Date" → B19
├── Wrong theme (dark on light) → B20
├── Background color shows dark bg in light mode → THM-05 (opt('backgroundColor') inside dark branch only — see theme-template.md THM-05)
├── Gauge/arc overflows panel → B8
├── Formatter settings have no effect → B10 (VIZ_NAMESPACE)
├── Settings appear but don't save → B7 (value= not default=)
├── Color picker ignored → B5 (type="custom" required)
└── Changes not taking effect → C8 (build number + hard refresh)
```

**Console noise to IGNORE** (Splunk framework, not your bugs):
- `SecurityError: Failed to read 'cookie'` — sandboxed iframe
- `Content Security Policy directive 'img-src'` — Splunk CSP
- `502 Connection refused` on `orchestrator/v1/spl2/enabled`

## Rule index — 54 rules by severity

### FATAL — viz won't load (F1-F12)
See [references/fatal-rules.md](references/fatal-rules.md)

| Rule | Summary |
|---|---|
| F1 | Webpack must target ES5 |
| F2 | Fonts must be base64 data URIs |
| F3 | Source must be pure ES5 |
| F4 | getInitialDataParams must use ROW_MAJOR_OUTPUT_MODE |
| F5 | Only externalize what you import |
| F6 | Source MUST use require(), NEVER define() |
| F7 | MUST use extend({...}) object literal |
| F8 | Images must be bundled, never external URLs |
| F9 | Vizs in appserver/static/visualizations/, NOT default/ |
| F10 | No jQuery — use standard DOM APIs |
| F11 | Webpack 5 IIFE may fail — flat AMD alternative |
| F12 | Formatter must use Splunk components, never raw HTML |

### BROKEN — renders but wrong (B1-B23)
See [references/broken-rules.md](references/broken-rules.md)

| Rule | Summary |
|---|---|
| B1 | Canvas font rendering requires explicit wait |
| B2 | HiDPI canvas scaling is mandatory |
| B3 | getOption helper is mandatory |
| B4 | Never read config in formatData |
| B5 | Formatter section labels + type="custom" on color picker |
| B6 | Canvas shadow state leaks |
| B7 | JS defaults must match formatter value= (NEVER default=) |
| B8 | Auto-scale by default + gauge arc constraint |
| B9 | Dashboard Studio type format |
| B10 | {{VIZ_NAMESPACE}} in formatter — NEVER hardcoded namespace |
| B11 | parseFloat truncates string values |
| B12 | Gauge colors must match brand |
| B13 | Canvas background must use clearRect |
| B14 | Variables in _draw() not accessible from sub-methods |
| B15 | Always include formatData in extend object |
| B16 | Every visual property configurable via formatter |
| B17 | setupCanvas MUST use this.el with clientWidth |
| B18 | Theme auto-detect via getCurrentTheme() |
| B19 | new Date() fails in sandboxed iframe |
| B20 | Theme MUST default to 'auto' with detectTheme() |
| B21 | Always null-guard before String() conversion |
| B22 | hexFromSplunk — color picker returns integers not hex |
| B23 | Light theme needs independent design, not dark inversion |

### REJECTED — fails AppInspect (R1-R8)
See [references/rejected-rules.md](references/rejected-rules.md)

### INTERACTIVE + COSMETIC (I1-I2, C1-C9)
See [references/interactive-cosmetic.md](references/interactive-cosmetic.md)

## Quick fix lookup

| Symptom | Most likely rule |
|---|---|
| Script error on load | F9, F6, F11 |
| Blank panel, no errors | B17, B15 |
| Settings don't save | B10, B7 |
| Wrong colors in light mode | B20, B18, B23 |
| Color picker ignored in ad-hoc | B22 |
| Text invisible in light theme | B23 |
| "null" visible in text | B21 |
| Gauge overflows panel | B8 |
| Timestamps wrong | B19 |
| AppInspect failure | R1-R8 |
| Background color wrong in light mode | THM-05 / B23 — check `opt('backgroundColor')` read unconditionally, not inside dark branch (see theme-template.md THM-05) |
| FAIL E01-E05 (Extension API config/viz failure) | validate_viz.sh E-codes — check config.json optionsSchema + visualization.js addDataSourcesListener |
| FAIL A01-A02 (preview.png missing or wrong size) | run `python3 generate_previews.py` (116x76) — see vp-create Step 3b |
| FAIL A03-A04 (appIcon.png missing or wrong size) | run `node generate_assets.js` — see vp-create Step 3b |
| Animation has no effect | AF-01 — `opt()` called inside a helper; pass computed values as params (see animation-recipes.md AF-01) |

> **Scope note (W-20):** `check_design.js` (D01-D11 codes) validates `formatter.html` only. Extension API vizs (`visualization.js`) bypass D01-D11 checks entirely — if a D-code appears missing for an Extension viz, that is expected behavior, not a doc gap. Verify Extension API correctness via E01-E05 codes from `validate_viz.sh`.
