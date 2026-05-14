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
        this._hitZones = [];

        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            self._tooltip.style.display = 'none';
            self._hoveredIdx = -1;
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

        var regionField = opt('regionField', 'region');
        var latencyField = opt('latencyField', 'latency');
        var thresholdField = opt('thresholdField', 'threshold');
        var maxLatencyOpt = safeNum(opt('maxLatency', ''), 0);
        var warnThreshold = safeNum(opt('warningThreshold', '60'), 60);
        var critThreshold = safeNum(opt('criticalThreshold', '80'), 80);
        var showValues = opt('showValues', 'true') === 'true';
        var barHeightOpt = safeNum(opt('barHeight', '0'), 0);
        var barColor = hexFromSplunk(opt('barColor', '0x0AC8B9')) || '#0AC8B9';
        var glowIntensity = safeNum(opt('glowIntensity', '50'), 50) / 100;

        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark'
                   : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');

        var w = this.el.clientWidth || this.el.offsetWidth || window.innerWidth || 300;
        var h = this.el.clientHeight || this.el.offsetHeight || window.innerHeight || 350;
        if (w < 10) w = window.innerWidth || 300;
        if (h < 10) h = window.innerHeight || 350;

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
        var maxVal = 0;

        for (var i = 0; i < rows.length; i++) {
            var region = ci[regionField] != null ? safeStr(rows[i][ci[regionField]]) : '';
            var latency = ci[latencyField] != null ? safeNum(rows[i][ci[latencyField]], 0) : 0;
            var thresh = ci[thresholdField] != null ? safeNum(rows[i][ci[thresholdField]], warnThreshold) : warnThreshold;
            items.push({ region: region, latency: latency, threshold: thresh });
            if (latency > maxVal) maxVal = latency;
        }

        var scaleMax = maxLatencyOpt > 0 ? maxLatencyOpt : Math.max(maxVal * 1.2, 10);
        var pad = Math.max(12, w * 0.03);
        var labelWidth = Math.max(40, w * 0.12);

        // Measure label widths dynamically
        var labelFontSize = Math.max(10, h * 0.035);
        ctx.font = '600 ' + labelFontSize + 'px ' + theme.FONTS.ui;
        var measuredLabelW = 0;
        for (var li = 0; li < items.length; li++) {
            var lm = ctx.measureText(items[li].region);
            if (lm.width > measuredLabelW) measuredLabelW = lm.width;
        }
        labelWidth = Math.max(labelWidth, measuredLabelW + 8);

        var barAreaX = pad + labelWidth + 8;
        var barAreaW = w - barAreaX - pad - (showValues ? 50 : 8);
        var totalBarH = h - pad * 2;
        var gap = Math.max(4, totalBarH * 0.03);
        var barH = barHeightOpt > 0 ? barHeightOpt
                 : Math.max(12, (totalBarH - gap * (items.length - 1)) / items.length);
        var totalUsedH = items.length * barH + (items.length - 1) * gap;
        var startY = pad + (totalBarH - totalUsedH) / 2;

        this._hitZones = [];

        for (var bi = 0; bi < items.length; bi++) {
            var item = items[bi];
            var by = startY + bi * (barH + gap);
            var barW = Math.max(2, (item.latency / scaleMax) * barAreaW);
            var ratio = item.latency / scaleMax;

            // Determine bar color based on thresholds
            var fillColor;
            if (item.latency >= critThreshold) {
                fillColor = t.danger;
            } else if (item.latency >= warnThreshold) {
                var warnRatio = (item.latency - warnThreshold) / (critThreshold - warnThreshold);
                fillColor = theme.lerpColor('#C89B3C', '#E84057', warnRatio);
            } else {
                fillColor = barColor;
            }

            // Bar track
            theme.roundRect(ctx, barAreaX, by, barAreaW, barH, 3);
            ctx.fillStyle = theme.withAlpha(t.edge, 0.3);
            ctx.fill();

            // Bar fill with gradient
            ctx.save();
            theme.roundRect(ctx, barAreaX, by, barW, barH, 3);
            ctx.clip();
            var barGrad = ctx.createLinearGradient(barAreaX, by, barAreaX + barW, by);
            barGrad.addColorStop(0, theme.withAlpha(fillColor, 0.6));
            barGrad.addColorStop(1, fillColor);
            ctx.fillStyle = barGrad;
            ctx.fillRect(barAreaX, by, barW, barH);

            // Glow effect on bars exceeding threshold
            if (item.latency >= warnThreshold && glowIntensity > 0) {
                ctx.shadowColor = fillColor;
                ctx.shadowBlur = 8 * glowIntensity;
                ctx.fillStyle = theme.withAlpha(fillColor, 0.3);
                ctx.fillRect(barAreaX, by, barW, barH);
                ctx.shadowBlur = 0;
            }
            ctx.restore();

            // Hover highlight
            if (this._hoveredIdx === bi) {
                theme.roundRect(ctx, barAreaX, by, barW, barH, 3);
                ctx.fillStyle = theme.withAlpha('#FFFFFF', 0.08);
                ctx.fill();
            }

            // Angular edge accent on bar end
            if (barW > 6) {
                ctx.strokeStyle = theme.withAlpha(fillColor, 0.9);
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                var edgeX = barAreaX + barW;
                ctx.moveTo(edgeX, by + 2);
                ctx.lineTo(edgeX, by + barH - 2);
                ctx.stroke();
            }

            // Region label
            ctx.globalAlpha = 1;
            ctx.font = '600 ' + labelFontSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = this._hoveredIdx === bi ? t.text : t.textDim;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.region, barAreaX - 8, by + barH / 2);

            // Value label at bar end
            if (showValues) {
                var valFontSize = Math.max(9, h * 0.03);
                ctx.font = '600 ' + valFontSize + 'px ' + theme.FONTS.ui;
                ctx.fillStyle = item.latency >= warnThreshold ? fillColor : t.textDim;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(Math.round(item.latency) + ' ms', barAreaX + barW + 8, by + barH / 2);
            }

            this._hitZones.push({
                x: barAreaX, y: by, w: barAreaW, h: barH,
                region: item.region, latency: item.latency
            });
        }

        // Threshold line (dashed vertical)
        var threshX = barAreaX + (warnThreshold / scaleMax) * barAreaW;
        if (threshX > barAreaX && threshX < barAreaX + barAreaW) {
            ctx.save();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = theme.withAlpha('#C89B3C', 0.5);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(threshX, startY - 4);
            ctx.lineTo(threshX, startY + totalUsedH + 4);
            ctx.stroke();
            ctx.setLineDash([]);

            // Threshold label
            var threshLabelSize = Math.max(8, h * 0.025);
            ctx.font = '400 ' + threshLabelSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = '#C89B3C';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(warnThreshold + 'ms SLA', threshX, startY - 6);
            ctx.restore();
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
            var zone = this._hitZones[hit];
            this._tooltip.innerHTML = '<strong>' + zone.region + '</strong>: ' + Math.round(zone.latency) + ' ms';
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