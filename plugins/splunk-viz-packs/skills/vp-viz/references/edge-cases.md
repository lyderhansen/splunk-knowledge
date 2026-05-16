# Edge Case Resilience Patterns

Read this file during **step 5 (JS generation)** of the vp-viz workflow.
Every generated `visualization_source.js` MUST implement ECR-01 through ECR-05.
These are not optional — they are correctness requirements for every viz.

---

## ECR-01: Empty State (no SPL results)

**Requirement:** When Splunk returns zero rows, render a branded empty state. Never leave the canvas blank or throw an error.

### Call site in updateView

Check for empty data BEFORE any field-index or row-access code:

```javascript
updateView: function(data, config) {
    var canvas = this.canvas;
    var ctx = canvas.getContext('2d');
    var w = canvas.offsetWidth || 400;
    var h = canvas.offsetHeight || 300;
    canvas.width = w;
    canvas.height = h;

    var t = theme.getTheme(detectTheme());
    var accent = t.accent;

    // Empty-state guard — must come before any row access
    if (!data || !data.rows || data.rows.length === 0) {
        if (!this._lastGoodData) {
            drawEmptyState(ctx, w, h, t, accent);
            return;
        }
        // Fall through to render with cached data
        data = this._lastGoodData;
    } else {
        this._lastGoodData = data;
    }

    // ... field-index resolution and rendering ...
}
```

### drawEmptyState function template

Copy this into the viz source. The dashed-circle icon shape may be adapted per brand
(a horizontal line, a brand-mark outline, etc.) but the two-part structure —
**icon above, centered text below** — is fixed per D-09.

```javascript
function drawEmptyState(ctx, w, h, t, accent) {
    ctx.save();

    // Decorative icon — dashed circle (adapt shape per brand)
    var cx = w / 2;
    var cy = h * 0.38;
    var r = Math.min(w, h) * 0.1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = theme.withAlpha(accent, 0.20);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // "No data available" label below the icon
    var fontSize = Math.max(11, Math.min(16, h * 0.07));
    ctx.font = fontSize + 'px ' + theme.FONTS.ui;
    ctx.fillStyle = theme.withAlpha(t.textFaint, 0.7);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('No data available', cx, cy + r + 10);

    ctx.restore();
}
```

**Rules:**
- Always wrap the entire function body in `ctx.save()` / `ctx.restore()` — the dashed lineDash
  and custom strokeStyle must not leak into the next render.
- Always reset `ctx.setLineDash([])` after drawing the dashed arc, inside the save/restore block.
- `theme.FONTS.ui` — use the UI font, not the data font, for empty-state labels.
- The icon shape (dashed circle) may be replaced per brand brief, but do not skip the icon —
  an icon-only or text-only empty state looks unfinished.

---

## ECR-02: Single-Row Guard

**Requirement:** `rows.length === 1` is valid data, not a special case. Every loop and table pattern MUST handle it correctly.

### Common failure mode

Loops that start at index 1 to skip a "header row" will silently skip the only data row
when the result set has exactly one row:

```javascript
// WRONG — skips the only row when rows.length === 1
for (var i = 1; i < data.rows.length; i++) {
    // draws nothing when totalRows === 1
}
```

Splunk data from `formatData` has NO header row in `data.rows` — fields are in `data.fields`.
Start every loop at index 0.

### Correct loop — works for any non-zero length

```javascript
// CORRECT — always starts at index 0
for (var i = 0; i < data.rows.length; i++) {
    var row = data.rows[i];
    // render row...
}
```

### Table pattern — header + rows

```javascript
// Field names come from data.fields, not from row[0]
var colIdx = {};
for (var f = 0; f < data.fields.length; f++) {
    colIdx[data.fields[f].name] = f;
}

// Render header separately (no row consumed)
ctx.fillText('Label', headerX, headerY);

// Render all data rows starting at index 0
for (var i = 0; i < data.rows.length; i++) {
    var row = data.rows[i];
    var label = safeStr(row[colIdx['label']]);
    var value = safeNum(row[colIdx['value']], 0);
    // draw row at y = rowStartY + i * rowH
}
```

