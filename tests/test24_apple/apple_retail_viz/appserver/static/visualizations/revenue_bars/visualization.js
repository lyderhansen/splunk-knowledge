define(["api/SplunkVisualizationBase"], function(SplunkVisualizationBase) {

// --- theme.js (inlined) ---
var theme = (function() {
// Apple Retail Analytics — shared design tokens
// Mood: Minimal | Tone: Refined, precise, quiet confidence
// Fonts: SF Pro Display + SF Mono (system — 0KB embedding)

var FONTS = {
    display: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif',
    mono: '"SF Mono", SFMono-Regular, Menlo, Consolas, monospace'
};

var DARK = {
    bg:        '#1D1D1F',
    card:      '#2C2C2E',
    cardHi:    '#3A3A3C',
    text:      '#F5F5F7',
    textDim:   '#98989D',
    textMuted: 'rgba(245,245,247,0.35)',
    accent:    '#0A84FF',
    accentDim: 'rgba(10,132,255,0.15)',
    success:   '#30D158',
    warning:   '#FF9F0A',
    danger:    '#FF453A',
    border:    'rgba(255,255,255,0.08)',
    shadow:    'rgba(0,0,0,0.40)',
    grid:      'rgba(255,255,255,0.06)'
};

var LIGHT = {
    bg:        '#F5F5F7',
    card:      '#FFFFFF',
    cardHi:    '#F0F0F2',
    text:      '#1D1D1F',
    textDim:   '#86868B',
    textMuted: 'rgba(29,29,31,0.30)',
    accent:    '#007AFF',
    accentDim: 'rgba(0,122,255,0.08)',
    success:   '#34C759',
    warning:   '#FF9500',
    danger:    '#FF3B30',
    border:    'rgba(0,0,0,0.06)',
    shadow:    'rgba(0,0,0,0.08)',
    grid:      'rgba(0,0,0,0.06)'
};

var SEMANTIC = {
    critical: { dark: '#FF453A', light: '#FF3B30' },
    warning:  { dark: '#FF9F0A', light: '#FF9500' },
    good:     { dark: '#30D158', light: '#34C759' },
    info:     { dark: '#0A84FF', light: '#007AFF' },
    neutral:  { dark: '#98989D', light: '#86868B' }
};

var CATEGORY_COLORS = [
    '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#FF9500',
    '#FFCC00', '#34C759', '#00C7BE', '#30B0C7', '#64D2FF'
];

function getTheme(mode) {
    return mode === 'light' ? LIGHT : DARK;
}

function getSemantic(key, mode) {
    var s = SEMANTIC[key];
    if (!s) return '#98989D';
    return mode === 'light' ? s.light : s.dark;
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
        if (body.classList.contains('light')) return 'light';
        if (body.classList.contains('dark')) return 'dark';
    }
    try {
        var bg = window.getComputedStyle(document.body).backgroundColor;
        var m = bg.match(/\d+/g);
        if (m && m.length >= 3) {
            return (parseInt(m[0]) + parseInt(m[1]) + parseInt(m[2])) / 3 < 128
                   ? 'dark' : 'light';
        }
    } catch (e) {}
    return 'light';
}

function safeStr(val) {
    return (val != null && val !== '') ? String(val) : '';
}

function fmtNum(n, opts) {
    opts = opts || {};
    var decimals = opts.decimals;
    if (decimals !== undefined && decimals >= 0) return n.toFixed(decimals);
    var abs = Math.abs(n);
    if (abs >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (abs >= 1e4) return (n / 1e3).toFixed(1) + 'K';
    if (abs >= 1e3) return n.toLocaleString ? n.toLocaleString() : String(n);
    if (Number.isInteger(n)) return String(n);
    return n.toFixed(1);
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

function lerpColor(a, b, t) {
    var ah = parseInt(a.replace('#', ''), 16);
    var bh = parseInt(b.replace('#', ''), 16);
    var ar = (ah >> 16) & 0xFF, ag = (ah >> 8) & 0xFF, ab = ah & 0xFF;
    var br = (bh >> 16) & 0xFF, bg2 = (bh >> 8) & 0xFF, bb = bh & 0xFF;
    var rr = Math.round(ar + (br - ar) * t);
    var rg = Math.round(ag + (bg2 - ag) * t);
    var rb = Math.round(ab + (bb - ab) * t);
    return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb).toString(16).slice(1);
}
return {
    FONTS: FONTS,
    DARK: DARK,
    LIGHT: LIGHT,
    SEMANTIC: SEMANTIC,
    CATEGORY_COLORS: CATEGORY_COLORS,
    getTheme: getTheme,
    getSemantic: getSemantic,
    detectTheme: detectTheme,
    safeStr: safeStr,
    fmtNum: fmtNum,
    getOption: getOption,
    getNS: getNS,
    lerpColor: lerpColor
};
})();

// --- visualization source ---
return SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;';
        this.el.appendChild(this._canvas);

        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 12px;' +
            'border-radius:8px;pointer-events:none;white-space:nowrap;' +
            'z-index:100;font-size:11px;';
        this.el.appendChild(this._tooltip);

        this._hitRegions = [];
        this._lastData = null;
        this._lastConfig = null;

        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            self._tooltip.style.display = 'none';
            self._canvas.style.cursor = 'default';
            if (self._hoveredIdx !== -1) {
                self._hoveredIdx = -1;
                if (self._lastData && self._lastConfig) {
                    self._render(self._lastData, self._lastConfig);
                }
            }
        });
        this._hoveredIdx = -1;
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
        if (!data || !data.rows || data.rows.length === 0) return;
        this._lastData = data;
        this._lastConfig = config;
        this._render(data, config);
    },

    _render: function(data, config) {
        var ns = theme.getNS(this);
        var themeMode = theme.getOption(config, ns, 'themeMode', 'auto');
        var isDark = themeMode === 'auto' ? theme.detectTheme() === 'dark' : themeMode === 'dark';
        var t = isDark ? theme.DARK : theme.LIGHT;

        var labelField = theme.getOption(config, ns, 'labelField', 'store');
        var valueField = theme.getOption(config, ns, 'valueField', 'revenue');
        var deltaField = theme.getOption(config, ns, 'deltaField', 'delta');
        var unitStr = theme.getOption(config, ns, 'unit', '$');
        var unitPos = theme.getOption(config, ns, 'unitPosition', 'before');
        var decimals = parseInt(theme.getOption(config, ns, 'decimals', '-1'), 10);
        var maxBars = parseInt(theme.getOption(config, ns, 'maxBars', '10'), 10);
        var barColor = theme.getOption(config, ns, 'barColor', t.accent);
        var accentIntensity = parseInt(theme.getOption(config, ns, 'accentIntensity', '50'), 10);
        var showRank = theme.getOption(config, ns, 'showRank', 'true') === 'true';

        var w = this.el.clientWidth || this.el.offsetWidth || window.innerWidth || 300;
        var h = this.el.clientHeight || this.el.offsetHeight || window.innerHeight || 200;
        if (w < 10) w = window.innerWidth || 300;
        if (h < 10) h = window.innerHeight || 200;

        var dpr = window.devicePixelRatio || 1;
        this._canvas.width = w * dpr;
        this._canvas.height = h * dpr;
        this._canvas.style.width = w + 'px';
        this._canvas.style.height = h + 'px';
        var ctx = this._canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        var colIdx = data.colIdx;
        var li = colIdx[labelField];
        var vi = colIdx[valueField];
        var di = colIdx[deltaField];

        // Parse and sort rows
        var items = [];
        var rows = data.rows;
        var count = Math.min(rows.length, maxBars);
        for (var i = 0; i < rows.length; i++) {
            var val = parseFloat(rows[i][vi]);
            if (isNaN(val)) val = 0;
            items.push({
                label: theme.safeStr(li !== undefined ? rows[i][li] : 'Row ' + (i + 1)),
                value: val,
                delta: di !== undefined ? parseFloat(rows[i][di]) : null
            });
        }
        items.sort(function(a, b) { return b.value - a.value; });
        items = items.slice(0, count);

        var maxVal = items.length > 0 ? items[0].value : 1;
        if (maxVal === 0) maxVal = 1;

        // Layout
        var padX = Math.max(12, w * 0.025);
        var padY = Math.max(8, h * 0.02);
        var gap = Math.max(4, h * 0.015);
        var availH = h - padY * 2;
        var rowH = Math.max(20, Math.floor((availH - gap * (count - 1)) / count));

        // Measure label widths
        var labelFontSize = Math.max(9, rowH * 0.38);
        ctx.font = '400 ' + labelFontSize + 'px ' + theme.FONTS.display;
        var maxLabelW = 0;
        for (var j = 0; j < items.length; j++) {
            var lw = ctx.measureText(items[j].label).width;
            if (lw > maxLabelW) maxLabelW = lw;
        }

        var rankW = showRank ? Math.max(20, rowH * 0.9) : 0;
        var labelAreaW = maxLabelW + 16;
        var valueAreaW = Math.max(60, w * 0.10);
        var barStartX = padX + rankW + labelAreaW;
        var barEndX = w - padX - valueAreaW;
        var barMaxW = barEndX - barStartX;
        if (barMaxW < 40) barMaxW = 40;

        this._hitRegions = [];

        for (var k = 0; k < items.length; k++) {
            var item = items[k];
            var y = padY + k * (rowH + gap);
            var cy = y + rowH / 2;
            var hovered = k === this._hoveredIdx;

            // Rank number
            if (showRank) {
                ctx.font = '600 ' + Math.max(8, rowH * 0.35) + 'px ' + theme.FONTS.mono;
                ctx.fillStyle = hovered ? t.accent : t.textMuted;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(k + 1), padX + rankW - 8, cy);
            }

            // Store label
            ctx.font = (hovered ? '500 ' : '400 ') + labelFontSize + 'px ' + theme.FONTS.display;
            ctx.fillStyle = hovered ? t.text : t.textDim;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.label, padX + rankW, cy);

            // Bar — Apple-style: rounded ends, subtle gradient
            var barW = Math.max(2, (item.value / maxVal) * barMaxW);
            var barH = Math.max(6, rowH * 0.35);
            var barY = cy - barH / 2;
            var barR = barH / 2;

            // Bar fill with subtle gradient
            var grad = ctx.createLinearGradient(barStartX, 0, barStartX + barW, 0);
            if (hovered) {
                grad.addColorStop(0, barColor);
                grad.addColorStop(1, theme.lerpColor(barColor, isDark ? '#FFFFFF' : '#000000', 0.15));
            } else {
                grad.addColorStop(0, barColor);
                grad.addColorStop(1, theme.lerpColor(barColor, isDark ? '#FFFFFF' : '#000000', 0.08));
            }

            ctx.fillStyle = grad;
            ctx.beginPath();
            if (barW > barH) {
                ctx.moveTo(barStartX + barR, barY);
                ctx.lineTo(barStartX + barW - barR, barY);
                ctx.arc(barStartX + barW - barR, barY + barR, barR, -Math.PI / 2, Math.PI / 2);
                ctx.lineTo(barStartX + barR, barY + barH);
                ctx.arc(barStartX + barR, barY + barR, barR, Math.PI / 2, -Math.PI / 2);
            } else {
                ctx.arc(barStartX + barW / 2, cy, barW / 2, 0, Math.PI * 2);
            }
            ctx.closePath();
            ctx.fill();

            // Value text
            var displayVal = theme.fmtNum(item.value, { decimals: decimals >= 0 ? decimals : undefined });
            if (unitStr) {
                displayVal = unitPos === 'before' ? unitStr + displayVal : displayVal + unitStr;
            }
            var valFontSize = Math.max(9, rowH * 0.36);
            ctx.font = '500 ' + valFontSize + 'px ' + theme.FONTS.mono;
            ctx.fillStyle = t.text;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(displayVal, w - padX, cy);

            // Delta badge
            if (item.delta !== null && !isNaN(item.delta)) {
                var deltaFontSize = Math.max(7, rowH * 0.25);
                var deltaText = (item.delta >= 0 ? '+' : '') + item.delta.toFixed(1) + '%';
                var deltaColor = item.delta >= 0 ? t.success : t.danger;
                ctx.font = '500 ' + deltaFontSize + 'px ' + theme.FONTS.mono;
                var dtw = ctx.measureText(deltaText).width;
                var dvalw = ctx.measureText(displayVal).width;
                ctx.fillStyle = deltaColor;
                ctx.textAlign = 'right';
                ctx.fillText(deltaText, w - padX - dvalw - 12, cy);
            }

            // Separator line
            if (k < items.length - 1) {
                ctx.fillStyle = t.border;
                ctx.fillRect(padX + rankW, y + rowH + gap / 2 - 0.5, w - padX * 2 - rankW, 1);
            }

            this._hitRegions.push({
                x: 0, y: y, w: w, h: rowH,
                label: item.label, value: displayVal, delta: item.delta
            });
        }

        // Tooltip styling
        this._tooltip.style.background = t.card;
        this._tooltip.style.color = t.text;
        this._tooltip.style.fontFamily = theme.FONTS.display;
        this._tooltip.style.boxShadow = '0 2px 12px ' + t.shadow;
    },

    _onMouseMove: function(e) {
        var rect = this._canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;

        var hit = -1;
        for (var i = 0; i < this._hitRegions.length; i++) {
            var r = this._hitRegions[i];
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                hit = i;
                break;
            }
        }

        if (hit >= 0) {
            var region = this._hitRegions[hit];
            this._tooltip.textContent = region.label + ': ' + region.value;
            this._tooltip.style.display = 'block';
            this._tooltip.style.left = (mx + 12) + 'px';
            this._tooltip.style.top = (my - 8) + 'px';
            this._canvas.style.cursor = 'pointer';
        } else {
            this._tooltip.style.display = 'none';
            this._canvas.style.cursor = 'default';
        }

        if (hit !== this._hoveredIdx) {
            this._hoveredIdx = hit;
            if (this._lastData && this._lastConfig) {
                this._render(this._lastData, this._lastConfig);
            }
        }
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
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }
});


});