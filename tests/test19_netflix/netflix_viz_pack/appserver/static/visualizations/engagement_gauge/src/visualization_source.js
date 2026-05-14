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
            count: 50
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
        this._gi = gi;

        this._tooltip.style.background = t.panelHi;
        this._tooltip.style.color = t.text;
        this._tooltip.style.border = '1px solid ' + t.edgeStrong;
        this._tooltip.style.fontFamily = theme.FONTS.data;

        var field = theme.getOption(config, ns, 'field', 'value');
        var maxValue = theme.parseNum(theme.getOption(config, ns, 'maxValue', '100'), 100);
        var unit = theme.getOption(config, ns, 'unit', '%');
        var label = theme.getOption(config, ns, 'label', '');
        var decimals = parseInt(theme.getOption(config, ns, 'decimals', '1'), 10);
        var showGlow = theme.parseBool(theme.getOption(config, ns, 'showGlow', 'true'), true);

        if (!data || !data.colIdx || !data.rows || data.rows.length === 0) return;

        var row = data.rows[data.rows.length - 1];
        var colIdx = data.colIdx;
        var rawValue = (colIdx[field] !== undefined) ? parseFloat(row[colIdx[field]]) : 0;
        if (isNaN(rawValue)) rawValue = 0;
        var pct = Math.min(1, Math.max(0, rawValue / maxValue));

        var displayValue = decimals >= 0 ? rawValue.toFixed(decimals) : theme.fmtNum(rawValue, { compact: true });

        // Gauge geometry -- 270-degree sweep, Netflix cinematic arc
        var cx = w / 2;
        var cy = h * 0.52;
        var radius = Math.min(w, h) * 0.36;
        var trackWidth = Math.max(6, radius * 0.14);
        var startAngle = Math.PI * 0.75;
        var endAngle = Math.PI * 2.25;
        var sweepAngle = endAngle - startAngle;
        var valueAngle = startAngle + sweepAngle * pct;

        // Track (unfilled arc) -- subtle dark
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.strokeStyle = t.name === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
        ctx.lineWidth = trackWidth;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Filled arc -- Netflix red gradient from dark red to bright red
        if (pct > 0) {
            var grad = ctx.createLinearGradient(
                cx - radius, cy, cx + radius, cy
            );
            grad.addColorStop(0, '#831010');
            grad.addColorStop(0.5, accentColor);
            grad.addColorStop(1, '#FF2020');

            // Glow behind the arc
            if (showGlow && gi > 0.2) {
                ctx.save();
                ctx.shadowColor = theme.withAlpha(accentColor, 0.4 * gi);
                ctx.shadowBlur = 20 * gi;
                ctx.beginPath();
                ctx.arc(cx, cy, radius, startAngle, valueAngle);
                ctx.strokeStyle = grad;
                ctx.lineWidth = trackWidth;
                ctx.lineCap = 'round';
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.shadowColor = 'transparent';
                ctx.restore();
            }

            ctx.beginPath();
            ctx.arc(cx, cy, radius, startAngle, valueAngle);
            ctx.strokeStyle = grad;
            ctx.lineWidth = trackWidth;
            ctx.lineCap = 'round';
            ctx.stroke();
        }

        // Tick marks -- subtle whisker ticks at 0%, 25%, 50%, 75%, 100%
        var tickRadius = radius + trackWidth / 2 + 4;
        var tickLen = 6;
        ctx.strokeStyle = t.textFaint;
        ctx.lineWidth = 1;
        for (var ti = 0; ti <= 4; ti++) {
            var tickAngle = startAngle + sweepAngle * (ti / 4);
            var tx1 = cx + Math.cos(tickAngle) * tickRadius;
            var ty1 = cy + Math.sin(tickAngle) * tickRadius;
            var tx2 = cx + Math.cos(tickAngle) * (tickRadius + tickLen);
            var ty2 = cy + Math.sin(tickAngle) * (tickRadius + tickLen);
            ctx.beginPath();
            ctx.moveTo(tx1, ty1);
            ctx.lineTo(tx2, ty2);
            ctx.stroke();

            // Tick label
            var tickLabelR = tickRadius + tickLen + 10;
            var tlx = cx + Math.cos(tickAngle) * tickLabelR;
            var tly = cy + Math.sin(tickAngle) * tickLabelR;
            var tickLabelSize = Math.max(7, radius * 0.08);
            ctx.font = tickLabelSize + 'px ' + theme.FONTS.data;
            ctx.fillStyle = t.textFaint;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(Math.round(maxValue * ti / 4)), tlx, tly);
        }

        // Center value -- HERO typography
        var valSize = Math.max(20, Math.min(56, radius * 0.55));
        ctx.font = 'bold ' + valSize + 'px ' + theme.FONTS.data;
        ctx.fillStyle = t.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayValue, cx, cy - valSize * 0.1);

        // Unit below value
        var unitSize = Math.max(9, valSize * 0.35);
        ctx.font = '300 ' + unitSize + 'px ' + theme.FONTS.ui;
        ctx.fillStyle = t.textDim;
        ctx.fillText(unit, cx, cy + valSize * 0.45);

        // Label below gauge
        if (label) {
            var lblSize = Math.max(8, radius * 0.1);
            ctx.font = lblSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = t.textFaint;
            ctx.fillText(label.toUpperCase(), cx, cy + radius + trackWidth + 16);
        }

        // Hit regions
        this._hitRegions = [{
            x: cx - radius - trackWidth, y: cy - radius - trackWidth,
            w: (radius + trackWidth) * 2, h: (radius + trackWidth) * 2,
            tip: '<b>' + (label || field) + '</b>: ' + displayValue + unit + ' / ' + maxValue
        }];
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
            if (tx + 180 > this.el.offsetWidth) tx = mx - 180;
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
