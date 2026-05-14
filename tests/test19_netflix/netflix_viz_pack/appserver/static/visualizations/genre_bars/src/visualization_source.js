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
        this.canvas.addEventListener('click', function(e) { self._onClick(e); });
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

        var labelField = theme.getOption(config, ns, 'labelField', 'genre');
        var valueField = theme.getOption(config, ns, 'valueField', 'total_views');
        var shareField = theme.getOption(config, ns, 'shareField', 'share_pct');
        var maxBars = parseInt(theme.getOption(config, ns, 'maxBars', '10'), 10);
        var unit = theme.getOption(config, ns, 'unit', '');
        var showValues = theme.parseBool(theme.getOption(config, ns, 'showValues', 'true'), true);

        if (!data || !data.colIdx || !data.rows || data.rows.length === 0) return;

        var colIdx = data.colIdx;
        var rows = data.rows;
        var items = [];
        for (var r = 0; r < rows.length && items.length < maxBars; r++) {
            var label = (colIdx[labelField] !== undefined) ? String(rows[r][colIdx[labelField]] || '') : '';
            var value = (colIdx[valueField] !== undefined) ? parseFloat(rows[r][colIdx[valueField]]) : 0;
            var share = (colIdx[shareField] !== undefined) ? parseFloat(rows[r][colIdx[shareField]]) : 0;
            if (isNaN(value)) value = 0;
            if (isNaN(share)) share = 0;
            items.push({ label: label, value: value, share: share });
        }

        if (items.length === 0) return;

        // Find max value for scaling
        var maxVal = 0;
        for (var m = 0; m < items.length; m++) {
            if (items[m].value > maxVal) maxVal = items[m].value;
        }
        if (maxVal === 0) maxVal = 1;

        // Layout
        var pad = Math.max(10, w * 0.02);
        var labelW = Math.max(60, w * 0.15);
        var valueW = Math.max(50, w * 0.12);
        var barAreaW = w - pad * 2 - labelW - valueW;
        var barAreaX = pad + labelW;
        var gap = Math.max(3, h * 0.01);
        var barH = Math.max(14, Math.floor((h - pad * 2) / items.length) - gap);
        var fontSize = Math.max(9, Math.min(13, barH * 0.55));

        this._hitRegions = [];

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var by = pad + i * (barH + gap);
            var barW = (item.value / maxVal) * barAreaW;

            // Hover highlight
            if (this._hoverIdx === i) {
                ctx.fillStyle = theme.withAlpha(accentColor, 0.06 * gi);
                ctx.fillRect(0, by - 2, w, barH + 4);
            }

            // Label (left)
            ctx.font = fontSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = t.text;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.label, pad + labelW - 12, by + barH / 2);

            // Bar -- gradient from Netflix dark red to bright red proportional to value
            var barGrad = ctx.createLinearGradient(barAreaX, 0, barAreaX + barW, 0);
            barGrad.addColorStop(0, theme.withAlpha(accentColor, 0.6));
            barGrad.addColorStop(1, accentColor);

            theme.roundRect(ctx, barAreaX, by + 2, Math.max(2, barW), barH - 4, 2);
            ctx.fillStyle = barGrad;
            ctx.fill();

            // Glow on top bar
            if (i === 0 && gi > 0.3) {
                ctx.save();
                ctx.shadowColor = theme.withAlpha(accentColor, 0.3 * gi);
                ctx.shadowBlur = 8 * gi;
                theme.roundRect(ctx, barAreaX, by + 2, Math.max(2, barW), barH - 4, 2);
                ctx.fillStyle = 'rgba(0,0,0,0.01)';
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.shadowColor = 'transparent';
                ctx.restore();
            }

            // Value text (right)
            if (showValues) {
                ctx.font = 'bold ' + fontSize + 'px ' + theme.FONTS.data;
                ctx.fillStyle = t.text;
                ctx.textAlign = 'left';
                var valText = theme.fmtNum(item.value, { compact: true }) + unit;
                ctx.fillText(valText, barAreaX + barAreaW + 8, by + barH / 2);

                // Share percentage in dim
                if (item.share > 0) {
                    var shareText = '(' + item.share.toFixed(1) + '%)';
                    var valW2 = ctx.measureText(valText).width;
                    ctx.font = (fontSize - 2) + 'px ' + theme.FONTS.data;
                    ctx.fillStyle = t.textFaint;
                    ctx.fillText(shareText, barAreaX + barAreaW + 12 + valW2, by + barH / 2);
                }
            }

            // Hit region
            this._hitRegions.push({
                x: 0, y: by, w: w, h: barH,
                tip: '<b>' + item.label + '</b>: ' + theme.fmtNum(item.value, { compact: true }) + unit +
                     (item.share > 0 ? ' (' + item.share.toFixed(1) + '% share)' : ''),
                drilldownData: { 'click.name': labelField, 'click.value': item.label }
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

    _onClick: function(e) {
        var rect = this.canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;
        var hit = this._hitTest(mx, my);
        if (hit !== null) {
            try {
                this.drilldownToPayload({
                    action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
                    data: this._hitRegions[hit].drilldownData
                });
            } catch (ex) {}
        }
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
