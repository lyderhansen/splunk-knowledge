/*
 * Cloudflare NOC — design tokens.
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
    bg: '#0D0D1F',
    panel: '#161630',
    panelHi: '#1E1E42',
    edge: '#2A2A52',
    edgeStrong: '#3D3D6B',
    grid: 'rgba(246,130,31,0.06)',
    text: '#E8ECF0',
    textDim: '#8B8FA3',
    textFaint: '#555874',
    s1: '#F6821F',
    s2: '#FBAD41',
    s3: '#6ECBF5',
    s4: '#2C7BE5',
    s5: '#A78BFA',
    accent: '#F6821F',
    success: '#34D399',
    warn: '#FBBF24',
    danger: '#EF4444',
    invert: '#0D0D1F'
};

var LIGHT = {
    name: 'light',
    bg: '#F0F2F5',
    panel: '#FFFFFF',
    panelHi: '#F8F9FA',
    edge: '#D1D5DB',
    edgeStrong: '#9CA3AF',
    grid: 'rgba(27,27,58,0.06)',
    text: '#1B1B3A',
    textDim: '#6B7280',
    textFaint: '#9CA3AF',
    s1: '#E5750A',
    s2: '#D4940F',
    s3: '#0284C7',
    s4: '#1D4ED8',
    s5: '#7C3AED',
    accent: '#E5750A',
    success: '#059669',
    warn: '#D97706',
    danger: '#DC2626',
    invert: '#FFFFFF'
};

function getTheme(name) {
    return (name === 'light') ? LIGHT : DARK;
}

var FONTS = {
    data: '"JetBrains Mono", "SF Mono", "Fira Code", "Cascadia Code", monospace',
    ui: '"JetBrains Mono", "SF Mono", "Fira Code", "Cascadia Code", monospace'
};

function severityColor(t, sev) {
    if (sev === 'critical' || sev === 'crit' || sev === 'error' || sev === 'red') return t.danger;
    if (sev === 'warning' || sev === 'warn' || sev === 'amber' || sev === 'yellow') return t.warn;
    if (sev === 'ok' || sev === 'good' || sev === 'success' || sev === 'green' || sev === 'healthy') return t.success;
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
    roundRect(ctx, x, y, w, h, 4);
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
    FONTS: FONTS
};
