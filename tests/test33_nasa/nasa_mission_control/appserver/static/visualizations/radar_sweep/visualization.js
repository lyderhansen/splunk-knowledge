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

return SplunkVisualizationBase.extend({
    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.style.position = 'relative'; this.el.style.overflow = 'hidden';
        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;';
        this.el.appendChild(this._canvas);
        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText = 'position:absolute;display:none;padding:6px 10px;border-radius:4px;pointer-events:none;white-space:nowrap;z-index:100;';
        this.el.appendChild(this._tooltip);
        this._lastGoodData = null;
        this._sweepAngle = 0;
        this._looping = false;
        this._visible = true;
        this._dataPoints = [];
        this._hoveredIdx = -1;
        this._mouseX = 0; this._mouseY = 0;
        this._entranceDone = false; this._entranceProgress = 0;
        var self = this;
        if (typeof IntersectionObserver !== 'undefined') {
            this._observer = new IntersectionObserver(function(entries) {
                self._visible = entries[0].isIntersecting;
            }, { threshold: 0.1 });
            this._observer.observe(this.el);
        }
        this._canvas.addEventListener('mousemove', function(e) { self._mouseX = e.offsetX; self._mouseY = e.offsetY; self._findNearest(); });
        this._canvas.addEventListener('mouseleave', function() { self._hoveredIdx = -1; self._tooltip.style.display = 'none'; });
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

        var nameField = opt('nameField', 'station_name');
        var azimuthField = opt('azimuthField', 'azimuth_deg');
        var rangeField = opt('rangeField', 'range_km');
        var typeField = opt('typeField', 'station_type');
        var sweepSpeed = opt('sweepSpeed', 'normal');
        var animationSpeed = opt('animationSpeed', 'normal');
        var fadeTime = parseFloat(opt('fadeTime', '5')) * 1000;
        var showGrid = opt('showGrid', 'true') === 'true';
        var showRangeLabels = opt('showRangeLabels', 'true') === 'true';
        var centerLabel = opt('centerLabel', 'TDRSS');
        var maxRange = parseFloat(opt('maxRange', '20000'));
        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark' : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');
        var sweepColor = hexFromSplunk(opt('sweepColor', ''), t.accent);
        this._showHoverEffect = opt('showHoverEffect', 'true') === 'true';
        this._drilldownField = opt('drilldownField', 'station_name');

        if (prefersReducedMotion()) { this._entranceDone = true; this._entranceProgress = 1; }
        var showEntrance = opt('showEntrance', 'true') === 'true';
        if (!showEntrance) { this._entranceDone = true; this._entranceProgress = 1; }

        var speedRad = sweepSpeed === 'slow' ? 0.008 : sweepSpeed === 'fast' ? 0.025 : 0.015;

        this._dataPoints = [];
        var typeColors = { DSN: t.s1, TDRS: t.s2, SGLS: t.s3, KSAT: t.s4 };
        for (var r = 0; r < data.rows.length; r++) {
            var row = data.rows[r];
            var name = safeStr(row[data.colIdx[nameField]]);
            var az = safeNum(row[data.colIdx[azimuthField]], 0);
            var range = safeNum(row[data.colIdx[rangeField]], 0);
            var type = safeStr(row[data.colIdx[typeField]]);
            this._dataPoints.push({
                name: name, azRad: (az - 90) * Math.PI / 180,
                rangePct: Math.min(range / maxRange, 1),
                color: typeColors[type] || t.s5,
                revealedAt: 0, rowIdx: r
            });
        }

        this._config = {
            t: t, isDark: isDark, sweepColor: sweepColor, speedRad: speedRad,
            fadeTime: fadeTime, showGrid: showGrid, showRangeLabels: showRangeLabels,
            centerLabel: centerLabel, maxRange: maxRange
        };
        this._tooltip.style.background = t.panelHi; this._tooltip.style.color = t.text;
        this._tooltip.style.fontFamily = theme.FONTS.ui; this._tooltip.style.fontSize = '11px';

        if (!this._looping) { this._startLoop(); }
    },
    _startLoop: function() {
        var self = this;
        this._looping = true;
        var lastTs = 0;
        function frame(ts) {
            if (!self._looping) return;
            if (self._visible) {
                var dt = lastTs ? (ts - lastTs) / 16.67 : 1;
                lastTs = ts;
                if (!self._entranceDone) {
                    self._entranceProgress += 0.015 * dt;
                    if (self._entranceProgress >= 1) { self._entranceDone = true; self._entranceProgress = 1; }
                }
                self._sweepAngle += self._config.speedRad * dt;
                if (self._sweepAngle > Math.PI * 2) self._sweepAngle -= Math.PI * 2;
                for (var i = 0; i < self._dataPoints.length; i++) {
                    var dp = self._dataPoints[i];
                    var diff = Math.abs(self._sweepAngle - ((dp.azRad + Math.PI * 2) % (Math.PI * 2)));
                    if (diff < 0.1 || diff > Math.PI * 2 - 0.1) { dp.revealedAt = ts; }
                }
                self._renderFrame(ts);
            } else { lastTs = 0; }
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    },
    _renderFrame: function(ts) {
        var cfg = this._config;
        if (!cfg) return;
        var w = this.el.clientWidth || 400, h = this.el.clientHeight || 400;
        var dpr = window.devicePixelRatio || 1;
        if (this._canvas.width !== w * dpr || this._canvas.height !== h * dpr) {
            this._canvas.width = w * dpr; this._canvas.height = h * dpr;
            this._canvas.style.width = w + 'px'; this._canvas.style.height = h + 'px';
        }
        var ctx = this._canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        var t = cfg.t;
        var cx = w / 2, cy = h / 2;
        var radius = Math.min(w, h) * 0.42;
        var ep = this._entranceDone ? 1 : this._entranceProgress;

        if (cfg.showGrid) {
            ctx.save();
            ctx.strokeStyle = theme.withAlpha(t.accent, 0.08);
            ctx.lineWidth = 0.5;
            for (var ring = 1; ring <= 4; ring++) {
                var rr = (ring / 4) * radius * ep;
                ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
                if (cfg.showRangeLabels) {
                    ctx.font = '9px ' + theme.FONTS.data;
                    ctx.fillStyle = t.textFaint; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
                    ctx.fillText(Math.round(cfg.maxRange * ring / 4) + ' km', cx + rr + 3, cy - 2);
                }
            }
            for (var line = 0; line < 12; line++) {
                var la = (line / 12) * Math.PI * 2;
                ctx.beginPath(); ctx.moveTo(cx, cy);
                ctx.lineTo(cx + Math.cos(la) * radius * ep, cy + Math.sin(la) * radius * ep);
                ctx.stroke();
            }
            ctx.restore();
        }

        var trailAngle = 30 * Math.PI / 180;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius * ep, this._sweepAngle - trailAngle, this._sweepAngle);
        ctx.closePath();
        var trailGrad = ctx.createConicGradient(this._sweepAngle - trailAngle, cx, cy);
        trailGrad.addColorStop(0, theme.withAlpha(cfg.sweepColor, 0));
        trailGrad.addColorStop(1, theme.withAlpha(cfg.sweepColor, 0.12));
        ctx.fillStyle = trailGrad;
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.beginPath(); ctx.moveTo(cx, cy);
        var sx = cx + Math.cos(this._sweepAngle) * radius * ep;
        var sy = cy + Math.sin(this._sweepAngle) * radius * ep;
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = cfg.sweepColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = theme.withAlpha(cfg.sweepColor, 0.8);
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();

        for (var i = 0; i < this._dataPoints.length; i++) {
            var dp = this._dataPoints[i];
            if (dp.revealedAt === 0) continue;
            var age = ts - dp.revealedAt;
            var alpha = 1 - (age / cfg.fadeTime);
            if (alpha <= 0) continue;
            var px = cx + Math.cos(dp.azRad) * dp.rangePct * radius * ep;
            var py = cy + Math.sin(dp.azRad) * dp.rangePct * radius * ep;
            dp._screenX = px; dp._screenY = py;
            var isHov = this._hoveredIdx === i;
            var dotR = isHov && this._showHoverEffect ? 6 : 4;
            ctx.save();
            ctx.beginPath(); ctx.arc(px, py, dotR, 0, Math.PI * 2);
            ctx.fillStyle = theme.withAlpha(dp.color, alpha);
            ctx.shadowColor = theme.withAlpha(dp.color, alpha * 0.6);
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.restore();
            if (isHov) {
                ctx.save();
                ctx.font = '9px ' + theme.FONTS.ui;
                ctx.fillStyle = theme.withAlpha(t.text, alpha);
                ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
                ctx.fillText(dp.name, px + 8, py - 4);
                ctx.restore();
            }
        }

        ctx.save();
        ctx.font = 'bold ' + Math.max(9, Math.min(14, w * 0.03)) + 'px ' + theme.FONTS.ui;
        ctx.fillStyle = t.textDim; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(cfg.centerLabel, cx, cy);
        ctx.restore();
    },
    _findNearest: function() {
        var best = -1, bestDist = 15;
        for (var i = 0; i < this._dataPoints.length; i++) {
            var dp = this._dataPoints[i];
            if (!dp._screenX) continue;
            var dx = this._mouseX - dp._screenX, dy = this._mouseY - dp._screenY;
            var d = Math.sqrt(dx * dx + dy * dy);
            if (d < bestDist) { bestDist = d; best = i; }
        }
        if (best !== this._hoveredIdx) {
            this._hoveredIdx = best;
            this._canvas.style.cursor = best >= 0 ? 'pointer' : 'default';
            if (best >= 0) {
                var dp = this._dataPoints[best];
                this._tooltip.innerHTML = '<b>' + dp.name + '</b>';
                this._tooltip.style.display = 'block';
            } else { this._tooltip.style.display = 'none'; }
        }
        if (best >= 0) {
            this._tooltip.style.left = (this._mouseX + 14) + 'px';
            this._tooltip.style.top = (this._mouseY - 10) + 'px';
        }
    },
    _onClick: function(e) {
        if (this._hoveredIdx < 0 || !this._lastGoodData) return;
        var dp = this._dataPoints[this._hoveredIdx];
        var row = this._lastGoodData.rows[dp.rowIdx];
        var field = this._drilldownField || 'station_name';
        var idx = this._lastGoodData.colIdx[field];
        var val = idx !== undefined ? safeStr(row[idx]) : '';
        try { this.drilldown({ action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN, data: { 'click.name': field, 'click.value': val } }, e); } catch (ex) {}
    },
    reflow: function() {},
    destroy: function() {
        this._looping = false;
        if (this._observer) { this._observer.disconnect(); }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }
});


});