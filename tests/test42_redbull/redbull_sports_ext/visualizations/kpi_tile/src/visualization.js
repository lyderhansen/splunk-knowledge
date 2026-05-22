import { VisualizationAPI } from '@splunk/dashboard-studio-extension';

// === Visual Language — Red Bull: sharp, kinetic, aggressive ===
// fillTechnique drives check_design.js D01
var VISUAL_LANG = {
    fillTechnique:     'gradient',
    backgroundType:    'solid',
    backgroundPattern: 'none'
};

// === Theme Tokens — Red Bull brand palette ===
// Midnight blue #0C1B3A, silver #C8C8C8, Red Bull red #DB0032, gold #F5C518
var DARK = {
    name:       'dark',
    bg:         '#060E1F',
    panel:      '#0C1B3A',
    panelHi:    '#142444',
    edge:       'rgba(200,200,200,0.12)',
    edgeStrong: 'rgba(200,200,200,0.25)',
    grid:       'rgba(200,200,200,0.06)',
    text:       '#FFFFFF',
    textDim:    '#C8C8C8',
    textFaint:  '#8090A8',
    accent:     '#F5C518',
    series:     ['#DB0032', '#F5C518', '#C8C8C8', '#1A6FBF', '#FF5C00'],
    success:    '#00C851',
    warn:       '#FF8800',
    danger:     '#DB0032'
};

// Light theme — independent design, not an inversion of dark.
var LIGHT = {
    name:       'light',
    bg:         '#F0F2F5',
    panel:      '#FFFFFF',
    panelHi:    '#F7F8FA',
    edge:       'rgba(0,0,0,0.10)',
    edgeStrong: 'rgba(0,0,0,0.20)',
    grid:       'rgba(0,0,0,0.06)',
    text:       '#0B0E1A',
    textDim:    '#3D4050',
    textFaint:  '#6B7080',
    accent:     '#C8A000',
    series:     ['#B00028', '#C8A000', '#5A6070', '#1055A0', '#CC4400'],
    success:    '#00875A',
    warn:       '#A66200',
    danger:     '#C7001E'
};

// === Utility Functions ===
function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

function withAlpha(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + clamp01(alpha) + ')';
}

function lerpColor(a, b, t) {
    t = clamp01(t);
    var ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16);
    var br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
    var rr = Math.round(ar + (br - ar) * t), gg = Math.round(ag + (bg - ag) * t), bl = Math.round(ab + (bb - ab) * t);
    return '#' + ((1 << 24) + (rr << 16) + (gg << 8) + bl).toString(16).slice(1);
}

function safeStr(v) { return v == null ? '' : String(v); }
function safeNum(v, fb) { var n = parseFloat(v); return isNaN(n) ? (fb || 0) : n; }

function hexFromSplunk(val, fallback) {
    if (typeof val === 'number') {
        return '#' + ('000000' + (val >>> 0).toString(16)).slice(-6);
    }
    return (typeof val === 'string' && val.charAt(0) === '#') ? val : (fallback || '#ffffff');
}

function fmtNum(v) {
    if (v == null || isNaN(v)) return '—';
    var abs = Math.abs(v);
    var sign = v < 0 ? '-' : '';
    if (abs >= 1e9) return sign + (abs / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6) return sign + (abs / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3) return sign + (abs / 1e3).toFixed(1) + 'K';
    return sign + Math.round(abs).toString();
}

