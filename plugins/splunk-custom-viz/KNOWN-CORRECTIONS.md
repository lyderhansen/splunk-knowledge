# KNOWN-CORRECTIONS — splunk-custom-viz

Authoritative list of corrections discovered in production. **This file overrides any conflicting guidance in `skills/**/references/`.** Every cv-* skill should read this file before generating code or dashboard JSON.

When a discrepancy exists between this file and a reference doc, the reference doc is wrong and should be updated to match. Until then, this file wins.

---

## Correction 1 — Dashboard token defaults MUST be objects, not bare strings

**Source:** WWF Field Ops 2026-05-25 + prior memory `feedback_ds_token_defaults_must_be_objects.md`

Splunk Dashboard Studio v2 schema requires:

```json
"defaults": {
  "tokens": {
    "default": {
      "selected_team_id": { "value": "*" }
    }
  }
}
```

NOT:

```json
"defaults": {
  "tokens": {
    "default": {
      "selected_team_id": "*"          ← WRONG — fails schema, dashboard breaks silently
    }
  }
}
```

**Where it lives:** `skills/cv-build/references/dashboard-transcription.md` (corrected 2026-05-25).
**Validator:** `scripts/validate.sh` greps for `"selected_\w+":\s*"\*"` in dashboard XML → FAIL.

---

## Correction 2 — Every formatter color picker MUST be read in `_resolveTheme(t, opt)`

**Source:** WWF Field Ops 2026-05-25 + prior memory `feedback_canvas_must_read_color_pickers.md` + Cisco viz pack (earlier)

If `formatter.html` emits a `splunk-color-picker`, `visualization_source.js` MUST consume it via `hexFromSplunk(opt("<key>", t.<default>), t.<default>)` inside `_resolveTheme(t, opt)`, and `_renderDark` / `_renderLight` MUST start with `t = this._resolveTheme(t, opt);`.

A picker without consumer is dead UI — clicking it persists a value the viz never reads. Users report "the color setting doesn't work" with no error.

**Where it lives:**
- `skills/cv-create/references/canvas-port-rules.md` — Rule 7 (added 2026-05-25)
- `skills/cv-create/references/formatter-emission.md` — Color picker contract section (added 2026-05-25)
- `scripts/boilerplate_emit.js` — `_resolveTheme` stub now emitted in boilerplate (2026-05-25)

**Validator:** `scripts/validate.sh` greps every `<splunk-color-picker name="{{VIZ_NAMESPACE}}.<key>">` in `formatter.html` and confirms `opt("<key>"` exists in `visualization_source.js` → FAIL on mismatch.

---

## Correction 3 — Drillable elements MUST set `cursor = "pointer"` on hover

**Source:** WWF Field Ops 2026-05-25 + prior memory `feedback_canvas_pointer_cursor_on_hover.md`

If `_onClick` wires a drilldown, `_onMouseMove` MUST manage `this._canvas.style.cursor`:

```javascript
_onMouseMove: function(e) {
    // ... hit-test ...
    if (hit) {
        this._canvas.style.cursor = "pointer";
        return;
    }
    this._canvas.style.cursor = "default";
}
```

Without this, drilldowns are invisible — users don't discover them until they accidentally click. The cursor IS the affordance.

**Where it lives:** `skills/cv-create/references/canvas-port-rules.md` — Rule 6 sub-rule (added 2026-05-25).

---

## Correction 4 — NEVER call `invalidateUpdateView()` inside `requestAnimationFrame`

**Source:** WWF Field Ops 2026-05-25 (Patrol Coverage panel: "Maximum call stack size exceeded")

`SplunkVisualizationBase.invalidateUpdateView()` calls `updateView` **synchronously** in several Splunk versions. Combining it with `requestAnimationFrame` produces re-entrant render loops that blow the call stack on certain code paths (drilldown click during animation, reflow during pulse, theme switch during animation).

Use the cached-config pattern instead:

```javascript
// In updateView, cache:
this._lastConfig = config;

// In animation RAF callback, re-call directly:
this._animationFrameId = requestAnimationFrame(function() {
    self._animationFrameId = null;
    if (self._lastGoodData && self._lastConfig) {
        self.updateView(self._lastGoodData, self._lastConfig);
    }
});
```

