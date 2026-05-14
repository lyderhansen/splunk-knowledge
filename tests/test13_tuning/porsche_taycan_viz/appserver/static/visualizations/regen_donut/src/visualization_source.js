// regen_donut — Donut ring: regeneration vs consumption split
// Porsche Taycan Viz Pack · ES5 strict · theme.js API · no const/let/arrow/template literals

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var SplunkVisualizationUtils = require('api/SplunkVisualizationUtils');
var theme = require('shared/theme');

var RegenDonut = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        theme.injectFonts(document);
        this.el.style.overflow = 'hidden';
        this._canvas = null;
        this._tooltip = null;
        this._segments = [];
        this._bound_onMouseMove = null;
        this._bound_onMouseLeave = null;
        this._bound_onClick = null;
        this._observer = null;
    },

    getInitialDataParams: function() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },

    setupView: function() {
        this._canvas = theme.setupCanvas(this.el);
        this._tooltip = theme.createTooltip(this.el);

        var self = this;

        this._bound_onMouseMove = function(e) { self._onMouseMove(e); };
        this._bound_onMouseLeave = function() { self._onMouseLeave(); };
        this._bound_onClick = function(e) { self._onClick(e); };

        this._canvas.addEventListener('mousemove', this._bound_onMouseMove);
        this._canvas.addEventListener('mouseleave', this._bound_onMouseLeave);
        this._canvas.addEventListener('click', this._bound_onClick);

        // Hide Splunk's built-in "no results" message
        this._observer = new MutationObserver(function() {
            var noData = self.el.querySelector('.no-results-placeholder');
            if (noData) {
                noData.style.display = 'none';
            }
        });
        this._observer.observe(this.el, { childList: true, subtree: true });
    },

    formatData: function(data) {
        if (!data || !data.rows || data.rows.length === 0) {
            return null;
        }

        var fields = data.fields;
        var rows = data.rows;

        var labelIdx = -1;
        var valueIdx = -1;

        for (var i = 0; i < fields.length; i++) {
            var name = fields[i].name;
            if (name === 'label') labelIdx = i;
            if (name === 'value') valueIdx = i;
        }

        var segments = [];
        for (var r = 0; r < rows.length; r++) {
            var row = rows[r];
            var lbl = labelIdx >= 0 ? String(row[labelIdx]) : 'Segment ' + (r + 1);
            var val = valueIdx >= 0 ? parseFloat(row[valueIdx]) : 0;
            if (isNaN(val)) val = 0;
            segments.push({ label: lbl, value: val });
        }

        return { segments: segments };
    },

    updateView: function(formattedData, config) {
        var ns = theme.getNS(this);
        var regenColor      = theme.getOption(config, ns, 'regenColor', '#00C9A7');
        var consColor       = theme.getOption(config, ns, 'consumptionColor', '#3B82F6');
        var ringWidth       = parseFloat(theme.getOption(config, ns, 'ringWidth', '24'));
        var showCenter      = theme.getOption(config, ns, 'showCenter', 'true') !== 'false';
        var centerLabel     = theme.getOption(config, ns, 'centerLabel', 'EFFICIENCY');
        var accentIntensity = parseFloat(theme.getOption(config, ns, 'accentIntensity', '50')) / 100;
        var themeMode       = theme.getOption(config, ns, 'theme', 'dark');
        var decimals        = parseInt(theme.getOption(config, ns, 'decimals', '1'), 10);
        var unit            = theme.getOption(config, ns, 'unit', 'kWh');

        var t = theme.getTheme(themeMode);

        this._config = {
            regenColor: regenColor,
            consColor: consColor,
            ringWidth: ringWidth,
            showCenter: showCenter,
            centerLabel: centerLabel,
            accentIntensity: accentIntensity,
            decimals: decimals,
            unit: unit,
            t: t
        };

        if (!formattedData || !formattedData.segments || formattedData.segments.length === 0) {
            return;
        }

        this._formattedData = formattedData;

        var self = this;
        theme.waitForFont(theme.FONT_DISPLAY, function() {
            self._draw(-1);
        });
    },

    _draw: function(hoveredIdx) {
        if (!this._formattedData || !this._canvas) return;

        var segments = this._formattedData.segments;
        var cfg = this._config;
        var t = cfg.t;

        var sc = theme.scaleCanvas(this._canvas);
        var ctx = sc.ctx;
        var w = sc.w;
        var h = sc.h;

        ctx.clearRect(0, 0, w, h);

        // Calculate total
        var total = 0;
        for (var i = 0; i < segments.length; i++) {
            total += segments[i].value;
        }
        if (total <= 0) total = 1;

        // Center + radius
        var cx = w / 2;
        var cy = h / 2;
        var minDim = Math.min(w, h);
        var outerRadius = minDim / 2 - 20;
        if (outerRadius < 10) outerRadius = 10;

        var ringWidth = Math.max(8, Math.min(cfg.ringWidth, outerRadius * 0.3));

        // Colors for segments: index 0 = regenColor, index 1 = consColor
        var colors = [cfg.regenColor, cfg.consColor];

        // Arc gap in radians
        var GAP = 0.04;

        // Build segment arc data for hit testing
        this._segments = [];
        var startAngle = -Math.PI / 2; // top

        for (var i = 0; i < segments.length; i++) {
            var fraction = segments[i].value / total;
            var sweep = fraction * (Math.PI * 2) - GAP;
            if (sweep < 0) sweep = 0;

            var color = colors[i] || t.accent;
            var isHovered = (i === hoveredIdx);
            var gi = cfg.accentIntensity;

            // Glow on hover
            if (isHovered) {
                ctx.save();
                ctx.shadowColor = color;
                ctx.shadowBlur = 10 * Math.max(0.5, gi);
            } else {
                ctx.save();
            }

            ctx.beginPath();
            ctx.arc(cx, cy, outerRadius - ringWidth / 2, startAngle + GAP / 2, startAngle + GAP / 2 + sweep);
            ctx.strokeStyle = color;
            ctx.lineWidth = ringWidth;
            ctx.lineCap = 'butt';
            ctx.stroke();

            theme.resetShadow(ctx);
            ctx.restore();

            // Store segment arc range for hit testing
            this._segments.push({
                label: segments[i].label,
                value: segments[i].value,
                fraction: fraction,
                startAngle: startAngle + GAP / 2,
                endAngle: startAngle + GAP / 2 + sweep,
                color: color
            });

            startAngle = startAngle + GAP / 2 + sweep + GAP / 2;
        }

        // Center text — auto-scaled to panel size
        if (cfg.showCenter && segments.length >= 2) {
            var regenVal = segments[0].value;
            var totalVal = total;
            var efficiency = (regenVal / totalVal) * 100;
            var innerR = outerRadius - ringWidth;
            var valueFontSize = Math.max(14, Math.min(36, Math.floor(innerR * 0.45)));
            var labelFontSize = Math.max(7, Math.min(10, Math.floor(innerR * 0.12)));
            var labelOffset = Math.floor(valueFontSize * 0.65);

            ctx.save();
            ctx.font = 'bold ' + valueFontSize + 'px "' + theme.FONT_DISPLAY + '"';
            ctx.fillStyle = t.text;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(theme.fmtNum(efficiency, { decimals: 0 }) + '%', cx, cy - Math.floor(labelFontSize * 0.6));

            ctx.font = labelFontSize + 'px "' + theme.FONT_DISPLAY + '"';
            ctx.fillStyle = theme.hexToRgba(t.textWhisper || '#FFFFFF', 0.25);
            ctx.fillText(cfg.centerLabel, cx, cy + labelOffset);
            ctx.restore();
        }
    },

    _getAngleFromCenter: function(mx, my) {
        var sc = theme.scaleCanvas(this._canvas);
        var cx = sc.w / 2;
        var cy = sc.h / 2;
        var angle = Math.atan2(my - cy, mx - cx);
        return angle;
    },

    _getDistFromCenter: function(mx, my) {
        var sc = theme.scaleCanvas(this._canvas);
        var cx = sc.w / 2;
        var cy = sc.h / 2;
        return Math.sqrt((mx - cx) * (mx - cx) + (my - cy) * (my - cy));
    },

    _hitTest: function(mx, my) {
        var sc = theme.scaleCanvas(this._canvas);
        var minDim = Math.min(sc.w, sc.h);
        var outerRadius = minDim / 2 - 20;
        if (outerRadius < 10) outerRadius = 10;
        var ringWidth = this._config.ringWidth;
        var innerRadius = outerRadius - ringWidth;

        var dist = this._getDistFromCenter(mx, my);
        if (dist < innerRadius || dist > outerRadius) return -1;

        var angle = this._getAngleFromCenter(mx, my);

        // Normalize angle to match startAngle = -PI/2 reference
        // atan2 returns [-PI, PI]; our segments go from -PI/2 clockwise
        for (var i = 0; i < this._segments.length; i++) {
            var seg = this._segments[i];
            // Normalize angle into same space
            var normAngle = angle;
            // Check if angle falls in [startAngle, endAngle]
            // Both normalized to [-PI, PI] might wrap; handle both cases
            var start = seg.startAngle;
            var end = seg.endAngle;

            // Convert angles to [0, 2PI]
            function toPositive(a) {
                return ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            }

            var pa = toPositive(normAngle);
            var ps = toPositive(start);
            var pe = toPositive(end);

            var hit = false;
            if (ps <= pe) {
                hit = pa >= ps && pa <= pe;
            } else {
                // wraps around 0
                hit = pa >= ps || pa <= pe;
            }

            if (hit) return i;
        }

        return -1;
    },

    _onMouseMove: function(e) {
        if (!this._canvas || !this._formattedData) return;

        var rect = this._canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;

        var hitIdx = this._hitTest(mx, my);

        this._draw(hitIdx);

        if (hitIdx >= 0 && hitIdx < this._segments.length) {
            var seg = this._segments[hitIdx];
            var cfg = this._config;
            var valFormatted = theme.fmtNum(seg.value, { decimals: cfg.decimals, unit: cfg.unit, unitPosition: 'after' });
            var pct = theme.fmtNum(seg.fraction * 100, { decimals: 1 });
            var tipText = seg.label + ': ' + valFormatted + ' (' + pct + '%)';
            theme.showTooltip(this._tooltip, tipText, e.clientX, e.clientY);
        } else {
            theme.hideTooltip(this._tooltip);
        }
    },

    _onMouseLeave: function() {
        theme.hideTooltip(this._tooltip);
        this._draw(-1);
    },

    _onClick: function(e) {
        if (!this._canvas || !this._formattedData) return;

        var rect = this._canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;

        var hitIdx = this._hitTest(mx, my);
        if (hitIdx >= 0 && hitIdx < this._segments.length) {
            var seg = this._segments[hitIdx];
            theme.safeDrilldown(this, { label: seg.label, value: seg.value }, e);
        }
    },

    reflow: function() {
        if (this._formattedData) {
            var self = this;
            theme.waitForFont(theme.FONT_DISPLAY, function() {
                self._draw(-1);
            });
        }
    },

    destroy: function() {
        if (this._canvas) {
            if (this._bound_onMouseMove) {
                this._canvas.removeEventListener('mousemove', this._bound_onMouseMove);
            }
            if (this._bound_onMouseLeave) {
                this._canvas.removeEventListener('mouseleave', this._bound_onMouseLeave);
            }
            if (this._bound_onClick) {
                this._canvas.removeEventListener('click', this._bound_onClick);
            }
        }
        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }

});

module.exports = RegenDonut;
