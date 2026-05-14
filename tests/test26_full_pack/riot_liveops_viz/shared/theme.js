/*
 * Riot Games Live Ops — design tokens.
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
    bg: '#010A13',
    panel: '#0A1628',
    panelHi: '#0D1F38',
    edge: '#1E2328',
    edgeStrong: '#3C3C41',
    grid: 'rgba(30,35,40,0.5)',
    text: '#F0E6D2',
    textDim: '#A09B8C',
    textFaint: '#5B5A56',
    s1: '#0AC8B9',
    s2: '#C89B3C',
    s3: '#E84057',
    s4: '#F0B232',
    s5: '#0397AB',
    accent: '#0AC8B9',
    success: '#0AC8B9',
    warn: '#F0B232',
    danger: '#E84057',
    invert: '#F0E6D2'
};

var LIGHT = {
    name: 'light',
    bg: '#F0F0F0',
    panel: '#FFFFFF',
    panelHi: '#F5F5F5',
    edge: '#D0D0D0',
    edgeStrong: '#999999',
    grid: 'rgba(0,0,0,0.06)',
    text: '#1A1A1A',
    textDim: '#666666',
    textFaint: '#999999',
    s1: '#0AC8B9',
    s2: '#C89B3C',
    s3: '#E84057',
    s4: '#C08820',
    s5: '#0397AB',
    accent: '#0AC8B9',
    success: '#0AC8B9',
    warn: '#C08820',
    danger: '#E84057',
    invert: '#1A1A1A'
};

function getTheme(name) {
    return (name === 'light') ? LIGHT : DARK;
}

var FONTS = {
    data: '"Beaufort for LOL", "Trajan Pro", "Georgia", serif',
    ui: '"Spiegel", "Segoe UI", "Helvetica Neue", sans-serif'
};

var BEAUFORT_BASE64 = '';
var SPIEGEL_BASE64 = '';

var _fontsLoaded = false;
function loadFonts() {
    if (_fontsLoaded) return;
    _fontsLoaded = true;
    if (BEAUFORT_BASE64) {
        try {
            var s = document.createElement('style');
            s.textContent = '@font-face{font-family:"Beaufort for LOL";src:url(data:font/woff2;base64,' + BEAUFORT_BASE64 + ') format("woff2");font-weight:700;font-display:swap;}';
            document.head.appendChild(s);
        } catch (e) {}
    }
    if (SPIEGEL_BASE64) {
        try {
            var s2 = document.createElement('style');
            s2.textContent = '@font-face{font-family:"Spiegel";src:url(data:font/woff2;base64,' + SPIEGEL_BASE64 + ') format("woff2");font-weight:400;font-display:swap;}';
            document.head.appendChild(s2);
        } catch (e) {}
    }
}

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
    loadFonts: loadFonts,
    FONTS: FONTS
};
