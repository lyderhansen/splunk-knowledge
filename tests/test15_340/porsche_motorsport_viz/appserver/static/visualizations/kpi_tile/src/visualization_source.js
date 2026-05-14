// Porsche Motorsport Viz Pack — KPI Tile
// Timing tower cell: lap times, gaps, positions, and deltas
// ES5 only — no const/let/arrow/template literals/destructuring/for..of

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

var NS = 'porsche_motorsport_viz.kpi_tile';

var HOVER_TINT = 'rgba(255, 255, 255, 0.03)';
var HERO_BORDER_COLOR = '#D5001C';
var HERO_BORDER_H = 2;
var PAD_X = 16;
var PAD_TOP = 12;
var PAD_BOT = 12;

module.exports = SplunkVisualizationBase.extend({

    initialize: function () {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this._canvas = null;
        this._tip = null;
        this._colIdx = {};
        this._rowData = null;
        this._hovering = false;
        this._boundMouseMove = null;
        this._boundMouseLeave = null;
    },

    getInitialDataParams: function () {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 1
        };
    },

    formatData: function (data) {
        if (!data || !data.fields || !data.rows) {
            return null;
        }

        var idx = {};
        for (var i = 0; i < data.fields.length; i++) {
            idx[data.fields[i].name] = i;
        }
        this._colIdx = idx;

        return data;
    },

    updateView: function (data, config) {
        if (!data || !data.rows || data.rows.length === 0) {
            return;
        }

        var themeMode = theme.getOption(config, NS, 'theme', 'dark');
        var valueField = theme.getOption(config, NS, 'valueField', 'value');
        var labelField = theme.getOption(config, NS, 'labelField', 'label');
        var deltaField = theme.getOption(config, NS, 'deltaField', 'delta');
        var deltaDirectionField = theme.getOption(config, NS, 'deltaDirectionField', 'deltaDirection');
        var unitField = theme.getOption(config, NS, 'unitField', 'unit');
        var heroMode = theme.getOption(config, NS, 'heroMode', 'false') === 'true';
        var accentColor = theme.getOption(config, NS, 'accentColor', '#D5001C');
        var accentIntensity = theme.parseFloat2(
            theme.getOption(config, NS, 'accentIntensity', '50'), 50
        ) / 100;

        var row = data.rows[0];
        var idx = this._colIdx;

        function getField(fieldName) {
            if (idx[fieldName] !== undefined && row[idx[fieldName]] !== undefined) {
                return String(row[idx[fieldName]]);
            }
            return '';
        }

        this._rowData = {
            value:          getField(valueField),
            label:          getField(labelField),
            delta:          getField(deltaField),
            deltaDirection: getField(deltaDirectionField),
            unit:           getField(unitField),
            themeMode:      themeMode,
            heroMode:       heroMode,
            accentColor:    accentColor,
            accentIntensity: accentIntensity
        };

        this._ensureCanvas();
        this._render();
    },

    _ensureCanvas: function () {
        if (this._canvas) {
            return;
        }

        var el = this.el;
        el.style.position = 'relative';

        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'display:block;width:100%;height:100%;cursor:default';
        el.appendChild(this._canvas);

        this._tip = theme.createTooltip();

        var self = this;

        this._boundMouseMove = function (e) {
            self._onMouseMove(e);
        };
        this._boundMouseLeave = function () {
            self._hovering = false;
            theme.hideTooltip(self._tip);
            self._render();
        };

        this._canvas.addEventListener('mousemove', this._boundMouseMove);
        this._canvas.addEventListener('mouseleave', this._boundMouseLeave);
    },

    _onMouseMove: function (e) {
        var wasHovering = this._hovering;
        this._hovering = true;

        if (this._rowData) {
            var html = '';
            if (this._rowData.label) {
                html += '<span style="opacity:0.6">' + this._rowData.label + '</span> ';
            }
            html += '<strong>' + (this._rowData.value || '—') + '</strong>';
            if (this._rowData.unit) {
                html += ' ' + this._rowData.unit;
            }
            if (this._rowData.delta) {
                html += ' <span style="color:#8C8C8C">' + this._rowData.delta + '</span>';
            }
            theme.showTooltip(this._tip, html, e.clientX, e.clientY);
        }

        if (!wasHovering) {
            this._render();
        }
    },

    _render: function () {
        if (!this._canvas || !this._rowData) {
            return;
        }

        var setup = theme.setupCanvas(this._canvas);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;
        var d = this._rowData;
        var t = theme.getTheme(d.themeMode);

        // Clear — never fillRect with theme bg; panel chrome is drawn by Dashboard Studio
        ctx.clearRect(0, 0, w, h);

        // Hover tint
        if (this._hovering) {
            ctx.fillStyle = HOVER_TINT;
            ctx.fillRect(0, 0, w, h);
        }

        // Hero mode: 2px red top border
        if (d.heroMode) {
            ctx.fillStyle = HERO_BORDER_COLOR;
            ctx.fillRect(0, 0, w, HERO_BORDER_H);
        }

        var yOffset = d.heroMode ? HERO_BORDER_H : 0;
        var cursorY = PAD_TOP + yOffset;

        // Label — 9px uppercase FONT_UI warm grey at 30% opacity
        ctx.font = '9px ' + theme.FONT_UI;
        ctx.fillStyle = t.textWhisper;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        if (d.label) {
            ctx.fillText(d.label.toUpperCase(), PAD_X, cursorY);
        }
        cursorY += 14; // label height + gap

        // Main value — 36px normal, 56px hero
        var valueFontSize = d.heroMode ? 56 : 36;
        ctx.font = valueFontSize + 'px ' + theme.FONT_DATA;
        ctx.fillStyle = t.text;
        ctx.textBaseline = 'top';

        var displayValue = (d.value || '—');
        if (d.unit) {
            displayValue = displayValue + ' ' + d.unit;
        }
        ctx.fillText(displayValue, PAD_X, cursorY);
        cursorY += valueFontSize + 4;

        // Delta
        if (d.delta) {
            var deltaColor;
            var dir = d.deltaDirection ? d.deltaDirection.toLowerCase() : 'neutral';
            if (dir === 'down') {
                // down = faster = green
                deltaColor = t.deltaImproved;
            } else if (dir === 'up') {
                // up = slower = red
                deltaColor = '#D5001C';
            } else {
                deltaColor = t.deltaNeutral;
            }

            ctx.font = '11px ' + theme.FONT_DATA;
            ctx.fillStyle = deltaColor;
            ctx.textBaseline = 'top';
            ctx.fillText(d.delta, PAD_X, cursorY);
        }
    },

    reflow: function () {
        if (this._rowData) {
            this._render();
        }
    },

    destroy: function () {
        if (this._canvas) {
            if (this._boundMouseMove) {
                this._canvas.removeEventListener('mousemove', this._boundMouseMove);
            }
            if (this._boundMouseLeave) {
                this._canvas.removeEventListener('mouseleave', this._boundMouseLeave);
            }
            this._canvas = null;
        }
        if (this._tip && this._tip.parentNode) {
            this._tip.parentNode.removeChild(this._tip);
            this._tip = null;
        }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }

});
