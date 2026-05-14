// JWST Instrument Matrix — 2x2 instrument status cards
// Shows NIRCam, NIRSpec, MIRI, FGS with animated status dots, mode text, uptime bar, hex corners
// Data: instrument, status, mode, uptime_pct
// ES5 strict, require/module.exports, no const/let/arrow/template literals

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

var INSTRUMENT_ORDER = ['NIRCam', 'NIRSpec', 'MIRI', 'FGS'];

var STATUS_LABELS = {
    active:      'ACTIVE',
    idle:        'IDLE',
    calibration: 'CALIBRATION',
    error:       'ERROR'
};

// Default fallback data when Splunk sends nothing yet
var FALLBACK_DATA = [
    { instrument: 'NIRCam',  status: 'active',      mode: 'DEEP_FIELD',    uptime_pct: 97.4 },
    { instrument: 'NIRSpec', status: 'idle',         mode: 'STANDBY',       uptime_pct: 99.1 },
    { instrument: 'MIRI',    status: 'calibration',  mode: 'FLAT_LAMP',     uptime_pct: 88.6 },
    { instrument: 'FGS',     status: 'error',        mode: 'GYRO_FAULT',    uptime_pct: 72.3 }
];

// ---------------------------------------------------------------------------
// Animation tick counter (shared, monotonically increasing)
// ---------------------------------------------------------------------------

var _tick = 0;

// ---------------------------------------------------------------------------
// Viz definition
// ---------------------------------------------------------------------------

