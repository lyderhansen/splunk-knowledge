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

        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            var rect = self._canvas.getBoundingClientRect();
            var mx = e.clientX - rect.left;
            var my = e.clientY - rect.top;
            if (self._arcHit && self._hitTestArc(mx, my)) {
                self._tooltip.textContent = self._arcHit.label;
                self._tooltip.style.display = 'block';
                self._tooltip.style.left = (mx + 12) + 'px';
                self._tooltip.style.top = (my - 8) + 'px';
                self._canvas.style.cursor = 'pointer';
            } else {
                self._tooltip.style.display = 'none';
                self._canvas.style.cursor = 'default';
            }
        });
        this._canvas.addEventListener('mouseleave', function() {
            self._tooltip.style.display = 'none';
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
        var maxValField = theme.getOption(config, ns, 'maxValueField', 'maxValue');
        var labelField = theme.getOption(config, ns, 'labelField', 'metric');
        var maxValue = parseFloat(theme.getOption(config, ns, 'maxValue', '100'));
        var thresholdLow = parseFloat(theme.getOption(config, ns, 'thresholdLow', '50'));
        var thresholdHigh = parseFloat(theme.getOption(config, ns, 'thresholdHigh', '70'));
        var unitStr = theme.getOption(config, ns, 'unit', '');
        var accentColor = theme.getOption(config, ns, 'accentColor', t.accent);
        var accentIntensity = parseInt(theme.getOption(config, ns, 'accentIntensity', '50'), 10);
        var decimals = parseInt(theme.getOption(config, ns, 'decimals', '0'), 10);

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
        var mi = colIdx[maxValField];
        var li = colIdx[labelField];

        var value = vi !== undefined ? parseFloat(row[vi]) : 0;
        if (isNaN(value)) value = 0;
        if (mi !== undefined && !isNaN(parseFloat(row[mi]))) maxValue = parseFloat(row[mi]);
        var label = theme.safeStr(li !== undefined ? row[li] : '');

        var pct = Math.min(1, Math.max(0, value / maxValue));

        // Arc geometry — coupled constraint (B8)
        var pad = Math.max(16, Math.min(w, h) * 0.06);
        var arcThick = Math.max(8, Math.min(w, h) * 0.06);
        var maxR_w = (w - pad * 2) / 2;
        var maxR_h = (h - pad * 2) * 0.48;
        var radius = Math.min(maxR_w, maxR_h);
        var cx = w / 2;
        var cy = pad + radius + arcThick / 2 + Math.max(0, h * 0.05);

        var startAngle = Math.PI * 0.8;
        var endAngle = Math.PI * 2.2;
        var totalArc = endAngle - startAngle;

        // Track (unfilled arc)
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.lineWidth = arcThick;
        ctx.lineCap = 'round';
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
        ctx.stroke();

        // Threshold segments — subtle background tints
        var lowAngle = startAngle + totalArc * (thresholdLow / maxValue);
        var highAngle = startAngle + totalArc * (thresholdHigh / maxValue);

        // Filled arc — gradient from danger to accent to success
        var fillAngle = startAngle + totalArc * pct;
        if (pct > 0) {
            var arcGrad = ctx.createConicGradient(startAngle, cx, cy);
            var dangerColor = isDark ? theme.DARK.danger : theme.LIGHT.danger;
            var warningColor = isDark ? theme.DARK.warning : theme.LIGHT.warning;
            var successColor = isDark ? theme.DARK.success : theme.LIGHT.success;

            // Map threshold positions to gradient stops (0-1 within the arc)
            var lowPct = thresholdLow / maxValue;
            var highPct = thresholdHigh / maxValue;

            ctx.beginPath();
            ctx.arc(cx, cy, radius, startAngle, fillAngle);
            ctx.lineWidth = arcThick;
            ctx.lineCap = 'round';

            // Color based on where value falls
            var fillColor;
            if (pct <= lowPct) {
                fillColor = dangerColor;
            } else if (pct <= highPct) {
                fillColor = warningColor;
            } else {
                fillColor = successColor;
            }

            // Gradient along the arc
            var grad = ctx.createLinearGradient(
                cx - radius, cy, cx + radius, cy
            );
            grad.addColorStop(0, theme.lerpColor(fillColor, accentColor, 0.3));
            grad.addColorStop(1, fillColor);
            ctx.strokeStyle = grad;

            // Subtle glow
            var gi = accentIntensity / 50;
            if (gi > 0.2) {
                ctx.shadowColor = fillColor;
                ctx.shadowBlur = 12 * gi;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
        }

        // Center value
        var valueFontSize = Math.max(20, radius * 0.55);
        var displayVal = decimals >= 0 ? value.toFixed(decimals) : theme.fmtNum(value);
        if (unitStr) displayVal = displayVal + unitStr;

        ctx.font = '600 ' + valueFontSize + 'px ' + theme.FONTS.display;
        ctx.fillStyle = t.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayVal, cx, cy);

        // Label below value
        if (label) {
            var subFontSize = Math.max(8, radius * 0.14);
            ctx.font = '500 ' + subFontSize + 'px ' + theme.FONTS.display;
            ctx.fillStyle = t.textDim;
            var labelText = label.toUpperCase();
            var spacing = 1.2;
            var totalW = 0;
            for (var c = 0; c < labelText.length; c++) {
                totalW += ctx.measureText(labelText[c]).width + spacing;
            }
            totalW -= spacing;
            var lx = cx - totalW / 2;
            var ly = cy + valueFontSize * 0.5 + subFontSize;
            for (var c2 = 0; c2 < labelText.length; c2++) {
                ctx.fillText(labelText[c2], lx, ly);
                lx += ctx.measureText(labelText[c2]).width + spacing;
            }
        }

        // Threshold labels at arc ends
        var tickFontSize = Math.max(7, radius * 0.10);
        ctx.font = '400 ' + tickFontSize + 'px ' + theme.FONTS.mono;
        ctx.fillStyle = t.textMuted;

        // Min label
        var minX = cx + (radius + arcThick + 8) * Math.cos(startAngle);
        var minY = cy + (radius + arcThick + 8) * Math.sin(startAngle);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText('0', minX, minY);

        // Max label
        var maxX = cx + (radius + arcThick + 8) * Math.cos(endAngle);
        var maxY = cy + (radius + arcThick + 8) * Math.sin(endAngle);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(String(Math.round(maxValue)), maxX, maxY);

        // Status text below gauge
        var statusY = cy + radius + arcThick + pad;
        if (statusY < h - pad) {
            var statusFontSize = Math.max(9, Math.min(w, h) * 0.04);
            var statusText, statusColor;
            if (pct * maxValue < thresholdLow) {
                statusText = 'Needs Attention';
                statusColor = dangerColor || t.danger;
            } else if (pct * maxValue < thresholdHigh) {
                statusText = 'Approaching Target';
                statusColor = warningColor || t.warning;
            } else {
                statusText = 'On Track';
                statusColor = successColor || t.success;
            }
            ctx.font = '500 ' + statusFontSize + 'px ' + theme.FONTS.display;
            ctx.fillStyle = statusColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(statusText, cx, statusY);
        }

        // Tooltip
        this._tooltip.style.background = t.card;
        this._tooltip.style.color = t.text;
        this._tooltip.style.fontFamily = theme.FONTS.display;
        this._tooltip.style.boxShadow = '0 2px 12px ' + t.shadow;

        this._arcHit = {
            cx: cx, cy: cy, radius: radius, thick: arcThick,
            label: (label || 'Score') + ': ' + displayVal + ' / ' + Math.round(maxValue)
        };
    },

    _hitTestArc: function(mx, my) {
        if (!this._arcHit) return false;
        var dx = mx - this._arcHit.cx;
        var dy = my - this._arcHit.cy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var inner = this._arcHit.radius - this._arcHit.thick;
        var outer = this._arcHit.radius + this._arcHit.thick;
        return dist >= inner && dist <= outer;
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
