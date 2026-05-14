'use strict';

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('theme');

// ---------------------------------------------------------------------------
// Metric color palette — cycle through these per row
// ---------------------------------------------------------------------------
var METRIC_COLORS = ['#1DB954', '#8B5CF6', '#E91E8A', '#3B82F6', '#F59E0B'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getOption(config, ns, key, defaultValue) {
    var v = config[ns + key];
    if (v !== undefined && v !== null) return v;
    v = config[key];
    if (v !== undefined && v !== null) return v;
    return defaultValue;
}

function getNS(viz) {
    try {
        var info = viz.getPropertyNamespaceInfo();
        if (info && info.propertyNamespace) return info.propertyNamespace;
    } catch (e) {}
    return '';
}

// Compact number formatter — delegates to theme.fmtNum
function fmtValue(num) {
    if (num === null || num === undefined || isNaN(num)) return '—';
    return theme.fmtNum(num, { compact: true });
}

// Sort an array of strings that represent time periods (e.g. "2024-01")
// using plain lexicographic order, which works for ISO date strings.
function sortPeriods(arr) {
    var copy = arr.slice();
    copy.sort(function(a, b) {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
    });
    return copy;
}

// Given an array of numeric values, compute normalised 0-1 positions.
// Returns the same length array.  All-identical values → 0.5 flat line.
function normalise(vals) {
    if (!vals || vals.length === 0) return [];
    var mn = vals[0];
    var mx = vals[0];
    for (var i = 1; i < vals.length; i++) {
        if (vals[i] < mn) mn = vals[i];
        if (vals[i] > mx) mx = vals[i];
    }
    var range = mx - mn;
    var out = [];
    for (var j = 0; j < vals.length; j++) {
        out.push(range === 0 ? 0.5 : (vals[j] - mn) / range);
    }
    return out;
}

// ---------------------------------------------------------------------------
// Data grouping: rows → { metricName: { periods: [...], values: [...] } }
// ---------------------------------------------------------------------------

function groupMetrics(data, metricField, periodField, valueField, maxMetrics) {
    var rows = data.rows;
    var colIdx = data.colIdx;

    var mIdx = colIdx[metricField];
    var pIdx = colIdx[periodField];
    var vIdx = colIdx[valueField];

    // Collect unique metric names in insertion order
    var order = [];
    var seen = {};
    var buckets = {};

    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var mName = mIdx !== undefined ? String(row[mIdx] || '') : '';
        var pName = pIdx !== undefined ? String(row[pIdx] || '') : '';
        var vRaw  = vIdx !== undefined ? parseFloat(row[vIdx]) : NaN;

        if (!mName) continue;

        if (!seen[mName]) {
            seen[mName] = true;
            order.push(mName);
            buckets[mName] = {};  // period → numeric value
        }
        if (pName && !isNaN(vRaw)) {
            buckets[mName][pName] = vRaw;
        }
    }

    // Trim to maxMetrics
    if (order.length > maxMetrics) order = order.slice(0, maxMetrics);

    // Build sorted series arrays
    var series = [];
    for (var k = 0; k < order.length; k++) {
        var name = order[k];
        var bucket = buckets[name];
        var periods = sortPeriods(Object.keys(bucket));
        var vals = [];
        for (var p = 0; p < periods.length; p++) {
            vals.push(bucket[periods[p]]);
        }
        series.push({
            name: name,
            periods: periods,
            values: vals,
            norm: normalise(vals)
        });
    }

    return series;
}

