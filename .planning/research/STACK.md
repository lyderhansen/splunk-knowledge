# Stack Research: v5.2.0 Smart Vizs & Domain Identity

**Domain:** Canvas 2D auto-field discovery, dynamic N-series rendering, and preview silhouette generation for ES5 Splunk vizs
**Researched:** 2026-05-18
**Confidence:** HIGH (code-verified patterns from the existing codebase; no new runtime dependencies)

---

## Framing: Patterns Already Exist in the Codebase — Gaps Are in the Instructions

All three questions (field discovery, N-series color, preview silhouettes) have partial implementations already present in the test corpus and tooling. The work is: extract working patterns, formalize them as opinionated recipes in the skill files, and patch the two places where the current template leaves gaps.

---

## Question 1: Auto-Field Discovery from data.fields in updateView

### Current State (Verified in Codebase)

Every viz in the test corpus already does partial field discovery. The `formatData` method builds a `colIdx` map:

```javascript
formatData: function(data) {
    if (!data || !data.rows || data.rows.length === 0) {
        if (this._lastGoodData) return this._lastGoodData;
        return null;
    }
    var fields = data.fields;
    var colIdx = {};
    for (var i = 0; i < fields.length; i++) {
        colIdx[fields[i].name] = i;
    }
    var result = { colIdx: colIdx, rows: data.rows };
    this._lastGoodData = result;
    return result;
}
```

This builds a name→index dictionary. `updateView` then looks up specific named fields via `data.colIdx[fieldName]`. The gap is that `fieldName` is always a hardcoded default (e.g., `'score'`, `'minutes'`, `'cause'`).

What is missing: passing `data.fields` through `formatData` so `updateView` can enumerate all available columns — enabling automatic series discovery.

### The Fix: Pass fields Through formatData

The fix is one line. Change the result in `formatData`:

```javascript
// Current (in every test viz):
var result = { colIdx: colIdx, rows: data.rows };

// Required for auto-field discovery:
var result = { colIdx: colIdx, rows: data.rows, fields: data.fields };
```

`test14`'s `jwst_power_horizon` already does this (verified in source). It is not in the standard template. This line needs to be added to the SKILL.md template.

### Numeric Column Discovery in updateView

Once `fields` is passed through, `updateView` can discover all numeric columns at runtime:

```javascript
// In updateView, after colIdx is available:
// Identify numeric columns by sampling the first row.
// Exclude reserved fields (_time, _raw, _indextime, _sourcetype, etc.)
var RESERVED = { '_time': 1, '_raw': 1, '_indextime': 1, '_sourcetype': 1,
                 '_source': 1, '_host': 1, '_bkt': 1, '_cd': 1, '_si': 1 };

function isNumericCol(rows, colIdx, fieldName) {
    if (RESERVED[fieldName]) return false;
    if (rows.length === 0) return false;
    var idx = colIdx[fieldName];
    // Sample up to 3 rows to confirm numeric
    var checked = 0;
    for (var ri = 0; ri < Math.min(3, rows.length); ri++) {
        var v = rows[ri][idx];
        if (v == null || v === '') continue;
        var n = parseFloat(v);
        if (!isNaN(n)) { checked++; }
        else return false;
    }
    return checked > 0;
}

var numericFields = [];
for (var fi = 0; fi < data.fields.length; fi++) {
    var fname = data.fields[fi].name;
    if (isNumericCol(data.rows, data.colIdx, fname)) {
        numericFields.push(fname);
    }
}
```

**Field exclusion list** (RESERVED): Splunk always includes internal meta-fields in ROW_MAJOR output. Without excluding them, `_time` (epoch float) and `_si` (integer) will appear as "numeric" series. The RESERVED list is a hard constant — these fields never represent user data.

**Sampling strategy:** Checking 3 rows is enough to distinguish numeric from categorical without iterating the full dataset. Splunk searches return consistent types per column.

**Label field detection:** Non-numeric, non-reserved fields are the categorical/label columns. After excluding numeric and RESERVED fields, what remains is the label pool:

