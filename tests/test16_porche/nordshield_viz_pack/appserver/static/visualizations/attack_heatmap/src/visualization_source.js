'use strict';

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('theme');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getOption(config, ns, key, defaultValue) {
    var v = config[ns + key];
    if (v !== undefined && v !== null && v !== '') return v;
    v = config[key];
    if (v !== undefined && v !== null && v !== '') return v;
    return defaultValue;
}

function getNS(viz) {
    try {
        var info = viz.getPropertyNamespaceInfo();
        if (info && info.propertyNamespace) return info.propertyNamespace;
    } catch (e) {}
    return '';
}

// Parse a 6-digit hex color to {r,g,b}
function hexToRgb(hex) {
    var clean = hex.replace('#', '');
    return {
        r: parseInt(clean.slice(0, 2), 16),
        g: parseInt(clean.slice(2, 4), 16),
        b: parseInt(clean.slice(4, 6), 16)
    };
}

// Linear interpolation between two RGB objects at t in [0,1]
function lerpRgb(a, b, t) {
    return {
        r: Math.round(a.r + (b.r - a.r) * t),
        g: Math.round(a.g + (b.g - a.g) * t),
        b: Math.round(a.b + (b.b - a.b) * t)
    };
}

// 3-stop color interpolation: 0→colorLow, 0.5→colorMid, 1→colorHigh
function interpolateColor(t, colorLow, colorMid, colorHigh) {
    var low  = hexToRgb(colorLow);
    var mid  = hexToRgb(colorMid);
    var high = hexToRgb(colorHigh);
    var rgb;
    if (t <= 0.5) {
        rgb = lerpRgb(low, mid, t * 2);
    } else {
        rgb = lerpRgb(mid, high, (t - 0.5) * 2);
    }
    return 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')';
}

// Draw a rounded rectangle using arc() — ES5 canvas (no roundRect)
function drawRoundedRect(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
    ctx.lineTo(x + w, y + h - r);
    ctx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
    ctx.lineTo(x + r, y + h);
    ctx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
    ctx.lineTo(x, y + r);
    ctx.arc(x + r, y + r, r, Math.PI, -Math.PI / 2);
    ctx.closePath();
}

// Map various day representations to 0 (Mon) – 6 (Sun)
var DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
var DAY_FULL = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function dayToIndex(dayVal) {
    if (dayVal === undefined || dayVal === null) return -1;
    var s = String(dayVal).trim().toLowerCase();
    // Try full name
    for (var i = 0; i < DAY_FULL.length; i++) {
        if (s === DAY_FULL[i]) return i;
    }
    // Try 3-letter abbreviation
    for (var j = 0; j < DAY_LABELS.length; j++) {
        if (s === DAY_LABELS[j].toLowerCase()) return j;
    }
    // Try numeric 1-7 (ISO: Mon=1, Sun=7) or 0-6
    var n = parseInt(s, 10);
    if (!isNaN(n)) {
        if (n >= 1 && n <= 7) return n - 1;  // ISO weekday
        if (n >= 0 && n <= 6) return n;       // 0-based
    }
    return -1;
}

