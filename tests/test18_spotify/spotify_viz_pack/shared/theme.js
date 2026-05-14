'use strict';

var THEME = {
    dark: {
        bg: '#121212',
        card: '#1E1E1E',
        cardBorder: 'rgba(29, 185, 84, 0.08)',
        text: '#E1E1E1',
        textBright: '#FFFFFF',
        textMuted: 'rgba(255, 255, 255, 0.45)',
        accent: '#1DB954',
        accentHover: '#1ED760',
        purple: '#8B5CF6',
        pink: '#E91E8A',
        blue: '#3B82F6',
        amber: '#F59E0B',
        coral: '#F97066',
        teal: '#14B8A6',
        panelHi: '#282828',
        rowAlt: 'rgba(29, 185, 84, 0.03)',
        hover: 'rgba(29, 185, 84, 0.10)',
        barTrack: '#2A2A2A',
        gradientStart: '#1DB954',
        gradientEnd: '#14B8A6'
    },
    light: {
        bg: '#F5F5F5',
        card: '#FFFFFF',
        cardBorder: 'rgba(29, 185, 84, 0.12)',
        text: '#191414',
        textBright: '#000000',
        textMuted: 'rgba(0, 0, 0, 0.45)',
        accent: '#1DB954',
        accentHover: '#18A34A',
        purple: '#7C3AED',
        pink: '#DB2777',
        blue: '#2563EB',
        amber: '#D97706',
        coral: '#DC2626',
        teal: '#0D9488',
        panelHi: '#EBEBEB',
        rowAlt: 'rgba(29, 185, 84, 0.04)',
        hover: 'rgba(29, 185, 84, 0.08)',
        barTrack: 'rgba(0, 0, 0, 0.06)',
        gradientStart: '#1DB954',
        gradientEnd: '#0D9488'
    },
    fonts: {
        ui: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        data: '"SF Mono", "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace',
        heroSize: 56,
        dataSize: 14,
        labelSize: 11,
        whisperSize: 9
    },
    cornerRadius: 8,
    panelPadding: 16,
    genreColors: ['#1DB954', '#8B5CF6', '#E91E8A', '#3B82F6', '#F59E0B', '#14B8A6', '#F97066', '#6366F1', '#EC4899', '#22D3EE']
};

function getTheme(mode) {
    if (mode === 'light') return THEME.light;
    return THEME.dark;
}

function detectTheme(el) {
    if (!el) return 'dark';
    var node = el;
    var maxDepth = 20;
    while (node && maxDepth-- > 0) {
        var bg = '';
        try { bg = window.getComputedStyle(node).backgroundColor; } catch (e) { /* noop */ }
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            var m = bg.match(/\d+/g);
            if (m && m.length >= 3) {
                var lum = (parseInt(m[0], 10) * 299 + parseInt(m[1], 10) * 587 + parseInt(m[2], 10) * 114) / 1000;
                return lum > 128 ? 'light' : 'dark';
            }
        }
        node = node.parentElement || (node.parentNode && node.parentNode.host) || null;
    }
    return 'dark';
}

function getFonts() {
    return THEME.fonts;
}

function getGenreColor(index) {
    return THEME.genreColors[index % THEME.genreColors.length];
}

function hexToRgba(hex, alpha) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.slice(0, 2), 16);
    var g = parseInt(h.slice(2, 4), 16);
    var b = parseInt(h.slice(4, 6), 16);
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
}

function lerpColor(hex1, hex2, t) {
    var h1 = hex1.replace('#', '');
    var h2 = hex2.replace('#', '');
    var r = Math.round(parseInt(h1.slice(0, 2), 16) * (1 - t) + parseInt(h2.slice(0, 2), 16) * t);
    var g = Math.round(parseInt(h1.slice(2, 4), 16) * (1 - t) + parseInt(h2.slice(2, 4), 16) * t);
    var b = Math.round(parseInt(h1.slice(4, 6), 16) * (1 - t) + parseInt(h2.slice(4, 6), 16) * t);
    return '#' + ('0' + r.toString(16)).slice(-2) + ('0' + g.toString(16)).slice(-2) + ('0' + b.toString(16)).slice(-2);
}

function getAccentIntensity(options) {
    var raw = options && options.accentIntensity;
    var val = parseFloat(raw);
    if (isNaN(val)) val = 50;
    return Math.max(0, Math.min(100, val)) / 50;
}

function fmtNum(n, opts) {
    opts = opts || {};
    if (n === null || n === undefined || isNaN(n)) return '—';
    var abs = Math.abs(n);
    var sign = n < 0 ? '-' : (opts.forceSign && n > 0 ? '+' : '');
    if (abs >= 1e9) return sign + (abs / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6) return sign + (abs / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3) return sign + (abs / 1e3).toFixed(1) + 'K';
    if (opts.decimals !== undefined) return sign + abs.toFixed(opts.decimals);
    return sign + abs.toString();
}

function fillRoundRect(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    if (r < 0) r = 0;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
}

function strokeRoundRect(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    if (r < 0) r = 0;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.stroke();
}

module.exports = {
    getTheme: getTheme,
    detectTheme: detectTheme,
    getFonts: getFonts,
    getGenreColor: getGenreColor,
    hexToRgba: hexToRgba,
    lerpColor: lerpColor,
    getAccentIntensity: getAccentIntensity,
    fmtNum: fmtNum,
    fillRoundRect: fillRoundRect,
    strokeRoundRect: strokeRoundRect,
    THEME: THEME
};
