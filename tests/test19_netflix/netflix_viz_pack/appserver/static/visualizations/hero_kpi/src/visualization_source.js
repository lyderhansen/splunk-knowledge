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
        this.canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this.canvas.addEventListener('mouseleave', function() {
            self._tooltip.style.display = 'none';
            self.canvas.style.cursor = 'default';
            if (self._hoverIdx !== -1) {
                self._hoverIdx = -1;
                self._render(self._lastData, self._lastConfig);
            }
        });
        this.canvas.addEventListener('click', function(e) {
            self._onClick(e);
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
        theme.loadFonts(function() {
            self._render(data, config);
        });
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

        // Tooltip styling
        this._tooltip.style.background = t.panelHi;
        this._tooltip.style.color = t.text;
        this._tooltip.style.border = '1px solid ' + t.edgeStrong;
        this._tooltip.style.fontFamily = theme.FONTS.data;

        // Read settings
        var field = theme.getOption(config, ns, 'field', 'value');
        var label = theme.getOption(config, ns, 'label', '');
        var unit = theme.getOption(config, ns, 'unit', '');
        var unitPos = theme.getOption(config, ns, 'unitPosition', 'after');
        var decimals = parseInt(theme.getOption(config, ns, 'decimals', '-1'), 10);
        var showDelta = theme.parseBool(theme.getOption(config, ns, 'showDelta', 'true'), true);
        var deltaField = theme.getOption(config, ns, 'deltaField', 'delta');
        var alignment = theme.getOption(config, ns, 'alignment', 'center');

        if (!data || !data.colIdx || !data.rows || data.rows.length === 0) return;

        // Read last row
        var row = data.rows[data.rows.length - 1];
        var colIdx = data.colIdx;
        var rawStr = (colIdx[field] !== undefined) ? String(row[colIdx[field]] || '') : '—';
        var rawValue = parseFloat(rawStr);
        var isNumeric = !isNaN(rawValue) && String(rawValue) === rawStr.replace(/^[+\s]+/, '');

        var displayValue;
        if (!rawStr || rawStr === 'undefined' || rawStr === 'null') {
            displayValue = '—';
        } else if (!isNumeric) {
            displayValue = rawStr;
        } else if (decimals >= 0) {
            displayValue = rawValue.toFixed(decimals);
        } else {
            displayValue = theme.fmtNum(rawValue, { compact: true });
        }

        // Unit assembly
        var fullValue = displayValue;
        if (unit) {
            if (unitPos === 'before') {
                fullValue = unit + displayValue;
            } else {
                fullValue = displayValue + unit;
            }
        }

        // Delta
        var deltaVal = null;
        if (showDelta && colIdx[deltaField] !== undefined) {
            deltaVal = parseFloat(row[colIdx[deltaField]]);
            if (isNaN(deltaVal)) deltaVal = null;
        }

        // Sizing -- cinematic oversized value
        var pad = Math.max(12, w * 0.05);
        var valueSize = Math.max(28, Math.min(96, h * 0.42));
        var labelSize = Math.max(8, Math.min(14, h * 0.08));
        var unitSize = Math.round(valueSize * 0.38);
        var deltaSize = Math.max(10, Math.min(18, h * 0.10));

        // Label position
        var labelY = pad + labelSize;

        // Value position
        var valueY = labelY + labelSize * 0.5 + 8 + valueSize * 0.5;

        // Delta position
        var deltaY = valueY + valueSize * 0.5 + 6 + deltaSize * 0.5;

        // Horizontal alignment
        var textX;
        if (alignment === 'left') {
            ctx.textAlign = 'left';
            textX = pad;
        } else if (alignment === 'right') {
            ctx.textAlign = 'right';
            textX = w - pad;
        } else {
            ctx.textAlign = 'center';
            textX = w / 2;
        }

        // Hover highlight
        if (this._hoverIdx === 0) {
            ctx.fillStyle = theme.withAlpha(accentColor, 0.04 * gi);
            ctx.fillRect(0, 0, w, h);
        }

        // Subtle left accent bar -- Netflix red stripe
        ctx.fillStyle = theme.withAlpha(accentColor, 0.6 * gi);
        theme.roundRect(ctx, 0, pad, 3, h - pad * 2, 1);
        ctx.fill();

        // Draw label (WHISPER tier)
        ctx.font = '500 ' + labelSize + 'px ' + theme.FONTS.ui;
        ctx.fillStyle = t.textFaint;
        ctx.textBaseline = 'middle';
        ctx.fillText(label.toUpperCase(), textX, labelY);

        // Draw value (HERO tier) with optional glow
        ctx.save();
        if (gi > 0.3) {
            ctx.shadowColor = theme.withAlpha(accentColor, 0.25 * gi);
            ctx.shadowBlur = 16 * gi;
        }
        ctx.textBaseline = 'middle';

        // Draw value and unit separately for size contrast
        if (unit && isNumeric) {
            var valFont = 'bold ' + valueSize + 'px ' + theme.FONTS.data;
            var unitFont = '300 ' + unitSize + 'px ' + theme.FONTS.ui;
            ctx.font = valFont;
            var valWidth = ctx.measureText(displayValue).width;
            ctx.font = unitFont;
            var uWidth = ctx.measureText(unit).width;
            var totalWidth = valWidth + 4 + uWidth;

            var startX;
            if (alignment === 'center') {
                startX = (w - totalWidth) / 2;
            } else if (alignment === 'right') {
                startX = w - pad - totalWidth;
            } else {
                startX = pad;
            }

            ctx.textAlign = 'left';
            if (unitPos === 'before') {
                ctx.font = unitFont;
                ctx.fillStyle = t.textDim;
                ctx.fillText(unit, startX, valueY);
                ctx.font = valFont;
                ctx.fillStyle = t.text;
                ctx.fillText(displayValue, startX + uWidth + 4, valueY);
            } else {
                ctx.font = valFont;
                ctx.fillStyle = t.text;
                ctx.fillText(displayValue, startX, valueY);
                ctx.font = unitFont;
                ctx.fillStyle = t.textDim;
                ctx.fillText(unit, startX + valWidth + 4, valueY);
            }
        } else {
            ctx.font = 'bold ' + valueSize + 'px ' + theme.FONTS.data;
            ctx.fillStyle = t.text;
            ctx.textAlign = alignment;
            ctx.fillText(fullValue, textX, valueY);
        }

        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.restore();

        // Draw delta
        if (deltaVal !== null) {
            var positive = deltaVal >= 0;
            var deltaColor = positive ? t.success : t.danger;
            var deltaStr = (positive ? '+' : '') + deltaVal.toFixed(1) + '%';
            var arrowSize = Math.max(6, deltaSize * 0.5);

            ctx.textAlign = alignment;
            ctx.textBaseline = 'middle';

            // Arrow + text
            var arrowAndText = deltaStr;
            ctx.font = '500 ' + deltaSize + 'px ' + theme.FONTS.data;
            var dtWidth = ctx.measureText(arrowAndText).width + arrowSize + 6;

            var dtX;
            if (alignment === 'center') {
                dtX = (w - dtWidth) / 2;
            } else if (alignment === 'right') {
                dtX = w - pad - dtWidth;
            } else {
                dtX = pad;
            }

            // Draw triangle
            ctx.fillStyle = deltaColor;
            ctx.beginPath();
            if (positive) {
                ctx.moveTo(dtX, deltaY + arrowSize * 0.4);
                ctx.lineTo(dtX + arrowSize / 2, deltaY - arrowSize * 0.4);
                ctx.lineTo(dtX + arrowSize, deltaY + arrowSize * 0.4);
            } else {
                ctx.moveTo(dtX, deltaY - arrowSize * 0.4);
                ctx.lineTo(dtX + arrowSize / 2, deltaY + arrowSize * 0.4);
                ctx.lineTo(dtX + arrowSize, deltaY - arrowSize * 0.4);
            }
            ctx.closePath();
            ctx.fill();

            ctx.textAlign = 'left';
            ctx.fillStyle = deltaColor;
            ctx.fillText(arrowAndText, dtX + arrowSize + 4, deltaY);
        }

        // Hit regions
        this._hitRegions = [{
            x: 0, y: 0, w: w, h: h,
            tip: '<b>' + label + '</b>: ' + fullValue + (deltaVal !== null ? ' (' + (deltaVal >= 0 ? '+' : '') + deltaVal.toFixed(1) + '%)' : ''),
            drilldownData: { 'click.name': field, 'click.value': rawStr }
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
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                return i;
            }
        }
        return null;
    },

    _onClick: function(e) {
        var rect = this.canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;
        var hit = this._hitTest(mx, my);
        if (hit !== null) {
            var region = this._hitRegions[hit];
            try {
                this.drilldownToPayload({
                    action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
                    data: region.drilldownData
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
