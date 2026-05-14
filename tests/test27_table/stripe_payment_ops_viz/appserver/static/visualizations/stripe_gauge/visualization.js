define(["api/SplunkVisualizationBase","api/SplunkVisualizationUtils"], function(SplunkVisualizationBase, SplunkVisualizationUtils) {

// ── Inlined theme.js ──
var theme = (function() {
/*
 * Stripe Payment Operations — design tokens.
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
    bg: '#0A2540',
    panel: '#132F4C',
    panelHi: '#1A3A5C',
    edge: '#1E4976',
    edgeStrong: '#2D6AA0',
    grid: 'rgba(255,255,255,0.06)',
    text: '#E8ECF0',
    textDim: '#8898AA',
    textFaint: '#5A6B7D',
    s1: '#635BFF',
    s2: '#80E9FF',
    s3: '#0048E5',
    s4: '#11CCE8',
    s5: '#9A6CFF',
    accent: '#635BFF',
    success: '#3ECF8E',
    warn: '#F5A623',
    danger: '#DF1B41',
    invert: '#F6F9FC'
};

var LIGHT = {
    name: 'light',
    bg: '#F6F9FC',
    panel: '#FFFFFF',
    panelHi: '#F0F3F7',
    edge: '#E3E8EE',
    edgeStrong: '#C1C9D2',
    grid: 'rgba(0,0,0,0.06)',
    text: '#0A2540',
    textDim: '#6B7C93',
    textFaint: '#A3ACB9',
    s1: '#635BFF',
    s2: '#0048E5',
    s3: '#11CCE8',
    s4: '#9A6CFF',
    s5: '#80E9FF',
    accent: '#635BFF',
    success: '#2DB87D',
    warn: '#D97917',
    danger: '#DF1B41',
    invert: '#0A2540'
};

function getTheme(name) {
    return (name === 'light') ? LIGHT : DARK;
}

var FONTS = {
    data: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    ui: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};

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
    roundRect(ctx, x, y, w, h, 6);
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

function hexFromSplunk(val) {
    if (val == null || val === '') return null;
    var s = String(val);
    if (s.indexOf('0x') === 0) return '#' + s.slice(2);
    if (s.charAt(0) === '#') return s;
    var n = parseInt(s, 10);
    if (!isNaN(n) && n >= 0) {
        var hex = n.toString(16);
        while (hex.length < 6) hex = '0' + hex;
        return '#' + hex;
    }
    return null;
}

return SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.classList.add('stripe-payment-ops-viz');
        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;';
        this.el.appendChild(this._canvas);

        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 10px;' +
            'border-radius:4px;pointer-events:none;white-space:nowrap;z-index:100;font-size:12px;';
        this.el.appendChild(this._tooltip);

        this._lastGoodData = null;

        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            self._tooltip.style.display = 'none';
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

        var valueField = opt('valueField', 'value');
        var maxField = opt('maxField', 'max');
        var labelField = opt('labelField', 'label');
        var warnThresh = safeNum(opt('warningThreshold', '70'), 70);
        var critThresh = safeNum(opt('criticalThreshold', '90'), 90);
        var unit = opt('unit', '');
        var showGlow = opt('showGlow', 'true') === 'true';
        var gaugeHex = hexFromSplunk(opt('gaugeColor', '0x635BFF')) || '#635BFF';
        var gradEndHex = hexFromSplunk(opt('gradientEnd', '0x9A6CFF')) || '#9A6CFF';

        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark'
                   : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');

        var w = this.el.clientWidth || this.el.offsetWidth || window.innerWidth || 300;
        var h = this.el.clientHeight || this.el.offsetHeight || window.innerHeight || 250;
        if (w < 10) w = window.innerWidth || 300;
        if (h < 10) h = window.innerHeight || 250;

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

        var row = data.rows[data.rows.length - 1];
        var ci = data.colIdx;

        var value = ci[valueField] != null ? safeNum(row[ci[valueField]], 0) : 0;
        var maxVal = ci[maxField] != null ? safeNum(row[ci[maxField]], 100) : 100;
        var label = ci[labelField] != null ? safeStr(row[ci[labelField]]) : '';

        if (maxVal <= 0) maxVal = 100;
        var pct = Math.min(1, Math.max(0, value / maxVal));
        var pctDisplay = Math.round(pct * 100);

        var pad = Math.max(16, Math.min(w, h) * 0.08);
        var dim = Math.min(w, h);
        var arcW = Math.max(8, dim * 0.065);
        var radius = (dim / 2) - pad - arcW / 2;
        var cx = w / 2;
        var cy = h * 0.46;

        if (cy - radius < pad) {
            radius = cy - pad;
        }
        if (radius < 20) radius = 20;

        var startAngle = 0.75 * Math.PI;
        var endAngle = 2.25 * Math.PI;
        var sweepAngle = endAngle - startAngle;
        var valueAngle = startAngle + sweepAngle * pct;

        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, endAngle, false);
        ctx.strokeStyle = isDark ? theme.withAlpha('#FFFFFF', 0.08) : theme.withAlpha('#000000', 0.06);
        ctx.lineWidth = arcW;
        ctx.lineCap = 'round';
        ctx.stroke();

        var arcColor = gaugeHex;
        if (pctDisplay >= critThresh) {
            arcColor = t.danger;
        } else if (pctDisplay >= warnThresh) {
            arcColor = t.warn;
        }

        if (showGlow && isDark) {
            ctx.save();
            ctx.shadowColor = theme.withAlpha(arcColor, 0.4);
            ctx.shadowBlur = 16;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, startAngle, valueAngle, false);
            ctx.strokeStyle = arcColor;
            ctx.lineWidth = arcW;
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.restore();
            ctx.shadowBlur = 0;
        }

        var segments = 60;
        var segAngle = (valueAngle - startAngle) / segments;
        for (var s = 0; s < segments; s++) {
            var sStart = startAngle + s * segAngle;
            var sEnd = sStart + segAngle + 0.005;
            var segT = s / segments;

            var segColor;
            if (pctDisplay >= critThresh) {
                segColor = theme.lerpColor(t.warn, t.danger, segT);
            } else if (pctDisplay >= warnThresh) {
                segColor = theme.lerpColor(gaugeHex, t.warn, segT);
            } else {
                segColor = theme.lerpColor(gaugeHex, gradEndHex, segT);
            }

            ctx.beginPath();
            ctx.arc(cx, cy, radius, sStart, sEnd, false);
            ctx.strokeStyle = segColor;
            ctx.lineWidth = arcW;
            ctx.lineCap = s === 0 || s === segments - 1 ? 'round' : 'butt';
            ctx.stroke();
        }

        var valueFontSize = Math.max(20, dim * 0.18);
        ctx.font = '600 ' + valueFontSize + 'px ' + theme.FONTS.data;
        ctx.fillStyle = t.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        var valueText = String(Math.round(value));
        if (unit) valueText = valueText + unit;
        var measuredVal = ctx.measureText(valueText);
        if (measuredVal.width > radius * 1.6) {
            valueFontSize = valueFontSize * (radius * 1.6 / measuredVal.width);
            ctx.font = '600 ' + valueFontSize + 'px ' + theme.FONTS.data;
        }
        ctx.fillText(valueText, cx, cy - valueFontSize * 0.1);

        var subFontSize = Math.max(10, dim * 0.055);
        ctx.font = '500 ' + subFontSize + 'px ' + theme.FONTS.ui;
        ctx.fillStyle = t.textDim;
        ctx.fillText('of ' + Math.round(maxVal), cx, cy + valueFontSize * 0.5);

        if (label) {
            var labelFontSize = Math.max(10, dim * 0.06);
            ctx.font = '500 ' + labelFontSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = t.textDim;
            var labelY = cy + radius + arcW / 2 + labelFontSize + 4;
            if (labelY > h - 4) labelY = h - 4;
            ctx.fillText(label, cx, labelY);
        }

        var pctBadgeFontSize = Math.max(9, dim * 0.042);
        ctx.font = '600 ' + pctBadgeFontSize + 'px ' + theme.FONTS.data;
        var pctText = pctDisplay + '%';
        var pctW = ctx.measureText(pctText).width + 12;
        var pctH = pctBadgeFontSize + 8;
        var pctX = cx - pctW / 2;
        var pctY = cy + valueFontSize * 0.5 + subFontSize + 4;

        theme.roundRect(ctx, pctX, pctY, pctW, pctH, pctH / 2);
        ctx.fillStyle = theme.withAlpha(arcColor, isDark ? 0.15 : 0.1);
        ctx.fill();
        ctx.fillStyle = arcColor;
        ctx.textBaseline = 'middle';
        ctx.fillText(pctText, cx, pctY + pctH / 2);

        this._gaugeData = { value: value, max: maxVal, pct: pctDisplay, label: label, cx: cx, cy: cy, radius: radius };
    },

    _onMouseMove: function(e) {
        if (!this._gaugeData) return;
        var mx = e.offsetX;
        var my = e.offsetY;
        var g = this._gaugeData;
        var dist = Math.sqrt((mx - g.cx) * (mx - g.cx) + (my - g.cy) * (my - g.cy));

        if (dist < g.radius * 1.3) {
            this._tooltip.innerHTML = '<strong>' + g.label + '</strong><br>' +
                Math.round(g.value) + ' / ' + Math.round(g.max) + ' (' + g.pct + '%)';
            this._tooltip.style.display = 'block';
            this._tooltip.style.left = (mx + 12) + 'px';
            this._tooltip.style.top = (my - 20) + 'px';
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