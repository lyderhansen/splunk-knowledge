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

// ─── visualization ───────────────────────────────────────────────────────────

module.exports = SplunkVisualizationBase.extend({

    // ── lifecycle ────────────────────────────────────────────────────────────

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        // canvas
        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'display:block;width:100%;height:100%;';
        this.el.appendChild(this._canvas);

        // tooltip
        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 10px;border-radius:6px;' +
            'pointer-events:none;white-space:nowrap;z-index:100;font-size:11px;' +
            'box-shadow:0 2px 8px rgba(0,0,0,0.4);';
        this.el.appendChild(this._tooltip);

        // state
        this._hitRegions = [];
        this._hoverIdx = -1;
        this._lastData = null;
        this._lastConfig = null;
        this._lastGoodData = null;

        // events
        var self = this;
        this._canvas.addEventListener('mousemove', function(e) { self._onMouseMove(e); });
        this._canvas.addEventListener('mouseleave', function() { self._onMouseLeave(); });
        this._canvas.addEventListener('click', function(e) { self._onClick(e); });
    },

    getInitialDataParams: function() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },

    // ── data ─────────────────────────────────────────────────────────────────

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

    // ── view ─────────────────────────────────────────────────────────────────

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

    destroy: function() {
        if (this._tooltip && this._tooltip.parentNode) {
            this._tooltip.parentNode.removeChild(this._tooltip);
        }
        if (this._canvas) {
            this._canvas.removeEventListener('mousemove', this._onMouseMove);
            this._canvas.removeEventListener('mouseleave', this._onMouseLeave);
            this._canvas.removeEventListener('click', this._onClick);
        }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    },

    // ── render ───────────────────────────────────────────────────────────────

    _render: function(data, config) {
        var canvas = this._canvas;
        var container = this.el;
        var w = container.clientWidth  || 600;
        var h = container.clientHeight || 350;

        if (w === 0 || h === 0) return;

        var dpr = window.devicePixelRatio || 1;
        canvas.width  = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width  = w + 'px';
        canvas.style.height = h + 'px';

        var ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        // ── config ──────────────────────────────────────────────────────────
        var ns = getNS(this);
        var mode          = getOption(config, ns, 'theme',          detectThemeAuto(this.el));
        var genreField    = getOption(config, ns, 'genreField',     'genre');
        var shareField    = getOption(config, ns, 'shareField',     'share');
        var trendField    = getOption(config, ns, 'trendField',     'trend');
        var listenersField= getOption(config, ns, 'listenersField', 'listeners');
        var accentInt     = parseFloat(getOption(config, ns, 'accentIntensity', '50'));
        if (isNaN(accentInt)) accentInt = 50;
        var showTrend     = getOption(config, ns, 'showTrend', 'true') !== 'false';
        var userBarHeight = parseInt(getOption(config, ns, 'barHeight', '0'), 10) || 0;
        var maxBars       = parseInt(getOption(config, ns, 'maxBars', '10'), 10) || 10;

        // ── theme ───────────────────────────────────────────────────────────
        var t     = theme.getTheme(mode);
        var fonts = theme.getFonts();
        var gi    = Math.max(0, Math.min(100, accentInt)) / 50; // 0-2 intensity

        // ── data prep ───────────────────────────────────────────────────────
        if (!data || !data.rows || data.rows.length === 0) {
            this._drawEmpty(ctx, w, h, t, fonts);
            return;
        }

        var colIdx   = data.colIdx || {};
        var rows     = data.rows;
        var gIdx     = colIdx[genreField];
        var sIdx     = colIdx[shareField];
        var trIdx    = colIdx[trendField];
        var lIdx     = colIdx[listenersField];

        if (gIdx === undefined || sIdx === undefined) {
            this._drawEmpty(ctx, w, h, t, fonts);
            return;
        }

        // parse + sort
        var items = [];
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            var shareRaw = parseFloat(row[sIdx]);
            if (isNaN(shareRaw)) continue;
            items.push({
                genre:     String(row[gIdx] || ''),
                share:     shareRaw,
                trend:     trIdx !== undefined ? String(row[trIdx] || '') : '',
                listeners: lIdx  !== undefined ? row[lIdx] : null
            });
        }
        items.sort(function(a, b) { return b.share - a.share; });
        if (items.length > maxBars) items = items.slice(0, maxBars);
        if (items.length === 0) {
            this._drawEmpty(ctx, w, h, t, fonts);
            return;
        }

        var maxShare = items[0].share;

        // ── layout ──────────────────────────────────────────────────────────
        var padX     = Math.max(12, Math.round(w * 0.03));
        var padY     = Math.max(8,  Math.round(h * 0.04));
        var n        = items.length;
        var gap      = Math.max(4, Math.round(h * 0.012));
        var availH   = h - padY * 2;
        var autoBarH = Math.max(16, Math.floor((availH - gap * (n - 1)) / n));
        var barH     = userBarHeight > 0 ? userBarHeight : autoBarH;
        var totalH   = n * barH + (n - 1) * gap;
        var startY   = padY + Math.max(0, (availH - totalH) / 2);

        // measure longest genre label
        var fontSize = Math.max(9, Math.round(barH * 0.45));
        ctx.font = fontSize + 'px ' + fonts.ui;
        var labelW = 0;
        for (var j = 0; j < items.length; j++) {
            var lw = ctx.measureText(items[j].genre).width;
            if (lw > labelW) labelW = lw;
        }
        labelW = Math.min(labelW + 12, w * 0.28);

        // right column: pct + optional trend arrow
        ctx.font = fontSize + 'px ' + fonts.data;
        var pctW  = ctx.measureText('100.0%▲').width + 10;
        pctW = Math.min(pctW, w * 0.14);

        var barAreaX = padX + labelW + 8;
        var barAreaW = w - barAreaX - padX - pctW - 6;
        if (barAreaW < 20) barAreaW = 20;

        // ── draw rows ───────────────────────────────────────────────────────
        this._hitRegions = [];
        this._gi         = gi;
        this._t          = t;
        this._fonts      = fonts;

        for (var k = 0; k < items.length; k++) {
            var item  = items[k];
            var rowY  = startY + k * (barH + gap);
            var color = theme.getGenreColor(k);
            var pct   = maxShare > 0 ? item.share / maxShare : 0;
            var isHov = (this._hoverIdx === k);

            this._drawRow(ctx, {
                x:         padX,
                y:         rowY,
                labelW:    labelW,
                barAreaX:  barAreaX,
                barAreaW:  barAreaW,
                pctX:      barAreaX + barAreaW + 6,
                pctW:      pctW,
                barH:      barH,
                item:      item,
                color:     color,
                pct:       pct,
                isHov:     isHov,
                showTrend: showTrend,
                fontSize:  fontSize,
                t:         t,
                fonts:     fonts,
                gi:        gi
            });

            // store hit region
            this._hitRegions.push({
                x:      padX,
                y:      rowY,
                w:      w - padX * 2,
                h:      barH,
                idx:    k,
                item:   item,
                color:  color
            });
        }
    },

    // ── row draw ─────────────────────────────────────────────────────────────

    _drawRow: function(ctx, o) {
        var t        = o.t;
        var fonts    = o.fonts;
        var barH     = o.barH;
        var rx       = barH / 2; // pill shape
        var item     = o.item;
        var gi       = o.gi;
        var isHov    = o.isHov;

        // ── hover row bg ────────────────────────────────────────────────────
        if (isHov) {
            ctx.fillStyle = t.hover;
            theme.fillRoundRect(ctx, o.x - 4, o.y - 2, o.labelW + (o.barAreaW + o.pctW + 20) + 8, barH + 4, 4);
        }

        // ── genre label ─────────────────────────────────────────────────────
        ctx.font      = o.fontSize + 'px ' + fonts.ui;
        ctx.fillStyle = isHov ? t.textBright : t.text;
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'middle';

        var labelText = item.genre;
        // truncate to fit
        var maxLW = o.labelW - 4;
        while (labelText.length > 1 && ctx.measureText(labelText).width > maxLW) {
            labelText = labelText.slice(0, -1);
        }
        if (labelText !== item.genre) labelText = labelText.slice(0, -1) + '…';
        ctx.fillText(labelText, o.x, o.y + barH / 2);

        // ── track (background bar) ──────────────────────────────────────────
        ctx.fillStyle = t.barTrack;
        theme.fillRoundRect(ctx, o.barAreaX, o.y, o.barAreaW, barH, rx);

        // ── filled bar ──────────────────────────────────────────────────────
        var fillW = Math.max(rx * 2, o.barAreaW * o.pct);
        var barColor = o.color;

        if (isHov) {
            // brighten on hover: blend toward white slightly
            barColor = theme.lerpColor(o.color, '#FFFFFF', 0.15);
        }

        // glow behind bar at high accent intensity
        if (gi > 0.6) {
            ctx.shadowColor  = theme.hexToRgba(o.color, Math.min(0.7, (gi - 0.6) * 1.0));
            ctx.shadowBlur   = Math.round(barH * 0.6 * (gi - 0.6));
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        ctx.fillStyle = barColor;
        theme.fillRoundRect(ctx, o.barAreaX, o.y, fillW, barH, rx);

        // reset shadow
        ctx.shadowBlur   = 0;
        ctx.shadowColor  = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // ── percentage + trend ───────────────────────────────────────────────
        var pctText  = item.share.toFixed(1) + '%';
        var trendCh  = '';
        var trendCol = t.textMuted;

        if (o.showTrend) {
            var tr = (item.trend || '').toLowerCase();
            if (tr === 'up')     { trendCh = ' ▲'; trendCol = t.accent; }
            else if (tr === 'down') { trendCh = ' ▼'; trendCol = '#E91E8A'; }
            else if (tr === 'stable') { trendCh = ' —'; trendCol = t.textMuted; }
        }

        ctx.textAlign    = 'right';
        ctx.textBaseline = 'middle';
        var rightX = o.pctX + o.pctW - 2;

        // pct value
        ctx.font      = o.fontSize + 'px ' + fonts.data;
        ctx.fillStyle = isHov ? t.textBright : t.text;
        ctx.fillText(pctText, rightX - (trendCh ? (o.fontSize * 1.1) : 0), o.y + barH / 2);

        // trend arrow
        if (trendCh) {
            ctx.fillStyle = trendCol;
            ctx.font = Math.max(8, o.fontSize - 1) + 'px ' + fonts.ui;
            ctx.fillText(trendCh.trim(), rightX, o.y + barH / 2);
        }
    },

    // ── empty state ──────────────────────────────────────────────────────────

    _drawEmpty: function(ctx, w, h, t, fonts) {
        ctx.clearRect(0, 0, w, h);
        ctx.font      = '13px ' + fonts.ui;
        ctx.fillStyle = t.textMuted;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No genre data', w / 2, h / 2);
    },

    // ── events ───────────────────────────────────────────────────────────────

    _onMouseMove: function(e) {
        var rect = this._canvas.getBoundingClientRect();
        var mx   = e.clientX - rect.left;
        var my   = e.clientY - rect.top;

        var hit = this._hitTest(mx, my);
        var newHov = hit ? hit.idx : -1;

        if (newHov !== this._hoverIdx) {
            this._hoverIdx = newHov;
            if (this._lastData && this._lastConfig) {
                this._render(this._lastData, this._lastConfig);
            }
        }

        if (hit) {
            this._showTooltip(mx, my, hit.item, hit.color);
            this._canvas.style.cursor = 'pointer';
        } else {
            this._hideTooltip();
            this._canvas.style.cursor = 'default';
        }
    },

    _onMouseLeave: function() {
        if (this._hoverIdx !== -1) {
            this._hoverIdx = -1;
            if (this._lastData && this._lastConfig) {
                this._render(this._lastData, this._lastConfig);
            }
        }
        this._hideTooltip();
    },

    _onClick: function(e) {
        var rect = this._canvas.getBoundingClientRect();
        var mx   = e.clientX - rect.left;
        var my   = e.clientY - rect.top;
        var hit  = this._hitTest(mx, my);
        if (!hit) return;
        var ns = getNS(this);
        var genreField = getOption(this._lastConfig || {}, ns, 'genreField', 'genre');
        var payload = {};
        payload[genreField] = hit.item.genre;
        try {
            this.drilldown({
                action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
                data:   payload
            }, e);
        } catch (ex) { /* test harness */ }
    },

    _hitTest: function(mx, my) {
        for (var i = 0; i < this._hitRegions.length; i++) {
            var r = this._hitRegions[i];
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                return r;
            }
        }
        return null;
    },

    _showTooltip: function(mx, my, item, color) {
        var t     = this._t     || theme.getTheme('dark');
        var fonts = this._fonts || theme.getFonts();
        var tip   = this._tooltip;

        tip.style.background  = t.panelHi;
        tip.style.color       = t.textBright;
        tip.style.fontFamily  = fonts.ui;
        tip.style.fontSize    = '11px';
        tip.style.borderLeft  = '3px solid ' + color;

        var lines = [item.genre + ': ' + item.share.toFixed(1) + '%'];
        if (item.listeners !== null && item.listeners !== undefined && String(item.listeners) !== '') {
            var lisNum = parseFloat(item.listeners);
            if (!isNaN(lisNum)) {
                lines.push(theme.fmtNum(lisNum) + ' listeners');
            }
        }
        if (item.trend && item.trend !== '') {
            lines.push('Trend: ' + item.trend);
        }
        tip.innerHTML = lines.join('<br>');

        var containerW = this.el.clientWidth;
        var tipX = mx + 14;
        if (tipX + 160 > containerW) tipX = mx - 14 - 160;
        if (tipX < 4) tipX = 4;

        tip.style.left    = tipX + 'px';
        tip.style.top     = (my - 8) + 'px';
        tip.style.display = 'block';
    },

    _hideTooltip: function() {
        this._tooltip.style.display = 'none';
    }

});

// ── local helper (not from theme module) ─────────────────────────────────────

function detectThemeAuto(el) {
    return theme.detectTheme(el);
}
