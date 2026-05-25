# Broken Rules — Diagnostic Reference

Rules that produce wrong output without preventing load. Use the summary table to identify the failure,
then follow the Fix column. Auto-fixed rules are resolved by the repair loop in validate_viz.sh.

## Summary table — all B-series rules

| Symptom | FAIL code | Cause | Fix | Auto-fixed? |
|---------|-----------|-------|-----|-------------|
| Canvas text shows tofu glyphs or blank on first render | B1 | Font not ready when draw called | Use `document.fonts.load()` poll before drawText | No → [canvas-recipes.md](../vp-viz/references/canvas-recipes.md) |
| Viz looks blurry on Retina / 4K screens | B2 | Missing HiDPI scaling | Set `canvas.width = w * dpr`, `ctx.scale(dpr, dpr)` | No → [canvas-recipes.md](../vp-viz/references/canvas-recipes.md) |
| Formatter settings ignored after first load | B3 | Config reads miss short-key path | Use `getOption(config, ns, key, default)` for every config read | No → [formatter-patterns.md](../vp-viz/references/formatter-patterns.md) |
| Color picker changes not reflected until page reload | B4 | Config read inside `formatData` | Move all config reads to `updateView` | No |
| Formatter section appears duplicated or colors ignored | B5 | Wrong `section-label` casing or missing `type="custom"` | Use exact label casing; add `type="custom"` to every `<splunk-color-picker>` (auto-fixed — but first-try correct code skips repair overhead) | Yes (repair_findings.js) |
| Shadow bleeds onto wrong canvas elements | B6 | Shadow state not reset after use | Call `ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'` after every shadow draw | No |
| Format panel shows empty / blank settings | B7 | Used `default=` instead of `value=` | Replace all `default=` with `value=` on formatter controls (auto-fixed — but first-try correct code skips repair overhead) | Yes (repair_findings.js) |
| Viz overflows or text illegible at non-tested panel sizes | B8 | Hardcoded pixel constants | Scale all sizes from container: `Math.max(floor, dimension * ratio)` | No |
| Viz shows placeholder icon in Dashboard Studio | B9 | Wrong viz type format in dashboard JSON | Use `"type": "app_name.viz_name"` not `"custom"` prefix (auto-fixed — but first-try correct code skips repair overhead) | Yes (repair_findings.js) |
| Formatter settings have no effect | B10 | Hardcoded namespace in formatter.html | Use `{{VIZ_NAMESPACE}}.key` not `app.viz.key` in all `name=` attributes (auto-fixed — but first-try correct code skips repair overhead) | Yes (repair_findings.js) |
| Lap times / gap values show truncated numbers | B11 | `parseFloat` truncates non-numeric strings | Detect non-numeric strings with `isNaN(parseFloat(s))` and display as-is | No |
| Gauge shows generic green/yellow/red palette | B12 | Default gauge colors used | Derive segment colors from brand palette using `lerpColor(brandLow, brandHigh, pct)` | No |
| Panel background color option has no effect | B13 | `fillRect` paints opaque canvas background | Use `ctx.clearRect(0, 0, w, h)` — let Dashboard Studio control background | No |
| ReferenceError in click/hover handlers at runtime | B14 | Local vars in `_draw` not in scope inside sub-methods | Store shared state as `this._prop` — never rely on `_draw` locals inside `_drawCenter` etc. | No → [canvas-recipes.md](../vp-viz/references/canvas-recipes.md) |
| Viz silently fails to render or receives malformed data | B15 | Missing `formatData` in extend object | Include `formatData` in every viz — even as a passthrough with `_lastGoodData` cache | No |
| Colors / sizes / labels cannot be customized | B16 | Visual properties hardcoded | Expose all colors, sizes, labels, and behavioral toggles via formatter | No |
| Canvas dimensions wrong (0px height or oversized) | B17 | Canvas sized from wrapper div or `getBoundingClientRect` | Use `this.el.clientWidth / clientHeight` with `window.innerWidth/Height` fallback | No → [broken-rules.md B17 section](#b17-canvas-sizing--getboundingclientrect-unreliable) |
| Dark text on white background in ad-hoc search | B18 | Theme radio in formatter with hardcoded default | Remove theme radio; auto-detect via `SplunkVisualizationUtils.getCurrentTheme()` | No |
| Timestamps show "Invalid Date" or epoch zero | B19 | `new Date(isoString)` fails in sandboxed iframe | Use regex `parseTimestamp()` for ISO strings | No → [canvas-recipes.md](../vp-viz/references/canvas-recipes.md) |
| Viz renders wrong theme on first load | B20 | `themeMode` formatter default is `"dark"` not `"auto"` | Set `value="auto"` on `themeMode` radio; use `detectTheme()` for auto path (auto-fixed — but first-try correct code skips repair overhead) | Yes (repair_findings.js) |
| Canvas shows literal text "null" or "undefined" | B21 | Missing null guard before `String()` | Wrap every field read with `safeStr(val)` helper | No |
| Color picker value ignored (reads as integer) | B22 | Splunk delivers color as integer not hex | Use `hexFromSplunk(config[ns + 'key'], fallback)` for every color read | No (no static check; enforce visually or via integration test) |
| Text invisible on light theme background | B23 | Dark-mode design inverted for light, not redesigned | Use full `t.text` for hero values; reduce `shadowBlur` 50%; min `withAlpha(color, 0.15)` for grid lines | No (no static check; verify visually in light mode) |

## Rules requiring code reference

Rules in this section produce failures that the repair loop cannot fix. The code patterns below
must be used during initial code generation.

### B1. Font loading — Canvas text disappears

`document.fonts.load()` polls for a specific font face to be ready before drawing.
Use the `loadFont` helper from `canvas-recipes.md` — call it inside `updateView`
instead of calling `_render` directly:

```javascript
loadFont(FONTS.primary, function() {
    self._render(data, config);
});
```

Do NOT use `document.fonts.ready` — it resolves when ALL fonts finish, not your specific one.

Reference: [canvas-recipes.md](../vp-viz/references/canvas-recipes.md) — Font loading section

### B4. Config reading timing — stale values in formatData

`formatData` is called by Splunk's caching pipeline BEFORE `updateView`. Reading `config`
in `formatData` returns stale or undefined values. All config reads belong in `updateView`.

```javascript
formatData: function(data, config) {
    // ONLY data processing here — NO config reads
    if (!data || !data.rows || data.rows.length === 0) {
        if (this._lastGoodData) return this._lastGoodData;
        throw new SplunkVisualizationBase.VisualizationError('Awaiting data');
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

### B14. Variable scope in sub-methods — ReferenceError in click/hover handlers

Local variables declared in `_draw()` are not accessible inside `_drawCenter()`,
`_drawTicks()`, or any other sub-method. This causes `ReferenceError` at runtime —
often only in event handlers that fire after `_draw` returns.

```javascript
// WRONG — gi local to _draw, invisible to _drawCenter
_draw: function(parsed, config) {
    var gi = 0.8;
    this._drawCenter(ctx, parsed);     // gi is not defined inside _drawCenter!
},
_drawCenter: function(ctx, parsed) {
    ctx.shadowBlur = 12 * gi;          // ReferenceError
}

// CORRECT — store render state on this
_draw: function(parsed, config) {
    this._gi = 0.8;
    this._drawCenter(ctx, parsed);
},
_drawCenter: function(ctx, parsed) {
    ctx.shadowBlur = 12 * (this._gi || 1);
}
```

Reference: [canvas-recipes.md](../vp-viz/references/canvas-recipes.md) — Variable scope section

### B19. Date parsing — fails silently in sandboxed iframes

The custom viz iframe origin is `null` (`src="about:srcdoc"`). `new Date(isoString)` silently
returns `Invalid Date` or epoch 0 in this context. Use regex parsing for all timestamp fields.

```javascript
var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun',
              'Jul','Aug','Sep','Oct','Nov','Dec'];

