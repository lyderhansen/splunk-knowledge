// Porsche Motorsport Viz Pack — Tire Timeline
// ES5 only — no const/let/arrow/template literals/destructuring/for..of
// webpack entry: require() / module.exports, SplunkVisualizationBase.extend({})

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

var NS = 'porsche_motorsport_viz.tire_timeline';

var COMPOUNDS = ['SOFT', 'MEDIUM', 'HARD', 'INTER', 'WET'];

var DRIVER_COL_W = 120;
var ROW_H        = 28;
var ROW_GAP      = 4;
var LAP_AXIS_H   = 20;
var LEGEND_H     = 28;
var PAD_TOP      = 8;
var PAD_RIGHT    = 16;
var PAD_BOTTOM   = 8;
var PAD_LEFT     = 8;
var STINT_GAP    = 2;

function getCompoundColor(t, compound, config) {
    var c = String(compound).toUpperCase();
    if (c === 'SOFT')   return theme.getOption(config, NS, 'softColor',   t.compoundSoft);
    if (c === 'MEDIUM') return theme.getOption(config, NS, 'mediumColor', t.compoundMedium);
    if (c === 'HARD')   return theme.getOption(config, NS, 'hardColor',   t.compoundHard);
    if (c === 'INTER')  return theme.getOption(config, NS, 'interColor',  t.compoundInter);
    if (c === 'WET')    return theme.getOption(config, NS, 'wetColor',    t.compoundWet);
    return t.silver;
}

