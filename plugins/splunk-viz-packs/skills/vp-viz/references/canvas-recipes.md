# Canvas 2D Recipes

## Contents
- Hover tooltip (mandatory)
- Drilldown (click navigation)
- Decimals setting
- Color interpolation
- Rounded rectangles
- Arc / gauge drawing
- Legend drawing
- Grid layout
- Responsive text fitting
- Hit-test for drilldown
- Animation lifecycle
- Common mistakes

## Hover tooltip — mandatory on every data-displaying viz

Every viz that displays data MUST implement:
1. DOM tooltip element — created in `initialize`, positioned on `mousemove`, hidden on `mouseleave`
2. Hit-test function — `_hitTest(mx, my)` returns `{label, value}` or null
3. Visual highlight — hover changes appearance (brighter row, crosshair, segment stroke)

The tooltip is a `<div>` appended to `this.el`, NOT drawn on Canvas.

## Drilldown — click navigation from Canvas vizs

```javascript
// In initialize():
this.canvas.addEventListener('click', function(e) { self._onClick(e); });

// Click handler:
_onClick: function(e) {
    var mx = e.offsetX;
    var my = e.offsetY;
    var hit = this._hitTest(mx, my);
    if (hit === null) return;
    try {
        this.drilldown({
            action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
            data: hit.drilldownData
        }, e);
    } catch (ex) {}
}
```

Dashboard JSON event handler:
```json
"eventHandlers": [{
    "type": "drilldown.setToken",
    "options": { "tokens": [{ "token": "selected", "value": "$click.value$" }] }
}]
```

## Decimals setting — standard on all KPI/value vizs

```javascript
var decimals = parseInt(opt('decimals', '-1'), 10);
var displayValue;
if (isNaN(rawValue)) {
    displayValue = '—';
} else if (decimals >= 0) {
    displayValue = rawValue.toFixed(decimals);
} else {
    displayValue = theme.fmtNum(rawValue, { compact: true });
}
```

## Color interpolation

```javascript
function lerpColor(a, b, t) {
    var ar = parseInt(a.slice(1,3),16), ag = parseInt(a.slice(3,5),16), ab = parseInt(a.slice(5,7),16);
    var br = parseInt(b.slice(1,3),16), bg = parseInt(b.slice(3,5),16), bb = parseInt(b.slice(5,7),16);
    return 'rgb(' + Math.round(ar+(br-ar)*t) + ',' + Math.round(ag+(bg-ag)*t) + ',' + Math.round(ab+(bb-ab)*t) + ')';
}
```

## Rounded rectangles

```javascript
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.arcTo(x+w, y, x+w, y+r, r);
    ctx.lineTo(x+w, y+h-r);
    ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
    ctx.lineTo(x+r, y+h);
    ctx.arcTo(x, y+h, x, y+h-r, r);
    ctx.lineTo(x, y+r);
    ctx.arcTo(x, y, x+r, y, r);
    ctx.closePath();
}
```

## Arc / gauge drawing

```javascript
function drawArc(ctx, cx, cy, radius, startDeg, endDeg, color, lineWidth) {
    var startRad = (startDeg - 90) * Math.PI / 180;
    var endRad = (endDeg - 90) * Math.PI / 180;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startRad, endRad, false);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
}
```

## Grid layout

```javascript
function gridLayout(totalW, totalH, rows, cols, padding) {
    var cellW = (totalW - padding * (cols+1)) / cols;
    var cellH = (totalH - padding * (rows+1)) / rows;
    var cells = [];
    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            cells.push({
                x: padding + c * (cellW + padding),
                y: padding + r * (cellH + padding),
                w: cellW, h: cellH
            });
        }
    }
    return { cells: cells, cellW: cellW, cellH: cellH };
}
```

## Responsive text fitting

```javascript
function fitText(ctx, text, maxWidth, maxFontSize, fontFamily) {
    var size = maxFontSize;
    ctx.font = size + 'px ' + fontFamily;
    while (ctx.measureText(text).width > maxWidth && size > 8) {
        size--;
        ctx.font = size + 'px ' + fontFamily;
    }
    return size;
}
```

## Animation lifecycle

```javascript
// In initialize():
this._animTimer = null;
this._animProgress = 0;

// Start animation (call from updateView when data changes):
_startAnim: function() {
    if (this._animTimer) clearInterval(this._animTimer);
    this._animProgress = 0;
    var self = this;
    this._animTimer = setInterval(function() {
        self._animProgress += 0.025;
        if (self._animProgress >= 1) {
            self._animProgress = 1;
            clearInterval(self._animTimer);
            self._animTimer = null;
        }
        self.invalidateUpdateView();
    }, 16);
},

// Easing (use in _render):
function easeInOutQuad(t) {
    return t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
}
var easedProgress = easeInOutQuad(this._animProgress);

// CRITICAL: clean up in destroy():
destroy: function() {
    if (this._animTimer) { clearInterval(this._animTimer); this._animTimer = null; }
    SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
}
```

## Common mistakes

| Mistake | Fix |
|---|---|
| Hardcoded field names | Make configurable via formatter |
| Hardcoded pixel sizes | Auto-scale from container |
| Colors not from theme | Use `t.text`, `t.bg`, etc. |
| Missing `count` in getInitialDataParams | Set `count: 50` (single) or `count: 10000` (multi) |
| `formatData` reads config | Move config reads to `updateView` |
| Font drawn before ready | Poll with document.fonts.ready |
| No `destroy()` cleanup | Clear timers, disconnect observers |
| `ctx.globalAlpha` not reset after use | Always set `ctx.globalAlpha = 1` before next draw |
| `ctx.shadowBlur` not reset | Always set `ctx.shadowBlur = 0` after glow effects |
| `measureText` not called before positioning | Always measure, then position |
