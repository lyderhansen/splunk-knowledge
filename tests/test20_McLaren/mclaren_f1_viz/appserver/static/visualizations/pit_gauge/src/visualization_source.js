var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

// ---------------------------------------------------------------------------
// McLaren F1 Telemetry — pit_gauge visualization
// Horizontal gauge showing pit stop times per driver, sorted fastest first.
// Each row: driver + lap label, bar gauge with target zone, time value,
// and a positions-lost badge.
// ---------------------------------------------------------------------------

// Row height bounds (CSS px)
var ROW_H_MIN = 36;
var ROW_H_MAX = 72;

// Gap between rows (CSS px)
var ROW_GAP = 6;

// Driver label column as fraction of total width
var LABEL_COL_FRAC = 0.22;

// Time value column on right side of bar (px, measured from right of bar)
var TIME_BADGE_W = 54;

// Pill badge dimensions
var BADGE_H_FRAC   = 0.38;   // fraction of rowH
var BADGE_MIN_H    = 14;
var BADGE_PAD_X    = 7;

// Carbon-fiber line colour (faint, decorative)
var CARBON_ALPHA   = 0.06;

// Bar track height as fraction of rowH
var TRACK_H_FRAC   = 0.28;
var TRACK_MIN_H    = 4;
var TRACK_MAX_H    = 14;

// Target zone alpha
var TARGET_ALPHA   = 0.18;

