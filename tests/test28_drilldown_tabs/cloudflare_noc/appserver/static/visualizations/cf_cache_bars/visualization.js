define(["api/SplunkVisualizationBase","api/SplunkVisualizationUtils"], function(SplunkVisualizationBase, SplunkVisualizationUtils) {

// ── Inlined theme.js ──
var theme = (function() {
/*
 * Cloudflare NOC — design tokens.
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
    bg: '#0D0D1F',
    panel: '#161630',
    panelHi: '#1E1E42',
    edge: '#2A2A52',
    edgeStrong: '#3D3D6B',
    grid: 'rgba(246,130,31,0.06)',
    text: '#E8ECF0',
    textDim: '#8B8FA3',
    textFaint: '#555874',
    s1: '#F6821F',
    s2: '#FBAD41',
    s3: '#6ECBF5',
    s4: '#2C7BE5',
    s5: '#A78BFA',
    accent: '#F6821F',
    success: '#34D399',
    warn: '#FBBF24',
    danger: '#EF4444',
    invert: '#0D0D1F'
};

var LIGHT = {
    name: 'light',
    bg: '#F0F2F5',
    panel: '#FFFFFF',
    panelHi: '#F8F9FA',
    edge: '#D1D5DB',
    edgeStrong: '#9CA3AF',
    grid: 'rgba(27,27,58,0.06)',
    text: '#1B1B3A',
    textDim: '#6B7280',
    textFaint: '#9CA3AF',
    s1: '#E5750A',
    s2: '#D4940F',
    s3: '#0284C7',
    s4: '#1D4ED8',
    s5: '#7C3AED',
    accent: '#E5750A',
    success: '#059669',
    warn: '#D97706',
    danger: '#DC2626',
    invert: '#FFFFFF'
};

function getTheme(name) {
    return (name === 'light') ? LIGHT : DARK;
}

var FONTS = {
    data: '"JetBrains Mono", "SF Mono", "Fira Code", "Cascadia Code", monospace',
    ui: '"JetBrains Mono", "SF Mono", "Fira Code", "Cascadia Code", monospace'
};

function severityColor(t, sev) {
    if (sev === 'critical' || sev === 'crit' || sev === 'error' || sev === 'red') return t.danger;
    if (sev === 'warning' || sev === 'warn' || sev === 'amber' || sev === 'yellow') return t.warn;
    if (sev === 'ok' || sev === 'good' || sev === 'success' || sev === 'green' || sev === 'healthy') return t.success;
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


    return { getTheme: getTheme,     withAlpha: withAlpha,     lerpColor: lerpColor,     severityColor: severityColor,     fmtNum: fmtNum,     roundRect: roundRect,     drawPanel: drawPanel,     drawHGrid: drawHGrid,     parseColors: parseColors,     parseInts: parseInts,     FONTS: FONTS };
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

return SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.classList.add('cloudflare_noc-viz');
        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;';
        this.el.appendChild(this._canvas);

        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 10px;' +
            'border-radius:4px;pointer-events:none;white-space:nowrap;z-index:100;font-size:11px;';
        this.el.appendChild(this._tooltip);

        this._lastGoodData = null;
        this._bars = [];
        this._hoverIdx = -1;

        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            self._hoverIdx = -1;
            self._tooltip.style.display = 'none';
            self.invalidateUpdateView();
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

        var categoryField = opt('categoryField', 'category');
        var valueField = opt('valueField', 'value');
        var maxBars = parseInt(opt('maxBars', '8'), 10) || 8;
        var showValues = opt('showValues', 'true') === 'true';
        var unit = opt('unit', '%');
        var maxValue = safeNum(opt('maxValue', '100'), 0);
        var barColor = opt('barColor', '#F6821F');
        var showGradient = opt('showGradient', 'true') === 'true';

        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark'
                   : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');

        var w = this.el.clientWidth || this.el.offsetWidth || window.innerWidth || 500;
        var h = this.el.clientHeight || this.el.offsetHeight || window.innerHeight || 300;
        if (w < 10) w = window.innerWidth || 500;
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

        this._tooltip.style.background = t.panelHi;
        this._tooltip.style.color = t.text;
        this._tooltip.style.fontFamily = theme.FONTS.ui;

        var items = [];
        var limit = Math.min(data.rows.length, maxBars);
        for (var i = 0; i < limit; i++) {
            var row = data.rows[i];
            items.push({
                category: safeStr(row[data.colIdx[categoryField]]),
                value: safeNum(row[data.colIdx[valueField]], 0)
            });
        }

        if (maxValue <= 0) {
            maxValue = 0;
            for (var m = 0; m < items.length; m++) {
                if (items[m].value > maxValue) maxValue = items[m].value;
            }
            if (maxValue <= 0) maxValue = 100;
        }

        var pad = Math.max(10, w * 0.03);
        var labelW = Math.max(60, w * 0.18);
        var barAreaX = pad + labelW;
        var barAreaW = w - barAreaX - pad - (showValues ? 60 : 10);
        var rowH = Math.min(40, (h - pad * 2) / items.length);
        var barH = Math.max(12, rowH * 0.55);
        var gap = rowH - barH;
        var startY = pad + (h - pad * 2 - items.length * rowH) / 2;

        var labelSize = Math.max(9, Math.min(13, rowH * 0.4));
        var valueSize = Math.max(9, Math.min(12, rowH * 0.38));

        this._bars = [];

        for (var b = 0; b < items.length; b++) {
            var item = items[b];
            var by = startY + b * rowH + gap / 2;
            var ratio = Math.min(1, item.value / maxValue);
            var bw = barAreaW * ratio;
            var isHover = this._hoverIdx === b;

            this._bars.push({ x: barAreaX, y: by, w: bw, h: barH, maxW: barAreaW, idx: b });

            ctx.globalAlpha = 1;
            ctx.font = labelSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = isHover ? t.text : t.textDim;
            ctx.textAlign = 'right';
            var catText = item.category;
            var maxLabelW = labelW - 8;
            while (ctx.measureText(catText).width > maxLabelW && catText.length > 3) {
                catText = catText.slice(0, -1);
            }
            if (catText !== item.category) catText += '…';
            ctx.fillText(catText, barAreaX - 8, by + barH * 0.72);

            theme.roundRect(ctx, barAreaX, by, barAreaW, barH, 3);
            ctx.fillStyle = theme.withAlpha(t.edge, 0.15);
            ctx.fill();

            if (bw > 2) {
                theme.roundRect(ctx, barAreaX, by, bw, barH, 3);
                if (showGradient) {
                    var grad = ctx.createLinearGradient(barAreaX, by, barAreaX + bw, by);
                    grad.addColorStop(0, theme.withAlpha(barColor, isDark ? 0.7 : 0.8));
                    grad.addColorStop(1, barColor);
                    ctx.fillStyle = grad;
                } else {
                    ctx.fillStyle = isHover ? barColor : theme.withAlpha(barColor, 0.85);
                }
                ctx.fill();

                if (isHover && isDark) {
                    ctx.shadowColor = theme.withAlpha(barColor, 0.4);
                    ctx.shadowBlur = 8;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.shadowColor = 'transparent';
                }
            }

            if (showValues) {
                ctx.font = '600 ' + valueSize + 'px ' + theme.FONTS.data;
                ctx.fillStyle = isHover ? t.text : t.textDim;
                ctx.textAlign = 'left';
                var valText = item.value.toFixed(1) + unit;
                ctx.fillText(valText, barAreaX + barAreaW + 8, by + barH * 0.72);
            }
        }

        ctx.globalAlpha = 1;
    },

    _onMouseMove: function(e) {
        var my = e.offsetY;
        var found = -1;
        for (var i = 0; i < this._bars.length; i++) {
            var b = this._bars[i];
            if (my >= b.y - 2 && my <= b.y + b.h + 2) {
                found = b.idx;
                break;
            }
        }
        if (found !== this._hoverIdx) {
            this._hoverIdx = found;
            this.invalidateUpdateView();
        }
        this._tooltip.style.display = 'none';
    },

    reflow: function() {
        this.invalidateUpdateView();
    },

    destroy: function() {
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }
});


});