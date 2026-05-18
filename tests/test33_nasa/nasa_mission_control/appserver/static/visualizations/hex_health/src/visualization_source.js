var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var SplunkVisualizationUtils = require('api/SplunkVisualizationUtils');
var theme = require('shared/theme');

function safeStr(val) { return (val != null && val !== '') ? String(val) : ''; }
function safeNum(val, fallback) { if (val == null || val === '') return fallback; var n = parseFloat(val); return isNaN(n) ? fallback : n; }
function hexFromSplunk(val, fallback) { if (val == null || val === '') return fallback; var s = String(val).trim(); if (s.charAt(0) === '#') return s; if (s.indexOf('0x') === 0) return '#' + s.slice(2); var n = parseInt(s, 10); if (!isNaN(n) && n >= 0) return '#' + ('000000' + n.toString(16)).slice(-6); return fallback; }
function detectTheme() {
    try { if (typeof SplunkVisualizationUtils !== 'undefined' && SplunkVisualizationUtils.getCurrentTheme) { var st = SplunkVisualizationUtils.getCurrentTheme(); if (st === 'light' || st === 'dark') return st; } } catch (e) {}
    var body = document.body; if (body) { var dt = body.getAttribute('data-theme'); if (dt === 'light' || dt === 'dark') return dt; if (body.classList.contains('dark')) return 'dark'; if (body.classList.contains('light')) return 'light'; }
    try { var bg = window.getComputedStyle(document.body).backgroundColor; var m = bg.match(/\d+/g); if (m && m.length >= 3) return (parseInt(m[0]) + parseInt(m[1]) + parseInt(m[2])) / 3 < 128 ? 'dark' : 'light'; } catch (e) {} return 'dark';
}
function getOption(config, ns, key, dv) { var v = config[ns + key]; if (v !== undefined && v !== null) return v; v = config[key]; if (v !== undefined && v !== null) return v; return dv; }
function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
function prefersReducedMotion() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
function getSpeedMult(s) { return s === 'slow' ? 1.5 : s === 'fast' ? 0.6 : 1.0; }

