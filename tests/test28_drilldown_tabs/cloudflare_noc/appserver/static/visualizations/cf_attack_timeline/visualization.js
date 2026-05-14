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
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;cursor:pointer;';
        this.el.appendChild(this._canvas);

        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 10px;' +
            'border-radius:4px;pointer-events:none;white-space:nowrap;z-index:100;font-size:11px;';
        this.el.appendChild(this._tooltip);

        this._lastGoodData = null;
        this._rows = [];
        this._hoverIdx = -1;
        this._scrollOffset = 0;

        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            self._hoverIdx = -1;
            self._tooltip.style.display = 'none';
            self.invalidateUpdateView();
        });
        this._canvas.addEventListener('click', function(e) {
            self._onClick(e);
        });
        this._canvas.addEventListener('wheel', function(e) {
            e.preventDefault();
            self._scrollOffset = Math.max(0, self._scrollOffset + e.deltaY);
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

        var timeField = opt('timeField', '_time');
        var attackField = opt('attackField', 'attack_type');
        var severityField = opt('severityField', 'severity');
        var targetField = opt('targetField', 'target');
        var attackIdField = opt('attackIdField', 'attack_id');
        this._attackIdField = attackIdField;
        var maxRows = parseInt(opt('maxRows', '20'), 10) || 20;
        var showBadge = opt('showBadge', 'true') === 'true';
        var accentColor = opt('accentColor', '#F6821F');

        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark'
                   : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');

        var w = this.el.clientWidth || this.el.offsetWidth || window.innerWidth || 500;
        var h = this.el.clientHeight || this.el.offsetHeight || window.innerHeight || 400;
        if (w < 10) w = window.innerWidth || 500;
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

        this._tooltip.style.background = t.panelHi;
        this._tooltip.style.color = t.text;
        this._tooltip.style.fontFamily = theme.FONTS.ui;

        var events = [];
        var limit = Math.min(data.rows.length, maxRows);
        for (var i = 0; i < limit; i++) {
            var row = data.rows[i];
            events.push({
                time: safeStr(row[data.colIdx[timeField]]),
                attack: safeStr(row[data.colIdx[attackField]]),
                severity: safeStr(row[data.colIdx[severityField]]),
                target: safeStr(row[data.colIdx[targetField]]),
                attackId: safeStr(row[data.colIdx[attackIdField]])
            });
        }

        var headerH = Math.max(28, h * 0.07);
        var rowH = Math.max(36, h * 0.08);
        var pad = Math.max(8, w * 0.02);

        ctx.font = '600 ' + Math.max(10, headerH * 0.45) + 'px ' + theme.FONTS.ui;
        ctx.fillStyle = accentColor;
        ctx.textAlign = 'left';
        ctx.fillText('ATTACK EVENTS', pad, headerH * 0.65);

        ctx.strokeStyle = theme.withAlpha(accentColor, 0.3);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad, headerH);
        ctx.lineTo(w - pad, headerH);
        ctx.stroke();

        var maxScroll = Math.max(0, events.length * rowH - (h - headerH));
        if (this._scrollOffset > maxScroll) this._scrollOffset = maxScroll;

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, headerH, w, h - headerH);
        ctx.clip();

        this._rows = [];
        var timeFontSize = Math.max(9, Math.min(11, rowH * 0.28));
        var mainFontSize = Math.max(10, Math.min(13, rowH * 0.32));
        var badgeH = Math.max(14, rowH * 0.38);
        var badgeR = 3;

        for (var e = 0; e < events.length; e++) {
            var ry = headerH + e * rowH - this._scrollOffset;
            if (ry + rowH < headerH || ry > h) continue;

            var ev = events[e];
            var isHover = this._hoverIdx === e;
            this._rows.push({ y: ry, h: rowH, idx: e });

            if (isHover) {
                ctx.fillStyle = theme.withAlpha(accentColor, 0.08);
                ctx.fillRect(0, ry, w, rowH);
            }

            ctx.strokeStyle = theme.withAlpha(t.edge, 0.3);
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(pad, ry + rowH);
            ctx.lineTo(w - pad, ry + rowH);
            ctx.stroke();

            var sevColor = theme.severityColor(t, ev.severity);

            var dotX = pad + 4;
            ctx.beginPath();
            ctx.arc(dotX, ry + rowH / 2, 3, 0, Math.PI * 2);
            ctx.fillStyle = sevColor;
            ctx.fill();

            var lineX = dotX;
            if (e < events.length - 1) {
                ctx.strokeStyle = theme.withAlpha(sevColor, 0.3);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(lineX, ry + rowH / 2 + 4);
                ctx.lineTo(lineX, ry + rowH);
                ctx.stroke();
            }

            var textStartX = pad + 16;

            ctx.globalAlpha = 1;
            ctx.font = timeFontSize + 'px ' + theme.FONTS.data;
            ctx.fillStyle = t.textFaint;
            ctx.textAlign = 'left';
            var timeStr = ev.time;
            if (timeStr.length > 19) timeStr = timeStr.substring(0, 19);
            ctx.fillText(timeStr, textStartX, ry + rowH * 0.38);

            ctx.font = '600 ' + mainFontSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = t.text;
            var attackText = ev.attack;
            var maxTextW = w - textStartX - pad - 100;
            while (ctx.measureText(attackText).width > maxTextW && attackText.length > 5) {
                attackText = attackText.slice(0, -1);
            }
            if (attackText !== ev.attack) attackText += '…';
            ctx.fillText(attackText, textStartX, ry + rowH * 0.72);

            if (showBadge && ev.severity) {
                var badgeText = ev.severity.toUpperCase();
                ctx.font = '700 ' + Math.max(8, badgeH * 0.6) + 'px ' + theme.FONTS.ui;
                var badgeW = ctx.measureText(badgeText).width + 12;
                var badgeX = w - pad - badgeW;
                var badgeY = ry + (rowH - badgeH) / 2;

                theme.roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeR);
                ctx.fillStyle = theme.withAlpha(sevColor, 0.2);
                ctx.fill();
                ctx.strokeStyle = sevColor;
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.fillStyle = sevColor;
                ctx.textAlign = 'center';
                ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH * 0.72);
            }

            ctx.font = timeFontSize + 'px ' + theme.FONTS.data;
            ctx.fillStyle = t.textDim;
            ctx.textAlign = 'right';
            var targetText = ev.target;
            var maxTargetW = 80;
            while (ctx.measureText(targetText).width > maxTargetW && targetText.length > 3) {
                targetText = targetText.slice(0, -1);
            }
            if (targetText !== ev.target) targetText += '…';
            ctx.fillText(targetText, w - pad - (showBadge ? 90 : 10), ry + rowH * 0.38);
        }

        ctx.restore();

        if (events.length * rowH > h - headerH) {
            var scrollbarH = h - headerH;
            var thumbH = Math.max(20, scrollbarH * (scrollbarH / (events.length * rowH)));
            var thumbY = headerH + (this._scrollOffset / maxScroll) * (scrollbarH - thumbH);
            ctx.fillStyle = theme.withAlpha(t.textFaint, 0.3);
            theme.roundRect(ctx, w - 4, thumbY, 3, thumbH, 1.5);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    },

    _onMouseMove: function(e) {
        var my = e.offsetY;
        var found = -1;
        for (var i = 0; i < this._rows.length; i++) {
            var r = this._rows[i];
            if (my >= r.y && my < r.y + r.h) {
                found = r.idx;
                break;
            }
        }
        if (found !== this._hoverIdx) {
            this._hoverIdx = found;
            this.invalidateUpdateView();
        }
        this._tooltip.style.display = 'none';
    },

    _onClick: function(e) {
        var my = e.offsetY;
        var idF = this._attackIdField || 'attack_id';
        for (var i = 0; i < this._rows.length; i++) {
            var r = this._rows[i];
            if (my >= r.y && my < r.y + r.h) {
                var row = this._lastGoodData.rows[r.idx];
                var attackId = safeStr(row[this._lastGoodData.colIdx[idF]]);
                try {
                    this.drilldown({
                        action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
                        data: { 'click.value': attackId, 'click.name': idF }
                    }, e);
                } catch (ex) {}
                break;
            }
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