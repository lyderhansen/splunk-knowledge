// battery_gauge/src/visualization_source.js
// Segmented ring gauge for Porsche Taycan viz pack — battery SOC 0-100%
// ES5 only. Pure require/module.exports. No define().

var SplunkVisualizationBase = require("api/SplunkVisualizationBase");
var theme = require("shared/theme");

var NUM_SEGMENTS = 12;
var TOTAL_SWEEP_DEG = 240;
var START_DEG = 210;       // clock position where arc begins (bottom-left)
var GAP_DEG = 1.5;         // half-gap between segments in degrees

var DEG = Math.PI / 180;

module.exports = SplunkVisualizationBase.extend({

    initialize: function () {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        theme.injectFonts(document);
        this._canvas = null;
        this._tip = null;
        this._observer = null;
        this._lastConfig = null;
        this._lastData = null;
        this._boundMousemove = null;
        this._boundMouseleave = null;
    },

    getInitialDataParams: function () {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 1
        };
    },

    setupView: function () {
        var el = this.el;

        // Kill Splunk "no results" placeholder via MutationObserver
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
            var cx = rect.width / 2;
            var cy = rect.height / 2;
            var dist = Math.sqrt((mx - cx) * (mx - cx) + (my - cy) * (my - cy));
            var outerR = Math.min(rect.width, rect.height) / 2 - 8;
            var innerR = outerR - 28; // approximate gauge band
            if (dist >= innerR && dist <= outerR) {
                var soc = self._lastSoc !== undefined ? self._lastSoc : 0;
                theme.showTooltip(self._tip, "Battery: " + soc + "%", mx, my);
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
            return { soc: null, fields: [] };
        }
        var fields = data.fields || [];
        return { soc: null, rows: data.rows, fields: fields };
    },

    updateView: function (data, config) {
        this._lastConfig = config;
        this._lastData = data;

        var ns = theme.getNS(this);
        var valueField = theme.getOption(config, ns, "valueField", "value");
        var showLabel = theme.getOption(config, ns, "showLabel", "true") !== "false";
        var unit = theme.getOption(config, ns, "unit", "%");
        var decimals = parseInt(theme.getOption(config, ns, "decimals", "0"), 10);
        var accentColor = theme.getOption(config, ns, "accentColor", "#00C9A7");
        var accentIntensity = parseFloat(theme.getOption(config, ns, "accentIntensity", "50")) / 100;
        var themeMode = theme.getOption(config, ns, "theme", "dark");
        var warnThreshold = parseFloat(theme.getOption(config, ns, "warnThreshold", "20"));
        var critThreshold = parseFloat(theme.getOption(config, ns, "critThreshold", "10"));
        var glowEnabled = theme.getOption(config, ns, "glowEnabled", "true") !== "false";

        var t = theme.getTheme(themeMode);
        // Override accent with user color
        t = {
            bg: t.bg,
            card: t.card,
            cardSolid: t.cardSolid,
            cardStroke: t.cardStroke,
            ambientGlow: t.ambientGlow,
            text: t.text,
            textDim: t.textDim,
            textWhisper: t.textWhisper,
            accent: accentColor,
            accentBlue: t.accentBlue,
            danger: t.danger,
            warning: t.warning,
            success: t.success,
            gaugeTrack: t.gaugeTrack,
            gridLine: t.gridLine,
            hoverBg: t.hoverBg,
            headerBg: t.headerBg
        };

        // Extract SOC from data
        var soc = 0;
        if (data && data.rows && data.rows.length > 0) {
            var fields = data.fields || [];
            var valueIdx = 0;
            for (var fi = 0; fi < fields.length; fi++) {
                if (fields[fi].name === valueField) { valueIdx = fi; break; }
            }
            var raw = parseFloat(data.rows[0][valueIdx]);
            if (!isNaN(raw)) soc = Math.max(0, Math.min(100, raw));
        }

        this._lastSoc = soc;

        var self = this;

        theme.waitForFont(theme.FONT_DISPLAY, function () {
            self._render(soc, t, showLabel, unit, decimals, accentIntensity, glowEnabled,
                         warnThreshold, critThreshold, accentColor);
        });
    },

    _render: function (soc, t, showLabel, unit, decimals, gi, glowEnabled,
                       warnThreshold, critThreshold, accentColor) {
        var canvas = this._canvas;
        if (!canvas) return;
        var scaled = theme.scaleCanvas(canvas);
        var ctx = scaled.ctx;
        var w = scaled.w;
        var h = scaled.h;

        ctx.clearRect(0, 0, w, h);

        var cx = w / 2;
        var cy = h / 2 + 8; // shift center slightly down for the open-bottom arc

        var radius = Math.min(w, h) / 2 - 16;
        var strokeW = 14;
        var segGap = GAP_DEG * DEG;

        // Determine segment color based on SOC level
        var segmentColor;
        if (soc < warnThreshold) {
            segmentColor = t.danger;
        } else if (soc < 50) {
            segmentColor = t.warning;
        } else {
            segmentColor = accentColor;
        }

        var totalSweep = TOTAL_SWEEP_DEG * DEG;
        var segSweep = totalSweep / NUM_SEGMENTS;
        var filledCount = Math.round((soc / 100) * NUM_SEGMENTS);
        var startAngle = START_DEG * DEG;

        // Halo glow behind arc for SOC > 80%
        if (glowEnabled && soc > 80 && gi > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, radius, startAngle, startAngle + totalSweep);
            ctx.strokeStyle = theme.hexToRgba(accentColor, 0.4 * gi);
            ctx.lineWidth = strokeW + 10;
            ctx.shadowBlur = 20 * gi;
            ctx.shadowColor = theme.hexToRgba(accentColor, 0.4 * gi);
            ctx.stroke();
            theme.resetShadow(ctx);
            ctx.restore();
        }

        // Draw each segment
        for (var i = 0; i < NUM_SEGMENTS; i++) {
            var segStart = startAngle + i * segSweep + segGap;
            var segEnd = startAngle + (i + 1) * segSweep - segGap;
            var filled = i < filledCount;

            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, radius, segStart, segEnd);
            ctx.strokeStyle = filled ? segmentColor : t.gaugeTrack;
            ctx.lineWidth = strokeW;
            ctx.lineCap = "round";

            if (filled && glowEnabled && gi > 0) {
                ctx.shadowBlur = 8 * gi * (soc / 100);
                ctx.shadowColor = theme.hexToRgba(segmentColor, 0.7 * gi);
            }

            ctx.stroke();
            theme.resetShadow(ctx);
            ctx.restore();
        }

        // Center: large value text
        var valueStr = theme.fmtNum(soc, { decimals: decimals });
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.font = "700 56px '" + theme.FONT_DISPLAY + "', sans-serif";
        ctx.fillStyle = t.text;
        ctx.fillText(valueStr, cx, cy + 16);
        theme.resetShadow(ctx);
        ctx.restore();

        // Unit suffix (small, inline after number)
        if (unit) {
            var valWidth = ctx.measureText(valueStr).width;
            // Measure at 56px for alignment, then draw unit at 18px
            ctx.save();
            ctx.font = "700 56px '" + theme.FONT_DISPLAY + "', sans-serif";
            var vw = ctx.measureText(valueStr).width;
            ctx.font = "400 18px '" + theme.FONT_DISPLAY + "', sans-serif";
            ctx.textAlign = "left";
            ctx.textBaseline = "alphabetic";
            ctx.fillStyle = t.textDim;
            ctx.fillText(unit, cx + vw / 2 + 3, cy + 16 - 20);
            ctx.restore();
        }

        // "BATTERY" label below value
        if (showLabel) {
            ctx.save();
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.font = "400 9px '" + theme.FONT_DISPLAY + "', sans-serif";
            ctx.fillStyle = theme.hexToRgba(t.textWhisper, 0.25);
            ctx.letterSpacing = "2px";
            ctx.fillText("BATTERY", cx, cy + 24);
            ctx.restore();
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
