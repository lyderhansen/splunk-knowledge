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

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.classList.add('cloudflare_noc-viz');
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
        var deltaField = opt('deltaField', 'delta');
        var label = opt('label', '');
        var unit = opt('unit', '');
        var unitPos = opt('unitPosition', 'after');
        var decimals = parseInt(opt('decimals', '-1'), 10);
        var showDelta = opt('showDelta', 'true') === 'true';
        var accentColor = opt('accentColor', '#F6821F');
        var showGlow = opt('showGlow', 'true') === 'true';

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

        this._tooltip.style.background = t.panelHi;
        this._tooltip.style.color = t.text;
        this._tooltip.style.fontFamily = theme.FONTS.ui;

        var lastRow = data.rows[data.rows.length - 1];
        var rawVal = safeNum(lastRow[data.colIdx[valueField]], null);
        var rawDelta = safeNum(lastRow[data.colIdx[deltaField]], null);

        var displayValue;
        if (rawVal === null) {
            displayValue = '—';
        } else if (decimals >= 0) {
            displayValue = rawVal.toFixed(decimals);
        } else {
            displayValue = theme.fmtNum(rawVal);
        }

        if (unit) {
            if (unitPos === 'before') {
                displayValue = unit + displayValue;
            } else {
                displayValue = displayValue + unit;
            }
        }

        var pad = Math.max(8, w * 0.04);
        var usableW = w - pad * 2;
        var usableH = h - pad * 2;

        var hasLabel = label.length > 0;
        var hasDelta = showDelta && rawDelta !== null;

        var labelSize = Math.max(9, Math.min(14, h * 0.12));
        var valueSize = Math.max(18, h * 0.42);
        var deltaSize = Math.max(9, Math.min(12, h * 0.10));

        var totalTextH = valueSize;
        if (hasLabel) totalTextH += labelSize + 4;
        if (hasDelta) totalTextH += deltaSize + 4;

        var startY = pad + (usableH - totalTextH) / 2;
        var cx = w / 2;

        ctx.textAlign = 'center';
        ctx.globalAlpha = 1;

        if (hasLabel) {
            ctx.font = '500 ' + labelSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = t.textDim;
            var labelText = label.toUpperCase();
            ctx.letterSpacing = '1px';
            ctx.fillText(labelText, cx, startY + labelSize);
            ctx.letterSpacing = '0px';
            startY += labelSize + 6;
        }

        if (showGlow && isDark) {
            ctx.shadowColor = theme.withAlpha(accentColor, 0.5);
            ctx.shadowBlur = Math.max(8, h * 0.12);
        }
        ctx.font = '700 ' + valueSize + 'px ' + theme.FONTS.data;
        ctx.fillStyle = accentColor;

        var valW = ctx.measureText(displayValue).width;
        while (valW > usableW && valueSize > 14) {
            valueSize -= 2;
            ctx.font = '700 ' + valueSize + 'px ' + theme.FONTS.data;
            valW = ctx.measureText(displayValue).width;
        }
        ctx.fillText(displayValue, cx, startY + valueSize);
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        startY += valueSize + 6;

        if (hasDelta) {
            ctx.globalAlpha = 1;
            var isPositive = rawDelta >= 0;
            var arrow = isPositive ? '▲' : '▼';
            var deltaColor = isPositive ? t.success : t.danger;
            var deltaStr = arrow + ' ' + Math.abs(rawDelta).toFixed(1) + '%';

            ctx.font = '600 ' + deltaSize + 'px ' + theme.FONTS.data;
            ctx.fillStyle = deltaColor;
            ctx.fillText(deltaStr, cx, startY + deltaSize);
        }

        ctx.globalAlpha = 1;

        var accentBarH = 3;
        ctx.fillStyle = accentColor;
        ctx.fillRect(pad, h - accentBarH, usableW, accentBarH);
    },

    _onMouseMove: function() {},

    reflow: function() {
        this.invalidateUpdateView();
    },

    destroy: function() {
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }
});
