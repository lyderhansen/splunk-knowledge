var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

// ---------------------------------------------------------------------------
// McLaren F1 Telemetry — timing_tower visualization
// F1 race timing tower: position order leaderboard with gaps, tires, lap times
// ---------------------------------------------------------------------------

// Column layout proportions (of available width)
var COL_POS_W_FRAC  = 0.10;   // position number
var COL_COMP_W_FRAC = 0.05;   // compound dot column
var COL_GAP_W_FRAC  = 0.20;   // gap time
var COL_LAP_W_FRAC  = 0.20;   // lap time (when shown)
// driver name gets the remainder

// Row height bounds
var ROW_H_MIN = 24;
var ROW_H_MAX = 60;

// Header height as fraction of one row height
var HEADER_H_FRAC = 1.0;

// Left glow edge for P1 row
var P1_EDGE_W = 3;

// ---------------------------------------------------------------------------
// Compound -> theme token name
// ---------------------------------------------------------------------------
function compoundColor(compound, t) {
    var c = String(compound || '').toLowerCase();
    if (c === 'soft')   return t.soft;
    if (c === 'medium') return t.medium;
    if (c === 'hard')   return t.hard;
    if (c === 'inter' || c === 'intermediate') return t.inter;
    if (c === 'wet')    return t.wet;
    // fallback: dim text
    return t.textDim;
}

