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

// Stored field index for drilldown hit-testing
var _labelColIdx = 0;
var _valueColIdx = 1;

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
    var maxBars  = Math.max(1, Math.min(50, safeNum(opts.maxBars, 10)));
    var barHeight = Math.max(8, safeNum(opts.barHeight, 24));
    var showValues = opts.showValues !== false && opts.showValues !== 'false';
    var series1Color = hexFromSplunk(opts.series1Color, t.series[0]);
    var series2Color = hexFromSplunk(opts.series2Color, t.series[1]);

    // Columnar data: columns[0] = labels, columns[1] = values
    _labelColIdx = 0;
    _valueColIdx = columns.length > 1 ? 1 : 0;

    var labels = columns[_labelColIdx];
    var values = columns.length > 1 ? columns[_valueColIdx] : columns[0];
    var rowCount = Math.min(labels.length, maxBars);

    var W = canvas.width;
    var H = canvas.height;

    // Background
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, W, H);

    // Calculate layout
    var padX = 16, padY = 12;
    var labelWidth = Math.min(140, Math.floor(W * 0.28));
    var valueWidth = showValues ? 56 : 0;
    var barAreaX = padX + labelWidth + 8;
    var barAreaW = W - barAreaX - valueWidth - padX;

    // Find max value for proportional bars
    var maxVal = 0;
    for (var i = 0; i < rowCount; i++) {
        var v = safeNum(values[i], 0);
        if (v > maxVal) maxVal = v;
    }
    if (maxVal === 0) maxVal = 1;

    // Total height for bars
    var totalBarsH = rowCount * (barHeight + 8);
    var startY = padY + Math.max(0, (H - padY * 2 - totalBarsH) / 2);

    for (var j = 0; j < rowCount; j++) {
        var rowY = startY + j * (barHeight + 8);
        var label = safeStr(labels[j]);
        var numVal = safeNum(values[j], 0);
        var proportion = clamp01(numVal / maxVal);
        var barW = Math.floor(barAreaW * proportion);

        // Bar gradient — alternate series colors for visual variety
        var seriesColor = j % 2 === 0 ? series1Color : series2Color;
        var barGrad = ctx.createLinearGradient(barAreaX, rowY, barAreaX + barW, rowY);
        barGrad.addColorStop(0, seriesColor);
        barGrad.addColorStop(1, withAlpha(seriesColor, 0.6));

        // Bar background track
        ctx.fillStyle = t.grid;
        ctx.fillRect(barAreaX, rowY, barAreaW, barHeight);

        // Bar fill
        if (barW > 0) {
            ctx.fillStyle = barGrad;
            ctx.fillRect(barAreaX, rowY, barW, barHeight);
        }

        // Label
        ctx.fillStyle = t.text;
        ctx.font = '12px "Splunk Platform Sans", sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'right';
        // Truncate label if needed
        var maxLabelW = labelWidth - 4;
        var labelFull = label;
        while (ctx.measureText(labelFull).width > maxLabelW && labelFull.length > 3) {
            labelFull = labelFull.slice(0, -1);
        }
        if (labelFull !== label) labelFull = labelFull.slice(0, -1) + '…';
        ctx.fillText(labelFull, padX + labelWidth, rowY + barHeight / 2);

        // Value at end of bar
        if (showValues) {
            var fmtVal = String(numVal);
            ctx.fillStyle = t.textDim;
            ctx.font = '11px "Splunk Platform Sans", sans-serif';
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            ctx.fillText(fmtVal, barAreaX + barW + 6, rowY + barHeight / 2);
        }
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
// Click hit-tests which bar was clicked and fires drilldown with label+value
canvas.addEventListener('click', function(evt) {
    var data = state.data;
    if (!data || !data.columns || data.columns.length === 0) return;

    var opts = state.options;
    var maxBars  = Math.max(1, Math.min(50, safeNum(opts.maxBars, 10)));
    var barHeight = Math.max(8, safeNum(opts.barHeight, 24));
    var columns  = data.columns;
    var labels   = columns[_labelColIdx];
    var values   = columns.length > 1 ? columns[_valueColIdx] : columns[0];
    var rowCount = Math.min(labels.length, maxBars);

    var rect   = canvas.getBoundingClientRect();
    var mouseY = evt.clientY - rect.top;
    var scaleY = canvas.height / rect.height;
    var canvasY = mouseY * scaleY;

    var padY = 12;
    var totalBarsH = rowCount * (barHeight + 8);
    var startY = padY + Math.max(0, (canvas.height - padY * 2 - totalBarsH) / 2);

    for (var i = 0; i < rowCount; i++) {
        var rowY = startY + i * (barHeight + 8);
        if (canvasY >= rowY && canvasY <= rowY + barHeight) {
            var hitLabel = safeStr(labels[i]);
            var hitValue = safeStr(values[i]);
            VisualizationAPI.triggerDrilldown({
                action: 'custom.click',
                payload: { name: 'selectedLabel', value: hitLabel },
                originalEvent: evt
            });
            return;
        }
    }
});
