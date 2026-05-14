// Porsche Motorsport Viz Pack — Energy Bar
// Stacked horizontal attack/defend/neutral energy bars — Formula E energy management display
// ES5 only — no const/let/arrow/template literals/destructuring/for..of

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

var NS = 'porsche_motorsport_viz.energy_bar';

var ATTACK_DEFAULT  = '#D5001C';
var DEFEND_DEFAULT  = '#0072C6';
var NEUTRAL_DEFAULT = '#8C8C8C';

var ROW_H  = 24;
var ROW_GAP = 4;
var LABEL_W = 100;
var LEGEND_H = 28;
var PAD_TOP = 8;
var PAD_LEFT = 12;
var PAD_RIGHT = 12;
var PAD_BOTTOM = 8;

// ─── Legend layout ───────────────────────────────────────────────────────────
var LEGEND_ITEMS = [
    { key: 'attack',  label: 'ATTACK'  },
    { key: 'defend',  label: 'DEFEND'  },
    { key: 'neutral', label: 'NEUTRAL' }
];

// ─── Visualization ────────────────────────────────────────────────────────────
module.exports = SplunkVisualizationBase.extend({

    initialize: function () {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.classList.add('energy-bar-viz');

        this._canvas  = document.createElement('canvas');
        this._canvas.style.cssText = 'display:block;width:100%;height:100%';
        this.el.appendChild(this._canvas);

        this._tooltip = theme.createTooltip();
        this._segments = [];
        this._rows     = [];
        this._hoveredIdx = -1;

        this._canvas.addEventListener('mousemove', this._onMouseMove.bind(this));
        this._canvas.addEventListener('mouseleave', this._onMouseLeave.bind(this));
    },

    // ── formatData ────────────────────────────────────────────────────────────
    formatData: function (data) {
        if (!data || !data.rows || !data.fields || data.rows.length === 0) {
            return null;
        }

        var config = this.getCurrentConfig();
        var labelField   = theme.getOption(config, NS, 'labelField',   'label');
        var attackField  = theme.getOption(config, NS, 'attackField',  'attack');
        var defendField  = theme.getOption(config, NS, 'defendField',  'defend');
        var neutralField = theme.getOption(config, NS, 'neutralField', 'neutral');

        // Build column index
        var colIdx = {};
        var i;
        for (i = 0; i < data.fields.length; i++) {
            colIdx[data.fields[i].name] = i;
        }

        var liCol = colIdx[labelField];
        var aCol  = colIdx[attackField];
        var dCol  = colIdx[defendField];
        var nCol  = colIdx[neutralField];

        var rows = [];
        var r;
        for (i = 0; i < data.rows.length; i++) {
            r = data.rows[i];
            rows.push({
                label:   liCol !== undefined ? String(r[liCol]) : '',
                attack:  aCol  !== undefined ? theme.parseFloat2(r[aCol],  0) : 0,
                defend:  dCol  !== undefined ? theme.parseFloat2(r[dCol],  0) : 0,
                neutral: nCol  !== undefined ? theme.parseFloat2(r[nCol],  0) : 0
            });
        }

        return rows;
    },

    // ── updateView ────────────────────────────────────────────────────────────
    updateView: function (data) {
        if (!data) {
            return;
        }
        this._rows = data;
        this._render();
    },

    // ── reflow ────────────────────────────────────────────────────────────────
    reflow: function () {
        this._render();
    },

    // ── _render ───────────────────────────────────────────────────────────────
    _render: function () {
        var canvas = this._canvas;
        if (!canvas) return;

        var surface = theme.setupCanvas(canvas);
        var ctx = surface.ctx;
        var W   = surface.w;
        var H   = surface.h;

        // Clear — NEVER fillRect with theme color
        ctx.clearRect(0, 0, W, H);

        var config  = this.getCurrentConfig();
        var mode    = theme.getOption(config, NS, 'theme', 'dark');
        var t       = theme.getTheme(mode);
        var accent  = theme.parseFloat2(theme.getOption(config, NS, 'accentIntensity', 50), 50) / 100;

        var attackColor  = theme.getOption(config, NS, 'attackColor',  ATTACK_DEFAULT);
        var defendColor  = theme.getOption(config, NS, 'defendColor',  DEFEND_DEFAULT);
        var neutralColor = theme.getOption(config, NS, 'neutralColor', NEUTRAL_DEFAULT);

        var colorMap = {
            attack:  attackColor,
            defend:  defendColor,
            neutral: neutralColor
        };

        // accentIntensity: interpolate segment color toward white for light, toward original for dark
        // Simple implementation: blend each segment color with white/black by accent factor
        // accent=1.0 → full vivid, accent=0.0 → 50% muted
        var MODES = ['attack', 'defend', 'neutral'];

        // ── Legend ────────────────────────────────────────────────────────────
        var legendX = PAD_LEFT + LABEL_W + 8;
        var legendY = PAD_TOP;
        var swatchSz = 8;
        ctx.font = '9px ' + theme.FONT_DATA;
        ctx.textBaseline = 'middle';

        var lx = legendX;
        var li;
        for (li = 0; li < LEGEND_ITEMS.length; li++) {
            var litem = LEGEND_ITEMS[li];
            var lcolor = colorMap[litem.key];
            // Apply accent intensity — blend toward muted (50% grey) at low intensity
            var displayColor = _blendToGrey(lcolor, accent);
            ctx.fillStyle = displayColor;
            ctx.fillRect(lx, legendY + (LEGEND_H - swatchSz) / 2, swatchSz, swatchSz);

            ctx.fillStyle = t.warmGrey;
            ctx.fillText(litem.label, lx + swatchSz + 4, legendY + LEGEND_H / 2);
            lx += swatchSz + 4 + ctx.measureText(litem.label).width + 16;
        }

        // ── Rows ──────────────────────────────────────────────────────────────
        var segments = [];
        var barAreaW = W - PAD_LEFT - LABEL_W - PAD_RIGHT;
        var baseY    = PAD_TOP + LEGEND_H;
        var textColor = mode === 'light' ? '#000000' : '#FFFFFF';

        var ri;
        for (ri = 0; ri < this._rows.length; ri++) {
            var row = this._rows[ri];
            var rowY = baseY + ri * (ROW_H + ROW_GAP);

            // Label
            ctx.font = '11px ' + theme.FONT_DATA;
            ctx.textBaseline = 'middle';
            ctx.fillStyle = t.text;
            ctx.fillText(row.label, PAD_LEFT, rowY + ROW_H / 2);

            // Compute total and proportions
            var total = row.attack + row.defend + row.neutral;
            if (total <= 0) total = 1;

            var barX = PAD_LEFT + LABEL_W;
            var mi;
            for (mi = 0; mi < MODES.length; mi++) {
                var modeKey  = MODES[mi];
                var modeVal  = row[modeKey];
                var segW     = Math.round((modeVal / total) * barAreaW);
                if (segW < 1) {
                    barX += segW;
                    continue;
                }

                var segColor = _blendToGrey(colorMap[modeKey], accent);

                // Hover highlight
                var isHovered = (this._hoveredIdx === segments.length);

                ctx.fillStyle = segColor;
                ctx.fillRect(barX, rowY, segW, ROW_H);

                if (isHovered) {
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth   = 1;
                    ctx.strokeRect(barX + 0.5, rowY + 0.5, segW - 1, ROW_H - 1);
                }

                // Percentage label inside segment (9px, only if segment wide enough)
                var pct = Math.round((modeVal / total) * 100);
                var pctLabel = pct + '%';
                ctx.font = '9px ' + theme.FONT_DATA;
                ctx.textBaseline = 'middle';
                var pctW = ctx.measureText(pctLabel).width;
                if (segW > 40) {
                    ctx.fillStyle = textColor;
                    ctx.fillText(pctLabel, barX + (segW - pctW) / 2, rowY + ROW_H / 2);
                }

                // Store segment rect for hit-testing
                segments.push({
                    x: barX, y: rowY, w: segW, h: ROW_H,
                    label:   row.label,
                    mode:    modeKey,
                    value:   modeVal,
                    pct:     pct
                });

                barX += segW;
            }
        }

        this._segments = segments;
    },

    // ── _onMouseMove ──────────────────────────────────────────────────────────
    _onMouseMove: function (e) {
        var rect = this._canvas.getBoundingClientRect();
        var mx   = e.clientX - rect.left;
        var my   = e.clientY - rect.top;

        var hit   = -1;
        var i;
        for (i = 0; i < this._segments.length; i++) {
            var seg = this._segments[i];
            if (mx >= seg.x && mx <= seg.x + seg.w &&
                my >= seg.y && my <= seg.y + seg.h) {
                hit = i;
                break;
            }
        }

        if (hit !== this._hoveredIdx) {
            this._hoveredIdx = hit;
            this._render();
        }

        if (hit >= 0) {
            var s = this._segments[hit];
            var modeLabel = s.mode.charAt(0).toUpperCase() + s.mode.slice(1);
            // Approximate kWh: assume 400 kWh total = 100%
            var kwh = Math.round(s.value * 4);
            var html = modeLabel + ': ' + s.pct + '% (' + kwh + ' kWh)';
            theme.showTooltip(this._tooltip, html, e.clientX, e.clientY);
        } else {
            theme.hideTooltip(this._tooltip);
        }
    },

    // ── _onMouseLeave ─────────────────────────────────────────────────────────
    _onMouseLeave: function () {
        this._hoveredIdx = -1;
        theme.hideTooltip(this._tooltip);
        this._render();
    },

    // ── getInitialDataParams ──────────────────────────────────────────────────
    getInitialDataParams: function () {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },

    // ── onConfigChange ────────────────────────────────────────────────────────
    onConfigChange: function () {
        this._render();
    }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

// Blend a hex color toward mid-grey (#808080) based on intensity (0=fully grey, 1=original)
function _blendToGrey(hex, intensity) {
    if (!hex || hex.charAt(0) !== '#' || hex.length < 7) return hex;
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    var gr = 128;
    var rr = Math.round(gr + (r - gr) * intensity);
    var rg = Math.round(gr + (g - gr) * intensity);
    var rb = Math.round(gr + (b - gr) * intensity);
    return 'rgb(' + rr + ',' + rg + ',' + rb + ')';
}
