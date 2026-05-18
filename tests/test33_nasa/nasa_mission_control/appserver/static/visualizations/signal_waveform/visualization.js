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
function prefersReducedMotion() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
function getSpeedMult(s) { return s === 'slow' ? 0.5 : s === 'fast' ? 2.0 : 1.0; }

return SplunkVisualizationBase.extend({
    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.style.position = 'relative'; this.el.style.overflow = 'hidden';
        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;';
        this.el.appendChild(this._canvas);
        this._lastGoodData = null;
        this._buffer = [];
        this._maxBuffer = 800;
        this._scrollOffset = 0;
        this._entranceDone = false; this._entranceProgress = 0;
        this._looping = false;
        this._hovered = false; this._mouseX = 0; this._mouseY = 0;
        this._pulsePhase = 0;
        var self = this;
        this._canvas.addEventListener('mousemove', function(e) { self._mouseX = e.offsetX; self._mouseY = e.offsetY; self._hovered = true; });
        this._canvas.addEventListener('mouseleave', function() { self._hovered = false; });
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

        var amplitudeField = opt('amplitudeField', 'amplitude');
        var frequencyField = opt('frequencyField', 'frequency');
        var animationSpeed = opt('animationSpeed', 'normal');
        var noiseFloor = parseFloat(opt('noiseFloor', '-100'));
        var traceWidth = parseInt(opt('traceWidth', '2'), 10);
        var showGrid = opt('showGrid', 'true') === 'true';
        var gridOpacity = parseInt(opt('gridOpacity', '20'), 10) / 100;
        var scrollSpeed = opt('scrollSpeed', 'normal');
        var flashCritical = opt('flashCritical', 'true') === 'true';
        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark' : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');
        var traceColor = hexFromSplunk(opt('traceColor', ''), t.s2);
        this._showHoverEffect = opt('showHoverEffect', 'true') === 'true';
        this._drilldownField = opt('drilldownField', 'amplitude');

        if (prefersReducedMotion()) { this._entranceDone = true; this._entranceProgress = 1; }
        var showEntrance = opt('showEntrance', 'true') === 'true';
        if (!showEntrance) { this._entranceDone = true; this._entranceProgress = 1; }

        var ampIdx = data.colIdx[amplitudeField];
        for (var r = 0; r < data.rows.length; r++) {
            var amp = safeNum(data.rows[r][ampIdx != null ? ampIdx : 0], -80);
            this._buffer.push(amp);
        }
        while (this._buffer.length > this._maxBuffer) this._buffer.shift();

        this._config = {
            t: t, isDark: isDark, traceColor: traceColor, traceWidth: traceWidth,
            noiseFloor: noiseFloor, showGrid: showGrid, gridOpacity: gridOpacity,
            scrollSpeed: getSpeedMult(scrollSpeed), flashCritical: flashCritical,
            showEntrance: showEntrance
        };

        if (!this._looping) { this._startLoop(); }
    },
    _startLoop: function() {
        var self = this;
        this._looping = true;
        var lastTs = 0;
        function frame(ts) {
            if (!self._looping) return;
            var dt = lastTs ? (ts - lastTs) / 16.67 : 1;
            lastTs = ts;
            self._scrollOffset += self._config.scrollSpeed * dt * 0.8;
            if (!self._entranceDone) {
                self._entranceProgress += 0.015 * dt;
                if (self._entranceProgress >= 1) { self._entranceDone = true; self._entranceProgress = 1; }
            }
            self._pulsePhase += 0.05 * dt;
            self._renderFrame();
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    },
    _renderFrame: function() {
        var w = this.el.clientWidth || 600, h = this.el.clientHeight || 300;
        var dpr = window.devicePixelRatio || 1;
        if (this._canvas.width !== w * dpr || this._canvas.height !== h * dpr) {
            this._canvas.width = w * dpr; this._canvas.height = h * dpr;
            this._canvas.style.width = w + 'px'; this._canvas.style.height = h + 'px';
        }
        var ctx = this._canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);

        var cfg = this._config;
        if (!cfg) return;
        var t = cfg.t;
        var pad = { left: 50, right: 16, top: 16, bottom: 28 };
        var plotW = w - pad.left - pad.right;
        var plotH = h - pad.top - pad.bottom;

        var minDb = -130, maxDb = -20;
        function dbToY(db) { return pad.top + plotH * (1 - (db - minDb) / (maxDb - minDb)); }

        if (cfg.showGrid) {
            ctx.save();
            ctx.strokeStyle = theme.withAlpha(t.accent, cfg.gridOpacity * 0.4);
            ctx.lineWidth = 0.5;
            for (var gx = 0; gx < 6; gx++) {
                var xp = pad.left + (plotW / 5) * gx;
                ctx.beginPath(); ctx.moveTo(xp, pad.top); ctx.lineTo(xp, pad.top + plotH); ctx.stroke();
            }
            for (var gy = 0; gy < 6; gy++) {
                var yp = pad.top + (plotH / 5) * gy;
                ctx.beginPath(); ctx.moveTo(pad.left, yp); ctx.lineTo(pad.left + plotW, yp); ctx.stroke();
            }
            ctx.restore();
        }

        ctx.save();
        ctx.font = '10px ' + theme.FONTS.data;
        ctx.fillStyle = t.textFaint;
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        for (var li = -120; li <= -20; li += 20) {
            ctx.fillText(li + ' dBm', pad.left - 6, dbToY(li));
        }
        ctx.restore();

        var nfY = dbToY(cfg.noiseFloor);
        ctx.save();
        ctx.strokeStyle = theme.withAlpha(t.danger, 0.5);
        ctx.lineWidth = 1; ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.moveTo(pad.left, nfY); ctx.lineTo(pad.left + plotW, nfY); ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = '9px ' + theme.FONTS.ui;
        ctx.fillStyle = theme.withAlpha(t.danger, 0.7);
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText('NOISE FLOOR', pad.left + 4, nfY - 3);
        ctx.restore();

        var buf = this._buffer;
        if (buf.length < 2) return;
        var ep = this._entranceDone ? 1 : this._entranceProgress;
        var visibleCount = Math.min(buf.length, Math.floor(plotW));
        var startIdx = Math.max(0, buf.length - visibleCount);

        var belowNoise = false;
        ctx.save();
        ctx.beginPath();
        for (var i = startIdx; i < buf.length; i++) {
            var px = pad.left + ((i - startIdx) / Math.max(visibleCount - 1, 1)) * plotW;
            var py = dbToY(buf[i]);
            py = pad.top + plotH - (pad.top + plotH - py) * ep;
            if (i === startIdx) ctx.moveTo(px, py);
            else {
                var prevX = pad.left + ((i - 1 - startIdx) / Math.max(visibleCount - 1, 1)) * plotW;
                var cpx = (prevX + px) / 2;
                ctx.quadraticCurveTo(cpx, dbToY(buf[i - 1]) * ep + pad.top + plotH * (1 - ep), cpx, py);
            }
            if (buf[i] < cfg.noiseFloor) belowNoise = true;
        }
        ctx.strokeStyle = cfg.traceColor;
        ctx.lineWidth = cfg.traceWidth;
        ctx.shadowColor = theme.withAlpha(cfg.traceColor, 0.6);
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();

        if (belowNoise && cfg.flashCritical && !prefersReducedMotion()) {
            var pa = 0.3 + 0.3 * Math.sin(this._pulsePhase);
            ctx.save();
            ctx.fillStyle = theme.withAlpha(t.danger, pa * 0.08);
            ctx.fillRect(pad.left, nfY, plotW, pad.top + plotH - nfY);
            ctx.restore();
        }

        if (this._hovered && this._showHoverEffect) {
            var mx = this._mouseX;
            if (mx >= pad.left && mx <= pad.left + plotW) {
                ctx.save();
                ctx.strokeStyle = theme.withAlpha(t.text, 0.3);
                ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
                ctx.beginPath(); ctx.moveTo(mx, pad.top); ctx.lineTo(mx, pad.top + plotH); ctx.stroke();
                ctx.setLineDash([]);
                var sampleIdx = startIdx + Math.round(((mx - pad.left) / plotW) * (visibleCount - 1));
                if (sampleIdx >= 0 && sampleIdx < buf.length) {
                    var sv = buf[sampleIdx];
                    var sy = dbToY(sv);
                    ctx.beginPath(); ctx.arc(mx, sy, 4, 0, Math.PI * 2);
                    ctx.fillStyle = cfg.traceColor; ctx.fill();
                    ctx.font = '11px ' + theme.FONTS.data;
                    ctx.fillStyle = t.text; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
                    ctx.fillText(sv.toFixed(1) + ' dBm', mx + 8, sy - 6);
                }
                ctx.restore();
            }
        }
    },
    _onClick: function(e) {
        if (!this._lastGoodData) return;
        var field = this._drilldownField || 'amplitude';
        var row = this._lastGoodData.rows[this._lastGoodData.rows.length - 1];
        var idx = this._lastGoodData.colIdx[field];
        var val = idx !== undefined ? safeStr(row[idx]) : '';
        try { this.drilldown({ action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN, data: { 'click.name': field, 'click.value': val } }, e); } catch (ex) {}
    },
    reflow: function() {},
    destroy: function() { this._looping = false; SplunkVisualizationBase.prototype.destroy.apply(this, arguments); }
});


});