/*
 * Uber Operations — KPI Tile
 * Single-value tile with trend delta, unit suffix, and accent glow.
 * Handles string values like "3.2 min", "4.92", "2.4x" as-is (B11).
 * ES5 only. No jQuery (F10). Uses clearRect (B13).
 */
var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.style.overflow = 'hidden';

        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 12px;' +
            'pointer-events:none;white-space:nowrap;z-index:100;' +
            'font-size:11px;border-radius:2px;';
        this.el.style.position = 'relative';
        this.el.appendChild(this._tooltip);

        var self = this;
        this.el.addEventListener('mousemove', function(e) {
            if (!self._tipText) return;
            self._tooltip.style.display = 'block';
            var rect = self.el.getBoundingClientRect();
            self._tooltip.style.left = (e.clientX - rect.left + 12) + 'px';
            self._tooltip.style.top = (e.clientY - rect.top - 8) + 'px';
        });
        this.el.addEventListener('mouseleave', function() {
            self._tooltip.style.display = 'none';
        });

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
        if (!data || !data.colIdx || !data.rows || data.rows.length === 0) return;
        this._lastData = data;
        this._lastConfig = config;
        this._render(data, config);
    },

    _render: function(data, config) {
        var ns = theme.getNS(this);
        var t = theme.getTheme(theme.getOption(config, ns, 'theme', 'dark'));
        var gi = theme.parseNum(theme.getOption(config, ns, 'accentIntensity', '50'), 50) / 50;
        this._gi = gi;

        var setup = theme.setupCanvas(this.el);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;

        ctx.clearRect(0, 0, w, h);

        var row = data.rows[0];
        var colIdx = data.colIdx;

        var metricField = theme.getOption(config, ns, 'metricField', 'metric');
        var valueField = theme.getOption(config, ns, 'valueField', 'value');
        var deltaField = theme.getOption(config, ns, 'deltaField', 'delta');
        var unitField = theme.getOption(config, ns, 'unitField', 'unit');
        var unitPosField = theme.getOption(config, ns, 'unitPositionField', 'unitPosition');
        var accentColor = theme.getOption(config, ns, 'accentColor', t.accent);
        var decimals = theme.parseNum(theme.getOption(config, ns, 'decimals', '-1'), -1);

        var mi = colIdx[metricField] !== undefined ? colIdx[metricField] : -1;
        var vi = colIdx[valueField] !== undefined ? colIdx[valueField] : -1;
        var di = colIdx[deltaField] !== undefined ? colIdx[deltaField] : -1;
        var ui = colIdx[unitField] !== undefined ? colIdx[unitField] : -1;
        var upi = colIdx[unitPosField] !== undefined ? colIdx[unitPosField] : -1;

        var label = mi >= 0 ? String(row[mi] || '') : '';
        var rawStr = vi >= 0 ? String(row[vi] || '') : '';
        var rawDelta = di >= 0 ? row[di] : null;
        var unit = ui >= 0 ? String(row[ui] || '') : '';
        var unitPos = upi >= 0 ? String(row[upi] || 'after') : 'after';

        /* B11 — detect non-numeric strings and display as-is */
        var rawValue = parseFloat(rawStr);
        var isNumeric = !isNaN(rawValue) && String(rawValue) === rawStr.replace(/^[+\s]+/, '').replace(/,/g, '');
        var displayValue;
        if (!rawStr) {
            displayValue = '—';
        } else if (!isNumeric) {
            displayValue = rawStr;
        } else if (decimals >= 0) {
            displayValue = rawValue.toFixed(decimals);
        } else {
            displayValue = theme.fmtNum(rawValue, { compact: true });
        }

        /* Compose display with unit */
        var fullDisplay = displayValue;
        if (unit && isNumeric) {
            if (unitPos === 'before') {
                fullDisplay = unit + displayValue;
            } else {
                fullDisplay = displayValue + ' ' + unit;
            }
        }

        /* Layout — additive stacking, not percentage */
        var pad = Math.max(8, w * 0.06);
        var labelSize = Math.max(7, Math.round(Math.min(w, h) * 0.08));
        var valueSize = Math.max(18, Math.round(h * 0.38));
        var deltaSize = Math.max(8, Math.round(h * 0.09));

        /* Fit value to panel width */
        valueSize = theme.fitText(ctx, fullDisplay, w - pad * 2, valueSize, 14, theme.FONTS.data);

        var labelY = pad + labelSize;
        var valueY = labelY + labelSize * 0.5 + 6 + valueSize * 0.5;
        var deltaY = valueY + valueSize * 0.5 + 4 + deltaSize * 0.5;

        /* Left green accent bar — Uber's urban energy signature */
        var barW = Math.max(3, Math.round(w * 0.018));
        ctx.fillStyle = accentColor;
        ctx.fillRect(0, 0, barW, h);

        /* Label — whisper tier, uppercase */
        ctx.font = labelSize + 'px ' + theme.FONTS.ui;
        ctx.fillStyle = t.textFaint;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label.toUpperCase(), pad + barW, labelY);

        /* Value — hero tier with accent glow */
        ctx.save();
        ctx.font = 'bold ' + valueSize + 'px ' + theme.FONTS.data;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        if (gi > 0.1) {
            ctx.shadowColor = accentColor;
            ctx.shadowBlur = 8 * gi;
            ctx.fillStyle = accentColor;
            ctx.globalAlpha = 0.25 * gi;
            ctx.fillText(fullDisplay, pad + barW, valueY);
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
            ctx.globalAlpha = 1;
        }
        ctx.fillStyle = t.text;
        ctx.fillText(fullDisplay, pad + barW, valueY);
        ctx.restore();

        /* Delta — trend indicator below value */
        if (rawDelta !== null && rawDelta !== '' && rawDelta !== undefined) {
            var dv = parseFloat(rawDelta);
            if (!isNaN(dv)) {
                var dColor = dv >= 0 ? t.success : t.danger;
                var dSign = dv >= 0 ? '+' : '';
                var dStr = dSign + dv.toFixed(1) + '%';
                var arrowSize = Math.max(5, deltaSize * 0.6);

                ctx.fillStyle = dColor;
                ctx.beginPath();
                var ax = pad + barW;
                var ay = deltaY;
                if (dv >= 0) {
                    ctx.moveTo(ax, ay + arrowSize / 2);
                    ctx.lineTo(ax + arrowSize / 2, ay - arrowSize / 2);
                    ctx.lineTo(ax + arrowSize, ay + arrowSize / 2);
                } else {
                    ctx.moveTo(ax, ay - arrowSize / 2);
                    ctx.lineTo(ax + arrowSize / 2, ay + arrowSize / 2);
                    ctx.lineTo(ax + arrowSize, ay - arrowSize / 2);
                }
                ctx.closePath();
                ctx.fill();

                ctx.font = deltaSize + 'px ' + theme.FONTS.data;
                ctx.fillStyle = dColor;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(dStr, ax + arrowSize + 4, deltaY);
            }
        }

        /* Tooltip */
        this._tipText = label + ': ' + fullDisplay;
        this._tooltip.textContent = this._tipText;
        this._tooltip.style.background = t.panelHi;
        this._tooltip.style.color = t.text;
        this._tooltip.style.border = '1px solid ' + t.edgeStrong;
        this._tooltip.style.fontFamily = theme.FONTS.data;
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