module.exports = SplunkVisualizationBase.extend({

    // ------------------------------------------------------------------
    // initialize
    // ------------------------------------------------------------------
    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.className = (this.el.className || '') + ' jwst-instrument-matrix';

        // Canvas, tooltip, animation timer
        this._canvas  = null;
        this._ctx     = null;
        this._tip     = null;
        this._timer   = null;
        this._lastData = null;
        this._lastConfig = null;
        this._hoverIdx = -1;
        this._selectedInstrument = '';

        // Layout rects for each card (computed in _draw)
        this._cardRects = [];

        var self = this;

        // Font readiness
        this._fontReady = false;
        theme.waitForFont('Oxanium', function() {
            self._fontReady = true;
            if (self._lastData && self._lastConfig) {
                self._draw(self._lastData, self._lastConfig);
            }
        });
    },

    // ------------------------------------------------------------------
    // getInitialDataParams
    // ------------------------------------------------------------------
    getInitialDataParams: function() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 50
        };
    },

    // ------------------------------------------------------------------
    // formatData  — NO config reads here
    // ------------------------------------------------------------------
    formatData: function(data) {
        if (!data || !data.rows || data.rows.length === 0) {
            return { rows: [] };
        }
        var fields = data.fields;
        var rows   = data.rows;
        var fieldNames = [];
        var i;
        for (i = 0; i < fields.length; i++) {
            fieldNames.push(fields[i].name);
        }

        var parsed = [];
        for (i = 0; i < rows.length; i++) {
            var row = rows[i];
            var obj = {};
            var j;
            for (j = 0; j < fieldNames.length; j++) {
                obj[fieldNames[j]] = row[j];
            }
            parsed.push(obj);
        }
        return { rows: parsed };
    },

    // ------------------------------------------------------------------
    // updateView
    // ------------------------------------------------------------------
    updateView: function(data, config) {
        var self = this;
        this._lastData   = data;
        this._lastConfig = config;

        // Setup canvas + tooltip on first call
        if (!this._canvas) {
            var setup = theme.setupCanvas(this.el);
            this._canvas = setup.canvas;
            this._ctx    = setup.ctx;
            this._tip    = theme.createTooltip(this.el);
            this._attachEvents();
        }

        // Start animation timer if not running
        if (!this._timer) {
            this._timer = setInterval(function() {
                _tick++;
                if (self._lastData && self._lastConfig) {
                    self._draw(self._lastData, self._lastConfig);
                }
            }, 50); // ~20fps
        }

        try { this._draw(data, config); } catch(e) { if (typeof console !== 'undefined') { console.error('JWST instrument_matrix _draw error:', e); } }
    },

    // ------------------------------------------------------------------
    // reflow
    // ------------------------------------------------------------------
    reflow: function() {
        if (!this._canvas || !this._lastData || !this._lastConfig) return;
        var setup = theme.setupCanvas(this.el);
        this._canvas = setup.canvas;
        this._ctx    = setup.ctx;
        this._draw(this._lastData, this._lastConfig);
    },

    // ------------------------------------------------------------------
    // destroy
    // ------------------------------------------------------------------
    destroy: function() {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    },

    // ------------------------------------------------------------------
    // _attachEvents
    // ------------------------------------------------------------------
    _attachEvents: function() {
        var self = this;
        var canvas = this._canvas;

        canvas.addEventListener('mousemove', function(e) {
            var idx = self._hitTest(e);
            if (idx !== self._hoverIdx) {
                self._hoverIdx = idx;
                if (self._lastData && self._lastConfig) {
                    self._draw(self._lastData, self._lastConfig);
                }
            }
            if (idx >= 0) {
                var cards = self._resolveCards(self._lastData, self._lastConfig);
                var card = cards[idx];
                if (card) {
                    var html = '<b>' + card.instrument + '</b><br>' +
                               'Status: ' + (STATUS_LABELS[card.status] || card.status.toUpperCase()) + '<br>' +
                               'Mode: ' + (card.mode || '—') + '<br>' +
                               'Uptime: ' + (card.uptime_pct !== null && card.uptime_pct !== undefined ? card.uptime_pct.toFixed(1) + '%' : '—');
                    theme.showTooltip(self._tip, e, canvas, html);
                }
            } else {
                theme.hideTooltip(self._tip);
            }
        });

        canvas.addEventListener('mouseleave', function() {
            self._hoverIdx = -1;
            theme.hideTooltip(self._tip);
            if (self._lastData && self._lastConfig) {
                self._draw(self._lastData, self._lastConfig);
            }
        });

        canvas.addEventListener('click', function(e) {
            var config = self._lastConfig || {};
            var ns = theme.getNS(self);
            var enableDrilldown = theme.getOption(config, ns, 'enableDrilldown', 'true');
            if (enableDrilldown === 'false' || enableDrilldown === false) return;

            var idx = self._hitTest(e);
            if (idx < 0) return;

            var cards = self._resolveCards(self._lastData, self._lastConfig);
            var card = cards[idx];
            if (!card) return;

            var tokenName = theme.getOption(config, ns, 'drilldownTokenName', 'selected_instrument');

            // Toggle selection
            if (self._selectedInstrument === card.instrument) {
                self._selectedInstrument = '';
            } else {
                self._selectedInstrument = card.instrument;
            }

            if (self._lastData && self._lastConfig) {
                self._draw(self._lastData, self._lastConfig);
            }

            try {
                self.drilldown({
                    action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
                    data: {
                        field: tokenName,
                        value: self._selectedInstrument || card.instrument
                    }
                }, e);
            } catch (err) {
                // drilldown not available in all contexts
            }
        });
    },

    // ------------------------------------------------------------------
    // _hitTest — returns card index (0-3) or -1
    // ------------------------------------------------------------------
    _hitTest: function(e) {
        var rect = this._canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;
        var i;
        for (i = 0; i < this._cardRects.length; i++) {
            var r = this._cardRects[i];
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                return i;
            }
        }
        return -1;
    },

    // ------------------------------------------------------------------
    // _resolveCards — merge Splunk data with fallback
    // ------------------------------------------------------------------
    _resolveCards: function(data, config) {
        var ns = theme.getNS(this);
        var instrField  = theme.getOption(config, ns, 'instrumentField', 'instrument');
        var statusField = theme.getOption(config, ns, 'statusField', 'status');
        var modeField   = theme.getOption(config, ns, 'modeField', 'mode');
        var uptimeField = theme.getOption(config, ns, 'uptimeField', 'uptime_pct');

        var rowMap = {};
        var rows = (data && data.rows) ? data.rows : [];
        var i;
        for (i = 0; i < rows.length; i++) {
            var row = rows[i];
            var instr = row[instrField] || row['instrument'] || '';
            if (instr) {
                rowMap[instr] = {
                    instrument: instr,
                    status:     (row[statusField] || row['status'] || 'idle').toLowerCase(),
                    mode:       row[modeField] || row['mode'] || '',
                    uptime_pct: parseFloat(row[uptimeField] || row['uptime_pct']) || null
                };
            }
        }

        // If no data from Splunk, use fallback
        var useFallback = (rows.length === 0);
        var cards = [];
        for (i = 0; i < INSTRUMENT_ORDER.length; i++) {
            var name = INSTRUMENT_ORDER[i];
            if (useFallback) {
                cards.push(FALLBACK_DATA[i]);
            } else if (rowMap[name]) {
                cards.push(rowMap[name]);
            } else {
                cards.push({
                    instrument: name,
                    status:     'idle',
                    mode:       '',
                    uptime_pct: null
                });
            }
        }
        return cards;
    },

    // ------------------------------------------------------------------
    // _statusColor — returns hex color for a status string
    // ------------------------------------------------------------------
    _statusColor: function(status, config, ns) {
        if (status === 'active')      return theme.getOption(config, ns, 'activeColor',      '#34D399');
        if (status === 'idle')        return theme.getOption(config, ns, 'idleColor',        '#00B4D8');
        if (status === 'calibration') return theme.getOption(config, ns, 'calibrationColor', '#D4A537');
        if (status === 'error')       return theme.getOption(config, ns, 'errorColor',       '#FF4D4D');
        return '#E8ECF1';
    },

    // ------------------------------------------------------------------
    // _dotAlpha — animated opacity for status dot
    //   active:      gentle pulse (0.6-1.0, period ~2s)
    //   calibration: slow oscillation same range but slower
    //   error:       on/off at ~2Hz
    //   idle:        static 0.9
    // ------------------------------------------------------------------
    _dotAlpha: function(status) {
        var t = _tick;
        if (status === 'active') {
            // 0.6 + 0.4 * sin, period ~2s at 50ms tick = 40 ticks
            return 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 40)));
        }
        if (status === 'calibration') {
            // slower: 80 ticks
            return 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 80)));
        }
        if (status === 'error') {
            // 2Hz = 500ms period = 10 ticks
            return (t % 10) < 5 ? 1.0 : 0.15;
        }
        return 0.9; // idle static
    },

    // ------------------------------------------------------------------
    // _dotRadius — animated size for calibration, else static
    // ------------------------------------------------------------------
    _dotRadius: function(status, baseRadius) {
        if (status === 'calibration') {
            // size oscillates 80%-120%, period ~80 ticks
            var scale = 0.8 + 0.4 * (0.5 + 0.5 * Math.sin(_tick * (2 * Math.PI / 80)));
            return baseRadius * scale;
        }
        return baseRadius;
    },

    // ------------------------------------------------------------------
    // _draw — main render
    // ------------------------------------------------------------------
    _draw: function(data, config) {
        var canvas = this._canvas;
        var ctx    = this._ctx;
        if (!canvas || !ctx) return;

        // Resize check
        var rect = this.el.getBoundingClientRect();
        var cw = Math.floor(rect.width) || 300;
        var ch = Math.floor(rect.height) || 280;
        var dpr = window.devicePixelRatio || 1;
        if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
            canvas.width  = cw * dpr;
            canvas.height = ch * dpr;
            canvas.style.width  = cw + 'px';
            canvas.style.height = ch + 'px';
            ctx.scale(dpr, dpr);
        }

        // Clear
        ctx.clearRect(0, 0, cw, ch);

        var ns = theme.getNS(this);
        var themeMode = theme.getOption(config, ns, 'theme', 'dark');
        var t = theme.getTheme(themeMode);

        var showUptime  = theme.getOption(config, ns, 'showUptime', 'true') !== 'false';
        var accentInt   = parseInt(theme.getOption(config, ns, 'accentIntensity', '50'), 10);
        var gi          = (isNaN(accentInt) ? 50 : accentInt) / 100;

        var cards = this._resolveCards(data, config);

        // Layout: 2 columns, 2 rows with padding
        var pad    = 10;
        var gap    = 8;
        var cols   = 2;
        var rows   = 2;
        var cardW  = Math.floor((cw - pad * 2 - gap * (cols - 1)) / cols);
        var cardH  = Math.floor((ch - pad * 2 - gap * (rows - 1)) / rows);

        this._cardRects = [];

        var i;
        for (i = 0; i < 4; i++) {
            var col   = i % 2;
            var row   = Math.floor(i / 2);
            var cx    = pad + col * (cardW + gap);
            var cy    = pad + row * (cardH + gap);

            this._cardRects.push({ x: cx, y: cy, w: cardW, h: cardH });

            var card   = cards[i];
            var status = card.status;
            var sColor = this._statusColor(status, config, ns);
            var isSelected = (card.instrument === this._selectedInstrument);
            var isHovered  = (i === this._hoverIdx);

            this._drawCard(ctx, cx, cy, cardW, cardH, card, sColor, t, gi, showUptime, isSelected, isHovered, ns, config);
        }
    },

    // ------------------------------------------------------------------
    // _drawCard
    // ------------------------------------------------------------------
    _drawCard: function(ctx, x, y, w, h, card, sColor, t, gi, showUptime, isSelected, isHovered, ns, config) {
        var status   = card.status;
        var goldHex  = t.gold;
        var cardBg   = t.card;

        // ---- Card background ----
        ctx.save();
        ctx.beginPath();
        this._roundRect(ctx, x, y, w, h, 4);
        ctx.fillStyle = cardBg;
        ctx.fill();

        // ---- Border ----
        var borderAlpha;
        if (isSelected) {
            borderAlpha = 0.85 * gi;
        } else if (status === 'active') {
            borderAlpha = 0.45 * gi;
        } else if (isHovered) {
            borderAlpha = 0.3;
        } else {
            borderAlpha = 0.15;
        }

        // Gold border for active / selected, dim border otherwise
        var borderColor;
        if (isSelected || status === 'active') {
            borderColor = theme.rgba(goldHex, borderAlpha);
        } else {
            borderColor = theme.rgba(t.text, borderAlpha);
        }

        ctx.beginPath();
        this._roundRect(ctx, x, y, w, h, 4);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = isSelected ? 1.5 : 1;
        ctx.stroke();
        ctx.restore();

        // ---- Gold glow for active/selected ----
        if ((status === 'active' || isSelected) && gi > 0) {
            ctx.save();
            ctx.shadowBlur   = 10 * gi;
            ctx.shadowColor  = theme.rgba(goldHex, 0.4 * gi);
            ctx.beginPath();
            this._roundRect(ctx, x, y, w, h, 4);
            ctx.strokeStyle = 'transparent';
            ctx.lineWidth = 1;
            ctx.stroke();
            theme.resetShadow(ctx);
            ctx.restore();
        }

        // ---- Hex corner accents ----
        var hexSize = Math.min(w, h) * 0.12;
        var hexAlpha = isSelected ? 0.9 * gi : 0.4 * gi;
        var hexColor = isSelected ? theme.rgba(goldHex, hexAlpha) : theme.rgba(sColor, hexAlpha + 0.15);
        theme.drawHexCorners(ctx, x + 2, y + 2, w - 4, h - 4, hexSize, hexColor);

        // ---- Layout measurements ----
        var padX = 10;
        var padT = 10;
        var dotRadius   = 5;
        var dotX        = x + padX + dotRadius;
        var dotY        = y + padT + dotRadius;

        // ---- Status dot ----
        var alpha  = this._dotAlpha(status);
        var radius = this._dotRadius(status, dotRadius);

        ctx.save();

        // Dot glow
        if (status !== 'idle' && gi > 0) {
            ctx.shadowBlur  = 8 * gi;
            ctx.shadowColor = theme.rgba(sColor, 0.7 * alpha);
        }

        ctx.beginPath();
        ctx.arc(dotX, dotY, radius, 0, Math.PI * 2);
        ctx.fillStyle = theme.rgba(sColor, alpha);
        ctx.fill();
        theme.resetShadow(ctx);
        ctx.restore();

        // ---- Instrument name ----
        var nameFont = 'bold 16px Oxanium, sans-serif';
        var nameFontFallback = 'bold 15px sans-serif';
        var nameX = dotX + dotRadius + 7;
        var nameY = y + padT + dotRadius + 5; // baseline aligned with dot center

        ctx.save();
        ctx.fillStyle = t.text;
        ctx.font = this._fontReady ? nameFont : nameFontFallback;
        ctx.textBaseline = 'middle';
        ctx.fillText(card.instrument, nameX, dotY);
        ctx.restore();

        // ---- Status label (right-aligned) ----
        var statusLabel = STATUS_LABELS[status] || status.toUpperCase();
        ctx.save();
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = theme.rgba(sColor, 0.9);
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'right';
        ctx.fillText(statusLabel, x + w - padX, dotY);
        ctx.restore();

        // ---- Mode text ----
        var modeY   = y + padT + dotRadius * 2 + 14;
        var modeStr = card.mode ? card.mode : '—';
        ctx.save();
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = t.dim;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        // Truncate if too wide
        var maxModeW = w - padX * 2;
        var modeText = this._truncateText(ctx, modeStr, maxModeW);
        ctx.fillText(modeText, x + padX, modeY);
        ctx.restore();

        // ---- Uptime bar ----
        if (showUptime) {
            var barH    = 3;
            var barY    = y + h - barH - 6;
            var barX    = x + padX;
            var barW    = w - padX * 2;

            // Track bg
            ctx.save();
            ctx.fillStyle = t.muted;
            ctx.beginPath();
            this._roundRect(ctx, barX, barY, barW, barH, 1.5);
            ctx.fill();
            ctx.restore();

            var pct = (card.uptime_pct !== null && card.uptime_pct !== undefined && !isNaN(card.uptime_pct))
                ? Math.max(0, Math.min(100, card.uptime_pct)) : 0;
            var fillW = barW * pct / 100;

            if (fillW > 0) {
                ctx.save();
                if (gi > 0) {
                    ctx.shadowBlur  = 4 * gi;
                    ctx.shadowColor = theme.rgba(sColor, 0.6 * gi);
                }
                ctx.fillStyle = theme.rgba(sColor, 0.85);
                ctx.beginPath();
                this._roundRect(ctx, barX, barY, fillW, barH, 1.5);
                ctx.fill();
                theme.resetShadow(ctx);
                ctx.restore();
            }

            // Uptime pct label
            if (pct > 0) {
                ctx.save();
                ctx.font = '8px "JetBrains Mono", monospace';
                ctx.fillStyle = theme.rgba(sColor, 0.7);
                ctx.textBaseline = 'bottom';
                ctx.textAlign = 'right';
                ctx.fillText(pct.toFixed(1) + '%', x + w - padX, barY - 2);
                ctx.restore();
            }
        }
    },

    // ------------------------------------------------------------------
    // _roundRect — ES5 polyfill for ctx.roundRect (not in all browsers)
    // ------------------------------------------------------------------
    _roundRect: function(ctx, x, y, w, h, r) {
        if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(x, y, w, h, r);
            return;
        }
        r = Math.min(r, w / 2, h / 2);
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    },

    // ------------------------------------------------------------------
    // _truncateText — truncate string to fit maxW, append '…'
    // ------------------------------------------------------------------
    _truncateText: function(ctx, text, maxW) {
        if (!text) return '';
        if (ctx.measureText(text).width <= maxW) return text;
        var ellipsis = '…';
        var len = text.length;
        while (len > 0) {
            len--;
            var candidate = text.substring(0, len) + ellipsis;
            if (ctx.measureText(candidate).width <= maxW) return candidate;
        }
        return ellipsis;
    }

});