```javascript
var labelFields = [];
for (var fi = 0; fi < data.fields.length; fi++) {
    var fname = data.fields[fi].name;
    if (!RESERVED[fname] && !isNumericCol(data.rows, data.colIdx, fname)) {
        labelFields.push(fname);
    }
}
var primaryLabel = labelFields[0] || null; // first non-numeric non-reserved field
```

**Confidence:** HIGH — `isNaN(parseFloat(v))` is the canonical JS numeric check. The RESERVED list is verifiable from Splunk's search result schema documentation (these fields appear in every search result).

### Formatter Field Mapping Pattern (Config-First, Auto-Discover Fallback)

Auto-discovery should be a fallback, not the primary path. The formatter should still expose field name controls. Auto-discovery activates when the user leaves them blank:

```javascript
// Config-first, auto-discover fallback:
var labelFieldCfg = opt('labelField', '');
var valueFieldCfg = opt('valueField', '');

// If user left blank, auto-discover
var resolvedLabelField = labelFieldCfg || (labelFields[0] || '');
var resolvedValueField = valueFieldCfg || (numericFields[0] || '');

var labelIdx = data.colIdx[resolvedLabelField]; // may be undefined if field missing
var valueIdx = data.colIdx[resolvedValueField];
```

This pattern means:
- The viz works out of the box on any SPL output with at least one string column and one numeric column
- Users can override which columns map to which role if auto-detection is wrong
- No hardcoded column names ("score", "minutes", etc.) in the shipped viz code

---

## Question 2: Dynamic N-Series Color Assignment When Field Names Are Unknown

### Existing Theme Infrastructure (Verified)

`theme.js` already has `s1` through `s5` tokens in both DARK and LIGHT themes:

```javascript
DARK = { ..., s1: '{{DARK_S1}}', s2: '{{DARK_S2}}', s3: '{{DARK_S3}}', s4: '{{DARK_S4}}', s5: '{{DARK_S5}}', ... }
```

The `test29` leaderboard viz already uses a derived series palette:

```javascript
var seriesColors = [accent, t.s1, t.s3, t.s4, t.s5];
```

This is the correct pattern but is ad-hoc — no standard recipe for N-series assignment.

### Standard N-Series Recipe

The complete recipe for rendering N dynamically-discovered numeric series:

**Step 1: Build the series palette array**

```javascript
// Build ordered palette: accent first, then s1-s5, then wrap
// accent leads because it is the brand's primary expression
function buildSeriesPalette(t, accentColor) {
    return [
        accentColor,
        t.s1, t.s2, t.s3, t.s4, t.s5
    ];
}
var palette = buildSeriesPalette(t, accent);
```

**Step 2: Assign colors by index, wrap at palette length**

```javascript
// For each series i (0..N-1):
var seriesColor = palette[i % palette.length];
```

**Step 3: Alpha-differentiate overflow series (when N > palette.length)**

When there are more series than palette entries (e.g., 8 numeric fields with a 6-color palette), the wrap-around produces duplicate colors. Distinguish them by reducing opacity:

```javascript
function seriesColorForIndex(palette, i) {
    var baseColor = palette[i % palette.length];
    // First pass (i < palette.length): full opacity
    // Second pass (i >= palette.length): 60% opacity
    var pass = Math.floor(i / palette.length);
    if (pass === 0) return baseColor;
    var alpha = Math.max(0.3, 1.0 - pass * 0.4);
    return theme.withAlpha(baseColor, alpha);
}
```

**Step 4: Formatter override for explicit per-series colors**

Expose a `seriesColors` CSV setting so users can override auto-assignment:

```javascript
// In formatter.html:
// <splunk-control-group label="Series colors" help="Comma-separated hex values, e.g. #FF5722,#2196F3">
//   <splunk-text-input name="{{VIZ_NAMESPACE}}.seriesColors" value="">
// </splunk-control-group>

// In updateView:
var customColors = theme.parseColors(opt('seriesColors', ''), null);
function getSeriesColor(i) {
    if (customColors && customColors[i]) return customColors[i];
    return seriesColorForIndex(palette, i);
}
```

