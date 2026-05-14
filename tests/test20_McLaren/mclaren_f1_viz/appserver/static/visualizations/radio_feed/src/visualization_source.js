// McLaren F1 Telemetry — radio_feed visualization
// Scrolling team radio message feed — pit-wall comms log style.
// Each row: priority-colored left border | timestamp | driver badge | message text

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Extract "HH:MM:SS" from "_time" strings like "2024-03-10 15:42:18"
function formatTime(timeStr) {
    if (!timeStr) return '';
    var s = String(timeStr);
    var parts = s.split(' ');
    if (parts.length >= 2) return parts[1];
    // Handle ISO 8601: "2024-03-10T15:42:18"
    var tParts = s.split('T');
    if (tParts.length >= 2) {
        // strip timezone suffix if present
        return tParts[1].replace(/[Z\+\-].*$/, '').slice(0, 8);
    }
    return s;
}

// Map priority string to theme token
function priorityColor(t, priority) {
    var p = String(priority || '').toLowerCase();
    if (p === 'critical' || p === 'crit') return t.danger;
    if (p === 'warning'  || p === 'warn') return t.accent;
    return t.accent2; // info (default)
}

// Simple text truncation using canvas measureText
function truncateText(ctx, text, maxWidth) {
    var measured = ctx.measureText(text).width;
    if (measured <= maxWidth) return { text: text, truncated: false };
    var ellipsis = '...';
    var ellipsisW = ctx.measureText(ellipsis).width;
    var available = maxWidth - ellipsisW;
    if (available <= 0) return { text: ellipsis, truncated: true };
    var truncated = text;
    while (truncated.length > 0 && ctx.measureText(truncated).width > available) {
        truncated = truncated.slice(0, -1);
    }
    return { text: truncated + ellipsis, truncated: true, full: text };
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

        // Tooltip DOM element (I1)
        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 10px;border-radius:3px;' +
            'pointer-events:none;white-space:pre-wrap;max-width:280px;word-break:break-word;' +
            'z-index:100;font-size:11px;line-height:1.5;';
        this.el.appendChild(this._tooltip);

        // Hit zones: array of {y, h, rowIdx, driver, message, fullMessage}
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

        // — Config reads (all via getOption — B3) —
        var themeMode       = theme.getOption(config, ns, 'theme',          'dark');
        var timeField       = theme.getOption(config, ns, 'timeField',      '_time');
        var driverField     = theme.getOption(config, ns, 'driverField',    'driver');
        var messageField    = theme.getOption(config, ns, 'messageField',   'message');
        var priorityField   = theme.getOption(config, ns, 'priorityField',  'priority');
        var accentColor     = theme.getOption(config, ns, 'accentColor',    '#FF8000');
        var maxMessages     = theme.parseNum(theme.getOption(config, ns, 'maxMessages',  '20'), 20);
        var showHeader      = theme.parseBool(theme.getOption(config, ns, 'showHeader',   'true'), true);
        var accentIntensity = theme.parseNum(theme.getOption(config, ns, 'accentIntensity', '50'), 50);

        var t = theme.getTheme(themeMode);

        // HiDPI canvas setup (B2) — manual since we own the canvas
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

        // Store fields used by click handler
        this._driverFieldName = driverField;

        // ------------------------------------------------------------------
        // Extract and sort rows — most recent first (descending _time)
        // ------------------------------------------------------------------
        var colIdx = (data && data.colIdx) ? data.colIdx : {};
        var rawRows = (data && data.rows)  ? data.rows   : [];

        // Build message objects
        var messages = [];
        for (var i = 0; i < rawRows.length; i++) {
            var row = rawRows[i];
            var timeVal     = (colIdx[timeField]    !== undefined) ? String(row[colIdx[timeField]]    || '') : '';
            var driverVal   = (colIdx[driverField]  !== undefined) ? String(row[colIdx[driverField]]  || '') : '';
            var messageVal  = (colIdx[messageField] !== undefined) ? String(row[colIdx[messageField]] || '') : '';
            var priorityVal = (colIdx[priorityField]!== undefined) ? String(row[colIdx[priorityField]]|| 'info') : 'info';
            messages.push({
                timeRaw:  timeVal,
                timeStr:  formatTime(timeVal),
                driver:   driverVal,
                message:  messageVal,
                priority: priorityVal,
                rowIdx:   i
            });
        }

        // Sort by _time descending (most recent first)
        messages.sort(function(a, b) {
            if (a.timeRaw > b.timeRaw) return -1;
            if (a.timeRaw < b.timeRaw) return 1;
            // Preserve original order for ties (most-recently-appended row first)
            return b.rowIdx - a.rowIdx;
        });

        this._parsedRows = messages;

        var totalCount   = messages.length;
        var visibleCount = Math.min(totalCount, Math.max(1, maxMessages));
        var hasMore      = totalCount > visibleCount;

        // ------------------------------------------------------------------
        // Layout (B8 — all scaled from container)
        // ------------------------------------------------------------------
        var BORDER_W  = 4;   // priority-colored left border width (px)
        var BORDER_GAP = 8;  // gap after left border
        var COL_GAP   = 12;  // gap between columns within a row
        var ROW_GAP   = 4;   // gap between rows
        var HEADER_H  = showHeader ? Math.max(18, Math.round(h * 0.07)) : 0;
        var FOOTER_H  = hasMore    ? Math.max(14, Math.round(h * 0.06)) : 0;
        var availH    = h - HEADER_H - FOOTER_H;

        // Row height: divide available space among visible rows + gaps
        var totalGaps = ROW_GAP * (visibleCount - 1);
        var rowH = Math.floor((availH - totalGaps) / visibleCount);
        rowH = Math.max(28, Math.min(60, rowH));

        // Font sizes derived from rowH
        var timeFontSize    = Math.max(8,  Math.round(rowH * 0.30));
        var badgeFontSize   = Math.max(8,  Math.round(rowH * 0.32));
        var msgFontSize     = Math.max(9,  Math.round(rowH * 0.34));
        var headerFontSize  = Math.max(7,  Math.round(HEADER_H * 0.55));
        var footerFontSize  = Math.max(7,  Math.round(FOOTER_H * 0.55));

        // Measure timestamp column width from a representative string
        ctx.font = timeFontSize + 'px ' + theme.FONTS.data;
        var timeColW = Math.ceil(ctx.measureText('00:00:00').width) + 4;

        // ------------------------------------------------------------------
        // Draw header: "TEAM RADIO"
        // ------------------------------------------------------------------
        if (showHeader) {
            ctx.save();
            ctx.font = 'bold ' + headerFontSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = theme.withAlpha(t.text, 0.28);
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            // Fake letter-spacing via character drawing loop
            var headerText = 'TEAM RADIO';
            var headerX = BORDER_W + BORDER_GAP;
            var headerY = Math.round(HEADER_H / 2);
            var spacing = 2;
            ctx.font = 'bold ' + headerFontSize + 'px ' + theme.FONTS.ui;
            for (var ci = 0; ci < headerText.length; ci++) {
                ctx.fillText(headerText[ci], headerX, headerY);
                headerX += ctx.measureText(headerText[ci]).width + spacing;
            }
            ctx.restore();
        }

        // ------------------------------------------------------------------
        // Update tooltip styling from current theme
        // ------------------------------------------------------------------
        this._tooltip.style.background = t.panelHi;
        this._tooltip.style.color      = t.text;
        this._tooltip.style.fontFamily = theme.FONTS.data;
        this._tooltip.style.fontSize   = '11px';
        this._tooltip.style.border     = '1px solid ' + theme.withAlpha(accentColor, 0.3);

        // ------------------------------------------------------------------
        // Draw message rows
        // ------------------------------------------------------------------
        this._hitZones = [];

        for (var ri = 0; ri < visibleCount; ri++) {
            var msg   = messages[ri];
            var rowY  = HEADER_H + ri * (rowH + ROW_GAP);
            var rowCY = Math.round(rowY + rowH * 0.5);
            var isOdd = (ri % 2 === 1);
            var isHovered = (this._hoverRow === ri);
            var prioColor = priorityColor(t, msg.priority);
            var isCritical = (String(msg.priority).toLowerCase() === 'critical' ||
                              String(msg.priority).toLowerCase() === 'crit');

            // Store hit zone
            this._hitZones.push({
                y:           rowY,
                h:           rowH,
                rowIdx:      ri,
                driver:      msg.driver,
                message:     msg.message,
                timeStr:     msg.timeStr,
                priority:    msg.priority
            });

            // -- Row background (subtle alternating + hover) --
            ctx.save();
            if (isHovered) {
                ctx.fillStyle = theme.withAlpha(prioColor, 0.10);
                ctx.fillRect(BORDER_W, rowY, w - BORDER_W, rowH);
            } else if (isOdd) {
                ctx.fillStyle = theme.withAlpha(t.panelHi, 0.50);
                ctx.fillRect(BORDER_W, rowY, w - BORDER_W, rowH);
            }
            ctx.restore();

            // -- Priority left border + optional glow for critical --
            ctx.save();
            if (isCritical && accentIntensity > 0) {
                ctx.shadowColor   = prioColor;
                ctx.shadowBlur    = Math.round((accentIntensity / 100) * 10);
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            }
            ctx.fillStyle = prioColor;
            ctx.fillRect(0, rowY, BORDER_W, rowH);
            // Reset shadow (B6)
            ctx.shadowBlur    = 0;
            ctx.shadowColor   = 'transparent';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.restore();

            // -- Timestamp --
            var curX = BORDER_W + BORDER_GAP;
            ctx.save();
            ctx.font = timeFontSize + 'px ' + theme.FONTS.data;
            ctx.fillStyle = t.textFaint;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            ctx.fillText(msg.timeStr || '—', curX, rowCY);
            ctx.restore();
            curX += timeColW + COL_GAP;

            // -- Driver badge: pill shape with driver name --
            ctx.save();
            ctx.font = 'bold ' + badgeFontSize + 'px ' + theme.FONTS.ui;
            var driverLabel   = msg.driver || '?';
            var badgePadH     = Math.round(rowH * 0.14);
            var badgePadW     = Math.round(badgeFontSize * 0.7);
            var badgeTextW    = ctx.measureText(driverLabel).width;
            var badgeW        = badgeTextW + badgePadW * 2;
            var badgeH        = Math.round(rowH * 0.60);
            var badgeY        = Math.round(rowCY - badgeH / 2);
            var badgeRx       = Math.round(badgeH / 2); // pill radius

            // Badge background: papaya orange at 15% opacity
            ctx.fillStyle = theme.withAlpha(accentColor, 0.15);
            theme.roundRect(ctx, curX, badgeY, badgeW, badgeH, badgeRx);
            ctx.fill();

            // Badge border: very subtle
            ctx.strokeStyle = theme.withAlpha(accentColor, 0.35);
            ctx.lineWidth = 1;
            theme.roundRect(ctx, curX, badgeY, badgeW, badgeH, badgeRx);
            ctx.stroke();

            // Badge text: accent color
            ctx.fillStyle = accentColor;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            ctx.fillText(driverLabel, curX + badgePadW, rowCY);
            ctx.restore();
            curX += badgeW + COL_GAP;

            // -- Message text: truncate with ellipsis if needed --
            var msgX    = curX;
            var msgMaxW = w - msgX - 8; // 8px right margin

            ctx.save();
            ctx.font = msgFontSize + 'px ' + theme.FONTS.ui;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';

            var truncResult = truncateText(ctx, msg.message, msgMaxW);

            // On hover brighten the message text slightly
            ctx.fillStyle = isHovered ? t.text : theme.withAlpha(t.text, 0.85);
            ctx.fillText(truncResult.text, msgX, rowCY);
            ctx.restore();

            // Store truncation info in hit zone for tooltip
            this._hitZones[ri].truncated    = truncResult.truncated;
            this._hitZones[ri].fullMessage  = truncResult.truncated ? (truncResult.full || msg.message) : msg.message;
        }

        // ------------------------------------------------------------------
        // "... +X more" footer
        // ------------------------------------------------------------------
        if (hasMore) {
            var moreCount = totalCount - visibleCount;
            var footerY   = h - FOOTER_H;

            ctx.save();
            ctx.fillStyle = theme.withAlpha(t.panelHi, 0.65);
            ctx.fillRect(0, footerY, w, FOOTER_H);
            ctx.font = footerFontSize + 'px ' + theme.FONTS.ui;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.fillStyle = t.textFaint;
            ctx.fillText('... +' + moreCount + ' more', w / 2, footerY + FOOTER_H / 2);
            ctx.restore();
        }

        // Final shadow reset (B6)
        ctx.shadowBlur    = 0;
        ctx.shadowColor   = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Store layout for hit testing
        this._layoutCache = { w: w, h: h };
    },

    // -------------------------------------------------------------------------
    // Mouse interaction (I1, I2)
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
            this._canvas.style.cursor   = 'default';
        }
    },

    _hitTest: function(my) {
        for (var i = 0; i < this._hitZones.length; i++) {
            var z = this._hitZones[i];
            if (my >= z.y && my < z.y + z.h) {
                return z.rowIdx;
            }
        }
        return -1;
    },

    _showTooltip: function(rowIdx, mx, my) {
        var zone = this._hitZones[rowIdx];
        if (!zone) { this._tooltip.style.display = 'none'; return; }

        // Always show full message in tooltip (even if not truncated — useful
        // for driver + priority context)
        var lines = [];
        if (zone.timeStr)  lines.push('[' + zone.timeStr + ']  ' + (zone.priority || 'info').toUpperCase());
        if (zone.driver)   lines.push(zone.driver);
        if (zone.fullMessage) lines.push(zone.fullMessage);

        this._tooltip.innerHTML = lines.join('<br>');
        this._tooltip.style.display = 'block';

        var tipW = this._tooltip.offsetWidth  || 160;
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
    // Click — drilldown with driver name (C3, C4)
    // -------------------------------------------------------------------------

    _onClick: function(e) {
        var rect = this._canvas.getBoundingClientRect();
        var my   = e.clientY - rect.top;
        var hit  = this._hitTest(my);
        if (hit < 0) return;

        var zone = this._hitZones[hit];
        if (!zone || !zone.driver) return;

        var driverFieldName = this._driverFieldName || 'driver';
        var self = this;
        try {
            self.drilldown({
                action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
                data: {
                    'click.name':  driverFieldName,
                    'click.value': zone.driver
                }
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
        this._tooltip      = null;
        this._hitZones     = null;
        this._parsedRows   = null;
        this._layoutCache  = null;
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }

});