**Boundary:** Empty array (`data.rows.length === 0`) is the ECR-01 case — handled by the
empty-state guard before the loop. ECR-02 only applies after the empty guard passes.

---

## ECR-03: Pagination Math

**Requirement:** Table vizs with `maxRows` setting MUST use safe pagination math that handles
edge cases: fractional page counts, last-page overflow, and total rows less than `maxRows`.

### (a) State initialization in initialize()

```javascript
initialize: function() {
    SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

    // ... canvas setup, event listeners ...

    this._currentPage = 0;   // pagination state — persists across updateView calls
}
```

### (b) Slice calculation in updateView

```javascript
updateView: function(data, config) {
    // ... canvas setup and empty guard ...

    var ns = '{{VIZ_NAMESPACE}}';
    function opt(key, def) {
        return (config && config[ns + '.' + key]) || def;
    }

    var totalRows = data.rows.length;

    // maxRows — parseInt guard: isNaN or < 1 defaults to 20
    var maxRows = parseInt(opt('maxRows', '20'), 10);
    if (isNaN(maxRows) || maxRows < 1) { maxRows = 20; }

    // totalPages — Math.max(1, ...) guard prevents totalPages = 0 when totalRows < maxRows
    var totalPages = Math.max(1, Math.ceil(totalRows / maxRows));

    // Clamp currentPage — handles data shrink between renders
    if (this._currentPage >= totalPages) { this._currentPage = 0; }

    var startIdx = this._currentPage * maxRows;
    var endIdx = Math.min(startIdx + maxRows, totalRows);
    var pageRows = data.rows.slice(startIdx, endIdx);

    // ... render only pageRows, not data.rows ...
}
```

**Critical guard:** `Math.max(1, Math.ceil(totalRows / maxRows))` prevents `totalPages = 0`
when `totalRows < maxRows` (e.g., 5 rows, maxRows=20 → `Math.ceil(5/20) = 1`, not 0).
Without `Math.max(1, ...)`, the page clamp sets `this._currentPage = 0` forever even with
valid data.

### (c) Render loop — iterate pageRows, not data.rows

```javascript
// CORRECT — only current page rows
for (var i = 0; i < pageRows.length; i++) {
    var row = pageRows[i];
    var rowY = tableTopY + i * rowH;
    // draw row at rowY ...
}

// WRONG — renders all rows, ignores pagination
for (var i = 0; i < data.rows.length; i++) { ... }
```

### (d) Pagination controls — only when multiple pages exist

```javascript
// Only draw prev/next when there is more than one page
if (totalPages > 1) {
    // Prev button hit region
    if (this._currentPage > 0) {
        this._hitRegions.push({
            x: prevBtnX, y: btnY, w: btnW, h: btnH,
            type: 'prevPage'
        });
        ctx.fillText('< Prev', prevBtnX + btnW / 2, btnY + btnH / 2);
    }

    // Page indicator
    ctx.fillText(
        (this._currentPage + 1) + ' / ' + totalPages,
        w / 2, btnY + btnH / 2
    );

    // Next button hit region
    if (this._currentPage < totalPages - 1) {
        this._hitRegions.push({
            x: nextBtnX, y: btnY, w: btnW, h: btnH,
            type: 'nextPage'
        });
        ctx.fillText('Next >', nextBtnX + btnW / 2, btnY + btnH / 2);
    }
}
```

---

## ECR-04: safeStr / safeNum Discipline

**Requirement:** All data field reads MUST go through `safeStr` or `safeNum`. Direct array
access is forbidden on row data because Splunk sends `null` for missing fields — direct
access renders the string `"null"` on screen.

