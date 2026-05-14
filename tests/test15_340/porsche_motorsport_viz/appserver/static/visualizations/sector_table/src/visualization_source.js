// Porsche Motorsport Viz Pack — Sector Table
// F1/WEC timing screen with S1/S2/S3 sector deltas
// ES5 only — no const/let/arrow/template literals

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

var NS = 'porsche_motorsport_viz.sector_table';

// Column layout
var COL_POS    = { key: 'pos',    label: 'POS',   width: 40,  align: 'center' };
var COL_DRIVER = { key: 'driver', label: 'DRIVER', width: 140, align: 'left'   };
var COL_S1     = { key: 's1',     label: 'S1',     width: 100, align: 'right'  };
var COL_S2     = { key: 's2',     label: 'S2',     width: 100, align: 'right'  };
var COL_S3     = { key: 's3',     label: 'S3',     width: 100, align: 'right'  };
var COL_TOTAL  = { key: 'total',  label: 'TOTAL',  width: 110, align: 'right'  };

var COLUMNS = [COL_POS, COL_DRIVER, COL_S1, COL_S2, COL_S3, COL_TOTAL];

var ROW_H    = 32;
var HEADER_H = 28;
var PAD_LEFT = 8;

// Delta thresholds
var DELTA_BEST_THRESH     = -0.3;  // < -0.3 → personal best (purple)
var DELTA_IMPROVED_THRESH = 0;     // < 0    → improved (green)
// > 0 → slower (yellow)

function getDeltaCategory(delta) {
    if (delta === null || delta === undefined || isNaN(delta)) return 'none';
    if (delta < DELTA_BEST_THRESH)     return 'best';
    if (delta < DELTA_IMPROVED_THRESH) return 'improved';
    if (delta > 0)                     return 'slower';
    return 'none';
}

function getTintColor(category, t, accentFactor) {
    // accentFactor: 0.0–1.0 from accentIntensity (0–100)
    var baseOpacity = 0.12 * accentFactor;
    if (category === 'best')     return 'rgba(168, 85, 247, ' + baseOpacity.toFixed(3) + ')'; // #A855F7
    if (category === 'improved') return 'rgba(34, 197, 94, '  + baseOpacity.toFixed(3) + ')'; // #22C55E
    if (category === 'slower')   return 'rgba(255, 201, 7, '  + baseOpacity.toFixed(3) + ')'; // #FFC907
    return null;
}

function getDeltaTextColor(category, t) {
    if (category === 'best')     return t.deltaBest;
    if (category === 'improved') return t.deltaImproved;
    if (category === 'slower')   return t.deltaSlower;
    return t.textDim;
}

function formatDelta(v) {
    var n = parseFloat(v);
    if (isNaN(n)) return '';
    if (n === 0) return '';
    return (n > 0 ? '+' : '') + n.toFixed(3);
}

function drawTextAligned(ctx, text, x, y, w, align, padLeft) {
    if (align === 'right') {
        ctx.textAlign = 'right';
        ctx.fillText(text, x + w - padLeft, y);
    } else if (align === 'center') {
        ctx.textAlign = 'center';
        ctx.fillText(text, x + w / 2, y);
    } else {
        ctx.textAlign = 'left';
        ctx.fillText(text, x + padLeft, y);
    }
}

