define(["api/SplunkVisualizationBase","api/SplunkVisualizationUtils"], function(SplunkVisualizationBase, SplunkVisualizationUtils) {

// ── Inlined theme.js ──
var theme = (function() {
var FONTS = {
    data: '"SF Mono", "Menlo", monospace',
    ui: '"Helvetica Neue", "Arial", sans-serif'
};

function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

function withAlpha(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + clamp01(alpha) + ')';
}

function lerpColor(a, b, t) {
    t = clamp01(t);
    var ar = parseInt(a.slice(1, 3), 16);
    var ag = parseInt(a.slice(3, 5), 16);
    var ab = parseInt(a.slice(5, 7), 16);
    var br = parseInt(b.slice(1, 3), 16);
    var bg = parseInt(b.slice(3, 5), 16);
    var bb = parseInt(b.slice(5, 7), 16);
    var rr = Math.round(ar + (br - ar) * t);
    var rg = Math.round(ag + (bg - ag) * t);
    var rb = Math.round(ab + (bb - ab) * t);
    return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb).toString(16).slice(1);
}

var DARK = {
    name: 'dark',
    bg: '#05080F',
    panel: '#0A1628',
    panelHi: '#0F1F35',
    edge: 'rgba(0,180,255,0.08)',
    edgeStrong: 'rgba(0,180,255,0.20)',
    grid: 'rgba(0,180,255,0.04)',
    text: '#E8ECF4',
    textDim: '#7B8BA4',
    textFaint: '#3D4C63',
    s1: '#00B4FF',
    s2: '#00E5A0',
    s3: '#FF6B35',
    s4: '#C084FC',
    s5: '#FACC15',
    accent: '#00B4FF',
    success: '#00E5A0',
    warn: '#FACC15',
    danger: '#FF3B5C',
    invert: '#05080F'
};

var LIGHT = {
    name: 'light',
    bg: '#F0F2F7',
    panel: '#FFFFFF',
    panelHi: '#E8ECF4',
    edge: 'rgba(0,60,140,0.10)',
    edgeStrong: 'rgba(0,60,140,0.20)',
    grid: 'rgba(0,60,140,0.06)',
    text: '#0A1628',
    textDim: '#5A6A82',
    textFaint: '#94A3B8',
    s1: '#0066CC',
    s2: '#059669',
    s3: '#C2410C',
    s4: '#7C3AED',
    s5: '#B45309',
    accent: '#0066CC',
    success: '#059669',
    warn: '#B45309',
    danger: '#CC2244',
    invert: '#F0F2F7'
};

function getTheme(name) {
    return (name === 'light') ? LIGHT : DARK;
}

function severityColor(t, sev) {
    if (!sev) return t.textDim;
    var s = String(sev).toLowerCase();
    if (s === 'critical' || s === 'high' || s === 'danger') return t.danger;
    if (s === 'warning' || s === 'warn' || s === 'medium' || s === 'degraded') return t.warn;
    if (s === 'nominal' || s === 'ok' || s === 'low' || s === 'info' || s === 'success') return t.success;
    return t.textDim;
}

function fmtNum(v, opts) {
    if (v == null || isNaN(v)) return '—';
    var n = Number(v);
    var dec = (opts && opts.decimals != null) ? opts.decimals : 1;
    if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(dec) + 'B';
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(dec) + 'M';
    if (Math.abs(n) >= 1e4) return (n / 1e3).toFixed(dec) + 'K';
    return n.toFixed(dec);
}

function roundRect(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function drawPanel(ctx, t, x, y, w, h, opts) {
    var r = (opts && opts.radius != null) ? opts.radius : 3;
    var glow = (opts && opts.glow) ? opts.glow : null;
    ctx.save();
    if (glow) {
        ctx.shadowColor = glow;
        ctx.shadowBlur = 10;
    }
    roundRect(ctx, x, y, w, h, r);
    var grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, t.panel);
    grad.addColorStop(1, t.name === 'dark' ? '#060E1C' : '#F4F6FA');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = t.edge;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
}

function drawHGrid(ctx, t, x, y, w, h, rows) {
    ctx.save();
    ctx.strokeStyle = t.grid;
    ctx.lineWidth = 1;
    var step = h / (rows + 1);
    for (var i = 1; i <= rows; i++) {
        var yy = y + step * i;
        ctx.beginPath();
        ctx.moveTo(x, yy);
        ctx.lineTo(x + w, yy);
        ctx.stroke();
    }
    ctx.restore();
}

function parseColors(raw, fallback) {
    if (!raw) return fallback || [];
    return String(raw).split(',').map(function(c) { return c.trim(); });
}

function parseInts(raw, fallback) {
    if (!raw) return fallback || [];
    return String(raw).split(',').map(function(v) { return parseInt(v.trim(), 10) || 0; });
}

function getSpacing(w) {
    if (w < 300) return { pad: 8, gap: 4 };
    if (w < 600) return { pad: 12, gap: 8 };
    return { pad: 16, gap: 12 };
}

function getHoverAlpha(base, hovered) {
    return hovered ? Math.min(base + 0.1, 1) : base;
}

function getTypoScale(w, h) {
    var min = Math.min(w, h);
    if (min < 120) return { hero: 18, title: 12, body: 10, whisper: 8 };
    if (min < 200) return { hero: 28, title: 14, body: 11, whisper: 9 };
    if (min < 350) return { hero: 36, title: 16, body: 12, whisper: 10 };
    return { hero: 48, title: 18, body: 13, whisper: 11 };
}


    return { getTheme: getTheme,     withAlpha: withAlpha,     lerpColor: lerpColor,     severityColor: severityColor,     fmtNum: fmtNum,     roundRect: roundRect,     drawPanel: drawPanel,     drawHGrid: drawHGrid,     parseColors: parseColors,     parseInts: parseInts,     getSpacing: getSpacing,     getHoverAlpha: getHoverAlpha,     getTypoScale: getTypoScale,     FONTS: FONTS };
})();

// ── Viz source ──



function safeStr(val) { return (val != null && val !== '') ? String(val) : ''; }
function safeNum(val, fallback) { if (val == null || val === '') return fallback; var n = parseFloat(val); return isNaN(n) ? fallback : n; }
function hexFromSplunk(val, fallback) { if (val == null || val === '') return fallback; var s = String(val).trim(); if (s.charAt(0) === '#') return s; if (s.indexOf('0x') === 0) return '#' + s.slice(2); var n = parseInt(s, 10); if (!isNaN(n) && n >= 0) return '#' + ('000000' + n.toString(16)).slice(-6); return fallback; }
function detectTheme() {
    try { if (typeof SplunkVisualizationUtils !== 'undefined' && SplunkVisualizationUtils.getCurrentTheme) { var st = SplunkVisualizationUtils.getCurrentTheme(); if (st === 'light' || st === 'dark') return st; } } catch (e) {}
    var body = document.body; if (body) { var dt = body.getAttribute('data-theme'); if (dt === 'light' || dt === 'dark') return dt; if (body.classList.contains('dark')) return 'dark'; if (body.classList.contains('light')) return 'light'; }
    try { var bg = window.getComputedStyle(document.body).backgroundColor; var m = bg.match(/\d+/g); if (m && m.length >= 3) return (parseInt(m[0]) + parseInt(m[1]) + parseInt(m[2])) / 3 < 128 ? 'dark' : 'light'; } catch (e) {} return 'dark';
}
function getOption(config, ns, key, dv) { var v = config[ns + key]; if (v !== undefined && v !== null) return v; v = config[key]; if (v !== undefined && v !== null) return v; return dv; }
function easeOutBack(t) { var c1 = 1.70158; var c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
function prefersReducedMotion() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
function getSpeedMult(s) { return s === 'slow' ? 1.5 : s === 'fast' ? 0.6 : 1.0; }

return SplunkVisualizationBase.extend({
    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.style.position = 'relative'; this.el.style.overflow = 'hidden';
        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;';
        this.el.appendChild(this._canvas);
        this._lastGoodData = null;
        this._entranceDone = false; this._entranceProgress = 0; this._animating = false;
        this._haloPhase = 0; this._haloAnimating = false;
        this._hovered = false;
        var self = this;
        this._canvas.addEventListener('mousemove', function(e) { self._onMouseMove(e); });
        this._canvas.addEventListener('mouseleave', function() { self._hovered = false; self.invalidateUpdateView(); });
        this._canvas.addEventListener('click', function(e) { self._onClick(e); });
    },
    getInitialDataParams: function() { return { outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE, count: 10000 }; },
    formatData: function(data) {
        if (!data || !data.rows || data.rows.length === 0) { if (this._lastGoodData) return this._lastGoodData; return null; }
        var fields = data.fields, colIdx = {};
        for (var i = 0; i < fields.length; i++) colIdx[fields[i].name] = i;
        var result = { colIdx: colIdx, rows: data.rows }; this._lastGoodData = result; return result;
    },
    updateView: function(data, config) {
        if (!data) return;
        var ns = (function(viz) { try { var i = viz.getPropertyNamespaceInfo(); return i && i.propertyNamespace ? i.propertyNamespace : ''; } catch(e) { return ''; } })(this);
        function opt(key, fallback) { return getOption(config, ns, key, fallback); }

        var valueField = opt('valueField', 'value');
        var unitField = opt('unitField', 'unit');
        var labelField = opt('labelField', 'label');
        var decimals = parseInt(opt('decimals', '1'), 10);
        var warnThreshold = parseFloat(opt('warnThreshold', '70'));
        var criticalThreshold = parseFloat(opt('criticalThreshold', '30'));
        var orbSizeSetting = opt('orbSize', 'medium');
        var showUnit = opt('showUnit', 'true') === 'true';
        var showLabel = opt('showLabel', 'true') === 'true';
        var showHalo = opt('showHalo', 'true') === 'true';
        var flashCritical = opt('flashCritical', 'true') === 'true';
        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark' : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');
        var orbColor = hexFromSplunk(opt('orbColor', ''), t.accent);
        this._showHoverEffect = opt('showHoverEffect', 'true') === 'true';
        this._drilldownField = opt('drilldownField', 'label');

        if (prefersReducedMotion()) { this._entranceDone = true; this._entranceProgress = 1; }
        var showEntrance = opt('showEntrance', 'true') === 'true';
        if (!showEntrance) { this._entranceDone = true; this._entranceProgress = 1; }
        if (showEntrance && !this._entranceDone && !this._animating) { this._startEntrance(opt('animationSpeed', 'normal')); }

        var w = this.el.clientWidth || 300, h = this.el.clientHeight || 180;
        var dpr = window.devicePixelRatio || 1;
        this._canvas.width = w * dpr; this._canvas.height = h * dpr;
        this._canvas.style.width = w + 'px'; this._canvas.style.height = h + 'px';
        var ctx = this._canvas.getContext('2d'); if (!ctx) return;
        ctx.scale(dpr, dpr); ctx.clearRect(0, 0, w, h);

        var row = data.rows[data.rows.length - 1];
        var rawValue = safeNum(row[data.colIdx[valueField]], null);
        var unitStr = showUnit ? safeStr(row[data.colIdx[unitField]]) : '';
        var label = showLabel ? safeStr(row[data.colIdx[labelField]]) : '';
        var displayValue = rawValue !== null ? rawValue.toFixed(decimals) : '—';

        var ep = this._entranceDone ? 1 : easeOutBack(Math.min(this._entranceProgress, 1));

        var orbMult = orbSizeSetting === 'small' ? 0.22 : orbSizeSetting === 'large' ? 0.38 : 0.30;
        var orbRadius = Math.min(w, h) * orbMult * ep;
        var cx = w / 2, cy = h * 0.42;

        var isCritical = rawValue !== null && rawValue < criticalThreshold;
        var isWarn = rawValue !== null && rawValue < warnThreshold && !isCritical;
        var stateColor = isCritical ? t.danger : isWarn ? t.warn : orbColor;

        if (!this._haloAnimating && showHalo && flashCritical) { this._startHalo(); }
        var haloBlur = 8;
        if (isCritical && flashCritical && !prefersReducedMotion()) {
            haloBlur = 8 + 16 * (0.5 + 0.5 * Math.sin(this._haloPhase));
        }

        ctx.save();
        var orbGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbRadius);
        orbGrad.addColorStop(0, theme.withAlpha(stateColor, 0.6 * ep));
        orbGrad.addColorStop(0.6, theme.withAlpha(stateColor, 0.15 * ep));
        orbGrad.addColorStop(1, theme.withAlpha(stateColor, 0));
        ctx.fillStyle = orbGrad;
        ctx.beginPath(); ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, orbRadius * 0.85, 0, Math.PI * 2);
        ctx.strokeStyle = theme.withAlpha(stateColor, 0.3 * ep);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        if (showHalo && (isCritical || isWarn)) {
            ctx.save();
            ctx.beginPath(); ctx.arc(cx, cy, orbRadius + 6, 0, Math.PI * 2);
            ctx.strokeStyle = theme.withAlpha(stateColor, 0.4);
            ctx.lineWidth = 2;
            ctx.shadowColor = theme.withAlpha(stateColor, 0.6);
            ctx.shadowBlur = haloBlur;
            ctx.stroke();
            ctx.restore();
        }

        if (this._hovered && this._showHoverEffect) {
            ctx.save();
            ctx.beginPath(); ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2);
            ctx.fillStyle = theme.withAlpha(stateColor, 0.08);
            ctx.fill();
            ctx.restore();
        }

        var typo = theme.getTypoScale(w, h);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        if (label) {
            ctx.font = Math.max(9, typo.whisper) + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = t.textFaint;
            ctx.fillText(label.toUpperCase(), cx, cy - orbRadius * 0.45);
        }

        var animValue = rawValue !== null && !this._entranceDone ? rawValue * Math.min(ep, 1) : rawValue;
        var showVal = animValue !== null ? animValue.toFixed(decimals) : '—';
        var heroSize = Math.max(16, typo.hero * 0.9);
        ctx.font = 'bold ' + heroSize + 'px ' + theme.FONTS.data;
        ctx.fillStyle = t.text;
        if (isDark) {
            ctx.save();
            ctx.shadowColor = theme.withAlpha(stateColor, 0.5);
            ctx.shadowBlur = 14;
            ctx.fillText(showVal, cx, cy + 2);
            ctx.restore();
        }
        ctx.fillText(showVal, cx, cy + 2);

        if (unitStr) {
            ctx.font = Math.max(9, typo.body * 0.8) + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = t.textDim;
            ctx.fillText(unitStr, cx, cy + heroSize * 0.55 + 4);
        }

        this._hitCx = cx; this._hitCy = cy; this._hitR = orbRadius;
        this._lastData = data;
    },
    _startEntrance: function(speed) {
        if (this._animating) return;
        var duration = 500 * getSpeedMult(speed);
        var startTime = null, self = this;
        this._animating = true;
        function step(ts) {
            if (!self._animating) return;
            if (!startTime) startTime = ts;
            var p = Math.min((ts - startTime) / duration, 1);
            self._entranceProgress = p; self.invalidateUpdateView();
            if (p < 1) requestAnimationFrame(step);
            else { self._entranceDone = true; self._animating = false; }
        }
        requestAnimationFrame(step);
    },
    _startHalo: function() {
        var self = this;
        this._haloAnimating = true;
        function pulse(ts) {
            if (!self._haloAnimating) return;
            self._haloPhase = (ts / 800) % (Math.PI * 2);
            self.invalidateUpdateView();
            requestAnimationFrame(pulse);
        }
        requestAnimationFrame(pulse);
    },
    _onMouseMove: function(e) {
        if (!this._showHoverEffect) return;
        var dx = e.offsetX - (this._hitCx || 0), dy = e.offsetY - (this._hitCy || 0);
        var inside = Math.sqrt(dx * dx + dy * dy) <= (this._hitR || 0);
        if (inside !== this._hovered) {
            this._hovered = inside;
            this._canvas.style.cursor = inside ? 'pointer' : 'default';
            this.invalidateUpdateView();
        }
    },
    _onClick: function(e) {
        if (!this._lastData) return;
        var row = this._lastData.rows[this._lastData.rows.length - 1];
        var field = this._drilldownField || 'label';
        var idx = this._lastData.colIdx[field];
        var val = idx !== undefined ? safeStr(row[idx]) : '';
        try { this.drilldown({ action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN, data: { 'click.name': field, 'click.value': val } }, e); } catch (ex) {}
    },
    reflow: function() { this.invalidateUpdateView(); },
    destroy: function() { this._animating = false; this._haloAnimating = false; SplunkVisualizationBase.prototype.destroy.apply(this, arguments); }
});


});