// @viz-type: timeline
var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var SplunkVisualizationUtils = require('api/SplunkVisualizationUtils');
var theme = require('shared/theme');

var escapeHtml = SplunkVisualizationUtils.escapeHtml;

function safeStr(val) {
    return (val != null && val !== '') ? String(val) : '';
}

function safeNum(val, fallback) {
    if (val == null || val === '') return fallback;
    var n = parseFloat(val);
    return isNaN(n) ? fallback : n;
}

function hexFromSplunk(val, fallback) {
    if (val == null || val === '') return fallback;
    var s = String(val).trim();
    if (s.charAt(0) === '#') return s;
    if (s.indexOf('0x') === 0) return '#' + s.slice(2);
    var n = parseInt(s, 10);
    if (!isNaN(n) && n >= 0) return '#' + ('000000' + n.toString(16)).slice(-6);
    return fallback;
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
    return 'dark';
}

function getOption(config, ns, key, defaultValue) {
    var v = config[ns + key];
    if (v !== undefined && v !== null) return v;
    v = config[key];
    if (v !== undefined && v !== null) return v;
    return defaultValue;
}

function prefersReducedMotion() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e) { return false; }
}

function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

function getSpeedMult(config, ns) {
    var speed = (config && config[ns + '.animationSpeed']) || 'normal';
    if (speed === 'slow') { return 1.5; }
    if (speed === 'fast') { return 0.6; }
    return 1.0;
}

function drawEmptyState(ctx, w, h, t, accent) {
    ctx.save();
    var cx = w / 2;
    var cy = h * 0.38;
    var r = Math.min(w, h) * 0.1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = theme.withAlpha(accent, 0.20);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    var fontSize = Math.max(11, Math.min(16, h * 0.07));
    ctx.font = fontSize + 'px ' + theme.FONTS.ui;
    ctx.fillStyle = theme.withAlpha(t.textFaint, 0.7);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('No data available', cx, cy + r + 10);
    ctx.restore();
}

