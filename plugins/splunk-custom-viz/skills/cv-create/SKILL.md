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
Step 3: Emit one viz at a time — for each viz: boilerplate (bash) → Edit _renderDark body → Edit _renderLight body → Write formatter.html → Write visualization.css → per-viz checkpoint → log progress
Step 4: If format=extension or both: also emit config.json + ESM visualization.js (same chunked sequence)
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

## Step 3 — Emit one viz at a time

Each viz is emitted as a discrete sequence of small, sentinel-anchored tool calls instead of one large Write. This is the fix for the mid-file hangs observed on 700-800 line viz source files (test48 polestar pack: motor telemetry 816 lines, charging timeline 720 lines, fleet health 691 lines). The previous "compose 700-line source file in memory then Write once" pattern is the failure mode being replaced; each tool call below is bounded.

Per-viz sequence (D-01): **boilerplate (Bash) → Edit `_renderDark` body → Edit `_renderLight` body → Write `formatter.html` → Write `visualization.css` → per-viz checkpoint → log progress**.

Iterate this sequence for each entry in `DESIGN-LOCK.md.vizs[]`. Before starting viz N, run resume detection (Step 3.0). After finishing viz N, run the per-viz checkpoint (Step 3.6) and emit the one-line progress glyph (Step 3.7).

### 3.0 Resume detection — skip already-complete vizs

On every full-pipeline run (including resumed runs), before emitting viz N, run the resume predicate against the on-disk files for that viz. Resume detection is **full-pipeline-only**; iteration mode and standalone mode are one-shot and do not run this predicate.

Five predicates (a–e), all must be true to classify a viz as "already complete":

- (a) `<app_id>/appserver/static/visualizations/<viz_name>/src/visualization_source.js` exists
- (b) `<app_id>/appserver/static/visualizations/<viz_name>/formatter.html` exists
- (c) `<app_id>/appserver/static/visualizations/<viz_name>/visualization.css` exists
- (d) source contains `CV-RENDER-DARK-BEGIN` AND `CV-RENDER-DARK-END` AND has non-whitespace content between them
- (e) source contains `CV-RENDER-LIGHT-BEGIN` AND `CV-RENDER-LIGHT-END` AND has non-whitespace content between them

"Filled" = any non-whitespace content between the begin/end sentinels (D-04). No minimum line count, no completion marker. The on-disk files are the single source of truth — no external EMIT-LOG.md manifest is kept (D-05). cv-build's validator is the deeper safety net for "plausible but broken" bodies.

If all five predicates are true, print the resume-skip glyph line and advance to viz N+1:

```
↻ [N/M] <viz_name> — already complete, skipping
```

The first viz that fails any predicate is the resume point. The four-tool-call sequence (3.1 → 3.5) runs for that viz and every subsequent viz.

Literal predicate shape (re-uses the grep idiom from `scripts/validate.sh`):

```bash
# Per-viz "is this viz already complete?" check (D-03 / D-06)
SRC="<app_id>/appserver/static/visualizations/<viz_name>/src/visualization_source.js"
FMT="<app_id>/appserver/static/visualizations/<viz_name>/formatter.html"
CSS="<app_id>/appserver/static/visualizations/<viz_name>/visualization.css"
[ -f "$SRC" ] && [ -f "$FMT" ] && [ -f "$CSS" ] &&
grep -q 'CV-RENDER-DARK-BEGIN' "$SRC" &&
grep -q 'CV-RENDER-DARK-END'   "$SRC" &&
awk '/CV-RENDER-DARK-BEGIN/,/CV-RENDER-DARK-END/' "$SRC" | sed '1d;$d' | grep -q '[^[:space:]]' &&
grep -q 'CV-RENDER-LIGHT-BEGIN' "$SRC" &&
grep -q 'CV-RENDER-LIGHT-END'   "$SRC" &&
awk '/CV-RENDER-LIGHT-BEGIN/,/CV-RENDER-LIGHT-END/' "$SRC" | sed '1d;$d' | grep -q '[^[:space:]]'
```

