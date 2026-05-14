'use strict';

var THEME = {
    dark: {
        bg: '#080C18',
        card: '#0F1628',
        cardBorder: 'rgba(0, 229, 204, 0.06)',
        text: '#C8D6E5',
        textBright: '#E8F0FE',
        textMuted: '#4A5875',
        accent: '#00E5CC',
        accentViolet: '#8B5CF6',
        sevCritical: '#FFB020',
        sevHigh: '#D946EF',
        sevMedium: '#38BDF8',
        sevLow: '#475569',
        barBg: '#1A2236',
        rowAlt: 'rgba(0, 229, 204, 0.02)',
        hover: 'rgba(0, 229, 204, 0.08)',
        auroraStart: '#00E5CC',
        auroraEnd: '#8B5CF6'
    },
    fonts: {
        family: '"IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
        heroSize: 56,
        dataSize: 14,
        labelSize: 11,
        whisperSize: 10
    },
    cornerRadius: 2,
    panelPadding: 16
};

function getTheme() {
    return THEME.dark;
}

function getFonts() {
    return THEME.fonts;
}

function getSeverityColor(severity) {
    var t = THEME.dark;
    var s = (severity || '').toLowerCase();
    if (s === 'critical') return t.sevCritical;
    if (s === 'high') return t.sevHigh;
    if (s === 'medium') return t.sevMedium;
    if (s === 'low') return t.sevLow;
    return t.textMuted;
}

function hexToRgba(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
}

function getAccentIntensity(options) {
    var raw = options && options.accentIntensity;
    var val = parseFloat(raw);
    if (isNaN(val)) val = 50;
    return Math.max(0, Math.min(100, val)) / 50;
}

module.exports = {
    getTheme: getTheme,
    getFonts: getFonts,
    getSeverityColor: getSeverityColor,
    hexToRgba: hexToRgba,
    getAccentIntensity: getAccentIntensity,
    THEME: THEME
};
