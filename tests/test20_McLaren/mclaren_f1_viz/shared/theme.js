// McLaren Racing F1 Telemetry — Shared Design Tokens
// Inlined by build_flat.js into every visualization.js

var FONTS = {
    ui: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    data: '"SF Mono", Menlo, Consolas, "Liberation Mono", monospace'
};

function getTheme(mode) {
    if (mode === 'light') {
        return {
            bg: '#F2F2F2',
            panel: '#FFFFFF',
            panelHi: '#F8F8F8',
            edge: 'rgba(0,0,0,0.08)',
            edgeStrong: 'rgba(0,0,0,0.15)',
            text: '#1E1E1E',
            textDim: 'rgba(30,30,30,0.55)',
            textFaint: 'rgba(30,30,30,0.28)',
            accent: '#FF8000',
            accent2: '#47C7FC',
            danger: '#E53935',
            warning: '#FFB300',
            safe: '#00C853',
            purple: '#A855F7',
            grid: 'rgba(0,0,0,0.06)',
            soft: '#E53935',
            medium: '#FFB300',
            hard: '#9E9E9E',
            inter: '#00C853',
            wet: '#2196F3',
            s1: '#FF8000', s2: '#47C7FC', s3: '#A855F7',
            s4: '#00C853', s5: '#E53935'
        };
    }
    return {
        bg: '#121212',
        panel: '#1E1E1E',
        panelHi: '#252525',
        edge: 'rgba(255,128,0,0.08)',
        edgeStrong: 'rgba(255,128,0,0.15)',
        text: '#E8E8E8',
        textDim: 'rgba(232,232,232,0.50)',
        textFaint: 'rgba(232,232,232,0.28)',
        accent: '#FF8000',
        accent2: '#47C7FC',
        danger: '#FF3333',
        warning: '#FFD700',
        safe: '#00D26A',
        purple: '#A855F7',
        grid: 'rgba(255,255,255,0.05)',
        soft: '#FF3333',
        medium: '#FFD700',
        hard: '#FFFFFF',
        inter: '#00D26A',
        wet: '#47C7FC',
        s1: '#FF8000', s2: '#47C7FC', s3: '#A855F7',
        s4: '#00D26A', s5: '#FF3333'
    };
}

function withAlpha(hex, alpha) {
    if (!hex) return 'rgba(0,0,0,' + alpha + ')';
    if (hex.indexOf('rgba') === 0) {
        return hex.replace(/,\s*[\d.]+\)$/, ',' + alpha + ')');
    }
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.substring(0, 2), 16);
    var g = parseInt(h.substring(2, 4), 16);
    var b = parseInt(h.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

function lerpColor(a, b, t) {
    var ah = a.replace('#', ''), bh = b.replace('#', '');
    if (ah.length === 3) ah = ah[0] + ah[0] + ah[1] + ah[1] + ah[2] + ah[2];
    if (bh.length === 3) bh = bh[0] + bh[0] + bh[1] + bh[1] + bh[2] + bh[2];
    var ar = parseInt(ah.substring(0, 2), 16), ag = parseInt(ah.substring(2, 4), 16), ab = parseInt(ah.substring(4, 6), 16);
    var br = parseInt(bh.substring(0, 2), 16), bg = parseInt(bh.substring(2, 4), 16), bb = parseInt(bh.substring(4, 6), 16);
    var rr = Math.round(ar + (br - ar) * t);
    var gg = Math.round(ag + (bg - ag) * t);
    var bl = Math.round(ab + (bb - ab) * t);
    return '#' + ((1 << 24) + (rr << 16) + (gg << 8) + bl).toString(16).slice(1);
}

function roundRect(ctx, x, y, w, h, r) {
    if (r === undefined) r = 0;
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
    return String(v);
}

function fitText(ctx, text, maxWidth, startSize, minSize, fontFamily) {
    var size = startSize;
    var min = minSize || 8;
    var family = fontFamily || FONTS.ui;
    ctx.font = 'bold ' + size + 'px ' + family;
    while (ctx.measureText(text).width > maxWidth && size > min) {
        size -= 1;
        ctx.font = 'bold ' + size + 'px ' + family;
    }
    return size;
}

function getOption(config, ns, key, defaultValue) {
    var v = config[ns + key];
    if (v !== undefined && v !== null) return v;
    v = config[key];
    if (v !== undefined && v !== null) return v;
    return defaultValue;
}

function getNS(viz) {
    try {
        var info = viz.getPropertyNamespaceInfo();
        if (info && info.propertyNamespace) return info.propertyNamespace;
    } catch (e) {}
    return '';
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

function setupCanvas(el) {
    var canvas = el.querySelector('canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.style.cssText = 'display:block;width:100%;height:100%;';
        el.appendChild(canvas);
    }
    var rect = el.getBoundingClientRect();
    var w = rect.width || el.offsetWidth || 400;
    var h = rect.height || el.offsetHeight || 300;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { canvas: canvas, ctx: ctx, w: w, h: h, dpr: dpr };
}

module.exports = {
    FONTS: FONTS,
    getTheme: getTheme,
    withAlpha: withAlpha,
    lerpColor: lerpColor,
    roundRect: roundRect,
    fmtNum: fmtNum,
    fitText: fitText,
    getOption: getOption,
    getNS: getNS,
    parseBool: parseBool,
    parseNum: parseNum,
    parseColors: parseColors,
    setupCanvas: setupCanvas
};