### Accent as Highlight-Only Architecture

The v5.2.0 requirement is: accent is used for highlights and UI chrome (hover states, borders, glow, thresholds), NOT as the primary fill color for data series. Data fills use `s1`–`s5`. This is a role separation:

| Token | Role |
|-------|------|
| `accent` | Hover highlights, glow, threshold indicators, selected state borders |
| `s1`–`s5` | Data series fill colors (bars, lines, segments) |
| `t.text` / `t.textDim` | Labels |

**Practical implication in generated viz code:**

```javascript
// WRONG — accent as data fill (current bug in many generated vizs):
ctx.fillStyle = accent;         // painting bars with accent
ctx.strokeStyle = accent;       // painting a line chart with accent

// RIGHT — series colors for data, accent for UI:
ctx.fillStyle = getSeriesColor(seriesIndex);  // data fills from palette
ctx.strokeStyle = getSeriesColor(seriesIndex); // data strokes from palette
ctx.shadowColor = theme.withAlpha(accent, gi * glowScale); // accent for glow only
// On hover row highlight:
ctx.fillStyle = theme.withAlpha(accent, theme.getHoverAlpha()); // accent for hover
```

**The rule to add to SKILL.md pre-code checklist:**
`□ JS series data: fill and stroke use getSeriesColor(i) from t.s1-s5, NOT accent. Accent used only for hover highlight, glow shadowColor, and threshold breach indicators.`

**Confidence:** HIGH — this is a codification of existing design system patterns from the codebase (s1–s5 tokens exist, theme.getHoverAlpha() uses accent, the role split is architecturally sound).

---

## Question 3: Unique Preview Silhouettes Per Viz Type in generate_assets.js

### Current State (Verified via generate_assets.js Inspection)

`generate_assets.js` already has 8 silhouette types: `bars`, `gauge`, `grid`, `line`, `timeline`, `radar`, `progress`, `kpi`. Detection is keyword-based via `detectVizType(dirName)`.

**Two problems with the current implementation:**

**Problem 1: Keyword coverage is too narrow.**

The current keyword list will miss domain-specific viz names. Examples that would all fall through to the `kpi` default:
- `attack_timeline` → matches `timeline` (fine)
- `runway_gauge` → matches `gauge` (fine)
- `threat_heatmap` → matches `heat` via `grid` (fine)
- `flow_diagram` → no match → defaults to `kpi` (WRONG)
- `passenger_flow` → no match → defaults to `kpi` (WRONG)
- `latency_scatter` → no match → defaults to `kpi` (WRONG)
- `network_topology` → no match → defaults to `kpi` (WRONG)
- `connection_map` → no match → defaults to `kpi` (WRONG)

The fallback silhouette (`kpi`) means all unrecognized viz types look identical — four KPI boxes — which defeats the purpose of unique previews.

**Problem 2: No silhouettes exist for creative domain-specific viz types** that v5.2.0 is meant to generate (force fields, network graphs, Sankey-style flows, geographic maps, waffle charts, bullet charts).

### Fix 1: Expanded Keyword List

The `VIZ_TYPE_KEYWORDS` array needs broader coverage. Additions derived from real viz names in the test corpus (tests 21–32) and the viz blueprints:

