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

        this._lastData = null;
        this._lastConfig = null;
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

        var valueField = theme.getOption(config, ns, 'valueField', 'value');
        var labelField = theme.getOption(config, ns, 'labelField', 'label');
        var trendField = theme.getOption(config, ns, 'trendField', 'trend');
        var unitField = theme.getOption(config, ns, 'unitField', 'unit');
        var unitPos = theme.getOption(config, ns, 'unitPosition', 'before');
        var decimals = parseInt(theme.getOption(config, ns, 'decimals', '-1'), 10);
        var accentColor = theme.getOption(config, ns, 'accentColor', t.accent);
        var accentIntensity = parseInt(theme.getOption(config, ns, 'accentIntensity', '50'), 10);

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
        var row = data.rows[0];
        var vi = colIdx[valueField];
        var li = colIdx[labelField];
        var ti = colIdx[trendField];
        var ui = colIdx[unitField];

        var rawVal = vi !== undefined ? row[vi] : null;
        var label = theme.safeStr(li !== undefined ? row[li] : '');
        var trend = ti !== undefined ? parseFloat(row[ti]) : null;
        var unit = theme.safeStr(ui !== undefined ? row[ui] : '');

        var numVal = parseFloat(rawVal);
        var isNumeric = !isNaN(numVal) && rawVal !== null;
        var displayValue;
        if (!isNumeric) {
            displayValue = theme.safeStr(rawVal) || '—';
        } else {
            displayValue = theme.fmtNum(numVal, { decimals: decimals >= 0 ? decimals : undefined });
        }

        if (unit) {
            if (unitPos === 'before') {
                displayValue = unit + displayValue;
            } else {
                displayValue = displayValue + unit;
            }
        }

        // Layout — Apple style: value dominant, label whispers
        var padX = Math.max(12, w * 0.06);
        var padY = Math.max(10, h * 0.08);

        // Value — hero tier
        var valueFontSize = Math.max(18, h * 0.32);
        ctx.font = '600 ' + valueFontSize + 'px ' + theme.FONTS.display;
        ctx.fillStyle = t.text;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        var valueY = padY + valueFontSize;
        ctx.fillText(displayValue, padX, valueY);

        // Label — whisper tier
        var labelFontSize = Math.max(7, h * 0.075);
        ctx.font = '500 ' + labelFontSize + 'px ' + theme.FONTS.display;
        ctx.fillStyle = t.textDim;
        var labelText = label.toUpperCase();
        var letterSpacing = 1.5;
        var labelY = valueY + labelFontSize + Math.max(4, h * 0.04);
        this._drawSpacedText(ctx, labelText, padX, labelY, letterSpacing);

        // Trend delta — bottom area
        if (trend !== null && !isNaN(trend)) {
            var trendFontSize = Math.max(9, h * 0.10);
            var trendY = h - padY;
            var trendPositive = trend >= 0;
            var arrow = trendPositive ? '▲' : '▼';
            var trendColor = trendPositive ? t.success : t.danger;
            var trendText = arrow + ' ' + Math.abs(trend).toFixed(1) + '%';

            ctx.font = '500 ' + trendFontSize + 'px ' + theme.FONTS.mono;
            ctx.fillStyle = trendColor;
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(trendText, padX, trendY);

            ctx.fillStyle = t.textMuted;
            ctx.font = '400 ' + trendFontSize + 'px ' + theme.FONTS.display;
            var trendW = ctx.measureText(trendText).width;
            ctx.fillText(' vs last week', padX + trendW, trendY);
        }

        // Accent line at bottom — Apple's signature thin accent
        var gi = accentIntensity / 50;
        if (gi > 0) {
            ctx.fillStyle = accentColor;
            ctx.globalAlpha = 0.6 * gi;
            ctx.fillRect(padX, h - 3, w - padX * 2, 2);
            ctx.globalAlpha = 1;
        }

        // Tooltip styling
        this._tooltip.style.background = t.card;
        this._tooltip.style.color = t.text;
        this._tooltip.style.fontFamily = theme.FONTS.display;
        this._tooltip.style.boxShadow = '0 2px 12px ' + t.shadow;

        this._hitZone = { x: 0, y: 0, w: w, h: h, label: label, value: displayValue, trend: trend };
    },

    _drawSpacedText: function(ctx, text, x, y, spacing) {
        var cx = x;
        for (var i = 0; i < text.length; i++) {
            ctx.fillText(text[i], cx, y);
            cx += ctx.measureText(text[i]).width + spacing;
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