// Red Bull sharp corner rounded rect (radius=2 for kinetic look)
function roundRect(ctx, x, y, w, h, r) {
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

// === Canvas Setup ===
var root = document.getElementById('root');
var canvas = document.createElement('canvas');
canvas.style.width = '100%';
canvas.style.height = '100%';
root.appendChild(canvas);
var ctx = canvas.getContext('2d');

// === State ===
var state = {
    data:    null,
    loading: false,
    options: {},
    theme:   'dark',
    width:   500,
    height:  300
};

// === Render ===
function render() {
    try { _render(); } catch(e) {
        canvas.width = state.width || 400; canvas.height = state.height || 200;
        ctx.fillStyle = '#000'; ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = '#f00'; ctx.font = '12px monospace'; ctx.textBaseline = 'top';
        ctx.fillText('ERROR: ' + e.message, 8, 8);
        ctx.fillText('w=' + state.width + ' h=' + state.height + ' data=' + !!state.data + ' loading=' + state.loading, 8, 24);
    }
}
function _render() {
    // Gate 1: data still arriving
    if (state.loading) return;

    var data = state.data;

    // Gate 2: no-data fallback — render brand typography, not a blank panel
    if (!data || !data.columns || data.columns.length === 0 || data.columns[0].length === 0) {
        canvas.width  = state.width;
        canvas.height = state.height;
        var tb = state.theme === 'dark' ? DARK : LIGHT;
        ctx.fillStyle = tb.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = tb.textFaint;
        ctx.font = '14px "Splunk Platform Sans", Arial, sans-serif';
        ctx.textBaseline = 'top';
        ctx.fillText('No data', 16, 16);
        return;
    }

    canvas.width  = state.width;
    canvas.height = state.height;

    var t = state.theme === 'dark' ? DARK : LIGHT;
    var opts = state.options;

    // themeMode override (default: 'auto')
    var themeMode = opts.themeMode || 'auto';
    if (themeMode !== 'auto') {
        t = themeMode === 'dark' ? DARK : LIGHT;
    }

    // Columnar data access — all values are strings, parse as needed
    var columns  = data.columns;

    // Read options with defensive fallbacks
    var labelText    = safeStr(opts.label || (columns[0] ? safeStr(columns[0][0]) : 'Value'));
    var decimals     = safeNum(opts.decimals, 0);
    var showDelta    = opts.showDelta === true || opts.showDelta === 'true';
    var accentColor  = hexFromSplunk(opts.accentColor, t.accent);
    var accentInt    = clamp01(safeNum(opts.accentIntensity, 50) / 100);

    // Primary value: prefer column[1][0] (label,value pattern), fallback to column[0][0]
    var rawValue = columns.length > 1 ? columns[1][0] : columns[0][0];
    var numValue = safeNum(rawValue, 0);
    var fmtValue = decimals >= 0 ? numValue.toFixed(decimals) : fmtNum(numValue);

    var W = canvas.width;
    var H = canvas.height;

    // === Background — deep midnight gradient ===
    var bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, t.bg);
    bgGrad.addColorStop(1, lerpColor(t.bg, t.panel, 0.5));
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // === Panel card with sharp Red Bull corners ===
    var padX = 20, padY = 16;
    var cardX = padX, cardY = padY;
    var cardW = W - padX * 2, cardH = H - padY * 2;
    var rx = 2;  // Red Bull brand: sharp corners

    roundRect(ctx, cardX, cardY, cardW, cardH, rx);
    ctx.fillStyle = t.panel;
    ctx.fill();

    // === Accent gradient bar at top of card ===
    var barH = 3;
    var barGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
    barGrad.addColorStop(0, accentColor);
    barGrad.addColorStop(0.6, lerpColor(accentColor, t.series[0], 0.5));
    barGrad.addColorStop(1, withAlpha(accentColor, accentInt));
    roundRect(ctx, cardX, cardY, cardW, barH, rx);
    ctx.fillStyle = barGrad;
    ctx.fill();

    // === Label text (UPPERCASE — Red Bull brand style) ===
    var labelY = cardY + barH + 18;
    ctx.fillStyle    = t.textDim;
    ctx.font         = '11px "Splunk Platform Sans", "Arial Narrow", Arial, sans-serif';
    ctx.textBaseline = 'top';
    ctx.textAlign    = 'left';
    ctx.letterSpacing = '0.08em';
    ctx.fillText(labelText.toUpperCase(), cardX + 18, labelY);

    // === Hero value with gradient fill ===
    var valueY = labelY + 24;
    var valueFontSize = Math.min(52, Math.max(28, Math.floor(cardH * 0.40)));
    ctx.font         = 'bold ' + valueFontSize + 'px Impact, "Arial Black", "Arial Narrow", sans-serif';
    ctx.textBaseline = 'top';
    ctx.textAlign    = 'left';

    // Gradient fill: t.text -> accent blend (D08: hero text uses t.text on light)
    var valGrad = ctx.createLinearGradient(cardX + 18, valueY, cardX + 18, valueY + valueFontSize);
    valGrad.addColorStop(0, t.text);
    valGrad.addColorStop(1, lerpColor(t.text, accentColor, 0.25));
    ctx.fillStyle = valGrad;
    ctx.fillText(fmtValue, cardX + 18, valueY);

    // === Delta arrow (optional — requires 2+ rows in primary data) ===
    if (showDelta && columns.length > 1 && columns[1].length > 1) {
        var prevValue = safeNum(columns[1][1], 0);
        var delta     = numValue - prevValue;
        var pctDelta  = prevValue !== 0 ? ((delta / Math.abs(prevValue)) * 100).toFixed(1) : '0.0';
        var deltaFmt  = (delta >= 0 ? '+' : '') + delta.toFixed(decimals >= 0 ? decimals : 1) + ' (' + pctDelta + '%)';
        var arrowY    = valueY + valueFontSize + 10;
        var arrowClr  = delta >= 0 ? t.success : t.danger;
        var arrow     = delta >= 0 ? '▲' : '▼';
        ctx.font         = '13px "Splunk Platform Sans", Arial, sans-serif';
        ctx.textBaseline = 'top';
        ctx.textAlign    = 'left';
        ctx.fillStyle    = arrowClr;
        ctx.fillText(arrow + ' ' + deltaFmt, cardX + 18, arrowY);
    }

    // === Edge border (subtle — matches Red Bull silver palette) ===
    roundRect(ctx, cardX, cardY, cardW, cardH, rx);
    ctx.strokeStyle = t.edge;
    ctx.lineWidth   = 1;
    ctx.stroke();

    // === Ambient glow on accent bar edge ===
    ctx.save();
    ctx.shadowBlur  = 8;
    ctx.shadowColor = withAlpha(accentColor, 0.4);
    roundRect(ctx, cardX, cardY, cardW, barH + 2, rx);
    ctx.fillStyle = 'transparent';
    ctx.fill();
    ctx.restore();
}

// === Listeners ===
VisualizationAPI.addDataSourcesListener(function(ds) {
    state.loading = ds.loading;
    state.data = (ds.dataSources && ds.dataSources.primary)
        ? ds.dataSources.primary.data
        : null;
    render();
}, { invokeImmediately: true });

VisualizationAPI.addOptionsListener(function(o) {
    state.options = o.options;
    render();
});

VisualizationAPI.addThemeListener(function(t) {
    state.theme = t.theme;
    render();
});

VisualizationAPI.addDimensionsListener(function(d) {
    state.width  = d.width;
    state.height = d.height;
    render();
});

// === Drilldown — click fires token with displayed value ===
canvas.addEventListener('click', function(evt) {
    var data = state.data;
    if (!data || !data.columns || data.columns.length === 0) return;
    var rawValue = data.columns.length > 1 ? data.columns[1][0] : data.columns[0][0];
    VisualizationAPI.triggerDrilldown({
        action: 'custom.click',
        payload: { name: 'selectedValue', value: safeStr(rawValue) },
        originalEvent: evt
    });
});