**Where it lives:** `skills/cv-create/references/canvas-port-rules.md` — Rule 4 rewritten (2026-05-25).
**Validator:** `scripts/validate.sh` greps for `invalidateUpdateView` inside `requestAnimationFrame` callback → FAIL.

---

## Correction 5 — `updateView` MUST guard against empty data shapes

**Source:** WWF Field Ops 2026-05-25 (Active Collars panel: "Cannot read properties of undefined (reading 'collars_online')")

Splunk's framework may invoke `updateView(data, config)` with `{}` (empty object — truthy, no `rows`, no `colIdx`) during dashboard init, theme switches, or token-triggered re-renders. The old guard `if (!data)` doesn't catch this and the downstream `_layout` throws on `data.colIdx[fieldName]`.

Required guard:

```javascript
if (!data || !data.rows || data.rows.length === 0 || !data.colIdx) {
    if (this._lastGoodData) data = this._lastGoodData;
    else return;
}
```

Plus `_layout` should default `rows = data.rows || []` and `ci = data.colIdx || {}` for belt-and-suspenders.

**Where it lives:**
- `skills/cv-create/references/canvas-port-rules.md` — Rule 8 (added 2026-05-25)
- `scripts/boilerplate_emit.js` — updateView guard hardened (2026-05-25)

---

## Correction 6 — preview.png is owned by Pillow, NOT pixel-grid JS

**Source:** WWF Field Ops 2026-05-25 (Splunk viz picker showed 14 identical letter-cards, then 3 duplicate KPI tiles after first JS rewrite)

**Two iterations of this correction:**

**Iteration 1 (2026-05-25 morning):** Restored per-type JS silhouettes in `generate_assets.js drawSilhouette()` with 10 helper functions (gauge → arc, bars → bars, line → sparkline, etc.). This fixed the 14-identical-letter problem but produced new duplicates: same-type vizs (two KPIs, two grids) rendered identically because helpers used hardcoded geometry.

**Iteration 2 (2026-05-25 afternoon, current):** Ported the Pillow-based `generate_previews.py` from `splunk-viz-packs/skills/vp-create/scripts/` (originally Phase 41 of vp-create). Brings:
- **Real TrueType fonts** (Inter-Regular.ttf bundled in `scripts/fonts/`) — readable text, not 5x7 bitmap glyphs
- **3-tier detection cascade**: `// @viz-type` annotation → Canvas API pattern scan (`ctx.arc` count, `fillRect` count, nested `for` loops, large-font `fillText`) → keyword fallback
- **Hash-seeded geometry per viz_name** in `drawBars`, `drawLine`, `drawTimeline`, `drawHeatmap` — same-type vizs render distinctly
- **drawGeneric fallback** uses viz name as auto-sized text + corner motif from keyword hint, so every viz is guaranteed visually unique
- **Pillow auto-install** with graceful fallback (`--legacy-previews` flag on `generate_assets.js`) when offline

**Where it lives:**
- `scripts/generate_previews.py` — Pillow-based, canonical (NEW 2026-05-25)
- `scripts/fonts/Inter-Regular.ttf` + `OFL.txt` — bundled font (NEW 2026-05-25)
- `scripts/generate_assets.js` — now skips previews by default; `--legacy-previews` flag re-enables JS rendering as fallback
- `skills/cv-build/SKILL.md` Step 3 — documents the two-script flow + the `@viz-type` annotation requirement

**Build order:** `python3 generate_previews.py` first → if exits 2 (Pillow install failed), then `node generate_assets.js --legacy-previews`. Always run `node generate_assets.js` (without flag) for appIcon + bg_gradient regardless.

**Agent contract:** `cv-create` MUST emit `// @viz-type: <type>` as line 1 of every `visualization_source.js`. Valid types: `gauge`, `bars`, `line`, `timeline`, `kpi`, `grid`, `heatmap`, `table`, `ring`, `donut`, `scatter`, `network`. Without the annotation, the script falls back to Canvas-API pattern detection (Tier 2) or filesystem keyword matching (Tier 3) and may misclassify.

---

---

## Correction 7 — Formatter `value="…"` MUST exactly match JS `||` fallback (Rule 19)

**Source:** splunk-viz canon Rule 19 (`references/splunk-viz-canon.md`)

