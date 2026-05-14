// Porsche Motorsport Viz Pack — needle_gauge
// ES5 only — no const/let/arrow/template literals/destructuring/for..of
// Build: webpack wraps this in define() — source uses require()/module.exports

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
var NS = 'porsche_motorsport_viz.needle_gauge';
var START_ANGLE = 0.75 * Math.PI;   // 135 deg (7 o'clock, canvas coords)
var END_ANGLE   = 2.25 * Math.PI;   // 405 deg == 45 deg (5 o'clock)
var SWEEP       = 1.5 * Math.PI;    // 270 deg total sweep

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
}

function valueToAngle(value, min, max) {
    var pct = clamp((value - min) / (max - min), 0, 1);
    return START_ANGLE + pct * SWEEP;
}

// ---------------------------------------------------------------------------
// Viz
// ---------------------------------------------------------------------------
module.exports = SplunkVisualizationBase.extend({

    // -----------------------------------------------------------------------
    // Lifecycle
    // -----------------------------------------------------------------------
    initialize: function () {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

        // Container must be positioned for absolute tooltip child
        this.el.style.position = 'relative';

        // Canvas — created once, sized in _render via HiDPI helper
        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'display:block;width:100%;height:100%;';
        this._canvas.setAttribute('aria-label', 'Needle gauge');
        this.el.appendChild(this._canvas);

        // Tooltip — DOM div positioned inside the container
        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:5px 9px;' +
            'font:11px ' + theme.FONT_DATA + ';color:#fff;' +
            'background:rgba(0,0,0,0.88);border:1px solid rgba(255,255,255,0.12);' +
            'border-radius:2px;pointer-events:none;white-space:nowrap;z-index:100;';
        this.el.appendChild(this._tooltip);

        // Mouse event handlers
        var self = this;
        this._canvas.addEventListener('mousemove', function (e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function () {
            self._tooltip.style.display = 'none';
        });

        // Cache for reflow
        this._lastData   = null;
        this._lastConfig = null;

        // Store last parsed values for tooltip hit-test
        this._parsed = null;
    },

    // -----------------------------------------------------------------------
    // Data contract
    // -----------------------------------------------------------------------
    getInitialDataParams: function () {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },

    // -----------------------------------------------------------------------
    // formatData — pure data processing, NO config reads (B4)
    // -----------------------------------------------------------------------
    formatData: function (data) {
        if (!data || !data.rows || data.rows.length === 0) {
            if (this._lastGoodData) { return this._lastGoodData; }
            return data;
        }
        var fields  = data.fields;
        var colIdx  = {};
        var i;
        for (i = 0; i < fields.length; i++) {
            colIdx[fields[i].name] = i;
        }
        var result = { colIdx: colIdx, rows: data.rows };
        this._lastGoodData = result;
        return result;
    },

    // -----------------------------------------------------------------------
    // updateView — reads config, drives render
    // -----------------------------------------------------------------------
    updateView: function (data, config) {
        this._lastData   = data;
        this._lastConfig = config;
        this._render(data, config);
    },

    // -----------------------------------------------------------------------
    // reflow — resize handler
    // -----------------------------------------------------------------------
    reflow: function () {
        if (this._lastData && this._lastConfig) {
            this._render(this._lastData, this._lastConfig);
        }
    },

    // -----------------------------------------------------------------------
    // destroy
    // -----------------------------------------------------------------------
    destroy: function () {
        if (this._tooltip && this._tooltip.parentNode) {
            this._tooltip.parentNode.removeChild(this._tooltip);
        }
        if (this._canvas && this._canvas.parentNode) {
            this._canvas.parentNode.removeChild(this._canvas);
        }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    },

    // -----------------------------------------------------------------------
    // _render — main drawing entry point
    // -----------------------------------------------------------------------
    _render: function (data, config) {
        var canvas = this._canvas;

        // HiDPI setup — manual (B17: don't pass canvas to setupCanvas)
        var dpr  = window.devicePixelRatio || 1;
        var rect = this.el.getBoundingClientRect();
        var w    = rect.width  || 300;
        var h    = rect.height || 300;

        canvas.width        = w * dpr;
        canvas.height       = h * dpr;
        canvas.style.width  = w + 'px';
        canvas.style.height = h + 'px';

        var ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        // 1. Clear (B13 — never fillRect with bg color)
        ctx.clearRect(0, 0, w, h);

        // --- Read config options -------------------------------------------
        var themeMode       = theme.getOption(config, NS, 'theme', 'dark');
        var t               = theme.getTheme(themeMode);
        var accentColor     = theme.getOption(config, NS, 'accentColor', t.accent);
        var accentIntensity = theme.parseFloat2(theme.getOption(config, NS, 'accentIntensity', '50'), 50);
        var tickCount       = Math.max(2, parseInt(theme.getOption(config, NS, 'tickCount', '8'), 10));

        // Field name settings (all field names come from formatter)
        var valueField       = theme.getOption(config, NS, 'valueField',       'value');
        var minField         = theme.getOption(config, NS, 'minField',         'min');
        var maxField         = theme.getOption(config, NS, 'maxField',         'max');
        var redZoneField     = theme.getOption(config, NS, 'redZoneStartField','redZoneStart');
        var labelField       = theme.getOption(config, NS, 'labelField',       'label');
        var unitField        = theme.getOption(config, NS, 'unitField',        'unit');

        // Parse data row
        var parsed = this._parseRow(data, {
            valueField:   valueField,
            minField:     minField,
            maxField:     maxField,
            redZoneField: redZoneField,
            labelField:   labelField,
            unitField:    unitField
        });
        this._parsed = parsed;

        // Update aria-label for accessibility
        canvas.setAttribute('aria-label',
            (parsed.label ? parsed.label + ' ' : '') +
            parsed.value + (parsed.unit ? ' ' + parsed.unit : ''));

        // --- Geometry -----------------------------------------------------
        var cx     = w / 2;
        var cy     = h / 2;
        var radius = Math.min(w, h) * 0.38;

        // Tick label padding: leave room outside the arc for numeric labels
        var labelPad    = 24;
        var tickOuter   = radius;
        var tickInner   = radius - 12;   // major tick inner edge
        var minorInner  = radius - 6;    // minor tick inner edge
        var needleLen   = radius + 4;    // slightly past tick marks
        var hubRadius   = 5;

        // 2. Background track arc
        ctx.beginPath();
        ctx.arc(cx, cy, radius, START_ANGLE, END_ANGLE);
        ctx.strokeStyle = t.gaugeTrack;
        ctx.lineWidth   = 3;
        ctx.stroke();

        // 3. Tick marks + numeric labels
        this._drawTicks(ctx, cx, cy, radius, tickOuter, tickInner, minorInner,
                        tickCount, parsed.min, parsed.max, t);

        // 4. Red zone arc with glow
        this._drawRedZone(ctx, cx, cy, radius, parsed.min, parsed.max,
                          parsed.redZoneStart, accentColor, accentIntensity, t);

        // 5. Needle
        var needleAngle = valueToAngle(parsed.value, parsed.min, parsed.max);
        this._drawNeedle(ctx, cx, cy, needleLen, needleAngle, t);

        // 6. Center hub
        ctx.beginPath();
        ctx.arc(cx, cy, hubRadius, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        // 7. Text readout (value, unit, label)
        this._drawText(ctx, cx, cy, radius, parsed, t);
    },

    // -----------------------------------------------------------------------
    // _parseRow — extract numeric values from data
    // -----------------------------------------------------------------------
    _parseRow: function (data, fields) {
        var defaults = {
            value:        0,
            min:          0,
            max:          350,
            redZoneStart: 280,
            label:        '',
            unit:         ''
        };

        if (!data || !data.rows || data.rows.length === 0 ||
            !data.colIdx) {
            return defaults;
        }

        var colIdx = data.colIdx;
        var row    = data.rows[0];

        function readNum(field, fallback) {
            var idx = colIdx[field];
            if (idx === undefined || idx === -1) { return fallback; }
            var raw = parseFloat(row[idx]);
            return isNaN(raw) ? fallback : raw;
        }

        function readStr(field, fallback) {
            var idx = colIdx[field];
            if (idx === undefined || idx === -1) { return fallback; }
            var v = row[idx];
            return (v !== null && v !== undefined) ? String(v) : fallback;
        }

        return {
            value:        readNum(fields.valueField,   defaults.value),
            min:          readNum(fields.minField,     defaults.min),
            max:          readNum(fields.maxField,     defaults.max),
            redZoneStart: readNum(fields.redZoneField, defaults.redZoneStart),
            label:        readStr(fields.labelField,   defaults.label),
            unit:         readStr(fields.unitField,    defaults.unit)
        };
    },

    // -----------------------------------------------------------------------
    // _drawTicks — major + minor ticks with numeric labels
    // -----------------------------------------------------------------------
    _drawTicks: function (ctx, cx, cy, radius, tickOuter, tickInner, minorInner,
                          tickCount, min, max, t) {
        var i, j, angle, cos, sin, tickPositions, minorTicksPerMajor;
        var labelRadius = tickOuter + 16;   // numeric label distance from center

        tickPositions       = tickCount + 1;  // 9 positions for 8 divisions
        minorTicksPerMajor  = 4;

        for (i = 0; i < tickPositions; i++) {
            angle = START_ANGLE + (i / tickCount) * SWEEP;
            cos   = Math.cos(angle);
            sin   = Math.sin(angle);

            // Major tick
            ctx.beginPath();
            ctx.moveTo(cx + cos * tickInner,  cy + sin * tickInner);
            ctx.lineTo(cx + cos * tickOuter,  cy + sin * tickOuter);
            ctx.strokeStyle = t.silver;
            ctx.lineWidth   = 2;
            ctx.stroke();

            // Numeric label at this major tick
            var tickValue = min + (i / tickCount) * (max - min);
            var labelText = Math.round(tickValue).toString();
            ctx.font        = '10px ' + theme.FONT_DATA;
            ctx.fillStyle   = t.silver;
            ctx.textAlign   = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(labelText,
                cx + cos * labelRadius,
                cy + sin * labelRadius);

            // Minor ticks between this major and the next (skip after last)
            if (i < tickCount) {
                for (j = 1; j <= minorTicksPerMajor; j++) {
                    var minorFrac  = i / tickCount + (j / minorTicksPerMajor) / tickCount;
                    var minorAngle = START_ANGLE + minorFrac * SWEEP;
                    var mc = Math.cos(minorAngle);
                    var ms = Math.sin(minorAngle);
                    ctx.beginPath();
                    ctx.moveTo(cx + mc * minorInner, cy + ms * minorInner);
                    ctx.lineTo(cx + mc * tickOuter,  cy + ms * tickOuter);
                    ctx.strokeStyle = t.silver;
                    ctx.lineWidth   = 1;
                    ctx.stroke();
                }
            }
        }
    },

    // -----------------------------------------------------------------------
    // _drawRedZone — thickened arc from redZoneStart→max with glow
    // -----------------------------------------------------------------------
    _drawRedZone: function (ctx, cx, cy, radius, min, max,
                             redZoneStart, accentColor, accentIntensity, t) {
        if (redZoneStart >= max) { return; }
        var rzStart = valueToAngle(redZoneStart, min, max);
        var rzEnd   = valueToAngle(max, min, max);

        var glowBlur = 8 * (accentIntensity / 100);

        // Glow pass
        if (glowBlur > 0.5) {
            ctx.shadowColor  = accentColor;
            ctx.shadowBlur   = glowBlur;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        ctx.beginPath();
        ctx.arc(cx, cy, radius, rzStart, rzEnd);
        ctx.strokeStyle = accentColor;
        ctx.lineWidth   = 4;
        ctx.stroke();

        // Reset shadow (B6)
        ctx.shadowBlur   = 0;
        ctx.shadowColor  = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    },

    // -----------------------------------------------------------------------
    // _drawNeedle
    // -----------------------------------------------------------------------
    _drawNeedle: function (ctx, cx, cy, needleLen, angle, t) {
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + cos * needleLen, cy + sin * needleLen);
        ctx.strokeStyle = t.silver;
        ctx.lineWidth   = 2;
        ctx.lineCap     = 'round';
        ctx.stroke();
        ctx.lineCap = 'butt';
    },

    // -----------------------------------------------------------------------
    // _drawText — value, unit, label
    // -----------------------------------------------------------------------
    _drawText: function (ctx, cx, cy, radius, parsed, t) {
        var textY      = cy + radius * 0.28;  // below hub, within arc
        var unitY      = textY + 22;
        var labelY     = cy + radius * 0.72;  // near bottom

        // Current value — 28px FONT_DATA, white
        ctx.font        = '28px ' + theme.FONT_DATA;
        ctx.fillStyle   = t.text;
        ctx.textAlign   = 'center';
        ctx.textBaseline = 'middle';
        var displayVal = Math.round(parsed.value).toString();
        ctx.fillText(displayVal, cx, textY);

        // Unit — 10px FONT_DATA, warmGrey
        if (parsed.unit) {
            ctx.font      = '10px ' + theme.FONT_DATA;
            ctx.fillStyle = t.warmGrey;
            ctx.fillText(parsed.unit, cx, unitY);
        }

        // Label — 9px uppercase FONT_UI, warmGrey at 30% opacity
        if (parsed.label) {
            ctx.font      = '9px ' + theme.FONT_UI;
            ctx.fillStyle = theme.withAlpha(t.warmGrey, 0.30);
            ctx.fillText(parsed.label.toUpperCase(), cx, labelY);
        }
    },

    // -----------------------------------------------------------------------
    // _onMouseMove — tooltip on hover
    // -----------------------------------------------------------------------
    _onMouseMove: function (e) {
        if (!this._parsed) { return; }

        var rect   = this._canvas.getBoundingClientRect();
        var mx     = e.clientX - rect.left;
        var my     = e.clientY - rect.top;

        var parsed = this._parsed;
        var label  = parsed.label ? parsed.label : 'Value';
        var unit   = parsed.unit  ? ' ' + parsed.unit : '';
        var html   = '<span style="color:#8C8C8C;">' + label + '</span> ' +
                     '<strong>' + Math.round(parsed.value) + unit + '</strong>' +
                     ' <span style="color:#8C8C8C;font-size:9px;">' +
                     '[' + parsed.min + ' – ' + parsed.max + unit + ']</span>';

        this._tooltip.innerHTML = html;
        this._tooltip.style.display = 'block';

        // Position inside container, avoid overflow on right/bottom
        var tipW  = this._tooltip.offsetWidth;
        var tipH  = this._tooltip.offsetHeight;
        var contW = rect.width;
        var contH = rect.height;

        var tx = mx + 14;
        var ty = my - tipH - 8;
        if (tx + tipW > contW - 4) { tx = mx - tipW - 14; }
        if (ty < 4)                { ty = my + 14; }

        this._tooltip.style.left = tx + 'px';
        this._tooltip.style.top  = ty + 'px';
    }

});
