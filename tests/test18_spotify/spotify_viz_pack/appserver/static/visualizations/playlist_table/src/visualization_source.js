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

function clampText(ctx, text, maxW) {
    if (!text) return '';
    if (ctx.measureText(text).width <= maxW) return text;
    var ellipsis = '…';
    var clipped = text;
    while (clipped.length > 1 && ctx.measureText(clipped + ellipsis).width > maxW) {
        clipped = clipped.slice(0, clipped.length - 1);
    }
    return clipped + ellipsis;
}

function escHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ─── Sort helpers ────────────────────────────────────────────────────────────

// Column indices for sort
var COL_NAME     = 0;
var COL_FOLLOWERS = 1;
var COL_TRACKS   = 2;
var COL_DURATION = 3;
var COL_SKIPRATE = 4;

function sortRows(rows, colIdx, fields, sortCol, sortDir) {
    var fieldNames = [
        fields.playlistField,
        fields.followersField,
        fields.tracksField,
        fields.durationField,
        fields.skipRateField
    ];
    var fieldName = fieldNames[sortCol];
    var fi = colIdx[fieldName];
    if (fi === undefined || fi < 0) return rows;

    var isNumeric = (sortCol === COL_FOLLOWERS || sortCol === COL_TRACKS || sortCol === COL_SKIPRATE);

    var copy = rows.slice(0);
    copy.sort(function(a, b) {
        var av = a[fi] || '';
        var bv = b[fi] || '';
        var cmp;
        if (isNumeric) {
            av = parseFloat(av) || 0;
            bv = parseFloat(bv) || 0;
            cmp = av - bv;
        } else {
            av = String(av).toLowerCase();
            bv = String(bv).toLowerCase();
            cmp = av < bv ? -1 : av > bv ? 1 : 0;
        }
        return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
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

        // Sort state — default: followers descending
        this._sortCol = COL_FOLLOWERS;
        this._sortDir = 'desc';

        // Pagination state
        this._page = 0;

        // Interaction state
        this._hitZones   = [];      // row hit zones: {index, top, bottom, data}
        this._headerZones = [];     // header click zones: {col, x, y, w, h}
        this._prevZones  = null;    // prev page arrow zone
        this._nextZone   = null;    // next page arrow zone
        this._hoveredIndex = -1;
        this._sortedRows = null;

        this._lastData   = null;
        this._lastConfig = null;
        this._lastGoodData = null;

        var self = this;
        this._canvas.addEventListener('mousemove', function(e) { self._onMouseMove(e); });
        this._canvas.addEventListener('mouseleave', function() { self._onMouseLeave(); });
        this._canvas.addEventListener('click',     function(e) { self._onClick(e); });
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

    // ── private render ────────────────────────────────────────────────────────

    _render: function(data, config) {
        var ns   = getNS(this);
        var t    = theme.getTheme(getOption(config, ns, 'theme', 'dark'));
        var fonts = theme.getFonts();

        // Canvas sizing
        var w = this.el.clientWidth  || 600;
        var h = this.el.clientHeight || 400;
        var dpr = window.devicePixelRatio || 1;
        this._canvas.width  = Math.round(w * dpr);
        this._canvas.height = Math.round(h * dpr);
        this._canvas.style.width  = w + 'px';
        this._canvas.style.height = h + 'px';
        var ctx = this._ctx;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        // Config reads
        var playlistField  = getOption(config, ns, 'playlistField',  'playlist_name');
        var followersField = getOption(config, ns, 'followersField', 'followers');
        var tracksField    = getOption(config, ns, 'tracksField',    'tracks');
        var durationField  = getOption(config, ns, 'durationField',  'avg_duration');
        var skipRateField  = getOption(config, ns, 'skipRateField',  'skip_rate');
        var rowsPerPage    = Math.max(1, parseInt(getOption(config, ns, 'rowsPerPage', '10'), 10) || 10);
        var accentColor    = getOption(config, ns, 'accentColor',   '#1DB954');
        var showSkipBar    = getOption(config, ns, 'showSkipBar',   'true') !== 'false';
        var accentIntensity = theme.getAccentIntensity({
            accentIntensity: getOption(config, ns, 'accentIntensity', '50')
        });

        var fieldConfig = {
            playlistField:  playlistField,
            followersField: followersField,
            tracksField:    tracksField,
            durationField:  durationField,
            skipRateField:  skipRateField
        };

        // Validate data
        if (!data || !data.rows || !data.colIdx) {
            this._drawEmpty(ctx, w, h, t, fonts);
            return;
        }

        var colIdx = data.colIdx;
        var allRows = data.rows;

        var tiPlaylist  = colIdx[playlistField]  !== undefined ? colIdx[playlistField]  : -1;
        var tiFollowers = colIdx[followersField] !== undefined ? colIdx[followersField] : -1;
        var tiTracks    = colIdx[tracksField]    !== undefined ? colIdx[tracksField]    : -1;
        var tiDuration  = colIdx[durationField]  !== undefined ? colIdx[durationField]  : -1;
        var tiSkipRate  = colIdx[skipRateField]  !== undefined ? colIdx[skipRateField]  : -1;

        if (tiPlaylist < 0 || tiFollowers < 0) {
            this._drawEmpty(ctx, w, h, t, fonts);
            return;
        }

        // Sort all rows
        this._sortedRows = sortRows(allRows, colIdx, fieldConfig, this._sortCol, this._sortDir);

        var totalRows  = this._sortedRows.length;
        var totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
        // Clamp page index
        if (this._page >= totalPages) this._page = totalPages - 1;
        if (this._page < 0) this._page = 0;

        var pageStart = this._page * rowsPerPage;
        var pageEnd   = Math.min(pageStart + rowsPerPage, totalRows);
        var pageRows  = this._sortedRows.slice(pageStart, pageEnd);
        var visCount  = pageRows.length;

        // ── Layout constants ──────────────────────────────────────────────────
        var rx       = theme.THEME ? theme.THEME.cornerRadius : 8;
        var padX     = Math.max(12, Math.round(w * 0.025));
        var padY     = Math.max(8,  Math.round(h * 0.02));
        var headerH  = Math.max(24, Math.round(h * 0.065));
        var footerH  = Math.max(28, Math.round(h * 0.07));
        var dividerH = 1;

        var tableTop    = padY;
        var tableBottom = h - padY;
        var tableW      = w - padX * 2;
        var tableH      = tableBottom - tableTop;

        var bodyTop     = tableTop + headerH + dividerH;
        var bodyH       = tableH - headerH - dividerH - footerH;
        var rowH        = visCount > 0 ? Math.max(20, Math.floor(bodyH / visCount)) : 32;
        var rowGap      = 0;
        var innerRowH   = rowH - rowGap;

        // Column widths (proportional)
        var colWidths = this._calcColWidths(tableW, showSkipBar);
        var colOffsets = [];
        var cx = padX;
        for (var ci = 0; ci < colWidths.length; ci++) {
            colOffsets.push(cx);
            cx += colWidths[ci];
        }

        // ── Tooltip style ────────────────────────────────────────────────────
        this._tooltip.style.background = t.panelHi;
        this._tooltip.style.color      = t.text;
        this._tooltip.style.fontFamily = fonts.ui;
        this._tooltip.style.border     = '1px solid ' + t.cardBorder;

        // ── Table rounded background ─────────────────────────────────────────
        ctx.fillStyle = t.card;
        theme.fillRoundRect(ctx, padX - 4, tableTop, tableW + 8, tableH, rx);

        // Subtle card border
        ctx.strokeStyle = t.cardBorder;
        ctx.lineWidth   = 1;
        theme.strokeRoundRect(ctx, padX - 4, tableTop, tableW + 8, tableH, rx);

        // ── Header ───────────────────────────────────────────────────────────
        var headerFontSize = Math.max(7, fonts.whisperSize || 9);
        var colLabels = ['PLAYLIST', 'FOLLOWERS', 'TRACKS', 'AVG DUR', showSkipBar ? 'SKIP RATE' : 'SKIP %'];

        this._headerZones = [];

        for (var hc = 0; hc < colLabels.length; hc++) {
            var hx      = colOffsets[hc];
            var hw      = colWidths[hc];
            var hAlign  = this._colAlign(hc);
            var isSort  = (this._sortCol === hc);
            var label   = colLabels[hc];
            if (isSort) {
                label = label + ' ' + (this._sortDir === 'asc' ? '▲' : '▼');
            }

            ctx.font      = 'bold ' + headerFontSize + 'px ' + fonts.ui;
            ctx.fillStyle = isSort ? accentColor : t.textMuted;
            ctx.textBaseline = 'middle';

            var headerCY = tableTop + Math.round(headerH / 2);

            if (hAlign === 'right') {
                ctx.textAlign = 'right';
                ctx.fillText(label, hx + hw - 4, headerCY);
            } else if (hAlign === 'center') {
                ctx.textAlign = 'center';
                ctx.fillText(label, hx + Math.round(hw / 2), headerCY);
            } else {
                ctx.textAlign = 'left';
                ctx.fillText(label, hx + 4, headerCY);
            }

            this._headerZones.push({ col: hc, x: hx, y: tableTop, w: hw, h: headerH });
        }

        // Divider line
        ctx.strokeStyle = t.cardBorder;
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(padX, bodyTop);
        ctx.lineTo(padX + tableW, bodyTop);
        ctx.stroke();

        // ── Rows ──────────────────────────────────────────────────────────────
        this._hitZones = [];

        for (var r = 0; r < visCount; r++) {
            var row     = pageRows[r];
            var rowTop  = bodyTop + r * rowH;
            var isHov   = (this._hoveredIndex === r);

            var pName   = tiPlaylist  >= 0 ? (row[tiPlaylist]  || '—') : '—';
            var follows = tiFollowers >= 0 ? (parseFloat(row[tiFollowers]) || 0) : 0;
            var tracks  = tiTracks    >= 0 ? (parseFloat(row[tiTracks])    || 0) : 0;
            var durStr  = tiDuration  >= 0 ? (row[tiDuration]  || '—') : '—';
            var skipRaw = tiSkipRate  >= 0 ? (parseFloat(row[tiSkipRate])  || 0) : 0;

            // Row background
            if (isHov) {
                ctx.fillStyle = t.hover;
                ctx.fillRect(padX - 4, rowTop, tableW + 8, innerRowH);
            } else if (r % 2 === 1) {
                ctx.fillStyle = t.rowAlt;
                ctx.fillRect(padX - 4, rowTop, tableW + 8, innerRowH);
            }

            var midY = rowTop + Math.round(innerRowH / 2);

            // ── Col 0: Playlist name ─────────────────────────────────────────
            var nameFS = Math.max(8, Math.round(innerRowH * 0.38));
            ctx.font      = 'bold ' + nameFS + 'px ' + fonts.ui;
            ctx.fillStyle = isHov ? t.textBright : t.text;
            ctx.textAlign    = 'left';
            ctx.textBaseline = 'middle';
            var nameTxt = clampText(ctx, pName, colWidths[COL_NAME] - 8);
            ctx.fillText(nameTxt, colOffsets[COL_NAME] + 4, midY);

            // ── Col 1: Followers ─────────────────────────────────────────────
            var metaFS = Math.max(7, Math.round(innerRowH * 0.34));
            ctx.font      = metaFS + 'px ' + fonts.data;
            ctx.fillStyle = isHov ? t.textBright : t.text;
            ctx.textAlign    = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                theme.fmtNum(follows, { compact: true }),
                colOffsets[COL_FOLLOWERS] + colWidths[COL_FOLLOWERS] - 4,
                midY
            );

            // ── Col 2: Tracks ────────────────────────────────────────────────
            ctx.font      = metaFS + 'px ' + fonts.data;
            ctx.fillStyle = isHov ? t.textBright : t.textMuted;
            ctx.textAlign    = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                String(Math.round(tracks)),
                colOffsets[COL_TRACKS] + colWidths[COL_TRACKS] - 4,
                midY
            );

            // ── Col 3: Avg Duration ──────────────────────────────────────────
            ctx.font      = metaFS + 'px ' + fonts.data;
            ctx.fillStyle = isHov ? t.textBright : t.textMuted;
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                String(durStr),
                colOffsets[COL_DURATION] + Math.round(colWidths[COL_DURATION] / 2),
                midY
            );

            // ── Col 4: Skip Rate bar ─────────────────────────────────────────
            var skipCX = colOffsets[COL_SKIPRATE];
            var skipCW = colWidths[COL_SKIPRATE];
            // Bar occupies left portion of the cell, text to the right
            var barPadX  = 4;
            var barPadY  = Math.max(3, Math.round(innerRowH * 0.28));
            var barH     = innerRowH - barPadY * 2;
            var barAreaW = Math.round(skipCW * 0.55);
            var textAreaX = skipCX + barAreaW + barPadX * 2;

            // skipRaw is a percentage value like 8.2 (meaning 8.2%)
            // Domain: 0..20 (cap at 20 for full bar)
            var barMax    = 20;
            var skipClamp = Math.min(skipRaw, barMax);
            var barRatio  = skipClamp / barMax;

            // Color: green (low) → coral (high) via lerpColor
            var barColor = theme.lerpColor('#1DB954', t.coral, barRatio);

            // Track (background pill)
            ctx.fillStyle = t.barTrack;
            theme.fillRoundRect(ctx, skipCX + barPadX, rowTop + barPadY, barAreaW, barH, Math.round(barH / 2));

            // Fill pill
            if (showSkipBar) {
                var fillW = Math.max(barH, Math.round(barAreaW * barRatio));
                ctx.fillStyle = barColor;
                theme.fillRoundRect(ctx, skipCX + barPadX, rowTop + barPadY, fillW, barH, Math.round(barH / 2));
            }

            // Skip rate text
            ctx.font      = metaFS + 'px ' + fonts.data;
            ctx.fillStyle = isHov ? t.textBright : t.text;
            ctx.textAlign    = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(skipRaw.toFixed(1) + '%', textAreaX, midY);

            // Store hit zone
            this._hitZones.push({
                index:    r,
                top:      rowTop,
                bottom:   rowTop + innerRowH,
                playlist: pName,
                followers: follows,
                tracks:   tracks,
                duration: durStr,
                skipRate: skipRaw
            });
        }

        // ── Footer / pagination ───────────────────────────────────────────────
        var footerY = bodyTop + bodyH + Math.round((footerH - 16) / 2);
        var pageLabel = 'Page ' + (this._page + 1) + ' of ' + totalPages;
        var arrowFS = Math.max(11, Math.round(footerH * 0.45));
        var labelFS = Math.max(9,  Math.round(footerH * 0.38));

        var centerX = padX + Math.round(tableW / 2);

        // Measure page label to position arrows
        ctx.font = labelFS + 'px ' + fonts.ui;
        var labelW = ctx.measureText(pageLabel).width;
        var arrowGap = 16;

        var prevArrow = '‹'; // ‹
        var nextArrow = '›'; // ›
        ctx.font = arrowFS + 'px ' + fonts.ui;
        var arrowW = ctx.measureText(prevArrow).width + 4;

        var prevX = centerX - Math.round(labelW / 2) - arrowGap - arrowW;
        var nextX = centerX + Math.round(labelW / 2) + arrowGap;
        var footerCY = h - padY - Math.round(footerH / 2);

        // Previous arrow
        var canGoPrev = this._page > 0;
        ctx.font      = arrowFS + 'px ' + fonts.ui;
        ctx.fillStyle = canGoPrev ? accentColor : t.textMuted;
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(prevArrow, prevX, footerCY);

        // Page label
        ctx.font      = labelFS + 'px ' + fonts.ui;
        ctx.fillStyle = t.textMuted;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pageLabel, centerX, footerCY);

        // Next arrow
        var canGoNext = this._page < totalPages - 1;
        ctx.font      = arrowFS + 'px ' + fonts.ui;
        ctx.fillStyle = canGoNext ? accentColor : t.textMuted;
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(nextArrow, nextX, footerCY);

        // Store arrow click zones
        var arrowZoneH = Math.max(20, footerH);
        this._prevZone = {
            x: prevX - 6,
            y: footerCY - Math.round(arrowZoneH / 2),
            w: arrowW + 12,
            h: arrowZoneH,
            enabled: canGoPrev
        };
        this._nextZone = {
            x: nextX - 6,
            y: footerCY - Math.round(arrowZoneH / 2),
            w: arrowW + 12,
            h: arrowZoneH,
            enabled: canGoNext
        };

        // Store for re-render
        this._t         = t;
        this._fonts     = fonts;
        this._accentColor = accentColor;
        this._accentIntensity = accentIntensity;
        this._totalPages = totalPages;
    },

    // ── Column layout ─────────────────────────────────────────────────────────

    _calcColWidths: function(tableW, showSkipBar) {
        // Proportional split: Name(30%), Followers(18%), Tracks(12%), AvgDur(14%), SkipRate(26%)
        var name    = Math.round(tableW * 0.30);
        var follow  = Math.round(tableW * 0.18);
        var tracks  = Math.round(tableW * 0.12);
        var dur     = Math.round(tableW * 0.14);
        var skip    = tableW - name - follow - tracks - dur;
        return [name, follow, tracks, dur, skip];
    },

    _colAlign: function(colIndex) {
        var aligns = ['left', 'right', 'right', 'center', 'left'];
        return aligns[colIndex] || 'left';
    },

    // ── Empty state ───────────────────────────────────────────────────────────

    _drawEmpty: function(ctx, w, h, t, fonts) {
        ctx.clearRect(0, 0, w, h);
        ctx.font         = '13px ' + fonts.ui;
        ctx.fillStyle    = t.textMuted;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No playlist data', w / 2, h / 2);
    },

    // ── Mouse events ──────────────────────────────────────────────────────────

    _onMouseMove: function(e) {
        var rect = this._canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;

        // Check header hover
        for (var hi = 0; hi < this._headerZones.length; hi++) {
            var hz = this._headerZones[hi];
            if (mx >= hz.x && mx <= hz.x + hz.w && my >= hz.y && my <= hz.y + hz.h) {
                this._canvas.style.cursor = 'pointer';
                this._tooltip.style.display = 'none';
                return;
            }
        }

        // Check pagination arrow hover
        if (this._prevZone && this._prevZone.enabled) {
            var pz = this._prevZone;
            if (mx >= pz.x && mx <= pz.x + pz.w && my >= pz.y && my <= pz.y + pz.h) {
                this._canvas.style.cursor = 'pointer';
                return;
            }
        }
        if (this._nextZone && this._nextZone.enabled) {
            var nz = this._nextZone;
            if (mx >= nz.x && mx <= nz.x + nz.w && my >= nz.y && my <= nz.y + nz.h) {
                this._canvas.style.cursor = 'pointer';
                return;
            }
        }

        // Check row hover
        var hit = null;
        for (var ri = 0; ri < this._hitZones.length; ri++) {
            var z = this._hitZones[ri];
            if (my >= z.top && my <= z.bottom) {
                hit = z;
                break;
            }
        }

        if (hit) {
            this._canvas.style.cursor = 'default';
            if (this._hoveredIndex !== hit.index) {
                this._hoveredIndex = hit.index;
                if (this._lastData && this._lastConfig) {
                    this._render(this._lastData, this._lastConfig);
                }
            }

            var t = this._t;
            var fonts = this._fonts;

            // Rebuild tooltip
            var lines = [];
            lines.push('<strong>' + escHtml(hit.playlist) + '</strong>');
            lines.push('Followers: ' + theme.fmtNum(hit.followers, { compact: true }));
            lines.push('Tracks: '   + Math.round(hit.tracks));
            lines.push('Avg Duration: ' + escHtml(String(hit.duration)));
            lines.push('Skip Rate: ' + hit.skipRate.toFixed(1) + '%');

            this._tooltip.innerHTML = lines.join('<br>');
            this._tooltip.style.display = 'block';

            var tx = mx + 14;
            var ty = hit.top;
            if (tx + 200 > (this._canvas.clientWidth || 600)) { tx = mx - 200; }
            this._tooltip.style.left = tx + 'px';
            this._tooltip.style.top  = ty + 'px';
        } else {
            this._canvas.style.cursor = 'default';
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

    // ── Click events ──────────────────────────────────────────────────────────

    _onClick: function(e) {
        var rect = this._canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;

        // Header sort click
        for (var hi = 0; hi < this._headerZones.length; hi++) {
            var hz = this._headerZones[hi];
            if (mx >= hz.x && mx <= hz.x + hz.w && my >= hz.y && my <= hz.y + hz.h) {
                if (this._sortCol === hz.col) {
                    // Toggle direction on same column
                    this._sortDir = (this._sortDir === 'asc') ? 'desc' : 'asc';
                } else {
                    // New column — default desc
                    this._sortCol = hz.col;
                    this._sortDir = 'desc';
                }
                // Reset to first page on sort change
                this._page = 0;
                this._hoveredIndex = -1;
                if (this._lastData && this._lastConfig) {
                    this._render(this._lastData, this._lastConfig);
                }
                return;
            }
        }

        // Prev page arrow
        if (this._prevZone && this._prevZone.enabled) {
            var pz = this._prevZone;
            if (mx >= pz.x && mx <= pz.x + pz.w && my >= pz.y && my <= pz.y + pz.h) {
                this._page = Math.max(0, this._page - 1);
                this._hoveredIndex = -1;
                if (this._lastData && this._lastConfig) {
                    this._render(this._lastData, this._lastConfig);
                }
                return;
            }
        }

        // Next page arrow
        if (this._nextZone && this._nextZone.enabled) {
            var nz = this._nextZone;
            if (mx >= nz.x && mx <= nz.x + nz.w && my >= nz.y && my <= nz.y + nz.h) {
                var maxPage = (this._totalPages || 1) - 1;
                this._page = Math.min(maxPage, this._page + 1);
                this._hoveredIndex = -1;
                if (this._lastData && this._lastConfig) {
                    this._render(this._lastData, this._lastConfig);
                }
                return;
            }
        }
    },

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    destroy: function() {
        if (this._tooltip && this._tooltip.parentNode) {
            this._tooltip.parentNode.removeChild(this._tooltip);
        }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }

});