// ---------------------------------------------------------------------------
// Visualization
// ---------------------------------------------------------------------------

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        // Canvas — absolute-positioned, full panel
        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;display:block;';
        this.el.appendChild(this._canvas);

        // Tooltip div
        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:7px 11px;' +
            'border-radius:6px;pointer-events:none;white-space:nowrap;' +
            'z-index:100;font-size:11px;line-height:1.5;' +
            'box-shadow:0 2px 10px rgba(0,0,0,0.45);';
        this.el.appendChild(this._tooltip);

        // State
        this._hitRegions = [];   // [{x, y, w, h, series, rowIdx}]
        this._hoverRow   = -1;
        this._lastData   = null;
        this._lastConfig = null;
        this._lastGoodData = null;
        this._gi = 1; // accent intensity multiplier

        var self = this;
        this._canvas.addEventListener('mousemove', function(e) { self._onMouseMove(e); });
        this._canvas.addEventListener('mouseleave', function() { self._onMouseLeave(); });
    },

    // ── Data pipeline ─────────────────────────────────────────────────────────

    getInitialDataParams: function() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },

    formatData: function(data) {
        if (!data || !data.rows || data.rows.length === 0) {
            if (this._lastGoodData) return this._lastGoodData;
            return data;
        }
        var fields = data.fields;
        var colIdx = {};
        for (var i = 0; i < fields.length; i++) {
            colIdx[fields[i].name] = i;
        }
        var result = { colIdx: colIdx, rows: data.rows };
        this._lastGoodData = result;
        return result;
    },

    updateView: function(data, config) {
        this._lastData   = data;
        this._lastConfig = config;
        this._render(data, config);
    },

    // ── Main render ───────────────────────────────────────────────────────────

    _render: function(data, config) {
        var ns = getNS(this);

        // --- Config reads (all via getOption) ---
        var metricField  = getOption(config, ns, 'metricField',  'metric');
        var periodField  = getOption(config, ns, 'periodField',  'period');
        var valueField   = getOption(config, ns, 'valueField',   'value');
        var accentIntRaw = getOption(config, ns, 'accentIntensity', '50');
        var lineWidthRaw = getOption(config, ns, 'lineWidth',    '2');
        var showFillRaw  = getOption(config, ns, 'showFill',     'true');
        var showDeltaRaw = getOption(config, ns, 'showDelta',    'true');
        var maxMetRaw    = getOption(config, ns, 'maxMetrics',   '6');

        var gi = parseFloat(accentIntRaw);
        if (isNaN(gi)) gi = 50;
        this._gi = Math.max(0, Math.min(100, gi)) / 50; // 0–2 range

        var lineW     = Math.max(1, parseFloat(lineWidthRaw) || 2);
        var showFill  = (showFillRaw  !== 'false' && showFillRaw  !== false);
        var showDelta = (showDeltaRaw !== 'false' && showDeltaRaw !== false);
        var maxMet    = Math.max(1, parseInt(maxMetRaw, 10) || 6);

        // --- Dimensions ---
        var w = this.el.offsetWidth  || 400;
        var h = this.el.offsetHeight || 300;

        var dpr = window.devicePixelRatio || 1;
        this._canvas.width        = w * dpr;
        this._canvas.height       = h * dpr;
        this._canvas.style.width  = w + 'px';
        this._canvas.style.height = h + 'px';

        var ctx = this._canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        // --- Theme ---
        var mode  = theme.detectTheme(this.el);
        var t     = theme.getTheme(mode);
        var fonts = theme.getFonts();

        // Style tooltip
        this._tooltip.style.background  = t.panelHi;
        this._tooltip.style.color       = t.textBright;
        this._tooltip.style.fontFamily  = fonts.data;
        this._tooltip.style.border      = '1px solid ' + theme.hexToRgba(t.accent, 0.25);

        // --- Clear canvas ---
        ctx.clearRect(0, 0, w, h);

        // --- No data guard ---
        if (!data || !data.colIdx || !data.rows || data.rows.length === 0) {
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle    = t.textMuted;
            ctx.font         = '13px ' + fonts.ui;
            ctx.fillText('No data', w * 0.5, h * 0.5);
            return;
        }

        // --- Parse series ---
        var series = groupMetrics(data, metricField, periodField, valueField, maxMet);

        if (series.length === 0) {
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle    = t.textMuted;
            ctx.font         = '13px ' + fonts.ui;
            ctx.fillText('No metrics found', w * 0.5, h * 0.5);
            return;
        }

        // --- Layout ---
        var rowCount  = series.length;
        var padX      = Math.max(10, Math.round(w * 0.03));
        var padY      = Math.max(6,  Math.round(h * 0.025));
        var rowH      = Math.floor((h - padY * 2) / rowCount);
        var sepH      = Math.max(1, Math.round(rowH * 0.03));

        // Column proportions (of usable width inside padX)
        var usableW   = w - padX * 2;
        var labelW    = Math.round(usableW * 0.22);
        var valueW    = Math.round(usableW * 0.20);
        var sparkW    = usableW - labelW - valueW;

        var labelFontSize = Math.max(8,  Math.round(rowH * 0.25));
        var valueFontSize = Math.max(10, Math.round(rowH * 0.32));
        var deltaFontSize = Math.max(8,  Math.round(rowH * 0.21));

        // Store hit regions for tooltip
        this._hitRegions = [];

        for (var ri = 0; ri < series.length; ri++) {
            var s      = series[ri];
            var color  = METRIC_COLORS[ri % METRIC_COLORS.length];
            var isHot  = (this._hoverRow === ri);

            var rowTop = padY + ri * rowH;
            var rowMid = rowTop + rowH * 0.5;

            // --- Row hover background ---
            if (isHot) {
                ctx.fillStyle = theme.hexToRgba(color, 0.08);
                ctx.fillRect(0, rowTop, w, rowH - sepH);
            }

            // --- Separator line (after each row except last) ---
            if (ri < series.length - 1) {
                ctx.strokeStyle = mode === 'light'
                    ? 'rgba(0,0,0,0.07)'
                    : 'rgba(255,255,255,0.05)';
                ctx.lineWidth = sepH;
                ctx.beginPath();
                ctx.moveTo(padX, rowTop + rowH - sepH);
                ctx.lineTo(w - padX, rowTop + rowH - sepH);
                ctx.stroke();
            }

            // --- Metric label (left) ---
            var labelX = padX;
            var labelY = rowMid + labelFontSize * 0.35;
            ctx.textAlign    = 'left';
            ctx.textBaseline = 'alphabetic';
            ctx.font         = labelFontSize + 'px ' + fonts.ui;
            ctx.fillStyle    = isHot ? t.textBright : t.textMuted;

            // Truncate label to fit labelW
            var labelText = s.name;
            var maxLabelW = labelW - Math.round(padX * 0.5);
            while (labelText.length > 1 && ctx.measureText(labelText).width > maxLabelW) {
                labelText = labelText.slice(0, -1);
            }
            if (labelText !== s.name) labelText = labelText.slice(0, -1) + '…';
            ctx.fillText(labelText, labelX, labelY);

            // --- Sparkline area (center) ---
            var spX   = padX + labelW;
            var spInnerPad = Math.max(4, Math.round(rowH * 0.18));
            var spTop = rowTop + spInnerPad;
            var spBot = rowTop + rowH - spInnerPad - sepH;
            var spH   = spBot - spTop;
            var spW   = sparkW - Math.round(padX * 0.5);

            if (s.norm.length >= 2 && spH > 4 && spW > 10) {
                // Compute point coordinates
                var pts = [];
                for (var pi = 0; pi < s.norm.length; pi++) {
                    var px = spX + (spW / (s.norm.length - 1)) * pi;
                    var py = spTop + spH * (1 - s.norm[pi]);
                    pts.push({ x: px, y: py });
                }

                // Gradient fill under line
                if (showFill) {
                    var fillGrad = ctx.createLinearGradient(0, spTop, 0, spBot);
                    fillGrad.addColorStop(0, theme.hexToRgba(color, isHot ? 0.28 : 0.18));
                    fillGrad.addColorStop(1, theme.hexToRgba(color, 0));

                    ctx.fillStyle = fillGrad;
                    ctx.beginPath();
                    ctx.moveTo(pts[0].x, spBot);        // bottom-left anchor
                    ctx.lineTo(pts[0].x, pts[0].y);
                    for (var fi = 1; fi < pts.length; fi++) {
                        ctx.lineTo(pts[fi].x, pts[fi].y);
                    }
                    ctx.lineTo(pts[pts.length - 1].x, spBot);  // bottom-right anchor
                    ctx.closePath();
                    ctx.fill();
                }

                // Sparkline stroke
                var strokeW = isHot ? lineW + 1 : lineW;
                ctx.strokeStyle = color;
                ctx.lineWidth   = strokeW;
                ctx.lineJoin    = 'round';
                ctx.lineCap     = 'round';

                if (isHot && this._gi > 0) {
                    ctx.shadowColor   = theme.hexToRgba(color, 0.5 * this._gi);
                    ctx.shadowBlur    = 6 * this._gi;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                }

                ctx.beginPath();
                ctx.moveTo(pts[0].x, pts[0].y);
                for (var li = 1; li < pts.length; li++) {
                    ctx.lineTo(pts[li].x, pts[li].y);
                }
                ctx.stroke();

                // Reset shadow
                ctx.shadowBlur    = 0;
                ctx.shadowColor   = 'transparent';
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;

                // Terminal dot at last point
                var lastPt   = pts[pts.length - 1];
                var dotR     = isHot ? Math.max(2.5, strokeW * 1.4) : Math.max(2, strokeW);

                if (isHot && this._gi > 0) {
                    ctx.shadowColor   = theme.hexToRgba(color, 0.7 * this._gi);
                    ctx.shadowBlur    = 8 * this._gi;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                }

                ctx.beginPath();
                ctx.arc(lastPt.x, lastPt.y, dotR, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();

                // Reset shadow
                ctx.shadowBlur    = 0;
                ctx.shadowColor   = 'transparent';
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            }

            // --- Current value + delta (right side) ---
            var vX       = spX + spW + Math.round(padX * 0.5);
            var lastVal  = s.values.length > 0 ? s.values[s.values.length - 1] : null;
            var firstVal = s.values.length > 0 ? s.values[0] : null;
            var valStr   = lastVal !== null ? fmtValue(lastVal) : '—';

            // Compute delta: last vs first
            var deltaDir = 0; // 0=flat, 1=up, -1=down
            if (showDelta && s.values.length >= 2 && firstVal !== null && lastVal !== null && firstVal !== 0) {
                var pct = ((lastVal - firstVal) / Math.abs(firstVal)) * 100;
                deltaDir = pct > 0.01 ? 1 : (pct < -0.01 ? -1 : 0);
            }

            // Value text
            ctx.textAlign    = 'right';
            ctx.textBaseline = 'alphabetic';
            ctx.font         = 'bold ' + valueFontSize + 'px ' + fonts.data;
            ctx.fillStyle    = isHot ? color : t.textBright;
            ctx.fillText(valStr, w - padX, rowMid + valueFontSize * 0.35);

            // Delta arrow below value
            if (showDelta && s.values.length >= 2) {
                var deltaColor = deltaDir > 0
                    ? (mode === 'light' ? t.accent : t.accent)
                    : (deltaDir < 0 ? t.coral : t.textMuted);
                var arrow = deltaDir > 0 ? '▲' : (deltaDir < 0 ? '▼' : '—');

                ctx.textAlign    = 'right';
                ctx.textBaseline = 'alphabetic';
                ctx.font         = deltaFontSize + 'px ' + fonts.ui;
                ctx.fillStyle    = theme.hexToRgba(deltaColor, isHot ? 1 : 0.75);
                ctx.fillText(arrow, w - padX, rowMid + valueFontSize * 0.35 + deltaFontSize + 2);
            }

            // --- Store hit region ---
            this._hitRegions.push({
                x:      0,
                y:      rowTop,
                w:      w,
                h:      rowH - sepH,
                series: s,
                color:  color
            });
        }
    },

    // ── Interaction ───────────────────────────────────────────────────────────

    _onMouseMove: function(e) {
        var rect = this._canvas.getBoundingClientRect();
        var mx   = e.clientX - rect.left;
        var my   = e.clientY - rect.top;

        var hit = -1;
        for (var i = 0; i < this._hitRegions.length; i++) {
            var r = this._hitRegions[i];
            if (my >= r.y && my < r.y + r.h) {
                hit = i;
                break;
            }
        }

        var changed = (hit !== this._hoverRow);
        this._hoverRow = hit;

        if (hit >= 0) {
            this._canvas.style.cursor = 'default';

            var reg = this._hitRegions[hit];
            var s   = reg.series;
            var lastVal  = s.values.length > 0 ? s.values[s.values.length - 1] : null;
            var firstVal = s.values.length > 0 ? s.values[0] : null;

            var tipLines = [s.name];
            tipLines.push('Current: ' + (lastVal !== null ? fmtValue(lastVal) : '—'));
            if (s.values.length >= 2 && firstVal !== null && lastVal !== null) {
                var delta = lastVal - firstVal;
                var sign  = delta >= 0 ? '+' : '';
                var pct   = firstVal !== 0
                    ? (sign + ((delta / Math.abs(firstVal)) * 100).toFixed(1) + '%')
                    : '';
                tipLines.push('Change: ' + sign + fmtValue(delta) + (pct ? ' (' + pct + ')' : ''));
            }
            if (s.periods.length > 0) {
                tipLines.push(s.periods[0] + ' → ' + s.periods[s.periods.length - 1]);
            }

            this._tooltip.innerHTML = tipLines.join('<br>');
            this._tooltip.style.display = 'block';

            // Position — keep inside panel
            var panelW = this.el.offsetWidth  || 400;
            var panelH = this.el.offsetHeight || 300;
            var tipW   = this._tooltip.offsetWidth  || 180;
            var tipH   = this._tooltip.offsetHeight || 60;
            var tx     = mx + 14;
            var ty     = my - 8;
            if (tx + tipW > panelW) tx = mx - tipW - 8;
            if (ty + tipH > panelH) ty = panelH - tipH - 4;
            if (ty < 0) ty = 4;
            this._tooltip.style.left = tx + 'px';
            this._tooltip.style.top  = ty + 'px';
        } else {
            this._tooltip.style.display = 'none';
            this._canvas.style.cursor   = 'default';
        }

        if (changed && this._lastData && this._lastConfig) {
            this._render(this._lastData, this._lastConfig);
        }
    },

    _onMouseLeave: function() {
        var changed    = (this._hoverRow !== -1);
        this._hoverRow = -1;
        this._tooltip.style.display = 'none';
        this._canvas.style.cursor   = 'default';
        if (changed && this._lastData && this._lastConfig) {
            this._render(this._lastData, this._lastConfig);
        }
    },

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    reflow: function() {
        if (this._lastData && this._lastConfig) {
            this._render(this._lastData, this._lastConfig);
        }
    },

    destroy: function() {
        if (this._tooltip && this._tooltip.parentNode) {
            this._tooltip.parentNode.removeChild(this._tooltip);
        }
        if (this._canvas && this._canvas.parentNode) {
            this._canvas.parentNode.removeChild(this._canvas);
        }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }

});
