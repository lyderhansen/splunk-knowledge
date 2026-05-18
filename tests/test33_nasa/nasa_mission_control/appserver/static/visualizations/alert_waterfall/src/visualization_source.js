var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var SplunkVisualizationUtils = require('api/SplunkVisualizationUtils');
var theme = require('shared/theme');

function safeStr(val) { return (val != null && val !== '') ? String(val) : ''; }
function safeNum(val, fallback) { if (val == null || val === '') return fallback; var n = parseFloat(val); return isNaN(n) ? fallback : n; }
function detectTheme() {
    try { if (typeof SplunkVisualizationUtils !== 'undefined' && SplunkVisualizationUtils.getCurrentTheme) { var st = SplunkVisualizationUtils.getCurrentTheme(); if (st === 'light' || st === 'dark') return st; } } catch (e) {}
    var body = document.body; if (body) { var dt = body.getAttribute('data-theme'); if (dt === 'light' || dt === 'dark') return dt; if (body.classList.contains('dark')) return 'dark'; if (body.classList.contains('light')) return 'light'; }
    try { var bg = window.getComputedStyle(document.body).backgroundColor; var m = bg.match(/\d+/g); if (m && m.length >= 3) return (parseInt(m[0]) + parseInt(m[1]) + parseInt(m[2])) / 3 < 128 ? 'dark' : 'light'; } catch (e) {} return 'dark';
}
function getOption(config, ns, key, dv) { var v = config[ns + key]; if (v !== undefined && v !== null) return v; v = config[key]; if (v !== undefined && v !== null) return v; return dv; }
function prefersReducedMotion() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
function getSpeedMult(s) { return s === 'slow' ? 1.5 : s === 'fast' ? 0.6 : 1.0; }
function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

function fmtTime(ts) {
    if (!ts) return '';
    try {
        var d = new Date(ts);
        if (isNaN(d.getTime())) return String(ts).slice(0, 19);
        var mo = ('0' + (d.getMonth() + 1)).slice(-2);
        var dd = ('0' + d.getDate()).slice(-2);
        var hh = ('0' + d.getHours()).slice(-2);
        var mm = ('0' + d.getMinutes()).slice(-2);
        return mo + '/' + dd + ' ' + hh + ':' + mm;
    } catch (e) { return String(ts).slice(0, 16); }
}

