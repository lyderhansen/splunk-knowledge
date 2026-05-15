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
| Canvas dimensions wrong (0px height or oversized) | B17 | Canvas sized from wrapper div or `getBoundingClientRect` | Use `this.el.clientWidth / clientHeight` with `window.innerWidth/Height` fallback | No |
| Dark text on white background in ad-hoc search | B18 | Theme radio in formatter with hardcoded default | Remove theme radio; auto-detect via `SplunkVisualizationUtils.getCurrentTheme()` | No |
| Timestamps show "Invalid Date" or epoch zero | B19 | `new Date(isoString)` fails in sandboxed iframe | Use regex `parseTimestamp()` for ISO strings | No → [canvas-recipes.md](../vp-viz/references/canvas-recipes.md) |
| Viz renders wrong theme on first load | B20 | `themeMode` formatter default is `"dark"` not `"auto"` | Set `value="auto"` on `themeMode` radio; use `detectTheme()` for auto path (auto-fixed — but first-try correct code skips repair overhead) | Yes (repair_findings.js) |
| Canvas shows literal text "null" or "undefined" | B21 | Missing null guard before `String()` | Wrap every field read with `safeStr(val)` helper | No |
| Color picker value ignored (reads as integer) | B22 | Splunk delivers color as integer not hex | Use `hexFromSplunk(config[ns + 'key'], fallback)` for every color read | No |
| Text invisible on light theme background | B23 | Dark-mode design inverted for light, not redesigned | Use full `t.text` for hero values; reduce `shadowBlur` 50%; min `withAlpha(color, 0.15)` for grid lines | No |

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
