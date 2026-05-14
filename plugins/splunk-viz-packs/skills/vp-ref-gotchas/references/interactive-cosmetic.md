## INTERACTIVE — must have for production

### I1. Hover tooltip is mandatory on data-displaying vizs

Every viz that displays DATA must show a tooltip on hover. Decorative
vizs (background shapes, texture overlays) don't need tooltips. Canvas
has no built-in tooltip — use a DOM element positioned at the cursor.

```javascript
initialize: function() {
    // ... after canvas creation ...
    this._tooltip = document.createElement('div');
    this._tooltip.style.cssText =
        'position:absolute;display:none;padding:6px 10px;' +
        'border-radius:4px;pointer-events:none;white-space:nowrap;' +
        'z-index:100;';
    // NO hardcoded font/color — set in _render() from theme tokens:
    // this._tooltip.style.background = t.panelHi;
    // this._tooltip.style.color = t.text;
    // this._tooltip.style.fontFamily = theme.FONTS.data;
    // this._tooltip.style.fontSize = '11px';
    this.el.style.position = 'relative';
    this.el.appendChild(this._tooltip);

    var self = this;
    this.canvas.addEventListener('mousemove', function(e) {
        self._onMouseMove(e);
    });
    this.canvas.addEventListener('mouseleave', function() {
        self._tooltip.style.display = 'none';
    });
},

_onMouseMove: function(e) {
    var rect = this.canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;

    // Hit-test against drawn elements (viz-specific logic)
    var hit = this._hitTest(mx, my);
    if (hit) {
        this._tooltip.textContent = hit.label + ': ' + hit.value;
        this._tooltip.style.display = 'block';
        this._tooltip.style.left = (mx + 12) + 'px';
        this._tooltip.style.top = (my - 8) + 'px';
        this.canvas.style.cursor = 'pointer';
    } else {
        this._tooltip.style.display = 'none';
        this.canvas.style.cursor = 'default';
    }
},
```

**Hit-test patterns per viz type:**
- **KPI tile:** single hit zone = entire panel. Show field name + value.
- **Ring gauge:** arc region. Show percentage + raw value.
- **Donut:** angle-based. Compute angle from center, match to segment.
- **Area chart:** x-position to data index. Show all series values at
  that time point.
- **Table:** row index from y-position. Highlight row, show full row
  data.

**Always clean up in destroy:**
```javascript
destroy: function() {
    if (this._tooltip && this._tooltip.parentNode) {
        this._tooltip.parentNode.removeChild(this._tooltip);
    }
    // ... other cleanup ...
}
```

### I2. Hover highlight on charts and tables

Beyond the tooltip, hovering should visually highlight the element:
- **Donut:** increase segment opacity or add stroke
- **Area chart:** draw vertical crosshair line + data point dots
- **Table:** brighten row background
- **Gauge:** show exact value label near the arc

Store hit regions during `_render` and re-use in `_hitTest`.

## COSMETIC — works but looks wrong

> COSMETIC rules prevent visual bugs. For design quality guidelines
> (color choices, typography, spacing), see `vp-couture` and
> `vp-ref-patterns`.

### C1. Panel backgroundColor must be transparent

You CANNOT control the Dashboard Studio panel background from inside
the viz. It must be set in the dashboard JSON:

```json
"options": {
    "backgroundColor": "transparent",
    "app.viz.setting": "value"
}
```

`backgroundColor` is a built-in Studio option (no namespace prefix).
Document this in every README and demo dashboard.

### C2. MutationObserver hides Splunk placeholders

Vizs that render without data (static icons, decorative elements) get
overlaid with Splunk's "no results" placeholder. Hide it:

```javascript
initialize: function() {
    var self = this;
    this._observer = new MutationObserver(function() {
        var nodes = self.el.querySelectorAll(
            '.viz-placeholder, .shared-viz-no-results, ' +
            '[data-test="viz-no-results"], .viz-controller-no-results'
        );
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].style.display = 'none';
        }
    });
    this._observer.observe(this.el, { childList: true, subtree: true });
},
destroy: function() {
    if (this._observer) this._observer.disconnect();
}
```

### C3. Cursor pointer on drilldown

```javascript
if (drilldownEnabled) {
    this.el.style.cursor = 'pointer';
    this.canvas.style.cursor = 'pointer';
}
```

Without this, users don't know the viz is clickable.

### C4. Drilldown must be wrapped in try/catch

```javascript
try {
    self.drilldown({
        action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
        data: payload
    }, event);
} catch (e) { /* test harness has no drilldown infra */ }
```

### C5. Animation timers must be cleaned up in destroy

```javascript
destroy: function() {
    if (this._animTimer) {
        clearInterval(this._animTimer);
        this._animTimer = null;
    }
    if (this._observer) this._observer.disconnect();
    SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
}
```

### C6. Reflow should use direct re-render

```javascript
reflow: function() {
    if (this._lastConfig) {
        this._render(this._lastData, this._lastConfig);
    }
}
```

Faster and flicker-free. Cache `_lastData` and `_lastConfig` in
`updateView`.

**IMPORTANT:** verify the actual render method name before writing
`reflow`. The method could be `_render`, `_draw`, `_update`, or
inline in `updateView`. Calling `this._render()` when the method
is named `_draw()` causes `TypeError: this._render is not a function`
on every resize.

```javascript
// If rendering happens in updateView directly:
reflow: function() {
    if (this._lastData && this._lastConfig) {
        this.updateView(this._lastData, this._lastConfig);
    }
}
```

### C7. Viz app name must match the brand/project

The app ID and viz stanza names create the Dashboard Studio type
prefix: `{app_id}.{viz_name}`. Always name the app after the
brand/project so the dashboard JSON reads naturally:

```
disney_plus_viz.kpi_tile       ← clear: this is a Disney+ KPI
f1_viz_pack.ers_gauge          ← clear: this is an F1 ERS gauge
soc_viz_pack.threat_radar      ← clear: this is a SOC threat radar

custom_viz.kpi_tile            ← bad: what brand? generic
my_viz.gauge                   ← bad: meaningless
```

The app ID appears in every `"type":` reference in every dashboard
JSON. Make it count.

### C8. Increment `build` in app.conf for every release

Splunk caches static assets keyed by a hash derived from `build` in
`app.conf`. Same `build` number = cached old JS/CSS served despite
new install. Different `build` = fresh load.

Always increment before packaging. Also hard-refresh browser
(Cmd+Shift+R / Ctrl+Shift+R) after installing.

### C9. `rx` on splunk.rectangle must be a number, not a string

Dashboard Studio schema validation rejects `"rx": "8"` (string).
Use `"rx": 8` (number). Same applies to `ry`, `strokeWidth`, and
other numeric options in dashboard JSON.