function parseTimestamp(s) {
    if (s == null || s === '') return '';
    var m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
    if (m) {
        var mon = MONTHS[parseInt(m[2], 10) - 1];
        return mon + ' ' + parseInt(m[3], 10) + ' ' + m[4] + ':' + m[5];
    }
    return String(s);
}
```

For epoch timestamps: `new Date(parseInt(s, 10) * 1000)` works — numeric, not string-parsed.

Reference: [canvas-recipes.md](../vp-viz/references/canvas-recipes.md) — Date parsing section

### B17. Canvas sizing — getBoundingClientRect unreliable

`getBoundingClientRect()` returns 0 dimensions during Splunk's AMD initialization
phase and in sandboxed iframes. Using it for canvas sizing produces a 0×0 canvas
on first render.

```javascript
// WRONG — may return 0 on first render
var rect = this.el.getBoundingClientRect();
var w = rect.width;
var h = rect.height;

// CORRECT — direct DOM properties with fallback
var w = this.el.clientWidth  || window.innerWidth;
var h = this.el.clientHeight || window.innerHeight;
canvas.width  = w;
canvas.height = h;
```

Reference: [pre-code-checklist.md](../vp-viz/references/pre-code-checklist.md) (B17)

---

### Dashboard Validator Codes (DS1-DS5)

Codes emitted by `validate_dash.js`. Run as part of `validate_viz.sh` Phase 2
("Dashboard XML" section) when a `*.xml` view file is present.

---

#### DS1. Undeclared data source

`FAIL DS1` — A visualization in the dashboard JSON references a `dataSource` name
that is not declared in the `dataSources` object.

**Fix:** Add the missing `ds.search` or `ds.savedSearch` entry to `dataSources`, or
correct the visualization's `context.dataSource` reference to match an existing source.

```json
"dataSources": {
  "ds_mySearch": { "type": "ds.search", "options": { "query": "index=main | stats count" } }
},
"visualizations": {
  "viz_01": { "type": "splunk.bar", "dataSources": { "primary": "ds_mySearch" } }
}
```

---

#### DS2. Tab schema error

`FAIL DS2` — The `layout.tabs` or `layoutDefinitions` field uses the wrong format:
array instead of object, `layoutDefinitionId` instead of `layoutId`, or `showTabBar`
at root instead of inside `tabs.options`.

**Fix:** Replace with the correct schema:
```json
"layout": {
  "type": "tab",
  "tabs": {
    "items": [
      { "layoutId": "layout_main", "label": "Overview" }
    ],
    "options": { "barPosition": "top", "showTabBar": false }
  }
},
"layoutDefinitions": {
  "layout_main": { "type": "grid", "options": {}, "structure": [] }
}
```
Note: `layoutDefinitions` must be an **object** (not an array). See ds-int-tabs skill.

---

#### DS3. Missing bg_gradient background

`FAIL DS3` — The dashboard lacks the required `bg_gradient.png` background image.
The check looks for a `splunk.Image` visualization whose `id` or `src` contains
`bg_gradient`.

**Fix:** Run `generate_assets.js` to produce the gradient background, then add a
`splunk.Image` panel referencing it in the layout:
```json
"viz_bg": {
  "type": "splunk.Image",
  "options": { "src": "/static/app/{{APP_ID}}/bg_gradient.png", "preserveAspectRatio": false }
}
```

---

#### DS4. Missing markdown title panel

`FAIL DS4` — Every viz pack dashboard must have a `splunk.Markdown` title panel
positioned at `y <= 200` in the layout.

**Fix:** Add a `splunk.Markdown` visualization at the top of the layout:
```json
"viz_title": {
  "type": "splunk.Markdown",
  "options": { "markdown": "# {{DASHBOARD_TITLE}}" }
}
```
Place the corresponding structure item with `"y": 0` in the layout grid.

---

#### DS5. Drilldown token no default

`FAIL DS5` — A drilldown action sets a token via `setToken` but there is no matching
entry in `defaults.tokens.default`. Without the default, the token is undefined on
initial load and the query referencing it fails.

**Fix:** Add the token with a `"*"` wildcard default:
```json
"defaults": {
  "tokens": {
    "default": {
      "selected_host": "*"
    }
  }
}
```
All three pieces are required: `setToken` in the drilldown → token reference in the
query (`$selected_host$`) → default value in `defaults.tokens.default`. See ds-int-drilldowns skill.

---

### Cross-File Wiring Check (XFILE)

Code emitted by `validate_ast.js --cross`. Checks that every option key in
`visualization_source.js` (`opt('key', ...)` calls) has a corresponding
`name="{{VIZ_NAMESPACE}}.key"` attribute in `formatter.html`, and vice versa.

#### XFILE. Formatter↔JS option key mismatch

`FAIL XFILE` — A formatter `<input>` exposes a control that `visualization_source.js`
never reads via `opt()`. The setting exists in the UI but has no effect.

`WARN XFILE` — `visualization_source.js` reads a key via `opt()` that has no
corresponding formatter control. The viz uses a hardcoded fallback silently.

**Fix:** Verify that every `name="{{VIZ_NAMESPACE}}.someKey"` attribute in
`formatter.html` has a matching `opt('someKey', ...)` call in
`visualization_source.js`, and vice versa.

Common causes:
- Renamed a key in the formatter but forgot to update the JS `opt()` call
- Added a new `opt()` call in the JS without adding the corresponding formatter control
- Hardcoded namespace in `name=` (B10) — causes key mismatch because the namespace
  prefix is included literally instead of replaced at runtime

Reference: [formatter-patterns.md](../vp-viz/references/formatter-patterns.md) (B10 pattern)
See also: [broken-rules.md B10 row](#summary-table--all-b-series-rules)

---

### Contrast Check (CONTRAST)

Code emitted by `check_contrast.js`. Checks foreground/background color pairs from
`theme.js` against WCAG AA thresholds.

#### CONTRAST. WCAG AA contrast violation

`FAIL CONTRAST` — A foreground/background color pair in `theme.js` falls below the
WCAG AA minimum:
- **4.5:1** for normal text (body text, labels, values)
- **3.0:1** for large text and UI components (headers ≥ 18pt, bold ≥ 14pt)

`WARN CONTRAST` — A pair using the relaxed 3.0:1 threshold (e.g. `textFaint`) falls
below that lower bound.

**No static auto-repair exists** — this is a human design decision.

**Fix:** Increase the contrast between the flagged color pair. Common causes:
- `textFaint` on a light background below 3.0:1 (most frequent in light theme)
- Light text on a medium-gray panel below 4.5:1
- `textDim` not dark enough to pass against a near-white background

The `check_contrast.js` output includes the computed ratio, the threshold, and the
hex values of both colors — use these to guide the adjustment in `theme.js`.

Reference: [theme-template.md](../vp-viz/references/theme-template.md) THM-02 for WCAG AA baseline requirements.
