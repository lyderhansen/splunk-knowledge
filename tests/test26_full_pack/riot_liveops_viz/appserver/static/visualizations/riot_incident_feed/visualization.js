define(["api/SplunkVisualizationBase","api/SplunkVisualizationUtils"], function(SplunkVisualizationBase, SplunkVisualizationUtils) {

// ── Inlined theme.js ──
var theme = (function() {
/*
 * Riot Games Live Ops — design tokens.
 * ES5 only — no const/let/arrow/template-literals.
 */

function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

function withAlpha(hex, alpha) {
    var r = parseInt(hex.slice(1,3), 16);
    var g = parseInt(hex.slice(3,5), 16);
    var b = parseInt(hex.slice(5,7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + clamp01(alpha) + ')';
}

function lerpColor(a, b, t) {
    t = clamp01(t);
    var ar = parseInt(a.slice(1,3),16), ag = parseInt(a.slice(3,5),16), ab = parseInt(a.slice(5,7),16);
    var br = parseInt(b.slice(1,3),16), bg = parseInt(b.slice(3,5),16), bb = parseInt(b.slice(5,7),16);
    var rr = Math.round(ar + (br - ar) * t);
    var gg = Math.round(ag + (bg - ag) * t);
    var bl = Math.round(ab + (bb - ab) * t);
    return '#' + ((1 << 24) + (rr << 16) + (gg << 8) + bl).toString(16).slice(1);
}

var DARK = {
    name: 'dark',
    bg: '#010A13',
    panel: '#0A1628',
    panelHi: '#0D1F38',
    edge: '#1E2328',
    edgeStrong: '#3C3C41',
    grid: 'rgba(30,35,40,0.5)',
    text: '#F0E6D2',
    textDim: '#A09B8C',
    textFaint: '#5B5A56',
    s1: '#0AC8B9',
    s2: '#C89B3C',
    s3: '#E84057',
    s4: '#F0B232',
    s5: '#0397AB',
    accent: '#0AC8B9',
    success: '#0AC8B9',
    warn: '#F0B232',
    danger: '#E84057',
    invert: '#F0E6D2'
};

var LIGHT = {
    name: 'light',
    bg: '#F0F0F0',
    panel: '#FFFFFF',
    panelHi: '#F5F5F5',
    edge: '#D0D0D0',
    edgeStrong: '#999999',
    grid: 'rgba(0,0,0,0.06)',
    text: '#1A1A1A',
    textDim: '#666666',
    textFaint: '#999999',
    s1: '#0AC8B9',
    s2: '#C89B3C',
    s3: '#E84057',
    s4: '#C08820',
    s5: '#0397AB',
    accent: '#0AC8B9',
    success: '#0AC8B9',
    warn: '#C08820',
    danger: '#E84057',
    invert: '#1A1A1A'
};

function getTheme(name) {
    return (name === 'light') ? LIGHT : DARK;
}

var FONTS = {
    data: '"Beaufort for LOL", "Trajan Pro", "Georgia", serif',
    ui: '"Spiegel", "Segoe UI", "Helvetica Neue", sans-serif'
};

var BEAUFORT_BASE64 = '';
var SPIEGEL_BASE64 = '';

var _fontsLoaded = false;
function loadFonts() {
    if (_fontsLoaded) return;
    _fontsLoaded = true;
    if (BEAUFORT_BASE64) {
        try {
            var s = document.createElement('style');
            s.textContent = '@font-face{font-family:"Beaufort for LOL";src:url(data:font/woff2;base64,' + BEAUFORT_BASE64 + ') format("woff2");font-weight:700;font-display:swap;}';
            document.head.appendChild(s);
        } catch (e) {}
    }
    if (SPIEGEL_BASE64) {
        try {
            var s2 = document.createElement('style');
            s2.textContent = '@font-face{font-family:"Spiegel";src:url(data:font/woff2;base64,' + SPIEGEL_BASE64 + ') format("woff2");font-weight:400;font-display:swap;}';
            document.head.appendChild(s2);
        } catch (e) {}
    }
}

function severityColor(t, sev) {
    if (sev === 'critical' || sev === 'crit' || sev === 'error') return t.danger;
    if (sev === 'warning' || sev === 'warn') return t.warn;
    if (sev === 'ok' || sev === 'good' || sev === 'success') return t.success;
    return t.textDim;
}

function fmtNum(v, opts) {
    if (v == null || isNaN(v)) return '—';
    var abs = Math.abs(v);
    var sign = v < 0 ? '-' : '';
    if (abs >= 1e9) return sign + (abs / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6) return sign + (abs / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3) return sign + (abs / 1e3).toFixed(1) + 'K';
    if (abs < 1 && abs > 0) return sign + abs.toFixed(2);
    return sign + Math.round(abs).toString();
}

function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

function drawPanel(ctx, t, x, y, w, h) {
    roundRect(ctx, x, y, w, h, 4);
    ctx.fillStyle = t.panel;
    ctx.fill();
    ctx.strokeStyle = t.edge;
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawHGrid(ctx, t, x, y, w, h, divisions) {
    ctx.strokeStyle = t.grid;
    ctx.lineWidth = 0.5;
    for (var i = 1; i < divisions; i++) {
        var gy = y + (h / divisions) * i;
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.lineTo(x + w, gy);
        ctx.stroke();
    }
}

function parseColors(raw, fallback) {
    if (!raw || typeof raw !== 'string') return fallback;
    return raw.split(',').map(function(c) { return c.trim(); }).filter(function(c) { return c.length > 0; });
}

function parseInts(raw) {
    if (!raw || typeof raw !== 'string') return [];
    return raw.split(',').map(function(s) { return parseInt(s.trim(), 10); }).filter(function(n) { return !isNaN(n); });
}


    return { getTheme: getTheme,     withAlpha: withAlpha,     lerpColor: lerpColor,     severityColor: severityColor,     fmtNum: fmtNum,     roundRect: roundRect,     drawPanel: drawPanel,     drawHGrid: drawHGrid,     parseColors: parseColors,     parseInts: parseInts,     loadFonts: loadFonts,     FONTS: FONTS };
})();

// ── Viz source ──



function safeStr(val) {
    return (val != null && val !== '') ? String(val) : '';
}

function safeNum(val, fallback) {
    if (val == null || val === '') return fallback;
    var n = parseFloat(val);
    return isNaN(n) ? fallback : n;
}

function detectTheme() {
    try {
        if (typeof SplunkVisualizationUtils !== 'undefined' &&
            SplunkVisualizationUtils.getCurrentTheme) {
            var st = SplunkVisualizationUtils.getCurrentTheme();
            if (st === 'light' || st === 'dark') return st;
        }
    } catch (e) {}
    var body = document.body;
    if (body) {
        var dt = body.getAttribute('data-theme');
        if (dt === 'light' || dt === 'dark') return dt;
        if (body.classList.contains('dark')) return 'dark';
        if (body.classList.contains('light')) return 'light';
    }
    try {
        var bg = window.getComputedStyle(document.body).backgroundColor;
        var m = bg.match(/\d+/g);
        if (m && m.length >= 3) {
            return (parseInt(m[0])+parseInt(m[1])+parseInt(m[2]))/3 < 128
                   ? 'dark' : 'light';
        }
    } catch (e) {}
    return 'dark';
}

function hexFromSplunk(val) {
    if (!val) return null;
    var s = String(val).replace(/^0x/, '#');
    if (s.charAt(0) !== '#') s = '#' + s;
    return s;
}

function formatTime(raw) {
    if (!raw) return '';
    var d = new Date(raw);
    if (isNaN(d.getTime())) return String(raw).substring(11, 16) || raw;
    var hh = ('0' + d.getHours()).slice(-2);
    var mm = ('0' + d.getMinutes()).slice(-2);
    return hh + ':' + mm;
}

return SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.classList.add('riot-liveops-viz');
        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;';
        this.el.appendChild(this._canvas);

        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 10px;' +
            'border-radius:4px;pointer-events:none;white-space:nowrap;z-index:100;' +
            'max-width:300px;white-space:normal;';
        this.el.appendChild(this._tooltip);

        this._lastGoodData = null;
        this._hoveredIdx = -1;
        this._scrollOffset = 0;
        this._hitZones = [];

        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            self._tooltip.style.display = 'none';
            if (self._hoveredIdx !== -1) {
                self._hoveredIdx = -1;
                self.invalidateUpdateView();
            }
        });
        this._canvas.addEventListener('wheel', function(e) {
            e.preventDefault();
            self._scrollOffset += e.deltaY;
            if (self._scrollOffset < 0) self._scrollOffset = 0;
            self.invalidateUpdateView();
        });

        theme.loadFonts();
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
            return null;
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
        if (!data) {
            if (this._lastGoodData) data = this._lastGoodData;
            else return;
        }

        var ns = this.getPropertyNamespaceInfo().propertyNamespace;
        function opt(key, fallback) {
            var v = config[ns + key];
            return (v != null && v !== '') ? v : fallback;
        }

        var timeField = opt('timeField', '_time');
        var sevField = opt('severityField', 'severity');
        var regionField = opt('regionField', 'region');
        var msgField = opt('messageField', 'message');
        var svcField = opt('serviceField', 'service');
        var maxRows = parseInt(opt('maxRows', '50'), 10) || 50;
        var showTime = opt('showTimestamp', 'true') === 'true';
        var rowHeightOpt = safeNum(opt('rowHeight', '0'), 0);
        var accentHex = hexFromSplunk(opt('accentColor', '0x0AC8B9')) || '#0AC8B9';
        var glowIntensity = safeNum(opt('glowIntensity', '50'), 50) / 100;

        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark'
                   : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');

        var w = this.el.clientWidth || this.el.offsetWidth || window.innerWidth || 300;
        var h = this.el.clientHeight || this.el.offsetHeight || window.innerHeight || 400;
        if (w < 10) w = window.innerWidth || 300;
        if (h < 10) h = window.innerHeight || 400;

        var dpr = window.devicePixelRatio || 1;
        this._canvas.width = w * dpr;
        this._canvas.height = h * dpr;
        this._canvas.style.width = w + 'px';
        this._canvas.style.height = h + 'px';
        var ctx = this._canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        this._tooltip.style.background = t.panelHi || t.panel;
        this._tooltip.style.color = t.text;
        this._tooltip.style.fontFamily = theme.FONTS.ui;

        var ci = data.colIdx;
        var rows = data.rows;
        var items = [];
        var limit = Math.min(rows.length, maxRows);

        for (var i = 0; i < limit; i++) {
            items.push({
                time: ci[timeField] != null ? safeStr(rows[i][ci[timeField]]) : '',
                severity: ci[sevField] != null ? safeStr(rows[i][ci[sevField]]).toLowerCase() : '',
                region: ci[regionField] != null ? safeStr(rows[i][ci[regionField]]) : '',
                message: ci[msgField] != null ? safeStr(rows[i][ci[msgField]]) : '',
                service: ci[svcField] != null ? safeStr(rows[i][ci[svcField]]) : ''
            });
        }

        var pad = Math.max(8, w * 0.02);
        var fontSize = Math.max(10, h * 0.032);
        var timeFontSize = Math.max(9, h * 0.028);
        var rowH = rowHeightOpt > 0 ? rowHeightOpt : Math.max(36, h * 0.07);
        var gap = 2;

        // Clamp scroll
        var totalContentH = items.length * (rowH + gap);
        var maxScroll = Math.max(0, totalContentH - h + pad * 2);
        if (this._scrollOffset > maxScroll) this._scrollOffset = maxScroll;

        this._hitZones = [];

        // Header line
        var headerH = pad;

        ctx.save();
        for (var ri = 0; ri < items.length; ri++) {
            var item = items[ri];
            var ry = headerH + ri * (rowH + gap) - this._scrollOffset;

            if (ry + rowH < 0 || ry > h) continue;

            var sevColor = theme.severityColor(t, item.severity);
            var isCritical = item.severity === 'critical' || item.severity === 'crit' || item.severity === 'error';

            // Alternating row background
            theme.roundRect(ctx, pad, ry, w - pad * 2, rowH, 3);
            ctx.fillStyle = ri % 2 === 0 ? t.panel : theme.withAlpha(t.panelHi, 0.5);
            ctx.fill();

            // Hover highlight
            if (this._hoveredIdx === ri) {
                theme.roundRect(ctx, pad, ry, w - pad * 2, rowH, 3);
                ctx.fillStyle = theme.withAlpha(t.accent, 0.06);
                ctx.fill();
            }

            // Critical row: red glow on left edge
            if (isCritical && glowIntensity > 0) {
                ctx.save();
                ctx.shadowColor = t.danger;
                ctx.shadowBlur = 10 * glowIntensity;
                ctx.fillStyle = t.danger;
                ctx.fillRect(pad, ry + 4, 3, rowH - 8);
                ctx.shadowBlur = 0;
                ctx.restore();
            }

            // Severity pip
            var pipX = pad + 16;
            var pipY = ry + rowH / 2;
            ctx.beginPath();
            ctx.arc(pipX, pipY, 4, 0, Math.PI * 2);
            ctx.fillStyle = sevColor;
            ctx.fill();
            if (isCritical) {
                ctx.beginPath();
                ctx.arc(pipX, pipY, 7, 0, Math.PI * 2);
                ctx.strokeStyle = theme.withAlpha(t.danger, 0.3);
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            var textX = pipX + 16;
            ctx.globalAlpha = 1;

            // Timestamp
            if (showTime) {
                ctx.font = '400 ' + timeFontSize + 'px ' + theme.FONTS.ui;
                ctx.fillStyle = t.textFaint;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(formatTime(item.time), textX, pipY);
                textX += Math.max(40, w * 0.08);
            }

            // Region badge
            if (item.region) {
                var badgeFontSize = Math.max(8, fontSize * 0.8);
                ctx.font = '600 ' + badgeFontSize + 'px ' + theme.FONTS.ui;
                var badgeText = item.region;
                var badgeW = ctx.measureText(badgeText).width + 12;
                var badgeH = badgeFontSize + 8;
                var badgeY = pipY - badgeH / 2;

                theme.roundRect(ctx, textX, badgeY, badgeW, badgeH, 3);
                ctx.fillStyle = theme.withAlpha(accentHex, 0.12);
                ctx.fill();
                ctx.strokeStyle = theme.withAlpha(accentHex, 0.3);
                ctx.lineWidth = 0.75;
                ctx.stroke();

                ctx.fillStyle = accentHex;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(badgeText, textX + badgeW / 2, pipY);
                textX += badgeW + 10;
            }

            // Service tag
            if (item.service) {
                var svcFontSize = Math.max(8, fontSize * 0.75);
                ctx.font = '400 ' + svcFontSize + 'px ' + theme.FONTS.ui;
                ctx.fillStyle = t.textDim;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                var svcText = '[' + item.service + ']';
                ctx.fillText(svcText, textX, pipY);
                textX += ctx.measureText(svcText).width + 8;
            }

            // Message text — truncate to fit
            var msgMaxW = w - textX - pad - 8;
            ctx.font = '400 ' + fontSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = this._hoveredIdx === ri ? t.text : t.textDim;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            var msgText = item.message;
            while (ctx.measureText(msgText).width > msgMaxW && msgText.length > 3) {
                msgText = msgText.substring(0, msgText.length - 4) + '...';
            }
            ctx.fillText(msgText, textX, pipY);

            this._hitZones.push({
                x: pad, y: ry, w: w - pad * 2, h: rowH,
                item: item
            });
        }
        ctx.restore();

        // Top and bottom edge fade
        var fadeH = Math.max(8, h * 0.04);
        var topGrad = ctx.createLinearGradient(0, 0, 0, fadeH);
        topGrad.addColorStop(0, theme.withAlpha(t.bg, 1));
        topGrad.addColorStop(1, theme.withAlpha(t.bg, 0));
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, w, fadeH);

        if (totalContentH > h) {
            var btmGrad = ctx.createLinearGradient(0, h - fadeH, 0, h);
            btmGrad.addColorStop(0, theme.withAlpha(t.bg, 0));
            btmGrad.addColorStop(1, theme.withAlpha(t.bg, 1));
            ctx.fillStyle = btmGrad;
            ctx.fillRect(0, h - fadeH, w, fadeH);

            // Scroll indicator
            var scrollPct = this._scrollOffset / maxScroll;
            var trackH = h - pad * 2;
            var thumbH = Math.max(20, (h / totalContentH) * trackH);
            var thumbY = pad + scrollPct * (trackH - thumbH);
            theme.roundRect(ctx, w - 6, thumbY, 3, thumbH, 1.5);
            ctx.fillStyle = theme.withAlpha(accentHex, 0.3);
            ctx.fill();
        }
    },

    _onMouseMove: function(e) {
        var mx = e.offsetX;
        var my = e.offsetY;
        var hit = -1;
        for (var i = 0; i < this._hitZones.length; i++) {
            var z = this._hitZones[i];
            if (mx >= z.x && mx <= z.x + z.w && my >= z.y && my <= z.y + z.h) {
                hit = i;
                break;
            }
        }
        if (hit !== this._hoveredIdx) {
            this._hoveredIdx = hit;
            this.invalidateUpdateView();
        }
        if (hit >= 0) {
            var item = this._hitZones[hit].item;
            this._tooltip.innerHTML =
                '<strong>' + item.severity.toUpperCase() + '</strong> — ' +
                item.region + '<br>' + item.message +
                (item.service ? '<br><em>' + item.service + '</em>' : '') +
                (item.time ? '<br><small>' + item.time + '</small>' : '');
            this._tooltip.style.display = 'block';
            this._tooltip.style.left = Math.min(mx + 12, this.el.clientWidth - 200) + 'px';
            this._tooltip.style.top = (my - 30) + 'px';
        } else {
            this._tooltip.style.display = 'none';
        }
    },

    reflow: function() {
        this.invalidateUpdateView();
    },

    destroy: function() {
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }
});


});