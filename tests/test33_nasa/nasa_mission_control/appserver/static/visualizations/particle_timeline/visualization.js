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
        this._particles = [];
        this._looping = false;
        this._entranceDone = false; this._entranceProgress = 0;
        this._pulsePhase = 0;
        this._hoveredIdx = -1;
        this._mouseX = 0; this._mouseY = 0;
        var self = this;
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

        var timeField = opt('timeField', '_time');
        var eventField = opt('eventField', 'event_type');
        var severityField = opt('severityField', 'severity');
        var impactField = opt('impactField', 'impact_score');
        var maxParticles = parseInt(opt('maxParticles', '200'), 10);
        var sizeSetting = opt('particleSize', 'medium');
        var flowSpeed = opt('flowSpeed', 'normal');
        var animationSpeed = opt('animationSpeed', 'normal');
        var showAxis = opt('showAxis', 'true') === 'true';
        var showLabels = opt('showLabels', 'true') === 'true';
        var laneMode = opt('laneMode', 'scatter');
        var flashCritical = opt('flashCritical', 'true') === 'true';
        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark' : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');
        this._showHoverEffect = opt('showHoverEffect', 'true') === 'true';
        this._drilldownField = opt('drilldownField', 'event_type');

        if (prefersReducedMotion()) { this._entranceDone = true; this._entranceProgress = 1; }
        var showEntrance = opt('showEntrance', 'true') === 'true';
        if (!showEntrance) { this._entranceDone = true; this._entranceProgress = 1; }

        var w = this.el.clientWidth || 600, h = this.el.clientHeight || 250;
        var pad = { left: 40, right: 20, top: 20, bottom: showAxis ? 30 : 10 };
        var plotW = w - pad.left - pad.right;
        var plotH = h - pad.top - pad.bottom;

        var baseSz = sizeSetting === 'small' ? 3 : sizeSetting === 'large' ? 8 : 5;
        var speedMult = flowSpeed === 'slow' ? 0.3 : flowSpeed === 'fast' ? 1.2 : 0.6;

        var laneTypes = {};
        var laneCount = 0;
        if (laneMode === 'lanes') {
            for (var r = 0; r < data.rows.length; r++) {
                var ev = safeStr(data.rows[r][data.colIdx[eventField]]);
                if (ev && !laneTypes[ev]) { laneTypes[ev] = laneCount; laneCount++; }
            }
        }

        var times = [];
        for (var r = 0; r < data.rows.length; r++) {
            var tv = data.rows[r][data.colIdx[timeField]];
            times.push(tv ? new Date(tv).getTime() : 0);
        }
        var minT = times[0] || 0, maxT = times[0] || 0;
        for (var r = 1; r < times.length; r++) { if (times[r] < minT) minT = times[r]; if (times[r] > maxT) maxT = times[r]; }
        var rangeT = maxT - minT || 1;

        this._particles = [];
        for (var r = 0; r < data.rows.length && this._particles.length < maxParticles; r++) {
            var row = data.rows[r];
            var sev = safeStr(row[data.colIdx[severityField]]);
            var impact = safeNum(row[data.colIdx[impactField]], 3);
            var evName = safeStr(row[data.colIdx[eventField]]);
            var x = pad.left + ((times[r] - minT) / rangeT) * plotW;
            var y;
            if (laneMode === 'lanes' && laneTypes[evName] !== undefined) {
                y = pad.top + ((laneTypes[evName] + 0.5) / Math.max(laneCount, 1)) * plotH;
            } else {
                y = pad.top + 20 + Math.random() * (plotH - 40);
            }
            this._particles.push({
                x: x, y: y,
                baseX: x,
                color: theme.severityColor(t, sev),
                radius: baseSz + (impact / 10) * baseSz,
                sev: sev, evName: evName, rowIdx: r,
                age: 0, maxAge: 300
            });
        }

        this._config = {
            t: t, isDark: isDark, w: w, h: h, pad: pad, plotW: plotW, plotH: plotH,
            showAxis: showAxis, showLabels: showLabels, flashCritical: flashCritical,
            speedMult: speedMult, minT: minT, maxT: maxT, rangeT: rangeT,
            laneMode: laneMode, laneTypes: laneTypes, laneCount: laneCount
        };
        this._tooltip.style.background = t.panelHi; this._tooltip.style.color = t.text;
        this._tooltip.style.fontFamily = theme.FONTS.ui; this._tooltip.style.fontSize = '11px';

        if (!this._looping) { this._startLoop(); }
    },
    _startLoop: function() {
        var self = this;
        this._looping = true;
        function frame(ts) {
            if (!self._looping) return;
            if (!self._entranceDone) {
                self._entranceProgress += 0.02;
                if (self._entranceProgress >= 1) { self._entranceDone = true; self._entranceProgress = 1; }
            }
            self._pulsePhase = (ts / 700) % (Math.PI * 2);
            self._renderFrame();
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    },
    _renderFrame: function() {
        var cfg = this._config;
        if (!cfg) return;
        var w = cfg.w, h = cfg.h, t = cfg.t, pad = cfg.pad;
        var typo = theme.getTypoScale(w, h);
        var dpr = window.devicePixelRatio || 1;
        if (this._canvas.width !== w * dpr || this._canvas.height !== h * dpr) {
            this._canvas.width = w * dpr; this._canvas.height = h * dpr;
            this._canvas.style.width = w + 'px'; this._canvas.style.height = h + 'px';
        }
        var ctx = this._canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);

        var ep = this._entranceDone ? 1 : this._entranceProgress;

        if (cfg.showAxis) {
            ctx.save();
            ctx.strokeStyle = theme.withAlpha(t.accent, 0.3);
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(pad.left, h - pad.bottom); ctx.lineTo(pad.left + cfg.plotW, h - pad.bottom); ctx.stroke();
            ctx.font = '9px ' + theme.FONTS.data;
            ctx.fillStyle = t.textFaint; ctx.textAlign = 'center';
            for (var tick = 0; tick <= 4; tick++) {
                var tx = pad.left + (tick / 4) * cfg.plotW;
                var tTime = new Date(cfg.minT + (tick / 4) * cfg.rangeT);
                var tLabel = (tTime.getMonth() + 1) + '/' + tTime.getDate() + ' ' + ('0' + tTime.getHours()).slice(-2) + ':' + ('0' + tTime.getMinutes()).slice(-2);
                ctx.beginPath(); ctx.moveTo(tx, h - pad.bottom); ctx.lineTo(tx, h - pad.bottom + 4); ctx.stroke();
                ctx.fillText(tLabel, tx, h - pad.bottom + 14);
            }
            ctx.restore();
        }

        if (cfg.laneMode === 'lanes' && cfg.laneCount > 0) {
            ctx.save();
            ctx.font = '9px ' + theme.FONTS.ui;
            ctx.fillStyle = t.textFaint; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
            var keys = Object.keys(cfg.laneTypes);
            for (var k = 0; k < keys.length; k++) {
                var ly = pad.top + ((cfg.laneTypes[keys[k]] + 0.5) / cfg.laneCount) * cfg.plotH;
                ctx.fillText(keys[k], pad.left - 6, ly);
                ctx.strokeStyle = theme.withAlpha(t.accent, 0.05);
                ctx.beginPath(); ctx.moveTo(pad.left, ly); ctx.lineTo(pad.left + cfg.plotW, ly); ctx.stroke();
            }
            ctx.restore();
        }

        for (var i = 0; i < this._particles.length; i++) {
            var p = this._particles[i];
            var alpha = ep;
            var isHov = this._hoveredIdx === i;
            var isCrit = p.sev === 'critical' || p.sev === 'high';
            var radius = p.radius * ep;
            if (isHov && this._showHoverEffect) radius *= 1.5;

            ctx.save();
            ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = theme.withAlpha(p.color, alpha * 0.8);
            ctx.shadowColor = theme.withAlpha(p.color, 0.5);
            ctx.shadowBlur = isCrit && cfg.flashCritical ? 8 + 8 * Math.sin(this._pulsePhase) : 8;
            ctx.fill();
            ctx.restore();

            if (cfg.showLabels && isHov) {
                ctx.save();
                ctx.font = '9px ' + theme.FONTS.ui;
                ctx.fillStyle = t.text; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
                ctx.fillText(p.evName, p.x + radius + 4, p.y - 2);
                ctx.restore();
            }
        }
    },
    _findNearest: function() {
        var best = -1, bestDist = 20;
        for (var i = 0; i < this._particles.length; i++) {
            var p = this._particles[i];
            var dx = this._mouseX - p.x, dy = this._mouseY - p.y;
            var d = Math.sqrt(dx * dx + dy * dy);
            if (d < bestDist) { bestDist = d; best = i; }
        }
        if (best !== this._hoveredIdx) {
            this._hoveredIdx = best;
            this._canvas.style.cursor = best >= 0 ? 'pointer' : 'default';
            if (best >= 0) {
                var p = this._particles[best];
                this._tooltip.innerHTML = '<b>' + p.evName + '</b> — ' + p.sev;
                this._tooltip.style.display = 'block';
                this._tooltip.style.left = (this._mouseX + 14) + 'px';
                this._tooltip.style.top = (this._mouseY - 10) + 'px';
            } else { this._tooltip.style.display = 'none'; }
        } else if (best >= 0) {
            this._tooltip.style.left = (this._mouseX + 14) + 'px';
            this._tooltip.style.top = (this._mouseY - 10) + 'px';
        }
    },
    _onClick: function(e) {
        if (this._hoveredIdx < 0 || !this._lastGoodData) return;
        var p = this._particles[this._hoveredIdx];
        var row = this._lastGoodData.rows[p.rowIdx];
        var field = this._drilldownField || 'event_type';
        var idx = this._lastGoodData.colIdx[field];
        var val = idx !== undefined ? safeStr(row[idx]) : '';
        try { this.drilldown({ action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN, data: { 'click.name': field, 'click.value': val } }, e); } catch (ex) {}
    },
    reflow: function() {},
    destroy: function() { this._looping = false; SplunkVisualizationBase.prototype.destroy.apply(this, arguments); }
});


});