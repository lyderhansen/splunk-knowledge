define(["api/SplunkVisualizationBase"], function(SplunkVisualizationBase) {

// --- shared/theme (inlined) ---
var theme = (function() {
// JWST Mission Operations — shared design tokens
// Required by all viz source files: var theme = require('shared/theme');

var PALETTES = {
    dark: {
        bg:      '#06080F',
        card:    '#0D1117',
        text:    '#E8ECF1',
        dim:     'rgba(232,236,241,0.45)',
        muted:   'rgba(232,236,241,0.08)',
        gold:    '#D4A537',
        cyan:    '#00B4D8',
        magenta: '#E040A0',
        green:   '#34D399',
        red:     '#FF4D4D',
        indigo:  '#1B1464'
    },
    light: {
        bg:      '#F0F2F5',
        card:    '#FFFFFF',
        text:    '#0D1117',
        dim:     'rgba(13,17,23,0.55)',
        muted:   'rgba(13,17,23,0.06)',
        gold:    '#B8860B',
        cyan:    '#0077B6',
        magenta: '#C0307A',
        green:   '#059669',
        red:     '#DC2626',
        indigo:  '#1B1464'
    }
};

var RAMP = ['#1B1464', '#00B4D8', '#E040A0', '#D4A537', '#FF4D4D'];

var FONTS = {
    display: 'Oxanium, sans-serif',
    mono:    '"JetBrains Mono", monospace'
};

function getTheme(mode) {
    var p = PALETTES[mode] || PALETTES.dark;
    return {
        bg:      p.bg,
        card:    p.card,
        text:    p.text,
        dim:     p.dim,
        muted:   p.muted,
        gold:    p.gold,
        cyan:    p.cyan,
        magenta: p.magenta,
        green:   p.green,
        red:     p.red,
        indigo:  p.indigo,
        ramp:    RAMP,
        fonts:   FONTS
    };
}

function hexToRgb(hex) {
    hex = hex.replace('#', '');
    return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16)
    };
}

function lerpColor(a, b, t) {
    var c1 = hexToRgb(a);
    var c2 = hexToRgb(b);
    var r = Math.round(c1.r + (c2.r - c1.r) * t);
    var g = Math.round(c1.g + (c2.g - c1.g) * t);
    var bl = Math.round(c1.b + (c2.b - c1.b) * t);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
}

function rampColor(value, min, max, ramp) {
    ramp = ramp || RAMP;
    if (max === min) return ramp[0];
    var t = Math.max(0, Math.min(1, (value - min) / (max - min)));
    var segCount = ramp.length - 1;
    var seg = Math.min(Math.floor(t * segCount), segCount - 1);
    var segT = (t * segCount) - seg;
    return lerpColor(ramp[seg], ramp[seg + 1], segT);
}

function rgba(hex, alpha) {
    var c = hexToRgb(hex);
    return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + alpha + ')';
}

function fmtNum(val, opts) {
    opts = opts || {};
    var decimals = opts.decimals !== undefined ? opts.decimals : -1;
    var compact = opts.compact !== undefined ? opts.compact : false;

    if (val === null || val === undefined || isNaN(val)) return '—';

    if (compact && Math.abs(val) >= 1e9) {
        return (val / 1e9).toFixed(1) + 'B';
    }
    if (compact && Math.abs(val) >= 1e6) {
        return (val / 1e6).toFixed(1) + 'M';
    }
    if (compact && Math.abs(val) >= 1e3) {
        return (val / 1e3).toFixed(1) + 'K';
    }
    if (decimals >= 0) {
        return val.toFixed(decimals);
    }
    if (Math.abs(val) < 10) return val.toFixed(2);
    if (Math.abs(val) < 100) return val.toFixed(1);
    return Math.round(val).toString();
}

function getNS(viz) {
    try {
        var info = viz.getPropertyNamespaceInfo();
        if (info && info.propertyNamespace) return info.propertyNamespace;
    } catch (e) {}
    return '';
}

function getOption(config, ns, key, defaultValue) {
    var v = config[ns + key];
    if (v !== undefined && v !== null) return v;
    v = config[key];
    if (v !== undefined && v !== null) return v;
    return defaultValue;
}

function setupCanvas(el) {
    var canvas = el.querySelector('canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        el.appendChild(canvas);
    }
    var rect = el.getBoundingClientRect();
    var w = Math.floor(rect.width) || 300;
    var h = Math.floor(rect.height) || 200;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { canvas: canvas, ctx: ctx, w: w, h: h, dpr: dpr };
}

function createTooltip(el) {
    var tip = document.createElement('div');
    tip.style.cssText =
        'position:absolute;display:none;padding:6px 10px;' +
        'background:rgba(6,8,15,0.92);color:#E8ECF1;font-size:11px;' +
        'border-radius:3px;pointer-events:none;white-space:nowrap;' +
        'z-index:100;font-family:"JetBrains Mono",monospace;' +
        'border:1px solid rgba(212,165,55,0.25);';
    el.style.position = 'relative';
    el.appendChild(tip);
    return tip;
}

function showTooltip(tip, e, canvas, html) {
    var rect = canvas.getBoundingClientRect();
    tip.innerHTML = html;
    tip.style.display = 'block';
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    var tipW = tip.offsetWidth || 120;
    var tipH = tip.offsetHeight || 30;
    var x = mx + 14;
    var y = my - 10;
    if (x + tipW > rect.width) x = mx - tipW - 14;
    if (y + tipH > rect.height) y = my - tipH - 10;
    if (y < 0) y = 4;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
}

function hideTooltip(tip) {
    tip.style.display = 'none';
}

var _fontReady = false;
var _fontPending = false;

function waitForFont(fontFamily, callback) {
    if (_fontReady) { callback(); return; }
    if (typeof document === 'undefined' || !document.fonts || !document.fonts.load) {
        setTimeout(callback, 300);
        return;
    }
    if (!_fontPending) {
        _fontPending = true;
        document.fonts.load('400 48px "' + fontFamily + '"').then(function() {
            _fontReady = true;
        });
    }
    var attempts = 0;
    var poll = function() {
        attempts++;
        if (_fontReady || attempts > 30) {
            _fontReady = true;
            callback();
            return;
        }
        setTimeout(poll, 100);
    };
    poll();
}

function drawHexCorners(ctx, x, y, w, h, size, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    var s = size;
    var hs = s * 0.866;
    // top-left hex notch
    ctx.beginPath();
    ctx.moveTo(x + s, y);
    ctx.lineTo(x + s * 0.5, y + hs);
    ctx.lineTo(x, y + hs);
    ctx.stroke();
    // bottom-right hex notch
    ctx.beginPath();
    ctx.moveTo(x + w - s, y + h);
    ctx.lineTo(x + w - s * 0.5, y + h - hs);
    ctx.lineTo(x + w, y + h - hs);
    ctx.stroke();
}

function resetShadow(ctx) {
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

  return {
    getTheme: getTheme, hexToRgb: hexToRgb, lerpColor: lerpColor,
    rampColor: rampColor, rgba: rgba, fmtNum: fmtNum, getNS: getNS,
    getOption: getOption, setupCanvas: setupCanvas, createTooltip: createTooltip,
    showTooltip: showTooltip, hideTooltip: hideTooltip, waitForFont: waitForFont,
    drawHexCorners: drawHexCorners, resetShadow: resetShadow, RAMP: RAMP, FONTS: FONTS
  };
})();

// --- jwst_heat_grid ---
// jwst_heat_grid — Hexagonal heat grid visualization
// JWST Mission Operations viz pack
// ES5 strict — no const/let/arrow/template literals/for..of/destructuring

'use strict';


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

return JwstHeatGrid;


});