function parseSparkline(val) {
    if (!val) return [];
    var s = String(val);
    if (s.indexOf('##__SPARKLINE__##') === 0) {
        var inner = s.replace(/##__SPARKLINE__##/g, '').trim();
        var nums = inner.split(/[\s,]+/);
        var result = [];
        for (var i = 0; i < nums.length; i++) { var n = parseFloat(nums[i]); if (!isNaN(n)) result.push(n); }
        return result;
    }
    var parts = s.split(',');
    var out = [];
    for (var j = 0; j < parts.length; j++) { var v = parseFloat(parts[j].trim()); if (!isNaN(v)) out.push(v); }
    return out;
}

function drawHex(ctx, cx, cy, size) {
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
        var angle = (Math.PI / 3) * i - Math.PI / 6;
        var x = cx + size * Math.cos(angle);
        var y = cy + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
}

function pointInHex(px, py, cx, cy, size) {
    var dx = Math.abs(px - cx), dy = Math.abs(py - cy);
    if (dx > size || dy > size * 0.866) return false;
    return size * 0.866 - dy - (0.5 * dx) > 0;
}

module.exports = SplunkVisualizationBase.extend({
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
        this._entranceDone = false; this._entranceProgress = 0; this._animating = false;
        this._pulsePhase = 0; this._pulseAnimating = false;
        this._hoveredIdx = -1;
        this._hexPositions = [];
        var self = this;
        this._canvas.addEventListener('mousemove', function(e) { self._onMouseMove(e); });
        this._canvas.addEventListener('mouseleave', function() { self._tooltip.style.display = 'none'; if (self._hoveredIdx >= 0) { self._hoveredIdx = -1; self.invalidateUpdateView(); } });
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

        var subsystemField = opt('subsystemField', 'subsystem');
        var statusField = opt('statusField', 'status');
        var sparklineField = opt('sparklineField', 'trend');
        var hexSizeSetting = opt('hexSize', 'medium');
        var showLabels = opt('showLabels', 'true') === 'true';
        var showSparkline = opt('showSparkline', 'true') === 'true';
        var flashCritical = opt('flashCritical', 'true') === 'true';
        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark' : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');
        var nominalColor = hexFromSplunk(opt('nominalColor', ''), t.success);
        var warnColor = hexFromSplunk(opt('warnColor', ''), t.warn);
        var criticalColor = hexFromSplunk(opt('criticalColor', ''), t.danger);
        this._drilldownField = opt('drilldownField', 'subsystem');

        if (prefersReducedMotion()) { this._entranceDone = true; this._entranceProgress = 1; }
        var showEntrance = opt('showEntrance', 'true') === 'true';
        if (!showEntrance) { this._entranceDone = true; this._entranceProgress = 1; }
        if (showEntrance && !this._entranceDone && !this._animating) { this._startEntrance(opt('animationSpeed', 'normal')); }
        if (flashCritical && !this._pulseAnimating) { this._startPulse(); }

        var w = this.el.clientWidth || 400, h = this.el.clientHeight || 400;
        var dpr = window.devicePixelRatio || 1;
        this._canvas.width = w * dpr; this._canvas.height = h * dpr;
        this._canvas.style.width = w + 'px'; this._canvas.style.height = h + 'px';
        var ctx = this._canvas.getContext('2d'); if (!ctx) return;
        ctx.scale(dpr, dpr); ctx.clearRect(0, 0, w, h);
        this._tooltip.style.background = t.panelHi; this._tooltip.style.color = t.text;
        this._tooltip.style.fontFamily = theme.FONTS.ui; this._tooltip.style.fontSize = '11px';

        var count = data.rows.length;
        var hexMult = hexSizeSetting === 'small' ? 0.7 : hexSizeSetting === 'large' ? 1.3 : 1.0;
        var baseSize = Math.min(w / (Math.ceil(Math.sqrt(count)) * 2.2), h / (Math.ceil(count / Math.ceil(Math.sqrt(count))) * 2)) * hexMult;
        var hexSize = Math.max(25, Math.min(baseSize, 70));
        var hexW = hexSize * 2;
        var hexH = hexSize * Math.sqrt(3);
        var cols = Math.max(1, Math.floor((w - hexSize) / (hexW * 0.75 + 4)));
        var totalRows = Math.ceil(count / cols);
        var startY = (h - totalRows * (hexH + 4)) / 2 + hexH / 2;
        var startX = (w - (cols * (hexW * 0.75 + 4) - hexW * 0.25)) / 2 + hexSize;

        var ep = this._entranceDone ? 1 : easeOutQuart(this._entranceProgress);
        this._hexPositions = [];

        for (var i = 0; i < count; i++) {
            var col = i % cols, rowIdx = Math.floor(i / cols);
            var cx = startX + col * (hexW * 0.75 + 4);
            var cy = startY + rowIdx * (hexH + 4) + (col % 2 === 1 ? hexH / 2 : 0);

            var row = data.rows[i];
            var sub = safeStr(row[data.colIdx[subsystemField]]);
            var status = safeStr(row[data.colIdx[statusField]]).toLowerCase();
            var sparkData = showSparkline ? parseSparkline(row[data.colIdx[sparklineField]]) : [];

            var sc = status === 'critical' ? criticalColor : status === 'degraded' || status === 'warning' ? warnColor : nominalColor;
            var isCrit = status === 'critical';
            var isHovered = this._hoveredIdx === i;

            var drawSize = hexSize * ep;
            this._hexPositions.push({ cx: cx, cy: cy, size: hexSize, sub: sub, status: status });

            ctx.save();
            drawHex(ctx, cx, cy, drawSize);
            ctx.fillStyle = theme.withAlpha(sc, isHovered ? 0.3 : 0.15);
            ctx.fill();
            drawHex(ctx, cx, cy, drawSize);
            ctx.strokeStyle = theme.withAlpha(sc, isHovered ? 1.0 : 0.6);
            ctx.lineWidth = isHovered ? 2 : 1.5;
            if (isCrit && flashCritical && !prefersReducedMotion()) {
                ctx.shadowColor = theme.withAlpha(sc, 0.7);
                ctx.shadowBlur = 8 + 8 * Math.sin(this._pulsePhase);
            }
            ctx.stroke();
            ctx.restore();

            if (showLabels) {
                ctx.save();
                ctx.font = 'bold ' + Math.max(8, drawSize * 0.22) + 'px ' + theme.FONTS.ui;
                ctx.fillStyle = t.text; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(sub, cx, cy - drawSize * 0.15);
                ctx.restore();
            }

            if (showSparkline && sparkData.length > 1) {
                var spW = drawSize * 0.8, spH = drawSize * 0.3;
                var spX = cx - spW / 2, spY = cy + drawSize * 0.1;
                var spMin = sparkData[0], spMax = sparkData[0];
                for (var s = 1; s < sparkData.length; s++) { if (sparkData[s] < spMin) spMin = sparkData[s]; if (sparkData[s] > spMax) spMax = sparkData[s]; }
                var spRange = spMax - spMin || 1;
                ctx.save();
                ctx.beginPath();
                for (var s = 0; s < sparkData.length; s++) {
                    var sx = spX + (s / (sparkData.length - 1)) * spW;
                    var sy = spY + spH - ((sparkData[s] - spMin) / spRange) * spH;
                    if (s === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
                }
                ctx.strokeStyle = theme.withAlpha(sc, 0.7);
                ctx.lineWidth = 1; ctx.stroke();
                ctx.restore();
            }
        }

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
    _startPulse: function() {
        var self = this;
        this._pulseAnimating = true;
        function pulse(ts) {
            if (!self._pulseAnimating) return;
            self._pulsePhase = (ts / 600) % (Math.PI * 2);
            self.invalidateUpdateView();
            requestAnimationFrame(pulse);
        }
        requestAnimationFrame(pulse);
    },
    _onMouseMove: function(e) {
        var mx = e.offsetX, my = e.offsetY;
        var found = -1;
        for (var i = 0; i < this._hexPositions.length; i++) {
            var hp = this._hexPositions[i];
            if (pointInHex(mx, my, hp.cx, hp.cy, hp.size)) { found = i; break; }
        }
        if (found !== this._hoveredIdx) {
            this._hoveredIdx = found;
            this._canvas.style.cursor = found >= 0 ? 'pointer' : 'default';
            if (found >= 0) {
                var hp = this._hexPositions[found];
                this._tooltip.innerHTML = '<b>' + hp.sub + '</b> — ' + hp.status;
                this._tooltip.style.display = 'block';
            } else { this._tooltip.style.display = 'none'; }
            this.invalidateUpdateView();
        }
        if (found >= 0) {
            this._tooltip.style.left = (mx + 14) + 'px'; this._tooltip.style.top = (my - 10) + 'px';
        }
    },
    _onClick: function(e) {
        if (this._hoveredIdx < 0 || !this._lastData) return;
        var row = this._lastData.rows[this._hoveredIdx];
        var field = this._drilldownField || 'subsystem';
        var idx = this._lastData.colIdx[field];
        var val = idx !== undefined ? safeStr(row[idx]) : '';
        try { this.drilldown({ action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN, data: { 'click.name': field, 'click.value': val } }, e); } catch (ex) {}
    },
    reflow: function() { this.invalidateUpdateView(); },
    destroy: function() { this._animating = false; this._pulseAnimating = false; SplunkVisualizationBase.prototype.destroy.apply(this, arguments); }
});
