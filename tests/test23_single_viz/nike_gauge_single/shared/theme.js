/*
 * Nike Gauge — design tokens.
 * ES5 only.
 */

function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16)
    };
}

function withAlpha(hex, alpha) {
    var c = hexToRgb(hex);
    return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + clamp01(alpha) + ')';
}

function lerpColor(a, b, t) {
    t = clamp01(t);
    var ca = hexToRgb(a);
    var cb = hexToRgb(b);
    var r = Math.round(ca.r + (cb.r - ca.r) * t);
    var g = Math.round(ca.g + (cb.g - ca.g) * t);
    var bl = Math.round(ca.b + (cb.b - ca.b) * t);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
}

var DARK = {
    name: 'dark',
    bg: '#0A0A0A',
    panel: '#111111',
    panelHi: '#1A1A1A',
    edge: 'rgba(255,255,255,0.06)',
    edgeStrong: 'rgba(255,255,255,0.12)',
    grid: 'rgba(255,255,255,0.05)',
    text: '#F0F0F0',
    textDim: '#999999',
    textFaint: '#555555',
    accent: '#CDFF00',
    success: '#00E676',
    warn: '#FFAB00',
    danger: '#FF3D00',
    track: '#1F1F1F',
    trackHi: '#2A2A2A'
};

var LIGHT = {
    name: 'light',
    bg: '#F5F5F5',
    panel: '#FFFFFF',
    panelHi: '#F0F0F0',
    edge: 'rgba(0,0,0,0.08)',
    edgeStrong: 'rgba(0,0,0,0.15)',
    grid: 'rgba(0,0,0,0.06)',
    text: '#111111',
    textDim: '#666666',
    textFaint: '#AAAAAA',
    accent: '#9EBF00',
    success: '#00A651',
    warn: '#E08A00',
    danger: '#D32F2F',
    track: '#E0E0E0',
    trackHi: '#D0D0D0'
};

function getTheme(name) {
    return (name === 'light') ? LIGHT : DARK;
}

var FONTS = {
    data: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    ui: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
};

function fmtNum(v, opts) {
    if (v == null || isNaN(v)) return '—';
    var abs = Math.abs(v);
    if (abs >= 1e9) return (v / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3) return (v / 1e3).toFixed(1) + 'k';
    if (abs < 10 && abs !== Math.floor(abs)) return v.toFixed(1);
    return String(Math.round(v));
}

module.exports = {
    getTheme: getTheme,
    withAlpha: withAlpha,
    lerpColor: lerpColor,
    hexToRgb: hexToRgb,
    fmtNum: fmtNum,
    FONTS: FONTS
};
