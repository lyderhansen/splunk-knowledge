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
            'position:absolute;display:none;padding:8px 12px;' +
            'border-radius:2px;pointer-events:none;white-space:nowrap;' +
            'z-index:100;font-family:monospace;font-size:11px;max-width:250px;';
        this.el.appendChild(this._tooltip);

        this._hoverIdx = -1;
        this._hitRegions = [];
        this._chartLeft = 0;
        this._chartRight = 0;
        this._chartTop = 0;
        this._chartBottom = 0;
        this._numPoints = 0;
        this._seriesData = [];

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
        var result = { colIdx: colIdx, rows: data.rows, fields: fields };
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

        var labelField = theme.getOption(config, ns, 'labelField', 'week_number');
        var seriesStr = theme.getOption(config, ns, 'series', 'new_signups,churned');
        var seriesLabelsStr = theme.getOption(config, ns, 'seriesLabels', 'New Signups,Churned');
        var colorsStr = theme.getOption(config, ns, 'colors', '#E50914,#5C5C5C');
        var showGrid = theme.parseBool(theme.getOption(config, ns, 'showGrid', 'true'), true);

        var seriesFields = seriesStr.split(',');
        var seriesLabels = seriesLabelsStr.split(',');
        var colors = theme.parseColors(colorsStr, [accentColor, t.s4]);
        for (var si = 0; si < seriesFields.length; si++) seriesFields[si] = seriesFields[si].trim();
        for (var sli = 0; sli < seriesLabels.length; sli++) seriesLabels[sli] = seriesLabels[sli].trim();

        if (!data || !data.colIdx || !data.rows || data.rows.length === 0) return;

        var colIdx = data.colIdx;
        var rows = data.rows;
        var numPoints = rows.length;
        this._numPoints = numPoints;

        // Extract series data
        var allSeries = [];
        var globalMin = Infinity;
        var globalMax = -Infinity;
        for (var s = 0; s < seriesFields.length; s++) {
            var vals = [];
            var sIdx = colIdx[seriesFields[s]];
            for (var r = 0; r < rows.length; r++) {
                var v = (sIdx !== undefined) ? parseFloat(rows[r][sIdx]) : 0;
                if (isNaN(v)) v = 0;
                vals.push(v);
                if (v < globalMin) globalMin = v;
                if (v > globalMax) globalMax = v;
            }
            allSeries.push(vals);
        }
        this._seriesData = allSeries;

        // Labels
        var labels = [];
        var lIdx = colIdx[labelField];
        for (var li = 0; li < rows.length; li++) {
            labels.push((lIdx !== undefined) ? String(rows[li][lIdx] || '') : String(li));
        }

        // Nice range
        var range = globalMax - globalMin;
        if (range === 0) range = 1;
        var niceMin = Math.max(0, globalMin - range * 0.05);
        var niceMax = globalMax + range * 0.1;
        var niceRange = niceMax - niceMin;

        // Chart area
        var padL = Math.max(50, w * 0.06);
        var padR = Math.max(20, w * 0.02);
        var padT = Math.max(20, h * 0.06);
        var padB = Math.max(40, h * 0.12);
        var legendH = 20;
        var chartW = w - padL - padR;
        var chartH = h - padT - padB - legendH;

        this._chartLeft = padL;
        this._chartRight = padL + chartW;
        this._chartTop = padT;
        this._chartBottom = padT + chartH;

        // Grid lines
        if (showGrid) {
            var gridDivisions = 4;
            for (var gi2 = 0; gi2 <= gridDivisions; gi2++) {
                var gy = padT + chartH - (chartH * gi2 / gridDivisions);
                ctx.strokeStyle = t.grid;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(padL, Math.round(gy) + 0.5);
                ctx.lineTo(padL + chartW, Math.round(gy) + 0.5);
                ctx.stroke();

                // Y-axis labels
                var yVal = niceMin + niceRange * (gi2 / gridDivisions);
                ctx.font = Math.max(8, Math.min(10, h * 0.03)) + 'px ' + theme.FONTS.data;
                ctx.fillStyle = t.textFaint;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                ctx.fillText(theme.fmtNum(yVal, { compact: true }), padL - 8, gy);
            }
        }

        // Draw areas (back to front)
        for (var as = allSeries.length - 1; as >= 0; as--) {
            var color = colors[as % colors.length];
            var vals2 = allSeries[as];

            // Area fill
            ctx.beginPath();
            for (var p = 0; p < numPoints; p++) {
                var px = padL + (p / Math.max(1, numPoints - 1)) * chartW;
                var py = padT + chartH - ((vals2[p] - niceMin) / niceRange) * chartH;
                if (p === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.lineTo(padL + chartW, padT + chartH);
            ctx.lineTo(padL, padT + chartH);
            ctx.closePath();

            // Gradient fill
            var areaGrad = ctx.createLinearGradient(0, padT, 0, padT + chartH);
            areaGrad.addColorStop(0, theme.withAlpha(color, 0.35));
            areaGrad.addColorStop(1, theme.withAlpha(color, 0.03));
            ctx.fillStyle = areaGrad;
            ctx.fill();

            // Line on top
            ctx.beginPath();
            for (var p2 = 0; p2 < numPoints; p2++) {
                var px2 = padL + (p2 / Math.max(1, numPoints - 1)) * chartW;
                var py2 = padT + chartH - ((vals2[p2] - niceMin) / niceRange) * chartH;
                if (p2 === 0) ctx.moveTo(px2, py2);
                else ctx.lineTo(px2, py2);
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // X-axis labels
        var xLabelSize = Math.max(8, Math.min(10, w * 0.01));
        ctx.font = xLabelSize + 'px ' + theme.FONTS.data;
        ctx.fillStyle = t.textFaint;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        var labelStep = Math.max(1, Math.ceil(numPoints / 8));
        for (var xl = 0; xl < numPoints; xl += labelStep) {
            var xlx = padL + (xl / Math.max(1, numPoints - 1)) * chartW;
            ctx.fillText(labels[xl], xlx, padT + chartH + 6);
        }

        // Hover crosshair
        if (this._hoverIdx >= 0 && this._hoverIdx < numPoints) {
            var hx = padL + (this._hoverIdx / Math.max(1, numPoints - 1)) * chartW;

            // Vertical line
            ctx.strokeStyle = theme.withAlpha(t.text, 0.2);
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(hx, padT);
            ctx.lineTo(hx, padT + chartH);
            ctx.stroke();
            ctx.setLineDash([]);

            // Data dots
            for (var ds = 0; ds < allSeries.length; ds++) {
                var hy = padT + chartH - ((allSeries[ds][this._hoverIdx] - niceMin) / niceRange) * chartH;
                ctx.beginPath();
                ctx.arc(hx, hy, 4, 0, Math.PI * 2);
                ctx.fillStyle = colors[ds % colors.length];
                ctx.fill();
                ctx.strokeStyle = t.panel;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        // Legend
        var legY = h - legendH;
        var legX = padL;
        ctx.textBaseline = 'middle';
        for (var lg = 0; lg < seriesFields.length; lg++) {
            var lc = colors[lg % colors.length];
            ctx.fillStyle = lc;
            ctx.fillRect(legX, legY + 5, 12, 10);
            ctx.font = Math.max(9, Math.min(11, w * 0.012)) + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = t.textDim;
            ctx.textAlign = 'left';
            var legLabel = (lg < seriesLabels.length) ? seriesLabels[lg] : seriesFields[lg];
            ctx.fillText(legLabel, legX + 16, legY + 10);
            legX += ctx.measureText(legLabel).width + 34;
        }
    },

    _onMouseMove: function(e) {
        var rect = this.canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;

        if (mx >= this._chartLeft && mx <= this._chartRight &&
            my >= this._chartTop && my <= this._chartBottom && this._numPoints > 0) {
            var pct = (mx - this._chartLeft) / (this._chartRight - this._chartLeft);
            var idx = Math.round(pct * (this._numPoints - 1));
            idx = Math.max(0, Math.min(this._numPoints - 1, idx));

            // Build tooltip
            var tipParts = [];
            for (var s = 0; s < this._seriesData.length; s++) {
                var val = this._seriesData[s][idx];
                tipParts.push(theme.fmtNum(val, { compact: true }));
            }
            this._tooltip.innerHTML = tipParts.join(' | ');
            this._tooltip.style.display = 'block';
            var tx = mx + 14;
            var ty = my - 10;
            if (tx + 200 > this.el.offsetWidth) tx = mx - 200;
            this._tooltip.style.left = tx + 'px';
            this._tooltip.style.top = ty + 'px';
            this.canvas.style.cursor = 'crosshair';

            if (this._hoverIdx !== idx) {
                this._hoverIdx = idx;
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

    _hitTest: function() { return null; },

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
