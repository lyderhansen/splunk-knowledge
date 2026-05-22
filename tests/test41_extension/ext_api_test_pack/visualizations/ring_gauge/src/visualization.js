import { VisualizationAPI } from '@splunk/dashboard-studio-extension';

// === Visual Language ===
var VISUAL_LANG = {
    fillTechnique:     'gradient',
    backgroundType:    'solid',
    backgroundPattern: 'none'
};

// === Theme Tokens ===
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

// === Zone Color Helper ===
// 0-33 = danger, 34-66 = warn, 67-100 = success with smooth gradient transition
function zoneColor(t, pct) {
    if (pct <= 0.33) {
        return lerpColor(t.danger, t.warn, pct / 0.33);
    } else if (pct <= 0.66) {
        return lerpColor(t.warn, t.success, (pct - 0.33) / 0.33);
    } else {
        return lerpColor(t.success, t.accent, (pct - 0.66) / 0.34);
    }
}

// === Render ===
function render() {
    if (state.loading) return;

    var data = state.data;

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

    var themeMode = opts.themeMode || 'auto';
    if (themeMode !== 'auto') {
        t = themeMode === 'dark' ? DARK : LIGHT;
    }

    var columns  = data.columns;

    // Read options
    var minValue    = safeNum(opts.minValue, 0);
    var maxValue    = safeNum(opts.maxValue, 100);
    if (maxValue <= minValue) maxValue = minValue + 1;
    var arcWidth    = Math.max(4, safeNum(opts.arcWidth, 20));
    var showLabel   = opts.showLabel !== false && opts.showLabel !== 'false';
    var accentColor = hexFromSplunk(opts.accentColor, t.accent);

    // Read data: columns[0][0] = label, columns[1][0] = value
    var labelText = safeStr(columns[0][0]);
    var rawValue  = columns.length > 1 ? columns[1][0] : columns[0][0];
    var numValue  = safeNum(rawValue, 0);

    var W = canvas.width;
    var H = canvas.height;

    // Background
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, W, H);

    // Ring geometry: center, radius
    var centerX = W / 2;
    var centerY = showLabel ? H * 0.46 : H / 2;
    var outerR  = Math.min(W, H) * 0.38;
    var innerR  = outerR - arcWidth;

    var startAngle = Math.PI * 0.75;    // 135deg — bottom-left
    var endAngle   = Math.PI * 2.25;    // 405deg — bottom-right (270 deg sweep)
    var totalSweep = endAngle - startAngle;

    // Clamp value to [min, max] range, then normalize to [0,1]
    var clamped = Math.max(minValue, Math.min(maxValue, numValue));
    var pct     = (clamped - minValue) / (maxValue - minValue);
    var fillEnd = startAngle + totalSweep * pct;

    // Track arc (background)
    ctx.beginPath();
    ctx.arc(centerX, centerY, (outerR + innerR) / 2, startAngle, endAngle, false);
    ctx.strokeStyle = t.edge;
    ctx.lineWidth   = arcWidth;
    ctx.lineCap     = 'round';
    ctx.stroke();

    // Foreground arc with zone-based gradient color
    if (pct > 0) {
        var arcColor = zoneColor(t, pct);
        // Create conical-like gradient by blending from accent to zone color
        var fgGrad = ctx.createLinearGradient(
            centerX + Math.cos(startAngle) * outerR,
            centerY + Math.sin(startAngle) * outerR,
            centerX + Math.cos(fillEnd) * outerR,
            centerY + Math.sin(fillEnd) * outerR
        );
        fgGrad.addColorStop(0, accentColor);
        fgGrad.addColorStop(1, arcColor);

        ctx.beginPath();
        ctx.arc(centerX, centerY, (outerR + innerR) / 2, startAngle, fillEnd, false);
        ctx.strokeStyle = fgGrad;
        ctx.lineWidth   = arcWidth;
        ctx.lineCap     = 'round';
        ctx.stroke();

        // Glow effect at arc tip
        ctx.beginPath();
        ctx.arc(centerX, centerY, (outerR + innerR) / 2, fillEnd - 0.05, fillEnd, false);
        ctx.strokeStyle = withAlpha(arcColor, 0.5);
        ctx.lineWidth   = arcWidth + 4;
        ctx.lineCap     = 'round';
        ctx.stroke();
    }

    // Value text centered in ring
    var heroFontSize = Math.floor(outerR * 0.42);
    ctx.fillStyle   = t.text;
    ctx.font        = 'bold ' + heroFontSize + 'px "Splunk Platform Sans", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign    = 'center';
    ctx.fillText(String(numValue), centerX, centerY);

    // Min/max tick labels
    ctx.fillStyle   = t.textFaint;
    ctx.font        = '10px "Splunk Platform Sans", sans-serif';
    ctx.textBaseline = 'top';
    ctx.textAlign    = 'left';
    var tickR = outerR + 8;
    var minX  = centerX + Math.cos(startAngle) * tickR;
    var minY  = centerY + Math.sin(startAngle) * tickR;
    ctx.fillText(String(minValue), minX - 10, minY);
    ctx.textAlign = 'right';
    var maxX  = centerX + Math.cos(endAngle) * tickR;
    var maxY  = centerY + Math.sin(endAngle) * tickR;
    ctx.fillText(String(maxValue), maxX + 10, maxY);

    // Label below ring
    if (showLabel && labelText) {
        var labelY = centerY + outerR + 14;
        ctx.fillStyle    = t.textDim;
        ctx.font         = '13px "Splunk Platform Sans", sans-serif';
        ctx.textBaseline = 'top';
        ctx.textAlign    = 'center';
        ctx.fillText(labelText, centerX, labelY);
    }
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