// Header height (one row equivalent)
var HEADER_H_FRAC  = 0.75;

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

        // Canvas — manual creation (B17 corollary)
        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'display:block;width:100%;height:100%;';
        this.el.appendChild(this._canvas);

        // Tooltip (I1)
        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 12px;border-radius:2px;' +
            'pointer-events:none;white-space:nowrap;z-index:100;font-size:11px;' +
            'line-height:1.7;';
        this.el.appendChild(this._tooltip);

        // Hover state
        this._hoverRow  = -1;
        this._hitZones  = [];
        this._parsedRows = [];

        // Reflow cache (C6)
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

        // --- Config reads (all via getOption, all in updateView/render) ---
        var themeMode         = theme.getOption(config, ns, 'theme',              'dark');
        var accentColor       = theme.getOption(config, ns, 'accentColor',        '#FF8000');
        var accentInt         = theme.parseNum(theme.getOption(config, ns, 'accentIntensity', '50'), 50);
        var driverField       = theme.getOption(config, ns, 'driverField',        'driver');
        var pitTimeField      = theme.getOption(config, ns, 'pitTimeField',       'pit_time');
        var lapField          = theme.getOption(config, ns, 'lapField',           'lap');
        var posLostField      = theme.getOption(config, ns, 'positionsLostField', 'positions_lost');
        var targetMin         = theme.parseNum(theme.getOption(config, ns, 'targetMin',  '2.0'), 2.0);
        var targetMax         = theme.parseNum(theme.getOption(config, ns, 'targetMax',  '2.8'), 2.8);
        var maxTimeOpt        = theme.parseNum(theme.getOption(config, ns, 'maxTime',    '5.0'), 5.0);

        var t = theme.getTheme(themeMode);

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

        // Clear (B13)
        ctx.clearRect(0, 0, w, h);

        // --- Extract + parse rows ---
        var colIdx   = (data && data.colIdx) ? data.colIdx : {};
        var rawRows  = (data && data.rows)   ? data.rows   : [];

        this._parsedRows = [];
        var hasPosLostField = (colIdx[posLostField] !== undefined);

        for (var i = 0; i < rawRows.length; i++) {
            var row = rawRows[i];
            var pitTimeRaw = (colIdx[pitTimeField] !== undefined)
                ? String(row[colIdx[pitTimeField]] || '0')
                : '0';
            var pitTimeVal = parseFloat(pitTimeRaw);
            if (isNaN(pitTimeVal)) pitTimeVal = 0;

            var posLostRaw = hasPosLostField
                ? String(row[colIdx[posLostField]] || '0')
                : null;
            var posLostVal = (posLostRaw !== null) ? parseInt(posLostRaw, 10) : null;
            if (isNaN(posLostVal)) posLostVal = null;

            this._parsedRows.push({
                driver:       (colIdx[driverField]  !== undefined) ? String(row[colIdx[driverField]]  || '') : '',
                pitTime:      pitTimeVal,
                pitTimeStr:   pitTimeRaw,
                lap:          (colIdx[lapField]     !== undefined) ? String(row[colIdx[lapField]]     || '') : '',
                posLost:      posLostVal,
                hasPosLost:   (posLostRaw !== null),
                rowIdx:       i
            });
        }

        // Sort ascending by pitTime (fastest first)
        this._parsedRows.sort(function(a, b) { return a.pitTime - b.pitTime; });

        var totalRows = this._parsedRows.length;

        // Derive maxTime from data + config floor
        var dataMax = 0;
        for (var ii = 0; ii < this._parsedRows.length; ii++) {
            if (this._parsedRows[ii].pitTime > dataMax) {
                dataMax = this._parsedRows[ii].pitTime;
            }
        }
        var maxTime = Math.max(maxTimeOpt, dataMax * 1.05, 3.0);

        // --- Layout (B8 — scale from container) ---
        var headerH = 0;
        var hasRows = totalRows > 0;

        // Compute ideal rowH from available space
        var availH = h;
        var rawRowH = hasRows
            ? Math.floor((availH - ROW_GAP * (totalRows - 1)) / totalRows)
            : ROW_H_MAX;
        var rowH = Math.max(ROW_H_MIN, Math.min(ROW_H_MAX, rawRowH));

        var trackH = Math.max(TRACK_MIN_H, Math.min(TRACK_MAX_H, Math.round(rowH * TRACK_H_FRAC)));

        var labelW  = Math.round(w * LABEL_COL_FRAC);
        var padX    = Math.max(8, Math.round(w * 0.018));
        var badgeAreaW = Math.round(w * 0.09);
        var barZoneW   = w - labelW - padX - badgeAreaW;

        // Font sizes (B8)
        var driverFontSize = Math.max(8,  Math.round(rowH * 0.30));
        var lapFontSize    = Math.max(7,  Math.round(rowH * 0.24));
        var timeFontSize   = Math.max(8,  Math.round(rowH * 0.28));
        var badgeFontSize  = Math.max(7,  Math.round(rowH * 0.26));
        var headerFontSize = Math.max(7,  Math.round(rowH * 0.26));
        var badgeH         = Math.max(BADGE_MIN_H, Math.round(rowH * BADGE_H_FRAC));

        // Glow intensity from accentIntensity
        var glowBlur = Math.round((accentInt / 100) * 10);

        // --- Update tooltip styling from current theme ---
        this._tooltip.style.background  = t.panelHi;
        this._tooltip.style.color       = t.text;
        this._tooltip.style.fontFamily  = theme.FONTS.data;
        this._tooltip.style.fontSize    = '11px';
        this._tooltip.style.border      = '1px solid ' + theme.withAlpha(accentColor, 0.35);

        // --- No data placeholder ---
        if (!hasRows) {
            ctx.font = '13px ' + theme.FONTS.ui;
            ctx.fillStyle = t.textFaint;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('No pit stop data', w / 2, h / 2);
            return;
        }

        // --- Target zone pixel positions on the bar ---
        var targetMinPct = targetMin / maxTime;
        var targetMaxPct = targetMax / maxTime;

        // --- Draw header labels ---
        var headerY = Math.round((rowH - 20) / 2);
        if (headerY < 0) headerY = 2;
        ctx.save();
        ctx.font = 'bold ' + headerFontSize + 'px ' + theme.FONTS.ui;
        ctx.fillStyle = theme.withAlpha(t.text, 0.28);
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.fillText('DRIVER', padX, 0);
        ctx.textAlign = 'left';
        var barStartX = labelW + padX;
        ctx.fillText('PIT TIME', barStartX, 0);
        ctx.textAlign = 'right';
        ctx.fillText('POS', w - padX, 0);
        ctx.restore();

        // Account for header if we wrote one
        var dataOffsetY = (rowH > 50) ? Math.round(headerFontSize + 6) : 0;
        availH = h - dataOffsetY;

        // Recompute rowH with data area
        rawRowH = Math.floor((availH - ROW_GAP * (totalRows - 1)) / totalRows);
        rowH = Math.max(ROW_H_MIN, Math.min(ROW_H_MAX, rawRowH));
        trackH = Math.max(TRACK_MIN_H, Math.min(TRACK_MAX_H, Math.round(rowH * TRACK_H_FRAC)));
        driverFontSize = Math.max(8,  Math.round(rowH * 0.30));
        lapFontSize    = Math.max(7,  Math.round(rowH * 0.24));
        timeFontSize   = Math.max(8,  Math.round(rowH * 0.28));
        badgeFontSize  = Math.max(7,  Math.round(rowH * 0.26));
        badgeH         = Math.max(BADGE_MIN_H, Math.round(rowH * BADGE_H_FRAC));

        // Reset hit zones
        this._hitZones = [];

        // --- Draw each row ---
        for (var ri = 0; ri < totalRows; ri++) {
            var pr       = this._parsedRows[ri];
            var rowY     = dataOffsetY + ri * (rowH + ROW_GAP);
            var isHovered = (this._hoverRow === ri);

            // Store hit zone
            this._hitZones.push({ y: rowY, h: rowH, rowIdx: ri });

            // ---------------------------------------------------------------
            // Row background: carbon-weave hint
            // ---------------------------------------------------------------
            ctx.save();
            if (isHovered) {
                ctx.fillStyle = theme.withAlpha(accentColor, 0.08);
            } else {
                ctx.fillStyle = theme.withAlpha(t.panelHi, 0.45);
            }
            ctx.fillRect(0, rowY, w, rowH);
            ctx.restore();

            // Subtle carbon-fiber diagonal lines (decorative)
            if (accentInt > 20) {
                ctx.save();
                ctx.strokeStyle = theme.withAlpha(t.text, CARBON_ALPHA);
                ctx.lineWidth = 0.5;
                var lineSpacing = 8;
                ctx.beginPath();
                for (var lx = 0; lx < w + rowH; lx += lineSpacing) {
                    ctx.moveTo(lx, rowY);
                    ctx.lineTo(lx - rowH, rowY + rowH);
                }
                ctx.stroke();
                ctx.restore();
            }

            // ---------------------------------------------------------------
            // Row top line (separator)
            // ---------------------------------------------------------------
            if (ri > 0) {
                ctx.save();
                ctx.strokeStyle = theme.withAlpha(t.edge, 0.5);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, rowY);
                ctx.lineTo(w, rowY);
                ctx.stroke();
                ctx.restore();
            }

            // ---------------------------------------------------------------
            // Left accent bar for fastest stop (rank 0)
            // ---------------------------------------------------------------
            if (ri === 0 && accentInt > 0) {
                ctx.save();
                ctx.shadowColor   = accentColor;
                ctx.shadowBlur    = glowBlur;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                ctx.fillStyle = accentColor;
                ctx.fillRect(0, rowY, 3, rowH);
                // Reset shadow state (B6)
                ctx.shadowBlur    = 0;
                ctx.shadowColor   = 'transparent';
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                ctx.restore();
            }

            // ---------------------------------------------------------------
            // Driver name (left column, line 1)
            // ---------------------------------------------------------------
            var line1Y = rowY + Math.round(rowH * 0.30);
            var line2Y = rowY + Math.round(rowH * 0.68);

            // Clip driver label to column width
            ctx.save();
            ctx.beginPath();
            ctx.rect(padX, rowY, labelW - padX - 2, rowH);
            ctx.clip();
            ctx.font = 'bold ' + driverFontSize + 'px ' + theme.FONTS.ui;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            ctx.fillStyle = (ri === 0) ? accentColor : t.text;
            ctx.fillText(pr.driver || '—', padX, line1Y);
            ctx.restore();

            // "Lap N" label (right-aligned in label column, same line)
            if (pr.lap) {
                ctx.save();
                ctx.font = lapFontSize + 'px ' + theme.FONTS.ui;
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'right';
                ctx.fillStyle = t.textFaint;
                ctx.fillText('Lap ' + pr.lap, labelW - 2, line1Y);
                ctx.restore();
            }

            // ---------------------------------------------------------------
            // Bar gauge area
            // ---------------------------------------------------------------
            var barStartX = labelW + padX;
            var barEndX   = w - badgeAreaW - padX;
            var barW      = barEndX - barStartX;
            var barCY     = line2Y;
            var trackY    = barCY - Math.round(trackH / 2);

            // Track background (full width, dark at 6% opacity)
            ctx.save();
            ctx.fillStyle = theme.withAlpha(t.text, 0.06);
            ctx.fillRect(barStartX, trackY, barW, trackH);
            ctx.restore();

            // Target zone band (targetMin -> targetMax)
            var tzX1 = barStartX + Math.round(targetMinPct * barW);
            var tzX2 = barStartX + Math.round(targetMaxPct * barW);
            var tzW  = tzX2 - tzX1;
            if (tzW > 0) {
                ctx.save();
                ctx.fillStyle = theme.withAlpha(t.safe, TARGET_ALPHA);
                ctx.fillRect(tzX1, trackY, tzW, trackH);
                // Target zone left tick
                ctx.strokeStyle = theme.withAlpha(t.safe, 0.45);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(tzX1, barCY - Math.round(trackH * 0.7));
                ctx.lineTo(tzX1, barCY + Math.round(trackH * 0.7));
                ctx.stroke();
                // Target zone right tick
                ctx.beginPath();
                ctx.moveTo(tzX2, barCY - Math.round(trackH * 0.7));
                ctx.lineTo(tzX2, barCY + Math.round(trackH * 0.7));
                ctx.stroke();
                ctx.restore();
            }

            // Fill bar — width proportional to pitTime / maxTime
            var fillPct   = Math.min(1, pr.pitTime / maxTime);
            var fillW     = Math.max(2, Math.round(fillPct * barW));

            // Fill color: accent for on-target, lerp to danger for over target
            var fillColor;
            if (pr.pitTime <= targetMax) {
                fillColor = accentColor;
            } else {
                var overPct = (pr.pitTime - targetMax) / Math.max(0.01, maxTime - targetMax);
                fillColor = theme.lerpColor(accentColor, t.danger, Math.min(1, overPct));
            }

            // Draw fill bar
            ctx.save();
            // Subtle glow on hover
            if (isHovered && accentInt > 0) {
                ctx.shadowColor   = fillColor;
                ctx.shadowBlur    = Math.round(glowBlur * 0.6);
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            }
            ctx.fillStyle = fillColor;
            ctx.fillRect(barStartX, trackY, fillW, trackH);
            // Reset shadow (B6)
            ctx.shadowBlur    = 0;
            ctx.shadowColor   = 'transparent';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.restore();

            // Pit time value — shown at end of fill bar (or minimum offset)
            var timeX   = barStartX + fillW + 4;
            var timeStr = pr.pitTime.toFixed(2) + 's';
            ctx.save();
            ctx.font = 'bold ' + timeFontSize + 'px ' + theme.FONTS.data;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            ctx.fillStyle = (pr.pitTime <= targetMax) ? accentColor : theme.withAlpha(t.danger, 0.9);
            // Clamp so it stays in bar zone
            var measuredTimeW = ctx.measureText(timeStr).width;
            if (timeX + measuredTimeW > barEndX) {
                timeX = barEndX - measuredTimeW - 2;
            }
            ctx.fillText(timeStr, timeX, barCY);
            ctx.restore();

            // ---------------------------------------------------------------
            // Positions lost badge
            // ---------------------------------------------------------------
            if (pr.hasPosLost) {
                var badgeCX = w - padX - Math.round(badgeAreaW * 0.5);
                var badgeCY = barCY;

                if (pr.posLost === 0) {
                    // Small "OK" badge in safe green
                    ctx.save();
                    ctx.font = 'bold ' + badgeFontSize + 'px ' + theme.FONTS.ui;
                    ctx.textBaseline = 'middle';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = t.safe;
                    ctx.fillText('OK', badgeCX, badgeCY);
                    ctx.restore();
                } else if (pr.posLost > 0) {
                    // Red pill with white "−N" text
                    var badgeLabel = '−' + String(pr.posLost);
                    ctx.save();
                    ctx.font = 'bold ' + badgeFontSize + 'px ' + theme.FONTS.ui;
                    var badgeLabelW = ctx.measureText(badgeLabel).width;
                    var pillW = badgeLabelW + BADGE_PAD_X * 2;
                    var pillX = badgeCX - Math.round(pillW / 2);
                    var pillY = badgeCY - Math.round(badgeH / 2);

                    // Pill fill (rx = badgeH/2 for pill shape)
                    theme.roundRect(ctx, pillX, pillY, pillW, badgeH, badgeH / 2);
                    ctx.fillStyle = t.danger;
                    ctx.fill();

                    // Pill text
                    ctx.font = 'bold ' + badgeFontSize + 'px ' + theme.FONTS.ui;
                    ctx.textBaseline = 'middle';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillText(badgeLabel, badgeCX, badgeCY);
                    ctx.restore();
                }
            }
        }

        // --- Final shadow state reset (B6) ---
        ctx.shadowBlur    = 0;
        ctx.shadowColor   = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // --- Store layout for hit testing ---
        this._layoutCache = {
            dataOffsetY: dataOffsetY,
            rowH:        rowH,
            totalRows:   totalRows,
            w: w,
            h: h
        };
        this._themeCache  = t;
        this._accentCache = accentColor;
    },

    // -------------------------------------------------------------------------
    // Mouse move — hover highlight + tooltip (I1)
    // -------------------------------------------------------------------------

    _onMouseMove: function(e) {
        var rect = this._canvas.getBoundingClientRect();
        var mx   = e.clientX - rect.left;
        var my   = e.clientY - rect.top;
        var hit  = this._hitTest(mx, my);

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

    _hitTest: function(mx, my) {
        for (var i = 0; i < this._hitZones.length; i++) {
            var z = this._hitZones[i];
            if (my >= z.y && my < z.y + z.h) {
                return i;
            }
        }
        return -1;
    },

    _showTooltip: function(rowIdx, mx, my) {
        var pr = this._parsedRows[rowIdx];
        if (!pr) { this._tooltip.style.display = 'none'; return; }

        var lines = [];
        if (pr.driver) {
            lines.push('<b>' + pr.driver + '</b>');
        }
        if (pr.lap) {
            lines.push('Lap: ' + pr.lap);
        }
        lines.push('Pit time: ' + pr.pitTime.toFixed(3) + 's');
        if (pr.hasPosLost) {
            if (pr.posLost === 0) {
                lines.push('Positions: No change');
            } else {
                lines.push('Positions lost: ' + pr.posLost);
            }
        }

        this._tooltip.innerHTML = lines.join('<br>');
        this._tooltip.style.display = 'block';

        var tipW   = this._tooltip.offsetWidth  || 140;
        var tipH   = this._tooltip.offsetHeight || 60;
        var layout = this._layoutCache;
        var panelW = layout ? layout.w : 400;
        var panelH = layout ? layout.h : 300;

        var tx = mx + 14;
        var ty = my - 8;
        if (tx + tipW > panelW - 4) { tx = mx - tipW - 14; }
        if (ty + tipH > panelH - 4) { ty = panelH - tipH - 4; }
        if (ty < 0) { ty = 4; }

        this._tooltip.style.left = tx + 'px';
        this._tooltip.style.top  = ty + 'px';
    },

    // -------------------------------------------------------------------------
    // Click — drilldown on driver row (C3, C4)
    // -------------------------------------------------------------------------

    _onClick: function(e) {
        var rect = this._canvas.getBoundingClientRect();
        var my   = e.clientY - rect.top;
        var mx   = e.clientX - rect.left;
        var hit  = this._hitTest(mx, my);
        if (hit < 0) return;

        var pr = this._parsedRows[hit];
        if (!pr || !pr.driver) return;

        var self = this;
        try {
            self.drilldown({
                action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
                data: { 'click.name': 'driver', 'click.value': pr.driver }
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
