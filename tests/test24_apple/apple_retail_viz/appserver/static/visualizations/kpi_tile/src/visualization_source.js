var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;';
        this.el.appendChild(this._canvas);

        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 12px;' +
            'border-radius:8px;pointer-events:none;white-space:nowrap;' +
            'z-index:100;font-size:11px;';
        this.el.appendChild(this._tooltip);

        this._lastData = null;
        this._lastConfig = null;
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
            return data;
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
        if (!data || !data.rows || data.rows.length === 0) return;
        this._lastData = data;
        this._lastConfig = config;
        this._render(data, config);
    },

    _render: function(data, config) {
        var ns = theme.getNS(this);
        var themeMode = theme.getOption(config, ns, 'themeMode', 'auto');
        var isDark = themeMode === 'auto' ? theme.detectTheme() === 'dark' : themeMode === 'dark';
        var t = isDark ? theme.DARK : theme.LIGHT;

        var valueField = theme.getOption(config, ns, 'valueField', 'value');
        var labelField = theme.getOption(config, ns, 'labelField', 'label');
        var trendField = theme.getOption(config, ns, 'trendField', 'trend');
        var unitField = theme.getOption(config, ns, 'unitField', 'unit');
        var unitPos = theme.getOption(config, ns, 'unitPosition', 'before');
        var decimals = parseInt(theme.getOption(config, ns, 'decimals', '-1'), 10);
        var accentColor = theme.getOption(config, ns, 'accentColor', t.accent);
        var accentIntensity = parseInt(theme.getOption(config, ns, 'accentIntensity', '50'), 10);

        var w = this.el.clientWidth || this.el.offsetWidth || window.innerWidth || 300;
        var h = this.el.clientHeight || this.el.offsetHeight || window.innerHeight || 200;
        if (w < 10) w = window.innerWidth || 300;
        if (h < 10) h = window.innerHeight || 200;

        var dpr = window.devicePixelRatio || 1;
        this._canvas.width = w * dpr;
        this._canvas.height = h * dpr;
        this._canvas.style.width = w + 'px';
        this._canvas.style.height = h + 'px';
        var ctx = this._canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        var colIdx = data.colIdx;
        var row = data.rows[0];
        var vi = colIdx[valueField];
        var li = colIdx[labelField];
        var ti = colIdx[trendField];
        var ui = colIdx[unitField];

        var rawVal = vi !== undefined ? row[vi] : null;
        var label = theme.safeStr(li !== undefined ? row[li] : '');
        var trend = ti !== undefined ? parseFloat(row[ti]) : null;
        var unit = theme.safeStr(ui !== undefined ? row[ui] : '');

        var numVal = parseFloat(rawVal);
        var isNumeric = !isNaN(numVal) && rawVal !== null;
        var displayValue;
        if (!isNumeric) {
            displayValue = theme.safeStr(rawVal) || '—';
        } else {
            displayValue = theme.fmtNum(numVal, { decimals: decimals >= 0 ? decimals : undefined });
        }

        if (unit) {
            if (unitPos === 'before') {
                displayValue = unit + displayValue;
            } else {
                displayValue = displayValue + unit;
            }
        }

        // Layout — Apple style: value dominant, label whispers
        var padX = Math.max(12, w * 0.06);
        var padY = Math.max(10, h * 0.08);

        // Value — hero tier
        var valueFontSize = Math.max(18, h * 0.32);
        ctx.font = '600 ' + valueFontSize + 'px ' + theme.FONTS.display;
        ctx.fillStyle = t.text;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        var valueY = padY + valueFontSize;
        ctx.fillText(displayValue, padX, valueY);

        // Label — whisper tier
        var labelFontSize = Math.max(7, h * 0.075);
        ctx.font = '500 ' + labelFontSize + 'px ' + theme.FONTS.display;
        ctx.fillStyle = t.textDim;
        var labelText = label.toUpperCase();
        var letterSpacing = 1.5;
        var labelY = valueY + labelFontSize + Math.max(4, h * 0.04);
        this._drawSpacedText(ctx, labelText, padX, labelY, letterSpacing);

        // Trend delta — bottom area
        if (trend !== null && !isNaN(trend)) {
            var trendFontSize = Math.max(9, h * 0.10);
            var trendY = h - padY;
            var trendPositive = trend >= 0;
            var arrow = trendPositive ? '▲' : '▼';
            var trendColor = trendPositive ? t.success : t.danger;
            var trendText = arrow + ' ' + Math.abs(trend).toFixed(1) + '%';

            ctx.font = '500 ' + trendFontSize + 'px ' + theme.FONTS.mono;
            ctx.fillStyle = trendColor;
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(trendText, padX, trendY);

            ctx.fillStyle = t.textMuted;
            ctx.font = '400 ' + trendFontSize + 'px ' + theme.FONTS.display;
            var trendW = ctx.measureText(trendText).width;
            ctx.fillText(' vs last week', padX + trendW, trendY);
        }

        // Accent line at bottom — Apple's signature thin accent
        var gi = accentIntensity / 50;
        if (gi > 0) {
            ctx.fillStyle = accentColor;
            ctx.globalAlpha = 0.6 * gi;
            ctx.fillRect(padX, h - 3, w - padX * 2, 2);
            ctx.globalAlpha = 1;
        }

        // Tooltip styling
        this._tooltip.style.background = t.card;
        this._tooltip.style.color = t.text;
        this._tooltip.style.fontFamily = theme.FONTS.display;
        this._tooltip.style.boxShadow = '0 2px 12px ' + t.shadow;

        this._hitZone = { x: 0, y: 0, w: w, h: h, label: label, value: displayValue, trend: trend };
    },

    _drawSpacedText: function(ctx, text, x, y, spacing) {
        var cx = x;
        for (var i = 0; i < text.length; i++) {
            ctx.fillText(text[i], cx, y);
            cx += ctx.measureText(text[i]).width + spacing;
        }
    },

    reflow: function() {
        if (this._lastData && this._lastConfig) {
            this._render(this._lastData, this._lastConfig);
        }
    },

    destroy: function() {
        if (this._tooltip && this._tooltip.parentNode) {
            this._tooltip.parentNode.removeChild(this._tooltip);
        }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }
});
