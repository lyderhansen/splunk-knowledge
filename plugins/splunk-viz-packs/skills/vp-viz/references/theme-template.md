# theme.js Template

Replace `{{PLACEHOLDER}}` values from the design brief. All functions below have complete implementations — do not leave stubs.

```javascript
/*
 * {{PACK_LABEL}} — design tokens.
 * ES5 only — no const/let/arrow/template-literals.
 */

function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

function withAlpha(hex, alpha) {
    var r = parseInt(hex.slice(1,3), 16);
    var g = parseInt(hex.slice(3,5), 16);
    var b = parseInt(hex.slice(5,7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + clamp01(alpha) + ')';
}

function lerpColor(a, b, t) {
    t = clamp01(t);
    var ar = parseInt(a.slice(1,3),16), ag = parseInt(a.slice(3,5),16), ab = parseInt(a.slice(5,7),16);
    var br = parseInt(b.slice(1,3),16), bg = parseInt(b.slice(3,5),16), bb = parseInt(b.slice(5,7),16);
    var rr = Math.round(ar + (br - ar) * t);
    var gg = Math.round(ag + (bg - ag) * t);
    var bl = Math.round(ab + (bb - ab) * t);
    return '#' + ((1 << 24) + (rr << 16) + (gg << 8) + bl).toString(16).slice(1);
}

var DARK = {
    name: 'dark',
    bg: '{{DARK_BG}}',
    panel: '{{DARK_PANEL}}',
    panelHi: '{{DARK_PANEL_HI}}',
    edge: '{{DARK_EDGE}}',
    edgeStrong: '{{DARK_EDGE_STRONG}}',
    grid: '{{DARK_GRID}}',
    text: '{{DARK_TEXT}}',
    textDim: '{{DARK_TEXT_DIM}}',
    textFaint: '{{DARK_TEXT_FAINT}}',
    s1: '{{DARK_S1}}',
    s2: '{{DARK_S2}}',
    s3: '{{DARK_S3}}',
    s4: '{{DARK_S4}}',
    s5: '{{DARK_S5}}',
    accent: '{{DARK_ACCENT}}',
    success: '{{DARK_SUCCESS}}',
    warn: '{{DARK_WARN}}',
    danger: '{{DARK_DANGER}}',
    invert: '{{DARK_INVERT}}'
};

var LIGHT = {
    name: 'light',
    bg: '{{LIGHT_BG}}',
    panel: '{{LIGHT_PANEL}}',
    panelHi: '{{LIGHT_PANEL_HI}}',
    edge: '{{LIGHT_EDGE}}',
    edgeStrong: '{{LIGHT_EDGE_STRONG}}',
    grid: '{{LIGHT_GRID}}',
    text: '{{LIGHT_TEXT}}',
    textDim: '{{LIGHT_TEXT_DIM}}',
    textFaint: '{{LIGHT_TEXT_FAINT}}',
    s1: '{{LIGHT_S1}}',
    s2: '{{LIGHT_S2}}',
    s3: '{{LIGHT_S3}}',
    s4: '{{LIGHT_S4}}',
    s5: '{{LIGHT_S5}}',
    accent: '{{LIGHT_ACCENT}}',
    success: '{{LIGHT_SUCCESS}}',
    warn: '{{LIGHT_WARN}}',
    danger: '{{LIGHT_DANGER}}',
    invert: '{{LIGHT_INVERT}}'
};

function getTheme(name) {
    return (name === 'light') ? LIGHT : DARK;
}

var FONTS = {
    data: '{{FONT_DATA}}',
    ui: '{{FONT_UI}}'
};

function severityColor(t, sev) {
    if (sev === 'critical' || sev === 'crit' || sev === 'error') return t.danger;
    if (sev === 'warning' || sev === 'warn') return t.warn;
    if (sev === 'ok' || sev === 'good' || sev === 'success') return t.success;
    return t.textDim;
}

function fmtNum(v, opts) {
    if (v == null || isNaN(v)) return '—';
    var abs = Math.abs(v);
    var sign = v < 0 ? '-' : '';
    if (abs >= 1e9) return sign + (abs / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6) return sign + (abs / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3) return sign + (abs / 1e3).toFixed(1) + 'K';
    if (abs < 1 && abs > 0) return sign + abs.toFixed(2);
    return sign + Math.round(abs).toString();
}

function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

function drawPanel(ctx, t, x, y, w, h) {
    roundRect(ctx, x, y, w, h, 6);
    ctx.fillStyle = t.panel;
    ctx.fill();
    ctx.strokeStyle = t.edge;
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawHGrid(ctx, t, x, y, w, h, divisions) {
    ctx.strokeStyle = t.grid;
    ctx.lineWidth = 0.5;
    for (var i = 1; i < divisions; i++) {
        var gy = y + (h / divisions) * i;
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.lineTo(x + w, gy);
        ctx.stroke();
    }
}

function parseColors(raw, fallback) {
    if (!raw || typeof raw !== 'string') return fallback;
    return raw.split(',').map(function(c) { return c.trim(); }).filter(function(c) { return c.length > 0; });
}

function parseInts(raw) {
    if (!raw || typeof raw !== 'string') return [];
    return raw.split(',').map(function(s) { return parseInt(s.trim(), 10); }).filter(function(n) { return !isNaN(n); });
}

// Phase 6 additions — CON-01, CON-02, CON-03
// getSpacing: responsive spacing base unit
function getSpacing(w) {
    return Math.max(4, Math.round(w * 0.025));
}
// getHoverAlpha: consistent hover highlight alpha across all vizs
function getHoverAlpha() {
    return 0.12;
}
// getTypoScale: returns {hero, body, whisper} font sizes in px
function getTypoScale(w, h) {
    var dim = Math.min(w, h);
    return {
        hero:    Math.max(36, Math.min(72, dim * 0.35)),
        body:    Math.max(14, Math.min(24, dim * 0.14)),
        whisper: Math.max(8,  Math.min(11, dim * 0.07))
    };
}

module.exports = {
    getTheme: getTheme,
    withAlpha: withAlpha,
    lerpColor: lerpColor,
    severityColor: severityColor,
    fmtNum: fmtNum,
    roundRect: roundRect,
    drawPanel: drawPanel,
    drawHGrid: drawHGrid,
    parseColors: parseColors,
    parseInts: parseInts,
    FONTS: FONTS,
    getSpacing: getSpacing,
    getHoverAlpha: getHoverAlpha,
    getTypoScale: getTypoScale
};
```

**Light theme is NOT an inversion of dark.** Design independently:
- Background: `#F0F2F5` (not pure white)
- Panel: `#FFFFFF` with subtle edge
- Text: `#0B0E1A` primary (full opacity for hero values)
- Grid: `rgba(0,0,0,0.06)`