module.exports = SplunkVisualizationBase.extend({
    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.style.position = 'relative'; this.el.style.overflow = 'hidden';
        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;';
        this.el.appendChild(this._canvas);
        this._lastGoodData = null;
        this._entranceDone = false; this._entranceStart = 0;
        this._pulsePhase = 0; this._looping = false;
        this._scrollOffset = 0;
        this._hoveredRow = -1;
        this._mouseY = 0;
        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            self._mouseY = e.offsetY;
            var rowH = self._rowHeight || 40;
            var idx = Math.floor((e.offsetY + self._scrollOffset) / rowH);
            if (idx !== self._hoveredRow) { self._hoveredRow = idx; self._canvas.style.cursor = idx >= 0 ? 'pointer' : 'default'; }
        });
        this._canvas.addEventListener('mouseleave', function() { self._hoveredRow = -1; });
        this._canvas.addEventListener('wheel', function(e) {
            e.preventDefault();
            self._scrollOffset += e.deltaY;
            if (self._scrollOffset < 0) self._scrollOffset = 0;
            var maxScroll = Math.max(0, (self._rowCount || 0) * (self._rowHeight || 40) - self.el.clientHeight);
            if (self._scrollOffset > maxScroll) self._scrollOffset = maxScroll;
        }, { passive: false });
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
        var alertField = opt('alertField', 'alert_name');
        var severityField = opt('severityField', 'severity');
        var subsystemField = opt('subsystemField', 'subsystem');
        var statusField = opt('statusField', 'status');
        var maxRows = parseInt(opt('maxRows', '20'), 10);
        var sortOrder = opt('sortOrder', 'newest');
        var showTimestamp = opt('showTimestamp', 'true') === 'true';
        var activeGlow = opt('activeGlow', 'true') === 'true';
        var flashCritical = opt('flashCritical', 'true') === 'true';
        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark' : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');
        this._drilldownField = opt('drilldownField', 'alert_name');

        if (prefersReducedMotion()) { this._entranceDone = true; }
        var showEntrance = opt('showEntrance', 'true') === 'true';
        if (!showEntrance) { this._entranceDone = true; }
        var animSpeed = opt('animationSpeed', 'normal');

        var rows = data.rows.slice(0, maxRows);
        if (sortOrder === 'newest') {
            rows.sort(function(a, b) {
                var ta = a[data.colIdx[timeField]] || '', tb = b[data.colIdx[timeField]] || '';
                return ta > tb ? -1 : ta < tb ? 1 : 0;
            });
        }

        this._config = {
            t: t, isDark: isDark, rows: rows, colIdx: data.colIdx,
            timeField: timeField, alertField: alertField, severityField: severityField,
            subsystemField: subsystemField, statusField: statusField,
            showTimestamp: showTimestamp, activeGlow: activeGlow, flashCritical: flashCritical,
            animSpeed: animSpeed
        };
        this._rowCount = rows.length;

        if (!this._looping) { this._startLoop(); }
        if (showEntrance && !this._entranceDone && !this._entranceStart) { this._entranceStart = performance.now(); }
    },
    _startLoop: function() {
        var self = this;
        this._looping = true;
        function frame(ts) {
            if (!self._looping) return;
            self._pulsePhase = (ts / 800) % (Math.PI * 2);
            self._renderFrame(ts);
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    },
    _renderFrame: function(ts) {
        var cfg = this._config;
        if (!cfg) return;
        var w = this.el.clientWidth || 600, h = this.el.clientHeight || 400;
        var dpr = window.devicePixelRatio || 1;
        if (this._canvas.width !== w * dpr || this._canvas.height !== h * dpr) {
            this._canvas.width = w * dpr; this._canvas.height = h * dpr;
            this._canvas.style.width = w + 'px'; this._canvas.style.height = h + 'px';
        }
        var ctx = this._canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);

        var t = cfg.t;
        var rowH = Math.max(32, Math.min(44, h / 10));
        this._rowHeight = rowH;
        var rows = cfg.rows;
        var colIdx = cfg.colIdx;
        var entranceMs = 400 * getSpeedMult(cfg.animSpeed);
        var stagger = 50;

        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();

        for (var i = 0; i < rows.length; i++) {
            var y = i * rowH - this._scrollOffset;
            if (y + rowH < 0 || y > h) continue;

            var entOffset = 0;
            if (!this._entranceDone && this._entranceStart) {
                var elapsed = ts - this._entranceStart - i * stagger;
                if (elapsed < 0) continue;
                var p = Math.min(elapsed / entranceMs, 1);
                entOffset = (1 - easeOutQuart(p)) * -rowH;
                ctx.globalAlpha = p;
                if (p >= 1 && i === rows.length - 1) { this._entranceDone = true; }
            } else { ctx.globalAlpha = 1; }

            y += entOffset;
            var row = rows[i];
            var sev = safeStr(row[colIdx[cfg.severityField]]).toLowerCase();
            var status = safeStr(row[colIdx[cfg.statusField]]).toLowerCase();
            var sc = theme.severityColor(t, sev);
            var isActive = status === 'active';
            var isHovered = this._hoveredRow === i;

            var bgAlpha = 0.04;
            if (isActive && cfg.activeGlow && !prefersReducedMotion()) {
                bgAlpha = 0.05 + 0.08 * Math.sin(this._pulsePhase + i * 0.3);
            }
            if (isHovered) bgAlpha += 0.06;

            ctx.fillStyle = theme.withAlpha(sc, bgAlpha);
            ctx.fillRect(0, y, w, rowH - 1);

            ctx.fillStyle = sc;
            ctx.fillRect(0, y, 4, rowH - 1);

            if (sev === 'critical' && cfg.flashCritical && !prefersReducedMotion()) {
                ctx.save();
                ctx.shadowColor = theme.withAlpha(sc, 0.4);
                ctx.shadowBlur = 6 + 6 * Math.sin(this._pulsePhase);
                ctx.fillStyle = theme.withAlpha(sc, 0.01);
                ctx.fillRect(0, y, w, rowH - 1);
                ctx.restore();
            }

            var tx = 12;
            ctx.textBaseline = 'middle';
            var midY = y + rowH / 2;

            if (cfg.showTimestamp) {
                ctx.font = '10px ' + theme.FONTS.data;
                ctx.fillStyle = t.textFaint; ctx.textAlign = 'left';
                ctx.fillText(fmtTime(row[colIdx[cfg.timeField]]), tx, midY);
                tx += Math.min(w * 0.15, 100);
            }

            ctx.font = 'bold 11px ' + theme.FONTS.ui;
            ctx.fillStyle = t.text; ctx.textAlign = 'left';
            var alertName = safeStr(row[colIdx[cfg.alertField]]);
            var maxAlertW = w * 0.45;
            if (ctx.measureText(alertName).width > maxAlertW) {
                while (ctx.measureText(alertName + '...').width > maxAlertW && alertName.length > 5) {
                    alertName = alertName.slice(0, -1);
                }
                alertName += '...';
            }
            ctx.fillText(alertName, tx, midY);
            tx += maxAlertW + 10;

            ctx.font = '10px ' + theme.FONTS.ui;
            ctx.fillStyle = t.textDim;
            ctx.fillText(safeStr(row[colIdx[cfg.subsystemField]]), tx, midY);
            tx = w - 70;

            var badgeW = 52, badgeH = 18;
            var badgeX = tx, badgeY = midY - badgeH / 2;
            theme.roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 3);
            ctx.fillStyle = theme.withAlpha(sc, 0.2); ctx.fill();
            ctx.font = 'bold 9px ' + theme.FONTS.ui;
            ctx.fillStyle = sc; ctx.textAlign = 'center';
            ctx.fillText(sev.toUpperCase(), badgeX + badgeW / 2, midY);
        }

        ctx.restore();
        ctx.globalAlpha = 1;

        var totalH = rows.length * rowH;
        if (totalH > h) {
            var scrollBarH = Math.max(20, (h / totalH) * h);
            var scrollBarY = (this._scrollOffset / (totalH - h)) * (h - scrollBarH);
            ctx.save();
            theme.roundRect(ctx, w - 6, scrollBarY, 4, scrollBarH, 2);
            ctx.fillStyle = theme.withAlpha(t.textFaint, 0.3); ctx.fill();
            ctx.restore();
        }
    },
    _onClick: function(e) {
        if (this._hoveredRow < 0 || !this._config) return;
        var rows = this._config.rows;
        if (this._hoveredRow >= rows.length) return;
        var row = rows[this._hoveredRow];
        var field = this._drilldownField || 'alert_name';
        var idx = this._config.colIdx[field];
        var val = idx !== undefined ? safeStr(row[idx]) : '';
        try { this.drilldown({ action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN, data: { 'click.name': field, 'click.value': val } }, e); } catch (ex) {}
    },
    reflow: function() {},
    destroy: function() { this._looping = false; SplunkVisualizationBase.prototype.destroy.apply(this, arguments); }
});