Splunk does NOT send formatter HTML defaults to the JS on first load. The `value="..."` attribute on `<splunk-text-input>` / `<splunk-radio-input>` only takes effect AFTER the user opens the Format panel and interacts with it. On initial render — and for any saved search without explicit settings — `config[ns + 'setting']` is `undefined`, so the JS `||` fallback is what actually runs.

Required contract:

```html
<!-- formatter.html -->
<splunk-radio-input name="{{VIZ_NAMESPACE}}.themeMode" value="auto">
```

```javascript
// visualization_source.js
var themeMode = opt("themeMode", "auto");  // ← "auto" MUST match value="auto" above
```

If the formatter defaults to `value="dark"` but the JS falls back to `"auto"`, the viz silently renders the wrong theme until the user opens Format → confirms → closes the panel.

Also required: `savedsearches.conf` must explicitly include every setting (see Correction #12) so dashboards built from saved searches don't depend on first-load defaults.

**Test the viz with a fresh panel (no saved config)** to verify defaults work. cv-create's color picker contract (Rule 7) covers this for colors; this correction extends it to ALL settings.

---

## Correction 8 — NEVER read `config` in `formatData` (Rule 21)

**Source:** splunk-viz canon Rule 21

Splunk internally caches `formatData` results. The interaction between config-dependent `formatData` logic and Splunk's caching produces inconsistent update timing — some vizs update instantly while others stall for up to a minute on the same dashboard with the same search. Symptom: "this viz updates fine, that one doesn't" with no clear cause.

```javascript
// WRONG — reads config in formatData, triggers caching anomalies
formatData: function(data, config) {
    var ns = this.getPropertyNamespaceInfo().propertyNamespace;
    var fieldName = config[ns + 'field'] || 'speed';
    return { value: extractField(data, fieldName) };
}

// CORRECT — formatData passes through data; updateView reads config
formatData: function(data) {
    if (!data || !data.rows || data.rows.length === 0) {
        if (this._lastGoodData) return this._lastGoodData;
        return null;
    }
    var colIdx = {};
    for (var i = 0; i < data.fields.length; i++) colIdx[data.fields[i].name] = i;
    var result = { colIdx: colIdx, rows: data.rows, fields: data.fields };
    this._lastGoodData = result;
    return result;
}
```

**The boilerplate already enforces this** — `boilerplate_emit.js` emits `formatData(data)` (no `config` parameter). Agents writing per-viz code must NEVER add config reads to `formatData`. All config access belongs in `updateView` via the `opt()` closure.

For multi-column vizs with hardcoded field names (no config dependency), extracting values in `formatData` is fine — the field names are constants, not config-dependent.

---

## Correction 9 — `VisualizationError` is the ONLY no-data path in Dashboard Studio v2 + cache in BOTH `formatData` and `updateView` (Rule 20)

**Source:** splunk-viz canon Rule 20

Returning `false` from `formatData` causes Dashboard Studio v2 to show its own grey-bar-chart placeholder and never call `updateView` — there is **no way** to display a custom message. The only mechanism that works:

```javascript
formatData: function(data) {
    if (!data || !data.rows || data.rows.length === 0) {
        if (this._lastGoodData) return this._lastGoodData;
        throw new SplunkVisualizationBase.VisualizationError(
            'Awaiting data — Patrol Coverage'
        );
    }
    // ... build result ...
}
```

**Cache in BOTH `formatData` AND `updateView`.** Correction #5 covered the `updateView` cache (catches `data = false` race when chain/post-process searches return zero rows). The matching `formatData` cache prevents flashing the `VisualizationError` between batches in real-time searches:

```javascript
updateView: function(data, config) {
    if (!data || !data.rows || data.rows.length === 0 || !data.colIdx) {
        if (this._lastGoodData) data = this._lastGoodData;
        else return;
    }
    this._lastConfig = config;
    // ...
}
```

Two-layer protection:
- `formatData` cache + `VisualizationError`: shows "Awaiting data" only on the very first call before any data has arrived
- `updateView` cache: prevents blank canvas when Splunk passes `data = false` directly after `formatData` returned cached data

**Boilerplate already provides both layers** as of v6.0.2 (Correction #5). When writing per-viz logic that ALSO validates required columns or shapes, the cache-return pattern must precede every throw.

---

## Correction 10 — Reset `ctx.shadowBlur` AND `ctx.globalAlpha` after use (Rules 5 + 6)

**Source:** splunk-viz canon Rules 5 + 6

Canvas 2D shadow state and global alpha state LEAK across subsequent draw calls if not explicitly reset to defaults. This produces ghost shadows on text drawn after a glowing shape, faded labels after a translucent fill, and other "why is this faint?" bugs that are impossible to track down without knowing the state-leak class.

```javascript
// Glow effect on alert pin
ctx.shadowBlur  = 18;
ctx.shadowColor = t.accent_dim;
ctx.fillStyle   = t.accent;
ctx.fillRect(ax - 1, ay, 2, h);
ctx.shadowBlur = 0;          // ← MANDATORY reset, every time

// Translucent overlay
ctx.globalAlpha = 0.4;
ctx.fillRect(0, 0, w, h);
ctx.globalAlpha = 1.0;       // ← MANDATORY reset
```

Best practice: wrap shadow/alpha changes in tight try-style blocks where the reset is in line-of-sight with the change. Save/restore (`ctx.save()` / `ctx.restore()`) is safer for complex multi-state changes but more expensive — use it for save points before heavy compound work, raw set/reset for one-off effects.

---

## Correction 11 — `SplunkVisualizationUtils.escapeHtml` for ALL dynamic DOM strings (Rule 14)

**Source:** splunk-viz canon Rule 14 — **required for Splunk certification**

When inserting dynamic strings from search results into the DOM (`innerHTML`, text nodes, attribute values), wrap them in `SplunkVisualizationUtils.escapeHtml(str)`. Without this, a search result containing `<script>` or an `onerror=` attribute can execute arbitrary JS in the dashboard context.

```javascript
// WRONG — XSS vector
this._tooltip.innerHTML = '<div>' + row.team_name + '</div>';

// CORRECT
this._tooltip.innerHTML = '<div>' +
    SplunkVisualizationUtils.escapeHtml(row.team_name) + '</div>';
```

For dynamic URLs (drilldown links, image src, etc.), use `SplunkVisualizationUtils.makeSafeUrl(url)` to strip unsafe schemes like `javascript:`.

**Canvas-only vizs that never touch the DOM with user data can skip this.** But the moment a viz adds a tooltip, an HTML overlay, a label that uses `innerHTML`, or an `<a href>` link, escapeHtml/makeSafeUrl is mandatory.

This is checked during Splunk AppInspect — a viz that interpolates user data into the DOM without escaping will fail certification.

---

## Correction 12 — Use original ingested field names, never require `as` aliases (Rule 26)

**Source:** splunk-viz canon Rule 26

Vizs must reference fields by the exact name used at indexing time. Never require users to rename fields with SPL `as` aliases just to match a viz's hardcoded expectations.

```spl
-- WRONG (because viz hardcodes "value" instead of accepting the real field name)
| stats latest(cpu_usage) as value

-- CORRECT (viz reads cpu_usage directly via opt("metricField", "cpu_usage"))
| stats latest(cpu_usage)
```

The opt() pattern from Correction #2 + the configurable field names pattern from canon Rule 18 makes this enforceable: every viz exposes a text-input formatter setting for each data field name, defaulting to the realistic field name (NOT a generic "value" / "count" placeholder).

Exceptions:
- **Display renames in tables** (`| rename status as Status`) where the column header is the user-facing label
- **Computed/derived fields** (`eval delta = field_a - field_b`) that don't exist at ingest

`savedsearches.conf` must also list every `display.visualizations.custom.{app}.{viz}.{fieldSetting} = realistic_default` so saved searches survive the Rule 19 first-load default trap.

---

---

## Correction 13 — Preview uniqueness rule for `generate_previews.py`

**Source:** WWF Field Ops 2026-05-25 — surfaced through 4 iterations:
1. v6.0.1 letter-only `drawSilhouette` → 14 identical letter cards
2. v6.0.2 per-type JS silhouettes → 2x identical "IO" KPI tiles + 2x identical grids
3. v6.0.3 Pillow port (drawBars hardcoded heights) → 3 identical bar charts
4. v6.0.4 drawKpi rewrite (hardcoded "ACTIVE" label) → active_collars ≈ mc01_composite at thumbnail size

Each round fixed the previous failure mode and introduced a new one. The unifying rule:

### The Rule

> **Every preview must be visually unique at thumbnail size. `viz_name` MUST drive at least one rendering differentiator so two vizs of the same type can never render identically. No hardcoded display text — every label slot derives from `viz_name` or a `viz_name`-seeded hash.**

### Three concrete requirements (every renderer in `generate_previews.py` MUST satisfy all three)

1. **Render `viz_name` visibly somewhere in the preview** — as a label band, badge, or auto-sized hero. Every viz has a unique name, so rendering it as text guarantees unique pixels. This is the only bulletproof differentiator. `drawGeneric` and `drawKpi` already do this (label band at bottom). `drawGauge`, `drawRing`, `drawTable` currently do NOT — they need to.

2. **Any geometry the renderer fills in (heights, cell intensities, segment widths, point positions, fill percentages, marker positions) MUST be seeded from `hash(viz_name)`** — never hardcoded arrays. Use the LCG pattern from `drawLine`/`drawBars`/`drawTimeline`/`drawHeatmap`:

   ```python
   seed = abs(hash(viz_name or "<fallback>")) & 0xFFFFFFFF
   for _ in range(n):
       seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
       value = lo + (seed % (hi - lo + 1))
   ```

3. **Hardcoded display text is banned** — labels, captions, hero numbers, sample data, axis ticks, legend strings. Acceptable sources:
   - `viz_name` (verbatim, uppercased, with underscores swapped for spaces)
   - Hash-picked from a candidate pool of ≥8 items (e.g. `drawKpi`'s 12 hero candidates)
   - Omitted entirely (let the silhouette speak)

   Forbidden examples that have shipped: `"ACTIVE"`, `"65%"`, `"84"`, `"IO"`. Anything literal that ships in every render of the same type is by definition an AI-slop signature across the whole pack.

### Corollary — type detection is necessary but not sufficient

Tier 1/2/3 detection only chooses *which renderer* runs. The renderer itself is responsible for varying its output per `viz_name`. A correctly-typed viz can still produce identical previews if the renderer ignores the name. Detection improvements help (Tier 1 annotation > Tier 2 source scan > Tier 3 keyword fallback), but the within-renderer variation rule is the floor.

### What this fixes structurally

The "same default for every viz" pattern is the AI-slop equivalent of the canon's design anti-patterns (uniform-color KPI rows, default grey canvas, rainbow on severity). Same root cause: pre-baked output that doesn't engage with the specific viz's identity. Same fix: derive from inputs, never hardcode.

### Compliance status (2026-05-25, v6.0.5)

All 10 renderers in `generate_previews.py` satisfy the rule:

- `drawKpi`, `drawGauge`, `drawRing` — viz_name label + hash-derived geometry + hash-picked hero from 12-candidate pool
- `drawBars`, `drawLine`, `drawTimeline`, `drawHeatmap` — hash-seeded geometry from viz_name (heights / points / segment widths / cell intensities)
- `drawTable` — header + alternating tinted body rows (visual-only; if two table vizs render identically in a future pack, add hash-seed to row tint pattern)
- `drawGeneric` (Tier 3 fallback) — viz_name as auto-sized hero text + corner motif from keyword hint

**Where it lives:**
- `scripts/generate_previews.py` — all `draw*` functions are bound by this rule
- This file (`KNOWN-CORRECTIONS.md` #13) — authoritative
- `references/splunk-viz-canon.md` — does NOT cover preview generation (canon is about viz code, not pack assets); this correction extends the same anti-slop principle to the asset-generation layer.

---

## Correction 14 — Composite previews via `@preview-layout` for multi-element vizs

**Source:** WWF Field Ops dashboard review 2026-05-25 — user observed that generic primitive renderers (`drawKpi`, `drawHeatmap`, `drawCompositeStack` via fallback) couldn't capture the actual visual fingerprint of multi-element vizs. A KPI with ratio + delta + sparkline + footer-stats reads totally differently from a plain hero+sparkline KPI, but both shipped with the same generic preview.

### The architectural addition

Introduce **`@preview-layout`** as a separate annotation from `@viz-type`:

```javascript
// @viz-type: kpi                          ← data primitive (unchanged)
// @preview-layout: kpi-ratio-footer       ← compositional shape (NEW)
```

- `@viz-type` continues to select a primitive renderer (gauge, kpi, heatmap, …) — fallback when no layout is set
- `@preview-layout` overrides with a composition-specific renderer that combines multiple primitives in a recognizable shape
- Detection is a 4-tier cascade now: 1a layout → 1b type → 2 Canvas-API scan → 3 keyword fallback
- Unknown layout names fall through to primitive dispatch (no build break on typo)

### Layout library (v6.0.7)

| Layout name (+ synonyms) | Composition fingerprint | Modeled on |
|---|---|---|
| `kpi-ratio-footer` / `kpi-ratio` / `ratio-footer` | Big numerator / denominator + delta-pill + sparkline + 2-stat footer row | WWF active_collars |
| `heatmap-with-marks` / `grid-with-marks` / `heatmap-hotzones` | Heatmap grid + 2 hot-bordered cells + corner direction triangle | WWF species_grid + threat_severity |
| `composite-stack` / `subject-stack` / `telemetry-stack` | Big subject ID + 3 stacked mini-rows (sparkline / categorical bars / spike-marker line) | WWF mc01_composite |
| `timeline-with-alert` / `alert-timeline` / `lanes-with-alert` | 3 horizontal lanes of segment events + ONE bright accent alert pin on one lane | WWF patrol_coverage |
| `bars-with-target` / `target-bars` / `funding-bars` | Bars (hash-seeded heights) + horizontal dashed target line + value above tallest bar | WWF projects_funding |
| `gauge-with-stats` / `gauge-stats` / `slo-gauge` | Gauge arc top + 3 mini stat tiles (value + unit) in a row below | SLO/health/uptime panels |
| `line-with-band` / `band-line` / `range-line` / `anomaly-line` | Line chart + faint normal-range shaded band + accent dot on outlier | physiological/anomaly vizs |

Each follows Correction #13 (viz_name drives all variable content) and inherits series-color rotation from `_pick_primary`.

### The standard — every viz must have `@preview-layout`

**As of v6.0.7, `@preview-layout` is MANDATORY for every viz in a `splunk-custom-viz` pack** — not optional. Falling back to a primitive (`@viz-type` only) produces generic "template" previews that don't reflect what the viz actually looks like.

User validated this standard on 2026-05-25 after seeing the WWF test49 composite previews: *"this was perfect!!! exactly how every preview should be in the future."* See `[[composite-preview-standard]]` memory + cv-create SKILL.md Step 3a.

### When existing layouts don't fit — propose a new one, don't fall back

If a viz's composition isn't covered by the layout library, add a new renderer to `scripts/generate_previews.py`:

1. Write the `draw<Name>` function following the established pattern: `_seed(viz_name)` for geometry, `_pick_primary(theme, viz_name)` for color rotation, `_label_band(draw, viz_name, ...)` for the bottom label.
2. Add to `LAYOUT_DISPATCH` with 2-3 synonym keys.
3. Add a row to the library table above.
4. Document the composition fingerprint and what real viz it was modeled on.

Falling back to a primitive renderer when a composition would be more accurate is a regression — it's the failure mode this correction exists to prevent.

### Agent contract (cv-create skill teaching)

When emitting `visualization_source.js`, the agent MUST set BOTH annotations on EVERY viz (not just composite ones):

```javascript
// @viz-type: <primitive>                 ← Tier 1b fallback if layout unknown
// @preview-layout: <layout-name>         ← Tier 1a, REQUIRED
```

cv-create SKILL.md Step 3a lists the current layout library and the procedure for proposing a new layout when existing ones don't fit.

**Where it lives:**
- `scripts/generate_previews.py` — `LAYOUT_DISPATCH` dict + 3 composite renderers (`drawKpiRatioFooter`, `drawHeatmapWithMarks`, `drawCompositeStack`)
- `PREVIEW_LAYOUT_ANNOTATION_RE` and the 4-tier cascade in `detect_viz_type`
- `tests/test49_v6_in_git/wwf_field_ops_viz/` — 3 vizs annotated as proof-of-pattern

---

## Process note (Finding 4 from HANDOVER-skill-improvements.md)

The user has been discovering corrections, writing them to personal memory, and the plugin docs have continued to teach the wrong thing. Going forward:

1. **This file is the source of truth** — referenced from every `cv-*/SKILL.md` "before you start" section.
2. **Validator enforces what this file says** — every correction here should have a corresponding grep check in `scripts/validate.sh`.
3. **Plugin release checklist:** before a version bump, walk through user memory entries tagged `feedback_*` and confirm each is reflected here AND in the relevant reference doc.
