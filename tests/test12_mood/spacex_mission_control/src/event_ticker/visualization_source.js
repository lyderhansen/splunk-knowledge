var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

    // ── Helpers ──────────────────────────────────────────────────

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

    // Map status string to theme color
    function statusColor(t, status, accentColor) {
        var s = (status || '').toLowerCase().trim();
        if (s === 'nominal' || s === 'go') return t.nominal;
        if (s === 'warning' || s === 'caution') return t.warn;
        if (s === 'abort' || s === 'anomaly' || s === 'failed') return t.danger;
        return accentColor || t.accent;
    }

    // ── Visualization ────────────────────────────────────────────

    module.exports = SplunkVisualizationBase.extend({

        initialize: function() {
            SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
            this.el.style.overflow = 'hidden';
            this.el.style.position = 'relative';

            var canvas = document.createElement('canvas');
            canvas.style.display = 'block';
            this.el.appendChild(canvas);
            this.canvas = canvas;

            this._lastData = null;
            this._lastConfig = null;
            this._hoverIdx = -1;
            this._hitRegions = [];

            // DOM tooltip
            this._tooltip = document.createElement('div');
            this._tooltip.style.cssText =
                'position:absolute;display:none;padding:5px 10px;' +
                'background:rgba(6,9,16,0.92);color:#E2E8F0;font-size:11px;' +
                'border-radius:3px;pointer-events:none;white-space:nowrap;' +
                'z-index:100;font-family:"JetBrains Mono",monospace;' +
                'border:1px solid rgba(0,136,204,0.25);' +
                'box-shadow:0 4px 12px rgba(0,0,0,0.5);letter-spacing:0.02em;';
            this.el.appendChild(this._tooltip);

            var self = this;
            canvas.addEventListener('mousemove', function(e) {
                self._onMouseMove(e);
            });
            canvas.addEventListener('mouseleave', function() {
                self._tooltip.style.display = 'none';
                canvas.style.cursor = 'default';
                if (self._hoverIdx !== -1) {
                    self._hoverIdx = -1;
                    self._render(self._lastData, self._lastConfig);
                }
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
                throw new SplunkVisualizationBase.VisualizationError('Awaiting data');
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
            if (!data) return;
            this._lastData = data;
            this._lastConfig = config;
            var self = this;
            theme.loadFonts(function() {
                self._render(data, config);
            });
        },

        _onMouseMove: function(e) {
            var rect = this.canvas.getBoundingClientRect();
            var mx = e.clientX - rect.left;
            var my = e.clientY - rect.top;
            var hit = this._hitTest(mx, my);

            if (hit !== null) {
                var region = this._hitRegions[hit];
                this._tooltip.innerHTML = region.tip;
                this._tooltip.style.display = 'block';

                var tx = mx + 14;
                var ty = my - 10;
                if (tx + 260 > this.el.offsetWidth) { tx = mx - 270; }
                if (ty < 0) { ty = my + 20; }
                this._tooltip.style.left = tx + 'px';
                this._tooltip.style.top = ty + 'px';
                this.canvas.style.cursor = 'default';

                if (this._hoverIdx !== hit) {
                    this._hoverIdx = hit;
                    this._render(this._lastData, this._lastConfig);
                }
            } else {
                this._tooltip.style.display = 'none';
                this.canvas.style.cursor = 'default';
                if (this._hoverIdx !== -1) {
                    this._hoverIdx = -1;
                    this._render(this._lastData, this._lastConfig);
                }
            }
        },

        _hitTest: function(mx, my) {
            for (var i = 0; i < this._hitRegions.length; i++) {
                var r = this._hitRegions[i];
                if (mx >= r.x && mx <= r.x + r.w &&
                    my >= r.y && my <= r.y + r.h) {
                    return i;
                }
            }
            return null;
        },

        _render: function(data, config) {
            if (!data || !config) return;

            var el = this.el;
            var w = el.offsetWidth;
            var h = el.offsetHeight;
            if (w <= 0 || h <= 0) return;

            var dpr = window.devicePixelRatio || 1;
            var canvas = this.canvas;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';

            var ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, w, h);

            var ns = getNS(this);

            // ── Config reads ──────────────────────────────────────
            var themeMode   = getOption(config, ns, 'theme',       'dark');
            var accentColor = getOption(config, ns, 'accentColor', '#0088CC');
            var gi = theme.parseNum(getOption(config, ns, 'accentIntensity', '50'), 50) / 50;
            var timeField   = getOption(config, ns, 'timeField',   'time');
            var eventField  = getOption(config, ns, 'eventField',  'event');
            var statusField = getOption(config, ns, 'statusField', 'status');
            var maxRows     = parseInt(getOption(config, ns, 'maxRows', '20'), 10);
            var showHeader  = theme.parseBool(getOption(config, ns, 'showHeader', 'true'), true);

            if (isNaN(maxRows) || maxRows < 1) { maxRows = 20; }

            var t = theme.getTheme(themeMode);

            // ── Background: transparent (panel backgroundColor controls bg) ──

            // Top-edge instrument backlight
            ctx.save();
            theme.roundRect(ctx, 0, 0, w, h, 2);
            ctx.clip();
            var topGrad = ctx.createLinearGradient(0, 0, 0, 5);
            topGrad.addColorStop(0, theme.withAlpha(accentColor, 0.20 * gi));
            topGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = topGrad;
            ctx.fillRect(0, 0, w, 5);
            ctx.restore();

            // ── Layout constants ──────────────────────────────────
            var PAD_X    = 10;
            var ROW_H    = 32;
            var BAR_W    = 3;
            var BAR_H    = 16;
            var HEADER_H = showHeader ? 26 : 0;

            var contentTop = HEADER_H;
            var contentH   = h - contentTop;
            var maxVisible = Math.max(1, Math.floor(contentH / ROW_H));

            // ── Header ────────────────────────────────────────────
            if (showHeader) {
                ctx.font = '600 10px ' + theme.DISPLAY_FONT;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = theme.withAlpha(t.text, 0.25);
                theme.drawSpacedText(ctx, 'MISSION EVENTS', w / 2, HEADER_H / 2, 3);
                // Thin separator under header
                ctx.strokeStyle = t.grid;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(PAD_X, HEADER_H - 0.5);
                ctx.lineTo(w - PAD_X, HEADER_H - 0.5);
                ctx.stroke();
            }

            // ── Parse rows ────────────────────────────────────────
            var colIdx  = data.colIdx;
            var rows    = data.rows;
            var tCol    = (colIdx[timeField]   !== undefined) ? colIdx[timeField]   : -1;
            var eCol    = (colIdx[eventField]  !== undefined) ? colIdx[eventField]  : -1;
            var sCol    = (colIdx[statusField] !== undefined) ? colIdx[statusField] : -1;

            // ── No-data state ─────────────────────────────────────
            if (!rows || rows.length === 0 || (tCol < 0 && eCol < 0)) {
                ctx.font = '400 11px ' + theme.MONO_FONT;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = theme.withAlpha(t.text, 0.20);
                ctx.fillText('AWAITING TELEMETRY', w / 2, h / 2);
                return;
            }

            var displayCount = Math.min(rows.length, maxRows, maxVisible);

            // ── Measure text columns ──────────────────────────────
            // TIME column: fixed-width using widest expected T+HH:MM:SS
            ctx.font = '400 11px ' + theme.MONO_FONT;
            var timeColW = ctx.measureText('T+00:00:00').width + 12;

            // STATUS PILL: measured per-row, but cap badge area
            var BADGE_MAX_W = 72;

            // STATUS BAR: 3px + 8px gap
            var barZoneW = BAR_W + 8;

            // Column positions
            var barX      = PAD_X;
            var timeX     = barX + barZoneW;
            var eventX    = timeX + timeColW + 8;
            var badgeXMax = w - PAD_X - BADGE_MAX_W;

            // ── Clip to content area ──────────────────────────────
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, contentTop, w, contentH);
            ctx.clip();

            // ── Reset hit regions ─────────────────────────────────
            this._hitRegions = [];

            // ── Draw rows ─────────────────────────────────────────
            for (var ri = 0; ri < displayCount; ri++) {
                var row    = rows[ri];
                var timeV  = (tCol >= 0 && row[tCol] !== undefined) ? String(row[tCol]) : '';
                var eventV = (eCol >= 0 && row[eCol] !== undefined) ? String(row[eCol]) : '';
                var statV  = (sCol >= 0 && row[sCol] !== undefined) ? String(row[sCol]) : '';

                var rowY  = contentTop + ri * ROW_H;
                var rowCY = rowY + ROW_H / 2;

                var sColor = statusColor(t, statV, accentColor);

                // Register hit region
                this._hitRegions.push({
                    x: 0, y: rowY, w: w, h: ROW_H,
                    tip: '<span style="color:' + sColor + '">' + timeV + '</span>' +
                         ' &mdash; ' + eventV +
                         (statV ? ' <span style="opacity:0.6">[' + statV + ']</span>' : '')
                });

                // ── Row hover background ──────────────────────────
                if (ri === this._hoverIdx) {
                    ctx.fillStyle = theme.withAlpha(accentColor, 0.08 * gi);
                    ctx.fillRect(0, rowY, w, ROW_H);
                }

                // ── Latest-event left-edge glow ───────────────────
                if (ri === 0) {
                    ctx.save();
                    ctx.shadowColor = sColor;
                    ctx.shadowBlur = 10;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    // Draw a thin luminous sliver at x=0
                    ctx.fillStyle = theme.withAlpha(sColor, 0.55);
                    ctx.fillRect(0, rowY + 1, 1, ROW_H - 2);
                    ctx.restore();
                    // Reset shadow
                    ctx.shadowBlur = 0;
                    ctx.shadowColor = 'transparent';
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                }

                // ── Status bar ────────────────────────────────────
                var barY = rowCY - BAR_H / 2;
                ctx.fillStyle = sColor;
                ctx.beginPath();
                ctx.rect(barX, barY, BAR_W, BAR_H);
                ctx.fill();

                // ── Timestamp ─────────────────────────────────────
                ctx.font = '400 11px ' + theme.MONO_FONT;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = theme.withAlpha(t.text, 0.45);
                ctx.fillText(timeV, timeX, rowCY);

                // ── Event name ────────────────────────────────────
                ctx.font = '400 12px ' + theme.DISPLAY_FONT;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = t.text;
                // Clip event text if it would run into badge area
                var eventMaxW = (statV ? badgeXMax : w - PAD_X) - eventX - 4;
                var eventStr = eventV;
                // Truncate if too wide
                var eventW = ctx.measureText(eventStr).width;
                if (eventW > eventMaxW) {
                    while (eventStr.length > 1 && ctx.measureText(eventStr + '…').width > eventMaxW) {
                        eventStr = eventStr.substring(0, eventStr.length - 1);
                    }
                    eventStr = eventStr + '…';
                }
                ctx.fillText(eventStr, eventX, rowCY);

                // ── Status pill badge ─────────────────────────────
                if (statV) {
                    ctx.font = '400 9px ' + theme.MONO_FONT;
                    var badgeTW  = ctx.measureText(statV).width;
                    var BADGE_PX = 6;
                    var badgeW   = badgeTW + BADGE_PX * 2;
                    var badgeH   = 14;
                    var badgeX   = w - PAD_X - badgeW;
                    var badgeY2  = rowCY - badgeH / 2;

                    // Badge bg (status color at 15% opacity)
                    theme.roundRect(ctx, badgeX, badgeY2, badgeW, badgeH, 2);
                    ctx.fillStyle = theme.withAlpha(sColor, 0.15);
                    ctx.fill();

                    // Badge text (status color at 80% opacity)
                    ctx.font = '400 9px ' + theme.MONO_FONT;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = theme.withAlpha(sColor, 0.80);
                    ctx.fillText(statV, badgeX + BADGE_PX, rowCY);
                }

                // ── Row separator line ────────────────────────────
                if (ri < displayCount - 1) {
                    ctx.strokeStyle = t.grid;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(PAD_X + barZoneW, rowY + ROW_H - 0.5);
                    ctx.lineTo(w - PAD_X, rowY + ROW_H - 0.5);
                    ctx.stroke();
                }
            }

            ctx.restore();

            // ── Overflow fade ─────────────────────────────────────
            // If more rows exist than visible, fade the bottom edge
            if (rows.length > displayCount) {
                var fadeH = 24;
                var fadeGrad = ctx.createLinearGradient(0, h - fadeH, 0, h);
                fadeGrad.addColorStop(0, 'transparent');
                fadeGrad.addColorStop(1, t.panel);
                ctx.fillStyle = fadeGrad;
                ctx.fillRect(0, h - fadeH, w, fadeH);
            }
        },

        reflow: function() {
            if (this._lastConfig) {
                this._render(this._lastData, this._lastConfig);
            }
        },

        destroy: function() {
            if (this._tooltip && this._tooltip.parentNode) {
                this._tooltip.parentNode.removeChild(this._tooltip);
            }
            SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
        }

    });