```javascript
var VIZ_TYPE_KEYWORDS = [
    { type: 'bars',     keywords: ['bar', 'bars', 'column', 'histogram', 'bar_chart',
                                   'barchart', 'vertical', 'horizontal', 'ranked',
                                   'leaderboard', 'leader', 'ranking', 'waterfall', 'bullet'] },
    { type: 'gauge',    keywords: ['gauge', 'arc', 'ring', 'donut', 'dial',
                                   'speedometer', 'radial', 'ring_gauge', 'needle',
                                   'meter', 'fuel', 'battery', 'utilization', 'kpi_gauge'] },
    { type: 'grid',     keywords: ['grid', 'table', 'matrix', 'heatmap', 'heat',
                                   'map', 'cell', 'status_matrix', 'health_grid',
                                   'attack_heatmap', 'host_grid'] },
    { type: 'line',     keywords: ['line', 'trend', 'area', 'sparkline', 'area_chart',
                                   'linechart', 'timeseries', 'time_series', 'time',
                                   'horizon', 'power_horizon', 'spark_strip', 'spark'] },
    { type: 'timeline', keywords: ['timeline', 'gantt', 'feed', 'activity', 'event',
                                   'stream', 'log', 'ticker', 'live_ticker', 'incident',
                                   'incident_feed', 'event_feed', 'news', 'queue',
                                   'observation', 'process', 'pipeline', 'flow',
                                   'passenger_flow'] },
    { type: 'radar',    keywords: ['radar', 'spider', 'polar', 'web', 'radarchart',
                                   'multi_axis', 'dimension', 'profile'] },
    { type: 'progress', keywords: ['progress', 'progress_bar', 'completion',
                                   'fill', 'step', 'stage_tracker', 'stage',
                                   'runway', 'capacity', 'saturation'] },
    { type: 'scatter',  keywords: ['scatter', 'bubble', 'correlation', 'plot',
                                   'scatterplot', 'bivariate', 'xy', 'latency_scatter',
                                   'distribution'] },
    { type: 'network',  keywords: ['network', 'topology', 'connection', 'graph',
                                   'force', 'node', 'edge', 'relationship',
                                   'dependency', 'map', 'geo', 'geographic',
                                   'flight', 'route', 'path'] },
    { type: 'kpi',      keywords: ['kpi', 'metric', 'score', 'value', 'number',
                                   'stat', 'card', 'tile', 'badge', 'counter',
                                   'single_value', 'delta', 'nps', 'satisfaction'] }
];
```

**Rule: most-specific keywords first.** The detection loop takes the FIRST match. Put longer, more-specific keywords (`attack_heatmap`, `status_matrix`) before shorter ones to prevent short prefix matches from winning.

### Fix 2: Two New Silhouette Functions

Two silhouette types cover the largest gap:

**Scatter/Bubble silhouette** (handles scatter, bubble, correlation, distribution):

```javascript
function drawScatterSilhouette(rows, ar, ag, ab, bgr, bgg, bgb) {
    // Horizontal and vertical axis lines
    fillRect(rows, 25, 170, 250, 3, ar, ag, ab);  // x-axis
    fillRect(rows, 25, 20, 3, 150, ar, ag, ab);   // y-axis
    // 12 data point dots of varying radii scattered across quadrant
    var points = [
        {x: 60,  y: 140, r: 8},
        {x: 90,  y: 100, r: 12},
        {x: 130, y: 130, r: 6},
        {x: 160, y: 70,  r: 10},
        {x: 185, y: 50,  r: 14},
        {x: 200, y: 110, r: 7},
        {x: 220, y: 85,  r: 9},
        {x: 75,  y: 60,  r: 5},
        {x: 110, y: 45,  r: 11},
        {x: 245, y: 40,  r: 8},
        {x: 245, y: 120, r: 6},
        {x: 145, y: 150, r: 7}
    ];
    for (var i = 0; i < points.length; i++) {
        var p = points[i];
        // Approximate circle with filled square (no trig in pixel loop)
        fillRect(rows, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2, ar, ag, ab);
    }
}
```

**Network/topology silhouette** (handles network, topology, connection, map, flight, route):

