define(["api/SplunkVisualizationBase"], function(SplunkVisualizationBase) {

// === Shared theme tokens ===
var theme = (function() {
// Patagonia Outdoor Operations — shared design tokens
// Mood: Organic | Tone: grounded, purposeful, organic

var PALETTES = {
    dark: {
        bg:        '#1C1A17',
        panel:     '#242220',
        panelHi:   '#2E2C29',
        text:      '#E6E1D9',
        textDim:   'rgba(230,225,217,0.50)',
        textMuted: 'rgba(230,225,217,0.25)',
        green:     '#5E8F5C',
        sandstone: '#C9956B',
        glacier:   '#6899A9',
        earth:     '#8B6B4A',
        rust:      '#B86B52',
        ridge:     '#3D5A3A',
        accent:    '#5E8F5C',
        grid:      'rgba(230,225,217,0.06)',
        edge:      'rgba(230,225,217,0.04)',
        glow:      'rgba(94,143,92,0.35)'
    },
    light: {
        bg:        '#F4F1EB',
        panel:     '#FFFFFF',
        panelHi:   '#F8F6F2',
        text:      '#1C1A17',
        textDim:   'rgba(28,26,23,0.50)',
        textMuted: 'rgba(28,26,23,0.25)',
        green:     '#4A7A48',
        sandstone: '#B07F55',
        glacier:   '#527F8F',
        earth:     '#6E5538',
        rust:      '#A05840',
        ridge:     '#6B8F68',
        accent:    '#4A7A48',
        grid:      'rgba(28,26,23,0.06)',
        edge:      'rgba(28,26,23,0.06)',
        glow:      'rgba(74,122,72,0.20)'
    }
};

var FONTS = {
    ui:   '"Barlow Semi Condensed", "Helvetica Neue", Helvetica, Arial, sans-serif',
    data: '"SF Mono", Menlo, Consolas, monospace'
};

var STATUS_COLORS = {
    dark: {
        healthy:  '#5E8F5C',
        warning:  '#C9956B',
        critical: '#B86B52',
        info:     '#6899A9'
    },
    light: {
        healthy:  '#4A7A48',
        warning:  '#B07F55',
        critical: '#A05840',
        info:     '#527F8F'
    }
};

var SERIES_COLORS = {
    dark: ['#5E8F5C', '#6899A9', '#C9956B', '#8B6B4A', '#B86B52', '#7EA97C', '#89B3C0'],
    light: ['#4A7A48', '#527F8F', '#B07F55', '#6E5538', '#A05840', '#6B8F68', '#6E99A8']
};

function getTheme(mode) {
    var m = (mode === 'light') ? 'light' : 'dark';
    return {
        palette: PALETTES[m],
        fonts: FONTS,
        status: STATUS_COLORS[m],
        series: SERIES_COLORS[m],
        mode: m
    };
}

function lerpColor(a, b, t) {
    var ah = parseInt(a.replace('#', ''), 16);
    var bh = parseInt(b.replace('#', ''), 16);
    var ar = (ah >> 16) & 0xFF, ag = (ah >> 8) & 0xFF, ab = ah & 0xFF;
    var br = (bh >> 16) & 0xFF, bg_ = (bh >> 8) & 0xFF, bb = bh & 0xFF;
    var rr = Math.round(ar + (br - ar) * t);
    var rg = Math.round(ag + (bg_ - ag) * t);
    var rb = Math.round(ab + (bb - ab) * t);
    return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb).toString(16).slice(1);
}

function fmtNum(n, opts) {
    opts = opts || {};
    if (typeof n !== 'number' || isNaN(n)) return String(n || '—');
    if (opts.compact) {
        if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
        if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    }
    var d = (opts.decimals !== undefined && opts.decimals >= 0) ? opts.decimals : 0;
    var parts = n.toFixed(d).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    var result = parts.join('.');
    if (opts.unit) {
        if (opts.unitPosition === 'before') return opts.unit + result;
        return result + opts.unit;
    }
    return result;
}

function setupCanvas(container) {
    var canvas = container.querySelector('canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:absolute;top:0;left:0;';
        container.appendChild(canvas);
    }
    var w = container.clientWidth || container.offsetWidth || window.innerWidth || 300;
    var h = container.clientHeight || container.offsetHeight || window.innerHeight || 200;
    if (w < 10) w = window.innerWidth || 300;
    if (h < 10) h = window.innerHeight || 200;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { canvas: canvas, ctx: ctx, w: w, h: h, dpr: dpr };
}

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

function detectTheme() {
    try {
        var body = document.body;
        if (body) {
            var dt = body.getAttribute('data-theme');
            if (dt === 'light' || dt === 'dark') return dt;
            if (body.classList.contains('light')) return 'light';
            if (body.classList.contains('dark')) return 'dark';
        }
        var bg = window.getComputedStyle(document.body).backgroundColor;
        var m = bg.match(/\d+/g);
        if (m && m.length >= 3) {
            var avg = (parseInt(m[0]) + parseInt(m[1]) + parseInt(m[2])) / 3;
            return avg < 128 ? 'dark' : 'light';
        }
    } catch (e) {}
    return 'dark';
}

function hexToRgba(hex, alpha) {
    var h = hex.replace('#', '');
    var r = parseInt(h.substring(0, 2), 16);
    var g = parseInt(h.substring(2, 4), 16);
    var b = parseInt(h.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

function drawRidgeline(ctx, x, y, width, height, color) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    var peaks = [
        [0.00, 1.0], [0.05, 0.7], [0.10, 0.5], [0.14, 0.3],
        [0.18, 0.55], [0.22, 0.2], [0.26, 0.45], [0.30, 0.1],
        [0.34, 0.35], [0.38, 0.0], [0.42, 0.25], [0.46, 0.4],
        [0.50, 0.15], [0.54, 0.5], [0.58, 0.3], [0.62, 0.05],
        [0.66, 0.35], [0.70, 0.55], [0.74, 0.2], [0.78, 0.45],
        [0.82, 0.6], [0.86, 0.4], [0.90, 0.7], [0.95, 0.85],
        [1.00, 1.0]
    ];
    for (var i = 0; i < peaks.length; i++) {
        var px = x + peaks[i][0] * width;
        var py = y + peaks[i][1] * height;
        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            var prev = peaks[i - 1];
            var cpx = x + (prev[0] + peaks[i][0]) * 0.5 * width;
            ctx.quadraticCurveTo(cpx, y + prev[1] * height, px, py);
        }
    }
    ctx.lineTo(x + width, y + height);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}


    return {
        PALETTES: PALETTES,
        FONTS: FONTS,
        STATUS_COLORS: STATUS_COLORS,
        SERIES_COLORS: SERIES_COLORS,
        getTheme: getTheme,
        detectTheme: detectTheme,
        lerpColor: lerpColor,
        hexToRgba: hexToRgba,
        fmtNum: fmtNum,
        setupCanvas: setupCanvas,
        getOption: getOption,
        getNS: getNS,
        drawRidgeline: drawRidgeline
    };
})();

// === Visualization source ===
// alert_feed — Alert log with severity indicators styled like a field journal
// Patagonia Outdoor Operations viz pack
// ES5 CommonJS — build script wraps in AMD define()

var TOOLTIP_STYLE = [
    'position:absolute',
    'pointer-events:none',
    'display:none',
    'border-radius:4px',
    'padding:8px 12px',
    'font-size:12px',
    'line-height:1.65',
    'z-index:9999',
    'max-width:380px',
    'word-wrap:break-word',
    'white-space:normal'
].join(';');

// Month abbreviations — no Date locale dependency, works in sandboxed iframes
var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Header height fraction
var HEADER_H_FRAC = 0.06;
var HEADER_H_MIN  = 22;

// Left accent border width (px)
var ACCENT_W = 2;

// Severity dot radius (px)
var DOT_R = 3;

// -----------------------------------------------------------------
// CRITICAL: parse ISO dates manually — new Date(str) fails in
// Splunk's sandboxed about:srcdoc iframe for ISO strings.
// Always use this function, never new Date(isoStr) directly.
// -----------------------------------------------------------------
function fmtTimestamp(str) {
    if (!str) { return ''; }
    var s = String(str).trim();

    // ISO format: "2026-05-13T08:42:00" or "2026-05-13 08:42:00"
    var iso = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
    if (iso) {
        var mon = MONTHS[parseInt(iso[2], 10) - 1];
        return mon + ' ' + parseInt(iso[3], 10) + ' ' + iso[4] + ':' + iso[5];
    }

    // Epoch seconds or milliseconds
    var n = parseFloat(s);
    if (!isNaN(n) && s.length >= 10) {
        var d = new Date(n < 1e12 ? n * 1000 : n);
        if (!isNaN(d.getTime())) {
            return MONTHS[d.getMonth()] + ' ' + d.getDate() + ' ' +
                   ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
        }
    }

    // Fallback: try Date constructor (may work for some non-ISO formats)
    try {
        var d2 = new Date(s);
        if (!isNaN(d2.getTime()) && d2.getFullYear() > 1971) {
            return MONTHS[d2.getMonth()] + ' ' + d2.getDate() + ' ' +
                   ('0' + d2.getHours()).slice(-2) + ':' + ('0' + d2.getMinutes()).slice(-2);
        }
    } catch (e) { /* ignore */ }

    // Last resort: return raw string truncated
    return s.length > 16 ? s.slice(0, 16) : s;
}

function parseSeverity(s) {
    if (!s) { return 'info'; }
    var v = String(s).toLowerCase().trim();
    if (v === 'critical' || v === 'crit') { return 'critical'; }
    if (v === 'warning'  || v === 'warn') { return 'warning'; }
    return 'info';
}

function truncateText(ctx, text, maxW) {
    if (!text) { return ''; }
    if (ctx.measureText(text).width <= maxW) { return text; }
    var ellipsis = '...';
    var trimmed = text;
    while (trimmed.length > 0 && ctx.measureText(trimmed + ellipsis).width > maxW) {
        trimmed = trimmed.slice(0, -1);
    }
    return trimmed + ellipsis;
}

return SplunkVisualizationBase.extend({

    initialize: function () {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this._container      = null;
        this._canvas         = null;
        this._tooltip        = null;
        this._lastData       = null;
        this._lastConfig     = null;
        // Each hit region: { rowIdx, x, y, w, h }
        this._hitRegions     = [];
        this._hoveredRowIdx  = -1;
        this._renderItems    = null;
        this._boundMouseMove  = null;
        this._boundMouseLeave = null;
    },

    getInitialDataParams: function () {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },

    formatData: function (data) {
        if (!data || !data.rows || data.rows.length === 0) {
            return this._lastData || null;
        }

        // Only index fields here — config-driven field selection happens in _render (B4)
        var fields = data.fields;
        var colIdx = {};
        for (var i = 0; i < fields.length; i++) {
            colIdx[fields[i].name] = i;
        }

        this._lastData = { colIdx: colIdx, rows: data.rows };
        return this._lastData;
    },

    _parseItems: function (data, config, ns) {
        var colIdx = data.colIdx;
        var rows   = data.rows;

        var timeField     = theme.getOption(config, ns, 'timeField',     '_time');
        var severityField = theme.getOption(config, ns, 'severityField', 'severity');
        var messageField  = theme.getOption(config, ns, 'messageField',  'message');
        var categoryField = theme.getOption(config, ns, 'categoryField', 'category');
        var regionField   = theme.getOption(config, ns, 'regionField',   'region');

        function fi(name) {
            return (colIdx[name] !== undefined) ? colIdx[name] : -1;
        }

        var timeIdx   = fi(timeField);
        var sevIdx    = fi(severityField);
        var msgIdx    = fi(messageField);
        var catIdx    = fi(categoryField);
        var regIdx    = fi(regionField);

        if (sevIdx < 0 || msgIdx < 0) { return null; }

        var items = [];
        for (var ri = 0; ri < rows.length; ri++) {
            var row     = rows[ri];
            var timeRaw = (timeIdx >= 0) ? String(row[timeIdx])  : '';
            var sevRaw  = String(row[sevIdx]);
            var msg     = String(row[msgIdx]);
            var cat     = (catIdx >= 0) ? String(row[catIdx]) : '';
            var region  = (regIdx >= 0) ? String(row[regIdx]) : '';

            items.push({
                timeRaw:  timeRaw,
                timeFmt:  fmtTimestamp(timeRaw),
                severity: parseSeverity(sevRaw),
                message:  msg,
                category: cat,
                region:   region
            });
        }

        return items;
    },

    _setupContainer: function () {
        if (this._container) { return; }

        var el = this.el;
        el.style.position = 'relative';
        el.style.overflow = 'hidden';


        var tip = document.createElement('div');
        tip.style.cssText = TOOLTIP_STYLE;
        el.appendChild(tip);
        this._tooltip = tip;

        var self = this;
        this._boundMouseMove  = function (e) { self._onMouseMove(e); };
        this._boundMouseLeave = function ()  { self._onMouseLeave(); };
        el.addEventListener('mousemove',  this._boundMouseMove);
        el.addEventListener('mouseleave', this._boundMouseLeave);
    },

    _onMouseMove: function (e) {
        if (!this._renderItems) {
            this._hideTooltip();
            return;
        }

        var rect   = this.el.getBoundingClientRect();
        var mx     = e.clientX - rect.left;
        var my     = e.clientY - rect.top;
        var hitRow = -1;

        for (var i = 0; i < this._hitRegions.length; i++) {
            var hr = this._hitRegions[i];
            if (mx >= hr.x && mx <= hr.x + hr.w && my >= hr.y && my <= hr.y + hr.h) {
                hitRow = hr.rowIdx;
                break;
            }
        }

        if (hitRow >= 0) {
            var item = this._renderItems[hitRow];
            var sevLabel = item.severity.charAt(0).toUpperCase() + item.severity.slice(1);
            var lines = [];
            lines.push('<strong>' + sevLabel + '</strong>');
            if (item.timeFmt) { lines.push('Time: ' + item.timeFmt); }
            lines.push('Message: ' + item.message);
            if (item.category) { lines.push('Category: ' + item.category); }
            if (item.region)   { lines.push('Region: '   + item.region); }

            var tip = this._tooltip;
            tip.innerHTML = lines.join('<br>');
            tip.style.display = 'block';

            var tw = Math.min(mx + 16, rect.width - 220);
            var ty = Math.max(my - 40, 4);
            tip.style.left = tw + 'px';
            tip.style.top  = ty + 'px';

            if (hitRow !== this._hoveredRowIdx) {
                this._hoveredRowIdx = hitRow;
                if (this._lastData && this._lastConfig) {
                    this._render(this._lastData, this._lastConfig);
                }
            }
        } else {
            if (this._hoveredRowIdx >= 0) {
                this._hoveredRowIdx = -1;
                if (this._lastData && this._lastConfig) {
                    this._render(this._lastData, this._lastConfig);
                }
            }
            this._hideTooltip();
        }
    },

    _onMouseLeave: function () {
        this._hideTooltip();
        if (this._hoveredRowIdx >= 0) {
            this._hoveredRowIdx = -1;
            if (this._lastData && this._lastConfig) {
                this._render(this._lastData, this._lastConfig);
            }
        }
    },

    _hideTooltip: function () {
        if (this._tooltip) { this._tooltip.style.display = 'none'; }
    },

    updateView: function (data, config) {
        this._setupContainer();
        this._lastConfig = config;

        if (!data || !data.rows || data.rows.length === 0) {
            this._drawEmpty();
            return;
        }

        this._lastData = data;
        this._render(data, config);
    },

    _render: function (data, config) {
        var ns        = theme.getNS(this);
        var themeMode = theme.getOption(config, ns, 'themeMode', 'auto');
        if (themeMode === 'auto') { themeMode = theme.detectTheme(); }

        var accentIntensity = parseFloat(theme.getOption(config, ns, 'accentIntensity', '50')) / 100;
        var maxRows         = parseInt(theme.getOption(config, ns, 'maxRows', '10'), 10);
        if (isNaN(maxRows) || maxRows < 1)  { maxRows = 10; }
        if (maxRows > 100) { maxRows = 100; }

        var showCategory = theme.getOption(config, ns, 'showCategory', 'true') === 'true';
        var showRegion   = theme.getOption(config, ns, 'showRegion',   'true') === 'true';

        // Configurable severity colors
        var colorCritical = theme.getOption(config, ns, 'colorCritical', '#B86B52');
        var colorWarning  = theme.getOption(config, ns, 'colorWarning',  '#C9956B');
        var colorInfo     = theme.getOption(config, ns, 'colorInfo',     '#6899A9');

        var t = theme.getTheme(themeMode);
        var p = t.palette;

        // Parse items using config-driven field names
        var items = this._parseItems(data, config, ns);
        if (!items || items.length === 0) {
            this._drawEmpty();
            return;
        }
        this._renderItems = items;

        var setup = theme.setupCanvas(this.el);
        var ctx   = setup.ctx;
        var w     = setup.w;
        var h     = setup.h;
        this._canvas = setup.canvas;

        // Style tooltip
        var tip = this._tooltip;
        tip.style.background = p.panelHi;
        tip.style.color      = p.text;
        tip.style.fontFamily = t.fonts.ui;
        tip.style.border     = '1px solid ' + p.grid;

        ctx.clearRect(0, 0, w, h);

        var rowCount = Math.min(items.length, maxRows);
        if (rowCount === 0) { return; }

        // Severity color resolver using configurable colors
        var self = this;
        function sevColor(sev) {
            if (sev === 'critical') { return colorCritical; }
            if (sev === 'warning')  { return colorWarning; }
            return colorInfo;
        }

        // Layout
        var headerH  = Math.max(HEADER_H_MIN, Math.round(h * HEADER_H_FRAC));
        var bodyH    = h - headerH;
        var rowH     = Math.max(28, Math.floor(bodyH / maxRows));
        var padLeft  = Math.max(8, w * 0.02);
        var padRight = Math.max(6, w * 0.02);

        // Column layout
        var accentColW = ACCENT_W + Math.round(w * 0.01);
        var dotColW    = DOT_R * 2 + Math.round(w * 0.015);
        var timeColW   = Math.round(w * 0.15);
        var tagGap     = Math.round(w * 0.008);
        var tagPadH    = Math.max(4, Math.round(rowH * 0.16));
        var tagH       = Math.round(rowH * 0.52);
        var tagFontSz  = Math.max(8, Math.round(rowH * 0.32));
        var msgX       = padLeft + accentColW + dotColW + timeColW + Math.round(w * 0.015);

        // Header label
        ctx.save();
        ctx.font         = '500 ' + Math.max(9, Math.round(headerH * 0.48)) + 'px ' + t.fonts.ui;
        ctx.fillStyle    = p.textMuted;
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('RECENT ALERTS', padLeft + accentColW + dotColW, headerH * 0.5);
        ctx.restore();

        // Header bottom rule
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, headerH);
        ctx.lineTo(w, headerH);
        ctx.strokeStyle = p.grid;
        ctx.lineWidth   = 1;
        ctx.stroke();
        ctx.restore();

        this._hitRegions = [];

        var timeFontSz = Math.max(8,  Math.round(rowH * 0.34));
        var msgFontSz  = Math.max(10, Math.round(rowH * 0.40));
        var rowMidOff  = rowH * 0.5;

        for (var i = 0; i < rowCount; i++) {
            var item  = items[i];
            var rowY  = headerH + i * rowH;
            var isHov = (i === this._hoveredRowIdx);
            var sColor = sevColor(item.severity);

            // Alternating row background
            if (i % 2 === 1 || isHov) {
                ctx.save();
                ctx.fillStyle = isHov ? p.panelHi : 'rgba(255,255,255,0.015)';
                ctx.fillRect(0, rowY, w, rowH);
                ctx.restore();
            }

            // Left accent border
            ctx.save();
            ctx.fillStyle   = sColor;
            ctx.globalAlpha = isHov ? 1.0 : (0.55 + accentIntensity * 0.45);
            ctx.fillRect(padLeft, rowY + Math.round(rowH * 0.15),
                         ACCENT_W, Math.round(rowH * 0.70));
            ctx.globalAlpha = 1;
            ctx.restore();

            // Severity dot with glow
            var dotX = padLeft + accentColW + DOT_R;
            var dotY = rowY + rowMidOff;

            ctx.save();
            ctx.shadowBlur  = Math.round(DOT_R * 3 * accentIntensity + 1);
            ctx.shadowColor = sColor;
            ctx.beginPath();
            ctx.arc(dotX, dotY, DOT_R, 0, Math.PI * 2);
            ctx.fillStyle   = sColor;
            ctx.globalAlpha = isHov ? 1.0 : (0.75 + accentIntensity * 0.25);
            ctx.fill();
            ctx.shadowBlur  = 0;
            ctx.shadowColor = 'transparent';
            ctx.restore();

            // Timestamp
            var tsX = padLeft + accentColW + dotColW;
            ctx.save();
            ctx.font         = '400 ' + timeFontSz + 'px ' + t.fonts.data;
            ctx.fillStyle    = isHov ? p.textDim : p.textMuted;
            ctx.textAlign    = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.timeFmt, tsX, rowY + rowMidOff);
            ctx.restore();

            // Tags on the right — measure from right edge inward
            var tagsX = w - padRight;

            // Region tag
            if (showRegion && item.region) {
                ctx.save();
                ctx.font = '400 ' + tagFontSz + 'px ' + t.fonts.ui;
                var rText  = item.region;
                var rTextW = ctx.measureText(rText).width;
                var rTagW  = rTextW + tagPadH * 2;
                var rTagX  = tagsX - rTagW;
                var rTagY  = rowY + rowMidOff - tagH / 2;

                ctx.beginPath();
                ctx.rect(rTagX, rTagY, rTagW, tagH);
                ctx.strokeStyle = p.grid;
                ctx.lineWidth   = 1;
                ctx.stroke();

                ctx.fillStyle    = p.textDim;
                ctx.textAlign    = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(rText, rTagX + rTagW / 2, rowY + rowMidOff);
                ctx.restore();
                tagsX = rTagX - tagGap;
            }

            // Category tag
            if (showCategory && item.category) {
                ctx.save();
                ctx.font = '400 ' + tagFontSz + 'px ' + t.fonts.ui;
                var cText  = item.category;
                var cTextW = ctx.measureText(cText).width;
                var cTagW  = cTextW + tagPadH * 2;
                var cTagX  = tagsX - cTagW;
                var cTagY  = rowY + rowMidOff - tagH / 2;

                ctx.beginPath();
                ctx.rect(cTagX, cTagY, cTagW, tagH);
                ctx.strokeStyle = p.edge;
                ctx.lineWidth   = 1;
                ctx.stroke();

                ctx.fillStyle    = p.textMuted;
                ctx.textAlign    = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(cText, cTagX + cTagW / 2, rowY + rowMidOff);
                ctx.restore();
                tagsX = cTagX - tagGap;
            }

            // Message — truncated, clipped to space between timestamp and tags
            var effectiveMsgMaxW = tagsX - msgX - Math.round(w * 0.01);
            if (effectiveMsgMaxW < 20) { effectiveMsgMaxW = 20; }

            ctx.save();
            ctx.font         = '500 ' + msgFontSz + 'px ' + t.fonts.ui;
            ctx.fillStyle    = isHov ? p.text : theme.lerpColor(p.textDim, p.text, 0.3);
            ctx.textAlign    = 'left';
            ctx.textBaseline = 'middle';
            var msgDisplay = truncateText(ctx, item.message, effectiveMsgMaxW);
            ctx.fillText(msgDisplay, msgX, rowY + rowMidOff);
            ctx.restore();

            // Row bottom separator
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(0, rowY + rowH);
            ctx.lineTo(w, rowY + rowH);
            ctx.strokeStyle = p.edge;
            ctx.lineWidth   = 1;
            ctx.stroke();
            ctx.restore();

            // Hit region — full row width
            this._hitRegions.push({
                rowIdx: i,
                x: 0,
                y: rowY,
                w: w,
                h: rowH
            });
        }
    },

    _drawEmpty: function () {
        if (!this._container) { return; }
        var setup = theme.setupCanvas(this.el);
        var ctx   = setup.ctx;
        ctx.clearRect(0, 0, setup.w, setup.h);
        ctx.font         = '400 13px ' + theme.getTheme('dark').fonts.ui;
        ctx.fillStyle    = 'rgba(230,225,217,0.25)';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No alerts', setup.w / 2, setup.h / 2);
    },

    reflow: function () {
        if (this._lastData && this._lastConfig) {
            this._render(this._lastData, this._lastConfig);
        }
    },

    destroy: function () {
        var el = this.el;
        if (this._boundMouseMove)  { el.removeEventListener('mousemove',  this._boundMouseMove); }
        if (this._boundMouseLeave) { el.removeEventListener('mouseleave', this._boundMouseLeave); }
        this._container      = null;
        this._canvas         = null;
        this._tooltip        = null;
        this._lastData       = null;
        this._lastConfig     = null;
        this._hitRegions     = [];
        this._hoveredRowIdx  = -1;
        this._renderItems    = null;
        SplunkVisualizationBase.prototype.destroy && SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }

});


});