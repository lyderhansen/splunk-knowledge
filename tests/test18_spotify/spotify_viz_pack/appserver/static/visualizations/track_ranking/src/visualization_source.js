'use strict';

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('theme');

// ─── helpers ────────────────────────────────────────────────────────────────

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

// ─── module.exports ──────────────────────────────────────────────────────────

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        // Canvas
        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;';
        this.el.appendChild(this._canvas);
        this._ctx = this._canvas.getContext('2d');

        // Tooltip
        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:7px 11px;' +
            'border-radius:6px;pointer-events:none;white-space:nowrap;' +
            'z-index:100;font-size:12px;line-height:1.5;';
        this.el.appendChild(this._tooltip);

        // State
        this._hitZones = [];
        this._hoveredIndex = -1;
        this._lastData = null;
        this._lastConfig = null;
        this._lastGoodData = null;

        var self = this;
        this._canvas.addEventListener('mousemove', function(e) { self._onMouseMove(e); });
        this._canvas.addEventListener('mouseleave', function() { self._onMouseLeave(); });
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
        this._lastData = data;
        this._lastConfig = config;
        this._render(data, config);
    },

    reflow: function() {
        if (this._lastData && this._lastConfig) {
            this._render(this._lastData, this._lastConfig);
        }
    },

    // ── private render ────────────────────────────────────────────────────────

    _render: function(data, config) {
        var ns = getNS(this);
        var t = theme.getTheme(getOption(config, ns, 'theme', 'dark'));
        var fonts = theme.getFonts();

        // Canvas sizing
        var w = this.el.clientWidth || 400;
        var h = this.el.clientHeight || 300;
        var dpr = window.devicePixelRatio || 1;
        this._canvas.width = Math.round(w * dpr);
        this._canvas.height = Math.round(h * dpr);
        this._canvas.style.width = w + 'px';
        this._canvas.style.height = h + 'px';
        var ctx = this._ctx;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, w, h);

        // Config reads
        var trackField    = getOption(config, ns, 'trackField',    'track_name');
        var artistField   = getOption(config, ns, 'artistField',   'artist');
        var streamsField  = getOption(config, ns, 'streamsField',  'streams');
        var durationField = getOption(config, ns, 'durationField', 'duration');
        var genreField    = getOption(config, ns, 'genreField',    'genre');
        var accentColor   = getOption(config, ns, 'accentColor',  '#1DB954');
        var maxRows       = parseInt(getOption(config, ns, 'maxRows', '10'), 10) || 10;
        var showDuration  = getOption(config, ns, 'showDuration', 'true') !== 'false';
        var showGenre     = getOption(config, ns, 'showGenre',    'true') !== 'false';
        var accentIntensity = theme.getAccentIntensity({ accentIntensity: getOption(config, ns, 'accentIntensity', '50') });

        // Validate data
        if (!data || !data.rows || !data.colIdx) {
            this._drawEmpty(ctx, w, h, t, fonts);
            return;
        }

        var colIdx  = data.colIdx;
        var rows    = data.rows;
        var tiTrack   = colIdx[trackField]    !== undefined ? colIdx[trackField]    : -1;
        var tiArtist  = colIdx[artistField]   !== undefined ? colIdx[artistField]   : -1;
        var tiStreams  = colIdx[streamsField]  !== undefined ? colIdx[streamsField]  : -1;
        var tiDur     = colIdx[durationField] !== undefined ? colIdx[durationField] : -1;
        var tiGenre   = colIdx[genreField]    !== undefined ? colIdx[genreField]    : -1;

        if (tiTrack < 0 || tiStreams < 0) {
            this._drawEmpty(ctx, w, h, t, fonts);
            return;
        }

        // Slice rows
        var visRows = rows.slice(0, maxRows);
        var count = visRows.length;
        if (count === 0) {
            this._drawEmpty(ctx, w, h, t, fonts);
            return;
        }

        // Max streams for bar scaling
        var maxStreams = 0;
        for (var i = 0; i < count; i++) {
            var s = parseFloat(visRows[i][tiStreams]) || 0;
            if (s > maxStreams) maxStreams = s;
        }
        if (maxStreams === 0) maxStreams = 1;

        // Layout
        var padX = Math.max(12, Math.round(w * 0.03));
        var padY = Math.max(8,  Math.round(h * 0.025));
        var rankW    = Math.max(28, Math.round(w * 0.06));
        var dotW     = showGenre ? Math.max(8, Math.round(w * 0.015)) : 0;
        var dotGap   = showGenre ? dotW + 6 : 0;
        var durW     = showDuration ? Math.max(38, Math.round(w * 0.075)) : 0;
        var durGap   = showDuration ? durW + 8 : 0;
        var countW   = Math.max(36, Math.round(w * 0.07));
        var metaW    = dotGap + durGap + countW;
        var availW   = w - padX * 2 - rankW - metaW - padX;
        var labelW   = Math.max(60, Math.round(availW * 0.38));
        var barAreaW = availW - labelW - padX;

        var totalH = h - padY * 2;
        var rowH   = Math.max(20, Math.floor(totalH / count));
        var rowGap = Math.max(2, Math.round(rowH * 0.1));
        var innerH = rowH - rowGap;

        var rankFontSize   = Math.max(9, Math.round(innerH * 0.52));
        var trackFontSize  = Math.max(8, Math.round(innerH * 0.38));
        var artistFontSize = Math.max(7, Math.round(innerH * 0.28));
        var countFontSize  = Math.max(7, Math.round(innerH * 0.3));
        var durFontSize    = Math.max(6, Math.round(innerH * 0.28));

        var barH   = Math.max(4, Math.round(innerH * 0.22));
        var barY   = Math.round(innerH * 0.58);

        // Tooltip style from theme
        this._tooltip.style.background = t.panelHi;
        this._tooltip.style.color = t.text;
        this._tooltip.style.fontFamily = fonts.ui;
        this._tooltip.style.border = '1px solid ' + t.cardBorder;

        // Accent teal gradient color
        var tealColor = t.teal;

        // Reset hit zones
        this._hitZones = [];
        this._t = t;
        this._fonts = fonts;
        this._tealColor = tealColor;
        this._accentColor = accentColor;
        this._accentIntensity = accentIntensity;

        // Draw rows
        for (var r = 0; r < count; r++) {
            var row = visRows[r];
            var rank = r + 1;
            var trackName  = tiTrack  >= 0 ? (row[tiTrack]  || '—') : '—';
            var artistName = tiArtist >= 0 ? (row[tiArtist] || '')  : '';
            var streamVal  = parseFloat(row[tiStreams]) || 0;
            var durStr     = (tiDur >= 0 && showDuration) ? (row[tiDur] || '') : '';
            var genreStr   = (tiGenre >= 0 && showGenre)  ? (row[tiGenre] || '') : '';
            var plAdds     = colIdx['playlist_adds'] !== undefined ? (row[colIdx['playlist_adds']] || '') : '';

            var isHovered = (this._hoveredIndex === r);
            var rowTop = padY + r * rowH;

            // Row background highlight
            if (isHovered) {
                ctx.fillStyle = t.hover;
                theme.fillRoundRect(ctx, padX, rowTop, w - padX * 2, innerH, 4);
            } else if (r % 2 === 1) {
                ctx.fillStyle = t.rowAlt;
                theme.fillRoundRect(ctx, padX, rowTop, w - padX * 2, innerH, 4);
            }

            var cx = padX;

            // ── Rank number ──
            var isTop3 = rank <= 3;
            if (isTop3) {
                var rankFactor = rank === 1 ? 1.35 : (rank === 2 ? 1.15 : 1.0);
                var rSize = Math.round(rankFontSize * rankFactor);
                ctx.font = 'bold ' + rSize + 'px ' + fonts.ui;
                ctx.fillStyle = isHovered ? theme.lerpColor(accentColor, '#FFFFFF', 0.3) : accentColor;
            } else {
                ctx.font = 'bold ' + rankFontSize + 'px ' + fonts.ui;
                ctx.fillStyle = t.textMuted;
            }
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(rank), cx + rankW, rowTop + Math.round(innerH * 0.45));

            cx += rankW + padX;

            // ── Track + artist label ──
            var labelX = cx;
            var trackY = rowTop + Math.round(innerH * 0.32);
            var artistY = rowTop + Math.round(innerH * 0.68);

            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            // Track name — clamp to labelW
            ctx.font = 'bold ' + trackFontSize + 'px ' + fonts.ui;
            ctx.fillStyle = isHovered ? t.textBright : t.text;
            var tName = this._clampText(ctx, trackName, labelW);
            ctx.fillText(tName, labelX, trackY);

            // Artist name
            ctx.font = artistFontSize + 'px ' + fonts.ui;
            ctx.fillStyle = t.textMuted;
            var aName = this._clampText(ctx, artistName, labelW);
            ctx.fillText(aName, labelX, artistY);

            cx += labelW + padX;

            // ── Bar ──
            var barX = cx;
            var barRatio = streamVal / maxStreams;
            // #1 gets full glow width boost
            var barWidthFull = barAreaW;
            var barFill = Math.max(4, Math.round(barWidthFull * barRatio));

            // Bar track
            ctx.fillStyle = t.barTrack;
            theme.fillRoundRect(ctx, barX, rowTop + barY, barWidthFull, barH, barH / 2);

            // Bar fill — gradient accent → teal
            var gradAccent = isHovered ? theme.lerpColor(accentColor, '#FFFFFF', 0.15) : accentColor;
            var grad = ctx.createLinearGradient(barX, 0, barX + barFill, 0);
            grad.addColorStop(0, gradAccent);
            grad.addColorStop(1, tealColor);
            ctx.fillStyle = grad;

            // Glow on top 3
            if (isTop3) {
                var glowAlpha = (accentIntensity * 0.6) * (rank === 1 ? 1 : rank === 2 ? 0.75 : 0.5);
                ctx.shadowColor = gradAccent;
                ctx.shadowBlur = Math.round(barH * 2.5 * glowAlpha);
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            }
            theme.fillRoundRect(ctx, barX, rowTop + barY, barFill, barH, barH / 2);

            // Reset shadow
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            cx += barAreaW + padX;

            // ── Stream count ──
            var countX = cx + countW;
            ctx.font = countFontSize + 'px ' + fonts.data;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isHovered ? t.textBright : t.text;
            ctx.fillText(theme.fmtNum(streamVal, { compact: true }), countX, rowTop + Math.round(innerH * 0.45));

            cx += countW + 8;

            // ── Duration badge ──
            if (showDuration && durStr) {
                var durX = cx;
                var durCenterY = rowTop + Math.round(innerH * 0.45);
                var durPadX = Math.max(5, Math.round(durFontSize * 0.7));
                var durPadY = Math.max(2, Math.round(durFontSize * 0.4));

                ctx.font = durFontSize + 'px ' + fonts.data;
                var durMeasure = ctx.measureText(durStr).width;
                var badgeW = durMeasure + durPadX * 2;
                var badgeH = durFontSize + durPadY * 2;

                ctx.fillStyle = t.panelHi;
                theme.fillRoundRect(ctx, durX, durCenterY - Math.round(badgeH / 2), badgeW, badgeH, Math.round(badgeH / 2));

                ctx.fillStyle = t.textMuted;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(durStr, durX + durPadX, durCenterY);

                cx += Math.round(badgeW) + 6;
            }

            // ── Genre dot ──
            if (showGenre && genreStr) {
                var dotRadius = Math.max(3, Math.round(dotW / 2));
                var dotX = cx + dotRadius;
                var dotCY = rowTop + Math.round(innerH * 0.45);
                var genreIdx = this._genreIndex(genreStr);
                var dotColor = theme.getGenreColor(genreIdx);

                ctx.beginPath();
                ctx.arc(dotX, dotCY, dotRadius, 0, Math.PI * 2);
                ctx.fillStyle = dotColor;
                ctx.fill();
            }

            // Store hit zone
            this._hitZones.push({
                index: r,
                top: rowTop,
                bottom: rowTop + innerH,
                rank: rank,
                track: trackName,
                artist: artistName,
                streams: streamVal,
                duration: durStr,
                genre: genreStr,
                playlistAdds: plAdds
            });
        }
    },

    _drawEmpty: function(ctx, w, h, t, fonts) {
        ctx.clearRect(0, 0, w, h);
        ctx.font = '13px ' + fonts.ui;
        ctx.fillStyle = t.textMuted;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No track data', w / 2, h / 2);
    },

    _clampText: function(ctx, text, maxW) {
        if (!text) return '';
        if (ctx.measureText(text).width <= maxW) return text;
        var ellipsis = '…';
        var clipped = text;
        while (clipped.length > 1 && ctx.measureText(clipped + ellipsis).width > maxW) {
            clipped = clipped.slice(0, clipped.length - 1);
        }
        return clipped + ellipsis;
    },

    _genreIndex: function(genre) {
        if (!genre) return 0;
        var g = genre.toLowerCase();
        var hash = 0;
        for (var i = 0; i < g.length; i++) {
            hash = (hash * 31 + g.charCodeAt(i)) & 0x7FFFFFFF;
        }
        return hash;
    },

    // ── Mouse events ──────────────────────────────────────────────────────────

    _onMouseMove: function(e) {
        var rect = this._canvas.getBoundingClientRect();
        var my = e.clientY - rect.top;

        var hit = null;
        for (var i = 0; i < this._hitZones.length; i++) {
            var z = this._hitZones[i];
            if (my >= z.top && my <= z.bottom) {
                hit = z;
                break;
            }
        }

        if (hit) {
            if (this._hoveredIndex !== hit.index) {
                this._hoveredIndex = hit.index;
                if (this._lastData && this._lastConfig) {
                    this._render(this._lastData, this._lastConfig);
                }
            }
            // Build tooltip HTML
            var lines = [];
            lines.push('<strong>' + this._escHtml(hit.track) + '</strong>');
            if (hit.artist) lines.push(this._escHtml(hit.artist));
            lines.push('Streams: ' + theme.fmtNum(hit.streams, { compact: true }));
            if (hit.duration) lines.push('Duration: ' + this._escHtml(hit.duration));
            if (hit.genre)    lines.push('Genre: '    + this._escHtml(hit.genre));
            if (hit.playlistAdds) lines.push('Playlist adds: ' + this._escHtml(String(hit.playlistAdds)));

            this._tooltip.innerHTML = lines.join('<br>');
            this._tooltip.style.display = 'block';

            var mx = e.clientX - rect.left;
            var tx = mx + 14;
            var ty = hit.top;
            if (tx + 160 > (this._canvas.clientWidth || 400)) tx = mx - 160;
            this._tooltip.style.left = tx + 'px';
            this._tooltip.style.top  = ty + 'px';
            this._canvas.style.cursor = 'default';
        } else {
            this._onMouseLeave();
        }
    },

    _onMouseLeave: function() {
        if (this._hoveredIndex !== -1) {
            this._hoveredIndex = -1;
            this._tooltip.style.display = 'none';
            this._canvas.style.cursor = 'default';
            if (this._lastData && this._lastConfig) {
                this._render(this._lastData, this._lastConfig);
            }
        } else {
            this._tooltip.style.display = 'none';
        }
    },

    _escHtml: function(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    },

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    destroy: function() {
        if (this._tooltip && this._tooltip.parentNode) {
            this._tooltip.parentNode.removeChild(this._tooltip);
        }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }

});
