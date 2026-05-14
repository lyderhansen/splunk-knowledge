// Apple Retail Analytics — shared design tokens
// Mood: Minimal | Tone: Refined, precise, quiet confidence
// Fonts: SF Pro Display + SF Mono (system — 0KB embedding)

var FONTS = {
    display: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif',
    mono: '"SF Mono", SFMono-Regular, Menlo, Consolas, monospace'
};

var DARK = {
    bg:        '#1D1D1F',
    card:      '#2C2C2E',
    cardHi:    '#3A3A3C',
    text:      '#F5F5F7',
    textDim:   '#98989D',
    textMuted: 'rgba(245,245,247,0.35)',
    accent:    '#0A84FF',
    accentDim: 'rgba(10,132,255,0.15)',
    success:   '#30D158',
    warning:   '#FF9F0A',
    danger:    '#FF453A',
    border:    'rgba(255,255,255,0.08)',
    shadow:    'rgba(0,0,0,0.40)',
    grid:      'rgba(255,255,255,0.06)'
};

var LIGHT = {
    bg:        '#F5F5F7',
    card:      '#FFFFFF',
    cardHi:    '#F0F0F2',
    text:      '#1D1D1F',
    textDim:   '#86868B',
    textMuted: 'rgba(29,29,31,0.30)',
    accent:    '#007AFF',
    accentDim: 'rgba(0,122,255,0.08)',
    success:   '#34C759',
    warning:   '#FF9500',
    danger:    '#FF3B30',
    border:    'rgba(0,0,0,0.06)',
    shadow:    'rgba(0,0,0,0.08)',
    grid:      'rgba(0,0,0,0.06)'
};

var SEMANTIC = {
    critical: { dark: '#FF453A', light: '#FF3B30' },
    warning:  { dark: '#FF9F0A', light: '#FF9500' },
    good:     { dark: '#30D158', light: '#34C759' },
    info:     { dark: '#0A84FF', light: '#007AFF' },
    neutral:  { dark: '#98989D', light: '#86868B' }
};

var CATEGORY_COLORS = [
    '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#FF9500',
    '#FFCC00', '#34C759', '#00C7BE', '#30B0C7', '#64D2FF'
];

function getTheme(mode) {
    return mode === 'light' ? LIGHT : DARK;
}

function getSemantic(key, mode) {
    var s = SEMANTIC[key];
    if (!s) return '#98989D';
    return mode === 'light' ? s.light : s.dark;
}

function detectTheme() {
    try {
        if (typeof SplunkVisualizationUtils !== 'undefined' &&
            SplunkVisualizationUtils.getCurrentTheme) {
            var st = SplunkVisualizationUtils.getCurrentTheme();
            if (st === 'light' || st === 'dark') return st;
        }
    } catch (e) {}
    var body = document.body;
    if (body) {
        var dt = body.getAttribute('data-theme');
        if (dt === 'light' || dt === 'dark') return dt;
        if (body.classList.contains('light')) return 'light';
        if (body.classList.contains('dark')) return 'dark';
    }
    try {
        var bg = window.getComputedStyle(document.body).backgroundColor;
        var m = bg.match(/\d+/g);
        if (m && m.length >= 3) {
            return (parseInt(m[0]) + parseInt(m[1]) + parseInt(m[2])) / 3 < 128
                   ? 'dark' : 'light';
        }
    } catch (e) {}
    return 'light';
}

function safeStr(val) {
    return (val != null && val !== '') ? String(val) : '';
}

function fmtNum(n, opts) {
    opts = opts || {};
    var decimals = opts.decimals;
    if (decimals !== undefined && decimals >= 0) return n.toFixed(decimals);
    var abs = Math.abs(n);
    if (abs >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (abs >= 1e4) return (n / 1e3).toFixed(1) + 'K';
    if (abs >= 1e3) return n.toLocaleString ? n.toLocaleString() : String(n);
    if (Number.isInteger(n)) return String(n);
    return n.toFixed(1);
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

function lerpColor(a, b, t) {
    var ah = parseInt(a.replace('#', ''), 16);
    var bh = parseInt(b.replace('#', ''), 16);
    var ar = (ah >> 16) & 0xFF, ag = (ah >> 8) & 0xFF, ab = ah & 0xFF;
    var br = (bh >> 16) & 0xFF, bg2 = (bh >> 8) & 0xFF, bb = bh & 0xFF;
    var rr = Math.round(ar + (br - ar) * t);
    var rg = Math.round(ag + (bg2 - ag) * t);
    var rb = Math.round(ab + (bb - ab) * t);
    return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb).toString(16).slice(1);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FONTS: FONTS,
        DARK: DARK,
        LIGHT: LIGHT,
        SEMANTIC: SEMANTIC,
        CATEGORY_COLORS: CATEGORY_COLORS,
        getTheme: getTheme,
        getSemantic: getSemantic,
        detectTheme: detectTheme,
        safeStr: safeStr,
        fmtNum: fmtNum,
        getOption: getOption,
        getNS: getNS,
        lerpColor: lerpColor
    };
}
