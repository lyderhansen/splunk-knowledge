import { VisualizationAPI } from '@splunk/dashboard-studio-extension';

// === Visual Language — Red Bull: sharp, kinetic, aggressive ===
var VISUAL_LANG = {
    fillTechnique:     'gradient',
    backgroundType:    'solid',
    backgroundPattern: 'none'
};

// === Theme Tokens — Red Bull brand palette ===
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

// Red Bull zone-based threshold color: danger(low) -> warn -> success -> accent(peak)
function zoneColor(t, pct) {
    if (pct <= 0.33) {
        return lerpColor(t.danger, t.warn, pct / 0.33);
    } else if (pct <= 0.66) {
        return lerpColor(t.warn, t.success, (pct - 0.33) / 0.33);
    } else {
        return lerpColor(t.success, t.accent, (pct - 0.66) / 0.34);
    }
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
    if (state.loading) return;

    var data = state.data;

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

    var themeMode = opts.themeMode || 'auto';
    if (themeMode !== 'auto') {
        t = themeMode === 'dark' ? DARK : LIGHT;
    }

    // Columnar data — all values are strings
    var columns  = data.columns;

    // Read options with defensive fallbacks
    var minValue    = safeNum(opts.minValue, 0);
    var maxValue    = safeNum(opts.maxValue, 100);
    if (maxValue <= minValue) maxValue = minValue + 1;
    var arcWidth    = Math.max(4, safeNum(opts.arcWidth, 22));
    var showLabel   = opts.showLabel !== false && opts.showLabel !== 'false';
    var accentColor = hexFromSplunk(opts.accentColor, t.accent);

    // Data: columns[0][0] = label, columns[1][0] = value (parseFloat — all values are strings)
    var labelText = safeStr(columns[0][0]);
    var rawValue  = columns.length > 1 ? columns[1][0] : columns[0][0];
    var numValue  = parseFloat(rawValue);
    if (isNaN(numValue)) numValue = 0;

    var W = canvas.width;
    var H = canvas.height;

    // === Background — deep midnight gradient ===
    var bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, t.bg);
    bgGrad.addColorStop(1, lerpColor(t.bg, t.panel, 0.3));
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // === Ring geometry ===
    var centerX = W / 2;
    var centerY = showLabel ? H * 0.44 : H / 2;
    var outerR  = Math.min(W * 0.42, H * 0.40);
    var innerR  = outerR - arcWidth;

    // Sweep: 135deg (bottom-left) to 405deg (bottom-right) = 270deg total
    var startAngle = Math.PI * 0.75;
    var endAngle   = Math.PI * 2.25;
    var totalSweep = endAngle - startAngle;

    var clamped = Math.max(minValue, Math.min(maxValue, numValue));
    var pct     = (clamped - minValue) / (maxValue - minValue);
    var fillEnd = startAngle + totalSweep * pct;

    var midR = (outerR + innerR) / 2;

    // === Track arc (background) ===
    ctx.beginPath();
    ctx.arc(centerX, centerY, midR, startAngle, endAngle, false);
    ctx.strokeStyle = t.edge;
    ctx.lineWidth   = arcWidth;
    ctx.lineCap     = 'round';
    ctx.stroke();

    // === Foreground arc with zone-based gradient color ===
    if (pct > 0.001) {
        var arcColor = zoneColor(t, pct);

        // Conical-like gradient blending from accent start to zone color at fill tip
        var fgGrad = ctx.createLinearGradient(
            centerX + Math.cos(startAngle) * outerR,
            centerY + Math.sin(startAngle) * outerR,
            centerX + Math.cos(fillEnd) * outerR,
            centerY + Math.sin(fillEnd) * outerR
        );
        fgGrad.addColorStop(0, accentColor);
        fgGrad.addColorStop(1, arcColor);

        ctx.beginPath();
        ctx.arc(centerX, centerY, midR, startAngle, fillEnd, false);
        ctx.strokeStyle = fgGrad;
        ctx.lineWidth   = arcWidth;
        ctx.lineCap     = 'round';
        ctx.stroke();

        // === Glow at arc tip — Red Bull kinetic energy effect ===
        ctx.save();
        ctx.shadowBlur  = arcWidth * 0.8;
        ctx.shadowColor = withAlpha(arcColor, 0.6);
        ctx.beginPath();
        ctx.arc(centerX, centerY, midR, fillEnd - 0.04, fillEnd, false);
        ctx.strokeStyle = arcColor;
        ctx.lineWidth   = arcWidth;
        ctx.lineCap     = 'round';
        ctx.stroke();
        ctx.restore();
    }

    // === Hero value in ring center ===
    var heroFontSize = Math.floor(outerR * 0.44);
    ctx.fillStyle    = t.text;
    ctx.font         = 'bold ' + heroFontSize + 'px Impact, "Arial Black", "Arial Narrow", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign    = 'center';
    ctx.fillText(String(numValue), centerX, centerY);

    // === Percentage sub-label ===
    var pctLabel = Math.round(pct * 100) + '%';
    ctx.fillStyle    = t.textFaint;
    ctx.font         = '11px "Splunk Platform Sans", Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign    = 'center';
    ctx.fillText(pctLabel, centerX, centerY + heroFontSize * 0.65);

    // === Min/max tick labels ===
    ctx.fillStyle    = t.textFaint;
    ctx.font         = '10px "Splunk Platform Sans", Arial, sans-serif';
    ctx.textBaseline = 'top';
    var tickR = outerR + 10;
    var minX  = centerX + Math.cos(startAngle) * tickR;
    var minY  = centerY + Math.sin(startAngle) * tickR;
    ctx.textAlign = 'left';
    ctx.fillText(String(minValue), minX - 12, minY);
    var maxX  = centerX + Math.cos(endAngle) * tickR;
    var maxY  = centerY + Math.sin(endAngle) * tickR;
    ctx.textAlign = 'right';
    ctx.fillText(String(maxValue), maxX + 12, maxY);

    // === Label below ring ===
    if (showLabel && labelText) {
        var labelY = centerY + outerR + 12;
        ctx.fillStyle    = t.textDim;
        ctx.font         = '12px "Splunk Platform Sans", "Arial Narrow", Arial, sans-serif';
        ctx.textBaseline = 'top';
        ctx.textAlign    = 'center';
        ctx.fillText(labelText.toUpperCase(), centerX, labelY);
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
