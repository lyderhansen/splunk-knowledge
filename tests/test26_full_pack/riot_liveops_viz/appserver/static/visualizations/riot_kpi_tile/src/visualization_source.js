var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var SplunkVisualizationUtils = require('api/SplunkVisualizationUtils');
var theme = require('shared/theme');

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

module.exports = SplunkVisualizationBase.extend({

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
