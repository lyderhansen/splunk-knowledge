---
name: cv-create
description: "Ports a DESIGN-LOCK.md visual contract into installable Splunk custom viz source code. Make sure to use this skill after cv-sketch, or whenever the user wants to write Splunk custom viz Canvas code from a designed mockup. Three modes: (1) full pipeline — write all vizs in the lock; (2) single-viz iteration — re-render one viz, with natural-language delta support like 'make the gauge segments wider'; (3) standalone — one-shot a single viz from a bare prompt with inline mini-design. Outputs ES5 Canvas viz source, formatter HTML, theme.js, and demo CSVs. Both Classic AMD and Extension API formats. Light + dark themes are independent render paths."
---

# cv-create — port DESIGN-LOCK.md to Splunk Canvas code

This skill is purely a translator. It does not invent designs. The HTML mockup in DESIGN-LOCK.md.vizs[].visual_reference_html is the visual contract — your Canvas code must reproduce it, not reimagine it.

## Before you start — MANDATORY reading

Before writing any code, read these two files in order. They are the source of truth for what works in Splunk; deviating from them produces silent failures that ship to users.

1. **`../../KNOWN-CORRECTIONS.md`** (12 corrections, plugin root) — production-discovered bugs that override anything in reference docs. Every correction lists the symptom, the fix, and the validator check (when applicable).
2. **`../../references/splunk-viz-canon.md`** (1047 lines, 26 rules, plugin root) — the canonical Splunk Canvas 2D viz knowledge base. Independently battle-tested. KNOWN-CORRECTIONS references these rules by number (e.g. "Correction #7 enforces Rule 19").

If you remember these from a previous session, re-read them anyway — they change.

## Prerequisite

A `DESIGN-LOCK.md` file in `.cv/<app_id>/`. If missing, you're in standalone mode — see [references/standalone-mode.md](references/standalone-mode.md).

## Three modes

| Mode | Trigger | Behavior |
|---|---|---|
| Full pipeline | `cv-create` after `cv-sketch` ran | Generate all vizs in DESIGN-LOCK.md |
| Single-viz iteration | `cv-create --viz <name> [instruction]` or natural language | Re-render one viz; supports natural-language deltas |
| Standalone | `cv-create` with no lock file present | Run inline mini-Stage-A, synthesize one-viz lock, write one viz + minimal scaffold |

This SKILL.md covers full-pipeline mode. Iteration is in [references/iteration-mode.md](references/iteration-mode.md). Standalone is in [references/standalone-mode.md](references/standalone-mode.md).

## Full-pipeline workflow

```
Step 1: Load DESIGN-LOCK.md
Step 2: Generate shared/theme.js (mechanical transcription)
Step 3: For each viz: emit boilerplate + write _renderDark/_renderLight + formatter.html
Step 4: If format=extension or both: also emit config.json + ESM visualization.js
Step 5: Copy demo CSVs from .cv/<app_id>/lookups/ into <app_id>/lookups/
Step 6: Hand off to cv-build
```

## Step 1 — Load DESIGN-LOCK.md

Read `.cv/<app_id>/DESIGN-LOCK.md`. Parse the YAML. Verify required fields:

- `project.app_id`, `project.format`
- `global.palette_dark`, `global.palette_light`, `global.typography`
- `global.commitments`
- `dashboard.canvas`, `dashboard.panels`
- `vizs[]` is non-empty
- Every viz has `visual_spec` and `visual_reference_html`

If validation fails, report which field is missing and stop. Do not write partial output.

## Step 2 — Generate `shared/theme.js`

This is mechanical transcription. No creative work. Read [references/theme-emission.md](references/theme-emission.md) for the exact template.

The theme.js exports:

- `DARK` object with all keys from `global.palette_dark`
- `LIGHT` object with all keys from `global.palette_light` (independent, not derived)
- `FONTS` object with base64-embedded display + mono fonts
- Helpers: `withAlpha`, `lerpColor`, `getSeriesColor`, `getSpacing`, `getTypoScale`, `tintNeutral`
- `getTheme(mode)` that returns `DARK` or `LIGHT`

Write to `<app_id>/shared/theme.js`.

## Step 3 — Write each viz

For each viz in `DESIGN-LOCK.md.vizs[]`:

### 3a. Emit boilerplate + MANDATORY annotation pair

```bash
node ${CLAUDE_SKILL_PLUGIN_DIR}/../../scripts/boilerplate_emit.js <viz_name> <app_id>.<viz_name> > <app_id>/appserver/static/visualizations/<viz_name>/src/visualization_source.js
```