// ---------------------------------------------------------------------------
// Visualization
// ---------------------------------------------------------------------------

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        // Create canvas
        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
        this.el.appendChild(this._canvas);

        // Tooltip
        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 10px;' +
            'background:rgba(8,12,24,0.92);color:#C8D6E5;font-size:11px;' +
            'border-radius:3px;pointer-events:none;white-space:nowrap;' +
            'z-index:100;border:1px solid rgba(0,229,204,0.3);' +
            'font-family:"IBM Plex Mono",monospace;letter-spacing:0.03em;';
        this.el.appendChild(this._tooltip);

        // Hit-test cells stored per render
        this._cells = [];
        this._lastData = null;
        this._lastConfig = null;

        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            self._onMouseLeave();
        });
    },

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
        var result = { colIdx: colIdx, rows: data.rows, fields: fields };
        this._lastGoodData = result;
        return result;
    },

    updateView: function(data, config) {
        this._lastData = data;
        this._lastConfig = config;
        this._render(data, config);
    },

    reflow: function() {
        if (this._lastData && this._lastConfig) {
            this._render(this._lastData, this._lastConfig);
        }
    },

    _render: function(data, config) {
        var canvas = this._canvas;
        var el = this.el;
        var w = el.offsetWidth  || 400;
        var h = el.offsetHeight || 300;

        // HiDPI scaling (B2)
        var dpr = window.devicePixelRatio || 1;
        canvas.width  = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width  = w + 'px';
        canvas.style.height = h + 'px';
        var ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        // Clear canvas — never fillRect with bg color (B13)
        ctx.clearRect(0, 0, w, h);

        // ----------------------------------------------------------------
        // Parse config (B3, B7)
        // ----------------------------------------------------------------
        var ns = getNS(this);
        var dayField         = getOption(config, ns, 'dayField',         'day');
        var hourField        = getOption(config, ns, 'hourField',        'hour');
        var countField       = getOption(config, ns, 'countField',       'count');
        var colorLow         = getOption(config, ns, 'colorLow',         '#1A2236');
        var colorMid         = getOption(config, ns, 'colorMid',         '#00E5CC');
        var colorHigh        = getOption(config, ns, 'colorHigh',        '#FFB020');
        var highlightCurrent = getOption(config, ns, 'highlightCurrent', 'true') !== 'false';
        var accentIntensityRaw = getOption(config, ns, 'accentIntensity', '50');
        var accentIntensity  = Math.max(0, Math.min(100, parseFloat(accentIntensityRaw) || 50)) / 50;

        // ----------------------------------------------------------------
        // Build 7×24 matrix
        // ----------------------------------------------------------------
        var matrix = [];
        var r, c;
        for (r = 0; r < 7; r++) {
            matrix.push([]);
            for (c = 0; c < 24; c++) {
                matrix[r].push(0);
            }
        }
        var maxCount = 0;

        if (data && data.rows && data.rows.length > 0) {
            var colIdx = data.colIdx || {};
            var dayIdx   = colIdx[dayField];
            var hourIdx  = colIdx[hourField];
            var countIdx = colIdx[countField];

            for (var i = 0; i < data.rows.length; i++) {
                var row = data.rows[i];
                var dayRow  = (dayIdx  !== undefined) ? row[dayIdx]  : null;
                var hourRow = (hourIdx !== undefined) ? row[hourIdx] : null;
                var cnt     = (countIdx !== undefined) ? parseInt(row[countIdx], 10) || 0 : 0;

                var dayR  = dayToIndex(dayRow);
                var hourC = parseInt(hourRow, 10);
                if (isNaN(hourC) || hourC < 0 || hourC > 23) continue;
                if (dayR < 0 || dayR > 6) continue;

                matrix[dayR][hourC] += cnt;
                if (matrix[dayR][hourC] > maxCount) maxCount = matrix[dayR][hourC];
            }
        }

        // ----------------------------------------------------------------
        // Layout — scale all dimensions from container (B8)
        // ----------------------------------------------------------------
        var t = theme.getTheme();
        var DAYS  = 7;
        var HOURS = 24;

        // Font sizes — scale by container
        var titleFontSize = Math.max(8, Math.round(h * 0.032));
        var labelFontSize = Math.max(7, Math.round(Math.min(w, h) * 0.028));

        // Label areas
        var labelFont = '500 ' + labelFontSize + 'px "IBM Plex Mono", monospace';
        ctx.font = labelFont;
        var sampleDayW = ctx.measureText('Wed').width;
        var rowLabelW  = Math.round(sampleDayW + labelFontSize * 1.4);
        var colLabelH  = Math.round(labelFontSize * 2.0);

        // Title area
        var titleH = Math.round(h * 0.06 + 4);

        // Grid area
        var gridLeft   = rowLabelW;
        var gridTop    = titleH + colLabelH;
        var gridRight  = w - Math.round(w * 0.01);
        var gridBottom = h - Math.round(h * 0.02);
        var gridW = gridRight - gridLeft;
        var gridH = gridBottom - gridTop;

        var gap     = Math.max(1, Math.round(Math.min(gridW / HOURS, gridH / DAYS) * 0.08));
        var cellW   = Math.max(4, (gridW - gap * (HOURS - 1)) / HOURS);
        var cellH   = Math.max(4, (gridH - gap * (DAYS  - 1)) / DAYS);
        var cellRx  = 2;

        // ----------------------------------------------------------------
        // Draw title "ATTACK PATTERNS"
        // ----------------------------------------------------------------
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle   = t.textMuted;
        ctx.font        = '500 ' + titleFontSize + 'px "IBM Plex Mono", monospace';
        ctx.letterSpacing = '0.12em';
        ctx.textBaseline  = 'top';
        ctx.textAlign     = 'left';
        ctx.fillText('ATTACK PATTERNS', rowLabelW, Math.round(titleH * 0.15));
        ctx.restore();

        // ----------------------------------------------------------------
        // Draw column labels (00-23)
        // ----------------------------------------------------------------
        ctx.save();
        ctx.fillStyle   = t.textMuted;
        ctx.font        = labelFont;
        ctx.textBaseline = 'middle';
        ctx.textAlign    = 'center';
        ctx.globalAlpha  = 0.7;

        // Only label every other hour when cells are narrow
        var hourStep = (cellW < 14) ? 4 : (cellW < 20) ? 2 : 1;
        for (c = 0; c < HOURS; c++) {
            if (c % hourStep !== 0) continue;
            var cx = gridLeft + c * (cellW + gap) + cellW / 2;
            var label = (c < 10 ? '0' : '') + c;
            ctx.fillText(label, cx, titleH + colLabelH / 2);
        }
        ctx.restore();

        // ----------------------------------------------------------------
        // Draw row labels (Mon-Sun)
        // ----------------------------------------------------------------
        ctx.save();
        ctx.fillStyle    = t.textMuted;
        ctx.font         = labelFont;
        ctx.textBaseline = 'middle';
        ctx.textAlign    = 'right';
        ctx.globalAlpha  = 0.7;

        for (r = 0; r < DAYS; r++) {
            var cy = gridTop + r * (cellH + gap) + cellH / 2;
            ctx.fillText(DAY_LABELS[r], rowLabelW - Math.round(labelFontSize * 0.5), cy);
        }
        ctx.restore();

        // ----------------------------------------------------------------
        // Draw cells + collect hit-test rects
        // ----------------------------------------------------------------
        this._cells = [];
        this._gridLeft   = gridLeft;
        this._gridTop    = gridTop;
        this._cellW      = cellW;
        this._cellH      = cellH;
        this._gap        = gap;
        this._matrix     = matrix;
        this._maxCount   = maxCount;
        this._colorLow   = colorLow;
        this._colorMid   = colorMid;
        this._colorHigh  = colorHigh;

        for (r = 0; r < DAYS; r++) {
            for (c = 0; c < HOURS; c++) {
                var cellX = gridLeft + c * (cellW + gap);
                var cellY = gridTop  + r * (cellH + gap);
                var cnt2  = matrix[r][c];
                var norm  = (maxCount > 0) ? (cnt2 / maxCount) : 0;

                // Minimum visibility for zero cells — use colorLow at 15% opacity
                var fillColor;
                if (cnt2 === 0) {
                    fillColor = colorLow;
                    ctx.globalAlpha = 0.25;
                } else {
                    fillColor = interpolateColor(norm, colorLow, colorMid, colorHigh);
                    // Scale alpha by accentIntensity so users can dial back brightness
                    ctx.globalAlpha = 0.35 + 0.65 * norm * accentIntensity;
                }

                ctx.fillStyle = fillColor;
                drawRoundedRect(ctx, cellX, cellY, cellW, cellH, cellRx);
                ctx.fill();
                ctx.globalAlpha = 1;

                this._cells.push({
                    x: cellX, y: cellY, w: cellW, h: cellH,
                    row: r, col: c, count: cnt2
                });
            }
        }

        // ----------------------------------------------------------------
        // Highlight current hour column (if enabled)
        // ----------------------------------------------------------------
        if (highlightCurrent) {
            var now = new Date();
            var currentHour = now.getHours();
            var hx = gridLeft + currentHour * (cellW + gap) - 1;
            var hy = gridTop - 1;
            var hWidth  = cellW + 2;
            var hHeight = DAYS * (cellH + gap) - gap + 2;

            ctx.save();
            ctx.strokeStyle = 'rgba(0,229,204,0.4)';
            ctx.lineWidth   = 1;
            ctx.beginPath();
            ctx.rect(hx, hy, hWidth, hHeight);
            ctx.stroke();
            ctx.restore();
        }
    },

    // -----------------------------------------------------------------------
    // Mouse interaction
    // -----------------------------------------------------------------------

    _onMouseMove: function(e) {
        var rect = this._canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;

        var hit = this._hitTest(mx, my);
        if (hit) {
            var dayName = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][hit.row];
            var hourStr = (hit.col < 10 ? '0' : '') + hit.col + ':00';
            this._tooltip.textContent = dayName + ' ' + hourStr + ' — ' + hit.count + ' attacks';
            this._tooltip.style.display = 'block';
            this._tooltip.style.left = (mx + 14) + 'px';
            this._tooltip.style.top  = (my - 30) + 'px';
            this._canvas.style.cursor = 'crosshair';

            // Redraw with hover highlight
            this._renderHover(hit);
        } else {
            this._tooltip.style.display = 'none';
            this._canvas.style.cursor = 'default';
            if (this._hoveredCell !== null) {
                this._hoveredCell = null;
                this._render(this._lastData, this._lastConfig);
            }
        }
    },

    _onMouseLeave: function() {
        this._tooltip.style.display = 'none';
        this._canvas.style.cursor = 'default';
        if (this._hoveredCell !== null) {
            this._hoveredCell = null;
            this._render(this._lastData, this._lastConfig);
        }
    },

    _hitTest: function(mx, my) {
        for (var i = 0; i < this._cells.length; i++) {
            var cell = this._cells[i];
            if (mx >= cell.x && mx <= cell.x + cell.w &&
                my >= cell.y && my <= cell.y + cell.h) {
                return cell;
            }
        }
        return null;
    },

    _renderHover: function(hit) {
        // Re-render base, then draw hover border on top
        this._render(this._lastData, this._lastConfig);

        if (!hit) return;
        var dpr = window.devicePixelRatio || 1;
        var ctx = this._canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        ctx.save();
        ctx.strokeStyle = '#00E5CC';
        ctx.lineWidth   = 1.5;
        drawRoundedRect(ctx, hit.x - 1, hit.y - 1, hit.w + 2, hit.h + 2, 3);
        ctx.stroke();

        // Glow
        ctx.shadowBlur   = 6;
        ctx.shadowColor  = '#00E5CC';
        drawRoundedRect(ctx, hit.x - 1, hit.y - 1, hit.w + 2, hit.h + 2, 3);
        ctx.stroke();

        // Reset shadow (B6)
        ctx.shadowBlur   = 0;
        ctx.shadowColor  = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.restore();

        this._hoveredCell = hit;
    },

    remove: function() {
        if (this._tooltip && this._tooltip.parentNode) {
            this._tooltip.parentNode.removeChild(this._tooltip);
        }
        SplunkVisualizationBase.prototype.remove.apply(this, arguments);
    }
});
