var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var SplunkVisualizationUtils = require('api/SplunkVisualizationUtils');
var theme = require('shared/theme');

// ---------------------------------------------------------------------------
// McLaren F1 Telemetry — sector_bars visualization
// Segmented horizontal bar chart: S1 / S2 / S3 sector time breakdown per driver
// ---------------------------------------------------------------------------

// Segment gap in CSS pixels between contiguous sector bars
var SEG_GAP = 2;

// Driver label column as a fraction of total width
var LABEL_COL_FRAC = 0.15;

// Lap time column (right side) as a fraction of total width
var LAPTIME_COL_FRAC = 0.10;

// Row height bounds
var ROW_H_MIN = 18;
var ROW_H_MAX = 56;

// Row gap (space between rows)
var ROW_GAP = 4;

// Header height as fraction of rowH
var HEADER_H_FRAC = 0.9;

// Segment opacity (sectors draw at 80 %)
var SEG_ALPHA = 0.80;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a sector time string like "28.412" to a float.
 * Returns NaN if not parseable (treated as 0 in width calculation).
 */
function parseSectorTime(str) {
    if (!str) return NaN;
    return parseFloat(String(str));
}

// ---------------------------------------------------------------------------
// Main viz
// ---------------------------------------------------------------------------

module.exports = SplunkVisualizationBase.extend({

    // -------------------------------------------------------------------------
    // initialize — create canvas, tooltip, event listeners (F10 — no jQuery)
    // -------------------------------------------------------------------------

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        // Canvas — manual creation so we control it (B17 corollary)
        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'display:block;width:100%;height:100%;';
        this.el.appendChild(this._canvas);

        // Tooltip (I1)
        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 10px;border-radius:3px;' +
            'pointer-events:none;white-space:nowrap;z-index:100;font-size:11px;' +
            'line-height:1.6;';
        this.el.appendChild(this._tooltip);

        // Hit zones: array of {rowIdx, segIdx, x, y, w, h, sectorLabel, sectorTime}
        this._hitZones = [];

        // Parsed row data
        this._parsedRows = [];

        // Hover state: { rowIdx, segIdx } or null
        this._hover = null;

        // Caches for reflow (C6)
        this._lastData   = null;
        this._lastConfig = null;

        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            if (self._hover !== null) {
                self._hover = null;
                if (self._lastData && self._lastConfig) {
                    self._render(self._lastData, self._lastConfig);
                }
            }
            self._tooltip.style.display = 'none';
            self._canvas.style.cursor = 'default';
        });
    },

    // -------------------------------------------------------------------------
    // Data params (F4)
    // -------------------------------------------------------------------------

    getInitialDataParams: function() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },

    // -------------------------------------------------------------------------
    // formatData — data only, no config reads (B4)
    // -------------------------------------------------------------------------

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

    // -------------------------------------------------------------------------
    // Render pipeline
    // -------------------------------------------------------------------------

    updateView: function(data, config) {
        this._lastData   = data;
        this._lastConfig = config;
        this._render(data, config);
    },

    reflow: function() {
        if (this._lastData && this._lastConfig) {
            this._render(this._lastData, this._lastConfig);
        }
    },

    // -------------------------------------------------------------------------
    // Core render
    // -------------------------------------------------------------------------

    _render: function(data, config) {
        var ns = theme.getNS(this);

        // DEBUG — remove after investigation
        console.log('[SECTOR_BARS] namespace:', JSON.stringify(ns));
        console.log('[SECTOR_BARS] config keys:', Object.keys(config || {}).join(', '));
        console.log('[SECTOR_BARS] sector1Color via ns:', config[ns + 'sector1Color']);
        console.log('[SECTOR_BARS] sector1Color direct:', config['sector1Color']);
        console.log('[SECTOR_BARS] full config:', JSON.stringify(config));

        // --- Config reads (all via getOption, B3) ---
        var themeMode    = theme.getOption(config, ns, 'theme',          'dark');
        var t            = theme.getTheme(themeMode);
        var driverField  = theme.getOption(config, ns, 'driverField',    'driver');
        var s1Field      = theme.getOption(config, ns, 'sector1Field',   'sector_1');
        var s2Field      = theme.getOption(config, ns, 'sector2Field',   'sector_2');
        var s3Field      = theme.getOption(config, ns, 'sector3Field',   'sector_3');
        var lapField     = theme.getOption(config, ns, 'lapTimeField',   'lap_time');
        var s1Color      = theme.getOption(config, ns, 'sector1Color',   '#FF8000');
        var s2Color      = theme.getOption(config, ns, 'sector2Color',   '#47C7FC');
        var s3Color      = theme.getOption(config, ns, 'sector3Color',   '#A855F7');
        var maxRows      = theme.parseNum(theme.getOption(config, ns, 'maxRows', '20'), 20);
        var accentInt    = theme.parseNum(theme.getOption(config, ns, 'accentIntensity', '50'), 50);

        // --- HiDPI canvas (B2) ---
        var rect = this.el.getBoundingClientRect();
        var w    = rect.width  || this.el.offsetWidth  || 400;
        var h    = rect.height || this.el.offsetHeight || 300;
        var dpr  = window.devicePixelRatio || 1;
        this._canvas.width  = w * dpr;
        this._canvas.height = h * dpr;
        this._canvas.style.width  = w + 'px';
        this._canvas.style.height = h + 'px';
        var ctx = this._canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        // Clear canvas (B13)
        ctx.clearRect(0, 0, w, h);

        // --- Extract rows ---
        var colIdx = (data && data.colIdx) ? data.colIdx : {};
        var rows   = (data && data.rows)   ? data.rows   : [];

        this._parsedRows = [];
        var visibleCount = Math.min(rows.length, Math.max(1, maxRows));

        for (var i = 0; i < visibleCount; i++) {
            var row = rows[i];
            var posIdx = (colIdx['position'] !== undefined) ? colIdx['position'] : -1;
            var pr = {
                driver:  (colIdx[driverField] !== undefined) ? String(row[colIdx[driverField]] || '') : '',
                s1Str:   (colIdx[s1Field]     !== undefined) ? String(row[colIdx[s1Field]]     || '') : '',
                s2Str:   (colIdx[s2Field]     !== undefined) ? String(row[colIdx[s2Field]]     || '') : '',
                s3Str:   (colIdx[s3Field]     !== undefined) ? String(row[colIdx[s3Field]]     || '') : '',
                lapTime: (colIdx[lapField]    !== undefined) ? String(row[colIdx[lapField]]    || '') : '',
                position: (posIdx >= 0) ? String(row[posIdx] || '') : '',
                rowIdx: i
            };
            pr.s1 = parseSectorTime(pr.s1Str);
            pr.s2 = parseSectorTime(pr.s2Str);
            pr.s3 = parseSectorTime(pr.s3Str);
            pr.total = (isNaN(pr.s1) ? 0 : pr.s1) +
                       (isNaN(pr.s2) ? 0 : pr.s2) +
                       (isNaN(pr.s3) ? 0 : pr.s3);
            this._parsedRows.push(pr);
        }

        // Sort by position if available (numeric), else keep order
        var allHavePos = true;
        for (var pi = 0; pi < this._parsedRows.length; pi++) {
            if (!this._parsedRows[pi].position) { allHavePos = false; break; }
        }
        if (allHavePos) {
            this._parsedRows.sort(function(a, b) {
                return parseFloat(a.position) - parseFloat(b.position);
            });
        }

        // --- Find max total time to set bar scale ---
        var maxTotal = 0;
        for (var mi = 0; mi < this._parsedRows.length; mi++) {
            if (this._parsedRows[mi].total > maxTotal) {
                maxTotal = this._parsedRows[mi].total;
            }
        }
        if (maxTotal <= 0) maxTotal = 1; // guard against all-zero

        // --- Find fastest sector per column for glow effect ---
        var fastS1 = Infinity, fastS2 = Infinity, fastS3 = Infinity;
        for (var fi = 0; fi < this._parsedRows.length; fi++) {
            var fpr = this._parsedRows[fi];
            if (!isNaN(fpr.s1) && fpr.s1 > 0 && fpr.s1 < fastS1) fastS1 = fpr.s1;
            if (!isNaN(fpr.s2) && fpr.s2 > 0 && fpr.s2 < fastS2) fastS2 = fpr.s2;
            if (!isNaN(fpr.s3) && fpr.s3 > 0 && fpr.s3 < fastS3) fastS3 = fpr.s3;
        }
        if (!isFinite(fastS1)) fastS1 = -1;
        if (!isFinite(fastS2)) fastS2 = -1;
        if (!isFinite(fastS3)) fastS3 = -1;

        // --- Layout (B8 — scale from container) ---
        var labelW   = Math.round(w * LABEL_COL_FRAC);
        var lapW     = Math.round(w * LAPTIME_COL_FRAC);
        var barAreaW = w - labelW - lapW;

        // rowH must accommodate all rows + header within h
        // Available height: h - header
        // header ~ rowH * HEADER_H_FRAC
        // visibleCount * (rowH + ROW_GAP) + headerH <= h
        // visibleCount * (rowH + ROW_GAP) + rowH * HEADER_H_FRAC <= h
        // rowH * (visibleCount + HEADER_H_FRAC) + visibleCount * ROW_GAP <= h
        var rowH = Math.floor((h - visibleCount * ROW_GAP) / (visibleCount + HEADER_H_FRAC));
        rowH = Math.max(ROW_H_MIN, Math.min(ROW_H_MAX, rowH));
        var headerH = Math.round(rowH * HEADER_H_FRAC);

        // Font sizes (B8)
        var labelFontSize  = Math.max(8,  Math.round(rowH * 0.40));
        var segFontSize    = Math.max(7,  Math.round(rowH * 0.36));
        var lapFontSize    = Math.max(7,  Math.round(rowH * 0.38));
        var headerFontSize = Math.max(7,  Math.round(headerH * 0.55));

        // Glow intensity from accentIntensity (0-100)
        var glowBlur = Math.round((accentInt / 100) * 10);

        // --- Update tooltip styling from current theme ---
        this._tooltip.style.background = t.panelHi;
        this._tooltip.style.color      = t.text;
        this._tooltip.style.fontFamily = theme.FONTS.data;
        this._tooltip.style.fontSize   = '11px';
        this._tooltip.style.border     = '1px solid ' + theme.withAlpha(t.edge, 0.4);

        // --- Draw header row ---
        // Labels: S1, S2, S3 centred roughly in their expected columns, LAP right-aligned
        var s1HeaderX = labelW + Math.round(barAreaW * 0.17);
        var s2HeaderX = labelW + Math.round(barAreaW * 0.50);
        var s3HeaderX = labelW + Math.round(barAreaW * 0.83);
        var lapHeaderX = w - Math.round(lapW * 0.5);

        ctx.save();
        ctx.font = 'bold ' + headerFontSize + 'px ' + theme.FONTS.ui;
        ctx.fillStyle = theme.withAlpha(t.text, 0.28);
        ctx.textBaseline = 'middle';
        var hCY = Math.round(headerH * 0.5);

        ctx.textAlign = 'left';
        ctx.fillText('DRIVER', Math.round(labelW * 0.04), hCY);

        ctx.textAlign = 'center';
        ctx.fillStyle = theme.withAlpha(s1Color, 0.6);
        ctx.fillText('S1', s1HeaderX, hCY);
        ctx.fillStyle = theme.withAlpha(s2Color, 0.6);
        ctx.fillText('S2', s2HeaderX, hCY);
        ctx.fillStyle = theme.withAlpha(s3Color, 0.6);
        ctx.fillText('S3', s3HeaderX, hCY);

        ctx.textAlign = 'center';
        ctx.fillStyle = theme.withAlpha(t.text, 0.28);
        ctx.fillText('LAP', lapHeaderX, hCY);
        ctx.restore();

        // Separator under header
        ctx.save();
        ctx.strokeStyle = theme.withAlpha(t.edge, 0.5);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, headerH);
        ctx.lineTo(w, headerH);
        ctx.stroke();
        ctx.restore();

        // --- Build hit zones and draw rows ---
        this._hitZones = [];

        var segColors = [s1Color, s2Color, s3Color];
        var segLabels = ['Sector 1', 'Sector 2', 'Sector 3'];

        for (var ri = 0; ri < visibleCount; ri++) {
            var pr2 = this._parsedRows[ri];
            var rowY = headerH + ri * (rowH + ROW_GAP);
            var rowCY = Math.round(rowY + rowH * 0.5);
            var isHovered = (this._hover !== null && this._hover.rowIdx === ri);

            // Subtle alternating row background
            if (ri % 2 === 0) {
                ctx.save();
                ctx.fillStyle = theme.withAlpha(t.panelHi, 0.35);
                ctx.fillRect(0, rowY, w, rowH);
                ctx.restore();
            }
            if (isHovered) {
                ctx.save();
                ctx.fillStyle = theme.withAlpha(t.panelHi, 0.65);
                ctx.fillRect(0, rowY, w, rowH);
                ctx.restore();
            }

            // --- Driver label ---
            ctx.save();
            ctx.font = labelFontSize + 'px ' + theme.FONTS.ui;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            ctx.fillStyle = t.text;
            // Clip to label column
            ctx.beginPath();
            ctx.rect(0, rowY, labelW - 4, rowH);
            ctx.clip();
            ctx.fillText(pr2.driver, Math.round(labelW * 0.04), rowCY);
            ctx.restore();

            // --- Compute segment widths proportional to sector times ---
            var sectorTimes = [
                isNaN(pr2.s1) ? 0 : pr2.s1,
                isNaN(pr2.s2) ? 0 : pr2.s2,
                isNaN(pr2.s3) ? 0 : pr2.s3
            ];
            var sectorStrs = [pr2.s1Str, pr2.s2Str, pr2.s3Str];
            var fastTimes = [fastS1, fastS2, fastS3];

            // Available bar area minus 2 gaps between 3 segments
            var totalGapPx = SEG_GAP * 2;
            var usableBarW = barAreaW - totalGapPx;

            // Proportional widths based on maxTotal (so longest row fills full bar)
            var segWidths = [];
            for (var si = 0; si < 3; si++) {
                var sw = (maxTotal > 0) ? Math.round((sectorTimes[si] / maxTotal) * usableBarW) : 0;
                segWidths.push(sw);
            }

            // Draw 3 segments L to R
            var segX = labelW;
            var barH = Math.round(rowH * 0.75);
            var barOffsetY = rowY + Math.round((rowH - barH) * 0.5);

            for (var si2 = 0; si2 < 3; si2++) {
                var sw2    = segWidths[si2];
                var sColor = segColors[si2];
                var sTime  = sectorTimes[si2];
                var sStr   = sectorStrs[si2];
                var isFastest = (sTime > 0 && sTime === fastTimes[si2]);
                var isSegHover = (this._hover !== null &&
                                  this._hover.rowIdx === ri &&
                                  this._hover.segIdx === si2);

                if (sw2 > 0) {
                    // Register hit zone
                    this._hitZones.push({
                        rowIdx:    ri,
                        segIdx:    si2,
                        x:         segX,
                        y:         rowY,
                        w:         sw2,
                        h:         rowH,
                        sectorLabel: segLabels[si2],
                        sectorTime:  sStr
                    });

                    // Draw segment fill
                    ctx.save();

                    // Fastest sector gets glow (B6 — always reset after)
                    if (isFastest && accentInt > 0) {
                        ctx.shadowColor   = sColor;
                        ctx.shadowBlur    = glowBlur;
                        ctx.shadowOffsetX = 0;
                        ctx.shadowOffsetY = 0;
                    }

                    var alpha = SEG_ALPHA;
                    if (isSegHover) alpha = 1.0;
                    ctx.fillStyle = theme.withAlpha(sColor, alpha);
                    ctx.fillRect(segX, barOffsetY, sw2, barH);

                    // Reset shadow (B6)
                    ctx.shadowBlur    = 0;
                    ctx.shadowColor   = 'transparent';
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;

                    // Fastest sector: small accent line at bottom of bar
                    if (isFastest && accentInt > 0) {
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(segX, barOffsetY + barH - 2, sw2, 2);
                    }

                    // Sector time text inside segment (if wide enough)
                    if (sStr && sw2 > 20) {
                        var textPad = 4;
                        var availTextW = sw2 - textPad * 2;
                        // Try to fit the time text
                        ctx.font = segFontSize + 'px ' + theme.FONTS.data;
                        var textW = ctx.measureText(sStr).width;
                        if (textW <= availTextW) {
                            ctx.fillStyle = 'rgba(255,255,255,0.90)';
                            ctx.textBaseline = 'middle';
                            ctx.textAlign = 'left';
                            ctx.beginPath();
                            ctx.rect(segX, barOffsetY, sw2, barH);
                            ctx.clip();
                            ctx.fillText(sStr, segX + textPad, rowY + rowH * 0.5);
                        }
                    }

                    ctx.restore();
                }

                // Advance X, adding gap after each segment except the last
                segX += sw2;
                if (si2 < 2) {
                    segX += SEG_GAP;
                }
            }

            // --- Lap time at right end ---
            if (pr2.lapTime) {
                ctx.save();
                ctx.font = 'bold ' + lapFontSize + 'px ' + theme.FONTS.data;
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'center';
                ctx.fillStyle = t.textDim;
                ctx.fillText(pr2.lapTime, w - Math.round(lapW * 0.5), rowCY);
                ctx.restore();
            }

            // Separator line under row (not after last)
            if (ri < visibleCount - 1) {
                ctx.save();
                ctx.strokeStyle = theme.withAlpha(t.grid, 0.8);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, rowY + rowH + Math.floor(ROW_GAP * 0.5));
                ctx.lineTo(w, rowY + rowH + Math.floor(ROW_GAP * 0.5));
                ctx.stroke();
                ctx.restore();
            }
        }

        // No-data message
        if (visibleCount === 0) {
            ctx.save();
            ctx.font = Math.max(11, Math.round(h * 0.05)) + 'px ' + theme.FONTS.ui;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.fillStyle = t.textFaint;
            ctx.fillText('No sector data', w / 2, h / 2);
            ctx.restore();
        }

        // Final shadow reset (B6)
        ctx.shadowBlur    = 0;
        ctx.shadowColor   = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Cache layout for hit testing
        this._layoutCache = { w: w, h: h };
        this._themeCache  = t;
    },

    // -------------------------------------------------------------------------
    // Mouse move — hover highlight and tooltip (I1, I2)
    // -------------------------------------------------------------------------

    _onMouseMove: function(e) {
        var rect = this._canvas.getBoundingClientRect();
        var mx   = e.clientX - rect.left;
        var my   = e.clientY - rect.top;
        var hit  = this._hitTest(mx, my);

        var changed = false;
        if (hit) {
            var prev = this._hover;
            if (!prev ||
                prev.rowIdx !== hit.rowIdx ||
                prev.segIdx !== hit.segIdx) {
                this._hover = hit;
                changed = true;
            }
            if (changed && this._lastData && this._lastConfig) {
                this._render(this._lastData, this._lastConfig);
            }
            this._showTooltip(hit, mx, my);
            this._canvas.style.cursor = 'crosshair';
        } else {
            if (this._hover !== null) {
                this._hover = null;
                changed = true;
            }
            if (changed && this._lastData && this._lastConfig) {
                this._render(this._lastData, this._lastConfig);
            }
            this._tooltip.style.display = 'none';
            this._canvas.style.cursor = 'default';
        }
    },

    _hitTest: function(mx, my) {
        for (var i = 0; i < this._hitZones.length; i++) {
            var z = this._hitZones[i];
            if (mx >= z.x && mx < z.x + z.w &&
                my >= z.y && my < z.y + z.h) {
                return z;
            }
        }
        return null;
    },

    _showTooltip: function(hit, mx, my) {
        if (!hit) { this._tooltip.style.display = 'none'; return; }

        var pr = this._parsedRows[hit.rowIdx];
        var driverLine = pr ? pr.driver : '';
        var content = hit.sectorLabel + ': ' + (hit.sectorTime || '—');
        if (driverLine) content = driverLine + '<br>' + content;

        this._tooltip.innerHTML = content;
        this._tooltip.style.display = 'block';

        var tipW = this._tooltip.offsetWidth  || 130;
        var tipH = this._tooltip.offsetHeight || 44;
        var layout = this._layoutCache;
        var panelW = layout ? layout.w : 400;
        var panelH = layout ? layout.h : 300;

        var tx = mx + 14;
        var ty = my - 8;
        if (tx + tipW > panelW - 4) tx = mx - tipW - 14;
        if (ty + tipH > panelH - 4) ty = panelH - tipH - 4;
        if (ty < 0) ty = 4;

        this._tooltip.style.left = tx + 'px';
        this._tooltip.style.top  = ty + 'px';
    },

    // -------------------------------------------------------------------------
    // Cleanup (C5)
    // -------------------------------------------------------------------------

    destroy: function() {
        if (this._tooltip && this._tooltip.parentNode) {
            this._tooltip.parentNode.removeChild(this._tooltip);
        }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }

});
