define(["api/SplunkVisualizationBase","api/SplunkVisualizationUtils"], function(SplunkVisualizationBase, SplunkVisualizationUtils) {

// ── Inlined theme.js ──
var theme = (function() {
/*
 * Nike Gauge — design tokens.
 * ES5 only.
 */

function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16)
    };
}

function withAlpha(hex, alpha) {
    var c = hexToRgb(hex);
    return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + clamp01(alpha) + ')';
}

function lerpColor(a, b, t) {
    t = clamp01(t);
    var ca = hexToRgb(a);
    var cb = hexToRgb(b);
    var r = Math.round(ca.r + (cb.r - ca.r) * t);
    var g = Math.round(ca.g + (cb.g - ca.g) * t);
    var bl = Math.round(ca.b + (cb.b - ca.b) * t);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
}

var DARK = {
    name: 'dark',
    bg: '#0A0A0A',
    panel: '#111111',
    panelHi: '#1A1A1A',
    edge: 'rgba(255,255,255,0.06)',
    edgeStrong: 'rgba(255,255,255,0.12)',
    grid: 'rgba(255,255,255,0.05)',
    text: '#F0F0F0',
    textDim: '#999999',
    textFaint: '#555555',
    accent: '#CDFF00',
    success: '#00E676',
    warn: '#FFAB00',
    danger: '#FF3D00',
    track: '#1F1F1F',
    trackHi: '#2A2A2A'
};

var LIGHT = {
    name: 'light',
    bg: '#F5F5F5',
    panel: '#FFFFFF',
    panelHi: '#F0F0F0',
    edge: 'rgba(0,0,0,0.08)',
    edgeStrong: 'rgba(0,0,0,0.15)',
    grid: 'rgba(0,0,0,0.06)',
    text: '#111111',
    textDim: '#666666',
    textFaint: '#AAAAAA',
    accent: '#9EBF00',
    success: '#00A651',
    warn: '#E08A00',
    danger: '#D32F2F',
    track: '#E0E0E0',
    trackHi: '#D0D0D0'
};

function getTheme(name) {
    return (name === 'light') ? LIGHT : DARK;
}

var FONTS = {
    data: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    ui: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
};

function fmtNum(v, opts) {
    if (v == null || isNaN(v)) return '—';
    var abs = Math.abs(v);
    if (abs >= 1e9) return (v / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3) return (v / 1e3).toFixed(1) + 'k';
    if (abs < 10 && abs !== Math.floor(abs)) return v.toFixed(1);
    return String(Math.round(v));
}


    return { getTheme:getTheme, withAlpha:withAlpha, lerpColor:lerpColor,
        hexToRgb:hexToRgb, fmtNum:fmtNum, FONTS:FONTS };
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
            return (parseInt(m[0]) + parseInt(m[1]) + parseInt(m[2])) / 3 < 128
                   ? 'dark' : 'light';
        }
    } catch (e) {}
    return 'dark';
}

return SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;';
        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';
        this.el.appendChild(this._canvas);

        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:8px 14px;' +
            'border-radius:6px;pointer-events:none;white-space:nowrap;z-index:100;';
        this.el.appendChild(this._tooltip);

        this._lastGoodData = null;
        this._arcHit = null;

        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            self._tooltip.style.display = 'none';
            self._canvas.style.cursor = 'default';
        });
    },

    getInitialDataParams: function() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 50
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
        this._render(data, config);
    },

    _render: function(data, config) {
        var el = this.el;
        var w = el.clientWidth || el.offsetWidth || window.innerWidth || 300;
        var h = el.clientHeight || el.offsetHeight || window.innerHeight || 200;
        if (w < 10) w = window.innerWidth || 300;
        if (h < 10) h = window.innerHeight || 200;

        var dpr = window.devicePixelRatio || 1;
        this._canvas.width = w * dpr;
        this._canvas.height = h * dpr;
        this._canvas.style.width = w + 'px';
        this._canvas.style.height = h + 'px';
        var ctx = this._canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        var ns = '';
        try {
            var info = this.getPropertyNamespaceInfo();
            if (info && info.propertyNamespace) ns = info.propertyNamespace;
        } catch (e) {}

        function opt(key, fallback) {
            var v = config[ns + key];
            if (v != null && v !== '') return v;
            v = config[key];
            if (v != null && v !== '') return v;
            return fallback;
        }

        var valueField  = opt('valueField', 'value');
        var targetField = opt('targetField', 'target');
        var labelField  = opt('labelField', 'label');
        var maxValue    = safeNum(opt('maxValue', '100'), 100);
        var showTarget  = opt('showTarget', 'true') !== 'false';
        var accentColor = opt('accentColor', '#CDFF00');
        var accentIntensity = safeNum(opt('accentIntensity', '50'), 50);
        var gi = accentIntensity / 50;

        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark'
                   : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');

        this._tooltip.style.background = t.panelHi;
        this._tooltip.style.color = t.text;
        this._tooltip.style.fontFamily = theme.FONTS.ui;
        this._tooltip.style.fontSize = '12px';
        this._tooltip.style.border = '1px solid ' + t.edgeStrong;

        var colIdx = data.colIdx;
        var row = data.rows[data.rows.length - 1];
        var value  = safeNum(row[colIdx[valueField]], 0);
        var target = safeNum(row[colIdx[targetField]], 0);
        var label  = safeStr(row[colIdx[labelField]]);

        if (maxValue <= 0) maxValue = 100;
        var pct = Math.min(value / maxValue, 1);
        var targetPct = Math.min(target / maxValue, 1);
        var meetsTarget = value >= target;

        var arcColor = meetsTarget ? t.success : t.warn;
        var glowColor = meetsTarget ? t.success : t.warn;

        // --- Arc geometry ---
        var pad = Math.max(16, Math.min(w, h) * 0.08);
        var arcThick = Math.max(8, Math.min(w, h) * 0.07);
        var maxR_w = (w - pad * 2) / 2;
        var maxR_h = (h - pad) * 0.48;
        var radius = Math.min(maxR_w, maxR_h);
        var cx = w / 2;
        var cy = pad + radius + arcThick / 2;

        var startAngle = 0.75 * Math.PI;
        var endAngle = 2.25 * Math.PI;
        var sweepRange = endAngle - startAngle;
        var valueAngle = startAngle + sweepRange * pct;
        var targetAngle = startAngle + sweepRange * targetPct;

        // --- Track arc (background) ---
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, endAngle, false);
        ctx.strokeStyle = t.track;
        ctx.lineWidth = arcThick;
        ctx.lineCap = 'round';
        ctx.stroke();

        // --- Glow behind value arc ---
        if (gi > 0) {
            ctx.save();
            ctx.shadowBlur = Math.max(8, 20 * gi);
            ctx.shadowColor = theme.withAlpha(glowColor, 0.4 * gi);
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, startAngle, valueAngle, false);
            ctx.strokeStyle = 'transparent';
            ctx.lineWidth = arcThick;
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.restore();
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        // --- Value arc ---
        if (pct > 0.001) {
            ctx.beginPath();
            ctx.arc(cx, cy, radius, startAngle, valueAngle, false);
            ctx.strokeStyle = arcColor;
            ctx.lineWidth = arcThick;
            ctx.lineCap = 'round';
            ctx.stroke();
        }

        // --- Accent edge (thin bright line on outer rim of value arc) ---
        if (pct > 0.001) {
            ctx.beginPath();
            ctx.arc(cx, cy, radius + arcThick * 0.38, startAngle, valueAngle, false);
            ctx.strokeStyle = theme.withAlpha(accentColor, 0.6 * gi);
            ctx.lineWidth = Math.max(1, arcThick * 0.06);
            ctx.lineCap = 'round';
            ctx.stroke();
        }

        // --- Target marker ---
        if (showTarget && targetPct > 0 && targetPct <= 1) {
            var tmx = cx + radius * Math.cos(targetAngle);
            var tmy = cy + radius * Math.sin(targetAngle);
            var markerR = Math.max(3, arcThick * 0.28);

            ctx.beginPath();
            ctx.arc(tmx, tmy, markerR + 2, 0, Math.PI * 2);
            ctx.fillStyle = t.bg;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(tmx, tmy, markerR, 0, Math.PI * 2);
            ctx.fillStyle = accentColor;
            ctx.fill();
        }

        // --- Tick marks at 0% and 100% ---
        var tickLen = Math.max(4, arcThick * 0.35);
        var tickW = Math.max(1, arcThick * 0.08);
        var tickFont = Math.max(8, radius * 0.09);
        var tickAngles = [startAngle, endAngle];
        var tickLabels = ['0', String(Math.round(maxValue))];
        for (var ti = 0; ti < tickAngles.length; ti++) {
            var ta = tickAngles[ti];
            var outerR = radius + arcThick / 2 + tickLen + 2;
            var tx = cx + outerR * Math.cos(ta);
            var ty = cy + outerR * Math.sin(ta);
            ctx.fillStyle = t.textFaint;
            ctx.font = '400 ' + tickFont + 'px ' + theme.FONTS.data;
            ctx.textAlign = ti === 0 ? 'right' : 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(tickLabels[ti], tx, ty);
        }

        // --- Center value ---
        var valueFontSize = Math.max(18, radius * 0.45);
        var rawStr = String(Math.round(value));
        ctx.fillStyle = t.text;
        ctx.font = '800 ' + valueFontSize + 'px ' + theme.FONTS.data;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        var valueBL = cy + valueFontSize * 0.15;
        ctx.fillText(rawStr, cx, valueBL);

        // --- Percentage subtext ---
        var pctFontSize = Math.max(10, radius * 0.14);
        var pctStr = Math.round(pct * 100) + '%';
        ctx.fillStyle = t.textDim;
        ctx.font = '600 ' + pctFontSize + 'px ' + theme.FONTS.data;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(pctStr, cx, valueBL + pctFontSize * 0.4);

        // --- Target readout under percentage ---
        if (showTarget) {
            var targetFontSize = Math.max(8, radius * 0.10);
            var targetStr = 'Target: ' + Math.round(target);
            ctx.fillStyle = t.textFaint;
            ctx.font = '400 ' + targetFontSize + 'px ' + theme.FONTS.ui;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(targetStr, cx, valueBL + pctFontSize * 0.4 + pctFontSize + 4);
        }

        // --- Label below arc ---
        if (label) {
            var labelFontSize = Math.max(10, Math.min(w, h) * 0.06);
            ctx.fillStyle = t.textDim;
            ctx.font = '600 ' + labelFontSize + 'px ' + theme.FONTS.ui;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            var labelY = cy + radius + arcThick / 2 + Math.max(10, h * 0.04);
            ctx.fillText(label.toUpperCase(), cx, labelY);
        }

        // --- Status indicator ---
        var statusFontSize = Math.max(8, radius * 0.09);
        var statusLabel = meetsTarget ? 'ON TARGET' : 'BELOW TARGET';
        var statusColor = meetsTarget ? t.success : t.warn;
        var dotR = Math.max(3, statusFontSize * 0.3);
        var statusY = h - pad * 0.6;

        ctx.fillStyle = statusColor;
        ctx.beginPath();
        ctx.arc(cx - ctx.measureText(statusLabel).width * 0.3, statusY, dotR, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '700 ' + statusFontSize + 'px ' + theme.FONTS.ui;
        ctx.textAlign = 'center';
        ctx.fillText(statusLabel, cx + dotR + 2, statusY + statusFontSize * 0.35);

        // --- Store hit region for tooltip ---
        this._arcHit = {
            cx: cx, cy: cy, radius: radius, arcThick: arcThick,
            value: value, target: target, label: label, pct: pct,
            meetsTarget: meetsTarget, maxValue: maxValue
        };
    },

    _onMouseMove: function(e) {
        var mx = e.offsetX || 0;
        var my = e.offsetY || 0;

        if (!this._arcHit) return;
        var h = this._arcHit;
        var dx = mx - h.cx;
        var dy = my - h.cy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var inArc = dist >= h.radius - h.arcThick && dist <= h.radius + h.arcThick;

        if (inArc) {
            var statusText = h.meetsTarget ? 'On target' : 'Below target';
            this._tooltip.innerHTML =
                '<strong>' + (h.label || 'Value') + '</strong><br>' +
                'Value: ' + Math.round(h.value) + ' / ' + Math.round(h.maxValue) +
                ' (' + Math.round(h.pct * 100) + '%)<br>' +
                'Target: ' + Math.round(h.target) + '<br>' +
                '<span style="color:' + (h.meetsTarget ? '#00E676' : '#FFAB00') + '">' +
                statusText + '</span>';
            this._tooltip.style.display = 'block';
            var tx = mx + 14;
            var ty = my - 10;
            var elW = this.el.clientWidth || 300;
            if (tx + 200 > elW) tx = mx - 200;
            if (ty < 0) ty = my + 20;
            this._tooltip.style.left = tx + 'px';
            this._tooltip.style.top = ty + 'px';
            this._canvas.style.cursor = 'pointer';
        } else {
            this._tooltip.style.display = 'none';
            this._canvas.style.cursor = 'default';
        }
    },

    reflow: function() {
        this.invalidateUpdateView();
    },

    destroy: function() {
        if (this._tooltip && this._tooltip.parentNode) {
            this._tooltip.parentNode.removeChild(this._tooltip);
        }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }
});


});