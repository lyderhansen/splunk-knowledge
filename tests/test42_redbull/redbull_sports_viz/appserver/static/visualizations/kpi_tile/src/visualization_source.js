// @viz-type: kpi
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

function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
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
            'position:absolute;display:none;padding:6px 10px;' +
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

        var valueField    = opt('valueField', 'value');
        var labelField    = opt('labelField', 'label');
        var deltaField    = opt('deltaField', 'delta');
        var unitSuffix    = opt('unit', '');
        var decimals      = parseInt(opt('decimals', '-1'), 10);
        var showDelta     = opt('showDelta', 'true') === 'true';
        var threshLow     = safeNum(opt('thresholdLow', '50'), 50);
        var threshHigh    = safeNum(opt('thresholdHigh', '90'), 90);

        this._clickField = opt('drilldownField', 'label');
        this._showHoverEffect = opt('showHoverEffect', 'true') === 'true';

        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark' : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');

        var gi = parseFloat(opt('accentIntensity', '50')) / 100;
        gi = gi < 0 ? 0 : gi;
        var glowScale = isDark ? 1.0 : 0.4;

        var accent = hexFromSplunk(opt('accentColor', ''), t.accent);
        var bgColor = hexFromSplunk(opt('backgroundColor', ''), t.panel);
        var fontColor = hexFromSplunk(opt('fontColor', ''), t.text);
        var s1 = hexFromSplunk(opt('series1Color', ''), t.s1);
        var showGlow = opt('showGlow', 'true') === 'true';
        var showAmbient = opt('showAmbientLight', 'true') === 'true';

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
            var _sm=(function(s){return s==="slow"?1.5:s==="fast"?0.6:1.0;})(opt("animationSpeed","normal"));this._startEntrance(_sm);
        }

        var flashCritical = opt('flashCritical', 'false') === 'true';

        var w = this.el.clientWidth || this.el.offsetWidth || 300;
        var h = this.el.clientHeight || this.el.offsetHeight || 200;
        if (w < 10) w = 300;
        if (h < 10) h = 200;

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

        // Empty state guard
        if (!data.rows || data.rows.length === 0) {
            drawEmptyState(ctx, w, h, t, accent);
            return;
        }

        var colIdx = data.colIdx;
        var row = data.rows[data.rows.length - 1]; // last row
        var rawVal = safeNum(row[colIdx[valueField]], null);
        var labelVal = safeStr(row[colIdx[labelField]]) || 'KPI';
        var deltaVal = safeStr(row[colIdx[deltaField]]);
        var unitVal = unitSuffix || '';

        // Threshold color for the hero value bar
        var threshColor = s1;
        if (rawVal !== null) {
            if (rawVal < threshLow) threshColor = t.danger;
            else if (rawVal > threshHigh) threshColor = t.success;
            else threshColor = t.warn;
        }

        // Flash critical if below threshold
        if (flashCritical && rawVal !== null && rawVal < threshLow && !prefersReducedMotion()) {
            this._startPulse();
        } else {
            this._stopPulse();
        }

        // Format display value
        var displayValue;
        if (rawVal === null) {
            displayValue = '—';
        } else if (!isNaN(decimals) && decimals >= 0) {
            displayValue = rawVal.toFixed(decimals);
        } else {
            displayValue = theme.fmtNum(rawVal);
        }
        if (unitVal) displayValue = displayValue + unitVal;

        // Apply entrance animation alpha
        ctx.save();
        ctx.globalAlpha = easeOutExpo(this._entranceProgress);

        // --- Background gradient (Red Bull brand: diagonal sweep from midnight blue) ---
        var grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, bgColor);
        grad.addColorStop(1, theme.withAlpha(threshColor, isDark ? 0.15 : 0.08));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Ambient glow (top-right accent point)
        if (showAmbient && isDark) {
            ctx.save();
            var ambGrad = ctx.createRadialGradient(w, 0, 0, w, 0, Math.max(w, h) * 0.8);
            ambGrad.addColorStop(0, theme.withAlpha(accent, 0.08 * gi));
            ambGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = ambGrad;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }

        // Red Bull accent stripe — left edge vertical bar (brand identity element)
        var stripeW = Math.max(3, Math.round(w * 0.025));
        var stripeGrad = ctx.createLinearGradient(0, 0, 0, h);
        stripeGrad.addColorStop(0, s1);
        stripeGrad.addColorStop(0.5, accent);
        stripeGrad.addColorStop(1, s1);
        ctx.fillStyle = stripeGrad;
        ctx.fillRect(0, 0, stripeW, h);

        // Typography: additive positioning
        var pad = Math.max(8, Math.round(w * 0.04));
        var contentX = stripeW + pad;
        var contentW = w - contentX - pad;

        // Hero value font (Impact-style for Red Bull)
        var heroSize = Math.max(28, Math.min(72, h * 0.38));
        var labelSize = Math.max(10, Math.min(16, h * 0.12));
        var deltaSize = Math.max(9, Math.min(13, h * 0.09));

        // Label — whisper above the value
        var labelY = pad + labelSize;
        ctx.font = 'bold ' + labelSize + 'px ' + theme.FONTS.ui;
        ctx.fillStyle = isDark ? t.textDim : t.textDim;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.globalAlpha = easeOutExpo(this._entranceProgress) * 0.85;
        // Measure and clip label
        var labelText = labelVal.toUpperCase();
        var maxLabelW = contentW;
        while (ctx.measureText(labelText).width > maxLabelW && labelText.length > 3) {
            labelText = labelText.slice(0, -1);
        }
        ctx.fillText(labelText, contentX, labelY);

        // Hero value — full color, dominant
        var heroY = labelY + labelSize * 0.4 + heroSize * 0.9;
        ctx.font = 'bold ' + heroSize + 'px ' + theme.FONTS.data;
        ctx.fillStyle = isDark ? fontColor : t.text;  // D-08: always t.text on light
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.globalAlpha = easeOutExpo(this._entranceProgress);

        // Glow on hero value
        if (showGlow && gi > 0) {
            ctx.save();
            ctx.shadowColor = theme.withAlpha(threshColor, 0.6 * gi * glowScale);
            ctx.shadowBlur = 16 * gi * glowScale;
            ctx.fillText(displayValue, contentX, heroY);
            ctx.restore();
        } else {
            ctx.fillText(displayValue, contentX, heroY);
        }

        // Delta indicator
        if (showDelta && deltaVal) {
            var deltaY = heroY + deltaSize + 4;
            var deltaNum = parseFloat(deltaVal);
            var isPos = !isNaN(deltaNum) ? deltaNum >= 0 : deltaVal.charAt(0) === '+';
            var deltaColor = isPos ? t.success : t.danger;

            ctx.save();
            ctx.globalAlpha = easeOutExpo(this._entranceProgress) * 0.9;

            // Delta arrow triangle
            var arrowSize = deltaSize * 0.7;
            var arrowX = contentX + 2;
            var arrowY = deltaY - arrowSize * 0.8;
            ctx.fillStyle = deltaColor;
            ctx.beginPath();
            if (isPos) {
                ctx.moveTo(arrowX, arrowY + arrowSize);
                ctx.lineTo(arrowX + arrowSize * 0.5, arrowY);
                ctx.lineTo(arrowX + arrowSize, arrowY + arrowSize);
            } else {
                ctx.moveTo(arrowX, arrowY);
                ctx.lineTo(arrowX + arrowSize * 0.5, arrowY + arrowSize);
                ctx.lineTo(arrowX + arrowSize, arrowY);
            }
            ctx.closePath();
            ctx.fill();

            // Delta text
            ctx.font = 'bold ' + deltaSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = deltaColor;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(deltaVal, contentX + arrowSize + 4, deltaY);
            ctx.restore();
        }

        // LED pulse indicator (bottom-right corner)
        if (this._pulseBlur > 0) {
            ctx.save();
            ctx.shadowColor = theme.withAlpha(t.danger, 0.8);
            ctx.shadowBlur = this._pulseBlur;
            ctx.fillStyle = t.danger;
            var pr = 5;
            var px = w - pr * 3;
            var py = h - pr * 3;
            ctx.beginPath();
            ctx.arc(px, py, pr, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.restore(); // entrance globalAlpha
        ctx.globalAlpha = 1;

        this._lastDisplayValue = displayValue;
        this._lastLabel = labelVal;
    },

    _startEntrance: function(speedMult) {
        if (this._animating) { return; }
        var duration = 350 * speedMult;
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
        var label = this._lastLabel || '';
        var val = this._lastDisplayValue || '';
        if (label || val) {
            this._tooltip.innerHTML = escapeHtml(label) + ': <strong>' + escapeHtml(val) + '</strong>';
            this._tooltip.style.display = 'block';
            this._tooltip.style.left = (e.offsetX + 12) + 'px';
            this._tooltip.style.top = Math.max(0, e.offsetY - 28) + 'px';
        }
    },

    _onClick: function(e) {
        if (!this._clickField) { return; }
        var val = this._lastDisplayValue || '';
        if (!val) { return; }
        var payload = {};
        payload[this._clickField] = val;
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