module.exports = SplunkVisualizationBase.extend({

    initialize: function () {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this._rows     = [];
        this._rowRects = [];
        this._hoverIdx = -1;
        this._tooltip  = null;
        this._canvas   = null;
        this._onMouseMoveBound  = null;
        this._onMouseLeaveBound = null;
    },

    getInitialDataParams: function () {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count:      10000
        };
    },

    // ------------------------------------------------------------------
    // formatData — build column index, extract and sort rows
    // ------------------------------------------------------------------
    formatData: function (data) {
        if (!data || !data.rows || data.rows.length === 0) return [];
        if (!data.fields || data.fields.length === 0) return [];

        var config = this.getCurrentConfig();

        // Resolve field names from formatter settings (or defaults)
        var driverField      = theme.getOption(config, NS, 'driverField',     'driver');
        var s1Field          = theme.getOption(config, NS, 's1Field',          's1');
        var s2Field          = theme.getOption(config, NS, 's2Field',          's2');
        var s3Field          = theme.getOption(config, NS, 's3Field',          's3');
        var totalField       = theme.getOption(config, NS, 'totalField',       'total');
        var s1DeltaField     = theme.getOption(config, NS, 's1DeltaField',     's1_delta');
        var s2DeltaField     = theme.getOption(config, NS, 's2DeltaField',     's2_delta');
        var s3DeltaField     = theme.getOption(config, NS, 's3DeltaField',     's3_delta');
        var totalDeltaField  = theme.getOption(config, NS, 'totalDeltaField',  'total_delta');
        var positionField    = theme.getOption(config, NS, 'positionField',    'position');

        // Build a field-name → column-index map
        var fieldMap = {};
        var i;
        for (i = 0; i < data.fields.length; i++) {
            fieldMap[data.fields[i].name] = i;
        }

        function getVal(row, name) {
            var idx = fieldMap[name];
            if (idx === undefined) return null;
            var v = row[idx];
            return (v === null || v === undefined) ? null : v;
        }

        var rows = [];
        for (i = 0; i < data.rows.length; i++) {
            var row = data.rows[i];
            var driverVal = getVal(row, driverField);
            if (!driverVal) continue;

            var posRaw = getVal(row, positionField);
            var posNum = posRaw !== null ? parseFloat(posRaw) : null;

            rows.push({
                driver:     String(driverVal),
                s1:         getVal(row, s1Field)         || '',
                s2:         getVal(row, s2Field)         || '',
                s3:         getVal(row, s3Field)         || '',
                total:      getVal(row, totalField)      || '',
                s1Delta:    parseFloat(getVal(row, s1DeltaField)),
                s2Delta:    parseFloat(getVal(row, s2DeltaField)),
                s3Delta:    parseFloat(getVal(row, s3DeltaField)),
                totalDelta: parseFloat(getVal(row, totalDeltaField)),
                position:   posNum
            });
        }

        // Sort by position if present, else keep original order
        rows.sort(function (a, b) {
            if (a.position === null && b.position === null) return 0;
            if (a.position === null) return 1;
            if (b.position === null) return -1;
            return a.position - b.position;
        });

        return rows;
    },

    // ------------------------------------------------------------------
    // updateView — create canvas + attach event listeners
    // ------------------------------------------------------------------
    updateView: function (data, config) {
        this._rows = data || [];

        var el = this.el;
        el.style.position = 'relative';
        el.style.overflow  = 'hidden';

        // Create canvas once
        if (!this._canvas) {
            this._canvas = document.createElement('canvas');
            this._canvas.style.cssText = 'display:block;width:100%;height:100%;cursor:default;';
            el.appendChild(this._canvas);
        }

        // Create tooltip once
        if (!this._tooltip) {
            this._tooltip = theme.createTooltip();
        }

        // Bind event listeners once
        var self = this;
        if (!this._onMouseMoveBound) {
            this._onMouseMoveBound = function (e) { self._onMouseMove(e); };
            this._onMouseLeaveBound = function ()  { self._onMouseLeave(); };
            this._canvas.addEventListener('mousemove',  this._onMouseMoveBound);
            this._canvas.addEventListener('mouseleave', this._onMouseLeaveBound);
        }

        this._render(config);
    },

    // ------------------------------------------------------------------
    // _render — full canvas repaint
    // ------------------------------------------------------------------
    _render: function (config) {
        var canvas = this._canvas;
        if (!canvas) return;

        var setup = theme.setupCanvas(canvas);
        var ctx   = setup.ctx;
        var W     = setup.w;
        var H     = setup.h;

        // Settings
        var themeMode     = theme.getOption(config, NS, 'theme', 'dark');
        var accentRaw     = theme.parseFloat2(theme.getOption(config, NS, 'accentIntensity', 50), 50);
        var accentFactor  = Math.max(0, Math.min(100, accentRaw)) / 100;

        var bestColor     = theme.getOption(config, NS, 'bestColor',     '#A855F7');
        var improvedColor = theme.getOption(config, NS, 'improvedColor', '#22C55E');
        var slowerColor   = theme.getOption(config, NS, 'slowerColor',   '#FFC907');

        var t = theme.getTheme(themeMode);

        // Clear
        ctx.clearRect(0, 0, W, H);

        // Compute table layout
        var tableW = 0;
        var i;
        for (i = 0; i < COLUMNS.length; i++) {
            tableW += COLUMNS[i].width;
        }

        // Build column x positions
        var colX = [];
        var cx = 0;
        for (i = 0; i < COLUMNS.length; i++) {
            colX.push(cx);
            cx += COLUMNS[i].width;
        }

        // ------ Header ------
        ctx.fillStyle = t.headerBg;
        ctx.fillRect(0, 0, W, HEADER_H);

        ctx.font        = '700 9px ' + theme.FONT_UI;
        ctx.fillStyle   = t.textWhisper;
        ctx.textBaseline = 'middle';

        for (i = 0; i < COLUMNS.length; i++) {
            var col = COLUMNS[i];
            drawTextAligned(ctx, col.label, colX[i], HEADER_H / 2, col.width, col.align, PAD_LEFT);
        }

        // ------ Rows ------
        this._rowRects = [];

        var rows = this._rows;
        var totalRows = rows.length;

        for (var ri = 0; ri < totalRows; ri++) {
            var row  = rows[ri];
            var rowY = HEADER_H + ri * ROW_H;

            // Store rect for hit-testing
            this._rowRects.push({ x: 0, y: rowY, w: W, h: ROW_H, rowIdx: ri });

            // Alternating row background (odd rows)
            if (ri % 2 === 1) {
                ctx.fillStyle = 'rgba(255,255,255,0.02)';
                ctx.fillRect(0, rowY, W, ROW_H);
            }

            // Hover highlight
            if (ri === this._hoverIdx) {
                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                ctx.fillRect(0, rowY, W, ROW_H);
            }

            // Draw cells
            var cellCy = rowY + ROW_H / 2;

            // POS cell
            ctx.font      = '11px ' + theme.FONT_DATA;
            ctx.fillStyle = t.textDim;
            ctx.textBaseline = 'middle';
            var posLabel = (row.position !== null && !isNaN(row.position)) ? String(row.position) : '-';
            drawTextAligned(ctx, posLabel, colX[0], cellCy, COL_POS.width, 'center', PAD_LEFT);

            // DRIVER cell
            ctx.font      = '700 13px ' + theme.FONT_UI;
            ctx.fillStyle = t.text;
            drawTextAligned(ctx, row.driver, colX[1], cellCy, COL_DRIVER.width, 'left', PAD_LEFT);

            // S1 cell
            var s1Cat  = getDeltaCategory(row.s1Delta);
            var s1Tint = _resolveTintColor(s1Cat, accentFactor, bestColor, improvedColor, slowerColor);
            if (s1Tint) {
                ctx.fillStyle = s1Tint;
                ctx.fillRect(colX[2], rowY, COL_S1.width, ROW_H);
            }
            ctx.font         = '13px ' + theme.FONT_DATA;
            ctx.fillStyle    = getDeltaTextColor(s1Cat, t);
            ctx.textBaseline = 'middle';
            drawTextAligned(ctx, row.s1, colX[2], cellCy, COL_S1.width, 'right', PAD_LEFT);

            // S2 cell
            var s2Cat  = getDeltaCategory(row.s2Delta);
            var s2Tint = _resolveTintColor(s2Cat, accentFactor, bestColor, improvedColor, slowerColor);
            if (s2Tint) {
                ctx.fillStyle = s2Tint;
                ctx.fillRect(colX[3], rowY, COL_S2.width, ROW_H);
            }
            ctx.fillStyle = getDeltaTextColor(s2Cat, t);
            drawTextAligned(ctx, row.s2, colX[3], cellCy, COL_S2.width, 'right', PAD_LEFT);

            // S3 cell
            var s3Cat  = getDeltaCategory(row.s3Delta);
            var s3Tint = _resolveTintColor(s3Cat, accentFactor, bestColor, improvedColor, slowerColor);
            if (s3Tint) {
                ctx.fillStyle = s3Tint;
                ctx.fillRect(colX[4], rowY, COL_S3.width, ROW_H);
            }
            ctx.fillStyle = getDeltaTextColor(s3Cat, t);
            drawTextAligned(ctx, row.s3, colX[4], cellCy, COL_S3.width, 'right', PAD_LEFT);

            // TOTAL cell
            var totCat  = getDeltaCategory(row.totalDelta);
            var totTint = _resolveTintColor(totCat, accentFactor, bestColor, improvedColor, slowerColor);
            if (totTint) {
                ctx.fillStyle = totTint;
                ctx.fillRect(colX[5], rowY, COL_TOTAL.width, ROW_H);
            }
            ctx.font      = '700 13px ' + theme.FONT_DATA;
            ctx.fillStyle = getDeltaTextColor(totCat, t);
            drawTextAligned(ctx, row.total, colX[5], cellCy, COL_TOTAL.width, 'right', PAD_LEFT);

            // Horizontal separator
            ctx.strokeStyle = t.gridLine;
            ctx.lineWidth   = 1;
            ctx.beginPath();
            ctx.moveTo(0,          rowY + ROW_H);
            ctx.lineTo(tableW,     rowY + ROW_H);
            ctx.stroke();
        }

        // Vertical separators
        ctx.strokeStyle = t.gridLine;
        ctx.lineWidth   = 1;
        for (i = 1; i < COLUMNS.length; i++) {
            ctx.beginPath();
            ctx.moveTo(colX[i], 0);
            ctx.lineTo(colX[i], HEADER_H + totalRows * ROW_H);
            ctx.stroke();
        }

        // Header bottom separator (slightly brighter)
        ctx.strokeStyle = 'rgba(255,255,255,0.10)';
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(0,      HEADER_H);
        ctx.lineTo(tableW, HEADER_H);
        ctx.stroke();
    },

    // ------------------------------------------------------------------
    // _onMouseMove — hit-test rows, show tooltip
    // ------------------------------------------------------------------
    _onMouseMove: function (e) {
        var canvas = this._canvas;
        if (!canvas) return;

        var rect   = canvas.getBoundingClientRect();
        var mx     = e.clientX - rect.left;
        var my     = e.clientY - rect.top;

        var newHover = -1;
        var i;
        for (i = 0; i < this._rowRects.length; i++) {
            var r = this._rowRects[i];
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                newHover = r.rowIdx;
                break;
            }
        }

        if (newHover !== this._hoverIdx) {
            this._hoverIdx = newHover;
            this._render(this.getCurrentConfig());
        }

        if (newHover >= 0) {
            var row = this._rows[newHover];
            var html = _buildTooltipHtml(row);
            theme.showTooltip(this._tooltip, html, e.clientX, e.clientY);
        } else {
            theme.hideTooltip(this._tooltip);
        }
    },

    _onMouseLeave: function () {
        this._hoverIdx = -1;
        theme.hideTooltip(this._tooltip);
        this._render(this.getCurrentConfig());
    },

    // ------------------------------------------------------------------
    // reflow on container resize
    // ------------------------------------------------------------------
    onContainerResized: function () {
        if (this._canvas) {
            this._render(this.getCurrentConfig());
        }
    }
});

