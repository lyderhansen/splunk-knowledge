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

        var phaseField = opt('phaseField', 'phase');
        var altitudeField = opt('altitudeField', 'alt');
        var velocityField = opt('velocityField', 'vel');
        var periapsisField = opt('periapsisField', 'peri');
        var apoapsisField = opt('apoapsisField', 'apo');
        var trailLength = parseInt(opt('trailLength', '30'), 10);
        var bodyLabel = opt('bodyLabel', 'Earth');
        var showReadouts = opt('showReadouts', 'true') === 'true';
        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark' : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');
        var orbitColor = hexFromSplunk(opt('orbitColor', ''), t.s1);
        var bodyColor = hexFromSplunk(opt('bodyColor', ''), '#1E40AF');
        this._showHoverEffect = opt('showHoverEffect', 'true') === 'true';
        this._drilldownField = opt('drilldownField', 'alt');

        if (prefersReducedMotion()) { this._entranceDone = true; this._entranceProgress = 1; }
        var showEntrance = opt('showEntrance', 'true') === 'true';
        if (!showEntrance) { this._entranceDone = true; this._entranceProgress = 1; }
        if (showEntrance && !this._entranceDone && !this._animating) { this._startEntrance(opt('animationSpeed', 'normal')); }

        var w = this.el.clientWidth || 400, h = this.el.clientHeight || 400;
        var dpr = window.devicePixelRatio || 1;
        this._canvas.width = w * dpr; this._canvas.height = h * dpr;
        this._canvas.style.width = w + 'px'; this._canvas.style.height = h + 'px';
        var ctx = this._canvas.getContext('2d'); if (!ctx) return;
        ctx.scale(dpr, dpr); ctx.clearRect(0, 0, w, h);

        var row = data.rows[data.rows.length - 1];
        var phase = safeNum(row[data.colIdx[phaseField]], 0);
        var alt = safeNum(row[data.colIdx[altitudeField]], 400);
        var vel = safeNum(row[data.colIdx[velocityField]], 7.66);
        var peri = safeNum(row[data.colIdx[periapsisField]], 400);
        var apo = safeNum(row[data.colIdx[apoapsisField]], 420);

        var cx = w / 2, cy = h * 0.45;
        var maxDim = Math.min(w, h) * 0.38;
        var ratio = peri / Math.max(apo, 1);
        var semiMajor = maxDim;
        var semiMinor = maxDim * Math.max(ratio, 0.5);
        var bodyRadius = Math.min(w, h) * 0.06;
        var ep = this._entranceDone ? 1 : easeOutQuart(this._entranceProgress);

        ctx.save();
        var bodyGrad = ctx.createRadialGradient(cx - bodyRadius * 0.3, cy - bodyRadius * 0.3, 0, cx, cy, bodyRadius);
        bodyGrad.addColorStop(0, theme.withAlpha(bodyColor, 0.9));
        bodyGrad.addColorStop(0.7, theme.withAlpha(bodyColor, 0.6));
        bodyGrad.addColorStop(1, theme.withAlpha(bodyColor, 0.1));
        ctx.beginPath(); ctx.arc(cx, cy, bodyRadius, 0, Math.PI * 2);
        ctx.fillStyle = bodyGrad; ctx.fill();
        ctx.font = Math.max(9, Math.min(12, w * 0.025)) + 'px ' + theme.FONTS.ui;
        ctx.fillStyle = t.textFaint; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(bodyLabel, cx, cy);
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, semiMajor * ep, semiMinor * ep, 0, 0, Math.PI * 2);
        ctx.strokeStyle = theme.withAlpha(orbitColor, 0.2);
        ctx.lineWidth = 1; ctx.stroke();
        ctx.restore();

        var phaseRad = (phase - 90) * Math.PI / 180;
        var dotX = cx + Math.cos(phaseRad) * semiMajor * ep;
        var dotY = cy + Math.sin(phaseRad) * semiMinor * ep;

        var trailRad = trailLength * Math.PI / 180;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, semiMajor * ep, semiMinor * ep, 0, phaseRad - trailRad, phaseRad);
        ctx.strokeStyle = orbitColor;
        ctx.lineWidth = 3;
        ctx.shadowColor = theme.withAlpha(orbitColor, 0.5);
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.restore();

        var dotRadius = this._hovered && this._showHoverEffect ? 7 : 5;
        ctx.save();
        ctx.beginPath(); ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = orbitColor;
        ctx.shadowColor = theme.withAlpha(orbitColor, 0.8);
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.restore();

        var periAngle = -90 * Math.PI / 180;
        var apoAngle = 90 * Math.PI / 180;
        var markerSize = 4;
        var periX = cx + Math.cos(periAngle) * semiMajor * ep;
        var periY = cy + Math.sin(periAngle) * semiMinor * ep;
        var apoX = cx + Math.cos(apoAngle) * semiMajor * ep;
        var apoY = cy + Math.sin(apoAngle) * semiMinor * ep;

        ctx.save(); ctx.fillStyle = theme.withAlpha(orbitColor, 0.6);
        ctx.beginPath();
        ctx.moveTo(periX, periY - markerSize); ctx.lineTo(periX + markerSize, periY);
        ctx.lineTo(periX, periY + markerSize); ctx.lineTo(periX - markerSize, periY);
        ctx.closePath(); ctx.fill();
        ctx.font = '9px ' + theme.FONTS.ui; ctx.textAlign = 'center'; ctx.fillStyle = t.textFaint;
        ctx.fillText('Pe ' + theme.fmtNum(peri, { decimals: 0 }) + ' km', periX, periY - 10);

        ctx.fillStyle = theme.withAlpha(orbitColor, 0.6);
        ctx.beginPath();
        ctx.moveTo(apoX, apoY - markerSize); ctx.lineTo(apoX + markerSize, apoY);
        ctx.lineTo(apoX, apoY + markerSize); ctx.lineTo(apoX - markerSize, apoY);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = t.textFaint;
        ctx.fillText('Ap ' + theme.fmtNum(apo, { decimals: 0 }) + ' km', apoX, apoY + 14);
        ctx.restore();

        if (showReadouts) {
            var readY = h * 0.88;
            ctx.save();
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.font = 'bold 14px ' + theme.FONTS.data;
            ctx.fillStyle = t.text;
            if (isDark) { ctx.shadowColor = theme.withAlpha(orbitColor, 0.4); ctx.shadowBlur = 8; }
            ctx.fillText('ALT ' + theme.fmtNum(alt, { decimals: 1 }) + ' km', cx - w * 0.18, readY);
            ctx.fillText('VEL ' + vel.toFixed(2) + ' km/s', cx + w * 0.18, readY);
            ctx.restore();
        }

        this._dotPos = { x: dotX, y: dotY, r: 15 };
        this._lastData = data;
    },
    _startEntrance: function(speed) {
        if (this._animating) return;
        var duration = 600 * getSpeedMult(speed);
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
    _onMouseMove: function(e) {
        if (!this._showHoverEffect || !this._dotPos) return;
        var dx = e.offsetX - this._dotPos.x, dy = e.offsetY - this._dotPos.y;
        var inside = Math.sqrt(dx * dx + dy * dy) <= this._dotPos.r;
        if (inside !== this._hovered) {
            this._hovered = inside;
            this._canvas.style.cursor = inside ? 'pointer' : 'default';
            this.invalidateUpdateView();
        }
    },
    _onClick: function(e) {
        if (!this._lastData) return;
        var row = this._lastData.rows[this._lastData.rows.length - 1];
        var field = this._drilldownField || 'alt';
        var idx = this._lastData.colIdx[field];
        var val = idx !== undefined ? safeStr(row[idx]) : '';
        try { this.drilldown({ action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN, data: { 'click.name': field, 'click.value': val } }, e); } catch (ex) {}
    },
    reflow: function() { this.invalidateUpdateView(); },
    destroy: function() { this._animating = false; SplunkVisualizationBase.prototype.destroy.apply(this, arguments); }
});
