import { VisualizationAPI } from '@splunk/dashboard-studio-extension';

// === Visual Language ===
// VISUAL_LANG drives check_design.js D01: fillTechnique signals gradient rendering
var VISUAL_LANG = {
    fillTechnique:     'gradient',
    backgroundType:    'solid',
    backgroundPattern: 'none'
};

// === Theme Tokens ===
// Blue/teal test brand palette. DARK and LIGHT are independent — not inversions.
var DARK = {
    name:      'dark',
    bg:        '#0D1117',
    panel:     '#161B22',
    panelHi:   '#21262D',
    edge:      'rgba(255,255,255,0.08)',
    edgeStrong:'rgba(255,255,255,0.16)',
    grid:      'rgba(255,255,255,0.04)',
    text:      '#E6EDF3',
    textDim:   '#8B949E',
    textFaint: '#484F58',
    accent:    '#4ECDC4',
    series:    ['#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'],
    success:   '#3FB950',
    warn:      '#D29922',
    danger:    '#F85149'
};

var LIGHT = {
    name:      'light',
    bg:        '#F0F2F5',
    panel:     '#FFFFFF',
    panelHi:   '#F7F8FA',
    edge:      'rgba(0,0,0,0.10)',
    edgeStrong:'rgba(0,0,0,0.20)',
    grid:      'rgba(0,0,0,0.06)',
    text:      '#0B0E1A',
    textDim:   '#3D4050',
    textFaint: '#6B7080',
    accent:    '#2C9E97',
    series:    ['#2C9E97', '#2980B9', '#27AE60', '#D4A017', '#8E44AD'],
    success:   '#00875A',
    warn:      '#A66200',
    danger:    '#C7001E'
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
    // Gate 1: data still arriving
    if (state.loading) return;

    var data = state.data;

    // Gate 2: no-data fallback
    if (!data || !data.columns || data.columns.length === 0 || data.columns[0].length === 0) {
        canvas.width  = state.width;
        canvas.height = state.height;
        var tb = state.theme === 'dark' ? DARK : LIGHT;
        ctx.fillStyle = tb.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = tb.textFaint;
        ctx.font = '14px "Splunk Platform Sans", sans-serif';
        ctx.textBaseline = 'top';
        ctx.fillText('No data', 16, 16);
        return;
    }

    canvas.width  = state.width;
    canvas.height = state.height;

    var t = state.theme === 'dark' ? DARK : LIGHT;
    var opts = state.options;

    // themeMode override
    var themeMode = opts.themeMode || 'auto';
    if (themeMode !== 'auto') {
        t = themeMode === 'dark' ? DARK : LIGHT;
    }

    var columns  = data.columns;

    // Read options with fallbacks
    var labelText    = safeStr(opts.label || (columns[0] ? safeStr(columns[0][0]) : 'Value'));
    var decimals     = safeNum(opts.decimals, 0);
    var showDelta    = opts.showDelta === true || opts.showDelta === 'true';
    var accentColor  = hexFromSplunk(opts.accentColor, t.accent);
    var accentInt    = clamp01(safeNum(opts.accentIntensity, 50) / 100);

    var rawValue = columns.length > 1 ? columns[1][0] : columns[0][0];
    var numValue = safeNum(rawValue, 0);
    var fmtValue = decimals >= 0 ? numValue.toFixed(decimals) : String(numValue);

    var W = canvas.width;
    var H = canvas.height;

    // Background
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, W, H);

    // Panel card with rounded rect
    var padX = 24, padY = 20;
    var cardX = padX, cardY = padY;
    var cardW = W - padX * 2, cardH = H - padY * 2;
    var rx = 8;

    ctx.fillStyle = t.panel;
    ctx.beginPath();
    ctx.moveTo(cardX + rx, cardY);
    ctx.lineTo(cardX + cardW - rx, cardY);
    ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + rx);
    ctx.lineTo(cardX + cardW, cardY + cardH - rx);
    ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - rx, cardY + cardH);
    ctx.lineTo(cardX + rx, cardY + cardH);
    ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - rx);
    ctx.lineTo(cardX, cardY + rx);
    ctx.quadraticCurveTo(cardX, cardY, cardX + rx, cardY);
    ctx.closePath();
    ctx.fill();

    // Accent gradient bar at top of card
    var barH = 4;
    var grad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
    grad.addColorStop(0, accentColor);
    grad.addColorStop(1, withAlpha(accentColor, accentInt));
    ctx.fillStyle = grad;
    ctx.fillRect(cardX, cardY, cardW, barH);

    // Label text (above value)
    var labelY = cardY + barH + 24;
    ctx.fillStyle = t.textDim;
    ctx.font = '13px "Splunk Platform Sans", sans-serif';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(labelText.toUpperCase(), cardX + 20, labelY);

    // Value text — hero size with gradient fill
    var valueY = labelY + 28;
    var valueFontSize = Math.min(48, Math.floor(cardH * 0.38));
    ctx.font = 'bold ' + valueFontSize + 'px "Splunk Platform Sans", sans-serif';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    var valueGrad = ctx.createLinearGradient(cardX + 20, valueY, cardX + 20, valueY + valueFontSize);
    valueGrad.addColorStop(0, t.text);
    valueGrad.addColorStop(1, lerpColor(t.text, accentColor, 0.3));
    ctx.fillStyle = valueGrad;
    ctx.fillText(fmtValue, cardX + 20, valueY);

    // Delta arrow (optional)
    if (showDelta && columns.length > 1 && columns[1].length > 1) {
        var prevValue = safeNum(columns[1][1], 0);
        var delta = numValue - prevValue;
        var deltaFmt = (delta >= 0 ? '+' : '') + delta.toFixed(decimals >= 0 ? decimals : 1);
        var arrowY = valueY + valueFontSize + 12;
        var arrowColor = delta >= 0 ? t.success : t.danger;
        var arrow = delta >= 0 ? '▲' : '▼';
        ctx.font = '14px "Splunk Platform Sans", sans-serif';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.fillStyle = arrowColor;
        ctx.fillText(arrow + ' ' + deltaFmt, cardX + 20, arrowY);
    }

    // Edge border on card
    ctx.strokeStyle = t.edge;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + rx, cardY);
    ctx.lineTo(cardX + cardW - rx, cardY);
    ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + rx);
    ctx.lineTo(cardX + cardW, cardY + cardH - rx);
    ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - rx, cardY + cardH);
    ctx.lineTo(cardX + rx, cardY + cardH);
    ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - rx);
    ctx.lineTo(cardX, cardY + rx);
    ctx.quadraticCurveTo(cardX, cardY, cardX + rx, cardY);
    ctx.closePath();
    ctx.stroke();
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

// === Drilldown ===
// Click on canvas fires token-setting drilldown with the displayed value
canvas.addEventListener('click', function(evt) {
    var data = state.data;
    if (!data || !data.columns || data.columns.length === 0) return;
    var rawValue = data.columns.length > 1 ? data.columns[1][0] : data.columns[0][0];
    var hitValue = safeStr(rawValue);
    VisualizationAPI.triggerDrilldown({
        action: 'custom.click',
        payload: { name: 'selectedValue', value: hitValue },
        originalEvent: evt
    });
});
