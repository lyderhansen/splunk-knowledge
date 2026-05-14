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
            'border-radius:4px;pointer-events:none;white-space:nowrap;z-index:100;';
        this.el.appendChild(this._tooltip);

        this._lastGoodData = null;
        this._animTimer = null;
        this._animProgress = 1;
        this._prevPct = 0;

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

        var valueField = opt('valueField', 'value');
        var maxField = opt('maxField', 'max');
        var labelField = opt('labelField', 'label');
        var warnThresh = safeNum(opt('warningThreshold', '70'), 70) / 100;
        var critThresh = safeNum(opt('criticalThreshold', '90'), 90) / 100;
        var showPct = opt('showPercentage', 'true') === 'true';
        var ringWidth = safeNum(opt('ringWidth', '24'), 24);
        var accentHex = hexFromSplunk(opt('accentColor', '0x0AC8B9')) || '#0AC8B9';
        var glowIntensity = safeNum(opt('glowIntensity', '70'), 70) / 100;

        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark'
                   : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');

        var w = this.el.clientWidth || this.el.offsetWidth || window.innerWidth || 300;
        var h = this.el.clientHeight || this.el.offsetHeight || window.innerHeight || 300;
        if (w < 10) w = window.innerWidth || 300;
        if (h < 10) h = window.innerHeight || 300;

        var dpr = window.devicePixelRatio || 1;
        this._canvas.width = w * dpr;
        this._canvas.height = h * dpr;
        this._canvas.style.width = w + 'px';
        this._canvas.style.height = h + 'px';
        var ctx = this._canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        var row = data.rows[data.rows.length - 1];
        var ci = data.colIdx;
        var value = ci[valueField] != null ? safeNum(row[ci[valueField]], 0) : 0;
        var maxVal = ci[maxField] != null ? safeNum(row[ci[maxField]], 100) : 100;
        var label = ci[labelField] != null ? safeStr(row[ci[labelField]]) : '';

        var pct = maxVal > 0 ? Math.min(value / maxVal, 1) : 0;

        // Animate on data change
        if (Math.abs(pct - this._prevPct) > 0.001 && this._animProgress >= 1) {
            this._animFrom = this._prevPct;
            this._animTo = pct;
            this._animProgress = 0;
            this._prevPct = pct;
            var self = this;
            if (this._animTimer) clearInterval(this._animTimer);
            this._animTimer = setInterval(function() {
                self._animProgress += 0.03;
                if (self._animProgress >= 1) {
                    self._animProgress = 1;
                    clearInterval(self._animTimer);
                    self._animTimer = null;
                }
                self.invalidateUpdateView();
            }, 16);
        }

        var easedT = this._animProgress < 1
            ? (this._animProgress < 0.5
                ? 2 * this._animProgress * this._animProgress
                : -1 + (4 - 2 * this._animProgress) * this._animProgress)
            : 1;
        var displayPct = this._animFrom != null
            ? this._animFrom + (this._animTo - this._animFrom) * easedT
            : pct;

        // Ring geometry — 270 degree sweep
        var pad = Math.max(20, Math.min(w, h) * 0.08);
        var dim = Math.min(w, h);
        var cx = w / 2;
        var cy = h / 2;
        var outerR = (dim / 2) - pad;
        var radius = outerR - ringWidth / 2;

        // Arc angles: 270 sweep, starting from bottom-left
        var startAngle = (135 - 90) * Math.PI / 180;
        var endAngle = (405 - 90) * Math.PI / 180;
        var sweepRange = endAngle - startAngle;

        // Track ring
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, endAngle, false);
        ctx.strokeStyle = theme.withAlpha(t.edge, 0.4);
        ctx.lineWidth = ringWidth;
        ctx.lineCap = 'butt';
        ctx.stroke();

        // Tick marks on track
        ctx.save();
        var numTicks = 27;
        for (var ti = 0; ti <= numTicks; ti++) {
            var tickAngle = startAngle + (ti / numTicks) * sweepRange;
            var isMajor = ti % 9 === 0;
            var tickInner = radius - ringWidth / 2 - (isMajor ? 10 : 5);
            var tickOuter = radius - ringWidth / 2 - 2;
            ctx.beginPath();
            ctx.moveTo(cx + tickInner * Math.cos(tickAngle), cy + tickInner * Math.sin(tickAngle));
            ctx.lineTo(cx + tickOuter * Math.cos(tickAngle), cy + tickOuter * Math.sin(tickAngle));
            ctx.strokeStyle = theme.withAlpha(t.textFaint, isMajor ? 0.6 : 0.3);
            ctx.lineWidth = isMajor ? 1.5 : 0.75;
            ctx.lineCap = 'butt';
            ctx.stroke();
        }
        ctx.restore();

        // Fill arc with color based on threshold
        var fillAngle = startAngle + displayPct * sweepRange;
        var arcColor;
        if (displayPct >= critThresh) {
            arcColor = t.danger;
        } else if (displayPct >= warnThresh) {
            var wRatio = (displayPct - warnThresh) / (critThresh - warnThresh);
            arcColor = theme.lerpColor('#C89B3C', '#E84057', wRatio);
        } else {
            arcColor = accentHex;
        }

        // Glow behind the arc
        if (glowIntensity > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, radius, startAngle, fillAngle, false);
            ctx.strokeStyle = arcColor;
            ctx.lineWidth = ringWidth + 8;
            ctx.lineCap = 'round';
            ctx.shadowColor = arcColor;
            ctx.shadowBlur = 20 * glowIntensity;
            ctx.globalAlpha = 0.4 * glowIntensity;
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
            ctx.restore();
        }

        // Main arc fill
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, fillAngle, false);
        ctx.strokeStyle = arcColor;
        ctx.lineWidth = ringWidth;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Bright cap dot at arc end
        var capX = cx + radius * Math.cos(fillAngle);
        var capY = cy + radius * Math.sin(fillAngle);
        ctx.beginPath();
        ctx.arc(capX, capY, ringWidth / 2 + 2, 0, Math.PI * 2);
        ctx.fillStyle = theme.withAlpha(arcColor, 0.3);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(capX, capY, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        // Center text — percentage
        ctx.globalAlpha = 1;
        if (showPct) {
            var pctText = Math.round(displayPct * 100) + '%';
            var pctSize = Math.max(20, dim * 0.18);
            ctx.font = '700 ' + pctSize + 'px ' + theme.FONTS.data;
            ctx.fillStyle = t.text;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pctText, cx, cy - dim * 0.02);
        }

        // Value and max below percentage
        var detailSize = Math.max(9, dim * 0.05);
        ctx.font = '400 ' + detailSize + 'px ' + theme.FONTS.ui;
        ctx.fillStyle = t.textDim;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(theme.fmtNum(value) + ' / ' + theme.fmtNum(maxVal), cx, cy + dim * 0.08);

        // Label at bottom of arc
        if (label) {
            var lblSize = Math.max(10, dim * 0.055);
            ctx.font = '600 ' + lblSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = t.textDim;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            var lblY = cy + radius + ringWidth / 2 + 12;
            ctx.fillText(label.toUpperCase(), cx, lblY);
        }

        // Hextech corner accents
        var cornerLen = Math.max(10, dim * 0.06);
        ctx.strokeStyle = theme.withAlpha(accentHex, 0.25);
        ctx.lineWidth = 1.5;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(6, 6 + cornerLen);
        ctx.lineTo(6, 6);
        ctx.lineTo(6 + cornerLen, 6);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(w - 6 - cornerLen, 6);
        ctx.lineTo(w - 6, 6);
        ctx.lineTo(w - 6, 6 + cornerLen);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(6, h - 6 - cornerLen);
        ctx.lineTo(6, h - 6);
        ctx.lineTo(6 + cornerLen, h - 6);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(w - 6 - cornerLen, h - 6);
        ctx.lineTo(w - 6, h - 6);
        ctx.lineTo(w - 6, h - 6 - cornerLen);
        ctx.stroke();
    },

    _onMouseMove: function() {},

    reflow: function() {
        this.invalidateUpdateView();
    },

    destroy: function() {
        if (this._animTimer) { clearInterval(this._animTimer); this._animTimer = null; }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }
});


});