This writes the compliance scaffolding (initialize, formatData, getInitialDataParams, destroy, reflow, helpers, updateView's dispatch to _renderDark/_renderLight). The `_renderDark` and `_renderLight` functions are empty stubs with TODO comments.

**Then prepend BOTH annotation lines to the source file** (line 1 + line 2):

```javascript
// @viz-type: <primitive>            ← data primitive — Tier 1b fallback
// @preview-layout: <layout-name>    ← compositional shape — Tier 1a, REQUIRED
var SplunkVisualizationBase = require("api/SplunkVisualizationBase");
```

**`@preview-layout` is MANDATORY for every viz**, not optional. The preview generator routes layouts to composition-specific renderers that mirror the actual viz's visual fingerprint. Falling back to a primitive (`@viz-type` only) produces generic "template" previews that don't reflect what the viz actually looks like, regressing to the failure mode that motivated Correction #14.

**Pick a layout from `LAYOUT_DISPATCH`** in `scripts/generate_previews.py`. Current library (v6.0.7):

| Layout | When to use | Visual fingerprint |
|---|---|---|
| `kpi-ratio-footer` | KPI showing X/Y ratio + delta + sparkline + footer stats | active_collars-style |
| `composite-stack` | Subject ID + multiple stacked mini time-series rows | mc01_composite-style |
| `heatmap-with-marks` | Heatmap grid + highlighted hot cells + corner direction marker | species_grid-style |
| `timeline-with-alert` | Multi-lane timeline + ONE bright accent alert pin | patrol_coverage-style |
| `bars-with-target` | Bars + horizontal target line + value above tallest bar | funding/quota-tracker style |
| `gauge-with-stats` | Gauge arc + 3 mini stat tiles below | SLO/health panel style |
| `line-with-band` | Line chart + faint normal-range band + accent dot on outlier | physiological/anomaly style |

Each layout has synonyms (e.g. `kpi-ratio` / `ratio-footer` / `kpi-ratio-footer` all map to the same renderer). See `LAYOUT_DISPATCH` for the full list.

**If no existing layout fits**, propose a new one rather than falling back to a primitive. Add the renderer to `scripts/generate_previews.py` following the `_seed`/`_pick_primary`/`_label_band` pattern of the existing layouts. Document it as an addition to KNOWN-CORRECTIONS.md #14.

See [[composite-preview-standard]] memory + KNOWN-CORRECTIONS.md #14 for the full rationale.

### 3b. Fill `_renderDark` and `_renderLight`

This is where your full attention goes. Read [references/canvas-port-rules.md](references/canvas-port-rules.md) for the six fidelity rules.

For each viz:

1. **Read `visual_reference_html` from DESIGN-LOCK.md.** Re-read it before writing code. Do NOT paraphrase from memory.

2. **Paste the dark theme CSS block as a comment ABOVE `_renderDark`** in the source file. This is your visual contract while writing the Canvas code.

3. **Translate CSS to Canvas:**
   - `linear-gradient(180deg, #00D26A, #008844)` → `var grad = ctx.createLinearGradient(0, y, 0, y + h); grad.addColorStop(0, "#00D26A"); grad.addColorStop(1, "#008844");`
   - `filter: drop-shadow(0 0 16px rgba(0,210,106,0.3))` → `ctx.shadowBlur = 16; ctx.shadowColor = "rgba(0,210,106,0.3)";`
   - `animation: breathe 3s ease-in-out infinite` → `requestAnimationFrame` loop with 3000ms cycle, easing function
   - `border-radius: 8px` → custom `roundRect` helper

4. **Do the same for `_renderLight`** with the light-theme CSS block. Light is a DIFFERENT code path — it skips effects that don't work on light (per `visual_spec.fills.background_light`).

5. **Re-read `global.commitments.anti_references`** before each viz starts. This prevents drift into AI defaults mid-pack.

### 3c. Write `formatter.html`

Generate from `visual_spec`. Read [references/formatter-emission.md](references/formatter-emission.md) for the per-control templates.

Required for every viz:

- Section structure: three standard sections only — `Data configurations`, `Data display`, `Color and style` (exact labels, case-sensitive). Effect/animation toggles go inside Color and style — adding an "Effects" section creates duplicate prefixed groups in Dashboard Studio.
- `{{VIZ_NAMESPACE}}.<key>` in all `name=` attributes
- `value=` not `default=` on all inputs
- `<splunk-color-picker type="custom">` for all color pickers
- `themeMode` default `"auto"`
- Minimum 10 controls; per-viz options derived from `visual_spec.effects`, `visual_spec.geometry`, etc.

### 3d. Write `visualization.css`

One line:

```css
.<app_id>-<viz_name>-viz { background: transparent; }
```

## Step 4 — Extension API branch (conditional)

If `project.format == "extension"` or `"both"`:

Also produce for each viz:

- `<app_id>/appserver/static/visualizations/<viz_name>/src/visualization.js` (ESM, uses `addDataSourcesListener`, `addThemeListener`, `triggerDrilldown`)
- `<app_id>/appserver/static/visualizations/<viz_name>/config.json` (`optionsSchema` + `editorConfig`)

The `_renderDark` and `_renderLight` functions are the SAME content as Classic — only the module syntax and data-access glue differ. Read [references/extension-api.md](references/extension-api.md) for the ESM-specific patterns.

## Step 5 — Copy demo data

```bash
cp .cv/<app_id>/lookups/*.csv <app_id>/lookups/
```

Ensure the destination filenames match what `inputlookup` will reference: `<app_id>_demo_<viz_name>.csv`.

## Step 6 — Hand off

```
Source files written to <app_id>/. Now load cv-build to validate and package.
```

In full pipeline mode, cv-build is auto-invoked after cv-create. In iteration / standalone mode, cv-build runs manually.

## What cv-create does NOT do

- ❌ Does not run validate.sh (cv-build)
- ❌ Does not run build_flat.js (cv-build calls it)
- ❌ Does not write dashboard.xml (cv-build transcribes it from DESIGN-LOCK.md)
- ❌ Does not generate icons / gradient PNGs (cv-build)
- ❌ Does not package or tar (cv-build)
- ❌ Does not invent visuals (the lock is the contract)

## References

- [Canvas port rules](references/canvas-port-rules.md) — the six fidelity rules (test44 fix at the code level)
- [Theme emission](references/theme-emission.md) — exact theme.js template
- [Formatter emission](references/formatter-emission.md) — per-control HTML templates
- [Iteration mode](references/iteration-mode.md) — natural-language delta interpretation, state-back-and-confirm
- [Standalone mode](references/standalone-mode.md) — bare-prompt one-shot
- [Extension API branch](references/extension-api.md) — ESM patterns, config.json schema
