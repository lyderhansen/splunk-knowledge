// jwst_heat_grid — Hexagonal heat grid visualization
// JWST Mission Operations viz pack
// ES5 strict — no const/let/arrow/template literals/for..of/destructuring

'use strict';

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

// ─── hex geometry helpers ────────────────────────────────────────────────────

function hexPath(ctx, cx, cy, r) {
    // flat-top hexagon (JWST mirror orientation)
    var i;
    ctx.beginPath();
    for (i = 0; i < 6; i++) {
        var angleDeg = 60 * i;
        var angleRad = Math.PI / 180 * angleDeg;
        var px = cx + r * Math.cos(angleRad);
        var py = cy + r * Math.sin(angleRad);
        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.closePath();
}

// ─── pulse animation state ────────────────────────────────────────────────────

var _pulsePhase = 0;
var _pulseRaf   = null;
var _pulseCallbacks = [];

function startPulse(cb) {
    _pulseCallbacks.push(cb);
    if (_pulseRaf !== null) return;
    var tick = function() {
        _pulsePhase = (_pulsePhase + 0.04) % (2 * Math.PI);
        var i;
        for (i = 0; i < _pulseCallbacks.length; i++) {
            _pulseCallbacks[i](_pulsePhase);
        }
        _pulseRaf = requestAnimationFrame(tick);
    };
    _pulseRaf = requestAnimationFrame(tick);
}

function stopPulse(cb) {
    var idx = _pulseCallbacks.indexOf(cb);
    if (idx !== -1) _pulseCallbacks.splice(idx, 1);
    if (_pulseCallbacks.length === 0 && _pulseRaf !== null) {
        cancelAnimationFrame(_pulseRaf);
        _pulseRaf = null;
    }
}

// ─── main viz ─────────────────────────────────────────────────────────────────

var JwstHeatGrid = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this._cachedData   = null;
        this._cachedConfig = null;
        this._tooltip      = null;
        this._canvas       = null;
        this._ctx          = null;
        this._w            = 0;
        this._h            = 0;
        this._dpr          = 1;
        this._hoverCol     = -1;
        this._hoverRow     = -1;
        this._cells        = [];   // flat array of cell metadata for hit-testing
        this._pulseCb      = null;
        this._hasCritical  = false;

        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';
    },

    getInitialDataParams: function() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },

    formatData: function(data) {
        // Only reshape — NO config reads here
        if (!data || !data.rows || data.rows.length === 0) return null;

        var fields = data.fields || [];
        var fieldNames = [];
        var i;
        for (i = 0; i < fields.length; i++) {
            fieldNames.push(fields[i].name);
        }

        var rows = [];
        for (i = 0; i < data.rows.length; i++) {
            var raw = data.rows[i];
            var obj = {};
            var j;
            for (j = 0; j < fieldNames.length; j++) {
                obj[fieldNames[j]] = raw[j];
            }
            rows.push(obj);
        }

        return { rows: rows, fieldNames: fieldNames };
    },

    updateView: function(data, config) {
        this._cachedConfig = config;
        this._cachedData   = data;

        var ns  = theme.getNS(this);
        var go  = theme.getOption;

        var valueField    = go(config, ns, 'valueField',    'temperature');
        var categoryField = go(config, ns, 'categoryField', 'sensor');
        var timeField     = go(config, ns, 'timeField',     '_time');
        var themeMode     = go(config, ns, 'theme',         'dark');
        var cellShape     = go(config, ns, 'cellShape',     'hexagon');
        var showValues    = go(config, ns, 'showValues',    'true') !== 'false';
        var showTooltip   = go(config, ns, 'showTooltip',   'true') !== 'false';
        var accentRaw     = parseInt(go(config, ns, 'accentIntensity', '50'), 10);
        var gi            = Math.max(0, Math.min(1, accentRaw / 100));

        var rampLow      = go(config, ns, 'colorRampLow',      '#1B1464');
        var rampMid      = go(config, ns, 'colorRampMid',      '#00B4D8');
        var rampHigh     = go(config, ns, 'colorRampHigh',     '#D4A537');
        var rampCritical = go(config, ns, 'colorRampCritical', '#FF4D4D');
        var minRaw       = go(config, ns, 'minValue', 'auto');
        var maxRaw       = go(config, ns, 'maxValue', 'auto');

        var t = theme.getTheme(themeMode);

        // ── build grid data ──────────────────────────────────────────────────

        if (!data || !data.rows || data.rows.length === 0) {
            this._renderEmpty(t);
            return;
        }

        // Collect unique categories (rows) and time buckets (cols) in order
        var catOrder  = [];
        var catSeen   = {};
        var timeOrder = [];
        var timeSeen  = {};
        var k;

        for (k = 0; k < data.rows.length; k++) {
            var row = data.rows[k];
            var cat  = row[categoryField]  !== undefined ? String(row[categoryField])  : '—';
            var tBucket = row[timeField]   !== undefined ? String(row[timeField])      : '—';
            if (!catSeen[cat])    { catSeen[cat] = true;    catOrder.push(cat); }
            if (!timeSeen[tBucket]) { timeSeen[tBucket] = true; timeOrder.push(tBucket); }
        }

        // Map cat+time → value
        var cellMap = {};
        for (k = 0; k < data.rows.length; k++) {
            var r2   = data.rows[k];
            var cat2 = r2[categoryField] !== undefined ? String(r2[categoryField]) : '—';
            var tb2  = r2[timeField]     !== undefined ? String(r2[timeField])     : '—';
            var v    = parseFloat(r2[valueField]);
            cellMap[cat2 + '|||' + tb2] = isNaN(v) ? null : v;
        }

        // Determine min / max
        var autoMin = Infinity;
        var autoMax = -Infinity;
        for (k = 0; k < data.rows.length; k++) {
            var v2 = parseFloat(data.rows[k][valueField]);
            if (!isNaN(v2)) {
                if (v2 < autoMin) autoMin = v2;
                if (v2 > autoMax) autoMax = v2;
            }
        }
        if (autoMin === Infinity) { autoMin = 0; autoMax = 100; }
        if (autoMin === autoMax)  { autoMax = autoMin + 1; }

        var minVal = (minRaw === 'auto' || minRaw === '') ? autoMin : parseFloat(minRaw);
        var maxVal = (maxRaw === 'auto' || maxRaw === '') ? autoMax : parseFloat(maxRaw);
        if (isNaN(minVal)) minVal = autoMin;
        if (isNaN(maxVal)) maxVal = autoMax;

        // Critical threshold = top 10% of range
        var critThreshold = minVal + (maxVal - minVal) * 0.9;

        // Check if any critical cells exist
        var hasCritical = false;
        for (k = 0; k < data.rows.length; k++) {
            var vc = parseFloat(data.rows[k][valueField]);
            if (!isNaN(vc) && vc >= critThreshold) { hasCritical = true; break; }
        }

        this._hasCritical = hasCritical;

        // Build custom ramp
        var customRamp = [rampLow, rampMid, rampHigh, rampCritical];

        // ── setup canvas ─────────────────────────────────────────────────────

        var setup = theme.setupCanvas(this.el);
        this._canvas = setup.canvas;
        this._ctx    = setup.ctx;
        this._w      = setup.w;
        this._h      = setup.h;
        this._dpr    = setup.dpr;

        // ── setup tooltip ────────────────────────────────────────────────────

        if (!this._tooltip) {
            this._tooltip = theme.createTooltip(this.el);
        }

        // ── attach event listeners once ──────────────────────────────────────
        if (!this._canvas._heatGridBound) {
            this._canvas._heatGridBound = true;
            var self = this;

            this._canvas.addEventListener('mousemove', function(e) {
                self._onMouseMove(e, showTooltip);
            });
            this._canvas.addEventListener('mouseleave', function() {
                self._hoverRow = -1;
                self._hoverCol = -1;
                theme.hideTooltip(self._tooltip);
                self._redraw();
            });
        }

        // Store layout params for reuse
        this._layoutParams = {
            catOrder:      catOrder,
            timeOrder:     timeOrder,
            cellMap:       cellMap,
            minVal:        minVal,
            maxVal:        maxVal,
            critThreshold: critThreshold,
            customRamp:    customRamp,
            rampCritical:  rampCritical,
            cellShape:     cellShape,
            showValues:    showValues,
            gi:            gi,
            t:             t,
            valueField:    valueField,
            categoryField: categoryField,
            timeField:     timeField
        };

        // ── start pulse if critical cells exist ───────────────────────────────
        var self2 = this;
        if (hasCritical && !this._pulseCb) {
            this._pulseCb = function(phase) {
                self2._pulsePhase = phase;
                self2._redraw();
            };
            startPulse(this._pulseCb);
        } else if (!hasCritical && this._pulseCb) {
            stopPulse(this._pulseCb);
            this._pulseCb = null;
        }

        this._redraw();
    },

    _redraw: function() {
        if (!this._ctx || !this._layoutParams) return;
        var lp = this._layoutParams;
        this._renderGrid(
            this._ctx, this._w, this._h,
            lp.catOrder, lp.timeOrder, lp.cellMap,
            lp.minVal, lp.maxVal, lp.critThreshold,
            lp.customRamp, lp.rampCritical,
            lp.cellShape, lp.showValues,
            lp.gi, lp.t
        );
    },

    _renderEmpty: function(t) {
        var setup = theme.setupCanvas(this.el);
        var ctx = setup.ctx;
        var w   = setup.w;
        var h   = setup.h;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = t.dim;
        ctx.font = '14px ' + t.fonts.mono;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No data', w / 2, h / 2);
    },

    _renderGrid: function(ctx, w, h, catOrder, timeOrder, cellMap,
                          minVal, maxVal, critThreshold,
                          customRamp, rampCritical,
                          cellShape, showValues, gi, t) {

        ctx.clearRect(0, 0, w, h);

        var nRows = catOrder.length;
        var nCols = timeOrder.length;
        if (nRows === 0 || nCols === 0) return;

        // ── layout math ───────────────────────────────────────────────────────

        var LABEL_W    = Math.min(120, Math.max(70, w * 0.15));
        var HEADER_H   = 28;
        var PAD        = 10;
        var gridW      = w - LABEL_W - PAD;
        var gridH      = h - HEADER_H - PAD;

        // Hexagon flat-top: width = 2r, height = r * sqrt(3)
        // spacing for flat-top packed grid: col-pitch = 1.5 * r, row-pitch = r * sqrt(3)
        // We want all hexagons to fit: solve for r
        var rFromCols = gridW / (nCols * 1.5 + 0.5);  // hex flat-top col pitch = 1.5r
        var rFromRows = gridH / (nRows * Math.sqrt(3)); // hex flat-top row pitch = r*sqrt(3)
        var hexR      = Math.min(rFromCols, rFromRows, 40);
        hexR          = Math.max(hexR, 4);

        var colPitch  = hexR * 1.5;       // horizontal center-to-center
        var rowPitch  = hexR * Math.sqrt(3); // vertical center-to-center

        // Actual grid extents
        var actualW   = nCols * colPitch + hexR * 0.5;
        var actualH   = nRows * rowPitch;

        // Center grid in available space
        var offsetX   = LABEL_W + (gridW - actualW) / 2 + hexR;
        var offsetY   = HEADER_H + (gridH - actualH) / 2 + rowPitch / 2;

        // ── draw time labels (column headers) ────────────────────────────────
        ctx.fillStyle = t.dim;
        ctx.font = 'bold 9px ' + t.fonts.mono;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        var ci;
        for (ci = 0; ci < nCols; ci++) {
            var cx = offsetX + ci * colPitch;
            var label = timeOrder[ci];
            // Shorten timestamp labels — keep only last meaningful segment
            if (label.length > 10) {
                var tParts = label.split(/[T ]/);
                label = tParts[tParts.length - 1] || label.substring(label.length - 8);
            }
            var isHoverCol = (ci === this._hoverCol);
            ctx.fillStyle = isHoverCol ? t.gold : t.dim;
            ctx.fillText(label, cx, PAD / 2);
        }

        // ── draw sensor row labels ────────────────────────────────────────────
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.font = '10px ' + t.fonts.mono;

        var ri;
        for (ri = 0; ri < nRows; ri++) {
            var ry = offsetY + ri * rowPitch;
            var isHoverRow = (ri === this._hoverRow);
            ctx.fillStyle = isHoverRow ? t.gold : t.text;
            ctx.fillText(catOrder[ri], LABEL_W - 8, ry);
        }

        // ── draw crosshair column highlight ──────────────────────────────────
        if (this._hoverCol >= 0) {
            var hcx = offsetX + this._hoverCol * colPitch;
            ctx.fillStyle = 'rgba(212,165,55,0.06)';
            ctx.fillRect(hcx - hexR * 1.2, HEADER_H, hexR * 2.4, h - HEADER_H);
        }
        if (this._hoverRow >= 0) {
            var hry = offsetY + this._hoverRow * rowPitch;
            ctx.fillStyle = 'rgba(212,165,55,0.06)';
            ctx.fillRect(LABEL_W, hry - rowPitch * 0.5, w - LABEL_W, rowPitch);
        }

        // ── draw hexagon cells ────────────────────────────────────────────────

        this._cells = [];

        var pulseAlpha = this._pulsePhase !== undefined
            ? 0.4 + 0.4 * Math.sin(this._pulsePhase)
            : 0.8;

        for (ri = 0; ri < nRows; ri++) {
            for (ci = 0; ci < nCols; ci++) {
                var cx2 = offsetX + ci * colPitch;
                var cy2 = offsetY + ri * rowPitch;
                var key = catOrder[ri] + '|||' + timeOrder[ci];
                var val = cellMap[key];

                var fillColor;
                var isCritical = false;
                var isEmpty    = (val === null || val === undefined);

                if (isEmpty) {
                    fillColor = t.muted;
                } else {
                    // Clamp to ramp range — top 10% maps to critical color
                    var t_normalized = (val - minVal) / (maxVal - minVal);
                    t_normalized     = Math.max(0, Math.min(1, t_normalized));

                    if (val >= critThreshold) {
                        isCritical = true;
                        fillColor  = rampCritical;
                    } else {
                        // Use 3-stop ramp for sub-critical values
                        var subRamp = [customRamp[0], customRamp[1], customRamp[2]];
                        fillColor = theme.rampColor(val, minVal, critThreshold, subRamp);
                    }
                }

                var isHover = (ri === this._hoverRow || ci === this._hoverCol);

                // Store cell metadata for hit testing
                this._cells.push({
                    ri: ri, ci: ci,
                    cx: cx2, cy: cy2,
                    r: hexR,
                    val: val,
                    sensor: catOrder[ri],
                    timeBucket: timeOrder[ci]
                });

                // Draw cell
                if (cellShape === 'square') {
                    this._drawSquareCell(ctx, cx2, cy2, hexR, fillColor, isCritical, isEmpty,
                                         isHover, gi, t, pulseAlpha);
                } else {
                    this._drawHexCell(ctx, cx2, cy2, hexR, fillColor, isCritical, isEmpty,
                                      isHover, gi, t, pulseAlpha);
                }

                // Value label inside cell
                if (showValues && !isEmpty && hexR >= 14) {
                    var dispVal = theme.fmtNum(val, { decimals: 0 });
                    ctx.fillStyle = isCritical ? '#FFFFFF' : (hexR >= 20 ? t.text : t.dim);
                    ctx.font = 'bold ' + Math.round(hexR * 0.45) + 'px ' + t.fonts.mono;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(dispVal, cx2, cy2);
                }
            }
        }

        // ── legend strip along bottom ─────────────────────────────────────────
        this._drawLegend(ctx, w, h, minVal, maxVal, critThreshold,
                         customRamp, rampCritical, t);
    },

    _drawHexCell: function(ctx, cx, cy, r, fillColor, isCritical, isEmpty,
                            isHover, gi, t, pulseAlpha) {

        // Glow for critical cells
        if (isCritical && gi > 0) {
            var glowAlpha = pulseAlpha * gi;
            ctx.shadowBlur   = 18 * gi;
            ctx.shadowColor  = theme.rgba(fillColor, glowAlpha);
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        hexPath(ctx, cx, cy, r - 1);
        ctx.fillStyle = isEmpty ? fillColor : fillColor;
        ctx.fill();

        theme.resetShadow(ctx);

        // Hover ring
        if (isHover) {
            hexPath(ctx, cx, cy, r - 1);
            ctx.strokeStyle = theme.rgba(t.gold, 0.8);
            ctx.lineWidth   = 1.5;
            ctx.stroke();
        }

        // Honeycomb border: 2% white opacity
        hexPath(ctx, cx, cy, r - 1);
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth   = 1;
        ctx.stroke();
    },

    _drawSquareCell: function(ctx, cx, cy, r, fillColor, isCritical, isEmpty,
                               isHover, gi, t, pulseAlpha) {

        var side = r * 1.6;
        var x    = cx - side / 2;
        var y    = cy - side / 2;

        if (isCritical && gi > 0) {
            var glowA = pulseAlpha * gi;
            ctx.shadowBlur    = 14 * gi;
            ctx.shadowColor   = theme.rgba(fillColor, glowA);
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        ctx.fillStyle = fillColor;
        ctx.fillRect(x + 1, y + 1, side - 2, side - 2);
        theme.resetShadow(ctx);

        if (isHover) {
            ctx.strokeStyle = theme.rgba(t.gold, 0.8);
            ctx.lineWidth   = 1.5;
            ctx.strokeRect(x + 1, y + 1, side - 2, side - 2);
        }

        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth   = 1;
        ctx.strokeRect(x, y, side, side);
    },

    _drawLegend: function(ctx, w, h, minVal, maxVal, critThreshold,
                           customRamp, rampCritical, t) {

        var legendH  = 8;
        var legendW  = Math.min(260, w * 0.6);
        var legendX  = (w - legendW) / 2;
        var legendY  = h - legendH - 4;

        // Gradient bar across non-critical ramp
        var grad = ctx.createLinearGradient(legendX, 0, legendX + legendW * 0.85, 0);
        grad.addColorStop(0,    customRamp[0]);
        grad.addColorStop(0.45, customRamp[1]);
        grad.addColorStop(0.85, customRamp[2]);
        grad.addColorStop(1,    rampCritical);

        ctx.fillStyle = grad;
        ctx.beginPath();
        // small rounded rect
        var lx = legendX;
        var ly = legendY;
        var lw = legendW;
        var lh = legendH;
        var lr = 3;
        ctx.moveTo(lx + lr, ly);
        ctx.lineTo(lx + lw - lr, ly);
        ctx.arcTo(lx + lw, ly, lx + lw, ly + lr, lr);
        ctx.lineTo(lx + lw, ly + lh - lr);
        ctx.arcTo(lx + lw, ly + lh, lx + lw - lr, ly + lh, lr);
        ctx.lineTo(lx + lr, ly + lh);
        ctx.arcTo(lx, ly + lh, lx, ly + lh - lr, lr);
        ctx.lineTo(lx, ly + lr);
        ctx.arcTo(lx, ly, lx + lr, ly, lr);
        ctx.closePath();
        ctx.fill();

        // Min / max labels
        ctx.fillStyle  = t.dim;
        ctx.font       = '9px ' + t.fonts.mono;
        ctx.textAlign  = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(theme.fmtNum(minVal, { decimals: 0 }) + ' K', legendX, legendY - 2);
        ctx.textAlign  = 'right';
        ctx.fillText(theme.fmtNum(maxVal, { decimals: 0 }) + ' K', legendX + legendW, legendY - 2);
    },

    _onMouseMove: function(e, showTooltipEnabled) {
        var rect = this._canvas.getBoundingClientRect();
        var mx   = e.clientX - rect.left;
        var my   = e.clientY - rect.top;

        var hitRow = -1;
        var hitCol = -1;
        var hitCell = null;

        var i;
        for (i = 0; i < this._cells.length; i++) {
            var cell = this._cells[i];
            var dx   = mx - cell.cx;
            var dy   = my - cell.cy;
            // Point-in-hexagon: use inscribed circle test for speed
            if (Math.sqrt(dx * dx + dy * dy) < cell.r * 0.95) {
                hitRow  = cell.ri;
                hitCol  = cell.ci;
                hitCell = cell;
                break;
            }
        }

        var changed = (hitRow !== this._hoverRow || hitCol !== this._hoverCol);
        this._hoverRow = hitRow;
        this._hoverCol = hitCol;

        if (changed) {
            this._redraw();
        }

        if (showTooltipEnabled && hitCell && hitCell.val !== null && hitCell.val !== undefined) {
            var html =
                '<span style="color:#D4A537;font-weight:bold;">' + hitCell.sensor + '</span>' +
                '<br/><span style="color:#00B4D8;">' + hitCell.timeBucket + '</span>' +
                '<br/><span style="color:#E8ECF1;">' +
                theme.fmtNum(hitCell.val, { decimals: 2 }) + ' K</span>';
            theme.showTooltip(this._tooltip, e, this._canvas, html);
        } else {
            theme.hideTooltip(this._tooltip);
        }
    },

    reflow: function() {
        if (this._cachedData && this._cachedConfig) {
            this.updateView(this._cachedData, this._cachedConfig);
        }
    },

    destroy: function() {
        if (this._pulseCb) {
            stopPulse(this._pulseCb);
            this._pulseCb = null;
        }
        if (this._tooltip && this._tooltip.parentNode) {
            this._tooltip.parentNode.removeChild(this._tooltip);
            this._tooltip = null;
        }
        if (this._canvas) {
            this._canvas._heatGridBound = false;
        }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }

});

module.exports = JwstHeatGrid;
