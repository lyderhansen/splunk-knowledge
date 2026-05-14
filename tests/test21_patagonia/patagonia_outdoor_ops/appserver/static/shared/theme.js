// Patagonia Outdoor Operations — shared design tokens
// Mood: Organic | Tone: grounded, purposeful, organic

var PALETTES = {
    dark: {
        bg:        '#1C1A17',
        panel:     '#242220',
        panelHi:   '#2E2C29',
        text:      '#E6E1D9',
        textDim:   'rgba(230,225,217,0.50)',
        textMuted: 'rgba(230,225,217,0.25)',
        green:     '#5E8F5C',
        sandstone: '#C9956B',
        glacier:   '#6899A9',
        earth:     '#8B6B4A',
        rust:      '#B86B52',
        ridge:     '#3D5A3A',
        accent:    '#5E8F5C',
        grid:      'rgba(230,225,217,0.06)',
        edge:      'rgba(230,225,217,0.04)',
        glow:      'rgba(94,143,92,0.35)'
    },
    light: {
        bg:        '#F4F1EB',
        panel:     '#FFFFFF',
        panelHi:   '#F8F6F2',
        text:      '#1C1A17',
        textDim:   'rgba(28,26,23,0.50)',
        textMuted: 'rgba(28,26,23,0.25)',
        green:     '#4A7A48',
        sandstone: '#B07F55',
        glacier:   '#527F8F',
        earth:     '#6E5538',
        rust:      '#A05840',
        ridge:     '#6B8F68',
        accent:    '#4A7A48',
        grid:      'rgba(28,26,23,0.06)',
        edge:      'rgba(28,26,23,0.06)',
        glow:      'rgba(74,122,72,0.20)'
    }
};

var FONTS = {
    ui:   '"Barlow Semi Condensed", "Helvetica Neue", Helvetica, Arial, sans-serif',
    data: '"SF Mono", Menlo, Consolas, monospace'
};

var STATUS_COLORS = {
    dark: {
        healthy:  '#5E8F5C',
        warning:  '#C9956B',
        critical: '#B86B52',
        info:     '#6899A9'
    },
    light: {
        healthy:  '#4A7A48',
        warning:  '#B07F55',
        critical: '#A05840',
        info:     '#527F8F'
    }
};

var SERIES_COLORS = {
    dark: ['#5E8F5C', '#6899A9', '#C9956B', '#8B6B4A', '#B86B52', '#7EA97C', '#89B3C0'],
    light: ['#4A7A48', '#527F8F', '#B07F55', '#6E5538', '#A05840', '#6B8F68', '#6E99A8']
};

function getTheme(mode) {
    var m = (mode === 'light') ? 'light' : 'dark';
    return {
        palette: PALETTES[m],
        fonts: FONTS,
        status: STATUS_COLORS[m],
        series: SERIES_COLORS[m],
        mode: m
    };
}

function lerpColor(a, b, t) {
    var ah = parseInt(a.replace('#', ''), 16);
    var bh = parseInt(b.replace('#', ''), 16);
    var ar = (ah >> 16) & 0xFF, ag = (ah >> 8) & 0xFF, ab = ah & 0xFF;
    var br = (bh >> 16) & 0xFF, bg_ = (bh >> 8) & 0xFF, bb = bh & 0xFF;
    var rr = Math.round(ar + (br - ar) * t);
    var rg = Math.round(ag + (bg_ - ag) * t);
    var rb = Math.round(ab + (bb - ab) * t);
    return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb).toString(16).slice(1);
}

function fmtNum(n, opts) {
    opts = opts || {};
    if (typeof n !== 'number' || isNaN(n)) return String(n || '—');
    if (opts.compact) {
        if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
        if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    }
    var d = (opts.decimals !== undefined && opts.decimals >= 0) ? opts.decimals : 0;
    var parts = n.toFixed(d).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    var result = parts.join('.');
    if (opts.unit) {
        if (opts.unitPosition === 'before') return opts.unit + result;
        return result + opts.unit;
    }
    return result;
}

function setupCanvas(container) {
    var canvas = container.querySelector('canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:absolute;top:0;left:0;';
        container.appendChild(canvas);
    }
    var w = container.clientWidth || container.offsetWidth || window.innerWidth || 300;
    var h = container.clientHeight || container.offsetHeight || window.innerHeight || 200;
    if (w < 10) w = window.innerWidth || 300;
    if (h < 10) h = window.innerHeight || 200;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { canvas: canvas, ctx: ctx, w: w, h: h, dpr: dpr };
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

function detectTheme() {
    try {
        var body = document.body;
        if (body) {
            var dt = body.getAttribute('data-theme');
            if (dt === 'light' || dt === 'dark') return dt;
            if (body.classList.contains('light')) return 'light';
            if (body.classList.contains('dark')) return 'dark';
        }
        var bg = window.getComputedStyle(document.body).backgroundColor;
        var m = bg.match(/\d+/g);
        if (m && m.length >= 3) {
            var avg = (parseInt(m[0]) + parseInt(m[1]) + parseInt(m[2])) / 3;
            return avg < 128 ? 'dark' : 'light';
        }
    } catch (e) {}
    return 'dark';
}

function hexToRgba(hex, alpha) {
    var h = hex.replace('#', '');
    var r = parseInt(h.substring(0, 2), 16);
    var g = parseInt(h.substring(2, 4), 16);
    var b = parseInt(h.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

function drawRidgeline(ctx, x, y, width, height, color) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    var peaks = [
        [0.00, 1.0], [0.05, 0.7], [0.10, 0.5], [0.14, 0.3],
        [0.18, 0.55], [0.22, 0.2], [0.26, 0.45], [0.30, 0.1],
        [0.34, 0.35], [0.38, 0.0], [0.42, 0.25], [0.46, 0.4],
        [0.50, 0.15], [0.54, 0.5], [0.58, 0.3], [0.62, 0.05],
        [0.66, 0.35], [0.70, 0.55], [0.74, 0.2], [0.78, 0.45],
        [0.82, 0.6], [0.86, 0.4], [0.90, 0.7], [0.95, 0.85],
        [1.00, 1.0]
    ];
    for (var i = 0; i < peaks.length; i++) {
        var px = x + peaks[i][0] * width;
        var py = y + peaks[i][1] * height;
        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            var prev = peaks[i - 1];
            var cpx = x + (prev[0] + peaks[i][0]) * 0.5 * width;
            ctx.quadraticCurveTo(cpx, y + prev[1] * height, px, py);
        }
    }
    ctx.lineTo(x + width, y + height);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PALETTES: PALETTES,
        FONTS: FONTS,
        STATUS_COLORS: STATUS_COLORS,
        SERIES_COLORS: SERIES_COLORS,
        getTheme: getTheme,
        detectTheme: detectTheme,
        lerpColor: lerpColor,
        hexToRgba: hexToRgba,
        fmtNum: fmtNum,
        setupCanvas: setupCanvas,
        getOption: getOption,
        getNS: getNS,
        drawRidgeline: drawRidgeline
    };
}
