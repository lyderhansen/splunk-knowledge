// @viz-type: gauge
var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var SplunkVisualizationUtils = require('api/SplunkVisualizationUtils');
var theme = require('shared/theme');

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
        this._showHoverEffect = true;

        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            self._tooltip.style.display = 'none';
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

        var valueField = opt('field', 'value');
        var maxValue = safeNum(opt('maxValue', '100'), 100);
        var labelText = opt('label', 'Performance');
        var unitSuffix = opt('unit', '%');
        var zoneLow = safeNum(opt('zoneLow', '33'), 33);
        var zoneHigh = safeNum(opt('zoneHigh', '66'), 66);
        this._clickField = opt('drilldownField', 'value');
        this._showHoverEffect = opt('showHoverEffect', 'true') === 'true';

        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark' : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');

        var gi = parseFloat(opt('accentIntensity', '50')) / 100;
        gi = gi < 0 ? 0 : gi;
        var glowScale = isDark ? 1.0 : 0.4;

        var accent = hexFromSplunk(opt('accentColor', ''), t.accent);
        var s1 = hexFromSplunk(opt('series1Color', ''), t.s1);
        var dangerColor = hexFromSplunk(opt('detractorColor', ''), t.danger);
        var midColor = hexFromSplunk(opt('passiveColor', ''), t.warn);
        var successColor = hexFromSplunk(opt('promoterColor', ''), t.success);
        var showGlow = opt('showGlow', 'true') === 'true';
        var flashCritical = opt('flashCritical', 'false') === 'true';

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

        var w = this.el.clientWidth || this.el.offsetWidth || 250;
        var h = this.el.clientHeight || this.el.offsetHeight || 250;
        if (w < 10) w = 250;
        if (h < 10) h = 250;

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
        var row = data.rows[data.rows.length - 1];
        var rawVal = safeNum(row[colIdx[valueField]], 0);
        var pct = Math.min(rawVal / maxValue, 1);
        this._displayValue = rawVal;

        // Zone color — based on percentage in range
        var zoneColor;
        var pctNorm = pct * 100; // as percentage
        if (pctNorm < zoneLow) zoneColor = dangerColor;
        else if (pctNorm > zoneHigh) zoneColor = successColor;
        else zoneColor = midColor;

        // Pulse on low zone
        if (flashCritical && pctNorm < zoneLow && !prefersReducedMotion()) {
            this._startPulse();
        } else {
            this._stopPulse();
        }

        // Layout — 270-degree arc centered
        var pad = theme.getSpacing(w);
        var cx = w / 2;
        var cy = h * 0.52;  // slightly above center to leave room for label
        var maxRadius = Math.min(cx - pad, cy - pad);
        var trackW = Math.max(8, Math.round(maxRadius * 0.12));
        var radius = maxRadius - trackW / 2;

        // Ensure gauge stays within bounds
        if (cy - radius < pad) {
            radius = cy - pad - trackW / 2;
        }

        // Arc: 270-degree sweep from bottom-left to bottom-right (Red Bull speedometer feel)
        var startAngle = (135) * Math.PI / 180;  // bottom-left
        var endAngle = (405) * Math.PI / 180;    // bottom-right (135 + 270)
        var sweepAngle = 270 * Math.PI / 180;

        // Animate arc fill (entrance: arc fills from 0 to target)
        var animPct = easeOutQuart(this._entranceProgress) * pct;
        var fillEnd = startAngle + sweepAngle * animPct;

        // Background: dark gradient
        if (isDark) {
            var bgGrad = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius + trackW);
            bgGrad.addColorStop(0, theme.withAlpha(zoneColor, 0.05));
            bgGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.save();
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }

        // Track (background arc)
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, endAngle, false);
        ctx.strokeStyle = theme.withAlpha(t.edgeStrong, isDark ? 0.25 : 0.15);
        ctx.lineWidth = trackW;
        ctx.lineCap = 'butt';
        ctx.stroke();
        ctx.restore();

        // Zone ticks (3 segment markers at 33%, 66%)
        var tickPositions = [zoneLow / 100, zoneHigh / 100];
        for (var ti = 0; ti < tickPositions.length; ti++) {
            var tickAngle = startAngle + sweepAngle * tickPositions[ti];
            var innerR = radius - trackW / 2 - 2;
            var outerR = radius + trackW / 2 + 2;
            ctx.save();
            ctx.strokeStyle = theme.withAlpha(t.bg, 0.8);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx + innerR * Math.cos(tickAngle), cy + innerR * Math.sin(tickAngle));
            ctx.lineTo(cx + outerR * Math.cos(tickAngle), cy + outerR * Math.sin(tickAngle));
            ctx.stroke();
            ctx.restore();
        }

        // Fill arc with gradient
        if (animPct > 0) {
            var arcGrad = ctx.createLinearGradient(
                cx + radius * Math.cos(startAngle), cy + radius * Math.sin(startAngle),
                cx + radius * Math.cos(fillEnd), cy + radius * Math.sin(fillEnd)
            );
            arcGrad.addColorStop(0, s1);
            arcGrad.addColorStop(1, zoneColor);

            ctx.save();
            if (showGlow && gi > 0) {
                ctx.shadowColor = theme.withAlpha(zoneColor, 0.6 * gi * glowScale);
                ctx.shadowBlur = 14 * gi * glowScale;
            }
            ctx.beginPath();
            ctx.arc(cx, cy, radius, startAngle, fillEnd, false);
            ctx.strokeStyle = arcGrad;
            ctx.lineWidth = trackW;
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.restore();
        }

        // LED pulse
        if (this._pulseBlur > 0) {
            ctx.save();
            ctx.shadowColor = theme.withAlpha(dangerColor, 0.8);
            ctx.shadowBlur = this._pulseBlur;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, startAngle, startAngle + sweepAngle * animPct, false);
            ctx.strokeStyle = dangerColor;
            ctx.lineWidth = trackW;
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.restore();
        }

        // Center text — hero value
        var heroSize = Math.max(24, Math.min(64, radius * 0.7));
        var labelSize = Math.max(10, Math.min(16, radius * 0.18));

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Value with glow
        var displayStr = rawVal.toFixed(rawVal % 1 === 0 ? 0 : 1) + (unitSuffix || '');
        ctx.font = 'bold ' + heroSize + 'px ' + theme.FONTS.data;
        ctx.fillStyle = isDark ? t.text : t.text;  // D-08: always t.text
        if (showGlow && gi > 0) {
            ctx.shadowColor = theme.withAlpha(zoneColor, 0.5 * gi * glowScale);
            ctx.shadowBlur = 12 * gi * glowScale;
        }
        ctx.fillText(displayStr, cx, cy - labelSize * 0.8);
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        // Label below value
        ctx.font = labelSize + 'px ' + theme.FONTS.ui;
        ctx.fillStyle = isDark ? t.textDim : t.textDim;
        ctx.fillText(labelText.toUpperCase(), cx, cy + heroSize * 0.4);
        ctx.restore();

        // Percentage indicator dots at bottom of arc
        var dotY = cy + radius * Math.sin(startAngle) + trackW;
        ctx.save();
        ctx.font = Math.max(9, Math.round(h * 0.05)) + 'px ' + theme.FONTS.ui;
        ctx.fillStyle = t.textFaint;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('0', cx - radius * 0.95, dotY);
        ctx.textAlign = 'right';
        ctx.fillText('MAX', cx + radius * 0.95, dotY);
        ctx.restore();

        ctx.globalAlpha = 1;
    },

    _startEntrance: function(config, ns) {
        if (this._animating) { return; }
        var speedMult = getSpeedMult(config, ns);
        var duration = 500 * speedMult;
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
        var amp = 10;
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
        var val = this._displayValue;
        if (val !== undefined) {
            this._tooltip.innerHTML = '<b>' + val + '</b>';
            this._tooltip.style.display = 'block';
            this._tooltip.style.left = (e.offsetX + 12) + 'px';
            this._tooltip.style.top = Math.max(0, e.offsetY - 28) + 'px';
        }
    },

    _onClick: function(e) {
        if (!this._clickField) { return; }
        var val = this._displayValue;
        if (val === undefined || val === null) { return; }
        var payload = {};
        payload[this._clickField] = String(val);
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