**Path-traversal guard (T-44-02-02 mitigation).** Before composing any of the three file paths with `<viz_name>`, validate the viz_name from DESIGN-LOCK.md against the existing plugin regex `^[a-zA-Z0-9_-]+$` (the same regex enforced by `boilerplate_emit.js` line 32). Reject and stop if the viz_name contains a `/`, a `..`, whitespace, or any shell metacharacter. The same regex guards checkpoint composition (Step 3.6) — symmetric guard, symmetric predicate. Scope every `grep -q` to the canonical `<src>` path; never grep-walk the whole pack (T-44-02-01).

### 3.1 Emit boilerplate (bash)

```bash
node ${CLAUDE_SKILL_PLUGIN_DIR}/../../scripts/boilerplate_emit.js <viz_name> <app_id>.<viz_name> > <app_id>/appserver/static/visualizations/<viz_name>/src/visualization_source.js
```

This writes the compliance scaffolding (initialize, formatData, getInitialDataParams, destroy, reflow, helpers, updateView's dispatch to _renderDark/_renderLight). The `_renderDark` and `_renderLight` functions contain the begin/end sentinel pairs around an empty TODO body — these are the deterministic Edit anchors for steps 3.2 and 3.3.

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

Tool call count: 1 Bash.

### 3.2 Edit the `_renderDark` body between sentinels

Use the **Edit** tool, not Write. The Edit's `old_string` is the literal begin/end sentinel pair with the empty TODO body between them (exactly as emitted by `boilerplate_emit.js`); the `new_string` keeps the sentinels and inserts the Canvas-translated body.

```
old_string:
    /* CV-RENDER-DARK-BEGIN */
    // TODO: implement per visual_reference_html [data-theme="dark"]
    /* CV-RENDER-DARK-END */

new_string:
    /* CV-RENDER-DARK-BEGIN */
    <Canvas calls translated from visual_reference_html [data-theme="dark"] CSS>
    /* CV-RENDER-DARK-END */
```

Sentinels are deterministic, grep-able, and double as the resume-detection / checkpoint signal (D-03 / D-06). The `t = this._resolveTheme(t, opt);` line sits OUTSIDE the sentinel pair (above the begin sentinel) — do NOT include it in the Edit body. Plan 01's template enforces this (Rule 7 preservation).

This is where your full attention goes. Read [references/canvas-port-rules.md](references/canvas-port-rules.md) for the six fidelity rules.

Before composing the Edit:

1. **Read `visual_reference_html` from DESIGN-LOCK.md.** Re-read it before writing code. Do NOT paraphrase from memory.
2. **Paste the dark theme CSS block as a comment ABOVE `_renderDark`** (above the begin sentinel) in the source file. This is your visual contract while writing the Canvas code.
3. **Re-read `global.commitments.anti_references`** before each viz starts. This prevents drift into AI defaults mid-pack.

CSS-to-Canvas translation examples:

| CSS source | Canvas translation |
|---|---|
| `linear-gradient(180deg, #00D26A, #008844)` | `var grad = ctx.createLinearGradient(0, y, 0, y + h); grad.addColorStop(0, "#00D26A"); grad.addColorStop(1, "#008844");` |
| `filter: drop-shadow(0 0 16px rgba(0,210,106,0.3))` | `ctx.shadowBlur = 16; ctx.shadowColor = "rgba(0,210,106,0.3)";` |
| `animation: breathe 3s ease-in-out infinite` | `requestAnimationFrame` loop with 3000ms cycle, easing function |
| `border-radius: 8px` | custom `roundRect` helper |

Tool call count: 1 Edit.

### 3.3 Edit the `_renderLight` body between sentinels

Same shape as Step 3.2 — different sentinel pair and different CSS source.

```
old_string:
    /* CV-RENDER-LIGHT-BEGIN */
    // TODO: implement per visual_reference_html [data-theme="light"]
    /* CV-RENDER-LIGHT-END */

new_string:
    /* CV-RENDER-LIGHT-BEGIN */
    <Canvas calls translated from visual_reference_html [data-theme="light"] CSS>
    /* CV-RENDER-LIGHT-END */
```

Light is a DIFFERENT code path — NOT a dimmed dark. Read `visual_spec.fills.background_light` for which effects to skip on light (typically glows, drop shadows, and dark-only gradients are replaced with solid fills or are dropped entirely).

Tool call count: 1 Edit.

### 3.4 Write `formatter.html`

Generate from `visual_spec`. Read [references/formatter-emission.md](references/formatter-emission.md) for the per-control templates.

Required for every viz:

- Section structure: three standard sections only — `Data configurations`, `Data display`, `Color and style` (exact labels, case-sensitive). Effect/animation toggles go inside Color and style — adding an "Effects" section creates duplicate prefixed groups in Dashboard Studio.
- `{{VIZ_NAMESPACE}}.<key>` in all `name=` attributes
- `value=` not `default=` on all inputs
- `<splunk-color-picker type="custom">` for all color pickers
- `themeMode` default `"auto"`
- Minimum 10 controls; per-viz options derived from `visual_spec.effects`, `visual_spec.geometry`, etc.

Tool call count: 1 Write.

### 3.5 Write `visualization.css`

One line:

```css
.<app_id>-<viz_name>-viz { background: transparent; }
```

Tool call count: 1 Write.

### 3.6 Per-viz checkpoint

After all five tool calls (Bash + Edit + Edit + Write + Write) for the viz complete, run the same five-predicate composition from Step 3.0 (resume detection). The predicate is symmetric: a viz that resume considers "complete" is exactly a viz the checkpoint passes (D-06). Validate the viz_name against `^[a-zA-Z0-9_-]+$` before composing the paths (T-44-02-02), then run the same `[ -f ... ]` + `grep -q` + `awk … sed '1d;$d' | grep -q '[^[:space:]]'` composition shown in Step 3.0.

**On pass**, print the pass glyph line exactly (D-09 verbatim):

```
✓ [N/M] <viz_name> — boilerplate + renderDark + renderLight + formatter + css
```

**On fail**, print the fail glyph line exactly and STOP (D-07):

```
✗ [N/M] <viz_name> — checkpoint failed: <reason>
```

Do not retry. Do not skip and continue. Do not package. Do not continue to the next viz. Report which predicate failed (file existence / sentinel grep / non-whitespace body) and exit. The user re-runs cv-create to resume; resume detection (D-03) picks up the remaining vizs cleanly on the next invocation. This mirrors the cv-build stop-on-first-failure model.

Failure-reason mapping (so the printed `<reason>` is well-defined):

| Predicate that failed | `<reason>` to print |
|---|---|
| (a) | `visualization_source.js missing` |
| (b) | `formatter.html missing` |
| (c) | `visualization.css missing` |
| (d) | `_renderDark body empty (no content between CV-RENDER-DARK-BEGIN/END)` |
| (e) | `_renderLight body empty (no content between CV-RENDER-LIGHT-BEGIN/END)` |

### 3.7 Progress output

One short line per viz per checkpoint event. Three glyphs only: `✓` (pass), `↻` (resume skip), `✗` (fail). Exact format strings (verbatim — em-dash `—`, not hyphen):

```
✓ [N/M] <viz_name> — boilerplate + renderDark + renderLight + formatter + css
↻ [N/M] <viz_name> — already complete, skipping
✗ [N/M] <viz_name> — checkpoint failed: <reason>
```

`[N/M]` is the 1-indexed position in `DESIGN-LOCK.md.vizs[]` (N = current viz, M = total). These lines are visible during long full-pipeline runs and make the resume-skip behavior observable.

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
