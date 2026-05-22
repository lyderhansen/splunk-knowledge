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

function fmtNum(v) {
    if (v == null || isNaN(v)) return '—';
    var abs = Math.abs(v);
    var sign = v < 0 ? '-' : '';
    if (abs >= 1e9) return sign + (abs / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6) return sign + (abs / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3) return sign + (abs / 1e3).toFixed(1) + 'K';
    return sign + Math.round(abs).toString();
}

// Red Bull position badge colors: gold (#1), silver (#2), bronze (#3)
function podiumColor(pos, t) {
    if (pos === 1) return '#F5C518';   // gold
    if (pos === 2) return '#C8C8C8';   // silver
    if (pos === 3) return '#CD7F32';   // bronze
    return t.textFaint;
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
    data:       null,
    loading:    false,
    options:    {},
    theme:      'dark',
    width:      500,
    height:     400,
    hitRects:   []     // for click drilldown hit-testing
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
        state.hitRects = [];
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
    var fields   = data.fields || [];

    // Read options with defensive fallbacks
    var maxRows     = Math.max(1, Math.min(50, safeNum(opts.maxRows, 10)));
    var showBars    = opts.showBars !== false && opts.showBars !== 'false';
    var showPos     = opts.showPosition !== false && opts.showPosition !== 'false';
    var accentColor = hexFromSplunk(opts.accentColor, t.accent);
    var barColor    = hexFromSplunk(opts.barColor, t.series[0]);

    // Auto-discover fields from data — generic, not domain-specific
    // Column 0 = label/name column, Column 1 = value column (if present)
    var nameCol  = columns[0];
    var valueCol = columns.length > 1 ? columns[1] : null;
    var rowCount = Math.min(nameCol.length, maxRows);

    // Pre-compute max value for bar scaling
    var maxVal = 0;
    if (showBars && valueCol) {
        for (var i = 0; i < rowCount; i++) {
            var v = parseFloat(valueCol[i]);
            if (!isNaN(v) && v > maxVal) maxVal = v;
        }
        if (maxVal === 0) maxVal = 1;
    }

    var W = canvas.width;
    var H = canvas.height;

    // === Background ===
    var bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, t.bg);
    bgGrad.addColorStop(1, lerpColor(t.bg, t.panel, 0.4));
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // === Layout constants ===
    var padX     = 16;
    var padTop   = 12;
    var rowH     = Math.max(28, Math.min(48, Math.floor((H - padTop * 2) / Math.max(rowCount, 1))));
    var posW     = showPos ? 32 : 0;
    var barAreaW = showBars ? Math.floor(W * 0.28) : 0;
    var valW     = 64;
    var nameW    = W - padX * 2 - posW - barAreaW - valW - 8;

    state.hitRects = [];

    for (var row = 0; row < rowCount; row++) {
        var rowY    = padTop + row * rowH;
        var rowX    = padX;
        var nameStr = safeStr(nameCol[row]);
        var valStr  = valueCol ? safeStr(valueCol[row]) : '';
        var numVal  = parseFloat(valStr);
        var pos     = row + 1;

        // Podium highlight: top 3 get an accent left edge strip
        var isTopThree = pos <= 3;

        // Row background: alternating subtle highlight for top 1
        if (pos === 1) {
            ctx.fillStyle = withAlpha(accentColor, 0.08);
            ctx.fillRect(rowX, rowY, W - padX * 2, rowH - 1);
        } else if (row % 2 === 0) {
            ctx.fillStyle = withAlpha(t.edge, 0.3);
            ctx.fillRect(rowX, rowY, W - padX * 2, rowH - 1);
        }

        // Podium left edge accent strip
        if (isTopThree) {
            ctx.fillStyle = podiumColor(pos, t);
            ctx.fillRect(rowX, rowY + 2, 2, rowH - 4);
        }

        var xCursor = rowX + 6;

        // === Position badge ===
        if (showPos) {
            ctx.fillStyle = podiumColor(pos, t);
            ctx.font = pos <= 3
                ? 'bold 13px Impact, "Arial Black", sans-serif'
                : '12px "Splunk Platform Sans", Arial, sans-serif';
            ctx.textBaseline = 'middle';
            ctx.textAlign    = 'left';
            ctx.fillText(pos + '.', xCursor, rowY + rowH / 2);
            xCursor += posW;
        }

        // === Athlete / label name ===
        ctx.fillStyle = pos === 1 ? t.text : (isTopThree ? t.textDim : t.textFaint);
        ctx.font = pos === 1
            ? 'bold 13px "Splunk Platform Sans", Arial, sans-serif'
            : '12px "Splunk Platform Sans", Arial, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign    = 'left';
        // Truncate name to fit available width
        var truncName = nameStr;
        ctx.font = pos === 1 ? 'bold 13px "Splunk Platform Sans", Arial, sans-serif' : '12px "Splunk Platform Sans", Arial, sans-serif';
        while (truncName.length > 2 && ctx.measureText(truncName).width > nameW) {
            truncName = truncName.slice(0, -1);
        }
        if (truncName !== nameStr) truncName = truncName.slice(0, -1) + '…';
        ctx.fillText(truncName, xCursor, rowY + rowH / 2);
        xCursor += nameW + 4;

        // === Value bar ===
        if (showBars && valueCol && !isNaN(numVal)) {
            var barW    = Math.max(2, Math.floor(barAreaW * (numVal / maxVal)));
            var barY    = rowY + Math.floor(rowH * 0.3);
            var barHt   = Math.floor(rowH * 0.4);

            // Track
            ctx.fillStyle = withAlpha(t.edge, 0.5);
            ctx.fillRect(xCursor, barY, barAreaW, barHt);

            // Fill bar with gradient
            var bGrad = ctx.createLinearGradient(xCursor, barY, xCursor + barW, barY);
            bGrad.addColorStop(0, pos === 1 ? accentColor : barColor);
            bGrad.addColorStop(1, withAlpha(pos === 1 ? accentColor : barColor, 0.5));
            ctx.fillStyle = bGrad;
            ctx.fillRect(xCursor, barY, barW, barHt);

            xCursor += barAreaW + 4;
        } else if (showBars) {
            xCursor += barAreaW + 4;
        }

        // === Value text ===
        if (valueCol) {
            ctx.fillStyle    = pos === 1 ? accentColor : t.textDim;
            ctx.font         = pos === 1
                ? 'bold 12px Impact, "Arial Black", sans-serif'
                : '11px "Splunk Platform Sans", Arial, sans-serif';
            ctx.textBaseline = 'middle';
            ctx.textAlign    = 'right';
            var displayVal   = isNaN(numVal) ? valStr : fmtNum(numVal);
            ctx.fillText(displayVal, rowX + W - padX * 2 - 4, rowY + rowH / 2);
        }

        // === Divider line ===
        ctx.strokeStyle = t.grid;
        ctx.lineWidth   = 0.5;
        ctx.beginPath();
        ctx.moveTo(rowX, rowY + rowH);
        ctx.lineTo(rowX + W - padX * 2, rowY + rowH);
        ctx.stroke();

        // Store hit rect for drilldown
        state.hitRects.push({ x: rowX, y: rowY, w: W - padX * 2, h: rowH, name: nameStr, value: valStr });
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

// === Drilldown — click on a row fires token with athlete name and value ===
canvas.addEventListener('click', function(evt) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    var mx = (evt.clientX - rect.left) * scaleX;
    var my = (evt.clientY - rect.top) * scaleY;

    var hits = state.hitRects;
    for (var i = 0; i < hits.length; i++) {
        var h = hits[i];
        if (mx >= h.x && mx <= h.x + h.w && my >= h.y && my <= h.y + h.h) {
            VisualizationAPI.triggerDrilldown({
                action: 'custom.click',
                payload: { name: 'selectedAthlete', value: h.name },
                originalEvent: evt
            });
            return;
        }
    }
});
