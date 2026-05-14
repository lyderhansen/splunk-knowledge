'use strict';

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('theme');

// ─── helpers ─────────────────────────────────────────────────────────────────

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

// Detect whether a growth string is positive, negative, or neutral.
// Returns true, false, or null.
function growthSign(raw) {
    if (!raw) return null;
    var s = String(raw).trim();
    if (s.charAt(0) === '+') return true;
    if (s.charAt(0) === '-') return false;
    var v = parseFloat(s);
    if (isNaN(v)) return null;
    return v > 0 ? true : (v < 0 ? false : null);
}

// Clamp text to maxW with ellipsis.
function clampText(ctx, text, maxW) {
    if (!text) return '';
    if (ctx.measureText(text).width <= maxW) return text;
    var clipped = text;
    while (clipped.length > 1 && ctx.measureText(clipped + '…').width > maxW) {
        clipped = clipped.slice(0, clipped.length - 1);
    }
    return clipped + '…';
}

// Escape HTML for tooltip innerHTML.
function escHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ─── module.exports ───────────────────────────────────────────────────────────

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        // Canvas — transparent background, panel controls the fill
        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;display:block;';
        this.el.appendChild(this._canvas);

        // Tooltip DOM element
        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:7px 11px;' +
            'border-radius:6px;pointer-events:none;white-space:nowrap;' +
            'z-index:100;font-size:12px;line-height:1.6;';
        this.el.appendChild(this._tooltip);

        // State
        this._hitZones    = [];   // per-card hit regions, set during _render
        this._hoveredIdx  = -1;
        this._lastData    = null;
        this._lastConfig  = null;
        this._lastGoodData = null;
        this._gi          = 1;    // accent intensity multiplier (0-2)

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
        var result = { colIdx: colIdx, rows: data.rows };
        this._lastGoodData = result;
        return result;
    },

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

    // ─── private render ───────────────────────────────────────────────────────

    _render: function(data, config) {
        var ns = getNS(this);

        // ── Config reads ──────────────────────────────────────────────────────
        var artistField    = getOption(config, ns, 'artistField',    'artist');
        var listenersField = getOption(config, ns, 'listenersField', 'monthly_listeners');
        var growthField    = getOption(config, ns, 'growthField',    'growth');
        var marketField    = getOption(config, ns, 'marketField',    'top_market');
        var accentColor    = getOption(config, ns, 'accentColor',   '#1DB954');
        var accentInt      = parseFloat(getOption(config, ns, 'accentIntensity', '50'));
        var maxCards       = parseInt(getOption(config, ns, 'maxCards',  '15'), 10) || 15;
        var columnsOpt     = parseInt(getOption(config, ns, 'columns',   '0'),  10);
        var showMarket     = getOption(config, ns, 'showMarket', 'true') !== 'false';

        if (isNaN(accentInt)) accentInt = 50;
        this._gi = Math.max(0, Math.min(100, accentInt)) / 50; // 0-2 range

        // ── Dimensions + HiDPI ───────────────────────────────────────────────
        var w   = this.el.offsetWidth  || 600;
        var h   = this.el.offsetHeight || 400;
        var dpr = window.devicePixelRatio || 1;

        this._canvas.width        = Math.round(w * dpr);
        this._canvas.height       = Math.round(h * dpr);
        this._canvas.style.width  = w + 'px';
        this._canvas.style.height = h + 'px';

        var ctx = this._canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        // ── Theme ────────────────────────────────────────────────────────────
        var mode  = theme.detectTheme(this.el);
        var t     = theme.getTheme(mode);
        var fonts = theme.getFonts();
        var rx    = theme.THEME.cornerRadius; // 8

        // Tooltip style from theme
        this._tooltip.style.background  = t.panelHi;
        this._tooltip.style.color       = t.text;
        this._tooltip.style.fontFamily  = fonts.ui;
        this._tooltip.style.border      = '1px solid ' + theme.hexToRgba(accentColor, 0.35);

        // ── Extract + sort rows ──────────────────────────────────────────────
        ctx.clearRect(0, 0, w, h);

        if (!data || !data.rows || !data.colIdx) {
            this._drawEmpty(ctx, w, h, t, fonts);
            return;
        }

        var colIdx = data.colIdx;
        var rows   = data.rows;

        var tiArtist    = colIdx[artistField]    !== undefined ? colIdx[artistField]    : -1;
        var tiListeners = colIdx[listenersField] !== undefined ? colIdx[listenersField] : -1;
        var tiGrowth    = colIdx[growthField]    !== undefined ? colIdx[growthField]    : -1;
        var tiMarket    = colIdx[marketField]    !== undefined ? colIdx[marketField]    : -1;

        if (tiArtist < 0 || tiListeners < 0) {
            this._drawEmpty(ctx, w, h, t, fonts);
            return;
        }

        // Parse and sort descending by monthly_listeners
        var cards = [];
        for (var i = 0; i < rows.length && cards.length < maxCards; i++) {
            var row = rows[i];
            var artistName = tiArtist    >= 0 ? (String(row[tiArtist]    || '')) : '';
            var listenersRaw = tiListeners >= 0 ? row[tiListeners] : '0';
            var growthRaw  = tiGrowth   >= 0 ? (String(row[tiGrowth]   || '')) : '';
            var marketRaw  = tiMarket   >= 0 ? (String(row[tiMarket]   || '')) : '';

            var listeners = parseFloat(listenersRaw);
            if (isNaN(listeners)) listeners = 0;

            if (!artistName) continue;

            cards.push({
                artist:    artistName,
                listeners: listeners,
                growth:    growthRaw,
                market:    marketRaw
            });
        }

        // Sort descending
        cards.sort(function(a, b) { return b.listeners - a.listeners; });

        if (cards.length === 0) {
            this._drawEmpty(ctx, w, h, t, fonts);
            return;
        }

        // ── Grid layout ──────────────────────────────────────────────────────
        var outerPad = Math.max(8, Math.round(Math.min(w, h) * 0.025));
        var gutter   = Math.max(6, Math.round(Math.min(w, h) * 0.015));

        // Column count: auto (0) → fit between 2 and 4 based on panel width
        var cols;
        if (columnsOpt > 0) {
            cols = columnsOpt;
        } else {
            // heuristic: 1 column per 180px of available width, clamp 2-4
            cols = Math.max(2, Math.min(4, Math.floor((w - outerPad * 2 + gutter) / (180 + gutter))));
        }

        var rows2 = Math.ceil(cards.length / cols);
        var cardW = Math.floor((w - outerPad * 2 - gutter * (cols - 1)) / cols);
        var cardH = Math.floor((h - outerPad * 2 - gutter * (rows2 - 1)) / rows2);
        cardH = Math.max(80, Math.min(cardH, 180)); // sanity clamp

        // ── Per-card sizes (scale from card dimensions) ───────────────────────
        var padX         = Math.max(8,  Math.round(cardW * 0.09));
        var padTop       = Math.max(7,  Math.round(cardH * 0.10));
        var padBot       = Math.max(6,  Math.round(cardH * 0.09));
        var artistFSize  = Math.max(10, Math.round(cardH * 0.16));
        var heroFSize    = Math.max(18, Math.round(cardH * 0.30));
        var pillFSize    = Math.max(8,  Math.round(cardH * 0.12));
        var mktFSize     = Math.max(7,  Math.round(cardH * 0.11));

        // Reset hit zones
        this._hitZones = [];

        // ── Draw each card ───────────────────────────────────────────────────
        for (var ci = 0; ci < cards.length; ci++) {
            var card = cards[ci];
            var col  = ci % cols;
            var row2 = Math.floor(ci / cols);

            var cx = outerPad + col * (cardW + gutter);
            var cy = outerPad + row2 * (cardH + gutter);

            var isHovered = (this._hoveredIdx === ci);

            // ── Card background ──
            var cardBg = mode === 'dark'
                ? (isHovered ? '#2A2A2A' : '#1E1E1E')
                : (isHovered ? '#F0F0F0' : '#FFFFFF');

            ctx.fillStyle = cardBg;
            theme.fillRoundRect(ctx, cx, cy, cardW, cardH, rx);

            // ── Card border ──
            var borderAlpha = isHovered ? 0.55 : 0.12;
            ctx.strokeStyle = theme.hexToRgba(accentColor, borderAlpha);
            ctx.lineWidth   = isHovered ? 1.5 : 1;
            theme.strokeRoundRect(ctx, cx, cy, cardW, cardH, rx);

            // ── Hover glow ──
            if (isHovered && this._gi > 0) {
                ctx.shadowColor   = theme.hexToRgba(accentColor, 0.25 * this._gi);
                ctx.shadowBlur    = 14 * this._gi;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                ctx.strokeStyle   = theme.hexToRgba(accentColor, 0.55);
                ctx.lineWidth     = 1.5;
                theme.strokeRoundRect(ctx, cx, cy, cardW, cardH, rx);
                // Reset shadow for subsequent draws
                ctx.shadowBlur    = 0;
                ctx.shadowColor   = 'transparent';
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            } else {
                ctx.shadowBlur    = 0;
                ctx.shadowColor   = 'transparent';
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            }

            // ── Artist name (top, bold) ──
            var nameY = cy + padTop + artistFSize;
            ctx.font         = 'bold ' + artistFSize + 'px ' + fonts.ui;
            ctx.textAlign    = 'left';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle    = isHovered ? t.textBright : t.text;

            var nameMaxW = cardW - padX * 2;
            var nameStr  = clampText(ctx, card.artist, nameMaxW);
            ctx.fillText(nameStr, cx + padX, nameY);

            // ── Monthly listeners (hero, compact) ──
            var heroStr = theme.fmtNum(card.listeners, { compact: true });
            var heroY   = nameY + Math.round(cardH * 0.24) + heroFSize;

            ctx.font         = 'bold ' + heroFSize + 'px ' + fonts.ui;
            ctx.textAlign    = 'left';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle    = t.textBright;
            ctx.fillText(heroStr, cx + padX, heroY);

            // ── Layout for badges row (bottom zone of card) ──
            var badgeRowY    = cy + cardH - padBot - pillFSize - Math.round(pillFSize * 0.6);
            var badgeCursor  = cx + padX;

            // ── Growth delta pill ──
            if (card.growth) {
                var sign   = growthSign(card.growth);
                var pillColor = sign === true
                    ? accentColor
                    : (sign === false ? t.coral : t.textMuted);

                ctx.font = 'bold ' + pillFSize + 'px ' + fonts.ui;
                var growthW   = ctx.measureText(card.growth).width;
                var pillPadX  = Math.max(5, Math.round(pillFSize * 0.7));
                var pillPadY  = Math.max(2, Math.round(pillFSize * 0.45));
                var pillBW    = growthW + pillPadX * 2;
                var pillBH    = pillFSize + pillPadY * 2;
                var pillBY    = badgeRowY - pillPadY;

                // Pill background
                ctx.fillStyle = theme.hexToRgba(pillColor, 0.15);
                theme.fillRoundRect(ctx, badgeCursor, pillBY, pillBW, pillBH, Math.round(pillBH / 2));

                // Pill text
                ctx.fillStyle    = pillColor;
                ctx.textAlign    = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(card.growth, badgeCursor + pillPadX, pillBY + pillBH * 0.5);

                badgeCursor += pillBW + Math.max(4, Math.round(cardW * 0.03));
            }

            // ── Top market pill ──
            if (showMarket && card.market) {
                ctx.font = mktFSize + 'px ' + fonts.ui;
                var mktW      = ctx.measureText(card.market).width;
                var mktPadX   = Math.max(4, Math.round(mktFSize * 0.7));
                var mktPadY   = Math.max(2, Math.round(mktFSize * 0.5));
                var mktBW     = mktW + mktPadX * 2;
                var mktBH     = mktFSize + mktPadY * 2;
                var mktBY     = badgeRowY - mktPadY + Math.round((pillFSize - mktFSize) * 0.5);

                // Subtle background
                ctx.fillStyle = mode === 'dark'
                    ? 'rgba(255,255,255,0.07)'
                    : 'rgba(0,0,0,0.06)';
                theme.fillRoundRect(ctx, badgeCursor, mktBY, mktBW, mktBH, Math.round(mktBH / 2));

                // Market text
                ctx.fillStyle    = t.textMuted;
                ctx.textAlign    = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(card.market, badgeCursor + mktPadX, mktBY + mktBH * 0.5);
            }

            // ── Thin accent bar at bottom edge of card ──
            var accentBarH = Math.max(2, Math.round(cardH * 0.025));
            var accentBarY = cy + cardH - accentBarH;

            // Gradient accent to teal
            var accentGrad = ctx.createLinearGradient(cx, 0, cx + cardW, 0);
            accentGrad.addColorStop(0, theme.hexToRgba(accentColor, isHovered ? 0.7 : 0.25));
            accentGrad.addColorStop(1, theme.hexToRgba(t.teal,      isHovered ? 0.5 : 0.12));
            ctx.fillStyle = accentGrad;
            // Use fillRect for the accent bar (not clearRect — this IS foreground content)
            // rounded bottom corners to match card
            ctx.beginPath();
            ctx.moveTo(cx, accentBarY);
            ctx.lineTo(cx + cardW, accentBarY);
            ctx.arcTo(cx + cardW, cy + cardH, cx, cy + cardH, rx);
            ctx.arcTo(cx,         cy + cardH, cx, accentBarY, rx);
            ctx.closePath();
            ctx.fill();

            // ── Register hit zone ──
            this._hitZones.push({
                index:     ci,
                x:         cx,
                y:         cy,
                w:         cardW,
                h:         cardH,
                artist:    card.artist,
                listeners: card.listeners,
                growth:    card.growth,
                market:    card.market
            });
        }
    },

    _drawEmpty: function(ctx, w, h, t, fonts) {
        ctx.clearRect(0, 0, w, h);
        ctx.font         = '13px ' + fonts.ui;
        ctx.fillStyle    = t.textMuted;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No artist data', w / 2, h / 2);
    },

    // ─── mouse events ─────────────────────────────────────────────────────────

    _onMouseMove: function(e) {
        var rect = this._canvas.getBoundingClientRect();
        var mx   = e.clientX - rect.left;
        var my   = e.clientY - rect.top;

        var hit = null;
        for (var i = 0; i < this._hitZones.length; i++) {
            var z = this._hitZones[i];
            if (mx >= z.x && mx <= z.x + z.w && my >= z.y && my <= z.y + z.h) {
                hit = z;
                break;
            }
        }

        if (hit) {
            this._canvas.style.cursor = 'default';

            // Rebuild only when hovered card changes
            if (this._hoveredIdx !== hit.index) {
                this._hoveredIdx = hit.index;
                if (this._lastData && this._lastConfig) {
                    this._render(this._lastData, this._lastConfig);
                }
            }

            // Build tooltip
            var lines = [];
            lines.push('<strong>' + escHtml(hit.artist) + '</strong>');
            lines.push('Monthly listeners: ' + theme.fmtNum(hit.listeners, { compact: true }));
            if (hit.growth)  lines.push('Growth: ' + escHtml(hit.growth));
            if (hit.market)  lines.push('Top market: ' + escHtml(hit.market));

            this._tooltip.innerHTML = lines.join('<br>');
            this._tooltip.style.display = 'block';

            // Position tooltip — stay inside panel
            var tx = mx + 14;
            var ty = hit.y;
            if (tx + 180 > (this.el.offsetWidth || 600))  tx = mx - 180;
            if (ty + 100 > (this.el.offsetHeight || 400))  ty = my - 100;
            if (ty < 0)  ty = my + 14;
            this._tooltip.style.left = tx + 'px';
            this._tooltip.style.top  = ty + 'px';

        } else {
            this._onMouseLeave();
        }
    },

    _onMouseLeave: function() {
        if (this._hoveredIdx !== -1) {
            this._hoveredIdx = -1;
            this._tooltip.style.display = 'none';
            this._canvas.style.cursor   = 'default';
            if (this._lastData && this._lastConfig) {
                this._render(this._lastData, this._lastConfig);
            }
        } else {
            this._tooltip.style.display = 'none';
        }
    },

    // ─── lifecycle ────────────────────────────────────────────────────────────

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
