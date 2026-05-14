// energy_area — Stacked area chart: EV energy consumption + regeneration over time
// Porsche Taycan Viz Pack · ES5 strict · theme.js API · no const/let/arrow/template literals

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var SplunkVisualizationUtils = require('api/SplunkVisualizationUtils');
var theme = require('shared/theme');

var EnergyArea = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        theme.injectFonts(document);
        this.el.style.overflow = 'hidden';
        this._canvas = null;
        this._tooltip = null;
        this._dataPoints = [];
        this._bound_onMouseMove = null;
        this._bound_onMouseLeave = null;
        this._observer = null;
        this._pendingDraw = null;
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

        this._canvas.addEventListener('mousemove', this._bound_onMouseMove);
        this._canvas.addEventListener('mouseleave', this._bound_onMouseLeave);

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

        // Find field indices
        var timeIdx = -1;
        var consIdx = -1;
        var regenIdx = -1;

        for (var i = 0; i < fields.length; i++) {
            var name = fields[i].name;
            if (name === '_time') timeIdx = i;
            if (name === 'consumption') consIdx = i;
            if (name === 'regeneration') regenIdx = i;
        }

        var points = [];
        for (var r = 0; r < rows.length; r++) {
            var row = rows[r];
            var timeVal = timeIdx >= 0 ? row[timeIdx] : '';
            var consVal = consIdx >= 0 ? parseFloat(row[consIdx]) : 0;
            var regenVal = regenIdx >= 0 ? parseFloat(row[regenIdx]) : 0;
            if (isNaN(consVal)) consVal = 0;
            if (isNaN(regenVal)) regenVal = 0;
            points.push({
                time: timeVal,
                consumption: consVal,
                regeneration: regenVal
            });
        }

        return { points: points };
    },

    updateView: function(formattedData, config) {
        var self = this;

        // Read all config here (never in formatData)
        var ns = theme.getNS(this);
        var timeField       = theme.getOption(config, ns, 'timeField', '_time');
        var consColor       = theme.getOption(config, ns, 'consumptionColor', '#3B82F6');
        var regenColor      = theme.getOption(config, ns, 'regenColor', '#00C9A7');
        var accentIntensity = parseFloat(theme.getOption(config, ns, 'accentIntensity', '50')) / 100;
        var themeMode       = theme.getOption(config, ns, 'theme', 'dark');
        var showGrid        = theme.getOption(config, ns, 'showGrid', 'true') !== 'false';
        var showCrosshair   = theme.getOption(config, ns, 'showCrosshair', 'true') !== 'false';
        var areaOpacity     = parseFloat(theme.getOption(config, ns, 'areaOpacity', '0.25'));
        var decimals        = parseInt(theme.getOption(config, ns, 'decimals', '1'), 10);
        var unit            = theme.getOption(config, ns, 'unit', 'kWh');

        var t = theme.getTheme(themeMode);

        this._config = {
            consColor: consColor,
            regenColor: regenColor,
            showCrosshair: showCrosshair,
            areaOpacity: areaOpacity,
            decimals: decimals,
            unit: unit,
            t: t
        };

        if (!formattedData || !formattedData.points || formattedData.points.length === 0) {
            return;
        }

        this._formattedData = formattedData;
        this._accentIntensity = accentIntensity;
        this._showGrid = showGrid;
        this._themeMode = themeMode;

        var self = this;
        theme.waitForFont(theme.FONT_DISPLAY, function() {
            self._draw();
        });
    },

    _draw: function() {
        if (!this._formattedData || !this._canvas) return;

        var points = this._formattedData.points;
        var cfg = this._config;
        var t = cfg.t;
        var sc = theme.scaleCanvas(this._canvas);
        var ctx = sc.ctx;
        var w = sc.w;
        var h = sc.h;

        this._drawCtx = ctx;
        this._drawW = w;
        this._drawH = h;

        ctx.clearRect(0, 0, w, h);

        // Layout margins
        var ML = 50;
        var MR = 16;
        var MT = 40;
        var MB = 30;
        var cw = w - ML - MR;
        var ch = h - MT - MB;

        if (cw < 10 || ch < 10) return;

        // Data extents
        var maxVal = 0;
        for (var i = 0; i < points.length; i++) {
            var p = points[i];
            var top = p.consumption + p.regeneration;
            if (top > maxVal) maxVal = top;
            if (p.consumption > maxVal) maxVal = p.consumption;
        }
        if (maxVal === 0) maxVal = 1;
        // Nice round ceiling
        maxVal = Math.ceil(maxVal * 1.1);

        var n = points.length;

        // Map data → canvas coords
        var self = this;
        function xOf(i) {
            return ML + (n === 1 ? cw / 2 : (i / (n - 1)) * cw);
        }
        function yOf(val) {
            return MT + ch - (val / maxVal) * ch;
        }

        // Store data point screen positions for crosshair hit testing
        this._dataPoints = [];
        for (var i = 0; i < n; i++) {
            this._dataPoints.push({
                x: xOf(i),
                consumption: points[i].consumption,
                regeneration: points[i].regeneration,
                time: points[i].time
            });
        }

        // --- Grid lines ---
        if (this._showGrid) {
            ctx.save();
            ctx.strokeStyle = theme.hexToRgba(t.gridLine || '#FFFFFF', 0.04);
            ctx.lineWidth = 1;
            var numTicks = 5;
            for (var ti = 0; ti <= numTicks; ti++) {
                var tickVal = (ti / numTicks) * maxVal;
                var gy = yOf(tickVal);
                ctx.beginPath();
                ctx.moveTo(ML, gy);
                ctx.lineTo(ML + cw, gy);
                ctx.stroke();
            }
            ctx.restore();
        }

        // --- Draw filled areas using quadratic bezier ---
        function drawArea(getY, color, alpha) {
            ctx.save();

            // Build gradient
            var grad = ctx.createLinearGradient(0, MT, 0, MT + ch);
            grad.addColorStop(0, theme.hexToRgba(color, alpha));
            grad.addColorStop(1, theme.hexToRgba(color, 0));
            ctx.fillStyle = grad;

            ctx.beginPath();
            // Start at baseline left
            ctx.moveTo(xOf(0), yOf(0));
            ctx.lineTo(xOf(0), getY(0));

            if (n === 1) {
                ctx.lineTo(xOf(0), getY(0));
            } else {
                // Quadratic bezier through points
                for (var ii = 0; ii < n - 1; ii++) {
                    var x0 = xOf(ii);
                    var y0 = getY(ii);
                    var x1 = xOf(ii + 1);
                    var y1 = getY(ii + 1);
                    var cpx = (x0 + x1) / 2;
                    ctx.quadraticCurveTo(cpx, y0, cpx, (y0 + y1) / 2);
                }
                // Last segment
                ctx.lineTo(xOf(n - 1), getY(n - 1));
            }

            // Close path: baseline right → left
            ctx.lineTo(xOf(n - 1), yOf(0));
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        // Consumption area (bottom layer)
        drawArea(
            function(i) { return yOf(points[i].consumption); },
            cfg.consColor,
            cfg.areaOpacity
        );

        // Regeneration area stacks on top (both from y=0 going up)
        drawArea(
            function(i) { return yOf(points[i].regeneration); },
            cfg.regenColor,
            cfg.areaOpacity
        );

        // --- Draw lines on top of fills ---
        function drawLine(getY, color) {
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(xOf(0), getY(0));
            if (n > 1) {
                for (var ii = 0; ii < n - 1; ii++) {
                    var x0 = xOf(ii);
                    var y0 = getY(ii);
                    var x1 = xOf(ii + 1);
                    var y1 = getY(ii + 1);
                    var cpx = (x0 + x1) / 2;
                    ctx.quadraticCurveTo(cpx, y0, cpx, (y0 + y1) / 2);
                }
                ctx.lineTo(xOf(n - 1), getY(n - 1));
            }
            ctx.stroke();
            ctx.restore();
        }

        drawLine(
            function(i) { return yOf(points[i].consumption); },
            cfg.consColor
        );
        drawLine(
            function(i) { return yOf(points[i].regeneration); },
            cfg.regenColor
        );

        // --- Y-axis labels ---
        ctx.save();
        ctx.font = '10px "' + theme.FONT_MONO + '"';
        ctx.fillStyle = t.textDim;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        var numYTicks = 5;
        for (var yi = 0; yi <= numYTicks; yi++) {
            var yVal = (yi / numYTicks) * maxVal;
            var yyy = yOf(yVal);
            ctx.fillText(theme.fmtNum(yVal, { decimals: 0 }), ML - 6, yyy);
        }
        ctx.restore();

        // --- X-axis labels ---
        ctx.save();
        ctx.font = '10px "' + theme.FONT_MONO + '"';
        ctx.fillStyle = t.textWhisper;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        var numXLabels = Math.min(7, n);
        for (var xi = 0; xi < numXLabels; xi++) {
            var frac = numXLabels === 1 ? 0 : xi / (numXLabels - 1);
            var dataIdx = Math.round(frac * (n - 1));
            var lx = xOf(dataIdx);
            var timeStr = String(points[dataIdx].time || '');
            // Show only short time portion
            var shortTime = timeStr.length > 8 ? timeStr.substr(timeStr.length - 8) : timeStr;
            ctx.fillText(shortTime, lx, MT + ch + 4);
        }
        ctx.restore();

        // --- Title ---
        ctx.save();
        ctx.font = '9px "' + theme.FONT_DISPLAY + '"';
        ctx.fillStyle = t.textWhisper;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('ENERGY', ML, 14);
        ctx.restore();

    },

    _onMouseMove: function(e) {
        if (!this._canvas || !this._formattedData) return;
        var rect = this._canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;

        this._lastMouseX = mx;
        this._lastMouseY = my;

        var cfg = this._config;
        var t = cfg.t;

        // Redraw base
        this._draw();

        var ctx = this._drawCtx;
        var w = this._drawW;
        var h = this._drawH;
        if (!ctx) return;

        var ML = 50;
        var MR = 16;
        var MT = 40;
        var MB = 30;
        var cw = w - ML - MR;
        var ch = h - MT - MB;

        // Clamp to chart area
        if (mx < ML || mx > ML + cw) {
            theme.hideTooltip(this._tooltip);
            return;
        }

        // Find nearest data point by x
        var nearest = null;
        var nearestDist = Infinity;
        var pts = this._dataPoints;
        for (var i = 0; i < pts.length; i++) {
            var dx = Math.abs(pts[i].x - mx);
            if (dx < nearestDist) {
                nearestDist = dx;
                nearest = pts[i];
            }
        }

        if (!nearest) {
            theme.hideTooltip(this._tooltip);
            return;
        }

        // Crosshair vertical line
        if (cfg.showCrosshair) {
            ctx.save();
            ctx.strokeStyle = theme.hexToRgba(t.textWhisper || '#FFFFFF', 0.3);
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(nearest.x, MT);
            ctx.lineTo(nearest.x, MT + ch);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }

        // Dots at hover position
        var maxVal = 0;
        var allPts = this._dataPoints;
        for (var j = 0; j < allPts.length; j++) {
            var top = allPts[j].consumption + allPts[j].regeneration;
            if (top > maxVal) maxVal = top;
            if (allPts[j].consumption > maxVal) maxVal = allPts[j].consumption;
        }
        if (maxVal === 0) maxVal = 1;
        maxVal = Math.ceil(maxVal * 1.1);

        function yOf(val) {
            return MT + ch - (val / maxVal) * ch;
        }

        var consY = yOf(nearest.consumption);
        var regenY = yOf(nearest.regeneration);

        ctx.save();
        // Consumption dot
        ctx.fillStyle = cfg.consColor;
        ctx.beginPath();
        ctx.arc(nearest.x, consY, 3, 0, Math.PI * 2);
        ctx.fill();
        // Regen dot
        ctx.fillStyle = cfg.regenColor;
        ctx.beginPath();
        ctx.arc(nearest.x, regenY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Tooltip
        var consFormatted = theme.fmtNum(nearest.consumption, { decimals: cfg.decimals, unit: cfg.unit, unitPosition: 'after' });
        var regenFormatted = theme.fmtNum(nearest.regeneration, { decimals: cfg.decimals, unit: cfg.unit, unitPosition: 'after' });
        var tipText = 'Time: ' + nearest.time + '\nConsumption: ' + consFormatted + '\nRegeneration: ' + regenFormatted;
        theme.showTooltip(this._tooltip, tipText, e.clientX, e.clientY);
    },

    _onMouseLeave: function() {
        theme.hideTooltip(this._tooltip);
        this._lastMouseX = null;
        this._lastMouseY = null;
        this._draw();
    },

    reflow: function() {
        if (this._formattedData) {
            var self = this;
            theme.waitForFont(theme.FONT_DISPLAY, function() {
                self._draw();
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
        }
        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }

});

module.exports = EnergyArea;
