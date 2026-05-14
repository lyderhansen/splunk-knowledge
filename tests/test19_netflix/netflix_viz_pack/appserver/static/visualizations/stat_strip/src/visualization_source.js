var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

module.exports = SplunkVisualizationBase.extend({
    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.style.overflow = 'hidden';
        this.el.style.position = 'relative';

        var canvas = document.createElement('canvas');
        canvas.style.display = 'block';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        this.el.appendChild(canvas);
        this.canvas = canvas;

        this._lastData = null;
        this._lastConfig = null;
        this._lastGoodData = null;

        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 10px;' +
            'border-radius:2px;pointer-events:none;white-space:nowrap;' +
            'z-index:100;font-family:monospace;font-size:11px;';
        this.el.appendChild(this._tooltip);

        this._hoverIdx = -1;
        this._hitRegions = [];

        var self = this;
        this.canvas.addEventListener('mousemove', function(e) { self._onMouseMove(e); });
        this.canvas.addEventListener('mouseleave', function() {
            self._tooltip.style.display = 'none';
            self.canvas.style.cursor = 'default';
            if (self._hoverIdx !== -1) {
                self._hoverIdx = -1;
                self._render(self._lastData, self._lastConfig);
            }
        });
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
        if (!data) {
            if (this._lastGoodData) data = this._lastGoodData;
            else return;
        }
        this._lastData = data;
        this._lastConfig = config;
        var self = this;
        theme.loadFonts(function() { self._render(data, config); });
    },

    _render: function(data, config) {
        var el = this.el;
        var w = el.offsetWidth;
        var h = el.offsetHeight;
        if (w <= 0 || h <= 0) return;

        var setup = theme.setupCanvas(el);
        this.canvas = setup.canvas;
        var ctx = setup.ctx;
        w = setup.w;
        h = setup.h;
        ctx.clearRect(0, 0, w, h);

        var ns = theme.getNS(this);
        var t = theme.getTheme(theme.getOption(config, ns, 'theme', 'dark'));
        var accentColor = theme.getOption(config, ns, 'accentColor', '#E50914');
        var gi = theme.parseNum(theme.getOption(config, ns, 'accentIntensity', '50'), 50) / 50;

        this._tooltip.style.background = t.panelHi;
        this._tooltip.style.color = t.text;
        this._tooltip.style.border = '1px solid ' + t.edgeStrong;
        this._tooltip.style.fontFamily = theme.FONTS.data;

        var metricField = theme.getOption(config, ns, 'metricField', 'metric');
        var valueField = theme.getOption(config, ns, 'valueField', 'value');
        var deltaField = theme.getOption(config, ns, 'deltaField', 'delta');
        var unitField = theme.getOption(config, ns, 'unitField', 'unit');
        var decimals = parseInt(theme.getOption(config, ns, 'decimals', '-1'), 10);

        if (!data || !data.colIdx || !data.rows || data.rows.length === 0) return;

        var colIdx = data.colIdx;
        var rows = data.rows;

        // Parse metrics
        var metrics = [];
        for (var r = 0; r < rows.length; r++) {
            var metricName = (colIdx[metricField] !== undefined) ? String(rows[r][colIdx[metricField]] || '') : '';
            var value = (colIdx[valueField] !== undefined) ? parseFloat(rows[r][colIdx[valueField]]) : 0;
            var delta = (colIdx[deltaField] !== undefined) ? parseFloat(rows[r][colIdx[deltaField]]) : null;
            var unit = (colIdx[unitField] !== undefined) ? String(rows[r][colIdx[unitField]] || '') : '';
            if (isNaN(value)) value = 0;
            if (isNaN(delta)) delta = null;
            metrics.push({ name: metricName, value: value, delta: delta, unit: unit });
        }

        if (metrics.length === 0) return;

        // Horizontal strip layout -- each metric gets equal width
        var pad = Math.max(8, w * 0.015);
        var gap = Math.max(6, w * 0.008);
        var cellW = (w - pad * 2 - gap * (metrics.length - 1)) / metrics.length;
        var cellH = h - pad * 2;

        this._hitRegions = [];

        for (var i = 0; i < metrics.length; i++) {
            var metric = metrics[i];
            var cx = pad + i * (cellW + gap);
            var cy = pad;

            var isHover = this._hoverIdx === i;

            // Subtle separator between metrics (not before first)
            if (i > 0) {
                ctx.strokeStyle = t.edge;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cx - gap / 2, cy + cellH * 0.1);
                ctx.lineTo(cx - gap / 2, cy + cellH * 0.9);
                ctx.stroke();
            }

            // Hover highlight
            if (isHover) {
                theme.roundRect(ctx, cx - 2, cy - 2, cellW + 4, cellH + 4, 3);
                ctx.fillStyle = theme.withAlpha(accentColor, 0.05 * gi);
                ctx.fill();
            }

            // Metric label (WHISPER)
            var labelSize = Math.max(7, Math.min(10, cellH * 0.10));
            ctx.font = '500 ' + labelSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = t.textFaint;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(metric.name.toUpperCase(), cx + 4, cy);

            // Value (HERO for strip)
            var valueSize = Math.max(16, Math.min(32, cellH * 0.38));
            var displayValue;
            if (decimals >= 0) {
                displayValue = metric.value.toFixed(decimals);
            } else {
                displayValue = theme.fmtNum(metric.value, { compact: true });
            }

            ctx.font = 'bold ' + valueSize + 'px ' + theme.FONTS.data;
            ctx.fillStyle = t.text;
            ctx.textBaseline = 'top';
            var valueY = cy + labelSize + 4;
            ctx.fillText(displayValue, cx + 4, valueY);

            // Unit next to value
            if (metric.unit) {
                var valW = ctx.measureText(displayValue).width;
                var unitSize = Math.max(9, valueSize * 0.4);
                ctx.font = '300 ' + unitSize + 'px ' + theme.FONTS.ui;
                ctx.fillStyle = t.textDim;
                ctx.fillText(metric.unit, cx + 4 + valW + 3, valueY + valueSize - unitSize);
            }

            // Delta arrow + value
            if (metric.delta !== null) {
                var deltaY = valueY + valueSize + 6;
                var deltaSize = Math.max(9, Math.min(14, cellH * 0.12));
                var positive = metric.delta >= 0;
                var deltaColor = positive ? t.success : t.danger;
                var arrow = positive ? '▲' : '▼';
                var deltaStr = arrow + ' ' + Math.abs(metric.delta).toFixed(1) + '%';

                ctx.font = '500 ' + deltaSize + 'px ' + theme.FONTS.data;
                ctx.fillStyle = deltaColor;
                ctx.fillText(deltaStr, cx + 4, deltaY);
            }

            // Hit region
            this._hitRegions.push({
                x: cx, y: cy, w: cellW, h: cellH,
                tip: '<b>' + metric.name + '</b>: ' + displayValue + metric.unit +
                     (metric.delta !== null ? ' (' + (metric.delta >= 0 ? '+' : '') + metric.delta.toFixed(1) + '%)' : '')
            });
        }
    },

    _onMouseMove: function(e) {
        var rect = this.canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;
        var hit = this._hitTest(mx, my);
        if (hit !== null) {
            var region = this._hitRegions[hit];
            this._tooltip.innerHTML = region.tip;
            this._tooltip.style.display = 'block';
            var tx = mx + 14;
            var ty = my - 10;
            if (tx + 200 > this.el.offsetWidth) tx = mx - 200;
            if (ty < 0) ty = my + 20;
            this._tooltip.style.left = tx + 'px';
            this._tooltip.style.top = ty + 'px';
            this.canvas.style.cursor = 'pointer';
            if (this._hoverIdx !== hit) {
                this._hoverIdx = hit;
                this._render(this._lastData, this._lastConfig);
            }
        } else {
            this._tooltip.style.display = 'none';
            this.canvas.style.cursor = 'default';
            if (this._hoverIdx !== -1) {
                this._hoverIdx = -1;
                this._render(this._lastData, this._lastConfig);
            }
        }
    },

    _hitTest: function(mx, my) {
        for (var i = 0; i < this._hitRegions.length; i++) {
            var r = this._hitRegions[i];
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) return i;
        }
        return null;
    },

    reflow: function() {
        if (this._lastConfig) {
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