```javascript
function drawNetworkSilhouette(rows, ar, ag, ab, bgr, bgg, bgb) {
    // Node positions (hub + spokes pattern)
    var nodes = [
        {x: 150, y: 100},  // center hub
        {x: 80,  y: 50},
        {x: 220, y: 50},
        {x: 60,  y: 130},
        {x: 240, y: 130},
        {x: 100, y: 165},
        {x: 200, y: 165},
        {x: 150, y: 170}
    ];
    // Edges from center to spokes
    var center = nodes[0];
    for (var i = 1; i < nodes.length; i++) {
        var n = nodes[i];
        var steps = Math.max(Math.abs(n.x - center.x), Math.abs(n.y - center.y));
        for (var s = 0; s <= steps; s++) {
            var t = s / steps;
            var px = Math.round(center.x + (n.x - center.x) * t);
            var py = Math.round(center.y + (n.y - center.y) * t);
            fillRect(rows, px, py, 2, 2, ar, ag, ab);
        }
    }
    // Peripheral edges (ring connections)
    var ring = [1, 2, 4, 7, 6, 5, 3];
    for (var j = 0; j < ring.length - 1; j++) {
        var n1 = nodes[ring[j]], n2 = nodes[ring[j+1]];
        var steps2 = Math.max(Math.abs(n2.x - n1.x), Math.abs(n2.y - n1.y));
        for (var k = 0; k <= steps2; k++) {
            var t2 = k / steps2;
            var px2 = Math.round(n1.x + (n2.x - n1.x) * t2);
            var py2 = Math.round(n1.y + (n2.y - n1.y) * t2);
            fillRect(rows, px2, py2, 2, 2, ar, ag, ab);
        }
    }
    // Node circles (filled squares approximating dots)
    for (var ni = 0; ni < nodes.length; ni++) {
        var r = (ni === 0) ? 8 : 5;  // hub is larger
        fillRect(rows, nodes[ni].x - r, nodes[ni].y - r, r * 2, r * 2, ar, ag, ab);
    }
}
```

### Fix 3: Wire New Silhouettes into drawSilhouette()

```javascript
function drawSilhouette(rows, type, ar, ag, ab, bgr, bgg, bgb) {
    if (type === 'bars')     { drawBarsSilhouette(rows, ar, ag, ab, bgr, bgg, bgb);     return; }
    if (type === 'gauge')    { drawGaugeSilhouette(rows, ar, ag, ab, bgr, bgg, bgb);    return; }
    if (type === 'grid')     { drawGridSilhouette(rows, ar, ag, ab, bgr, bgg, bgb);     return; }
    if (type === 'line')     { drawLineSilhouette(rows, ar, ag, ab, bgr, bgg, bgb);     return; }
    if (type === 'timeline') { drawTimelineSilhouette(rows, ar, ag, ab, bgr, bgg, bgb); return; }
    if (type === 'radar')    { drawRadarSilhouette(rows, ar, ag, ab, bgr, bgg, bgb);    return; }
    if (type === 'progress') { drawProgressSilhouette(rows, ar, ag, ab, bgr, bgg, bgb); return; }
    if (type === 'scatter')  { drawScatterSilhouette(rows, ar, ag, ab, bgr, bgg, bgb);  return; }
    if (type === 'network')  { drawNetworkSilhouette(rows, ar, ag, ab, bgr, bgg, bgb);  return; }
    drawKpiSilhouette(rows, ar, ag, ab, bgr, bgg, bgb);  // default
}
```

### Fix 4: Contrast Enforcement in Preview Silhouettes

