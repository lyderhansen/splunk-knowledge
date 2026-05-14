'use strict';

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('theme');

// ─── helpers ────────────────────────────────────────────────────────────────

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

// Day ordering: Monday first
var DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
var DAY_ABBR  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── viz ────────────────────────────────────────────────────────────────────

module.exports = SplunkVisualizationBase.extend({

    // ── lifecycle ────────────────────────────────────────────────────────────

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        // Canvas
        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'display:block;position:absolute;top:0;left:0;';
        this.el.appendChild(this._canvas);

        // Tooltip
        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 10px;border-radius:6px;' +
            'pointer-events:none;white-space:nowrap;z-index:100;font-size:12px;' +
            'line-height:1.4;box-shadow:0 2px 8px rgba(0,0,0,0.4);';
        this.el.appendChild(this._tooltip);

        // Hit regions stored after each render
        this._hitRegions = [];
        this._hoveredCell = null;

        // Cache for reflow
        this._lastData = null;
        this._lastConfig = null;

        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            self._tooltip.style.display = 'none';
            if (self._hoveredCell !== null) {
                self._hoveredCell = null;
                if (self._lastData && self._lastConfig) {
                    self._render(self._lastData, self._lastConfig);
                }
            }
        });
    },

    // ── data pipeline ────────────────────────────────────────────────────────

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
        this._lastConfig = config;
        this._lastData = data;
        this._render(data, config);
    },

    // ── render ───────────────────────────────────────────────────────────────

    _render: function(data, config) {
        var self    = this;
        var ns      = getNS(this);
        var t       = theme.getTheme(theme.detectTheme(this.el));
        var fonts   = theme.getFonts();

        // Settings
        var dayField    = getOption(config, ns, 'dayField',   'day');
        var hourField   = getOption(config, ns, 'hourField',  'hour');
        var valueField  = getOption(config, ns, 'valueField', 'listeners');
        var highColor   = getOption(config, ns, 'highColor',  '#1DB954');
        var cellRadius  = parseInt(getOption(config, ns, 'cellRadius', '4'), 10);
        var showLabels  = getOption(config, ns, 'showLabels', 'true') !== 'false';
        var accentIntensity = getOption(config, ns, 'accentIntensity', '50');
        var gi          = theme.getAccentIntensity({ accentIntensity: accentIntensity });

        if (isNaN(cellRadius)) cellRadius = 4;
        cellRadius = Math.max(0, Math.min(8, cellRadius));

        // Container size
        var w = this.el.clientWidth  || 400;
        var h = this.el.clientHeight || 200;

        // HiDPI
        var dpr = window.devicePixelRatio || 1;
        this._canvas.width  = w * dpr;
        this._canvas.height = h * dpr;
        this._canvas.style.width  = w + 'px';
        this._canvas.style.height = h + 'px';
        var ctx = this._canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        // Clear — transparent canvas (B13)
        ctx.clearRect(0, 0, w, h);

        // Layout constants — all scaled from panel
        var padTop    = showLabels ? Math.max(6, Math.round(h * 0.04)) : 4;
        var padBottom = showLabels ? Math.max(18, Math.round(h * 0.12)) : 4;
        var padLeft   = showLabels ? Math.max(28, Math.round(w * 0.07)) : 4;
        var padRight  = Math.max(4, Math.round(w * 0.02));

        var gridW = w - padLeft - padRight;
        var gridH = h - padTop - padBottom;

        var HOURS = 24;
        var DAYS  = 7;
        var GAP   = Math.max(2, Math.round(Math.min(gridW / HOURS, gridH / DAYS) * 0.1));

        var cellW = Math.max(2, (gridW - (HOURS - 1) * GAP) / HOURS);
        var cellH = Math.max(2, (gridH - (DAYS  - 1) * GAP) / DAYS);

        var labelFontSize = Math.max(7, Math.min(11, Math.round(cellH * 0.5)));

        // ── Parse data ──────────────────────────────────────────────────────
        // grid[dayIndex][hour] = count
        var grid = [];
        var d, hr;
        for (d = 0; d < DAYS; d++) {
            grid[d] = [];
            for (hr = 0; hr < HOURS; hr++) {
                grid[d][hr] = 0;
            }
        }

        var maxVal = 0;
        var hasData = false;

        if (data && data.rows && data.rows.length > 0 && data.colIdx) {
            var colIdx    = data.colIdx;
            var dayIdx    = colIdx[dayField]   !== undefined ? colIdx[dayField]   : -1;
            var hourIdx   = colIdx[hourField]  !== undefined ? colIdx[hourField]  : -1;
            var valueIdx  = colIdx[valueField] !== undefined ? colIdx[valueField] : -1;

            for (var r = 0; r < data.rows.length; r++) {
                var row    = data.rows[r];
                var dayStr = dayIdx  >= 0 ? String(row[dayIdx])  : '';
                var hrVal  = hourIdx >= 0 ? parseInt(row[hourIdx], 10) : -1;
                var count  = valueIdx >= 0 ? parseFloat(row[valueIdx]) : 0;

                if (isNaN(hrVal) || hrVal < 0 || hrVal > 23) continue;
                if (isNaN(count)) count = 0;

                var dayI = -1;
                for (var di = 0; di < DAY_ORDER.length; di++) {
                    if (DAY_ORDER[di].toLowerCase() === dayStr.toLowerCase()) {
                        dayI = di;
                        break;
                    }
                }
                if (dayI < 0) continue;

                grid[dayI][hrVal] = count;
                if (count > maxVal) maxVal = count;
                hasData = true;
            }
        }

        // ── Draw cells ──────────────────────────────────────────────────────
        this._hitRegions = [];

        // Parse highColor for low-opacity base
        var lowAlpha = Math.max(0.04, 0.04 + 0.06 * (1 - gi));

        for (d = 0; d < DAYS; d++) {
            for (hr = 0; hr < HOURS; hr++) {
                var val  = grid[d][hr];
                var norm = maxVal > 0 ? val / maxVal : 0;

                // Scale norm by accent intensity
                var intensity = Math.max(lowAlpha, norm * gi);

                var cellX = padLeft + hr * (cellW + GAP);
                var cellY = padTop  + d  * (cellH + GAP);

                var isHovered = (self._hoveredCell !== null &&
                                 self._hoveredCell.d === d &&
                                 self._hoveredCell.hr === hr);

                // Fill color: lerp from near-transparent dark to highColor
                if (norm < 0.001) {
                    // Empty cell — subtle track
                    ctx.fillStyle = t.barTrack;
                } else {
                    // Interpolate from bg color toward highColor
                    var bgHex   = t.card;  // card background as the low end
                    var blended = theme.lerpColor(bgHex, highColor, Math.min(1, intensity));
                    ctx.fillStyle = blended;
                }

                // Glow on high-intensity cells
                if (norm > 0.7 && gi > 0.5) {
                    ctx.shadowColor   = theme.hexToRgba(highColor, 0.35 * gi);
                    ctx.shadowBlur    = Math.round(cellW * 0.6 * gi);
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                } else {
                    ctx.shadowBlur = 0;
                    ctx.shadowColor = 'transparent';
                }

                theme.fillRoundRect(ctx, cellX, cellY, cellW, cellH, Math.min(cellRadius, cellW / 2, cellH / 2));

                // Reset shadow
                ctx.shadowBlur  = 0;
                ctx.shadowColor = 'transparent';
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;

                // Hover ring
                if (isHovered) {
                    ctx.strokeStyle = highColor;
                    ctx.lineWidth   = Math.max(1.5, cellW * 0.08);
                    theme.strokeRoundRect(ctx, cellX, cellY, cellW, cellH, Math.min(cellRadius, cellW / 2, cellH / 2));
                }

                // Store hit region
                self._hitRegions.push({
                    x: cellX, y: cellY, w: cellW, h: cellH,
                    d: d, hr: hr, val: val, norm: norm
                });
            }
        }

        // ── Labels ───────────────────────────────────────────────────────────
        if (showLabels) {
            ctx.fillStyle = t.textMuted;
            ctx.font      = labelFontSize + 'px ' + fonts.ui;
            ctx.textBaseline = 'middle';
            ctx.textAlign    = 'right';

            for (d = 0; d < DAYS; d++) {
                var rowY   = padTop + d * (cellH + GAP) + cellH / 2;
                var labelX = padLeft - Math.max(4, Math.round(cellW * 0.3));
                ctx.fillText(DAY_ABBR[d], labelX, rowY);
            }

            // Hour labels — only every 3 hours to avoid crowding
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'top';
            var hourLabelY   = padTop + gridH + Math.max(3, GAP);
            for (hr = 0; hr < HOURS; hr += 3) {
                var colX  = padLeft + hr * (cellW + GAP) + cellW / 2;
                var label = hr === 0 ? '12a' :
                            hr < 12  ? hr + 'a' :
                            hr === 12 ? '12p' :
                            (hr - 12) + 'p';
                ctx.fillText(label, colX, hourLabelY);
            }
        }

        // ── Update tooltip theme ──────────────────────────────────────────────
        this._tooltip.style.background  = t.panelHi;
        this._tooltip.style.color       = t.textBright;
        this._tooltip.style.fontFamily  = fonts.ui;
        this._tooltip.style.border      = '1px solid ' + theme.hexToRgba(highColor, 0.4);
    },

    // ── interaction ──────────────────────────────────────────────────────────

    _onMouseMove: function(e) {
        var rect = this._canvas.getBoundingClientRect();
        var mx   = e.clientX - rect.left;
        var my   = e.clientY - rect.top;

        var hit = null;
        for (var i = 0; i < this._hitRegions.length; i++) {
            var region = this._hitRegions[i];
            if (mx >= region.x && mx <= region.x + region.w &&
                my >= region.y && my <= region.y + region.h) {
                hit = region;
                break;
            }
        }

        if (hit) {
            var prevHovered = this._hoveredCell;
            var changed = (prevHovered === null ||
                           prevHovered.d !== hit.d ||
                           prevHovered.hr !== hit.hr);

            this._hoveredCell = { d: hit.d, hr: hit.hr };

            if (changed && this._lastData && this._lastConfig) {
                this._render(this._lastData, this._lastConfig);
            }

            var hourLabel;
            if (hit.hr === 0)       hourLabel = '12 AM';
            else if (hit.hr < 12)   hourLabel = hit.hr + ' AM';
            else if (hit.hr === 12) hourLabel = '12 PM';
            else                    hourLabel = (hit.hr - 12) + ' PM';

            var dayLabel  = DAY_ORDER[hit.d];
            var valLabel  = hit.val === 0 ? 'No streams' :
                            theme.fmtNum(hit.val, {}) + ' listener' + (hit.val !== 1 ? 's' : '');

            this._tooltip.innerHTML =
                '<span style="font-weight:600;">' + dayLabel + ' ' + hourLabel + '</span><br>' +
                valLabel;

            var tipX = mx + 14;
            var tipY = my - 8;

            // Keep within bounds (approximate — tooltip not yet sized)
            if (tipX + 160 > this.el.clientWidth)  tipX = mx - 170;
            if (tipY + 50  > this.el.clientHeight) tipY = my - 56;

            this._tooltip.style.left    = tipX + 'px';
            this._tooltip.style.top     = tipY + 'px';
            this._tooltip.style.display = 'block';
            this._canvas.style.cursor   = 'default';
        } else {
            if (this._hoveredCell !== null) {
                this._hoveredCell = null;
                if (this._lastData && this._lastConfig) {
                    this._render(this._lastData, this._lastConfig);
                }
            }
            this._tooltip.style.display = 'none';
            this._canvas.style.cursor   = 'default';
        }
    },

    // ── resize ───────────────────────────────────────────────────────────────

    reflow: function() {
        if (this._lastData && this._lastConfig) {
            this._render(this._lastData, this._lastConfig);
        }
    },

    // ── cleanup ───────────────────────────────────────────────────────────────

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