// ---------------------------------------------------------------------------
// Main viz
// ---------------------------------------------------------------------------

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        // Canvas (F10 — no jQuery, DOM only)
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

        // Hit zones: array of {y, h, rowIdx} built each render
        this._hitZones  = [];
        this._parsedRows = [];

        // Hover state
        this._hoverRow = -1;

        // Cache for reflow (C6)
        this._lastData   = null;
        this._lastConfig = null;

        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            if (self._hoverRow !== -1) {
                self._hoverRow = -1;
                if (self._lastData && self._lastConfig) {
                    self._render(self._lastData, self._lastConfig);
                }
            }
            self._tooltip.style.display = 'none';
            self._canvas.style.cursor = 'default';
        });
        this._canvas.addEventListener('click', function(e) {
            self._onClick(e);
        });
    },

    // -------------------------------------------------------------------------
    // Data contract (F4)
    // -------------------------------------------------------------------------

    getInitialDataParams: function() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },

    // -------------------------------------------------------------------------
    // formatData — data processing only, no config reads (B4)
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
        var themeMode    = theme.getOption(config, ns, 'theme',          'dark');
        var t            = theme.getTheme(themeMode);
        var accentColor  = theme.getOption(config, ns, 'accentColor',    '#FF8000');
        var accentInt    = theme.parseNum(theme.getOption(config, ns, 'accentIntensity', '50'), 50);
        var posField     = theme.getOption(config, ns, 'positionField',  'position');
        var driverField  = theme.getOption(config, ns, 'driverField',    'driver');
        var gapField     = theme.getOption(config, ns, 'gapField',       'gap');
        var compField    = theme.getOption(config, ns, 'compoundField',  'compound');
        var lapField     = theme.getOption(config, ns, 'lapTimeField',   'lap_time');
        var showLapTime  = theme.parseBool(theme.getOption(config, ns, 'showLapTime', 'true'), true);
        var maxRows      = theme.parseNum(theme.getOption(config, ns, 'maxRows', '20'), 20);

        // HiDPI canvas (B2)
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

        // ------------------------------------------------------------------
        // Extract rows from data
        // ------------------------------------------------------------------
        var colIdx = (data && data.colIdx) ? data.colIdx : {};
        var rows   = (data && data.rows)   ? data.rows   : [];

        this._parsedRows = [];
        this._driverFieldName = driverField;

        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            var pr = {
                position: (colIdx[posField]   !== undefined) ? String(row[colIdx[posField]]  || '') : '',
                driver:   (colIdx[driverField] !== undefined) ? String(row[colIdx[driverField]] || '') : '',
                gap:      (colIdx[gapField]    !== undefined) ? String(row[colIdx[gapField]]   || '') : '',
                compound: (colIdx[compField]   !== undefined) ? String(row[colIdx[compField]]  || '') : '',
                lapTime:  (colIdx[lapField]    !== undefined) ? String(row[colIdx[lapField]]   || '') : '',
                rowIdx: i
            };
            this._parsedRows.push(pr);
        }

        var totalRows    = this._parsedRows.length;
        var visibleCount = Math.min(totalRows, Math.max(1, maxRows));
        var hasMore      = totalRows > visibleCount;

        // ------------------------------------------------------------------
        // Layout (B8 — all scaled from container)
        // ------------------------------------------------------------------
        var footerH   = hasMore ? Math.max(16, Math.round(h * 0.06)) : 0;
        var availH    = h - footerH;

        // Header occupies one row-equivalent height
        // rowH = (availH - headerH) / (visibleCount + HEADER_H_FRAC)
        // Solving: rowH = availH / (visibleCount + HEADER_H_FRAC)
        var rowH = Math.floor(availH / (visibleCount + HEADER_H_FRAC));
        rowH = Math.max(ROW_H_MIN, Math.min(ROW_H_MAX, rowH));
        var headerH = rowH;  // header same height as a row

        // Column widths (px)
        var colPosW  = Math.round(w * COL_POS_W_FRAC);
        var colCompW = Math.round(w * COL_COMP_W_FRAC);
        var colGapW  = Math.round(w * COL_GAP_W_FRAC);
        var colLapW  = showLapTime ? Math.round(w * COL_LAP_W_FRAC) : 0;
        var colDrvW  = w - colPosW - colCompW - colGapW - colLapW;

        // Font sizes derived from rowH
        var headerFontSize = Math.max(7,  Math.round(rowH * 0.38));
        var posFontSize    = Math.max(10, Math.round(rowH * 0.52));
        var driverFontSize = Math.max(9,  Math.round(rowH * 0.44));
        var gapFontSize    = Math.max(8,  Math.round(rowH * 0.40));
        var lapFontSize    = Math.max(8,  Math.round(rowH * 0.38));
        var footerFontSize = Math.max(7,  Math.round(footerH * 0.55));

        // Glow intensity
        var glowBlur   = Math.round((accentInt / 100) * 8);

        // ------------------------------------------------------------------
        // Update tooltip styling with current theme
        // ------------------------------------------------------------------
        this._tooltip.style.background  = t.panelHi;
        this._tooltip.style.color       = t.text;
        this._tooltip.style.fontFamily  = theme.FONTS.data;
        this._tooltip.style.fontSize    = '11px';
        this._tooltip.style.border      = '1px solid ' + theme.withAlpha(accentColor, 0.3);

        // ------------------------------------------------------------------
        // Draw header row
        // ------------------------------------------------------------------
        var headerY = 0;
        var textCenterY = Math.round(headerY + headerH * 0.5);

        ctx.save();
        ctx.fillStyle = t.panelHi;
        ctx.fillRect(0, headerY, w, headerH);
        ctx.restore();

        ctx.save();
        ctx.font = 'bold ' + headerFontSize + 'px ' + theme.FONTS.ui;
        ctx.fillStyle = theme.withAlpha(t.text, 0.28);
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';

        // POS header
        ctx.fillText('POS', Math.round(colPosW * 0.15), textCenterY);

        // DRIVER header — left of driver col
        ctx.fillText('DRIVER', colPosW + Math.round(colDrvW * 0.02), textCenterY);

        // COMPOUND header — centred in compound col
        ctx.textAlign = 'center';
        ctx.fillText('TYR', colPosW + colDrvW + Math.round(colCompW * 0.5), textCenterY);

        // GAP header — right-aligned
        ctx.textAlign = 'right';
        ctx.fillText('GAP', colPosW + colDrvW + colCompW + colGapW - 4, textCenterY);

        // LAP TIME header
        if (showLapTime) {
            ctx.fillText('LAP TIME', w - 4, textCenterY);
        }
        ctx.restore();

        // Separator line under header
        ctx.save();
        ctx.strokeStyle = theme.withAlpha(t.edge, 0.6);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, headerH);
        ctx.lineTo(w, headerH);
        ctx.stroke();
        ctx.restore();

        // ------------------------------------------------------------------
        // Build hit zones and draw data rows
        // ------------------------------------------------------------------
        this._hitZones = [];

        for (var ri = 0; ri < visibleCount; ri++) {
            var pr2   = this._parsedRows[ri];
            var rowY  = headerH + ri * rowH;
            var rowCY = Math.round(rowY + rowH * 0.5);
            var isP1  = (pr2.position === 'P1');
            var isTop3 = (pr2.position === 'P1' || pr2.position === 'P2' || pr2.position === 'P3');
            var isHovered = (this._hoverRow === ri);
            var isOdd = (ri % 2 === 1);

            // Store hit zone
            this._hitZones.push({ y: rowY, h: rowH, rowIdx: ri });

            // Row background
            ctx.save();
            if (isHovered) {
                ctx.fillStyle = theme.withAlpha(accentColor, 0.12);
            } else if (isOdd) {
                ctx.fillStyle = theme.withAlpha(t.panelHi, 0.55);
            } else {
                ctx.fillStyle = 'transparent';
            }
            if (ctx.fillStyle !== 'transparent') {
                ctx.fillRect(0, rowY, w, rowH);
            }
            ctx.restore();

            // P1 left edge glow
            if (isP1 && accentInt > 0) {
                ctx.save();
                ctx.shadowColor   = accentColor;
                ctx.shadowBlur    = glowBlur;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                ctx.fillStyle = accentColor;
                ctx.fillRect(0, rowY, P1_EDGE_W, rowH);
                // Reset shadow (B6)
                ctx.shadowBlur    = 0;
                ctx.shadowColor   = 'transparent';
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                ctx.restore();
            }

            // -----------------------------------------------------------
            // Position number
            // -----------------------------------------------------------
            ctx.save();
            ctx.font = 'bold ' + posFontSize + 'px ' + theme.FONTS.data;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            if (isTop3) {
                ctx.fillStyle = accentColor;
            } else {
                ctx.fillStyle = t.textDim;
            }
            ctx.fillText(pr2.position, Math.round(colPosW * 0.12), rowCY);
            ctx.restore();

            // -----------------------------------------------------------
            // Driver name
            // -----------------------------------------------------------
            ctx.save();
            ctx.font = driverFontSize + 'px ' + theme.FONTS.ui;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            ctx.fillStyle = t.text;
            // Clip to column
            ctx.beginPath();
            ctx.rect(colPosW, rowY, colDrvW - 4, rowH);
            ctx.clip();
            ctx.fillText(pr2.driver, colPosW + Math.round(colDrvW * 0.02), rowCY);
            ctx.restore();

            // -----------------------------------------------------------
            // Tire compound dot
            // -----------------------------------------------------------
            var dotCX = colPosW + colDrvW + Math.round(colCompW * 0.5);
            var dotR  = Math.max(4, Math.round(rowH * 0.22));
            ctx.save();
            ctx.beginPath();
            ctx.arc(dotCX, rowCY, dotR, 0, Math.PI * 2);
            ctx.fillStyle = compoundColor(pr2.compound, t);
            ctx.fill();
            // For Hard compound (white), add a subtle border for visibility
            if (String(pr2.compound).toLowerCase() === 'hard') {
                ctx.strokeStyle = t.textDim;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            ctx.restore();

            // -----------------------------------------------------------
            // Gap
            // -----------------------------------------------------------
            var gapX = colPosW + colDrvW + colCompW + colGapW - 4;
            ctx.save();
            ctx.font = gapFontSize + 'px ' + theme.FONTS.data;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'right';
            if (isP1 || String(pr2.gap).toUpperCase() === 'LEADER') {
                ctx.fillStyle = accentColor;
                ctx.font = 'bold ' + gapFontSize + 'px ' + theme.FONTS.data;
                ctx.fillText('LEADER', gapX, rowCY);
            } else {
                ctx.fillStyle = t.textDim;
                ctx.fillText(pr2.gap, gapX, rowCY);
            }
            ctx.restore();

            // -----------------------------------------------------------
            // Lap time
            // -----------------------------------------------------------
            if (showLapTime && pr2.lapTime) {
                ctx.save();
                ctx.font = lapFontSize + 'px ' + theme.FONTS.data;
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'right';
                ctx.fillStyle = t.textDim;
                ctx.fillText(pr2.lapTime, w - 4, rowCY);
                ctx.restore();
            }

            // Separator under each row (except last visible)
            if (ri < visibleCount - 1) {
                ctx.save();
                ctx.strokeStyle = theme.withAlpha(t.grid, 0.8);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, rowY + rowH);
                ctx.lineTo(w, rowY + rowH);
                ctx.stroke();
                ctx.restore();
            }
        }

        // ------------------------------------------------------------------
        // "... +X more" footer indicator
        // ------------------------------------------------------------------
        if (hasMore) {
            var moreCount = totalRows - visibleCount;
            var footerY   = h - footerH;
            ctx.save();
            ctx.fillStyle = theme.withAlpha(t.panelHi, 0.7);
            ctx.fillRect(0, footerY, w, footerH);
            ctx.font = footerFontSize + 'px ' + theme.FONTS.ui;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.fillStyle = t.textFaint;
            ctx.fillText('... +' + moreCount + ' more', w / 2, footerY + footerH / 2);
            ctx.restore();
        }

        // Reset canvas shadow state (B6)
        ctx.shadowBlur    = 0;
        ctx.shadowColor   = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Store layout params for hit testing
        this._layoutCache = {
            headerH:    headerH,
            rowH:       rowH,
            visibleCount: visibleCount,
            colPosW:    colPosW,
            colDrvW:    colDrvW,
            colCompW:   colCompW,
            colGapW:    colGapW,
            colLapW:    colLapW,
            showLapTime: showLapTime,
            w: w,
            h: h
        };
        this._themeCache = t;
        this._accentCache = accentColor;
    },

    // -------------------------------------------------------------------------
    // Mouse move — hover highlight + tooltip (I1)
    // -------------------------------------------------------------------------

    _onMouseMove: function(e) {
        var rect = this._canvas.getBoundingClientRect();
        var mx   = e.clientX - rect.left;
        var my   = e.clientY - rect.top;
        var hit  = this._hitTest(my);

        if (hit >= 0) {
            if (this._hoverRow !== hit) {
                this._hoverRow = hit;
                if (this._lastData && this._lastConfig) {
                    this._render(this._lastData, this._lastConfig);
                }
            }
            this._showTooltip(hit, mx, my);
            this._canvas.style.cursor = 'pointer';
        } else {
            if (this._hoverRow !== -1) {
                this._hoverRow = -1;
                if (this._lastData && this._lastConfig) {
                    this._render(this._lastData, this._lastConfig);
                }
            }
            this._tooltip.style.display = 'none';
            this._canvas.style.cursor = 'default';
        }
    },

    _hitTest: function(my) {
        var layout = this._layoutCache;
        if (!layout) return -1;
        if (my < layout.headerH) return -1;
        for (var i = 0; i < this._hitZones.length; i++) {
            var z = this._hitZones[i];
            if (my >= z.y && my < z.y + z.h) {
                return z.rowIdx;
            }
        }
        return -1;
    },

    _showTooltip: function(rowIdx, mx, my) {
        var pr = this._parsedRows[rowIdx];
        if (!pr) { this._tooltip.style.display = 'none'; return; }

        var lines = [];
        if (pr.driver)   lines.push(pr.position + '  ' + pr.driver);
        if (pr.compound) lines.push('Tyre: ' + pr.compound);
        if (pr.gap)      lines.push('Gap: ' + (String(pr.gap).toUpperCase() === 'LEADER' ? 'LEADER' : pr.gap));
        if (pr.lapTime)  lines.push('Lap: ' + pr.lapTime);

        this._tooltip.innerHTML = lines.join('<br>');
        this._tooltip.style.display = 'block';

        var tipW = this._tooltip.offsetWidth  || 120;
        var tipH = this._tooltip.offsetHeight || 60;
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
    // Click — drilldown on driver name (C3, C4)
    // -------------------------------------------------------------------------

    _onClick: function(e) {
        var rect = this._canvas.getBoundingClientRect();
        var my   = e.clientY - rect.top;
        var hit  = this._hitTest(my);
        if (hit < 0) return;

        var pr = this._parsedRows[hit];
        if (!pr || !pr.driver) return;

        var driverFieldName = this._driverFieldName || 'driver';
        var driverName = pr.driver;
        var self = this;
        try {
            self.drilldown({
                action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
                data: { 'click.name': driverFieldName, 'click.value': driverName }
            }, e);
        } catch (err) { /* test harness has no drilldown infra */ }
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