var TireTimeline = SplunkVisualizationBase.extend({

    initialize: function () {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this._canvas = null;
        this._ctx    = null;
        this._bars   = [];
        this._drivers = [];
        this._totalLaps = 0;
        this._tooltip = theme.createTooltip();
        this._hoveredBar = null;
        this._boundMouseMove = null;
        this._boundMouseLeave = null;
    },

    getInitialDataParams: function () {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },

    formatData: function (data) {
        if (!data || !data.rows || data.rows.length === 0) return null;

        var fields = data.fields;
        var rows   = data.rows;

        // Build column index
        var idx = {};
        for (var fi = 0; fi < fields.length; fi++) {
            idx[fields[fi].name] = fi;
        }

        var config = this.getCurrentConfig ? this.getCurrentConfig() : {};

        var driverField     = theme.getOption(config, NS, 'driverField',     'driver');
        var stintField      = theme.getOption(config, NS, 'stintField',      'stint');
        var compoundField   = theme.getOption(config, NS, 'compoundField',   'compound');
        var startLapField   = theme.getOption(config, NS, 'startLapField',   'startLap');
        var endLapField     = theme.getOption(config, NS, 'endLapField',     'endLap');
        var totalLapsField  = theme.getOption(config, NS, 'totalLapsField',  'totalLaps');

        var driverOrder = [];
        var driverMap   = {};
        var globalMax   = 0;
        var providedTotal = 0;

        for (var ri = 0; ri < rows.length; ri++) {
            var row = rows[ri];

            var driverVal   = idx[driverField]   !== undefined ? row[idx[driverField]]   : '';
            var stintVal    = idx[stintField]     !== undefined ? row[idx[stintField]]    : 0;
            var compoundVal = idx[compoundField]  !== undefined ? row[idx[compoundField]] : 'SOFT';
            var startLap    = idx[startLapField]  !== undefined ? parseFloat(row[idx[startLapField]])  : 0;
            var endLap      = idx[endLapField]    !== undefined ? parseFloat(row[idx[endLapField]])    : 0;
            var totalLaps   = idx[totalLapsField] !== undefined ? parseFloat(row[idx[totalLapsField]]) : 0;

            var driver = String(driverVal || '');
            var stint  = parseFloat(stintVal) || 0;

            if (endLap > globalMax) globalMax = endLap;
            if (totalLaps > providedTotal) providedTotal = totalLaps;

            if (!driverMap[driver]) {
                driverMap[driver] = [];
                driverOrder.push(driver);
            }

            driverMap[driver].push({
                driver:    driver,
                stint:     stint,
                compound:  String(compoundVal).toUpperCase(),
                startLap:  startLap,
                endLap:    endLap
            });
        }

        // Sort each driver's stints by stint number
        for (var di = 0; di < driverOrder.length; di++) {
            var d = driverOrder[di];
            driverMap[d].sort(function (a, b) { return a.stint - b.stint; });
        }

        var totalLapsFinal = providedTotal > 0 ? providedTotal : globalMax;

        var driverRows = [];
        for (var di2 = 0; di2 < driverOrder.length; di2++) {
            driverRows.push({
                driver: driverOrder[di2],
                stints: driverMap[driverOrder[di2]]
            });
        }

        return {
            drivers:    driverRows,
            totalLaps:  totalLapsFinal
        };
    },

    updateView: function (data, config) {
        if (!data) return;
        this._drivers   = data.drivers;
        this._totalLaps = data.totalLaps;
        this._render(config);
    },

    _ensureCanvas: function () {
        if (!this._canvas) {
            this._canvas = document.createElement('canvas');
            this._canvas.style.cssText = 'display:block;width:100%;height:100%;';
            this.el.innerHTML = '';
            this.el.appendChild(this._canvas);

            var self = this;
            this._boundMouseMove = function (e) { self._onMouseMove(e); };
            this._boundMouseLeave = function () { self._onMouseLeave(); };
            this._canvas.addEventListener('mousemove', this._boundMouseMove);
            this._canvas.addEventListener('mouseleave', this._boundMouseLeave);
        }
        return this._canvas;
    },

    _render: function (config) {
        var canvas = this._ensureCanvas();
        var setup  = theme.setupCanvas(canvas);
        var ctx    = setup.ctx;
        var W      = setup.w;
        var H      = setup.h;

        var mode = theme.getOption(config, NS, 'theme', 'dark');
        var t    = theme.getTheme(mode);
        var accentIntensity = theme.parseFloat2(theme.getOption(config, NS, 'accentIntensity', 50), 50) / 100;

        this._ctx    = ctx;
        this._config = config;
        this._theme  = t;
        this._mode   = mode;
        this._W      = W;
        this._H      = H;
        this._accentIntensity = accentIntensity;

        // Clear
        ctx.clearRect(0, 0, W, H);

        if (!this._drivers || this._drivers.length === 0 || this._totalLaps <= 0) {
            ctx.fillStyle = t.textWhisper;
            ctx.font = '11px ' + theme.FONT_DATA;
            ctx.textAlign = 'center';
            ctx.fillText('No tire strategy data', W / 2, H / 2);
            return;
        }

        // Layout
        var drawTop   = PAD_TOP;
        var drawLeft  = PAD_LEFT;
        var drawRight = W - PAD_RIGHT;

        // Legend at top-right
        this._drawLegend(ctx, t, config, drawTop, drawRight);

        var contentTop = drawTop + LEGEND_H + 4;
        var contentBottom = H - PAD_BOTTOM - LAP_AXIS_H;
        var barLeft  = drawLeft + DRIVER_COL_W;
        var barRight = drawRight;
        var barW     = barRight - barLeft;

        // Driver rows
        this._bars = [];
        for (var di = 0; di < this._drivers.length; di++) {
            var rowY = contentTop + di * (ROW_H + ROW_GAP);
            this._drawDriverRow(ctx, t, config, this._drivers[di], rowY, barLeft, barW, this._totalLaps, drawLeft);
        }

        // Lap axis
        this._drawLapAxis(ctx, t, contentBottom, barLeft, barW, this._totalLaps);

        // Redraw hovered bar highlight
        if (this._hoveredBar) {
            this._drawHoverHighlight(ctx, this._hoveredBar);
        }
    },

    _drawLegend: function (ctx, t, config, topY, rightX) {
        var squareSize = 10;
        var labelPad   = 4;
        var itemGap    = 14;
        var x = rightX;

        ctx.font = '9px ' + theme.FONT_DATA;
        ctx.textBaseline = 'middle';

        // Draw right-to-left
        for (var ci = COMPOUNDS.length - 1; ci >= 0; ci--) {
            var compound = COMPOUNDS[ci];
            var label    = compound.charAt(0) + compound.slice(1).toLowerCase();
            var textW    = ctx.measureText(label).width;
            var itemW    = squareSize + labelPad + textW;

            x -= itemW;

            var color = getCompoundColor(t, compound, config);
            ctx.fillStyle = color;
            ctx.fillRect(x, topY + (LEGEND_H - squareSize) / 2, squareSize, squareSize);

            // For HARD on dark mode: add stroke so white square is visible
            if (String(compound).toUpperCase() === 'HARD') {
                ctx.strokeStyle = theme.withAlpha(t.warmGrey, 0.4);
                ctx.lineWidth   = 0.5;
                ctx.strokeRect(x + 0.25, topY + (LEGEND_H - squareSize) / 2 + 0.25, squareSize - 0.5, squareSize - 0.5);
            }

            ctx.fillStyle = t.textDim;
            ctx.fillText(label, x + squareSize + labelPad, topY + LEGEND_H / 2);

            x -= itemGap;
        }
    },

    _drawDriverRow: function (ctx, t, config, driverRow, rowY, barLeft, barW, totalLaps, labelLeft) {
        var driver = driverRow.driver;
        var stints = driverRow.stints;

        // Driver label
        ctx.font      = '11px ' + theme.FONT_DATA;
        ctx.fillStyle = t.text;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        var labelText = driver.length > 14 ? driver.slice(0, 13) + '…' : driver;
        ctx.fillText(labelText, labelLeft, rowY + ROW_H / 2);

        // Stints
        for (var si = 0; si < stints.length; si++) {
            var stint = stints[si];
            var startRatio = stint.startLap / totalLaps;
            var endRatio   = stint.endLap   / totalLaps;

            var bx = barLeft + startRatio * barW + (si > 0 ? STINT_GAP : 0);
            var bw = (endRatio - startRatio) * barW - (si > 0 ? STINT_GAP : 0) - (si < stints.length - 1 ? 0 : 0);
            if (bw < 1) bw = 1;

            var color = getCompoundColor(t, stint.compound, config);

            ctx.fillStyle = color;
            ctx.fillRect(bx, rowY, bw, ROW_H);

            // Compound label inside bar if wide enough
            var lapCount = stint.endLap - stint.startLap;
            var lapLabel = String(lapCount);
            ctx.font = '9px ' + theme.FONT_DATA;
            var labelW = ctx.measureText(lapLabel).width;
            if (bw > labelW + 8) {
                // Contrast text color
                var isLight = (stint.compound === 'HARD' || stint.compound === 'MEDIUM');
                ctx.fillStyle = isLight ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.80)';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(lapLabel, bx + bw / 2, rowY + ROW_H / 2);
            }

            this._bars.push({
                x:        bx,
                y:        rowY,
                w:        bw,
                h:        ROW_H,
                driver:   driver,
                stint:    stint.stint,
                compound: stint.compound,
                startLap: stint.startLap,
                endLap:   stint.endLap
            });
        }
    },

    _drawLapAxis: function (ctx, t, axisY, barLeft, barW, totalLaps) {
        ctx.strokeStyle = t.gridLine;
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(barLeft, axisY);
        ctx.lineTo(barLeft + barW, axisY);
        ctx.stroke();

        ctx.font      = '9px ' + theme.FONT_DATA;
        ctx.fillStyle = t.warmGrey;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        var tickInterval = 10;
        var maxTick = Math.ceil(totalLaps / tickInterval) * tickInterval;

        for (var lap = 0; lap <= maxTick; lap += tickInterval) {
            if (lap > totalLaps) break;
            var x = barLeft + (lap / totalLaps) * barW;
            ctx.beginPath();
            ctx.strokeStyle = t.gridLine;
            ctx.moveTo(x, axisY);
            ctx.lineTo(x, axisY + 4);
            ctx.stroke();
            ctx.fillStyle = t.warmGrey;
            ctx.fillText(String(lap), x, axisY + 5);
        }
    },

    _drawHoverHighlight: function (ctx, bar) {
        ctx.strokeStyle = 'rgba(255,255,255,0.90)';
        ctx.lineWidth   = 1;
        ctx.strokeRect(bar.x + 0.5, bar.y + 0.5, bar.w - 1, bar.h - 1);
    },

    _onMouseMove: function (e) {
        var rect = this._canvas.getBoundingClientRect();
        var mx   = e.clientX - rect.left;
        var my   = e.clientY - rect.top;

        var hit = null;
        for (var i = 0; i < this._bars.length; i++) {
            var b = this._bars[i];
            if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                hit = b;
                break;
            }
        }

        if (hit !== this._hoveredBar) {
            this._hoveredBar = hit;
            this._render(this._config);
        }

        if (hit) {
            var lapCount = hit.endLap - hit.startLap;
            var compound = hit.compound.charAt(0) + hit.compound.slice(1).toLowerCase();
            var html = '<strong>Stint ' + hit.stint + ': ' + compound + '</strong>' +
                       '<br>Laps ' + hit.startLap + '–' + hit.endLap +
                       ' (' + lapCount + ' laps)';
            theme.showTooltip(this._tooltip, html, e.clientX, e.clientY);
        } else {
            theme.hideTooltip(this._tooltip);
        }
    },

    _onMouseLeave: function () {
        this._hoveredBar = null;
        theme.hideTooltip(this._tooltip);
        this._render(this._config);
    },

    reflow: function () {
        if (this._drivers && this._drivers.length > 0) {
            this._render(this._config);
        }
    }

});

module.exports = TireTimeline;