function parseStatusList(raw) {
    if (!raw) return [];
    return raw.split(',').map(function(s) { return s.trim().toLowerCase(); });
}

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.classList.add('redbull-sports-viz');
        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;';
        this.el.appendChild(this._canvas);

        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:5px 10px;' +
            'border-radius:2px;pointer-events:none;white-space:nowrap;z-index:100;font-size:12px;';
        this.el.appendChild(this._tooltip);

        this._lastGoodData = null;
        this._entranceDone = false;
        this._animating = false;
        this._entranceProgress = 1;
        this._pulseInterval = null;
        this._pulseBlur = 0;
        this._hoverIdx = -1;
        this._hitRegions = [];
        this._showHoverEffect = true;

        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            self._tooltip.style.display = 'none';
            self._hoverIdx = -1;
        });
        this._canvas.addEventListener('click', function(e) {
            self._onClick(e);
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
        var result = { colIdx: colIdx, rows: data.rows, fields: data.fields };
        this._lastGoodData = result;
        return result;
    },

    updateView: function(data, config) {
        if (!data) {
            if (this._lastGoodData) data = this._lastGoodData;
            else return;
        }

        var ns = (function(viz) {
            try {
                var i = viz.getPropertyNamespaceInfo();
                return i && i.propertyNamespace ? i.propertyNamespace : '';
            } catch(e) { return ''; }
        })(this);

        function opt(key, fallback) { return getOption(config, ns, key, fallback); }

        var eventNameField = opt('eventNameField', 'event_name');
        var statusField    = opt('statusField', 'status');
        var resultField    = opt('resultField', 'result');
        var completedVals  = parseStatusList(opt('completedValues', 'completed,done,finished'));
        var liveVals       = parseStatusList(opt('liveValues', 'live,active,in_progress'));
        var chartTitle     = opt('title', 'Season Events');
        this._clickField   = opt('drilldownField', 'event_name');
        this._showHoverEffect = opt('showHoverEffect', 'true') === 'true';

        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark' : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');

        var gi = parseFloat(opt('accentIntensity', '50')) / 100;
        gi = gi < 0 ? 0 : gi;
        var glowScale = isDark ? 1.0 : 0.4;

        var accent = hexFromSplunk(opt('accentColor', ''), t.accent);
        var completedColor = hexFromSplunk(opt('series1Color', ''), t.s1);   // red
        var upcomingColor  = hexFromSplunk(opt('series2Color', ''), t.s3);   // silver
        var liveColor      = hexFromSplunk(opt('series3Color', ''), t.s2);   // gold
        var firstColor     = hexFromSplunk(opt('series4Color', ''), t.s2);   // gold for 1st
        var podiumColor    = hexFromSplunk(opt('series5Color', ''), t.s3);   // silver for 2nd/3rd
        var showGlow       = opt('showGlow', 'true') === 'true';
        var flashCritical  = opt('flashCritical', 'true') === 'true';

        // Animation
        if (prefersReducedMotion()) {
            this._entranceDone = true;
            this._entranceProgress = 1;
            this._stopPulse();
        }
        var showEntrance = opt('showEntrance', 'true') === 'true';
        if (!showEntrance) {
            this._entranceDone = true;
            this._entranceProgress = 1;
        }
        if (showEntrance && !this._entranceDone) {
            this._startEntrance(config, ns);
        }

        var w = this.el.clientWidth || this.el.offsetWidth || 600;
        var h = this.el.clientHeight || this.el.offsetHeight || 300;
        if (w < 10) w = 600;
        if (h < 10) h = 300;

        var dpr = window.devicePixelRatio || 1;
        this._canvas.width = w * dpr;
        this._canvas.height = h * dpr;
        this._canvas.style.width = w + 'px';
        this._canvas.style.height = h + 'px';
        var ctx = this._canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        this._tooltip.style.background = t.panel;
        this._tooltip.style.color = t.text;
        this._tooltip.style.border = '1px solid ' + t.edge;
        this._tooltip.style.fontFamily = theme.FONTS.ui;

        // Empty state
        if (!data.rows || data.rows.length === 0) {
            drawEmptyState(ctx, w, h, t, accent);
            return;
        }

        var colIdx = data.colIdx;
        var rows = data.rows;
        var totalEvents = rows.length;

        // Track live events for pulse
        var hasLive = false;
        for (var li = 0; li < rows.length; li++) {
            var lStatus = safeStr(rows[li][colIdx[statusField]]).toLowerCase();
            if (liveVals.indexOf(lStatus) >= 0) { hasLive = true; break; }
        }
        if (flashCritical && hasLive && !prefersReducedMotion()) {
            this._startPulse();
        } else {
            this._stopPulse();
        }

        // Layout
        var pad = theme.getSpacing(w);
        var titleH = chartTitle ? Math.max(18, Math.round(h * 0.08)) : 0;
        var timelineY = titleH + pad + Math.round(h * 0.12);  // center of the track line
        var labelH = Math.round(h * 0.22);  // space above for labels
        var resultH = Math.round(h * 0.18); // space below for result badges
        var trackThick = Math.max(3, Math.round(h * 0.02));

        // Title
        if (chartTitle) {
            ctx.save();
            ctx.font = 'bold ' + Math.max(12, Math.round(titleH * 0.65)) + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = isDark ? t.textDim : t.textDim;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(chartTitle.toUpperCase(), pad, titleH / 2 + pad / 2);
            ctx.restore();
        }

        // Animate: fade in all events
        ctx.save();
        ctx.globalAlpha = easeOutQuart(this._entranceProgress);

        // Spine track line
        ctx.save();
        var trackGrad = ctx.createLinearGradient(pad, 0, w - pad, 0);
        trackGrad.addColorStop(0, completedColor);
        trackGrad.addColorStop(0.8, theme.withAlpha(upcomingColor, 0.4));
        trackGrad.addColorStop(1, theme.withAlpha(upcomingColor, 0.1));
        ctx.strokeStyle = trackGrad;
        ctx.lineWidth = trackThick;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(pad, timelineY);
        ctx.lineTo(w - pad, timelineY);
        ctx.stroke();
        ctx.restore();

        // Node spacing
        var nodeCount = totalEvents;
        var nodeAreaW = w - pad * 2;
        var nodeSpacing = nodeCount > 1 ? nodeAreaW / (nodeCount - 1) : nodeAreaW;
        var nodeR = Math.max(5, Math.min(12, nodeSpacing * 0.15));
        var labelSize = Math.max(8, Math.min(12, nodeSpacing * 0.12));

        this._hitRegions = [];

        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            var eventName = safeStr(row[colIdx[eventNameField]]);
            var status = safeStr(row[colIdx[statusField]]).toLowerCase();
            var result = safeStr(row[colIdx[resultField]]);

            var nx = pad + (nodeCount === 1 ? nodeAreaW / 2 : i * nodeSpacing);
            var ny = timelineY;

            var isCompleted = completedVals.indexOf(status) >= 0;
            var isLive = liveVals.indexOf(status) >= 0;

            var nodeColor;
            if (isLive) nodeColor = liveColor;
            else if (isCompleted) nodeColor = completedColor;
            else nodeColor = upcomingColor;

            var isHovered = i === this._hoverIdx;

            // Hover ring
            if (isHovered) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(nx, ny, nodeR + 4, 0, Math.PI * 2);
                ctx.strokeStyle = theme.withAlpha(accent, 0.4);
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();
            }

            // Live event: draw pulse indicator
            if (isLive && this._pulseBlur > 0) {
                ctx.save();
                ctx.shadowColor = theme.withAlpha(liveColor, 0.8);
                ctx.shadowBlur = this._pulseBlur;
                ctx.beginPath();
                ctx.arc(nx, ny, nodeR + 4, 0, Math.PI * 2);
                ctx.strokeStyle = theme.withAlpha(liveColor, 0.6);
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();
            }

            // Node circle
            ctx.save();
            if (showGlow && isCompleted && gi > 0) {
                ctx.shadowColor = theme.withAlpha(nodeColor, 0.5 * gi * glowScale);
                ctx.shadowBlur = 8 * gi * glowScale;
            }
            var nodeGrad = ctx.createRadialGradient(nx - nodeR * 0.3, ny - nodeR * 0.3, 0, nx, ny, nodeR);
            nodeGrad.addColorStop(0, theme.withAlpha(nodeColor, isDark ? 1 : 0.9));
            nodeGrad.addColorStop(1, theme.withAlpha(nodeColor, isDark ? 0.6 : 0.7));
            ctx.beginPath();
            ctx.arc(nx, ny, nodeR, 0, Math.PI * 2);
            ctx.fillStyle = nodeGrad;
            ctx.fill();
            if (!isCompleted && !isLive) {
                // Upcoming: hollow ring
                ctx.beginPath();
                ctx.arc(nx, ny, nodeR, 0, Math.PI * 2);
                ctx.strokeStyle = nodeColor;
                ctx.lineWidth = 2;
                ctx.fillStyle = isDark ? t.bg : t.bg;
                ctx.fill();
                ctx.stroke();
            }
            ctx.restore();

            // Event label above node
            var labelY = ny - nodeR - 4;
            ctx.save();
            ctx.font = labelSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = isCompleted ? (isDark ? t.text : t.text) : t.textFaint;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            // Shorten label to fit
            var shortName = eventName;
            var maxLabelW = Math.max(30, nodeSpacing * 0.9);
            // Remove "Grand Prix" or "GP" suffix for compactness
            shortName = shortName.replace(/ Grand Prix/i, ' GP');
            while (ctx.measureText(shortName).width > maxLabelW && shortName.length > 3) {
                shortName = shortName.slice(0, -1);
            }
            // Stagger labels above/below to prevent overlap
            var isOdd = i % 2 === 1;
            var labelOffsetY = isOdd ? -labelSize - 2 : 0;
            ctx.fillText(shortName, nx, labelY + labelOffsetY);
            ctx.restore();

            // Result badge below node (for completed events)
            if (isCompleted && result) {
                var badgeY = ny + nodeR + 6;
                var isFirst = result.trim() === '1st' || result.trim() === '1';
                var isPodium = result.trim() === '2nd' || result.trim() === '3rd' || result.trim() === '2' || result.trim() === '3';
                var badgeColor = isFirst ? firstColor : (isPodium ? podiumColor : completedColor);

                ctx.save();
                ctx.font = 'bold ' + (labelSize * 0.9) + 'px ' + theme.FONTS.data;
                var badgeText = result.trim();
                var bw = ctx.measureText(badgeText).width + 8;
                var bh = labelSize + 4;
                theme.roundRect(ctx, nx - bw / 2, badgeY, bw, bh, 2);
                ctx.fillStyle = theme.withAlpha(badgeColor, 0.2);
                ctx.fill();
                ctx.strokeStyle = theme.withAlpha(badgeColor, 0.7);
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.fillStyle = isDark ? badgeColor : badgeColor;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(badgeText, nx, badgeY + bh / 2);
                ctx.restore();
            }

            // Hit region
            this._hitRegions.push({
                x: nx - Math.max(nodeR, nodeSpacing / 2),
                y: timelineY - labelH,
                w: Math.max(nodeR * 2, nodeSpacing),
                h: labelH + resultH,
                eventName: eventName,
                status: status,
                result: result,
                tip: escapeHtml(eventName) + (result ? ' — <b>' + escapeHtml(result) + '</b>' : '') + ' (' + escapeHtml(status) + ')'
            });
        }

        ctx.restore(); // entrance globalAlpha
        ctx.globalAlpha = 1;

        this._rowData = rows;
        this._colIdx = colIdx;
        this._eventNameField = eventNameField;
    },

    _startEntrance: function(config, ns) {
        if (this._animating) { return; }
        var speedMult = getSpeedMult(config, ns);
        var duration = 450 * speedMult;
        this._animating = true;
        var startTime = null;
        var self = this;
        function step(timestamp) {
            if (!self._animating) { return; }
            if (!startTime) { startTime = timestamp; }
            var progress = Math.min((timestamp - startTime) / duration, 1);
            self._entranceProgress = progress;
            self.invalidateUpdateView();
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                self._entranceDone = true;
                self._animating = false;
            }
        }
        requestAnimationFrame(step);
    },

    _startPulse: function() {
        if (this._pulseInterval) { return; }
        var base = 4;
        var amp = 8;
        var cadenceMs = 700;
        var startTime = Date.now();
        var self = this;
        this._pulseInterval = setInterval(function() {
            var elapsed = Date.now() - startTime;
            var phase = (elapsed % cadenceMs) / cadenceMs;
            self._pulseBlur = base + amp * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2));
            self.invalidateUpdateView();
        }, 33);
    },

    _stopPulse: function() {
        if (this._pulseInterval) { clearInterval(this._pulseInterval); this._pulseInterval = null; }
        this._pulseBlur = 0;
    },

    _onMouseMove: function(e) {
        if (!this._showHoverEffect) { return; }
        var mx = e.offsetX;
        var my = e.offsetY;
        var hit = -1;
        for (var i = 0; i < this._hitRegions.length; i++) {
            var r = this._hitRegions[i];
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                hit = i;
                break;
            }
        }
        if (hit !== this._hoverIdx) {
            this._hoverIdx = hit;
            this.invalidateUpdateView();
        }
        if (hit >= 0) {
            this._tooltip.innerHTML = this._hitRegions[hit].tip;
            this._tooltip.style.display = 'block';
            var tx = mx + 12;
            var ty = my - 28;
            if (tx + 200 > this.el.offsetWidth) tx = mx - 212;
            if (ty < 0) ty = my + 10;
            this._tooltip.style.left = tx + 'px';
            this._tooltip.style.top = ty + 'px';
            this._canvas.style.cursor = 'pointer';
        } else {
            this._tooltip.style.display = 'none';
            this._canvas.style.cursor = 'default';
        }
    },

    _onClick: function(e) {
        if (!this._clickField) { return; }
        var mx = e.offsetX;
        var my = e.offsetY;
        var hit = -1;
        for (var i = 0; i < this._hitRegions.length; i++) {
            var r = this._hitRegions[i];
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                hit = i;
                break;
            }
        }
        if (hit < 0) { return; }
        var clickedVal = this._hitRegions[hit].eventName;
        if (!clickedVal) { return; }
        var payload = {};
        payload[this._clickField] = clickedVal;
        try {
            this.drilldown({
                action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
                data: payload
            }, e);
        } catch (ex) {}
    },

    reflow: function() {
        this.invalidateUpdateView();
    },

    destroy: function() {
        this._animating = false;
        this._stopPulse();
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }
});
