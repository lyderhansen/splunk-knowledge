/*
 * Uber Operations — Supply Gauge
 * Needle-style semicircular gauge showing driver supply ratio.
 * Branded zones: green (healthy) -> blue (moderate) -> orange (strained) -> red (critical).
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

        this._hitRegions = [];
        var self = this;
        this.el.addEventListener('mousemove', function(e) {
            if (!self._tipText) return;
            self._tooltip.textContent = self._tipText;
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

        var availField = theme.getOption(config, ns, 'availableField', 'available');
        var demandField = theme.getOption(config, ns, 'demandedField', 'demanded');
        var ratioField = theme.getOption(config, ns, 'ratioField', 'ratio');
        var maxValue = theme.parseNum(theme.getOption(config, ns, 'maxValue', '100'), 100);
        var redZoneStart = theme.parseNum(theme.getOption(config, ns, 'redZoneStart', '70'), 70);
        var accentColor = theme.getOption(config, ns, 'accentColor', t.accent);

        var ai = colIdx[availField] !== undefined ? colIdx[availField] : -1;
        var dei = colIdx[demandField] !== undefined ? colIdx[demandField] : -1;
        var ri = colIdx[ratioField] !== undefined ? colIdx[ratioField] : -1;

        var available = ai >= 0 ? parseFloat(row[ai]) : 0;
        var demanded = dei >= 0 ? parseFloat(row[dei]) : 0;
        var ratio = ri >= 0 ? parseFloat(row[ri]) : (demanded > 0 ? (available / demanded) * 100 : 0);
        if (isNaN(ratio)) ratio = 0;

        /* Gauge geometry — semicircle, scales with panel */
        var cx = w / 2;
        var radius = Math.max(30, Math.min(w, h) * 0.36);
        var cy = h * 0.55;
        var trackWidth = Math.max(6, radius * 0.12);
        var startAngle = Math.PI;
        var endAngle = 2 * Math.PI;
        var totalArc = endAngle - startAngle;

        /* Zone segments — Uber branded colors, NOT default green/yellow/red */
        var zones = [
            { from: 0, to: redZoneStart * 0.5 / maxValue, color: '#E11900' },    /* Critical — red */
            { from: redZoneStart * 0.5 / maxValue, to: redZoneStart / maxValue, color: '#FF6937' },  /* Strained — orange */
            { from: redZoneStart / maxValue, to: 0.85, color: '#276EF1' },        /* Moderate — blue */
            { from: 0.85, to: 1.0, color: '#06C167' }                            /* Healthy — green */
        ];

        /* Draw track background */
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.lineWidth = trackWidth;
        ctx.strokeStyle = theme.withAlpha(t.text, 0.06);
        ctx.lineCap = 'butt';
        ctx.stroke();

        /* Draw zone segments */
        for (var z = 0; z < zones.length; z++) {
            var zs = zones[z];
            var sa = startAngle + zs.from * totalArc;
            var ea = startAngle + zs.to * totalArc;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, sa, ea);
            ctx.lineWidth = trackWidth;
            ctx.strokeStyle = theme.withAlpha(zs.color, 0.35);
            ctx.lineCap = 'butt';
            ctx.stroke();
        }

        /* Draw filled arc up to current value */
        var valuePct = Math.min(1, Math.max(0, ratio / maxValue));
        var valueAngle = startAngle + valuePct * totalArc;
        var valueColor;
        for (var vc = zones.length - 1; vc >= 0; vc--) {
            if (valuePct >= zones[vc].from) {
                valueColor = zones[vc].color;
                break;
            }
        }
        if (!valueColor) valueColor = zones[0].color;

        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, valueAngle);
        ctx.lineWidth = trackWidth;
        ctx.strokeStyle = valueColor;
        ctx.lineCap = 'butt';
        ctx.stroke();

        /* Glow on the filled arc */
        if (gi > 0.1) {
            ctx.save();
            ctx.shadowColor = valueColor;
            ctx.shadowBlur = 8 * gi;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, startAngle, valueAngle);
            ctx.lineWidth = trackWidth * 0.5;
            ctx.strokeStyle = theme.withAlpha(valueColor, 0.4 * gi);
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
            ctx.restore();
        }

        /* Needle */
        var needleAngle = startAngle + valuePct * totalArc;
        var needleLen = radius - trackWidth * 0.5 - 4;
        var needleInner = radius * 0.08;
        var nx = cx + Math.cos(needleAngle) * needleLen;
        var ny = cy + Math.sin(needleAngle) * needleLen;

        ctx.save();
        ctx.beginPath();
        /* Thin triangle needle */
        var perpAngle = needleAngle + Math.PI / 2;
        var nw = Math.max(2, trackWidth * 0.15);
        ctx.moveTo(cx + Math.cos(perpAngle) * nw, cy + Math.sin(perpAngle) * nw);
        ctx.lineTo(nx, ny);
        ctx.lineTo(cx - Math.cos(perpAngle) * nw, cy - Math.sin(perpAngle) * nw);
        ctx.closePath();
        ctx.fillStyle = t.text;
        ctx.fill();

        /* Needle pivot dot */
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(3, trackWidth * 0.25), 0, Math.PI * 2);
        ctx.fillStyle = valueColor;
        ctx.fill();
        ctx.restore();

        /* Tick marks — 0%, 50%, 100% */
        var ticks = [0, 0.25, 0.5, 0.75, 1.0];
        var tickFont = Math.max(8, radius * 0.08);
        ctx.font = tickFont + 'px ' + theme.FONTS.data;
        ctx.fillStyle = t.textFaint;
        ctx.textBaseline = 'middle';
        for (var ti = 0; ti < ticks.length; ti++) {
            var ta = startAngle + ticks[ti] * totalArc;
            var tickR = radius + trackWidth * 0.5 + 4;
            var tx = cx + Math.cos(ta) * tickR;
            var ty = cy + Math.sin(ta) * tickR;
            var tickLabel = Math.round(ticks[ti] * maxValue) + '%';
            ctx.textAlign = ticks[ti] < 0.3 ? 'right' : ticks[ti] > 0.7 ? 'left' : 'center';
            ctx.fillText(tickLabel, tx, ty);
        }

        /* Center readout — ratio percentage as hero value */
        var heroSize = Math.max(18, Math.min(48, radius * 0.4));
        ctx.save();
        ctx.font = 'bold ' + heroSize + 'px ' + theme.FONTS.data;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (gi > 0.1) {
            ctx.shadowColor = valueColor;
            ctx.shadowBlur = 10 * gi;
            ctx.fillStyle = valueColor;
            ctx.globalAlpha = 0.3 * gi;
            ctx.fillText(ratio.toFixed(1) + '%', cx, cy - radius * 0.15);
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
            ctx.globalAlpha = 1;
        }
        ctx.fillStyle = t.text;
        ctx.fillText(ratio.toFixed(1) + '%', cx, cy - radius * 0.15);
        ctx.restore();

        /* Sub-label */
        var subSize = Math.max(7, heroSize * 0.3);
        ctx.font = subSize + 'px ' + theme.FONTS.ui;
        ctx.fillStyle = t.textFaint;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SUPPLY RATIO', cx, cy + radius * 0.05);

        /* Bottom stats */
        var statSize = Math.max(8, radius * 0.1);
        var statY = cy + radius * 0.32;
        ctx.font = statSize + 'px ' + theme.FONTS.data;
        ctx.fillStyle = t.textDim;
        ctx.textAlign = 'center';
        ctx.fillText(theme.fmtNum(available, { compact: true }) + ' available', cx - radius * 0.45, statY);
        ctx.fillText(theme.fmtNum(demanded, { compact: true }) + ' demanded', cx + radius * 0.45, statY);

        /* Tooltip */
        this._tipText = 'Supply: ' + theme.fmtNum(available, { compact: true }) +
            ' / Demand: ' + theme.fmtNum(demanded, { compact: true }) +
            ' (' + ratio.toFixed(1) + '%)';
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
