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

module.exports = SplunkVisualizationBase.extend({
    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.style.position = 'relative'; this.el.style.overflow = 'hidden';
        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;';
        this.el.appendChild(this._canvas);
        this._lastGoodData = null;
        this._entranceDone = false; this._entranceProgress = 0; this._animating = false;
        this._pulsePhase = 0; this._pulseAnimating = false;
        this._hovered = false;
        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            var inside = e.offsetX >= 0;
            if (inside !== self._hovered) { self._hovered = inside; self.invalidateUpdateView(); }
        });
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

        var remainingField = opt('remainingField', 'fuel_remaining_pct');
        var burn1Field = opt('burn1Field', 'burn1_pct');
        var burn2Field = opt('burn2Field', 'burn2_pct');
        var burn3Field = opt('burn3Field', 'burn3_pct');
        var maxBurns = parseInt(opt('maxBurns', '3'), 10);
        var burnLabels = opt('burnLabels', 'TLI,LOI,TEI').split(',');
        var reserveThreshold = parseFloat(opt('reserveThreshold', '15'));
        var arcWidthSetting = opt('arcWidth', 'medium');
        var showLabels = opt('showLabels', 'true') === 'true';
        var flashCritical = opt('flashCritical', 'true') === 'true';
        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark' : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');
        var remainingColor = hexFromSplunk(opt('remainingColor', ''), t.success);
        var burnColor = hexFromSplunk(opt('burnColor', ''), t.s3);
        var reserveColor = hexFromSplunk(opt('reserveColor', ''), t.danger);
        this._drilldownField = opt('drilldownField', 'fuel_remaining_pct');

        if (prefersReducedMotion()) { this._entranceDone = true; this._entranceProgress = 1; }
        var showEntrance = opt('showEntrance', 'true') === 'true';
        if (!showEntrance) { this._entranceDone = true; this._entranceProgress = 1; }
        if (showEntrance && !this._entranceDone && !this._animating) { this._startEntrance(opt('animationSpeed', 'normal')); }

        var w = this.el.clientWidth || 350, h = this.el.clientHeight || 350;
        var dpr = window.devicePixelRatio || 1;
        this._canvas.width = w * dpr; this._canvas.height = h * dpr;
        this._canvas.style.width = w + 'px'; this._canvas.style.height = h + 'px';
        var ctx = this._canvas.getContext('2d'); if (!ctx) return;
        ctx.scale(dpr, dpr); ctx.clearRect(0, 0, w, h);

        var row = data.rows[data.rows.length - 1];
        var remaining = safeNum(row[data.colIdx[remainingField]], 50);
        var burns = [];
        if (maxBurns >= 1) burns.push(safeNum(row[data.colIdx[burn1Field]], 0));
        if (maxBurns >= 2) burns.push(safeNum(row[data.colIdx[burn2Field]], 0));
        if (maxBurns >= 3) burns.push(safeNum(row[data.colIdx[burn3Field]], 0));

        var isReserve = remaining < reserveThreshold;
        if (isReserve && flashCritical && !this._pulseAnimating) { this._startPulse(); }

        var cx = w / 2, cy = h * 0.45;
        var radius = Math.min(w, h) * 0.36;
        var lineW = arcWidthSetting === 'thin' ? 12 : arcWidthSetting === 'thick' ? 28 : 20;
        var ep = this._entranceDone ? 1 : easeOutQuart(this._entranceProgress);
        var startAngle = 0.75 * Math.PI;
        var totalArc = 1.5 * Math.PI;

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, startAngle + totalArc);
        ctx.strokeStyle = theme.withAlpha(t.edge, 0.15);
        ctx.lineWidth = lineW; ctx.lineCap = 'butt'; ctx.stroke();
        ctx.restore();

        var total = 0;
        for (var b = 0; b < burns.length; b++) total += burns[b];
        total += remaining;
        if (total <= 0) total = 100;

        var currentAngle = startAngle;
        for (var b = 0; b < burns.length; b++) {
            var segArc = (burns[b] / total) * totalArc * ep;
            if (segArc <= 0) continue;
            var shade = theme.lerpColor(burnColor, '#CC4400', b * 0.2);
            ctx.save();
            ctx.beginPath(); ctx.arc(cx, cy, radius, currentAngle, currentAngle + segArc);
            ctx.strokeStyle = shade; ctx.lineWidth = lineW; ctx.lineCap = 'butt';
            ctx.stroke();
            ctx.restore();

            if (showLabels && burnLabels[b]) {
                var midAngle = currentAngle + segArc / 2;
                var lx = cx + Math.cos(midAngle) * (radius + lineW / 2 + 14);
                var ly = cy + Math.sin(midAngle) * (radius + lineW / 2 + 14);
                ctx.save();
                ctx.font = '9px ' + theme.FONTS.ui;
                ctx.fillStyle = t.textDim; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(burnLabels[b].trim(), lx, ly);
                ctx.restore();
            }
            currentAngle += segArc;
        }

        var remArc = (remaining / total) * totalArc * ep;
        if (remArc > 0) {
            var remColor = isReserve ? reserveColor : remainingColor;
            ctx.save();
            ctx.beginPath(); ctx.arc(cx, cy, radius, currentAngle, currentAngle + remArc);
            ctx.strokeStyle = remColor; ctx.lineWidth = lineW; ctx.lineCap = 'butt';
            if (isReserve && flashCritical && !prefersReducedMotion()) {
                ctx.shadowColor = theme.withAlpha(reserveColor, 0.6);
                ctx.shadowBlur = 8 + 12 * Math.sin(this._pulsePhase);
            } else if (isDark) {
                ctx.shadowColor = theme.withAlpha(remColor, 0.4);
                ctx.shadowBlur = 8;
            }
            ctx.stroke();
            ctx.restore();
        }

        var typo = theme.getTypoScale(w, h);
        ctx.save();
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        var valStr = (remaining * ep).toFixed(1) + '%';
        ctx.font = 'bold ' + Math.max(18, typo.hero * 0.8) + 'px ' + theme.FONTS.data;
        ctx.fillStyle = t.text;
        if (isDark) { ctx.shadowColor = theme.withAlpha(isReserve ? reserveColor : remainingColor, 0.4); ctx.shadowBlur = 10; }
        ctx.fillText(valStr, cx, cy);
        ctx.shadowBlur = 0;
        ctx.font = Math.max(10, typo.whisper) + 'px ' + theme.FONTS.ui;
        ctx.fillStyle = t.textDim;
        ctx.fillText('FUEL REMAINING', cx, cy + typo.hero * 0.5);
        ctx.restore();

        this._lastData = data;
    },
    _startEntrance: function(speed) {
        if (this._animating) return;
        var duration = 700 * getSpeedMult(speed);
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
            self._pulsePhase = (ts / 700) % (Math.PI * 2);
            self.invalidateUpdateView();
            requestAnimationFrame(pulse);
        }
        requestAnimationFrame(pulse);
    },
    _onClick: function(e) {
        if (!this._lastData) return;
        var row = this._lastData.rows[this._lastData.rows.length - 1];
        var field = this._drilldownField || 'fuel_remaining_pct';
        var idx = this._lastData.colIdx[field];
        var val = idx !== undefined ? safeStr(row[idx]) : '';
        try { this.drilldown({ action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN, data: { 'click.name': field, 'click.value': val } }, e); } catch (ex) {}
    },
    reflow: function() { this.invalidateUpdateView(); },
    destroy: function() { this._animating = false; this._pulseAnimating = false; SplunkVisualizationBase.prototype.destroy.apply(this, arguments); }
});