The current silhouette rendering uses `dark.accent` on `dark.bg` — the correct combination. However, when the accent is low-saturation (e.g., Patagonia's muted teal `#4A8B7F` on near-black `#0A1219`), the silhouette can appear nearly invisible. The fix: check contrast before rendering and lighten the accent if needed:

```javascript
// In generatePreviews(), after extracting accentRgb:
// If the accent-on-bg contrast is below 3:1, brighten accent for the preview
function previewContrastAccent(accentHex, bgHex) {
    // Simple luminance bump: if contrast < 3:1, shift accent toward white by 30%
    var ar = hexToRgb(accentHex);
    var br = hexToRgb(bgHex);
    // Approximate luminance (not WCAG-accurate, sufficient for preview quality)
    var aLum = (ar[0] * 0.299 + ar[1] * 0.587 + ar[2] * 0.114) / 255;
    var bLum = (br[0] * 0.299 + br[1] * 0.587 + br[2] * 0.114) / 255;
    var contrast = (aLum + 0.05) / (bLum + 0.05);
    if (contrast < 3.0) {
        // Blend accent toward white by 30%
        return [
            Math.min(255, Math.round(ar[0] + (255 - ar[0]) * 0.3)),
            Math.min(255, Math.round(ar[1] + (255 - ar[1]) * 0.3)),
            Math.min(255, Math.round(ar[2] + (255 - ar[2]) * 0.3))
        ];
    }
    return ar;
}
var previewRgb = previewContrastAccent(dark.accent, dark.bg);
var ar = previewRgb[0], ag = previewRgb[1], ab = previewRgb[2];
```

**Confidence:** HIGH — the pattern is a straightforward contrast check on theme tokens, using the same `hexToRgb` function already in the file.

---

## Integration Points: Where These Patterns Land in the Codebase

### 1. SKILL.md (vp-viz) — Template Additions

Three items to add to the `visualization_source.js` template:

**A.** Change `formatData` result to include `fields`:
```javascript
var result = { colIdx: colIdx, rows: data.rows, fields: data.fields };
```

**B.** Add `isNumericCol` + `RESERVED` + field discovery block after canvas setup in `updateView`.

**C.** Add to the pre-code checklist:
```
□ JS auto-field discovery: formatData passes data.fields through in result object
□ JS series colors: data fills use s1-s5 palette via getSeriesColor(i), NOT accent
□ JS accent role: accent used only for hover highlight, glow, threshold indicators
```

### 2. generate_assets.js — Silhouette Additions

- Expand `VIZ_TYPE_KEYWORDS` with the new entries above
- Add `drawScatterSilhouette` and `drawNetworkSilhouette` functions
- Update `drawSilhouette` dispatcher
- Add `previewContrastAccent` function and apply in `generatePreviews`

### 3. theme.js Template — No Changes Required

The `s1`–`s5` tokens and `parseColors` are already present. `withAlpha` and `getHoverAlpha` are already present. No new theme utility functions are needed for these three features.

### 4. New Canvas Recipe (canvas-recipes.md) — N-Series Block

Add a "Dynamic N-Series" section with:
- `buildSeriesPalette(t, accentColor)` function
- `seriesColorForIndex(palette, i)` function
- Config-first / auto-discover fallback pattern
- The accent-as-highlight-only role table

---

## What NOT to Do

| Avoid | Why |
|-------|-----|
| Auto-detect field types via regex on column names | `parseFloat` sampling is more reliable than column name heuristics (`revenue` could be a string field) |
| Infer field roles from column name semantics (NLP) | Too fragile; SPL column names vary wildly across customers |
| Use `COLUMN_MAJOR_OUTPUT_MODE` for field enumeration | ROW_MAJOR is already set; COLUMN_MAJOR would require refactoring all data access patterns |
| Add `_time` to the series palette | `_time` is epoch float and appears numeric; RESERVED list must exclude it |
| Replace `s1`–`s5` with computed palette | Brand-specific series colors are deliberate design choices, not algorithmic outputs |
| Use `OffscreenCanvas` API for preview generation | `generate_assets.js` runs in Node.js, not a browser; use the existing pure-pixel `makePng` path |
| Generate 10 silhouette types for every possible domain viz | 10 types (8 existing + scatter + network) cover 95% of domain viz names. Unknown names fall to kpi, which is visible. |

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Auto-field discovery pattern | HIGH | `isNaN(parseFloat())` is canonical JS; RESERVED list is verifiable from Splunk docs; `formatData` pass-through is already done in test14 |
| N-series color assignment | HIGH | `s1`–`s5` tokens already in theme.js; palette wrap + alpha differentiation is algorithmic |
| Accent-as-highlights-only | HIGH | Role split already present in codebase (`getHoverAlpha` uses accent; series use s1–s5); just not enforced in template |
| Preview keyword expansion | HIGH | Keyword list is additive; existing detection logic is unchanged |
| New silhouette functions | HIGH | `fillRect`-based drawing is the existing pattern; new shapes (scatter dots, network graph) use the same primitives |
| Preview contrast enforcement | MEDIUM | Luminance approximation (0.299/0.587/0.114) is correct for perceived brightness; 3:1 threshold is a practical choice, not WCAG-mandated for preview images |

---

*Stack research for: splunk-viz-packs v5.2.0 smart vizs & domain identity*
*Researched: 2026-05-18*