// ------------------------------------------------------------------
// Module-level helpers (plain functions, not methods)
// ------------------------------------------------------------------

function _resolveTintColor(category, accentFactor, bestColor, improvedColor, slowerColor) {
    if (category === 'none') return null;
    var opacity = (0.12 * accentFactor).toFixed(3);

    function hexToRgba(hex, a) {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        var r = parseInt(hex.slice(0, 2), 16);
        var g = parseInt(hex.slice(2, 4), 16);
        var b = parseInt(hex.slice(4, 6), 16);
        return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    }

    if (category === 'best')     return hexToRgba(bestColor,     opacity);
    if (category === 'improved') return hexToRgba(improvedColor, opacity);
    if (category === 'slower')   return hexToRgba(slowerColor,   opacity);
    return null;
}

function _buildTooltipHtml(row) {
    var pos = (row.position !== null && !isNaN(row.position)) ? String(row.position) : '-';

    function deltaLine(label, delta) {
        if (isNaN(delta) || delta === null) return '';
        var cat = getDeltaCategory(delta);
        var color = '#8C8C8C';
        if (cat === 'best')     color = '#A855F7';
        if (cat === 'improved') color = '#22C55E';
        if (cat === 'slower')   color = '#FFC907';
        var sign = delta > 0 ? '+' : '';
        return '<br><span style="color:' + color + '">' + label + ': ' + sign + delta.toFixed(3) + 's</span>';
    }

    return '<strong>' + row.driver + '</strong> &nbsp; P' + pos +
        '<br>S1: ' + (row.s1 || '-') + deltaLine('ΔS1', row.s1Delta) +
        '<br>S2: ' + (row.s2 || '-') + deltaLine('ΔS2', row.s2Delta) +
        '<br>S3: ' + (row.s3 || '-') + deltaLine('ΔS3', row.s3Delta) +
        '<br>Total: <strong>' + (row.total || '-') + '</strong>' + deltaLine('ΔLap', row.totalDelta);
}
