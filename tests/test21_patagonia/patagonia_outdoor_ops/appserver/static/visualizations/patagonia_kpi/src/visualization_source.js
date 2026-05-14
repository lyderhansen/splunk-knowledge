// patagonia_kpi — Branded KPI tile visualization
// Patagonia Outdoor Operations viz pack
// ES5 CommonJS — build script wraps in AMD define()

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

var TOOLTIP_STYLE = [
    'position:absolute',
    'pointer-events:none',
    'display:none',
    'background:rgba(28,26,23,0.92)',
    'border:1px solid rgba(230,225,217,0.12)',
    'border-radius:4px',
    'padding:6px 10px',
    'color:#E6E1D9',
    'font-size:12px',
    'line-height:1.5',
    'white-space:nowrap',
    'z-index:9999',
    'max-width:240px'
].join(';');

module.exports = SplunkVisualizationBase.extend({

    initialize: function () {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this._container = null;
        this._canvas = null;
        this._tooltip = null;
        this._lastData = null;
        this._lastConfig = null;
        this._hitRegion = null;
        this._boundMouseMove = null;
        this._boundMouseLeave = null;
    },

    getInitialDataParams: function () {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },

    // formatData: build a generic column-index map; all field-name logic stays in updateView
    formatData: function (data) {
        if (!data || !data.rows || data.rows.length === 0) {
            return this._lastData || null;
        }
        var fields = data.fields;
        var colIdx = {};
        for (var i = 0; i < fields.length; i++) {
            colIdx[fields[i].name] = i;
        }
        var result = { colIdx: colIdx, rows: data.rows };
        this._lastData = result;
        return result;
    },

    _setupContainer: function () {
        if (this._container) return;

        var el = this.el;
        el.style.position = 'relative';
        el.style.overflow = 'hidden';


        var tip = document.createElement('div');
        tip.style.cssText = TOOLTIP_STYLE;
        el.appendChild(tip);
        this._tooltip = tip;

        var self = this;
        this._boundMouseMove = function (e) { self._onMouseMove(e); };
        this._boundMouseLeave = function () { self._hideTooltip(); };
        el.addEventListener('mousemove', this._boundMouseMove);
        el.addEventListener('mouseleave', this._boundMouseLeave);
    },

    _onMouseMove: function (e) {
        if (!this._hitRegion || !this._lastData) {
            this._hideTooltip();
            return;
        }
        var rect = this.el.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;
        var hr = this._hitRegion;

        if (mx >= hr.x && mx <= hr.x + hr.w && my >= hr.y && my <= hr.y + hr.h) {
            var d = this._lastData;
            var tip = this._tooltip;
            var lines = [];
            if (d.metric) lines.push('<strong>' + d.metric + '</strong>');
            var valDisplay = (typeof d.value === 'number')
                ? d.value.toLocaleString()
                : String(d.value);
            lines.push('Value: ' + valDisplay + (d.unit ? ' ' + d.unit : ''));
            if (d.trend !== null) {
                lines.push('Trend: ' + (d.trend >= 0 ? '+' : '') + d.trend.toFixed(1) + '%');
            }
            if (d.sparkPoints && d.sparkPoints.length > 0) {
                lines.push('Sparkline pts: ' + d.sparkPoints.length);
            }
            tip.innerHTML = lines.join('<br>');
            tip.style.display = 'block';
            var tx = Math.min(mx + 12, rect.width - 160);
            var ty = Math.max(my - 40, 4);
            tip.style.left = tx + 'px';
            tip.style.top = ty + 'px';
        } else {
            this._hideTooltip();
        }
    },

    _hideTooltip: function () {
        if (this._tooltip) this._tooltip.style.display = 'none';
    },

    updateView: function (data, config) {
        this._setupContainer();
        this._lastConfig = config;

        if (!data) {
            this._drawEmpty();
            return;
        }

        var ns = theme.getNS(this);

        // ── Theme ──
        var themeMode = theme.getOption(config, ns, 'themeMode', 'auto');
        if (themeMode === 'auto') themeMode = theme.detectTheme();
        var t = theme.getTheme(themeMode);
        var p = t.palette;

        // ── Field names from config ──
        var valueField    = theme.getOption(config, ns, 'valueField',    'value');
        var labelField    = theme.getOption(config, ns, 'labelField',    'metric');
        var unitField     = theme.getOption(config, ns, 'unitField',     'unit');
        var trendField    = theme.getOption(config, ns, 'trendField',    'trend');
        var sparkField    = theme.getOption(config, ns, 'sparklineField','sparkline');

        // ── Display options ──
        var accentColor    = theme.getOption(config, ns, 'accentColor',   '#5E8F5C');
        var valueColor     = theme.getOption(config, ns, 'valueColor',    '#5E8F5C');
        var accentIntensity = parseFloat(theme.getOption(config, ns, 'accentIntensity', '50')) / 100;
        var unitPosition   = theme.getOption(config, ns, 'unitPosition',  'after');
        var compact        = theme.getOption(config, ns, 'compact',       'true') === 'true';
        var showSparkline  = theme.getOption(config, ns, 'showSparkline', 'true') === 'true';
        var showTrend      = theme.getOption(config, ns, 'showTrend',     'true') === 'true';
        var decimalsStr    = theme.getOption(config, ns, 'decimals',      '-1');
        var decimals       = parseInt(decimalsStr, 10);
        if (isNaN(decimals)) decimals = -1;

        // ── Resolve data from colIdx ──
        var colIdx = data.colIdx;
        var row    = data.rows[0];

        var valueIdx  = (colIdx[valueField]     !== undefined) ? colIdx[valueField]     : -1;
        var labelIdx  = (colIdx[labelField]     !== undefined) ? colIdx[labelField]     : -1;
        var unitIdx   = (colIdx[unitField]      !== undefined) ? colIdx[unitField]      : -1;
        var trendIdx  = (colIdx[trendField]     !== undefined) ? colIdx[trendField]     : -1;
        var sparkIdx  = (colIdx[sparkField]     !== undefined) ? colIdx[sparkField]     : -1;

        if (valueIdx < 0) {
            this._drawEmpty();
            return;
        }

        var rawValue = row[valueIdx];
        var numericVal = parseFloat(rawValue);
        var isNumeric = !isNaN(numericVal);
        var metric    = (labelIdx >= 0 && row[labelIdx] != null) ? String(row[labelIdx]) : '';
        var unit      = (unitIdx  >= 0 && row[unitIdx] != null && row[unitIdx] !== '') ? String(row[unitIdx]) : '';
        var trend     = trendIdx >= 0 ? parseFloat(row[trendIdx]) : NaN;

        var sparkPoints = [];
        if (sparkIdx >= 0) {
            var sparkRaw = String(row[sparkIdx]);
            var parts = sparkRaw.split(',');
            for (var pi = 0; pi < parts.length; pi++) {
                var sp = parseFloat(parts[pi].trim());
                if (!isNaN(sp)) sparkPoints.push(sp);
            }
            if (sparkPoints.length > 5) sparkPoints = sparkPoints.slice(-5);
        }

        // Cache parsed data on _lastData for tooltip access
        this._lastData = {
            metric:      metric,
            value:       isNumeric ? numericVal : rawValue,
            rawValue:    rawValue,
            unit:        unit,
            trend:       isNaN(trend) ? null : trend,
            sparkPoints: sparkPoints,
            // keep colIdx + rows for reflow
            colIdx: colIdx,
            rows:   data.rows
        };

        // ── Canvas setup ──
        var setup = theme.setupCanvas(this.el);
        var ctx   = setup.ctx;
        var w     = setup.w;
        var h     = setup.h;
        this._canvas = setup.canvas;

        ctx.clearRect(0, 0, w, h);

        // ── Accent bar — left edge, 3px wide, 80% height ──
        var barW = 3;
        var barH = h * 0.80;
        var barY = (h - barH) / 2;
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = 0.75 + 0.25 * accentIntensity;
        ctx.fillRect(0, barY, barW, barH);
        ctx.globalAlpha = 1;

        var padL = barW + 12;
        var padR = 10;
        var padT = h * 0.10;

        // ── Trend indicator — top right ──
        if (showTrend && !isNaN(trend)) {
            var trendPositive = trend >= 0;
            var trendArrow    = trendPositive ? '▲' : '▼';
            var trendColor    = trendPositive ? p.green : p.rust;
            var trendFontSize = Math.max(8, h * 0.08);
            ctx.font         = '600 ' + trendFontSize + 'px ' + t.fonts.ui;
            ctx.fillStyle    = trendColor;
            ctx.textAlign    = 'right';
            ctx.textBaseline = 'top';
            var trendText = trendArrow + ' ' + Math.abs(trend).toFixed(1) + '%';
            ctx.fillText(trendText, w - padR, padT);
        }

        // ── Value display ──
        var valueStr;
        if (!isNumeric) {
            valueStr = String(rawValue);
        } else if (decimals >= 0) {
            valueStr = numericVal.toFixed(decimals);
        } else {
            valueStr = theme.fmtNum(numericVal, { compact: compact });
        }

        var displayStr;
        if (unit) {
            displayStr = unitPosition === 'before' ? unit + valueStr : valueStr + unit;
        } else {
            displayStr = valueStr;
        }

        var valFontSize = Math.max(14, h * 0.30);
        var valY        = h * 0.40;

        ctx.font         = '600 ' + valFontSize + 'px ' + t.fonts.ui;
        ctx.fillStyle    = valueColor;
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayStr, padL, valY);

        // Hit region for tooltip
        var valMeasure = ctx.measureText(displayStr);
        this._hitRegion = {
            x: padL,
            y: valY - valFontSize * 0.6,
            w: valMeasure.width,
            h: valFontSize * 1.2
        };

        // ── Metric label ──
        var labelFontSize = Math.max(7, h * 0.085);
        ctx.font         = '500 ' + labelFontSize + 'px ' + t.fonts.ui;
        ctx.fillStyle    = p.textDim;
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'top';
        // Note: Canvas 2D letterSpacing is a non-standard extension — apply via font trick where available
        var labelY   = valY + valFontSize * 0.52;
        var labelText = metric ? metric.toUpperCase() : '';
        ctx.fillText(labelText, padL, labelY);

        // ── Sparkline — bottom 20% of panel ──
        if (showSparkline && sparkPoints.length >= 2) {
            var spAreaTop = h * 0.78;
            var spAreaH   = h * 0.16;
            var spAreaW   = w - padL - padR;

            var spMin = sparkPoints[0];
            var spMax = sparkPoints[0];
            for (var si = 1; si < sparkPoints.length; si++) {
                if (sparkPoints[si] < spMin) spMin = sparkPoints[si];
                if (sparkPoints[si] > spMax) spMax = sparkPoints[si];
            }
            var spRange = (spMax - spMin) || 1;

            ctx.save();
            ctx.beginPath();
            for (var sj = 0; sj < sparkPoints.length; sj++) {
                var sx = padL + (sj / (sparkPoints.length - 1)) * spAreaW;
                var sy = spAreaTop + spAreaH - ((sparkPoints[sj] - spMin) / spRange) * spAreaH;
                if (sj === 0) ctx.moveTo(sx, sy);
                else ctx.lineTo(sx, sy);
            }
            ctx.strokeStyle = p.glacier;
            ctx.lineWidth   = 1.5;
            ctx.lineJoin    = 'round';
            ctx.lineCap     = 'round';
            ctx.globalAlpha = 0.75;
            ctx.stroke();

            // Endpoint dot
            var lastSx = padL + spAreaW;
            var lastSy = spAreaTop + spAreaH - ((sparkPoints[sparkPoints.length - 1] - spMin) / spRange) * spAreaH;
            ctx.beginPath();
            ctx.arc(lastSx, lastSy, 2.5, 0, Math.PI * 2);
            ctx.fillStyle    = p.glacier;
            ctx.globalAlpha  = 0.75;
            ctx.fill();
            ctx.globalAlpha  = 1;

            // Reset shadow state just in case
            ctx.shadowBlur    = 0;
            ctx.shadowColor   = 'transparent';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.restore();
        }
    },

    _drawEmpty: function () {
        if (!this._container) return;
        var setup = theme.setupCanvas(this.el);
        var ctx   = setup.ctx;
        var t     = theme.getTheme('dark');
        ctx.clearRect(0, 0, setup.w, setup.h);
        ctx.font         = '400 13px ' + t.fonts.ui;
        ctx.fillStyle    = 'rgba(230,225,217,0.25)';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No data', setup.w / 2, setup.h / 2);
    },

    reflow: function () {
        if (this._lastData && this._lastConfig) {
            this.updateView(this._lastData, this._lastConfig);
        }
    },

    destroy: function () {
        var el = this.el;
        if (this._boundMouseMove)  el.removeEventListener('mousemove',  this._boundMouseMove);
        if (this._boundMouseLeave) el.removeEventListener('mouseleave', this._boundMouseLeave);
        this._container  = null;
        this._canvas     = null;
        this._tooltip    = null;
        this._lastData   = null;
        this._lastConfig = null;
        this._hitRegion  = null;
        if (SplunkVisualizationBase.prototype.destroy) {
            SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
        }
    }

});
