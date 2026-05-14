/*
 * Uber Operations Viz Pack — design tokens.
 * Mood: speed / urban energy / efficient minimalism
 * ES5 only — no const/let/arrow/template-literals.
 */

function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

function withAlpha(hex, alpha) {
    if (!hex) return 'rgba(0,0,0,' + alpha + ')';
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var r = parseInt(h.substring(0, 2), 16);
    var g = parseInt(h.substring(2, 4), 16);
    var b = parseInt(h.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

function lerpColor(a, b, t) {
    var ah = a.replace('#',''), bh = b.replace('#','');
    if (ah.length === 3) ah = ah[0]+ah[0]+ah[1]+ah[1]+ah[2]+ah[2];
    if (bh.length === 3) bh = bh[0]+bh[0]+bh[1]+bh[1]+bh[2]+bh[2];
    var ar = parseInt(ah.substring(0,2),16);
    var ag = parseInt(ah.substring(2,4),16);
    var ab = parseInt(ah.substring(4,6),16);
    var br = parseInt(bh.substring(0,2),16);
    var bg = parseInt(bh.substring(2,4),16);
    var bb = parseInt(bh.substring(4,6),16);
    var cr = Math.round(ar + (br - ar) * t);
    var cg = Math.round(ag + (bg - ag) * t);
    var cb = Math.round(ab + (bb - ab) * t);
    return 'rgb(' + cr + ',' + cg + ',' + cb + ')';
}

/* ── Uber dark palette ── */
var DARK = {
    name: 'dark',
    bg:        '#0A0A0A',
    panel:     '#141414',
    panelHi:   '#1C1C1C',
    edge:      'rgba(255,255,255,0.06)',
    edgeStrong:'rgba(255,255,255,0.12)',
    grid:      'rgba(255,255,255,0.04)',
    text:      '#F6F6F6',
    textDim:   'rgba(246,246,246,0.60)',
    textFaint: 'rgba(246,246,246,0.28)',
    s1: '#06C167',   /* Uber Green — primary */
    s2: '#276EF1',   /* Uber Blue */
    s3: '#FF6937',   /* Uber Orange */
    s4: '#FFFFFF',   /* White accent */
    s5: '#4A4A4A',   /* Neutral mid-grey */
    accent:  '#06C167',
    success: '#06C167',
    warn:    '#FF6937',
    danger:  '#E11900',
    invert:  '#000000'
};

/* ── Uber light palette ── */
var LIGHT = {
    name: 'light',
    bg:        '#F6F6F6',
    panel:     '#FFFFFF',
    panelHi:   '#F0F0F0',
    edge:      'rgba(0,0,0,0.08)',
    edgeStrong:'rgba(0,0,0,0.15)',
    grid:      'rgba(0,0,0,0.05)',
    text:      '#0A0A0A',
    textDim:   'rgba(10,10,10,0.60)',
    textFaint: 'rgba(10,10,10,0.28)',
    s1: '#048848',
    s2: '#1B4DB3',
    s3: '#D4521E',
    s4: '#0A0A0A',
    s5: '#B0B0B0',
    accent:  '#048848',
    success: '#048848',
    warn:    '#D4521E',
    danger:  '#C41200',
    invert:  '#FFFFFF'
};

function getTheme(name) {
    return (name === 'light') ? LIGHT : DARK;
}

/* ── System fonts — 0KB overhead ── */
var FONTS = {
    data: '"SF Mono", Menlo, Consolas, monospace',
    ui:   '"Helvetica Neue", Helvetica, Arial, sans-serif'
};

/* ── Utilities ── */

function severityColor(t, sev) {
    var s = (sev || '').toString().toLowerCase();
    if (s === 'crit' || s === 'critical' || s === 'high' ||
        s === 'danger' || s === 'error') return t.danger;
    if (s === 'warn' || s === 'warning' || s === 'med' ||
        s === 'medium' || s === 'degraded') return t.warn;
    if (s === 'low' || s === 'info' || s === 'ok' ||
        s === 'success' || s === 'healthy') return t.success;
    return t.textDim;
}

function fmtNum(v, opts) {
    opts = opts || {};
    if (v === null || v === undefined || isNaN(v)) return '—';
    var abs = Math.abs(v);
    if (opts.compact && abs >= 1000) {
        if (abs >= 1e9) return (v / 1e9).toFixed(1) + 'B';
        if (abs >= 1e6) return (v / 1e6).toFixed(1) + 'M';
        if (abs >= 1e3) return (v / 1e3).toFixed(1) + 'k';
    }
    if (opts.fixed !== undefined) return v.toFixed(opts.fixed);
    return Math.round(v).toLocaleString('en-US');
}

function roundRect(ctx, x, y, w, h, r) {
    if (r === undefined) r = 2;
    r = Math.min(r, w / 2, h / 2);
    if (r < 0) r = 0;
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

function drawPanel(ctx, t, x, y, w, h, r) {
    if (r === undefined) r = 2;
    roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r);
    ctx.fillStyle = t.panel;
    ctx.fill();
    ctx.strokeStyle = t.edge;
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawHGrid(ctx, t, x, y, w, h, divisions) {
    ctx.save();
    ctx.strokeStyle = t.grid;
    ctx.lineWidth = 1;
    for (var i = 0; i <= divisions; i++) {
        var gy = Math.round(y + (h * i) / divisions) + 0.5;
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.lineTo(x + w, gy);
        ctx.stroke();
    }
    ctx.restore();
}

function parseColors(raw, fallback) {
    if (!raw) return fallback || [];
    var parts = String(raw).split(',');
    var out = [];
    for (var i = 0; i < parts.length; i++) {
        var c = parts[i].trim();
        if (c) out.push(c);
    }
    return out.length ? out : (fallback || []);
}

function parseInts(raw) {
    if (!raw) return [];
    var parts = String(raw).split(',');
    var out = [];
    for (var i = 0; i < parts.length; i++) {
        var n = parseInt(parts[i].trim(), 10);
        if (!isNaN(n)) out.push(n);
    }
    return out;
}

function parseBool(val, fallback) {
    if (val === undefined || val === null) return fallback;
    return val === 'true' || val === true || val === '1';
}

function parseNum(val, fallback) {
    if (val === undefined || val === null) return fallback;
    var n = parseFloat(val);
    return isNaN(n) ? fallback : n;
}

function getNS(viz) {
    try {
        var info = viz.getPropertyNamespaceInfo();
        if (info && info.propertyNamespace) return info.propertyNamespace;
    } catch (e) {}
    return '';
}

function getOption(config, ns, key, defaultValue) {
    var v = config[ns + key];
    if (v !== undefined && v !== null) return v;
    v = config[key];
    if (v !== undefined && v !== null) return v;
    return defaultValue;
}

function setupCanvas(el) {
    var c = el.querySelector('canvas');
    if (!c) {
        c = document.createElement('canvas');
        c.style.display = 'block';
        c.style.width = '100%';
        c.style.height = '100%';
        el.appendChild(c);
    }
    var rect = el.getBoundingClientRect();
    var w = Math.round(rect.width)  || 300;
    var h = Math.round(rect.height) || 150;
    var dpr = window.devicePixelRatio || 1;
    c.width = w * dpr;
    c.height = h * dpr;
    c.style.width = w + 'px';
    c.style.height = h + 'px';
    var ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    return { canvas: c, ctx: ctx, w: w, h: h, dpr: dpr };
}

function fitText(ctx, text, maxWidth, startSize, minSize, fontFamily) {
    var size = startSize;
    var min = minSize || 8;
    var family = fontFamily || 'sans-serif';
    ctx.font = 'bold ' + size + 'px ' + family;
    while (ctx.measureText(text).width > maxWidth && size > min) {
        size -= 1;
        ctx.font = 'bold ' + size + 'px ' + family;
    }
    return size;
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
    parseBool: parseBool,
    parseNum: parseNum,
    getNS: getNS,
    getOption: getOption,
    setupCanvas: setupCanvas,
    fitText: fitText,
    FONTS: FONTS
};
