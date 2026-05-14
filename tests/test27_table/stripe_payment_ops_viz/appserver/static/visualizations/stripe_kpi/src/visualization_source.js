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
    if (val == null || val === '') return null;
    var s = String(val);
    if (s.indexOf('0x') === 0) return '#' + s.slice(2);
    if (s.charAt(0) === '#') return s;
    var n = parseInt(s, 10);
    if (!isNaN(n) && n >= 0) {
        var hex = n.toString(16);
        while (hex.length < 6) hex = '0' + hex;
        return '#' + hex;
    }
    return null;
}

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.classList.add('stripe-payment-ops-viz');
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
        var trendDirField = opt('trendDirectionField', 'trend_direction');
        var showTrend = opt('showTrend', 'true') === 'true';
        var unitPos = opt('unitPosition', 'prefix');
        var decimals = parseInt(opt('decimals', '-1'), 10);
        var accentHex = hexFromSplunk(opt('accentColor', '0x635BFF')) || '#635BFF';

        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark'
                   : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');

        var w = this.el.clientWidth || this.el.offsetWidth || window.innerWidth || 300;
        var h = this.el.clientHeight || this.el.offsetHeight || window.innerHeight || 120;
        if (w < 10) w = window.innerWidth || 300;
        if (h < 10) h = window.innerHeight || 120;

        var dpr = window.devicePixelRatio || 1;
        this._canvas.width = w * dpr;
        this._canvas.height = h * dpr;
        this._canvas.style.width = w + 'px';
        this._canvas.style.height = h + 'px';
        var ctx = this._canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        this._tooltip.style.background = t.panelHi || t.panel;
        this._tooltip.style.color = t.text;
        this._tooltip.style.fontFamily = theme.FONTS.ui;

        var row = data.rows[data.rows.length - 1];
        var ci = data.colIdx;

        var rawVal = ci[valueField] != null ? row[ci[valueField]] : '';
        var label = ci[labelField] != null ? safeStr(row[ci[labelField]]) : '';
        var unit = ci[unitField] != null ? safeStr(row[ci[unitField]]) : '';
        var trendText = ci[trendField] != null ? safeStr(row[ci[trendField]]) : '';
        var trendDir = ci[trendDirField] != null ? safeStr(row[ci[trendDirField]]) : '';

        var numVal = safeNum(rawVal, null);
        var displayValue;
        if (numVal !== null) {
            if (decimals >= 0) {
                displayValue = numVal.toFixed(decimals);
            } else {
                displayValue = theme.fmtNum(numVal);
            }
        } else {
            displayValue = safeStr(rawVal) || '—';
        }

        if (unit) {
            if (unitPos === 'prefix') {
                displayValue = unit + displayValue;
            } else {
                displayValue = displayValue + unit;
            }
        }

        var pad = Math.max(12, w * 0.06);
        var labelSize = Math.max(10, h * 0.13);
        var valueSize = Math.max(18, h * 0.38);
        var trendSize = Math.max(9, h * 0.11);

        ctx.globalAlpha = 1;
        ctx.font = '500 ' + labelSize + 'px ' + theme.FONTS.ui;
        ctx.fillStyle = t.textDim;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        var labelY = pad;

        var labelText = label.toUpperCase();
        var measuredLabel = ctx.measureText(labelText);
        if (measuredLabel.width > w - pad * 2) {
            labelSize = labelSize * ((w - pad * 2) / measuredLabel.width);
            ctx.font = '500 ' + labelSize + 'px ' + theme.FONTS.ui;
        }
        ctx.fillText(labelText, pad, labelY);

        var valueY = labelY + labelSize + Math.max(4, h * 0.04);
        ctx.font = '600 ' + valueSize + 'px ' + theme.FONTS.data;
        ctx.fillStyle = t.text;
        ctx.textBaseline = 'top';

        var measuredVal = ctx.measureText(displayValue);
        if (measuredVal.width > w - pad * 2) {
            valueSize = valueSize * ((w - pad * 2) / measuredVal.width);
            ctx.font = '600 ' + valueSize + 'px ' + theme.FONTS.data;
        }
        ctx.fillText(displayValue, pad, valueY);

        var accentY = valueY + valueSize + Math.max(4, h * 0.04);
        ctx.beginPath();
        ctx.moveTo(pad, accentY);
        ctx.lineTo(pad + Math.min(40, w * 0.12), accentY);
        ctx.strokeStyle = accentHex;
        ctx.lineWidth = Math.max(2, h * 0.025);
        ctx.lineCap = 'round';
        ctx.stroke();

        if (showTrend && trendText) {
            var trendColor = t.textDim;
            var arrow = '';
            if (trendDir === 'up') {
                trendColor = t.success;
                arrow = '↑ ';
            } else if (trendDir === 'down') {
                trendColor = t.danger;
                arrow = '↓ ';
            }

            ctx.font = '500 ' + trendSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = trendColor;
            ctx.textBaseline = 'top';
            var trendY = accentY + Math.max(6, h * 0.06);
            ctx.fillText(arrow + trendText, pad, trendY);
        }
    },

    reflow: function() {
        this.invalidateUpdateView();
    },

    destroy: function() {
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }
});
