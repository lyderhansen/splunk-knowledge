define(["api/SplunkVisualizationBase","api/SplunkVisualizationUtils"], function(SplunkVisualizationBase, SplunkVisualizationUtils) {

// ── Inlined theme.js ──
var theme = (function() {
/*
 * Riot Games Live Ops — design tokens.
 * ES5 only — no const/let/arrow/template-literals.
 */

function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

function withAlpha(hex, alpha) {
    var r = parseInt(hex.slice(1,3), 16);
    var g = parseInt(hex.slice(3,5), 16);
    var b = parseInt(hex.slice(5,7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + clamp01(alpha) + ')';
}

function lerpColor(a, b, t) {
    t = clamp01(t);
    var ar = parseInt(a.slice(1,3),16), ag = parseInt(a.slice(3,5),16), ab = parseInt(a.slice(5,7),16);
    var br = parseInt(b.slice(1,3),16), bg = parseInt(b.slice(3,5),16), bb = parseInt(b.slice(5,7),16);
    var rr = Math.round(ar + (br - ar) * t);
    var gg = Math.round(ag + (bg - ag) * t);
    var bl = Math.round(ab + (bb - ab) * t);
    return '#' + ((1 << 24) + (rr << 16) + (gg << 8) + bl).toString(16).slice(1);
}

var DARK = {
    name: 'dark',
    bg: '#010A13',
    panel: '#0A1628',
    panelHi: '#0D1F38',
    edge: '#1E2328',
    edgeStrong: '#3C3C41',
    grid: 'rgba(30,35,40,0.5)',
    text: '#F0E6D2',
    textDim: '#A09B8C',
    textFaint: '#5B5A56',
    s1: '#0AC8B9',
    s2: '#C89B3C',
    s3: '#E84057',
    s4: '#F0B232',
    s5: '#0397AB',
    accent: '#0AC8B9',
    success: '#0AC8B9',
    warn: '#F0B232',
    danger: '#E84057',
    invert: '#F0E6D2'
};

var LIGHT = {
    name: 'light',
    bg: '#F0F0F0',
    panel: '#FFFFFF',
    panelHi: '#F5F5F5',
    edge: '#D0D0D0',
    edgeStrong: '#999999',
    grid: 'rgba(0,0,0,0.06)',
    text: '#1A1A1A',
    textDim: '#666666',
    textFaint: '#999999',
    s1: '#0AC8B9',
    s2: '#C89B3C',
    s3: '#E84057',
    s4: '#C08820',
    s5: '#0397AB',
    accent: '#0AC8B9',
    success: '#0AC8B9',
    warn: '#C08820',
    danger: '#E84057',
    invert: '#1A1A1A'
};

function getTheme(name) {
    return (name === 'light') ? LIGHT : DARK;
}

var FONTS = {
    data: '"Beaufort for LOL", "Trajan Pro", "Georgia", serif',
    ui: '"Spiegel", "Segoe UI", "Helvetica Neue", sans-serif'
};

var BEAUFORT_BASE64 = '';
var SPIEGEL_BASE64 = '';

var _fontsLoaded = false;
function loadFonts() {
    if (_fontsLoaded) return;
    _fontsLoaded = true;
    if (BEAUFORT_BASE64) {
        try {
            var s = document.createElement('style');
            s.textContent = '@font-face{font-family:"Beaufort for LOL";src:url(data:font/woff2;base64,' + BEAUFORT_BASE64 + ') format("woff2");font-weight:700;font-display:swap;}';
            document.head.appendChild(s);
        } catch (e) {}
    }
    if (SPIEGEL_BASE64) {
        try {
            var s2 = document.createElement('style');
            s2.textContent = '@font-face{font-family:"Spiegel";src:url(data:font/woff2;base64,' + SPIEGEL_BASE64 + ') format("woff2");font-weight:400;font-display:swap;}';
            document.head.appendChild(s2);
        } catch (e) {}
    }
}

function severityColor(t, sev) {
    if (sev === 'critical' || sev === 'crit' || sev === 'error') return t.danger;
    if (sev === 'warning' || sev === 'warn') return t.warn;
    if (sev === 'ok' || sev === 'good' || sev === 'success') return t.success;
    return t.textDim;
}

function fmtNum(v, opts) {
    if (v == null || isNaN(v)) return '—';
    var abs = Math.abs(v);
    var sign = v < 0 ? '-' : '';
    if (abs >= 1e9) return sign + (abs / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6) return sign + (abs / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3) return sign + (abs / 1e3).toFixed(1) + 'K';
    if (abs < 1 && abs > 0) return sign + abs.toFixed(2);
    return sign + Math.round(abs).toString();
}

function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
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

function drawPanel(ctx, t, x, y, w, h) {
    roundRect(ctx, x, y, w, h, 4);
    ctx.fillStyle = t.panel;
    ctx.fill();
    ctx.strokeStyle = t.edge;
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawHGrid(ctx, t, x, y, w, h, divisions) {
    ctx.strokeStyle = t.grid;
    ctx.lineWidth = 0.5;
    for (var i = 1; i < divisions; i++) {
        var gy = y + (h / divisions) * i;
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.lineTo(x + w, gy);
        ctx.stroke();
    }
}

function parseColors(raw, fallback) {
    if (!raw || typeof raw !== 'string') return fallback;
    return raw.split(',').map(function(c) { return c.trim(); }).filter(function(c) { return c.length > 0; });
}

function parseInts(raw) {
    if (!raw || typeof raw !== 'string') return [];
    return raw.split(',').map(function(s) { return parseInt(s.trim(), 10); }).filter(function(n) { return !isNaN(n); });
}


    return { getTheme: getTheme,     withAlpha: withAlpha,     lerpColor: lerpColor,     severityColor: severityColor,     fmtNum: fmtNum,     roundRect: roundRect,     drawPanel: drawPanel,     drawHGrid: drawHGrid,     parseColors: parseColors,     parseInts: parseInts,     loadFonts: loadFonts,     FONTS: FONTS };
})();

// ── Viz source ──



function safeStr(val) {
    return (val != null && val !== '') ? String(val) : '';
}

function safeNum(val, fallback) {
    if (val == null || val === '') return fallback;
    var n = parseFloat(val);
    return isNaN(n) ? fallback : n;
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
        if (body.classList.contains('dark')) return 'dark';
        if (body.classList.contains('light')) return 'light';
    }
    try {
        var bg = window.getComputedStyle(document.body).backgroundColor;
        var m = bg.match(/\d+/g);
        if (m && m.length >= 3) {
            return (parseInt(m[0])+parseInt(m[1])+parseInt(m[2]))/3 < 128
                   ? 'dark' : 'light';
        }
    } catch (e) {}
    return 'dark';
}

function hexFromSplunk(val) {
    if (!val) return null;
    var s = String(val).replace(/^0x/, '#');
    if (s.charAt(0) !== '#') s = '#' + s;
    return s;
}

return SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.classList.add('riot-liveops-viz');
        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;';
        this.el.appendChild(this._canvas);

        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 10px;' +
            'border-radius:4px;pointer-events:none;white-space:nowrap;z-index:100;';
        this.el.appendChild(this._tooltip);

        this._lastGoodData = null;
        theme.loadFonts();
    },

    getInitialDataParams: function() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },

    formatData: function(data) {
        if (!data || !data.rows || data.rows.length === 0) {
            if (this._lastGoodData) return this._lastGoodData;
            return null;
        }
        var fields = data.fields;
        var colIdx = {};
        for (var i = 0; i < fields.length; i++) {
            colIdx[fields[i].name] = i;
        }
        var result = { colIdx: colIdx, rows: data.rows };
        this._lastGoodData = result;
        return result;
    },

    updateView: function(data, config) {
        if (!data) {
            if (this._lastGoodData) data = this._lastGoodData;
            else return;
        }

        var ns = this.getPropertyNamespaceInfo().propertyNamespace;
        function opt(key, fallback) {
            var v = config[ns + key];
            return (v != null && v !== '') ? v : fallback;
        }

        var valueField = opt('valueField', 'value');
        var labelField = opt('labelField', 'label');
        var unitField = opt('unitField', 'unit');
        var trendField = opt('trendField', 'trend');
        var sparklineField = opt('sparklineField', 'sparkline');
        var showTrend = opt('showTrend', 'true') === 'true';
        var showSparkline = opt('showSparkline', 'true') === 'true';
        var decimals = parseInt(opt('decimals', '-1'), 10);
        var accentHex = hexFromSplunk(opt('accentColor', '0x0AC8B9')) || '#0AC8B9';
        var glowIntensity = safeNum(opt('glowIntensity', '60'), 60) / 100;

        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark'
                   : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');

        var w = this.el.clientWidth || this.el.offsetWidth || window.innerWidth || 300;
        var h = this.el.clientHeight || this.el.offsetHeight || window.innerHeight || 180;
        if (w < 10) w = window.innerWidth || 300;
        if (h < 10) h = window.innerHeight || 180;

        var dpr = window.devicePixelRatio || 1;
        this._canvas.width = w * dpr;
        this._canvas.height = h * dpr;
        this._canvas.style.width = w + 'px';
        this._canvas.style.height = h + 'px';
        var ctx = this._canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        var row = data.rows[data.rows.length - 1];
        var ci = data.colIdx;
        var rawValue = ci[valueField] != null ? row[ci[valueField]] : '';
        var label = ci[labelField] != null ? safeStr(row[ci[labelField]]) : '';
        var unit = ci[unitField] != null ? safeStr(row[ci[unitField]]) : '';
        var trendStr = ci[trendField] != null ? safeStr(row[ci[trendField]]) : '';
        var sparkRaw = ci[sparklineField] != null ? safeStr(row[ci[sparklineField]]) : '';

        var numVal = safeNum(rawValue, null);
        var displayValue;
        if (numVal === null) {
            displayValue = safeStr(rawValue) || '—';
        } else if (decimals >= 0) {
            displayValue = numVal.toFixed(decimals);
        } else {
            displayValue = theme.fmtNum(numVal);
        }

        var pad = Math.max(12, w * 0.06);
        var innerW = w - pad * 2;
        var innerH = h - pad * 2;

        // Card background with subtle hextech border
        theme.roundRect(ctx, 2, 2, w - 4, h - 4, 4);
        ctx.fillStyle = t.panel;
        ctx.fill();
        ctx.strokeStyle = theme.withAlpha(accentHex, 0.2);
        ctx.lineWidth = 1;
        ctx.stroke();

        // Hextech glow accent line at bottom
        var lineY = h - pad * 0.7;
        var lineX1 = pad;
        var lineX2 = w - pad;
        ctx.save();
        ctx.shadowColor = accentHex;
        ctx.shadowBlur = 12 * glowIntensity;
        ctx.strokeStyle = accentHex;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lineX1, lineY);
        ctx.lineTo(lineX2, lineY);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();

        // Angular accent notches at line endpoints
        ctx.strokeStyle = theme.withAlpha(accentHex, 0.6);
        ctx.lineWidth = 1.5;
        var notchLen = Math.max(6, w * 0.02);
        ctx.beginPath();
        ctx.moveTo(lineX1, lineY - notchLen);
        ctx.lineTo(lineX1, lineY);
        ctx.lineTo(lineX1 + notchLen, lineY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(lineX2, lineY - notchLen);
        ctx.lineTo(lineX2, lineY);
        ctx.lineTo(lineX2 - notchLen, lineY);
        ctx.stroke();

        // Layout: label at top, value center, trend + sparkline below
        var labelSize = Math.max(10, h * 0.1);
        var valueSize = Math.max(20, h * 0.3);
        var unitSize = Math.max(10, h * 0.14);
        var trendSize = Math.max(9, h * 0.08);

        // Label
        ctx.globalAlpha = 1;
        ctx.font = '600 ' + labelSize + 'px ' + theme.FONTS.ui;
        ctx.fillStyle = t.textDim;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        var labelY = pad;
        ctx.fillText(label.toUpperCase(), pad, labelY);

        // Hero value
        var valueY = labelY + labelSize + Math.max(4, h * 0.04);
        ctx.font = '700 ' + valueSize + 'px ' + theme.FONTS.data;
        ctx.fillStyle = t.text;
        var valMetrics = ctx.measureText(displayValue);
        ctx.textBaseline = 'top';
        ctx.fillText(displayValue, pad, valueY);

        // Unit beside value
        if (unit) {
            ctx.font = '400 ' + unitSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = '#C89B3C';
            ctx.textBaseline = 'top';
            var unitX = pad + valMetrics.width + Math.max(4, w * 0.015);
            ctx.fillText(unit, unitX, valueY + (valueSize - unitSize) * 0.6);
        }

        // Trend delta
        var trendY = valueY + valueSize + Math.max(4, h * 0.03);
        if (showTrend && trendStr) {
            var isPositive = trendStr.indexOf('+') === 0 || (trendStr.indexOf('-') !== 0 && safeNum(trendStr, 0) > 0);
            var isNegative = trendStr.indexOf('-') === 0;
            var trendColor = isPositive ? t.success : isNegative ? t.danger : t.textDim;
            var arrow = isPositive ? '▲ ' : isNegative ? '▼ ' : '';

            ctx.font = '600 ' + trendSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = trendColor;
            ctx.textBaseline = 'top';
            ctx.fillText(arrow + trendStr, pad, trendY);
        }

        // Sparkline
        if (showSparkline && sparkRaw) {
            var points = sparkRaw.split(',').map(function(s) { return parseFloat(s.trim()); }).filter(function(n) { return !isNaN(n); });
            if (points.length > 1) {
                var sparkH = Math.max(16, h * 0.14);
                var sparkY = lineY - sparkH - Math.max(4, h * 0.03);
                var sparkX = w * 0.55;
                var sparkW = w - sparkX - pad;

                var minV = points[0], maxV = points[0];
                for (var pi = 1; pi < points.length; pi++) {
                    if (points[pi] < minV) minV = points[pi];
                    if (points[pi] > maxV) maxV = points[pi];
                }
                var range = maxV - minV || 1;

                // Fill gradient under sparkline
                ctx.beginPath();
                for (var si = 0; si < points.length; si++) {
                    var sx = sparkX + (si / (points.length - 1)) * sparkW;
                    var sy = sparkY + sparkH - ((points[si] - minV) / range) * sparkH;
                    if (si === 0) ctx.moveTo(sx, sy);
                    else ctx.lineTo(sx, sy);
                }
                ctx.lineTo(sparkX + sparkW, sparkY + sparkH);
                ctx.lineTo(sparkX, sparkY + sparkH);
                ctx.closePath();
                var grad = ctx.createLinearGradient(sparkX, sparkY, sparkX, sparkY + sparkH);
                grad.addColorStop(0, theme.withAlpha(accentHex, 0.25));
                grad.addColorStop(1, theme.withAlpha(accentHex, 0.02));
                ctx.fillStyle = grad;
                ctx.fill();

                // Sparkline stroke
                ctx.beginPath();
                for (var sj = 0; sj < points.length; sj++) {
                    var sx2 = sparkX + (sj / (points.length - 1)) * sparkW;
                    var sy2 = sparkY + sparkH - ((points[sj] - minV) / range) * sparkH;
                    if (sj === 0) ctx.moveTo(sx2, sy2);
                    else ctx.lineTo(sx2, sy2);
                }
                ctx.save();
                ctx.shadowColor = accentHex;
                ctx.shadowBlur = 6 * glowIntensity;
                ctx.strokeStyle = accentHex;
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.restore();

                // End dot
                var lastSx = sparkX + sparkW;
                var lastSy = sparkY + sparkH - ((points[points.length - 1] - minV) / range) * sparkH;
                ctx.beginPath();
                ctx.arc(lastSx, lastSy, 3, 0, Math.PI * 2);
                ctx.fillStyle = accentHex;
                ctx.fill();
            }
        }
    },

    _onMouseMove: function() {},

    reflow: function() {
        this.invalidateUpdateView();
    },

    destroy: function() {
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }
});


});