### Correct patterns

```javascript
// String field — use safeStr
var label = safeStr(row[colIdx['label']]);

// Numeric field — use safeNum with explicit fallback
var value = safeNum(row[colIdx['value']], 0);

// Numeric field where 0 is a valid data point — use null as fallback sentinel
var count = safeNum(row[colIdx['count']], null);
if (count === null) { count = 0; } // field was absent — treat as zero
```

### Wrong pattern

```javascript
// WRONG — renders the string "null" when field is absent
var label = row[colIdx['label']];

// WRONG — NaN propagates through all arithmetic downstream
var value = parseFloat(row[colIdx['value']]);
```

### safeStr and safeNum reference implementations

These functions are defined in `theme.js` and inlined into the bundle. Use them as-is —
do not redefine them in `visualization_source.js`.

```javascript
// In theme.js (reference only — do not duplicate):
function safeStr(v) {
    if (v === null || v === undefined) return '';
    return String(v);
}

function safeNum(v, fallback) {
    if (v === null || v === undefined) return fallback;
    var n = parseFloat(v);
    return isNaN(n) ? fallback : n;
}
```

**Why it matters:** Splunk result sets use `null` (not empty string or `"null"`) for
missing fields. `safeStr(null)` returns `''`; direct access `row[idx]` returns
`null`, which `String(null)` renders as `"null"`. This is the most common source of
`"null"` appearing in tables and KPI tiles.

---

## ECR-05: ctx.save / restore Discipline

**Requirement:** Every block that mutates shadow properties or `globalAlpha` MUST be
wrapped in `ctx.save()` / `ctx.restore()`. Manual reset is an anti-pattern — it fails
silently on early returns and code-path divergence.

### Correct glow pattern

```javascript
// CORRECT — shadow state is fully isolated
function drawGlow(ctx, x, y, w, h, color, blurAmount) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = blurAmount;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
    // After restore: shadowColor, shadowBlur are reset to pre-save values
}
```

### Correct globalAlpha pattern

```javascript
// CORRECT — alpha change is isolated to this block
function drawFadedBackground(ctx, t, x, y, w, h) {
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = t.panel;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
    // After restore: globalAlpha is 1.0 again
}
```

### Wrong pattern — manual reset

```javascript
// WRONG — manual reset misses cases when execution returns early
function drawGlowWRONG(ctx, x, y, w, h, color, blurAmount) {
    ctx.shadowColor = color;
    ctx.shadowBlur = blurAmount;

    if (!data) { return; }        // BUG: early return leaves shadowBlur active
                                   // Next draw operation inherits the glow

    ctx.fillRect(x, y, w, h);
    ctx.shadowBlur = 0;            // Only reached when !data is false
    ctx.shadowColor = 'transparent';
}
```

**Why manual reset fails:** If any code path between the mutation and the manual reset
returns early (conditional check, null guard, loop break), the canvas state remains
polluted. All subsequent draw calls inherit the orphaned shadow or alpha. The bug is
invisible until a specific data shape triggers the early return.

### Save/restore scope rules

- One `ctx.save()` per logical rendering block, not per property change.
- Prefer narrow scope: save/restore around the smallest block that needs the mutation.
- Do NOT nest multiple unbalanced save/restore calls — every `ctx.save()` must have
  exactly one matching `ctx.restore()` in all code paths.

```javascript
// CORRECT — narrow scope, one save/restore per effect
function drawHighlightedRow(ctx, t, x, y, w, h, isHovered) {
    if (isHovered) {
        ctx.save();
        ctx.globalAlpha = theme.getHoverAlpha();
        ctx.fillStyle = t.accent;
        ctx.fillRect(x, y, w, h);
        ctx.restore();
    }
    // Row text drawn here, at full globalAlpha regardless of hover state
    ctx.fillStyle = t.text;
    ctx.fillText(label, x + 8, y + h / 2);
}
```
