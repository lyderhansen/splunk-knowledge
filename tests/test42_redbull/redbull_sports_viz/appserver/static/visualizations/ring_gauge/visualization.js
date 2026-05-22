define(["api/SplunkVisualizationBase","api/SplunkVisualizationUtils"], function(SplunkVisualizationBase, SplunkVisualizationUtils) {

// ── Inlined theme.js ──
var theme = (function() {
/*
 * Red Bull Sports Viz — design tokens.
 * ES5 only — no const/let/arrow/template-literals.
 * Brand palette: midnight blue #0C1B3A, silver #C8C8C8, Red Bull red #DB0032, gold #F5C518
 */

function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

function withAlpha(hex, alpha) {
    var r = parseInt(hex.slice(1,3), 16);
    var g = parseInt(hex.slice(3,5), 16);
    var b = parseInt(hex.slice(5,7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + clamp01(alpha) + ')';
}

function lerpColor(a, b, t) {
    t = clamp01(t);
    var ar = parseInt(a.slice(1,3),16), ag = parseInt(a.slice(3,5),16), ab = parseInt(a.slice(5,7),16);
    var br = parseInt(b.slice(1,3),16), bg = parseInt(b.slice(3,5),16), bb = parseInt(b.slice(5,7),16);
    var rr = Math.round(ar + (br - ar) * t);
    var gg = Math.round(ag + (bg - ag) * t);
    var bl = Math.round(ab + (bb - ab) * t);
    return '#' + ((1 << 24) + (rr << 16) + (gg << 8) + bl).toString(16).slice(1);
}

// Visual Language — Red Bull: sharp, kinetic, aggressive
// fillTechnique: 'gradient' — used by check_design.js D01
var VISUAL_LANG = {
    fillTechnique:     'gradient',   // gradient fills throughout — brand-mandated
    backgroundType:    'photo',      // athletic brand — dynamic background
    backgroundPattern: ''            // not used when backgroundType=photo
};

var DARK = {
    name: 'dark',
    bg:          '#060E1F',          // deeper midnight — near-black with strong blue tint
    panel:       '#0C1B3A',          // Red Bull midnight blue — brand bg
    panelHi:     '#142444',          // slightly lighter panel for hover
    edge:        'rgba(200,200,200,0.12)',  // silver-tinted edge
    edgeStrong:  'rgba(200,200,200,0.25)', // stronger silver separator
    grid:        'rgba(200,200,200,0.06)', // very subtle silver gridlines
    text:        '#FFFFFF',          // pure white for maximum contrast on dark bg
    textDim:     '#C8C8C8',          // silver — brand secondary color
    textFaint:   '#8090A8',          // muted blue-silver for whisper labels
    s1:          '#DB0032',          // Red Bull red — primary series
    s2:          '#F5C518',          // gold — secondary series
    s3:          '#C8C8C8',          // silver — tertiary series
    s4:          '#1A6FBF',          // electric blue — quaternary
    s5:          '#FF5C00',          // energy orange — quinary
    series: ['#DB0032', '#F5C518', '#C8C8C8', '#1A6FBF', '#FF5C00'],
    accent:      '#F5C518',          // gold accent — hover/glow/selection (NOT for data fills)
    success:     '#00C851',          // green — performance achieved
    warn:        '#FF8800',          // orange — approaching limit
    danger:      '#DB0032',          // Red Bull red as danger (thematic)
    invert:      '#060E1F'           // inverted (dark text on light surface)
};

// Light theme — NOT an inversion of dark. Independent design.
var LIGHT = {
    name: 'light',
    bg:          '#F0F2F5',          // cool grey — never pure white (glare)
    panel:       '#FFFFFF',          // pure white panels
    panelHi:     '#F7F8FA',          // hover/selected state
    edge:        'rgba(0,0,0,0.10)', // subtle 10% black separator
    edgeStrong:  'rgba(0,0,0,0.20)', // stronger separator
    grid:        'rgba(0,0,0,0.06)', // very subtle gridlines
    text:        '#0B0E1A',          // near-black — D-08: ALWAYS use for hero text
    textDim:     '#3D4050',          // secondary text — readable on white
    textFaint:   '#6B7080',          // whisper labels — WCAG AA 3:1 on #F0F2F5 bg
    s1:          '#B00028',          // darker red for light bg readability
    s2:          '#C8A000',          // darker gold for light bg readability
    s3:          '#5A6070',          // mid-grey series
    s4:          '#1055A0',          // darker blue for light bg
    s5:          '#CC4400',          // darker orange for light bg
    series: ['#B00028', '#C8A000', '#5A6070', '#1055A0', '#CC4400'],
    accent:      '#C8A000',          // gold accent on light (slightly dimmed)
    success:     '#00875A',          // WCAG AA on white
    warn:        '#A66200',          // WCAG AA on white
    danger:      '#C7001E',          // WCAG AA on white
    invert:      '#FFFFFF'           // inverted text on dark surfaces
};

// D-08 STRUCTURAL RULE: hero text ALWAYS uses t.text on light theme.
// NEVER use t.textDim or t.textFaint for hero/primary values on light bg.

function getTheme(name) {
    return (name === 'light') ? LIGHT : DARK;
}

var FONTS = {
    data: 'Impact, "Arial Narrow", "Arial Black", sans-serif',
    ui:   '"Arial Narrow", Arial, "Helvetica Neue", sans-serif'
};

function severityColor(t, sev) {
    if (sev === 'critical' || sev === 'crit' || sev === 'error') return t.danger;
    if (sev === 'warning' || sev === 'warn') return t.warn;
    if (sev === 'ok' || sev === 'good' || sev === 'success') return t.success;
    return t.textDim;
}

function fmtNum(v, opts) {
    if (v == null || isNaN(v)) return '—';
    var abs = Math.abs(v);
    var sign = v < 0 ? '-' : '';
    if (abs >= 1e9) return sign + (abs / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6) return sign + (abs / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3) return sign + (abs / 1e3).toFixed(1) + 'K';
    if (abs < 1 && abs > 0) return sign + abs.toFixed(2);
    return sign + Math.round(abs).toString();
}

function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    if (r < 0) r = 0;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

function drawPanel(ctx, t, x, y, w, h) {
    roundRect(ctx, x, y, w, h, 2);  // sharp corners — Red Bull is sharp/kinetic
    ctx.fillStyle = t.panel;
    ctx.fill();
    ctx.strokeStyle = t.edge;
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawHGrid(ctx, t, x, y, w, h, divisions) {
    ctx.strokeStyle = t.grid;
    ctx.lineWidth = 0.5;
    for (var i = 1; i < divisions; i++) {
        var gy = y + (h / divisions) * i;
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.lineTo(x + w, gy);
        ctx.stroke();
    }
}

function parseColors(raw, fallback) {
    if (!raw || typeof raw !== 'string') return fallback;
    return raw.split(',').map(function(c) { return c.trim(); }).filter(function(c) { return c.length > 0; });
}

function parseInts(raw) {
    if (!raw || typeof raw !== 'string') return [];
    return raw.split(',').map(function(s) { return parseInt(s.trim(), 10); }).filter(function(n) { return !isNaN(n); });
}

function safeStr(v) {
    if (v === null || v === undefined) return '';
    return String(v);
}

function safeNum(v, fallback) {
    if (v === null || v === undefined || v === '') return fallback;
    var n = parseFloat(v);
    return isNaN(n) ? fallback : n;
}

// CON-01: responsive spacing base unit
function getSpacing(w) {
    return Math.max(4, Math.round(w * 0.025));
}

// CON-02: consistent hover highlight alpha
function getHoverAlpha() {
    return 0.12;
}

// CON-03: returns {hero, body, whisper} font sizes in px
function getTypoScale(w, h) {
    var dim = Math.min(w, h);
    return {
        hero:    Math.max(36, Math.min(72, dim * 0.35)),
        body:    Math.max(14, Math.min(24, dim * 0.14)),
        whisper: Math.max(8,  Math.min(11, dim * 0.07))
    };
}

// ACC-01: Data fills use series colors, not accent.
function getSeriesColor(i, t) {
    var s = t.series || [t.s1, t.s2, t.s3, t.s4, t.s5];
    var base = s[i % s.length];
    var pass = Math.floor(i / s.length);
    if (pass === 0) return base;
    var alpha = Math.max(0.3, 1.0 - pass * 0.4);
    return withAlpha(base, alpha);
}


    return { getTheme: getTheme,     withAlpha: withAlpha,     lerpColor: lerpColor,     severityColor: severityColor,     fmtNum: fmtNum,     roundRect: roundRect,     drawPanel: drawPanel,     drawHGrid: drawHGrid,     parseColors: parseColors,     parseInts: parseInts,     safeStr: safeStr,     safeNum: safeNum,     FONTS: FONTS,     VISUAL_LANG: VISUAL_LANG,     getSpacing: getSpacing,     getHoverAlpha: getHoverAlpha,     getTypoScale: getTypoScale,     getSeriesColor: getSeriesColor };
})();

// ── Viz source ──
// @viz-type: gauge



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

return SplunkVisualizationBase.extend({

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
        var animSpeed = opt('animationSpeed', 'normal'); var speedMult = (animSpeed === 'slow') ? 1.5 : (animSpeed === 'fast') ? 0.6 : 1.0;
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


});