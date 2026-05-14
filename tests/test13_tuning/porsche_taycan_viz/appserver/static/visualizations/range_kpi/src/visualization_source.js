// range_kpi/src/visualization_source.js
// Single value tile with sparkline + trend delta — Porsche Taycan viz pack
// ES5 only. Pure require/module.exports. No define().

var SplunkVisualizationBase = require("api/SplunkVisualizationBase");
var theme = require("shared/theme");

// Sparkline lives in the bottom 30% of the panel
var SPARKLINE_HEIGHT_RATIO = 0.30;

module.exports = SplunkVisualizationBase.extend({

    initialize: function () {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        theme.injectFonts(document);
        this._canvas = null;
        this._tip = null;
        this._observer = null;
        this._lastConfig = null;
        this._lastData = null;
        this._sparkPoints = [];   // [{x, y, value}] in CSS-pixel coords
        this._boundMousemove = null;
        this._boundMouseleave = null;
    },

    getInitialDataParams: function () {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },

    setupView: function () {
        var el = this.el;

        // Hide Splunk "no results" overlay via MutationObserver
        this._observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (m) {
                m.addedNodes.forEach(function (node) {
                    if (node.nodeType === 1 && node.classList &&
                        (node.classList.contains("no-results-placeholder") ||
                         node.classList.contains("placeholder-container"))) {
                        node.style.display = "none";
                    }
                });
            });
        });
        this._observer.observe(el, { childList: true, subtree: true });

        this._canvas = theme.setupCanvas(el);
        this._tip = theme.createTooltip(el);

        var self = this;

        this._boundMousemove = function (e) {
            var rect = self._canvas.getBoundingClientRect();
            var mx = e.clientX - rect.left;
            var my = e.clientY - rect.top;
            var h = rect.height;
            var sparkTop = h * (1 - SPARKLINE_HEIGHT_RATIO);

            // Only show tooltip when in the sparkline zone
            if (my < sparkTop) {
                theme.hideTooltip(self._tip);
                return;
            }

            // Hit-test nearest sparkline point
            var pts = self._sparkPoints;
            if (!pts || pts.length === 0) {
                theme.hideTooltip(self._tip);
                return;
            }

            var nearest = null;
            var nearDist = Infinity;
            for (var i = 0; i < pts.length; i++) {
                var d = Math.abs(pts[i].x - mx);
                if (d < nearDist) {
                    nearDist = d;
                    nearest = pts[i];
                }
            }

            if (nearest && nearDist < 20) {
                theme.showTooltip(self._tip, String(nearest.value), mx, my);
            } else {
                theme.hideTooltip(self._tip);
            }
        };

        this._boundMouseleave = function () {
            theme.hideTooltip(self._tip);
        };

        el.addEventListener("mousemove", this._boundMousemove);
        el.addEventListener("mouseleave", this._boundMouseleave);
    },

    formatData: function (data) {
        if (!data || !data.rows || data.rows.length === 0) {
            return { values: [], trend: null, fields: [] };
        }
        return { rows: data.rows, fields: data.fields || [] };
    },

    updateView: function (data, config) {
        this._lastConfig = config;
        this._lastData = data;

        var ns = theme.getNS(this);
        var valueField   = theme.getOption(config, ns, "valueField",    "value");
        var trendField   = theme.getOption(config, ns, "trendField",    "trend");
        var unit         = theme.getOption(config, ns, "unit",          "km");
        var unitPosition = theme.getOption(config, ns, "unitPosition",  "after");
        var decimals     = parseInt(theme.getOption(config, ns, "decimals",      "0"), 10);
        var showTrend    = theme.getOption(config, ns, "showTrend",     "true") !== "false";
        var showSparkline = theme.getOption(config, ns, "showSparkline", "true") !== "false";
        var accentColor  = theme.getOption(config, ns, "accentColor",   "#00C9A7");
        var trendUpColor = theme.getOption(config, ns, "trendUpColor",  "#10B981");
        var trendDnColor = theme.getOption(config, ns, "trendDownColor","#EF4444");
        var accentIntensity = parseFloat(theme.getOption(config, ns, "accentIntensity", "50")) / 100;
        var themeMode    = theme.getOption(config, ns, "theme",         "dark");

        var t = theme.getTheme(themeMode);
        // Merge user accent into theme copy
        t = {
            bg: t.bg, card: t.card, cardSolid: t.cardSolid,
            cardStroke: t.cardStroke, ambientGlow: t.ambientGlow,
            text: t.text, textDim: t.textDim, textWhisper: t.textWhisper,
            accent: accentColor, accentBlue: t.accentBlue,
            danger: t.danger, warning: t.warning, success: t.success,
            gaugeTrack: t.gaugeTrack, gridLine: t.gridLine,
            hoverBg: t.hoverBg, headerBg: t.headerBg
        };

        // Parse all rows → sparkline values
        var sparkValues = [];
        var trendValue = null;

        if (data && data.rows && data.rows.length > 0) {
            var fields = data.fields || [];

            var valueIdx = 0;
            var trendIdx = -1;

            for (var fi = 0; fi < fields.length; fi++) {
                if (fields[fi].name === valueField) valueIdx = fi;
                if (fields[fi].name === trendField)  trendIdx = fi;
            }

            for (var ri = 0; ri < data.rows.length; ri++) {
                var raw = parseFloat(data.rows[ri][valueIdx]);
                if (!isNaN(raw)) sparkValues.push(raw);
            }

            // Trend from last row
            if (trendIdx >= 0) {
                var tv = parseFloat(data.rows[data.rows.length - 1][trendIdx]);
                if (!isNaN(tv)) trendValue = tv;
            }
        }

        var currentValue = sparkValues.length > 0 ? sparkValues[sparkValues.length - 1] : 0;

        var self = this;
        theme.waitForFont(theme.FONT_DISPLAY, function () {
            self._render(currentValue, sparkValues, trendValue, t,
                unit, unitPosition, decimals, showTrend, showSparkline,
                accentColor, trendUpColor, trendDnColor, accentIntensity);
        });
    },

    _render: function (currentValue, sparkValues, trendValue, t,
                       unit, unitPosition, decimals, showTrend, showSparkline,
                       accentColor, trendUpColor, trendDnColor, gi) {

        var canvas = this._canvas;
        if (!canvas) return;

        var scaled = theme.scaleCanvas(canvas);
        var ctx = scaled.ctx;
        var w = scaled.w;
        var h = scaled.h;

        ctx.clearRect(0, 0, w, h);

        var pad = 12;
        var gi2 = gi;

        // --- Sparkline geometry ---
        var sparkH = showSparkline ? h * SPARKLINE_HEIGHT_RATIO : 0;
        var sparkTop = h - sparkH;
        var sparkPad = pad;

        // --- Value positioning: upper-third vertical center ---
        var valueMidY = (sparkTop / 2);

        // --- Format the main value string ---
        var valueStr = theme.fmtNum(currentValue, { decimals: decimals });
        var unitStr = unit || "";

        // Measure at 48px bold to position unit
        ctx.font = "700 48px '" + theme.FONT_DISPLAY + "', sans-serif";
        var valueW = ctx.measureText(valueStr).width;

        // Unit is drawn at 18px textDim, 4px right of value, baseline-aligned
        ctx.font = "400 18px '" + theme.FONT_DISPLAY + "', sans-serif";
        var unitW = unitStr ? ctx.measureText(unitStr).width + 4 : 0;

        // Total block width for centering
        var blockW = valueW + (unitStr ? (unitW + 4) : 0);
        var blockX = (w - blockW) / 2;

        // Draw main value
        ctx.save();
        ctx.font = "700 48px '" + theme.FONT_DISPLAY + "', sans-serif";
        ctx.fillStyle = t.text;
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        var baselineY = valueMidY + 20; // nudge slightly down for visual centering
        ctx.fillText(valueStr, blockX, baselineY);
        ctx.restore();

        // Draw unit
        if (unitStr) {
            ctx.save();
            ctx.font = "400 18px '" + theme.FONT_DISPLAY + "', sans-serif";
            ctx.fillStyle = t.textDim;
            ctx.textAlign = "left";
            ctx.textBaseline = "alphabetic";

            var unitX, unitY;
            if (unitPosition === "before") {
                unitX = blockX - unitW - 2;
            } else {
                unitX = blockX + valueW + 4;
            }
            unitY = baselineY - 14; // raise unit slightly (superscript feel)
            ctx.fillText(unitStr, unitX, unitY);
            ctx.restore();
        }

        // --- Trend delta ---
        if (showTrend && trendValue !== null) {
            var isUp = trendValue >= 0;
            var arrow = isUp ? "▲" : "▼";
            var trendColor = isUp ? trendUpColor : trendDnColor;
            var absDelta = Math.abs(trendValue).toFixed(decimals);
            var trendStr = arrow + " " + absDelta;

            ctx.save();
            ctx.font = "400 14px '" + theme.FONT_DISPLAY + "', sans-serif";
            ctx.fillStyle = trendColor;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText(trendStr, w / 2, baselineY + 8);
            ctx.restore();
        }

        // --- Sparkline ---
        if (showSparkline && sparkValues.length >= 2) {
            var minV = Infinity;
            var maxV = -Infinity;
            for (var i = 0; i < sparkValues.length; i++) {
                if (sparkValues[i] < minV) minV = sparkValues[i];
                if (sparkValues[i] > maxV) maxV = sparkValues[i];
            }
            var range = maxV - minV;
            if (range === 0) range = 1;

            var sxLeft = sparkPad;
            var sxRight = w - sparkPad;
            var syTop = sparkTop + 8;
            var syBottom = h - 8;
            var sxW = sxRight - sxLeft;
            var syH = syBottom - syTop;

            var pts = [];
            for (var j = 0; j < sparkValues.length; j++) {
                var px = sxLeft + (j / (sparkValues.length - 1)) * sxW;
                var py = syBottom - ((sparkValues[j] - minV) / range) * syH;
                pts.push({ x: px, y: py, value: sparkValues[j] });
            }

            // Store hit-test points (CSS pixels)
            this._sparkPoints = pts;

            // Gradient fill from accent@20% to transparent
            var grad = ctx.createLinearGradient(0, syTop, 0, syBottom);
            grad.addColorStop(0, theme.hexToRgba(accentColor, 0.20));
            grad.addColorStop(1, theme.hexToRgba(accentColor, 0.00));

            // Fill area
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(pts[0].x, syBottom);
            ctx.lineTo(pts[0].x, pts[0].y);
            for (var k = 1; k < pts.length; k++) {
                ctx.lineTo(pts[k].x, pts[k].y);
            }
            ctx.lineTo(pts[pts.length - 1].x, syBottom);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.restore();

            // Stroke line
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (var m = 1; m < pts.length; m++) {
                ctx.lineTo(pts[m].x, pts[m].y);
            }
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 2;
            ctx.lineJoin = "round";

            if (gi > 0) {
                ctx.shadowBlur = 6 * gi;
                ctx.shadowColor = theme.hexToRgba(accentColor, 0.6 * gi);
            }
            ctx.stroke();
            theme.resetShadow(ctx);
            ctx.restore();

        } else {
            // No sparkline data — clear cached points
            this._sparkPoints = [];
        }
    },

    reflow: function () {
        if (this._lastData !== null && this._lastConfig !== null) {
            this.updateView(this._lastData, this._lastConfig);
        }
    },

    destroy: function () {
        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }
        if (this._canvas && this._boundMousemove) {
            this.el.removeEventListener("mousemove", this._boundMousemove);
            this.el.removeEventListener("mouseleave", this._boundMouseleave);
        }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }
});
